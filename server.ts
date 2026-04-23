import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import nodeCrypto from "node:crypto";

console.log("SERVER SCRIPT LOADING...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "db.json");

interface DB {
  users: any[];
  projects: any[];
  features: any[];
  messages: any[];
}

function hashPassword(password: string): string {
  return nodeCrypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(uid: string): string {
  return nodeCrypto.createHash("sha256").update(uid + Date.now().toString()).digest("hex");
}

async function readDB(): Promise<DB> {
  try {
    console.log("Reading DB from:", DB_PATH);
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.log("DB not found or unreadable, creating initial DB...");
    const initial: DB = { users: [], projects: [], features: [], messages: [] };
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2));
      console.log("Initial DB created successfully");
    } catch (writeErr) {
      console.error("CRITICAL: Failed to write initial DB:", writeErr);
    }
    return initial;
  }
}

async function writeDB(db: DB) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Failed to write to DB:", err);
  }
}

async function startServer() {
  try {
    const isDev = process.env.NODE_ENV !== "production";
    console.log("Starting server in mode:", isDev ? "development" : "production");
    
    const app = express();
    const PORT = parseInt(process.env.PORT || "3006");

    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    app.use(express.json());

    app.get("/test", (req, res) => {
      res.send("SERVER IS ALIVE");
    });

    // ─── Auth: Login with email + password ───────────────────────────────────
    app.post("/api/auth/login", async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha obrigatórios." });
      }
      const db = await readDB();
      const user = db.users.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (!user || !user.active) {
        return res.status(401).json({ error: "Usuário não encontrado ou inativo." });
      }
      const hash = hashPassword(password);
      if (user.passwordHash !== hash) {
        return res.status(401).json({ error: "Senha incorreta." });
      }
      const token = generateToken(user.uid);
      // Store token in user (simple session)
      const idx = db.users.findIndex((u: any) => u.uid === user.uid);
      db.users[idx].token = token;
      await writeDB(db);
      const { passwordHash: _h, ...safeUser } = db.users[idx];
      return res.json({ success: true, user: safeUser, token });
    });

    // ─── Auth: Validate token ─────────────────────────────────────────────────
    app.get("/api/auth/me", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Não autenticado." });
      }
      const token = auth.slice(7);
      const db = await readDB();
      const user = db.users.find((u: any) => u.token === token);
      if (!user || !user.active) {
        return res.status(401).json({ error: "Token inválido." });
      }
      const { passwordHash: _h, token: _t, ...safeUser } = user;
      return res.json(safeUser);
    });

    // ─── Auth: Create user (admin only) ──────────────────────────────────────
    app.post("/api/auth/users", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Não autenticado." });
      }
      const token = auth.slice(7);
      const db = await readDB();
      const requester = db.users.find((u: any) => u.token === token);
      if (!requester || requester.role !== "admin") {
        return res.status(403).json({ error: "Apenas admins podem criar usuários." });
      }
      const { email, password, displayName, role } = req.body;
      if (!email || !password || !displayName) {
        return res.status(400).json({ error: "Email, senha e nome são obrigatórios." });
      }
      const exists = db.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(409).json({ error: "Email já cadastrado." });
      }
      const newUser = {
        uid: `user-${Date.now()}`,
        displayName,
        email,
        photoURL: null,
        role: role || "developer",
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
        active: true,
      };
      db.users.push(newUser);
      await writeDB(db);
      const { passwordHash: _h, ...safeUser } = newUser;
      return res.json({ success: true, user: safeUser });
    });

    // ─── Auth: List users (admin only) ────────────────────────────────────────
    app.get("/api/auth/users", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado." });
      const token = auth.slice(7);
      const db = await readDB();
      const requester = db.users.find((u: any) => u.token === token);
      if (!requester || requester.role !== "admin") {
        return res.status(403).json({ error: "Apenas admins podem listar usuários." });
      }
      const safeUsers = db.users.map(({ passwordHash: _h, token: _t, ...u }: any) => u);
      return res.json(safeUsers);
    });

    // ─── Auth: Toggle user active (admin only) ────────────────────────────────
    app.patch("/api/auth/users/:uid", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado." });
      const token = auth.slice(7);
      const db = await readDB();
      const requester = db.users.find((u: any) => u.token === token);
      if (!requester || requester.role !== "admin") {
        return res.status(403).json({ error: "Apenas admins podem editar usuários." });
      }
      const { uid } = req.params;
      const idx = db.users.findIndex((u: any) => u.uid === uid);
      if (idx === -1) return res.status(404).json({ error: "Usuário não encontrado." });
      db.users[idx] = { ...db.users[idx], ...req.body };
      await writeDB(db);
      const { passwordHash: _h, token: _t, ...safeUser } = db.users[idx];
      return res.json({ success: true, user: safeUser });
    });

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    // ─── Contact form ─────────────────────────────────────────────────────────
    app.post("/api/contact", async (req, res) => {
      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
      }
      const db = await readDB();
      if (!(db as any).contacts) (db as any).contacts = [];
      (db as any).contacts.push({ name, email, message, createdAt: new Date().toISOString() });
      await writeDB(db as any);
      return res.json({ success: true });
    });

    // ─── Team members (public site) ──────────────────────────────────────────
    app.get("/api/site/team", async (_req, res) => {
      const db = await readDB() as any;
      res.json(db.team || []);
    });

    app.post("/api/site/team", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado." });
      const token = auth.slice(7);
      const db = await readDB() as any;
      const requester = db.users.find((u: any) => u.token === token);
      if (!requester || requester.role !== "admin") return res.status(403).json({ error: "Apenas admins." });
      const member = { id: `team-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
      if (!db.team) db.team = [];
      db.team.push(member);
      await writeDB(db);
      return res.json({ success: true, member });
    });

    app.patch("/api/site/team/:id", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado." });
      const token = auth.slice(7);
      const db = await readDB() as any;
      const requester = db.users.find((u: any) => u.token === token);
      if (!requester || requester.role !== "admin") return res.status(403).json({ error: "Apenas admins." });
      if (!db.team) db.team = [];
      const idx = db.team.findIndex((m: any) => m.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "Membro não encontrado." });
      db.team[idx] = { ...db.team[idx], ...req.body };
      await writeDB(db);
      return res.json({ success: true, member: db.team[idx] });
    });

    app.delete("/api/site/team/:id", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado." });
      const token = auth.slice(7);
      const db = await readDB() as any;
      const requester = db.users.find((u: any) => u.token === token);
      if (!requester || requester.role !== "admin") return res.status(403).json({ error: "Apenas admins." });
      if (!db.team) db.team = [];
      db.team = db.team.filter((m: any) => m.id !== req.params.id);
      await writeDB(db);
      return res.json({ success: true });
    });

    // ─── Values / Mission / Vision (public site) ─────────────────────────────
    app.get("/api/site/values", async (_req, res) => {
      const db = await readDB() as any;
      if (!db.siteValues) {
        return res.json({
          mission: "Ser a maior plataforma de inovação digital do Brasil, transformando sonhos complexos em realidades extraordinárias.",
          vision: "Impactar positivamente 1 milhão de vidas através de nossos ecossistemas digitais e soluções de elite nos próximos 5 anos.",
          values: "Excelência absoluta, transparência total, inovação constante e compromisso inabalável com o sucesso do cliente.",
          cards: [
            { title: "Idealizações", subtitle: "Onde tudo começa", description: "Nossa visão é ser a maior plataforma de inovação digital do Brasil, transformando sonhos complexos em realidades extraordinárias." },
            { title: "Metas", subtitle: "Onde queremos chegar", description: "Impactar positivamente 1 milhão de vidas através de nossos ecossistemas digitais e soluções de elite nos próximos 5 anos." },
            { title: "Valores", subtitle: "O que nos guia", description: "Excelência absoluta, transparência total, inovação constante e compromisso inabalável com o sucesso do cliente." }
          ]
        });
      }
      return res.json(db.siteValues);
    });

    app.put("/api/site/values", async (req, res) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado." });
      const token = auth.slice(7);
      const db = await readDB() as any;
      const requester = db.users.find((u: any) => u.token === token);
      if (!requester || requester.role !== "admin") return res.status(403).json({ error: "Apenas admins." });
      db.siteValues = { ...req.body, updatedAt: new Date().toISOString() };
      await writeDB(db);
      return res.json({ success: true });
    });

    // ─── Portfolio (public projects) ──────────────────────────────────────────
    app.get("/api/site/portfolio", async (_req, res) => {
      const db = await readDB() as any;
      const publicProjects = (db.projects || []).filter((p: any) => p.visibility === "public");
      return res.json(publicProjects);
    });

    // Users
    app.get("/api/users", async (req, res) => {
      const db = await readDB();
      res.json(db.users);
    });

    app.post("/api/users", async (req, res) => {
      const { uid, displayName, email, photoURL, role } = req.body;
      const db = await readDB();
      const index = db.users.findIndex(u => u.uid === uid);
      if (index > -1) {
        db.users[index] = { ...db.users[index], displayName, email, photoURL, role };
      } else {
        db.users.push({ uid, displayName, email, photoURL, role });
      }
      await writeDB(db);
      res.json({ success: true });
    });

    // Projects
    app.get("/api/projects", async (req, res) => {
      const { userId, isAdmin } = req.query;
      const db = await readDB();
      let projects = db.projects;
      
      if (isAdmin !== 'true') {
        projects = projects.filter(p => 
          p.visibility === 'public' || 
          (p.visibility === 'private' && p.allowedUsers?.includes(userId))
        );
      }
      
      res.json(projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    app.post("/api/projects", async (req, res) => {
      const project = { 
        ...req.body, 
        createdAt: new Date().toISOString(),
        progress: 0,
        status: 'active'
      };
      const db = await readDB();
      db.projects.push(project);
      await writeDB(db);
      res.json({ success: true });
    });

    app.patch("/api/projects/:id", async (req, res) => {
      const { id } = req.params;
      const updates = req.body;
      const db = await readDB();
      const index = db.projects.findIndex(p => p.id === id);
      if (index > -1) {
        db.projects[index] = { ...db.projects[index], ...updates };
        await writeDB(db);
      }
      res.json({ success: true });
    });

    app.delete("/api/projects/:id", async (req, res) => {
      const { id } = req.params;
      const db = await readDB();
      db.projects = db.projects.filter(p => p.id !== id);
      db.features = db.features.filter(f => f.projectId !== id);
      db.messages = db.messages.filter(m => m.projectId !== id);
      await writeDB(db);
      res.json({ success: true });
    });

    // Features
    app.get("/api/projects/:projectId/features", async (req, res) => {
      const { projectId } = req.params;
      const db = await readDB();
      res.json(db.features.filter(f => f.projectId === projectId));
    });

    app.post("/api/projects/:projectId/features", async (req, res) => {
      const feature = { ...req.body, createdAt: new Date().toISOString() };
      const db = await readDB();
      db.features.push(feature);
      await writeDB(db);
      res.json({ success: true });
    });

    app.patch("/api/projects/:projectId/features/:id", async (req, res) => {
      const { id } = req.params;
      const updates = req.body;
      const db = await readDB();
      const index = db.features.findIndex(f => f.id === id);
      if (index > -1) {
        db.features[index] = { ...db.features[index], ...updates };
        await writeDB(db);
      }
      res.json({ success: true });
    });

    app.delete("/api/projects/:projectId/features/:id", async (req, res) => {
      const { id } = req.params;
      const db = await readDB();
      db.features = db.features.filter(f => f.id !== id);
      await writeDB(db);
      res.json({ success: true });
    });

    // Messages
    app.get("/api/projects/:projectId/messages", async (req, res) => {
      const { projectId } = req.params;
      const db = await readDB();
      res.json(db.messages.filter(m => m.projectId === projectId));
    });

    app.post("/api/projects/:projectId/messages", async (req, res) => {
      const message = { ...req.body, createdAt: new Date().toISOString() };
      const db = await readDB();
      db.messages.push(message);
      await writeDB(db);
      res.json({ success: true });
    });

    // Site Values
    app.get("/api/site/values", async (req, res) => {
      const db = await readDB();
      res.json(db.siteValues || { mission: '', vision: '', values: [] });
    });

    app.put("/api/site/values", async (req, res) => {
      const db = await readDB();
      db.siteValues = req.body;
      await writeDB(db);
      res.json({ success: true });
    });

    // Team
    app.get("/api/team", async (req, res) => {
      const db = await readDB();
      res.json(db.team || []);
    });

    app.post("/api/team", async (req, res) => {
      const db = await readDB();
      const member = { ...req.body, id: req.body.id || uuidv4() };
      db.team.push(member);
      await writeDB(db);
      res.json(member);
    });

    app.put("/api/team/:id", async (req, res) => {
      const { id } = req.params;
      const db = await readDB();
      const index = db.team.findIndex(m => m.id === id);
      if (index > -1) {
        db.team[index] = { ...db.team[index], ...req.body };
        await writeDB(db);
      }
      res.json({ success: true });
    });

    app.delete("/api/team/:id", async (req, res) => {
      const { id } = req.params;
      const db = await readDB();
      db.team = db.team.filter(m => m.id !== id);
      await writeDB(db);
      res.json({ success: true });
    });

    // Portfolio
    app.get("/api/portfolio", async (req, res) => {
      const db = await readDB();
      res.json(db.portfolio || []);
    });

    app.post("/api/portfolio", async (req, res) => {
      const db = await readDB();
      const item = { ...req.body, id: req.body.id || uuidv4() };
      db.portfolio.push(item);
      await writeDB(db);
      res.json(item);
    });

    app.delete("/api/portfolio/:id", async (req, res) => {
      const { id } = req.params;
      const db = await readDB();
      db.portfolio = db.portfolio.filter(p => p.id !== id);
      await writeDB(db);
      res.json({ success: true });
    });

    // Users List (for member selection)
    app.get("/api/users", async (req, res) => {
      const db = await readDB();
      res.json(db.users.map(({ passwordHash, token, ...u }) => u));
    });

    if (isDev) {
      console.log("Initializing Vite dev server...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached");
    } else {
      console.log("Serving static files from dist...");
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
