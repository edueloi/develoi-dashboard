import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Plus, Edit2, Trash2, Building2, Boxes, RotateCcw,
  CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, Textarea, EmptyState,
  FilterLine, FilterLineSearch, FilterLineSection, FilterLineItem, DatePicker,
} from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Payable, PayableType, PayableStatus } from './types';
import { differenceInCalendarDays, format } from 'date-fns';

const TYPE_CONFIG: Record<PayableType, { label: string; color: string; bg: string; icon: any }> = {
  fixed:        { label: 'Custo Fixo da Empresa', color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)',   icon: Building2 },
  product:      { label: 'Custo de Sistema',      color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  icon: Boxes },
  reimbursement:{ label: 'Reembolso',             color: '#C49A2A', bg: 'rgba(196,154,42,0.1)',  icon: RotateCcw },
};

const STATUS_CONFIG: Record<PayableStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pendente', color: '#C49A2A', bg: 'rgba(196,154,42,0.1)', icon: Clock },
  paid:    { label: 'Pago',     color: '#15803D', bg: 'rgba(21,128,61,0.1)',  icon: CheckCircle2 },
};

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d?: string) {
  if (!d) return '—';
  return format(new Date(d), 'dd/MM/yyyy');
}

function isOverdue(p: Payable, today: Date) {
  if (p.status === 'paid' || !p.dueDate) return false;
  return differenceInCalendarDays(new Date(p.dueDate), today) < 0;
}

