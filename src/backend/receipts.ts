// Recibo de pagamento em PDF (Develoi Soluções Digitais) e envio pelo bot do WhatsApp
import type { Express, Response } from "express";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { prisma } from "./db.js";
import { getSessionInfo, sendDocument, sendMessage } from "./wa.js";
import { TZ } from "./time.js";
import { assinaturaTexto, subscriptionInfoOf } from "./clientInfo.js";


// ─── Dados da empresa emissora ───────────────────────────────────────────────
// Telefone/WhatsApp oficial da Develoi (pode ser trocado por COMPANY_PHONE no .env)
const COMPANY = { name: "Develoi Soluções Digitais", cnpj: "30.968.335/0001-69", phone: process.env.COMPANY_PHONE || "(15) 99241-8299" };
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
    const doc = new PDFDocument({ size: "A4", margin: 56, info: { Title: `Recibo ${data.number}`, Author: COMPANY.name } });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width, M = 56, inner = W - M * 2;
    const INK = "#1F2937", MUTED = "#6B7280", LINE = "#D1D5DB";

    // Cabeçalho: logo à esquerda, dados da empresa à direita
    if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, M, 50, { width: 120 });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(COMPANY.name, M, 56, { width: inner, align: "right" });
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`CNPJ ${COMPANY.cnpj}`, M, 70, { width: inner, align: "right" });
    doc.text(`WhatsApp ${COMPANY.phone}`, M, 83, { width: inner, align: "right" });
    doc.moveTo(M, 112).lineTo(W - M, 112).lineWidth(0.7).strokeColor(LINE).stroke();

    // Título e valor
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(18).text("RECIBO", M, 138);
    doc.fillColor(MUTED).font("Helvetica").fontSize(9.5).text(`Nº ${data.number}`, M, 162);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(18).text(money(data.amount), M, 138, { width: inner, align: "right" });

    // Texto do recibo
    const texto =
      `Recebemos de ${data.payerName}${data.payerDocument ? `, CPF/CNPJ ${fmtDoc(data.payerDocument)}` : ""}, ` +
      `a importância de ${money(data.amount)} (${valorExtenso(data.amount)}), a título de pagamento de ${data.description}` +
      `${data.method ? `, por ${data.method}` : ""}, em ${day(data.paidAt)}. ` +
      `Pelo que firmamos o presente, dando plena e geral quitação.`;
    doc.fillColor(INK).font("Helvetica").fontSize(11).text(texto, M, 204, { width: inner, align: "justify", lineGap: 5 });

    // Detalhes (linhas finas, sem fundo)
    let y = doc.y + 28;
    const rows: [string, string][] = [
      ["Pagador", data.payerName],
      ...(data.payerDocument ? [["CPF/CNPJ", fmtDoc(data.payerDocument)] as [string, string]] : []),
      ["Referente a", data.description],
      ...(data.dueDate ? [["Vencimento", day(data.dueDate)] as [string, string]] : []),
      ["Data do pagamento", day(data.paidAt)],
      ...(data.method ? [["Forma de pagamento", data.method] as [string, string]] : []),
      ["Valor", `${money(data.amount)}`],
    ];
    doc.moveTo(M, y - 8).lineTo(W - M, y - 8).lineWidth(0.5).strokeColor(LINE).stroke();
    rows.forEach(([k, v]) => {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9.5).text(k, M, y, { width: 150 });
      doc.fillColor(INK).font("Helvetica").fontSize(10.5).text(v, M + 160, y - 1, { width: inner - 160 });
      y += 24;
      doc.moveTo(M, y - 8).lineTo(W - M, y - 8).lineWidth(0.5).strokeColor(LINE).stroke();
    });

    // Data e assinatura
    y += 36;
    doc.fillColor(MUTED).font("Helvetica").fontSize(10).text(`Emitido em ${day(data.paidAt)}.`, M, y);
    y += 62;
    doc.moveTo(M, y).lineTo(M + 230, y).lineWidth(0.7).strokeColor(INK).stroke();
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(COMPANY.name, M, y + 6);
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`CNPJ ${COMPANY.cnpj} · WhatsApp ${COMPANY.phone}`, M, y + 20);

    // Rodapé (margem inferior zerada para o texto não empurrar uma segunda página)
    doc.page.margins.bottom = 0;
    const fy = doc.page.height - 56;
    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(8)
      .text(`Documento gerado eletronicamente em ${new Date().toLocaleString("pt-BR", { timeZone: TZ })} · Recibo nº ${data.number}`, M, fy, { width: inner, align: "center", lineBreak: false });

    doc.end();
  });
}

