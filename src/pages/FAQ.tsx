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
        className={`w-full text-left p-8 rounded-[2rem] glass-card border-white/5 flex items-center justify-between transition-all ${isOpen ? 'border-aurora-blue/30 bg-white/[0.03]' : ''}`}
      >
        <span className="text-xl md:text-2xl font-black tracking-tighter">{question}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-aurora-blue text-white rotate-180' : 'bg-white/5 text-neutral-400'}`}>
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
            <div className="p-8 text-lg text-neutral-400 leading-relaxed">
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
      className="pt-32 pb-20"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-8 tracking-tighter"
          >
            DÚVIDAS <span className="text-gradient">FREQUENTES</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-neutral-400 leading-relaxed"
          >
            Tudo o que você precisa saber sobre como a Develoi pode transformar seu negócio.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto mb-32">
          {faqs.map((faq, index) => (
            <div key={faq.question}>
              <FAQItem question={faq.question} answer={faq.answer} index={index} />
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aurora-blue/10 border border-aurora-blue/20 text-xs font-black uppercase tracking-widest text-aurora-blue mb-8">
            <HelpCircle className="w-4 h-4" />
            <span>Ainda tem dúvidas?</span>
          </div>
          <h2 className="text-4xl font-black mb-8 tracking-tighter">Não encontrou o que procurava?</h2>
          <p className="text-xl text-neutral-400 mb-12">
            Nossa equipe está pronta para responder qualquer pergunta e desenhar a melhor estratégia para você.
          </p>
          <button className="px-12 py-6 bg-white text-black font-black rounded-2xl text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10">
            FALAR COM O SUPORTE
          </button>
        </div>
      </div>
    </motion.div>
  );
}
