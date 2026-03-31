"""
Google Trends Research — Busca temas em alta para o nicho de saude.

Usa SerpAPI (Google Trends) como fonte principal para consultar temas trending
com seeds do nicho de saude e retorna topicos com potencial de busca.

Uso:
  python execution/google_trends_research.py --seeds "psicologo,dentista,clinica,nutricionista"
  python execution/google_trends_research.py --seeds "automacao whatsapp,agendamento online" --timeframe "today 1-m"
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

# Forca UTF-8 no stdout/stderr para evitar UnicodeEncodeError no Windows (cp1252)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def fetch_trends_serpapi(seeds: list[str], geo: str, timeframe: str) -> list[dict]:
    """Consulta Google Trends via SerpAPI para cada seed."""
    try:
        from serpapi import GoogleSearch
    except ImportError:
        print("ERRO: serpapi nao instalado. Execute: pip install google-search-results", file=sys.stderr)
        sys.exit(1)

    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        print("ERRO: SERPAPI_KEY nao encontrada no .env", file=sys.stderr)
        sys.exit(1)

    all_topics = []

    for seed in seeds:
        seed = seed.strip()
        if not seed:
            continue

        print(f"Pesquisando: '{seed}'...")

        try:
            # Busca queries relacionadas em alta
            params_rising = {
                "engine": "google_trends",
                "q": seed,
                "geo": geo,
                "date": timeframe,
                "data_type": "RELATED_QUERIES",
                "api_key": api_key,
            }
            result_queries = GoogleSearch(params_rising).get_dict()

            rising_queries = []
            top_queries = []

            if "related_queries" in result_queries:
                rq = result_queries["related_queries"]
                rising_queries = [item["query"] for item in rq.get("rising", [])[:5]]
                top_queries = [item["query"] for item in rq.get("top", [])[:5]]

            # Busca topicos relacionados em alta
            params_topics = {
                "engine": "google_trends",
                "q": seed,
                "geo": geo,
                "date": timeframe,
                "data_type": "RELATED_TOPICS",
                "api_key": api_key,
            }
            result_topics = GoogleSearch(params_topics).get_dict()

            rising_topics = []
            if "related_topics" in result_topics:
                rt = result_topics["related_topics"]
                rising_topics = [item["topic"]["title"] for item in rt.get("rising", [])[:3]]

            # Busca serie temporal para calcular interesse medio
            params_time = {
                "engine": "google_trends",
                "q": seed,
                "geo": geo,
                "date": timeframe,
                "data_type": "TIMESERIES",
                "api_key": api_key,
            }
            result_time = GoogleSearch(params_time).get_dict()

            avg_interest = 0
            if "interest_over_time" in result_time:
                values = [p.get("value", [0])[0] for p in result_time["interest_over_time"].get("timeline_data", [])]
                if values:
                    avg_interest = int(sum(values) / len(values))

            all_topics.append({
                "seed": seed,
                "average_interest": avg_interest,
                "rising_queries": rising_queries,
                "top_queries": top_queries,
                "rising_topics": rising_topics,
                "source": "serpapi",
            })

            time.sleep(1)  # Rate limiting leve entre seeds

        except Exception as e:
            print(f"  Falha para '{seed}': {e}", file=sys.stderr)
            all_topics.append({
                "seed": seed,
                "average_interest": 0,
                "rising_queries": [],
                "top_queries": [],
                "rising_topics": [],
                "source": "fallback",
                "error": str(e),
            })

    return all_topics


def generate_topic_suggestions(trends_data: list[dict]) -> list[dict]:
    """Processa os dados de trends e gera sugestoes de temas para artigos."""
    suggestions = []

    for trend in trends_data:
        for query in trend.get("rising_queries", []):
            suggestions.append({
                "keyword": query,
                "trend_type": "rising",
                "source_seed": trend["seed"],
                "relative_interest": trend["average_interest"],
                "source": trend["source"],
            })

        for query in trend.get("top_queries", []):
            suggestions.append({
                "keyword": query,
                "trend_type": "top",
                "source_seed": trend["seed"],
                "relative_interest": trend["average_interest"],
                "source": trend["source"],
            })

        # Se nao teve queries, adiciona a seed como fallback
        if not trend.get("rising_queries") and not trend.get("top_queries"):
            suggestions.append({
                "keyword": trend["seed"],
                "trend_type": "seed_fallback",
                "source_seed": trend["seed"],
                "relative_interest": trend["average_interest"],
                "source": trend["source"],
            })

    # Remove duplicatas
    seen = set()
    unique = []
    for s in suggestions:
        key = s["keyword"].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(s)

    # Ordena: rising primeiro, depois por interesse
    unique.sort(key=lambda x: (
        0 if x["trend_type"] == "rising" else 1,
        -x["relative_interest"],
    ))

    return unique


def main():
    parser = argparse.ArgumentParser(description="Pesquisa temas trending via SerpAPI (Google Trends)")
    parser.add_argument(
        "--seeds",
        required=True,
        help="Keywords separadas por virgula (ex: 'psicologo,dentista,clinica')",
    )
    parser.add_argument("--geo", default="BR", help="Codigo do pais (default: BR)")
    parser.add_argument(
        "--timeframe",
        default="today 3-m",
        help="Periodo de busca (default: 'today 3-m')",
    )
    parser.add_argument(
        "--output",
        default=".tmp/trends_results.json",
        help="Path para salvar o JSON de saida",
    )
    args = parser.parse_args()

    seeds = [s.strip() for s in args.seeds.split(",") if s.strip()]
    if not seeds:
        print("ERRO: Nenhuma seed fornecida", file=sys.stderr)
        sys.exit(1)

    print(f"Seeds: {seeds}")
    print(f"Regiao: {args.geo} | Periodo: {args.timeframe}")
    print("---")

    trends_data = fetch_trends_serpapi(seeds, args.geo, args.timeframe)
    suggestions = generate_topic_suggestions(trends_data)

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "config": {
            "seeds": seeds,
            "geo": args.geo,
            "timeframe": args.timeframe,
        },
        "raw_trends": trends_data,
        "suggestions": suggestions[:20],
    }

    output_path = PROJECT_ROOT / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nResultados salvos em: {output_path}")
    print(f"Total de sugestoes: {len(suggestions)}")

    print("\nTop 10 sugestoes:")
    for i, s in enumerate(suggestions[:10], 1):
        print(f"  {i}. [{s['trend_type']}] {s['keyword']} (interesse: {s['relative_interest']})")

    fallbacks = [t for t in trends_data if t["source"] == "fallback"]
    if fallbacks:
        print(f"\nAVISO: {len(fallbacks)} seed(s) falharam:")
        for f in fallbacks:
            print(f"  - {f['seed']}: {f.get('error', 'desconhecido')}")


if __name__ == "__main__":
    main()
