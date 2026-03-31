# Step 04: Publicacao

Executar imediatamente apos o GATE 3 aprovado, sem pedir confirmacao.

Input: `.tmp/seo_plan.json`, `.tmp/article_body.html`, imagens ja geradas.

## Sub-passo 4.1 — Criar arquivo TypeScript do artigo

Crie `src/data/blog/{slug}.ts` com a estrutura de BlogPost:
```typescript
import type { BlogPost } from "@/data/blog-posts";

const post: BlogPost = {
  slug: "{slug}",
  title: "{title}",
  excerpt: "{meta_description}",
  date: "{data formatada 'DD Mês YYYY' ex: '31 Mar 2026'}",
  category: "{category}",
  author: "Camille Barbosa",
  readTime: "{readTime ex: '5 min de leitura'}",
  metaTitle: "{meta_title}",
  coverImage: "/images/blog/{slug}.avif",
  thumbImage: "/images/blog/thumb-{slug}.avif",
  content: `{html content com imagens inline}`
};

export default post;
```

**Dados a usar:**
- Leia `.tmp/seo_plan.json` para: slug, meta_title, meta_description, primary_keyword
- Leia `.tmp/article_body.html` para: conteudo do artigo (html completo)
- Imagens geradas em `public/images/blog/`

## Sub-passo 4.2 — Atualizar src/data/blog-posts.ts

Abra `src/data/blog-posts.ts`:

**1. Adicione o import no topo (apos os outros imports):**
```typescript
import {slug} from "./blog/{slug}";
```

**2. Adicione no array `blogPosts` (no topo da lista para aparecer primeiro):**
```typescript
export const blogPosts: BlogPost[] = [
  {slugVariable},  // ← NOVO ARTIGO
  calculoMacros,
  entenderMacros,
  ...
];
```

**CRITICO:** Sem adicionar no array, o artigo nao aparecera no blog mesmo que o arquivo exista.

## Sub-passo 4.3 — Atualizar blog/links_permitidos.md

Abra `blog/links_permitidos.md`. Identifique a secao correta:
- "Inteligencia Artificial e Automacao" — para temas de IA, chatbots, automacao, agentes
- "SEO Local e Google Meu Negocio" — para temas de SEO, Google, visibilidade local
- "Marketing e Visibilidade Digital" — para temas de marketing, redes sociais, conteudo

Adicione no final da secao correspondente:
```markdown
* **`/blog/{slug}.html`**
  * **Titulo/Tema:** {titulo do artigo}
  * **Quando usar:** {Resumo de 2-3 linhas baseado na descricao e contexto do artigo, instruindo futuros LLMs sobre quando sugerir esse link organicamente}.
```

## GATE 4 — Deploy

Apos publicar os 3 arquivos acima, pergunte apenas:

"Posso fazer o deploy?"

Se sim: execute `git add src/data/blog/{slug}.ts src/data/blog-posts.ts blog/links_permitidos.md public/images/blog/{slug}.avif public/images/blog/thumb-{slug}.avif public/images/blog/{slug}-inline-*.avif` + `git commit -m "blog: publicar artigo {slug}"` + `git push`

Apos o push com sucesso: delete `.tmp/retomar_atual.md` se existir (arquivo de retomada nao e mais necessario apos publicacao).

Se nao: encerre. Os arquivos ja estao publicados localmente.

## Nota: arquivo de retomada

Se em qualquer step anterior a sessao precisar ser interrompida antes de concluir, crie `.tmp/retomar_atual.md` com o estado atual.
- Nome SEMPRE fixo: `retomar_atual.md` (nunca inclua o nome do artigo no nome do arquivo)
- Sempre sobrescreva qualquer arquivo existente — nunca crie um segundo arquivo de retomada
- Isso evita arquivos fantasma de sessoes passadas que confundem sessoes futuras
