import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';

export function MembersArea() {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setMembers(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMembers();
    const interval = setInterval(fetchMembers, 10000);
    return () => clearInterval(interval);
  }, []);

  const roleColors: Record<string, string> = {
    admin: 'bg-violet-100 text-violet-700 border-violet-200',
    dev: 'bg-blue-100 text-blue-700 border-blue-200',
    designer: 'bg-pink-100 text-pink-700 border-pink-200',
    qa: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const getRoleColor = (role: string) => {
    const key = role?.toLowerCase().split(' ')[0] ?? '';
    return roleColors[key] ?? 'bg-indigo-100 text-indigo-700 border-indigo-200';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header stat bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Membros Ativos', value: members.filter(m => m.active !== false).length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total de Membros', value: members.length, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Admins', value: members.filter(m => m.role === 'admin').length, icon: ShieldCheck, color: 'text-violet-600 bg-violet-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {members.map((member, i) => (
          <motion.div
            key={member.uid ?? member.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-indigo-100/40 transition-all group"
          >
            {/* Top accent */}
            <div className="h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500" />

            <div className="p-6">
              {/* Avatar + status */}
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
                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{member.displayName}</h3>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border ${getRoleColor(member.role)}`}>
                  {member.role || 'Membro'}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate text-[11px]">{member.email}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">Nenhum membro encontrado.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
