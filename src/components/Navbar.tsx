import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LayoutDashboard, ArrowUpRight, ChevronRight, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Início', path: '/' },
  { name: 'Quem Somos', path: '/sobre' },
  { name: 'Projetos', path: '/projetos' },
  { name: 'Blog', path: '/blog' },
  { name: 'Valores', path: '/valores' },
  { name: 'Dúvidas', path: '/duvidas' },
  { name: 'Contato', path: '/contato' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between px-6 sm:px-10 lg:px-16"
          style={{
            background: scrolled ? 'rgba(6,17,43,0.98)' : 'rgba(6,17,43,0.82)',
            backdropFilter: 'blur(20px)',
            height: '66px',
            borderBottom: scrolled ? '1px solid rgba(196,154,42,0.18)' : '1px solid transparent',
            boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.35)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Logo branco à esquerda */}
          <Link to="/" className="flex-shrink-0 group">
            <img
              src="/LOGO-MENU-BRANCO.png"
              alt="Develoi"
              className="h-8 w-auto object-contain transition-opacity duration-200 group-hover:opacity-75"
            />
          </Link>

          {/* Links centrais — desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="relative text-[13px] font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap"
                style={{ color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.5)'}
              >
                {item.name}
                {isActive(item.path) && (
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: 'var(--brand-gold)' }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Ações direita — desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Nossa Equipe */}
            <Link
              to="/sobre"
              className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'}
            >
              <Users className="w-3.5 h-3.5" />
              Nossa Equipe
            </Link>

            {/* Dashboard se logado */}
            {user && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}

            {/* Membros (login) */}
            {!user && (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Membros
              </Link>
            )}

            {/* CTA gold */}
            <Link
              to="/#contato"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-black transition-all duration-200 hover:-translate-y-px hover:opacity-90"
              style={{
                background: 'var(--brand-gold)',
                color: '#06112B',
                boxShadow: '0 4px 16px rgba(196,154,42,0.3)',
              }}
            >
              FALE CONOSCO
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
        </motion.div>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60]"
              style={{ background: 'rgba(6,17,43,0.75)', backdropFilter: 'blur(6px)' }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 38 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[340px] flex flex-col"
              style={{
                background: '#06112B',
                boxShadow: '-8px 0 48px rgba(0,0,0,0.45)',
                borderLeft: '1px solid rgba(196,154,42,0.12)',
              }}
            >
              {/* Linha dourada topo */}
              <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.15))' }} />

              {/* Header drawer */}
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <img src="/LOGO-MENU-BRANCO.png" alt="Develoi" className="h-7 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-4 py-5">
                <p className="px-3 mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Navegação
                </p>
                <div className="flex flex-col gap-0.5">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.045 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group"
                        style={{
                          background: isActive(item.path) ? 'rgba(196,154,42,0.1)' : 'transparent',
                          color: isActive(item.path) ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)',
                        }}
                        onMouseEnter={e => { if (!isActive(item.path)) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (!isActive(item.path)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <span className="text-sm font-semibold">{item.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="my-4 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

                {/* Nossa Equipe */}
                <Link
                  to="/sobre"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-semibold">Nossa Equipe</span>
                </Link>

                {/* Membros / Dashboard */}
                <Link
                  to={user ? '/dashboard' : '/login'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-semibold">{user ? 'Dashboard' : 'Área de Membros'}</span>
                </Link>
              </div>

              {/* CTA footer */}
              <div className="px-5 pb-8 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-center text-[11px] font-medium mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Pronto para transformar seu negócio?
                </p>
                <Link
                  to="/#contato"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-black transition-all hover:opacity-90"
                  style={{
                    background: 'var(--brand-gold)',
                    color: '#06112B',
                    boxShadow: '0 4px 16px rgba(196,154,42,0.25)',
                  }}
                >
                  FALE CONOSCO
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
