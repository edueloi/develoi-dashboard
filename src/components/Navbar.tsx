import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LayoutDashboard, ArrowRight, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import develoiLogo from '../images/develoi-logo.png';

const navItems = [
  { name: 'Início', path: '/' },
  { name: 'Quem Somos', path: '/sobre' },
  { name: 'Valores', path: '/valores' },
  { name: 'Dúvidas', path: '/duvidas' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] px-4 sm:px-5 md:px-8 py-2.5 sm:py-3 md:py-4 flex items-center justify-between transition-all duration-500 border ${
            scrolled
              ? 'dash-surface-2/80 backdrop-blur-2xl dash-border shadow-xl'
              : 'dash-surface/40 backdrop-blur-sm dash-border'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-white rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-white/10 flex-shrink-0"
            >
              <img
                src={develoiLogo}
                alt="Develoi"
                className="w-full h-full object-contain p-0.5"
              />
            </motion.div>
            <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter dash-text group-hover:text-indigo-600 transition-colors duration-300">
              DEVELOI
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 2xl:gap-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-[10px] xl:text-xs font-black uppercase tracking-[0.15em] xl:tracking-[0.2em] transition-all duration-300 relative group whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'dash-text'
                    : 'dash-text-2 hover:dash-text'
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ${
                    location.pathname === item.path ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}

            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center gap-1.5 xl:gap-2 text-[10px] xl:text-xs font-black uppercase tracking-[0.15em] xl:tracking-[0.2em] text-indigo-600 hover:text-indigo-700 transition-colors duration-300 group whitespace-nowrap"
            >
              <LayoutDashboard className="w-3.5 h-3.5 xl:w-4 xl:h-4 group-hover:rotate-12 transition-transform duration-300" />
              {user ? 'Dashboard' : 'Membros'}
            </Link>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center dash-surface border dash-border dash-text hover:dash-surface-2 transition-all shadow-sm"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Link
                to="/#contato"
                className="relative px-5 xl:px-6 2xl:px-8 py-2 xl:py-2.5 md:py-3 bg-indigo-600 text-white font-black rounded-xl xl:rounded-2xl text-[10px] xl:text-xs overflow-hidden group flex items-center gap-1.5 xl:gap-2 shadow-lg shadow-indigo-200 transition-all"
              >
                <span className="relative z-10 flex items-center gap-1.5 xl:gap-2">
                  CONTRATAR
                  <ArrowRight className="w-3 h-3 xl:w-3.5 xl:h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl dash-surface border dash-border flex items-center justify-center dash-text shadow-sm"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl dash-surface border dash-border flex items-center justify-center dash-text flex-shrink-0 shadow-sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
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
            initial={{ opacity: 0, y: -15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden absolute top-full left-3 right-3 sm:left-4 sm:right-4 mt-2 sm:mt-3 dash-surface/95 backdrop-blur-3xl rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border dash-border shadow-2xl"
          >
            {/* Logo in mobile menu */}
            <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-8 pb-4 sm:pb-6 border-b dash-border">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tighter dash-text">DEVELOI</span>
            </div>

            <div className="flex flex-col gap-1 sm:gap-2">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between py-3 sm:py-4 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-all duration-300 group ${
                      location.pathname === item.path
                        ? 'bg-indigo-500/10 text-indigo-600'
                        : 'dash-text hover:bg-indigo-500/5 hover:text-indigo-600'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="text-lg sm:text-xl font-black tracking-tighter">{item.name}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.06 }}
              >
                <Link
                  to={user ? '/dashboard' : '/login'}
                  className="flex items-center gap-2.5 sm:gap-3 py-3 sm:py-4 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-indigo-600 hover:bg-indigo-500/10 transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-lg sm:text-xl font-black tracking-tighter">
                    {user ? 'Dashboard' : 'Área de Membros'}
                  </span>
                </Link>
              </motion.div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent my-4 sm:my-6" />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Link
                to="/#contato"
                className="block w-full py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-xl sm:rounded-2xl text-center text-base sm:text-lg shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setIsOpen(false)}
              >
                CONTRATAR AGORA
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
