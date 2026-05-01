import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LayoutDashboard, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import develoiLogo from '../images/logo-develoi.png';

const navItems = [
  { name: 'Início', path: '/' },
  { name: 'Quem Somos', path: '/sobre' },
  { name: 'Cases', path: '/cases' },
  { name: 'Blog', path: '/blog' },
  { name: 'Valores', path: '/valores' },
  { name: 'Dúvidas', path: '/duvidas' },
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
      {/* ── Desktop & Mobile bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        {/* Thin gold accent line at very top */}
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, var(--brand-navy) 0%, var(--brand-gold) 50%, var(--brand-navy) 100%)' }}
        />

        <div className="px-4 sm:px-6 pt-3 pb-2">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between transition-all duration-300"
              style={{
                background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: scrolled ? 'rgba(221,226,238,0.9)' : 'rgba(221,226,238,0.6)',
                boxShadow: scrolled ? '0 4px 28px rgba(13,31,78,0.09)' : '0 2px 12px rgba(13,31,78,0.04)',
                padding: '10px 20px',
              }}
            >
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain" />
                </div>
                <span
                  className="text-base sm:text-lg font-black tracking-tight leading-none"
                  style={{ color: 'var(--brand-navy)' }}
                >
                  develoi
                </span>
              </Link>

              {/* Desktop links — centered pill */}
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="relative px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap"
                    style={{
                      color: isActive(item.path) ? 'var(--brand-navy)' : 'var(--text-secondary)',
                      background: isActive(item.path) ? 'var(--bg-tertiary)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path)) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--brand-navy)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path)) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {item.name}
                    {isActive(item.path) && (
                      <motion.span
                        layoutId="nav-active-dot"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: 'var(--brand-gold)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* Desktop right actions */}
              <div className="hidden lg:flex items-center gap-2.5">
                <Link
                  to={user ? '/dashboard' : '/login'}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--brand-navy)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {user ? 'Dashboard' : 'Membros'}
                </Link>

                <Link
                  to="/#contato"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
                  style={{
                    background: 'var(--brand-navy)',
                    boxShadow: '0 2px 12px rgba(13,31,78,0.2)',
                  }}
                >
                  Falar com a Develoi
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--brand-navy)' }}
                aria-label="Abrir menu"
              >
                <Menu className="w-4.5 h-4.5" strokeWidth={2.5} />
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60]"
              style={{ background: 'rgba(13,31,78,0.35)', backdropFilter: 'blur(4px)' }}
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel — slides from right */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 38 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[340px] flex flex-col"
              style={{
                background: 'white',
                boxShadow: '-8px 0 48px rgba(13,31,78,0.14)',
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-6 py-5 border-b"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Link
                  to="/"
                  className="flex items-center gap-2.5"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-base font-black tracking-tight" style={{ color: 'var(--brand-navy)' }}>
                    develoi
                  </span>
                </Link>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  aria-label="Fechar menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p
                  className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Menu
                </p>
                <div className="flex flex-col gap-0.5">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.045, duration: 0.3 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-150 group"
                        style={{
                          background: isActive(item.path) ? 'var(--bg-tertiary)' : 'transparent',
                          color: isActive(item.path) ? 'var(--brand-navy)' : 'var(--text-secondary)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {isActive(item.path) && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: 'var(--brand-gold)' }}
                            />
                          )}
                          {!isActive(item.path) && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                          <span className="text-sm font-semibold">{item.name}</span>
                        </div>
                        <ChevronRight
                          className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-150"
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Divider */}
                <div className="my-4 h-px" style={{ background: 'var(--border-color)' }} />

                {/* Dashboard link */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.045 + 0.05 }}
                >
                  <Link
                    to={user ? '/dashboard' : '/login'}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--brand-navy)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    }}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold">
                      {user ? 'Dashboard' : 'Área de Membros'}
                    </span>
                  </Link>
                </motion.div>
              </div>

              {/* Drawer footer CTA */}
              <div className="px-4 pb-6 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {/* Small tagline */}
                  <p className="text-center text-[11px] mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Pronto para transformar seu negócio?
                  </p>
                  <Link
                    to="/#contato"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-navy-light) 100%)',
                      boxShadow: '0 4px 16px rgba(13,31,78,0.25)',
                    }}
                  >
                    Falar com a Develoi
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>

                  {/* Gold accent bar */}
                  <div
                    className="mt-3 h-1 w-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--brand-navy), var(--brand-gold))' }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
