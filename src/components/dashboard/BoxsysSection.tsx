import React, { useEffect, useState } from 'react';
import { Store, ExternalLink, Copy, Lock, Unlock, RefreshCw, Link2Off, AlertTriangle } from 'lucide-react';
import { Button, Modal, Input, Select } from '../ui';
import { useToast } from '../ui/Toast';
import type { Client } from './types';

interface Plan { id: number; name: string; price: number }
interface Access { url: string; email: string; password: string; sent: boolean }

// Loja do cliente no Store BoxSys: criar, ver o estado e bloquear/liberar.
// A regra automática: cliente ativo → loja liberada; pausado/bloqueado/cancelado → loja bloqueada.
export function BoxsysSection({ client, onChanged }: { client: Client; onChanged: () => void }) {
  const { show: toast } = useToast();
  const [cfg, setCfg] = useState<{ configured: boolean; url: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [form, setForm] = useState({ storeName: client.name, subdomain: '', ownerName: client.name, ownerEmail: client.email ?? '', planId: '', trialDays: '', sendAccess: !!client.phone });

  useEffect(() => { fetch('/api/boxsys/status').then(r => r.json()).then(setCfg).catch(() => {}); }, []);
  useEffect(() => {
    if (open && plans.length === 0) fetch('/api/boxsys/plans').then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
  }, [open, plans.length]);

  async function call(key: string, url: string, method = 'POST', body?: unknown) {
    setBusy(key);
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro');
      return data;
    } finally { setBusy(null); }
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const d = await call('create', `/api/clients/${client.id}/boxsys/create`, 'POST', form);
      setAccess({ ...d.access, sent: d.sent });
      setOpen(false);
      onChanged();
    } catch (err: any) { toast(err.message, 'error'); }
  };
  const act = async (key: string, url: string, method: string, okMsg: string) => {
    try { await call(key, url, method); toast(okMsg, 'success'); onChanged(); } catch (err: any) { toast(err.message, 'error'); }
  };
  const copy = async (v: string) => { try { await navigator.clipboard.writeText(v); toast('Copiado', 'success'); } catch { toast('Não deu para copiar.', 'error'); } };

  const linked = !!client.boxsysTenantId;
  const suspended = client.boxsysStatus === 'suspended';

  return (
    <section>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Store BoxSys</p>

      {cfg && !cfg.configured ? (
        <p className="text-xs text-slate-400 bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2.5">
          A ligação com o BoxSys ainda não foi configurada no servidor. Adicione <b>BOXSYS_API_KEY</b> (a mesma <i>EXTERNAL_API_KEY</i> do BoxSys) no .env e reinicie.
        </p>
      ) : !linked ? (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-400">Cria a loja deste cliente no Store BoxSys. Daí em diante, <b>pagou = loja liberada</b>; <b>passou da tolerância, pausado ou cancelado = loja bloqueada</b>, tudo sozinho.</p>
          <Button fullWidth variant="outline" iconLeft={<Store className="w-4 h-4" />} onClick={() => setOpen(true)}>CRIAR LOJA NO STORE BOXSYS</Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${suspended ? 'bg-red-50 dark:bg-red-500/10' : 'bg-green-50 dark:bg-green-500/10'}`}>
            <span className={`text-sm font-bold flex items-center gap-2 ${suspended ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
              {suspended ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />} Loja {suspended ? 'bloqueada' : 'liberada'}
            </span>
            {client.boxsysUrl && <a href={client.boxsysUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-500 flex items-center gap-1 hover:underline">{client.boxsysSubdomain} <ExternalLink className="w-3 h-3" /></a>}
          </div>
          {client.boxsysError && <p className="text-xs text-red-500 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> Última sincronização falhou: {client.boxsysError}</p>}
          <div className="grid grid-cols-2 gap-2">
            {suspended
              ? <Button size="sm" variant="outline" loading={busy === 'unblock'} iconLeft={<Unlock className="w-3.5 h-3.5" />} onClick={() => act('unblock', `/api/clients/${client.id}/boxsys/unblock`, 'POST', 'Loja liberada')}>Liberar</Button>
              : <Button size="sm" variant="outline" loading={busy === 'block'} iconLeft={<Lock className="w-3.5 h-3.5" />} onClick={() => act('block', `/api/clients/${client.id}/boxsys/block`, 'POST', 'Loja bloqueada')}>Bloquear</Button>}
            <Button size="sm" variant="outline" loading={busy === 'check'} iconLeft={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => act('check', `/api/clients/${client.id}/boxsys`, 'GET', 'Estado conferido no BoxSys')}>Conferir</Button>
          </div>
          <button className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1"
            onClick={() => { if (confirm('Desvincular? A loja continua existindo no BoxSys, só deixa de ser controlada por aqui.')) act('unlink', `/api/clients/${client.id}/boxsys`, 'DELETE', 'Vínculo removido'); }}>
            <Link2Off className="w-3 h-3" /> Desvincular da loja
          </button>
        </div>
      )}

      {open && (
        <Modal isOpen onClose={() => setOpen(false)} title="Criar loja no Store BoxSys" size="md"
          footer={<div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" form="boxsys-form" loading={busy === 'create'} fullWidth size="lg">CRIAR LOJA</Button></div>}>
          <form id="boxsys-form" onSubmit={create} className="space-y-4">
            <Input label="Nome da loja" required value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nome do responsável" required value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} />
              <Input label="E-mail de login" required type="email" value={form.ownerEmail} onChange={e => setForm({ ...form, ownerEmail: e.target.value })} />
            </div>
            <Input label="Endereço da loja (opcional)" value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value })} placeholder="ex.: minhaloja  →  minhaloja.boxsys.com.br" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Plano no BoxSys (opcional)" value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })}
                options={[{ value: '', label: 'Sem plano' }, ...plans.map(p => ({ value: String(p.id), label: p.name }))]} />
              <Input label="Dias de teste (opcional)" type="number" min="1" value={form.trialDays} onChange={e => setForm({ ...form, trialDays: e.target.value })} placeholder="30" />
            </div>
            <label className={`flex items-start gap-2.5 text-sm cursor-pointer ${client.phone ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300'}`}>
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-indigo-600" disabled={!client.phone} checked={form.sendAccess && !!client.phone} onChange={e => setForm({ ...form, sendAccess: e.target.checked })} />
              <span>Enviar o acesso no WhatsApp do cliente{!client.phone ? ' (sem WhatsApp cadastrado)' : ''}
                <span className="block text-[11px] text-slate-400">Link, e-mail e uma senha provisória gerada agora. Ela só aparece uma vez.</span></span>
            </label>
          </form>
        </Modal>
      )}

      {access && (
        <Modal isOpen onClose={() => setAccess(null)} title="Loja criada" size="sm" footer={<Button fullWidth onClick={() => setAccess(null)}>ENTENDI, JÁ COPIEI</Button>}>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">{access.sent ? 'O acesso já foi enviado no WhatsApp do cliente.' : 'Passe estes dados ao cliente.'} <b>A senha não aparece de novo.</b></p>
            {([['Endereço', access.url], ['E-mail', access.email], ['Senha provisória', access.password]] as const).map(([l, v]) => (
              <div key={l} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2">
                <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase text-slate-400">{l}</p><code className="text-xs break-all">{v}</code></div>
                <button onClick={() => copy(v)} className="text-slate-400 hover:text-indigo-500" aria-label={`Copiar ${l}`}><Copy className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}
