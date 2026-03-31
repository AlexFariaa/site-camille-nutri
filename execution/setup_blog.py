"""
Blog Module Installer — Escaneia um projeto e gera um draft de blog.config.json.

Detecta automaticamente:
- Framework (Vite, Next.js, Astro, HTML puro)
- Templates de blog existentes
- Classes CSS do blog
- IDs de analytics (GTM, GA)
- Estrutura de diretórios

Uso:
  python execution/setup_blog.py --scan
  python execution/setup_blog.py --scan --output blog.config.json
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def detect_framework(root: Path) -> str:
    """Detecta o framework do projeto."""
    # Next.js
    if (root / "next.config.js").exists() or (root / "next.config.mjs").exists() or (root / "next.config.ts").exists():
        return "nextjs"

    # Astro
    if (root / "astro.config.mjs").exists() or (root / "astro.config.ts").exists():
        return "astro"

    # Vite
    if (root / "vite.config.js").exists() or (root / "vite.config.ts").exists() or (root / "vite.config.mjs").exists():
        return "vite"

    # Package.json com framework
    pkg_path = root / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "next" in deps:
                return "nextjs"
            if "astro" in deps:
                return "astro"
            if "vite" in deps:
                return "vite"
            if "gatsby" in deps:
                return "gatsby"
            if "nuxt" in deps:
                return "nuxt"
        except (json.JSONDecodeError, KeyError):
            pass

    return "vanilla-html"


def find_blog_directory(root: Path) -> str | None:
    """Procura diretório de blog no projeto."""
    candidates = ["blog", "posts", "articles", "content/blog", "src/content/blog", "src/pages/blog", "pages/blog"]
    for candidate in candidates:
        if (root / candidate).is_dir():
            return candidate
    return None


def find_blog_template(root: Path, blog_dir: str | None) -> str | None:
    """Procura template de post de blog."""
    if blog_dir:
        for pattern in ["TEMPLATE*.html", "template*.html", "_template*", "layout*"]:
            matches = list((root / blog_dir).glob(pattern))
            if matches:
                return str(matches[0].relative_to(root))

    # Procura em diretórios comuns
    for search_dir in ["blog", "src/layouts", "src/templates", "components", "src/components"]:
        dir_path = root / search_dir
        if dir_path.is_dir():
            for f in dir_path.iterdir():
                if f.is_file() and "template" in f.name.lower() and f.suffix in (".html", ".astro", ".tsx", ".jsx"):
                    return str(f.relative_to(root))
    return None


def find_images_directory(root: Path) -> str:
    """Procura diretório de imagens."""
    candidates = [
        "public/images/blog", "public/img/blog", "static/images/blog",
        "src/assets/images/blog", "assets/images/blog", "images/blog",
    ]
    for candidate in candidates:
        if (root / candidate).is_dir():
            return candidate

    # Fallback: procura qualquer diretório public/images
    if (root / "public" / "images").is_dir():
        return "public/images/blog"
    if (root / "public").is_dir():
        return "public/images/blog"
    if (root / "static").is_dir():
        return "static/images/blog"
    return "public/images/blog"


def extract_css_classes(template_path: Path) -> dict:
    """Extrai classes CSS relevantes de um template HTML."""
    defaults = {
        "article_body": "article-body",
        "article_cover": "article-cover",
        "article_inline_image": "article-inline-image",
        "blog_card": "blog-card",
        "blog_grid": "blog-grid",
        "blog_tag": "blog-tag",
        "blog_thumb": "blog-thumb",
        "blog_content": "blog-content",
        "blog_excerpt": "blog-excerpt",
        "blog_meta": "blog-meta",
        "article_index": "article-index",
    }

    if not template_path.exists():
        return defaults

    content = template_path.read_text(encoding="utf-8", errors="ignore")
    found = {}

    # Procura padrões de classe no HTML
    class_patterns = {
        "article_body": [r'class="([^"]*article[_-]?body[^"]*)"', r'class="([^"]*post[_-]?content[^"]*)"'],
        "article_cover": [r'class="([^"]*article[_-]?cover[^"]*)"', r'class="([^"]*hero[_-]?image[^"]*)"', r'class="([^"]*featured[_-]?image[^"]*)"'],
        "blog_card": [r'class="([^"]*blog[_-]?card[^"]*)"', r'class="([^"]*post[_-]?card[^"]*)"'],
        "blog_tag": [r'class="([^"]*blog[_-]?tag[^"]*)"', r'class="([^"]*category[_-]?tag[^"]*)"'],
        "blog_thumb": [r'class="([^"]*blog[_-]?thumb[^"]*)"', r'class="([^"]*post[_-]?thumb[^"]*)"'],
    }

    for key, patterns in class_patterns.items():
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                # Pega a primeira classe do match
                classes = match.group(1).split()
                found[key] = classes[0] if classes else defaults[key]
                break

    return {**defaults, **found}


def detect_analytics(root: Path) -> dict:
    """Detecta IDs de analytics nos arquivos HTML."""
    result = {"gtm_id": None, "ga_id": None}

    html_files = list(root.glob("*.html")) + list(root.glob("blog/*.html"))[:3]

    for html_file in html_files[:5]:
        try:
            content = html_file.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        # GTM
        gtm_match = re.search(r"GTM-[A-Z0-9]+", content)
        if gtm_match:
            result["gtm_id"] = gtm_match.group(0)

        # GA4
        ga_match = re.search(r"G-[A-Z0-9]+", content)
        if ga_match:
            result["ga_id"] = ga_match.group(0)

        if result["gtm_id"] or result["ga_id"]:
            break

    return result


def detect_domain(root: Path) -> str | None:
    """Tenta detectar o domínio do site."""
    # Verifica vite.config
    for config_name in ["vite.config.js", "vite.config.ts", "vite.config.mjs"]:
        config_path = root / config_name
        if config_path.exists():
            try:
                content = config_path.read_text(encoding="utf-8")
                # Procura hostname em sitemap ou config
                domain_match = re.search(r'hostname["\s:]+["\']https?://([^"\']+)', content)
                if domain_match:
                    return domain_match.group(1)
            except Exception:
                pass

    # Verifica CNAME
    cname_path = root / "CNAME"
    if cname_path.exists():
        return cname_path.read_text(encoding="utf-8").strip()

    # Verifica package.json homepage
    pkg_path = root / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
            homepage = pkg.get("homepage", "")
            if homepage:
                return re.sub(r"https?://", "", homepage).rstrip("/")
        except Exception:
            pass

    return None


def find_existing_blog_posts(root: Path, blog_dir: str | None) -> int:
    """Conta posts de blog existentes."""
    if not blog_dir:
        return 0

    blog_path = root / blog_dir
    if not blog_path.is_dir():
        return 0

    count = 0
    for ext in ["*.html", "*.md", "*.mdx"]:
        for f in blog_path.glob(ext):
            if "template" not in f.name.lower() and "index" not in f.name.lower():
                count += 1
    return count


def scan_project(root: Path) -> dict:
    """Escaneia o projeto e gera um draft de blog.config.json."""
    print("Escaneando projeto...")
    print(f"  Diretorio: {root}")

    framework = detect_framework(root)
    print(f"  Framework: {framework}")

    blog_dir = find_blog_directory(root)
    print(f"  Diretorio blog: {blog_dir or 'nao encontrado'}")

    template = find_blog_template(root, blog_dir)
    print(f"  Template: {template or 'nao encontrado'}")

    images_dir = find_images_directory(root)
    print(f"  Imagens: {images_dir}")

    domain = detect_domain(root)
    print(f"  Dominio: {domain or 'nao detectado'}")

    analytics = detect_analytics(root)
    if analytics["gtm_id"]:
        print(f"  GTM: {analytics['gtm_id']}")

    css_classes = {}
    if template:
        css_classes = extract_css_classes(root / template)
        print(f"  Classes CSS detectadas: {len([v for v in css_classes.values() if v])}")

    post_count = find_existing_blog_posts(root, blog_dir)
    print(f"  Posts existentes: {post_count}")

    # Monta o draft config
    config = {
        "site": {
            "name": "PENDENTE",
            "domain": domain or "PENDENTE",
            "author": "PENDENTE",
            "description": "PENDENTE",
            "target_audience": "PENDENTE"
        },
        "blog": {
            "directory": blog_dir or "blog",
            "index_file": f"{blog_dir or 'blog'}/index.html",
            "template_file": template or "PENDENTE",
            "links_file": f"{blog_dir or 'blog'}/links_permitidos.md",
            "images_dir": images_dir,
            "library_dir": images_dir.replace("/blog", "/library") if "/blog" in images_dir else f"{images_dir}/../library"
        },
        "seo": {
            "categories": ["PENDENTE_1", "PENDENTE_2", "PENDENTE_3"],
            "niches": ["PENDENTE"],
            "default_niche": "geral",
            "authorized_domains": [domain] if domain else ["PENDENTE"]
        },
        "content": {
            "service_links": [
                {"url": "PENDENTE", "description": "PENDENTE"}
            ],
            "cta": {
                "url": "PENDENTE",
                "text": "PENDENTE",
                "function": "PENDENTE"
            },
            "brand_voice": {
                "identity": "PENDENTE",
                "brand_mentions": ["PENDENTE"]
            }
        },
        "research": {
            "trends_seeds": "PENDENTE",
            "apify_google_queries": ["PENDENTE"],
            "apify_tiktok_hashtags": ["PENDENTE"]
        },
        "canva": {
            "template_id": "PENDENTE",
            "elements": {
                "niche_image": "PENDENTE",
                "title": "PENDENTE",
                "subtitle": "PENDENTE"
            }
        },
        "publication": {
            "framework": framework,
            "css_classes": css_classes or {
                "article_body": "article-body",
                "article_cover": "article-cover",
                "article_inline_image": "article-inline-image",
                "blog_card": "blog-card",
                "blog_grid": "blog-grid",
                "blog_tag": "blog-tag",
                "blog_thumb": "blog-thumb",
                "blog_content": "blog-content",
                "blog_excerpt": "blog-excerpt",
                "blog_meta": "blog-meta",
                "article_index": "article-index"
            },
            "schema_org": {
                "author_type": "Organization",
                "author_name": "PENDENTE"
            },
            "deploy": {
                "method": "git-push",
                "branch": "main"
            }
        },
        "image_library": {
            "niches": [
                {
                    "id": "geral",
                    "label": "Geral",
                    "prompt": "PENDENTE"
                }
            ]
        }
    }

    # Conta PENDENTEs
    pending_count = json.dumps(config).count("PENDENTE")
    print(f"\n  Campos pendentes: {pending_count}")

    return config


def main():
    parser = argparse.ArgumentParser(description="Escaneia projeto e gera draft de blog.config.json")
    parser.add_argument("--scan", action="store_true", help="Escanear projeto e gerar config")
    parser.add_argument("--root", default=str(PROJECT_ROOT), help="Diretorio raiz do projeto")
    parser.add_argument("--output", default="blog.config.json", help="Path de saida")
    args = parser.parse_args()

    if not args.scan:
        parser.print_help()
        sys.exit(0)

    root = Path(args.root).resolve()
    config = scan_project(root)

    output_path = root / args.output
    if output_path.exists():
        print(f"\n  AVISO: {args.output} ja existe. Salvando como blog.config.draft.json")
        output_path = root / "blog.config.draft.json"

    output_path.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n  Config salvo em: {output_path}")
    print("  Preencha os campos PENDENTE e execute o instalador de arquivos.")


if __name__ == "__main__":
    main()
