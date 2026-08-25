import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import nodeCrypto from "crypto";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { blogController } from "./src/backend/blogController.js";
import { casesController } from "./src/backend/casesController.js";
import { botController } from "./src/backend/botController.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = path.join(__dirname, "db.json");

function hashPassword(password: string): string {
  return nodeCrypto.createHash("sha256").update(password).digest("hex");
}

async function migrateFromJson() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) return; // Already migrated

    if (await fs.access(DB_PATH).then(() => true).catch(() => false)) {
      console.log("Migrating data from db.json to MySQL...");
      const data = JSON.parse(await fs.readFile(DB_PATH, "utf-8"));

      // Migrate Users
      for (const u of (data.users || [])) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {},
          create: {
            uid: u.uid,
            displayName: u.displayName,
            email: u.email,
            passwordHash: u.passwordHash,
            role: u.role,
            photoURL: u.photoURL,
            active: u.active !== false,
            createdAt: new Date(u.createdAt || Date.now()),
            token: u.token
          }
        });
      }

      // Migrate Projects
      for (const p of (data.projects || [])) {
        await prisma.project.create({
          data: {
            id: p.id,
            name: p.name,
            description: p.description || "",
            status: p.status || "active",
            clientName: p.clientName || "",
            category: p.category,
            progress: p.progress || 0,
            deadline: p.deadline ? new Date(p.deadline) : null,
            visibility: p.visibility || "public",
            allowedUsers: p.allowedUsers || [],
            goals: p.goals || [],
            financials: p.financials,
            history: p.history,
            createdAt: new Date(p.createdAt || Date.now())
          }
        });
      }

      // Migrate Features
      for (const f of (data.features || [])) {
        await prisma.feature.create({
          data: {
            id: f.id,
            key: f.key,
            projectId: f.projectId,
            title: f.title,
            description: f.description || "",
            status: f.status || "todo",
            priority: f.priority || "medium",
            category: f.category,
            assignedTo: f.assignedTo,
            type: f.type || "task",
            tags: f.tags || [],
            createdAt: new Date(f.createdAt || Date.now())
          }
        });
      }

      // Migrate SiteValues
      if (data.siteValues) {
        await prisma.siteValues.upsert({
          where: { id: 1 },
          update: data.siteValues,
          create: { id: 1, ...data.siteValues }
        });
      }

      // Migrate Team
      for (const m of (data.team || [])) {
        await prisma.teamMember.create({ data: m });
      }

      // Migrate Portfolio
      for (const p of (data.portfolio || [])) {
        await prisma.portfolioItem.create({ data: p });
      }

      console.log("Migration completed successfully!");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const isDev = process.env.NODE_ENV !== "production";

  try {
    await prisma.$connect();
    console.log("Connected to MySQL");
    await migrateFromJson();

    // ─── Auth ──────────────────────────────────────────────────────────────────
    app.post("/api/auth/login", async (req, res) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && user.passwordHash === hashPassword(password)) {
        const token = nodeCrypto.randomBytes(32).toString("hex");
        await prisma.user.update({ where: { uid: user.uid }, data: { token } });
        const { passwordHash, ...userWithoutPass } = user;
        res.json({ ...userWithoutPass, token });
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    });

    app.get("/api/auth/me", async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Não autorizado" });
      const token = authHeader.split(" ")[1];
      const user = await prisma.user.findFirst({ where: { token } });
      if (user) {
        const { passwordHash, ...userWithoutPass } = user;
        res.json(userWithoutPass);
      } else {
        res.status(401).json({ error: "Token inválido" });
      }
    });

    app.patch("/api/auth/me", async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Não autorizado" });
      const token = authHeader.split(" ")[1];
      const user = await prisma.user.findFirst({ where: { token } });
      if (!user) return res.status(401).json({ error: "Token inválido" });
      const { displayName, photoURL, bio } = req.body;
      const updated = await prisma.user.update({
        where: { uid: user.uid },
        data: {
          displayName: displayName ?? user.displayName,
          photoURL: photoURL ?? null,
          bio: bio ?? null,
        },
      });
      const { passwordHash, ...userWithoutPass } = updated;
      res.json(userWithoutPass);
    });

    app.post("/api/auth/change-password", async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Não autorizado" });
      const token = authHeader.split(" ")[1];
      const user = await prisma.user.findFirst({ where: { token } });
      if (!user) return res.status(401).json({ error: "Token inválido" });
      const { currentPassword, newPassword } = req.body;
      if (user.passwordHash !== hashPassword(currentPassword)) {
        return res.status(400).json({ error: "Senha atual incorreta" });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "A nova senha deve ter ao menos 6 caracteres" });
      }
      await prisma.user.update({
        where: { uid: user.uid },
        data: { passwordHash: hashPassword(newPassword) },
      });
      res.json({ ok: true });
    });

    // ─── Users Management ───────────────────────────────────────────────────────
    app.get("/api/users", async (req, res) => {
      const users = await prisma.user.findMany({
        select: { uid: true, displayName: true, email: true, role: true, photoURL: true, active: true, createdAt: true }
      });
      res.json(users);
    });

    app.post("/api/users", async (req, res) => {
      const { displayName, email, password, role } = req.body;
      try {
        const user = await prisma.user.create({
          data: {
            displayName,
            email,
            passwordHash: hashPassword(password || "123456"),
            role: role || "viewer"
          }
        });
        const { passwordHash, ...userWithoutPass } = user;
        res.json(userWithoutPass);
      } catch (e) {
        res.status(400).json({ error: "Erro ao criar usuário" });
      }
    });

    app.delete("/api/users/:uid", async (req, res) => {
      await prisma.user.delete({ where: { uid: req.params.uid } });
      res.json({ success: true });
    });

    app.patch("/api/users/:uid", async (req, res) => {
      const { displayName, email, role, password } = req.body;
      try {
        const data: Record<string, string> = {};
        if (displayName) data.displayName = displayName;
        if (email)       data.email       = email;
        if (role)        data.role        = role;
        if (password)    data.passwordHash = hashPassword(password);
        const user = await prisma.user.update({ where: { uid: req.params.uid }, data });
        const { passwordHash, ...userWithoutPass } = user as any;
        res.json(userWithoutPass);
      } catch (e) {
        res.status(400).json({ error: "Erro ao atualizar usuário" });
      }
    });

    // ─── Projects ───────────────────────────────────────────────────────────────
    app.get("/api/projects", async (req, res) => {
      try {
        const { userId, isAdmin } = req.query;
        const projects = await prisma.project.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
            _count: { select: { images: true } },
          },
        });
        const withGallery = projects.map(({ images, _count, ...p }) => ({
          ...p,
          previewImage: images[0]?.url ?? null,
          imageCount: _count.images,
        }));
        const filtered = isAdmin === 'true' ? withGallery : withGallery.filter(p => {
          if (p.visibility === 'public') return true;
          const allowed = p.allowedUsers as string[] | null;
          return allowed?.includes(userId as string);
        });
        res.json(filtered);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/projects", async (req, res) => {
      try {
        const project = await prisma.project.create({
          data: { ...req.body, deadline: req.body.deadline ? new Date(req.body.deadline) : null }
        });
        res.json(project);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/projects/:id", async (req, res) => {
      try {
        const project = await prisma.project.update({
          where: { id: req.params.id },
          data: { ...req.body, deadline: req.body.deadline ? new Date(req.body.deadline) : undefined }
        });
        res.json(project);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/projects/:id", async (req, res) => {
      try {
        await prisma.project.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Project Images (galeria, máx. 8 por projeto) ────────────────────────────
    const MAX_PROJECT_IMAGES = 8;

    app.get("/api/projects/:projectId/images", async (req, res) => {
      try {
        const images = await prisma.projectImage.findMany({
          where: { projectId: req.params.projectId },
          orderBy: { order: 'asc' },
        });
        res.json(images);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/projects/:projectId/images", async (req, res) => {
      try {
        const { url, caption } = req.body;
        if (!url) return res.status(400).json({ error: "Imagem obrigatória" });
        const count = await prisma.projectImage.count({ where: { projectId: req.params.projectId } });
        if (count >= MAX_PROJECT_IMAGES) {
          return res.status(400).json({ error: `Limite de ${MAX_PROJECT_IMAGES} imagens por projeto` });
        }
        const image = await prisma.projectImage.create({
          data: { projectId: req.params.projectId, url, caption: caption || null, order: count },
        });
        res.json(image);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/projects/:projectId/images/:id", async (req, res) => {
      try {
        const { caption } = req.body;
        const image = await prisma.projectImage.update({
          where: { id: req.params.id },
          data: { caption: caption ?? null },
        });
        res.json(image);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/projects/:projectId/images/:id", async (req, res) => {
      try {
        await prisma.projectImage.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Features ───────────────────────────────────────────────────────────────
    // Lista features de vários projetos de uma vez (usado na Visão Geral, cross-projeto)
    app.get("/api/features", async (req, res) => {
      try {
        const projectIds = String(req.query.projectIds || "").split(",").filter(Boolean);
        if (projectIds.length === 0) return res.json([]);
        const features = await prisma.feature.findMany({ where: { projectId: { in: projectIds } } });
        res.json(features);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.get("/api/projects/:projectId/features", async (req, res) => {
      try {
        const features = await prisma.feature.findMany({ where: { projectId: req.params.projectId } });
        res.json(features);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // Sanitiza campos do feature antes de passar ao Prisma
    const sanitizeFeature = (body: any) => {
      const allowed = [
        'id','key','projectId','sprintId','title','description','status','priority','category',
        'assignedTo','type','tags','points','deadline','activities','testCases','testEvidence',
        'testObservations','reporter','functionalArea','acceptanceCriteria','functionalRequirements',
        'businessRules','linkedDemandId','linkedDemandTitle','createdAt',
      ];
      const clean: any = {};
      for (const k of allowed) { if (k in body) clean[k] = body[k]; }
      if (clean.deadline) {
        const parsed = new Date(clean.deadline);
        clean.deadline = isNaN(parsed.getTime()) ? null : parsed;
      }
      return clean;
    };

    const STATUS_LABELS: Record<string, string> = {
      todo: 'A Fazer', 'in-progress': 'Em Desenvolvimento', review: 'Em Revisão', testing: 'Em Teste', done: 'Concluído',
    };

    // Registra uma entrada automática de atividade (mudança de status/atribuição) no histórico do ticket.
    async function logFeatureActivity(featureId: string, text: string, actorId?: string, actorName?: string) {
      await prisma.featureComment.create({
        data: { featureId, type: 'activity', text, authorId: actorId || null, authorName: actorName || 'Sistema' },
      });
    }

    app.post("/api/projects/:projectId/features", async (req, res) => {
      try {
        const { actorId, actorName, ...rest } = req.body;
        const body = sanitizeFeature({ ...rest, projectId: req.params.projectId });
        const feature = await prisma.feature.create({ data: body });
        await logFeatureActivity(feature.id, `criou o ticket`, actorId, actorName);
        res.json(feature);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/projects/:projectId/features/:id", async (req, res) => {
      try {
        const { actorId, actorName, ...rest } = req.body;
        const before = await prisma.feature.findUnique({ where: { id: req.params.id } });
        const body = sanitizeFeature(rest);
        const feature = await prisma.feature.update({ where: { id: req.params.id }, data: body });

        if (before) {
          if ('status' in body && body.status !== before.status) {
            await logFeatureActivity(
              feature.id,
              `moveu de "${STATUS_LABELS[before.status] ?? before.status}" para "${STATUS_LABELS[body.status] ?? body.status}"`,
              actorId, actorName
            );
          }
          if ('assignedTo' in body && body.assignedTo !== before.assignedTo) {
            await logFeatureActivity(
              feature.id,
              body.assignedTo ? `atribuiu para ${body.assignedTo}` : `removeu a atribuição`,
              actorId, actorName
            );
          }
        }
        res.json(feature);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Feature Comments (comentários + linha do tempo de atividade) ────────────
    app.get("/api/projects/:projectId/features/:id/comments", async (req, res) => {
      try {
        const comments = await prisma.featureComment.findMany({
          where: { featureId: req.params.id },
          orderBy: { createdAt: 'asc' },
        });
        res.json(comments);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/projects/:projectId/features/:id/comments", async (req, res) => {
      try {
        const { text, authorId, authorName } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: "Comentário vazio" });
        const comment = await prisma.featureComment.create({
          data: { featureId: req.params.id, type: 'comment', text: text.trim(), authorId, authorName },
        });
        res.json(comment);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/projects/:projectId/features/:id/comments/:commentId", async (req, res) => {
      try {
        await prisma.featureComment.delete({ where: { id: req.params.commentId } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/projects/:projectId/features/:id", async (req, res) => {
      try {
        await prisma.feature.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Sprints ────────────────────────────────────────────────────────────────
    app.get("/api/projects/:projectId/sprints", async (req, res) => {
      try {
        const sprints = await prisma.sprint.findMany({
          where: { projectId: req.params.projectId },
          orderBy: { createdAt: 'desc' }
        });
        res.json(sprints);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/projects/:projectId/sprints", async (req, res) => {
      try {
        const sprint = await prisma.sprint.create({
          data: {
            ...req.body,
            projectId: req.params.projectId,
            startDate: req.body.startDate ? new Date(req.body.startDate) : null,
            endDate: req.body.endDate ? new Date(req.body.endDate) : null
          }
        });
        res.json(sprint);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/projects/:projectId/sprints/:id", async (req, res) => {
      try {
        const sprint = await prisma.sprint.update({
          where: { id: req.params.id },
          data: {
            ...req.body,
            startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
            endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
          }
        });
        res.json(sprint);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/projects/:projectId/sprints/:id", async (req, res) => {
      try {
        await prisma.feature.updateMany({ where: { sprintId: req.params.id }, data: { sprintId: null } });
        await prisma.sprint.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/projects/:projectId/sprints/:id/start", async (req, res) => {
      try {
        const sprint = await prisma.sprint.update({
          where: { id: req.params.id },
          data: { status: 'active', startDate: new Date() }
        });
        res.json(sprint);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/projects/:projectId/sprints/:id/finish", async (req, res) => {
      const sprint = await prisma.sprint.update({
        where: { id: req.params.id },
        data: { status: 'completed', endDate: new Date() }
      });
      // Move incomplete tasks to backlog
      await prisma.feature.updateMany({
        where: { sprintId: req.params.id, NOT: { status: 'done' } },
        data: { sprintId: null }
      });
      res.json(sprint);
    });

    // ─── Site Management ────────────────────────────────────────────────────────
    app.get("/api/site/values", async (req, res) => {
      const values = await prisma.siteValues.findFirst({ where: { id: 1 } });
      res.json(values || { mission: '', vision: '', values: [] });
    });

    app.put("/api/site/values", async (req, res) => {
      const values = await prisma.siteValues.upsert({
        where: { id: 1 },
        update: req.body,
        create: { id: 1, ...req.body }
      });
      res.json(values);
    });

    app.get("/api/site/team", async (req, res) => {
      const team = await prisma.teamMember.findMany({ where: { isPublic: true }, orderBy: { order: 'asc' } });
      res.json(team);
    });

    app.get("/api/admin/team", async (req, res) => {
      const team = await prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
      res.json(team);
    });

    app.post("/api/site/team", async (req, res) => {
      const member = await prisma.teamMember.create({ data: req.body });
      res.json(member);
    });

    app.patch("/api/site/team/:id", async (req, res) => {
      const member = await prisma.teamMember.update({ where: { id: req.params.id }, data: req.body });
      res.json(member);
    });

    app.delete("/api/site/team/:id", async (req, res) => {
      await prisma.teamMember.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    });

    // ─── Blog Público ───────────────────────────────────────────────────────────
    app.get("/api/blog/posts", blogController.listPublicPosts);
    app.get("/api/blog/posts/featured", blogController.getFeaturedPosts);
    app.get("/api/blog/posts/:slug", blogController.getPublicPost);
    app.post("/api/blog/posts/:id/view", blogController.registerView);
    app.get("/api/blog/categories", blogController.listPublicCategories);
    app.post("/api/blog/subscribe", blogController.subscribe);

    // ─── Blog Admin ─────────────────────────────────────────────────────────────
    app.get("/api/admin/blog/posts", blogController.listAdminPosts);
    app.post("/api/admin/blog/posts", blogController.createPost);
    app.get("/api/admin/blog/posts/:id", blogController.getAdminPost);
    app.put("/api/admin/blog/posts/:id", blogController.updatePost);
    app.delete("/api/admin/blog/posts/:id", blogController.deletePost);
    app.patch("/api/admin/blog/posts/:id/publish", blogController.publishPost);
    app.patch("/api/admin/blog/posts/:id/archive", blogController.archivePost);
    app.get("/api/admin/blog/categories", blogController.listAdminCategories);
    app.post("/api/admin/blog/categories", blogController.createCategory);
    app.put("/api/admin/blog/categories/:id", blogController.updateCategory);
    app.delete("/api/admin/blog/categories/:id", blogController.deleteCategory);
    app.get("/api/admin/blog/authors", blogController.listAuthors);
    app.post("/api/admin/blog/authors", blogController.createAuthor);
    app.put("/api/admin/blog/authors/:id", blogController.updateAuthor);
    app.delete("/api/admin/blog/authors/:id", blogController.deleteAuthor);
    app.get("/api/admin/blog/subscribers", blogController.listSubscribers);
    app.delete("/api/admin/blog/subscribers/:id", blogController.deleteSubscriber);
    app.get("/api/admin/blog/stats", blogController.getStats);
    app.get("/api/admin/blog/analytics", blogController.getAnalytics);

    // ─── Cases Público ──────────────────────────────────────────────────────────
    app.get("/api/cases", casesController.listPublicCases);
    app.get("/api/cases/featured", casesController.getFeaturedCases);
    app.get("/api/cases-categories", casesController.listPublicCategories);
    app.get("/api/cases/:slug", casesController.getPublicCase);
    app.post("/api/cases/:id/view", casesController.registerView);
    app.post("/api/cases/:id/like", casesController.registerLike);

    // ─── Cases Admin ────────────────────────────────────────────────────────────
    app.get("/api/admin/cases", casesController.listAdminCases);
    app.post("/api/admin/cases", casesController.createCase);
    app.get("/api/admin/cases/stats", casesController.getStats);
    app.get("/api/admin/cases/:id", casesController.getAdminCase);
    app.put("/api/admin/cases/:id", casesController.updateCase);
    app.delete("/api/admin/cases/:id", casesController.deleteCase);
    app.patch("/api/admin/cases/:id/publish", casesController.publishCase);
    app.patch("/api/admin/cases/:id/archive", casesController.archiveCase);
    app.get("/api/admin/cases-categories", casesController.listAdminCategories);
    app.post("/api/admin/cases-categories", casesController.createCategory);
    app.put("/api/admin/cases-categories/:id", casesController.updateCategory);
    app.delete("/api/admin/cases-categories/:id", casesController.deleteCategory);

    // ─── Bot WhatsApp Admin ─────────────────────────────────────────────────────
    app.get("/api/admin/bot/sectors", botController.getSectors);
    app.post("/api/admin/bot/sectors", botController.saveSector);
    app.delete("/api/admin/bot/sectors/:id", botController.deleteSector);
    
    app.get("/api/admin/bot/flow", botController.getFlowNodes);
    app.post("/api/admin/bot/flow", botController.saveFlowNodes);
    
    app.get("/api/admin/bot/conversations", botController.getConversations);
    app.post("/api/admin/bot/conversations/message", botController.sendMessage);
    app.post("/api/admin/bot/conversations/:id/close", botController.closeConversation);

    app.get("/api/admin/bot/instance", botController.getInstance);
    app.post("/api/admin/bot/connect", botController.connect);
    app.post("/api/admin/bot/disconnect", botController.disconnect);
    app.get("/api/admin/bot/status", botController.status);
    app.get("/api/admin/bot/config", botController.getBotConfig);
    app.put("/api/admin/bot/config", botController.updateBotConfig);

    // ─── Social Media Automation (Instagram) ────────────────────────────────────
    app.post("/api/admin/social/instagram/publish", async (req, res) => {
      try {
        const { imageBase64, caption } = req.body;
        const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
        const IG_USER_ID = process.env.INSTAGRAM_USER_ID;

        if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
          console.log("Simulating Instagram Publish. Keys not found in .env.");
          return res.json({ success: true, id: "ig_" + Date.now(), simulated: true });
        }

        /* 
          // 1. Fazer upload do imageBase64 para um storage público (S3, Firebase, etc)
          // const publicImageUrl = await uploadToStorage(imageBase64);
          
          // 2. Criar container de mídia
          const createMediaRes = await fetch(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media?image_url=${publicImageUrl}&caption=${encodeURIComponent(caption)}&access_token=${IG_ACCESS_TOKEN}`, { method: 'POST' });
          const mediaData = await createMediaRes.json();
          
          // 3. Publicar
          const publishRes = await fetch(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish?creation_id=${mediaData.id}&access_token=${IG_ACCESS_TOKEN}`, { method: 'POST' });
          const publishData = await publishRes.json();
        */
        
        res.json({ success: true, id: "ig_" + Date.now() });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Falha na automação do Instagram" });
      }
    });

    // ─── Products ──────────────────────────────────────────────────────────────
    app.get("/api/products", async (req, res) => {
      try {
        const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(products);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/products", async (req, res) => {
      try {
        const product = await prisma.product.create({ data: req.body });
        res.json(product);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/products/:id", async (req, res) => {
      try {
        const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
        res.json(product);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/products/:id", async (req, res) => {
      try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Sales ─────────────────────────────────────────────────────────────────
    app.get("/api/sales", async (req, res) => {
      try {
        const sales = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(sales);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // Cria o Client vinculado a uma venda "won", se ainda não existir.
    async function ensureClientForWonSale(saleId: string) {
      const sale = await prisma.sale.findUnique({ where: { id: saleId } });
      if (!sale || sale.status !== 'won') return;

      const existing = await prisma.client.findFirst({ where: { saleId: sale.id } });
      if (existing) return;

      await prisma.client.create({
        data: {
          name: sale.clientName,
          email: sale.clientEmail,
          phone: sale.clientPhone,
          saleId: sale.id,
          billingValue: sale.value,
          soldById: sale.soldById,
          soldByName: sale.soldByName,
        }
      });
    }

    app.post("/api/sales", async (req, res) => {
      try {
        const sale = await prisma.sale.create({
          data: { ...req.body, closedAt: req.body.closedAt ? new Date(req.body.closedAt) : null }
        });
        if (sale.status === 'won') await ensureClientForWonSale(sale.id);
        res.json(sale);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/sales/:id", async (req, res) => {
      try {
        const sale = await prisma.sale.update({
          where: { id: req.params.id },
          data: { ...req.body, closedAt: req.body.closedAt ? new Date(req.body.closedAt) : undefined }
        });
        if (sale.status === 'won') await ensureClientForWonSale(sale.id);
        res.json(sale);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/sales/:id", async (req, res) => {
      try {
        await prisma.sale.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/sales/:id/convert-to-client", async (req, res) => {
      try {
        const sale = await prisma.sale.findUnique({ where: { id: req.params.id } });
        if (!sale) return res.status(404).json({ error: "Venda não encontrada" });

        const existing = await prisma.client.findFirst({ where: { saleId: sale.id } });
        if (existing) return res.status(409).json({ error: "Esta venda já foi convertida em cliente", client: existing });

        const client = await prisma.client.create({
          data: {
            name: sale.clientName,
            email: sale.clientEmail,
            phone: sale.clientPhone,
            saleId: sale.id,
            billingValue: sale.value,
            soldById: sale.soldById,
            soldByName: sale.soldByName,
          }
        });
        res.json(client);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Clients ───────────────────────────────────────────────────────────────

    // Calcula a próxima data de vencimento a partir de um dia-do-mês fixo,
    // avançando ciclo(s) inteiros a partir de `from` até cair no futuro.
    function computeNextDueDate(dueDay: number, billingCycle: string, from: Date): Date {
      const clampDay = (year: number, month: number) => {
        const lastDay = new Date(year, month + 1, 0).getDate();
        return Math.min(dueDay, lastDay);
      };
      let year = from.getFullYear();
      let month = from.getMonth();
      let candidate = new Date(year, month, clampDay(year, month));
      const stepMonths = billingCycle === 'yearly' ? 12 : 1; // custom/one_time tratados como mensal p/ rollover
      while (candidate <= from) {
        month += stepMonths;
        year += Math.floor(month / 12);
        month = month % 12;
        candidate = new Date(year, month, clampDay(year, month));
      }
      return candidate;
    }

    // Avança nextDueDate de clientes ativos cujo vencimento já passou, com base em dueDay.
    async function rolloverOverdueClients() {
      const now = new Date();
      const candidates = await prisma.client.findMany({
        where: {
          status: 'active',
          dueDay: { not: null },
          nextDueDate: { lt: now },
        },
      });
      for (const c of candidates) {
        const newDate = computeNextDueDate(c.dueDay as number, c.billingCycle, c.nextDueDate as Date);
        await prisma.client.update({ where: { id: c.id }, data: { nextDueDate: newDate } });
      }
    }

    app.get("/api/clients", async (req, res) => {
      try {
        await rolloverOverdueClients();
        const clients = await prisma.client.findMany({
          orderBy: { createdAt: 'desc' },
          include: { projects: { include: { project: { select: { id: true, name: true } } } } },
        });
        res.json(clients);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/clients", async (req, res) => {
      try {
        const { projects, ...data } = req.body;
        const dueDay = data.dueDay ? Number(data.dueDay) : null;
        const nextDueDate = data.nextDueDate
          ? new Date(data.nextDueDate)
          : dueDay
            ? computeNextDueDate(dueDay, data.billingCycle ?? 'monthly', new Date(Date.now() - 86400000))
            : null;
        const client = await prisma.client.create({
          data: {
            ...data,
            dueDay,
            birthDate: data.birthDate ? new Date(data.birthDate) : null,
            nextDueDate,
          }
        });
        res.json(client);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/clients/:id", async (req, res) => {
      try {
        const { projects, ...data } = req.body;
        const dueDay = 'dueDay' in data ? (data.dueDay ? Number(data.dueDay) : null) : undefined;

        let nextDueDate: Date | null | undefined = data.nextDueDate ? new Date(data.nextDueDate) : undefined;
        // Se o dia de vencimento mudou e nenhuma data explícita foi enviada, recalcula.
        if (nextDueDate === undefined && dueDay !== undefined && dueDay !== null) {
          const current = await prisma.client.findUnique({ where: { id: req.params.id } });
          if (current && current.dueDay !== dueDay) {
            const cycle = data.billingCycle ?? current.billingCycle;
            nextDueDate = computeNextDueDate(dueDay, cycle, new Date(Date.now() - 86400000));
          }
        }

        const client = await prisma.client.update({
          where: { id: req.params.id },
          data: {
            ...data,
            dueDay,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            nextDueDate,
          }
        });
        res.json(client);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/clients/:id", async (req, res) => {
      try {
        await prisma.client.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/clients/:id/projects", async (req, res) => {
      try {
        const { projectId } = req.body;
        const link = await prisma.clientProject.create({
          data: { clientId: req.params.id, projectId },
          include: { project: { select: { id: true, name: true } } },
        });
        res.json(link);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/clients/:id/projects/:projectId", async (req, res) => {
      try {
        await prisma.clientProject.delete({
          where: { clientId_projectId: { clientId: req.params.id, projectId: req.params.projectId } }
        });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Ready Messages ────────────────────────────────────────────────────────
    app.get("/api/ready-messages", async (req, res) => {
      try {
        const { userId } = req.query;
        const messages = await prisma.readyMessage.findMany({
          where: userId ? { OR: [{ isDefault: true }, { userId: userId as string }] } : { isDefault: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });
        res.json(messages);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/ready-messages", async (req, res) => {
      try {
        const message = await prisma.readyMessage.create({ data: req.body });
        res.json(message);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/ready-messages/:id", async (req, res) => {
      try {
        const message = await prisma.readyMessage.update({ where: { id: req.params.id }, data: req.body });
        res.json(message);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/ready-messages/:id", async (req, res) => {
      try {
        await prisma.readyMessage.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Client Contacts ───────────────────────────────────────────────────────
    app.get("/api/client-contacts", async (req, res) => {
      try {
        const { userId } = req.query;
        const where = userId ? { userId: userId as string } : {};
        const contacts = await prisma.clientContact.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json(contacts);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/client-contacts", async (req, res) => {
      try {
      const { userId, clientPhone, clientPhone2 } = req.body;
      if (userId && clientPhone) {
        const phoneCleaned = clientPhone.replace(/\D/g, '');
        const existing = await prisma.clientContact.findMany({ where: { userId } });
        const duplicate = existing.find(c => {
          const p1 = (c.clientPhone ?? '').replace(/\D/g, '');
          const p2 = (c.clientPhone2 ?? '').replace(/\D/g, '');
          return p1 === phoneCleaned || p2 === phoneCleaned;
        });
        if (duplicate) {
          return res.status(409).json({
            error: 'duplicate',
            message: `Este número já está cadastrado como "${duplicate.establishmentName ?? duplicate.clientName}"`,
            existing: duplicate,
          });
        }
      }
      const contact = await prisma.clientContact.create({
        data: {
          ...req.body,
          scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
          lastContactAt: req.body.lastContactAt ? new Date(req.body.lastContactAt) : null,
        }
      });
      res.json(contact);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/client-contacts/:id", async (req, res) => {
      try {
        const contact = await prisma.clientContact.update({
          where: { id: req.params.id },
          data: {
            ...req.body,
            scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
            lastContactAt: req.body.lastContactAt ? new Date(req.body.lastContactAt) : undefined,
          }
        });
        res.json(contact);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/client-contacts/:id", async (req, res) => {
      try {
        await prisma.clientContact.delete({ where: { id: req.params.id } });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Serving ────────────────────────────────────────────────────────────────
    if (isDev) {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    }

    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
