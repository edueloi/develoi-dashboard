import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  from: 'bot' | 'user';
  text: string;
  options?: Option[];
}

interface Option {
  label: string;
  value: string;
}

// ─── Knowledge base / respostas da IA ────────────────────────────────────────

const WA_NUMBER = '5515997026791';
const WA_BASE = `https://wa.me/${WA_NUMBER}`;

function waLink(msg: string) {
  return `${WA_BASE}?text=${encodeURIComponent(msg)}`;
}

const MENU_OPTIONS: Option[] = [
  { label: '🌐 Sites & Landing Pages', value: 'sites' },
  { label: '⚙️ Sistemas & Automações', value: 'sistemas' },
  { label: '🤖 Chatbots & WhatsApp', value: 'chatbots' },
  { label: '📊 Dashboards & Relatórios', value: 'dashboards' },
  { label: '💰 Valores & Investimento', value: 'valores' },
  { label: '📞 Falar com especialista', value: 'contato' },
];

function getReply(value: string): Message {
  const base = Date.now();
  switch (value) {
    case 'sites':
      return {
        id: base, from: 'bot',
        text: 'Criamos sites profissionais, landing pages de alta conversão e portfólios modernos — focados em gerar credibilidade e novos clientes. Quer ver exemplos ou tirar dúvidas?',
        options: [
          { label: '📂 Ver nossos projetos', value: 'ver_projetos' },
          { label: '📞 Falar com especialista', value: 'contato' },
          { label: '🔙 Voltar ao menu', value: 'menu' },
        ],
      };
    case 'sistemas':
      return {
        id: base, from: 'bot',
        text: 'Desenvolvemos sistemas web sob medida, ERPs, gestão financeira, automações e integrações com APIs externas. Cada solução é construída para a sua realidade — sem pacotes genéricos.',
        options: [
          { label: '📞 Quero um orçamento', value: 'contato' },
          { label: '🔙 Voltar ao menu', value: 'menu' },
        ],
      };
    case 'chatbots':
      return {
        id: base, from: 'bot',
        text: 'Automatizamos atendimentos no WhatsApp com IA e fluxos inteligentes — agendamento, suporte, vendas e qualificação de leads sem precisar de atendente humano 24h.',
        options: [
          { label: '📞 Tenho interesse', value: 'contato' },
          { label: '🔙 Voltar ao menu', value: 'menu' },
        ],
      };
    case 'dashboards':
      return {
        id: base, from: 'bot',
        text: 'Criamos dashboards gerenciais, relatórios em tempo real e plataformas SaaS. Visualize seus dados e tome decisões mais rápidas com inteligência.',
        options: [
          { label: '📞 Quero saber mais', value: 'contato' },
          { label: '🔙 Voltar ao menu', value: 'menu' },
        ],
      };
    case 'valores':
      return {
        id: base, from: 'bot',
        text: 'Cada projeto é único, por isso trabalhamos com orçamentos personalizados. O investimento depende da complexidade e escopo — mas temos soluções a partir de projetos pontuais até contratos mensais de suporte.',
        options: [
          { label: '📞 Solicitar orçamento', value: 'contato' },
          { label: '🔙 Voltar ao menu', value: 'menu' },
        ],
      };
    case 'ver_projetos':
      return {
        id: base, from: 'bot',
        text: 'Você pode ver nossos projetos em detalhes clicando no link abaixo 👇',
        options: [
          { label: '📂 Ir para /projetos', value: 'go_projetos' },
          { label: '🔙 Voltar ao menu', value: 'menu' },
        ],
      };
    case 'contato':
      return {
        id: base, from: 'bot',
        text: 'Ótimo! Clique no botão abaixo para falar diretamente com nossa equipe no WhatsApp. Estamos disponíveis para te atender! 🚀',
        options: [
          { label: '💬 Abrir WhatsApp', value: 'open_wa' },
          { label: '🔙 Voltar ao menu', value: 'menu' },
        ],
      };
    case 'menu':
    default:
      return {
        id: base, from: 'bot',
        text: 'Como posso te ajudar? Escolha um dos temas abaixo 👇',
        options: MENU_OPTIONS,
      };
  }
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1, from: 'bot',
    text: 'Olá! 👋 Sou o assistente da **Develoi**. Posso te ajudar a entender nossas soluções, tirar dúvidas e te direcionar para a equipe certa.',
  },
  {
    id: 2, from: 'bot',
    text: 'Como posso te ajudar hoje? Escolha um dos temas abaixo 👇',
    options: MENU_OPTIONS,
  },
];

