import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { connectSession, disconnectSession, getSessionInfo, sendMessage as sendWppMessage } from "./baileysManager.js";

const prisma = new PrismaClient();

export const botController = {
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
      const { id, name, menuKey, description, attendants, isActive, sortOrder } = req.body;
      
      const payload = {
        name,
        menuKey: menuKey || String(Date.now()), // Auto-generate se não tiver
        description,
        attendants: attendants ? JSON.stringify(attendants) : "[]",
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
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

  async getConversations(req: Request, res: Response) {
    try {
      const { status } = req.query; 

      const filter: any = {};
      if (status) filter.status = status;

      const conversations = await prisma.wppConversation.findMany({
        where: filter,
        orderBy: { updatedAt: "desc" },
        include: {
          sector: true,
          messages: {
            orderBy: { sentAt: "asc" },
            take: 100 // Últimas 100 mensagens
          }
        }
      });
      res.json(conversations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar conversas." });
    }
  },

  async sendMessage(req: Request, res: Response) {
    try {
      const { conversationId, body } = req.body;

      const conv = await prisma.wppConversation.findUnique({
        where: { id: conversationId }
      });

      if (!conv) {
        return res.status(404).json({ error: "Conversa não encontrada." });
      }

      const msg = await prisma.wppConversationMessage.create({
        data: {
          conversationId,
          fromRole: "attendant",
          body
        }
      });

      await prisma.wppConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      // Dispara a mensagem via baileysManager
      await sendWppMessage(conv.clientPhone, body);

      res.json(msg);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao enviar mensagem." });
    }
  },

  async closeConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const conv = await prisma.wppConversation.findUnique({ where: { id } });

      if (!conv) {
        return res.status(404).json({ error: "Conversa não encontrada." });
      }

      await prisma.wppConversation.update({
        where: { id },
        data: {
          status: "closed",
          closedBy: "attendant",
          closedAt: new Date(),
          updatedAt: new Date()
        }
      });

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
      await connectSession();
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
