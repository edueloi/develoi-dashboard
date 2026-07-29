import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Edit2, Trash2, DollarSign, CheckCircle2, AlertCircle,
  Clock, ShieldAlert, Cake, Phone, FolderOpen, X,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, Textarea, EmptyState,
  FilterLine, FilterLineSearch, FilterLineSection, FilterLineItem, DatePicker,
} from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Client, ClientStatus, BillingCycle, CommissionType } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Ativo',      color: '#15803D', bg: 'rgba(21,128,61,0.1)' },
  paused:    { label: 'Pausado',    color: '#C49A2A', bg: 'rgba(196,154,42,0.1)' },
  cancelled: { label: 'Cancelado',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Mensal', yearly: 'Anual', custom: 'Personalizado', one_time: 'Único',
};

type BillingAlert = 'ok' | 'upcoming' | 'overdue' | 'blocked_risk';

const BILLING_ALERT_CONFIG: Record<BillingAlert, { label: string; color: string; bg: string; icon: any }> = {
  ok:           { label: 'Em dia',           color: '#15803D', bg: 'rgba(21,128,61,0.1)',  icon: CheckCircle2 },
  upcoming:     { label: 'Vence em breve',   color: '#C49A2A', bg: 'rgba(196,154,42,0.1)', icon: Clock },
  overdue:      { label: 'Vencido',          color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  icon: AlertCircle },
  blocked_risk: { label: 'Risco de bloqueio',color: '#7F1D1D', bg: 'rgba(127,29,29,0.12)', icon: ShieldAlert },
};

function getBillingAlert(client: Client, today: Date): BillingAlert | null {
  if (!client.nextDueDate) return null;
  const diff = differenceInCalendarDays(new Date(client.nextDueDate), today);
  if (diff > client.reminderDaysBefore) return 'ok';
  if (diff >= 0) return 'upcoming';
  if (-diff <= client.graceDaysAfter) return 'overdue';
  return 'blocked_risk';
}

function getBirthdayDaysAway(birthDate: string | undefined, today: Date): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  let diff = differenceInCalendarDays(next, today);
  if (diff < 0) diff = differenceInCalendarDays(new Date(today.getFullYear() + 1, b.getMonth(), b.getDate()), today);
  return diff;
}

