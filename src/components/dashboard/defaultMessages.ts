// Mensagens prontas padrão (tom de conversa, sem parecer robô) e gerador de mensagens por produto.
// Marcadores: [Nome] [Estabelecimento] [Seu Nome]. Nada aqui promete preço ou prazo que não esteja cadastrado.
import type { ReadyMessage } from './types';

export type DefaultMessage = Omit<ReadyMessage, 'id' | 'createdAt' | 'userId'>;

const m = (title: string, category: ReadyMessage['category'], body: string, tags: string[] = []): DefaultMessage =>
  ({ title, category, body, tags, isDefault: true, isFavorite: false });

export const DEFAULT_MESSAGES: DefaultMessage[] = [
  m('Primeiro contato', 'approach',
    'Oi, [Nome], tudo bem? 😊\n\nAqui é [Seu Nome], da Develoi. Vi o trabalho de vocês na [Estabelecimento] e achei muito bacana.\n\nA gente cria sistemas e soluções digitais para pequenos negócios, e queria te mostrar rapidinho como isso pode facilitar o dia a dia. Posso te contar mais?', ['abordagem']),
  m('Primeiro contato curto', 'approach',
    'Oi, [Nome]! Aqui é [Seu Nome], da Develoi. Posso te mostrar em 2 minutinhos como a gente ajuda negócios como a [Estabelecimento] a organizar o dia a dia? Sem compromisso 🙂', ['abordagem', 'rápida']),
  m('Por indicação', 'approach',
    'Oi, [Nome], tudo bem? Aqui é [Seu Nome], da Develoi.\n\nChegamos até a [Estabelecimento] por indicação e fiquei com vontade de me apresentar. A gente desenvolve sistemas para pequenos negócios e acho que pode ser útil para vocês. Posso te explicar rapidinho como funciona?', ['indicação']),
  m('Site profissional', 'approach',
    'Oi, [Nome]! Tudo bem? 😊\n\nEu estava vendo a [Estabelecimento] e percebi que vocês ainda não têm um site próprio. Hoje isso faz diferença na hora de aparecer no Google e passar confiança para quem está conhecendo o negócio.\n\nA gente cria sites profissionais e posso te mostrar alguns exemplos. Quer ver?', ['site']),
  m('Atendimento automático no WhatsApp', 'approach',
    'Oi, [Nome]! Você já pensou em ter um atendimento no WhatsApp que responde sozinho, até fora do horário?\n\nA gente tem a BiIA, nossa assistente virtual: ela atende, tira dúvidas e chama a equipe quando precisa. Quer ver como ela funcionaria na [Estabelecimento]?', ['chatbot', 'whatsapp']),
  m('Retomar depois de 1 dia', 'followup',
    'Oi, [Nome], tudo bem? Passando só para saber se você conseguiu ver a minha mensagem de ontem. Sei que a correria é grande, então fica à vontade para responder quando puder 🙂', ['follow-up']),
  m('Retomar depois de alguns dias', 'followup',
    'Oi, [Nome]! Imagino que a semana esteja corrida. Voltei aqui só para ver se ainda faz sentido a gente conversar sobre a [Estabelecimento]. Se não for o momento, sem problema nenhum, me avisa que eu deixo para outra hora 🙂', ['follow-up']),
  m('Depois de enviar a proposta', 'followup',
    'Oi, [Nome]! Como você está? Queria saber o que achou da proposta. Se ficou alguma dúvida sobre valores, prazos ou o que está incluso, me fala que eu explico com calma.', ['follow-up', 'proposta']),
  m('Não atendeu, deixar recado', 'followup',
    'Oi, [Nome]! Tentei te ligar agora há pouco, mas não consegui falar. É o [Seu Nome], da Develoi. Quando tiver um minutinho, me responde por aqui que a gente combina o melhor horário.', ['recado']),
  m('Convite para demonstração', 'proposal',
    'Oi, [Nome]! Que tal ver o sistema funcionando na prática? Em uns 15 minutos eu te mostro tudo e você tira todas as dúvidas. Qual dia e horário ficam melhores para você?', ['demonstração']),
  m('Enviar proposta', 'proposal',
    'Oi, [Nome]! Como combinamos, estou te enviando a proposta para a [Estabelecimento].\n\nResumindo: [Benefício 1], [Benefício 2] e prazo de [Prazo]. O investimento é de R$ [valor].\n\nSe quiser, a gente conversa por aqui ou por ligação para ajustar o que for preciso 😊', ['proposta']),
  m('Ajudar a decidir', 'closing',
    'Oi, [Nome]! Passando para saber se ficou alguma dúvida para a gente começar. Se estiver tudo certo, deixo tudo pronto para a [Estabelecimento] ainda esta semana. Que tal?', ['fechamento']),
  m('Voltar a conversar', 'recovery',
    'Oi, [Nome], tudo bem? Faz um tempo que a gente não se fala e lembrei de você. Se ainda fizer sentido, retomo de onde paramos. E se você mudou de ideia, tudo bem também 🙂', ['recuperação']),
  m('Boas-vindas ao novo cliente', 'onboarding',
    'Seja muito bem-vindo(a) à Develoi, [Nome]! 🎉 Que bom ter você com a gente. Nos próximos dias eu te passo os próximos passos para começar. Qualquer dúvida, é só chamar por aqui.', ['boas-vindas']),
  m('Apresentar uma novidade', 'upsell',
    'Oi, [Nome], tudo bem? Vi que vocês já usam [produto atual] e pensei numa novidade que pode ajudar ainda mais: [novidade]. Quer que eu te explique rapidinho?', ['upsell']),
  m('Retorno de suporte', 'support',
    'Oi, [Nome]! Recebi sua mensagem sobre [problema] e já estou vendo isso. Te dou um retorno em breve, combinado? Se precisar de algo enquanto isso, me chama 🙂', ['suporte']),
  m('Lembrete de pagamento', 'general',
    'Oi, [Nome], tudo bem? Passando com todo carinho para lembrar da fatura de R$ [valor], com vencimento em [data]. Se você já pagou, pode desconsiderar, e obrigado! Qualquer dúvida, estou por aqui 🙏', ['cobrança']),
  m('Agradecer depois da conversa', 'general',
    'Oi, [Nome]! Obrigado pela conversa de hoje, foi um prazer. Qualquer coisa que precisar, é só me chamar por aqui 😊', ['agradecimento']),
];

