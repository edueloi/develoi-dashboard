import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import nodeCrypto from "crypto";
import { createServer as createViteServer } from "vite";
import { prisma } from "./src/backend/db.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { blogController } from "./src/backend/blogController.js";
import { casesController } from "./src/backend/casesController.js";
import { botController } from "./src/backend/botController.js";
import { resumeSession, startConversationSweeper } from "./src/backend/wa.js";
import { runBillingNotices, startBillingScheduler } from "./src/backend/billingNotifier.js";
import { registerTeamNoticeRoutes, startTeamNoticeScheduler } from "./src/backend/teamNotifier.js";
import { registerReceivableRoutes } from "./src/backend/receivables.js";
import { registerAsaasRoutes, startAsaasScheduler } from "./src/backend/asaas.js";
import { registerReceiptRoutes, sendThanksAndReceipt } from "./src/backend/receipts.js";
import { registerInvoiceRoutes } from "./src/backend/invoicePage.js";
import { registerBoxsysRoutes, startBoxsysScheduler, syncBoxsysAccess } from "./src/backend/boxsys.js";
import { registerWebhookOutRoutes, startWebhookDispatcher } from "./src/backend/webhooksOut.js";
import { computeNextDueDate, registerClientPayment } from "./src/backend/clientBilling.js";
import { brtTodayUtc } from "./src/backend/time.js";

