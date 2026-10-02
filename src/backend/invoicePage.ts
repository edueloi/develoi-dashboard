// Página de fatura própria (public/fatura/:id): mostra o produto, o valor, o Pix e os dados da Develoi.
// O pagamento continua sendo cobrado e baixado pelo Asaas (webhook).
import type { Express } from "express";
import { prisma } from "./db.js";
import { pixQrFor } from "./asaas.js";
import { loadSubscriptionInfo, nomeCurto } from "./clientInfo.js";
import { brtTodayUtc } from "./time.js";

const COMPANY = {
  name: "Develoi Soluções Digitais",
  cnpj: "30.968.335/0001-69",
  email: process.env.COMPANY_EMAIL || "contato@develoi.com.br",
  phone: process.env.COMPANY_PHONE || "(15) 99241-8299",
};

const PAID = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

export function registerInvoiceRoutes(app: Express) {
  app.get("/api/public/invoice/:id", async (req, res) => {
    try {
      const charge = await prisma.asaasCharge.findUnique({ where: { id: req.params.id }, include: { client: true } });
      if (!charge || charge.status === "DELETED") return res.status(404).json({ error: "Fatura não encontrada." });

      const status = PAID.has(charge.status) ? "paid"
        : charge.status === "REFUNDED" ? "cancelled"
        : charge.status === "OVERDUE" || charge.dueDate < brtTodayUtc() ? "overdue" : "pending";

      const type = charge.billingType || "UNDEFINED";
      const methods = { pix: type === "UNDEFINED" || type === "PIX", boleto: type === "UNDEFINED" || type === "BOLETO", card: type === "UNDEFINED" || type === "CREDIT_CARD" };

      let pix: { payload: string; image: string } | null = null;
      if (status !== "paid" && status !== "cancelled" && methods.pix) {
        try { const q = await pixQrFor(charge.asaasPaymentId); pix = { payload: q.payload, image: q.encodedImage }; } catch { pix = null; }
      }

      const info = await loadSubscriptionInfo(charge.clientId);
      // comprovante em PDF (o nosso, já com o recibo da Develoi) e próximo passo, para a tela de agradecimento
      const payment = status === "paid" ? await prisma.clientPayment.findFirst({ where: { asaasPaymentId: charge.asaasPaymentId } }) : null;
      const method = charge.billingType === "PIX" ? "Pix" : charge.billingType === "BOLETO" ? "Boleto" : charge.billingType === "CREDIT_CARD" ? "Cartão de crédito" : payment?.method ?? null;
      res.json({
        status, value: charge.value, dueDate: charge.dueDate, paidAt: charge.paidAt,
        product: nomeCurto(info), business: charge.client.businessName, customer: charge.client.name.trim().split(/\s+/)[0],
        methods, pix,
        bankSlipUrl: status === "paid" ? null : charge.bankSlipUrl,
        checkoutUrl: status === "paid" ? null : charge.invoiceUrl,
        receiptUrl: charge.receiptUrl,
        receiptPdfUrl: payment ? `/api/client-payments/${payment.id}/receipt.pdf` : null,
        method,
        nextDueDate: status === "paid" && charge.client.billingCycle !== "one_time" ? charge.client.nextDueDate : null,
        storeUrl: status === "paid" && charge.client.boxsysUrl && charge.client.boxsysStatus === "active" ? charge.client.boxsysUrl : null,
        company: COMPANY,
      });
    } catch (e: any) { res.status(500).json({ error: "Não foi possível carregar a fatura." }); }
  });
}