export function ClientsManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile, isAdmin } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ uid: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ClientStatus>('all');
  const [filterAlert, setFilterAlert] = useState<'all' | BillingAlert>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = new Date();

  const fetchData = useCallback(async () => {
    try {
      const [clientsRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/clients'),
        fetch(`/api/projects?userId=${profile?.uid ?? ''}&isAdmin=${isAdmin}`),
        fetch('/api/users'),
      ]);
      const [clientsData, projectsData, usersData] = await Promise.all([
        clientsRes.json(), projectsRes.json(), usersRes.json(),
      ]);
      setClients(clientsData);
      setProjects(projectsData.map((p: any) => ({ id: p.id, name: p.name })));
      setUsers(usersData.map((u: any) => ({ uid: u.uid, displayName: u.displayName })));
    } catch {
      toast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, profile?.uid, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/clients/${deletingId}`, { method: 'DELETE' });
      setClients(prev => prev.filter(c => c.id !== deletingId));
      toast('Cliente removido', 'success');
    } catch {
      toast('Erro ao remover cliente', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.name.toLowerCase().includes(q)
      || (c.email?.toLowerCase().includes(q) ?? false);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const alert = getBillingAlert(c, today);
    const matchAlert = filterAlert === 'all' || alert === filterAlert;
    return matchSearch && matchStatus && matchAlert;
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const monthlyRevenue = activeClients
    .filter(c => c.billingCycle === 'monthly')
    .reduce((a, c) => a + c.billingValue, 0);
  const upcomingCount = clients.filter(c => getBillingAlert(c, today) === 'upcoming').length;
  const riskCount = clients.filter(c => {
    const a = getBillingAlert(c, today);
    return a === 'overdue' || a === 'blocked_risk';
  }).length;

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
            Clientes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Assinaturas, vencimentos e projetos dos seus clientes</p>
        </div>
        <Button
          iconLeft={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingClient(null); setIsFormOpen(true); }}
        >
          NOVO CLIENTE
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { label: 'Clientes Ativos', value: activeClients.length, icon: Users, color: '#2563EB', bg: 'rgba(37,99,235,0.08)', sub: 'em carteira' },
          { label: 'Receita Recorrente', value: monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#15803D', bg: 'rgba(21,128,61,0.08)', sub: 'mensal (ativos)' },
          { label: 'Vencendo em Breve', value: upcomingCount, icon: Clock, color: '#C49A2A', bg: 'rgba(196,154,42,0.08)', sub: 'próximos dias' },
          { label: 'Vencidos / Em Risco', value: riskCount, icon: ShieldAlert, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', sub: 'requer atenção' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="hidden sm:block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.sub}</span>
            </div>
            <p className="text-lg font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{s.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Faixa de alerta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(BILLING_ALERT_CONFIG) as BillingAlert[]).map(al => {
          const count = clients.filter(c => getBillingAlert(c, today) === al).length;
          const cfg = BILLING_ALERT_CONFIG[al];
          return (
            <button
              key={al}
              onClick={() => setFilterAlert(filterAlert === al ? 'all' : al)}
              className={`rounded-xl p-2.5 border text-left transition-all ${
                filterAlert === al ? 'shadow-md' : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:shadow-sm'
              }`}
              style={filterAlert === al ? { background: cfg.bg, borderColor: cfg.color } : {}}
            >
              <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
              <p className="text-lg font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <FilterLine className="rounded-xl p-2.5">
        <FilterLineSection grow>
          <FilterLineItem grow minWidth={180}>
            <FilterLineSearch value={search} onChange={setSearch} placeholder="Buscar cliente..." />
          </FilterLineItem>
        </FilterLineSection>
        <FilterLineSection align="right">
          <FilterLineItem>
            <Select
              aria-label="Filtrar por status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as 'all' | ClientStatus)}
              size="sm"
              className="min-w-[160px]"
              options={[
                { value: 'all', label: 'Todos os status' },
                ...(Object.keys(STATUS_CONFIG) as ClientStatus[]).map(s => ({ value: s, label: STATUS_CONFIG[s].label })),
              ]}
            />
          </FilterLineItem>
        </FilterLineSection>
      </FilterLine>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Cadastre um cliente ou converta uma venda fechada."
          action={<Button onClick={() => setIsFormOpen(true)}>NOVO CLIENTE</Button>}
        />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <AnimatePresence>
              {filtered.map((client, i) => {
                const statusCfg = STATUS_CONFIG[client.status];
                const alert = getBillingAlert(client, today);
                const alertCfg = alert ? BILLING_ALERT_CONFIG[alert] : null;
                const birthdayDays = getBirthdayDaysAway(client.birthDate, today);
                const isBirthdaySoon = birthdayDays !== null && birthdayDays <= 7;

                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setViewingClient(client)}
                    className="flex items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: statusCfg.bg }}>
                      <Users className="w-4 h-4" style={{ color: statusCfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                          {client.name}
                        </p>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                        {alertCfg && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0 flex items-center gap-1" style={{ background: alertCfg.bg, color: alertCfg.color }}>
                            <alertCfg.icon className="w-3 h-3" /> {alertCfg.label}
                          </span>
                        )}
                        {isBirthdaySoon && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0 flex items-center gap-1" style={{ background: 'rgba(236,72,153,0.1)', color: '#DB2777' }}>
                            <Cake className="w-3 h-3" /> {birthdayDays === 0 ? 'Aniversário hoje' : `Aniversário em ${birthdayDays}d`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {client.projects && client.projects.length > 0 && (
                          <span className="text-xs text-slate-400 truncate flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            {client.projects.map(p => p.project?.name).filter(Boolean).join(', ')}
                          </span>
                        )}
                        {client.nextDueDate && (
                          <span className="text-[10px] text-slate-300">
                            Vence em {format(new Date(client.nextDueDate), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                        {client.billingValue > 0
                          ? client.billingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{CYCLE_LABELS[client.billingCycle]}</p>
                    </div>

                    <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setEditingClient(client); setIsFormOpen(true); }}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(client.id)}
                        className="p-2 rounded-xl hover:bg-red-50 transition-colors text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ClientFormModal
          client={editingClient}
          users={users}
          onClose={() => setIsFormOpen(false)}
          onSaved={(c) => {
            if (editingClient) {
              setClients(prev => prev.map(x => x.id === c.id ? c : x));
            } else {
              setClients(prev => [c, ...prev]);
            }
            setIsFormOpen(false);
            toast(editingClient ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success');
          }}
        />
      )}

      {viewingClient && (
        <ClientDetailModal
          client={viewingClient}
          projects={projects}
          onClose={() => setViewingClient(null)}
          onChanged={(c) => {
            setClients(prev => prev.map(x => x.id === c.id ? c : x));
            setViewingClient(c);
          }}
        />
      )}

      {deletingId && (
        <ConfirmModal
          isOpen
          title="Remover Cliente"
          message="Tem certeza que deseja remover este cliente?"
          confirmLabel="REMOVER"
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}

// ─── ClientFormModal ────────────────────────────────────────────────────────

function ClientFormModal({
  client, users, onClose, onSaved,
}: {
  client: Client | null;
  users: { uid: string; displayName: string }[];
  onClose: () => void;
  onSaved: (c: Client) => void;
}) {
  const [name, setName] = useState(client?.name ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [birthDate, setBirthDate] = useState(client?.birthDate?.slice(0, 10) ?? '');
  const [status, setStatus] = useState<ClientStatus>(client?.status ?? 'active');
  const [billingValue, setBillingValue] = useState(client?.billingValue ?? 0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(client?.billingCycle ?? 'monthly');
  const [dueDay, setDueDay] = useState(client?.dueDay ?? 10);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(client?.reminderDaysBefore ?? 5);
  const [graceDaysAfter, setGraceDaysAfter] = useState(client?.graceDaysAfter ?? 7);
  const [soldById, setSoldById] = useState(client?.soldById ?? '');
  const [commissionType, setCommissionType] = useState<'' | CommissionType>(client?.commissionType ?? '');
  const [commissionValue, setCommissionValue] = useState(client?.commissionValue ?? 0);
  const [notes, setNotes] = useState(client?.notes ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const soldByName = users.find(u => u.uid === soldById)?.displayName;
      const body: Partial<Client> = {
        id: client?.id ?? uuidv4(),
        name,
        email: email || undefined,
        phone: phone || undefined,
        birthDate: birthDate || undefined,
        status,
        billingValue: Number(billingValue),
        billingCycle,
        dueDay: billingCycle === 'one_time' ? undefined : Number(dueDay),
        reminderDaysBefore: Number(reminderDaysBefore),
        graceDaysAfter: Number(graceDaysAfter),
        soldById: soldById || undefined,
        soldByName: soldById ? soldByName : undefined,
        commissionType: (commissionType || undefined) as CommissionType | undefined,
        commissionValue: commissionType ? Number(commissionValue) : undefined,
        notes: notes || undefined,
      };
      const url = client ? `/api/clients/${client.id}` : '/api/clients';
      const method = client ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      onSaved(await r.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={client ? 'Editar Cliente' : 'Novo Cliente'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome do Cliente" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" />
          <Input label="Telefone / WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(15) 99999-0000" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" />
          <div className="flex flex-col gap-1.5">
            <label className="ds-label">Data de Nascimento</label>
            <DatePicker value={birthDate || null} onChange={value => setBirthDate(value ?? '')} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value as ClientStatus)}>
            {(Object.keys(STATUS_CONFIG) as ClientStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </Select>
          <Input label="Valor (R$)" type="number" min="0" step="0.01" value={billingValue} onChange={e => setBillingValue(Number(e.target.value))} />
          <Select label="Ciclo de Cobrança" value={billingCycle} onChange={e => setBillingCycle(e.target.value as BillingCycle)}>
            {(Object.keys(CYCLE_LABELS) as BillingCycle[]).map(c => (
              <option key={c} value={c}>{CYCLE_LABELS[c]}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Dia do Vencimento"
            type="number" min="1" max="31"
            value={dueDay}
            onChange={e => setDueDay(Number(e.target.value))}
            disabled={billingCycle === 'one_time'}
            hint={billingCycle === 'one_time' ? undefined : 'O próximo vencimento é calculado e renovado automaticamente.'}
          />
          <Input label="Avisar (dias antes)" type="number" min="0" value={reminderDaysBefore} onChange={e => setReminderDaysBefore(Number(e.target.value))} />
          <Input label="Tolerância pós-venc. (dias)" type="number" min="0" value={graceDaysAfter} onChange={e => setGraceDaysAfter(Number(e.target.value))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Vendedor" value={soldById} onChange={e => setSoldById(e.target.value)} size="sm">
            <option value="">Não definido</option>
            {users.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
          </Select>
          <Select label="Tipo de Comissão" value={commissionType} onChange={e => setCommissionType(e.target.value as any)}>
            <option value="">Sem comissão</option>
            <option value="percentage">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </Select>
          {commissionType && (
            <Input
              label={commissionType === 'percentage' ? 'Comissão (%)' : 'Comissão (R$)'}
              type="number" min="0" step="0.01"
              value={commissionValue}
              onChange={e => setCommissionValue(Number(e.target.value))}
            />
          )}
        </div>

        <Textarea label="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />

        <Button type="submit" loading={loading} fullWidth size="lg">
          {client ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR CLIENTE'}
        </Button>
      </form>
    </Modal>
  );
}

// ─── ClientDetailModal ────────────────────────────────────────────────────────

function ClientDetailModal({
  client, projects, onClose, onChanged,
}: {
  client: Client;
  projects: { id: string; name: string }[];
  onClose: () => void;
  onChanged: (c: Client) => void;
}) {
  const { isDark } = useTheme();
  const statusCfg = STATUS_CONFIG[client.status];
  const [addProjectId, setAddProjectId] = useState('');
  const [linking, setLinking] = useState(false);

  const linkedIds = new Set((client.projects ?? []).map(p => p.projectId));
  const availableProjects = projects.filter(p => !linkedIds.has(p.id));

  const commissionAmount = client.commissionType === 'percentage'
    ? (client.billingValue * (client.commissionValue ?? 0)) / 100
    : client.commissionType === 'fixed'
      ? (client.commissionValue ?? 0)
      : null;

  const refetchClient = async () => {
    const r = await fetch('/api/clients');
    const all = await r.json();
    const updated = all.find((c: Client) => c.id === client.id);
    if (updated) onChanged(updated);
  };

  const handleLinkProject = async () => {
    if (!addProjectId) return;
    setLinking(true);
    try {
      await fetch(`/api/clients/${client.id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: addProjectId }),
      });
      setAddProjectId('');
      await refetchClient();
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkProject = async (projectId: string) => {
    await fetch(`/api/clients/${client.id}/projects/${projectId}`, { method: 'DELETE' });
    await refetchClient();
  };

  return (
    <Modal isOpen onClose={onClose} title="Detalhe do Cliente" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: statusCfg.bg }}>
          <Users className="w-5 h-5 flex-shrink-0" style={{ color: statusCfg.color }} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: statusCfg.color }}>{statusCfg.label}</p>
            <p className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{client.name}</p>
          </div>
        </div>

        {[
          { label: 'Valor', value: client.billingValue > 0 ? `${client.billingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / ${CYCLE_LABELS[client.billingCycle]}` : 'A definir' },
          { label: 'Próximo Vencimento', value: client.nextDueDate ? format(new Date(client.nextDueDate), "dd/MM/yyyy", { locale: ptBR }) : '—' },
          { label: 'Telefone', value: client.phone ?? '—' },
          { label: 'E-mail', value: client.email ?? '—' },
          { label: 'Aniversário', value: client.birthDate ? format(new Date(client.birthDate), "dd/MM", { locale: ptBR }) : '—' },
          { label: 'Vendido por', value: client.soldByName ?? '—' },
          { label: 'Comissão', value: commissionAmount !== null ? commissionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
            <span className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{row.value}</span>
          </div>
        ))}

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <FolderOpen className="w-3 h-3" /> Projetos
          </p>
          <div className="space-y-1.5 mb-2">
            {(client.projects ?? []).length === 0 && (
              <p className="text-xs text-slate-400">Nenhum projeto vinculado.</p>
            )}
            {(client.projects ?? []).map(p => (
              <div key={p.projectId} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2">
                <span className="text-sm font-medium" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{p.project?.name ?? p.projectId}</span>
                <button onClick={() => handleUnlinkProject(p.projectId)} className="text-slate-300 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {availableProjects.length > 0 && (
            <div className="flex gap-2">
              <select
                value={addProjectId}
                onChange={e => setAddProjectId(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none"
                style={{ color: isDark ? '#fff' : '#1e293b' }}
              >
                <option value="">Selecione um projeto...</option>
                {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button size="sm" onClick={handleLinkProject} loading={linking} disabled={!addProjectId}>
                Vincular
              </Button>
            </div>
          )}
        </div>

        {client.notes && (
          <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observações</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{client.notes}</p>
          </div>
        )}

        {client.phone && (
          <a
            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90"
            style={{ background: '#15803D' }}
          >
            <Phone className="w-4 h-4" />
            ABRIR WHATSAPP
          </a>
        )}
      </div>
    </Modal>
  );
}
