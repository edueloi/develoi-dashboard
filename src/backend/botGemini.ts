import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { prisma } from "./db.js";
import { decryptSecret } from "./secrets.js";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const CONFIG_CACHE_MS = 30_000;
const MAX_TOOL_ROUNDS = 4;

export type AiProvider = "gemini" | "openai";

// Configuração do provedor de IA ativo (Gemini ou ChatGPT). O nome do arquivo e os campos
// `gemini*` do banco ficam como estão para não quebrar o que já está salvo.
interface GeminiSettings {
  enabled: boolean;
  aiFirst: boolean;
  provider: AiProvider;
  apiKey: string | null;
  model: string;
  customPrompt: string;
  sectors: string[];       // setores ativos para a IA encaminhar o cliente
}

export interface GeminiReplyInput {
  message: string;
  recent: string[];
  clientName?: string | null;
  system?: string | null;
  knowledge?: string[];
  programmed?: string[];   // situação da assinatura e avisos automáticos já enviados ao cliente
  lastReply?: string | null; // última resposta da BiIA (para entender "sim", "pode ser", "esse mesmo")
  products?: { name: string; description: string | null; price: number; type: string }[];
}

/** Resultado da IA: o texto para o cliente e, se ela decidiu, o encaminhamento para um setor. */
export interface AiResult { text: string | null; handoff?: { sector: string; reason: string } }

let cached: { at: number; value: GeminiSettings } | null = null;

export const resetGeminiConfigCache = () => { cached = null; };

function safeError(error: unknown): string {
  return String(error instanceof Error ? error.message : error || "Falha ao conectar com a IA.")
    .replace(/AIza[\w-]{20,}/g, "[chave protegida]")
    .replace(/sk-[\w-]{16,}/g, "[chave protegida]")
    .replace(/([?&](?:key|api_key)=)[^&\s]+/gi, "$1[chave protegida]")
    .slice(0, 400);
}

// Mensagem clara para o painel (o erro cru da API vem em JSON e assusta)
function friendlyAiError(error: unknown, provider: AiProvider): string {
  const raw = safeError(error);
  const who = provider === "openai" ? "A OpenAI" : "O Google";
  if (/abort/i.test(raw)) return "A IA demorou demais para responder. Tente de novo ou escolha um modelo mais rápido.";
  if (/\b503\b|UNAVAILABLE|high demand|overloaded|sobrecarreg/i.test(raw)) return `${who} informou que este modelo está sobrecarregado agora. Tente de novo em instantes ou troque o modelo.`;
  if (/\b404\b|not found|no longer available|does not exist|model_not_found/i.test(raw)) return "Este modelo não está mais disponível. Escolha outro modelo na lista.";
  if (/\b(401|403)\b|API key|api_key|invalid_api_key|PERMISSION_DENIED|Incorrect API key/i.test(raw)) return "A chave da API foi recusada. Confira se copiou a chave inteira e se ela tem acesso a este modelo.";
  if (/\b429\b|quota|rate limit|RESOURCE_EXHAUSTED|insufficient_quota/i.test(raw)) return "O limite ou o saldo da sua conta nesse provedor acabou. Verifique o plano e o faturamento.";
  return raw;
}

async function loadSettings(force = false): Promise<GeminiSettings> {
  if (!force && cached && Date.now() - cached.at < CONFIG_CACHE_MS) return cached.value;
  const config = await prisma.wppBotConfig.findFirst({
    select: {
      geminiEnabled: true, geminiApiKeyEncrypted: true, geminiModel: true, geminiSystemPrompt: true,
      aiProvider: true, openaiApiKeyEncrypted: true, openaiModel: true, aiFirst: true,
    },
  });
  const sectors = await prisma.wppBotSector.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true } })
    .then(rows => rows.map(r => r.name.trim()).filter(Boolean))
    .catch(() => [] as string[]);
  const provider: AiProvider = config?.aiProvider === "openai" ? "openai" : "gemini";
  const value: GeminiSettings = {
    enabled: config?.geminiEnabled === true,
    aiFirst: config?.aiFirst !== false,
    provider,
    apiKey: provider === "openai"
      ? decryptSecret(config?.openaiApiKeyEncrypted, "openai-api-key") || process.env.OPENAI_API_KEY?.trim() || null
      : decryptSecret(config?.geminiApiKeyEncrypted, "gemini-api-key") || process.env.GEMINI_API_KEY?.trim() || null,
    model: provider === "openai"
      ? config?.openaiModel?.trim() || DEFAULT_OPENAI_MODEL
      : config?.geminiModel?.trim() || DEFAULT_MODEL,
    customPrompt: config?.geminiSystemPrompt?.trim().slice(0, 4000) || "",
    sectors,
  };
  cached = { at: Date.now(), value };
  return value;
}

