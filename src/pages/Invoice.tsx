import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, FileText, CreditCard, CheckCircle2, AlertTriangle, Download, ExternalLink, QrCode, ShieldCheck, Lock, MessageCircle } from 'lucide-react';

export interface InvoiceData {
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  value: number; dueDate: string; paidAt: string | null;
  product: string; business: string | null; customer: string;
  methods: { pix: boolean; boleto: boolean; card: boolean };
  pix: { payload: string; image: string } | null;
  bankSlipUrl: string | null; checkoutUrl: string | null; receiptUrl: string | null;
  receiptPdfUrl: string | null; method: string | null; nextDueDate: string | null; storeUrl: string | null;
  company: { name: string; cnpj: string; email: string; phone: string };
}

export const NAVY = '#0D1F4E';
export const GOLD = '#C49A2A';
const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const STATUS = {
  pending: { label: 'Aguardando pagamento', bg: 'rgba(245,158,11,.18)', fg: '#FCD34D' },
  overdue: { label: 'Fatura vencida', bg: 'rgba(239,68,68,.2)', fg: '#FCA5A5' },
  paid: { label: 'Pagamento confirmado', bg: 'rgba(34,197,94,.2)', fg: '#86EFAC' },
  cancelled: { label: 'Cancelada', bg: 'rgba(148,163,184,.25)', fg: '#CBD5E1' },
} as const;

type Tab = 'pix' | 'boleto' | 'card';
type TabDef = { key: Tab; label: string; Icon: typeof QrCode };

