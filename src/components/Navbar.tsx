import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LayoutDashboard, ArrowRight } from 'lucide-react';
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
    setScrolled(latest > 50);
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-2xl px-5 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between transition-all duration-400 ${
            scrolled
              ? 'bg-white/95 backdrop-blur-2xl shadow-[0_4px_24px_rgba(13,31,78,0.1)] border border-slate-200/80'
              : 'bg-white/80 backdrop-blur-md border border-slate-200/60'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              <img
                src={develoiLogo}
                alt="Develoi"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <span
              className="text-lg sm:text-xl font-black tracking-tight transition-colors duration-300"
              style={{ color: 'var(--brand-navy)' }}
            >
              DEVELOI
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-7 xl:gap-9">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-[11px] xl:text-xs font-bold uppercase tracking-[0.14em] transition-all duration-250 relative group whitespace-nowrap ${
                  isActive(item.path)
                    ? 'text-[var(--brand-gold)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--brand-navy)]'
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] rounded-full transition-all duration-300 ${
                    isActive(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                  style={{ background: 'var(--brand-gold)' }}
                />
              </Link>
            ))}

            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center gap-1.5 text-[11px] xl:text-xs font-bold uppercase tracking-[0.14em] transition-all duration-250 group whitespace-nowrap"
              style={{ color: 'var(--brand-navy)' }}
            >
              <LayoutDashboard className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
              {user ? 'Dashboard' : 'Membros'}
            </Link>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-shrink-0">
              <Link
                to="/#contato"
                className="relative px-5 xl:px-6 py-2.5 rounded-xl text-white font-bold text-[11px] xl:text-xs overflow-hidden group flex items-center gap-2 transition-all duration-250 hover:shadow-[0_6px_20px_rgba(13,31,78,0.3)] hover:-translate-y-px"
                style={{ background: 'var(--brand-navy)' }}
              >
                FALAR COM A DEVELOI
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile toggle */}
          <div className="lg:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-white/98 backdrop-blur-2xl rounded-2xl p-6 border border-slate-200 shadow-[0_16px_48px_rgba(13,31,78,0.12)]"
          >
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight" style={{ color: 'var(--brand-navy)' }}>DEVELOI</span>
            </div>

            <div className="flex flex-col gap-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all duration-200 group font-bold text-base ${
                      isActive(item.path)
                        ? 'text-[var(--brand-gold)] bg-amber-50'
                        : 'text-[var(--text-primary)] hover:bg-slate-50 hover:text-[var(--brand-navy)]'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
              >
                <Link
                  to={user ? '/dashboard' : '/login'}
                  className="flex items-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-base transition-all duration-200 hover:bg-slate-50"
                  style={{ color: 'var(--brand-navy)' }}
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>{user ? 'Dashboard' : 'Área de Membros'}</span>
                </Link>
              </motion.div>
            </div>

            <div className="h-px bg-slate-100 my-5" />

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <Link
                to="/#contato"
                className="block w-full py-4 text-white font-black rounded-xl text-center text-base transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'var(--brand-navy)' }}
                onClick={() => setIsOpen(false)}
              >
                FALAR COM A DEVELOI
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
