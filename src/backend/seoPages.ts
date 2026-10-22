import { prisma } from "./db.js";

/**
 * SEO por página: o index.html do SPA tem título/canonical da home. Aqui o servidor troca esses metadados
 * conforme a rota, para o Google ver título, descrição e canonical próprios mesmo antes de rodar o JavaScript.
 */
const BASE = "https://develoi.com.br";

type Meta = { title: string; description: string; noindex?: boolean; jsonLd?: object[] };

const PAGES: Record<string, Meta> = {
  "/sobre": {
    title: "Sobre a Develoi | Fábrica de software em Tatuí - SP",
    description: "Conheça a Develoi, empresa de desenvolvimento de software de Tatuí, SP: nossa missão, como trabalhamos e os produtos que criamos para empresas de todo o Brasil.",
  },
  "/valores": {
    title: "Valores e planos | Develoi Soluções Digitais",
    description: "Veja como funcionam os valores dos sistemas sob medida, aplicativos, chatbots e produtos SaaS da Develoi, e peça um orçamento sem compromisso.",
  },
  "/duvidas": {
    title: "Dúvidas frequentes | Develoi Soluções Digitais",
    description: "Respostas para as perguntas mais comuns sobre desenvolvimento de sistemas, prazos, suporte, integrações com WhatsApp e produtos SaaS da Develoi.",
  },
  "/contato": {
    title: "Contato | Fale com a Develoi em Tatuí - SP",
    description: "Fale com a Develoi: peça um orçamento de sistema sob medida, aplicativo, chatbot de WhatsApp ou automação. Atendimento para todo o Brasil.",
  },
  "/blog": {
    title: "Blog Develoi | Tecnologia, automação e gestão para pequenas empresas",
    description: "Artigos sobre SaaS, PDV, estoque, nota fiscal, chatbots de WhatsApp, inteligência artificial e automação para a sua empresa crescer com tecnologia.",
  },
  "/projetos": {
    title: "Projetos e cases | Develoi Soluções Digitais",
    description: "Conheça os projetos da Develoi: plataformas de agendamento, gestão para psicólogos, PDV e outros sistemas criados sob medida para negócios reais.",
  },
  "/privacidade": {
    title: "Política de privacidade | Develoi",
    description: "Como a Develoi coleta, usa e protege os dados pessoais, em conformidade com a LGPD.",
  },
};

// Telas internas e links de cobrança: nunca devem aparecer no Google.
const NOINDEX = /^\/(?:login|fatura|autorizar|dashboard|admin)(?:\/|$)/;

const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clean = (s?: string | null, max = 160) => {
  const t = String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};
const crumbs = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${BASE}${it.path}` })),
});

async function metaFor(pathname: string): Promise<Meta | null> {
  if (NOINDEX.test(pathname)) return { title: "Develoi", description: "", noindex: true };
  if (PAGES[pathname]) {
    const m = PAGES[pathname];
    return { ...m, jsonLd: [crumbs([{ name: "Início", path: "/" }, { name: m.title.split(" | ")[0], path: pathname }])] };
  }
  const post = pathname.match(/^\/blog\/([^/]+)$/);
  if (post) {
    const p: any = await (prisma as any).blogPost.findFirst({
      where: { slug: post[1], status: "published" },
      select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, publishedAt: true, updatedAt: true },
    });
    if (!p) return { title: "Página não encontrada | Develoi", description: "", noindex: true };
    const title = `${p.seoTitle || p.title} | Blog Develoi`;
    const description = clean(p.seoDescription || p.excerpt);
    return {
      title, description,
      jsonLd: [
        crumbs([{ name: "Início", path: "/" }, { name: "Blog", path: "/blog" }, { name: p.title, path: pathname }]),
        {
          "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description, mainEntityOfPage: `${BASE}${pathname}`,
          datePublished: p.publishedAt ? new Date(p.publishedAt).toISOString() : undefined, dateModified: new Date(p.updatedAt).toISOString(),
          author: { "@type": "Organization", name: "Develoi" },
          publisher: { "@type": "Organization", name: "Develoi", logo: { "@type": "ImageObject", url: `${BASE}/logo-develoi.png` } },
          image: `${BASE}/capa-header.png`,
        },
      ],
    };
  }
  const proj = pathname.match(/^\/projetos\/([^/]+)$/);
  if (proj) {
    const p: any = await (prisma as any).case.findFirst({
      where: { slug: proj[1], status: "published" },
      select: { title: true, excerpt: true, seoTitle: true, seoDescription: true },
    });
    if (!p) return { title: "Página não encontrada | Develoi", description: "", noindex: true };
    return {
      title: `${p.seoTitle || p.title} | Projetos Develoi`,
      description: clean(p.seoDescription || p.excerpt),
      jsonLd: [crumbs([{ name: "Início", path: "/" }, { name: "Projetos", path: "/projetos" }, { name: p.title, path: pathname }])],
    };
  }
  return null; // home e rotas desconhecidas
}

/** Devolve o index.html com os metadados da rota. A home usa o template como está. */
export async function renderSeoHtml(template: string, rawPath: string): Promise<string> {
  const pathname = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
  let meta: Meta | null = null;
  // Falha no banco não pode tirar página boa do índice: nesse caso devolve o template original.
  try { meta = await metaFor(pathname); } catch { return template; }
  if (!meta) {
    // Rota desconhecida (que não é a home) fica fora do índice em vez de repetir a home.
    return pathname === "/" ? template : template.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />');
  }
  let html = template;
  if (meta.noindex) {
    return html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow" />');
  }
  const url = `${BASE}${pathname}`;
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(meta.description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(meta.title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(meta.description)}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(meta.title)}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(meta.description)}" />`);
  const ld = (meta.jsonLd || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n    ");
  return ld ? html.replace("</head>", `    ${ld}\n  </head>`) : html;
}
