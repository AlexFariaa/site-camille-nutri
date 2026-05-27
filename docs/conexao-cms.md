# Conexão com o CMS — Tutorial para Agentes

Este documento ensina um agente (Claude Code, Codex, etc.) trabalhando em um site Next.js a **conectar esse site ao A2 Creator** (CMS externo) para listar e exibir posts de blog.

**Princípio fundamental:** o site **não armazena posts**. Nem em arquivos, nem em banco local, nem em pasta `src/data/`. Tudo é buscado em tempo real do A2 Creator via API HTTP. Quem cria, edita e publica posts é o próprio CMS — o site é apenas um consumidor de leitura.

---

## 1. Visão geral da arquitetura

```
┌─────────────────────┐                                ┌─────────────────────┐
│   A2 Creator (CMS)  │                                │  Supabase Storage   │
│  - Banco de posts   │  ←── upload imagens ──         │  - capas            │
│  - Painel admin     │                                │  - thumbs           │
│  - APIs públicas    │                                │  - imagens inline   │
└─────────┬───────────┘                                └──────────▲──────────┘
          │ GET /api/posts                                        │
          │ GET /api/posts/:slug                                  │ <img src=…>
          │ GET /api/posts/slugs                                  │ direto do
          ▼                                                       │ Supabase
┌─────────────────────┐                                           │
│  Site (Next.js)     │ ──────────────────────────────────────────┘
│  src/lib/cms.ts     │
│  Server Components  │
└─────────────────────┘
```

- **Posts (texto, slug, SEO, datas):** banco do A2 Creator. Site lê via 3 endpoints HTTP.
- **Imagens (capa, thumb, inline):** Supabase Storage. As URLs públicas vêm dentro do JSON do post — o site só usa `<img src="...">` apontando direto para o Supabase. Não há upload nem armazenamento de imagem no site.
- **Cache:** lado do servidor do site, via ISR do Next.js (`revalidate: 60`). O CMS responde com `Cache-Control: no-store` (sem cache de CDN — evita vazamento de dados entre tenants em API multi-tenant).

---

## 2. Onde os artigos ficam armazenados

| Conteúdo | Localização real | Como o site acessa |
|---|---|---|
| Texto do post (HTML), título, slug, SEO, datas | Banco de dados do A2 Creator | `GET /api/posts/:slug` |
| Lista paginada de posts (para `/blog`) | Banco do A2 Creator | `GET /api/posts?page=N&per_page=9` |
| Lista de slugs (para sitemap + SSG) | Banco do A2 Creator | `GET /api/posts/slugs` |
| Capa do post (`cover_image_url`) | Supabase Storage | URL pública no JSON → `<Image src>` |
| Miniatura do post (`thumb_image_url`) | Supabase Storage | URL pública no JSON → `<Image src>` |
| Imagens dentro do corpo (`<img>` no `content`) | Supabase Storage | URLs já embutidas no HTML do `content` |

**O que NÃO existe no site:**
- ❌ Pasta `src/data/blog/` ou similar
- ❌ Arquivo `blog-posts.ts` (índice local)
- ❌ Pasta `public/images/blog/` (imagens não ficam no repo)
- ❌ Markdown, MDX ou JSON de posts no repo
- ❌ Pipeline local de geração de post

Se o agente encontrar qualquer um desses em um site antigo, é resíduo de arquitetura anterior. Pode ser removido depois da migração.

---

## 3. Arquivos do site envolvidos na integração

| Arquivo | Função |
|---|---|
| [src/lib/cms.ts](../src/lib/cms.ts) | **Cliente da API.** Único ponto de contato com o CMS. Centraliza tipos, fetch, paginação e helpers. |
| [src/app/blog/page.tsx](../src/app/blog/page.tsx) | Listagem `/blog` (página 1). Chama `getPostsPage(1, 9)`. |
| `src/app/blog/page/[page]/page.tsx` | Listagem `/blog/page/2`, `/blog/page/3`, etc. Chama `getPostsPage(N, 9)`. |
| [src/app/blog/[slug]/page.tsx](../src/app/blog/[slug]/page.tsx) | Detalhe `/blog/[slug]`. Chama `getPostBySlug(slug)`. Tem `generateStaticParams` que usa `getAllSlugs()` para pré-renderizar todas as páginas no build. |
| [src/app/sitemap.ts](../src/app/sitemap.ts) | Sitemap dinâmico. Usa `getAllSlugs()`. |
| `.env.local` | Variáveis de conexão (não commitar). |

