import { motion } from 'framer-motion';
import { Instagram, Linkedin, Github, ArrowUp } from 'lucide-react';
import develoiLogo from '../images/logo-develoi.png';

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
];

const footerLinks = [
  { label: 'Início', href: '/' },
  { label: 'Quem Somos', href: '/sobre' },
  { label: 'Valores', href: '/valores' },
  { label: 'Dúvidas', href: '/duvidas' },
  { label: 'Contato', href: '/#contato' },
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative overflow-hidden dash-bg transition-colors duration-300">
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand */}
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-white/5 flex-shrink-0">
                <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="text-2xl font-black tracking-tighter dash-text">DEVELOI</span>
            </div>
            <p className="text-sm dash-text-2 leading-relaxed max-w-xs font-medium">
              Criamos sites, sistemas e soluções digitais para empresas que querem crescer com mais estrutura e resultado.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[11px] dash-text-2 font-black uppercase tracking-widest opacity-60">
                Disponível para novos desafios
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] dash-text-2 mb-8">
              Plataforma
            </h4>
            <ul className="space-y-4">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm dash-text-2 hover:dash-text transition-all duration-300 font-medium hover:translate-x-2 inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info (Placeholder) */}
          <div className="lg:col-span-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] dash-text-2 mb-8">
              Contato
            </h4>
            <ul className="space-y-4">
              <li className="text-sm dash-text-2 font-medium">contato@develoi.com.br</li>
              <li className="text-sm dash-text-2 font-medium">São Paulo, SP - Brasil</li>
            </ul>
          </div>

          {/* Social */}
          <div className="lg:col-span-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] dash-text-2 mb-8">
              Siga-nos
            </h4>
            <div className="flex gap-3 mb-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ y: -5, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 dash-surface border dash-border rounded-2xl flex items-center justify-center dash-text hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
            <motion.button
              onClick={scrollToTop}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest dash-text-2 hover:dash-text transition-colors duration-300 group"
            >
              <div className="w-10 h-10 rounded-2xl dash-surface border dash-border flex items-center justify-center group-hover:border-indigo-500/50 transition-all shadow-sm">
                <ArrowUp className="w-4 h-4" />
              </div>
              VOLTAR AO TOPO
            </motion.button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent mb-12" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] dash-text-2 font-black uppercase tracking-widest opacity-40">
          <p>© {new Date().getFullYear()} Develoi. Soluções Digitais.</p>
          <p className="flex items-center gap-2">
            DESIGNED WITH <span className="text-rose-500 animate-pulse">♥</span> BY DEVELOI
          </p>
        </div>
      </div>
    </footer>
  );
}