// ─── Mensagens por produto ──────────────────────────────────────────────────
// O que dá para afirmar de cada produto (só o que já está definido no sistema). Produto sem descrição conhecida usa texto neutro.
interface Pitch { what: string; who: string; trial?: string }
const PITCHES: [RegExp, Pitch][] = [
  [/store\s*boxsys/i, { what: 'o Store BoxSys, um sistema de gestão para lojas, com PDV, controle de estoque, notas fiscais e loja virtual', who: 'lojas e comércios', trial: '14 dias de teste grátis' }],
  [/agendelle/i, { what: 'o Agendelle, um sistema de agendamento que organiza os horários e ajuda a reduzir as faltas', who: 'salões, barbearias, clínicas, estúdios e profissionais autônomos' }],
  [/plaelo|psiflux/i, { what: 'o Plaelo, um sistema para psicólogos e profissionais da saúde mental, com agenda, prontuário, financeiro e documentos', who: 'psicólogos e profissionais da saúde mental' }],
  [/menu\s*boxsys|card[aá]pio/i, { what: 'o Menu BoxSys, um cardápio digital para o seu cliente pedir de forma simples', who: 'restaurantes, lanchonetes e delivery' }],
  [/meca/i, { what: 'o Meca ERP, um sistema de gestão pensado para oficinas mecânicas', who: 'oficinas e auto centers' }],
  [/receitas/i, { what: 'a plataforma Receitas Milionárias, com receitas culinárias, e-books e cursos por assinatura', who: 'quem gosta de cozinhar e quer aprender mais' }],
];

const firstSentence = (t?: string | null) => {
  const s = (t ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const i = s.search(/[.!?](\s|$)/);
  return (i > 20 ? s.slice(0, i) : s).slice(0, 220);
};

export function pitchFor(name: string, description?: string | null): Pitch & { known: boolean } {
  const hit = PITCHES.find(([re]) => re.test(name));
  if (hit) return { ...hit[1], known: true };
  const d = firstSentence(description);
  return { what: d ? `o ${name}: ${d.charAt(0).toLowerCase()}${d.slice(1)}` : `o ${name}`, who: 'negócios como o seu', known: !!d };
}

// Gera o conjunto de mensagens de um produto, já no tom de conversa
export function generateProductMessages(name: string, description?: string | null): DefaultMessage[] {
  const p = pitchFor(name, description);
  const mk = (title: string, category: ReadyMessage['category'], body: string, tags: string[]): DefaultMessage =>
    ({ title: `${name}: ${title}`, category, body, tags: [name.toLowerCase(), ...tags], isDefault: false, isFavorite: false, productName: name });
  return [
    mk('primeiro contato', 'approach',
      `Oi, [Nome], tudo bem? 😊\n\nAqui é [Seu Nome], da Develoi. Estou entrando em contato porque a gente tem ${p.what}, e acho que pode ajudar a [Estabelecimento].\n\nPosso te mostrar rapidinho como funciona?`, ['abordagem']),
    mk('contato curto', 'approach',
      `Oi, [Nome]! Aqui é [Seu Nome], da Develoi. Você já conhece ${p.what.split(',')[0]}? Posso te mostrar em poucos minutos, sem compromisso 🙂`, ['abordagem', 'rápida']),
    mk('retomar contato', 'followup',
      `Oi, [Nome], tudo bem? Passando para saber se você teve a chance de pensar na nossa conversa sobre o ${name}. Se ficou alguma dúvida, me fala que eu explico com calma 🙂`, ['follow-up']),
    mk('convite para demonstração', 'proposal',
      `Oi, [Nome]! Que tal ver o ${name} funcionando na prática? Em uns 15 minutos eu te mostro tudo e você tira as dúvidas. Qual dia e horário ficam melhores para você?`, ['demonstração']),
    ...(p.trial ? [mk('oferecer teste grátis', 'proposal',
      `Oi, [Nome]! Você pode testar o ${name} com ${p.trial}, sem compromisso. Se quiser, eu libero o seu acesso agora e te ajudo nos primeiros passos. Posso fazer isso?`, ['teste grátis'])] : []),
    mk('enviar proposta', 'proposal',
      `Oi, [Nome]! Como combinamos, estou te enviando a proposta do ${name} para a [Estabelecimento].\n\nO investimento é de R$ [valor] e já inclui [Benefício 1] e [Benefício 2].\n\nSe quiser, a gente conversa por aqui ou por ligação para ajustar o que for preciso 😊`, ['proposta']),
    mk('ajudar a decidir', 'closing',
      `Oi, [Nome]! Ficou alguma dúvida sobre o ${name}? Se estiver tudo certo, deixo tudo pronto para a [Estabelecimento] começar ainda esta semana. Que tal?`, ['fechamento']),
    mk('voltar a conversar', 'recovery',
      `Oi, [Nome], tudo bem? Faz um tempinho que conversamos sobre o ${name} e lembrei de você. Se ainda fizer sentido, retomo de onde paramos. E se mudou de ideia, tudo bem também 🙂`, ['recuperação']),
  ];
}