---

## 4. Configuração inicial

### 4.1 Variáveis de ambiente

Criar `.env.local` na raiz do projeto:

```env
CMS_API_URL=https://a2-creator.netlify.app
CMS_SITE_ID=<uuid-do-site-no-a2-creator>
CMS_API_KEY=<chave-de-api-do-site-no-a2-creator>
```

| Variável | Função |
|---|---|
| `CMS_API_URL` | Base da API do CMS. Hoje aponta pro A2 Creator. |
| `CMS_SITE_ID` | UUID do site no CMS (multi-tenant — o A2 Creator hospeda vários sites). |
| `CMS_API_KEY` | Token de autenticação. |

**Regras invioláveis:**
- **Nunca** usar prefixo `NEXT_PUBLIC_` nessas variáveis. A `api_key` não pode ir pro bundle do cliente.
- Em produção (Netlify): replicar as três em _Site settings → Environment variables_ e fazer redeploy.
- Se qualquer variável faltar, `cms.ts` loga erro no servidor e retorna lista vazia. Site não quebra, mas blog mostra "Em breve, novos conteúdos.".

### 4.2 Onde obter as credenciais

No painel do A2 Creator, na configuração do site específico. Cada site tem seu próprio `site_id` e `api_key`.

---

## 5. Os 3 endpoints do CMS

Todos exigem `site_id` e `api_key` na query string. Todos respondem com `Cache-Control: no-store` (o site faz o cache via ISR).

### 5.1 `GET /api/posts` — listagem paginada

**Query params:**
- `site_id` (obrigatório)
- `api_key` (obrigatório)
- `page` (default `1`)
- `per_page` (default `20`, máximo `50`; valores acima são truncados silenciosamente)

**Resposta 200:**
```json
{
  "data": [ /* array de Post */ ],
  "total": 29,
  "page": 1,
  "per_page": 9,
  "has_more": true
}
```

**Quando usar:** listagem paginada `/blog` e `/blog/page/[page]`.

### 5.2 `GET /api/posts/:slug` — post único

**Query params:** `site_id`, `api_key`.

**Resposta 200:** objeto `Post` completo.
**Resposta 404:** `{ "error": "Post not found" }` (slug não existe nesse `site_id`).

**Quando usar:** página de detalhe `/blog/[slug]`. **Não** percorrer a lista completa para achar um post — usar esse endpoint direto.

### 5.3 `GET /api/posts/slugs` — lista leve de slugs

**Query params:** `site_id`, `api_key`.

**Resposta 200:**
```json
{
  "slugs": [
    { "slug": "...", "published_at": "...", "updated_at": "..." }
  ],
  "total": 29
}
```

**Quando usar:** sitemap e `generateStaticParams` do Next.js. Payload pequeno (sem HTML nem imagens) — pode retornar milhares de slugs em uma única chamada sem paginação.

### 5.4 Códigos de erro padronizados

| Status | Quando |
|---|---|
| `400` | falta `site_id` ou `api_key` |
| `401` | `api_key` inválida ou não bate com o `site_id` |
| `404` | (só no `:slug`) slug não existe nesse site |

---

## 6. O arquivo `src/lib/cms.ts` — cópia-e-cola

Esse arquivo é praticamente o mesmo em todo site que consome o A2 Creator. Copiar igual e só ajustar se houver mudança de spec da API.

### 6.1 Interface `Post`

```ts
export interface Post {
  id: string
  title: string
  slug: string
  seo_title: string | null
  seo_description: string | null
  cover_image_url: string | null    // URL Supabase, imagem grande do topo
  thumb_image_url: string | null    // URL Supabase, miniatura do card
  content: string                   // HTML pronto (já contém <img> com URLs Supabase)
  published_at: string              // ISO 8601
  created_at: string                // ISO 8601
}
```

### 6.2 Funções exportadas

