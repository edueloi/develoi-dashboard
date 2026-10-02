import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Plus, Edit2, Trash2, DollarSign, Clock, ShieldAlert, Cake, FolderOpen, X, Phone, Mail,
  Banknote, CalendarCheck, MessageCircle, CheckCircle2, CreditCard, ExternalLink, FileText, RefreshCw, Send,
} from 'lucide-react';
import { Button, Modal, ConfirmModal, Input, Select, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Client, ClientStatus, AsaasCharge } from './types';
import { format, differenceInCalendarDays, differenceInMonths } from 'date-fns';
import { money, parseDay, fmtDate, startOfToday, Stat, RowMenu } from './financeShared';
import { clientState, dueText, ReceiveModal, buildWhatsAppLink } from './ReceivablesManager';
import { AsaasWebhookStatus } from './AsaasWebhookStatus';
import { BoxsysSection } from './BoxsysSection';
import { BoxsysImportModal } from './BoxsysImport';
import { useLiveEvents } from '../../lib/liveEvents';
import { ClientFormModal, CYCLE_LABEL } from './ClientForm';

type Filter = 'all' | 'active' | 'late' | 'inactive';

const STATUS_LABEL: Record<ClientStatus, string> = { active: 'Ativo', paused: 'Pausado', cancelled: 'Cancelado' };

// "há 1 ano e 3 meses" a partir da data de início da assinatura
function tenure(startIso?: string | null) {
  const start = parseDay(startIso);
  if (!start) return null;
  const months = differenceInMonths(new Date(), start);
  if (months < 1) return 'menos de 1 mês';
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const y = Math.floor(months / 12), m = months % 12;
  return `${y} ${y === 1 ? 'ano' : 'anos'}${m ? ` e ${m} ${m === 1 ? 'mês' : 'meses'}` : ''}`;
}

function birthdayIn(birthIso: string | undefined | null, today: Date): number | null {
  const b = parseDay(birthIso);
  if (!b) return null;
  let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (differenceInCalendarDays(next, today) < 0) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
  return differenceInCalendarDays(next, today);
}