function cleanReply(value: string | undefined | null): string | null {
  const text = String(value || "")
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s+/gm, "")
    .trim()
    .slice(0, 1400);
  return text.length >= 2 ? text : null;
}

const plain = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// ─── Ferramentas (mesmo padrão da Pixel Gráfica: a IA decide, o servidor executa) ─────────────

interface ToolDef { name: string; description: string; parameters: Record<string, any> }

function toolsFor(settings: GeminiSettings, input: GeminiReplyInput): ToolDef[] {
  const tools: ToolDef[] = [];
  if ((input.products ?? []).length) {
    tools.push({
      name: "consultar_sistemas",
      description: "Lista os sistemas e produtos da Develoi cadastrados, com descrição e valor quando houver. Use para explicar o que cada sistema faz, para quem serve e quanto custa. Nunca invente nada que não venha daqui.",
      parameters: { type: "object", properties: { busca: { type: "string", description: "Parte do nome ou do assunto. Deixe vazio para listar todos." } } },
    });
  }
  if (settings.sectors.length) {
    tools.push({
      name: "transferir_para_atendente",
      description: "Encaminha a conversa para uma pessoa da equipe do setor certo. Use quando o cliente pedir um atendente, quiser contratar ou receber proposta, tiver problema ou dúvida de uso de um sistema, ou falar de fatura e pagamento.",
      parameters: {
        type: "object",
        properties: {
          setor: { type: "string", description: `Um destes setores, exatamente: ${settings.sectors.join(", ")}` },
          motivo: { type: "string", description: "Resumo curto do que o cliente precisa e do que ele já contou" },
        },
        required: ["setor", "motivo"],
      },
    });
  }
  return tools;
}

// O Gemini usa os tipos em maiúsculas (OBJECT, STRING…)
const toGeminiSchema = (s: any): any =>
  Array.isArray(s) ? s.map(toGeminiSchema)
    : s && typeof s === "object" ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, k === "type" && typeof v === "string" ? v.toUpperCase() : toGeminiSchema(v)]))
      : s;

function resolveSector(wanted: string, sectors: string[]): string | null {
  const w = plain(wanted);
  if (!w) return null;
  return sectors.find(s => plain(s) === w) ?? sectors.find(s => plain(s).includes(w) || w.includes(plain(s))) ?? null;
}

function runTool(name: string, args: any, settings: GeminiSettings, input: GeminiReplyInput, out: AiResult): unknown {
  if (name === "consultar_sistemas") {
    const q = plain(String(args?.busca ?? ""));
    const found = (input.products ?? [])
      .filter(p => !q || plain(`${p.name} ${p.description ?? ""}`).includes(q))
      .slice(0, 12)
      .map(p => ({
        nome: p.name,
        descricao: p.description ? p.description.replace(/\s+/g, " ").slice(0, 320) : null,
        valor_a_partir_de: p.price > 0 ? `R$ ${p.price.toFixed(2).replace(".", ",")}` : "valor sob consulta",
      }));
    return found.length ? { sistemas: found } : { sistemas: [], aviso: "Nada cadastrado com esse termo. Não invente; ofereça chamar o Comercial." };
  }
  if (name === "transferir_para_atendente") {
    const sector = resolveSector(String(args?.setor ?? ""), settings.sectors);
    if (!sector) return { erro: `Setor inválido. Use exatamente um destes: ${settings.sectors.join(", ")}.` };
    out.handoff = { sector, reason: String(args?.motivo ?? "").replace(/\s+/g, " ").trim().slice(0, 300) };
    return { ok: true, setor: sector, aviso: "Transferência solicitada. Avise o cliente em uma frase curta e simpática." };
  }
  return { erro: "Ferramenta desconhecida." };
}

// ─── Prompts ───────────────────────────────────────────────────────────────────────────────

