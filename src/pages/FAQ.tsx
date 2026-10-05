// @ts-nocheck
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowRight, MessageSquare, Search, Layers, Workflow, Wallet, LifeBuoy } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    category: 'Serviços',
    question: 'Quais serviços a Develoi oferece?',
    answer: 'Desenvolvemos sites e landing pages, sistemas web sob medida, chatbots para WhatsApp, dashboards e relatórios gerenciais, automações e integrações com APIs. Também temos produtos prontos por assinatura: Agendelle (agendamento) e Plaelo (gestão para psicólogos — plaelo.com.br).',
  },
  {
    category: 'Serviços',
    question: 'Vocês fazem apenas sites ou também sistemas mais complexos?',
    answer: 'Fazemos os dois. Desde uma landing page para captura de leads até sistemas completos com módulos de cadastro, gestão, relatórios e painéis internos. Cada solução é construída sob medida para a realidade do cliente.',
  },
  {
    category: 'Processo',
    question: 'Como funciona o processo de contratação?',
    answer: 'É simples: você entra em contato pelo WhatsApp ou formulário, a gente agenda uma conversa para entender sua necessidade, enviamos uma proposta clara com escopo e prazo, e após aprovação iniciamos em até 48 horas.',
  },
  {
    category: 'Processo',
    question: 'Quanto tempo leva para entregar um projeto?',
    answer: 'Depende do escopo. Uma landing page pode ficar pronta em 5 a 10 dias. Um sistema mais robusto pode levar de 4 a 12 semanas. Sempre definimos o prazo antes de começar e mantemos você atualizado durante todo o processo.',
  },
  {
    category: 'Processo',
    question: 'Consigo acompanhar o andamento do meu projeto?',
    answer: 'Sim! Todos os clientes têm acesso ao nosso painel de projetos onde podem ver o status em tempo real, as tarefas em andamento e as próximas entregas. Transparência faz parte dos nossos valores.',
  },
  {
    category: 'Financeiro',
    question: 'Como funciona o pagamento?',
    answer: 'Trabalhamos com entrada + parcelas conforme o projeto avança por entregas. Aceitamos Pix, transferência e boleto. Os valores são acordados na proposta antes de qualquer início.',
  },
  {
    category: 'Financeiro',
    question: 'O orçamento é gratuito?',
    answer: 'Sim, totalmente gratuito e sem compromisso. Entre em contato, explique sua necessidade e apresentamos uma proposta detalhada.',
  },
  {
    category: 'Suporte',
    question: 'E depois da entrega, tem suporte?',
    answer: 'Sim. Oferecemos suporte pós-entrega para correções e dúvidas. Para clientes com contrato de manutenção, o atendimento é prioritário com SLA definido.',
  },
  {
    category: 'Suporte',
    question: 'Vocês trabalham com empresas de qualquer porte?',
    answer: 'Trabalhamos com comércios locais, profissionais liberais (psicólogos, advogados, consultores), clínicas, escritórios e empresas com operações repetitivas que precisam de automação. Nosso foco é em quem quer evoluir com estrutura.',
  },
];

const categories = ['Todos', ...Array.from(new Set(faqs.map(f => f.category)))];

const categoryMeta: Record<string, { icon: any; desc: string }> = {
  'Serviços': { icon: Layers, desc: 'O que fazemos' },
  'Processo': { icon: Workflow, desc: 'Como trabalhamos' },
  'Financeiro': { icon: Wallet, desc: 'Pagamento e orçamento' },
  'Suporte': { icon: LifeBuoy, desc: 'Depois da entrega' },
};

