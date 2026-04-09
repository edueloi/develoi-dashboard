import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import develoiLogo from '../images/develoi-logo.png';

export default function Login() {
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-[#030303] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-aurora-blue/20 border-t-aurora-blue rounded-full"
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

  const inputBase = (field: string) =>
    `w-full pl-12 pr-4 py-4 bg-white/[0.03] border rounded-2xl focus:outline-none transition-all duration-300 text-white text-sm placeholder:text-neutral-600 ${
      focused === field
        ? 'border-aurora-blue/60 shadow-[0_0_24px_rgba(0,210,255,0.10)] bg-white/[0.05]'
        : 'border-white/[0.07] hover:border-white/[0.14]'
    }`;

  return (
    <div className="min-h-[100svh] bg-[#030303] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="aurora-blur w-[500px] h-[500px] bg-aurora-blue/15 -top-1/4 -left-1/4"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="aurora-blur w-[600px] h-[600px] bg-aurora-purple/15 -bottom-1/4 -right-1/4"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.03, 0.12, 0.03] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="aurora-blur w-[700px] h-[700px] bg-aurora-pink/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,210,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo + Brand */}
          <div className="text-center mb-8 sm:mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-white/10 overflow-hidden"
            >
              <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain p-1" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-1">
                DEVELOI <span className="text-gradient">HUB</span>
              </h1>
              <p className="text-neutral-500 text-sm sm:text-base">
                Acesso exclusivo para o time de elite.
              </p>
            </motion.div>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-strong rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 border-white/[0.07] relative overflow-hidden"
          >
            {/* Card gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-blue/[0.04] to-aurora-purple/[0.04] rounded-[2rem] sm:rounded-[2.5rem] pointer-events-none" />
            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-aurora-blue/40 to-transparent" />

            <form onSubmit={handleSubmit} className="relative space-y-4 sm:space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                      focused === 'email' ? 'text-aurora-blue' : 'text-neutral-500'
                    }`}
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="admin@develoi.com.br"
                    className={inputBase('email')}
                    value={email}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                      focused === 'password' ? 'text-aurora-blue' : 'text-neutral-500'
                    }`}
                  />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className={`${inputBase('password')} pr-12`}
                    value={password}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    rememberMe
                      ? 'bg-aurora-blue border-aurora-blue shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                      : 'bg-transparent border-white/20 hover:border-white/40'
                  }`}
                  aria-label="Lembrar-me"
                >
                  {rememberMe && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-3 h-3 text-black"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </button>
                <span
                  className="text-xs sm:text-sm text-neutral-400 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Lembrar-me neste dispositivo
                </span>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {status === 'error' && error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                whileHover={status !== 'loading' ? { scale: 1.02 } : {}}
                whileTap={status !== 'loading' ? { scale: 0.98 } : {}}
                disabled={status === 'loading'}
                type="submit"
                className="w-full py-4 sm:py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-white/5 relative overflow-hidden group transition-all disabled:opacity-60 text-sm sm:text-base mt-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-2.5 group-hover:text-white transition-colors duration-300">
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      ENTRANDO...
                    </>
                  ) : (
                    <>
                      ACESSAR DASHBOARD
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-6 sm:my-7">
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: ShieldCheck, label: 'Seguro', color: 'text-aurora-green' },
                { icon: Zap, label: 'Rápido', color: 'text-yellow-400' },
                { icon: Lock, label: 'Privado', color: 'text-aurora-blue' },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 py-3 sm:py-4 px-2 glass-card rounded-xl sm:rounded-2xl border border-white/[0.04] hover:border-white/[0.10] transition-all duration-300"
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-5 sm:mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-600"
          >
            DEVELOI INTERNAL SYSTEMS v2.0
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
