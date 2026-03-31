"""
Image Generator — Gera imagens para artigos do blog via fal.ai.

Suporta dois tipos:
  - cover: imagem de capa (1200x630, 16:9) para uso no template Canva
  - inline: imagem ilustrativa para dentro do artigo (800x450, 16:9)

Uso:
  # Capa
  python execution/generate_image.py --title "Agendamento Online" --keyword "agendamento online" --slug "agendamento-online-clinicas"

  # Inline
  python execution/generate_image.py --type inline --description "Profissional de saúde usando tablet" --slug "agendamento-online-clinicas" --index 1
"""

import argparse
import io
import os
import sys
from pathlib import Path

import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def build_cover_prompt(title: str, keyword: str) -> str:
    """Constrói o prompt para imagem de capa."""
    return (
        f"Professional, modern illustration for a healthcare technology blog article. "
        f"Theme: {title}. "
        f"Style: Clean, minimalist, professional. "
        f"Colors: Soft blues, whites, and subtle purple accents. "
        f"Elements: Abstract representation of healthcare and technology "
        f"(medical symbols, digital elements, connected nodes, modern UI elements). "
        f"NO text, NO letters, NO words on the image. "
        f"NO photorealistic faces. "
        f"Edge-to-edge composition filling the entire canvas. "
        f"No white borders, no margins, no empty space around edges. "
        f"High quality, suitable for web banner at 1200x630 pixels. "
        f"Modern flat design with subtle gradients and depth."
    )


def build_inline_prompt(description: str) -> str:
    """Constrói o prompt para imagem inline de artigo."""
    return (
        f"Professional digital illustration for a healthcare technology article. "
        f"Topic: {description}. "
        f"CRITICAL RULE — focus on ONE single concept only. The image must illustrate exactly one idea clearly. "
        f"Do NOT mix multiple metaphors, icons, charts, UI elements, ratings, graphs, and people all together — that creates visual noise with no narrative. "
        f"Choose the single most representative visual for this topic and execute it cleanly. "
        f"Style: Modern flat illustration. Can include UI mockups, scenes with people, objects, or interface elements — as long as it conveys one coherent idea that a reader can immediately connect to the article section. "
        f"Colors: Soft blues, whites, purple accents matching brand palette. "
        f"NO text, NO letters, NO words on the image. "
        f"NO photorealistic faces. "
        f"Edge-to-edge composition filling the entire canvas. "
        f"No white borders, no margins, no empty space around edges. "
        f"High quality, web-optimized at 800x450 pixels."
    )


def generate_with_fal(prompt: str, filename: str, output_dir: Path, dimensions: tuple[int, int] = (1200, 630)) -> Path:
    """Gera imagem usando a API do fal.ai."""
    fal_key = os.getenv("FAL_KEY")
    if not fal_key:
        print("ERRO: FAL_KEY não encontrada no .env", file=sys.stderr)
        print(f"Verifique o arquivo: {PROJECT_ROOT / '.env'}", file=sys.stderr)
        sys.exit(1)

    try:
        import fal_client

        os.environ["FAL_KEY"] = fal_key

        result = fal_client.subscribe(
            "fal-ai/nano-banana-2",
            arguments={
                "prompt": prompt,
                "aspect_ratio": "16:9",
                "resolution": "1K",
                "num_images": 1,
                "output_format": "png",
            },
        )

        image_url = result["images"][0]["url"]

    except Exception as e:
        print(f"ERRO na API fal.ai: {e}", file=sys.stderr)
        sys.exit(1)

    # Baixa a imagem
    print(f"Baixando imagem de: {image_url[:80]}...")
    img_response = requests.get(image_url, timeout=60)
    img_response.raise_for_status()

    # Converte para AVIF usando Pillow
    try:
        from PIL import Image
        import pillow_avif  # noqa: F401 — registra o codec AVIF

        img = Image.open(io.BytesIO(img_response.content))
        img = img.convert("RGB")

        # Redimensiona para as dimensões alvo se necessário
        if img.size != dimensions:
            img = img.resize(dimensions, Image.LANCZOS)

        output_path = output_dir / f"{filename}.avif"
        img.save(output_path, "AVIF", quality=80)
        print(f"Imagem salva em: {output_path}")
        return output_path

    except Exception as e:
        # Fallback: salva como PNG (o Sharp CLI pode converter depois)
        print(f"Aviso: Falha na conversão AVIF ({e}). Salvando como PNG.", file=sys.stderr)
        fallback_path = output_dir / f"{filename}.png"
        fallback_path.write_bytes(img_response.content)
        print(f"Imagem PNG salva em: {fallback_path}", file=sys.stderr)
        print("Use Sharp CLI para converter: sharp -i {input} -o {output}.avif", file=sys.stderr)
        return fallback_path


def main():
    parser = argparse.ArgumentParser(description="Gera imagem via fal.ai (capa ou inline)")
    parser.add_argument("--type", choices=["cover", "inline"], default="cover", help="Tipo de imagem (default: cover)")
    parser.add_argument("--title", help="Título do artigo (obrigatório para cover)")
    parser.add_argument("--keyword", help="Keyword principal (obrigatório para cover)")
    parser.add_argument("--description", help="Descrição da imagem (obrigatório para inline)")
    parser.add_argument("--slug", required=True, help="Slug do post (para nome do arquivo)")
    parser.add_argument("--index", type=int, help="Índice da imagem inline (ex: 1, 2)")
    parser.add_argument(
        "--output-dir",
        default="public/images/blog",
        help="Diretório de saída (default: public/images/blog)",
    )
    parser.add_argument("--force", action="store_true", help="Sobrescreve se já existir")
    args = parser.parse_args()

    # Validação de argumentos por tipo
    if args.type == "cover":
        if not args.title or not args.keyword:
            parser.error("--title e --keyword são obrigatórios para tipo 'cover'")
        prompt = build_cover_prompt(args.title, args.keyword)
        filename = args.slug
        dimensions = (1200, 630)
    else:  # inline
        if not args.description:
            parser.error("--description é obrigatório para tipo 'inline'")
        if args.index is None:
            parser.error("--index é obrigatório para tipo 'inline'")
        prompt = build_inline_prompt(args.description)
        filename = f"{args.slug}-inline-{args.index}"
        dimensions = (800, 450)

    output_dir = PROJECT_ROOT / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    # Checa se já existe
    target = output_dir / f"{filename}.avif"
    if target.exists() and not args.force:
        print(f"Imagem já existe: {target}")
        print("Use --force para sobrescrever.")
        sys.exit(0)

    print(f"Prompt de imagem: {prompt[:100]}...")
    print(f"Gerando imagem {args.type} via fal.ai...")

    output_path = generate_with_fal(prompt, filename, output_dir, dimensions)
    print(f"\n✅ Imagem gerada: {output_path}")
    print(f"Tamanho: {output_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
