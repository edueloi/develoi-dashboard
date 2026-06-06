import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  AlertTriangle, Check, Edit2, KeyRound, Lock, Mail,
  ShieldCheck, Trash2, User, UserPlus, Users, X,
  Crown, Code2, Palette, TestTube, Eye
} from 'lucide-react';
import { Badge, EmptyState, Input, StatCard, StatGrid } from '../ui';
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
      <div className="grid grid-cols-1 gap-2">
        {ROLES.map(r => {
          const Icon = r.icon;
          const active = value === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange(r.value)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                active ? 'border-[var(--brand-gold)] bg-amber-50' : 'border-slate-100 hover:border-slate-200 bg-white'
              )}
            >
              <div
                className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', !active && 'bg-slate-100 text-slate-400')}
                style={active ? { background: 'var(--brand-navy)', color: 'white' } : {}}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-bold', active ? 'text-slate-800' : 'text-slate-600')}>{r.label}</div>
                <div className="text-xs text-slate-400 truncate">{r.desc}</div>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
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

// ─── modal de confirmação de deleção ────────────────────────────────────────
function ConfirmDeleteModal({ member, onConfirm, onClose }: { member: Member; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center z-10"
      >
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-black mb-2" style={{ color: 'var(--brand-navy)' }}>Remover membro?</h3>
        <p className="text-sm text-slate-500 mb-6">
          Você está prestes a remover <strong className="text-slate-700">{member.displayName}</strong> do sistema. Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            Sim, remover
          </button>
        </div>
      </motion.div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 z-10 overflow-hidden"
      >
        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--brand-navy)' }}>Novo Membro</h2>
              <p className="text-xs text-slate-400 mt-0.5">Preencha os dados para criar o acesso</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
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
      </motion.div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 z-10 overflow-hidden"
      >
        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <Avatar member={member} size="md" />
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--brand-navy)' }}>Editar Membro</h2>
              <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
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
                  <div className="grid grid-cols-2 gap-4 mt-4">
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
      </motion.div>
    </div>
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
      <div className="absolute top-5 right-5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={onEdit}
          title="Editar membro"
          className="p-2 text-slate-400 hover:text-[var(--brand-navy)] hover:bg-slate-100 rounded-xl transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="Remover membro"
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* avatar + role badge */}
        <div className="flex items-start gap-4 mb-5">
          <Avatar member={member} size="md" />
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-black text-base leading-tight truncate mb-2" style={{ color: 'var(--brand-navy)' }}>
              {member.displayName}
            </h3>
            <div className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-slate-400" />
              <Badge color={cfg.color} dot pill>{cfg.short}</Badge>
            </div>
          </div>
        </div>

        {/* email */}
        <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-xs font-medium text-slate-500 truncate">{member.email}</span>
        </div>
      </div>

      {/* rodapé */}
      <div className="px-6 pb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">{cfg.desc}</span>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* stats + botão */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <StatGrid cols={3} className="flex-1">
          <StatCard title="Membros Ativos" value={actives} icon={Users} color="success" delay={0.1} />
          <StatCard title="Total de Membros" value={members.length} icon={User} color="info" delay={0.2} />
          <StatCard title="Admins" value={admins} icon={ShieldCheck} color="purple" delay={0.3} />
        </StatGrid>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-white text-xs font-black px-5 py-3 rounded-xl transition-all hover:-translate-y-0.5 shrink-0"
          style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
        >
          <UserPlus className="w-4 h-4" /> NOVO MEMBRO
        </button>
      </div>

      {/* legenda de roles */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => {
          const Icon = r.icon;
          const count = members.filter(m => getRoleConfig(m.role).value === r.value).length;
          return (
            <div
              key={r.value}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border text-xs font-bold"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
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
              className="py-24"
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
        {deleteTarget && (
          <ConfirmDeleteModal key="delete" member={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
