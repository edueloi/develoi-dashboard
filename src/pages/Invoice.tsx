import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, FileText, CreditCard, CheckCircle2, AlertTriangle, Clock, Download, ExternalLink, QrCode, ShieldCheck, Lock } from 'lucide-react';

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

const NAVY = '#0D1F4E';
const GOLD = '#C49A2A';
const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const STATUS = {
  pending: { label: 'Aguardando pagamento', dot: '#F59E0B' },
  overdue: { label: 'Fatura vencida', dot: '#EF4444' },
  paid: { label: 'Paga', dot: '#22C55E' },
  cancelled: { label: 'Cancelada', dot: '#94A3B8' },
} as const;

type Tab = 'pix' | 'boleto' | 'card';

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

  const tabs = useMemo(() => {
    if (!data) return [] as { key: Tab; label: string; Icon: typeof QrCode }[];
    const list: { key: Tab; label: string; Icon: typeof QrCode }[] = [];
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

  if (error) return <Page><p className="py-24 text-center text-slate-500">{error}</p></Page>;
  if (!data) return <Page><p className="py-24 text-center text-slate-400">Carregando fatura…</p></Page>;

  const st = STATUS[data.status];
  const paid = data.status === 'paid';
  const open = data.status === 'pending' || data.status === 'overdue';

  return (
    <Page company={data.company}>
      <div className="grid overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(13,31,78,0.35)] ring-1 ring-slate-200/60 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* ── Resumo ── */}
        <aside className="relative overflow-hidden p-7 text-white sm:p-9" style={{ background: `linear-gradient(155deg, ${NAVY} 0%, #14307A 100%)` }}>
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20" style={{ background: GOLD, filter: 'blur(70px)' }} />
          <img src="/LOGO-MENU.png" alt="Develoi" className="relative h-9 w-auto" onError={e => { e.currentTarget.style.display = 'none'; }} />

          <div className="relative mt-8 md:mt-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} /> {st.label}
            </span>
            <p className="mt-5 text-sm text-white/60">Fatura da assinatura</p>
            <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">{data.product}</h1>
            {data.business && <p className="mt-0.5 text-sm text-white/70">{data.business}</p>}

            <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-white/50">{paid ? 'Valor pago' : 'Valor a pagar'}</p>
            <p className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">{money(data.value)}</p>

            <dl className="mt-8 space-y-3 border-t border-white/10 pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-white/55">Cliente</dt><dd className="font-semibold">{data.customer}</dd></div>
              <div className="flex justify-between"><dt className="text-white/55">{paid ? 'Pago em' : 'Vencimento'}</dt><dd className="font-semibold">{day(paid && data.paidAt ? data.paidAt : data.dueDate)}</dd></div>
              {paid && data.method && <div className="flex justify-between"><dt className="text-white/55">Forma</dt><dd className="font-semibold">{data.method}</dd></div>}
            </dl>
          </div>
        </aside>

        {/* ── Pagamento / agradecimento ── */}
        <section className="p-7 sm:p-9">
          {paid ? <Thanks data={data} /> : data.status === 'cancelled' ? (
            <p className="py-12 text-center text-slate-500">Esta fatura foi cancelada. Se precisar de ajuda, fale com a gente pelo WhatsApp.</p>
          ) : open && (
            <>
              {data.status === 'overdue' && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Esta fatura venceu em <b>{day(data.dueDate)}</b>. Pague agora para manter o seu acesso funcionando.</span>
                </div>
              )}

              <h2 className="text-lg font-black text-slate-900">Escolha como pagar</h2>

              {tabs.length > 1 && (
                <div className="mt-4 grid gap-1.5 rounded-xl bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                  {tabs.map(({ key, label, Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold transition ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5">
                {tab === 'pix' && data.pix && (
                  <div>
                    <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <img src={`data:image/png;base64,${data.pix.image}`} alt="QR Code Pix" className="h-52 w-52 sm:h-56 sm:w-56" />
                    </div>
                    <ol className="mt-5 space-y-2 text-sm text-slate-600">
                      {['Abra o app do seu banco e escolha Pix.', 'Leia o QR Code ou use o Pix copia e cola.', 'Confirme o valor e pronto: a confirmação é automática.'].map((t, i) => (
                        <li key={i} className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: NAVY }}>{i + 1}</span>{t}</li>
                      ))}
                    </ol>
                    <div className="mt-5 flex items-stretch gap-2">
                      <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-500">{data.pix.payload}</div>
                      <button onClick={copy} className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white transition hover:brightness-110" style={{ background: copied ? '#16A34A' : NAVY }}>
                        {copied ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'boleto' && data.bankSlipUrl && (
                  <div className="rounded-2xl border border-slate-200 p-5 text-center">
                    <FileText className="mx-auto h-9 w-9 text-slate-400" />
                    <p className="mt-3 text-sm text-slate-600">Abra o boleto para copiar o código de barras ou baixar o PDF. A compensação pode levar até 2 dias úteis.</p>
                    <a href={data.bankSlipUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white hover:brightness-110" style={{ background: NAVY }}><ExternalLink className="h-4 w-4" /> Abrir boleto</a>
                  </div>
                )}

                {tab === 'card' && data.checkoutUrl && (
                  <div className="rounded-2xl border border-slate-200 p-5 text-center">
                    <CreditCard className="mx-auto h-9 w-9 text-slate-400" />
                    <p className="mt-3 text-sm text-slate-600">Você será levado ao ambiente seguro do Asaas para informar os dados do cartão.</p>
                    <a href={data.checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white hover:brightness-110" style={{ background: NAVY }}><Lock className="h-4 w-4" /> Pagar com cartão</a>
                  </div>
                )}

                {!tabs.length && data.checkoutUrl && (
                  <a href={data.checkoutUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white hover:brightness-110" style={{ background: NAVY }}><ExternalLink className="h-4 w-4" /> Ir para o pagamento</a>
                )}
              </div>

              <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400"><Clock className="h-3.5 w-3.5" /> Depois de pagar, esta página confirma sozinha e o recibo chega no seu WhatsApp.</p>
            </>
          )}
        </section>
      </div>
    </Page>
  );
}

function Thanks({ data }: { data: InvoiceData }) {
  return (
    <div className="flex h-full flex-col justify-center text-center" style={{ animation: 'rise .5s ease both' }}>
      <style>{'@keyframes pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}@keyframes rise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}'}</style>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100" style={{ animation: 'pop .6s ease both' }}>
        <CheckCircle2 className="h-11 w-11 text-green-600" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-900">Pagamento confirmado!</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">Obrigado, {data.customer}! Recebemos o pagamento da sua assinatura e está tudo certo por aqui. 🙏</p>

      {data.nextDueDate && (
        <div className="mx-auto mt-6 w-full max-w-xs rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">Próximo vencimento: </span><b className="text-slate-900">{day(data.nextDueDate)}</b>
        </div>
      )}

      <div className="mx-auto mt-6 w-full max-w-xs space-y-3">
        {data.storeUrl && (
          <a href={data.storeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white hover:brightness-110" style={{ background: NAVY }}><ExternalLink className="h-4 w-4" /> Acessar meu sistema</a>
        )}
        {(data.receiptPdfUrl || data.receiptUrl) && (
          <a href={data.receiptPdfUrl || data.receiptUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> Baixar recibo</a>
        )}
      </div>
      <p className="mt-5 text-xs text-slate-400">O recibo também foi enviado no seu WhatsApp.</p>
    </div>
  );
}

function Page({ children, company }: { children: React.ReactNode; company?: InvoiceData['company'] }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:py-12" style={{ background: 'linear-gradient(180deg,#EEF1F8 0%,#F7F8FC 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-4xl">
        {children}
        <div className="mt-6 flex flex-col items-center gap-1.5 text-center text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Pagamento seguro processado pelo Asaas</span>
          {company && <span>{company.name} · CNPJ {company.cnpj} · {company.email} · WhatsApp {company.phone}</span>}
        </div>
      </div>
    </div>
  );
}
