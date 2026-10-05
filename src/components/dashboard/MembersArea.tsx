import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  AlertTriangle, Check, Edit2, KeyRound, Lock, Mail,
  ShieldCheck, Trash2, User, UserPlus, Users,
  Crown, Code2, Palette, TestTube, Eye, Link2, Unlink, Search, MapPin, Sparkles, X
} from 'lucide-react';
import { Badge, Button, ConfirmModal, EmptyState, Input, Modal, StatCard, StatGrid } from '../ui';
import type { BadgeColor } from '../ui/Badge';
import { cn } from '../../lib/utils';

// ─── tipos ──────────────────────────────────────────────────────────────────
interface Member {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string | null;
  bio?: string | null;
  teamMemberId?: string | null;
  team?: { id: string; name: string; role: string; location?: string | null; specialty?: string | null; yearsExp?: number | null } | null;
  active?: boolean;
  createdAt?: string;
}
interface TeamProfile { id: string; name: string; role: string; bio?: string | null; photoURL?: string | null; specialty?: string | null; location?: string | null }

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();

// ─── helpers ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'admin',    label: 'Administrador',  short: 'ADMIN',  color: 'purple' as BadgeColor, icon: Crown,    desc: 'Acesso total ao sistema' },
  { value: 'dev',      label: 'Desenvolvedor',  short: 'DEV',    color: 'info'   as BadgeColor, icon: Code2,    desc: 'Backlog, board e projetos' },
  { value: 'designer', label: 'Designer',       short: 'DESIGN', color: 'primary'as BadgeColor, icon: Palette,  desc: 'Assets e entregas visuais' },
  { value: 'qa',       label: 'QA / Testes',    short: 'QA',     color: 'success'as BadgeColor, icon: TestTube, desc: 'Testes e validação' },
  { value: 'viewer',   label: 'Visualizador',   short: 'VIEWER', color: 'default'as BadgeColor, icon: Eye,      desc: 'Apenas leitura (clientes)' },
];

function getRoleConfig(role: string) {
  const r = role?.toLowerCase() ?? 'viewer';
  return ROLES.find(x => r.includes(x.value)) ?? ROLES[4];
}

