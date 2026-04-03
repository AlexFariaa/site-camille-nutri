"""
Article Generator — Gera o HTML do artigo usando a API da OpenAI.

Usa o sistema de prompts de `.agent/prompts/article-generator.md` como base
e injeta o template do ângulo específico de `.agent/prompts/templates/{angulo}.md`.

Uso:
  python execution/generate_article.py \
    --seo-plan .tmp/seo_plan.json \
    --links-file blog/links_permitidos.md \
    --structure-type tutorial
"""

import argparse
import json
import os
import re
import sys

from dotenv import load_dotenv
from openai import OpenAI

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from config import load_config, PROJECT_ROOT

load_dotenv(PROJECT_ROOT / ".env")

# H2 genéricos que devem ser rejeitados (anti-patterns)
BANNED_H2_PATTERNS = [
    r"^conclusão$",
    r"^o que é ",
    r"^dica extra",
    r"^bônus",
    r"^por que isso importa",
    r"^o que ninguém te contou$",
    r"^vamos lá\??$",
    r"^vamos nessa\??$",
    r"^como começar$",
    r"^por onde começar$",
    r"^o que é isso na prática",
    r"^introdução$",
    r"^resumo$",
]

# Links externos autorizados — carregados de blog.config.json
def _load_authorized_domains() -> list[str]:
    config = load_config()
    return config.get("seo", {}).get("authorized_domains", [])


VALID_STRUCTURE_TYPES = [
    "tutorial",
    "guia",
    "estudo-de-caso",
    "comparativo",
    "erros-e-acertos",
    "infografico",
    "lista",
    "checklist",
    "jornada",
]

TEMPLATES_DIR = PROJECT_ROOT / ".agent" / "prompts" / "templates"


def load_file(filepath: str) -> str:
    """Lê um arquivo relativo ao projeto."""
    path = PROJECT_ROOT / filepath
    if not path.exists():
        print(f"ERRO: Arquivo não encontrado: {path}", file=sys.stderr)
        sys.exit(1)
    return path.read_text(encoding="utf-8")


def load_template(structure_type: str) -> str:
    """Carrega o template do ângulo específico."""
    template_path = TEMPLATES_DIR / f"{structure_type}.md"
    if not template_path.exists():
        print(f"AVISO: Template não encontrado para '{structure_type}': {template_path}", file=sys.stderr)
        return ""
    return template_path.read_text(encoding="utf-8")


