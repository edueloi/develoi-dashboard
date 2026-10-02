// Recibo de pagamento em PDF (Develoi Soluções Digitais) e envio pelo bot do WhatsApp
import type { Express, Response } from "express";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { prisma } from "./db.js";
import { getSessionInfo, sendDocument, sendMessage } from "./wa.js";
import { TZ } from "./time.js";


// ─── Dados da empresa emissora ───────────────────────────────────────────────
const COMPANY = { name: "Develoi Soluções Digitais", cnpj: "30.968.335/0001-69" };
const NAVY = "#0D1F4E";
const GOLD = "#B8892E";
const LOGO_PATH = path.join(process.cwd(), "public", "LOGO-MENU.png");

export interface ReceiptData {
  number: string;
  payerName: string;
  payerDocument?: string | null;
  amount: number;
  paidAt: Date;
  description: string;
  dueDate?: Date | null;
  method?: string | null;
}

// ─── Valor por extenso (pt-BR) ───────────────────────────────────────────────
const UN = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100), r = n % 100;
  const parts: string[] = [];
  if (c) parts.push(CT[c]);
  if (r) parts.push(r < 20 ? UN[r] : DZ[Math.floor(r / 10)] + (r % 10 ? ` e ${UN[r % 10]}` : ""));
  return parts.join(" e ");
}

function inteiroExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000), milhares = Math.floor((n % 1_000_000) / 1000), resto = n % 1000;
  const parts: string[] = [];
  if (milhoes) parts.push(milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`);
  if (milhares) parts.push(milhares === 1 ? "mil" : `${ate999(milhares)} mil`);
  if (resto) parts.push(ate999(resto));
  if (parts.length === 1) return parts[0];
  const last = parts.pop() as string;
  const useE = resto ? (resto < 100 || resto % 100 === 0) : true;
  return parts.join(", ") + (useE ? " e " : ", ") + last;
}

export function valorExtenso(v: number): string {
  const reais = Math.floor(v + 1e-9);
  const cents = Math.round((v - reais) * 100);
  const r = reais ? `${inteiroExtenso(reais)} ${reais === 1 ? "real" : reais % 1_000_000 === 0 ? "de reais" : "reais"}` : "";
  const c = cents ? `${inteiroExtenso(cents)} ${cents === 1 ? "centavo" : "centavos"}` : "";
  return [r, c].filter(Boolean).join(" e ") || "zero real";
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const day = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
const fmtDoc = (d?: string | null) => {
  const n = String(d || "").replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return d || "";
};

export function buildReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Recibo ${data.number}`, Author: COMPANY.name } });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width, M = 50, inner = W - M * 2;

    // Cabeçalho: logo + título
    if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, M, 42, { width: 190 });
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20).text("RECIBO DE PAGAMENTO", M, 52, { width: inner, align: "right" });
    doc.fillColor("#64748B").font("Helvetica").fontSize(10).text(`Nº ${data.number}`, M, 78, { width: inner, align: "right" });
    doc.text(`Emitido em ${data.paidAt.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`, M, 92, { width: inner, align: "right" });

    doc.moveTo(M, 128).lineTo(W - M, 128).lineWidth(2).strokeColor(GOLD).stroke();

    // Valor em destaque
    doc.roundedRect(M, 150, inner, 86, 8).fill(NAVY);
    doc.fillColor("#CBD5E1").font("Helvetica").fontSize(10).text("VALOR RECEBIDO", M + 22, 164);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(30).text(money(data.amount), M + 22, 180);
    doc.fillColor("#E2C27A").font("Helvetica").fontSize(9.5).text(`(${valorExtenso(data.amount)})`, M + 22, 216, { width: inner - 44 });

    // Texto do recibo
    let y = 262;
    const texto =
      `Recebemos de ${data.payerName}${data.payerDocument ? `, inscrito(a) no CPF/CNPJ ${fmtDoc(data.payerDocument)}` : ""}, ` +
      `a importância de ${money(data.amount)} (${valorExtenso(data.amount)}), referente a ${data.description}, ` +
      `pagos em ${day(data.paidAt)}${data.method ? ` por ${data.method}` : ""}. Pelo que firmamos o presente recibo, dando plena e geral quitação.`;
    doc.fillColor("#1E293B").font("Helvetica").fontSize(11.5).text(texto, M, y, { width: inner, align: "justify", lineGap: 4 });
    y = doc.y + 24;

    // Detalhes
    const rows: [string, string][] = [
      ["Pagador", data.payerName],
      ...(data.payerDocument ? [["CPF/CNPJ", fmtDoc(data.payerDocument)] as [string, string]] : []),
      ["Referente a", data.description],
      ...(data.dueDate ? [["Vencimento", day(data.dueDate)] as [string, string]] : []),
      ["Data do pagamento", day(data.paidAt)],
      ...(data.method ? [["Forma de pagamento", data.method] as [string, string]] : []),
      ["Valor", money(data.amount)],
    ];
    rows.forEach(([k, v], i) => {
      const ry = y + i * 26;
      if (i % 2 === 0) doc.rect(M, ry - 6, inner, 26).fill("#F8FAFC");
      doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(9).text(k.toUpperCase(), M + 12, ry + 2, { width: 140 });
      doc.fillColor("#0F172A").font("Helvetica").fontSize(11).text(v, M + 160, ry, { width: inner - 175 });
    });
    y += rows.length * 26 + 50;

    // Assinatura
    doc.moveTo(W / 2 - 130, y).lineTo(W / 2 + 130, y).lineWidth(0.8).strokeColor("#94A3B8").stroke();
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(COMPANY.name, M, y + 8, { width: inner, align: "center" });
    doc.fillColor("#64748B").font("Helvetica").fontSize(10).text(`CNPJ ${COMPANY.cnpj}`, M, y + 24, { width: inner, align: "center" });

    // Rodapé (margem inferior zerada para o texto não empurrar uma segunda página)
    doc.page.margins.bottom = 0;
    const fy = doc.page.height - 78;
    doc.moveTo(M, fy).lineTo(W - M, fy).lineWidth(0.5).strokeColor("#CBD5E1").stroke();
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(8.5)
      .text(`${COMPANY.name} · CNPJ ${COMPANY.cnpj}`, M, fy + 10, { width: inner, align: "center", lineBreak: false })
      .text(`Recibo nº ${data.number} · gerado eletronicamente em ${new Date().toLocaleString("pt-BR", { timeZone: TZ })}`, M, fy + 24, { width: inner, align: "center", lineBreak: false });

    doc.end();
  });
}

