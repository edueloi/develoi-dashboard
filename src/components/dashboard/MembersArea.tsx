import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, Mail, Trash2, UserPlus, ShieldCheck, User, Lock, Users } from 'lucide-react';
import { Button, Modal, Badge, Input, Select, StatGrid, StatCard, EmptyState } from '../ui';
import type { BadgeColor } from '../ui/Badge';
import { cn } from '../../lib/utils';

export function MembersArea() {
  const [members, setMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newMember, setNewMember] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'viewer'
  });

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setMembers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMembers();
    const interval = setInterval(fetchMembers, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      if (response.ok) {
        setIsModalOpen(false);
        setNewMember({ displayName: '', email: '', password: '', role: 'viewer' });
        fetchMembers();
      } else {
        const err = await response.json();
        alert(err.error || 'Erro ao criar usuário');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (uid: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;
    try {
      await fetch(`/api/users/${uid}`, { method: 'DELETE' });
      fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleConfig = (role: string): { label: string; color: BadgeColor } => {
    const r = role?.toLowerCase() || 'viewer';
    if (r.includes('admin')) return { label: 'ADMIN', color: 'purple' };
    if (r.includes('dev')) return { label: 'DEV', color: 'info' };
    if (r.includes('designer')) return { label: 'DESIGN', color: 'primary' };
    if (r.includes('qa')) return { label: 'QA', color: 'success' };
    return { label: 'CLIENTE', color: 'default' };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <StatGrid cols={3} className="flex-1">
          <StatCard 
            title="Membros Ativos" 
            value={members.filter(m => m.active !== false).length} 
            icon={CheckCircle2} 
            color="success"
            delay={0.1}
          />
          <StatCard 
            title="Total de Membros" 
            value={members.length} 
            icon={Users} 
            color="info"
            delay={0.2}
          />
          <StatCard 
            title="Admins" 
            value={members.filter(m => m.role === 'admin').length} 
            icon={ShieldCheck} 
            color="purple"
            delay={0.3}
          />
        </StatGrid>
        
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
        >
          <UserPlus className="w-4 h-4" /> NOVO MEMBRO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {members.map((member, i) => (
          <motion.div
            key={member.uid ?? member.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border transition-all duration-250 group relative overflow-hidden"
            style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.06)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(13,31,78,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(13,31,78,0.06)'; }}
          >
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.1))' }} />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="relative w-16 h-16">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt="" className="w-full h-full rounded-2xl border-4 border-white shadow-xl object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-2xl flex items-center justify-center text-xl font-black text-white border-4 border-white shadow-xl" style={{ background: 'var(--brand-navy)' }}>
                      {member.displayName?.[0]?.toUpperCase() ?? 'D'}
                    </div>
                  )}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm",
                    member.active !== false ? "bg-emerald-500" : "bg-slate-300"
                  )} />
                </div>

                <button 
                  onClick={() => handleDeleteMember(member.uid)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-black text-lg mb-1.5 transition-colors truncate tracking-tight" style={{ color: 'var(--brand-navy)' }}>
                  {member.displayName}
                </h3>
                <Badge color={getRoleConfig(member.role).color} dot pill>
                  {getRoleConfig(member.role).label}
                </Badge>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="truncate text-xs font-bold text-slate-600">{member.email}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full">
            <EmptyState 
              icon={Users}
              title="Ainda não há membros"
              description="Convide sua equipe ou seus clientes para começarem a colaborar nos projetos."
              className="py-24"
            />
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal isOpen={true} onClose={() => setIsModalOpen(false)} title="Novo Membro" size="md">
          <form onSubmit={handleAddMember} className="space-y-6">
            <Input 
              label="Nome Completo"
              required
              iconLeft={<User className="w-4 h-4" />}
              placeholder="Ex: Carlos Eduardo"
              value={newMember.displayName} 
              onChange={e => setNewMember({...newMember, displayName: e.target.value})}
            />

            <Input 
              label="E-mail de Acesso"
              required
              type="email"
              iconLeft={<Mail className="w-4 h-4" />}
              placeholder="exemplo@develoi.com.br"
              value={newMember.email} 
              onChange={e => setNewMember({...newMember, email: e.target.value})}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Senha Inicial"
                required
                type="password"
                iconLeft={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
                value={newMember.password} 
                onChange={e => setNewMember({...newMember, password: e.target.value})}
              />
              <Select 
                label="Cargo / Função"
                value={newMember.role}
                onChange={e => setNewMember({...newMember, role: e.target.value})}
              >
                <option value="viewer">Visualizador (Cliente)</option>
                <option value="dev">Desenvolvedor</option>
                <option value="designer">Designer</option>
                <option value="qa">QA / Testes</option>
                <option value="admin">Administrador (Root)</option>
              </Select>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-4 py-3.5 text-white font-black rounded-xl text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all duration-200"
              style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
            >
              {loading ? 'CADASTRANDO...' : 'CADASTRAR MEMBRO'}
            </button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
