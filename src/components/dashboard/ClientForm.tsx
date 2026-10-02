import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Modal, Input, Select, Textarea, DatePicker } from '../ui';
import { useToast } from '../ui/Toast';
import type { Client, ClientStatus, BillingCycle, CommissionType } from './types';
import { format } from 'date-fns';
import { parseDay } from './financeShared';
import { BoxsysAccessModal, type Access } from './BoxsysSection';

export const CYCLE_LABEL: Record<BillingCycle, string> = { monthly: 'Mensal', yearly: 'Anual', custom: 'Personalizado', one_time: 'Único' };

// ─── Cadastro / edição ───────────────────────────────────────────────────────

export function ClientFormModal({ client, users, onClose, onSaved }: {
  client: Client | null; users: { uid: string; displayName: string }[]; onClose: () => void; onSaved: () => void;
}) {
  const { show: toast } = useToast();
  const editing = !!client;
  const dateStr = (iso?: string | null) => (parseDay(iso) ? format(parseDay(iso)!, 'yyyy-MM-dd') : null);

  const [name, setName] = useState(client?.name ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [document, setDocument] = useState(client?.document ?? '');
  const [birthDate, setBirthDate] = useState<string | null>(dateStr(client?.birthDate));
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(client?.billingCycle ?? 'monthly');
  const [billingValue, setBillingValue] = useState(client ? String(client.billingValue ?? '') : '');
  const [startDate, setStartDate] = useState<string | null>(dateStr(client?.startDate) ?? (client ? null : format(new Date(), 'yyyy-MM-dd')));
  const [nextDueDate, setNextDueDate] = useState<string | null>(dateStr(client?.nextDueDate) ?? format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<ClientStatus>(client?.status ?? 'active');
  const [reminderDays, setReminderDays] = useState(String(client?.reminderDaysBefore ?? 5));
  const [graceDays, setGraceDays] = useState(String(client?.graceDaysAfter ?? 7));
  const [soldById, setSoldById] = useState(client?.soldById ?? '');
  const [commissionType, setCommissionType] = useState<'' | CommissionType>(client?.commissionType ?? '');
  const [commissionValue, setCommissionValue] = useState(client?.commissionValue != null ? String(client.commissionValue) : '');
  const [notes, setNotes] = useState(client?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [makeStore, setMakeStore] = useState(false);
  const [store, setStore] = useState({ storeName: '', subdomain: '', planId: '', trialDays: '14', sendAccess: true });
  const [access, setAccess] = useState<Access | null>(null);
  // com a loja de teste, a primeira cobrança é no fim do teste
  useEffect(() => {
    if (client || !makeStore) return;
    const days = Number(store.trialDays) || 0;
    if (days > 0) setNextDueDate(format(new Date(Date.now() + days * 86400000), 'yyyy-MM-dd'));
  }, [makeStore, store.trialDays, client]);

  const due = nextDueDate ? new Date(nextDueDate + 'T12:00:00') : null;
  const dueHint = !due ? null
    : billingCycle === 'one_time' ? 'Cobrança única nesta data.'
    : billingCycle === 'yearly' ? `Cobra todo ano em ${format(due, 'dd/MM')}.`
    : `Cobra todo mês no dia ${due.getDate()}.`;

  const cycles: BillingCycle[] = client?.billingCycle === 'custom' ? ['monthly', 'yearly', 'one_time', 'custom'] : ['monthly', 'yearly', 'one_time'];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextDueDate) return toast('Informe o próximo vencimento.', 'warning');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        document: document.trim() || null,
        birthDate,
        billingCycle,
        billingValue: Number(billingValue) || 0,
        startDate,
        nextDueDate,
        status,
        reminderDaysBefore: Number(reminderDays) || 0,
        graceDaysAfter: Number(graceDays) || 0,
        soldById: soldById || null,
        soldByName: soldById ? users.find(u => u.uid === soldById)?.displayName ?? null : null,
        commissionType: commissionType || null,
        commissionValue: commissionType ? Number(commissionValue) || 0 : null,
        notes: notes.trim() || null,
      };
      const res = await fetch(client ? `/api/clients/${client.id}` : '/api/clients', {
        method: client ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast(editing ? 'Cliente atualizado' : 'Cliente cadastrado', 'success');
      if (!editing && makeStore) {
        const created = await res.json();
        const r = await fetch(`/api/clients/${created.id}/boxsys/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...store, storeName: store.storeName || name.trim(), ownerName: name.trim(), ownerEmail: email.trim(), sendAccess: store.sendAccess && !!phone.trim() }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok) { setAccess({ ...d.access, sent: d.sent }); return; } // mostra o acesso e só então fecha
        toast(`Cliente salvo, mas a loja não foi criada: ${d.error || 'erro no BoxSys'}. Crie depois pelo cadastro do cliente.`, 'warning');
      }
      onSaved();
    } catch {
      toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Editar cliente' : 'Novo cliente'}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="client-form" loading={saving} fullWidth size="lg">{editing ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR CLIENTE'}</Button>
        </div>
      }
    >
      <form id="client-form" onSubmit={submit} className="space-y-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Dados do cliente</p>
        <Input label="Nome" required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João da Silva" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="WhatsApp (com DDD)" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(15) 99999-9999" />
          <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" />
        </div>
        {!phone.trim() && <p className="text-[11px] text-amber-600 -mt-3">Sem WhatsApp o bot não consegue avisar este cliente sobre vencimentos.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="CPF ou CNPJ (opcional)" value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="ds-label">Aniversário (opcional)</label>
            <DatePicker value={birthDate} onChange={setBirthDate} />
          </div>
        </div>

        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 pt-1">Assinatura</p>
        <div>
          <label className="ds-label">Como ele paga?</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {cycles.map(k => (
              <button type="button" key={k} onClick={() => setBillingCycle(k)}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${billingCycle === k ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : 'border-transparent bg-slate-100/70 dark:bg-white/5 text-slate-500'}`}>
                {CYCLE_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label={billingCycle === 'one_time' ? 'Valor' : billingCycle === 'yearly' ? 'Valor por ano' : 'Valor por mês'} addonLeft="R$" type="number" step="0.01" min="0" required
            value={billingValue} onChange={e => setBillingValue(e.target.value)} placeholder="0,00" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="ds-label">Cliente desde</label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="ds-label">{billingCycle === 'one_time' ? 'Data do pagamento' : 'Próximo vencimento'}</label>
            <DatePicker value={nextDueDate} onChange={setNextDueDate} />
          </div>
        </div>
        {dueHint && <p className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-3 py-2 -mt-2">{dueHint}</p>}
        {editing && (
          <Select label="Situação" value={status} onChange={e => setStatus(e.target.value as ClientStatus)}
            options={[{ value: 'active', label: 'Ativo' }, { value: 'paused', label: 'Pausado / bloqueado' }, { value: 'cancelled', label: 'Cancelado' }]} />
        )}

        <details className="group rounded-xl border border-slate-200 dark:border-white/10">
          <summary className="cursor-pointer list-none flex items-center justify-between px-3.5 py-3 text-xs font-bold text-slate-500">
            <span>Avisos de cobrança do bot <span className="font-normal text-slate-400">(opcional)</span></span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-3.5 pb-3.5">
            <Input label="Avisar antes do vencimento" type="number" min="0" addonLeft="dias" value={reminderDays} onChange={e => setReminderDays(e.target.value)} />
            <Input label="Tolerância após vencer" type="number" min="0" addonLeft="dias" value={graceDays} onChange={e => setGraceDays(e.target.value)} />
            <p className="text-[11px] text-slate-400 sm:col-span-2">Depois da tolerância, o bot avisa que a assinatura foi bloqueada e o cliente passa para "Pausado".</p>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200 dark:border-white/10" open={!!(soldById || commissionType)}>
          <summary className="cursor-pointer list-none flex items-center justify-between px-3.5 py-3 text-xs font-bold text-slate-500">
            <span>Venda e comissão <span className="font-normal text-slate-400">(opcional)</span></span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-3.5 pb-3.5">
            <Select label="Vendedor" value={soldById} onChange={e => setSoldById(e.target.value)}
              options={[{ value: '', label: 'Não definido' }, ...users.map(u => ({ value: u.uid, label: u.displayName }))]} />
            <Select label="Comissão" value={commissionType} onChange={e => setCommissionType(e.target.value as '' | CommissionType)}
              options={[{ value: '', label: 'Sem comissão' }, { value: 'percentage', label: 'Percentual (%)' }, { value: 'fixed', label: 'Valor fixo (R$)' }]} />
            {commissionType && (
              <Input label={commissionType === 'percentage' ? 'Percentual' : 'Valor'} addonLeft={commissionType === 'percentage' ? '%' : 'R$'} type="number" step="0.01" min="0"
                value={commissionValue} onChange={e => setCommissionValue(e.target.value)} />
            )}
          </div>
        </details>

        {!editing && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-4">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-indigo-600" checked={makeStore} onChange={e => setMakeStore(e.target.checked)} />
              <span className="text-sm font-bold">Criar a loja dele no Store BoxSys
                <span className="block text-[11px] font-normal text-slate-400">Cria o usuário e o link de acesso agora. Pagou = loja liberada; atrasou além da tolerância = bloqueada.</span></span>
            </label>
            {makeStore && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">
                  A loja nasce em teste de <b>{store.trialDays || 14} dias</b>. O <b>próximo vencimento</b> foi ajustado para o fim do teste e a cobrança de <b>R$ {billingValue || '0,00'}</b> por mês começa ali.
                </p>
                {!email.trim() && <p className="text-xs text-amber-600">Preencha o <b>E-mail</b> acima: ele será o usuário de login da loja.</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nome da loja" value={store.storeName} onChange={e => setStore({ ...store, storeName: e.target.value })} placeholder={name || 'Igual ao nome do cliente'} />
                  <Input label="Endereço (opcional)" value={store.subdomain} onChange={e => setStore({ ...store, subdomain: e.target.value })} placeholder="minhaloja" />
                  <Input label="Dias de teste" type="number" min="1" value={store.trialDays} onChange={e => setStore({ ...store, trialDays: e.target.value })} />
                </div>
                <label className={`flex items-center gap-2 text-sm ${phone.trim() ? '' : 'opacity-40'}`}>
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" disabled={!phone.trim()} checked={store.sendAccess && !!phone.trim()} onChange={e => setStore({ ...store, sendAccess: e.target.checked })} />
                  Enviar link e senha no WhatsApp do cliente
                </label>
              </div>
            )}
          </div>
        )}

        <Textarea label="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional" />
      </form>
      {access && <BoxsysAccessModal access={access} onClose={onSaved} />}
    </Modal>
  );
}

