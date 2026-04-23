import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, Mail, ShieldCheck, Plus, Trash2, UserPlus, X, Shield, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge, BadgeColor } from '../ui/Badge';

export function MembersArea() {
  const [members, setMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New member form state
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-4 flex-1">
          {[
            { label: 'Membros Ativos', value: members.filter(m => m.active !== false).length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Total de Membros', value: members.length, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Admins', value: members.filter(m => m.role === 'admin').length, icon: ShieldCheck, color: 'text-violet-600 bg-violet-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="md:self-center h-fit">
          <UserPlus className="w-4 h-4 mr-2" /> NOVO MEMBRO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {members.map((member, i) => (
          <motion.div
            key={member.uid ?? member.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-indigo-100/40 transition-all group relative"
          >
            <div className="h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500" />
            
            <div className="p-6 pt-8">
              {member.role === 'admin' && (
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-violet-50 border border-violet-100 rounded text-[8px] font-black text-violet-600 uppercase tracking-widest">
                  ROOT ACCESS
                </div>
              )}
              
              <button 
                onClick={() => handleDeleteMember(member.uid)}
                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="relative w-16 h-16 mx-auto mb-4">
                {member.photoURL ? (
                  <img src={member.photoURL} alt="" className="w-full h-full rounded-full border-4 border-white shadow-md object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-black text-white border-4 border-white shadow-md">
                    {member.displayName?.[0]?.toUpperCase() ?? 'D'}
                  </div>
                )}
                <div className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${member.active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div className="text-center mb-4">
                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">{member.displayName}</h3>
                <Badge color={getRoleConfig(member.role).color} dot>
                  {getRoleConfig(member.role).label}
                </Badge>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate text-[11px] font-medium">{member.email}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <UserPlus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">Nenhum membro cadastrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal isOpen={true} onClose={() => setIsModalOpen(false)} title="Novo Membro" size="md">
          <form onSubmit={handleAddMember} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                  value={newMember.displayName} 
                  onChange={e => setNewMember({...newMember, displayName: e.target.value})}
                  placeholder="Nome do colaborador ou cliente"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">E-mail de Acesso</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required 
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                  value={newMember.email} 
                  onChange={e => setNewMember({...newMember, email: e.target.value})}
                  placeholder="exemplo@develoi.com.br"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Senha Inicial</label>
                <input 
                  required 
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                  value={newMember.password} 
                  onChange={e => setNewMember({...newMember, password: e.target.value})}
                  placeholder="Senha de acesso"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Cargo / Função</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none cursor-pointer"
                  value={newMember.role}
                  onChange={e => setNewMember({...newMember, role: e.target.value})}
                >
                  <option value="viewer">Visualizador (Cliente)</option>
                  <option value="dev">Desenvolvedor</option>
                  <option value="designer">Designer</option>
                  <option value="qa">QA / Testes</option>
                  <option value="admin">Administrador (Root)</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" loading={loading} className="w-full h-11">
                CADASTRAR MEMBRO NA ELITE
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
