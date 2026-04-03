# Conectar ao A2 Publisher

Este arquivo é um **procedimento de setup** para um agente de IA. Quando ativado, o agente coleta as credenciais do A2 Publisher, cria o script de envio e integra ao workflow de publicação existente.

> **Como usar:** Copie este arquivo para a raiz do projeto **gerador-artigo**. Instrua o agente: *"Execute o CONECTAR_A2PUBLISHER.md"*. Ele fará todo o setup interativamente.

---

## Pré-requisitos (verificar antes de começar)

- Python 3.10+ instalado
- Arquivo `blog.config.json` existe na raiz do projeto
- Pasta `execution/` existe com scripts do pipeline
- Arquivo `.agent/workflows/steps/04-publicacao.md` existe
- Acesso ao painel do A2 Publisher para copiar as credenciais

---

## Passo 0 — Coletar credenciais do A2 Publisher

Antes de criar qualquer arquivo, apresente ao usuário exatamente isto:

---

**Conectar Gerador ao A2 Publisher**

Preciso de 3 informações da página de Integração do A2 Publisher.

Acesse: **A2 Publisher → [Seu Site] → Integração → aba "Gerador de Posts"**

1. **URL do A2 Publisher** — endereço base da aplicação  
   (ex: `https://a2-publisher.netlify.app` ou `http://localhost:3000`)

2. **site_id** — o UUID exibido na aba "Credenciais do Gerador"

3. **generator_api_key** — a chave exibida na mesma aba

---

Aguarde o usuário responder. Salve como:
- `PUBLISHER_URL` — item 1 (remover barra final se houver)
- `SITE_ID` — item 2
- `GENERATOR_API_KEY` — item 3

---

## Passo 1 — Verificar pré-requisitos

Verifique se os arquivos necessários existem:

```
blog.config.json          → obrigatório
execution/                → obrigatório
.agent/workflows/steps/04-publicacao.md  → obrigatório
```

Se qualquer um não existir, informe o usuário e pare. Este setup presume que o pipeline de geração de artigos já está instalado (`INSTALAR_BLOG.md` já foi executado).

Se `.tmp/` não existir, crie o diretório.

---

## Passo 2 — Atualizar blog.config.json

Leia o conteúdo atual de `blog.config.json`.

Adicione a seguinte seção no objeto raiz (substitua os valores pelas variáveis coletadas):

```json
"a2publisher": {
  "site_id": "[SITE_ID]",
  "api_key": "[GENERATOR_API_KEY]",
  "publisher_url": "[PUBLISHER_URL]"
}
```

Salve o arquivo preservando todo o conteúdo original.

Confirme: imprima `blog.config.json` e verifique que a seção `a2publisher` está presente e correta.

---

## Passo 3 — Criar execution/send_to_publisher.py

Crie o arquivo `execution/send_to_publisher.py` com o seguinte conteúdo **exato**:

