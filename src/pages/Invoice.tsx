import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, FileText, CreditCard, CheckCircle2, AlertTriangle, Clock, Download, ExternalLink } from 'lucide-react';

interface InvoiceData {
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  value: number; dueDate: string; paidAt: string | null;
  product: string; business: string | null; customer: string;
  methods: { pix: boolean; boleto: boolean; card: boolean };
  pix: { payload: string; image: string } | null;
  bankSlipUrl: string | null; checkoutUrl: string | null; receiptUrl: string | null;
  receiptPdfUrl: string | null; method: string | null; nextDueDate: string | null; storeUrl: string | null;
  company: { name: string; cnpj: string; email: string; phone: string };
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const STATUS = {
  pending: { label: 'Aguardando pagamento', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  overdue: { label: 'Vencida', cls: 'bg-red-50 text-red-700 border-red-200', Icon: AlertTriangle },
  paid: { label: 'Pagamento confirmado', cls: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: AlertTriangle },
} as const;

// Página pública da fatura: o cliente chega pelo link do WhatsApp e paga por Pix, boleto ou cartão
export default function Invoice() {
  const { id } = useParams();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => fetch(`/api/public/invoice/${id}`).then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Fatura não encontrada.');
      if (alive) setData(d);
    }).catch(e => alive && setError(e.message));
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 10000); // vira "pago" sozinha
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  const copy = async () => {
    if (!data?.pix) return;
    try { await navigator.clipboard.writeText(data.pix.payload); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão */ }
  };

  if (error) return <Shell><p className="text-center text-slate-500 py-16">{error}</p></Shell>;
  if (!data) return <Shell><p className="text-center text-slate-400 py-16">Carregando fatura…</p></Shell>;

  const st = STATUS[data.status];
  const open = data.status === 'pending' || data.status === 'overdue';

  if (data.status === 'paid') {
    return (
      <Shell company={data.company}>
        <style>{'@keyframes pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}@keyframes rise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}'}</style>
        <div className="px-6 pt-9 pb-6 text-center" style={{ animation: 'rise .5s ease both' }}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100" style={{ animation: 'pop .6s ease both' }}>
            <CheckCircle2 className="h-11 w-11 text-green-600" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Pagamento confirmado!</h1>
          <p className="mt-2 text-sm text-slate-500">Obrigado, {data.customer}! Recebemos o pagamento da sua assinatura. 🙏</p>
        </div>

        <div className="mx-6 rounded-xl bg-slate-50 p-4">
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Assinatura</dt><dd className="text-right font-bold text-slate-900">{data.product}{data.business ? ` · ${data.business}` : ''}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Valor pago</dt><dd className="font-bold text-slate-900">{money(data.value)}</dd></div>
            {data.paidAt && <div className="flex justify-between gap-4"><dt className="text-slate-500">Data</dt><dd className="font-bold text-slate-900">{day(data.paidAt)}</dd></div>}
            {data.method && <div className="flex justify-between gap-4"><dt className="text-slate-500">Forma</dt><dd className="font-bold text-slate-900">{data.method}</dd></div>}
            {data.nextDueDate && <div className="flex justify-between gap-4 border-t border-slate-200 pt-2.5"><dt className="text-slate-500">Próximo vencimento</dt><dd className="font-bold text-slate-900">{day(data.nextDueDate)}</dd></div>}
          </dl>
        </div>

        <div className="space-y-3 px-6 pt-5 pb-7">
          {data.storeUrl && (
            <a href={data.storeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#0D1F4E] px-4 py-3 text-sm font-bold text-white hover:brightness-110"><ExternalLink className="w-4 h-4" /> Acessar meu sistema</a>
          )}
          {(data.receiptPdfUrl || data.receiptUrl) && (
            <a href={data.receiptPdfUrl || data.receiptUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> Baixar recibo</a>
          )}
          <p className="text-center text-xs text-slate-400">O recibo também foi enviado no seu WhatsApp. Qualquer dúvida, é só responder por lá.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell company={data.company}>
      <div className="px-6 pt-6 pb-5">
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${st.cls}`}><st.Icon className="w-3.5 h-3.5" /> {st.label}</div>
        <p className="mt-4 text-sm text-slate-500">Olá, {data.customer}! Esta é a fatura da sua assinatura:</p>
        <h1 className="mt-1 text-xl font-black text-slate-900">{data.product}</h1>
        {data.business && <p className="text-sm text-slate-500">{data.business}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3.5"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Valor</p><p className="mt-0.5 text-2xl font-black text-slate-900">{money(data.value)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3.5"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Vencimento</p><p className="mt-0.5 text-2xl font-black text-slate-900">{day(data.dueDate)}</p></div>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-6 py-6">
          {data.pix && (
            <section>
              <h2 className="text-sm font-black text-slate-900">Pagar com Pix</h2>
              <p className="text-xs text-slate-500">Abra o app do seu banco, escolha Pix e leia o QR Code ou cole o código.</p>
              <div className="mt-3 flex flex-col items-center gap-3">
                <img src={`data:image/png;base64,${data.pix.image}`} alt="QR Code Pix" className="h-52 w-52 rounded-xl border border-slate-200 p-2" />
                <button onClick={copy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1F4E] px-4 py-3 text-sm font-bold text-white hover:brightness-110">
                  {copied ? <><Check className="w-4 h-4" /> Código copiado!</> : <><Copy className="w-4 h-4" /> Copiar código Pix</>}
                </button>
              </div>
            </section>
          )}
          {(data.methods.boleto && data.bankSlipUrl) && (
            <a href={data.bankSlipUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><FileText className="w-4 h-4" /> Pagar com boleto</a>
          )}
          {(data.methods.card && data.checkoutUrl) && (
            <a href={data.checkoutUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><CreditCard className="w-4 h-4" /> Pagar com cartão</a>
          )}
          {!data.pix && !data.bankSlipUrl && data.checkoutUrl && (
            <a href={data.checkoutUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#0D1F4E] px-4 py-3 text-sm font-bold text-white hover:brightness-110">Ir para o pagamento</a>
          )}
          <p className="text-center text-[11px] text-slate-400">Depois de pagar, esta página confirma sozinha e você recebe o comprovante no WhatsApp.</p>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, company }: { children: React.ReactNode; company?: InvoiceData['company'] }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex justify-center"><img src="/LOGO-MENU.png" alt="Develoi" className="h-10" onError={e => ((e.currentTarget.style.display = 'none'))} /></div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">{children}</div>
        {company && (
          <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
            {company.name} · CNPJ {company.cnpj}<br />{company.email} · WhatsApp {company.phone}
          </p>
        )}
      </div>
    </div>
  );
}
