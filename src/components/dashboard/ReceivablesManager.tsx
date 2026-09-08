import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, Edit2, Trash2, MessageCircle, Clock,
  AlertCircle, ShieldAlert, CheckCircle2, Phone,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, EmptyState,
  FilterLine, FilterLineSearch, FilterLineSection, FilterLineItem, DatePicker,
} from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import type { Client, ClientStatus } from './types';
import { differenceInCalendarDays, format } from 'date-fns';

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Ativo',      color: '#15803D', bg: 'rgba(21,128,61,0.1)' },
  paused:    { label: 'Pausado',    color: '#C49A2A', bg: 'rgba(196,154,42,0.1)' },
  cancelled: { label: 'Cancelado',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

type BillingAlert = 'ok' | 'upcoming' | 'overdue';

const ALERT_CONFIG: Record<BillingAlert, { label: string; color: string; bg: string; icon: any }> = {
  ok:       { label: 'Em dia',        color: '#15803D', bg: 'rgba(21,128,61,0.1)',  icon: CheckCircle2 },
  upcoming: { label: 'Vence em breve', color: '#C49A2A', bg: 'rgba(196,154,42,0.1)', icon: Clock },
  overdue:  { label: 'Atrasado',      color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  icon: AlertCircle },
};

function getAlert(client: Client, today: Date): BillingAlert | null {
  if (!client.nextDueDate) return null;
  const diff = differenceInCalendarDays(new Date(client.nextDueDate), today);
  if (diff < 0) return 'overdue';
  if (diff <= (client.reminderDaysBefore ?? 5)) return 'upcoming';
  return 'ok';
}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d?: string) {
  if (!d) return '—';
  return format(new Date(d), 'dd/MM/yyyy');
}

function buildWhatsAppLink(client: Client) {
  const phoneDigits = (client.phone || '').replace(/\D/g, '');
  const dueText = client.nextDueDate ? formatDate(client.nextDueDate) : 'em breve';
  const valueText = formatMoney(client.billingValue || 0);
  const text = `Olá, ${client.name}! Passando para lembrar sobre o pagamento de ${valueText}, com vencimento em ${dueText}. Qualquer dúvida, estou à disposição!`;
  return `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(text)}`;
}

