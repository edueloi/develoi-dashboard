import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, MapPin, Phone, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import React, { useState } from 'react';

const contactItems = [
  { icon: Mail, label: 'E-mail', value: 'contato@develoi.com.br', href: 'mailto:contato@develoi.com.br' },
  { icon: Phone, label: 'WhatsApp', value: '+55 (11) 99999-9999', href: 'https://wa.me/5511999999999' },
  { icon: MapPin, label: 'Localização', value: 'São Paulo, Brasil', href: '#' },
];

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/[0.03] border rounded-xl sm:rounded-2xl focus:outline-none transition-all duration-300 text-white placeholder:text-neutral-600 text-sm sm:text-base ${
      focused === field
        ? 'border-aurora-blue/50 shadow-[0_0_20px_rgba(0,210,255,0.08)] bg-white/[0.05]'
        : 'border-white/[0.06] hover:border-white/[0.10]'
    }`;

  return (
    <section id="contato" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] md:w-[600px] h-[300px] sm:h-[500px] md:h-[600px] bg-aurora-blue/5 blur-[80px] sm:blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-[200px] sm:w-[350px] md:w-[400px] h-[200px] sm:h-[350px] md:h-[400px] bg-aurora-purple/5 blur-[80px] sm:blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
          {/* Left side */}
          <div className="space-y-8 sm:space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-aurora-blue/10 border border-aurora-blue/20 text-[10px] sm:text-xs font-black uppercase tracking-widest text-aurora-blue mb-4 sm:mb-6">
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Fale Conosco</span>
              </div>

              <h2
                className="font-black mb-4 sm:mb-6 tracking-tighter leading-[0.9]"
                style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}
              >
                VAMOS <br />
                <span className="text-gradient">CONSTRUIR</span>
                <br /> O FUTURO?
              </h2>
              <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-lg">
                Sua visão merece a elite do desenvolvimento. Entre em contato e descubra como a{' '}
                <span className="text-white font-semibold">Develoi</span> pode transformar seu negócio.
              </p>
            </motion.div>

            {/* Contact items */}
            <div className="space-y-4 sm:space-y-5">
              {contactItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 sm:gap-5 group cursor-pointer"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl glass flex items-center justify-center group-hover:border-aurora-blue/40 group-hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-300 flex-shrink-0">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-aurora-blue" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-base sm:text-lg font-black tracking-tighter group-hover:text-aurora-blue transition-colors duration-300">
                      {item.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 sm:gap-3"
            >
              {['Resposta em 24h', 'Sem compromisso', 'Orçamento gratuito'].map((tag) => (
                <span key={tag} className="tag-pill text-[10px] sm:text-xs">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-aurora-green" />
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] border-white/[0.06] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-blue/[0.03] to-aurora-purple/[0.03] rounded-[2rem] sm:rounded-[3rem]" />

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative text-center py-12 sm:py-16 space-y-5 sm:space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-aurora-green/15 rounded-full flex items-center justify-center mx-auto ring-2 ring-aurora-green/30"
                  >
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-aurora-green" />
                  </motion.div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter">Mensagem Enviada!</h3>
                  <p className="text-neutral-400 text-base sm:text-lg">Nossa equipe entrará em contato em até 24 horas.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStatus('idle')}
                    className="px-6 sm:px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-black transition-all"
                  >
                    ENVIAR OUTRA
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="relative space-y-4 sm:space-y-6"
                >
                  <div className="mb-5 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tighter mb-1">Inicie seu projeto</h3>
                    <p className="text-xs sm:text-sm text-neutral-500">Preencha o formulário e entraremos em contato.</p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 sm:ml-2">
                      Nome Completo
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Como podemos te chamar?"
                      className={inputClass('name')}
                      value={formData.name}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 sm:ml-2">
                      E-mail Corporativo
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="seu@email.com"
                      className={inputClass('email')}
                      value={formData.email}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 sm:ml-2">
                      Sua Visão
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Conte-nos sobre seu projeto..."
                      className={`${inputClass('message')} resize-none`}
                      value={formData.message}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <motion.button
                    whileHover={status !== 'loading' ? { scale: 1.02 } : {}}
                    whileTap={status !== 'loading' ? { scale: 0.98 } : {}}
                    disabled={status === 'loading'}
                    className="w-full py-4 sm:py-5 bg-white text-black font-black rounded-xl sm:rounded-2xl shadow-xl shadow-white/5 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60 relative overflow-hidden group transition-all text-sm sm:text-base md:text-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10 flex items-center gap-2 sm:gap-3 group-hover:text-white transition-colors duration-300">
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ENVIANDO...
                        </>
                      ) : (
                        <>
                          ENVIAR MENSAGEM
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-center text-xs sm:text-sm font-bold"
                      >
                        Ocorreu um erro. Tente novamente.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