// ─── Dados do recibo a partir do banco ───────────────────────────────────────
const receiptNumber = (id: string, paidAt: Date) => `${paidAt.getUTCFullYear()}${String(paidAt.getUTCMonth() + 1).padStart(2, "0")}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

async function dataForClientPayment(id: string) {
  const p = await prisma.clientPayment.findUnique({
    where: { id },
    include: { client: { include: { sale: { select: { productName: true } } } } },
  });
  if (!p) return null;
  const plan = p.client.sale?.productName;
  const data: ReceiptData = {
    number: receiptNumber(p.id, p.paidAt),
    payerName: p.client.name,
    payerDocument: p.client.document,
    amount: p.amount,
    paidAt: p.paidAt,
    description: `${plan ? `assinatura ${plan}` : "assinatura de serviços"}${p.client.billingCycle === "yearly" ? " (anual)" : p.client.billingCycle === "monthly" ? " (mensal)" : ""}`,
    dueDate: p.dueDate,
    method: p.method,
  };
  return { data, phone: p.client.phone, clientName: p.client.name };
}

async function dataForReceivable(id: string) {
  const r = await prisma.receivable.findUnique({ where: { id }, include: { client: true } });
  if (!r || r.status !== "received" || !r.receivedAt) return null;
  const data: ReceiptData = {
    number: receiptNumber(r.id, r.receivedAt),
    payerName: r.client?.name ?? r.payerName ?? "Cliente",
    payerDocument: r.client?.document,
    amount: r.receivedAmount ?? r.amount,
    paidAt: r.receivedAt,
    description: r.installmentsTotal ? `${r.description} (parcela ${r.installmentNo}/${r.installmentsTotal})` : r.description,
    dueDate: r.dueDate,
    method: r.method,
  };
  return { data, phone: r.client?.phone ?? null, clientName: data.payerName };
}

const fileName = (d: ReceiptData) => `Recibo-${d.number}.pdf`;

// Manda o recibo em PDF no WhatsApp do cliente. `caption` vira a mensagem junto do arquivo.
export async function sendReceiptPdf(source: { clientPaymentId?: string; receivableId?: string }, caption?: string): Promise<boolean> {
  const found = source.clientPaymentId ? await dataForClientPayment(source.clientPaymentId)
    : source.receivableId ? await dataForReceivable(source.receivableId) : null;
  if (!found) throw new Error("Recebimento não encontrado.");
  if (!found.phone) throw new Error("O cliente não tem WhatsApp cadastrado.");
  if (getSessionInfo().status !== "connected") throw new Error("O WhatsApp do bot não está conectado.");
  const pdf = await buildReceiptPdf(found.data);
  const text = caption ?? `🧾 *Recibo de pagamento*\nOlá, ${found.clientName.trim().split(/\s+/)[0]}! Segue o recibo do seu pagamento de *${money(found.data.amount)}*. Obrigado! 🙏`;
  if (await sendDocument(found.phone, pdf, fileName(found.data), text)) return true;
  return sendMessage(found.phone, text); // se o arquivo falhar, ao menos o aviso vai
}

// ─── Rotas ───────────────────────────────────────────────────────────────────
export function registerReceiptRoutes(app: Express) {
  const sendPdf = (res: Response, pdf: Buffer, name: string) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    res.send(pdf);
  };
  const fail = (res: Response, e: any, code = 500) => res.status(code).json({ error: e.message });

  app.get("/api/client-payments/:id/receipt.pdf", async (req, res) => {
    try {
      const f = await dataForClientPayment(req.params.id);
      if (!f) return res.status(404).json({ error: "Recebimento não encontrado." });
      sendPdf(res, await buildReceiptPdf(f.data), fileName(f.data));
    } catch (e) { fail(res, e); }
  });
  app.post("/api/client-payments/:id/send-receipt", async (req, res) => {
    try { res.json({ sent: await sendReceiptPdf({ clientPaymentId: req.params.id }) }); } catch (e) { fail(res, e, 400); }
  });

  app.get("/api/receivables/:id/receipt.pdf", async (req, res) => {
    try {
      const f = await dataForReceivable(req.params.id);
      if (!f) return res.status(404).json({ error: "Só contas já recebidas têm recibo." });
      sendPdf(res, await buildReceiptPdf(f.data), fileName(f.data));
    } catch (e) { fail(res, e); }
  });
  app.post("/api/receivables/:id/send-receipt", async (req, res) => {
    try { res.json({ sent: await sendReceiptPdf({ receivableId: req.params.id }) }); } catch (e) { fail(res, e, 400); }
  });
}
