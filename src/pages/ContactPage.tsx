// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, MapPin, Send, CheckCircle2, Loader2,
  MessageSquare, Clock, ArrowRight, ExternalLink,
} from 'lucide-react';

const WHATSAPP_NUMBER = '5515997026791';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Olá%2C%20vim%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20Develoi.`;

const contactCards = [
  {
    icon: Phone,
    label: 'WhatsApp',
    value: '(15) 99702-6791',
    sub: 'Resposta rápida em horário comercial',
    href: WHATSAPP_URL,
    cta: 'Chamar no WhatsApp',
    color: '#15803D',
    bg: 'rgba(21,128,61,0.07)',
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: 'contato@develoi.com.br',
    sub: 'Retorno em até 24 horas úteis',
    href: 'mailto:contato@develoi.com.br',
    cta: 'Enviar e-mail',
    color: '#0D1F4E',
    bg: 'rgba(13,31,78,0.06)',
  },
  {
    icon: MapPin,
    label: 'Endereço',
    value: 'Tatuí / SP',
    sub: 'Rua Prof. Joaquim Teixeira, 220 — Junqueira',
    href: 'https://maps.google.com/?q=Rua+Professor+Joaquim+Teixeira,+220+Junqueira+Tatui+SP',
    cta: 'Ver no mapa',
    color: '#C49A2A',
    bg: 'rgba(196,154,42,0.07)',
  },
  {
    icon: Clock,
    label: 'Horário',
    value: 'Seg – Sex',
    sub: '08h às 18h (horário de Brasília)',
    href: null,
    cta: null,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.06)',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [focused, setFocused] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputStyle = (field: string) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1px solid ${focused === field ? '#0D1F4E' : '#DDE2EE'}`,
    background: focused === field ? '#fff' : '#F8F9FC',
    boxShadow: focused === field ? '0 0 0 3px rgba(13,31,78,0.08)' : 'none',
    fontSize: '14px',
    fontWeight: 500,
    color: '#0D1F4E',
    outline: 'none',
    transition: 'all 0.2s ease',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Blurs sutis */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(13,31,78,0.04)' }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'rgba(196,154,42,0.04)' }} />
      </div>

      {/* ── HERO ── */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 60%, #0A1840 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2) 70%, transparent)' }} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>
                Fale Conosco
              </span>
            </div>
            <h1
              className="font-black text-white leading-[1.05] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              Vamos construir{' '}
              <span style={{ color: 'var(--brand-gold)' }}>algo incrível juntos?</span>
            </h1>
            <p className="text-base leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Entre em contato pelo canal que preferir. Nossa equipe está pronta para entender sua necessidade e apresentar a melhor solução.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CARDS DE CONTATO ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1"
                style={{
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 2px 12px rgba(13,31,78,0.05)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(13,31,78,0.1)';
                  (e.currentTarget as HTMLElement).style.borderColor = `${card.color}33`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: card.bg }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                  {card.label}
                </p>
                <p className="font-black text-base mb-1" style={{ color: 'var(--brand-navy)' }}>
                  {card.value}
                </p>
                <p className="text-xs mb-4 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {card.sub}
                </p>
                {card.href && card.cta && (
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70"
                    style={{ color: card.color }}
                  >
                    {card.cta}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULÁRIO + MAPA ── */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Formulário */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 24px rgba(13,31,78,0.07)' }}
            >
              {/* Linha gold topo */}
              <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-navy), var(--brand-gold))' }} />

              <div className="p-8 sm:p-10">
                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(21,128,61,0.1)' }}>
                        <CheckCircle2 className="w-8 h-8" style={{ color: '#15803D' }} />
                      </div>
                      <h3 className="text-xl font-black" style={{ color: 'var(--brand-navy)' }}>Mensagem Enviada!</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Nossa equipe retornará em até 24 horas úteis.
                      </p>
                      <button
                        onClick={() => setStatus('idle')}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-slate-50"
                        style={{ color: 'var(--brand-navy)', borderColor: 'var(--border-color)' }}
                      >
                        Enviar outra mensagem
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="mb-7">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4" style={{ color: 'var(--brand-gold)' }} />
                          <h2 className="text-xl font-black" style={{ color: 'var(--brand-navy)' }}>
                            Envie uma mensagem
                          </h2>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Preencha e entraremos em contato o mais breve possível.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { field: 'name', label: 'Nome completo', placeholder: 'Seu nome', type: 'text' },
                            { field: 'email', label: 'E-mail', placeholder: 'seu@email.com', type: 'email' },
                          ].map(({ field, label, placeholder, type }) => (
                            <div key={field} className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                                {label}
                              </label>
                              <input
                                required
                                type={type}
                                placeholder={placeholder}
                                style={inputStyle(field)}
                                value={(formData as any)[field]}
                                onFocus={() => setFocused(field)}
                                onBlur={() => setFocused(null)}
                                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                              WhatsApp (opcional)
                            </label>
                            <input
                              type="tel"
                              placeholder="(15) 99999-9999"
                              style={inputStyle('phone')}
                              value={formData.phone}
                              onFocus={() => setFocused('phone')}
                              onBlur={() => setFocused(null)}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                              Serviço de interesse
                            </label>
                            <select
                              style={{ ...inputStyle('service'), cursor: 'pointer' }}
                              value={formData.service}
                              onFocus={() => setFocused('service')}
                              onBlur={() => setFocused(null)}
                              onChange={e => setFormData({ ...formData, service: e.target.value })}
                            >
                              <option value="">Selecione...</option>
                              <option value="site">Site / Landing Page</option>
                              <option value="sistema">Sistema Web</option>
                              <option value="chatbot">Chatbot WhatsApp</option>
                              <option value="dashboard">Dashboard / Relatórios</option>
                              <option value="automacao">Automação / Integração</option>
                              <option value="outro">Outro</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                            Mensagem
                          </label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Conte sobre seu projeto ou dúvida..."
                            style={{ ...inputStyle('message'), resize: 'none' }}
                            value={formData.message}
                            onFocus={() => setFocused('message')}
                            onBlur={() => setFocused(null)}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                          />
                        </div>

                        {status === 'error' && (
                          <p className="text-xs font-bold text-red-500">Erro ao enviar. Tente novamente ou fale pelo WhatsApp.</p>
                        )}

                        <motion.button
                          type="submit"
                          disabled={status === 'loading'}
                          whileHover={status !== 'loading' ? { y: -1 } : {}}
                          whileTap={status !== 'loading' ? { scale: 0.99 } : {}}
                          className="w-full py-3.5 font-black rounded-xl text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #06112B, #0D1F4E)',
                            boxShadow: '0 6px 20px rgba(13,31,78,0.22)',
                          }}
                        >
                          {status === 'loading' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>ENVIAR MENSAGEM <Send className="w-4 h-4" /></>
                          )}
                        </motion.button>
                      </form>

                      {/* WhatsApp direto */}
                      <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <p className="text-xs text-center mb-3" style={{ color: 'var(--text-muted)' }}>
                          Prefere falar agora?
                        </p>
                        <a
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                          style={{ background: 'rgba(21,128,61,0.08)', color: '#15803D', border: '1px solid rgba(21,128,61,0.2)' }}
                        >
                          <Phone className="w-4 h-4" />
                          CHAMAR NO WHATSAPP
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Mapa + info */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-5"
            >
              {/* Mapa Google */}
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 24px rgba(13,31,78,0.07)', height: '320px' }}>
                <iframe
                  title="Localização Develoi"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.5!2d-47.8575!3d-23.3595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sRua+Professor+Joaquim+Teixeira%2C+220%2C+Junqueira%2C+Tatu%C3%AD%2C+SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Card endereço */}
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: 'white',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 2px 12px rgba(13,31,78,0.05)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,154,42,0.08)' }}>
                    <MapPin className="w-5 h-5" style={{ color: 'var(--brand-gold)' }} />
                  </div>
                  <div>
                    <p className="font-black text-sm mb-0.5" style={{ color: 'var(--brand-navy)' }}>
                      Develoi Soluções Digitais
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Rua Professor Joaquim Teixeira, 220<br />
                      Junqueira — Tatuí / SP
                    </p>
                    <a
                      href="https://maps.google.com/?q=Rua+Professor+Joaquim+Teixeira,+220+Junqueira+Tatui+SP"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold mt-3 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--brand-gold)' }}
                    >
                      Abrir no Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Card horário + tags */}
              <div
                className="rounded-2xl p-6 overflow-hidden relative"
                style={{
                  background: 'linear-gradient(135deg, #06112B, #0D1F4E)',
                  boxShadow: '0 8px 32px rgba(13,31,78,0.2)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.15))' }} />
                <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'rgba(196,154,42,0.6)' }}>
                  Informações Úteis
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Clock, text: 'Seg a Sex, das 08h às 18h' },
                    { icon: Mail, text: 'contato@develoi.com.br' },
                    { icon: Phone, text: '(15) 99702-6791' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-gold)' }} />
                      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-5">
                  {['Orçamento Gratuito', 'Resposta Rápida', 'Sem Compromisso'].map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(196,154,42,0.12)', color: 'var(--brand-gold)', border: '1px solid rgba(196,154,42,0.2)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