```python
#!/usr/bin/env python3
"""
Envia o artigo gerado para o A2 Publisher via API.
Lê configurações de blog.config.json (seção a2publisher).
Lê conteúdo de .tmp/seo_plan.json e .tmp/article_body.html.
Faz upload de imagens inline (public/images/blog/{slug}-inline-*.avif) para o
Supabase via /api/upload-inline-image e substitui os src no HTML antes de enviar.
Se existir imagem de capa em public/images/blog/{slug}.avif, envia também.
Se existir thumb em public/images/blog/{slug}-thumb.avif, envia também.
"""

import json
import os
import re
import sys

try:
    import requests
except ImportError:
    print("ERRO: 'requests' não instalado. Execute: pip install requests")
    sys.exit(1)

# ── Carregar configurações ────────────────────────────────────

with open("blog.config.json", encoding="utf-8") as f:
    config = json.load(f)

a2 = config.get("a2publisher")
if not a2:
    print("ERRO: Seção 'a2publisher' não encontrada em blog.config.json")
    print("Execute o CONECTAR_A2PUBLISHER.md para configurar.")
    sys.exit(1)

PUBLISHER_URL = a2["publisher_url"].rstrip("/")
SITE_ID       = a2["site_id"]
API_KEY       = a2["api_key"]

HEADERS = {
    "X-Generator-Api-Key": API_KEY,
}


def estimate_read_time(html: str) -> str:
    """Estima tempo de leitura em português (200 palavras/min)."""
    text = re.sub(r"<[^>]+>", " ", html)
    words = len([w for w in text.split() if w.strip()])
    minutes = max(1, (words + 199) // 200)
    return f"{minutes} min de leitura"

# ── Carregar dados do post ────────────────────────────────────

SEO_PLAN_PATH     = ".tmp/seo_plan.json"
ARTICLE_HTML_PATH = ".tmp/article_body.html"

if not os.path.exists(SEO_PLAN_PATH):
    print(f"ERRO: {SEO_PLAN_PATH} não encontrado. Execute as etapas anteriores do pipeline primeiro.")
    sys.exit(1)

if not os.path.exists(ARTICLE_HTML_PATH):
    print(f"ERRO: {ARTICLE_HTML_PATH} não encontrado. Execute as etapas anteriores do pipeline primeiro.")
    sys.exit(1)

with open(SEO_PLAN_PATH, encoding="utf-8") as f:
    seo_plan = json.load(f)

with open(ARTICLE_HTML_PATH, encoding="utf-8") as f:
    raw_html = f.read()

title           = seo_plan.get("title", "")
slug            = seo_plan.get("slug", "")
seo_title       = seo_plan.get("seo_title", title)
seo_description = seo_plan.get("seo_description", "")
category        = seo_plan.get("category", "")
author          = config.get("autor_blog", "")
read_time       = estimate_read_time(raw_html)

if not title or not slug:
    print("ERRO: seo_plan.json não tem 'title' ou 'slug'.")
    sys.exit(1)

# ── Upload de imagens inline ──────────────────────────────────
# Detecta src que referenciam arquivos locais de imagem inline
# Padrão gerado pelo pipeline: /images/blog/{slug}-inline-N.avif

def upload_inline_image(local_path: str, filename: str) -> str | None:
    """Faz upload de uma imagem inline e retorna a URL pública, ou None se falhar."""
    try:
        with open(local_path, "rb") as img_file:
            res = requests.post(
                f"{PUBLISHER_URL}/api/upload-inline-image",
                headers=HEADERS,
                data={"site_id": SITE_ID, "post_slug": slug, "filename": filename},
                files={"file": (filename, img_file, "image/avif")},
                timeout=60,
            )
        if res.status_code == 200:
            return res.json().get("url")
        else:
            print(f"  ⚠ Upload falhou ({res.status_code}): {res.text[:200]}")
            return None
    except Exception as e:
        print(f"  ⚠ Erro: {e}")
        return None

# Encontra todos os src com padrão de imagem inline local
inline_pattern = re.compile(r'src="(/images/blog/[^"]+\.avif)"')
inline_srcs = list(dict.fromkeys(inline_pattern.findall(raw_html)))  # únicos, mantém ordem

if inline_srcs:
    print(f"→ Encontradas {len(inline_srcs)} imagem(ns) inline para hospedar...")
    for src in inline_srcs:
        filename = os.path.basename(src)           # ex: slug-inline-1.avif
        local_path = f"public{src}"                # ex: public/images/blog/slug-inline-1.avif

        if not os.path.exists(local_path):
            print(f"  ⚠ Arquivo não encontrado localmente: {local_path} — src mantido.")
            continue

        print(f"  → Enviando {filename}...")
        public_url = upload_inline_image(local_path, filename)
        if public_url:
            raw_html = raw_html.replace(f'src="{src}"', f'src="{public_url}"')
            print(f"    ✓ {public_url}")
        else:
            print(f"    ⚠ Falha no upload de {filename} — src mantido no HTML.")
else:
    print("→ Nenhuma imagem inline local encontrada no HTML.")

# ── Upload da imagem de capa (opcional) ──────────────────────

cover_image_url = None
cover_path = f"public/images/blog/{slug}.avif"

if os.path.exists(cover_path):
    print(f"\n→ Enviando imagem de capa: {cover_path}")
    try:
        with open(cover_path, "rb") as img_file:
            upload_res = requests.post(
                f"{PUBLISHER_URL}/api/upload-image",
                headers=HEADERS,
                data={"site_id": SITE_ID, "post_slug": slug, "type": "cover"},
                files={"file": (f"{slug}.avif", img_file, "image/avif")},
                timeout=60,
            )
        if upload_res.status_code == 200:
            cover_image_url = upload_res.json().get("url")
            print(f"  ✓ Imagem enviada: {cover_image_url}")
        else:
            print(f"  ⚠ Upload falhou ({upload_res.status_code}): {upload_res.text[:200]}")
            print("  Continuando sem imagem de capa...")
    except Exception as e:
        print(f"  ⚠ Erro no upload da imagem: {e}")
        print("  Continuando sem imagem de capa...")
else:
    print(f"\n→ Imagem de capa não encontrada em {cover_path}, pulando upload.")

# ── Upload da thumbnail de listagem (opcional) ──────────────

thumb_image_url = None
thumb_path = f"public/images/blog/{slug}-thumb.avif"

if os.path.exists(thumb_path):
    print(f"\n→ Enviando thumbnail: {thumb_path}")
    try:
        with open(thumb_path, "rb") as img_file:
            thumb_res = requests.post(
                f"{PUBLISHER_URL}/api/upload-image",
                headers=HEADERS,
                data={"site_id": SITE_ID, "post_slug": slug, "type": "thumb"},
                files={"file": (f"{slug}-thumb.avif", img_file, "image/avif")},
                timeout=60,
            )
        if thumb_res.status_code == 200:
            thumb_image_url = thumb_res.json().get("url")
            print(f"  ✓ Thumb enviada: {thumb_image_url}")
        else:
            print(f"  ⚠ Upload da thumb falhou ({thumb_res.status_code}): {thumb_res.text[:200]}")
            print("  Continuando sem thumb...")
    except Exception as e:
        print(f"  ⚠ Erro no upload da thumb: {e}")
        print("  Continuando sem thumb...")
else:
    print(f"\n→ Thumb não encontrada em {thumb_path}, pulando upload.")

# ── Enviar post ao A2 Publisher ───────────────────────────────

print(f"\n→ Enviando post '{title}' ao A2 Publisher...")

payload = {
    "site_id":         SITE_ID,
    "title":           title,
    "slug":            slug,
    "raw_html":        raw_html,
    "seo_title":       seo_title,
    "seo_description": seo_description,
    "category":        category,
    "author":          author,
    "read_time":       read_time,
}

if cover_image_url:
    payload["cover_image_url"] = cover_image_url

if thumb_image_url:
    payload["thumb_image_url"] = thumb_image_url

import_headers = {**HEADERS, "Content-Type": "application/json"}

try:
    res = requests.post(
        f"{PUBLISHER_URL}/api/import-post",
        headers=import_headers,
        json=payload,
        timeout=30,
    )
except requests.exceptions.ConnectionError:
    print(f"ERRO: Não foi possível conectar ao A2 Publisher em {PUBLISHER_URL}")
    print("Verifique se a URL está correta e o servidor está rodando.")
    sys.exit(1)

# ── Processar resposta ────────────────────────────────────────

if res.status_code == 201:
    data = res.json()
    print("\n✓ Post enviado com sucesso!")
    print(f"  Post ID:  {data['post_id']}")
    print(f"  Editar:   {data['edit_url']}")
    print("\nPróximos passos:")
    print("  1. Acesse o link acima para revisar o post")
    print("  2. Ajuste metadata se necessário (title, slug, SEO)")
    print("  3. Clique em 'Publicar' quando estiver pronto")

elif res.status_code == 409:
    data = res.json()
    print(f"\n⚠ Aviso: {data.get('error', 'Slug duplicado')}")
    print("  O post já existe no A2 Publisher. Não é necessário reenviar.")
    print("  Acesse o painel para encontrar o post existente.")

elif res.status_code == 401:
    print("\nERRO: Credenciais inválidas.")
    print("  Verifique site_id e api_key no blog.config.json.")
    print("  As credenciais ficam na aba 'Gerador de Posts' → Integração do A2 Publisher.")
    sys.exit(1)

else:
    print(f"\nERRO: A2 Publisher retornou {res.status_code}")
    try:
        error_data = res.json()
        print(f"  Mensagem: {error_data.get('error', res.text[:300])}")
    except Exception:
        print(f"  Resposta: {res.text[:300]}")
    sys.exit(1)
```

