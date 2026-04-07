import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

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
    const isDev = true; // Force dev mode for debugging
    console.log("Starting server in mode:", isDev ? "development" : "production");
    
    const app = express();
    const PORT = 3000;

    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    app.use(express.json());

    app.get("/test", (req, res) => {
      res.send("SERVER IS ALIVE");
    });

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
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
