"""
SEO Analyzer — Gera metadados de SEO estruturados para um tema de artigo.

Usa a API da OpenAI para analisar o tema e gerar: keyword principal,
keywords secundárias, meta description, title, slug, categoria, nicho,
tipo de estrutura e sugestões de H2.

Uso:
  python execution/seo_analyzer.py --topic "agendamento online para clinicas"
  python execution/seo_analyzer.py --topic "marketing para psicólogos" --existing-posts blog/links_permitidos.md
"""

import argparse
import json
import os
import sys

from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
from openai import OpenAI

from config import load_config, PROJECT_ROOT

load_dotenv(PROJECT_ROOT / ".env")


def load_existing_posts(filepath: str) -> str:
    """Lê o arquivo links_permitidos.md e retorna seu conteúdo."""
    path = PROJECT_ROOT / filepath
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def generate_seo_plan(topic: str, existing_posts: str) -> dict:
    """Chama a OpenAI API para gerar o plano SEO estruturado."""
    config = load_config()
    site = config["site"]
    seo = config["seo"]

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERRO: OPENAI_API_KEY não encontrada no .env", file=sys.stderr)
        print(f"Verifique o arquivo: {PROJECT_ROOT / '.env'}", file=sys.stderr)
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    existing_context = ""
    if existing_posts:
        existing_context = f"""

## Posts já existentes no blog (evite canibalização de keyword):
{existing_posts}
"""

    categories_str = ", ".join(seo["categories"])
    niches_str = ", ".join(seo["niches"])

    system_prompt = f"""Você é um especialista em SEO para blogs no Brasil.
Sua tarefa é analisar um tema e gerar metadados de SEO otimizados para ranqueamento no Google.

Responda APENAS com um JSON válido, sem markdown, sem explicação, sem ```json.

O JSON deve ter esta estrutura exata:
{{
  "primary_keyword": "keyword principal em português (2-4 palavras, alto volume de busca)",
  "secondary_keywords": ["keyword2", "keyword3", "keyword4", "keyword5"],
  "meta_title": "Título otimizado para SEO (max 60 chars) | {site['name']}",
  "meta_description": "Descrição meta persuasiva com keyword (max 155 chars)",
  "slug": "slug-em-kebab-case-sem-acentos",
  "category": "Uma de: {categories_str}",
  "niche": "Uma de: {niches_str}",
  "structure_type": "Uma de: tutorial, guia, estudo-de-caso, comparativo, erros-e-acertos, infografico, lista, checklist, jornada",
  "word_count_target": 1800,
  "h2_suggestions": [
    "Sugestão de H2 contextual e criativo (seguindo padrões aprovados)",
    "Outro H2 com gancho emocional",
    "H2 com urgência ou consequência",
    "H2 CTA provocativo final"
  ]
}}

Regras:
- O slug NÃO pode ter acentos, cedilha ou caracteres especiais
- O meta_title deve ter a keyword principal
- A meta_description deve ter a keyword e uma proposta de valor clara
- Os H2 sugeridos devem ser CONTEXTUAIS e CRIATIVOS, nunca genéricos
- Se o tema for amplo, word_count_target = 1800-2000. Se específico, 600-1000
- Escolha structure_type baseado no ângulo do tema:
  - tutorial: como fazer X passo a passo, execução prática
  - guia: visão estratégica ampla, pilares de um tema
  - estudo-de-caso: caso real ou composto, narrativa de transformação
  - comparativo: X vs Y, avaliação de ferramentas ou abordagens
  - erros-e-acertos: erros comuns + como corrigir, alta intenção de leitura
  - infografico: dados, estatísticas, panorama visual e escaneável
  - lista: N itens acionáveis, listicle, topo de funil
  - checklist: itens de verificação práticos, processo estruturado
  - jornada: narrativa de processo universal, leitor como protagonista"""

    user_prompt = f"""Tema do artigo: {topic}

Público-alvo: {site['target_audience']}
Blog: {site['name']} ({site['description']})
{existing_context}
Gere o JSON de SEO para este tema."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()

    # Remove possíveis marcadores de código
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]

    try:
        plan = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"ERRO: Resposta da API não é JSON válido: {e}", file=sys.stderr)
        print(f"Resposta raw:\n{raw}", file=sys.stderr)
        sys.exit(1)

    # Validação básica
    required_keys = [
        "primary_keyword", "secondary_keywords", "meta_title",
        "meta_description", "slug", "category", "niche", "structure_type",
        "word_count_target", "h2_suggestions",
    ]
    missing = [k for k in required_keys if k not in plan]
    if missing:
        print(f"ERRO: Campos ausentes no JSON: {missing}", file=sys.stderr)
        sys.exit(1)

    return plan


def main():
    parser = argparse.ArgumentParser(description="Gera plano SEO para artigo do blog")
    parser.add_argument("--topic", required=True, help="Tema do artigo")
    parser.add_argument(
        "--existing-posts",
        default="blog/links_permitidos.md",
        help="Path para o arquivo de posts existentes (default: blog/links_permitidos.md)",
    )
    parser.add_argument(
        "--output",
        default=".tmp/seo_plan.json",
        help="Path para salvar o JSON de saída (default: .tmp/seo_plan.json)",
    )
    args = parser.parse_args()

    existing_posts = load_existing_posts(args.existing_posts)
    plan = generate_seo_plan(args.topic, existing_posts)

    # Garante que o diretório de saída existe
    output_path = PROJECT_ROOT / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)

    output_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Plano SEO salvo em: {output_path}")
    print(json.dumps(plan, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