export function PayablesManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile, isAdmin } = useAuth();

  const [payables, setPayables] = useState<Payable[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | PayableType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PayableStatus>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Payable | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = new Date();

  const fetchData = useCallback(async () => {
    try {
      const [pr, jr] = await Promise.all([
        fetch('/api/payables'),
        fetch(`/api/projects?userId=${profile?.uid ?? ''}&isAdmin=${isAdmin}`),
      ]);
      const [payablesData, projectsData] = await Promise.all([pr.json(), jr.json()]);
      setPayables(Array.isArray(payablesData) ? payablesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData.map((p: any) => ({ id: p.id, name: p.name })) : []);
    } catch {
      toast('Não deu para carregar as contas a pagar agora. Tente de novo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, profile?.uid, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/payables/${deletingId}`, { method: 'DELETE' });
      setPayables(prev => prev.filter(p => p.id !== deletingId));
      toast('Removido', 'success');
    } catch {
      toast('Não deu para remover agora. Tente de novo.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePaid = async (p: Payable) => {
    const nextStatus: PayableStatus = p.status === 'paid' ? 'pending' : 'paid';
    try {
      const res = await fetch(`/api/payables/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, paidDate: nextStatus === 'paid' ? new Date().toISOString().slice(0, 10) : null }),
      });
      const updated = await res.json();
      setPayables(prev => prev.map(x => x.id === p.id ? updated : x));
    } catch {
      toast('Não deu para atualizar agora. Tente de novo.', 'error');
    }
  };

  const toggleReimbursed = async (p: Payable) => {
    try {
      const res = await fetch(`/api/payables/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reimbursed: !p.reimbursed }),
      });
      const updated = await res.json();
      setPayables(prev => prev.map(x => x.id === p.id ? updated : x));
    } catch {
      toast('Não deu para atualizar agora. Tente de novo.', 'error');
    }
  };

  const filtered = payables.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.description.toLowerCase().includes(q) || (p.project?.name.toLowerCase().includes(q) ?? false);
    const matchType = filterType === 'all' || p.type === filterType;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalPending = payables.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const totalFixed = payables.filter(p => p.type === 'fixed' && p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const totalReimbursements = payables.filter(p => p.type === 'reimbursement' && !p.reimbursed).reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
            Contas a Pagar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gastos fixos da empresa, custos por sistema e reembolsos</p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setIsFormOpen(true); }}>
          NOVA CONTA A PAGAR
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(220,38,38,0.08)' }}>
            <Wallet className="w-4 h-4" style={{ color: '#DC2626' }} />
          </div>
          <p className="text-lg font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{formatMoney(totalPending)}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Pendente no total</p>
        </div>
        <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(13,31,78,0.08)' }}>
            <Building2 className="w-4 h-4" style={{ color: '#0D1F4E' }} />
          </div>
          <p className="text-lg font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{formatMoney(totalFixed)}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Custo fixo pendente</p>
        </div>
        <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(196,154,42,0.1)' }}>
            <RotateCcw className="w-4 h-4" style={{ color: '#C49A2A' }} />
          </div>
          <p className="text-lg font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{formatMoney(totalReimbursements)}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Falta te reembolsar</p>
        </div>
      </div>

      {/* Filtros */}
      <FilterLine className="rounded-xl p-2.5">
        <FilterLineSection grow>
          <FilterLineItem grow minWidth={180}>
            <FilterLineSearch value={search} onChange={setSearch} placeholder="Buscar por descrição ou sistema..." />
          </FilterLineItem>
        </FilterLineSection>
        <FilterLineSection align="right">
          <FilterLineItem>
            <Select
              aria-label="Filtrar por tipo"
              value={filterType}
              onChange={e => setFilterType(e.target.value as 'all' | PayableType)}
              size="sm"
              className="min-w-[170px]"
              options={[
                { value: 'all', label: 'Todos os tipos' },
                ...(Object.keys(TYPE_CONFIG) as PayableType[]).map(t => ({ value: t, label: TYPE_CONFIG[t].label })),
              ]}
            />
          </FilterLineItem>
          <FilterLineItem>
            <Select
              aria-label="Filtrar por status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as 'all' | PayableStatus)}
              size="sm"
              className="min-w-[140px]"
              options={[
                { value: 'all', label: 'Todas as situações' },
                ...(Object.keys(STATUS_CONFIG) as PayableStatus[]).map(s => ({ value: s, label: STATUS_CONFIG[s].label })),
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
          icon={Wallet}
          title="Nenhuma conta a pagar encontrada"
          description="Cadastre um custo fixo, de um sistema, ou um reembolso."
          action={<Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA CONTA A PAGAR</Button>}
        />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <AnimatePresence>
              {filtered.map((p, i) => {
                const typeCfg = TYPE_CONFIG[p.type];
                const overdue = isOverdue(p, today);
                const statusCfg = overdue ? { label: 'Atrasado', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: AlertCircle } : STATUS_CONFIG[p.status];

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: typeCfg.bg }}>
                      <typeCfg.icon className="w-4 h-4" style={{ color: typeCfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{p.description}</p>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                          {typeCfg.label}
                        </span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0 flex items-center gap-1" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          <statusCfg.icon className="w-3 h-3" /> {statusCfg.label}
                        </span>
                        {p.type === 'reimbursement' && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0" style={{ background: p.reimbursed ? 'rgba(21,128,61,0.1)' : 'rgba(220,38,38,0.1)', color: p.reimbursed ? '#15803D' : '#DC2626' }}>
                            {p.reimbursed ? 'Já te reembolsaram' : 'Ainda não reembolsado'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
                        {p.project?.name && <span>Sistema: {p.project.name}</span>}
                        <span>Vencimento: {formatDate(p.dueDate)}</span>
                        {p.status === 'paid' && <span>Pago em: {formatDate(p.paidDate)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-sm font-black w-24 text-right" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                        {formatMoney(p.amount)}
                      </p>
                      <Button size="sm" variant={p.status === 'paid' ? 'outline' : 'primary'} onClick={() => togglePaid(p)}>
                        {p.status === 'paid' ? 'REABRIR' : 'MARCAR PAGO'}
                      </Button>
                      {p.type === 'reimbursement' && (
                        <Button size="sm" variant={p.reimbursed ? 'outline' : 'primary'} onClick={() => toggleReimbursed(p)}>
                          {p.reimbursed ? 'DESFAZER' : 'REEMBOLSADO'}
                        </Button>
                      )}
                      <button
                        onClick={() => { setEditing(p); setIsFormOpen(true); }}
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(p.id)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <PayableFormModal
          payable={editing}
          projects={projects}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => { setIsFormOpen(false); fetchData(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remover Conta a Pagar"
        message="Tem certeza que quer remover esta conta? Essa ação não pode ser desfeita."
        confirmLabel="REMOVER"
        variant="danger"
      />
    </div>
  );
}

function PayableFormModal({ payable, projects, onClose, onSuccess }: {
  payable: Payable | null; projects: { id: string; name: string }[]; onClose: () => void; onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const { show: toast } = useToast();
  const [description, setDescription] = useState(payable?.description || '');
  const [type, setType] = useState<PayableType>(payable?.type || 'fixed');
  const [projectId, setProjectId] = useState(payable?.projectId || '');
  const [amount, setAmount] = useState(String(payable?.amount ?? ''));
  const [dueDate, setDueDate] = useState<string | null>(payable?.dueDate ? payable.dueDate.slice(0, 10) : null);
  const [notes, setNotes] = useState(payable?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        description,
        type,
        projectId: type === 'product' ? (projectId || null) : null,
        amount: Number(amount) || 0,
        dueDate,
        notes,
        createdById: profile?.uid,
        createdByName: profile?.displayName,
      };
      const res = await fetch(payable ? `/api/payables/${payable.id}` : '/api/payables', {
        method: payable ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast(payable ? 'Alterações salvas' : 'Conta a pagar cadastrada', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={payable ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Descrição" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Servidor VPS, Domínio, Reembolso compra de licença..." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tipo de Gasto"
            value={type}
            onChange={e => setType(e.target.value as PayableType)}
            options={[
              { value: 'fixed', label: 'Custo Fixo da Empresa' },
              { value: 'product', label: 'Custo de um Sistema/Produto' },
              { value: 'reimbursement', label: 'Reembolso (dinheiro que você investiu)' },
            ]}
          />
          <Input label="Valor (R$)" type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
        </div>

        {type === 'product' && (
          <Select
            label="Qual Sistema?"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            options={[
              { value: '', label: 'Selecione o sistema...' },
              ...projects.map(p => ({ value: p.id, label: p.name })),
            ]}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="ds-label">Data de Vencimento</label>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </div>

        <Textarea label="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Detalhes adicionais (opcional)" />

        <Button type="submit" loading={saving} fullWidth size="lg">SALVAR</Button>
      </form>
    </Modal>
  );
}
