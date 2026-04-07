import { motion } from 'framer-motion';
import { Send, Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

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
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <section id="contato" className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
                VAMOS <span className="text-gradient">CONSTRUIR</span> O FUTURO?
              </h2>
              <p className="text-xl text-neutral-400 leading-relaxed max-w-lg">
                Sua visão merece a elite do desenvolvimento. Entre em contato e descubra como a Develoi pode transformar seu negócio.
              </p>
            </motion.div>

            <div className="space-y-8">
              {[
                { icon: Mail, label: "E-mail", value: "contato@develoi.com.br" },
                { icon: Phone, label: "WhatsApp", value: "+55 (11) 99999-9999" },
                { icon: MapPin, label: "Localização", value: "São Paulo, Brasil" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-6 group"
                >
                  <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center group-hover:border-aurora-blue/50 transition-all">
                    <item.icon className="w-6 h-6 text-aurora-blue" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">{item.label}</p>
                    <p className="text-xl font-black tracking-tighter">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass p-8 md:p-12 rounded-[3rem] border-white/5 relative"
          >
            {status === 'success' ? (
              <div className="text-center py-20 space-y-6">
                <div className="w-20 h-20 bg-aurora-green/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-aurora-green" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter">Mensagem Enviada!</h3>
                <p className="text-neutral-400">Nossa equipe entrará em contato em breve.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-black transition-all"
                >
                  ENVIAR OUTRA
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-2">Nome Completo</label>
                  <input
                    required
                    type="text"
                    placeholder="Como podemos te chamar?"
                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:outline-none focus:border-aurora-blue/50 transition-all text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-2">E-mail Corporativo</label>
                  <input
                    required
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:outline-none focus:border-aurora-blue/50 transition-all text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-2">Sua Visão</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Conte-nos sobre seu projeto..."
                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:outline-none focus:border-aurora-blue/50 transition-all text-white resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <button
                  disabled={status === 'loading'}
                  className="w-full py-6 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {status === 'loading' ? 'ENVIANDO...' : (
                    <>ENVIAR MENSAGEM <Send className="w-5 h-5" /></>
                  )}
                </button>
                {status === 'error' && (
                  <p className="text-red-400 text-center text-sm font-bold">Ocorreu um erro. Tente novamente.</p>
                )}
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
