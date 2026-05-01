import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, MapPin, Phone, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import React, { useState } from 'react';

const contactItems = [
  { icon: Mail, label: 'E-mail', value: 'contato@develoi.com.br', href: 'mailto:contato@develoi.com.br' },
  { icon: Phone, label: 'WhatsApp', value: '(15) 99702-6791', href: 'https://wa.me/5515997026791' },
  { icon: MapPin, label: 'Localização', value: 'Tatuí/SP', href: '#' },
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

  const inputBase = `w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all duration-200`;
  const inputClass = (field: string) =>
    `${inputBase} ${
      focused === field
        ? 'border-[var(--brand-navy)] shadow-[0_0_0_3px_rgba(13,31,78,0.08)] bg-white'
        : 'border-[var(--border-color)] bg-white hover:border-slate-300'
    }`;

  return (
    <section id="contato" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-[0.06] blur-[100px]"
          style={{ background: 'var(--brand-navy)' }}
        />
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.05] blur-[80px]"
          style={{ background: 'var(--brand-gold)' }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left — info */}
          <div className="space-y-8 sm:space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border"
                style={{
                  background: 'var(--brand-gold-pale)',
                  borderColor: 'rgba(196,154,42,0.3)',
                  color: 'var(--brand-navy)',
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Fale Conosco</span>
              </div>

              <h2
                className="font-black mb-5 tracking-tighter leading-[1.0]"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--brand-navy)' }}
              >
                VAMOS CONSTRUIR{' '}
                <span className="text-gradient-gold">O FUTURO?</span>
              </h2>
              <p className="text-base sm:text-lg leading-relaxed max-w-lg" style={{ color: 'var(--text-secondary)' }}>
                Sua visão merece tecnologia de qualidade. Entre em contato e descubra como a{' '}
                <strong style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>Develoi</strong>{' '}
                pode transformar seu negócio.
              </p>
            </motion.div>

            {/* Contact items */}
            <div className="space-y-4 sm:space-y-5">
              {contactItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 group cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-250 group-hover:shadow-md"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-base font-bold transition-colors duration-200 group-hover:text-[var(--brand-gold)]"
                      style={{ color: 'var(--brand-navy)' }}
                    >
                      {item.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Trust tags */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-2.5"
            >
              {['Resposta em 24h', 'Sem compromisso', 'Orçamento gratuito'].map((tag) => (
                <span key={tag} className="tag-pill">
                  <CheckCircle2 className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="brand-card card-gold-top p-7 sm:p-10 relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12 space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(21,128,61,0.1)', border: '2px solid rgba(21,128,61,0.3)' }}
                  >
                    <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--accent-success)' }} />
                  </motion.div>
                  <h3
                    className="text-2xl sm:text-3xl font-black tracking-tighter"
                    style={{ color: 'var(--brand-navy)' }}
                  >
                    Mensagem Enviada!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Nossa equipe entrará em contato em até 24 horas.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-3 rounded-xl text-sm font-bold border transition-all hover:bg-slate-50"
                    style={{ color: 'var(--brand-navy)', borderColor: 'var(--border-color)' }}
                  >
                    ENVIAR OUTRA
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="mb-6">
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight mb-1"
                      style={{ color: 'var(--brand-navy)' }}
                    >
                      Inicie seu projeto
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Preencha o formulário e entraremos em contato.
                    </p>
                  </div>

                  {[
                    { field: 'name', label: 'Nome Completo', type: 'text', placeholder: 'Como podemos te chamar?' },
                    { field: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com' },
                  ].map(({ field, label, type, placeholder }) => (
                    <div key={field} className="space-y-1.5">
                      <label
                        className="text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {label}
                      </label>
                      <input
                        required
                        type={type}
                        placeholder={placeholder}
                        className={inputClass(field)}
                        style={{ color: 'var(--text-primary)' }}
                        value={(formData as any)[field]}
                        onFocus={() => setFocused(field)}
                        onBlur={() => setFocused(null)}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      />
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <label
                      className="text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Mensagem
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Conte-nos sobre seu projeto..."
                      className={`${inputClass('message')} resize-none`}
                      style={{ color: 'var(--text-primary)' }}
                      value={formData.message}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <motion.button
                    whileHover={status !== 'loading' ? { scale: 1.01, y: -1 } : {}}
                    whileTap={status !== 'loading' ? { scale: 0.99 } : {}}
                    disabled={status === 'loading'}
                    type="submit"
                    className="w-full py-4 font-black rounded-xl flex items-center justify-center gap-3 disabled:opacity-60 transition-all duration-200 text-white text-sm hover:shadow-[0_8px_24px_rgba(13,31,78,0.3)] hover:-translate-y-px"
                    style={{ background: 'var(--brand-navy)' }}
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ENVIANDO...
                      </>
                    ) : (
                      <>
                        ENVIAR MENSAGEM
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.p
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-center text-sm font-semibold"
                        style={{ color: 'var(--accent-error)' }}
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
