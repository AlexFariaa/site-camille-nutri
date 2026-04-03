#!/usr/bin/env python3
"""
Envia o artigo gerado para o A2 Publisher via API.
Lê configurações de blog.config.json (seção a2publisher).
Lê conteúdo de .tmp/seo_plan.json e .tmp/article_body.html.
Faz upload de imagens inline (public/images/blog/{slug}-inline-*.avif) para o
Supabase via /api/upload-inline-image e substitui os src no HTML antes de enviar.
Se existir imagem de capa em public/images/blog/{slug}.avif, envia também.
"""

import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

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

title           = seo_plan.get("meta_title", seo_plan.get("title", ""))
slug            = seo_plan.get("slug", "")
seo_title       = seo_plan.get("meta_title", seo_plan.get("seo_title", title))
seo_description = seo_plan.get("meta_description", seo_plan.get("seo_description", ""))
category        = seo_plan.get("category", "")
author          = config.get("site", {}).get("author", "")

# Calcular read_time a partir do HTML (~200 palavras por minuto)
word_count = len(re.sub(r'<[^>]+>', '', raw_html).split())
read_minutes = max(1, round(word_count / 200))
read_time = f"{read_minutes} min de leitura"

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
                data={"site_id": SITE_ID, "post_slug": slug},
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

# ── Upload da miniatura (opcional) ───────────────────────────

thumb_image_url = None
thumb_path = f"public/images/blog/thumb-{slug}.avif"

if os.path.exists(thumb_path):
    print(f"\n→ Enviando miniatura: {thumb_path}")
    try:
        with open(thumb_path, "rb") as img_file:
            upload_res = requests.post(
                f"{PUBLISHER_URL}/api/upload-image",
                headers=HEADERS,
                data={"site_id": SITE_ID, "post_slug": slug},
                files={"file": (f"thumb-{slug}.avif", img_file, "image/avif")},
                timeout=60,
            )
        if upload_res.status_code == 200:
            thumb_image_url = upload_res.json().get("url")
            print(f"  ✓ Miniatura enviada: {thumb_image_url}")
        else:
            print(f"  ⚠ Upload falhou ({upload_res.status_code}): {upload_res.text[:200]}")
    except Exception as e:
        print(f"  ⚠ Erro no upload da miniatura: {e}")
else:
    print(f"\n→ Miniatura não encontrada em {thumb_path}, pulando upload.")

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
