import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, Rocket, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, signIn, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.05)_0%,transparent_50%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center relative shadow-2xl shadow-indigo-100/50"
      >
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
          <span className="text-white font-bold text-3xl">D</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">DEVELOI <span className="text-indigo-600">HUB</span></h1>
        <p className="text-slate-500 mb-10 text-sm font-medium">Acesso exclusivo para o time de elite.</p>

        <div className="space-y-4">
          <button 
            onClick={signIn}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
          >
            <LogIn className="w-5 h-5" /> ENTRAR COM GOOGLE
          </button>
          
          <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-50">
            <FeatureIcon icon={ShieldCheck} label="Seguro" />
            <FeatureIcon icon={Rocket} label="Rápido" />
            <FeatureIcon icon={Zap} label="Elite" />
          </div>
        </div>

        <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">
          DEVELOI INTERNAL SYSTEMS v2.0
        </p>
      </motion.div>
    </div>
  );
}

function FeatureIcon({ icon: Icon, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}
