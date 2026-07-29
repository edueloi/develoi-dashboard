import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  AlertTriangle, Check, Edit2, KeyRound, Lock, Mail,
  ShieldCheck, Trash2, User, UserPlus, Users,
  Crown, Code2, Palette, TestTube, Eye
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
  photoURL?: string;
  active?: boolean;
  createdAt?: string;
}

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
function MemberCard({ member, onDelete, onEdit }: { member: Member; onDelete: () => void; onEdit: () => void }) {
  const cfg = getRoleConfig(member.role);
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border group relative flex flex-col overflow-hidden transition-all duration-200"
      style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.06)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(13,31,78,0.1)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(13,31,78,0.06)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
      }}
    >
      {/* stripe topo */}
      <div className="h-[3px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.1))' }} />

      {/* ações hover */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={onEdit}
          title="Editar membro"
          className="p-1.5 text-slate-400 hover:text-[var(--brand-navy)] hover:bg-slate-100 rounded-lg transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="Remover membro"
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col min-w-0">
        {/* avatar + role badge */}
        <div className="flex items-start gap-3 mb-4 min-w-0">
          <Avatar member={member} size="sm" />
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm leading-tight truncate mb-1.5" style={{ color: 'var(--brand-navy)' }}>
              {member.displayName}
            </h3>
            <div className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-slate-400 shrink-0" />
              <Badge color={cfg.color} dot pill>{cfg.short}</Badge>
            </div>
          </div>
        </div>

        {/* email */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 min-w-0">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500 truncate">{member.email}</span>
        </div>
      </div>

      {/* rodapé */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50 min-w-0">
          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-500 truncate">{cfg.desc}</span>
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

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setMembers(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMembers();
    const iv = setInterval(fetchMembers, 10000);
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* stats + botão */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <StatGrid cols={3} className="flex-1">
          <StatCard title="Membros Ativos" value={actives} icon={Users} color="success" delay={0.1} />
          <StatCard title="Total de Membros" value={members.length} icon={User} color="info" delay={0.2} />
          <StatCard title="Admins" value={admins} icon={ShieldCheck} color="purple" delay={0.3} />
        </StatGrid>

        <Button size="sm" onClick={() => setShowAdd(true)} iconLeft={<UserPlus className="w-3.5 h-3.5" />}>
          NOVO MEMBRO
        </Button>
      </div>

      {/* legenda de roles */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => {
          const Icon = r.icon;
          const count = members.filter(m => getRoleConfig(m.role).value === r.value).length;
          return (
            <div
              key={r.value}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border text-[11px] font-bold"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Icon className="w-3 h-3 text-slate-400" />
              <span style={{ color: 'var(--brand-navy)' }}>{r.label}</span>
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{count}</span>
            </div>
          );
        })}
      </div>

      {/* cards */}
      <div className="grid gap-3 pb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {members.map((m, i) => (
          <motion.div key={m.uid} transition={{ delay: i * 0.04 }}>
            <MemberCard
              member={m}
              onDelete={() => setDeleteTarget(m)}
              onEdit={() => setEditTarget(m)}
            />
          </motion.div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Users}
              title="Ainda não há membros"
              description="Convide sua equipe ou seus clientes para colaborarem nos projetos."
              className="py-12"
            />
          </div>
        )}
      </div>

      {/* modais */}
      <AnimatePresence>
        {showAdd && (
          <AddMemberModal key="add" onClose={() => setShowAdd(false)} onSuccess={fetchMembers} />
        )}
        {editTarget && (
          <EditMemberModal key="edit" member={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchMembers} />
        )}
        {deleteTarget && <ConfirmModal key="delete" isOpen title="Remover membro" message={`Remover ${deleteTarget.displayName} do sistema? Esta ação não pode ser desfeita.`} confirmLabel="REMOVER" variant="danger" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
