---
description: Indice do pipeline de geracao de artigos para o blog A2 Tech. A logica executavel vive em .agent/workflows/steps/.
---

# Workflow: Gerar Artigo — Indice

A logica executavel vive em `.agent/workflows/steps/`. Este arquivo e apenas referencia.
O ponto de entrada e o slash command `/gerar-artigo` (`.claude/commands/gerar-artigo.md`).

---

## Pre-requisitos

1. `.env` contem `OPENAI_API_KEY` e `FAL_KEY`
2. Dependencias instaladas: `pip install -r execution/requirements.txt`
3. Sharp CLI disponivel: `npx sharp --version`

---

## Mapa de Etapas

| Arquivo | Conteudo | GATEs |
|---------|----------|-------|
| `steps/01-pesquisa.md` | Selecao de metodo + pesquisa + banco | GATE 1: escolha do tema / GATE Angulo: escolha do angulo |
| `steps/02-conteudo.md` | SEO analyzer + article generator (recebe tema + angulo) | GATE 2: SEO plan + artigo juntos |
| `steps/03-imagens.md` | Imagens inline + capa Canva | GATE 3: revisao visual |
| `steps/04-publicacao.md` | Criar HTML, atualizar index e links, deploy | GATE 4: deploy |

---

## Caminhos de Entrada

| Invocacao | Caminho |
|-----------|---------|
| Opcao 1 (banco de ideias) | Pula 01-pesquisa → tema+angulo ja definidos no banco → 02-conteudo diretamente |
| Opcao 2 (proprio tema) | Pula 01-pesquisa → salva angulos no banco (4a) → apresenta angulos → aguarda escolha → 02-conteudo |
| Opcao 3 (pesquisar) | 01-pesquisa (metodo: Trends / Apify / Turbinado / proprios temas) → GATE 1 → GATE 2 → 02-conteudo |

---

## Metodos de Pesquisa (Opcao 3)

| Metodo | Script | Output |
|--------|--------|--------|
| Google Trends | `google_trends_research.py` | `.tmp/trends_results.json` |
| Apify (TikTok + Google Search) | `apify_social_research.py` | `.tmp/apify_research_results.json` |
| Turbinado (ambos) | Executa os dois scripts em sequencia | Ambos os arquivos acima |

---

## Scripts de Execucao

| Script | Args principais | Output |
|--------|----------------|--------|
| `google_trends_research.py` | `--seeds`, `--geo`, `--timeframe` | `.tmp/trends_results.json` |
| `apify_social_research.py` | nenhum (usa .env APIFY_API_KEY) | `.tmp/apify_research_results.json` |
| `seo_analyzer.py` | `--topic` (obrigatorio) | `.tmp/seo_plan.json` |
| `generate_article.py` | `--seo-plan` (obrigatorio), `--structure-type` | `.tmp/article_body.html` |
| `generate_inline_images.py` | `--article`, `--slug` | `public/images/blog/{slug}-inline-*.avif` |
| `generate_image_library.py` | `--niche`, `--force` | `public/images/library/{niche}.avif` |

---

## Canva

- Template de capa: `DAHEdBk1EEs` (600x315px, exportado como 1200x630 PNG)
- Imagem de nicho (elemento): `PB1BcJHLH8M57Pzt-LB8QG85Gt3CWvjhK`
- Titulo (elemento): `PB1BcJHLH8M57Pzt-LBpGbnjQcnm1B2Xv`
- Subtitulo (elemento): `PB1BcJHLH8M57Pzt-LB9tszj83w8CSHTJ`