| Função | O que faz | Onde usar |
|---|---|---|
| `getPostsPage(page, perPage = 9)` | Busca uma página de posts. | Listagem `/blog` e `/blog/page/[page]`. |
| `getPostBySlug(slug)` | Busca um post pelo slug usando `GET /api/posts/:slug`. | Página de detalhe. |
| `getAllSlugs()` | Busca todos os slugs (endpoint leve). | `generateStaticParams` e sitemap. |
| `getPostExcerpt(content, max = 120)` | Gera resumo a partir do HTML (sem tags, truncado). | Cards e meta description fallback. |
| `formatPostDate(iso)` | Formata data ISO para pt-BR longo (ex: "27 de maio de 2026"). | Exibir data nos cards e topo do artigo. |
| `stripHtml(html)` | Remove tags HTML. | Utilitário interno. |

### 6.3 Comportamentos críticos

- **Server Components apenas.** As funções leem `process.env` — não importar em Client Component.
- **ISR de 60s.** Os `fetch` usam `next: { revalidate: 60 }`. O Next cacheia a resposta no servidor por 60 segundos. Edições no CMS aparecem em até 1 minuto sem rebuild.
- **Fail-open.** Qualquer erro de rede, status != 200, ou JSON inválido retorna estrutura vazia (não lança exceção). Garante que o site nunca caia por causa do CMS.
- **Sem `getAllPosts`.** Nenhuma função baixa todos os posts. Listagem usa paginação; detalhe usa endpoint dedicado; sitemap usa `getAllSlugs()` (que não traz HTML).

---

## 7. As páginas do blog

### 7.1 Listagem — `/blog` (página 1)

[src/app/blog/page.tsx](../src/app/blog/page.tsx)

```ts
import { getPostsPage, getPostExcerpt, formatPostDate } from "@/lib/cms";

const PER_PAGE = 9;

export default async function Blog() {
  const { data: posts, has_more, total } = await getPostsPage(1, PER_PAGE);
  // Renderiza grid de cards com post.thumb_image_url, post.title,
  // getPostExcerpt(post.content), formatPostDate(post.published_at)
  // Footer com paginação: prev desabilitado, link para /blog/page/2 se has_more
}
```

### 7.2 Listagem paginada — `/blog/page/[page]`

`src/app/blog/page/[page]/page.tsx`

```ts
import { notFound } from "next/navigation";
import { getPostsPage } from "@/lib/cms";

const PER_PAGE = 9;

export default async function BlogPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = parseInt(page, 10);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const result = await getPostsPage(pageNum, PER_PAGE);
  if (result.data.length === 0) notFound();

  // Mesma renderização da listagem, com paginação prev/next baseada em
  // pageNum, result.has_more e total = result.total / PER_PAGE.
}
```

**Por que numerada (`/blog/page/2`) e não `?page=2`:**
- URLs limpas e indexáveis pelo Google como páginas distintas.
- Melhor compartilhamento e bookmarking.
- Cada página vira uma rota estática separada no build.

### 7.3 Detalhe — `/blog/[slug]`

[src/app/blog/[slug]/page.tsx](../src/app/blog/[slug]/page.tsx)

```ts
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSlugs, getPostBySlug, getPostExcerpt, formatPostDate } from "@/lib/cms";

// SSG: pré-renderiza todas as páginas de post no build
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Artigo não encontrado" };
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? getPostExcerpt(post.content),
    openGraph: {
      images: post.cover_image_url ? [post.cover_image_url] : [],
      // ...
    }
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  // Header com post.title + formatPostDate(post.published_at)
  // <Image src={post.cover_image_url} /> se existir
  // <article dangerouslySetInnerHTML={{ __html: post.content }} />
}
```

### 7.4 Sitemap

[src/app/sitemap.ts](../src/app/sitemap.ts)

```ts
import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/cms";

const BASE_URL = "https://seusite.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    ...slugs.map((s) => ({
      url: `${BASE_URL}/blog/${s.slug}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
