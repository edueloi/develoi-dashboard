import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Send, KeyRound, Copy, CheckCircle2, AlertTriangle, Clock, RotateCcw, Webhook, ChevronDown } from 'lucide-react';
import { Button, Modal, ConfirmModal, Input, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { RowMenu } from './financeShared';
import { format } from 'date-fns';

interface Endpoint {
  id: string; name: string; url: string; active: boolean; events: string[]; secretPreview: string;
  stats: { success: number; failed: number; pending: number };
}
interface Delivery {
  id: string; endpointName: string; event: string; status: 'pending' | 'success' | 'failed'; attempts: number;
  lastStatusCode: number | null; lastError: string | null; durationMs: number | null; createdAt: string; eventId: number;
}
interface ModelOpt { model: string; key: string; label: string }

const summary = (events: string[], models: ModelOpt[]) =>
  events.includes('*') ? 'Todos os eventos do sistema'
    : events.map(e => models.find(m => `${m.key}.*` === e)?.label ?? e).join(', ');

export function OutboundWebhooks() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const text = isDark ? '#fff' : '#0D1F4E';

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [models, setModels] = useState<ModelOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ open: boolean; ep: Endpoint | null }>({ open: false, ep: null });
  const [secret, setSecret] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Endpoint | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showDoc, setShowDoc] = useState(false);

  const load = useCallback(async () => {
    try {
      const [er, dr] = await Promise.all([fetch('/api/webhook-endpoints'), fetch('/api/webhook-deliveries?limit=40')]);
      const [e, d] = await Promise.all([er.json(), dr.json()]);
      setEndpoints(Array.isArray(e) ? e : []);
      setDeliveries(Array.isArray(d) ? d : []);
    } catch { toast('Não deu para carregar os webhooks de saída.', 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); fetch('/api/system/event-models').then(r => r.json()).then(setModels).catch(() => {}); }, [load]);
  useEffect(() => { const id = setInterval(load, 6000); return () => clearInterval(id); }, [load]);

  const copy = async (v: string) => { try { await navigator.clipboard.writeText(v); toast('Copiado', 'success'); } catch { toast('Não deu para copiar.', 'error'); } };

  async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro');
    return data;
  }

  const toggle = async (ep: Endpoint) => {
    try { await api(`/api/webhook-endpoints/${ep.id}`, 'PATCH', { active: !ep.active }); load(); } catch (e: any) { toast(e.message, 'error'); }
  };
  const test = async (ep: Endpoint) => {
    setTesting(ep.id);
    try {
      const r = await api(`/api/webhook-endpoints/${ep.id}/test`, 'POST');
      toast(r.ok ? `Entregue (HTTP ${r.status}, ${r.ms} ms)` : `Falhou: ${r.error}`, r.ok ? 'success' : 'error');
      load();
    } catch (e: any) { toast(e.message, 'error'); } finally { setTesting(null); }
  };
  const regenerate = async (ep: Endpoint) => {
    if (!confirm('Gerar uma nova chave? A antiga deixa de valer e o outro sistema precisa ser atualizado.')) return;
    try { setSecret((await api(`/api/webhook-endpoints/${ep.id}/regenerate-secret`, 'POST')).secret); load(); } catch (e: any) { toast(e.message, 'error'); }
  };
  const remove = async () => {
    if (!deleting) return;
    try { await api(`/api/webhook-endpoints/${deleting.id}`, 'DELETE'); toast('Webhook removido', 'success'); load(); }
    catch (e: any) { toast(e.message, 'error'); } finally { setDeleting(null); }
  };
  const retry = async (d: Delivery) => {
    try { await api(`/api/webhook-deliveries/${d.id}/retry`, 'POST'); toast('Reenvio agendado', 'success'); load(); } catch (e: any) { toast(e.message, 'error'); }
  };

  const chip = (d: Delivery) => d.status === 'success' ? { l: 'Entregue', c: '#15803D', bg: 'rgba(21,128,61,0.1)', I: CheckCircle2 }
    : d.status === 'failed' ? { l: 'Falhou', c: '#DC2626', bg: 'rgba(220,38,38,0.1)', I: AlertTriangle }
    : { l: 'Na fila', c: '#C49A2A', bg: 'rgba(196,154,42,0.12)', I: Clock };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400 max-w-2xl">
          Avise outros sistemas (ERP, planilha, automações) de <b>tudo</b> que acontece aqui: cada vez que algo é <b>criado, alterado ou excluído</b>
          — clientes, financeiro, projetos, vendas, atendimentos — o sistema envia um aviso assinado para os endereços abaixo.
        </p>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setForm({ open: true, ep: null })}>NOVO WEBHOOK</Button>
      </div>

      {loading ? <div className="text-center py-10 text-slate-400">Carregando…</div> : endpoints.length === 0 ? (
        <EmptyState icon={Webhook} title="Nenhum webhook de saída" description="Cadastre o endereço de outro sistema para receber os avisos."
          action={<Button onClick={() => setForm({ open: true, ep: null })}>NOVO WEBHOOK</Button>} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {endpoints.map(ep => (
            <div key={ep.id} className={`bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 ${ep.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: text }}>{ep.name}</p>
                  <p className="text-xs text-slate-400 truncate">{ep.url}</p>
                </div>
                <button onClick={() => toggle(ep)} title={ep.active ? 'Desativar' : 'Ativar'}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black ${ep.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {ep.active ? 'ATIVO' : 'PAUSADO'}
                </button>
                <RowMenu items={[
                  { label: 'Editar', icon: Edit2, onClick: () => setForm({ open: true, ep }) },
                  { label: 'Gerar nova chave', icon: KeyRound, onClick: () => regenerate(ep) },
                  { label: 'Excluir', icon: Trash2, danger: true, onClick: () => setDeleting(ep) },
                ]} />
              </div>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{summary(ep.events, models)}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[11px] text-slate-400">
                  7 dias: <b className="text-green-600">{ep.stats.success} ✓</b> · <b className="text-red-500">{ep.stats.failed} ✗</b> · <b className="text-amber-600">{ep.stats.pending} ⏳</b>
                  <span className="ml-2">chave {ep.secretPreview}</span>
                </p>
                <Button size="sm" variant="outline" loading={testing === ep.id} iconLeft={<Send className="w-3.5 h-3.5" />} onClick={() => test(ep)}>Testar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Histórico */}
      <section className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
          <p className="text-sm font-black" style={{ color: text }}>Envios recentes</p>
          <p className="text-[11px] text-slate-400">Se o outro sistema não responder, o envio é tentado de novo (1 min, 5 min, 15 min, 1 h, 6 h) até 6 vezes.</p>
        </div>
        {deliveries.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">Nenhum envio ainda. Faça uma alteração no sistema ou use "Testar".</p> : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {deliveries.map(d => {
              const c = chip(d);
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: c.bg, color: c.c }}><c.I className="w-3 h-3" />{c.l}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700 dark:text-slate-200 truncate"><b>{d.event}</b> <span className="text-slate-400">→ {d.endpointName}</span></p>
                    {(d.lastError || d.lastStatusCode) && d.status !== 'success' && <p className="text-red-500 truncate">{d.lastError ?? `HTTP ${d.lastStatusCode}`} · {d.attempts} tentativa(s)</p>}
                    {d.status === 'success' && <p className="text-slate-400">HTTP {d.lastStatusCode} · {d.durationMs} ms</p>}
                  </div>
                  <span className="text-slate-400 flex-shrink-0">{format(new Date(d.createdAt), 'dd/MM HH:mm:ss')}</span>
                  {d.status !== 'success' && d.eventId !== 0 && (
                    <button onClick={() => retry(d)} title="Reenviar agora" className="p-1.5 rounded text-slate-400 hover:text-indigo-500"><RotateCcw className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Como o outro sistema valida */}
      <section className="rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
        <button onClick={() => setShowDoc(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-500">
          <span>Como o outro sistema recebe e confere o aviso</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDoc ? 'rotate-180' : ''}`} />
        </button>
        {showDoc && (
          <div className="px-4 pb-4 space-y-2 text-xs text-slate-500">
            <p>Cada aviso é um <b>POST</b> em JSON. O cabeçalho <code>X-Develoi-Signature</code> traz <code>sha256=</code> + o HMAC-SHA256 do corpo, calculado com a chave do webhook. Responda <b>2xx</b> para confirmar.</p>
            <pre className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 overflow-x-auto text-[11px]">{`{
  "id": "…",                    // id do envio
  "event": "client.updated",     // tabela.ação (created | updated | deleted)
  "occurredAt": "2026-10-02T20:30:18.000Z",
  "model": "Client", "action": "updated", "recordId": "…",
  "data": { …registro, sem senhas… }
}
// Node: crypto.createHmac('sha256', chave).update(corpoBruto).digest('hex')`}</pre>
          </div>
        )}
      </section>

      {form.open && <EndpointForm ep={form.ep} models={models} onClose={() => setForm({ open: false, ep: null })}
        onSaved={(s) => { setForm({ open: false, ep: null }); if (s) setSecret(s); load(); }} />}

      {secret && (
        <Modal isOpen onClose={() => setSecret(null)} title="Chave do webhook" size="sm"
          footer={<Button fullWidth onClick={() => setSecret(null)}>ENTENDI, JÁ COPIEI</Button>}>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Copie agora e coloque no outro sistema. <b>Por segurança ela não aparece de novo.</b></p>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2.5">
              <code className="text-xs flex-1 break-all" style={{ color: text }}>{secret}</code>
              <button onClick={() => copy(secret)} className="text-slate-400 hover:text-indigo-500" aria-label="Copiar"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Excluir webhook"
        message={`Excluir "${deleting?.name ?? ''}"? O histórico de envios dele também é apagado.`} confirmLabel="EXCLUIR" variant="danger" />
    </div>
  );
}

// ─── Cadastro / edição ───────────────────────────────────────────────────────

function EndpointForm({ ep, models, onClose, onSaved }: { ep: Endpoint | null; models: ModelOpt[]; onClose: () => void; onSaved: (secret?: string) => void }) {
  const { show: toast } = useToast();
  const [name, setName] = useState(ep?.name ?? '');
  const [url, setUrl] = useState(ep?.url ?? 'https://');
  const [all, setAll] = useState(ep ? ep.events.includes('*') : true);
  const [picked, setPicked] = useState<Set<string>>(new Set(ep && !ep.events.includes('*') ? ep.events : []));
  const [saving, setSaving] = useState(false);

  const toggleModel = (key: string) => setPicked(prev => { const n = new Set(prev); const p = `${key}.*`; n.has(p) ? n.delete(p) : n.add(p); return n; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!all && picked.size === 0) return toast('Escolha ao menos um tipo de evento (ou "Todos").', 'warning');
    setSaving(true);
    try {
      const body = { name, url, events: all ? ['*'] : [...picked] };
      const res = await fetch(ep ? `/api/webhook-endpoints/${ep.id}` : '/api/webhook-endpoints', {
        method: ep ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast(ep ? 'Webhook atualizado' : 'Webhook criado', 'success');
      onSaved(data.secret);
    } catch (err: any) { toast(err.message || 'Não deu para salvar.', 'error'); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={ep ? 'Editar webhook' : 'Novo webhook de saída'} size="lg"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="endpoint-form" loading={saving} fullWidth size="lg">{ep ? 'SALVAR' : 'CRIAR WEBHOOK'}</Button>
        </div>
      }>
      <form id="endpoint-form" onSubmit={submit} className="space-y-4">
        <Input label="Nome" required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex: ERP, Planilha, Zapier" />
        <Input label="Endereço que vai receber (URL)" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://seu-sistema.com/webhook" />

        <div>
          <label className="ds-label">Quais avisos enviar?</label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {([[true, 'Tudo', 'Qualquer criação, alteração ou exclusão'], [false, 'Escolher', 'Só de algumas áreas']] as [boolean, string, string][]).map(([v, t, sub]) => (
              <button type="button" key={t} onClick={() => setAll(v)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${all === v ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-100/70 dark:bg-white/5'}`}>
                <p className={`text-xs font-black ${all === v ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>{t}</p>
                <p className="text-[10px] text-slate-400">{sub}</p>
              </button>
            ))}
          </div>
          {!all && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {models.map(m => (
                <label key={m.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer ${picked.has(`${m.key}.*`) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10'}`}>
                  <input type="checkbox" className="accent-indigo-600" checked={picked.has(`${m.key}.*`)} onChange={() => toggleModel(m.key)} />
                  <span className="text-slate-600 dark:text-slate-300">{m.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400">Por segurança, não são aceitos endereços internos (localhost, redes privadas). Senhas e tokens nunca são enviados.</p>
      </form>
    </Modal>
  );
}
