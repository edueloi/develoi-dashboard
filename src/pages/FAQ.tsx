// @ts-nocheck
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, ArrowRight, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    category: 'Serviços',
    question: 'Quais serviços a Develoi oferece?',
    answer: 'Desenvolvemos sites e landing pages, sistemas web sob medida, chatbots para WhatsApp, dashboards e relatórios gerenciais, automações e integrações com APIs. Também temos produtos prontos por assinatura: Agendelle (agendamento) e PsiFlux (gestão para psicólogos).',
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

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="border rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        borderColor: isOpen ? 'rgba(13,31,78,0.2)' : 'var(--border-color)',
        background: 'white',
        boxShadow: isOpen ? '0 4px 20px rgba(13,31,78,0.08)' : '0 1px 4px rgba(13,31,78,0.04)',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 group"
      >
        <span
          className="text-sm sm:text-base font-bold leading-snug transition-colors duration-200"
          style={{ color: isOpen ? 'var(--brand-navy)' : 'var(--text-primary)' }}
        >
          {question}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: isOpen ? 'var(--brand-navy)' : 'var(--bg-tertiary)',
            color: isOpen ? '#fff' : 'var(--text-muted)',
          }}
        >
          {isOpen
            ? <Minus className="w-4 h-4" />
            : <Plus className="w-4 h-4" />
          }
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="px-6 pb-5 text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}
            >
              <div className="pt-4">{answer}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filtered = activeCategory === 'Todos'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

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
                Central de Ajuda
              </span>
            </div>
            <h1
              className="font-black text-white leading-[1.05] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              Dúvidas{' '}
              <span style={{ color: 'var(--brand-gold)' }}>Frequentes</span>
            </h1>
            <p className="text-base leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Tudo o que você precisa saber sobre nossos serviços, processos e formas de trabalho.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTEÚDO ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Filtro por categoria */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200"
                style={{
                  background: activeCategory === cat ? 'var(--brand-navy)' : 'white',
                  color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${activeCategory === cat ? 'var(--brand-navy)' : 'var(--border-color)'}`,
                  boxShadow: activeCategory === cat ? '0 4px 12px rgba(13,31,78,0.2)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Lista de perguntas */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {filtered.map((faq, i) => (
                  <FAQItem key={faq.question} question={faq.question} answer={faq.answer} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
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
                  href="https://wa.me/5515997026791?text=Olá%2C%20tenho%20uma%20dúvida%20sobre%20os%20serviços%20da%20Develoi."
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
