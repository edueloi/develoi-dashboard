import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Zap, ArrowRight, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import develoiLogo from '../images/logo-develoi.png';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const { user, signIn, loading } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen dash-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await signIn(email, password, rememberMe);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen dash-bg flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-500">
      {/* Background Aurora Effects - Adapted for Light/Dark */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [-50, 50, -50], y: [-30, 30, -30] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [50, -50, 50], y: [30, -30, 30] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full"
        />
        <div className="absolute inset-0 noise-overlay opacity-[0.03]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo Section */}
          <div className="text-center mb-10">
             <motion.div
               whileHover={{ scale: 1.05, rotate: 5 }}
               className="inline-block relative"
             >
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 opacity-50" />
                <div className="relative w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl border dash-border overflow-hidden p-2">
                   <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain" />
                </div>
             </motion.div>
             <h1 className="mt-8 text-4xl font-black tracking-tighter dash-text flex items-center justify-center gap-3">
                DEVELOI <span className="text-indigo-600">HUB</span>
             </h1>
             <p className="mt-3 text-sm font-medium dash-text-2 opacity-60 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Acesso ao Dashboard
             </p>
          </div>

          {/* Login Card */}
          <div className="dash-surface border dash-border rounded-[3rem] p-8 sm:p-12 shadow-4xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl" />
             
             <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] dash-text-muted ml-1">Identificação / E-mail</label>
                   <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 ${focused === 'email' ? 'text-indigo-500' : 'text-slate-400'}`}>
                         <Mail className="w-5 h-5" />
                      </div>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                        placeholder="admin@develoi.com.br"
                        className="w-full pl-14 pr-6 py-4 dash-surface-2 border dash-border rounded-2xl dash-text text-sm font-medium placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] dash-text-muted">Senha de Acesso</label>
                      <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600">Esqueci a senha</button>
                   </div>
                   <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 ${focused === 'password' ? 'text-indigo-500' : 'text-slate-400'}`}>
                         <Lock className="w-5 h-5" />
                      </div>
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        placeholder="••••••••••••"
                        className="w-full pl-14 pr-14 py-4 dash-surface-2 border dash-border rounded-2xl dash-text text-sm font-medium placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                         {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                   </div>
                </div>

                <div className="flex items-center gap-3 ml-1">
                   <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200' : 'dash-surface-2 border dash-border'}`}
                   >
                      {rememberMe && <CheckCircle className="w-4 h-4 text-white" />}
                   </button>
                   <span className="text-xs font-bold dash-text-2 opacity-70 cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>Lembrar neste dispositivo</span>
                </div>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3"
                    >
                       <ShieldCheck className="w-5 h-5 text-rose-500" />
                       <p className="text-xs font-bold text-rose-500">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                >
                   {status === 'loading' ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <>ENTRAR NO SISTEMA <ArrowRight className="w-5 h-5" /></>
                   )}
                </button>
             </form>

             <div className="mt-12 pt-8 border-t dash-border grid grid-cols-3 gap-4">
                {[
                  { icon: ShieldCheck, label: 'Seguro', color: 'text-indigo-500' },
                  { icon: Zap, label: 'Performance', color: 'text-amber-500' },
                  { icon: ShieldCheck, label: 'Privado', color: 'text-emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                     <item.icon className={`w-5 h-5 ${item.color}`} />
                     <span className="text-[8px] font-black uppercase tracking-widest dash-text-muted">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>
          
          <p className="mt-10 text-center text-[10px] font-black uppercase tracking-[0.5em] dash-text-muted opacity-40">
             © 2026 DEVELOI SYSTEMS • V2.5.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