export function ClientsManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const text = isDark ? '#fff' : '#0D1F4E';

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ uid: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [formState, setFormState] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [importOpen, setImportOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [receiveOf, setReceiveOf] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const today = useMemo(startOfToday, []);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const [cr, pr, ur] = await Promise.all([
        fetch('/api/clients'),
        fetch(`/api/projects?userId=${profile?.uid ?? ''}&isAdmin=${isAdmin}`),
        fetch('/api/users'),
      ]);
      const [clientsData, projectsData, usersData] = await Promise.all([cr.json(), pr.json(), ur.json()]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData.map((p: any) => ({ id: p.id, name: p.name })) : []);
      setUsers(Array.isArray(usersData) ? usersData.map((u: any) => ({ uid: u.uid, displayName: u.displayName })) : []);
    } catch {
      if (!silent) toast('Não deu para carregar os clientes agora. Tente de novo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, profile?.uid, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Atualiza sozinho assim que algo muda (pagamento do Asaas, outra pessoa editando, bot…)
  useLiveEvents(['Client', 'ClientPayment', 'AsaasCharge', 'ClientProject', 'Project'], () => fetchData(true));


  const stateKey = (c: Client) => clientState(c, today).key;
  const isLate = (c: Client) => ['overdue', 'blocked'].includes(stateKey(c));
  const isInactive = (c: Client) => c.status !== 'active';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter(c => {
        if (filter === 'active' && c.status !== 'active') return false;
        if (filter === 'late' && !isLate(c)) return false;
        if (filter === 'inactive' && !isInactive(c)) return false;
        return !q || c.name.toLowerCase().includes(q) || (c.businessName ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.phone ?? '').includes(q) || (c.document ?? '').includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, filter, search]); // eslint-disable-line

  const active = clients.filter(c => c.status === 'active');
  const mrr = active.reduce((a, c) => a + (c.billingCycle === 'one_time' ? 0 : c.billingCycle === 'yearly' ? c.billingValue / 12 : c.billingValue), 0);
  const soon = clients.filter(c => stateKey(c) === 'soon').length;
  const late = clients.filter(isLate).length;

  const undoPayment = async (id: string) => {
    try {
      const res = await fetch(`/api/client-payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Recebimento desfeito', 'success');
      fetchData();
    } catch { toast('Não deu para desfazer agora.', 'error'); }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/clients/${deleting.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Cliente removido', 'success');
      fetchData();
    } catch { toast('Não deu para remover agora. Tente de novo.', 'error'); }
    finally { setDeleting(null); }
  };

  const viewing = clients.find(c => c.id === viewingId) ?? null;
  const openNew = () => setFormState({ open: true, client: null });

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: `Todos (${clients.length})` },
    { value: 'active', label: `Ativos (${active.length})` },
    { value: 'late', label: late ? `Atrasados (${late})` : 'Atrasados' },
    { value: 'inactive', label: 'Pausados / cancelados' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>Clientes</h2>
          <p className="text-xs text-slate-400 mt-0.5">Quem são, desde quando assinam, quanto pagam e quando vence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>IMPORTAR DO BOXSYS</Button>
          <Button iconLeft={<Plus className="w-4 h-4" />} onClick={openNew}>NOVO CLIENTE</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Stat label="Clientes ativos" value={String(active.length)} color="#2563EB" icon={Users} text={text} />
        <Stat label="Receita mensal" value={money(mrr)} color="#15803D" icon={DollarSign} text={text} />
        <Stat label="Vencendo em breve" value={String(soon)} color="#C49A2A" icon={Clock} text={text} />
        <Stat label="Atrasados" value={String(late)} color="#DC2626" icon={ShieldAlert} text={text} />
      </div>

      <AsaasWebhookStatus />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start overflow-x-auto max-w-full">
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filter === f.value ? 'bg-white dark:bg-white/15 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
              style={filter === f.value ? { color: f.value === 'late' ? '#DC2626' : text } : undefined}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, telefone ou CPF/CNPJ…" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Cadastre um cliente ou converta uma venda fechada." action={<Button onClick={openNew}>NOVO CLIENTE</Button>} />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
          {filtered.map(c => {
            const st = clientState(c, today);
            const since = tenure(c.startDate);
            const bday = birthdayIn(c.birthDate, today);
            const systems = (c.projects ?? []).map(p => p.project?.name).filter(Boolean).join(', ');
            const canReceive = !!c.nextDueDate && c.status !== 'cancelled';
            return (
              <div key={c.id} onClick={() => setViewingId(c.id)}
                className="flex items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black" style={{ background: st.bg, color: st.color }}>
                  {c.name.trim()[0]?.toUpperCase() ?? '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold truncate" style={{ color: text }}>{c.name}{c.businessName && <span className="font-medium text-slate-400"> · {c.businessName}</span>}</p>
                    {c.status !== 'active' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: st.bg, color: st.color }}>{STATUS_LABEL[c.status]}</span>
                    )}
                    {bday !== null && bday <= 7 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'rgba(236,72,153,0.1)', color: '#DB2777' }}>
                        <Cake className="w-3 h-3" /> {bday === 0 ? 'Aniversário hoje' : `Aniversário em ${bday}d`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {since ? <span>Cliente há {since}</span> : <span>Sem data de início</span>}
                    {c.sale?.productName && <span>· {c.sale.productName}</span>}
                    {systems && <span className="inline-flex items-center gap-1 truncate">· <FolderOpen className="w-3 h-3" />{systems}</span>}
                    {c.boxsysTenantId && <span className={`font-bold ${c.boxsysStatus === 'suspended' ? 'text-red-500' : 'text-green-600'}`}>· BoxSys {c.boxsysStatus === 'suspended' ? 'bloqueado' : 'liberado'}</span>}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black" style={{ color: text }}>{c.billingValue > 0 ? money(c.billingValue) : '—'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: st.key === 'overdue' || st.key === 'blocked' ? st.color : '#94A3B8' }}>
                    {CYCLE_LABEL[c.billingCycle]} · {st.label}
                  </p>
                </div>

                <div onClick={e => e.stopPropagation()} className="flex items-center gap-1">
                  {canReceive && <Button size="sm" onClick={() => setReceiveOf(c)}>Receber</Button>}
                  <RowMenu items={[
                    { label: 'Ver detalhes', icon: Users, onClick: () => setViewingId(c.id) },
                    ...(canReceive ? [{ label: 'Registrar recebimento', icon: Banknote, onClick: () => setReceiveOf(c) }] : []),
                    { label: 'Editar', icon: Edit2, onClick: () => setFormState({ open: true, client: c }) },
                    { label: 'Excluir', icon: Trash2, danger: true, onClick: () => setDeleting(c) },
                  ]} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {importOpen && <BoxsysImportModal onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); fetchData(); }} />}

      {formState.open && (
        <ClientFormModal
          client={formState.client}
          users={users}
          onClose={() => setFormState({ open: false, client: null })}
          onSaved={() => { setFormState({ open: false, client: null }); fetchData(); }}
        />
      )}

      {viewing && (
        <ClientDetailModal
          client={viewing}
          projects={projects}
          today={today}
          onClose={() => setViewingId(null)}
          onChanged={fetchData}
          onEdit={() => { setViewingId(null); setFormState({ open: true, client: viewing }); }}
          onReceive={() => setReceiveOf(viewing)}
        />
      )}

      {receiveOf && (
        <ReceiveModal
          client={clients.find(c => c.id === receiveOf.id) ?? receiveOf}
          today={today}
          onClose={() => setReceiveOf(null)}
          onChanged={fetchData}
          onUndo={undoPayment}
        />
      )}

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        title="Remover cliente"
        message={`Remover ${deleting?.name ?? 'este cliente'}? O histórico de recebimentos dele também é apagado. Essa ação não pode ser desfeita.`}
        confirmLabel="REMOVER"
        variant="danger"
      />
    </div>
  );
}

// ─── Detalhe ─────────────────────────────────────────────────────────────────

function ClientDetailModal({ client, projects, today, onClose, onChanged, onEdit, onReceive }: {
  client: Client; projects: { id: string; name: string }[]; today: Date;
  onClose: () => void; onChanged: () => void; onEdit: () => void; onReceive: () => void;
}) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const text = isDark ? '#fff' : '#0D1F4E';
  const st = clientState(client, today);
  const since = tenure(client.startDate);
  const [addProjectId, setAddProjectId] = useState('');
  const [linking, setLinking] = useState(false);

  // ── cobrança automática (Asaas) ──
  const [asaas, setAsaas] = useState<{ configured: boolean; env: string; webhookTokenSet: boolean } | null>(null);
  const [charges, setCharges] = useState<AsaasCharge[]>([]);
  const [billingType, setBillingType] = useState('UNDEFINED');
  const [sendLink, setSendLink] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const hasAsaas = !!client.asaasCustomerId || !!client.asaasSubscriptionId;

  const loadCharges = useCallback(async () => {
    try {
      const r = await fetch(`/api/clients/${client.id}/asaas/charges`);
      if (r.ok) setCharges(await r.json());
    } catch {}
  }, [client.id]);

  useEffect(() => { fetch('/api/asaas/status').then(r => r.json()).then(setAsaas).catch(() => {}); }, []);
  useEffect(() => { if (hasAsaas) loadCharges(); }, [hasAsaas, loadCharges]);

  async function asaasCall(key: string, url: string, method: string, body: any, ok: (d: any) => string) {
    setBusy(key);
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast(ok(data), 'success');
      onChanged();
      loadCharges();
    } catch (e: any) { toast(e.message || 'Não deu para concluir agora.', 'error'); }
    finally { setBusy(null); }
  }

  const linkedIds = new Set((client.projects ?? []).map(p => p.projectId));
  const available = projects.filter(p => !linkedIds.has(p.id));
  const commission = client.commissionType === 'percentage' ? (client.billingValue * (client.commissionValue ?? 0)) / 100
    : client.commissionType === 'fixed' ? (client.commissionValue ?? 0) : null;
  const totalReceived = (client.payments ?? []).reduce((a, p) => a + p.amount, 0);

  const link = async () => {
    if (!addProjectId) return;
    setLinking(true);
    try {
      await fetch(`/api/clients/${client.id}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: addProjectId }) });
      setAddProjectId('');
      onChanged();
    } catch { toast('Não deu para vincular agora.', 'error'); }
    finally { setLinking(false); }
  };
  const unlink = async (projectId: string) => {
    try { await fetch(`/api/clients/${client.id}/projects/${projectId}`, { method: 'DELETE' }); onChanged(); }
    catch { toast('Não deu para desvincular agora.', 'error'); }
  };

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-right" style={{ color: text }}>{value}</span>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Cliente"
      size="md"
      footer={
        <div className="flex gap-2">
          {client.phone && (
            <a href={buildWhatsAppLink(client)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 rounded-xl text-white font-bold text-sm hover:opacity-90" style={{ background: '#15803D' }}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {!!client.nextDueDate && client.status !== 'cancelled' && <Button variant="outline" onClick={onReceive}>Receber</Button>}
          <Button fullWidth onClick={onEdit} iconLeft={<Edit2 className="w-4 h-4" />}>EDITAR</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: st.bg }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black bg-white/60 dark:bg-white/10" style={{ color: st.color }}>
            {client.name.trim()[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-base font-black truncate" style={{ color: text }}>{client.name}</p>
            {client.businessName && <p className="text-xs font-semibold text-slate-500 truncate">{client.businessName}</p>}
            <p className="text-xs font-bold" style={{ color: st.color }}>{st.label} · {dueText(client, today)}</p>
          </div>
        </div>

        <section>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5" /> Assinatura</p>
          <Row label="Valor" value={client.billingValue > 0 ? `${money(client.billingValue)} / ${CYCLE_LABEL[client.billingCycle].toLowerCase()}` : 'A definir'} />
          <Row label="Cliente desde" value={client.startDate ? `${fmtDate(client.startDate)}${since ? ` · ${since}` : ''}` : '—'} />
          <Row label="Próximo vencimento" value={fmtDate(client.nextDueDate)} />
          <Row label="Último recebimento" value={client.lastPaidAt ? fmtDate(client.lastPaidAt) : '—'} />
          {totalReceived > 0 && <Row label="Recebido (últimos)" value={money(totalReceived)} />}
          {client.sale?.productName && <Row label="Plano" value={client.sale.productName} />}
        </section>


        <section>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Cobrança automática (Asaas)</p>

          {asaas && !asaas.configured ? (
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2.5">
              O Asaas ainda não foi configurado no servidor. Adicione <b>ASAAS_API_KEY</b> no .env e reinicie.
            </p>
          ) : !client.asaasSubscriptionId && !charges.length ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Cria a assinatura no Asaas. O bot manda o link de pagamento ao cliente e, quando ele paga, o recebimento entra sozinho e ele recebe o comprovante.</p>
              {!client.document && <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">Cadastre o CPF/CNPJ do cliente (em Editar). O Asaas exige para gerar a cobrança.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select label="Forma de pagamento" value={billingType} onChange={e => setBillingType(e.target.value)}
                  options={[{ value: 'UNDEFINED', label: 'O cliente escolhe' }, { value: 'PIX', label: 'Pix' }, { value: 'BOLETO', label: 'Boleto' }, { value: 'CREDIT_CARD', label: 'Cartão de crédito' }]} />
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 sm:pt-6 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={sendLink} onChange={e => setSendLink(e.target.checked)} />
                  Enviar o link no WhatsApp agora
                </label>
              </div>
              <Button fullWidth loading={busy === 'subscribe'} disabled={!client.document}
                onClick={() => asaasCall('subscribe', `/api/clients/${client.id}/asaas/subscribe`, 'POST', { billingType, sendLink },
                  d => d.sent ? 'Assinatura criada e link enviado no WhatsApp' : 'Assinatura criada no Asaas')}>
                CRIAR ASSINATURA NO ASAAS
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-500/10 px-3 py-2.5">
                <span className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />
                  {client.asaasSubscriptionId ? 'Assinatura ativa no Asaas' : 'Cobrança criada no Asaas'}
                </span>
                {asaas && <span className="text-[10px] font-bold uppercase text-green-700/70">{asaas.env === 'production' ? 'produção' : 'teste (sandbox)'}</span>}
              </div>

              {charges.length > 0 && (
                <div className="space-y-1.5">
                  {charges.slice(0, 5).map(ch => {
                    const paid = ch.status === 'RECEIVED' || ch.status === 'CONFIRMED';
                    const href = (paid ? ch.receiptUrl : ch.invoiceUrl) || null;
                    return (
                      <div key={ch.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-white/10 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${paid ? 'bg-green-100 text-green-700' : ch.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {paid ? 'PAGO' : ch.status === 'OVERDUE' ? 'ATRASADO' : 'ABERTO'}
                          </span>
                          <b>{money(ch.value)}</b>
                          <span className="text-xs text-slate-400">{fmtDate(ch.dueDate)}</span>
                        </span>
                        {href && (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-500 flex items-center gap-1 hover:underline">
                            {paid ? 'Comprovante' : 'Abrir fatura'} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" loading={busy === 'invoice'} iconLeft={<Send className="w-3.5 h-3.5" />}
                  onClick={() => asaasCall('invoice', `/api/clients/${client.id}/asaas/send-invoice`, 'POST', null, () => 'Fatura enviada no WhatsApp')}>
                  Enviar fatura
                </Button>
                <Button size="sm" variant="outline" loading={busy === 'statement'} iconLeft={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => asaasCall('statement', `/api/clients/${client.id}/asaas/send-statement`, 'POST', null, () => 'Extrato enviado no WhatsApp')}>
                  Enviar extrato
                </Button>
                <Button size="sm" variant="outline" loading={busy === 'sync'} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => asaasCall('sync', `/api/clients/${client.id}/asaas/sync`, 'POST', null, () => 'Cobranças atualizadas')}>
                  Atualizar
                </Button>
                {client.asaasSubscriptionId && (
                  <Button size="sm" variant="outline" loading={busy === 'cancel'}
                    onClick={() => { if (confirm('Cancelar a assinatura no Asaas? As próximas cobranças deixam de ser geradas.')) asaasCall('cancel', `/api/clients/${client.id}/asaas/subscription`, 'DELETE', null, () => 'Assinatura cancelada no Asaas'); }}>
                    Cancelar assinatura
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        <BoxsysSection client={client} onChanged={onChanged} />

        <section>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contato</p>
          <Row label="WhatsApp" value={client.phone ?? '—'} />
          <Row label="E-mail" value={client.email ?? '—'} />
          <Row label="CPF / CNPJ" value={client.document ?? '—'} />
          <Row label="Aniversário" value={client.birthDate ? format(parseDay(client.birthDate)!, 'dd/MM') : '—'} />
        </section>

        {(client.soldByName || commission !== null) && (
          <section>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Venda</p>
            <Row label="Vendido por" value={client.soldByName ?? '—'} />
            <Row label="Comissão" value={commission !== null ? money(commission) : '—'} />
          </section>
        )}

        <section>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Sistemas</p>
          <div className="space-y-1.5 mb-2">
            {(client.projects ?? []).length === 0 && <p className="text-xs text-slate-400">Nenhum sistema vinculado.</p>}
            {(client.projects ?? []).map(p => (
              <div key={p.projectId} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2">
                <span className="text-sm font-medium" style={{ color: text }}>{p.project?.name ?? p.projectId}</span>
                <button onClick={() => unlink(p.projectId)} className="text-slate-300 hover:text-red-500" aria-label="Desvincular"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          {available.length > 0 && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Select aria-label="Vincular sistema" value={addProjectId} onChange={e => setAddProjectId(e.target.value)}
                  options={[{ value: '', label: 'Vincular um sistema…' }, ...available.map(p => ({ value: p.id, label: p.name }))]} />
              </div>
              <Button size="md" onClick={link} loading={linking} disabled={!addProjectId}>Vincular</Button>
            </div>
          )}
        </section>

        {(client.payments ?? []).length > 0 && (
          <section>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5" /> Recebimentos</p>
            <div className="space-y-1.5">
              {(client.payments ?? []).slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-white/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /><b>{money(p.amount)}</b></span>
                  <span className="flex items-center gap-3 text-xs text-slate-400">
                    {fmtDate(p.paidAt)}{p.method ? ` · ${p.method}` : ''}
                    <a href={`/api/client-payments/${p.id}/receipt.pdf`} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-500 hover:underline flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Recibo
                    </a>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {client.notes && (
          <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observações</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{client.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
