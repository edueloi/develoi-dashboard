import { Request, Response } from "express";
import { prisma } from "./db.js";
import { randomUUID } from "crypto";
import { connectSession, disconnectSession, getSessionInfo, sendMessage as sendWppMessage, setClientConversation, acceptWaitingConversation, closeActiveConversation, offerConversation, startConversation, notifyQueueChanged } from "./wa.js";


// ─── Textos padrão do menu (editáveis na tela do bot) ────────────────────────
// {{saudacao}} vira Bom dia / Boa tarde / Boa noite; {{nome}} é o primeiro nome do WhatsApp do cliente.
const DEFAULT_WELCOME =
  "{{saudacao}}, {{nome}}! 👋 Seja bem-vindo(a) à *Develoi Soluções Digitais*.\n\nSou o assistente virtual e estou à disposição para atendê-lo(a). Como posso ajudar? Selecione uma das opções abaixo:";

const DEFAULT_SOLUTIONS =
  "*Conheça as soluções da Develoi* 💼\n\nSomos especialistas em tecnologia para negócios. Entre as nossas soluções:\n\n" +
  "• *Sistemas de gestão sob medida* — vendas, estoque, financeiro e agenda\n" +
  "• *Sites e lojas virtuais* — presença digital profissional\n" +
  "• *Automação e atendimento por WhatsApp* — bots, avisos e cobranças automáticas\n" +
  "• *Painéis e relatórios* — informações claras para decidir melhor\n\n" +
  "Para conhecer valores e receber uma proposta, selecione a opção *Comercial* no menu inicial.\n\nDigite *0* para voltar ao menu inicial.";

const DEFAULT_CLIENT_HELP =
  "*Já sou cliente* 🧾\n\nSelecione abaixo o que deseja. Em seguida vou pedir o *CPF ou CNPJ* do seu cadastro para localizá-lo(a).\n\n" +
  "Se precisar falar com um atendente, digite *0* e escolha o setor desejado no menu inicial.";

const DOC_PROMPT_NODE = "Para localizar o seu cadastro, informe o *CPF ou CNPJ* (somente números).\nSe preferir voltar, digite *0*.";

const DEFAULT_SECTORS = ["Comercial", "Suporte", "Financeiro"];

// Para onde responder: o endereço original do contato (pode ser um ID interno @lid), não "55 + número"
const targetOf = (c: { clientJid?: string | null; clientPhone: string }) => c.clientJid || c.clientPhone;

