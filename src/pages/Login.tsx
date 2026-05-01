import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Zap, ArrowRight, Loader2, CheckCircle, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import develoiLogo from '../images/logo-develoi.png';
import develoiFullLogo from '../images/develoi-logo.jpeg';

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F2F8' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: '#C49A2A', borderTopColor: 'transparent' }}
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

  const inputStyle = (field: string) => ({
    background: focused === field ? '#fff' : '#F8F9FC',
    borderColor: focused === field ? '#0D1F4E' : '#DDE2EE',
    boxShadow: focused === field ? '0 0 0 3px rgba(13,31,78,0.08)' : 'none',
  });

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F2F8' }}>

      {/* ── LADO ESQUERDO — navy premium ── */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #06112B 0%, #0D1F4E 55%, #0A1840 100%)' }}
      >
        {/* Linha dourada topo */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.15))' }} />

        {/* Blur decorativo */}
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: 'var(--brand-gold)' }} />
        <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full blur-[100px] opacity-10" style={{ background: '#1A3070' }} />

        {/* Logo topo */}
        <div className="relative z-10 p-10 flex items-center justify-between">
          <img src="/LOGO-MENU-BRANCO.png" alt="Develoi" className="h-9 w-auto object-contain" />
          <a href="/" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Ir para o site
          </a>
        </div>

        {/* Conteúdo central */}
        <div className="flex-1 flex flex-col justify-center px-10 xl:px-14 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>
                Painel de Gestão
              </span>
            </div>

            <h1 className="font-black text-white leading-[1.05] tracking-tight mb-6" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
              Gestão inteligente{' '}
              <span style={{ color: 'var(--brand-gold)' }}>do seu negócio digital.</span>
            </h1>

            <p className="text-base leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '340px' }}>
              Acesse projetos, acompanhe entregas, gerencie equipe e controle o conteúdo do site — tudo em um só lugar.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, text: 'Acesso seguro com autenticação Firebase' },
                { icon: Zap, text: 'Gestão de projetos em tempo real' },
                { icon: Globe, text: 'Controle total do site público' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,154,42,0.12)', border: '1px solid rgba(196,154,42,0.2)' }}>
                    <item.icon className="w-4 h-4" style={{ color: 'var(--brand-gold)' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Rodapé esquerdo */}
        <div className="relative z-10 px-10 pb-10">
          <div className="pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
              © 2026 Develoi Soluções Digitais
            </p>
          </div>
        </div>
      </div>

      {/* ── LADO DIREITO — formulário ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12 relative">

        {/* Logo mobile */}
        <div className="lg:hidden mb-10 flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl shadow-sm border px-5 py-3" style={{ borderColor: '#E2E8F0' }}>
            <img src="/LOGO-MENU.png" alt="Develoi" className="h-8 w-auto object-contain" />
          </div>
          <a href="/" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-60" style={{ color: '#94A3B8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Voltar ao site
          </a>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Header formulário */}
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: '#0D1F4E' }}>
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          {/* Card do formulário */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-7 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  E-mail
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200`}
                    style={{ color: focused === 'email' ? '#0D1F4E' : '#94A3B8' }}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all duration-200"
                    style={{ ...inputStyle('email'), color: '#0D1F4E' }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Senha
                  </label>
                  <button type="button" className="text-[10px] font-bold uppercase tracking-widest transition-colors hover:opacity-70" style={{ color: 'var(--brand-gold)' }}>
                    Esqueci a senha
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200"
                    style={{ color: focused === 'password' ? '#0D1F4E' : '#94A3B8' }}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border text-sm font-medium outline-none transition-all duration-200"
                    style={{ ...inputStyle('password'), color: '#0D1F4E' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0D1F4E')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Lembrar */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background: rememberMe ? '#0D1F4E' : 'transparent',
                    borderColor: rememberMe ? '#0D1F4E' : '#DDE2EE',
                  }}
                >
                  {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                </button>
                <span
                  className="text-xs font-medium text-slate-400 cursor-pointer select-none"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Lembrar neste dispositivo
                </span>
              </div>

              {/* Erro */}
              <AnimatePresence>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}
                  >
                    <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-red-500">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão */}
              <motion.button
                type="submit"
                disabled={status === 'loading'}
                whileHover={status !== 'loading' ? { y: -1 } : {}}
                whileTap={status !== 'loading' ? { scale: 0.99 } : {}}
                className="w-full py-3.5 text-white font-black rounded-xl text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)',
                  boxShadow: '0 6px 20px rgba(13,31,78,0.25)',
                }}
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    ENTRAR NO SISTEMA
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Selos */}
            <div className="mt-6 pt-5 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid #EEF1F8' }}>
              {[
                { icon: ShieldCheck, label: 'Seguro', color: '#0D1F4E' },
                { icon: Zap, label: 'Performance', color: '#C49A2A' },
                { icon: Globe, label: 'Privado', color: '#15803D' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé direito */}
          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300">
            © 2026 Develoi Systems · v2.5.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