def validate_article(html: str, seo_plan: dict) -> list[str]:
    """Valida o artigo gerado contra as regras de qualidade."""
    authorized_domains = _load_authorized_domains()
    warnings = []
    keyword = seo_plan.get("primary_keyword", "").lower()
    html_lower = html.lower()

    # 1. Keyword no conteúdo
    if keyword and keyword not in html_lower:
        warnings.append(f"Keyword principal '{keyword}' não encontrada no artigo")

    # 2. Checa H2s genéricos
    h2_matches = re.findall(r"<h2[^>]*>(.*?)</h2>", html, re.IGNORECASE)
    for h2 in h2_matches:
        h2_clean = h2.strip().lower()
        h2_clean = re.sub(r"<[^>]+>", "", h2_clean)  # Remove tags internas
        for pattern in BANNED_H2_PATTERNS:
            if re.match(pattern, h2_clean):
                warnings.append(f"H2 genérico detectado (anti-pattern): '{h2.strip()}'")
                break

    # 3. Contagem de palavras
    text_only = re.sub(r"<[^>]+>", " ", html)
    word_count = len(text_only.split())
    target = seo_plan.get("word_count_target", 1500)
    tolerance = 0.15  # 15% de tolerância
    if word_count < target * (1 - tolerance):
        warnings.append(f"Artigo muito curto: {word_count} palavras (alvo: {target})")
    elif word_count > target * (1 + tolerance):
        warnings.append(f"Artigo muito longo: {word_count} palavras (alvo: {target})")

    # 4. Links não autorizados
    links = re.findall(r'href=["\']([^"\']+)["\']', html)
    for link in links:
        if link.startswith("http"):
            domain = re.sub(r"https?://", "", link).split("/")[0]
            if domain not in authorized_domains:
                warnings.append(f"Link externo não autorizado: {link}")
        elif link.startswith("#"):
            continue  # Âncoras internas OK
        elif not link.startswith("/"):
            warnings.append(f"Link com formato suspeito: {link}")

    # 5. Quantidade de links internos
    internal_links = [l for l in links if l.startswith("/blog/")]
    if len(internal_links) > 4:
        warnings.append(f"Excesso de links internos: {len(internal_links)} (máx: 4)")
    elif len(internal_links) == 0:
        warnings.append("Nenhum link interno encontrado (recomendado: 2-4)")

    # 6. Keyword no H2
    keyword_in_h2 = any(keyword in h2.lower() for h2 in h2_matches) if keyword else True
    if not keyword_in_h2:
        warnings.append(f"Keyword '{keyword}' não aparece em nenhum H2")

    # 7. Índice (nav.article-index obrigatório)
    if '<nav class="article-index"' not in html:
        warnings.append("Índice ausente: <nav class=\"article-index\"> não encontrado (obrigatório)")
    else:
        # Verifica se H2s têm atributo id
        h2_with_id = re.findall(r'<h2\s+id=["\'][^"\']+["\']', html, re.IGNORECASE)
        if len(h2_with_id) < len(h2_matches) - 1:  # -1 permite CTA sem id
            warnings.append(f"H2s sem atributo id: {len(h2_with_id)}/{len(h2_matches)} com id (todos exceto CTA devem ter)")

    # 8. Placeholders de imagem inline (1-2 obrigatórios)
    inline_placeholders = re.findall(r"<!-- INLINE_IMAGE:\s*(.+?)\s*-->", html)
    if len(inline_placeholders) == 0:
        warnings.append("Nenhum placeholder INLINE_IMAGE encontrado (obrigatório: 1-2)")
    elif len(inline_placeholders) > 2:
        warnings.append(f"Excesso de placeholders INLINE_IMAGE: {len(inline_placeholders)} (máx: 2)")

    # 8. Atributo title em imagens
    img_tags = re.findall(r"<img\s[^>]+>", html, re.IGNORECASE)
    for img in img_tags:
        if "title=" not in img.lower():
            warnings.append(f"Imagem sem atributo title: {img[:80]}...")

    # 9. Atributo title em links
    link_tags = re.findall(r"<a\s[^>]+>", html, re.IGNORECASE)
    for link in link_tags:
        # Pular links de modal (onclick)
        if 'onclick=' in link.lower() and 'href="#"' in link.lower():
            continue
        if "title=" not in link.lower():
            href_match = re.search(r'href=["\']([^"\']+)', link)
            href = href_match.group(1) if href_match else "unknown"
            warnings.append(f"Link sem atributo title: {href}")

    return warnings


