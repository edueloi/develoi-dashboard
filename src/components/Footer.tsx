import { motion } from 'framer-motion';
import { Instagram, Linkedin, Github, ArrowUp } from 'lucide-react';
import develoiLogo from '../images/develoi-logo.png';

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

      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-16 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                <img src={develoiLogo} alt="Develoi" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tighter dash-text">DEVELOI</span>
            </div>
            <p className="text-xs sm:text-sm dash-text-2 leading-relaxed max-w-[240px] sm:max-w-[260px]">
              A elite do desenvolvimento digital. Transformamos visões em realidades extraordinárias.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] sm:text-xs dash-text-2 font-semibold">
                Disponível para novos projetos
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] dash-text-2 mb-4 sm:mb-5">
              Navegação
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm dash-text-2 hover:dash-text transition-all duration-200 font-medium hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social + Back to top */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] dash-text-2 mb-4 sm:mb-5">
                Redes Sociais
              </p>
              <div className="flex gap-2 sm:gap-3">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <motion.a
                    key={label}
                    href={href}
                    aria-label={label}
                    whileHover={{ y: -4, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 sm:w-10 sm:h-10 dash-surface border dash-border rounded-xl flex items-center justify-center dash-text hover:border-indigo-500/40 transition-all shadow-sm"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </motion.a>
                ))}
              </div>
            </div>

            <motion.button
              onClick={scrollToTop}
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest dash-text-2 hover:dash-text transition-colors duration-300 group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl dash-surface border dash-border flex items-center justify-center group-hover:border-indigo-500/40 transition-all shadow-sm">
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              Voltar ao topo
            </motion.button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent mb-6 sm:mb-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs dash-text-2 opacity-60">
          <p>© {new Date().getFullYear()} Develoi. Todos os direitos reservados.</p>
          <p className="font-mono">
            Feito com <span className="text-rose-500">♥</span> em São Paulo, Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
