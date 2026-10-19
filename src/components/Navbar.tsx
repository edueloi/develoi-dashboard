import { gsap, useGSAP } from '../lib/gsap';
import { Presence } from './motion/Presence';
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
  const navRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // entrada da barra + links em cascata
  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.1 });
    tl.from(navRef.current, { y: -24, opacity: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform,opacity' });
    tl.from('[data-nav="links"] > *', { y: -10, opacity: 0, duration: 0.5, stagger: 0.05, clearProps: 'transform,opacity' }, 0.25);
  }, { scope: navRef });

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
        <div
          ref={navRef}
          className="flex items-center justify-between px-6 sm:px-10 lg:px-16"
          style={{
            background: scrolled ? 'rgba(6,17,43,0.9)' : 'rgba(6,17,43,0.55)',
            backdropFilter: 'blur(18px) saturate(1.4)',
            height: '66px',
            borderBottom: scrolled ? '1px solid rgba(196,154,42,0.18)' : '1px solid transparent',
            boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.35)' : 'none',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
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
          <div data-nav="links" className="hidden lg:flex items-center gap-6">
            {/* Início */}
            <Link
              to="/"
              data-active={location.pathname === '/'}
              className="nav-link text-[13px] font-semibold tracking-wide whitespace-nowrap"
            >
              Início
            </Link>

            {/* Quem Somos */}
            <Link
              to="/sobre"
              data-active={isActive('/sobre')}
              className="nav-link text-[13px] font-semibold tracking-wide whitespace-nowrap"
            >
              Quem Somos
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
                data-active={isActive('/projetos')}
                className="nav-link flex items-center gap-1 text-[13px] font-semibold tracking-wide whitespace-nowrap"
              >
                Projetos
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ transform: projDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </Link>

              <Presence
                open={projDropOpen}
                enter={root => gsap.from(root.querySelector('[data-p="drop"]'), { opacity: 0, y: 10, scale: 0.97, duration: 0.3, ease: 'power3.out', clearProps: 'transform,opacity' })}
                exit={root => gsap.to(root.querySelector('[data-p="drop"]'), { opacity: 0, y: 8, scale: 0.97, duration: 0.18, ease: 'power2.in' })}
              >
                  <div
                    data-p="drop"
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
                        className="flex items-center justify-between p-3 rounded-xl mb-3 transition-[transform,opacity,color,background-color,border-color,box-shadow] group"
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
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-[transform,opacity,color,background-color,border-color,box-shadow] group"
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
                  </div>
              </Presence>
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
                data-active={isActive(item.path)}
                className="nav-link text-[13px] font-semibold tracking-wide whitespace-nowrap"
              >
                {item.name}
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
              className="btn-shine flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-black transition-[transform,opacity,color,background-color,border-color,box-shadow] duration-200 hover:-translate-y-px"
              style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 4px 16px rgba(196,154,42,0.3)' }}
            >
              FALE CONOSCO
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-[transform,opacity,color,background-color,border-color,box-shadow]"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <Presence
        open={isOpen}
        enter={root => gsap.timeline()
          .from(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.25 }, 0)
          .from(root.querySelector('[data-p="drawer"]'), { xPercent: 100, duration: 0.6, ease: 'power4.out', clearProps: 'transform' }, 0)
          .from(root.querySelectorAll('[data-p="drawer-item"]'), { opacity: 0, x: 18, duration: 0.45, stagger: 0.05, clearProps: 'opacity,transform' }, 0.2)}
        exit={root => gsap.timeline()
          .to(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.22 }, 0)
          .to(root.querySelector('[data-p="drawer"]'), { xPercent: 100, duration: 0.35, ease: 'power3.in' }, 0)}
      >
          <>
            <div
              data-p="backdrop"
              className="fixed inset-0 z-[60]"
              style={{ background: 'rgba(6,17,43,0.75)', backdropFilter: 'blur(6px)' }}
              onClick={() => setIsOpen(false)}
            />

            <div
              data-p="drawer"
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
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-[transform,opacity,color,background-color,border-color,box-shadow]"
                    style={{ background: location.pathname === '/' ? 'rgba(196,154,42,0.1)' : 'transparent', color: location.pathname === '/' ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                  >
                    <span className="text-sm font-semibold">Início</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                  </Link>

                  {/* Quem Somos */}
                  <Link
                    to="/sobre"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-[transform,opacity,color,background-color,border-color,box-shadow]"
                    style={{ background: isActive('/sobre') ? 'rgba(196,154,42,0.1)' : 'transparent', color: isActive('/sobre') ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                  >
                    <span className="text-sm font-semibold">Quem Somos</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                  </Link>

                  {/* Projetos com expansão */}
                  <div>
                    <button
                      onClick={() => setProjDropMobile(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-[transform,opacity,color,background-color,border-color,box-shadow]"
                      style={{ background: isActive('/projetos') ? 'rgba(196,154,42,0.1)' : 'transparent', color: isActive('/projetos') ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                    >
                      <span className="text-sm font-semibold">Projetos</span>
                      <ChevronDown
                        className="w-3.5 h-3.5 opacity-40 transition-transform duration-200"
                        style={{ transform: projDropMobile ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    <Presence
                      open={projDropMobile}
                      enter={root => gsap.fromTo(root.querySelector('[data-p="sub"]'), { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.3, clearProps: 'height' })}
                      exit={root => gsap.to(root.querySelector('[data-p="sub"]'), { height: 0, opacity: 0, duration: 0.22, ease: 'power2.in' })}
                    >
                        <div data-p="sub" className="overflow-hidden">
                          <div className="pt-1 pb-2 ml-4 pl-4 border-l" style={{ borderColor: 'rgba(196,154,42,0.2)' }}>
                            <Link
                              to="/projetos"
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-[transform,opacity,color,background-color,border-color,box-shadow] text-sm font-bold"
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
                                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-[transform,opacity,color,background-color,border-color,box-shadow] text-[12px] font-semibold"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                    </Presence>
                  </div>

                  {/* Resto dos links */}
                  {[
                    { name: 'Blog', path: '/blog' },
                    { name: 'Valores', path: '/valores' },
                    { name: 'Dúvidas', path: '/duvidas' },
                    { name: 'Contato', path: '/contato' },
                  ].map((item, i) => (
                    <div key={item.name} data-p="drawer-item">
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-[transform,opacity,color,background-color,border-color,box-shadow]"
                        style={{ background: isActive(item.path) ? 'rgba(196,154,42,0.1)' : 'transparent', color: isActive(item.path) ? 'var(--brand-gold)' : 'rgba(255,255,255,0.55)' }}
                      >
                        <span className="text-sm font-semibold">{item.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="my-4 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

                <Link
                  to={user ? '/dashboard' : '/login'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-[transform,opacity,color,background-color,border-color,box-shadow] mt-0.5"
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
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-black transition-[transform,opacity,color,background-color,border-color,box-shadow] hover:opacity-90"
                  style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 4px 16px rgba(196,154,42,0.25)' }}
                >
                  FALE CONOSCO
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
      </Presence>
    </>
  );
}
