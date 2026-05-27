# Especificação — Novos Endpoints no A2 Creator

Documento de implementação para adicionar dois endpoints novos ao A2 Creator e ajustar um existente. Objetivo: permitir que sites consumidores (Next.js) façam paginação numerada eficiente, busca de post único sem percorrer toda a lista, e geração de sitemap escalável.

**Princípio geral:** o site consumidor não deve precisar baixar a lista inteira de posts para nenhuma operação.

---

## Autenticação (igual aos endpoints atuais)

Todos os endpoints abaixo exigem dois query params:

- `site_id` — UUID do site (multi-tenant)
- `api_key` — chave de leitura do site

**Respostas de erro padrão:**

| Status | Quando | Body |
|---|---|---|
| `400` | falta `site_id` ou `api_key` | `{ "error": "Missing site_id or api_key" }` |
| `401` | credenciais inválidas ou site não encontrado | `{ "error": "Invalid credentials" }` |
| `500` | erro interno | `{ "error": "Internal server error" }` |

---

## 1. `GET /api/posts/:slug` — Buscar post único por slug

**Para que serve:** página de detalhe `/blog/[slug]` precisa apenas de um post. Hoje o site é forçado a paginar toda a lista e filtrar localmente — desperdício que piora conforme o blog cresce.

### Request

```
GET /api/posts/:slug?site_id=<uuid>&api_key=<key>
```

- `:slug` — slug do post (URL-safe, ex: `calculo-de-macros-na-pratica`)

### Response 200 — sucesso

Mesmo shape do objeto `Post` que já é retornado em `data[]` do endpoint `/api/posts`:

```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "seo_title": "string | null",
  "seo_description": "string | null",
  "cover_image_url": "string | null",
  "thumb_image_url": "string | null",
  "content": "string (HTML)",
  "published_at": "ISO 8601 datetime",
  "created_at": "ISO 8601 datetime"
}
```

### Response 404 — slug não existe

```json
{ "error": "Post not found" }
```

### Comportamento

- Buscar apenas o post correspondente ao `slug` **dentro do `site_id` autenticado**. Slugs podem repetir entre sites diferentes — nunca retornar um post de outro site.
- Retornar `404` se o slug existir em outro site mas não no `site_id` autenticado.
- Considerar apenas posts **publicados** (não retornar drafts).

### Cache HTTP (recomendado)

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

---

## 2. `GET /api/posts/slugs` — Listar slugs de todos os posts

**Para que serve:** sitemap dinâmico e pré-renderização estática (`generateStaticParams` do Next.js) precisam conhecer **todos os slugs**, mas não precisam do HTML nem das imagens. Um endpoint leve resolve isso sem paginação.

### Request

```
GET /api/posts/slugs?site_id=<uuid>&api_key=<key>
```

### Response 200

```json
{
  "slugs": [
    {
      "slug": "string",
      "published_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime"
    }
  ],
  "total": 42
}
```

### Comportamento

- Retornar **todos** os posts publicados do `site_id`, sem paginação.
- Payload pequeno (sem `content`, sem imagens) — suporta milhares de posts em uma única resposta.
- Ordenação: `published_at DESC, id DESC` (desempate determinístico).
- Considerar apenas posts publicados.
- `updated_at` reflete a última edição do post (usado pelo sitemap como `lastModified`). Se não houver edição, igual a `published_at`.

### Cache HTTP

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

---

## 3. `GET /api/posts` — Ajustes no endpoint existente

**Para que serve:** listagem paginada (`/blog`, `/blog/page/2`, etc).

### Mudanças necessárias

**Aceitar `per_page` na query string:**

```
GET /api/posts?site_id=<uuid>&api_key=<key>&page=1&per_page=9
```

- `page` — número da página, começa em `1` (default `1`)
- `per_page` — itens por página (default `20`, máximo `50`)
- Se `per_page` ultrapassar o máximo, **truncar silenciosamente** para o máximo (não retornar erro).
- Se `page` for menor que 1 ou inválido, tratar como `1`.

**Garantir ordenação determinística:**

`published_at DESC, id DESC` (sempre na mesma ordem entre requisições, para que a paginação seja estável).

**Resposta (sem mudança de shape):**

```json
{
  "data": [ /* array de Post */ ],
  "total": 42,
  "page": 1,
  "per_page": 9,
  "has_more": true
}
```

- `total` — total de posts publicados no site
- `has_more` — `true` se existe pelo menos uma página adicional após `page` atual

**Comportamento adicional:**
- Se `page` for maior que o total de páginas, retornar `data: []`, `has_more: false`, `total` correto.
- Considerar apenas posts publicados.

### Cache HTTP

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

---

## 4. Resumo das mudanças

| Endpoint | Status | Mudança |
|---|---|---|
| `GET /api/posts` | existe | Aceitar `per_page` (default 20, máx 50). Garantir ordenação determinística. |
| `GET /api/posts/:slug` | **criar** | Buscar post único por slug, escopo `site_id`. |
| `GET /api/posts/slugs` | **criar** | Listar todos os slugs (sem paginação, payload leve). |

---

## 5. Testes manuais sugeridos (curl)

Substituir `<URL>`, `<SITE>`, `<KEY>` pelos valores reais.

```bash
# Lista paginada com 9 por página
curl "<URL>/api/posts?site_id=<SITE>&api_key=<KEY>&page=1&per_page=9"

# Post único existente
curl "<URL>/api/posts/algum-slug-real?site_id=<SITE>&api_key=<KEY>"

# Post inexistente (deve retornar 404)
curl -i "<URL>/api/posts/slug-que-nao-existe?site_id=<SITE>&api_key=<KEY>"

# Credenciais inválidas (deve retornar 401)
curl -i "<URL>/api/posts/algum-slug?site_id=<SITE>&api_key=chave-errada"

# Lista de slugs
curl "<URL>/api/posts/slugs?site_id=<SITE>&api_key=<KEY>"

# per_page acima do máximo (deve truncar para 50, não erro)
curl "<URL>/api/posts?site_id=<SITE>&api_key=<KEY>&page=1&per_page=999"
```

---

## 6. Critérios de aceitação

- [ ] `GET /api/posts/:slug` retorna 200 com o post correto, escopado por `site_id`.
- [ ] `GET /api/posts/:slug` retorna 404 quando o slug não existe naquele site.
- [ ] `GET /api/posts/:slug` não retorna posts de outros sites mesmo se o slug existir lá.
- [ ] `GET /api/posts/slugs` retorna todos os slugs publicados em uma única chamada.
- [ ] `GET /api/posts?per_page=9` retorna exatamente 9 itens (quando há ≥9 posts).
- [ ] `GET /api/posts?per_page=999` retorna 50 (truncado), não erro.
- [ ] Ordenação é estável e determinística entre chamadas repetidas.
- [ ] Todas as respostas incluem o header `Cache-Control` recomendado.
- [ ] Credenciais inválidas retornam 401 em todos os endpoints.

---

Quando estiver implementado em produção, me retorne aqui que faço os ajustes correspondentes no site (reescrita do `cms.ts`, paginação numerada em `/blog/page/[page]`, `generateStaticParams` no detalhe e sitemap usando `/api/posts/slugs`).
