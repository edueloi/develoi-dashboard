import React, { useEffect, useState } from 'react';
import { Store, Download, Link2 } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useToast } from '../ui/Toast';

interface Tenant {
  id: number; name: string; subdomain?: string; status: string; trialEndsAt?: string | null; subscriptionAmount?: number; planName?: string | null;
  owner?: { name: string; email: string } | null;
  linkedClient: { id: string; name: string } | null;
  suggestedClient: { id: string; name: string } | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Ativa', cls: 'bg-green-100 text-green-700' },
  trial: { label: 'Em teste', cls: 'bg-amber-100 text-amber-700' },
  suspended: { label: 'Bloqueada', cls: 'bg-red-100 text-red-700' },
};

// Traz para a lista de clientes as lojas que já existem no Store BoxSys (cria o cliente ou vincula ao que já existe)
export function BoxsysImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { show: toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [skipped, setSkipped] = useState(0);

  useEffect(() => {
    fetch('/api/boxsys/tenants').then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Erro');
      const all: Tenant[] = d;
      // só entram lojas ativas (inclui as em teste) que ainda não estão aqui
      const list = all.filter(t => ['active', 'trial'].includes(t.status) && !t.linkedClient);
      setSkipped(all.length - list.length);
      setTenants(list);
      setPicked(new Set(list.map(t => t.id)));
    }).catch(e => setError(e.message));
  }, []);

  const toggle = (id: number) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pending = (tenants ?? []).filter(t => !t.linkedClient);

  const run = async () => {
    setBusy(true);
    try {
      const items = pending.filter(t => picked.has(t.id)).map(t => ({ tenantId: t.id, clientId: t.suggestedClient?.id }));
      const res = await fetch('/api/boxsys/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Erro');
      toast(`${d.created} cliente(s) criado(s), ${d.linked} vinculado(s)`, 'success');
      onDone();
    } catch (e: any) { toast(e.message, 'error'); }
    setBusy(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Importar do Store BoxSys" size="lg"
      footer={<div className="flex gap-2"><Button variant="outline" onClick={onClose}>Fechar</Button>
        <Button fullWidth size="lg" loading={busy} disabled={!picked.size} iconLeft={<Download className="w-4 h-4" />} onClick={run}>IMPORTAR {picked.size || ''} SELECIONADA(S)</Button></div>}>
      {error ? <p className="text-sm text-red-500">{error}</p>
        : !tenants ? <p className="text-sm text-slate-400 text-center py-8">Buscando lojas no BoxSys…</p>
        : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Mostrando só lojas <b>ativas ou em teste</b> que ainda não são clientes{skipped ? ` (${skipped} ocultada(s): bloqueadas ou já importadas)` : ''}. Cada loja marcada vira um cliente aqui (ou é ligada ao cliente de mesmo e-mail). O estado de acesso passa a ser controlado pelos pagamentos deste sistema.</p>
            <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-xl border border-slate-200/70 dark:border-white/10">
              {tenants.map(t => {
                const st = STATUS[t.status] ?? { label: t.status, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <label key={t.id} className={`flex items-start gap-3 px-3 py-2.5 ${t.linkedClient ? 'opacity-60' : 'cursor-pointer'}`}>
                    <input type="checkbox" className="w-4 h-4 mt-1 accent-indigo-600" disabled={!!t.linkedClient} checked={picked.has(t.id)} onChange={() => toggle(t.id)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold flex items-center gap-2 flex-wrap"><Store className="w-3.5 h-3.5 text-slate-400" />{t.name}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${st.cls}`}>{st.label}</span></p>
                      <p className="text-[11px] text-slate-400 truncate">{t.owner?.email || 'sem e-mail'}{t.subdomain ? ` · ${t.subdomain}` : ''}{t.planName ? ` · ${t.planName}` : ''}
                        {t.trialEndsAt ? (new Date(t.trialEndsAt) > new Date() ? ` · teste até ${new Date(t.trialEndsAt).toLocaleDateString('pt-BR')}` : ` · teste venceu em ${new Date(t.trialEndsAt).toLocaleDateString('pt-BR')}`) : ''}</p>
                      {t.linkedClient && <p className="text-[11px] text-green-600 flex items-center gap-1"><Link2 className="w-3 h-3" /> já é o cliente {t.linkedClient.name}</p>}
                      {t.suggestedClient && <p className="text-[11px] text-indigo-500 flex items-center gap-1"><Link2 className="w-3 h-3" /> será ligada ao cliente {t.suggestedClient.name} (mesmo e-mail)</p>}
                    </div>
                  </label>
                );
              })}
              {tenants.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Nenhuma loja nova para importar.</p>}
            </div>
          </div>
        )}
    </Modal>
  );
}
