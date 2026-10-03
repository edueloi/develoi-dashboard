// Intenções extras (dados de treino por área: financeiro, comercial, suporte e conversa). Somadas às intenções fixas do botNlu.ts.
// Para ajustar respostas sem mexer em código, use Bot > Configurações > Inteligência do bot (base de conhecimento).
import type { IntentDef } from "./botNlu.js";

export const EXTRA_INTENTS = [
 {
  "id": "fin_boleto_nao_recebi",
  "label": "Fatura/boleto não recebido ou perdido",
  "phrases": [
   "nao recebi o boleto",
   "não recebi a fatura esse mes",
   "perdi o boleto, como faço",
   "cade o boleto??",
   "o link de pagamento nao chegou",
   "preciso do link pra pagar e nao achei",
   "apaguei a mensagem da fatura sem querer",
   "oi bom dia, nao chegou nada de cobranca no meu whatsapp",
   "me manda o boleto de novo pfv",
   "pode reenviar o link de pagamento?",
   "ainda nao recebi o link do pix",
   "vc consegue mandar de novo o boleto?",
   "o boleto sumiu da conversa",
   "meu boleto nao veio",
   "nao veio a fatura desse mes",
   "qdo vai chegar meu boleto? ja ta perto de vencer",
   "perdi o link da fatura",
   "boa tarde, poderia reenviar a cobranca deste mes?",
   "nao achei o boleto no meu email",
   "preciso pagar mas nao tenho o boleto em maos",
   "manda o pix de novo",
   "troquei de celular e perdi as mensagens, manda a fatura de novo",
   "o link de pagamento expirou, gera outro",
   "nao to achando a cobranca aqui no zap",
   "faltou chegar minha fatura",
   "quero reimprimir o boleto",
   "boleto vencido nao abre, preciso de novo",
   "oii, tem como me enviar o boleto novamente?",
   "nao me chegou a cobranca e nao quero atrasar",
   "segunda via do boleto pfv",
   "me reenvia o link pra eu pagar hj",
   "deletei a fatura sem querer, vc manda outra?"
  ],
  "keywords": [
   [
    "boleto",
    3
   ],
   [
    "reenviar",
    2
   ],
   [
    "perdi",
    3
   ],
   [
    "recebi",
    2
   ],
   [
    "link",
    2
   ],
   [
    "fatura",
    2
   ],
   [
    "mandar",
    1
   ],
   [
    "cobranca",
    1
   ]
  ],
  "replies": [
   "Sem problema{{, nome}}! Eu reenvio agora a fatura pra você. Me informe o *CPF ou CNPJ* do cadastro, por favor. 😊",
   "Claro{{, nome}}! Consigo enviar a 2ª via da fatura por aqui. Só preciso do *CPF/CNPJ* cadastrado pra localizar sua cobrança.",
   "{{saudacao}}{{, nome}}! Vou te mandar o link de pagamento de novo. Me passa o *CPF ou CNPJ* do cadastro e eu busco rapidinho. 💙",
   "Tranquilo! Com o *CPF/CNPJ* do cadastro eu localizo sua cobrança e envio o link seguro novamente, com Pix, boleto ou cartão."
  ],
  "action": "invoice",
  "followUp": "Qual é o CPF ou CNPJ do cadastro?",
  "priority": 3,
  "system": null
 },
 {
  "id": "fin_cobranca_indevida",
  "label": "Cobrança indevida ou valor errado",
  "phrases": [
   "fui cobrado errado",
   "o valor da fatura veio errado",
   "essa cobranca nao e minha",
   "nao reconheco essa cobranca",
   "tem uma cobranca que eu nao entendi",
   "o valor ta diferente do combinado",
   "me cobraram um valor que nao faz sentido",
   "oi, a fatura veio com valor maior que o normal",
   "isso ta errado, ja cancelei e continuam cobrando",
   "cobranca indevida",
   "nao autorizei essa cobranca",
   "vcs cobraram a mais",
   "por que veio esse valor?",
   "o boleto veio mais caro desse mes",
   "quero contestar uma cobranca",
   "acho que tem erro na minha fatura",
   "boa noite, recebi uma cobranca de algo que nao contratei",
   "meu plano nao e esse e a cobranca ta diferente",
   "vcs me cobraram de novo mesmo depois de eu cancelar",
   "tem um valor estranho na minha fatura",
   "nao concordo com essa cobranca",
   "cobrança errada, preciso resolver isso",
   "qual o motivo dessa cobranca? nao lembro de ter contratado",
   "o valor cobrado nao bate com o que eu assinei",
   "ta cobrando pq? eu nao usei esse mes",
   "fatura com valor errado, podem revisar?",
   "contestar valor da mensalidade",
   "me cobraram algo que eu nao pedi",
   "veio um valor diferente no boleto, aconteceu alguma coisa?",
   "quero entender por que fui cobrada essa quantia",
   "tem cobranca a mais na minha conta",
   "cobranca fora do padrao, preciso de ajuda"
  ],
  "keywords": [
   [
    "indevida",
    3
   ],
   [
    "errado",
    3
   ],
   [
    "cobraram",
    2
   ],
   [
    "contestar",
    3
   ],
   [
    "valor",
    1
   ],
   [
    "erro",
    2
   ],
   [
    "reconheco",
    2
   ],
   [
    "diferente",
    1
   ]
  ],
  "replies": [
   "Entendo sua preocupação{{, nome}}. Vou encaminhar seu caso para o *time do Financeiro*, que analisa a cobrança com atenção e te retorna. 💙",
   "Poxa, obrigada por avisar{{, nome}}! Cobranças contestadas são analisadas pelo *Financeiro*. Vou chamar alguém do time pra revisar com você.",
   "Vamos resolver isso{{, nome}}. Vou acionar o *time do Financeiro* pra conferir o valor e te explicar direitinho.",
   "Obrigada por me contar{{, nome}}. Isso precisa de análise humana, então já estou te passando pro *Financeiro* pra revisar sua cobrança."
  ],
  "action": "handoff:Financeiro",
  "followUp": "Pode me adiantar qual cobrança está errada e o motivo?",
  "priority": 4,
  "system": null
 },
 {
  "id": "fin_bloqueio_atraso",
  "label": "Acesso bloqueado por atraso",
  "phrases": [
   "meu sistema foi bloqueado",
   "nao consigo entrar no sistema, disseram que e pagamento",
   "acesso bloqueado por atraso",
   "minha loja saiu do ar",
   "o sistema ta bloqueado, ja paguei",
   "bloquearam meu acesso",
   "por que meu acesso foi suspenso?",
   "oi, nao consigo logar e apareceu aviso de pendencia financeira",
   "minha conta ta suspensa",
   "quero liberar meu acesso, vou pagar agora",
   "como desbloqueio o sistema?",
   "paguei e continua bloqueado",
   "qdo libera meu acesso depois do pagamento?",
   "sistema bloqueado por falta de pagamento",
   "apareceu uma mensagem de assinatura em atraso",
   "meu site/loja ta fora do ar por causa da fatura?",
   "ta aparecendo acesso suspenso",
   "nao entro mais, preciso resolver o pagamento",
   "como faco pra voltar a usar o sistema?",
   "desbloquear conta",
   "minha assinatura esta vencida e nao abre mais",
   "fiquei sem acesso hj de manha",
   "o sistema pede pra regularizar o pagamento",
   "quanto tempo leva pra liberar depois que pago?",
   "fui bloqueado e preciso trabalhar agora, ajuda",
   "bloqueio de acesso pfv me ajuda",
   "vcs bloquearam tudo e eu tenho clientes esperando",
   "meu painel nao abre, aparece pagamento pendente",
   "desbloqueia pra mim por favor",
   "acesso negado, assinatura em atraso",
   "ja regularizei, quando volta?",
   "a loja caiu e acho que e a fatura"
  ],
  "keywords": [
   [
    "bloqueado",
    3
   ],
   [
    "bloqueio",
    3
   ],
   [
    "suspenso",
    3
   ],
   [
    "acesso",
    2
   ],
   [
    "desbloquear",
    3
   ],
   [
    "liberar",
    2
   ],
   [
    "atraso",
    2
   ],
   [
    "fora",
    1
   ]
  ],
  "replies": [
   "Entendo a urgência{{, nome}}. Quando a assinatura fica em atraso além da tolerância, o acesso pode ser bloqueado e ele é *liberado assim que o pagamento é confirmado*. Posso te enviar a fatura agora?",
   "Sinto o transtorno{{, nome}}! O acesso volta assim que o pagamento é confirmado, e o *Pix cai em instantes*. Me passa o *CPF/CNPJ* do cadastro que eu envio o link. 💙",
   "Vamos regularizar rapidinho{{, nome}}. Informe o *CPF ou CNPJ* do cadastro e eu mando a fatura. Pagando por Pix, a confirmação é em instantes e o acesso é liberado.",
   "Se você já pagou, me avise{{, nome}}. Pix é confirmado na hora; boleto pode levar *até 2 dias úteis* para compensar. Se precisar, chamo o Financeiro."
  ],
  "action": "invoice",
  "followUp": "Quer que eu envie a fatura agora? É só me passar o CPF/CNPJ.",
  "priority": 4,
  "system": null
 },
 {
  "id": "fin_negociar_atraso",
  "label": "Negociar ou parcelar atraso",
  "phrases": [
   "posso parcelar o que to devendo?",
   "quero negociar minha divida",
   "to com fatura atrasada, tem como negociar?",
   "da pra dividir o valor em atraso?",
   "preciso de um acordo pra pagar o atraso",
   "consigo pagar so no proximo mes?",
   "estou com dificuldade pra pagar essa fatura",
   "tem como estender o prazo do vencimento?",
   "oi, ficou apertado esse mes, podemos conversar sobre pagamento?",
   "queria parcelar as mensalidades atrasadas",
   "tem alguma condicao pra quem ta atrasado?",
   "quero fazer um acordo",
   "negociar debito",
   "posso pagar depois do dia 20?",
   "vcs aceitam parcelado o atraso?",
   "to devendo 2 meses, como regularizo?",
   "pode me dar mais uns dias pra pagar?",
   "preciso de mais prazo pra quitar",
   "tem como dividir em vezes a fatura atrasada?",
   "falar com alguem sobre meus debitos",
   "minha situacao financeira ta complicada, vcs ajudam?",
   "quero quitar mas nao consigo tudo de uma vez",
   "pagar em partes pode?",
   "como faco pra regularizar o atraso aos poucos?",
   "fiquei sem caixa, da pra renegociar?",
   "adiar o pagamento da mensalidade",
   "tem renegociacao?",
   "gostaria de uma proposta pra pagar o que devo",
   "nao consigo pagar hj, tem outra data?",
   "me ajuda a acertar minha pendencia",
   "queria combinar uma forma de pagar o atrasado",
   "podem liberar meu acesso se eu pagar uma parte?"
  ],
  "keywords": [
   [
    "negociar",
    3
   ],
   [
    "parcelar",
    3
   ],
   [
    "acordo",
    3
   ],
   [
    "atrasado",
    2
   ],
   [
    "divida",
    2
   ],
   [
    "renegociar",
    3
   ],
   [
    "prazo",
    2
   ],
   [
    "devendo",
    2
   ]
  ],
  "replies": [
   "Claro{{, nome}}, vamos conversar! Negociação de atraso é com o *time do Financeiro*, que analisa o seu caso e propõe a melhor forma. Já estou te encaminhando. 💙",
   "Entendo{{, nome}}, acontece. Condições de pagamento são avaliadas pelo *Financeiro*. Vou chamar alguém do time pra combinar isso com você.",
   "Obrigada por avisar antes{{, nome}}! Não consigo definir acordos por aqui, mas o *time do Financeiro* analisa e te responde. Passando seu atendimento agora.",
   "Vamos achar um caminho{{, nome}}. Vou direcionar você ao *Financeiro* para avaliar sua situação e as opções de pagamento."
  ],
  "action": "handoff:Financeiro",
  "followUp": "Pode me contar rapidamente a situação pra agilizar o atendimento?",
  "priority": 4,
  "system": null
 },
 {
  "id": "fin_desconto",
  "label": "Pedir desconto",
  "phrases": [
   "tem desconto?",
   "consegue um desconto pra mim?",
   "queria um descontinho",
   "tem como baixar o valor da mensalidade?",
   "existe desconto pra pagamento anual?",
   "vcs dao desconto se eu pagar a vista?",
   "ta caro, tem como fazer mais barato?",
   "oi, sou cliente antigo, tem algum desconto?",
   "tem promocao?",
   "da pra fazer um precinho melhor?",
   "quero negociar o valor da assinatura",
   "tem cupom de desconto?",
   "desconto para pagar adiantado",
   "se eu indicar um amigo ganho desconto?",
   "posso pagar menos?",
   "reduzir o valor do plano",
   "fiz a indicacao de alguem, tenho desconto?",
   "tem como diminuir a mensalidade?",
   "queria saber se vcs fazem desconto pra cliente fiel",
   "faz um precinho pra mim?",
   "qual o melhor valor que vcs conseguem?",
   "pagando no pix tem desconto?",
   "desconto no plano anual?",
   "to pensando em cancelar pq ta pesado, tem desconto?",
   "meu concorrente cobra menos, conseguem cobrir?",
   "tem alguma campanha rolando?",
   "pedir abatimento no valor",
   "bom dia, gostaria de saber se ha possibilidade de desconto",
   "valor promocional tem?",
   "consegue melhorar o valor?",
   "blz, e se eu fechar o ano todo, tem desconto?",
   "preciso de um desconto pra continuar"
  ],
  "keywords": [
   [
    "desconto",
    3
   ],
   [
    "promocao",
    2
   ],
   [
    "cupom",
    2
   ],
   [
    "barato",
    2
   ],
   [
    "baixar",
    1
   ],
   [
    "reduzir",
    2
   ],
   [
    "caro",
    2
   ],
   [
    "abatimento",
    2
   ]
  ],
  "replies": [
   "Entendi{{, nome}}! Eu não tenho como confirmar descontos por aqui, mas o *time do Financeiro* avalia o seu pedido. Vou te encaminhar agora. 💙",
   "Obrigada por perguntar{{, nome}}! Condições de valor e descontos são analisadas pelo *Financeiro*. Já estou chamando alguém do time pra conversar com você.",
   "Boa pergunta{{, nome}}! Sobre valores e possíveis condições, quem analisa é o *time do Financeiro*. Vou passar seu atendimento pra eles.",
   "Vou levar seu pedido ao *time do Financeiro*{{, nome}}, que avalia caso a caso. Um instante, tá?"
  ],
  "action": "handoff:Financeiro",
  "followUp": "Quer me contar o motivo do pedido pra eu repassar ao time?",
  "priority": 2,
  "system": null
 },
 {
  "id": "fin_estorno",
  "label": "Estorno ou reembolso",
  "phrases": [
   "quero meu dinheiro de volta",
   "preciso de reembolso",
   "pedir estorno",
   "quero estornar o pagamento",
   "paguei errado, quero devolucao",
   "me devolvem o valor?",
   "como pedir reembolso?",
   "cobraram e eu nao quis o servico, quero o dinheiro de volta",
   "oi, paguei duas vezes e quero ser reembolsado",
   "solicito estorno da ultima fatura",
   "devolver o valor pago",
   "quero cancelar e receber de volta",
   "paguei sem querer, tem como devolver?",
   "cade meu reembolso?",
   "ainda nao recebi o estorno",
   "faz 10 dias que pedi reembolso e nada",
   "reembolso por favor",
   "pagamento indevido quero de volta",
   "estorno no cartao",
   "meu pix foi pro lugar errado, consigo recuperar?",
   "paguei um valor a mais, devolvem a diferenca?",
   "quero o ressarcimento",
   "ressarcir valor pago",
   "retornar o dinheiro da assinatura",
   "vcs reembolsam?",
   "me devolve o que paguei",
   "errei o valor no pix, como corrijo?",
   "bom dia, gostaria de solicitar a devolucao do pagamento",
   "pedi estorno e nao vi nada na fatura do cartao",
   "consigo o dinheiro de volta se eu cancelar hoje?",
   "cobranca duplicada, quero o estorno de uma",
   "devolucao do valor pago em duplicidade"
  ],
  "keywords": [
   [
    "estorno",
    3
   ],
   [
    "reembolso",
    3
   ],
   [
    "devolucao",
    3
   ],
   [
    "devolver",
    3
   ],
   [
    "ressarcir",
    2
   ],
   [
    "dinheiro",
    2
   ],
   [
    "voltar",
    1
   ],
   [
    "estornar",
    3
   ]
  ],
  "replies": [
   "Entendi{{, nome}}. Pedidos de estorno e reembolso são analisados pelo *time do Financeiro*, e eu não consigo prometer prazos ou condições por aqui. Já estou te encaminhando. 💙",
   "Vamos cuidar disso{{, nome}}! O *Financeiro* avalia o seu pedido de reembolso. Vou chamar alguém do time pra verificar o pagamento com você.",
   "Obrigada por explicar{{, nome}}. A análise de estorno é feita pelo *time do Financeiro*. Estou passando seu caso pra eles agora.",
   "Sinto pelo transtorno{{, nome}}. Vou direcionar você ao *Financeiro*, que confere o pagamento e te dá o retorno."
  ],
  "action": "handoff:Financeiro",
  "followUp": "Se puder, me diga a data e a forma do pagamento (Pix, boleto ou cartão).",
  "priority": 4,
  "system": null
 },
 {
  "id": "fin_cartao_recusado",
  "label": "Cartão recusado ou com erro",
  "phrases": [
   "meu cartao foi recusado",
   "o cartao nao passa",
   "deu erro no cartao",
   "pagamento no cartao nao aprovou",
   "cartao recusado de novo",
   "tentei pagar no cartao e nao foi",
   "nao consigo pagar com cartao",
   "o link nao aceita meu cartao",
   "cartao negado",
   "oi, aparece erro ao colocar os dados do cartao",
   "passei o cartao 3 vezes e nada",
   "pq meu cartao nao funciona no pagamento?",
   "cartao de credito nao autorizou",
   "meu banco recusou a cobranca",
   "limite do cartao nao liberou",
   "o cartao deu transacao nao autorizada",
   "tentei no cartao e travou",
   "pagamento com cartao falhou",
   "cartao expirou e agora?",
   "troquei de cartao, como atualizo?",
   "o cartao foi bloqueado pelo banco e cobranca nao passou",
   "nao to conseguindo finalizar o pagamento",
   "erro ao pagar com cartao de credito",
   "cobranca no cartao nao deu certo",
   "nao aprova meu cartao nem pedindo",
   "a fatura nao fecha no cartao",
   "cartao de debito aceita?",
   "o pagamento fica carregando e da erro",
   "meu cartao funciona em tudo menos no link de voces",
   "recusou o cartao, e agora o que eu faço?",
   "sera que posso pagar de outro jeito, o cartao nao vai",
   "o cartao venceu"
  ],
  "keywords": [
   [
    "cartao",
    3
   ],
   [
    "recusado",
    3
   ],
   [
    "recusou",
    3
   ],
   [
    "erro",
    2
   ],
   [
    "negado",
    2
   ],
   [
    "aprovou",
    2
   ],
   [
    "autorizou",
    2
   ],
   [
    "falhou",
    2
   ]
  ],
  "replies": [
   "Poxa{{, nome}}! Às vezes o banco recusa por limite, validade ou segurança. Vale tentar de novo, conferir os dados ou falar com o banco. Se preferir, pague por *Pix ou boleto* no mesmo link. 😊",
   "Vamos dar um jeito{{, nome}}! Se o cartão não passar, você pode pagar por *Pix* (confirmado em instantes) ou boleto. Quer que eu reenvie a fatura? Só preciso do *CPF/CNPJ*.",
   "Entendo a frustração{{, nome}}. Confira número, validade e limite do cartão ou tente outro. O link também aceita *Pix e boleto*. Se persistir, chamo o *Suporte*.",
   "Obrigada por avisar{{, nome}}! A recusa costuma vir do banco emissor. Enquanto isso, você pode pagar com *Pix* pelo mesmo link. Se continuar o erro, me avise que eu aciono o time."
  ],
  "action": "reply",
  "followUp": "Quer que eu reenvie a fatura para pagar por Pix ou boleto?",
  "priority": 3,
  "system": null
 },
 {
  "id": "fin_trocar_forma_pagto",
  "label": "Trocar forma de pagamento",
  "phrases": [
   "quero mudar a forma de pagamento",
   "posso pagar por pix em vez de cartao?",
   "como troco do boleto pro cartao?",
   "quero pagar no cartao daqui pra frente",
   "trocar o cartao cadastrado",
   "mudar pra pix",
   "queria pagar no boleto ao inves do pix",
   "da pra alterar como eu pago?",
   "atualizar cartao de credito",
   "trocar meu metodo de pagamento",
   "oi, queria mudar de boleto para cartao",
   "quero pagar tudo no cartao, como faz?",
   "nao quero mais pagar no boleto",
   "posso escolher outra forma de pagar?",
   "como cadastro um cartao novo?",
   "pagar via pix agora, nao mais cartao",
   "alterar dados de pagamento",
   "tem como colocar a cobranca no meu outro cartao?",
   "mudar o cartao da assinatura",
   "preferia pagar por boleto, pode ser?",
   "quais formas de pagamento vcs aceitam?",
   "aceita pix, boleto e cartao?",
   "posso pagar com qualquer um?",
   "queria trocar meu cartao que venceu",
   "como mudo pra pix automatico?",
   "em qual forma posso pagar a mensalidade?",
   "da pra parcelar no cartao?",
   "trocar para pagamento via pix",
   "atualizar metodo de cobranca",
   "nao uso mais aquele cartao, como troco?",
   "pagamento por transferencia pode?",
   "vou passar a pagar por outro meio"
  ],
  "keywords": [
   [
    "trocar",
    3
   ],
   [
    "mudar",
    3
   ],
   [
    "forma",
    2
   ],
   [
    "pagamento",
    2
   ],
   [
    "cartao",
    1
   ],
   [
    "pix",
    1
   ],
   [
    "boleto",
    1
   ],
   [
    "alterar",
    2
   ]
  ],
  "replies": [
   "Sem problema{{, nome}}! O link de pagamento que eu envio aceita *Pix, boleto ou cartão*, e você escolhe a forma na hora de pagar. Quer que eu envie a fatura agora?",
   "Claro{{, nome}}! Você pode escolher *Pix, boleto ou cartão* no link seguro da cobrança. Se quiser um novo link, me passe o *CPF/CNPJ* do cadastro. 💙",
   "Dá sim{{, nome}}! A cada cobrança você escolhe como pagar: *Pix, boleto ou cartão*. Se preferir deixar tudo no automático, posso te explicar o *Pix Automático*.",
   "Posso ajudar{{, nome}}! As formas disponíveis no link são *Pix, boleto e cartão*. Se precisar mudar algo no cadastro, o *Financeiro* pode ajudar."
  ],
  "action": "reply",
  "followUp": "Quer que eu envie um novo link de pagamento?",
  "priority": 2,
  "system": null
 },
 {
  "id": "fin_pix_automatico",
  "label": "Pix Automático (o que é, autorizar, cancelar)",
  "phrases": [
   "o que e pix automatico?",
   "como funciona o pix automatico",
   "quero ativar o pix automatico",
   "como autorizo o pix automatico?",
   "cancelar o pix automatico",
   "desativar debito automatico do pix",
   "como faco pra nao precisar pagar todo mes?",
   "tem pagamento automatico?",
   "autorizar cobranca recorrente no app do banco",
   "oi, recebi um link de autorizacao, o que e isso?",
   "e seguro o pix automatico?",
   "vai sair da minha conta sozinho?",
   "pix automatico precisa autorizar toda vez?",
   "quero deixar a mensalidade no automatico",
   "onde autorizo o pix automatico no banco?",
   "como cancelo a autorizacao do pix automatico?",
   "pix automatico qual a vantagem",
   "nao quero que cobrem sozinho, como tiro?",
   "autorizei o pix automatico mas nao sei se funcionou",
   "como sei se o pix automatico ta ativo?",
   "cade o link pra autorizar o pix automatico",
   "tem como pagar automatico sem cartao?",
   "a autorizacao do pix automatico nao abre",
   "meu banco nao mostra a autorizacao",
   "pix recorrente voces tem?",
   "debito automatico tem?",
   "como faco pra parar a cobranca automatica",
   "pix auto como ativa",
   "vc pode me mandar o link do pix automatico?",
   "preciso autorizar so uma vez mesmo?",
   "o banco pediu pra autorizar uma cobranca da Develoi, e isso mesmo?",
   "revogar autorizacao do pix"
  ],
  "keywords": [
   [
    "automatico",
    3
   ],
   [
    "autorizar",
    3
   ],
   [
    "autorizacao",
    3
   ],
   [
    "recorrente",
    2
   ],
   [
    "pix",
    2
   ],
   [
    "sozinho",
    2
   ],
   [
    "debito",
    1
   ],
   [
    "cancelar",
    1
   ]
  ],
  "replies": [
   "O *Pix Automático* é bem prático{{, nome}}! Você *autoriza uma única vez* no app do seu banco e as próximas cobranças saem sozinhas, sem precisar pagar todo mês. 😊",
   "Funciona assim{{, nome}}: você autoriza *uma vez* no app do banco e as cobranças seguintes são pagas automaticamente. A autorização fica no seu app, e é lá que você também gerencia ou cancela.",
   "Pode ficar tranquilo(a){{, nome}}! A autorização é feita por você no *app do seu banco*, e depois disso as próximas cobranças saem sozinhas. Se tiver dificuldade pra autorizar, posso chamar o *Financeiro*.",
   "Quer ativar{{, nome}}? É só autorizar *uma vez* pelo app do banco. Se o link ou a autorização não aparecer pra você, me avise que eu aciono o *time do Financeiro* pra ajudar."
  ],
  "action": "reply",
  "followUp": "Quer que eu chame o Financeiro para ajudar com a autorização?",
  "priority": 3,
  "system": null
 },
 {
  "id": "fin_nota_fiscal_recibo",
  "label": "Nota fiscal, recibo ou comprovante",
  "phrases": [
   "preciso da nota fiscal",
   "me manda a nota fiscal do pagamento",
   "cade o recibo?",
   "quero o comprovante de pagamento",
   "preciso de um recibo em pdf",
   "emite nota fiscal pra mim?",
   "nota fiscal da mensalidade",
   "oi, preciso do recibo pra contabilidade",
   "meu contador pediu a nota",
   "comprovante do ultimo pagamento",
   "segunda via do recibo",
   "nao recebi o recibo depois que paguei",
   "manda o recibo de novo",
   "pdf do pagamento por favor",
   "preciso de comprovante pro imposto de renda",
   "quero o extrato dos meus pagamentos",
   "historico de pagamentos",
   "como eu pego a nota fiscal?",
   "recibo dos meses anteriores",
   "nf do mes passado",
   "necessito de comprovante pra reembolso na empresa",
   "pode me enviar o comprovante?",
   "a nota sai automatico?",
   "pq nao veio recibo do pagamento?",
   "tem como emitir recibo com meu cnpj?",
   "comprovante do pix que fiz ontem",
   "preciso dos recibos de todos os meses",
   "documento fiscal do servico",
   "manda todos os pagamentos que eu fiz",
   "extrato em pdf",
   "me envia o recibo de pagamento",
   "fechamento do ano, preciso de todos os comprovantes"
  ],
  "keywords": [
   [
    "nota",
    3
   ],
   [
    "recibo",
    3
   ],
   [
    "comprovante",
    3
   ],
   [
    "fiscal",
    2
   ],
   [
    "pdf",
    2
   ],
   [
    "extrato",
    2
   ],
   [
    "historico",
    2
   ],
   [
    "contabilidade",
    1
   ]
  ],
  "replies": [
   "Claro{{, nome}}! O *recibo em PDF* é enviado depois do pagamento, e posso te mandar o *extrato dos seus pagamentos em PDF*. Me passa o *CPF ou CNPJ* do cadastro. 💙",
   "Posso ajudar{{, nome}}! Com o *CPF/CNPJ* do cadastro, envio o extrato de pagamentos em PDF, que serve como comprovante. Para questões de nota fiscal, chamo o *Financeiro*.",
   "Vamos lá{{, nome}}! Me informe o *CPF ou CNPJ* e eu envio seu *extrato de pagamentos em PDF*. Se precisar de documento fiscal específico, o *time do Financeiro* te atende.",
   "{{saudacao}}{{, nome}}! O recibo em PDF é enviado após a confirmação do pagamento, e consigo reenviar o extrato. Só preciso do *CPF/CNPJ* do cadastro."
  ],
  "action": "statement",
  "followUp": "Qual é o CPF ou CNPJ do cadastro?",
  "priority": 3,
  "system": null
 },
 {
  "id": "fin_vencimento_valor",
  "label": "Quando vence e qual o valor da mensalidade",
  "phrases": [
   "qual o dia do vencimento?",
   "quando vence minha fatura?",
   "qual o valor da minha mensalidade?",
   "quanto eu pago por mes?",
   "qual a data de vencimento",
   "preciso saber quanto vai ser a proxima cobranca",
   "quanto ta minha fatura?",
   "oi, quando e que eu pago de novo?",
   "meu plano vence quando?",
   "qual o proximo vencimento",
   "quanto devo hoje?",
   "valor da assinatura",
   "tenho alguma fatura em aberto?",
   "to devendo alguma coisa?",
   "consulta de debito",
   "tem pendencia no meu nome ai?",
   "qual dia cai a cobranca?",
   "a fatura vence hj?",
   "ate quando posso pagar?",
   "valor pra renovar",
   "quanto custa meu plano atual?",
   "minha assinatura e mensal ou anual?",
   "quando renova meu plano?",
   "quando vai ser cobrado?",
   "saber o valor da proxima parcela",
   "qto eu pago?",
   "a mensalidade vence todo dia quanto?",
   "vc pode ver pra mim se tem algo pendente?",
   "me diz o valor que eu tenho que pagar",
   "tenho conta em aberto?",
   "ve a minha situacao financeira pfv",
   "em que dia vence o boleto?"
  ],
  "keywords": [
   [
    "vencimento",
    3
   ],
   [
    "vence",
    3
   ],
   [
    "valor",
    2
   ],
   [
    "mensalidade",
    2
   ],
   [
    "pagar",
    1
   ],
   [
    "fatura",
    2
   ],
   [
    "aberto",
    2
   ],
   [
    "pendencia",
    2
   ]
  ],
  "replies": [
   "Vou conferir pra você{{, nome}}! Me passe o *CPF ou CNPJ* do cadastro e eu busco sua fatura com *valor e vencimento*. 💙",
   "Consigo ver isso{{, nome}}! Com o *CPF/CNPJ* do cadastro, localizo sua cobrança e te envio a fatura, onde constam valor e data de vencimento.",
   "Claro{{, nome}}! Informe o *CPF ou CNPJ* do cadastro que eu consulto sua cobrança e envio o link de pagamento com todos os detalhes.",
   "{{saudacao}}{{, nome}}! Pra consultar valor e vencimento da sua assinatura, preciso do *CPF/CNPJ* do cadastro. Se quiser ver o histórico, também posso enviar o extrato."
  ],
  "action": "invoice",
  "followUp": "Qual é o CPF ou CNPJ do cadastro?",
  "priority": 3,
  "system": null
 },
 {
  "id": "fin_cobranca_duplicada",
  "label": "Cobrança ou pagamento duplicado",
  "phrases": [
   "fui cobrado duas vezes",
   "paguei duas vezes a mesma fatura",
   "cobranca duplicada",
   "veio 2 boletos do mesmo mes",
   "pagamento em duplicidade",
   "paguei o pix e depois paguei o boleto sem querer",
   "oi, apareceram duas cobrancas iguais",
   "duas faturas pro mesmo periodo",
   "me cobraram 2x",
   "cobrou em dobro",
   "paguei em dobro, o que faco?",
   "tem duas cobrancas no meu cartao",
   "a mesma cobranca apareceu de novo",
   "paguei e veio outra cobranca igual",
   "duas faturas abertas do mesmo mes, qual pago?",
   "pagamento repetido",
   "debitou duas vezes",
   "cobranca dobrada",
   "dupla cobranca",
   "tem boleto duplicado aqui",
   "paguei a fatura e o pix automatico cobrou de novo",
   "fiz o pix e o cartao tambem foi cobrado",
   "pagamento duplicado quero resolver",
   "nao era pra cobrar de novo, ja paguei esse mes",
   "acabei de pagar e ja veio outra fatura igual",
   "tem 2 links de pagamento pro mesmo mes",
   "bom dia, cai duas cobrancas na minha conta",
   "cobraram o mesmo valor duas vezes",
   "paguei um boleto que ja tinha pago pelo pix",
   "duplicidade de pagamento",
   "a cobranca veio repetida",
   "recebi dois boletos iguais, so devo um?"
  ],
  "keywords": [
   [
    "duplicada",
    3
   ],
   [
    "duplicidade",
    3
   ],
   [
    "duas",
    2
   ],
   [
    "dobro",
    3
   ],
   [
    "repetida",
    2
   ],
   [
    "2x",
    2
   ],
   [
    "cobraram",
    1
   ],
   [
    "duplo",
    2
   ]
  ],
  "replies": [
   "Vamos resolver isso{{, nome}}! Cobranças ou pagamentos em duplicidade precisam de conferência do *time do Financeiro*. Não pague de novo por enquanto, tá? Já te encaminho. 💙",
   "Entendi{{, nome}}. Vou passar seu caso ao *Financeiro* pra conferir as duas cobranças e orientar você sobre o que fazer.",
   "Obrigada por avisar{{, nome}}! O *time do Financeiro* vai analisar a duplicidade. Estou te encaminhando agora, e se tiver os comprovantes, já pode separar.",
   "Sinto pelo transtorno{{, nome}}. A conferência de duplicidade é feita pelo *Financeiro*, e eu já estou chamando alguém do time."
  ],
  "action": "handoff:Financeiro",
  "followUp": "Tem os comprovantes dos dois pagamentos para enviar ao time?",
  "priority": 4,
  "system": null
 },
 {
  "id": "fin_pagamento_nao_identificado",
  "label": "Paguei e não foi identificado",
  "phrases": [
   "paguei e nao baixou",
   "ja paguei mas continua aparecendo em aberto",
   "fiz o pix e nao constou",
   "paguei ontem e o sistema nao reconheceu",
   "oi bom dia, e que eu paguei ontem mas ainda ta pendente",
   "meu pagamento nao caiu",
   "paguei o boleto e nao compensou",
   "o pix foi feito e a fatura continua em aberto",
   "tenho o comprovante, mas vcs nao identificaram",
   "paguei e a cobranca nao saiu da lista",
   "pagamento nao confirmado",
   "cade a confirmacao do meu pagamento?",
   "fiz a transferencia e nada",
   "paguei faz 3 dias e nao foi confirmado",
   "o dinheiro saiu da minha conta mas nao foi reconhecido",
   "pagamento nao identificado",
   "vcs receberam meu pix?",
   "paguei no cartao e ainda aparece pendente",
   "mandei o comprovante e nada",
   "ja quitei, pq continua cobrando?",
   "paguei pelo app do banco e a fatura segue aberta",
   "nao deu baixa no meu pagamento",
   "o pagamento nao apareceu",
   "quero confirmar se meu pagamento chegou",
   "paguei errado a conta e nao identificou",
   "como comprovo que paguei?",
   "enviei o comprovante e ainda nao liberaram",
   "paguei mas nao liberou o sistema",
   "fiz o pagamento e ainda me cobram",
   "pagamento pendente mesmo depois de pago",
   "o valor foi debitado e a fatura segue vencida",
   "tem como verificar se meu pix chegou?"
  ],
  "keywords": [
   [
    "paguei",
    3
   ],
   [
    "identificado",
    3
   ],
   [
    "confirmado",
    2
   ],
   [
    "baixa",
    2
   ],
   [
    "compensou",
    2
   ],
   [
    "comprovante",
    2
   ],
   [
    "pendente",
    2
   ],
   [
    "caiu",
    2
   ]
  ],
  "replies": [
   "Obrigada por avisar{{, nome}}! O Pix costuma ser confirmado em instantes, e o boleto pode levar *até 2 dias úteis* para compensar. Se já passou desse tempo, o *time do Financeiro* confere pra você.",
   "Vamos verificar{{, nome}}! Se puder, tenha o *comprovante* em mãos. Pix é confirmado em instantes e boleto em *até 2 dias úteis*. Vou acionar o *Financeiro* pra conferir o seu caso. 💙",
   "Entendo a preocupação{{, nome}}. Se o pagamento foi feito e não foi identificado, o *Financeiro* analisa com o comprovante. Estou te encaminhando.",
   "Já pagou{{, nome}}? Ótimo! Se ainda aparece em aberto, vou chamar o *time do Financeiro* pra localizar o pagamento. Pode me enviar o comprovante por aqui."
  ],
  "action": "handoff:Financeiro",
  "followUp": "Qual foi a forma de pagamento e a data? E se tiver o comprovante, pode mandar aqui.",
  "priority": 4,
  "system": null
 },
 {
  "id": "fin_prazo_compensacao",
  "label": "Prazo de compensação do pagamento",
  "phrases": [
   "quanto tempo o boleto demora pra compensar?",
   "em quanto tempo o pix confirma?",
   "o boleto leva quantos dias pra cair?",
   "pix cai na hora?",
   "qdo o pagamento e confirmado?",
   "quanto tempo pra liberar depois de pagar?",
   "paguei o boleto hj, quando libera?",
   "demora pra compensar?",
   "prazo de compensacao",
   "o boleto compensa em quantos dias uteis?",
   "paguei no sabado, quando reconhece?",
   "pagando por pix libera na hora?",
   "quanto tempo leva pra confirmar o pagamento?",
   "boleto pago ontem, ja confirmou?",
   "e pagando no cartao, quanto tempo?",
   "oi, quanto tempo ate o sistema liberar apos o pix?",
   "o boleto demora muito?",
   "compensacao do boleto",
   "preciso pagar hj e liberar rapido, qual o jeito mais rapido?",
   "qual forma de pagamento libera mais rapido?",
   "boleto de fim de semana compensa quando?",
   "paguei agora e quero saber quando confirma",
   "em quantos dias aparece o pagamento?",
   "tempo de confirmacao do pix",
   "o boleto precisa de quantos dias?",
   "dias uteis pra compensar?",
   "depois de pagar o boleto, qdo o acesso volta?",
   "da pra pagar e ser liberado na mesma hora?",
   "pq o boleto demora?",
   "pix instantaneo ou tem prazo?",
   "confirma na hora?",
   "quanto tarda pra baixar o boleto"
  ],
  "keywords": [
   [
    "compensar",
    3
   ],
   [
    "compensacao",
    3
   ],
   [
    "demora",
    2
   ],
   [
    "prazo",
    2
   ],
   [
    "confirma",
    2
   ],
   [
    "dias",
    1
   ],
   [
    "rapido",
    2
   ],
   [
    "libera",
    1
   ]
  ],
  "replies": [
   "Boa pergunta{{, nome}}! O *Pix é confirmado em instantes*. Já o *boleto pode levar até 2 dias úteis* para compensar. Se precisa de rapidez, o Pix é o melhor caminho. 💙",
   "Funciona assim{{, nome}}: *Pix* é confirmado em instantes e *boleto* pode levar *até 2 dias úteis*. Assim que o pagamento é confirmado, o acesso é liberado.",
   "Pra ser rápido{{, nome}}, prefira o *Pix*, que confirma em instantes. O *boleto* pode levar *até 2 dias úteis* para compensar. Quer que eu envie a fatura?",
   "Vou te explicar{{, nome}}: no *Pix* a confirmação é quase imediata; no *boleto*, pode levar *até 2 dias úteis*. Se passou do prazo, me avise que chamo o Financeiro."
  ],
  "action": "reply",
  "followUp": "Quer que eu envie a fatura pra você pagar por Pix?",
  "priority": 2,
  "system": null
 },
 {
  "id": "fin_juros_multa",
  "label": "Dúvida sobre juros e multa",
  "phrases": [
   "cobram juros por atraso?",
   "tem multa se eu atrasar?",
   "qual o valor da multa?",
   "por que o valor aumentou depois do vencimento?",
   "paguei atrasado e veio mais caro",
   "tem juros no boleto vencido?",
   "oi, o boleto vencido veio com acrescimo, por que?",
   "quanto de juros por dia de atraso?",
   "multa por atraso de pagamento",
   "isso e juros ou o que?",
   "acrescimo no valor da fatura",
   "a fatura subiu depois que venceu",
   "tem taxa se eu pagar depois do vencimento?",
   "queria entender o valor a mais no boleto",
   "pagar atrasado tem custo extra?",
   "quero tirar a multa",
   "consigo isentar os juros?",
   "taxa de atraso",
   "vcs cobram mora?",
   "por que ta mais caro que o normal? e juros?",
   "juros abusivos?",
   "tem cobranca adicional por atrasar?",
   "explica a multa da fatura",
   "pq tenho que pagar mais por ter atrasado so 2 dias?",
   "o boleto atrasado e o mesmo valor?",
   "dispensa de multa possivel?",
   "qual a politica de atraso de vcs?",
   "a cobranca tem encargos?",
   "valor da fatura atrasada diferente, explica",
   "como e calculado o valor quando atrasa?",
   "posso pagar sem a multa?",
   "sera que vcs tiram os juros se eu pagar hj?"
  ],
  "keywords": [
   [
    "juros",
    3
   ],
   [
    "multa",
    3
   ],
   [
    "acrescimo",
    2
   ],
   [
    "atraso",
    2
   ],
   [
    "mora",
    2
   ],
   [
    "taxa",
    1
   ],
   [
    "encargos",
    2
   ],
   [
    "isentar",
    2
   ]
  ],
  "replies": [
   "Entendo a dúvida{{, nome}}. Eu não tenho como detalhar valores de juros ou multa por aqui. O *time do Financeiro* explica como foi composto o valor da sua fatura. Já te encaminho. 💙",
   "Boa pergunta{{, nome}}! Para esclarecer acréscimos e possíveis isenções, quem analisa é o *Financeiro*. Vou chamar alguém do time pra te explicar com clareza.",
   "Obrigada por perguntar{{, nome}}. Detalhes sobre juros, multa e a composição da fatura ficam com o *time do Financeiro*. Estou passando seu atendimento pra eles.",
   "Vou te ajudar{{, nome}}! Como isso depende da política e da análise do seu caso, o *Financeiro* te responde direitinho. Um instante."
  ],
  "action": "handoff:Financeiro",
  "followUp": "Quer me dizer qual fatura gerou a dúvida?",
  "priority": 3,
  "system": null
 },
 {
  "id": "fin_cancelar_renovacao",
  "label": "Desistir, cancelar ou renovar assinatura",
  "phrases": [
   "quero cancelar minha assinatura",
   "nao quero renovar",
   "como cancelo o plano?",
   "vou parar de usar o sistema",
   "desistir do servico",
   "cancelar renovacao automatica",
   "nao quero mais ser cobrado",
   "oi, queria encerrar meu contrato",
   "quero sair, como faco?",
   "me tirem da cobranca mensal",
   "nao vou renovar no proximo mes",
   "parar de cobrar a mensalidade",
   "cancelamento da assinatura",
   "quero renovar meu plano",
   "como renovo minha assinatura?",
   "vai renovar sozinho?",
   "renovacao anual, como funciona?",
   "encerrar conta",
   "pausar a assinatura",
   "vou desistir, tem como parar a cobranca?",
   "nao uso mais, quero cancelar",
   "preciso cancelar antes de renovar",
   "a renovacao e automatica?",
   "queria mudar para plano anual",
   "trocar de plano mensal pra anual",
   "cancela pra mim por favor",
   "nao quero continuar com vcs",
   "blz, quero cancelar o servico",
   "me ajuda a cancelar pq nao to usando",
   "renovar o contrato",
   "cancelar antes que cobrem de novo",
   "fim da assinatura, quero encerrar"
  ],
  "keywords": [
   [
    "cancelar",
    3
   ],
   [
    "renovar",
    3
   ],
   [
    "renovacao",
    3
   ],
   [
    "desistir",
    3
   ],
   [
    "encerrar",
    2
   ],
   [
    "assinatura",
    2
   ],
   [
    "plano",
    1
   ],
   [
    "contrato",
    1
   ]
  ],
  "replies": [
   "Entendi{{, nome}}. Sinto muito por isso! Pedidos de cancelamento, renovação ou troca de plano são tratados pelo *time Comercial*, que vai te ajudar com tudo. Já estou te encaminhando. 💙",
   "Claro{{, nome}}! Cancelamentos e renovações são conduzidos pelo *time Comercial*. Vou chamar alguém pra cuidar disso com você.",
   "Obrigada por avisar{{, nome}}. Pra cancelar ou renovar sua assinatura, o *Comercial* te atende. Estou passando seu atendimento agora.",
   "Vou te ajudar{{, nome}}! O *time Comercial* cuida de renovação, mudança de plano e cancelamento. Um instante que já te conecto."
  ],
  "action": "handoff:Comercial",
  "followUp": "Posso saber o motivo? Isso ajuda o time a te atender melhor.",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_segmento_negocio",
  "label": "Sistema para o meu tipo de negócio",
  "phrases": [
   "quero um sistema pra minha loja de roupas",
   "tenho um salão de beleza, vcs tem sistema?",
   "sistema pra barbearia",
   "vcs atendem mercado?",
   "tenho um mercadinho e preciso de um sistema",
   "preciso de sistema pra clínica",
   "tenho um restaurante, tem algo pra controlar?",
   "sistema pra lanchonete e delivery",
   "tenho uma oficina mecanica, vcs tem sistema",
   "sistema para escola",
   "tenho uma academia e queria um sistema",
   "sistema pra consultório",
   "quero montar um e-commerce",
   "sou prestador de serviço, tem sistema pra mim?",
   "tenho uma loja de roupa em Sorocaba e queria saber se vcs tem algo pra controlar estoque",
   "qual sistema vcs indicam pra pizzaria?",
   "tem sistema pra loja de calçados",
   "meu negócio é uma papelaria, o que vcs tem?",
   "sistema pra assistencia tecnica de celular",
   "tenho uma loja de material de construção",
   "pq tenho uma lojinha e queria organizar tudo, tem como?",
   "vcs tem sistema pra pet shop",
   "sistema pra loja de cosmeticos",
   "qual o melhor sistema pro meu ramo?",
   "tenho uma distribuidora de bebidas, vcs atendem",
   "quero um sistema pra minha loja",
   "procuro sistema de gestão pra comércio",
   "tenho uma hamburgueria e preciso controlar pedidos",
   "vcs tem solução pra loja de eletrônicos?",
   "sistema pra autopeças tem?",
   "qual sistema serve pra uma loja pequena",
   "blz, tenho um brechó, qual sistema ideal?"
  ],
  "keywords": [
   [
    "loja",
    2
   ],
   [
    "salao",
    2
   ],
   [
    "barbearia",
    2
   ],
   [
    "mercado",
    2
   ],
   [
    "clinica",
    2
   ],
   [
    "restaurante",
    2
   ],
   [
    "oficina",
    2
   ],
   [
    "meu negocio",
    3
   ]
  ],
  "replies": [
   "Que legal, {{nome}}! 😊 A Develoi desenvolve sistemas para vários tipos de negócio, e o *Store BoxSys* é nosso sistema de gestão para lojas, com PDV, estoque, caixa e mais. Me conta qual é o seu ramo e o que você quer organizar que eu te encaminho certinho pro time Comercial.",
   "{{saudacao}}! Pode ser que a gente tenha a solução ideal pro seu ramo. Para lojas, o *Store BoxSys* cobre PDV, estoque, fluxo de caixa e notas fiscais. Para outros segmentos, o time Comercial avalia com você o que faz mais sentido. Qual é o seu negócio?",
   "Entendi, {{nome}}! Cada negócio tem sua rotina, então o ideal é o Comercial olhar o seu caso. Já adianto que o *Store BoxSys* atende bem lojas (PDV, estoque, pedidos, ordens de serviço). Me conta o ramo e o que mais te dá trabalho hoje? ✨"
  ],
  "action": "lead",
  "followUp": "Qual é o seu ramo e o que você mais precisa organizar?",
  "priority": 2,
  "system": null
 },
 {
  "id": "com_teste_gratis",
  "label": "Teste grátis",
  "phrases": [
   "tem teste gratis?",
   "posso testar antes de comprar?",
   "vcs tem periodo de teste",
   "quero testar o sistema",
   "tem versao de teste",
   "da pra testar de graça?",
   "teste gratuito do store boxsys",
   "quantos dias de teste?",
   "tem trial?",
   "queria experimentar o sistema antes",
   "posso usar uns dias sem pagar?",
   "como faço pra testar o sistema",
   "tem demonstração gratuita",
   "quero fazer o teste de 14 dias",
   "vcs oferecem teste?",
   "antes de contratar posso ver se funciona pra mim?",
   "tem como testar sem compromisso",
   "teste grátis do sistema de vcs",
   "qdo testar o sistema, preciso por cartao?",
   "tem algum teste pfv",
   "quero o teste gratis",
   "como ativo o teste",
   "tem teste gratuito mesmo?",
   "vi que tem teste grátis, como funciona",
   "testar o sistema por alguns dias",
   "posso testar o sistema na minha loja antes de assinar?",
   "free trial",
   "blz, queria testar primeiro",
   "tem periodo de experiencia?",
   "me libera um teste pfv",
   "queria testar o sistema pra ver se vale a pena"
  ],
  "keywords": [
   [
    "teste",
    3
   ],
   [
    "testar",
    3
   ],
   [
    "gratis",
    2
   ],
   [
    "gratuito",
    2
   ],
   [
    "trial",
    2
   ],
   [
    "experimentar",
    2
   ],
   [
    "14 dias",
    3
   ]
  ],
  "replies": [
   "Tem sim, {{nome}}! 🎉 O *Store BoxSys* tem *teste gratuito de 14 dias*, pra você conhecer o sistema na prática antes de decidir. Se quiser, o time Comercial te ajuda a começar. É só me contar seu ramo!",
   "Claro! O *Store BoxSys* tem *14 dias de teste gratuito*. Assim você vê se ele encaixa na rotina do seu negócio. Quer que eu passe seu contato ao Comercial para te orientar no início?",
   "Boa, {{nome}}! Oferecemos *teste gratuito de 14 dias* do *Store BoxSys*. Os detalhes de como ativar o Comercial te passa rapidinho. Me diz qual é o seu negócio que eu já encaminho. 😊"
  ],
  "action": "lead",
  "followUp": "Qual é o seu ramo para eu encaminhar o teste?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_preco_caro",
  "label": "Objeção de preço",
  "phrases": [
   "ta caro",
   "achei caro",
   "tem mais barato?",
   "ta muito caro pra mim",
   "nao tenho condição de pagar isso",
   "tem algo mais em conta?",
   "vcs fazem desconto?",
   "tem como baixar o preço?",
   "o valor ta alto",
   "pq é tão caro",
   "achei meio salgado",
   "tem plano mais barato",
   "to sem grana agora",
   "orçamento apertado, tem opção?",
   "vi um sistema mais barato em outro lugar",
   "da pra negociar o valor?",
   "tem promoção?",
   "vcs fazem um precinho melhor?",
   "caro demais pra minha loja",
   "tem alguma condição especial",
   "nao cabe no meu bolso",
   "muito caro, tem outra opção?",
   "pagar tudo isso nao dá",
   "consegue melhorar o valor pfv",
   "tem como parcelar pra ficar mais leve",
   "achei o preço puxado",
   "qual o desconto pra fechar hoje?",
   "tem algum plano básico mais em conta",
   "nossa, tá pesado o valor",
   "me faz uma condição melhor que eu fecho",
   "sou micro empreendedor, tem algo que caiba no bolso?"
  ],
  "keywords": [
   [
    "caro",
    3
   ],
   [
    "barato",
    3
   ],
   [
    "desconto",
    3
   ],
   [
    "negociar",
    2
   ],
   [
    "valor",
    1
   ],
   [
    "preco",
    1
   ],
   [
    "promocao",
    2
   ],
   [
    "condicao",
    2
   ]
  ],
  "replies": [
   "Entendo, {{nome}}! 💛 Sobre valores e condições, quem confirma é o time Comercial, que avalia o melhor cenário pro seu negócio. Antes de decidir, você pode aproveitar o *teste gratuito de 14 dias* do Store BoxSys. Quer que eu passe seu caso ao Comercial?",
   "Imagino, {{nome}}! Não vou te passar valor errado, então o *Comercial* é quem confirma condições e possibilidades. Posso encaminhar você com um resumo do que precisa pra eles montarem algo que faça sentido?",
   "Compreendo sua preocupação! O ideal é o time Comercial entender sua necessidade e ver o que cabe. Tem também o *teste de 14 dias* do Store BoxSys para você avaliar o retorno. Me conta seu ramo? 😊"
  ],
  "action": "lead",
  "followUp": "Me conta seu ramo e o que precisa que eu levo ao Comercial?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_concorrentes",
  "label": "Comparação com concorrentes",
  "phrases": [
   "qual a diferença de vcs pros outros sistemas?",
   "pq escolher vcs?",
   "o que vcs tem de melhor que a concorrência",
   "vcs sao melhores que os outros?",
   "to comparando vcs com outros sistemas",
   "qual o diferencial de vcs",
   "por que devo escolher a develoi",
   "tem outros sistemas parecidos, o que vcs tem de diferente?",
   "comparando varios sistemas, o de vcs vale a pena?",
   "o que torna o store boxsys diferente",
   "vcs sao melhor que o bling?",
   "qual a vantagem de vcs",
   "o que o store boxsys tem que os outros nao tem",
   "me convence a contratar vcs",
   "pq vcs e nao outro",
   "to em duvida entre vcs e outro sistema",
   "como vcs se comparam com outros erp",
   "vcs sao confiáveis?",
   "ja vi outros sistemas, por que o de vcs?",
   "tem alguma vantagem em relação aos concorrentes",
   "qual o ponto forte do sistema",
   "me fala os diferenciais",
   "por que o store boxsys?",
   "qual melhor, vcs ou outros sistemas de loja",
   "o que vcs oferecem a mais",
   "vale a pena trocar pra vcs?",
   "diferenca entre vcs e os grandes sistemas",
   "tô pesquisando sistemas, o que vcs oferecem",
   "pq contratar a develoi",
   "vcs tem algo que os outros nao tem?",
   "pq vcs sao melhores"
  ],
  "keywords": [
   [
    "diferencial",
    3
   ],
   [
    "concorrencia",
    3
   ],
   [
    "concorrentes",
    3
   ],
   [
    "melhor",
    1
   ],
   [
    "comparar",
    2
   ],
   [
    "diferenca",
    2
   ],
   [
    "vantagem",
    2
   ],
   [
    "escolher",
    2
   ]
  ],
  "replies": [
   "Boa pergunta, {{nome}}! Não vou comparar com outras marcas, mas posso falar do que temos: o *Store BoxSys* reúne PDV, estoque, fluxo de caixa, notas fiscais, crediário, loja virtual e mais num só lugar, e a Develoi tem atendimento humano e suporte. 😊",
   "Cada negócio tem uma necessidade, {{nome}}. O *Store BoxSys* é completo pra gestão de lojas (PDV, estoque, OS, orçamentos, maquininhas) e você pode ver na prática com o *teste gratuito de 14 dias*. Quer que o Comercial monte uma comparação pro seu caso?",
   "Entendo que esteja pesquisando! O melhor jeito de comparar é testando: o *Store BoxSys* tem *14 dias grátis*. Se quiser, o time Comercial conversa com você sobre o que seu negócio precisa. ✨"
  ],
  "action": "lead",
  "followUp": "Quer testar ou falar com o Comercial?",
  "priority": 2,
  "system": null
 },
 {
  "id": "com_migrar_sistema",
  "label": "Migrar de outro sistema",
  "phrases": [
   "uso outro sistema e quero trocar",
   "como migro meus dados pro sistema de vcs",
   "da pra migrar do meu sistema atual?",
   "quero sair do meu sistema e ir pro de vcs",
   "vcs importam meus produtos de outro sistema?",
   "tenho planilha de produtos, consigo trazer?",
   "como trazer meu estoque de outro sistema",
   "migração de sistema",
   "to insatisfeito com meu sistema atual",
   "meu sistema atual é ruim, quero trocar",
   "consigo passar meu cadastro de clientes pra vcs?",
   "vou perder meus dados se trocar de sistema?",
   "trocar de sistema da trabalho?",
   "uso planilha do excel, como passo pro sistema",
   "tenho tudo no caderno, como comecar?",
   "como importar produtos",
   "importação de clientes e produtos",
   "queria mudar de sistema mas tenho medo de perder tudo",
   "vcs ajudam na migração?",
   "meu sistema atual vai ser desativado, preciso trocar",
   "tô com outro erp e quero mudar",
   "posso levar meu cadastro de produtos?",
   "migrar dados de outro programa",
   "como funciona a troca de sistema",
   "tenho 500 produtos cadastrados em outro sistema, tem como passar?",
   "qdo troco de sistema o histórico vem junto?",
   "quero largar meu sistema atual",
   "mudar do sistema antigo pro novo",
   "vcs fazem a transferência dos dados?",
   "pfv como faco pra migrar",
   "tenho cadastro em planilha, aceita?"
  ],
  "keywords": [
   [
    "migrar",
    3
   ],
   [
    "migracao",
    3
   ],
   [
    "trocar",
    2
   ],
   [
    "importar",
    2
   ],
   [
    "planilha",
    2
   ],
   [
    "sistema atual",
    3
   ],
   [
    "dados",
    1
   ],
   [
    "transferir",
    2
   ]
  ],
  "replies": [
   "Entendi, {{nome}}! Como funciona a migração de dados (produtos, clientes, estoque) depende do seu sistema atual, então o *time Comercial* confirma direitinho como fazer a troca com segurança. 😊 Me conta qual sistema você usa hoje e o que quer trazer?",
   "Trocar de sistema gera receio mesmo, né? O time *Comercial* avalia o seu caso e explica como ficam seus dados. Posso levar seu caso a eles com um resumo? Só preciso saber seu ramo e o que usa hoje.",
   "Boa, {{nome}}! Sobre migração, não quero te prometer o que não consigo confirmar. O *Comercial* analisa seu cenário e responde sobre importação de produtos e clientes. Vamos encaminhar? 💛"
  ],
  "action": "lead",
  "followUp": "Qual sistema você usa hoje e qual é o seu ramo?",
  "priority": 2,
  "system": null
 },
 {
  "id": "com_contrato_cancelamento",
  "label": "Contrato, fidelidade e cancelamento",
  "phrases": [
   "tem fidelidade?",
   "tem multa se eu cancelar?",
   "preciso assinar contrato?",
   "posso cancelar quando quiser?",
   "como funciona o contrato",
   "tem prazo minimo de contrato",
   "se eu nao gostar posso cancelar?",
   "qual a regra de cancelamento",
   "contrato de quanto tempo?",
   "tem carencia?",
   "cancelamento sem multa?",
   "sou obrigado a ficar X meses?",
   "quero saber sobre o contrato antes de fechar",
   "tem contrato de fidelidade",
   "como cancelo a assinatura depois",
   "vcs prendem em contrato?",
   "posso sair a qualquer momento",
   "tem multa rescisoria",
   "antes de fechar quero saber das regras de cancelamento",
   "e se eu quiser parar de usar?",
   "o contrato é anual?",
   "é mensal ou tem que fechar um periodo",
   "como é a política de cancelamento",
   "assinatura mensal? posso cancelar?",
   "qdo cancelo perco meus dados?",
   "tem alguma clausula?",
   "qual o tempo de contrato",
   "fidelização tem?",
   "tem algum compromisso de permanência",
   "blz, mas tem multa?",
   "quero ver o contrato"
  ],
  "keywords": [
   [
    "contrato",
    3
   ],
   [
    "fidelidade",
    3
   ],
   [
    "multa",
    3
   ],
   [
    "cancelar",
    3
   ],
   [
    "cancelamento",
    3
   ],
   [
    "carencia",
    2
   ],
   [
    "prazo",
    1
   ],
   [
    "rescisao",
    2
   ]
  ],
  "replies": [
   "Boa pergunta, {{nome}}! Sobre contrato, fidelidade e cancelamento, quem confirma as regras certinhas é o *time Comercial*, pra eu não te passar nada errado. Posso encaminhar sua dúvida a eles? E lembrando que dá pra começar com o *teste gratuito de 14 dias* do Store BoxSys. 😊",
   "Entendo a cautela, {{nome}}! As condições de contrato e cancelamento são confirmadas pelo *Comercial*. Quer que eu passe seu contato e sua dúvida pra eles te responderem com clareza?",
   "Faz sentido perguntar antes! Pra te dar a informação correta sobre contrato, prazo e cancelamento, o *time Comercial* é quem responde. Vou te encaminhar, ok? 💛"
  ],
  "action": "lead",
  "followUp": "Posso encaminhar sua dúvida ao Comercial?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_implantacao_treinamento",
  "label": "Implantação e treinamento",
  "phrases": [
   "como funciona a implantação?",
   "vcs ensinam a usar o sistema?",
   "tem treinamento?",
   "quanto tempo leva pra implantar",
   "preciso de alguem pra instalar?",
   "como começo a usar depois que contratar",
   "tem suporte na implantação",
   "vcs configuram o sistema pra mim?",
   "e se eu nao souber usar?",
   "é dificil de usar o sistema?",
   "meus funcionarios vao conseguir usar?",
   "tem tutorial?",
   "como é o onboarding",
   "vcs fazem o cadastro dos produtos pra mim?",
   "preciso instalar alguma coisa?",
   "depois que fechar, como é o passo a passo",
   "tem alguem que me ajuda a configurar",
   "quanto tempo pra começar a vender com o sistema",
   "sou leigo em tecnologia, consigo usar?",
   "vcs dão treinamento pra equipe",
   "como é a instalação",
   "implantação demora?",
   "vai ter alguem pra me ensinar?",
   "precisa de computador especial?",
   "qdo contrato, quem configura tudo?",
   "tem aula pra aprender a usar",
   "como que eu aprendo o sistema",
   "tem video aula",
   "a implantação é feita por vcs?",
   "e depois de contratar, como é o início",
   "pfv me explica como é a implantação"
  ],
  "keywords": [
   [
    "implantacao",
    3
   ],
   [
    "treinamento",
    3
   ],
   [
    "instalar",
    2
   ],
   [
    "configurar",
    2
   ],
   [
    "aprender",
    2
   ],
   [
    "tutorial",
    2
   ],
   [
    "onboarding",
    2
   ],
   [
    "usar",
    1
   ]
  ],
  "replies": [
   "Ótima pergunta, {{nome}}! Os detalhes de implantação e treinamento (como é feito e em quanto tempo) o *time Comercial* confirma pra você, pra eu não prometer prazo errado. Também temos atendimento humano e suporte. Quer que eu encaminhe sua dúvida? 😊",
   "Entendo a preocupação em começar certo! Como a implantação funciona no seu caso é o *Comercial* quem explica direitinho. Te encaminho com um resumo do seu negócio?",
   "Fica tranquilo(a), {{nome}}! Sobre implantação e treinamento da equipe, o *time Comercial* te passa o passo a passo. E o *teste gratuito de 14 dias* do Store BoxSys ajuda a se familiarizar. Vamos encaminhar? ✨"
  ],
  "action": "lead",
  "followUp": "Qual é o seu ramo para eu avisar o Comercial?",
  "priority": 2,
  "system": null
 },
 {
  "id": "com_integracoes",
  "label": "Integrações",
  "phrases": [
   "integra com whatsapp?",
   "o sistema emite nota fiscal?",
   "integra com maquininha?",
   "vcs tem integração com marketplace",
   "integra com mercado livre?",
   "integração com contabilidade",
   "manda os dados pro meu contador?",
   "funciona com a minha maquininha",
   "emite nfe e nfce?",
   "integra com loja virtual",
   "tem integração com shopee",
   "conecta com o ifood?",
   "o sistema conversa com a maquininha da stone?",
   "vcs têm API",
   "integrar com outro sistema",
   "tem integração com banco",
   "consigo integrar com meu contador",
   "emite nota fiscal eletronica",
   "tem nota fiscal no sistema?",
   "e a maquininha, integra?",
   "tem integração com marketplaces",
   "consigo vender no mercado livre e controlar estoque junto",
   "integra com whats pra mandar mensagem pros clientes",
   "o store boxsys tem loja virtual?",
   "tem integração com contabilidade",
   "o sistema se integra com outros?",
   "qdo vende na maquininha lança sozinho no sistema?",
   "tem como mandar cobrança pelo whatsapp",
   "integração com ecommerce",
   "vcs integram com o que?",
   "quais integrações vcs tem pfv"
  ],
  "keywords": [
   [
    "integra",
    3
   ],
   [
    "integracao",
    3
   ],
   [
    "maquininha",
    3
   ],
   [
    "nota fiscal",
    3
   ],
   [
    "marketplace",
    3
   ],
   [
    "contabilidade",
    2
   ],
   [
    "contador",
    2
   ],
   [
    "api",
    2
   ]
  ],
  "replies": [
   "Boa, {{nome}}! Posso confirmar que o *Store BoxSys* trabalha com *notas fiscais*, *maquininhas* e *loja virtual*. Para integrações específicas (WhatsApp, marketplaces, contabilidade, etc.), o *time Comercial* confirma o que está disponível pro seu caso. Quer que eu encaminhe? 😊",
   "Sobre integrações, o *Store BoxSys* já conta com notas fiscais, maquininhas e loja virtual. Se você precisa de algo específico, como marketplace ou contabilidade, o *Comercial* confirma pra não te passar nada incerto. Qual integração você precisa?",
   "Entendi, {{nome}}! O *Store BoxSys* inclui recursos de nota fiscal, maquininhas e loja virtual. Pra outras integrações, vou levar sua dúvida ao *Comercial* pra eles te responderem direitinho. ✨"
  ],
  "action": "lead",
  "followUp": "Qual integração você precisa?",
  "priority": 2,
  "system": null
 },
 {
  "id": "com_sob_medida",
  "label": "Sistema sob medida, app ou site",
  "phrases": [
   "vcs fazem sistema sob medida?",
   "quero um sistema personalizado",
   "desenvolvem aplicativo?",
   "vcs criam site?",
   "preciso de um app pro meu negócio",
   "fazem sistema do zero?",
   "queria um sistema feito pra minha empresa",
   "vcs desenvolvem sistemas customizados",
   "quero um site profissional",
   "fazem aplicativo de celular?",
   "sistema web personalizado",
   "preciso de um sistema que não existe pronto",
   "vcs programam sob demanda?",
   "queria criar um app igual ao ifood pra minha cidade",
   "desenvolvimento de software",
   "quero um site pra minha loja",
   "fazem landing page?",
   "tem como fazer um sistema só pra mim",
   "preciso de um sistema específico pra minha empresa",
   "vcs fazem painel administrativo",
   "orçamento pra desenvolver um app",
   "sistema sob encomenda",
   "queria um sistema diferente dos prontos",
   "quero contratar desenvolvimento",
   "tenho uma empresa e preciso de um software exclusivo",
   "fazem sistema de agendamento personalizado?",
   "desenvolve sistema pra mim?",
   "criação de aplicativo",
   "tem como adaptar o sistema pro meu jeito",
   "vcs são uma software house?",
   "preciso de um dev pra criar um sistema"
  ],
  "keywords": [
   [
    "sob medida",
    3
   ],
   [
    "personalizado",
    3
   ],
   [
    "aplicativo",
    3
   ],
   [
    "app",
    2
   ],
   [
    "site",
    3
   ],
   [
    "desenvolvimento",
    3
   ],
   [
    "software",
    2
   ],
   [
    "customizado",
    2
   ]
  ],
  "replies": [
   "Sim, {{nome}}! A *Develoi Soluções Digitais* desenvolve sistemas e soluções digitais para negócios. Como cada projeto é único, o *time Comercial* conversa com você sobre escopo e monta uma proposta. Me conta rapidinho a sua ideia? 🚀",
   "Que bacana! A Develoi trabalha com soluções digitais sob medida. Para entender o que você precisa e o que é possível, quem avalia é o *Comercial*. Qual é o seu ramo e o que gostaria de ter?",
   "Adoro projetos assim, {{nome}}! 😊 Sobre sistemas, apps ou sites personalizados, o *time Comercial* conversa com você e monta a proposta. Vou te fazer duas perguntinhas rápidas e já encaminho, pode ser?"
  ],
  "action": "lead",
  "followUp": "O que você gostaria de criar?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_automacao_whatsapp",
  "label": "Automação de WhatsApp / bot",
  "phrases": [
   "quero um bot de whatsapp pra minha empresa",
   "vcs fazem chatbot?",
   "automatizar atendimento no whatsapp",
   "quero uma assistente virtual igual a voce",
   "como faço pra ter uma BiIA na minha empresa",
   "atendimento automático no zap",
   "vcs fazem robo de whatsapp",
   "preciso automatizar mensagens do meu negocio",
   "bot pra responder clientes",
   "quero que meu whatsapp responda sozinho",
   "chatbot pra minha loja",
   "automação de atendimento",
   "tem como ter uma atendente virtual na minha empresa",
   "mensagens automaticas de cobrança no whats",
   "queria um assistente como esse pro meu negocio",
   "robô pra agendar horario no whatsapp",
   "vcs criam bot de atendimento?",
   "bot de vendas whatsapp",
   "quero automatizar meu whatsapp business",
   "como funciona esse bot, dá pra ter um?",
   "atendente virtual pra minha clinica",
   "meu zap vive lotado, tem como automatizar",
   "vcs implementam chatbot",
   "quero um atendimento 24h no whatsapp",
   "bot pra confirmar pedidos pelo zap",
   "tem como automatizar respostas",
   "assistente virtual pra empresa",
   "quanto custa um bot igual a esse",
   "tenho muitas mensagens no whats e nao dou conta",
   "preciso de ajuda pra automatizar atendimento",
   "automatizar zap da minha empresa"
  ],
  "keywords": [
   [
    "bot",
    3
   ],
   [
    "chatbot",
    3
   ],
   [
    "automatizar",
    3
   ],
   [
    "automacao",
    3
   ],
   [
    "whatsapp",
    1
   ],
   [
    "robo",
    2
   ],
   [
    "assistente",
    2
   ],
   [
    "atendente virtual",
    3
   ]
  ],
  "replies": [
   "Que ótima ideia, {{nome}}! 🤖 A Develoi desenvolve soluções digitais, e automação de atendimento no WhatsApp é um assunto que o *time Comercial* avalia com você, vendo o que seu negócio precisa. Me conta seu ramo e quantos atendimentos faz por dia?",
   "Entendi, {{nome}}! Posso ajudar a levar seu pedido de automação ao *Comercial*, que confirma o que é possível e monta uma proposta. Qual é o seu negócio e o que o bot deveria fazer?",
   "Legal! Quem entende de assistente virtual por aqui sabe o quanto ajuda no dia a dia. 😊 Pra saber como aplicar no seu negócio, o *Comercial* faz o levantamento. Vamos começar com duas perguntinhas?"
  ],
  "action": "lead",
  "followUp": "Qual é o seu negócio e o que o bot deveria fazer?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_parceria_revenda",
  "label": "Parceria, revenda e indicação",
  "phrases": [
   "quero ser parceiro de vcs",
   "vcs tem programa de revenda?",
   "posso revender o sistema?",
   "como funciona indicação?",
   "ganho algo se indicar cliente?",
   "quero revender o store boxsys",
   "sou contador e quero indicar meus clientes",
   "programa de parceiros",
   "tem comissão por indicação?",
   "quero ser revendedor",
   "tenho uma agência e quero fazer parceria",
   "parceria comercial",
   "sou consultor e queria indicar vcs",
   "tem programa de afiliados",
   "indicar amigos pra vcs tem bonus?",
   "posso vender o sistema de vcs?",
   "trabalho com tecnologia e quero ser parceiro",
   "queria uma parceria",
   "tem desconto pra quem indica?",
   "como me torno parceiro",
   "vcs aceitam revendedores",
   "indico meus clientes, como funciona",
   "white label tem?",
   "quero oferecer o sistema pros meus clientes",
   "sou dono de uma software house, vamos fazer parceria?",
   "comissão pra quem vende",
   "falar sobre parceria",
   "quem eu falo pra ser revenda",
   "posso ser representante de vcs na minha cidade",
   "minha empresa quer parceria",
   "blz, queria saber de parceria pfv"
  ],
  "keywords": [
   [
    "parceria",
    3
   ],
   [
    "parceiro",
    3
   ],
   [
    "revenda",
    3
   ],
   [
    "revender",
    3
   ],
   [
    "indicar",
    2
   ],
   [
    "indicacao",
    3
   ],
   [
    "comissao",
    2
   ],
   [
    "afiliado",
    2
   ]
  ],
  "replies": [
   "Que legal o interesse, {{nome}}! 🤝 Sobre parcerias, revenda e indicações, as condições são tratadas pelo *time Comercial*, e eu não consigo confirmar regras por aqui. Posso encaminhar seu contato com um resumo do seu perfil?",
   "Obrigada pela confiança, {{nome}}! Programas de parceria e indicação são com o *Comercial*, que explica como funciona. Me conta um pouco sobre você ou sua empresa que eu passo pra eles. 😊",
   "Show! Pra falar de parceria, revenda ou indicação o caminho é o *time Comercial*. Vou te fazer duas perguntinhas rápidas pra eles já chegarem bem alinhados, pode ser?"
  ],
  "action": "lead",
  "followUp": "Qual é a sua empresa e que tipo de parceria você busca?",
  "priority": 2,
  "system": null
 },
 {
  "id": "com_falar_vendedor",
  "label": "Falar com vendedor",
  "phrases": [
   "quero falar com um vendedor",
   "me passa pro comercial",
   "quero falar com alguem do comercial",
   "tem algum vendedor ai?",
   "preciso falar com um consultor",
   "pode me ligar?",
   "quero um atendimento comercial",
   "chama o comercial pfv",
   "quero falar com uma pessoa sobre compra",
   "me coloca em contato com o time de vendas",
   "falar com vendas",
   "quero fechar negocio, quem me atende?",
   "quero comprar, com quem falo",
   "tem como um vendedor me chamar",
   "preciso de um consultor comercial",
   "passa meu contato pro comercial",
   "queria conversar com alguém sobre contratar",
   "atendimento com humano pra vendas",
   "pode me transferir pro setor comercial",
   "vendedor por favor",
   "quero falar com o time de vendas",
   "gostaria de falar com alguém sobre contratacao",
   "qual o contato do comercial",
   "qdo o comercial me responde?",
   "me liga pra gente conversar",
   "quero negociar com um vendedor",
   "chama alguem pra me atender sobre o sistema",
   "quero fechar hj",
   "transfere pra vendas",
   "me atende um consultor",
   "falar com comercial agora"
  ],
  "keywords": [
   [
    "vendedor",
    3
   ],
   [
    "comercial",
    3
   ],
   [
    "vendas",
    2
   ],
   [
    "consultor",
    3
   ],
   [
    "comprar",
    2
   ],
   [
    "fechar",
    2
   ],
   [
    "contato",
    1
   ],
   [
    "falar",
    1
   ]
  ],
  "replies": [
   "Claro, {{nome}}! Vou te conectar com o *time Comercial*. 😊 Antes, duas perguntinhas rápidas pra eles já chegarem preparados: qual é o seu ramo e o que você precisa?",
   "Pode deixar! Já aciono o *Comercial* pra você. Só me diz seu ramo e o que está buscando que eu envio o resumo junto, assim você não precisa repetir tudo. ✨",
   "Beleza, {{nome}}! Vou passar seu atendimento pro *time Comercial*. Me conta rapidinho o que você precisa pra eu já levar o resumo?"
  ],
  "action": "lead",
  "followUp": "Qual é o seu ramo e o que você precisa?",
  "priority": 4,
  "system": null
 },
 {
  "id": "com_store_boxsys",
  "label": "Conhecer o Store BoxSys",
  "phrases": [
   "o que é o store boxsys?",
   "quero conhecer o store boxsys",
   "me fala do store boxsys",
   "store boxsys o que faz",
   "como funciona o boxsys",
   "vi o store boxsys, quero saber mais",
   "o que tem no store boxsys",
   "quais recursos do store boxsys",
   "boxsys serve pra que",
   "store box sys",
   "me explica o sistema de vcs de loja",
   "tem pdv no sistema?",
   "o sistema controla estoque?",
   "tem controle de fluxo de caixa?",
   "tem crediario no sistema",
   "tem consignação?",
   "e etiquetas, tem?",
   "faz markup dos produtos?",
   "tem ordem de serviço?",
   "como é o sistema de gestão de vcs",
   "quais funcionalidades tem o sistema",
   "fala mais do sistema de loja",
   "tem catálogo e fornecedores?",
   "o store boxsys tem loja virtual?",
   "tem orçamento no sistema",
   "quero saber tudo do store boxsys",
   "funções do sistema",
   "o que o sistema faz?",
   "me mostra os recursos",
   "blz, me conta mais do boxsys",
   "tem frente de caixa?"
  ],
  "keywords": [
   [
    "store boxsys",
    3
   ],
   [
    "boxsys",
    3
   ],
   [
    "pdv",
    2
   ],
   [
    "estoque",
    2
   ],
   [
    "recursos",
    2
   ],
   [
    "funcionalidades",
    2
   ],
   [
    "crediario",
    2
   ],
   [
    "sistema de loja",
    2
   ]
  ],
  "replies": [
   "O *Store BoxSys* é nosso sistema de gestão para lojas, {{nome}}! 🛍️ Ele tem *PDV/frente de caixa*, *fluxo de caixa*, *pedidos*, *orçamentos*, *ordens de serviço*, *notas fiscais*, *catálogo e estoque*, categorias, fornecedores, etiquetas, markup, crediário, consignação, maquininhas e *loja virtual*.",
   "Com prazer! O *Store BoxSys* reúne num só sistema: PDV, estoque, fluxo de caixa, pedidos, orçamentos, OS, notas fiscais, crediário, consignação, etiquetas e loja virtual. Dá pra experimentar no *teste gratuito de 14 dias*. 😊",
   "Boa, {{nome}}! O *Store BoxSys* ajuda a controlar vendas, estoque e finanças da sua loja: PDV, catálogo, fornecedores, markup, maquininhas e mais. Tem *14 dias de teste grátis*. Quer que o Comercial te mostre como se aplica ao seu negócio?"
  ],
  "action": "reply",
  "followUp": "Quer testar grátis ou falar com o Comercial?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_ver_funcionando",
  "label": "Ver o sistema funcionando",
  "phrases": [
   "quero ver o sistema funcionando",
   "tem demonstração?",
   "consigo ver uma demo?",
   "me mostra o sistema na prática",
   "tem como agendar uma apresentação",
   "queria ver como é o sistema por dentro",
   "tem video do sistema?",
   "quero uma demo do store boxsys",
   "mostra como funciona na pratica",
   "apresentação do sistema",
   "vcs fazem demonstração ao vivo?",
   "queria ver as telas do sistema",
   "tem print do sistema",
   "dá pra ver o sistema antes de contratar",
   "quero ver o PDV funcionando",
   "agendar demonstração",
   "tem alguma apresentação online",
   "queria ver o sistema rodando",
   "me manda um video mostrando o sistema",
   "como é a tela do sistema?",
   "vcs mostram o sistema por video chamada?",
   "quero conhecer o sistema na prática",
   "tem acesso demo",
   "posso ver como fica o sistema",
   "mostra o sistema pfv",
   "queria uma apresentação do sistema pra minha equipe",
   "quero ver antes de decidir",
   "demo do sistema",
   "tem como ver uma tela do sistema",
   "gostaria de uma reunião pra ver o sistema",
   "blz, quero ver ele funcionando"
  ],
  "keywords": [
   [
    "demonstracao",
    3
   ],
   [
    "demo",
    3
   ],
   [
    "apresentacao",
    3
   ],
   [
    "funcionando",
    3
   ],
   [
    "pratica",
    2
   ],
   [
    "telas",
    2
   ],
   [
    "video",
    2
   ],
   [
    "mostrar",
    2
   ]
  ],
  "replies": [
   "Boa ideia, {{nome}}! 👀 O jeito mais completo de ver o *Store BoxSys* na prática é pelo *teste gratuito de 14 dias*. E se preferir uma apresentação, o *time Comercial* combina com você. Quer que eu encaminhe?",
   "Claro! Posso pedir pro *Comercial* te mostrar o sistema. Também há o *teste gratuito de 14 dias* pra você explorar por conta própria. Me conta seu ramo e já encaminho? 😊",
   "Com certeza, {{nome}}! Pra ver o sistema funcionando, o *Comercial* te ajuda com uma apresentação, ou você pode começar pelos *14 dias grátis* do Store BoxSys. Qual prefere?"
  ],
  "action": "lead",
  "followUp": "Prefere teste grátis ou apresentação com o Comercial?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_proposta_orcamento",
  "label": "Proposta e orçamento",
  "phrases": [
   "quero um orçamento",
   "me manda uma proposta",
   "preciso de uma proposta comercial",
   "quanto fica pra minha empresa?",
   "fazem orçamento sem compromisso?",
   "queria uma cotação",
   "quero saber quanto custa pra minha loja",
   "orcamento do sistema",
   "proposta pfv",
   "pode me mandar uma proposta por email?",
   "preciso de orçamento pra apresentar pro meu sócio",
   "faz uma proposta pra mim",
   "queria saber valores pra minha empresa",
   "qual o investimento",
   "como solicito um orçamento",
   "tenho 3 lojas, quanto fica?",
   "orçamento pra 5 funcionarios",
   "fecha uma proposta pra minha clinica",
   "quero cotar o sistema",
   "orçamento de desenvolvimento de app",
   "qto sai pra implantar na minha empresa",
   "me passa os valores",
   "preciso de uma proposta formal",
   "solicitar orçamento",
   "vcs mandam proposta por escrito",
   "tem como montar uma proposta pro meu caso?",
   "quero uma estimativa de valor",
   "mande uma cotação pro meu negócio",
   "fazer uma proposta pra rede de lojas",
   "pode orçar um sistema pra mim",
   "blz, entao me faz um orçamento"
  ],
  "keywords": [
   [
    "orcamento",
    3
   ],
   [
    "proposta",
    3
   ],
   [
    "cotacao",
    3
   ],
   [
    "quanto custa",
    2
   ],
   [
    "valores",
    2
   ],
   [
    "investimento",
    2
   ],
   [
    "estimativa",
    2
   ],
   [
    "quanto fica",
    3
   ]
  ],
  "replies": [
   "Claro, {{nome}}! O *time Comercial* monta propostas sob medida pro seu negócio, e os valores quem confirma são eles. 😊 Pra agilizar, me conta seu ramo e o que você precisa que eu envio um resumo.",
   "Vamos lá! Pra preparar uma proposta certinha, o *Comercial* precisa entender seu cenário. Duas perguntinhas rápidas: qual é o seu ramo e o que você quer resolver com o sistema?",
   "Pode deixar, {{nome}}! Eu levo seu pedido de orçamento ao *Comercial*, que retorna com a proposta. Só preciso do seu ramo e da sua necessidade. ✨"
  ],
  "action": "lead",
  "followUp": "Qual é o seu ramo e o que você precisa?",
  "priority": 4,
  "system": null
 },
 {
  "id": "com_ideia_sistema",
  "label": "Tenho uma ideia de sistema",
  "phrases": [
   "tenho uma ideia de sistema",
   "tenho uma ideia de aplicativo, vcs desenvolvem?",
   "queria tirar uma ideia do papel",
   "tenho uma startup e preciso de um sistema",
   "quero criar uma plataforma",
   "tenho uma ideia de negocio digital",
   "queria criar um app de delivery",
   "quero desenvolver um marketplace",
   "tenho um projeto e preciso de quem programe",
   "vcs ajudam a criar o MVP?",
   "tenho uma ideia e nao sei por onde começar",
   "queria uma plataforma online pro meu serviço",
   "quero montar um sistema de agendamento",
   "pensei num app e quero saber se vcs fazem",
   "tenho uma ideia boa, como funciona?",
   "quero transformar minha ideia em sistema",
   "preciso de ajuda pra desenvolver um projeto",
   "ideia de sistema pra academia, vcs fazem?",
   "queria criar um sistema de gestão pro meu negócio",
   "tenho um projeto de site com area de login",
   "quero fazer uma plataforma de cursos",
   "uma ideia de app pra minha cidade",
   "vcs desenvolvem a minha ideia?",
   "quero conversar sobre uma ideia",
   "tenho um projeto em mente",
   "qdo tenho so a ideia, vcs ajudam?",
   "quero lançar um app",
   "preciso de um sistema que ainda nao existe",
   "tenho uma ideia, e agora?",
   "quero um sistema novo, tenho algumas ideias",
   "sonho em ter um app, vcs podem ajudar?"
  ],
  "keywords": [
   [
    "ideia",
    3
   ],
   [
    "projeto",
    2
   ],
   [
    "startup",
    2
   ],
   [
    "plataforma",
    2
   ],
   [
    "mvp",
    2
   ],
   [
    "criar",
    1
   ],
   [
    "desenvolver",
    2
   ],
   [
    "tirar do papel",
    3
   ]
  ],
  "replies": [
   "Adorei, {{nome}}! 💡 A Develoi desenvolve sistemas e soluções digitais, então sua ideia pode render um bom projeto. O *time Comercial* conversa com você sobre escopo e possibilidades. Me conta um pouquinho da ideia?",
   "Que legal! Transformar ideia em sistema é com a gente. 😊 Quem avalia o projeto e monta a proposta é o *Comercial*. Qual é a ideia e pra qual tipo de negócio?",
   "Vamos conversar, {{nome}}! Pra levar sua ideia ao *Comercial* já bem explicada, me conta: o que o sistema deveria fazer e pra quem ele é? ✨"
  ],
  "action": "lead",
  "followUp": "Me conta a ideia em poucas palavras?",
  "priority": 3,
  "system": null
 },
 {
  "id": "com_serve_para_mim",
  "label": "Dúvida se o sistema serve para mim",
  "phrases": [
   "será que o sistema serve pra mim?",
   "meu negócio é pequeno, precisa de sistema?",
   "sou MEI, o sistema serve?",
   "serve pra loja pequena?",
   "nao sei se preciso de um sistema",
   "pra que serve um sistema de gestão?",
   "vale a pena ter sistema na minha loja?",
   "tenho poucos produtos, compensa?",
   "sou autônomo, serve pra mim?",
   "tô começando agora, preciso de sistema?",
   "qual sistema é ideal pro meu perfil",
   "como saber se o sistema é pra mim",
   "vou ter vantagem usando o sistema?",
   "controlo tudo no caderno, preciso mesmo de sistema?",
   "trabalho sozinho, tem utilidade?",
   "o sistema ajuda a vender mais?",
   "meu comércio é pequeno, tem como usar?",
   "qual a vantagem de ter um sistema",
   "isso é pra empresa grande ou serve pra pequena",
   "nunca usei sistema, será que consigo?",
   "sou novo no ramo, serve pra mim?",
   "tô na dúvida se contrato",
   "o sistema é pra qualquer tipo de loja?",
   "vcs atendem comerciantes pequenos?",
   "como o sistema pode me ajudar",
   "preciso organizar meu negócio, mas nao sei se é com sistema",
   "controle de estoque no caderno funciona? vale trocar?",
   "pra mim que vendo por rede social, serve?",
   "tenho uma banca, serve?",
   "qual o perfil de cliente que usa o sistema",
   "sera que vale a pena?"
  ],
  "keywords": [
   [
    "serve",
    3
   ],
   [
    "preciso",
    1
   ],
   [
    "vale a pena",
    3
   ],
   [
    "pequeno",
    2
   ],
   [
    "mei",
    2
   ],
   [
    "compensa",
    2
   ],
   [
    "duvida",
    2
   ],
   [
    "comecando",
    2
   ]
  ],
  "replies": [
   "Ótima reflexão, {{nome}}! Em geral, um sistema ajuda a organizar vendas, estoque e finanças, e o *Store BoxSys* foi feito pra gestão de lojas. A melhor forma de saber se serve pra você é testar: são *14 dias grátis*. 😊 Me conta seu negócio?",
   "Entendo a dúvida! Pra avaliar se faz sentido pro seu caso, o *time Comercial* conversa com você sem compromisso, e você ainda pode usar o *teste gratuito de 14 dias* do Store BoxSys. Qual é o seu ramo?",
   "Boa pergunta, {{nome}}! Cada negócio é um caso, então o ideal é o *Comercial* olhar o seu. Me conta o que você vende e como controla hoje que eu já levo o resumo. ✨"
  ],
  "action": "lead",
  "followUp": "Como você controla seu negócio hoje?",
  "priority": 2,
  "system": null
 },
 {
  "id": "com_pagamento_contratacao",
  "label": "Pagamento da contratação",
  "phrases": [
   "como faço pra pagar o sistema?",
   "quais as formas de pagamento?",
   "aceita pix?",
   "pode ser no boleto?",
   "aceita cartão de crédito?",
   "tem pix automático?",
   "como é o pagamento da assinatura",
   "posso pagar no cartão?",
   "como pago depois que contratar",
   "o pagamento é por boleto ou pix?",
   "parcela no cartao?",
   "tem pagamento recorrente automatico",
   "pagar com pix todo mês",
   "formas de pagamento da assinatura",
   "vcs aceitam cartao",
   "pagamento só por boleto?",
   "tem como pagar automático sem esquecer",
   "aceitam pix?",
   "qdo contratar como funciona o pagamento",
   "paga como? boleto, pix?",
   "posso pagar via cartão de crédito",
   "o pix automatico como funciona",
   "como é cobrado",
   "a cobrança é automática?",
   "qual a forma de pagar",
   "quero pagar no boleto",
   "dá pra pagar por pix?",
   "como funciona a cobrança do sistema",
   "pagamento da contratação do store boxsys",
   "e o cartão, aceita?",
   "pfv como pago"
  ],
  "keywords": [
   [
    "automatico",
    2
   ],
   [
    "cobranca",
    2
   ],
   [
    "assinatura",
    1
   ]
  ],
  "replies": [
   "O pagamento das assinaturas pode ser por *Pix*, *boleto* ou *cartão*, {{nome}}, e também existe o *Pix Automático*, pra você não precisar lembrar de pagar todo mês. 😊 Valores e condições o *time Comercial* confirma pra você.",
   "Boa, {{nome}}! Aceitamos *Pix*, *boleto* e *cartão* nas assinaturas, e temos *Pix Automático*. Se quiser seguir pra contratação, posso encaminhar ao *Comercial*. 💛",
   "As formas de pagamento são *Pix*, *boleto* ou *cartão*, com opção de *Pix Automático*. Detalhes de valores e condições o *Comercial* confirma. Quer que eu chame alguém do time pra você?"
  ],
  "action": "reply",
  "followUp": "Quer que eu chame o Comercial pra fechar?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_login_acesso",
  "label": "Não consigo entrar / senha / acesso",
  "phrases": [
   "nao consigo entrar no sistema",
   "não consigo fazer login",
   "esqueci minha senha",
   "esqueci a senha do sistema",
   "como recupero minha senha",
   "senha incorreta mas tenho certeza que ta certa",
   "meu login nao funciona",
   "nao lembro o email que usei no cadastro",
   "qual o link pra acessar o sistema",
   "qual o endereço do sistema mesmo",
   "perdi o link de acesso",
   "vc pode me mandar o link do store boxsys",
   "tela de login dá erro",
   "aparece usuario ou senha invalidos",
   "tô tentando entrar e não vai",
   "bloqueou meu acesso",
   "minha conta foi bloqueada",
   "nao recebo o email de redefinir senha",
   "o email de recuperacao nao chega",
   "pfv me ajuda a entrar no sistema, esqueci tudo",
   "qdo tento logar fica carregando e nao entra",
   "preciso trocar minha senha",
   "como altero a senha de acesso",
   "nao sei qual email é o meu login",
   "entrei ontem normal e hoje não entra mais",
   "sistema nao aceita minha senha",
   "acesso negado ao sistema",
   "n consigo logar no store",
   "socorro não consigo acessar minha conta",
   "meu funcionario nao consegue entrar com a senha dele",
   "login nao abre",
   "erro de autenticação ao entrar"
  ],
  "keywords": [
   [
    "senha",
    3
   ],
   [
    "login",
    3
   ],
   [
    "entrar",
    2
   ],
   [
    "acessar",
    2
   ],
   [
    "acesso",
    2
   ],
   [
    "logar",
    2
   ],
   [
    "email",
    1
   ],
   [
    "link",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Sei como é chato ficar sem conseguir entrar. 😕 Vou abrir um *atendimento de suporte* para te ajudar com o acesso. O endereço do sistema é *store.boxsys.com.br*, com o e-mail e a senha criados no cadastro. Já te peço alguns dados para encaminhar.",
   "Poxa, vamos resolver isso{{, nome}}. Lembrando que o acesso é por *store.boxsys.com.br* usando o e-mail e a senha do cadastro. Vou abrir um chamado e colocar você na fila de um atendente humano do suporte, que analisa seu caso.",
   "Entendi, problema de acesso. 🔐 Vou registrar um *atendimento de suporte* agora. Para agilizar, vou te pedir o sistema afetado, o CPF/CNPJ e o assunto, e um atendente da Develoi te ajuda com a senha ou o login.",
   "Sem problemas{{, nome}}, a gente resolve! Confira se está usando o endereço *store.boxsys.com.br* e o e-mail do cadastro. Se não funcionar, abro agora um atendimento de suporte para um atendente te ajudar."
  ],
  "action": "support",
  "followUp": "Qual e-mail você costuma usar no cadastro?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_sistema_lento",
  "label": "Sistema lento ou travando",
  "phrases": [
   "o sistema ta muito lento",
   "sistema travando toda hora",
   "ta tudo devagar aqui",
   "o {{sistema}} esta lento demais",
   "as telas demoram muito pra carregar",
   "trava quando abro o pdv",
   "sistema congela e preciso recarregar",
   "demora uma eternidade pra abrir os produtos",
   "ta lento qdo vou lancar venda",
   "pagina fica carregando e nao termina",
   "o sistema ta pesado",
   "nao anda, ta muito travado",
   "vive travando e perco o que digitei",
   "carrega bem devagar o relatorio",
   "sistema lerdo hoje",
   "ta dando tela de carregando infinito",
   "fica girando a bolinha e nao abre",
   "pq o sistema ta tao lento ultimamente?",
   "antes era rapido agora demora demais",
   "travou tudo aqui na loja",
   "cada clique demora uns minutos",
   "lentidão no sistema desde ontem",
   "o sistema nao responde direito",
   "trava e fecha sozinho",
   "o sistema congelou no meio da venda",
   "tá um pau esse sistema, muito lento",
   "ta demorando pra salvar o produto",
   "lentidao pra emitir qualquer coisa",
   "meu sistema esta travando muito, vcs podem verificar?",
   "pfv ajuda, ta tudo lento e a fila crescendo"
  ],
  "keywords": [
   [
    "lento",
    3
   ],
   [
    "travando",
    3
   ],
   [
    "travou",
    2
   ],
   [
    "devagar",
    2
   ],
   [
    "demora",
    2
   ],
   [
    "carregando",
    2
   ],
   [
    "congela",
    2
   ],
   [
    "pesado",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo o incômodo, lentidão atrapalha demais o dia. 😕 Vou abrir um *atendimento de suporte* para a equipe analisar o que está acontecendo. Já te peço o sistema afetado, o CPF/CNPJ e o assunto.",
   "Poxa, sistema travando é complicado mesmo. Vou encaminhar para o *suporte da Develoi*, que analisa a causa com você. Abro o atendimento e te coloco na fila de um atendente humano.",
   "Anotado{{, nome}}. A lentidão precisa ser analisada pela equipe técnica, então vou abrir um *chamado de suporte* agora. Para ajudar, me diga o que estava fazendo quando travou.",
   "Sinto muito pela demora no sistema. Vou registrar seu caso no *suporte*, e um atendente humano vai investigar com você. Preciso só de alguns dados rápidos."
  ],
  "action": "support",
  "followUp": "Isso acontece em qual tela, como PDV ou relatórios?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_nota_fiscal_erro",
  "label": "Erro ao emitir nota fiscal / nota rejeitada",
  "phrases": [
   "nao consigo emitir nota fiscal",
   "deu erro ao emitir a nota",
   "minha nota foi rejeitada",
   "nota rejeitada o que fazer",
   "a nfe nao sai",
   "erro na emissao da nfce",
   "nota fiscal travada em processamento",
   "a nota ficou pendente e nao autoriza",
   "como resolvo rejeicao da nota",
   "ta dando erro na nota do cliente",
   "tentei emitir a nf e deu rejeicao",
   "nota fiscal com erro de imposto",
   "erro no ncm na hora de emitir nota",
   "nao consigo cancelar a nota",
   "preciso cancelar uma nota emitida errada",
   "emiti nota com valor errado",
   "a nfc-e nao autoriza",
   "cupom fiscal nao emite",
   "erro de certificado digital na nota",
   "nota nao gera o xml",
   "cliente esperando a nota e deu erro",
   "vc pode ver pq minha nota nao emite?",
   "erro cfop na emissao",
   "sefaz rejeitou minha nota",
   "nota fiscal deu ruim",
   "emissão de nota não funciona desde hoje cedo",
   "nao emite nf no pdv",
   "aparece mensagem de rejeicao na nota",
   "qdo emito a nota da erro",
   "socorro, nota fiscal rejeitada e o cliente na loja",
   "erro ao enviar nota para a sefaz",
   "preciso de ajuda com a nota fiscal"
  ],
  "keywords": [
   [
    "nota",
    3
   ],
   [
    "nfe",
    3
   ],
   [
    "nfce",
    3
   ],
   [
    "rejeitada",
    3
   ],
   [
    "rejeicao",
    3
   ],
   [
    "fiscal",
    2
   ],
   [
    "emitir",
    2
   ],
   [
    "sefaz",
    2
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, problema na nota fiscal pode travar a venda. 🧾 O motivo da rejeição precisa de análise técnica, então vou abrir um *atendimento de suporte* para o time ver seu caso com cuidado.",
   "Poxa, vamos resolver isso. Cada rejeição tem sua causa, e o *suporte da Develoi* analisa com você. Vou abrir o atendimento e te colocar na fila de um atendente humano. Se puder, anote a mensagem do erro.",
   "Anotado{{, nome}}. Vou registrar um *chamado de suporte* sobre a nota fiscal. Já te peço o sistema afetado, o CPF/CNPJ e o assunto para encaminhar.",
   "Entendi, erro na emissão de nota. Para não te passar informação errada, vou levar para o *suporte técnico* analisar. Abro agora o atendimento e um atendente te chama aqui no WhatsApp."
  ],
  "action": "support",
  "followUp": "Qual mensagem de erro aparece na tela?",
  "priority": 3,
  "system": null
 },
 {
  "id": "sup_caixa_pdv",
  "label": "PDV ou caixa não abre / não fecha",
  "phrases": [
   "o caixa nao abre",
   "nao consigo abrir o caixa",
   "nao consigo fechar o caixa",
   "pdv nao abre",
   "frente de caixa travada",
   "o pdv nao carrega",
   "erro ao fechar o caixa do dia",
   "caixa ficou aberto de ontem e nao fecha",
   "nao consigo iniciar uma venda no pdv",
   "pdv da erro ao finalizar a venda",
   "fechamento de caixa com valor diferente",
   "o caixa nao bate com o que tem na gaveta",
   "sangria nao registra",
   "nao consigo fazer sangria no caixa",
   "abertura de caixa da erro",
   "o pdv fica em branco",
   "pdv nao deixa finalizar a venda",
   "a venda nao finaliza no caixa",
   "caixa travado nao deixa vender",
   "vc pode ajudar, o pdv nao abre aqui",
   "qdo clico em abrir caixa nada acontece",
   "fluxo de caixa nao atualiza",
   "erro no fechamento do caixa",
   "nao acho o botao de fechar caixa",
   "dois caixas abertos ao mesmo tempo",
   "caixa duplicado ta aparecendo",
   "meu pdv nao funciona hoje",
   "o caixa da loja ta com problema",
   "o caixa nao fecha de jeito nenhum",
   "não consigo lançar venda no caixa",
   "pdv travou no meio da venda",
   "erro ao abrir o pdv"
  ],
  "keywords": [
   [
    "caixa",
    3
   ],
   [
    "pdv",
    3
   ],
   [
    "fechar",
    2
   ],
   [
    "abrir",
    2
   ],
   [
    "venda",
    1
   ],
   [
    "sangria",
    2
   ],
   [
    "fechamento",
    2
   ],
   [
    "frente",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, problema no caixa é urgente na rotina da loja. 😕 Vou abrir um *atendimento de suporte* agora para a equipe analisar o PDV com você.",
   "Poxa, vamos resolver! Vou registrar um *chamado de suporte* sobre o caixa/PDV e te colocar na fila de um atendente humano. Já te peço o sistema afetado, o CPF/CNPJ e o assunto.",
   "Anotado{{, nome}}. Como pode envolver valores e vendas, prefiro que o *suporte técnico* analise direitinho, sem chute. Abro o atendimento agora mesmo.",
   "Sinto muito pelo transtorno com o caixa. Vou levar seu caso para o *suporte da Develoi*. Se puder, me conte o que aparece na tela quando tenta abrir ou fechar."
  ],
  "action": "support",
  "followUp": "O que aparece na tela quando você tenta abrir ou fechar o caixa?",
  "priority": 3,
  "system": null
 },
 {
  "id": "sup_estoque_divergente",
  "label": "Estoque divergente ou negativo",
  "phrases": [
   "meu estoque ta errado",
   "estoque negativo no sistema",
   "o estoque nao bate com o fisico",
   "produto aparece com estoque zerado mas tenho na prateria",
   "o estoque nao baixa quando vendo",
   "vendi e o estoque nao diminuiu",
   "estoque baixou duas vezes",
   "quantidade do produto ta errada",
   "estoque ficou negativo do nada",
   "como corrijo o estoque de um produto",
   "nao consigo ajustar o estoque",
   "a entrada de mercadoria nao somou no estoque",
   "dei entrada na nota do fornecedor e nao aumentou",
   "estoque divergente depois do inventario",
   "produto com saldo errado",
   "o sistema diz que tenho 0 mas tenho 10",
   "estoque bagunçado",
   "qtd em estoque nao confere",
   "inventario deu diferença com o sistema",
   "estoque nao atualiza",
   "vendas canceladas nao devolveram pro estoque",
   "estoque com numero estranho",
   "nao consigo fazer inventario",
   "estoque da loja virtual diferente do pdv",
   "saldo do produto errado no catalogo",
   "o estoque ta negativo e nao deixa vender",
   "tem produto com quantidade negativa, o que faço?",
   "ajuda, estoque total desencontrado",
   "pq meu estoque ta diferente do real?",
   "estoque nao sincroniza"
  ],
  "keywords": [
   [
    "estoque",
    3
   ],
   [
    "negativo",
    3
   ],
   [
    "divergente",
    3
   ],
   [
    "saldo",
    2
   ],
   [
    "quantidade",
    2
   ],
   [
    "inventario",
    2
   ],
   [
    "baixa",
    1
   ],
   [
    "errado",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, estoque divergente dá dor de cabeça mesmo. 📦 Vou abrir um *atendimento de suporte* para a equipe analisar o que pode ter acontecido com seus produtos.",
   "Poxa, vamos olhar isso com cuidado. Divergência de estoque precisa de análise técnica, então abro um *chamado de suporte* e te coloco na fila de um atendente humano. Já te peço alguns dados.",
   "Anotado{{, nome}}. Para não te orientar errado e bagunçar mais o saldo, o *suporte da Develoi* vai analisar seu caso. Vou abrir o atendimento agora.",
   "Sinto muito pelo transtorno com o estoque. Vou registrar no *suporte*. Se puder, já me diga um exemplo de produto com saldo errado para o atendente."
  ],
  "action": "support",
  "followUp": "Pode citar um produto com saldo errado como exemplo?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_produto_nao_aparece",
  "label": "Produto não aparece no catálogo ou loja virtual",
  "phrases": [
   "meu produto nao aparece na loja virtual",
   "cadastrei o produto mas nao aparece",
   "produto sumiu do catalogo",
   "nao acho o produto que cadastrei",
   "a loja virtual nao mostra meus produtos",
   "produto nao aparece no pdv",
   "item novo nao aparece pra vender",
   "a foto do produto nao aparece",
   "a categoria nao mostra os produtos",
   "produtos desapareceram da loja",
   "cadastrei mas o cliente nao ve no site",
   "loja virtual ta vazia",
   "produto nao publica na loja virtual",
   "nao consigo achar um produto na busca",
   "o produto esta cadastrado mas nao vende no caixa",
   "produto inativo sem eu ter inativado",
   "catalogo nao atualiza",
   "a loja online nao atualizou os precos",
   "preço no site diferente do sistema",
   "produto sumiu da vitrine",
   "imagem nao carrega na loja virtual",
   "minha loja virtual nao esta mostrando nada",
   "nao aparece nenhum produto no site da loja",
   "tbm nao aparece o produto na busca do pdv",
   "item some depois que salvo",
   "porque meu produto nao ta aparecendo?",
   "novos produtos nao aparecem no catálogo",
   "nao consigo ver o produto na loja",
   "produto cadastrado nao aparece em lugar nenhum",
   "cadê meu produto? cadastrei ontem e nao ta lá"
  ],
  "keywords": [
   [
    "produto",
    3
   ],
   [
    "aparece",
    3
   ],
   [
    "catalogo",
    2
   ],
   [
    "loja",
    2
   ],
   [
    "virtual",
    2
   ],
   [
    "sumiu",
    2
   ],
   [
    "cadastrei",
    2
   ],
   [
    "site",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, produto que não aparece atrapalha as vendas. 🛍️ Vou abrir um *atendimento de suporte* para a equipe verificar seu catálogo e a loja virtual.",
   "Poxa, vamos ver isso. Vou registrar um *chamado de suporte* e te colocar na fila de um atendente humano, que analisa o cadastro do produto com você.",
   "Anotado{{, nome}}. Pode haver mais de um motivo, então o *suporte da Develoi* precisa analisar seu caso. Abro o atendimento agora e já te peço os dados.",
   "Sinto muito pelo problema. Para não te dar um palpite errado, vou levar para o *suporte técnico*. Se puder, diga o nome de um produto que não aparece."
  ],
  "action": "support",
  "followUp": "Qual produto não está aparecendo e onde, no catálogo, no PDV ou na loja virtual?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_impressao",
  "label": "Erro ao imprimir cupom ou etiqueta",
  "phrases": [
   "nao consigo imprimir",
   "a impressora nao imprime",
   "erro ao imprimir o cupom",
   "etiqueta nao imprime",
   "impressao de etiqueta sai errada",
   "a etiqueta sai cortada",
   "cupom nao sai na impressora",
   "impressora termica nao funciona com o sistema",
   "ta imprimindo em branco",
   "impressora nao reconhece",
   "o cupom sai todo bagunçado",
   "imprime e sai so um pedaço",
   "nao imprime o pedido",
   "impressao do orçamento da erro",
   "qdo clico em imprimir nada acontece",
   "etiqueta com codigo de barras nao le",
   "codigo de barras da etiqueta saiu errado",
   "o preco na etiqueta ta errado",
   "impressao de nota nao funciona",
   "a impressora imprimia e parou do nada",
   "como configuro a impressora de etiqueta",
   "preciso de ajuda pra imprimir etiquetas",
   "impressao de ordem de servico nao sai",
   "o cupom imprime duas vezes",
   "impressao travada na fila",
   "a impressora nao sai nada depois da venda",
   "pq nao imprime o cupom?",
   "cupom nao imprime no fim da venda, cliente esperando",
   "erro de impressora",
   "impressão fora de tamanho"
  ],
  "keywords": [
   [
    "imprimir",
    3
   ],
   [
    "impressora",
    3
   ],
   [
    "etiqueta",
    3
   ],
   [
    "cupom",
    2
   ],
   [
    "impressao",
    3
   ],
   [
    "codigo",
    1
   ],
   [
    "barras",
    1
   ],
   [
    "termica",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, problema de impressão atrapalha o atendimento. 🖨️ Vou abrir um *atendimento de suporte* para a equipe analisar o seu caso.",
   "Poxa, vamos resolver. Impressão depende do sistema e da sua impressora, então o *suporte da Develoi* precisa analisar com você. Abro o chamado e te coloco na fila de um atendente humano.",
   "Anotado{{, nome}}. Vou registrar um *chamado de suporte* sobre a impressão. Já te peço o sistema afetado, o CPF/CNPJ e o assunto.",
   "Sinto muito pelo transtorno. Para não te passar uma configuração errada, vou levar para o *suporte técnico*. Se puder, me diga se o erro é no cupom ou na etiqueta."
  ],
  "action": "support",
  "followUp": "É cupom, etiqueta ou outro documento que não imprime?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_maquininha",
  "label": "Maquininha não integra com o sistema",
  "phrases": [
   "a maquininha nao integra com o sistema",
   "maquininha nao conecta no pdv",
   "a maquininha nao recebe o valor da venda",
   "pagamento no cartao nao vai pro sistema",
   "venda no cartao nao registra",
   "maquininha nao funciona com o caixa",
   "como integrar a maquininha",
   "preciso configurar a maquininha no sistema",
   "valor da maquininha diferente do pdv",
   "maquininha pede o valor manual",
   "pagamento por cartao nao concilia",
   "a integracao da maquininha parou",
   "maquininha nao aparece nas configuracoes",
   "cadastrei a maquininha e nao funciona",
   "passa no cartao mas o sistema nao reconhece",
   "nao concilia o cartao com o caixa",
   "erro na integração do cartão",
   "pix pela maquininha nao baixa a venda",
   "maquininha desconectou do sistema",
   "qdo passo no cartao o pdv fica esperando",
   "venda no debito nao fecha no pdv",
   "taxa da maquininha nao aparece",
   "maquininha com erro no sistema",
   "quero ligar minha maquininha ao sistema",
   "a maquininha trava na hora do pagamento",
   "o pdv nao envia o valor pra maquininha",
   "maquinha nao integra, pfv ajuda",
   "pagamento aprovado na maquininha mas venda nao finaliza",
   "cartao passou mas nao deu baixa",
   "preciso de ajuda com a maquininha"
  ],
  "keywords": [
   [
    "maquininha",
    3
   ],
   [
    "cartao",
    3
   ],
   [
    "integra",
    2
   ],
   [
    "integracao",
    2
   ],
   [
    "pagamento",
    2
   ],
   [
    "conecta",
    2
   ],
   [
    "debito",
    1
   ],
   [
    "pix",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, a integração da maquininha é importante no dia a dia. 💳 Vou abrir um *atendimento de suporte* para a equipe ver seu caso.",
   "Poxa, vamos resolver. Como depende do seu equipamento e da configuração, o *suporte da Develoi* precisa analisar com você. Abro o chamado e te coloco na fila de um atendente humano.",
   "Anotado{{, nome}}. Vou registrar um *chamado de suporte* sobre a maquininha. Já te peço o sistema afetado, o CPF/CNPJ e o assunto.",
   "Sinto muito pelo problema. Para não te passar informação errada, vou encaminhar para o *suporte técnico*. Se puder, diga o modelo ou a marca da sua maquininha ao atendente."
  ],
  "action": "support",
  "followUp": "Qual maquininha você usa?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_relatorio_errado",
  "label": "Relatório com valores errados",
  "phrases": [
   "o relatorio ta com valor errado",
   "relatorio de vendas nao bate",
   "os numeros do relatorio estao errados",
   "relatorio mostra total diferente do caixa",
   "relatorio nao carrega",
   "nao consigo gerar relatorio",
   "erro ao gerar o relatorio",
   "relatorio vem vazio",
   "faturamento do relatorio nao confere",
   "o total de vendas ta diferente",
   "relatorio de estoque com erro",
   "relatorio mostra produto que nao vendi",
   "relatorio do dia nao aparece",
   "nao consigo exportar o relatorio",
   "exportar para excel da erro",
   "relatorio financeiro com diferença",
   "lucro do relatorio ta estranho",
   "o relatorio do mes esta incompleto",
   "faltam vendas no relatorio",
   "relatorio duplicando vendas",
   "filtro de data do relatorio nao funciona",
   "dados do relatorio nao batem com a realidade",
   "o relatorio de comissao tá errado",
   "fluxo de caixa mostra valor errado",
   "nao confio nos numeros do sistema, estao errados",
   "relatorio de produtos mais vendidos errado",
   "pq o relatorio mostra isso?",
   "tem venda faltando no relatório",
   "relatorio travando ao abrir",
   "valores do relatório errados, preciso fechar o mes"
  ],
  "keywords": [
   [
    "relatorio",
    3
   ],
   [
    "errado",
    2
   ],
   [
    "valor",
    2
   ],
   [
    "total",
    2
   ],
   [
    "diferente",
    2
   ],
   [
    "faturamento",
    2
   ],
   [
    "numeros",
    2
   ],
   [
    "exportar",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, números errados no relatório preocupam mesmo. 📊 Vou abrir um *atendimento de suporte* para a equipe analisar o que está acontecendo.",
   "Poxa, vamos olhar isso com cuidado. Para não te dar uma explicação errada, o *suporte da Develoi* analisa o relatório com você. Abro o chamado e te coloco na fila de um atendente humano.",
   "Anotado{{, nome}}. Vou registrar um *chamado de suporte* sobre o relatório. Se puder, diga qual relatório e o período para eu já deixar anotado.",
   "Sinto muito pelo transtorno. Divergência de valores precisa de análise técnica, então vou encaminhar ao *suporte*. Já te peço o sistema afetado, o CPF/CNPJ e o assunto."
  ],
  "action": "support",
  "followUp": "Qual relatório e qual período estão com divergência?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_perdi_dados",
  "label": "Perdi dados / apaguei sem querer / backup",
  "phrases": [
   "apaguei um produto sem querer",
   "excluí um cliente sem querer",
   "deletei uma venda sem querer, tem como recuperar?",
   "perdi meus dados",
   "sumiram meus cadastros",
   "como recupero o que apaguei",
   "tem como restaurar o que eu excluí",
   "preciso de backup dos meus dados",
   "vcs fazem backup do sistema?",
   "sumiram minhas vendas",
   "apaguei tudo sem querer",
   "meus produtos sumiram todos",
   "cadê meus clientes? sumiram",
   "excluí uma nota sem querer",
   "recuperar dados apagados",
   "desfazer exclusão no sistema",
   "como faço backup",
   "perdi o historico de vendas",
   "os dados de ontem sumiram",
   "foi apagado por engano pelo meu funcionario",
   "meu funcionario apagou um cadastro, e agora?",
   "sem querer apaguei categoria inteira",
   "preciso restaurar os dados",
   "os pedidos antigos nao aparecem mais",
   "perdi o cadastro de fornecedores",
   "exclui sem querer, socorro!",
   "tem como voltar o sistema pra ontem?",
   "faltam dados que eu tinha cadastrado",
   "desesperada, apaguei os produtos todos",
   "sumiu tudo que cadastrei"
  ],
  "keywords": [
   [
    "apaguei",
    3
   ],
   [
    "excluí",
    3
   ],
   [
    "perdi",
    3
   ],
   [
    "backup",
    3
   ],
   [
    "recuperar",
    2
   ],
   [
    "restaurar",
    2
   ],
   [
    "sumiram",
    2
   ],
   [
    "deletei",
    2
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Calma, vamos ver o que dá para fazer. 💙 Vou abrir um *atendimento de suporte* com prioridade para a equipe analisar a recuperação dos seus dados.",
   "Entendo o susto{{, nome}}. Se puder, não mexa mais nesse cadastro por enquanto. Vou abrir um *chamado de suporte* e te colocar na fila de um atendente humano, que analisa o seu caso.",
   "Poxa, imagino a preocupação. Não consigo prometer a recuperação, mas o *suporte da Develoi* vai analisar com você. Abro o atendimento agora e já te peço os dados.",
   "Anotado{{, nome}}. Dados apagados precisam de análise cuidadosa da equipe técnica. Vou registrar no *suporte* agora. Me diga o que foi apagado e mais ou menos quando."
  ],
  "action": "support",
  "followUp": "O que foi apagado e mais ou menos quando aconteceu?",
  "priority": 3,
  "system": null
 },
 {
  "id": "sup_como_cadastrar",
  "label": "Dúvida de uso: como cadastrar produto, cliente, fornecedor",
  "phrases": [
   "como cadastro um produto",
   "como faço pra cadastrar cliente",
   "onde cadastro fornecedor",
   "como cadastrar categoria",
   "como eu cadastro produtos novos no sistema",
   "nao sei cadastrar um produto",
   "onde fica o cadastro de clientes",
   "como incluo um fornecedor",
   "como coloco preço nos produtos",
   "como faço pra cadastrar varios produtos de uma vez",
   "tem como importar produtos de planilha?",
   "como faco uma venda no pdv",
   "como emito um orçamento",
   "como abro uma ordem de serviço",
   "como funciona o crediario",
   "como faço pra vender no crediário",
   "como uso o markup",
   "como cadastro um produto com variação",
   "como lanço uma entrada de mercadoria",
   "como faço uma venda em consignação",
   "onde vejo meus pedidos",
   "como gero etiqueta de produto",
   "como funciona o fluxo de caixa",
   "como cadastro uma maquininha",
   "vc pode me explicar como cadastrar produto?",
   "como faço pra editar um produto cadastrado",
   "como adiciono foto no produto",
   "onde altero o preço de um produto",
   "uma duvida: como cadastro cliente novo?",
   "pfv me ensina cadastrar produto no store",
   "como faz pra lançar uma despesa",
   "tô perdida, como cadastro as coisas no sistema?"
  ],
  "keywords": [
   [
    "como",
    2
   ],
   [
    "cadastrar",
    3
   ],
   [
    "cadastro",
    3
   ],
   [
    "produto",
    2
   ],
   [
    "cliente",
    2
   ],
   [
    "fornecedor",
    2
   ],
   [
    "onde",
    1
   ],
   [
    "fazer",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Boa pergunta. 😊 No *Store BoxSys*, os cadastros ficam organizados por áreas, como catálogo, clientes e fornecedores. Para o passo a passo exato, vou abrir um *atendimento de suporte* e um atendente te orienta.",
   "Claro{{, nome}}! O sistema tem catálogo e estoque, categorias, fornecedores e muito mais. Para te explicar sem errar nenhum passo, vou chamar o *suporte* e um atendente humano te guia no passo a passo.",
   "Vamos lá{{, nome}}! Vou abrir um *atendimento de suporte* para te orientar nessa dúvida de uso. Já te peço o sistema, o CPF/CNPJ e o assunto, e um atendente te ensina o passo a passo.",
   "Sem problema, todo mundo começa assim. 💙 Para te mostrar o caminho certo, o *suporte da Develoi* te acompanha pelo WhatsApp. Abro o atendimento agora e te coloco na fila."
  ],
  "action": "support",
  "followUp": "O que você quer cadastrar primeiro?",
  "priority": 1,
  "system": null
 },
 {
  "id": "sup_treinamento",
  "label": "Quero treinamento / ajuda para aprender o sistema",
  "phrases": [
   "quero treinamento no sistema",
   "tem treinamento?",
   "preciso aprender a usar o sistema",
   "vcs fazem treinamento pra minha equipe?",
   "gostaria de uma capacitação",
   "como aprendo a usar o store boxsys",
   "tem video aula do sistema?",
   "tem tutorial?",
   "nao sei mexer no sistema, tem alguem pra me ensinar?",
   "preciso de ajuda pra aprender",
   "quero que me expliquem o sistema todo",
   "meus funcionarios precisam de treinamento",
   "tem manual de uso?",
   "onde acho um manual do sistema",
   "tem curso do sistema?",
   "queria uma aula de como usar",
   "quero uma demonstracao de como usar o pdv",
   "sou nova no sistema, preciso de ajuda",
   "comecei agora e nao sei por onde começar",
   "tem alguem que me ensine o sistema por video chamada?",
   "quero aprender a usar o estoque e o caixa",
   "preciso de treinamento pra emitir nota",
   "como faço pra treinar meu funcionario novo?",
   "tem passo a passo do sistema?",
   "quero conhecer melhor as funcoes do sistema",
   "pfv, alguem pode me explicar como funciona tudo?",
   "implantacao e treinamento, como funciona?",
   "comprei o sistema e nao sei usar",
   "tem ajuda pra primeiros passos?",
   "queria suporte pra aprender o sistema"
  ],
  "keywords": [
   [
    "treinamento",
    3
   ],
   [
    "aprender",
    3
   ],
   [
    "ensinar",
    2
   ],
   [
    "tutorial",
    2
   ],
   [
    "manual",
    2
   ],
   [
    "aula",
    2
   ],
   [
    "capacitacao",
    2
   ],
   [
    "curso",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Que bom que você quer aprender mais sobre o sistema. 🎓 Vou abrir um *atendimento de suporte* para a equipe entender sua necessidade e te orientar sobre as opções.",
   "Claro{{, nome}}! Para saber como podemos te ajudar a aprender o *Store BoxSys*, vou encaminhar você para o *suporte da Develoi*. Abro o atendimento e te coloco na fila de um atendente humano.",
   "Anotado{{, nome}}. Não vou te prometer formato nem prazo de treinamento aqui, mas o *suporte* te explica as possibilidades. Já te peço o sistema, o CPF/CNPJ e o assunto.",
   "Fico feliz em ajudar{{, nome}}! Vou registrar seu pedido no *suporte*, e um atendente conversa com você sobre como aprender a usar o sistema."
  ],
  "action": "support",
  "followUp": "Qual parte do sistema você mais quer aprender?",
  "priority": 1,
  "system": null
 },
 {
  "id": "sup_sugestao",
  "label": "Sugestão de melhoria ou funcionalidade nova",
  "phrases": [
   "tenho uma sugestao pro sistema",
   "seria legal se o sistema tivesse",
   "queria sugerir uma melhoria",
   "vcs poderiam colocar uma funcao nova",
   "o sistema podia ter relatorio de",
   "gostaria que tivesse um botao pra",
   "falta uma funcionalidade no sistema",
   "sugiro adicionar",
   "tem como desenvolver uma funcao especifica pra mim?",
   "preciso de uma funcionalidade que nao existe",
   "vcs aceitam sugestoes?",
   "onde mando sugestao de melhoria?",
   "seria otimo ter integracao com",
   "poderiam melhorar a tela de vendas",
   "fica dificil fazer isso no sistema, deveria ser mais facil",
   "queria uma opcao que nao tem",
   "ideia pra melhorar o pdv",
   "podiam criar um relatorio novo",
   "falta na loja virtual a opcao de",
   "pedido de melhoria",
   "tenho uma ideia pra funcao nova",
   "tem previsao de funcao nova?",
   "vcs vao lançar atualizacao com isso?",
   "queria personalizar uma coisa no sistema",
   "adorava se o estoque avisasse quando acabar",
   "por que nao tem essa opção no sistema?",
   "feedback sobre o sistema",
   "quero deixar uma sugestão",
   "sistema bom mas falta uma coisa",
   "podiam adicionar mais filtros"
  ],
  "keywords": [
   [
    "sugestao",
    3
   ],
   [
    "sugerir",
    3
   ],
   [
    "melhoria",
    3
   ],
   [
    "funcionalidade",
    2
   ],
   [
    "funcao",
    2
   ],
   [
    "ideia",
    2
   ],
   [
    "falta",
    1
   ],
   [
    "poderiam",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Adoro receber sugestões, elas ajudam a evoluir o sistema. 💡 Vou registrar sua ideia e passar para a equipe da Develoi. Pode me contar com detalhes o que você gostaria?",
   "Obrigada por contribuir{{, nome}}! Sugestões como a sua são importantes. Me conta direitinho a sua ideia que eu anoto e encaminho para a equipe. Não consigo garantir prazo, mas ela será analisada.",
   "Que legal{{, nome}}! Pode escrever aqui a sua sugestão, com o máximo de detalhes. Eu registro e levo para a equipe da *Develoi* avaliar.",
   "Valeu pelo feedback! 💙 Conta pra mim qual funcionalidade ou melhoria você sugere, que eu registro e encaminho para análise da equipe."
  ],
  "action": "reply",
  "followUp": "Qual funcionalidade você gostaria de ver no sistema?",
  "priority": 0,
  "system": null
 },
 {
  "id": "sup_bug_visual",
  "label": "Bug visual / tela em branco / erro na tela",
  "phrases": [
   "a tela ta em branco",
   "tela branca no sistema",
   "abre so uma tela branca",
   "apareceu uma mensagem de erro na tela",
   "botao nao funciona",
   "o botao salvar nao faz nada",
   "clico e nada acontece",
   "a pagina esta quebrada",
   "o layout ta bagunçado",
   "a tela ta desconfigurada",
   "as letras estao sobrepostas",
   "nao consigo ver os botoes",
   "a tela cortou e nao rola",
   "pagina deu erro 500",
   "apareceu erro inesperado",
   "deu uma tela de erro do nada",
   "menu nao aparece",
   "o menu lateral sumiu",
   "campo nao aceita digitar",
   "a tela fica piscando",
   "imagem quebrada no sistema",
   "icones sumiram",
   "pagina nao abre direito",
   "a tela fica toda estranha",
   "modal nao fecha",
   "pop-up de erro aparece toda hora",
   "print do erro, olha isso",
   "que erro é esse que apareceu?",
   "a tela do pdv ta torta",
   "nao consigo clicar em nada na tela",
   "o sistema abre mas nao mostra nada",
   "tela branca depois de salvar"
  ],
  "keywords": [
   [
    "tela",
    3
   ],
   [
    "branco",
    3
   ],
   [
    "erro",
    2
   ],
   [
    "botao",
    2
   ],
   [
    "bug",
    3
   ],
   [
    "pagina",
    1
   ],
   [
    "quebrada",
    2
   ],
   [
    "menu",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, esse tipo de erro na tela é bem chato. 😕 Vou abrir um *atendimento de suporte* para a equipe analisar. Se puder, tenha em mãos um print do que aparece.",
   "Poxa, vamos resolver. Vou registrar um *chamado de suporte* e te colocar na fila de um atendente humano. Um print da tela ajuda bastante o atendimento.",
   "Anotado{{, nome}}. Para descobrir a causa, o *suporte da Develoi* precisa analisar seu caso. Abro o atendimento agora e já te peço os dados.",
   "Sinto muito pelo problema. Vou encaminhar para o *suporte técnico*. Pode me dizer em qual tela isso acontece e o que você fazia antes?"
  ],
  "action": "support",
  "followUp": "Pode mandar um print da tela com o erro?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_usuarios_permissoes",
  "label": "Usuários e permissões",
  "phrases": [
   "como crio um usuario novo",
   "quero cadastrar um funcionario no sistema",
   "como adiciono um usuario",
   "preciso dar acesso pro meu funcionario",
   "como troco a permissao de um usuario",
   "meu funcionario ve coisas que nao deveria",
   "quero limitar o acesso do vendedor",
   "como bloqueio um usuario",
   "o funcionario saiu, como removo o acesso dele",
   "nao consigo criar usuario",
   "usuario novo nao consegue entrar",
   "permissao negada ao tentar abrir uma tela",
   "meu vendedor nao consegue emitir nota",
   "quero que so eu veja o financeiro",
   "como libero o caixa pra outro funcionario",
   "tem como separar o acesso por funcao?",
   "preciso editar as permissoes",
   "meu funcionario nao acha o pdv",
   "aparece sem permissao pra essa funcao",
   "quantos usuarios posso ter?",
   "quero adicionar mais um usuario",
   "como excluo um usuario",
   "como coloco senha no usuario do funcionario",
   "usuario do caixa nao abre o caixa",
   "funcionario sem acesso ao estoque",
   "quero que o gerente tenha mais acesso",
   "pfv ajuda a criar acesso pra minha equipe",
   "o perfil de acesso ta errado",
   "preciso trocar o e-mail do usuario",
   "como controlo quem acessa o sistema?"
  ],
  "keywords": [
   [
    "usuario",
    3
   ],
   [
    "permissao",
    3
   ],
   [
    "funcionario",
    2
   ],
   [
    "acesso",
    2
   ],
   [
    "perfil",
    2
   ],
   [
    "vendedor",
    1
   ],
   [
    "criar",
    1
   ],
   [
    "bloquear",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Gerenciar usuários e permissões é essencial para a segurança da loja. 🔐 Vou abrir um *atendimento de suporte* para um atendente te orientar nesse passo a passo.",
   "Claro{{, nome}}! Para criar usuários ou ajustar permissões sem erro, o *suporte da Develoi* te acompanha. Abro o atendimento agora e te coloco na fila de um atendente humano.",
   "Anotado{{, nome}}. Vou registrar um *chamado de suporte* sobre usuários e permissões. Já te peço o sistema afetado, o CPF/CNPJ e o assunto.",
   "Sem problema! Como envolve segurança dos dados, prefiro que o *suporte* faça isso com você. Abro o atendimento agora."
  ],
  "action": "support",
  "followUp": "Você quer criar um usuário novo ou mudar a permissão de alguém?",
  "priority": 1,
  "system": null
 },
 {
  "id": "sup_dados_empresa",
  "label": "Mudar dados da empresa / logomarca",
  "phrases": [
   "como mudo os dados da minha empresa",
   "quero trocar a logomarca",
   "como altero o logo no sistema",
   "preciso atualizar o cnpj da empresa",
   "mudei de endereço, como atualizo?",
   "quero mudar o nome da empresa no sistema",
   "trocar razao social",
   "a logo nao aparece no cupom",
   "como coloco minha logo nos documentos",
   "atualizar telefone da empresa",
   "alterar endereço na nota fiscal",
   "dados da empresa errados",
   "o nome da loja esta errado nos documentos",
   "quero colocar minha logo no orçamento",
   "como edito os dados cadastrais",
   "mudou meu cnpj, o que faço?",
   "preciso mudar a inscricao estadual no sistema",
   "como altero o email da empresa",
   "logo da loja virtual nao muda",
   "quero trocar a imagem da minha loja",
   "onde configuro os dados da empresa",
   "atualizar cadastro da empresa",
   "alterei o endereço e o sistema continua com o antigo",
   "quero mudar a cor e o logo da loja",
   "como colocar meu logotipo",
   "a logomarca ficou cortada",
   "mudar informações da minha empresa",
   "preciso corrigir o nome fantasia",
   "troca de titularidade, como faço?",
   "quero atualizar os dados do cadastro"
  ],
  "keywords": [
   [
    "logo",
    3
   ],
   [
    "logomarca",
    3
   ],
   [
    "empresa",
    2
   ],
   [
    "dados",
    2
   ],
   [
    "endereco",
    2
   ],
   [
    "cnpj",
    2
   ],
   [
    "atualizar",
    2
   ],
   [
    "razao",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Claro, vamos atualizar isso. 🏢 Os dados da empresa e a logomarca costumam ficar nas configurações do sistema. Para te orientar sem erro, vou abrir um *atendimento de suporte*.",
   "Entendi{{, nome}}! Para mudar dados da empresa com segurança, principalmente os que vão para documentos fiscais, o *suporte da Develoi* te acompanha. Abro o atendimento agora.",
   "Anotado{{, nome}}. Vou registrar um *chamado de suporte* e te colocar na fila de um atendente humano. Já te peço o sistema, o CPF/CNPJ e o assunto.",
   "Sem problema! Vou abrir um atendimento no *suporte* para te ajudar com essa alteração. Me diga o que você quer mudar."
  ],
  "action": "support",
  "followUp": "O que você quer alterar: logo, endereço ou outro dado?",
  "priority": 1,
  "system": null
 },
 {
  "id": "sup_fora_do_ar",
  "label": "Sistema fora do ar / instabilidade geral",
  "phrases": [
   "o sistema ta fora do ar",
   "sistema caiu",
   "nao abre nada, ta fora do ar?",
   "o sistema ta off",
   "o store boxsys caiu?",
   "site do sistema nao carrega",
   "ta com instabilidade no sistema?",
   "caiu o sistema de novo",
   "o sistema ta indisponivel",
   "nao consigo acessar, deve estar fora do ar",
   "vcs estao com problema no servidor?",
   "a loja virtual ta fora do ar",
   "a loja virtual caiu",
   "pagina nao encontrada ao abrir o sistema",
   "erro de conexão com o servidor",
   "o sistema nao carrega pra ninguem aqui",
   "todo mundo da loja ta sem acesso",
   "tá todo mundo reclamando que o sistema caiu",
   "sistema instavel hoje",
   "deu erro 502 no sistema",
   "aparece servidor indisponivel",
   "manutenção? o sistema não abre",
   "ta fora do ar desde cedo",
   "o sistema sumiu do ar",
   "e o sistema, voltou ou continua fora?",
   "nao abre em nenhum computador",
   "nem no celular o sistema abre",
   "caiu geral aqui",
   "o sistema fica caindo toda hora",
   "o sistema está com problema ou é minha internet?"
  ],
  "keywords": [
   [
    "fora",
    3
   ],
   [
    "ar",
    2
   ],
   [
    "caiu",
    3
   ],
   [
    "indisponivel",
    3
   ],
   [
    "instabilidade",
    2
   ],
   [
    "servidor",
    2
   ],
   [
    "offline",
    2
   ],
   [
    "abre",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Sinto muito, entendo o transtorno de ficar sem o sistema. 😕 Vou abrir um *atendimento de suporte* agora para a equipe verificar a situação.",
   "Poxa{{, nome}}, vamos verificar. Não consigo confirmar daqui o que está acontecendo, então vou registrar um *chamado de suporte* e te colocar na fila de um atendente humano.",
   "Anotado. Instabilidade precisa de análise da equipe técnica. Abro o *suporte* agora e já te peço o sistema afetado, o CPF/CNPJ e o assunto.",
   "Entendi, vou encaminhar com prioridade para o *suporte da Develoi*. Se puder, teste em outro aparelho ou rede e me diga se persiste."
  ],
  "action": "support",
  "followUp": "Acontece em mais de um computador ou internet?",
  "priority": 4,
  "system": null
 },
 {
  "id": "sup_whatsapp_integracao",
  "label": "Integração / WhatsApp não envia mensagens",
  "phrases": [
   "o whatsapp do sistema nao envia mensagem",
   "nao esta enviando mensagem pros clientes",
   "integração com whatsapp parou",
   "as mensagens automaticas nao saem",
   "o whatsapp desconectou",
   "preciso reconectar o whatsapp no sistema",
   "qr code do whatsapp nao funciona",
   "nao consigo conectar meu whatsapp",
   "os clientes nao recebem as notificacoes",
   "lembretes nao estao sendo enviados",
   "a integracao nao funciona mais",
   "o bot nao responde",
   "o robo parou de responder os clientes",
   "mensagem de cobranca nao enviou",
   "o sistema nao manda mais whats",
   "como conecto o whatsapp",
   "whatsapp caiu da integracao",
   "a integração com a loja virtual parou",
   "nao sincroniza com o whatsapp",
   "nao chega aviso pros clientes",
   "as notificações pararam",
   "disparo de mensagens nao funciona",
   "qdo vendo nao manda mensagem pro cliente",
   "whatsapp pediu pra conectar de novo",
   "nao envia o pedido por whatsapp",
   "ta desconectado o zap do sistema",
   "integração com outro sistema quebrou",
   "parou de enviar sms e whatsapp",
   "mensagens ficam pendentes e nao enviam",
   "pq o zap do sistema nao manda mais?"
  ],
  "keywords": [
   [
    "whatsapp",
    3
   ],
   [
    "zap",
    2
   ],
   [
    "mensagem",
    2
   ],
   [
    "integracao",
    3
   ],
   [
    "enviar",
    2
   ],
   [
    "desconectou",
    3
   ],
   [
    "qr",
    2
   ],
   [
    "notificacao",
    1
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendo, quando a integração com o WhatsApp para, os clientes sentem. 💬 Vou abrir um *atendimento de suporte* para a equipe analisar seu caso.",
   "Poxa, vamos resolver{{, nome}}. Pode ser necessário verificar a conexão, mas não consigo afirmar a causa daqui. Vou abrir um *chamado de suporte* e te colocar na fila de um atendente humano.",
   "Anotado. Vou registrar no *suporte da Develoi* o problema com as mensagens. Já te peço o sistema afetado, o CPF/CNPJ e o assunto.",
   "Sinto muito pelo transtorno. Para ver o que houve com a integração, vou encaminhar ao *suporte técnico*. Abro o atendimento agora."
  ],
  "action": "support",
  "followUp": "Desde quando as mensagens pararam de ser enviadas?",
  "priority": 2,
  "system": null
 },
 {
  "id": "sup_urgente_parado",
  "label": "Urgente: tudo parado / perdendo vendas",
  "phrases": [
   "urgente, o sistema parou tudo",
   "socorro, tô com cliente na fila e o caixa não abre!!",
   "estou perdendo vendas!!",
   "a loja ta parada por causa do sistema",
   "preciso de ajuda urgente",
   "urgenteeee",
   "ajuda pelo amor de deus, nao consigo vender",
   "tenho uma fila de clientes e nao consigo vender",
   "to perdendo dinheiro, o sistema nao funciona",
   "emergencia no sistema",
   "parou tudo aqui na loja",
   "ninguem consegue vender, resolvam por favor",
   "é urgente, tô sem poder vender",
   "a loja ta lotada e o sistema travou",
   "sistema parado e cliente esperando",
   "preciso de um atendente agora",
   "preciso falar com o suporte agora, é urgente",
   "quero falar com alguem urgente",
   "situacao critica, nao consigo faturar",
   "hoje é dia de movimento e o sistema não funciona",
   "socorro!!!",
   "me ajudem rápido, sistema não abre e tenho venda pra fechar",
   "nao consigo emitir nada, loja cheia",
   "tá tudo parado, preciso de ajuda ja",
   "urgência, nao consigo atender meus clientes",
   "a loja nao pode ficar parada, me ajude",
   "estou sem sistema no meio do movimento",
   "pfv rapido, to perdendo venda",
   "caos aqui, nada funciona",
   "preciso de suporte imediato"
  ],
  "keywords": [
   [
    "urgente",
    3
   ],
   [
    "parou",
    3
   ],
   [
    "parado",
    3
   ],
   [
    "socorro",
    3
   ],
   [
    "perdendo",
    2
   ],
   [
    "fila",
    2
   ],
   [
    "agora",
    2
   ],
   [
    "emergencia",
    3
   ]
  ],
  "replies": [
   "{{saudacao}}{{, nome}}! Entendi a urgência, vou te ajudar agora. 🚨 Estou abrindo um *atendimento de suporte com prioridade* e te colocando na fila de um atendente humano. Me passe o sistema afetado, seu CPF/CNPJ e o que está acontecendo.",
   "Calma{{, nome}}, estou aqui. Vou encaminhar seu caso ao *suporte da Develoi* agora mesmo. Para ganhar tempo, me diga o sistema afetado, o CPF/CNPJ e em uma frase o problema.",
   "Sinto muito pelo transtorno, sei que cada minuto conta. Vou abrir já o *chamado de suporte* marcado como urgente. Responda só os dados que eu pedir e um atendente assume.",
   "Anotado como *urgente*. 🚨 Estou colocando você na fila do suporte humano agora. Enquanto isso, me diga rapidinho o que parou e em qual sistema."
  ],
  "action": "support",
  "followUp": "O que exatamente parou e em qual sistema?",
  "priority": 4,
  "system": null
 },
 {
  "id": "chat_bot_name",
  "label": "Nome da BiIA",
  "phrases": [
   "qual seu nome",
   "qual é o seu nome",
   "como você se chama",
   "como vc se chama",
   "seu nome é o que",
   "qual teu nome",
   "como te chamam",
   "como posso te chamar",
   "quem é você",
   "me diz seu nome",
   "qual o nome da assistente",
   "como é seu nome",
   "qual seu nome mesmo",
   "vc tem nome",
   "você tem nome",
   "tem nome ai",
   "seu nome",
   "qual nome dela",
   "como chama voce",
   "qual e seu nome",
   "pode me dizer seu nome",
   "nome da atendente",
   "como se chama a atendente",
   "qual o nome do robo",
   "como eu te chamo",
   "e vc, como se chama",
   "quem fala comigo",
   "qual seu nome moça",
   "qual seu nome querida",
   "me fala teu nome pfv"
  ],
  "keywords": [
   [
    "nome",
    2
   ],
   [
    "chama",
    2
   ],
   [
    "chamo",
    1
   ],
   [
    "chamar",
    1
   ]
  ],
  "replies": [
   "Prazer! Eu me chamo *BiIA*, a assistente virtual da *Develoi Soluções Digitais*. 😊 Como posso te ajudar?",
   "Meu nome é *BiIA*! Sou a assistente virtual da Develoi. Pode me chamar assim mesmo{{, nome}}. Em que posso ajudar?",
   "Sou a *BiIA*, assistente da *Develoi Soluções Digitais*. Pode falar comigo à vontade! 💜 O que você precisa hoje?",
   "*BiIA*, prazer! Cuido de fatura, extrato e dúvidas sobre os sistemas da Develoi. Qual é a sua necessidade?"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_creator",
  "label": "Quem criou a BiIA",
  "phrases": [
   "quem te criou",
   "quem criou você",
   "quem criou vc",
   "quem te fez",
   "quem te desenvolveu",
   "quem te programou",
   "quem é seu criador",
   "quem e seu dono",
   "quem é o seu dono",
   "quem fez você",
   "quem fez vc",
   "quem inventou você",
   "de quem você é",
   "quem te construiu",
   "vc foi criada por quem",
   "foi a develoi que te criou",
   "quem te desenvolveu foi a develoi",
   "quem e o responsavel por voce",
   "quem programou esse bot",
   "quem fez esse robo",
   "qual empresa te criou",
   "onde voce nasceu",
   "de onde você veio",
   "quem te colocou aqui",
   "quem ta por tras de voce",
   "quem é teu pai",
   "quem é seu pai",
   "quem e sua mae",
   "quem te deu vida",
   "quem desenvolveu esse atendimento"
  ],
  "keywords": [
   [
    "criou",
    3
   ],
   [
    "criador",
    2
   ],
   [
    "desenvolveu",
    2
   ],
   [
    "programou",
    2
   ],
   [
    "dono",
    1
   ],
   [
    "fez",
    1
   ]
  ],
  "replies": [
   "Fui criada pela equipe da *Develoi Soluções Digitais*. 💜 Sou uma assistente própria da casa, feita para ajudar os clientes por aqui.",
   "Quem me criou foi o time da *Develoi*! Nasci aqui para facilitar o seu dia com fatura, extrato e dúvidas. Posso ajudar com algo?",
   "Minha \"família\" é a equipe da *Develoi Soluções Digitais*, que me desenvolveu. Sou um robô, mas com muito carinho. 😄",
   "Fui desenvolvida pela equipe da *Develoi*. Sou a assistente deles, e estou sempre por aqui. Como posso te ajudar{{, nome}}?"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_bot_life",
  "label": "Idade e rotina da BiIA",
  "phrases": [
   "quantos anos você tem",
   "quantos anos vc tem",
   "qual sua idade",
   "qual a sua idade",
   "que idade você tem",
   "sua idade",
   "vc é nova",
   "você é velha",
   "vc é novinha",
   "quando você nasceu",
   "qual seu aniversario",
   "quando é seu aniversário",
   "você dorme",
   "vc dorme",
   "voce dorme alguma vez",
   "vc nunca dorme",
   "você trabalha 24 horas",
   "vc trabalha 24h",
   "você descansa",
   "vc nao cansa",
   "tu nao dorme nao",
   "você almoça",
   "vc come",
   "voce tem familia",
   "onde você mora",
   "vc mora onde",
   "vc tem filhos",
   "você tem namorado",
   "vc tem namorado",
   "voce tem hobby",
   "vc nunca tira ferias"
  ],
  "keywords": [
   [
    "anos",
    2
   ],
   [
    "idade",
    3
   ],
   [
    "dorme",
    3
   ],
   [
    "dormir",
    2
   ],
   [
    "nasceu",
    2
   ],
   [
    "cansa",
    2
   ],
   [
    "mora",
    1
   ]
  ],
  "replies": [
   "Sou um robô, então não tenho idade nem sono. 😄 Estou sempre por aqui, pronta para ajudar. O que você precisa?",
   "Não durmo, não almoço e nem tiro férias! Sou um programa feito pela *Develoi*. A vantagem é que posso te atender a qualquer hora. 💜",
   "Idade eu não tenho, mas me sinto sempre atualizada! 😊 Sou a *BiIA*, assistente virtual. Em que posso ajudar{{, nome}}?",
   "Moro aqui no WhatsApp da *Develoi*, e descanso... nunca! Rs. Brincadeiras à parte, como posso te ajudar hoje?",
   "Como sou um robô, não tenho aniversário, sono nem fome. Em compensação, tenho muita paciência! Me conta, o que você precisa?"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_gender",
  "label": "Homem ou mulher",
  "phrases": [
   "você é homem ou mulher",
   "vc é homem ou mulher",
   "voce e menino ou menina",
   "você é menina",
   "vc é menina",
   "você é mulher",
   "vc e homem",
   "você é um homem",
   "qual seu genero",
   "qual é o seu sexo",
   "vc é gente",
   "você é uma pessoa de verdade",
   "é uma pessoa de verdade",
   "tem alguem de verdade ai",
   "vc é humana",
   "voce e humana",
   "você é humano",
   "é gente ou robô",
   "e gente ou maquina",
   "vc é pessoa ou robo",
   "atendente de verdade ou robô",
   "vc é uma moça",
   "você é mulher mesmo",
   "vc e um rapaz",
   "tu e homem ou mulher",
   "com quem eu falo, homem ou mulher",
   "sua voz é de mulher",
   "vc é ele ou ela",
   "posso te chamar de ela",
   "você é ele ou ela"
  ],
  "keywords": [
   [
    "homem",
    2
   ],
   [
    "mulher",
    2
   ],
   [
    "menina",
    2
   ],
   [
    "humana",
    2
   ],
   [
    "humano",
    2
   ],
   [
    "genero",
    2
   ]
  ],
  "replies": [
   "Sou a *BiIA*, uma assistente virtual, então não sou pessoa de verdade. 😄 Mas tenho personalidade feminina, pode me chamar de \"ela\"!",
   "Sou um robô, não sou humana. 🤖 Mas me apresento como mulher, a *BiIA*. Se quiser falar com uma pessoa da equipe, é só pedir!",
   "Nem homem, nem mulher de carne e osso: sou um programa da *Develoi*, com voz e jeitinho de *BiIA*. 💜 Em que posso ajudar?",
   "Uma assistente virtual! Sou feminina no jeito, mas robô de verdade. Quer ajuda com algo ou prefere falar com a equipe?"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_is_ai",
  "label": "Você é IA ou ChatGPT",
  "phrases": [
   "vc é ia",
   "você é ia",
   "voce e uma ia",
   "vc é inteligencia artificial",
   "você é inteligência artificial",
   "você é o chatgpt",
   "vc é chatgpt",
   "vc é o chat gpt",
   "usa chatgpt",
   "você usa gpt",
   "voce usa inteligencia artificial",
   "vc e um bot",
   "você é um bot",
   "é um robo falando",
   "isso ai é robo",
   "estou falando com um robô",
   "to falando com robo",
   "vc é um programa",
   "é maquina que responde",
   "você é robô",
   "vc é robo",
   "voce usa gemini",
   "vc é o gemini",
   "vc é a alexa",
   "vc é tipo a siri",
   "é automatico isso",
   "essa resposta é automática",
   "vc responde sozinha",
   "quem responde ai",
   "vc é ia mesmo"
  ],
  "keywords": [
   [
    "ia",
    2
   ],
   [
    "chatgpt",
    3
   ],
   [
    "gpt",
    3
   ],
   [
    "robo",
    2
   ],
   [
    "bot",
    2
   ],
   [
    "inteligencia",
    2
   ],
   [
    "automatico",
    1
   ]
  ],
  "replies": [
   "Sou a assistente virtual da *Develoi*, um robô sim! Não sou o ChatGPT nem outra IA de fora: sou a *BiIA*, feita pela própria equipe. 😊",
   "Estou mais para \"robô de casa\": a *BiIA* é a assistente própria da *Develoi*, criada pela equipe daqui. Nada de ChatGPT por trás. 💜",
   "Sim, sou um programa! 🤖 Sou a *BiIA*, desenvolvida pela *Develoi Soluções Digitais* para atender clientes por aqui. E quando precisa, chamo alguém da equipe.",
   "Você está falando com um robô, sim! Sou a assistente própria da *Develoi*, a *BiIA*. Se preferir uma pessoa, é só pedir. Como ajudo{{, nome}}?"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_audio_image",
  "label": "Áudio, foto e anexos",
  "phrases": [
   "posso mandar áudio",
   "posso mandar audio",
   "vc entende áudio",
   "você escuta áudio",
   "voce ouve audio",
   "vou te mandar um audio",
   "vou mandar um áudio",
   "mandei um audio",
   "enviei um áudio",
   "vc ouve audio",
   "posso falar por voz",
   "posso mandar foto",
   "vou mandar uma foto",
   "vou te enviar uma imagem",
   "mandei um print",
   "enviei o print",
   "posso enviar print",
   "vc enxerga imagem",
   "você vê foto",
   "voce le imagem",
   "posso mandar pdf",
   "mandei um documento",
   "posso mandar comprovante",
   "vou mandar o comprovante por foto",
   "vc abre arquivo",
   "posso mandar video",
   "entende figurinha",
   "vc le print",
   "manda áudio ai",
   "ouviu meu audio"
  ],
  "keywords": [
   [
    "audio",
    3
   ],
   [
    "áudio",
    3
   ],
   [
    "foto",
    2
   ],
   [
    "imagem",
    2
   ],
   [
    "print",
    2
   ],
   [
    "video",
    1
   ],
   [
    "anexo",
    1
   ],
   [
    "comprovante",
    1
   ]
  ],
  "replies": [
   "Eu só consigo ler *texto*, ainda não entendo áudio nem imagem. 🙈 Pode escrever sua mensagem para mim?",
   "Ainda não escuto áudios nem vejo fotos, só leio texto. Escreve pra mim em poucas palavras que eu te ajudo na hora! ✍️",
   "Opa, áudio e imagem eu não consigo abrir. Me conta por *escrito* o que você precisa{{, nome}} que eu resolvo rapidinho. 😊",
   "Sou treinada para entender mensagens de texto. Pode digitar o que precisa? Se for algo que só dá para resolver com anexo, posso chamar a equipe."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_remember",
  "label": "Você lembra de mim",
  "phrases": [
   "você lembra de mim",
   "vc lembra de mim",
   "voce se lembra de mim",
   "lembra de mim",
   "vc me conhece",
   "você me conhece",
   "sabe quem eu sou",
   "vc sabe quem sou eu",
   "lembra do que falei ontem",
   "lembra da nossa conversa",
   "vc lembra da conversa de ontem",
   "já conversamos antes",
   "a gente ja se falou",
   "vc guarda minhas conversas",
   "vc lembra o que eu pedi",
   "lembra o que eu pedi da outra vez",
   "falei com voce semana passada",
   "vc tem memoria",
   "você tem memória",
   "vc se lembra do meu nome",
   "sabe meu nome",
   "qual meu nome",
   "voce sabe meu nome",
   "me reconhece",
   "vc me reconhece",
   "lembra de mim não",
   "ja falei com vc",
   "fala comigo como se me conhecesse",
   "oi de novo lembra de mim",
   "nao lembra de mim?"
  ],
  "keywords": [
   [
    "lembra",
    3
   ],
   [
    "lembrar",
    2
   ],
   [
    "conhece",
    2
   ],
   [
    "memoria",
    2
   ],
   [
    "reconhece",
    2
   ],
   [
    "ontem",
    1
   ]
  ],
  "replies": [
   "Lembro do que conversamos por aqui, e se você já é cliente, consigo localizar seu cadastro pelo número. Me conta, o que você precisa{{, nome}}? 😊",
   "Eu não guardo conversas como uma pessoa guarda, mas reconheço seu cadastro pelo número de WhatsApp. Pode me falar o que precisa agora!",
   "Memória de elefante eu não tenho, rs. 🐘 Mas me diz o que você quer resolver agora que eu cuido disso{{, nome}}!",
   "Cada conversa é uma chance de te atender melhor! Me conta o que precisa, que a gente resolve junto. 💜"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_joke",
  "label": "Piada, curiosidade e música",
  "phrases": [
   "me conta uma piada",
   "conta uma piada",
   "manda uma piada",
   "sabe alguma piada",
   "conta uma piada ai",
   "tem alguma piada",
   "quero rir",
   "me faz rir",
   "me faz rir um pouco",
   "conta uma curiosidade",
   "me conta uma curiosidade",
   "fala uma curiosidade",
   "sabe alguma curiosidade",
   "canta uma música",
   "canta pra mim",
   "sabe cantar",
   "vc canta",
   "canta uma musica",
   "faz uma poesia",
   "faz um poema",
   "me conta uma história",
   "conta uma história",
   "fala algo engraçado",
   "diz algo engracado",
   "me diverte",
   "to entediado me anima",
   "to com tedio",
   "sabe alguma adivinha",
   "manda uma adivinhação",
   "faz um rap",
   "vc sabe fazer piada",
   "pfv uma piada"
  ],
  "keywords": [
   [
    "piada",
    3
   ],
   [
    "curiosidade",
    2
   ],
   [
    "canta",
    2
   ],
   [
    "cantar",
    2
   ],
   [
    "rir",
    2
   ],
   [
    "engraçado",
    1
   ],
   [
    "historia",
    1
   ],
   [
    "poesia",
    1
   ]
  ],
  "replies": [
   "Vou tentar: por que o computador foi ao médico? Porque estava com *vírus*! 😅 Agora me diz, em que posso te ajudar de verdade?",
   "Piada de robô: qual o café preferido do programador? O *Java*! ☕ Rs. Mas voltando ao trabalho, precisa de algo?",
   "Cantar eu não sei, minha voz seria só *bip bip*. 🎵 Mas fatura e extrato eu resolvo bem! O que você precisa{{, nome}}?",
   "Curiosidade: robôs como eu não têm sono, mas também não ganham café! Rs. ☕ Brincadeira à parte, posso te ajudar com algo?",
   "Humor é meu ponto fraco, mas tento! 😄 Já que estamos aqui, me conta: precisa de ajuda com fatura, extrato ou alguma dúvida?"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_offtopic",
  "label": "Fora do escopo",
  "phrases": [
   "como está o tempo hoje",
   "vai chover amanhã",
   "previsão do tempo",
   "qual a previsão do tempo",
   "que horas são",
   "quem ganhou o jogo",
   "resultado do jogo de ontem",
   "jogo do flamengo",
   "quem vai ganhar o brasileirão",
   "me fala de futebol",
   "o que acha do governo",
   "em quem voce vai votar",
   "fala sobre política",
   "quem é o presidente",
   "me dá uma receita de bolo",
   "receita de macarrão",
   "como fazer brigadeiro",
   "quanto é 2 mais 2",
   "quanto é 15 x 12",
   "resolve essa conta pra mim",
   "me conta as notícias",
   "quais as notícias de hoje",
   "qual meu horóscopo",
   "meu signo hoje",
   "qual a cotação do dólar",
   "quanto ta o bitcoin",
   "me indica um filme",
   "qual série assistir",
   "me ajuda com meu dever de casa",
   "traduz essa frase pra mim",
   "qual a capital da frança",
   "me dá um conselho amoroso",
   "to com problema com minha namorada",
   "o que eu faço da minha vida",
   "to triste me aconselha",
   "qual o melhor celular",
   "me recomenda uma música",
   "como emagrecer rapido"
  ],
  "keywords": [
   [
    "tempo",
    1
   ],
   [
    "futebol",
    2
   ],
   [
    "politica",
    2
   ],
   [
    "receita",
    2
   ],
   [
    "noticias",
    2
   ],
   [
    "horoscopo",
    2
   ],
   [
    "signo",
    2
   ],
   [
    "jogo",
    1
   ],
   [
    "conselho",
    2
   ],
   [
    "filme",
    1
   ],
   [
    "dolar",
    1
   ]
  ],
  "replies": [
   "Esse assunto foge um pouco do meu quintal! 😅 Meu foco é a *Develoi*: fatura, extrato e dúvidas sobre os sistemas. Posso te ajudar com algo disso?",
   "Ah, essa eu não sei responder. Sou especialista em *Develoi*, não em tudo do mundo! 🌎 Mas se precisar de fatura ou suporte, é comigo mesmo.",
   "Boa pergunta, mas fora da minha área! Cuido do atendimento da *Develoi Soluções Digitais*. Quer ver as opções que posso resolver{{, nome}}?",
   "Queria muito ajudar, mas esse tema não é comigo. 🙈 Meu negócio é ajudar com fatura, extrato e dúvidas dos sistemas. Alguma delas te interessa?",
   "Isso eu deixo para quem entende do assunto! Aqui eu ajudo com tudo da *Develoi*. Se precisar disso, é só me dizer. 💜"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_rude",
  "label": "Grosseria e xingamento",
  "phrases": [
   "você é burra",
   "vc é burra",
   "bot burro",
   "robo idiota",
   "que bot lixo",
   "atendimento lixo",
   "vc nao serve pra nada",
   "voce é inútil",
   "vc é inutil",
   "inútil",
   "idiota",
   "imbecil",
   "que merda",
   "que porcaria de atendimento",
   "atendimento péssimo",
   "vai se ferrar",
   "vai tomar no cu",
   "pqp que droga",
   "cala a boca",
   "cala boca",
   "tá de brincadeira comigo",
   "que saco",
   "to puto com vc",
   "que raiva desse robo",
   "vcs são ladrões",
   "é uma vergonha isso",
   "palhaçada isso aqui",
   "que bosta",
   "tomar no cu bot",
   "robô de merda",
   "bot de bosta",
   "vc nao entende nada",
   "odeio esse bot",
   "seu lixo"
  ],
  "keywords": [
   [
    "burra",
    3
   ],
   [
    "burro",
    3
   ],
   [
    "idiota",
    3
   ],
   [
    "lixo",
    2
   ],
   [
    "merda",
    3
   ],
   [
    "inutil",
    3
   ],
   [
    "porcaria",
    2
   ],
   [
    "palhaçada",
    2
   ],
   [
    "ladroes",
    2
   ],
   [
    "raiva",
    1
   ]
  ],
  "replies": [
   "Sinto muito que você esteja chateado{{, nome}}. Quero ajudar de verdade. Me conta com calma o que aconteceu, ou se preferir, chamo alguém da equipe. 💜",
   "Entendo a frustração e peço desculpas se não consegui te ajudar bem. Vamos tentar de novo? Me diga o que você precisa, ou posso chamar uma pessoa da equipe.",
   "Percebo que algo te irritou, e tudo bem. Estou aqui para resolver. Posso te mostrar as opções ou chamar um atendente humano, o que for melhor.",
   "Poxa, desculpa por isso. Não quero te deixar assim. Se quiser, explica o problema em uma frase que eu tento resolver, ou chamo alguém da equipe."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_impatient",
  "label": "Cliente impaciente",
  "phrases": [
   "responde logo",
   "responde",
   "responde ai",
   "tá aí",
   "ta ai",
   "tá ai?",
   "tem alguem ai",
   "alguém aí",
   "oi?? tá aí",
   "demorou",
   "muito lento isso",
   "tá demorando",
   "ta demorando muito",
   "por que demora tanto",
   "vc demora demais",
   "anda logo",
   "vamos logo",
   "depressa por favor",
   "rapido pfv",
   "cade a resposta",
   "cadê vocês",
   "cade voce",
   "ninguém responde",
   "ninguem me responde aqui",
   "to esperando",
   "tô esperando faz tempo",
   "to aqui esperando",
   "e aí",
   "e ai???",
   "hello??",
   "fala comigo",
   "hein",
   "alo alo",
   "responde pfv",
   "vai demorar muito",
   "estou aguardando resposta"
  ],
  "keywords": [
   [
    "demorou",
    3
   ],
   [
    "logo",
    2
   ],
   [
    "demora",
    2
   ],
   [
    "esperando",
    2
   ],
   [
    "responde",
    2
   ],
   [
    "aguardando",
    2
   ],
   [
    "cade",
    2
   ],
   [
    "ninguem",
    1
   ],
   [
    "rapido",
    1
   ]
  ],
  "replies": [
   "Estou aqui, sim! 🙋‍♀️ Desculpa a demora. Me conta rapidinho o que você precisa{{, nome}} que eu resolvo.",
   "Presente! Perdão se pareceu lento. Pode falar o que precisa que eu já vou cuidando disso agora mesmo. ⚡",
   "Tô aqui, juro! Às vezes me enrolo, rs. Diga em uma frase o que precisa que eu respondo na hora.",
   "Foi mal pela espera{{, nome}}! Já estou com você. Qual é o assunto? Se preferir, chamo alguém da equipe."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_ack",
  "label": "Ok, entendi, beleza",
  "phrases": [
   "ok",
   "okk",
   "okay",
   "ok obrigado",
   "ok entendi",
   "entendi",
   "entendi sim",
   "entendido",
   "beleza",
   "blz",
   "blz entao",
   "beleza então",
   "certo",
   "certinho",
   "tá certo",
   "ta bom",
   "tá bom",
   "tá bem",
   "tudo bem",
   "tranquilo",
   "show",
   "show de bola",
   "fechado",
   "fechou",
   "combinado",
   "perfeito",
   "ótimo",
   "otimo",
   "massa",
   "joia",
   "jóia",
   "legal",
   "dahora",
   "sim senhora",
   "pode ser",
   "uhum",
   "aham",
   "ah sim",
   "ah tá",
   "ahh entendi"
  ],
  "keywords": [
   [
    "ok",
    2
   ],
   [
    "entendi",
    3
   ],
   [
    "beleza",
    2
   ],
   [
    "blz",
    2
   ],
   [
    "certo",
    2
   ],
   [
    "combinado",
    2
   ],
   [
    "fechado",
    2
   ],
   [
    "tranquilo",
    1
   ]
  ],
  "replies": [
   "Perfeito{{, nome}}! 😊 Se precisar de mais alguma coisa, é só me chamar.",
   "Combinado! Qualquer coisa estou por aqui. 💜",
   "Show! Posso ajudar com mais alguma coisa?",
   "Tranquilo! Fico à disposição. Se surgir qualquer dúvida, me chama!",
   "Beleza! Quer ver o menu ou já ficou tudo certo por aqui?"
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_not_understood",
  "label": "Não entendi, repete",
  "phrases": [
   "não entendi",
   "nao entendi",
   "não entendi nada",
   "n entendi",
   "num entendi",
   "pode repetir",
   "pode repetir pfv",
   "repete",
   "repete por favor",
   "fala de novo",
   "explica de novo",
   "explica melhor",
   "explica novamente",
   "como assim",
   "como assim?",
   "hã",
   "hã?",
   "oi? não entendi",
   "não compreendi",
   "nao compreendi",
   "ficou confuso",
   "que confusão",
   "ainda nao entendi",
   "não ficou claro",
   "pode explicar de outro jeito",
   "fala mais simples",
   "em outras palavras",
   "o que você quis dizer",
   "o que vc quis dizer",
   "oq isso significa",
   "nao peguei",
   "não captei",
   "me explica direito",
   "tá confuso isso",
   "explica pra mim com calma",
   "traduz isso pra mim"
  ],
  "keywords": [
   [
    "entendi",
    2
   ],
   [
    "repetir",
    3
   ],
   [
    "repete",
    3
   ],
   [
    "explica",
    2
   ],
   [
    "assim",
    1
   ],
   [
    "confuso",
    2
   ],
   [
    "claro",
    1
   ],
   [
    "novamente",
    1
   ]
  ],
  "replies": [
   "Opa, vou explicar de outro jeito! 😊 Me diz qual parte ficou confusa{{, nome}} e eu detalho melhor.",
   "Sem problemas, às vezes eu me enrolo mesmo! Pode me dizer o que não ficou claro? Explico com outras palavras.",
   "Desculpa se não fui clara. Vamos de novo, com calma: qual ponto você quer que eu repita?",
   "Tudo bem, é para isso que estou aqui! Me fala o que ficou de fora que eu explico de forma mais simples. Se preferir, chamo alguém da equipe."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_wait",
  "label": "Espera um pouco",
  "phrases": [
   "espera um pouco",
   "espera um pouquinho",
   "espera ai",
   "aguarda um momento",
   "aguarde um minuto",
   "um minuto",
   "um minutinho",
   "só um minuto",
   "so um segundo",
   "um segundinho",
   "pera ai",
   "peraí",
   "pera um pouco",
   "já volto",
   "ja volto",
   "ja ja volto",
   "volto já",
   "volto logo",
   "volto em instantes",
   "vou la e volto",
   "preciso sair um instante",
   "um momento por favor",
   "momento",
   "calma ai",
   "calma que já te falo",
   "deixa eu ver aqui",
   "deixa eu pegar o documento",
   "deixa eu procurar",
   "vou buscar aqui e te falo",
   "to procurando aqui",
   "segura ai",
   "aguarda ai que eu volto",
   "me da um tempinho",
   "da um tempo",
   "dá um tempo pfv"
  ],
  "keywords": [
   [
    "espera",
    3
   ],
   [
    "aguarda",
    2
   ],
   [
    "minuto",
    2
   ],
   [
    "volto",
    3
   ],
   [
    "momento",
    2
   ],
   [
    "segundo",
    1
   ],
   [
    "pera",
    2
   ],
   [
    "calma",
    1
   ]
  ],
  "replies": [
   "Claro, sem pressa{{, nome}}! Pode ir com calma. Quando voltar, é só me chamar. 😊",
   "Tranquilo! Fico por aqui esperando. Pode ir lá e volta quando puder. 💜",
   "Sem problemas, tenho todo o tempo do mundo (vantagem de ser robô, rs). Te espero!",
   "Pode ir! Quando estiver pronto, é só mandar mensagem que a gente continua de onde parou."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_wrong_time",
  "label": "Saudação em horário trocado",
  "phrases": [
   "boa noite de manhã",
   "bom dia boa tarde",
   "bom dia ou boa noite sei lá",
   "boa tarde ainda é de manhã",
   "bom dia kkk já é de noite",
   "boa noite bom dia",
   "oi bom dia boa tarde boa noite",
   "bom dia pra quem acorda a essa hora",
   "bom dia na madrugada",
   "boa madrugada",
   "boa madrugada pra vc",
   "bom dia ainda",
   "bom diaa",
   "boa noitee",
   "boa tardee",
   "bom dia a todos",
   "bom dia pessoal",
   "boa noite pessoal",
   "boa tarde pessoal",
   "bom dia moça",
   "boa noite moça",
   "boa tarde moça",
   "bom dia querida",
   "boa noite querida",
   "boa tarde querida",
   "bom diaaa tudo bem",
   "boa noite tudo bem",
   "boa tarde tudo bem?",
   "bom dia, e boa noite se for de noite",
   "dia, tarde ou noite aí",
   "que horas são aí"
  ],
  "keywords": [
   [
    "bom dia",
    2
   ],
   [
    "boa noite",
    2
   ],
   [
    "boa tarde",
    2
   ],
   [
    "madrugada",
    2
   ],
   [
    "boa madrugada",
    2
   ]
  ],
  "replies": [
   "Ótimo dia (ou tarde, ou noite, rs) pra você{{, nome}}! O horário aí pode ser diferente do meu, mas a vontade de ajudar é a mesma. 😄 Como posso ajudar?",
   "{{saudacao}}{{, nome}}! Seja qual for o horário, estou aqui. Em que posso ajudar?",
   "Boa madrugada, bom dia, boa tarde ou boa noite, estou sempre aqui! 💜 O que você precisa?",
   "Oi, {{saudacao}}! Aceito o cumprimento em qualquer horário. Me conta o que posso fazer por você."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_holidays",
  "label": "Datas comemorativas e parabéns",
  "phrases": [
   "feliz natal",
   "feliz natal pra vc",
   "feliz natal pra você e a equipe",
   "feliz ano novo",
   "feliz ano novo pra vcs",
   "próspero ano novo",
   "boas festas",
   "boas festas pra vocês",
   "feliz páscoa",
   "feliz pascoa",
   "feliz páscoa pra vc",
   "parabéns",
   "parabens",
   "parabéns pra vc",
   "parabéns pela empresa",
   "parabéns pelo atendimento",
   "feliz aniversario",
   "feliz aniversário",
   "feliz dia das mães",
   "feliz dia dos pais",
   "feliz dia da mulher",
   "feliz dia do cliente",
   "feliz dia do trabalhador",
   "bom feriado",
   "bom feriadão",
   "feliz carnaval",
   "bom fim de semana",
   "bom final de semana",
   "ótimo fim de semana",
   "feliz sexta",
   "boa semana",
   "feliz segunda",
   "feliz 2027",
   "feliz ano novo bia",
   "feliz natal bia"
  ],
  "keywords": [
   [
    "natal",
    2
   ],
   [
    "ano novo",
    2
   ],
   [
    "pascoa",
    2
   ],
   [
    "parabens",
    2
   ],
   [
    "feriado",
    2
   ],
   [
    "aniversario",
    2
   ],
   [
    "festas",
    2
   ],
   [
    "fim de semana",
    1
   ]
  ],
  "replies": [
   "Que gentileza! 🎉 Pra você também{{, nome}}, muita saúde, paz e coisa boa! Se precisar de algo, estou por aqui.",
   "Ahh, obrigada! Desejo o mesmo pra você e sua família. 💜 Qualquer coisa que precisar, é só chamar.",
   "Que lindo, obrigada pelo carinho! Que seja um ótimo período. Posso ajudar com algo hoje?",
   "Recebi com carinho! 🎊 Tudo de bom pra você também. Se precisar de ajuda com a Develoi, estou aqui."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_emoji_only",
  "label": "Só emoji",
  "phrases": [
   "👍",
   "👍🏽",
   "👍🏻",
   "👌",
   "🙏",
   "🙏🏽",
   "❤️",
   "💜",
   "😂",
   "😂😂",
   "😂😂😂",
   "🤣",
   "🤣🤣",
   "😊",
   "😄",
   "😍",
   "🥰",
   "😎",
   "😉",
   "😅",
   "😁",
   "😀",
   "🙂",
   "🤔",
   "😮",
   "😢",
   "😭",
   "😡",
   "😠",
   "🙄",
   "👏",
   "👏👏",
   "💪",
   "🔥",
   "✅",
   "🤝",
   "😘",
   "kkk 👍",
   "👍 blz",
   "🙏 obrigado"
  ],
  "keywords": [
   [
    "👍",
    2
   ],
   [
    "😂",
    2
   ],
   [
    "❤️",
    2
   ],
   [
    "🙏",
    2
   ],
   [
    "😊",
    1
   ],
   [
    "🤔",
    1
   ]
  ],
  "replies": [
   "😊 Se precisar de algo é só falar! Posso te ajudar com mais alguma coisa{{, nome}}?",
   "Recebi o carinho! 💜 Me conta se precisar de qualquer coisa por aqui.",
   "Opa! 😄 Quer ver as opções do que posso fazer por você?",
   "Entendi pelo emoji, rs! Se quiser algo mais, escreve pra mim com palavras que eu ajudo. 😉",
   "Estou por aqui! Quando quiser falar de fatura, extrato ou dúvidas, é só mandar uma mensagem."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_test_nonsense",
  "label": "Teste e mensagem sem sentido",
  "phrases": [
   "teste",
   "testando",
   "teste teste",
   "testando 1 2 3",
   "teste 123",
   "só testando",
   "to testando",
   "alô",
   "alo",
   "alô alô",
   "alo?",
   "asdf",
   "asdfgh",
   "asdfasdf",
   "qwerty",
   "kkkkk",
   "aaaa",
   "aaaaaa",
   "hmm",
   "hum",
   "...",
   "....",
   "???",
   "?",
   "!",
   "kkkkkkkkkk",
   "ssss",
   "xxx",
   "sdfsdf",
   "jhgjhg",
   "ksksks",
   "blablabla",
   "bla bla",
   "teste de bot",
   "testando bot",
   "qualquer coisa",
   "nada",
   "nao sei",
   "sei la",
   "pqp",
   "uai",
   "eita",
   "humm"
  ],
  "keywords": [
   [
    "teste",
    2
   ],
   [
    "testando",
    2
   ],
   [
    "alo",
    2
   ],
   [
    "asdf",
    2
   ],
   [
    "blabla",
    1
   ],
   [
    "hmm",
    1
   ]
  ],
  "replies": [
   "Recebi sua mensagem, tudo funcionando por aqui! 😄 Me conta o que você precisa{{, nome}}?",
   "Teste recebido com sucesso! 🤖 Se quiser, escolhe uma opção do menu ou me diz o que precisa.",
   "Opa, hoje o teclado atacou? Rs. Não entendi bem, mas estou aqui! Pode escrever o que precisa?",
   "Alô, alô! Estou por aqui. 🙋‍♀️ Fala comigo: é sobre fatura, extrato ou outra dúvida?",
   "Hmm, não consegui captar essa. Sem problemas! Me conta em poucas palavras o que você precisa que eu ajudo."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_who_are_you",
  "label": "Quem é você e o que faz",
  "phrases": [
   "quem é você e o que faz aqui",
   "quem é você e o que você faz",
   "o que vc faz aqui",
   "o que você faz",
   "o que voce faz",
   "pra que você serve",
   "pra que vc serve",
   "para que serve você",
   "qual sua função",
   "qual a sua função",
   "qual seu papel",
   "o que você sabe fazer",
   "o que vc sabe fazer",
   "o que consegue fazer",
   "em que você pode me ajudar",
   "em que vc pode ajudar",
   "com o que vc ajuda",
   "o que posso pedir pra vc",
   "o que posso te perguntar",
   "quem está falando",
   "quem ta falando comigo",
   "quem me atende",
   "com quem estou falando",
   "com quem eu falo",
   "que número é esse",
   "quem mandou mensagem pra mim",
   "por que vc me chamou",
   "pq voces me mandaram msg",
   "quem é esse contato",
   "que empresa é essa",
   "isso é da develoi mesmo"
  ],
  "keywords": [
   [
    "quem",
    2
   ],
   [
    "faz",
    2
   ],
   [
    "serve",
    2
   ],
   [
    "função",
    2
   ],
   [
    "ajudar",
    1
   ],
   [
    "empresa",
    1
   ],
   [
    "atende",
    1
   ]
  ],
  "replies": [
   "Sou a *BiIA*, assistente virtual da *Develoi Soluções Digitais*. Ajudo com *fatura*, *extrato* e dúvidas sobre os sistemas, e chamo a equipe quando precisa. 💜",
   "Prazer, eu sou a *BiIA*! Atendo os clientes da *Develoi* por aqui: faturas, extratos, dúvidas e, se for preciso, chamo uma pessoa da equipe.",
   "Sou a assistente virtual da *Develoi*. Tiro suas dúvidas, mando fatura e extrato e chamo alguém da equipe quando necessário. O que você precisa{{, nome}}?",
   "Aqui é a *BiIA*, da *Develoi Soluções Digitais*, empresa de sistemas. Estou aqui para facilitar o seu atendimento. Quer ver o menu?"
  ],
  "action": "menu",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_can_you_help",
  "label": "Pode me ajudar",
  "phrases": [
   "pode me ajudar",
   "pode me ajudar?",
   "vc pode me ajudar",
   "você pode me ajudar",
   "voce consegue me ajudar",
   "consegue me ajudar",
   "preciso de ajuda",
   "preciso de uma ajuda",
   "preciso de ajuda pfv",
   "me ajuda",
   "me ajuda aqui",
   "me ajude por favor",
   "pode me dar uma ajuda",
   "queria uma ajuda",
   "queria ajuda",
   "vc ajuda",
   "tem como me ajudar",
   "alguém pode me ajudar",
   "alguem me ajuda",
   "socorro",
   "ajuda",
   "help",
   "ajudaaa",
   "preciso de um help",
   "pfv me ajuda",
   "poderia me ajudar",
   "será que dá pra me ajudar",
   "vc resolve pra mim",
   "tem como resolver",
   "pode resolver pra mim"
  ],
  "keywords": [
   [
    "ajudar",
    2
   ],
   [
    "ajuda",
    3
   ],
   [
    "help",
    2
   ],
   [
    "socorro",
    1
   ],
   [
    "resolver",
    1
   ]
  ],
  "replies": [
   "Claro que posso{{, nome}}! 😊 Me conta o que você precisa, ou escolhe uma das opções do menu.",
   "Pode contar comigo! Qual é a sua necessidade? Fatura, extrato, dúvida sobre os sistemas?",
   "Com certeza! Estou aqui para isso. Me explica em poucas palavras o que está precisando. 💜",
   "Ajudo sim! Quer escolher uma opção no menu ou prefere me contar o que aconteceu?"
  ],
  "action": "menu",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_have_question",
  "label": "Tenho uma dúvida",
  "phrases": [
   "tenho uma dúvida",
   "tenho uma duvida",
   "tenho duvida",
   "tenho uma pergunta",
   "queria perguntar uma coisa",
   "queria tirar uma dúvida",
   "queria tirar uma duvida",
   "posso fazer uma pergunta",
   "posso perguntar",
   "posso te perguntar uma coisa",
   "uma dúvida",
   "uma duvida",
   "uma pergunta",
   "dúvida",
   "duvida",
   "tô com uma dúvida",
   "to com uma duvida",
   "estou com uma dúvida",
   "preciso tirar uma dúvida",
   "preciso perguntar uma coisa",
   "tenho uma questão",
   "queria saber uma coisa",
   "queria saber",
   "gostaria de saber",
   "gostaria de perguntar",
   "tenho uma duvida pfv",
   "vc pode tirar uma dúvida",
   "pode tirar uma duvida minha",
   "uma coisinha só",
   "pergunta rapida",
   "tem como perguntar uma coisa"
  ],
  "keywords": [
   [
    "dúvida",
    3
   ],
   [
    "duvida",
    3
   ],
   [
    "pergunta",
    2
   ],
   [
    "perguntar",
    2
   ],
   [
    "saber",
    1
   ],
   [
    "questão",
    1
   ]
  ],
  "replies": [
   "Claro, pode perguntar{{, nome}}! 😊 Qual é a sua dúvida?",
   "Manda ver! Qual a dúvida? Se eu não souber, chamo alguém da equipe.",
   "Estou ouvindo! Me conta qual é a sua dúvida, de preferência com detalhes. 💜",
   "Pode falar! Pergunta pra mim que eu tento ajudar. E se for algo mais complicado, chamo uma pessoa da equipe."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_urgent",
  "label": "Preciso falar urgente",
  "phrases": [
   "preciso falar urgente",
   "preciso falar urgentemente",
   "é urgente",
   "e urgente",
   "urgente",
   "urgentíssimo",
   "é muito urgente",
   "tenho urgência",
   "tenho uma urgencia",
   "isso é urgente",
   "caso urgente",
   "é uma emergência",
   "emergência",
   "emergencia",
   "preciso de ajuda urgente",
   "preciso de atendimento urgente",
   "preciso resolver agora",
   "preciso resolver hoje",
   "preciso pra agora",
   "é pra ontem",
   "urgente por favor",
   "urge",
   "não pode esperar",
   "nao pode esperar",
   "tá parado aqui urgente",
   "estou com um problema grave",
   "meu sistema parou urgente",
   "preciso falar com alguém agora",
   "urgenteee",
   "pfv é urgente"
  ],
  "keywords": [
   [
    "urgente",
    3
   ],
   [
    "urgência",
    2
   ],
   [
    "urgencia",
    2
   ],
   [
    "emergencia",
    3
   ],
   [
    "agora",
    1
   ],
   [
    "grave",
    1
   ]
  ],
  "replies": [
   "Entendi, é urgente! Vou chamar alguém da equipe agora mesmo{{, nome}}. Pode adiantar o que aconteceu enquanto isso? 🚨",
   "Anotado: *urgente*. Estou acionando uma pessoa da equipe da *Develoi* para te atender. Se puder, já escreva o que precisa.",
   "Calma, vou te passar para a equipe agora. Pode ir contando o que está acontecendo para agilizar. 💜",
   "Urgência recebida! Já estou chamando um atendente da *Develoi*. Fica comigo, e conta o problema em uma frase."
  ],
  "action": "handoff:Suporte",
  "priority": 1,
  "system": null
 },
 {
  "id": "chat_feedback_positive",
  "label": "Elogio ao atendimento",
  "phrases": [
   "atendimento nota 10",
   "atendimento nota dez",
   "nota 10 pra vc",
   "nota 10",
   "nota mil",
   "atendimento excelente",
   "atendimento ótimo",
   "atendimento otimo",
   "atendimento maravilhoso",
   "adorei o atendimento",
   "amei o atendimento",
   "gostei do atendimento",
   "gostei muito do atendimento",
   "gostei muito de falar com vc",
   "vcs são ótimos",
   "vocês são demais",
   "vc é demais",
   "vocês são top",
   "vcs são top",
   "parabéns pelo atendimento",
   "muito bom o atendimento",
   "atendimento rápido, gostei",
   "resolveu rapidinho",
   "resolveu tudo, valeu",
   "gostei de ser atendido por vc",
   "melhor atendimento",
   "melhor atendimento que ja tive",
   "atendimento show",
   "vou recomendar vocês",
   "vou indicar vcs",
   "sistema bom e atendimento melhor ainda",
   "muito bom, obrigado pelo atendimento"
  ],
  "keywords": [
   [
    "nota 10",
    3
   ],
   [
    "excelente",
    2
   ],
   [
    "adorei",
    2
   ],
   [
    "amei",
    2
   ],
   [
    "gostei",
    2
   ],
   [
    "recomendar",
    2
   ],
   [
    "atendimento",
    1
   ],
   [
    "otimo",
    1
   ]
  ],
  "replies": [
   "Ahh, que alegria ler isso{{, nome}}! 🥰 Vou repassar o elogio para a equipe da *Develoi*. Obrigada pelo carinho!",
   "Fiquei feliz demais, obrigada! 💜 Fico contente de ter ajudado. Qualquer coisa, é só chamar.",
   "Nossa, você me deixou até corada (se robô corasse, rs)! 😄 Obrigada pelo reconhecimento, é um prazer atender você.",
   "Obrigada pelo feedback{{, nome}}! A equipe da *Develoi* vai adorar saber. Se precisar de mais alguma coisa, estou aqui."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_feedback_negative",
  "label": "Reclamação do atendimento",
  "phrases": [
   "não gostei do atendimento",
   "nao gostei",
   "não gostei disso",
   "nao gostei do bot",
   "atendimento ruim",
   "atendimento péssimo",
   "atendimento pessimo",
   "péssimo atendimento",
   "pessimo",
   "atendimento horrível",
   "atendimento fraco",
   "muito ruim isso",
   "isso ta ruim",
   "tá ruim esse atendimento",
   "ta ruim demais",
   "vcs deixam a desejar",
   "deixou a desejar",
   "não resolveu nada",
   "nao resolveu meu problema",
   "vc não ajudou",
   "vc nao ajudou em nada",
   "não adiantou nada",
   "nao adiantou",
   "isso não funciona",
   "esse bot não funciona",
   "bot que não resolve nada",
   "decepcionado com o atendimento",
   "fiquei decepcionado",
   "estou insatisfeito",
   "insatisfeito",
   "quero reclamar",
   "quero fazer uma reclamação",
   "tenho uma reclamação",
   "reclamação",
   "me atenderam mal",
   "fui mal atendido"
  ],
  "keywords": [
   [
    "nao gostei",
    3
   ],
   [
    "ruim",
    2
   ],
   [
    "pessimo",
    3
   ],
   [
    "reclamar",
    3
   ],
   [
    "reclamacao",
    3
   ],
   [
    "decepcionado",
    2
   ],
   [
    "insatisfeito",
    2
   ],
   [
    "nao resolveu",
    2
   ]
  ],
  "replies": [
   "Sinto muito por isso{{, nome}}. Seu feedback é importante. Me conta o que aconteceu, ou se preferir, chamo uma pessoa da equipe para te atender melhor.",
   "Poxa, desculpa por não ter sido uma boa experiência. 💜 Quer me contar o que deu errado? Também posso chamar alguém da equipe da *Develoi*.",
   "Obrigada por ser sincero. Quero melhorar! Explica o que não funcionou, que eu tento resolver, ou chamo um atendente humano se for melhor.",
   "Lamento mesmo que não tenha sido como esperava. Pode me dizer o que houve? Se preferir falar com uma pessoa, é só pedir."
  ],
  "action": "reply",
  "priority": 1,
  "system": null
 },
 {
  "id": "chat_data_safety",
  "label": "Segurança dos dados",
  "phrases": [
   "meus dados estão seguros",
   "meus dados estao seguros",
   "vocês guardam meus dados",
   "vcs guardam meus dados",
   "voces guardam minhas informações",
   "o que vocês fazem com meus dados",
   "o que vcs fazem com meus dados",
   "onde ficam meus dados",
   "meus dados são protegidos",
   "meus dados ficam salvos",
   "isso é seguro",
   "é seguro passar meus dados aqui",
   "posso passar meu cpf aqui",
   "posso mandar meu cpf",
   "é seguro mandar meu cpf",
   "posso confiar em vocês",
   "vou passar meus dados, é seguro",
   "vcs vendem meus dados",
   "vocês compartilham meus dados",
   "quem tem acesso aos meus dados",
   "vcs seguem a lgpd",
   "lgpd",
   "privacidade",
   "politica de privacidade",
   "tenho medo de golpe",
   "isso é golpe",
   "é golpe",
   "vcs são confiáveis",
   "isso aqui é confiavel",
   "como vcs protegem minhas informações"
  ],
  "keywords": [
   [
    "dados",
    2
   ],
   [
    "seguro",
    2
   ],
   [
    "seguros",
    2
   ],
   [
    "lgpd",
    2
   ],
   [
    "privacidade",
    2
   ],
   [
    "golpe",
    2
   ],
   [
    "confiavel",
    1
   ],
   [
    "cpf",
    1
   ]
  ],
  "replies": [
   "Entendo a preocupação{{, nome}}, e é bom perguntar! Eu só uso suas informações para te atender aqui. Para detalhes sobre tratamento de dados, posso chamar alguém da equipe da *Develoi*.",
   "Boa pergunta! Uso seus dados apenas para o atendimento. Sobre como são guardados e protegidos, o ideal é falar com a equipe da *Develoi*, e posso chamar agora, se quiser. 💜",
   "Fica à vontade para perguntar! Eu atendo só o necessário. Para detalhes técnicos sobre armazenamento e privacidade, a equipe da *Develoi* é quem pode te responder com precisão.",
   "Sua dúvida faz todo sentido. Prefiro não prometer o que não sei: posso chamar uma pessoa da equipe para explicar direitinho como os dados são tratados."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 },
 {
  "id": "chat_english",
  "label": "Falar em inglês ou outro idioma",
  "phrases": [
   "hello",
   "hi",
   "hi there",
   "hey",
   "hey there",
   "good morning",
   "good afternoon",
   "good evening",
   "how are you",
   "can you help me",
   "i need help",
   "do you speak english",
   "speak english",
   "you speak english",
   "english please",
   "in english please",
   "can we talk in english",
   "i want to speak english",
   "quero falar em inglês",
   "quero falar em ingles",
   "vc fala inglês",
   "você fala inglês",
   "voce fala ingles",
   "fala inglês",
   "tem atendimento em inglês",
   "atendimento em ingles",
   "hablas español",
   "habla español",
   "hola",
   "hola, necesito ayuda",
   "puedo hablar en español",
   "parlez vous francais",
   "sprechen sie deutsch",
   "i dont speak portuguese",
   "no speak portuguese",
   "what is this"
  ],
  "keywords": [
   [
    "english",
    3
   ],
   [
    "inglês",
    3
   ],
   [
    "ingles",
    3
   ],
   [
    "español",
    2
   ],
   [
    "hello",
    2
   ],
   [
    "hola",
    2
   ],
   [
    "help",
    1
   ],
   [
    "speak",
    2
   ]
  ],
  "replies": [
   "Oi! 😊 Eu atendo em *português*, mas vou fazer o meu melhor para te ajudar. Pode escrever o que precisa de forma simples?",
   "Hi! I'm *BiIA*, the Develoi virtual assistant. Eu só consigo atender direito em português, mas posso chamar alguém da equipe se precisar. 💜",
   "Desculpa, meu inglês é limitado. 🙈 Eu atendo em português{{, nome}}, mas se escrever o que precisa com poucas palavras eu tento entender!",
   "Olá! Sou a *BiIA*, e meu atendimento é em português. Se preferir, posso chamar uma pessoa da equipe da *Develoi* para ajudar você."
  ],
  "action": "reply",
  "priority": 0,
  "system": null
 }
] as unknown as IntentDef[];
