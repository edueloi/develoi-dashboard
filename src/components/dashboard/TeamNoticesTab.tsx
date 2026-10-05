import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell, Plus, Edit2, Trash2, Send, CalendarClock, Wallet, DollarSign, Users, MapPin, CheckCircle2, AlertTriangle, ChevronDown, Cake,
} from 'lucide-react';
import { Button, Modal, ConfirmModal, Input, Select, Textarea, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { RowMenu } from './financeShared';
import { format, addHours, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLiveEvents } from '../../lib/liveEvents';

interface Recipient {
  id: string; name: string; phone: string; userId?: string | null;
  notifyPayables: boolean; notifyReceivables: boolean; notifyMeetings: boolean; notifyBirthdays: boolean; notifyContact: boolean; active: boolean;
}
interface Meeting {
  id: string; title: string; startsAt: string; location?: string | null; notes?: string | null;
  reminderSentAt?: string | null; attendees: { recipientId: string; recipient: { id: string; name: string } }[];
}

const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  const n = d.startsWith('55') ? d.slice(2) : d;
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return p;
};

const toLocalInput = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

export function TeamNoticesTab() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const text = isDark ? '#fff' : '#0D1F4E';

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<{ uid: string; displayName: string }[]>([]);
  const [botStatus, setBotStatus] = useState<string>('unknown');
  const [loading, setLoading] = useState(true);
  const [recForm, setRecForm] = useState<{ open: boolean; rec: Recipient | null }>({ open: false, rec: null });
  const [meetForm, setMeetForm] = useState<{ open: boolean; meeting: Meeting | null }>({ open: false, meeting: null });
  const [deletingRec, setDeletingRec] = useState<Recipient | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [rr, mr, ur, sr] = await Promise.all([
        fetch('/api/team-notices/recipients'), fetch('/api/meetings'), fetch('/api/users'), fetch('/api/admin/bot/status'),
      ]);
      const [r, m, u, s] = await Promise.all([rr.json(), mr.json(), ur.json(), sr.json().catch(() => ({}))]);
      setRecipients(Array.isArray(r) ? r : []);
      setMeetings(Array.isArray(m) ? m : []);
      setUsers(Array.isArray(u) ? u.map((x: any) => ({ uid: x.uid, displayName: x.displayName })) : []);
      setBotStatus(s?.status ?? 'unknown');
    } catch {
      toast('Não deu para carregar os avisos agora. Tente de novo.', 'error');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useLiveEvents(['TeamRecipient', 'Meeting', 'MeetingAttendee'], () => load());

  const patchRecipient = async (id: string, data: Partial<Recipient>) => {
    setRecipients(prev => prev.map(r => (r.id === id ? { ...r, ...data } : r)));
    try {
      const res = await fetch(`/api/team-notices/recipients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
    } catch { toast('Não deu para salvar agora.', 'error'); load(); }
  };

  const sendTest = async (r: Recipient) => {
    setTesting(r.id);
    try {
      const res = await fetch(`/api/team-notices/recipients/${r.id}/test`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast(`Mensagem de teste enviada para ${r.name}`, 'success');
    } catch (e: any) { toast(e.message || 'Não deu para enviar o teste.', 'error'); }
    finally { setTesting(null); }
  };

  const removeRecipient = async () => {
    if (!deletingRec) return;
    try {
      const res = await fetch(`/api/team-notices/recipients/${deletingRec.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Removido', 'success');
      load();
    } catch { toast('Não deu para remover agora.', 'error'); }
    finally { setDeletingRec(null); }
  };

  const removeMeeting = async () => {
    if (!deletingMeeting) return;
    try {
      const res = await fetch(`/api/meetings/${deletingMeeting.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Reunião removida', 'success');
      load();
    } catch { toast('Não deu para remover agora.', 'error'); }
    finally { setDeletingMeeting(null); }
  };

  const upcoming = useMemo(() => meetings.filter(m => !isPast(new Date(m.startsAt))), [meetings]);
  const past = useMemo(() => meetings.filter(m => isPast(new Date(m.startsAt))).reverse(), [meetings]);

  const meetingRow = (m: Meeting) => {
    const start = new Date(m.startsAt);
    const old = isPast(start);
    const reminderAt = addHours(start, -24);
    return (
      <div key={m.id} className="flex items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <div className="w-12 flex-shrink-0 text-center rounded-xl py-1.5" style={{ background: old ? 'rgba(148,163,184,0.12)' : 'rgba(37,99,235,0.1)' }}>
          <p className="text-[10px] font-bold uppercase" style={{ color: old ? '#94A3B8' : '#2563EB' }}>{format(start, 'MMM', { locale: ptBR })}</p>
          <p className="text-lg font-black leading-none" style={{ color: old ? '#94A3B8' : text }}>{format(start, 'dd')}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: text }}>{m.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="capitalize">{format(start, "EEEE 'às' HH:mm", { locale: ptBR })}</span>
            {m.location && <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{m.location}</span>}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5 items-center">
            {m.attendees.length === 0 && <span className="text-[11px] text-slate-400">Sem participantes</span>}
            {m.attendees.map(a => (
              <span key={a.recipientId} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300">{a.recipient.name}</span>
            ))}
            {!old && (
              m.reminderSentAt
                ? <span className="text-[10px] font-bold text-green-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> aviso de 24h enviado</span>
                : <span className="text-[10px] text-slate-400">aviso em {format(reminderAt, "dd/MM 'às' HH:mm")}{reminderAt < new Date() ? ' (já pode sair)' : ''}</span>
            )}
          </div>
        </div>
        <RowMenu items={[
          { label: 'Editar', icon: Edit2, onClick: () => setMeetForm({ open: true, meeting: m }) },
          { label: 'Excluir', icon: Trash2, danger: true, onClick: () => setDeletingMeeting(m) },
        ]} />
      </div>
    );
  };

  return (
    <div className="space-y-5 dashboard-density">
      <div>
        <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>Avisos da equipe</h2>
        <p className="text-xs text-slate-400 mt-0.5">O bot manda no WhatsApp da equipe o resumo de contas e o lembrete de reuniões</p>
      </div>

      {botStatus !== 'connected' && !loading && (
        <div className="flex items-start gap-2.5 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>O WhatsApp do bot está desconectado, então nenhum aviso é enviado. Conecte em <b>Bot de Atendimento</b>.</span>
        </div>
      )}

      {/* Quem recebe */}
      <section className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <p className="text-sm font-black flex items-center gap-2" style={{ color: text }}><Users className="w-4 h-4" /> Quem recebe os avisos</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Resumo de contas todo dia às 9h (só se houver algo vencendo) e lembrete de reunião 24h antes.</p>
          </div>
          <Button size="sm" iconLeft={<Plus className="w-4 h-4" />} onClick={() => setRecForm({ open: true, rec: null })}>ADICIONAR</Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Carregando…</div>
        ) : recipients.length === 0 ? (
          <EmptyState icon={Bell} title="Ninguém cadastrado ainda" description="Adicione as pessoas da equipe e o WhatsApp de cada uma para receber os avisos."
            action={<Button onClick={() => setRecForm({ open: true, rec: null })}>ADICIONAR PESSOA</Button>} />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recipients.map(r => (
              <div key={r.id} className={`flex flex-col md:flex-row md:items-center gap-3 px-3.5 sm:px-4 py-3 ${r.active ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                    {r.name.trim()[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: text }}>{r.name}</p>
                    <p className="text-xs text-slate-400">{formatPhone(r.phone)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['notifyPayables', 'Contas a pagar', Wallet],
                    ['notifyReceivables', 'Contas a receber', DollarSign],
                    ['notifyMeetings', 'Reuniões', CalendarClock],
                    ['notifyBirthdays', 'Aniversários', Cake],
                    ['notifyContact', 'Contato do site', Send],
                  ] as const).map(([key, label, Icon]) => (
                    <button key={key} onClick={() => patchRecipient(r.id, { [key]: !r[key] })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${r[key] ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-400 hover:border-slate-300'}`}>
                      <Icon className="w-3 h-3" /> {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 md:ml-2">
                  <Button size="sm" variant="outline" loading={testing === r.id} iconLeft={<Send className="w-3.5 h-3.5" />} onClick={() => sendTest(r)}>Testar</Button>
                  <RowMenu items={[
                    { label: 'Editar', icon: Edit2, onClick: () => setRecForm({ open: true, rec: r }) },
                    { label: r.active ? 'Pausar avisos' : 'Reativar avisos', icon: Bell, onClick: () => patchRecipient(r.id, { active: !r.active }) },
                    { label: 'Remover', icon: Trash2, danger: true, onClick: () => setDeletingRec(r) },
                  ]} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reuniões */}
      <section className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <p className="text-sm font-black flex items-center gap-2" style={{ color: text }}><CalendarClock className="w-4 h-4" /> Reuniões</p>
            <p className="text-[11px] text-slate-400 mt-0.5">O bot avisa os participantes 24 horas antes.</p>
          </div>
          <Button size="sm" iconLeft={<Plus className="w-4 h-4" />} disabled={recipients.length === 0} onClick={() => setMeetForm({ open: true, meeting: null })}>NOVA REUNIÃO</Button>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {recipients.length === 0 ? 'Cadastre quem recebe os avisos para poder marcar reuniões.' : 'Nenhuma reunião marcada.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">{upcoming.map(meetingRow)}</div>
        )}

        {past.length > 0 && (
          <>
            <button onClick={() => setShowPast(v => !v)} className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100 dark:border-white/5">
              <span>Reuniões passadas · {past.length}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? '' : '-rotate-90'}`} />
            </button>
            {showPast && <div className="divide-y divide-slate-100 dark:divide-white/5">{past.slice(0, 20).map(meetingRow)}</div>}
          </>
        )}
      </section>

      {recForm.open && (
        <RecipientFormModal rec={recForm.rec} users={users} onClose={() => setRecForm({ open: false, rec: null })}
          onSaved={() => { setRecForm({ open: false, rec: null }); load(); }} />
      )}
      {meetForm.open && (
        <MeetingFormModal meeting={meetForm.meeting} recipients={recipients.filter(r => r.active)} onClose={() => setMeetForm({ open: false, meeting: null })}
          onSaved={() => { setMeetForm({ open: false, meeting: null }); load(); }} />
      )}

      <ConfirmModal isOpen={!!deletingRec} onClose={() => setDeletingRec(null)} onConfirm={removeRecipient}
        title="Remover da lista de avisos" message={`${deletingRec?.name ?? 'Esta pessoa'} deixa de receber os avisos e sai das reuniões marcadas.`}
        confirmLabel="REMOVER" variant="danger" />
      <ConfirmModal isOpen={!!deletingMeeting} onClose={() => setDeletingMeeting(null)} onConfirm={removeMeeting}
        title="Excluir reunião" message={`Excluir "${deletingMeeting?.title ?? ''}"? Ninguém mais será avisado sobre ela.`}
        confirmLabel="EXCLUIR" variant="danger" />
    </div>
  );
}

// ─── Destinatário ────────────────────────────────────────────────────────────

function RecipientFormModal({ rec, users, onClose, onSaved }: {
  rec: Recipient | null; users: { uid: string; displayName: string }[]; onClose: () => void; onSaved: () => void;
}) {
  const { show: toast } = useToast();
  const [userId, setUserId] = useState(rec?.userId ?? '');
  const [name, setName] = useState(rec?.name ?? '');
  const [phone, setPhone] = useState(rec?.phone ?? '');
  const [payables, setPayables] = useState(rec?.notifyPayables ?? true);
  const [receivables, setReceivables] = useState(rec?.notifyReceivables ?? true);
  const [meetings, setMeetings] = useState(rec?.notifyMeetings ?? true);
  const [birthdays, setBirthdays] = useState(rec?.notifyBirthdays ?? true);
  const [contact, setContact] = useState(rec?.notifyContact ?? false);
  const [saving, setSaving] = useState(false);

  const pickUser = (uid: string) => {
    setUserId(uid);
    const u = users.find(x => x.uid === uid);
    if (u && !name.trim()) setName(u.displayName);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(rec ? `/api/team-notices/recipients/${rec.id}` : '/api/team-notices/recipients', {
        method: rec ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, userId: userId || null, notifyPayables: payables, notifyReceivables: receivables, notifyMeetings: meetings, notifyBirthdays: birthdays, notifyContact: contact }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast(rec ? 'Alterações salvas' : 'Pessoa adicionada', 'success');
      onSaved();
    } catch (err: any) { toast(err.message === 'Erro' ? 'Não deu para salvar agora.' : err.message, 'error'); }
    finally { setSaving(false); }
  };

  const Check = ({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer">
      <input type="checkbox" className="w-4 h-4 mt-0.5 accent-indigo-600" checked={value} onChange={e => onChange(e.target.checked)} />
      <span><span className="block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span><span className="block text-[11px] text-slate-400">{hint}</span></span>
    </label>
  );

  return (
    <Modal isOpen onClose={onClose} title={rec ? 'Editar pessoa' : 'Adicionar pessoa'} size="md"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="recipient-form" loading={saving} fullWidth size="lg">{rec ? 'SALVAR' : 'ADICIONAR'}</Button>
        </div>
      }>
      <form id="recipient-form" onSubmit={submit} className="space-y-4">
        {users.length > 0 && (
          <Select label="Pessoa da equipe (opcional)" value={userId} onChange={e => pickUser(e.target.value)}
            options={[{ value: '', label: 'Outra pessoa' }, ...users.map(u => ({ value: u.uid, label: u.displayName }))]} />
        )}
        <Input label="Nome" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Eduardo" />
        <Input label="WhatsApp (com DDD)" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(15) 99999-9999" />
        <div className="space-y-2">
          <label className="ds-label">O que essa pessoa recebe?</label>
          <Check label="Contas a pagar" hint="Resumo do dia: atrasadas, vencendo hoje e amanhã" value={payables} onChange={setPayables} />
          <Check label="Contas a receber" hint="Resumo do dia: assinaturas e valores avulsos" value={receivables} onChange={setReceivables} />
          <Check label="Reuniões" hint="Lembrete 24 horas antes de cada reunião em que ela participa" value={meetings} onChange={setMeetings} />
          <Check label="Aniversários" hint="Aviso quando for aniversário de um sócio ou cliente, hoje ou amanhã" value={birthdays} onChange={setBirthdays} />
          <Check label="Contato do site" hint="Aviso na hora quando alguém enviar uma mensagem pela página de contato do site" value={contact} onChange={setContact} />
        </div>
      </form>
    </Modal>
  );
}

// ─── Reunião ─────────────────────────────────────────────────────────────────

function MeetingFormModal({ meeting, recipients, onClose, onSaved }: {
  meeting: Meeting | null; recipients: Recipient[]; onClose: () => void; onSaved: () => void;
}) {
  const { show: toast } = useToast();
  const { profile } = useAuth();
  const defaultStart = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0); return d; }, []);
  const [title, setTitle] = useState(meeting?.title ?? '');
  const [startsAt, setStartsAt] = useState(toLocalInput(meeting ? new Date(meeting.startsAt) : defaultStart));
  const [location, setLocation] = useState(meeting?.location ?? '');
  const [notes, setNotes] = useState(meeting?.notes ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(meeting ? meeting.attendees.map(a => a.recipientId) : recipients.filter(r => r.notifyMeetings).map(r => r.id)));
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const when = new Date(startsAt);
  const valid = !Number.isNaN(when.getTime());
  const reminderAt = valid ? addHours(when, -24) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return toast('Informe a data e a hora.', 'warning');
    setSaving(true);
    try {
      const payload = {
        title, startsAt: when.toISOString(), location, notes, attendeeIds: [...selected],
        createdById: profile?.uid, createdByName: profile?.displayName,
      };
      const res = await fetch(meeting ? `/api/meetings/${meeting.id}` : '/api/meetings', {
        method: meeting ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast(meeting ? 'Reunião atualizada' : 'Reunião marcada', 'success');
      onSaved();
    } catch { toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={meeting ? 'Editar reunião' : 'Nova reunião'} size="md"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="meeting-form" loading={saving} fullWidth size="lg">{meeting ? 'SALVAR ALTERAÇÕES' : 'MARCAR REUNIÃO'}</Button>
        </div>
      }>
      <form id="meeting-form" onSubmit={submit} className="space-y-4">
        <Input label="Assunto" required autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Alinhamento semanal, Reunião com cliente X" />
        <Input label="Data e hora" type="datetime-local" required value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        <Input label="Local ou link (opcional)" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Google Meet, escritório…" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="ds-label">Quem participa?</label>
            <button type="button" className="text-[11px] font-bold text-indigo-500 hover:underline"
              onClick={() => setSelected(selected.size === recipients.length ? new Set() : new Set(recipients.map(r => r.id)))}>
              {selected.size === recipients.length ? 'Limpar' : 'Todos'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recipients.map(r => (
              <button type="button" key={r.id} onClick={() => toggle(r.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selected.has(r.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {reminderAt && (
          <p className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-3 py-2">
            {selected.size === 0 ? 'Ninguém selecionado: ninguém será avisado.'
              : reminderAt < new Date() ? 'Falta menos de 24h: o aviso sai em poucos minutos.'
              : `O aviso sai em ${format(reminderAt, "dd/MM 'às' HH:mm")} (24h antes).`}
          </p>
        )}

        <Textarea label="Observações (vão no aviso)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional" />
      </form>
    </Modal>
  );
}
