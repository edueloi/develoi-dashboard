import { Instagram, ArrowUp, ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal, Stagger, Magnetic } from './motion';

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/develoi.solucoesdigitais/' },
];

const footerLinks = [
  { label: 'Início', href: '/' },
  { label: 'Quem Somos', href: '/sobre' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Blog', href: '/blog' },
  { label: 'Valores', href: '/valores' },
  { label: 'Dúvidas', href: '/duvidas' },
  { label: 'Contato', href: '/contato' },
];

const contacts = [
  { icon: Mail, label: 'contato@develoi.com.br', href: 'mailto:contato@develoi.com.br' },
  { icon: Phone, label: '(15) 99241-8299', href: 'https://wa.me/5515992418299' },
  { icon: MapPin, label: 'Tatuí/SP', href: undefined },
];

const colTitle = 'text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-[var(--brand-gold)]';

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#08122E 0%,#06112B 100%)' }}>
      <div aria-hidden className="absolute inset-0 bg-dots opacity-30" />
      <div aria-hidden className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[320px] rounded-full blur-[140px]" style={{ background: 'rgba(196,154,42,0.12)' }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(196,154,42,0.6), transparent)' }} />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 md:pt-20 pb-8">
        {/* Chamada */}
        <Reveal distance={20} className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-12 mb-12 border-b border-white/10">
          <div>
            <p className="font-black text-white tracking-tight leading-tight" style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)' }}>
              Tem uma ideia ou um desafio?{' '}
              <span className="text-gold-grad">Vamos conversar.</span>
            </p>
            <p className="mt-2 text-sm text-white/50">Respondemos rápido, sem compromisso.</p>
          </div>
          <Magnetic className="flex-shrink-0 self-start md:self-auto" strength={0.2}>
            <a
              href="https://wa.me/5515992418299"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 6px 24px rgba(196,154,42,0.35)' }}
            >
              FALAR NO WHATSAPP
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </Magnetic>
        </Reveal>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-14" stagger={0.1} distance={18}>
          {/* Marca */}
          <div className="space-y-6">
            <img src="/LOGO-MENU-BRANCO.png" alt="Develoi" className="h-10 w-auto object-contain" />
            <p className="text-sm leading-relaxed max-w-xs text-white/55">
              Criamos sites, sistemas e soluções digitais para empresas que querem crescer com mais estrutura e resultado.
            </p>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-dark">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 animate-ping-slow opacity-60" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Disponível para novos projetos</span>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h4 className={colTitle}>Navegação</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="group inline-flex items-center gap-2 text-sm font-medium text-white/55 hover:text-white transition-colors duration-200"
                  >
                    <span className="w-4 h-px -mr-2 origin-left scale-x-0 bg-[var(--brand-gold)] transition-transform duration-300 group-hover:scale-x-100" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className={colTitle}>Contato</h4>
            <ul className="space-y-4">
              {contacts.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  {href ? (
                    <a href={href} className="group flex items-center gap-3 text-sm font-medium text-white/55 hover:text-white transition-colors duration-200">
                      <span className="icon-tile w-9 h-9 !rounded-xl"><Icon className="w-4 h-4" /></span>
                      {label}
                    </a>
                  ) : (
                    <span className="flex items-center gap-3 text-sm font-medium text-white/55">
                      <span className="icon-tile w-9 h-9 !rounded-xl"><Icon className="w-4 h-4" /></span>
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className={colTitle}>Siga-nos</h4>
            <div className="flex gap-3 mb-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <Magnetic key={label} strength={0.35}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="glass-dark w-11 h-11 rounded-2xl flex items-center justify-center text-white/80 hover:text-[var(--brand-gold)] hover:border-[rgba(196,154,42,0.5)] transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                </Magnetic>
              ))}
            </div>
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors duration-300"
            >
              <span className="glass-dark w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
                <ArrowUp className="w-4 h-4" />
              </span>
              Voltar ao topo
            </button>
          </div>
        </Stagger>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 pt-8 text-center md:text-left text-xs font-medium text-white/40 border-t border-white/10">
          <div className="space-y-1">
            <p className="font-bold text-white/70">Develoi Soluções Digitais</p>
            <p>CNPJ 30.968.335/0001-69</p>
          </div>
          <p>© {new Date().getFullYear()} Develoi Soluções Digitais. Todos os direitos reservados.</p>
          <Link to="/privacidade" className="font-semibold hover:text-white transition-colors duration-200">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
