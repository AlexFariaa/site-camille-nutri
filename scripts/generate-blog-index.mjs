import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "src", "data", "blog");
const INDEX_FILE = path.join(process.cwd(), "src", "data", "blog-posts.ts");

const PT_MONTHS = {
  Jan: 0,
  Fev: 1,
  Mar: 2,
  Abr: 3,
  Mai: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Set: 8,
  Out: 9,
  Nov: 10,
  Dez: 11,
};

function toCamelCase(slug) {
  const cleaned = slug.replace(/[^a-zA-Z0-9-]/g, "-");
  const words = cleaned.split("-").filter(Boolean);
  if (words.length === 0) return "post";

  return words
    .map((word, index) => {
      const normalized = word.toLowerCase();
      if (index === 0) return normalized;
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");
}

function parsePostDate(value) {
  if (!value) return 0;

  const pt = value.match(/^(\d{2})\s+(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\s+(\d{4})$/);
  if (pt) {
    const day = Number(pt[1]);
    const month = PT_MONTHS[pt[2]];
    const year = Number(pt[3]);
    const parsed = new Date(year, month, day).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function readPostMetadata(fileName) {
  const filePath = path.join(BLOG_DIR, fileName);
  const content = fs.readFileSync(filePath, "utf8");

  const slugMatch = content.match(/slug:\s*['\"]([^'\"]+)['\"]/);
  const dateMatch = content.match(/date:\s*['\"]([^'\"]+)['\"]/);

  const fallbackSlug = fileName.replace(/\.ts$/, "");
  const slug = slugMatch?.[1] ?? fallbackSlug;

  return {
    slug,
    date: dateMatch?.[1] ?? "",
    timestamp: parsePostDate(dateMatch?.[1] ?? ""),
    importName: toCamelCase(slug),
  };
}

function ensureUniqueImportNames(posts) {
  const seen = new Map();

  for (const post of posts) {
    const count = seen.get(post.importName) ?? 0;
    if (count === 0) {
      seen.set(post.importName, 1);
      continue;
    }

    const next = count + 1;
    seen.set(post.importName, next);
    post.importName = `${post.importName}${next}`;
  }
}

function generateIndexContent(posts) {
  const imports = posts
    .map((post) => `import ${post.importName} from "./blog/${post.slug}";`)
    .join("\n");

  const arrayItems = posts.map((post) => `  ${post.importName},`).join("\n");

  const importsBlock = imports ? `${imports}\n` : "";
  const arrayBlock = arrayItems ? `${arrayItems}\n` : "";

  return `export type BlogPost = {
  slug: string;
  title: string;
  metaTitle?: string; // título SEO (máx 60 chars) — se omitido, usa title
  excerpt: string;
  date: string;
  category: string;
  author: string;
  readTime: string;
  coverImage: string;   // 2400×960px (2.5:1) — exibida dentro do artigo
  thumbImage: string;   // 800×600px (4:3) — exibida no card da listagem
  content: string;
};

${importsBlock}// novos artigos: adicionar 1 linha de import aqui

export const blogPosts: BlogPost[] = [
${arrayBlock}  // novos artigos: adicionar 1 item no array aqui
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}
`;
}

if (!fs.existsSync(BLOG_DIR)) {
  console.error(`Diretório não encontrado: ${BLOG_DIR}`);
  process.exit(1);
}

const files = fs
  .readdirSync(BLOG_DIR)
  .filter((fileName) => fileName.endsWith(".ts"))
  .filter((fileName) => !["blog-posts.ts", "index.ts"].includes(fileName))
  .sort((a, b) => a.localeCompare(b));

const posts = files.map(readPostMetadata);
ensureUniqueImportNames(posts);

posts.sort((a, b) => {
  if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
  return a.slug.localeCompare(b.slug);
});

const content = generateIndexContent(posts);
fs.writeFileSync(INDEX_FILE, content, "utf8");

console.log(`blog-posts.ts gerado com ${posts.length} post(s).`);