export const botController = {
  // ── MENU PADRÃO ─────────────────────────────────────────────────────────
  // Monta o fluxo: saudação por horário → 1 Soluções · 2.. setores · última "Já sou cliente".
  async generateDefaultFlow(req: Request, res: Response) {
    try {
      let config = await prisma.wppBotConfig.findFirst();
      if (!config) config = await prisma.wppBotConfig.create({ data: { botEnabled: true } });

      let sectors = await prisma.wppBotSector.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
      if (sectors.length === 0) {
        // primeira configuração: cria setores básicos (os atendentes são cadastrados na tela do bot)
        for (const [i, name] of DEFAULT_SECTORS.entries()) {
          await prisma.wppBotSector.create({ data: { id: randomUUID(), name, menuKey: String(i + 2), attendants: "[]", sortOrder: i, intake: name === "Suporte" ? "support" : "none" } });
        }
        sectors = await prisma.wppBotSector.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
      }

      // "Conhecer nossas soluções": usa os produtos cadastrados, se houver
      let solutions = config.solutionsMsg?.trim() || "";
      if (!solutions) {
        const products = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "asc" }, take: 8 });
        solutions = products.length
          ? "*Conheça as nossas soluções* 💼\n\n" +
            products.map(p => `• *${p.name}*${p.description ? ` — ${p.description.replace(/\s+/g, " ").slice(0, 140)}` : ""}`).join("\n") +
            "\n\nPara conhecer valores e receber uma proposta, selecione a opção *Comercial* no menu inicial.\n\nDigite *0* para voltar ao menu inicial."
          : DEFAULT_SOLUTIONS;
      }
      const clientHelp = config.clientHelpMsg?.trim() || DEFAULT_CLIENT_HELP;
      const welcome = config.menuWelcomeMsg?.trim() || DEFAULT_WELCOME;

      const menuId = randomUUID(), solutionsId = randomUUID(), clientId = randomUUID(), invoiceId = randomUUID(), statementId = randomUUID();
      const sectorNodes = sectors.map(sec => ({ id: randomUUID(), sec }));
      const options = [
        { key: "1", label: "Conhecer nossas soluções", nextNodeId: solutionsId },
        ...sectorNodes.map((n, i) => ({ key: String(i + 2), label: n.sec.name, nextNodeId: n.id })),
        { key: String(sectorNodes.length + 2), label: "Já sou cliente", nextNodeId: clientId },
      ];
      const nodes = [
        { id: menuId, type: "menu", title: "Menu inicial", content: welcome, options: JSON.stringify(options), isStart: true },
        { id: solutionsId, type: "message", title: "Conhecer nossas soluções", content: solutions, options: "[]" },
        ...sectorNodes.map(n => ({ id: n.id, type: "sector", title: n.sec.name, content: "", options: "[]", sectorId: n.sec.id })),
        // Já sou cliente: botões Fatura / Extrato; cada um pede o CPF/CNPJ do cadastro
        {
          id: clientId, type: "menu", title: "Já sou cliente", content: clientHelp,
          options: JSON.stringify([
            { key: "1", label: "Receber fatura", nextNodeId: invoiceId },
            { key: "2", label: "Consultar extrato", nextNodeId: statementId },
          ]),
        },
        { id: invoiceId, type: "client_action", title: "Fatura (CPF/CNPJ)", content: DOC_PROMPT_NODE, options: "[]", inputVar: "invoice" },
        { id: statementId, type: "client_action", title: "Extrato (CPF/CNPJ)", content: DOC_PROMPT_NODE, options: "[]", inputVar: "statement" },
      ];

      await prisma.$transaction(async (tx) => {
        await tx.wppBotFlowNode.deleteMany({});
        await tx.wppBotFlowNode.createMany({
          data: nodes.map((n: any, index) => ({
            id: n.id, type: n.type, title: n.title, content: n.content, options: n.options,
            sectorId: n.sectorId ?? null, inputVar: n.inputVar ?? null, nextNodeId: null, isStart: !!n.isStart, isActive: true, sortOrder: index, posX: 0, posY: 0,
          })),
        });
      });
      res.json({ success: true, nodes: nodes.length, sectors: sectors.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao gerar o menu do bot." });
    }
  },

  // Textos padrão, para preencher os campos quando ainda estão vazios
  getMenuDefaults(_req: Request, res: Response) {
    res.json({ welcome: DEFAULT_WELCOME, solutions: DEFAULT_SOLUTIONS, clientHelp: DEFAULT_CLIENT_HELP });
  },

  // ── SETORES ─────────────────────────────────────────────────────────────
  
  async getSectors(req: Request, res: Response) {
    try {
      const sectors = await prisma.wppBotSector.findMany({
        orderBy: { sortOrder: "asc" }
      });
      res.json(sectors);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar setores." });
    }
  },

  async saveSector(req: Request, res: Response) {
    try {
      const { id, name, menuKey, description, attendants, isActive, sortOrder, intake } = req.body;
      
      const payload = {
        name,
        menuKey: menuKey || String(Date.now()), // Auto-generate se não tiver
        description,
        attendants: attendants ? JSON.stringify(attendants) : "[]",
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        ...(intake !== undefined && { intake: intake === "support" ? "support" : "none" }),
      };

      if (id) {
        const sector = await prisma.wppBotSector.update({
          where: { id },
          data: payload
        });
        return res.json(sector);
      } else {
        const sector = await prisma.wppBotSector.create({
          data: { ...payload, id: randomUUID() }
        });
        return res.json(sector);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar setor." });
    }
  },

  async deleteSector(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.wppBotSector.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao excluir setor." });
    }
  },

  // ── FLUXO (NODES) ───────────────────────────────────────────────────────

  async getFlowNodes(req: Request, res: Response) {
    try {
      const nodes = await prisma.wppBotFlowNode.findMany({
        orderBy: { sortOrder: "asc" }
      });
      res.json(nodes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar nós do fluxo." });
    }
  },

  async saveFlowNodes(req: Request, res: Response) {
    try {
      const { nodes } = req.body;

      await prisma.$transaction(async (tx) => {
        await tx.wppBotFlowNode.deleteMany({});

        if (nodes && nodes.length > 0) {
          const insertData = nodes.map((n: any, index: number) => ({
            id: n.id || randomUUID(),
            type: n.type,
            title: n.title,
            content: n.content,
            options: typeof n.options === 'string' ? n.options : JSON.stringify(n.options || []),
            sectorId: n.sectorId,
            inputVar: n.inputVar,
            nextNodeId: n.nextNodeId,
            isStart: n.isStart || false,
            isActive: n.isActive !== false,
            sortOrder: index,
            posX: Math.round(n.posX || 0),
            posY: Math.round(n.posY || 0)
          }));
          
          await tx.wppBotFlowNode.createMany({ data: insertData });
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar fluxo." });
    }
  },

  // ── CONVERSAS ───────────────────────────────────────────────────────────

  // Lista leve (sem histórico): usada pelo painel para fila / em atendimento / finalizadas
  async getConversations(req: Request, res: Response) {
    try {
      const { status, sectorId, search } = req.query;
      const where: any = {};
      if (status) where.status = { in: String(status).split(",") };
      if (sectorId) where.sectorId = String(sectorId);
      if (search) {
        where.OR = [
          { clientPhone: { contains: String(search) } },
          { clientName: { contains: String(search) } },
        ];
      }
      const rows = await prisma.wppConversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: {
          sector: { select: { id: true, name: true } },
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
        },
      });
      res.json(rows.map(({ messages, ...c }) => ({ ...c, lastMessage: messages[0] ?? null })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar conversas." });
    }
  },

  // Quantas conversas há em cada etapa (números do menu lateral)
  async getConversationCounts(_req: Request, res: Response) {
    try {
      const rows = await prisma.wppConversation.groupBy({ by: ["status"], _count: { _all: true } });
      const out: Record<string, number> = { bot: 0, waiting: 0, active: 0, closed: 0 };
      for (const r of rows) out[r.status] = r._count._all;
      res.json(out);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao contar conversas." });
    }
  },

  async getConversationMessages(req: Request, res: Response) {
    try {
      const messages = await prisma.wppConversationMessage.findMany({
        where: { conversationId: req.params.id },
        orderBy: { sentAt: "asc" },
      });
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar mensagens." });
    }
  },

  // Atendente assume uma conversa da fila pelo painel. Atômico: só um atendente consegue aceitar.
  async acceptConversation(req: Request, res: Response) {
    try {
      const { attendantId, attendantName } = req.body;
      if (!attendantName) return res.status(400).json({ error: "Atendente não informado." });
      const conv = await acceptWaitingConversation(req.params.id, { id: attendantId, name: attendantName });
      if (!conv) {
        return res.status(409).json({ error: "Esta conversa já foi aceita por outro atendente ou foi encerrada." });
      }
      res.json(conv);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao aceitar conversa." });
    }
  },

  // O atendente inicia uma conversa digitando o número do cliente
  async startConversation(req: Request, res: Response) {
    try {
      const { phone, name, message, attendantId, attendantName, sectorId } = req.body ?? {};
      if (!attendantName) return res.status(400).json({ error: "Atendente não informado." });
      const result = await startConversation({ phone: String(phone || ""), name, message: String(message || ""), attendantId, attendantName, sectorId });
      if (!result.ok) return res.status(400).json({ error: result.error });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao iniciar a conversa." });
    }
  },

  // Devolve a conversa para a fila de outro setor
  async transferConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { sectorId, reason, byName } = req.body;
      const sector = await prisma.wppBotSector.findUnique({ where: { id: sectorId } });
      if (!sector) return res.status(404).json({ error: "Setor não encontrado." });
      const before = await prisma.wppConversation.findUnique({ where: { id }, select: { sectorId: true, status: true } });

      const moved = await prisma.wppConversation.updateMany({
        where: { id, status: { in: ["bot", "waiting", "active"] } },
        data: { sectorId, status: "waiting", attendantId: null, attendantName: null, attendantPhone: null, acceptedAt: null, queuedAt: new Date() },
      });
      if (moved.count === 0) return res.status(409).json({ error: "Conversa já encerrada." });

      const conv = await prisma.wppConversation.findUniqueOrThrow({ where: { id }, include: { sector: true } });
      await prisma.wppConversationMessage.create({
        data: {
          conversationId: id,
          fromRole: "system",
          body: `${byName || "Atendente"} transferiu para o setor ${sector.name}${reason ? ` — ${reason}` : ""}.`,
        },
      });
      setClientConversation(targetOf(conv), id, "waiting");
      const moveText = `Estamos transferindo você para o setor *${sector.name}*. Aguarde um momento, por favor.`;
      await sendWppMessage(targetOf(conv), moveText);
      await prisma.wppConversationMessage.create({ data: { conversationId: id, fromRole: "bot", body: moveText.replace(/\*/g, "") } });
      offerConversation(id).catch(e => console.error("Erro ao avisar atendentes:", e));
      if (before?.status === "waiting") notifyQueueChanged(before.sectorId).catch(() => {}); // quem estava atrás sobe na fila
      res.json(conv);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao transferir conversa." });
    }
  },

  async sendMessage(req: Request, res: Response) {
    try {
      const { conversationId, body } = req.body;
      if (!body?.trim()) return res.status(400).json({ error: "Mensagem vazia." });

      const conv = await prisma.wppConversation.findUnique({ where: { id: conversationId } });
      if (!conv) return res.status(404).json({ error: "Conversa não encontrada." });
      if (conv.status !== "active") {
        return res.status(409).json({ error: "Aceite a conversa antes de responder." });
      }

      const sent = await sendWppMessage(targetOf(conv), conv.attendantName ? `*${conv.attendantName}:* ${body}` : body);
      if (!sent) return res.status(503).json({ error: "WhatsApp desconectado. Mensagem não enviada." });

      const msg = await prisma.wppConversationMessage.create({
        data: { conversationId, fromRole: "attendant", body }
      });
      await prisma.wppConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      res.json(msg);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao enviar mensagem." });
    }
  },

  async closeConversation(req: Request, res: Response) {
    try {
      const { closingMessage, byName } = req.body ?? {};
      const conv = await closeActiveConversation(req.params.id, byName || "Atendente", closingMessage);
      if (!conv) return res.status(404).json({ error: "Conversa não encontrada ou já encerrada." });
      // atendente que conversava pelo WhatsApp é avisado de que foi encerrado pelo painel
      if (conv.attendantPhone) {
        await sendWppMessage(conv.attendantPhone, `ℹ️ O atendimento com *${conv.clientName || conv.clientPhone}* foi encerrado pelo painel.`);
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao fechar conversa." });
    }
  },

  // ── GERENCIAMENTO DO BOT E CONFIGS ──────────────────────────────────────

  async getInstance(req: Request, res: Response) {
    try {
      let instance = await prisma.wppInstance.findFirst();
      if (!instance) {
        instance = await prisma.wppInstance.create({
          data: {
            instanceName: "Meu Bot Develoi",
            status: "not_configured"
          }
        });
      }
      res.json(instance);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar instância." });
    }
  },

  async connect(req: Request, res: Response) {
    try {
      // já conectado: não abre outro socket por cima do que está funcionando
      if (getSessionInfo().status !== "connected") await connectSession();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao conectar." });
    }
  },

  async disconnect(req: Request, res: Response) {
    try {
      await disconnectSession();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao desconectar." });
    }
  },

  async status(req: Request, res: Response) {
    try {
      const info = getSessionInfo();
      res.json(info);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar status." });
    }
  },

  async getBotConfig(req: Request, res: Response) {
    try {
      let config = await prisma.wppBotConfig.findFirst();
      if (!config) {
        config = await prisma.wppBotConfig.create({
          data: { botEnabled: true }
        });
      }
      res.json(config);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar configurações." });
    }
  },

  async updateBotConfig(req: Request, res: Response) {
    try {
      const config = await prisma.wppBotConfig.findFirst();
      if (!config) return res.status(404).json({ error: "Config não encontrada" });

      const updated = await prisma.wppBotConfig.update({
        where: { id: config.id },
        data: req.body
      });
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar configurações." });
    }
  }

};