function Avatar({ member, size = 'md' }: { member: Member; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-14 h-14 text-lg';
  return (
    <div className={cn('relative shrink-0', sz)}>
      {member.photoURL ? (
        <img src={member.photoURL} alt="" className="w-full h-full rounded-2xl object-cover border-4 border-white shadow-lg" />
      ) : (
        <div className="w-full h-full rounded-2xl flex items-center justify-center font-black text-white border-4 border-white shadow-lg" style={{ background: 'var(--brand-navy)' }}>
          {member.displayName?.[0]?.toUpperCase() ?? 'D'}
        </div>
      )}
      <span className={cn(
        'absolute -bottom-1 -right-1 rounded-full border-2 border-white',
        size === 'lg' ? 'w-4 h-4' : 'w-3 h-3',
        member.active !== false ? 'bg-emerald-500' : 'bg-slate-300'
      )} />
    </div>
  );
}

// ─── role picker (reutilizado em Add e Edit) ─────────────────────────────────
function RolePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
        Permissão / Cargo
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROLES.map(r => {
          const Icon = r.icon;
          const active = value === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange(r.value)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all min-w-0',
                active ? 'border-[var(--brand-gold)] bg-amber-50' : 'border-slate-100 hover:border-slate-200 bg-white'
              )}
            >
              <div
                className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', !active && 'bg-slate-100 text-slate-400')}
                style={active ? { background: 'var(--brand-navy)', color: 'white' } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-bold truncate', active ? 'text-slate-800' : 'text-slate-600')}>{r.label}</div>
                <div className="text-[11px] text-slate-400 truncate">{r.desc}</div>
              </div>
              <div className={cn(
                'w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                active ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)]' : 'border-slate-200'
              )}>
                {active && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── modal de novo membro ────────────────────────────────────────────────────
function AddMemberModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', role: 'viewer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { onSuccess(); onClose(); }
      else { const d = await res.json(); setError(d.error || 'Erro ao criar usuário'); }
    } catch { setError('Erro de conexão'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Novo Membro" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Input
          label="Nome completo"
          required
          iconLeft={<User className="w-4 h-4" />}
          placeholder="Ex: Carlos Eduardo"
          value={form.displayName}
          onChange={e => setForm({ ...form, displayName: e.target.value })}
        />

        <Input
          label="E-mail de acesso"
          required
          type="email"
          iconLeft={<Mail className="w-4 h-4" />}
          placeholder="carlos@develoi.com.br"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <Input
          label="Senha inicial"
          required
          type="password"
          iconLeft={<Lock className="w-4 h-4" />}
          placeholder="••••••••"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <RolePicker value={form.role} onChange={v => setForm({ ...form, role: v })} />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-white font-black rounded-xl text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60 transition-all mt-2"
          style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
        >
          {loading ? 'CADASTRANDO...' : <><UserPlus className="w-4 h-4" /> CADASTRAR MEMBRO</>}
        </button>
      </form>
    </Modal>
  );
}

// ─── modal de edição de membro ───────────────────────────────────────────────
function EditMemberModal({ member, onClose, onSuccess }: { member: Member; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    displayName: member.displayName,
    email: member.email,
    role: member.role ?? 'viewer',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [changePassword, setChangePassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePassword && form.newPassword !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    setError('');
    const body: Record<string, string> = { displayName: form.displayName, email: form.email, role: form.role };
    if (changePassword && form.newPassword) body.password = form.newPassword;

    try {
      const res = await fetch(`/api/users/${member.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { onSuccess(); onClose(); }
      else { const d = await res.json(); setError(d.error || 'Erro ao atualizar'); }
    } catch { setError('Erro de conexão'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar Membro" size="md">
      <div className="flex items-center gap-3 mb-5 -mt-1">
        <Avatar member={member} size="sm" />
        <p className="text-xs text-slate-400 truncate">{member.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Input
          label="Nome completo"
          required
          iconLeft={<User className="w-4 h-4" />}
          value={form.displayName}
          onChange={e => setForm({ ...form, displayName: e.target.value })}
        />

        <Input
          label="E-mail"
          required
          type="email"
          iconLeft={<Mail className="w-4 h-4" />}
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <RolePicker value={form.role} onChange={v => setForm({ ...form, role: v })} />

        {/* toggle alterar senha */}
        <div>
          <button
            type="button"
            onClick={() => {
              setChangePassword(v => !v);
              setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }));
              setError('');
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 w-full transition-all',
              changePassword ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
            )}
          >
            <KeyRound className="w-4 h-4" />
            {changePassword ? 'Cancelar alteração de senha' : 'Alterar senha do membro'}
          </button>

          <AnimatePresence>
            {changePassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Nova senha"
                    required
                    type="password"
                    iconLeft={<Lock className="w-4 h-4" />}
                    placeholder="••••••••"
                    value={form.newPassword}
                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  />
                  <Input
                    label="Confirmar senha"
                    required
                    type="password"
                    iconLeft={<Lock className="w-4 h-4" />}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-white font-black rounded-xl text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60 transition-all mt-2"
          style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
        >
          {loading ? 'SALVANDO...' : <><Check className="w-4 h-4" /> SALVAR ALTERAÇÕES</>}
        </button>
      </form>
    </Modal>
  );
}

// ─── card de membro ──────────────────────────────────────────────────────────
// ─── vincular o membro a um perfil da "Nossa Equipe" (traz foto, descrição e cargo) ───
function LinkTeamModal({ member, onClose, onDone }: { member: Member; onClose: () => void; onDone: () => void }) {
  const [list, setList] = useState<TeamProfile[] | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/admin/team').then(r => r.json()).then(d => setList(Array.isArray(d) ? d : [])).catch(() => setList([])); }, []);

  const link = async (id: string | null) => {
    setBusy(true);
    try { await fetch(`/api/users/${member.uid}/link-team`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamMemberId: id }) }); onDone(); onClose(); }
    finally { setBusy(false); }
  };
  const mine = norm(member.displayName);
  const shown = (list ?? []).filter(t => !q.trim() || norm(`${t.name} ${t.role}`).includes(norm(q)))
    .sort((a, b) => (norm(b.name) === mine ? 1 : 0) - (norm(a.name) === mine ? 1 : 0) || (norm(b.name).split(' ')[0] === mine.split(' ')[0] ? 1 : 0) - (norm(a.name).split(' ')[0] === mine.split(' ')[0] ? 1 : 0));

  return (
    <Modal isOpen onClose={onClose} title={`Vincular ${member.displayName} à equipe`} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Escolha o perfil da página <b>Nossa Equipe</b>. A foto, a descrição e o cargo dele passam a aparecer aqui em Membros e nas miniaturas do Backlog e do Quadro.</p>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome ou cargo…" className="pl-9" />
        </div>
        {list === null ? <p className="text-center text-sm text-slate-400 py-8">Carregando…</p> : shown.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Nenhum perfil encontrado. Cadastre a pessoa em Nossa Equipe primeiro.</p>
        ) : (
          <ul className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
            {shown.map(t => {
              const mineMatch = norm(t.name).split(' ')[0] === mine.split(' ')[0];
              const current = member.teamMemberId === t.id;
              return (
                <li key={t.id}>
                  <button type="button" disabled={busy} onClick={() => link(t.id)} className={cn('w-full text-left flex items-center gap-3 p-3 rounded-2xl border-2 transition-all hover:shadow-md', current ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-200 hover:border-indigo-300')}>
                    {t.photoURL ? <img src={t.photoURL} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" /> : <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg flex-shrink-0" style={{ background: 'var(--brand-navy)' }}>{t.name[0]}</div>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap"><p className="font-black text-sm text-slate-900 truncate">{t.name}</p>{mineMatch && !current && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1"><Sparkles className="w-3 h-3" />Sugerido</span>}{current && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Vinculado</span>}</div>
                      <p className="text-xs font-bold text-[var(--brand-gold)] truncate">{t.role}</p>
                      {t.bio && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.bio}</p>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {member.teamMemberId && <Button variant="outline" loading={busy} onClick={() => link(null)} iconLeft={<Unlink className="w-4 h-4" />}>DESVINCULAR</Button>}
      </div>
    </Modal>
  );
}

function MemberCard({ member, onDelete, onEdit, onLink }: { member: Member; onDelete: () => void; onEdit: () => void; onLink: () => void }) {
  const cfg = getRoleConfig(member.role);
  const Icon = cfg.icon;
  const t = member.team;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border flex flex-col overflow-hidden h-full transition-shadow hover:shadow-xl min-w-0"
      style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.06)' }}>
      {/* capa com a foto em destaque */}
      <div className="relative h-24 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0D1F4E 0%, #1B3A8A 70%, #C49A2A 160%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="absolute top-3 right-3"><Badge color={cfg.color} dot pill>{cfg.short}</Badge></div>
        {member.teamMemberId && <span className="absolute top-3 left-3 text-[10px] font-black px-2 py-1 rounded-full bg-white/15 text-white flex items-center gap-1"><Link2 className="w-3 h-3" />Equipe</span>}
      </div>
      <div className="px-5 -mt-10 flex-shrink-0"><Avatar member={member} size="lg" /></div>

      <div className="p-5 pt-3 flex-1 flex flex-col gap-3 min-w-0">
        <div className="min-w-0">
          <h3 className="font-black text-base leading-tight truncate" style={{ color: 'var(--brand-navy)' }}>{member.displayName}</h3>
          <p className="text-xs font-bold truncate mt-0.5" style={{ color: 'var(--brand-gold)' }}>{t?.role || cfg.label}</p>
        </div>

        {member.bio ? <p className="text-xs leading-relaxed text-slate-500 line-clamp-4">{member.bio}</p> : <p className="text-xs text-slate-300 italic">Sem descrição. Vincule à equipe para trazer a descrição.</p>}

        <div className="flex flex-wrap gap-1.5">
          {t?.location && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500"><MapPin className="w-3 h-3" />{t.location}</span>}
          {t?.yearsExp ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">{t.yearsExp} anos de experiência</span> : null}
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-400"><Icon className="w-3 h-3" />{cfg.desc}</span>
        </div>

        <div className="flex items-center gap-2 pt-3 mt-auto border-t border-slate-100 min-w-0">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500 truncate">{member.email}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button onClick={onLink} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors col-span-3 sm:col-span-1"><Link2 className="w-3.5 h-3.5" />{member.teamMemberId ? 'Trocar' : 'Vincular'}</button>
          <button onClick={onEdit} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"><Edit2 className="w-3.5 h-3.5" />Editar</button>
          <button onClick={onDelete} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black border border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" />Remover</button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── componente principal ────────────────────────────────────────────────────
export function MembersArea() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [linkTarget, setLinkTarget] = useState<Member | null>(null);
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('all');

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMembers();
    const iv = setInterval(fetchMembers, 15000);
    return () => clearInterval(iv);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/users/${deleteTarget.uid}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const admins  = members.filter(m => m.role === 'admin').length;
  const actives = members.filter(m => m.active !== false).length;
  const linked  = members.filter(m => m.teamMemberId).length;
  const shown = members.filter(m => (roleF === 'all' || getRoleConfig(m.role).value === roleF) && (!q.trim() || norm(`${m.displayName} ${m.email} ${m.team?.role ?? ''}`).includes(norm(q))));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--brand-navy)' }}>Membros</h2>
          <p className="text-xs text-slate-400 mt-0.5">Quem tem acesso ao sistema. Vincule cada pessoa à página Nossa Equipe para trazer foto e descrição.</p>
        </div>
        <Button size="sm" className="self-start" onClick={() => setShowAdd(true)} iconLeft={<UserPlus className="w-3.5 h-3.5" />}>NOVO MEMBRO</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([['Membros ativos', actives, Users, '#15803D'], ['Total', members.length, User, '#2563EB'], ['Administradores', admins, ShieldCheck, '#7C3AED'], ['Vinculados à equipe', `${linked}/${members.length}`, Link2, '#C49A2A']] as const).map(([l, v, I, c]) => (
          <div key={l} className="bg-white rounded-2xl border p-3.5 flex items-center gap-3 min-w-0" style={{ borderColor: 'var(--border-color)' }}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c}15`, color: c }}><I className="w-5 h-5" /></span>
            <div className="min-w-0"><p className="text-xl font-black leading-none" style={{ color: c }}>{v}</p><p className="text-[11px] font-bold text-slate-500 truncate">{l}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar membro…" className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ value: 'all', label: 'Todos', icon: Users }, ...ROLES].map(r => {
            const I = r.icon;
            const count = r.value === 'all' ? members.length : members.filter(m => getRoleConfig(m.role).value === r.value).length;
            return (
              <button key={r.value} onClick={() => setRoleF(r.value)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black whitespace-nowrap flex-shrink-0"
                style={roleF === r.value ? { background: 'var(--brand-navy)', color: '#fff', borderColor: 'var(--brand-navy)' } : { borderColor: 'var(--border-color)', color: '#64748B', background: '#fff' }}>
                <I className="w-3 h-3" />{r.label}<span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 pb-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {shown.map((m, i) => (
          <motion.div key={m.uid} transition={{ delay: i * 0.03 }} className="min-w-0">
            <MemberCard member={m} onDelete={() => setDeleteTarget(m)} onEdit={() => setEditTarget(m)} onLink={() => setLinkTarget(m)} />
          </motion.div>
        ))}

        {shown.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={Users} title={members.length ? 'Nenhum membro encontrado' : 'Ainda não há membros'} description={members.length ? 'Troque o filtro ou a busca.' : 'Convide sua equipe ou seus clientes para colaborarem nos projetos.'} className="py-12" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddMemberModal key="add" onClose={() => setShowAdd(false)} onSuccess={fetchMembers} />}
        {editTarget && <EditMemberModal key="edit" member={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchMembers} />}
        {linkTarget && <LinkTeamModal key="link" member={linkTarget} onClose={() => setLinkTarget(null)} onDone={fetchMembers} />}
        {deleteTarget && <ConfirmModal key="delete" isOpen title="Remover membro" message={`Remover ${deleteTarget.displayName} do sistema? Esta ação não pode ser desfeita.`} confirmLabel="REMOVER" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} variant="danger" />}
      </AnimatePresence>
    </motion.div>
  );
}
