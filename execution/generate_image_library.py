"""
Image Library Generator — Gera imagens de nicho para capas de blog.

Uma imagem por nicho/audiência, estilo cartoon flat minimalista com fundo azul claro.
Usadas como fundo base no template Canva, com título sobreposto.

Uso:
  python execution/generate_image_library.py               # gera todos os nichos
  python execution/generate_image_library.py --niche medico
  python execution/generate_image_library.py --dry-run
  python execution/generate_image_library.py --force
"""

import argparse
import io
import os
import sys

import requests
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from config import load_config, PROJECT_ROOT

load_dotenv(PROJECT_ROOT / ".env")


def generate_with_fal(prompt: str, output_path: Path) -> None:
    """Gera imagem via fal.ai e salva como AVIF."""
    fal_key = os.getenv("FAL_KEY")
    if not fal_key:
        print("ERRO: FAL_KEY não encontrada no .env", file=sys.stderr)
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

    print(f"  Baixando...")
    img_response = requests.get(image_url, timeout=60)
    img_response.raise_for_status()

    try:
        from PIL import Image
        import pillow_avif  # noqa: F401

        img = Image.open(io.BytesIO(img_response.content))
        img = img.convert("RGB")
        img.save(str(output_path), format="AVIF", quality=80)
        print(f"  Salvo como AVIF: {output_path.name}")

    except Exception:
        # Fallback: salva como PNG com extensão .avif
        png_path = output_path.with_suffix(".png")
        png_path.write_bytes(img_response.content)
        png_path.rename(output_path)
        print(f"  Salvo como PNG (renomeado para .avif): {output_path.name}")


def main():
    config = load_config()
    all_niches = config.get("image_library", {}).get("niches", [])
    library_dir_rel = config.get("blog", {}).get("library_dir", "public/images/library")
    library_dir = PROJECT_ROOT / library_dir_rel

    if not all_niches:
        print("ERRO: 'image_library.niches' vazio em blog.config.json", file=sys.stderr)
        sys.exit(1)

    parser = argparse.ArgumentParser(description="Gera imagens de nicho para a biblioteca de capas")
    parser.add_argument("--niche", help="Gerar apenas um nicho específico (ex: medico)")
    parser.add_argument("--dry-run", action="store_true", help="Mostrar o que seria gerado sem chamar a API")
    parser.add_argument("--force", action="store_true", help="Regenerar mesmo se o arquivo já existir")
    args = parser.parse_args()

    library_dir.mkdir(parents=True, exist_ok=True)

    niches = all_niches
    if args.niche:
        niches = [n for n in all_niches if n["id"] == args.niche]
        if not niches:
            print(f"ERRO: Nicho '{args.niche}' não encontrado. Disponíveis: {[n['id'] for n in all_niches]}", file=sys.stderr)
            sys.exit(1)

    generated = 0
    skipped = 0

    for niche in niches:
        output_path = library_dir / f"{niche['id']}.avif"

        if output_path.exists() and not args.force:
            print(f"[SKIP] {niche['id']} — já existe ({output_path.name})")
            skipped += 1
            continue

        if args.dry_run:
            print(f"[DRY-RUN] {niche['id']} — {niche['label']}")
            print(f"  Prompt: {niche['prompt'][:80]}...")
            continue

        print(f"[GERANDO] {niche['id']} — {niche['label']}")
        generate_with_fal(niche["prompt"], output_path)
        generated += 1

    print(f"\nConcluído: {generated} geradas, {skipped} puladas.")
    if generated > 0:
        print(f"Custo estimado: ~${generated * 0.08:.2f}")


if __name__ == "__main__":
    main()
