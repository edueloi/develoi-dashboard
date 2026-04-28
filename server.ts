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

    // ─── Projects ───────────────────────────────────────────────────────────────
    app.get("/api/projects", async (req, res) => {
      const { userId, isAdmin } = req.query;
      const projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      const filtered = isAdmin === 'true' ? projects : projects.filter(p => {
        if (p.visibility === 'public') return true;
        const allowed = p.allowedUsers as string[] | null;
        return allowed?.includes(userId as string);
      });

      res.json(filtered);
    });

    app.post("/api/projects", async (req, res) => {
      const project = await prisma.project.create({
        data: {
          ...req.body,
          deadline: req.body.deadline ? new Date(req.body.deadline) : null
        }
      });
      res.json(project);
    });

    app.patch("/api/projects/:id", async (req, res) => {
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          deadline: req.body.deadline ? new Date(req.body.deadline) : undefined
        }
      });
      res.json(project);
    });

    app.delete("/api/projects/:id", async (req, res) => {
      await prisma.project.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    });

    // ─── Features ───────────────────────────────────────────────────────────────
    app.get("/api/projects/:projectId/features", async (req, res) => {
      const features = await prisma.feature.findMany({ where: { projectId: req.params.projectId } });
      res.json(features);
    });

    app.post("/api/projects/:projectId/features", async (req, res) => {
      const feature = await prisma.feature.create({ data: { ...req.body, projectId: req.params.projectId } });
      res.json(feature);
    });

    app.patch("/api/projects/:projectId/features/:id", async (req, res) => {
      const feature = await prisma.feature.update({ where: { id: req.params.id }, data: req.body });
      res.json(feature);
    });

    app.delete("/api/projects/:projectId/features/:id", async (req, res) => {
      await prisma.feature.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    });

    // ─── Sprints ────────────────────────────────────────────────────────────────
    app.get("/api/projects/:projectId/sprints", async (req, res) => {
      const sprints = await prisma.sprint.findMany({ 
        where: { projectId: req.params.projectId },
        orderBy: { createdAt: 'desc' }
      });
      res.json(sprints);
    });

    app.post("/api/projects/:projectId/sprints", async (req, res) => {
      const sprint = await prisma.sprint.create({ 
        data: { 
          ...req.body, 
          projectId: req.params.projectId,
          startDate: req.body.startDate ? new Date(req.body.startDate) : null,
          endDate: req.body.endDate ? new Date(req.body.endDate) : null
        } 
      });
      res.json(sprint);
    });

    app.post("/api/projects/:projectId/sprints/:id/start", async (req, res) => {
      await prisma.sprint.updateMany({
        where: { projectId: req.params.projectId, status: 'active' },
        data: { status: 'completed' }
      });
      const sprint = await prisma.sprint.update({
        where: { id: req.params.id },
        data: { status: 'active', startDate: new Date() }
      });
      res.json(sprint);
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
      const team = await prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
      res.json(team);
    });

    app.post("/api/site/team", async (req, res) => {
      const member = await prisma.teamMember.create({ data: req.body });
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
