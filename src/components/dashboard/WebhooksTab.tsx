import React, { useState, useEffect, useCallback } from 'react';
import {
  Webhook, CheckCircle2, AlertTriangle, Copy, RefreshCw, Plug, PlayCircle, RotateCcw, ChevronDown, ShieldCheck, Link2,
} from 'lucide-react';
import { Button, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Status { configured: boolean; env: string; webhookTokenSet: boolean; webhookUrl: string | null }
interface AsaasHook { id: string; name: string; url: string; enabled: boolean; interrupted: boolean; sendType?: string; events: string[]; penalized?: number; mine: boolean }
interface EventLog { id: string; event: string; asaasPaymentId?: string | null; clientName?: string | null; outcome: string; ok: boolean; payload?: string | null; createdAt: string }

export function WebhooksTab() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const text = isDark ? '#fff' : '#0D1F4E';

  const [status, setStatus] = useState<Status | null>(null);
  const [hooks, setHooks] = useState<AsaasHook[] | null>(null);
  const [hooksError, setHooksError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const r = await fetch('/api/asaas/events?limit=50');
      const d = await r.json();
      setEvents(Array.isArray(d) ? d : []);
    } catch {}
  }, []);

  const loadHooks = useCallback(async () => {
    try {
      const r = await fetch('/api/asaas/webhooks');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erro');
      setHooks(d); setHooksError(null);
    } catch (e: any) { setHooks(null); setHooksError(e.message); }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const s = await (await fetch('/api/asaas/status')).json();
      setStatus(s);
      if (s.configured) await Promise.all([loadHooks(), loadEvents()]);
    } catch {
      toast('Não deu para carregar os webhooks agora.', 'error');
    } finally { setLoading(false); }
  }, [loadHooks, loadEvents, toast]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const id = setInterval(loadEvents, 10000);
    return () => clearInterval(id);
  }, [loadEvents]);

  async function call(key: string, url: string, okMsg: (d: any) => string) {
    setBusy(key);
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast(okMsg(data), 'success');
      loadAll();
    } catch (e: any) { toast(e.message || 'Não deu para concluir.', 'error'); }
    finally { setBusy(null); }
  }

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast('Copiado', 'success'); } catch { toast('Não deu para copiar.', 'error'); }
  };

  const mine = hooks?.find(h => h.mine) ?? null;
  const hookState = !hooks ? null
    : !mine ? { label: 'Não cadastrado no Asaas', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' }
    : mine.interrupted ? { label: 'Fila interrompida', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' }
    : !mine.enabled ? { label: 'Desativado', color: '#C49A2A', bg: 'rgba(196,154,42,0.12)' }
    : { label: 'Ativo', color: '#15803D', bg: 'rgba(21,128,61,0.1)' };

  const shown = events.filter(e => !onlyProblems || !e.ok);
  const problems = events.filter(e => !e.ok).length;

  if (loading) return <div className="text-center py-12 text-slate-400">Carregando…</div>;

  if (!status?.configured) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>Webhooks</h2>
        <EmptyState icon={Webhook} title="Asaas ainda não configurado"
          description="Adicione ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN e PUBLIC_BASE_URL no .env do servidor e reinicie o sistema." />
      </div>
    );
  }

  const card = 'bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4';
  const label = 'text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-3';

  return (
    <div className="space-y-5 dashboard-density">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>Webhooks</h2>
          <p className="text-xs text-slate-400 mt-0.5">Avisos que o Asaas envia ao sistema quando uma cobrança é criada, paga ou vence</p>
        </div>
        <Button variant="outline" iconLeft={<RefreshCw className="w-4 h-4" />} onClick={loadAll}>Atualizar</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Conexão */}
        <div className={card}>
          <p className={label}><Plug className="w-3.5 h-3.5" /> Conexão com o Asaas</p>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold" style={{ color: text }}>Chave de API configurada</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Ambiente: <b>{status.env === 'production' ? 'produção (cobranças reais)' : 'teste (sandbox)'}</b></p>
          <Button size="sm" variant="outline" loading={busy === 'test'} iconLeft={<PlayCircle className="w-3.5 h-3.5" />}
            onClick={() => call('test', '/api/asaas/test', d => `Conexão OK${d.name ? ` — ${d.name}` : ''}`)}>
            Testar conexão
          </Button>
        </div>

        {/* Endereço neste sistema */}
        <div className={card}>
          <p className={label}><Link2 className="w-3.5 h-3.5" /> Endereço deste sistema</p>
          {status.webhookUrl ? (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 mb-2">
              <code className="text-xs flex-1 min-w-0 truncate" style={{ color: text }}>{status.webhookUrl}</code>
              <button onClick={() => copy(status.webhookUrl!)} className="text-slate-400 hover:text-indigo-500" aria-label="Copiar endereço"><Copy className="w-3.5 h-3.5" /></button>
            </div>
          ) : <p className="text-xs text-red-500 mb-2">Defina PUBLIC_BASE_URL no .env do servidor.</p>}
          <p className="text-xs flex items-center gap-1.5">
            <ShieldCheck className={`w-3.5 h-3.5 ${status.webhookTokenSet ? 'text-green-600' : 'text-red-500'}`} />
            <span className={status.webhookTokenSet ? 'text-slate-500' : 'text-red-500'}>
              {status.webhookTokenSet ? 'Token de autenticação configurado no servidor' : 'Falta ASAAS_WEBHOOK_TOKEN no servidor'}
            </span>
          </p>
          <p className="text-[11px] text-slate-400 mt-2">O Asaas precisa enviar este mesmo token em cada aviso. Sem ele, o sistema recusa (401).</p>
        </div>

        {/* Webhook no Asaas */}
        <div className={card}>
          <p className={label}><Webhook className="w-3.5 h-3.5" /> Webhook no Asaas</p>
          {hooksError ? (
            <p className="text-xs text-red-500 mb-3">Não consegui consultar o Asaas: {hooksError}</p>
          ) : hookState && (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg mb-2" style={{ background: hookState.bg, color: hookState.color }}>
                {hookState.label}
              </span>
              {mine && <p className="text-xs text-slate-400 mb-3">{mine.events.length} tipos de evento · envio {mine.sendType === 'SEQUENTIALLY' ? 'sequencial' : 'não sequencial'}</p>}
              {mine && (mine.penalized ?? 0) > 0 && <p className="text-xs text-red-500 mb-3">{mine.penalized} envio(s) com falha. Veja os avisos "com problema" abaixo.</p>}
              {!mine && <p className="text-xs text-slate-400 mb-3">Nenhum webhook com o endereço deste sistema na conta.</p>}
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy === 'setup'}
              onClick={() => call('setup', '/api/asaas/setup-webhook', () => 'Webhook registrado no Asaas')}>
              {mine ? 'Atualizar no Asaas' : 'Registrar no Asaas'}
            </Button>
            {mine && (mine.interrupted || !mine.enabled) && (
              <Button size="sm" variant="danger" loading={busy === 'resume'}
                onClick={() => call('resume', `/api/asaas/webhooks/${mine.id}/resume`, () => 'Fila reativada')}>
                Reativar fila
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Avisos recebidos */}
      <section className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <p className="text-sm font-black" style={{ color: text }}>Avisos recebidos</p>
            <p className="text-[11px] text-slate-400">Os 50 mais recentes. Atualiza sozinho.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5">
              {([[false, 'Todos'], [true, problems ? `Com problema (${problems})` : 'Com problema']] as [boolean, string][]).map(([v, l]) => (
                <button key={l} onClick={() => setOnlyProblems(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${onlyProblems === v ? 'bg-white dark:bg-white/15 shadow-sm' : 'text-slate-500'}`}
                  style={onlyProblems === v ? { color: v ? '#DC2626' : text } : undefined}>{l}</button>
              ))}
            </div>
            <Button size="sm" variant="outline" loading={busy === 'sync'} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => call('sync', '/api/asaas/sync-all', d => `Conferência feita (${d.updated} cobrança${d.updated === 1 ? '' : 's'})`)}>
              Sincronizar agora
            </Button>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            {events.length === 0 ? 'Nenhum aviso recebido ainda. Quando o Asaas enviar o primeiro, ele aparece aqui.' : 'Nenhum aviso com problema. 🎉'}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {shown.map(ev => (
              <div key={ev.id}>
                <div className="flex items-start gap-3 px-4 py-2.5 text-xs">
                  {ev.ok ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700 dark:text-slate-200"><b>{ev.event}</b>{ev.clientName ? ` · ${ev.clientName}` : ''}</p>
                    <p className={ev.ok ? 'text-slate-400' : 'text-red-500'}>{ev.outcome}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-500">{format(new Date(ev.createdAt), 'dd/MM HH:mm:ss')}</p>
                    <p className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(ev.createdAt), { locale: ptBR, addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {ev.payload && (
                      <button onClick={() => call(`re-${ev.id}`, `/api/asaas/events/${ev.id}/reprocess`, d => d.outcome || 'Reprocessado')}
                        title="Processar este aviso de novo" disabled={busy === `re-${ev.id}`}
                        className="p-1.5 rounded text-slate-400 hover:text-indigo-500 disabled:opacity-40"><RotateCcw className="w-3.5 h-3.5" /></button>
                    )}
                    {ev.payload && (
                      <button onClick={() => setOpenId(openId === ev.id ? null : ev.id)} title="Ver dados do aviso" className="p-1.5 rounded text-slate-400 hover:text-slate-700">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openId === ev.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
                {openId === ev.id && ev.payload && (
                  <pre className="mx-4 mb-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5 text-[11px] text-slate-600 dark:text-slate-300 overflow-x-auto max-h-60">
                    {(() => { try { return JSON.stringify(JSON.parse(ev.payload!), null, 2); } catch { return ev.payload; } })()}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
