import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, CheckCircle2, AlertTriangle, MessageCircle, Repeat } from 'lucide-react';
import { Page, NAVY, GOLD, type InvoiceData } from './Invoice';

interface AuthData {
  status: 'CREATED' | 'ACTIVE' | 'REFUSED' | 'CANCELLED' | 'EXPIRED';
  value: number; cycle: string; nextDueDate: string | null;
  product: string; business: string | null; customer: string;
  qr: { payload: string; image: string } | null;
  company: InvoiceData['company'];
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

// Página pública do Pix Automático: o cliente lê o QR uma única vez e as próximas cobranças acontecem sozinhas.
export default function PixAuth() {
  const { id } = useParams();
  const [data, setData] = useState<AuthData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => fetch(`/api/public/pix-auth/${id}`).then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Autorização não encontrada.');
      if (alive) setData(d);
    }).catch(e => alive && setError(e.message));
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 8000); // vira "ativo" sozinho
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  const copy = async () => {
    if (!data?.qr) return;
    try { await navigator.clipboard.writeText(data.qr.payload); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão */ }
  };

  if (error) return <Page><div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">{error}</div></Page>;
  if (!data) return <Page><div className="rounded-2xl bg-white p-10 text-center text-slate-400 shadow-sm">Carregando…</div></Page>;

  const active = data.status === 'ACTIVE';
  const pending = data.status === 'CREATED';
  const wa = `https://wa.me/55${data.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Preciso de ajuda com o Pix Automático da assinatura ${data.product}.`)}`;

  return (
    <Page company={data.company}>
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(13,31,78,0.45)] ring-1 ring-slate-200/70">
        <header className="relative overflow-hidden px-6 pb-8 pt-6 text-center text-white sm:px-10 sm:pt-8" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #17358A 100%)` }}>
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-25" style={{ background: GOLD, filter: 'blur(60px)' }} />
          <img src="/LOGO-MENU-BRANCO.png" alt="Develoi Soluções Digitais" className="relative mx-auto h-11 w-auto sm:h-12" />
          <span className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold">
            <Repeat className="h-3.5 w-3.5" /> Pix Automático
          </span>
          <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{data.cycle === 'yearly' ? 'Cobrança anual' : 'Cobrança mensal'}</p>
          <p className="relative mt-1 text-4xl font-extrabold sm:text-[2.6rem]">{money(data.value)}</p>
          <p className="relative mt-3 text-sm text-white/70">{data.product}{data.business ? ` · ${data.business}` : ''}</p>
        </header>

        <section className="px-6 py-7 sm:px-10">
          {pending && (
            <>
              <h1 className="text-lg font-bold text-slate-900">Ative em um minuto, {data.customer}</h1>
              <p className="mt-1 text-sm text-slate-500">Você autoriza uma única vez e as próximas cobranças acontecem sozinhas, no vencimento. Sem boleto e sem precisar lembrar de pagar.</p>

              {data.qr ? (
                <div className="mt-5">
                  <div className="mx-auto w-fit rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <img src={`data:image/png;base64,${data.qr.image}`} alt="QR Code do Pix Automático" className="h-56 w-56 max-w-full sm:h-60 sm:w-60" />
                  </div>
                  <ol className="mt-5 space-y-2 text-sm text-slate-600">
                    {['Abra o app do seu banco e vá em Pix.', 'Leia o QR Code (ou use o Pix Copia e Cola).', `Confirme o primeiro pagamento de ${money(data.value)} e autorize o Pix Automático.`].map((t, i) => (
                      <li key={i} className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: NAVY }}>{i + 1}</span>{t}</li>
                    ))}
                  </ol>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs text-slate-500">{data.qr.payload}</div>
                    <button onClick={copy} className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-110" style={{ background: copied ? '#16A34A' : NAVY }}>
                      {copied ? <><Check className="h-4 w-4" /> Código copiado!</> : <><Copy className="h-4 w-4" /> Copiar código</>}
                    </button>
                  </div>
                  <p className="mt-4 text-center text-xs text-slate-400">Esta página confirma sozinha assim que o seu banco autorizar.</p>
                </div>
              ) : (
                <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">O QR Code ainda não está disponível. Fale com a gente pelo botão abaixo que resolvemos rapidinho.</p>
              )}
            </>
          )}

          {active && (
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-11 w-11 text-green-600" /></div>
              <h1 className="mt-5 text-xl font-bold text-slate-900">Pix Automático ativado!</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Obrigado, {data.customer}! As próximas cobranças de {money(data.value)} acontecem sozinhas{data.nextDueDate ? <>, a próxima em <b className="text-slate-800">{day(data.nextDueDate)}</b></> : ''}. 🙏</p>
            </div>
          )}

          {!pending && !active && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{data.status === 'REFUSED' ? 'O seu banco não confirmou a autorização.' : data.status === 'EXPIRED' ? 'Esta autorização expirou.' : 'Esta autorização foi cancelada.'} Fale com a gente para combinarmos a melhor forma de pagamento.</span>
            </div>
          )}
        </section>

        <footer className="flex justify-center border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-3.5 py-1.5 text-xs font-bold text-green-700 hover:bg-green-50"><MessageCircle className="h-3.5 w-3.5" /> Dúvidas? Fale conosco</a>
        </footer>
      </div>
    </Page>
  );
}
