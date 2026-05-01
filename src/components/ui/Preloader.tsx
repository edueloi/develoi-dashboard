import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../images/logo-develoi.png';

export default function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.5, ease: 'easeInOut' },
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: '#F8F9FC' }}
        >
          {/* Subtle radial glow behind logo */}
          <div
            className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(196,154,42,0.08) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div className="relative flex flex-col items-center gap-10">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-28 h-28 md:w-36 md:h-36"
            >
              <img
                src={logo}
                alt="Develoi"
                className="w-full h-full object-contain"
              />
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: 'var(--brand-navy)' }}
              >
                develoi
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: 'var(--brand-gold)' }}
              >
                Soluções Digitais
              </span>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="w-48 h-[3px] rounded-full overflow-hidden"
                style={{ background: 'var(--border-color)' }}
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.9, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, var(--brand-navy), var(--brand-gold))',
                  }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
