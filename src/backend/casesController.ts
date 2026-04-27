import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 200);
}

function calcReadTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const casesController = {

  // ── Público ───────────────────────────────────────────────────────────────

  listPublicCases: async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(20, Number(req.query.limit) || 9);
      const skip = (page - 1) * limit;
      const categorySlug = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const where: any = { status: "published" };
      if (categorySlug) {
        const cat = await (prisma as any).caseCategory.findFirst({ where: { slug: categorySlug } });
        if (cat) where.categoryId = cat.id;
      }
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { client: { contains: search } },
          { excerpt: { contains: search } },
        ];
      }

      const [cases, total] = await Promise.all([
        (prisma as any).case.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: "desc" },
          select: {
            id: true, title: true, slug: true, client: true, excerpt: true,
            coverImage: true, featured: true, tags: true, views: true, likes: true,
            readTimeMinutes: true, publishedAt: true, segment: true, services: true,
            category: { select: { id: true, name: true, slug: true, color: true } },
          },
        }),
        (prisma as any).case.count({ where }),
      ]);

      res.json({ cases, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  getFeaturedCases: async (_req: Request, res: Response) => {
    try {
      const cases = await (prisma as any).case.findMany({
        where: { status: "published", featured: true },
        take: 6,
        orderBy: { publishedAt: "desc" },
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      });
      res.json(cases);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  getPublicCase: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const caseItem = await (prisma as any).case.findFirst({
        where: { slug, status: "published" },
        include: { category: true },
      });
      if (!caseItem) return res.status(404).json({ error: "Case não encontrado" });

      const related = await (prisma as any).case.findMany({
        where: {
          status: "published",
          categoryId: caseItem.categoryId,
          id: { not: caseItem.id },
        },
        take: 3,
        orderBy: { publishedAt: "desc" },
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      });

      res.json({ case: caseItem, related });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  registerView: async (req: Request, res: Response) => {
    try {
      await (prisma as any).case.update({
        where: { id: req.params.id },
        data: { views: { increment: 1 } },
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  registerLike: async (req: Request, res: Response) => {
    try {
      const updated = await (prisma as any).case.update({
        where: { id: req.params.id },
        data: { likes: { increment: 1 } },
      });
      res.json({ likes: updated.likes });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  listPublicCategories: async (_req: Request, res: Response) => {
    try {
      const cats = await (prisma as any).caseCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { cases: { where: { status: "published" } } } } },
      });
      res.json(cats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  listAdminCases: async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 20);
      const skip = (page - 1) * limit;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const where: any = {};
      if (status && status !== "all") where.status = status;
      if (search) where.OR = [{ title: { contains: search } }, { client: { contains: search } }];

      const [cases, total] = await Promise.all([
        (prisma as any).case.findMany({
          where, skip, take: limit, orderBy: { updatedAt: "desc" },
          include: { category: { select: { id: true, name: true, color: true } } },
        }),
        (prisma as any).case.count({ where }),
      ]);

      res.json({ cases, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  getAdminCase: async (req: Request, res: Response) => {
    try {
      const caseItem = await (prisma as any).case.findUnique({
        where: { id: req.params.id },
        include: { category: true },
      });
      if (!caseItem) return res.status(404).json({ error: "Case não encontrado" });
      res.json(caseItem);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  createCase: async (req: Request, res: Response) => {
    try {
      const {
        title, client, excerpt, content, coverImage, status = "draft",
        featured = false, categoryId, tags = "[]",
        seoTitle, seoDescription, seoKeywords,
        segment, services, results, challenge, solution,
      } = req.body;

      if (!title || !content) return res.status(400).json({ error: "Título e conteúdo são obrigatórios" });

      let slug = toSlug(title);
      const existing = await (prisma as any).case.findFirst({ where: { slug } });
      if (existing) slug = `${slug}-${Date.now()}`;

      const publishedAt = status === "published" ? new Date() : null;
      const readTimeMinutes = calcReadTime(content);

      const caseItem = await (prisma as any).case.create({
        data: {
          id: randomUUID(), title, slug, client: client || "", excerpt, content,
          coverImage, status, featured, categoryId: categoryId || null,
          tags: typeof tags === "string" ? tags : JSON.stringify(tags),
          seoTitle: seoTitle || null, seoDescription: seoDescription || null,
          seoKeywords: seoKeywords || null, readTimeMinutes, publishedAt,
          segment: segment || null, services: services || null,
          results: results || null, challenge: challenge || null, solution: solution || null,
        },
      });

      res.json(caseItem);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  updateCase: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        title, client, excerpt, content, coverImage, status,
        featured, categoryId, tags, seoTitle, seoDescription, seoKeywords,
        segment, services, results, challenge, solution, publishedAt,
      } = req.body;

      const current = await (prisma as any).case.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ error: "Case não encontrado" });

      const data: any = {};
      if (title !== undefined) {
        data.title = title;
        if (title !== current.title && current.status === "draft") {
          let newSlug = toSlug(title);
          const ex = await (prisma as any).case.findFirst({ where: { slug: newSlug, id: { not: id } } });
          if (ex) newSlug = `${newSlug}-${Date.now()}`;
          data.slug = newSlug;
        }
      }
      if (client !== undefined) data.client = client;
      if (excerpt !== undefined) data.excerpt = excerpt;
      if (content !== undefined) { data.content = content; data.readTimeMinutes = calcReadTime(content); }
      if (coverImage !== undefined) data.coverImage = coverImage;
      if (featured !== undefined) data.featured = featured;
      if (categoryId !== undefined) data.categoryId = categoryId || null;
      if (tags !== undefined) data.tags = typeof tags === "string" ? tags : JSON.stringify(tags);
      if (seoTitle !== undefined) data.seoTitle = seoTitle;
      if (seoDescription !== undefined) data.seoDescription = seoDescription;
      if (seoKeywords !== undefined) data.seoKeywords = seoKeywords;
      if (segment !== undefined) data.segment = segment;
      if (services !== undefined) data.services = services;
      if (results !== undefined) data.results = results;
      if (challenge !== undefined) data.challenge = challenge;
      if (solution !== undefined) data.solution = solution;
      if (status !== undefined) {
        data.status = status;
        if (status === "published" && !current.publishedAt) data.publishedAt = new Date();
      }
      if (publishedAt !== undefined) data.publishedAt = publishedAt ? new Date(publishedAt) : null;

      const updated = await (prisma as any).case.update({ where: { id }, data });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  deleteCase: async (req: Request, res: Response) => {
    try {
      await (prisma as any).case.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  publishCase: async (req: Request, res: Response) => {
    try {
      const caseItem = await (prisma as any).case.findUnique({ where: { id: req.params.id } });
      if (!caseItem) return res.status(404).json({ error: "Case não encontrado" });
      const updated = await (prisma as any).case.update({
        where: { id: req.params.id },
        data: { status: "published", publishedAt: caseItem.publishedAt || new Date() },
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  archiveCase: async (req: Request, res: Response) => {
    try {
      const updated = await (prisma as any).case.update({
        where: { id: req.params.id },
        data: { status: "archived" },
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  // ── Categorias ────────────────────────────────────────────────────────────

  listAdminCategories: async (_req: Request, res: Response) => {
    try {
      const cats = await (prisma as any).caseCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { cases: true } } },
      });
      res.json(cats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  createCategory: async (req: Request, res: Response) => {
    try {
      const { name, color = "#6366f1", isActive = true, sortOrder = 0 } = req.body;
      if (!name) return res.status(400).json({ error: "Nome é obrigatório" });
      let slug = toSlug(name);
      const ex = await (prisma as any).caseCategory.findFirst({ where: { slug } });
      if (ex) slug = `${slug}-${Date.now()}`;
      const cat = await (prisma as any).caseCategory.create({
        data: { id: randomUUID(), name, slug, color, isActive, sortOrder },
      });
      res.json(cat);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  updateCategory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, color, isActive, sortOrder } = req.body;
      const data: any = {};
      if (name !== undefined) { data.name = name; data.slug = toSlug(name); }
      if (color !== undefined) data.color = color;
      if (isActive !== undefined) data.isActive = isActive;
      if (sortOrder !== undefined) data.sortOrder = sortOrder;
      const updated = await (prisma as any).caseCategory.update({ where: { id }, data });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  deleteCategory: async (req: Request, res: Response) => {
    try {
      await (prisma as any).case.updateMany({ where: { categoryId: req.params.id }, data: { categoryId: null } });
      await (prisma as any).caseCategory.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },

  getStats: async (_req: Request, res: Response) => {
    try {
      const [total, published, draft, totalViews, totalLikes, topCases] = await Promise.all([
        (prisma as any).case.count(),
        (prisma as any).case.count({ where: { status: "published" } }),
        (prisma as any).case.count({ where: { status: "draft" } }),
        (prisma as any).case.aggregate({ _sum: { views: true } }),
        (prisma as any).case.aggregate({ _sum: { likes: true } }),
        (prisma as any).case.findMany({
          where: { status: "published" },
          orderBy: { views: "desc" },
          take: 5,
          select: { id: true, title: true, slug: true, client: true, views: true, likes: true, publishedAt: true },
        }),
      ]);
      res.json({
        total, published, draft,
        totalViews: totalViews._sum.views || 0,
        totalLikes: totalLikes._sum.likes || 0,
        topCases,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
};