def generate_article(seo_plan: dict, prompt_content: str, template_content: str, links_content: str, structure_type: str) -> tuple[str, list[str]]:
    """Gera o artigo via OpenAI API."""
    config = load_config()
    site_name = config["site"]["name"]

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERRO: OPENAI_API_KEY não encontrada no .env", file=sys.stderr)
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    # Extrai links internos disponíveis do links_permitidos.md
    available_links = re.findall(
        r"\*\s+\*\*`(/blog/[^`]+)`\*\*\s*\n\s*\*\s+\*\*Título/Tema:\*\*\s*(.+)",
        links_content,
    )
    links_summary = "\n".join(
        f"- {url} — {title}" for url, title in available_links
    )

    template_section = f"\n\n---\n\n## TEMPLATE DO ÂNGULO: {structure_type.upper()}\n\n{template_content}" if template_content else ""

    system_prompt = f"""{prompt_content}{template_section}

---

## CONTEXTO DESTA GERAÇÃO

### Links internos disponíveis para link building (escolha 2-4 relevantes):
{links_summary}

### Tipo de estrutura deste artigo: {structure_type}
Siga rigorosamente a estrutura, sequência de H2 e instruções do template injetado acima."""

    user_prompt = f"""Gere o artigo HTML completo para o seguinte plano SEO:

- **Keyword principal:** {seo_plan['primary_keyword']}
- **Keywords secundárias:** {', '.join(seo_plan.get('secondary_keywords', []))}
- **Título (H1):** {seo_plan['meta_title'].replace(f' | {site_name}', '')}
- **Slug:** {seo_plan['slug']}
- **Categoria:** {seo_plan['category']}
- **Tipo de estrutura:** {structure_type}
- **Alvo de palavras:** {seo_plan['word_count_target']}
- **Sugestões de H2 (use como inspiração, adapte):** {json.dumps(seo_plan.get('h2_suggestions', []), ensure_ascii=False)}

IMPORTANTE:
1. Gere APENAS o HTML que vai dentro de <div class="article-body">
2. Comece com a tag <img> de capa: <img src="/images/blog/{seo_plan['slug']}.avif" alt="..." class="article-cover">
3. NÃO inclua <html>, <head>, <body>, header, footer ou sidebar
4. Siga TODOS os anti-patterns proibidos da seção 2 do prompt
5. Use os padrões de H2 aprovados da seção 3
6. Inclua 2-4 links internos do blog de forma natural
7. Não use travessões no conteúdo do artigo
8. Termine com CTA provocativo e link para openModal()
9. OBRIGATORIO: o artigo deve ter NO MINIMO {int(seo_plan['word_count_target'] * 0.85)} palavras e NO MAXIMO {int(seo_plan['word_count_target'] * 1.15)} palavras. Expanda cada secao com exemplos praticos, listas detalhadas e paragrafos explicativos para atingir esse volume. NAO resuma — desenvolva."""

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=8000,
    )

    article_html = response.choices[0].message.content.strip()

    # Remove possíveis marcadores de código
    if article_html.startswith("```"):
        article_html = article_html.split("\n", 1)[1]
    if article_html.endswith("```"):
        article_html = article_html.rsplit("```", 1)[0]

    warnings = validate_article(article_html, seo_plan)

    return article_html, warnings


def main():
    parser = argparse.ArgumentParser(description="Gera artigo HTML via OpenAI API")
    parser.add_argument("--seo-plan", required=True, help="Path para o JSON do plano SEO")
    parser.add_argument(
        "--prompt-file",
        default=".agent/prompts/article-generator.md",
        help="Path para o arquivo de prompt (default: .agent/prompts/article-generator.md)",
    )
    parser.add_argument(
        "--links-file",
        default="blog/links_permitidos.md",
        help="Path para o arquivo de links permitidos",
    )
    parser.add_argument(
        "--structure-type",
        choices=VALID_STRUCTURE_TYPES,
        help="Tipo de estrutura do post (sobrescreve o do SEO plan se fornecido)",
    )
    parser.add_argument(
        "--output",
        default=".tmp/article_body.html",
        help="Path para salvar o HTML de saída",
    )
    args = parser.parse_args()

    # Carrega inputs
    seo_plan = json.loads(load_file(args.seo_plan))
    prompt_content = load_file(args.prompt_file)
    links_content = load_file(args.links_file)

    structure_type = args.structure_type or seo_plan.get("structure_type", "tutorial")
    template_content = load_template(structure_type)

    # Gera artigo
    article_html, warnings = generate_article(seo_plan, prompt_content, template_content, links_content, structure_type)

    # Salva output
    output_path = PROJECT_ROOT / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(article_html, encoding="utf-8")

    print(f"Artigo salvo em: {output_path}")

    # Contagem de palavras
    text_only = re.sub(r"<[^>]+>", " ", article_html)
    word_count = len(text_only.split())
    print(f"Palavras: {word_count}")

    # H2s gerados
    h2s = re.findall(r"<h2[^>]*>(.*?)</h2>", article_html, re.IGNORECASE)
    print(f"H2s ({len(h2s)}):")
    for h2 in h2s:
        clean = re.sub(r"<[^>]+>", "", h2)
        print(f"  - {clean}")

    # Warnings
    if warnings:
        print(f"\n⚠️  {len(warnings)} aviso(s):")
        for w in warnings:
            print(f"  - {w}")
    else:
        print("\n✅ Nenhum aviso de validação")


if __name__ == "__main__":
    main()