// ─── Bold text renderer ───────────────────────────────────────────────────────

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i} style={{ color: 'var(--brand-navy)', fontWeight: 900 }}>{part}</strong> : part
      )}
    </>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, onOption }: { msg: Message; onOption: (v: string) => void }) {
  const isBot = msg.from === 'bot';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col gap-2 ${isBot ? 'items-start' : 'items-end'}`}
    >
      {isBot && (
        <div className="flex items-center gap-1.5 mb-0.5">
          <img src="/LOGO-MENU.png" alt="Develoi" className="h-4 w-auto object-contain" />
        </div>
      )}

      <div
        className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={isBot
          ? { background: '#fff', color: '#374151', border: '1px solid rgba(13,31,78,0.08)', boxShadow: '0 2px 8px rgba(13,31,78,0.07)' }
          : { background: 'var(--brand-navy)', color: '#fff' }
        }
      >
        <BoldText text={msg.text} />
      </div>

      {msg.options && (
        <div className="flex flex-col gap-1.5 mt-1 w-full max-w-[90%]">
          {msg.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onOption(opt.value)}
              className="text-left text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200 hover:-translate-y-px"
              style={{
                background: 'rgba(196,154,42,0.08)',
                border: '1px solid rgba(196,154,42,0.25)',
                color: 'var(--brand-navy)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--brand-navy)';
                (e.currentTarget as HTMLElement).style.color = '#fff';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-navy)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(196,154,42,0.08)';
                (e.currentTarget as HTMLElement).style.color = 'var(--brand-navy)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.25)';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function Typing() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl w-fit"
      style={{ background: '#fff', border: '1px solid rgba(13,31,78,0.08)' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--brand-navy)' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </motion.div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function WhatsAppChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text }]);
  };

  const addBotMessage = (reply: Message) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, reply]);
    }, 800 + Math.random() * 400);
  };

  const handleOption = (value: string) => {
    if (value === 'open_wa') {
      window.open(waLink('Olá! Vim pelo site da Develoi e gostaria de saber mais sobre os serviços.'), '_blank');
      return;
    }
    if (value === 'go_projetos') {
      window.open('/projetos', '_self');
      return;
    }
    const optionLabel = MENU_OPTIONS.find(o => o.value === value)?.label || value;
    addUserMessage(optionLabel);
    addBotMessage(getReply(value));
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addUserMessage(text);

    // Simple keyword matching
    const lower = text.toLowerCase();
    let reply: Message;
    if (/site|landing|página|pagina/.test(lower)) reply = getReply('sites');
    else if (/sistema|automação|automacao|erp|integra/.test(lower)) reply = getReply('sistemas');
    else if (/chat|bot|whatsapp|whats/.test(lower)) reply = getReply('chatbots');
    else if (/dashboard|relato|dado/.test(lower)) reply = getReply('dashboards');
    else if (/valor|preço|preco|custo|invest|orçamento|orcamento/.test(lower)) reply = getReply('valores');
    else if (/contato|falar|conversar|equipe|humano/.test(lower)) reply = getReply('contato');
    else {
      reply = {
        id: Date.now(),
        from: 'bot',
        text: 'Entendi! Para garantir a melhor resposta, escolha um dos temas abaixo ou fale diretamente com nossa equipe 😊',
        options: [
          ...MENU_OPTIONS.slice(0, 4),
          { label: '📞 Falar com especialista', value: 'contato' },
        ],
      };
    }
    addBotMessage(reply);
  };

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-[80] w-[calc(100vw-2rem)] sm:w-[380px] flex flex-col rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(13,31,78,0.25)', maxHeight: '75vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 100%)', borderBottom: '1px solid rgba(196,154,42,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <img src="/LOGO-MENU.png" alt="Develoi" className="h-6 w-auto object-contain" />
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-tight leading-none">Assistente Develoi</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Online agora</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gold accent */}
            <div className="h-[2px] flex-shrink-0" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2) 70%,transparent)' }} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ background: '#F8F9FC' }}>
              {messages.map(msg => (
                <Bubble key={msg.id} msg={msg} onOption={handleOption} />
              ))}
              <AnimatePresence>
                {typing && (
                  <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Typing />
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ background: '#fff', borderTop: '1px solid rgba(13,31,78,0.08)' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Digite sua dúvida..."
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border focus:outline-none"
                style={{
                  borderColor: 'rgba(13,31,78,0.12)',
                  color: 'var(--brand-navy)',
                  background: '#F8F9FC',
                }}
              />
              <button onClick={handleSend}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                style={{ background: 'var(--brand-navy)', color: '#fff' }}>
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Footer link */}
            <div className="px-4 py-2.5 text-center flex-shrink-0" style={{ background: '#fff', borderTop: '1px solid rgba(13,31,78,0.06)' }}>
              <a href={waLink('Olá! Vim pelo site da Develoi.')} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-70"
                style={{ color: 'var(--brand-gold)' }}>
                💬 Falar direto no WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-4 sm:right-6 z-[80] w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: open ? 'var(--brand-navy)' : '#25D366',
          boxShadow: open
            ? '0 8px 32px rgba(13,31,78,0.35)'
            : '0 8px 32px rgba(37,211,102,0.4)',
        }}
        aria-label={open ? 'Fechar chat' : 'Abrir chat'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -90, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.7 }} transition={{ duration: 0.18 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="whats" initial={{ opacity: 0, rotate: 90, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: -90, scale: 0.7 }} transition={{ duration: 0.18 }}>
              {/* WhatsApp SVG icon */}
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring (only when closed) */}
        {!open && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: '#25D366' }}
            animate={{ scale: [1, 1.35], opacity: [0.35, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        {/* Notification dot */}
        {!open && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: 'var(--brand-gold)' }}>
            1
          </div>
        )}
      </motion.button>
    </>
  );
}
