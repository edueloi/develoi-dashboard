// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="contato" className="relative py-32 overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-t from-aurora-blue/10 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-strong rounded-[3rem] p-12 md:p-16 border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 shimmer opacity-10 pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Vamos construir algo <span className="text-gradient">juntos?</span>
          </h2>
          
          <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
            Se você quer organizar seu negócio, crescer com mais controle e ter uma solução que realmente funcione, fale com a gente.
          </p>
          
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://wa.me/5511999999999" // TODO: Add real whatsapp link
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all duration-300 group"
          >
            Falar com a Develoi
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
