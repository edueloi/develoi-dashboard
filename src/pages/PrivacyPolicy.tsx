// @ts-nocheck
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowRight } from 'lucide-react';

const sections = [
  {
    icon: Shield,
    title: '1. Quem somos',
    content: `A Develoi é uma empresa de desenvolvimento de software, especializada em sites, sistemas web, chatbots e automações. Nosso site é https://develoi.com.br e nosso contato é contato@develoi.com.br.

Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos as informações que você nos fornece ao utilizar nosso site ou contratar nossos serviços.`,
  },
  {
    icon: Database,
    title: '2. Quais dados coletamos',
    content: `Coletamos apenas os dados necessários para prestar nossos serviços e manter contato com você:

• **Dados de identificação:** nome completo, e-mail, telefone/WhatsApp — fornecidos por você ao preencher formulários de contato ou orçamento.
• **Dados de navegação:** endereço IP, tipo de navegador, páginas visitadas e tempo de permanência — coletados automaticamente via cookies e ferramentas de analytics para melhorar a experiência do usuário.
• **Dados contratuais:** informações necessárias para execução de projetos (CNPJ, razão social, dados para emissão de nota fiscal) — coletados apenas quando há contratação de serviços.

Não coletamos dados sensíveis como documentos pessoais, dados bancários ou informações de saúde.`,
  },
  {
    icon: Eye,
    title: '3. Como usamos seus dados',
    content: `Utilizamos seus dados exclusivamente para:

• Responder solicitações de contato, orçamento e suporte.
• Enviar proposta comercial conforme solicitado.
• Executar os projetos contratados.
• Melhorar a performance e usabilidade do nosso site.
• Cumprir obrigações legais e fiscais.

Não utilizamos seus dados para envio de spam ou publicidade não solicitada. Comunicações de marketing são enviadas apenas com seu consentimento expresso.`,
  },
  {
    icon: UserCheck,
    title: '4. Com quem compartilhamos',
    content: `Seus dados são tratados internamente pela equipe Develoi. Podemos compartilhá-los com terceiros somente nas seguintes situações:

• **Parceiros de execução:** prestadores de serviço que auxiliam na entrega de projetos, mediante contrato de confidencialidade.
• **Plataformas de infraestrutura:** serviços de hospedagem, banco de dados e e-mail (como Firebase, AWS, Google Workspace) que processam dados em nosso nome com garantias de segurança.
• **Obrigações legais:** quando exigido por autoridades competentes, ordem judicial ou legislação aplicável.

Não vendemos, alugamos ou cedemos seus dados a terceiros para fins comerciais.`,
  },
  {
    icon: Lock,
    title: '5. Como protegemos seus dados',
    content: `Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda, alteração ou divulgação indevida:

• Conexões protegidas via HTTPS/TLS.
• Acesso restrito aos dados apenas a colaboradores autorizados.
• Armazenamento em servidores com criptografia em repouso.
• Revisão periódica de permissões e acessos.

Em caso de incidente de segurança que possa afetar seus dados, notificaremos você e a ANPD conforme previsto na LGPD.`,
  },
  {
    icon: Shield,
    title: '6. Por quanto tempo armazenamos',
    content: `Mantemos seus dados pelo tempo necessário para cumprir a finalidade da coleta:

• Dados de contato: até 2 anos após o último contato, salvo contratação de serviços.
• Dados contratuais: pelo prazo legal exigido (mínimo 5 anos para fins fiscais).
• Dados de navegação: até 12 meses.

Após esses prazos, os dados são excluídos ou anonimizados de forma segura.`,
  },
  {
    icon: UserCheck,
    title: '7. Seus direitos (LGPD)',
    content: `Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos:

• **Acesso:** saber quais dados temos sobre você.
• **Correção:** solicitar a atualização de dados incorretos ou desatualizados.
• **Exclusão:** pedir a remoção dos seus dados, quando aplicável.
• **Portabilidade:** receber seus dados em formato estruturado.
• **Revogação do consentimento:** retirar sua autorização a qualquer momento.
• **Informação sobre compartilhamento:** saber com quem compartilhamos seus dados.

Para exercer qualquer um desses direitos, entre em contato pelo e-mail contato@develoi.com.br. Respondemos em até 15 dias úteis.`,
  },
  {
    icon: Database,
    title: '8. Cookies',
    content: `Utilizamos cookies para melhorar sua experiência de navegação:

• **Cookies essenciais:** necessários para o funcionamento básico do site (sessão, preferências de tema).
• **Cookies analíticos:** coletam dados agregados de navegação para análise de desempenho (Google Analytics ou similar). Você pode desativar esses cookies nas configurações do seu navegador sem perder funcionalidades essenciais.

Ao continuar navegando em nosso site, você consente com o uso de cookies essenciais.`,
  },
  {
    icon: Shield,
    title: '9. Links externos',
    content: `Nosso site pode conter links para sites externos (redes sociais, parceiros, ferramentas). Esta política não se aplica a esses sites. Recomendamos que você leia as políticas de privacidade de cada serviço externo que utilizar.`,
  },
  {
    icon: Mail,
    title: '10. Alterações nesta política',
    content: `Podemos atualizar esta Política de Privacidade periodicamente. Quando houver alterações relevantes, notificaremos por e-mail (se tivermos seu contato cadastrado) ou por aviso destacado em nosso site.

A data da última atualização é sempre indicada no rodapé desta página. O uso continuado do site após as alterações implica aceitação da nova versão.`,
  },
];