---

## Passo 4 — Verificar requirements.txt

Verifique se `execution/requirements.txt` existe e contém `requests`.

Se a linha `requests>=2.31.0` não estiver presente, adicione-a.

Se o arquivo não existir, crie-o com:

```
requests>=2.31.0
```

---

## Passo 5 — Atualizar .agent/workflows/steps/04-publicacao.md

Leia o arquivo `.agent/workflows/steps/04-publicacao.md` completo.

Localize a seção **GATE 4** (a linha que pede confirmação de deploy, algo como "Posso fazer o deploy?" ou "GATE 4").

Insira o seguinte bloco **ANTES** do GATE 4:

```markdown
### 3.4 — Enviar ao A2 Publisher

Execute o script de envio:

```
python execution/send_to_publisher.py
```

O script irá:
- Ler `.tmp/seo_plan.json` e `.tmp/article_body.html`
- Enviar a imagem de capa (se existir em `public/images/blog/{slug}.avif`)
- Criar o post como draft no A2 Publisher

**Se o script retornar sucesso:**
Copie a URL de edição exibida e apresente ao usuário:
> "Post enviado ao A2 Publisher! Acesse para revisar e publicar: [URL]"

**Se retornar 409 (slug duplicado):**
Informe o usuário que o post já existe — não é erro fatal.

**Se retornar erro de conexão ou 401:**
Verifique as credenciais em `blog.config.json` (seção `a2publisher`).
```