// Página pública da fatura: o cliente chega pelo link do WhatsApp e paga por Pix, boleto ou cartão.
export default function Invoice() {
  const { id } = useParams();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>('pix');

  useEffect(() => {
    let alive = true;
    const load = () => fetch(`/api/public/invoice/${id}`).then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Fatura não encontrada.');
      if (alive) setData(d);
    }).catch(e => alive && setError(e.message));
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 10000); // vira "paga" sozinha
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  const tabs = useMemo<TabDef[]>(() => {
    if (!data) return [];
    const list: TabDef[] = [];
    if (data.pix) list.push({ key: 'pix', label: 'Pix', Icon: QrCode });
    if (data.methods.boleto && data.bankSlipUrl) list.push({ key: 'boleto', label: 'Boleto', Icon: FileText });
    if (data.methods.card && data.checkoutUrl) list.push({ key: 'card', label: 'Cartão', Icon: CreditCard });
    return list;
  }, [data]);

  useEffect(() => { if (tabs.length && !tabs.some(t => t.key === tab)) setTab(tabs[0].key); }, [tabs, tab]);

  const copy = async () => {
    if (!data?.pix) return;
    try { await navigator.clipboard.writeText(data.pix.payload); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão */ }
  };

  if (error) return <Page><div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">{error}</div></Page>;
  if (!data) return <Page><div className="rounded-2xl bg-white p-10 text-center text-slate-400 shadow-sm">Carregando fatura…</div></Page>;

  const st = STATUS[data.status];
  const paid = data.status === 'paid';
  const open = data.status === 'pending' || data.status === 'overdue';
  const wa = `https://wa.me/55${data.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre a fatura de ${data.product}${data.business ? ` (${data.business})` : ''}.`)}`;

  return (
    <Page company={data.company}>
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(13,31,78,0.45)] ring-1 ring-slate-200/70">
        {/* ── Topo da marca + valor ── */}
        <header className="relative overflow-hidden px-6 pb-8 pt-6 text-center text-white sm:px-10 sm:pt-8" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #17358A 100%)` }}>
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-25" style={{ background: GOLD, filter: 'blur(60px)' }} />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full opacity-20" style={{ background: '#4F7DF3', filter: 'blur(70px)' }} />
          <img src="/LOGO-MENU-BRANCO.png" alt="Develoi Soluções Digitais" className="relative mx-auto h-11 w-auto sm:h-12" />

          <span className="relative mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold" style={{ background: st.bg, color: st.fg }}>
            {paid ? <CheckCircle2 className="h-3.5 w-3.5" /> : data.status === 'overdue' ? <AlertTriangle className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full" style={{ background: st.fg }} />}
            {st.label}
          </span>

          <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{paid ? 'Valor pago' : 'Valor da fatura'}</p>
          <p className="relative mt-1 text-4xl font-extrabold sm:text-[2.6rem]">{money(data.value)}</p>
          <p className="relative mt-3 text-sm text-white/70">
            {paid && data.paidAt ? <>Pago em <b className="text-white">{day(data.paidAt)}</b>{data.method ? ` via ${data.method}` : ''}</> : <>Vencimento em <b className="text-white">{day(data.dueDate)}</b></>}
          </p>
        </header>

        {/* ── Detalhes ── */}
        <dl className="divide-y divide-slate-100 border-b border-slate-100 px-6 text-sm sm:px-10">
          <Row label="Assinatura" value={data.product} />
          <Row label={data.business ? 'Estabelecimento' : 'Cliente'} value={data.business || data.customer} />
          <Row label={paid ? 'Próximo vencimento' : 'Vencimento'} value={day(paid ? (data.nextDueDate ?? data.dueDate) : data.dueDate)} />
        </dl>

        {/* ── Pagamento / agradecimento ── */}
        <section className="px-6 py-7 sm:px-10">
          {paid ? <Thanks data={data} /> : data.status === 'cancelled' ? (
            <p className="py-6 text-center text-slate-500">Esta fatura foi cancelada. Se precisar de ajuda, fale com a gente pelo WhatsApp.</p>
          ) : open && (
            <>
              {data.status === 'overdue' && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Esta fatura venceu em <b>{day(data.dueDate)}</b>. Pague agora para manter o seu acesso funcionando.</span>
                </div>
              )}

              <h2 className="text-base font-bold text-slate-900">Como você quer pagar?</h2>

              {tabs.length > 1 && (
                <div className="mt-3 grid gap-1.5 rounded-2xl bg-slate-100 p-1.5" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                  {tabs.map(({ key, label, Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold transition ${tab === key ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5">
                {tab === 'pix' && data.pix && (
                  <div>
                    <div className="mx-auto w-fit rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
                      <img src={`data:image/png;base64,${data.pix.image}`} alt="QR Code Pix" className="h-56 w-56 max-w-full sm:h-60 sm:w-60" />
                    </div>
                    <p className="mt-3 text-center text-sm font-semibold text-slate-700">Aponte a câmera do app do seu banco</p>

                    <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />ou use o copia e cola<span className="h-px flex-1 bg-slate-200" /></div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs text-slate-500">{data.pix.payload}</div>
                      <button onClick={copy} className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-110" style={{ background: copied ? '#16A34A' : NAVY }}>
                        {copied ? <><Check className="h-4 w-4" /> Código copiado!</> : <><Copy className="h-4 w-4" /> Copiar código</>}
                      </button>
                    </div>
                    <p className="mt-3 text-center text-xs text-slate-400">No app do banco: Pix → Pix Copia e Cola → colar → confirmar.</p>
                  </div>
                )}

                {tab === 'boleto' && data.bankSlipUrl && (
                  <ActionCard Icon={FileText} text="Abra o boleto para copiar o código de barras ou baixar o PDF. A compensação pode levar até 2 dias úteis." href={data.bankSlipUrl} label="Abrir boleto" />
                )}

                {tab === 'card' && data.checkoutUrl && (
                  <ActionCard Icon={CreditCard} text="Você será levado ao ambiente seguro do Asaas para informar os dados do cartão." href={data.checkoutUrl} label="Pagar com cartão" lock />
                )}

                {!tabs.length && data.checkoutUrl && (
                  <ActionCard Icon={ExternalLink} text="Escolha a forma de pagamento no ambiente seguro do Asaas." href={data.checkoutUrl} label="Ir para o pagamento" />
                )}
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">Depois de pagar, esta página confirma sozinha e o recibo chega no seu WhatsApp.</p>
            </>
          )}
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:px-10">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-green-600" /> Pagamento seguro processado pelo Asaas</span>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-3.5 py-1.5 text-xs font-bold text-green-700 hover:bg-green-50"><MessageCircle className="h-3.5 w-3.5" /> Dúvidas? Fale conosco</a>
        </footer>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function ActionCard({ Icon, text, href, label, lock }: { Icon: typeof QrCode; text: string; href: string; label: string; lock?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mx-auto mt-3 max-w-sm text-sm text-slate-600">{text}</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-110" style={{ background: NAVY }}>
        {lock ? <Lock className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />} {label}
      </a>
    </div>
  );
}

function Thanks({ data }: { data: InvoiceData }) {
  return (
    <div className="text-center" style={{ animation: 'rise .5s ease both' }}>
      <style>{'@keyframes pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}@keyframes rise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}'}</style>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100" style={{ animation: 'pop .6s ease both' }}>
        <CheckCircle2 className="h-11 w-11 text-green-600" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">Obrigado, {data.customer}!</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Recebemos o pagamento da sua assinatura e está tudo certo por aqui. 🙏</p>

      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
        {data.storeUrl && (
          <a href={data.storeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white hover:brightness-110" style={{ background: NAVY }}><ExternalLink className="h-4 w-4" /> Acessar meu sistema</a>
        )}
        {(data.receiptPdfUrl || data.receiptUrl) && (
          <a href={data.receiptPdfUrl || data.receiptUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> Baixar recibo</a>
        )}
      </div>
      <p className="mt-5 text-xs text-slate-400">O recibo também foi enviado no seu WhatsApp.</p>
    </div>
  );
}

export function Page({ children, company }: { children: React.ReactNode; company?: InvoiceData['company'] }) {
  return (
    <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-10" style={{ background: 'linear-gradient(180deg,#E8ECF6 0%,#F6F7FB 60%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-xl">
        {children}
        {company && <p className="mt-5 px-2 text-center text-[11px] leading-relaxed text-slate-400">{company.name} · CNPJ {company.cnpj}<br />{company.email} · WhatsApp {company.phone}</p>}
      </div>
    </div>
  );
}