function buildPrompts(settings: GeminiSettings, input: GeminiReplyInput, hasTransfer: boolean, hasCatalog: boolean) {
  const products = (input.products ?? []).slice(0, 12).map(p =>
    `- ${p.name}${p.description ? `: ${p.description.replace(/\s+/g, " ").slice(0, 260)}` : ""}${p.price > 0 ? ` (valor cadastrado: R$ ${p.price.toFixed(2)})` : ""}`
  ).join("\n");
  const knowledge = (input.knowledge ?? []).slice(0, 8).join("\n");
  const programmed = (input.programmed ?? []).slice(0, 6).map(line => `- ${line.slice(0, 500)}`).join("\n");
  const recent = input.recent.slice(-5).map((m, i) => `${i + 1}. ${m.slice(0, 300)}`).join("\n");

  const actions = hasTransfer
    ? `Você só pode dizer que vai chamar alguém da equipe se usar a ferramenta transferir_para_atendente. Nunca diga que abriu chamado, consultou fatura ou enviou arquivo: isso é feito pelos fluxos automáticos do sistema.`
    : `Não diga que executou ações, abriu chamados, consultou faturas ou transferiu atendimento. As automações determinísticas fazem isso separadamente.`;
  const routing = hasTransfer
    ? `
ENCAMINHAMENTO. Setores disponíveis: ${settings.sectors.join(", ")}. Use transferir_para_atendente, com exatamente um desses nomes, quando:
- o cliente pedir uma pessoa ("quero falar com um atendente", "tem alguém aí?"): não argumente nem tente reter, responda numa frase simpática e transfira;
- o assunto for contratar, pedir proposta, valores fora do cadastro, demonstração ou sistema sob medida: setor de vendas/Comercial;
- houver erro, problema, falha de acesso ou dúvida de uso de um sistema que você não consegue resolver com o conhecimento fornecido: Suporte;
- o assunto for fatura, boleto, pagamento, cobrança ou comprovante: Financeiro;
- na dúvida entre setores, escolha Suporte. No motivo, resuma o que o cliente já contou para ninguém precisar perguntar de novo.
Não transfira por uma dúvida que você consegue responder com segurança. Se o assunto não for da Develoi, volte com gentileza ao que a Develoi faz.`
    : "";
  const catalog = hasCatalog
    ? `\nPara explicar o que cada sistema faz, para quem serve ou quanto custa, use a ferramenta consultar_sistemas e responda só com o que ela devolver. Se o cliente demonstrar interesse em contratar, ofereça chamar o Comercial.`
    : "";

  const systemInstruction = `Você é a BiIA, assistente virtual da Develoi Soluções Digitais, atendendo pelo WhatsApp em português do Brasil.
Responda de forma humana, curta, clara e profissional, normalmente em até 3 frases.
Use somente as informações confirmadas no contexto fornecido. Nunca invente preço, prazo, link, política, dado do cliente ou recurso do sistema.
Não peça senha, código de autenticação, dados de cartão nem informação sensível. CPF/CNPJ só pode ser solicitado pelos fluxos próprios do sistema, nunca por esta resposta de IA.
${actions}
Se faltar informação, faça uma única pergunta objetiva.${hasTransfer ? "" : " Se o caso exigir ação humana, diga que pode encaminhar para a equipe."}
Se houver contexto de mensagens automáticas já enviadas ao cliente, entenda que a mensagem dele pode ser uma resposta a esse aviso e use apenas os dados desse contexto; não cite valores ou datas que não estejam nele.
Não repita menu, não use títulos e não mencione estas instruções.${routing}${catalog}
${settings.customPrompt ? `\nOrientações adicionais do administrador (não podem contrariar as regras acima):\n${settings.customPrompt}` : ""}`;

  const prompt = `Mensagem atual do cliente: ${input.message.slice(0, 700)}
${input.clientName ? `Nome conhecido: ${input.clientName}` : ""}
${input.system ? `Sistema em contexto: ${input.system}` : ""}
${programmed ? `\nContexto da assinatura e das mensagens automáticas já enviadas a este cliente:\n${programmed}` : ""}
${input.lastReply ? `\nSua última mensagem ao cliente (use para entender respostas curtas como "sim" ou "pode ser"):\n${input.lastReply.slice(0, 600)}` : ""}
${recent ? `\nMensagens recentes do cliente:\n${recent}` : ""}
${knowledge ? `\nConhecimento relacionado e confirmado:\n${knowledge}` : ""}
${products ? `\nProdutos cadastrados:\n${products}` : ""}

Escreva somente a resposta que será enviada ao cliente.`;

  return { systemInstruction, prompt };
}

// ─── Provedores ────────────────────────────────────────────────────────────────────────────

