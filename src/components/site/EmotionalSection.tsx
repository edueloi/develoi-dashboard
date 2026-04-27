// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

export default function EmotionalSection() {
  return (
    <section className="relative py-24 dash-bg transition-colors duration-300">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at center, rgba(99,102,241,0.2) 0, transparent 70%)' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-5xl font-black dash-text tracking-tighter">
            Por que fazemos <span className="text-gradient">isso?</span>
          </h2>
          
          <p className="text-xl md:text-2xl dash-text-2 leading-relaxed max-w-3xl mx-auto font-medium">
            Acreditamos que a tecnologia deve ser um instrumento para ajudar pessoas. Queremos gerar impacto real, ver nossos parceiros crescendo e saber que fazemos parte dessa história.
          </p>

          <blockquote className="text-2xl md:text-4xl font-display font-bold dash-text italic mt-12 px-8 py-10 dash-surface border dash-border rounded-[2rem] relative shadow-2xl">
            <span className="text-indigo-600/30 text-6xl absolute top-4 left-4">"</span>
            Construímos soluções que transformam negócios e impactam vidas.
            <span className="text-indigo-600/30 text-6xl absolute bottom-0 right-4 rotate-180">"</span>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
