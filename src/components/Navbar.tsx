import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LayoutDashboard, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Sobre', path: '/sobre' },
  { name: 'Serviços', path: '/#servicos' },
  { name: 'Cases', path: '/cases' },
  { name: 'Contato', path: '/#contato' },
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

  const isActive = (path: string) =>
    path.startsWith('/#') ? false : location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between px-6 sm:px-10 lg:px-16"
          style={{
            background: scrolled ? 'rgba(6,17,43,0.97)' : 'rgba(6,17,43,0.85)',
            backdropFilter: 'blur(20px)',
            height: '68px',
            borderBottom: scrolled ? '1px solid rgba(196,154,42,0.15)' : '1px solid transparent',
            boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.3)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Logo — grande à esquerda */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <img
              src="/LOGO-MENU.png"
              alt="Develoi"
              className="h-9 w-auto object-contain transition-opacity duration-200 group-hover:opacity-80"
            />
          </Link>

          {/* Links centrais — desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="relative text-sm font-semibold tracking-wide transition-all duration-200 whitespace-nowrap group"
                style={{ color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.55)'}
              >
                {item.name}
                {/* Underline dourado no hover/active */}
                <span
                  className="absolute -bottom-1 left-0 h-[2px] rounded-full transition-all duration-200"
                  style={{
                    width: isActive(item.path) ? '100%' : '0%',
                    background: 'var(--brand-gold)',
                  }}
                />
                <span
                  className="absolute -bottom-1 left-0 h-[2px] rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:w-full"
                  style={{ width: '0%', background: 'rgba(196,154,42,0.5)' }}
                />
              </Link>
            ))}
          </div>

          {/* Ações direita — desktop */}
          <div className="hidden lg:flex items-center gap-4">
            {user && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}
            <Link
              to="/#contato"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 hover:-translate-y-px hover:opacity-90"
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
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
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
              style={{ background: 'rgba(6,17,43,0.7)', backdropFilter: 'blur(6px)' }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 38 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[340px] flex flex-col"
              style={{ background: '#06112B', boxShadow: '-8px 0 48px rgba(0,0,0,0.4)', borderLeft: '1px solid rgba(196,154,42,0.12)' }}
            >
              {/* Linha dourada topo */}
              <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2))' }} />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <img src="/LOGO-MENU.png" alt="Develoi" className="h-8 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 overflow-y-auto px-4 py-5">
                <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Menu
                </p>
                <div className="flex flex-col gap-0.5">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 group"
                        style={{
                          background: isActive(item.path) ? 'rgba(196,154,42,0.1)' : 'transparent',
                          color: isActive(item.path) ? 'var(--brand-gold)' : 'rgba(255,255,255,0.6)',
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

                <div className="my-5 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

                {user && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold">Dashboard</span>
                  </Link>
                )}
              </div>

              {/* CTA footer */}
              <div className="px-5 pb-8 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <Link
                  to="/#contato"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 4px 16px rgba(196,154,42,0.25)' }}
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
