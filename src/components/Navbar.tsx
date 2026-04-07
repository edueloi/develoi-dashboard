import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Início', path: '/' },
  { name: 'Quem Somos', path: '/sobre' },
  { name: 'Valores', path: '/valores' },
  { name: 'Dúvidas', path: '/duvidas' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 md:py-8">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-white/10"
        >
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-black font-black text-lg md:text-xl">D</span>
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter">DEVELOI</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-colors relative group ${
                  location.pathname === item.path ? 'text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 h-[2px] bg-aurora-blue transition-all duration-300 ${
                  location.pathname === item.path ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            ))}
            
            <Link
              to={user ? "/dashboard" : "/login"}
              className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-aurora-blue hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              {user ? 'Dashboard' : 'Membros'}
            </Link>

            <Link
              to="/#contato"
              className="px-6 md:px-8 py-2 md:py-3 bg-white text-black font-black rounded-lg md:rounded-xl text-[10px] md:text-xs hover:scale-105 transition-transform shadow-lg shadow-white/5"
            >
              CONTRATAR
            </Link>
          </div>

          <button className="lg:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="lg:hidden absolute top-full left-4 right-4 mt-4 glass rounded-[2rem] p-8 border-white/10 shadow-2xl"
          >
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-2xl font-black tracking-tighter ${
                    location.pathname === item.path ? 'text-aurora-blue' : 'text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <Link
                to={user ? "/dashboard" : "/login"}
                className="text-2xl font-black tracking-tighter text-aurora-blue"
                onClick={() => setIsOpen(false)}
              >
                {user ? 'Dashboard' : 'Área de Membros'}
              </Link>

              <div className="h-[1px] bg-white/5 my-2" />
              <Link
                to="/#contato"
                className="w-full py-4 bg-white text-black font-black rounded-2xl text-center text-lg shadow-xl shadow-white/10"
                onClick={() => setIsOpen(false)}
              >
                CONTRATAR AGORA
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
