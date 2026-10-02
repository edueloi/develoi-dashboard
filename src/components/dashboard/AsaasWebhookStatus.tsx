import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, Webhook } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AsaasEvent { id: string; event: string; clientName?: string | null; outcome: string; ok: boolean; createdAt: string }
interface Status { configured: boolean; env: string; webhookTokenSet: boolean; webhookUrl: string | null }

// Mostra se o Asaas está mandando avisos (webhook) e o que o sistema fez com cada um.
// Só aparece quando o Asaas está configurado.
export function AsaasWebhookStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [events, setEvents] = useState<AsaasEvent[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [s, e] = await Promise.all([fetch('/api/asaas/status'), fetch('/api/asaas/events')]);
        if (!alive) return;
        setStatus(await s.json());
        const list = await e.json();
        setEvents(Array.isArray(list) ? list : []);
      } catch {}
    };
    load();
    const id = setInterval(load, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!status?.configured) return null;

  const last = events[0];
  const lastBad = last && !last.ok;
  const sandbox = status.env !== 'production';

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left">
        <Webhook className={`w-4 h-4 flex-shrink-0 ${lastBad ? 'text-red-500' : last ? 'text-green-600' : 'text-slate-400'}`} />
        <span className="flex-1 min-w-0 text-xs">
          <b className="text-slate-700 dark:text-slate-200">Asaas{sandbox ? ' (teste)' : ''}</b>
          <span className="text-slate-400">
            {' · '}
            {!status.webhookTokenSet ? 'falta definir o token do webhook no servidor'
              : last ? `último aviso ${formatDistanceToNow(new Date(last.createdAt), { locale: ptBR, addSuffix: true })}: ${last.outcome}`
              : 'aguardando o primeiro aviso do Asaas'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
          {events.length === 0 && (
            <p className="px-4 py-3 text-xs text-slate-400">
              Nenhum aviso recebido ainda. Confira no Asaas (Integrações → Webhooks) se a URL é <b>{status.webhookUrl ?? 'PUBLIC_BASE_URL/api/asaas/webhook'}</b> e se o token é o mesmo do servidor.
            </p>
          )}
          {events.map(ev => (
            <div key={ev.id} className="flex items-start gap-2.5 px-4 py-2 text-xs">
              {ev.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-slate-700 dark:text-slate-200">
                  <b>{ev.event}</b>{ev.clientName ? ` · ${ev.clientName}` : ''}
                </p>
                <p className={ev.ok ? 'text-slate-400' : 'text-red-500'}>{ev.outcome}</p>
              </div>
              <span className="text-slate-400 flex-shrink-0">{format(new Date(ev.createdAt), 'dd/MM HH:mm:ss')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
