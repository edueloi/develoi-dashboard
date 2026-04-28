import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../images/logo-develoi.png';

export default function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 seconds for a premium feel

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%",
            transition: { duration: 1.2, ease: [0.65, 0, 0.35, 1] }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#030303] overflow-hidden"
        >
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                x: [-100, 100, -100],
                y: [-50, 50, -50],
                rotate: [0, 360]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full"
            />
            <motion.div 
              animate={{ 
                x: [100, -100, 100],
                y: [50, -50, 50],
                rotate: [360, 0]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-purple-600/10 blur-[100px] rounded-full"
            />
          </div>

          <div className="relative flex flex-col items-center">
            {/* Spinning Rings */}
            <div className="absolute inset-0 -m-10 pointer-events-none">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 border border-white/5 rounded-full"
               />
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-4 border border-white/5 rounded-full"
               />
            </div>

            {/* Logo Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
              animate={{ 
                scale: [0.8, 1.05, 1],
                opacity: 1,
                filter: "blur(0px)"
              }}
              transition={{ 
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="relative w-40 h-40 md:w-56 md:h-56 z-10"
            >
              <motion.img 
                animate={{ 
                  filter: ["brightness(1) contrast(1)", "brightness(1.5) contrast(1.1)", "brightness(1) contrast(1)"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                src={logo} 
                alt="Develoi Loading" 
                className="w-full h-full object-contain"
              />
              
              {/* Vertical Light Scan */}
              <motion.div
                initial={{ top: "-20%" }}
                animate={{ top: "120%" }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 blur-md"
              />
            </motion.div>

            {/* Progress Counter & Text */}
            <div className="mt-16 relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-8">
                   <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/20" />
                   <span className="text-[10px] font-black tracking-[0.6em] text-white/40 uppercase">
                      Elite Engineering
                   </span>
                   <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20" />
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-48 h-[1px] bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ x: "-100%" }}
                     animate={{ x: "0%" }}
                     transition={{ duration: 2.5, ease: "easeInOut" }}
                     className="h-full w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                   />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