// ─── Dados do recibo a partir do banco ───────────────────────────────────────
const receiptNumber = (id: string, paidAt: Date) => `${paidAt.getUTCFullYear()}${String(paidAt.getUTCMonth() + 1).padStart(2, "0")}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

async function dataForClientPayment(id: string) {
  const p = await prisma.clientPayment.findUnique({
    where: { id },
    include: { client: { include: {
      sale: { select: { productName: true } },
      projects: { include: { project: { select: { name: true } } } },
    } } },
  });
  if (!p) return null;
  const cycle = p.client.billingCycle === "yearly" ? " (anual)" : p.client.billingCycle === "monthly" ? " (mensal)" : "";
  const data: ReceiptData = {
    number: receiptNumber(p.id, p.paidAt),
    payerName: p.client.name,
    payerDocument: p.client.document,
    amount: p.amount,
    paidAt: p.paidAt,
    description: `${assinaturaTexto(subscriptionInfoOf(p.client), false)}${cycle}`, // ex.: assinatura do sistema Store BoxSys (mensal)
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

// Quando alguém paga: 1) mensagem de agradecimento  2) o recibo em PDF (duas mensagens)
export async function sendThanksAndReceipt(
  source: { clientPaymentId?: string; receivableId?: string },
  opts: { nextDue?: Date | null; receiptUrl?: string | null } = {},
): Promise<boolean> {
  const found = source.clientPaymentId ? await dataForClientPayment(source.clientPaymentId)
    : source.receivableId ? await dataForReceivable(source.receivableId) : null;
  if (!found) throw new Error("Recebimento não encontrado.");
  if (!found.phone) throw new Error("O cliente não tem WhatsApp cadastrado.");
  if (getSessionInfo().status !== "connected") throw new Error("O WhatsApp do bot não está conectado.");

  const { data } = found;
  const thanks = [
    `✅ *Pagamento confirmado!*`,
    `Olá, ${found.clientName.trim().split(/\s+/)[0]}! Recebemos o seu pagamento de *${money(data.amount)}* em ${day(data.paidAt)}${data.method ? ` (${data.method})` : ""}. Muito obrigado pela confiança! 🙏`,
    `📌 Referente a: ${data.description}`,
    opts.nextDue ? `📅 Próximo vencimento: ${day(opts.nextDue)}` : null,
    opts.receiptUrl ? `🧾 Comprovante do pagamento: ${opts.receiptUrl}` : null,
    `Logo abaixo enviamos o seu recibo em PDF. Para consultar seus pagamentos, é só escrever *extrato*.`,
  ].filter(Boolean).join("\n\n");

  await sendMessage(found.phone, thanks);
  const pdf = await buildReceiptPdf(data);
  return sendDocument(found.phone, pdf, fileName(data), `📎 Recibo de pagamento nº ${data.number}`);
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

// ─── Extrato de pagamentos em PDF ────────────────────────────────────────────
export interface StatementData {
  clientName: string;
  document?: string | null;
  subscription: string;
  payments: { paidAt: Date; amount: number; method?: string | null }[];
  total: number;
  open?: { value: number; dueDate: Date } | null;
  nextDue?: { date: Date; value: number } | null;
}

export function buildStatementPdf(data: StatementData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56, info: { Title: `Extrato - ${data.clientName}`, Author: COMPANY.name } });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width, M = 56, inner = W - M * 2;
    const INK = "#1F2937", MUTED = "#6B7280", LINE = "#D1D5DB";

    if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, M, 50, { width: 120 });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(COMPANY.name, M, 56, { width: inner, align: "right" });
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`CNPJ ${COMPANY.cnpj}`, M, 70, { width: inner, align: "right" });
    doc.text(`WhatsApp ${COMPANY.phone}`, M, 83, { width: inner, align: "right" });
    doc.moveTo(M, 112).lineTo(W - M, 112).lineWidth(0.7).strokeColor(LINE).stroke();

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(18).text("EXTRATO DE PAGAMENTOS", M, 138);
    doc.fillColor(MUTED).font("Helvetica").fontSize(9.5).text(`Emitido em ${new Date().toLocaleString("pt-BR", { timeZone: TZ })}`, M, 162);

    let y = 192;
    const info: [string, string][] = [["Cliente", data.clientName], ...(data.document ? [["CPF/CNPJ", fmtDoc(data.document)] as [string, string]] : []), ["Assinatura", data.subscription]];
    info.forEach(([k, v]) => {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9.5).text(k, M, y, { width: 100 });
      doc.fillColor(INK).font("Helvetica").fontSize(10.5).text(v, M + 110, y - 1, { width: inner - 110 });
      y = Math.max(y + 20, doc.y + 6);
    });

    // Tabela de pagamentos
    y += 14;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9);
    doc.text("DATA", M, y, { width: 110 }); doc.text("FORMA", M + 120, y, { width: 160 }); doc.text("VALOR", M, y, { width: inner, align: "right" });
    y += 16;
    doc.moveTo(M, y - 4).lineTo(W - M, y - 4).lineWidth(0.5).strokeColor(LINE).stroke();
    if (!data.payments.length) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(10.5).text("Nenhum pagamento registrado ainda.", M, y + 4);
      y += 30;
    }
    for (const p of data.payments) {
      doc.fillColor(INK).font("Helvetica").fontSize(10.5);
      doc.text(day(p.paidAt), M, y, { width: 110 }); doc.text(p.method || "—", M + 120, y, { width: 160 }); doc.text(money(p.amount), M, y, { width: inner, align: "right" });
      y += 24;
      doc.moveTo(M, y - 6).lineTo(W - M, y - 6).lineWidth(0.5).strokeColor(LINE).stroke();
    }
    y += 8;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text("Total dos últimos pagamentos", M, y, { width: 250 }).text(money(data.total), M, y, { width: inner, align: "right" });
    y += 36;
    if (data.open) {
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text(`Em aberto: ${money(data.open.value)} — vence em ${day(data.open.dueDate)}`, M, y);
    } else if (data.nextDue) {
      doc.fillColor(INK).font("Helvetica").fontSize(10.5).text(`Próximo vencimento: ${day(data.nextDue.date)} — ${money(data.nextDue.value)}`, M, y);
    }

    doc.page.margins.bottom = 0;
    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(8)
      .text("Documento informativo gerado eletronicamente. Não substitui recibo ou nota fiscal.", M, doc.page.height - 56, { width: inner, align: "center", lineBreak: false });
    doc.end();
  });
}
