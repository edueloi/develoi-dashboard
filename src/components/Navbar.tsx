import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LayoutDashboard, ArrowUpRight, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface CaseCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count?: { cases: number };
}

const staticNavItems = [
  { name: 'Início', path: '/' },
  { name: 'Quem Somos', path: '/sobre' },
  { name: 'Blog', path: '/blog' },
  { name: 'Valores', path: '/valores' },
  { name: 'Dúvidas', path: '/duvidas' },
  { name: 'Contato', path: '/contato' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [projDropOpen, setProjDropOpen] = useState(false);
  const [projDropMobile, setProjDropMobile] = useState(false);
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const location = useLocation();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const dropRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  useEffect(() => {
    fetch('/api/cases-categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setProjDropOpen(false);
    setProjDropMobile(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const openDrop = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setProjDropOpen(true);
  };
  const schedulClose = () => {
    closeTimer.current = setTimeout(() => setProjDropOpen(false), 180);
  };

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
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <img
              src="/LOGO-MENU-BRANCO.png"
              alt="Develoi"
              className="h-10 w-auto object-contain transition-opacity duration-200 group-hover:opacity-75"
            />
          </Link>

          {/* Links centrais — desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Início */}
            <Link
              to="/"
              className="relative text-[13px] font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap"
              style={{ color: isActive('/') && location.pathname === '/' ? '#fff' : 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = location.pathname === '/' ? '#fff' : 'rgba(255,255,255,0.5)'}
            >
              Início
              {location.pathname === '/' && (
                <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              )}
            </Link>

            {/* Quem Somos */}
            <Link
              to="/sobre"
              className="relative text-[13px] font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap"
              style={{ color: isActive('/sobre') ? '#fff' : 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isActive('/sobre') ? '#fff' : 'rgba(255,255,255,0.5)'}
            >
              Quem Somos
              {isActive('/sobre') && <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />}
            </Link>

            {/* ── Projetos dropdown ── */}
            <div
              ref={dropRef}
              className="relative"
              onMouseEnter={openDrop}
              onMouseLeave={schedulClose}
            >
              <Link
                to="/projetos"
                className="flex items-center gap-1 text-[13px] font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap"
                style={{ color: isActive('/projetos') ? '#fff' : 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isActive('/projetos') ? '#fff' : 'rgba(255,255,255,0.5)'}
              >
                Projetos
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ transform: projDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
                {isActive('/projetos') && <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />}
              </Link>

              <AnimatePresence>
                {projDropOpen && (
                  <motion.div
                    key="proj-drop"
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-[calc(100%+18px)] left-1/2 -translate-x-1/2 z-50 rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.98)',
                      backdropFilter: 'blur(24px)',
                      boxShadow: '0 24px 80px rgba(6,17,43,0.22), 0 4px 20px rgba(6,17,43,0.12)',
                      border: '1px solid rgba(196,154,42,0.15)',
                      minWidth: '420px',
                    }}
                    onMouseEnter={openDrop}
                    onMouseLeave={schedulClose}
                  >
                    {/* Linha dourada topo */}
                    <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2) 70%, transparent)' }} />

                    <div className="p-6">
                      {/* Header */}
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-4" style={{ color: 'var(--brand-gold)' }}>
                        Nossos Projetos
                      </p>

                      {/* Link "Ver todos" */}
                      <Link
                        to="/projetos"
                        className="flex items-center justify-between p-3 rounded-xl mb-3 transition-all group"
                        style={{ background: 'linear-gradient(135deg, #06112B, #0D1F4E)', color: 'white' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,154,42,0.2)' }}>
                            <Folder className="w-4 h-4" style={{ color: 'var(--brand-gold)' }} />
                          </div>
                          <div>
                            <p className="text-[12px] font-black tracking-wide">Todos os Projetos</p>
                            <p className="text-[10px] font-medium opacity-55">Portfólio completo da Develoi</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Link>

                      {/* Categorias */}
                      {categories.length > 0 && (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3 mt-4" style={{ color: 'var(--text-muted, #9ca3af)' }}>
                            Por Categoria
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {categories.slice(0, 8).map(cat => (
                              <Link
                                key={cat.id}
                                to={`/projetos?category=${cat.slug}`}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all group"
                                style={{ color: 'var(--brand-navy, #06112B)' }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.background = `${cat.color}12`;
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                                }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: cat.color }}
                                />
                                <span className="text-[12px] font-semibold leading-tight">{cat.name}</span>
                                {cat._count && (
                                  <span className="ml-auto text-[10px] font-bold opacity-40">{cat._count.cases}</span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Restante dos links */}
            {[
              { name: 'Blog', path: '/blog' },
              { name: 'Valores', path: '/valores' },
              { name: 'Dúvidas', path: '/duvidas' },
              { name: 'Contato', path: '/contato' },
            ].map(item => (
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
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
                )}
              </Link>
            ))}
          </div>

          {/* Ações direita — desktop */}
          <div className="hidden lg:flex items-center gap-3">
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
            <Link
              to="/#contato"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-black transition-all duration-200 hover:-translate-y-px hover:opacity-90"
              style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 4px 16px rgba(196,154,42,0.3)' }}
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
              style={{ background: '#06112B', boxShadow: '-8px 0 48px rgba(0,0,0,0.45)', borderLeft: '1px solid rgba(196,154,42,0.12)' }}
            >
              <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.15))' }} />

              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <img src="/LOGO-MENU-BRANCO.png" alt="Develoi" className="h-9 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                <p className="px-3 mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Navegação
                </p>
                <div className="flex flex-col gap-0.5">
                  {/* Início */}
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                    style={{ background: location.pathname === '/' ? 'rgba(196,154,42,0.1)' : 'transparent', color: location.pathname === '/' ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                  >
                    <span className="text-sm font-semibold">Início</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                  </Link>

                  {/* Quem Somos */}
                  <Link
                    to="/sobre"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                    style={{ background: isActive('/sobre') ? 'rgba(196,154,42,0.1)' : 'transparent', color: isActive('/sobre') ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                  >
                    <span className="text-sm font-semibold">Quem Somos</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                  </Link>

                  {/* Projetos com expansão */}
                  <div>
                    <button
                      onClick={() => setProjDropMobile(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                      style={{ background: isActive('/projetos') ? 'rgba(196,154,42,0.1)' : 'transparent', color: isActive('/projetos') ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                    >
                      <span className="text-sm font-semibold">Projetos</span>
                      <ChevronDown
                        className="w-3.5 h-3.5 opacity-40 transition-transform duration-200"
                        style={{ transform: projDropMobile ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    <AnimatePresence>
                      {projDropMobile && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-1 pb-2 ml-4 pl-4 border-l" style={{ borderColor: 'rgba(196,154,42,0.2)' }}>
                            <Link
                              to="/projetos"
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm font-bold"
                              style={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                              <Folder className="w-3.5 h-3.5" style={{ color: 'var(--brand-gold)' }} />
                              Todos os Projetos
                            </Link>
                            {categories.slice(0, 6).map(cat => (
                              <Link
                                key={cat.id}
                                to={`/projetos?category=${cat.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[12px] font-semibold"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Resto dos links */}
                  {[
                    { name: 'Blog', path: '/blog' },
                    { name: 'Valores', path: '/valores' },
                    { name: 'Dúvidas', path: '/duvidas' },
                    { name: 'Contato', path: '/contato' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.045 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                        style={{ background: isActive(item.path) ? 'rgba(196,154,42,0.1)' : 'transparent', color: isActive(item.path) ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                      >
                        <span className="text-sm font-semibold">{item.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="my-4 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

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

              <div className="px-5 pb-8 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-center text-[11px] font-medium mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Pronto para transformar seu negócio?
                </p>
                <Link
                  to="/#contato"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-black transition-all hover:opacity-90"
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