Salve o arquivo preservando todo o conteúdo original.

---

## Passo 6 — Corrigir sitemap.xml para datas em português

O pipeline gera datas no formato `"01 Abr 2026"` (dia + mês PT + ano). O `new Date()` do JavaScript não consegue parsear esse formato e lança `RangeError: Invalid time value` no build do sitemap.xml.

Leia `src/app/sitemap.ts`. Localize a linha:

```ts
lastModified: new Date(post.date),
```

Substitua o conteúdo do arquivo para incluir a função `parsePostDate` antes da função `sitemap()`:

```ts
import type { MetadataRoute } from 'next'
import { blogPosts } from '@/data/blog-posts'

const BASE_URL = 'https://camillebarbosa.com.br'

const PT_MONTHS: Record<string, string> = {
  Jan: '01', Fev: '02', Mar: '03', Abr: '04', Mai: '05', Jun: '06',
  Jul: '07', Ago: '08', Set: '09', Out: '10', Nov: '11', Dez: '12',
}

function parsePostDate(date: string): Date {
  const match = date.match(/^(\d{2})\s+(\w{3})\s+(\d{4})$/)
  if (match) {
    const [, day, monthPt, year] = match
    const month = PT_MONTHS[monthPt]
    if (month) return new Date(`${year}-${month}-${day}`)
  }
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}
```

E troque `new Date(post.date)` por `parsePostDate(post.date)`.

Salve o arquivo.

---

## Passo 7 — Confirmação

Apresente ao usuário o seguinte resumo:

---

**Setup concluído!** O gerador agora está conectado ao A2 Publisher.

**O que foi configurado:**
- `blog.config.json` — seção `a2publisher` adicionada com suas credenciais
- `execution/send_to_publisher.py` — script de envio criado
- `.agent/workflows/steps/04-publicacao.md` — etapa 3.4 adicionada
- `src/app/sitemap.ts` — parser de datas em português adicionado

**Como funciona a partir de agora:**
1. O pipeline gera o artigo normalmente (etapas 1 a 3)
2. Na etapa 4, o script envia automaticamente ao A2 Publisher
3. Você recebe a URL de edição para revisar e publicar

**Para publicar no GitHub automaticamente:**
Configure o repositório e o framework na aba "Gerador de Posts" → Integração do A2 Publisher.
Ao clicar "Publicar no GitHub" no editor, o post é empurrado direto ao repo do site.

---

**Fim do setup.**
