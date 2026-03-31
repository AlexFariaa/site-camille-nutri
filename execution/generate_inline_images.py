"""
Inline Image Processor — Extrai placeholders INLINE_IMAGE do artigo HTML,
gera imagens via fal.ai e substitui os placeholders por tags <img> reais.

Uso:
  python execution/generate_inline_images.py --article .tmp/article_body.html --slug "meu-artigo"
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def extract_placeholders(html: str) -> list[str]:
    """Extrai descrições dos placeholders INLINE_IMAGE."""
    return re.findall(r"<!-- INLINE_IMAGE:\s*(.+?)\s*-->", html)


def generate_inline_image(description: str, slug: str, index: int) -> bool:
    """Gera uma imagem inline chamando generate_image.py."""
    cmd = [
        sys.executable,
        str(PROJECT_ROOT / "execution" / "generate_image.py"),
        "--type", "inline",
        "--description", description,
        "--slug", slug,
        "--index", str(index),
        "--force",
    ]

    print(f"\n--- Gerando imagem inline {index} ---")
    print(f"Descrição: {description[:80]}...")

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERRO ao gerar imagem inline {index}:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return False

    print(result.stdout)
    return True


def replace_placeholders(html: str, slug: str, descriptions: list[str]) -> str:
    """Substitui placeholders por tags <img> reais."""
    for i, description in enumerate(descriptions, 1):
        placeholder = f"<!-- INLINE_IMAGE: {description} -->"
        # Gera alt e title a partir da descrição (trunca se muito longa)
        alt_text = description[:120].strip().strip('"').strip("'")
        title_text = description[:120].strip().strip('"').strip("'")

        img_tag = (
            f'<img src="/images/blog/{slug}-inline-{i}.avif" '
            f'alt="{alt_text}" title="{title_text}" '
            f'class="article-inline-image">'
        )

        html = html.replace(placeholder, img_tag)

    return html


def main():
    parser = argparse.ArgumentParser(description="Processa placeholders INLINE_IMAGE no artigo")
    parser.add_argument("--article", required=True, help="Path do HTML do artigo (ex: .tmp/article_body.html)")
    parser.add_argument("--slug", required=True, help="Slug do post")
    args = parser.parse_args()

    article_path = PROJECT_ROOT / args.article
    if not article_path.exists():
        print(f"ERRO: Arquivo não encontrado: {article_path}", file=sys.stderr)
        sys.exit(1)

    html = article_path.read_text(encoding="utf-8")

    # Extrai placeholders
    descriptions = extract_placeholders(html)
    if not descriptions:
        print("Nenhum placeholder INLINE_IMAGE encontrado no artigo.")
        sys.exit(0)

    print(f"Encontrados {len(descriptions)} placeholder(s) INLINE_IMAGE")

    # Gera imagens
    success_count = 0
    for i, desc in enumerate(descriptions, 1):
        if generate_inline_image(desc, args.slug, i):
            success_count += 1

    if success_count == 0:
        print("\nERRO: Nenhuma imagem inline foi gerada com sucesso.", file=sys.stderr)
        sys.exit(1)

    # Substitui placeholders no HTML
    updated_html = replace_placeholders(html, args.slug, descriptions)
    article_path.write_text(updated_html, encoding="utf-8")

    print(f"\n✅ {success_count}/{len(descriptions)} imagens inline geradas e inseridas no artigo")
    print(f"Artigo atualizado: {article_path}")

    # Lista arquivos gerados
    images_dir = PROJECT_ROOT / "public" / "images" / "blog"
    for i in range(1, len(descriptions) + 1):
        img_path = images_dir / f"{args.slug}-inline-{i}.avif"
        if img_path.exists():
            print(f"  {img_path.name} ({img_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
