import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, Rocket, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, signIn, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aurora-blue/10 blur-[150px] -z-10 rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-12 rounded-[3rem] border-white/5 text-center relative"
      >
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-white/10">
          <span className="text-black font-black text-4xl">D</span>
        </div>

        <h1 className="text-4xl font-black tracking-tighter mb-4">DEVELOI <span className="text-gradient">HUB</span></h1>
        <p className="text-neutral-500 mb-12 font-medium">Acesso restrito para membros da elite Develoi.</p>

        <div className="space-y-6">
          <button 
            onClick={signIn}
            className="w-full py-6 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-4 shadow-xl shadow-white/5"
          >
            <LogIn className="w-6 h-6" /> ENTRAR COM GOOGLE
          </button>
          
          <div className="pt-8 grid grid-cols-3 gap-4">
            <FeatureIcon icon={ShieldCheck} label="Seguro" />
            <FeatureIcon icon={Rocket} label="Rápido" />
            <FeatureIcon icon={Zap} label="Elite" />
          </div>
        </div>

        <p className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-700">
          Powered by Aurora AI
        </p>
      </motion.div>
    </div>
  );
}

function FeatureIcon({ icon: Icon, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-500">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{label}</span>
    </div>
  );
}