function FAQItem({ question, answer, category, open, onToggle }: { question: string; answer: string; category: string; open: boolean; onToggle: () => void }) {
  const Icon = categoryMeta[category]?.icon || HelpCircle;
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 bg-white"
      style={{
        border: `1px solid ${open ? 'rgba(196,154,42,0.45)' : 'var(--border-color)'}`,
        boxShadow: open ? '0 10px 30px rgba(13,31,78,0.09)' : '0 1px 4px rgba(13,31,78,0.04)',
      }}
    >
      <button onClick={onToggle} aria-expanded={open} className="w-full text-left px-5 sm:px-6 py-5 flex items-center gap-4">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: open ? 'var(--brand-navy)' : 'var(--bg-tertiary)', color: open ? 'var(--brand-gold)' : 'var(--brand-navy)' }}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 text-[15px] font-bold leading-snug" style={{ color: 'var(--brand-navy)' }}>{question}</span>
        <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform duration-300" style={{ color: 'var(--brand-gold)', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <p className="px-5 sm:px-6 pb-6 pl-[4.5rem] sm:pl-[5.25rem] text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [openQ, setOpenQ] = useState<string | null>(faqs[0].question);

  const q = query.trim().toLowerCase();
  const filtered = faqs.filter(f => (activeCategory === 'Todos' || f.category === activeCategory) && (!q || (f.question + ' ' + f.answer).toLowerCase().includes(q)));
  const countOf = (c: string) => c === 'Todos' ? faqs.length : faqs.filter(f => f.category === c).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 60%, #0A1840 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2) 70%, transparent)' }} />
        <div className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(196,154,42,0.14), transparent 70%)' }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>Central de ajuda</span>
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            </div>
            <h1 className="font-black text-white leading-[1.05] tracking-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
              Como podemos <span style={{ color: 'var(--brand-gold)' }}>ajudar?</span>
            </h1>
            <p className="text-base leading-relaxed max-w-lg mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Respostas rápidas sobre nossos serviços, processo de trabalho, pagamento e suporte.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Busque por prazo, pagamento, suporte…"
                className="w-full pl-14 pr-5 py-4 rounded-2xl text-sm font-medium outline-none bg-white shadow-2xl"
                style={{ color: 'var(--brand-navy)' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTEÚDO ── */}
      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12 items-start">
          {/* categorias */}
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-28 -mx-6 px-6 lg:mx-0 lg:px-0">
            {categories.map(cat => {
              const on = activeCategory === cat;
              const Icon = categoryMeta[cat]?.icon || HelpCircle;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left whitespace-nowrap transition-all flex-shrink-0 lg:w-full"
                  style={{ background: on ? 'var(--brand-navy)' : 'white', border: `1px solid ${on ? 'var(--brand-navy)' : 'var(--border-color)'}`, boxShadow: on ? '0 8px 20px rgba(13,31,78,0.2)' : 'none' }}
                >
                  <Icon className="w-4 h-4" style={{ color: on ? 'var(--brand-gold)' : 'var(--brand-navy)' }} />
                  <span className="flex-1">
                    <span className="block text-sm font-black" style={{ color: on ? '#fff' : 'var(--brand-navy)' }}>{cat}</span>
                    <span className="hidden lg:block text-[11px]" style={{ color: on ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)' }}>{categoryMeta[cat]?.desc || 'Todas as perguntas'}</span>
                  </span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: on ? 'rgba(255,255,255,0.15)' : 'var(--bg-tertiary)', color: on ? '#fff' : 'var(--text-muted)' }}>{countOf(cat)}</span>
                </button>
              );
            })}
          </nav>

          {/* perguntas */}
          <div className="space-y-3 min-w-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
                <HelpCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--brand-gold)' }} />
                <p className="font-black" style={{ color: 'var(--brand-navy)' }}>Nada encontrado para "{query}"</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Tente outra palavra ou fale direto com a gente.</p>
              </div>
            ) : filtered.map(f => (
              <FAQItem key={f.question} {...f} open={openQ === f.question} onToggle={() => setOpenQ(openQ === f.question ? null : f.question)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)',
              boxShadow: '0 20px 60px rgba(13,31,78,0.2)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.15) 70%, transparent)' }} />
            <div className="relative z-10 px-8 sm:px-16 py-14 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-5 h-5" style={{ color: 'var(--brand-gold)' }} />
                  <h2
                    className="font-black text-white tracking-tight"
                    style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)' }}
                  >
                    Não encontrou o que precisava?
                  </h2>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Nossa equipe responde em até 24 horas. Fale com a gente agora.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <a
                  href="https://wa.me/5515992418299?text=Olá%2C%20tenho%20uma%20dúvida%20sobre%20os%20serviços%20da%20Develoi."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:-translate-y-px"
                  style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 6px 20px rgba(196,154,42,0.3)' }}
                >
                  <MessageSquare className="w-4 h-4" />
                  CHAMAR NO WHATSAPP
                </a>
                <a
                  href="/contato"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  VER PÁGINA DE CONTATO
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