dotenv.config();
process.env.TZ = "America/Sao_Paulo"; // horário de Brasília, independente do fuso do servidor

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const { userId, isAdmin } = req.query;
        const sprints = await prisma.sprint.findMany({
          where: { projectId: req.params.projectId },
          orderBy: { createdAt: 'desc' }
        });
        const filtered = isAdmin === 'true' ? sprints : sprints.filter(s => {
          const allowed = s.allowedUsers as string[] | null;
          if (!allowed || allowed.length === 0) return true;
          return allowed.includes(userId as string);
        });
        res.json(filtered);
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
    
    app.post("/api/admin/bot/flow/default", botController.generateDefaultFlow);
    app.get("/api/admin/bot/menu-defaults", botController.getMenuDefaults);
    app.get("/api/admin/bot/flow", botController.getFlowNodes);
    app.post("/api/admin/bot/flow", botController.saveFlowNodes);
    
    app.get("/api/admin/bot/conversations", botController.getConversations);
    app.get("/api/admin/bot/conversations/counts", botController.getConversationCounts);
    app.get("/api/admin/bot/conversations/:id/messages", botController.getConversationMessages);
    app.post("/api/admin/bot/conversations/message", botController.sendMessage);
    app.post("/api/admin/bot/conversations/start", botController.startConversation);
    app.post("/api/admin/bot/conversations/:id/accept", botController.acceptConversation);
    app.post("/api/admin/bot/conversations/:id/transfer", botController.transferConversation);
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

    app.post("/api/clients/:id/mark-paid", async (req, res) => {
      try {
        const { sendReceipt, ...input } = req.body ?? {};
        const result = await registerClientPayment(req.params.id, input);
        if (!result) return res.status(404).json({ error: "Cliente não encontrado." });
        // recibo em PDF no WhatsApp do cliente, se pedido
        let receipt: { sent: boolean; error?: string } | undefined;
        if (sendReceipt) {
          try { receipt = { sent: await sendThanksAndReceipt({ clientPaymentId: result.payment.id }, { nextDue: result.client.nextDueDate }) }; }
          catch (e: any) { receipt = { sent: false, error: e.message }; }
        }
        res.json({ ...result.client, receipt });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // Desfaz um recebimento: o vencimento volta para o do ciclo que tinha sido pago
    app.delete("/api/client-payments/:id", async (req, res) => {
      try {
        const payment = await prisma.clientPayment.findUnique({ where: { id: req.params.id } });
        if (!payment) return res.json({ success: true });
        await prisma.clientPayment.delete({ where: { id: payment.id } });
        const previous = await prisma.clientPayment.findFirst({ where: { clientId: payment.clientId }, orderBy: { paidAt: 'desc' } });
        await prisma.client.update({
          where: { id: payment.clientId },
          data: { lastPaidAt: previous?.paidAt ?? null, ...(payment.dueDate ? { nextDueDate: payment.dueDate } : {}) },
        });
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // Recebimentos de um período (YYYY-MM), com o nome do cliente
    app.get("/api/client-payments", async (req, res) => {
      try {
        const month = String(req.query.month || '');
        const where: any = {};
        if (/^\d{4}-\d{2}$/.test(month)) {
          const [y, m] = month.split('-').map(Number);
          where.paidAt = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
        }
        res.json(await prisma.clientPayment.findMany({
          where, orderBy: { paidAt: 'desc' },
          include: { client: { select: { id: true, name: true, phone: true } } },
        }));
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    registerTeamNoticeRoutes(app);
    registerReceivableRoutes(app);
    registerAsaasRoutes(app);
    registerReceiptRoutes(app);
    registerInvoiceRoutes(app);
    registerBoxsysRoutes(app);
    registerWebhookOutRoutes(app);

    // Simula (dryRun=1) ou dispara agora os avisos de cobrança por WhatsApp
    app.post("/api/admin/billing/run", async (req, res) => {
      try {
        res.json(await runBillingNotices({ dryRun: req.query.dryRun === "1" }));
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.get("/api/clients", async (req, res) => {
      try {
        const clients = await prisma.client.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            projects: { include: { project: { select: { id: true, name: true } } } },
            sale: { select: { productName: true, productCategory: true } },
            payments: { orderBy: { paidAt: 'desc' }, take: 12 },
          },
        });
        res.json(clients);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.post("/api/clients", async (req, res) => {
      try {
        const { projects, ...data } = req.body;
        const explicitDay = data.dueDay ? Number(data.dueDay) : null;
        // a data de vencimento escolhida define o dia fixo de cobrança
        const dueDay = explicitDay ?? (data.nextDueDate && (data.billingCycle ?? 'monthly') !== 'one_time' ? new Date(data.nextDueDate).getUTCDate() : null);
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
            startDate: data.startDate ? new Date(data.startDate) : null,
            nextDueDate,
          }
        });
        res.json(client);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/clients/:id", async (req, res) => {
      try {
        const { projects, ...data } = req.body;
        let dueDay: number | null | undefined = 'dueDay' in data ? (data.dueDay ? Number(data.dueDay) : null) : undefined;
        // a data de vencimento escolhida define o dia fixo de cobrança
        if (data.nextDueDate && (data.billingCycle ?? 'monthly') !== 'one_time' && !dueDay) {
          dueDay = new Date(data.nextDueDate).getUTCDate();
        }

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
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            nextDueDate,
          }
        });
        syncBoxsysAccess(client.id).catch(() => {}); // pausar/cancelar/reativar reflete na loja do BoxSys
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

    // ─── Contas a Pagar (Payables) ────────────────────────────────────────────────
    app.get("/api/payables", async (req, res) => {
      try {
        await extendOpenEndedSeries();
        const payables = await prisma.payable.findMany({
          orderBy: { dueDate: 'asc' },
          include: {
            project: { select: { id: true, name: true } },
            payments: { orderBy: { date: 'asc' } },
          },
        });
        res.json(payables);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // Soma `n` meses mantendo o dia (31/01 + 1 mês = 28/02, não 03/03)
    function addMonthsClamped(date: Date, n: number): Date {
      const d = new Date(date.getTime());
      const day = d.getUTCDate();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + n);
      const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      d.setUTCDate(Math.min(day, last));
      return d;
    }

    // Séries "sem prazo" (ex.: aluguel): recurrence = 'monthly' e recurrenceCount = null.
    // Mantém sempre os próximos 12 meses criados, copiando a última conta da série.
    let extendingSeries = false;
    async function extendOpenEndedSeries() {
      if (extendingSeries) return;
      extendingSeries = true;
      try {
        const parents = await prisma.payable.findMany({
          where: { recurrence: 'monthly', recurrenceCount: null, parentId: null, dueDate: { not: null } },
          include: { children: { orderBy: { dueDate: 'desc' }, take: 1 } },
        });
        const horizon = addMonthsClamped(new Date(), 12);
        for (const parent of parents) {
          const last = parent.children[0];
          if (!last?.dueDate || !parent.dueDate) continue;
          const anchor = parent.dueDate;
          const monthsFromAnchor = (last.dueDate.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (last.dueDate.getUTCMonth() - anchor.getUTCMonth());
          const rows: any[] = [];
          for (let i = 1; i <= 240; i++) {
            const due = addMonthsClamped(anchor, monthsFromAnchor + i);
            if (due > horizon) break;
            rows.push({
              description: last.description, type: last.type, projectId: last.projectId, amount: last.amount,
              dueDate: due, notes: last.notes, createdById: last.createdById, createdByName: last.createdByName,
              recurrence: 'none', parentId: parent.id,
              interestRate: last.interestRate, interestPeriod: last.interestPeriod, finePercent: last.finePercent,
            });
          }
          if (rows.length) await prisma.payable.createMany({ data: rows });
        }
      } catch (e) {
        console.error('[contas a pagar] erro ao estender séries:', e);
      } finally { extendingSeries = false; }
    }
    extendOpenEndedSeries();

    // Campos que uma edição pode propagar para as próximas contas da série
    const SERIES_FIELDS = ['description', 'type', 'projectId', 'amount', 'notes', 'interestRate', 'interestPeriod', 'finePercent'];

    // Cria uma conta única, uma série mensal ou um parcelamento.
    //  plan.mode: 'once' (padrão) | 'monthly' (repete N meses, mesmo valor) | 'installments' (divide o total em N parcelas)
    // (aceita também o formato antigo: recurrence = 'monthly' + recurrenceCount)
    app.post("/api/payables", async (req, res) => {
      try {
        const { amountsByMonth, plan, ...body } = req.body;
        const mode: 'once' | 'monthly' | 'installments' =
          plan?.mode ?? (body.recurrence === 'monthly' ? 'monthly' : 'once');
        const base = {
          ...body,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          paidDate: body.paidDate ? new Date(body.paidDate) : null,
        };

        if (mode !== 'once' && base.dueDate instanceof Date) {
          const requested = Number(plan?.count ?? body.recurrenceCount) || 0;
          const openEnded = mode === 'monthly' && requested <= 0; // sem prazo: cria 12 agora e o resto é gerado conforme o tempo passa
          const count = openEnded ? 12 : Math.min(120, Math.max(mode === 'installments' ? 2 : 1, requested || 2));
          const total = Number(body.amount) || 0;

          // parcelas em centavos; a última absorve a diferença do arredondamento
          const cents = Math.round(total * 100);
          const parcelCents = Math.floor(cents / count);
          const amountFor = (i: number) => {
            if (mode === 'installments') return (i === count - 1 ? cents - parcelCents * (count - 1) : parcelCents) / 100;
            return Array.isArray(amountsByMonth) && amountsByMonth[i] != null ? Number(amountsByMonth[i]) || 0 : total;
          };

          const parent = await prisma.payable.create({
            data: { ...base, recurrence: mode, recurrenceCount: openEnded ? null : count, installments: mode === 'installments' ? count : null },
          });
          await prisma.payable.createMany({
            data: Array.from({ length: count }, (_, i) => ({
              description: body.description,
              type: body.type,
              projectId: body.projectId || null,
              amount: amountFor(i),
              dueDate: addMonthsClamped(base.dueDate, i),
              notes: body.notes,
              createdById: body.createdById,
              createdByName: body.createdByName,
              recurrence: 'none',
              installments: mode === 'installments' ? count : null,
              parentId: parent.id,
              interestRate: body.interestRate ?? null,
              interestPeriod: body.interestPeriod ?? null,
              finePercent: body.finePercent ?? null,
            })),
          });
          return res.json({ ...parent, generated: count });
        }

        const payable = await prisma.payable.create({
          data: { ...base, recurrence: 'none' },
          include: { project: { select: { id: true, name: true } } },
        });
        res.json(payable);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ?scope=following aplica a edição também às próximas contas pendentes da mesma série
    app.patch("/api/payables/:id", async (req, res) => {
      try {
        const { dueDate, paidDate, ...rest } = req.body;
        const payable = await prisma.payable.update({
          where: { id: req.params.id },
          data: {
            ...rest,
            dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
            paidDate: paidDate !== undefined ? (paidDate ? new Date(paidDate) : null) : undefined,
          },
          include: { project: { select: { id: true, name: true } } },
        });
        if (rest.amount !== undefined) await recomputePayableStatus(payable.id);

        if (req.query.scope === 'following' && payable.parentId && payable.dueDate) {
          const data: any = {};
          for (const k of SERIES_FIELDS) if (k in rest) data[k] = rest[k];
          const later = await prisma.payable.findMany({
            where: { parentId: payable.parentId, dueDate: { gt: payable.dueDate }, status: 'pending' },
            select: { id: true },
          });
          if (later.length && Object.keys(data).length) {
            await prisma.payable.updateMany({ where: { id: { in: later.map(l => l.id) } }, data });
            if (data.amount !== undefined) for (const l of later) await recomputePayableStatus(l.id);
          }
        }

        const refreshed = await prisma.payable.findUnique({
          where: { id: payable.id },
          include: { project: { select: { id: true, name: true } }, payments: { orderBy: { date: 'asc' } } },
        });
        res.json(refreshed);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ?scope=following → esta e as próximas pendentes · ?scope=series → a série inteira
    app.delete("/api/payables/:id", async (req, res) => {
      try {
        const scope = req.query.scope;
        const target = await prisma.payable.findUnique({ where: { id: req.params.id } });
        if (!target) return res.json({ success: true });

        if (scope === 'series' && target.parentId) {
          await prisma.payable.delete({ where: { id: target.parentId } }); // cascata apaga as filhas
        } else if (scope === 'following' && target.parentId && target.dueDate) {
          await prisma.payable.deleteMany({
            where: { parentId: target.parentId, dueDate: { gte: target.dueDate }, status: 'pending' },
          });
          // a série passa a ter fim: não gerar mais meses
          const left = await prisma.payable.count({ where: { parentId: target.parentId } });
          await prisma.payable.update({ where: { id: target.parentId }, data: { recurrenceCount: left } });
        } else {
          await prisma.payable.delete({ where: { id: req.params.id } });
        }
        res.json({ success: true });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    // ─── Pagamentos de uma conta a pagar ──────────────────────────────────────
    async function recomputePayableStatus(payableId: string) {
      const payable = await prisma.payable.findUnique({ where: { id: payableId }, include: { payments: true } });
      if (!payable) return;
      const paid = payable.payments.reduce((a, p) => a + p.amount, 0);
      const status = paid >= payable.amount && payable.amount > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';
      const lastPaymentDate = payable.payments.length > 0
        ? payable.payments.map(p => p.date).sort((a, b) => b.getTime() - a.getTime())[0]
        : null;
      await prisma.payable.update({
        where: { id: payableId },
        data: { status, paidDate: status === 'paid' ? (lastPaymentDate ?? brtTodayUtc()) : null },
      });
    }

    app.post("/api/payables/:id/payments", async (req, res) => {
      try {
        const payment = await prisma.payablePayment.create({
          data: {
            payableId: req.params.id,
            amount: Number(req.body.amount) || 0,
            date: req.body.date ? new Date(req.body.date) : brtTodayUtc(),
            method: req.body.method || null,
            notes: req.body.notes || null,
          },
        });
        await recomputePayableStatus(req.params.id);
        res.json(payment);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.patch("/api/payments/:id", async (req, res) => {
      try {
        const payment = await prisma.payablePayment.update({
          where: { id: req.params.id },
          data: {
            amount: req.body.amount !== undefined ? Number(req.body.amount) || 0 : undefined,
            date: req.body.date !== undefined ? (req.body.date ? new Date(req.body.date) : null as any) : undefined,
            method: req.body.method !== undefined ? req.body.method : undefined,
            notes: req.body.notes !== undefined ? req.body.notes : undefined,
          },
        });
        await recomputePayableStatus(payment.payableId);
        res.json(payment);
      } catch (e: any) { res.status(500).json({ error: e.message }); }
    });

    app.delete("/api/payments/:id", async (req, res) => {
      try {
        const payment = await prisma.payablePayment.findUnique({ where: { id: req.params.id } });
        await prisma.payablePayment.delete({ where: { id: req.params.id } });
        if (payment) await recomputePayableStatus(payment.payableId);
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

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      startBillingScheduler();
      startTeamNoticeScheduler();
      startAsaasScheduler();
      startWebhookDispatcher();
      startBoxsysScheduler();
      setTimeout(() => { void resumeSession(); }, 3000);
      startConversationSweeper(); // só age quando o WhatsApp roda neste mesmo processo (desenvolvimento)
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
