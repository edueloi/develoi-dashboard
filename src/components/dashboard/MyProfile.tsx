import { useState } from 'react';
import { User, Lock, Save, Eye, EyeOff, Camera, Shield, Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth, getToken } from '../../contexts/AuthContext';
import { Button, Input, PanelCard } from '../ui';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MyProfile() {
  const { profile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL ?? '');
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingInfo(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ displayName: displayName.trim(), photoURL: photoURL.trim() || null }),
      });
      if (!res.ok) throw new Error();
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    developer: 'Desenvolvedor',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl mx-auto"
    >
      {/* Hero card */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1F4E 0%, #1A3070 100%)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full -mr-20 -mt-20 blur-3xl opacity-20" style={{ background: 'var(--brand-gold)' }} />
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {photoURL ? (
              <img src={photoURL} alt="" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/10" />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black ring-4 ring-white/10"
                style={{ background: 'var(--brand-gold)', color: '#0D1F4E' }}
              >
                {profile?.displayName?.[0]?.toUpperCase() ?? 'D'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white leading-tight">{profile?.displayName}</h2>
            <p className="text-sm font-bold mt-1" style={{ color: 'rgba(196,154,42,0.9)' }}>
              {roleLabel[profile?.role ?? ''] ?? profile?.role}
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Info pessoal */}
      <PanelCard title="Informações Pessoais" icon={User}>
        <form onSubmit={handleSaveInfo} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Nome de exibição"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              required
            />
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                E-mail
              </label>
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{profile?.email}</span>
              </div>
            </div>
          </div>

          <Input
            label="URL da foto de perfil"
            value={photoURL}
            onChange={e => setPhotoURL(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Cargo / Função
              </label>
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{roleLabel[profile?.role ?? ''] ?? profile?.role}</span>
              </div>
            </div>
            {profile?.createdAt && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Membro desde
                </label>
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{format(new Date(profile.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={savingInfo} iconLeft={<Save className="w-4 h-4" />}>
              SALVAR INFORMAÇÕES
            </Button>
          </div>
        </form>
      </PanelCard>

      {/* Troca de senha */}
      <PanelCard title="Alterar Senha" icon={Lock}>
        <form onSubmit={handleSavePassword} className="space-y-5">
          <div className="relative">
            <Input
              label="Senha atual"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <Input
                label="Nova senha"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar nova senha"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs font-bold text-red-500">As senhas não coincidem.</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={savingPassword} iconLeft={<Lock className="w-4 h-4" />}>
              ALTERAR SENHA
            </Button>
          </div>
        </form>
      </PanelCard>
    </motion.div>
  );
}