function Section({ section, index }: { section: typeof sections[0]; index: number }) {
  const Icon = section.icon;

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="mb-1">
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>{part}</strong>
              : part
          )}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl p-6 sm:p-8"
      style={{
        background: 'white',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 6px rgba(13,31,78,0.05)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(13,31,78,0.06)' }}
        >
          <Icon className="w-4 h-4" style={{ color: 'var(--brand-navy)' }} />
        </div>
        <h2
          className="text-base sm:text-lg font-black tracking-tight"
          style={{ color: 'var(--brand-navy)' }}
        >
          {section.title}
        </h2>
      </div>
      <div
        className="text-sm leading-relaxed space-y-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        {renderContent(section.content)}
      </div>
    </motion.div>
  );
}

export default function PrivacyPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Blurs decorativos */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(13,31,78,0.04)' }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'rgba(196,154,42,0.04)' }} />
      </div>

      {/* HERO */}
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
                Legal & Transparência
              </span>
            </div>
            <h1
              className="font-black text-white leading-[1.05] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              Política de{' '}
              <span style={{ color: 'var(--brand-gold)' }}>Privacidade</span>
            </h1>
            <p className="text-base leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Saiba como tratamos seus dados com responsabilidade, transparência e em conformidade com a LGPD.
            </p>
            <p className="text-xs mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Última atualização: junho de 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Aviso LGPD */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-start gap-3 rounded-2xl px-6 py-5 mb-10"
            style={{
              background: 'rgba(13,31,78,0.05)',
              border: '1px solid rgba(13,31,78,0.1)',
            }}
          >
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-navy)' }} />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Esta política foi elaborada em conformidade com a{' '}
              <strong style={{ color: 'var(--brand-navy)' }}>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
              {' '}Nos comprometemos a tratar seus dados pessoais com segurança, transparência e respeito.
            </p>
          </motion.div>

          {/* Seções */}
          <div className="space-y-4">
            {sections.map((section, i) => (
              <Section key={section.title} section={section} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
                  <Mail className="w-5 h-5" style={{ color: 'var(--brand-gold)' }} />
                  <h2
                    className="font-black text-white tracking-tight"
                    style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)' }}
                  >
                    Dúvidas sobre seus dados?
                  </h2>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Nosso DPO responde em até 15 dias úteis. Entre em contato agora.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <a
                  href="mailto:contato@develoi.com.br"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:-translate-y-px"
                  style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 6px 20px rgba(196,154,42,0.3)' }}
                >
                  <Mail className="w-4 h-4" />
                  ENVIAR E-MAIL
                </a>
                <a
                  href="/contato"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  FALE CONOSCO
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
