import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), "contacts.json");

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json());

    // Ensure contacts.json exists
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify([]));
    }

    // API Routes
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    app.post("/api/contact", async (req, res) => {
      const { name, email, message } = req.body;
      try {
        const data = await fs.readFile(DB_PATH, "utf-8");
        const contacts = JSON.parse(data);
        contacts.push({
          id: Date.now(),
          name,
          email,
          message,
          created_at: new Date().toISOString(),
        });
        await fs.writeFile(DB_PATH, JSON.stringify(contacts, null, 2));
        res.json({ success: true, message: "Mensagem enviada com sucesso!" });
      } catch (error) {
        console.error("Storage error:", error);
        res.status(500).json({ success: false, message: "Erro ao enviar mensagem." });
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting Vite in middleware mode...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached.");
    } else {
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
