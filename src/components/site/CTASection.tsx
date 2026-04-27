// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="contato" className="relative py-32 overflow-hidden dash-bg transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="dash-surface rounded-[3rem] p-12 md:p-16 border dash-border shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 shimmer opacity-10 pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black dash-text mb-6 tracking-tighter">
            Vamos construir algo <span className="text-gradient">juntos?</span>
          </h2>
          
          <p className="text-xl dash-text-2 mb-10 max-w-2xl mx-auto">
            Se você quer organizar seu negócio, crescer com mais controle e ter uma solução que realmente funcione, fale com a gente.
          </p>
          
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://wa.me/5511999999999" // TODO: Add real whatsapp link
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all duration-300 group"
          >
            Falar com a Develoi
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
