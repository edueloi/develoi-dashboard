import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "A Develoi só faz software?",
    answer: "Não! Somos uma consultoria completa. Oferecemos desde o planejamento estratégico e marketing de performance até o desenvolvimento de softwares de elite e integração de IA."
  },
  {
    question: "Quanto tempo leva para iniciar um projeto?",
    answer: "Nossa equipe de elite consegue mobilizar e iniciar a fase de planejamento em até 48 horas após a aprovação da proposta estratégica."
  },
  {
    question: "Vocês trabalham com empresas de todos os tamanhos?",
    answer: "Focamos em negócios que buscam excelência e escala. Seja você um empreendedor com uma visão disruptiva ou uma grande corporação buscando inovação, temos a solução ideal."
  },
  {
    question: "O que é a IA Aurora?",
    answer: "A Aurora é nossa inteligência artificial proprietária que pode ser integrada aos seus sistemas para automatizar processos, gerar relatórios inteligentes e melhorar a experiência do seu cliente."
  },
  {
    question: "Como funciona o suporte pós-entrega?",
    answer: "Oferecemos suporte VIP prioritário e acompanhamento constante. Não apenas entregamos o projeto, garantimos que ele continue performando no mais alto nível."
  }
];

function FAQItem({ question, answer, index }: { question: string, answer: string, index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="mb-6"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left p-8 rounded-[2rem] dash-surface border dash-border flex items-center justify-between transition-all shadow-sm ${isOpen ? 'border-indigo-500/30 dash-surface-2' : ''}`}
      >
        <span className="text-xl md:text-2xl font-black tracking-tighter dash-text">{question}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-600 text-white rotate-180 shadow-lg' : 'dash-surface-2 dash-text opacity-50'}`}>
          {isOpen ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 text-lg dash-text-2 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen pt-32 pb-24 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[15%] left-[-5%] w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full animate-float-slow" />
        <div className="absolute inset-0 noise-overlay opacity-[0.08]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full dash-surface-2 border dash-border mb-10 shadow-xl"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Central de Ajuda</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter dash-text"
          >
            DÚVIDAS <span className="text-gradient-animated">FREQUENTES.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl dash-text-2 leading-relaxed font-medium opacity-80"
          >
            Tudo o que você precisa saber sobre como a Develoi eleva o patamar tecnológico do seu negócio.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto mb-40 space-y-6">
          {faqs.map((faq, index) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} index={index} />
          ))}
        </div>

        {/* Still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group max-w-5xl mx-auto"
        >
          <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative dash-surface border dash-border p-12 sm:p-24 rounded-[4rem] text-center overflow-hidden shadow-3xl">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter dash-text">
              NÃO ENCONTROU O QUE <span className="text-gradient">PROCURAVA?</span>
            </h2>
            <p className="text-xl md:text-2xl dash-text-2 mb-12 max-w-2xl mx-auto font-medium opacity-70">
              Nossa equipe técnica está pronta para responder qualquer pergunta e desenhar a melhor arquitetura para seu projeto.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-6 bg-indigo-600 text-white font-black rounded-2xl text-lg shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 transition-all uppercase tracking-widest"
            >
              FALAR COM UM ENGENHEIRO
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