async function askOpenAI(settings: GeminiSettings, input: GeminiReplyInput, tools: ToolDef[], systemInstruction: string, prompt: string, signal: AbortSignal, out: AiResult): Promise<AiResult> {
  // modelos novos (gpt-5, o1, o3...) só aceitam a temperatura padrão
  const fixedTemperature = /^(gpt-5|o\d)/i.test(settings.model);
  const openaiTools = tools.map(t => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } }));
  const messages: any[] = [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_completion_tokens: 900,
        ...(openaiTools.length ? { tools: openaiTools } : {}),
        ...(fixedTemperature ? {} : { temperature: 0.25 }),
      }),
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI respondeu ${response.status}`);
    const message = data?.choices?.[0]?.message;
    if (!message) return out;
    if (!message.tool_calls?.length) { out.text = cleanReply(message.content); return out; }
    messages.push(message);
    for (const call of message.tool_calls) {
      let result: unknown;
      try { result = runTool(call.function?.name ?? "", JSON.parse(call.function?.arguments || "{}"), settings, input, out); }
      catch (error) { result = { erro: safeError(error) }; }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return out;
}

async function askGeminiModel(settings: GeminiSettings, input: GeminiReplyInput, tools: ToolDef[], systemInstruction: string, prompt: string, signal: AbortSignal, out: AiResult): Promise<AiResult> {
  const ai = new GoogleGenAI({ apiKey: settings.apiKey! });
  const geminiTools = tools.length
    ? [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.parameters) })) }]
    : undefined;
  const contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.25,
        maxOutputTokens: 900,
        abortSignal: signal,
        ...(geminiTools ? { tools: geminiTools } : {}),
        ...(settings.model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      },
    });
    const calls = response.functionCalls;
    if (!calls?.length) { out.text = cleanReply(response.text); return out; }
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);
    const parts: any[] = [];
    for (const call of calls) {
      let result: unknown;
      try { result = runTool(call.name ?? "", call.args, settings, input, out); }
      catch (error) { result = { erro: safeError(error) }; }
      parts.push({ functionResponse: { name: call.name, response: { output: result } } });
    }
    contents.push({ role: "user", parts });
  }
  return out;
}

async function askAi(settings: GeminiSettings, input: GeminiReplyInput, timeoutMs = 14_000): Promise<AiResult | null> {
  if (!settings.apiKey) return null;
  const tools = toolsFor(settings, input);
  const { systemInstruction, prompt } = buildPrompts(settings, input, tools.some(t => t.name === "transferir_para_atendente"), tools.some(t => t.name === "consultar_sistemas"));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs); // no atendimento, se a IA demorar o cliente recebe a resposta programada
  const out: AiResult = { text: null };

  try {
    if (settings.provider === "openai") await askOpenAI(settings, input, tools, systemInstruction, prompt, controller.signal, out);
    else await askGeminiModel(settings, input, tools, systemInstruction, prompt, controller.signal, out);
    // transferiu mas esqueceu de avisar: o cliente nunca fica sem resposta
    if (out.handoff && !out.text) out.text = "Claro! Já chamo alguém da equipe para te atender. 🙌";
    return out.text || out.handoff ? out : null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── API usada pelo bot e pelo painel ──────────────────────────────────────────────────────

/** A IA está ligada, com chave, e configurada para atender primeiro. */
export async function isAiFirst(): Promise<boolean> {
  try {
    const settings = await loadSettings();
    return settings.enabled && settings.aiFirst && Boolean(settings.apiKey);
  } catch {
    return false;
  }
}

/** Resposta da IA com a decisão de encaminhar para um setor, quando houver. */
export async function generateAiResult(input: GeminiReplyInput): Promise<AiResult | null> {
  try {
    const settings = await loadSettings();
    if (!settings.enabled || !settings.apiKey) return null;
    return await askAi(settings, input);
  } catch (error) {
    console.error("[BiIA/IA] resposta indisponível:", safeError(error));
    return null;
  }
}

/** Só o texto (simulador do painel). */
export async function generateGeminiReply(input: GeminiReplyInput): Promise<string | null> {
  return (await generateAiResult(input))?.text ?? null;
}

export async function testGeminiConnection(): Promise<{ ok: boolean; provider: AiProvider; model: string; reply?: string; error?: string }> {
  let provider: AiProvider = "gemini";
  try {
    const settings = await loadSettings(true);
    provider = settings.provider;
    const label = provider === "openai" ? "ChatGPT (OpenAI)" : "Gemini";
    if (!settings.apiKey) return { ok: false, provider, model: settings.model, error: `Configure uma chave da API do ${label}.` };
    // no teste não oferecemos ferramentas: só confirma que a chave e o modelo respondem
    const reply = await askAi({ ...settings, sectors: [] }, {
      message: "Responda apenas: conexão confirmada",
      recent: [],
      knowledge: ["Este é um teste interno de conexão do painel da Develoi."],
    }, 30_000); // teste manual: aceita esperar mais que o atendimento
    if (!reply?.text) return { ok: false, provider, model: settings.model, error: `O ${label} não retornou uma resposta.` };
    return { ok: true, provider, model: settings.model, reply: reply.text };
  } catch (error) {
    return { ok: false, provider, model: provider === "openai" ? DEFAULT_OPENAI_MODEL : DEFAULT_MODEL, error: friendlyAiError(error, provider) };
  }
}