export function ReceivablesManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAlert, setFilterAlert] = useState<'all' | BillingAlert>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = new Date();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      toast('Não deu para carregar as contas a receber agora. Tente de novo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/clients/${deletingId}`, { method: 'DELETE' });
      setClients(prev => prev.filter(c => c.id !== deletingId));
      toast('Removido', 'success');
    } catch {
      toast('Não deu para remover agora. Tente de novo.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.document?.toLowerCase().includes(q) ?? false);
    const alert = getAlert(c, today);
    const matchAlert = filterAlert === 'all' || alert === filterAlert;
    return matchSearch && matchAlert;
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const totalToReceive = activeClients.reduce((a, c) => a + (c.billingValue || 0), 0);
  const upcomingCount = clients.filter(c => getAlert(c, today) === 'upcoming').length;
  const overdueCount = clients.filter(c => getAlert(c, today) === 'overdue').length;

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
            Contas a Receber
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Pagamentos que os clientes fazem para você</p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setIsFormOpen(true); }}>
          NOVA CONTA A RECEBER
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(21,128,61,0.08)' }}>
            <DollarSign className="w-4 h-4" style={{ color: '#15803D' }} />
          </div>
          <p className="text-lg font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{formatMoney(totalToReceive)}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">A receber (clientes ativos)</p>
        </div>
        <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(196,154,42,0.08)' }}>
            <Clock className="w-4 h-4" style={{ color: '#C49A2A' }} />
          </div>
          <p className="text-lg font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{upcomingCount}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Vencendo em breve</p>
        </div>
        <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(220,38,38,0.08)' }}>
            <ShieldAlert className="w-4 h-4" style={{ color: '#DC2626' }} />
          </div>
          <p className="text-lg font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{overdueCount}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Atrasados</p>
        </div>
      </div>

      {/* Filtros */}
      <FilterLine className="rounded-xl p-2.5">
        <FilterLineSection grow>
          <FilterLineItem grow minWidth={180}>
            <FilterLineSearch value={search} onChange={setSearch} placeholder="Buscar por nome ou CPF/CNPJ..." />
          </FilterLineItem>
        </FilterLineSection>
        <FilterLineSection align="right">
          <FilterLineItem>
            <Select
              aria-label="Filtrar por situação"
              value={filterAlert}
              onChange={e => setFilterAlert(e.target.value as 'all' | BillingAlert)}
              size="sm"
              className="min-w-[160px]"
              options={[
                { value: 'all', label: 'Todas as situações' },
                ...(Object.keys(ALERT_CONFIG) as BillingAlert[]).map(a => ({ value: a, label: ALERT_CONFIG[a].label })),
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
          icon={DollarSign}
          title="Nenhuma conta a receber encontrada"
          description="Cadastre um cliente para começar a controlar os recebimentos."
          action={<Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA CONTA A RECEBER</Button>}
        />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <AnimatePresence>
              {filtered.map((client, i) => {
                const statusCfg = STATUS_CONFIG[client.status];
                const alert = getAlert(client, today);
                const alertCfg = alert ? ALERT_CONFIG[alert] : null;

                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: statusCfg.bg }}>
                      <DollarSign className="w-4 h-4" style={{ color: statusCfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{client.name}</p>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                        {alertCfg && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0 flex items-center gap-1" style={{ background: alertCfg.bg, color: alertCfg.color }}>
                            <alertCfg.icon className="w-3 h-3" /> {alertCfg.label}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
                        {client.document && <span>CPF/CNPJ: {client.document}</span>}
                        {client.phone && <span>Tel: {client.phone}</span>}
                        {client.startDate && <span>Início de uso: {formatDate(client.startDate)}</span>}
                        <span>Pagamento: {formatDate(client.nextDueDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-sm font-black w-24 text-right" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                        {formatMoney(client.billingValue || 0)}
                      </p>
                      {client.phone && (
                        <a
                          href={buildWhatsAppLink(client)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mandar mensagem no WhatsApp"
                          className="p-2 rounded-lg text-white transition-opacity hover:opacity-90"
                          style={{ background: '#15803D' }}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => { setEditing(client); setIsFormOpen(true); }}
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(client.id)}
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
        <ReceivableFormModal
          client={editing}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => { setIsFormOpen(false); fetchData(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remover Conta a Receber"
        message="Tem certeza que quer remover este cliente da lista de contas a receber? Essa ação não pode ser desfeita."
        confirmLabel="REMOVER"
        variant="danger"
      />
    </div>
  );
}

function ReceivableFormModal({ client, onClose, onSuccess }: { client: Client | null; onClose: () => void; onSuccess: () => void }) {
  const { show: toast } = useToast();
  const [name, setName] = useState(client?.name || '');
  const [document, setDocument] = useState(client?.document || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [startDate, setStartDate] = useState<string | null>(client?.startDate ? client.startDate.slice(0, 10) : null);
  const [nextDueDate, setNextDueDate] = useState<string | null>(client?.nextDueDate ? client.nextDueDate.slice(0, 10) : null);
  const [billingValue, setBillingValue] = useState(String(client?.billingValue ?? ''));
  const [status, setStatus] = useState<ClientStatus>(client?.status || 'active');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        document,
        phone,
        startDate,
        nextDueDate,
        billingValue: Number(billingValue) || 0,
        billingCycle: client?.billingCycle || 'monthly',
        status,
      };
      const res = await fetch(client ? `/api/clients/${client.id}` : '/api/clients', {
        method: client ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast(client ? 'Alterações salvas' : 'Conta a receber cadastrada', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={client ? 'Editar Conta a Receber' : 'Nova Conta a Receber'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nome do Cliente" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João da Silva" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="CPF ou CNPJ" value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
          <Input label="Telefone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="ds-label">Data de Início de Uso</label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="ds-label">Data de Pagamento</label>
            <DatePicker value={nextDueDate} onChange={setNextDueDate} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Valor (R$)" type="number" step="0.01" required value={billingValue} onChange={e => setBillingValue(e.target.value)} placeholder="0,00" />
          <Select
            label="Situação"
            value={status}
            onChange={e => setStatus(e.target.value as ClientStatus)}
            options={[
              { value: 'active', label: 'Ativo' },
              { value: 'paused', label: 'Pausado' },
              { value: 'cancelled', label: 'Cancelado' },
            ]}
          />
        </div>
        <Button type="submit" loading={saving} fullWidth size="lg">SALVAR</Button>
      </form>
    </Modal>
  );
}