```

---

## 8. Como funciona o cache (ler com atenção)

São **três camadas** de cache distintas, em pontos diferentes da arquitetura:

1. **CDN do A2 Creator → DESLIGADO.** Os endpoints respondem com `Cache-Control: no-store`. Toda chamada chega na função serverless e executa fresca. Isso é proposital: API multi-tenant autenticada não pode arriscar vazamento entre tenants por cache mal configurado.

2. **Cache do Next.js no servidor do site → 60s (ISR).** O `fetch` em `cms.ts` usa `next: { revalidate: 60 }`. Cada combinação única de URL fica em cache por 60s no servidor do Netlify do site. Visitantes que chegam dentro dessa janela não geram chamada nova ao CMS.

3. **Build estático (SSG) → revalidado conforme ISR.** Páginas de detalhe (`/blog/[slug]`) são pré-renderizadas no build via `generateStaticParams`. Em runtime, o ISR revalida a página quando ela é solicitada e tem mais de 60s.

**Consequência prática:**
- Publicou um post no CMS → aparece no site em até 60s (sem rebuild manual).
- Editou um post existente → mesma coisa, até 60s.
- Apagou um post do CMS → fica visível até a próxima revalidação (até 60s); depois retorna 404.

---

## 9. Checklist para replicar em um site novo

1. **No A2 Creator:** criar o site no painel e copiar `site_id` + `api_key`.
2. **No código do novo site:**
   - Copiar [src/lib/cms.ts](../src/lib/cms.ts) idêntico.
   - Criar `src/app/blog/page.tsx` (listagem, página 1, 9 posts).
   - Criar `src/app/blog/page/[page]/page.tsx` (paginação numerada).
   - Criar `src/app/blog/[slug]/page.tsx` (detalhe, com `generateStaticParams`).
   - Criar/ajustar `src/app/sitemap.ts` (usando `getAllSlugs()`).
3. **Variáveis de ambiente:**
   - `.env.local` com `CMS_API_URL`, `CMS_SITE_ID`, `CMS_API_KEY`.
   - Replicar no Netlify e fazer deploy.
4. **Limpar resíduos** (se for migração de site antigo):
   - Remover `src/data/blog/`, `blog-posts.ts`, `public/images/blog/` se existirem.
   - Remover qualquer pipeline local de geração de post.
5. **Teste:**
   - Publicar um post de teste no A2 Creator.
   - `npm run dev` → acessar `/blog` → post deve aparecer.
   - Em produção, aguardar até 60s após publicar (ISR).

---

## 10. Pontos de atenção / armadilhas

- **`NEXT_PUBLIC_` é proibido nas variáveis CMS.** Manter no servidor. Expor a `api_key` no cliente é furo de segurança.
- **Atraso de 60s é esperado.** Se publicar no CMS e olhar o site imediatamente, pode demorar até 1 minuto. Não é bug.
- **Lista vazia ≠ erro de código.** Quase sempre é variável de ambiente faltando. Conferir logs do servidor (Netlify Functions logs) para mensagens `[cms] Variáveis … não configuradas` ou `[cms] Erro…`.
- **Não usar `getAllPosts`.** Essa função foi deliberadamente removida. Não criar uma versão dela. Listagem usa `getPostsPage`; detalhe usa `getPostBySlug`; sitemap usa `getAllSlugs`.
- **HTML do post vem pronto e é injetado com `dangerouslySetInnerHTML`.** A responsabilidade de sanitização e formatação é do CMS, não do site.
- **Imagens vêm direto do Supabase.** As URLs em `cover_image_url`, `thumb_image_url` e `<img src>` dentro de `content` apontam para `*.supabase.co`. Configurar `next.config.js` → `images.remotePatterns` para permitir esse domínio se for usar `next/image`.
- **`getPostBySlug` retorna `null` quando o post não existe** — sempre tratar com `if (!post) notFound()`.
- **Paginação numerada começa em `/blog/page/2`** — `/blog` já é a página 1. Não criar `/blog/page/1` separado (vira conteúdo duplicado para SEO).
- **Sitemap usa `updated_at`** (não `published_at`) como `lastModified` para refletir edições. O endpoint `/api/posts/slugs` retorna os dois.

---

## 11. Referências

- Endpoints do A2 Creator: [docs/spec-endpoints-a2-creator.md](spec-endpoints-a2-creator.md)
- Código de referência (este site):
  - [src/lib/cms.ts](../src/lib/cms.ts)
  - [src/app/blog/page.tsx](../src/app/blog/page.tsx)
  - [src/app/blog/[slug]/page.tsx](../src/app/blog/[slug]/page.tsx)
  - [src/app/sitemap.ts](../src/app/sitemap.ts)
