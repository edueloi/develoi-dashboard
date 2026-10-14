import type { Express } from "express";
import { prisma } from "./db.js";

type Owner = { payableId: string } | { receivableId: string };

type AttachmentInput = {
  id?: string;
  kind?: string;
  name?: string;
  url?: string;
  dataUrl?: string;
  mimeType?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 12;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export const financialAttachmentsInclude = {
  attachments: {
    select: {
      id: true,
      kind: true,
      name: true,
      url: true,
      createdAt: true,
      document: { select: { mimeType: true, size: true } },
    },
    orderBy: { createdAt: "asc" },
  },
} as const;

function ownerWhere(owner: Owner) {
  return "payableId" in owner ? { payableId: owner.payableId } : { receivableId: owner.receivableId };
}

function cleanName(value: unknown, fallback: string) {
  const name = String(value || fallback).replace(/[\\/:*?"<>|]/g, "-").trim().slice(0, 255);
  return name || fallback;
}

function cleanUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 2048) throw new Error("Informe um link válido.");
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("O link deve começar com http:// ou https://.");
  return url.toString();
}

function decodeFile(input: AttachmentInput) {
  const match = String(input.dataUrl || "").match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new Error("Não foi possível ler o arquivo selecionado.");
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) throw new Error("Envie somente PDF, Word ou imagens (JPG, PNG, GIF e WebP).");
  const data = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!data.length || data.length > MAX_FILE_SIZE) throw new Error("Cada arquivo pode ter no máximo 10 MB.");
  return { mimeType, data, size: data.length };
}

async function removeOrphanDocuments(documentIds: string[]) {
  for (const id of new Set(documentIds.filter(Boolean))) {
    const references = await prisma.financialAttachment.count({ where: { documentId: id } });
    if (!references) await prisma.financialDocument.delete({ where: { id } }).catch(() => undefined);
  }
}

/** Sincroniza os anexos da conta. Os IDs existentes permanecem; itens sem ID são adicionados. */
export async function syncFinancialAttachments(owner: Owner, raw: unknown) {
  if (raw === undefined) return;
  if (!Array.isArray(raw)) throw new Error("Anexos inválidos.");
  if (raw.length > MAX_ATTACHMENTS) throw new Error(`Adicione no máximo ${MAX_ATTACHMENTS} anexos por conta.`);

  const input = raw as AttachmentInput[];
  const existingIds = input.map(item => String(item?.id || "")).filter(Boolean);
  const where = ownerWhere(owner);
  const previous = await prisma.financialAttachment.findMany({
    where: { ...where, ...(existingIds.length ? { id: { notIn: existingIds } } : {}) },
    select: { id: true, documentId: true },
  });
  if (previous.length) {
    await prisma.financialAttachment.deleteMany({ where: { id: { in: previous.map(item => item.id) } } });
    await removeOrphanDocuments(previous.map(item => item.documentId || ""));
  }

  for (const item of input) {
    if (item?.id) continue;
    if (item?.kind === "link") {
      await prisma.financialAttachment.create({
        data: { ...where, kind: "link", name: cleanName(item.name, "Link"), url: cleanUrl(item.url) },
      });
      continue;
    }
    if (item?.kind === "file") {
      const file = decodeFile(item);
      const document = await prisma.financialDocument.create({ data: file });
      await prisma.financialAttachment.create({
        data: { ...where, kind: "file", name: cleanName(item.name, "Documento"), documentId: document.id },
      });
      continue;
    }
    throw new Error("Tipo de anexo inválido.");
  }
}

/** Replica a mesma lista para várias contas, mantendo os arquivos físicos compartilhados. */
export async function addAttachmentsToMany(owners: Owner[], raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0 || owners.length === 0) return;
  if (raw.length > MAX_ATTACHMENTS) throw new Error(`Adicione no máximo ${MAX_ATTACHMENTS} anexos por conta.`);
  const input = raw as AttachmentInput[];
  for (const item of input) {
    if (item?.kind === "link") {
      const data = { kind: "link", name: cleanName(item.name, "Link"), url: cleanUrl(item.url) };
      await prisma.financialAttachment.createMany({ data: owners.map(owner => ({ ...owner, ...data })) });
    } else if (item?.kind === "file") {
      const file = decodeFile(item);
      const document = await prisma.financialDocument.create({ data: file });
      const data = { kind: "file", name: cleanName(item.name, "Documento"), documentId: document.id };
      await prisma.financialAttachment.createMany({ data: owners.map(owner => ({ ...owner, ...data })) });
    } else {
      throw new Error("Tipo de anexo inválido.");
    }
  }
}

export function registerFinancialAttachmentRoutes(app: Express) {
  app.get("/api/financial-attachments/:id/download", async (req, res) => {
    try {
      const attachment = await prisma.financialAttachment.findUnique({
        where: { id: req.params.id },
        include: { document: true },
      });
      if (!attachment?.document) return res.status(404).json({ error: "Arquivo não encontrado." });
      const inline = attachment.document.mimeType === "application/pdf" || attachment.document.mimeType.startsWith("image/");
      res.setHeader("Content-Type", attachment.document.mimeType);
      res.setHeader("Content-Length", attachment.document.size);
      res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`);
      res.send(Buffer.from(attachment.document.data));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
