#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Apify Social Research - Busca ideias de conteudo em multiplas plataformas
Fontes: Google (PAA + related), TikTok, Reddit
"""

import json
import os
import sys
import time
import requests
from datetime import datetime

# Forcar UTF-8 no stdout (Windows fix)
if sys.stdout.encoding != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv
from config import load_config, PROJECT_ROOT

load_dotenv(PROJECT_ROOT / ".env")

APIFY_TOKEN = os.getenv("APIFY_API_KEY")
if not APIFY_TOKEN:
    raise EnvironmentError("APIFY_API_KEY nao encontrada no .env")
BASE_URL = "https://api.apify.com/v2"

# ──────────────────────────────────────────────────────────────
# Core: Apify runner (async com polling)
# ──────────────────────────────────────────────────────────────

def run_actor(actor_id: str, input_data: dict, memory_mb: int = 512, timeout_secs: int = 120) -> list:
    """Inicia um ator, aguarda conclusao e retorna os itens do dataset."""
    # Apify usa ~ como separador em URLs (nao /)
    actor_slug = actor_id.replace("/", "~")
    start_url = f"{BASE_URL}/acts/{actor_slug}/runs"
    params = {"token": APIFY_TOKEN, "timeout": timeout_secs, "memory": memory_mb}

    try:
        r = requests.post(start_url, json=input_data, params=params, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f"  [ERRO] Não foi possível iniciar {actor_id}: {e}")
        return []

    run = r.json().get("data", {})
    run_id = run.get("id")
    if not run_id:
        print(f"  [ERRO] run_id ausente na resposta de {actor_id}")
        return []

    # Polling de status
    poll_url = f"{BASE_URL}/actor-runs/{run_id}"
    for attempt in range(timeout_secs // 5):
        time.sleep(5)
        try:
            status_r = requests.get(poll_url, params={"token": APIFY_TOKEN}, timeout=15)
            status_data = status_r.json().get("data", {})
            status = status_data.get("status", "")
        except Exception:
            continue

        if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            if status != "SUCCEEDED":
                print(f"  [AVISO] {actor_id} terminou com status: {status}")
                return []
            break
    else:
        print(f"  [AVISO] {actor_id} não concluiu no tempo limite")
        return []

    # Buscar itens do dataset
    dataset_id = status_data.get("defaultDatasetId")
    items_url = f"{BASE_URL}/datasets/{dataset_id}/items"
    try:
        items_r = requests.get(items_url, params={"token": APIFY_TOKEN, "format": "json", "limit": 200}, timeout=30)
        return items_r.json() if isinstance(items_r.json(), list) else []
    except Exception as e:
        print(f"  [ERRO] Não foi possível obter itens: {e}")
        return []


# ──────────────────────────────────────────────────────────────
# Fontes
# ──────────────────────────────────────────────────────────────

def pesquisar_google(queries: list[str]) -> list:
    """Google Search Scraper — extrai relatedQueries e resultados organicos.
    - countryCode: lowercase (br, nao BR)
    - languageCode: pt-BR (nao pt)
    - queries: string com newlines (nao array)
    - chave de resultado: relatedQueries (nao relatedSearches)
    """
    input_data = {
        "queries": "\n".join(queries),
        "countryCode": "br",
        "languageCode": "pt-BR",
        "maxPagesPerQuery": 1,
        "resultsPerPage": 10,
    }
    return run_actor("apify/google-search-scraper", input_data, memory_mb=256)


def pesquisar_tiktok(hashtags: list[str], max_items: int = 15) -> list:
    """TikTok Scraper — top videos por hashtag em PT-BR."""
    input_data = {
        "hashtags": hashtags,
        "resultsPerPage": max_items,
        "shouldDownloadVideos": False,
        "shouldDownloadCovers": False,
        "shouldDownloadSubtitles": False,
    }
    return run_actor("clockworks/tiktok-scraper", input_data, memory_mb=512)


def pesquisar_youtube(queries: list[str]) -> list:
    """YouTube Search Scraper — videos em PT-BR sobre marketing na saude."""
    input_data = {
        "searchKeywords": queries[0],  # um por vez para nao exceder creditos
        "maxResults": 20,
        "gl": "BR",
        "hl": "pt-BR",
    }
    return run_actor("bernardo_apartner/youtube-search-scraper", input_data, memory_mb=256)


def pesquisar_reddit(queries: list[str]) -> list:
    """Reddit Scraper — posts recentes (ator oficial da Apify)."""
    input_data = {
        "searches": queries,
        "type": "posts",
        "sort": "relevance",
        "time": "month",
        "maxItems": 20,
        "proxy": {"useApifyProxy": True},
    }
    return run_actor("apify/reddit-scraper", input_data, memory_mb=512)


# ──────────────────────────────────────────────────────────────
# Extração de sinais
# ──────────────────────────────────────────────────────────────

def extrair_google_signals(resultados: list) -> dict:
    """Extrai relatedQueries e titulos organicos dos resultados do Google.
    Nota: chave correta e 'relatedQueries' (nao relatedSearches).
    PAA frequentemente vazio dependendo do provider — usar relatedQueries.
    """
    paa = []
    related = []
    for r in resultados:
        if not isinstance(r, dict):
            continue
        for q in r.get("peopleAlsoAsk", []):
            pergunta = q.get("question", "") if isinstance(q, dict) else str(q)
            if pergunta and pergunta not in paa:
                paa.append(pergunta)
        # Chave correta: relatedQueries (nao relatedSearches)
        for s in r.get("relatedQueries", []):
            busca = s.get("title", s.get("query", "")) if isinstance(s, dict) else str(s)
            if busca and busca not in related:
                related.append(busca)
    return {"paa": paa, "related": related}


def extrair_tiktok_signals(resultados: list) -> list:
    """Retorna top vídeos por playCount com título e hashtags."""
    videos = []
    for v in resultados:
        if not isinstance(v, dict):
            continue
        videos.append({
            "texto": v.get("text", "")[:120],
            "views": v.get("playCount", 0),
            "likes": v.get("diggCount", 0),
            "hashtags": v.get("hashtags", []),
        })
    return sorted(videos, key=lambda x: x["views"], reverse=True)


def extrair_reddit_signals(resultados: list) -> list:
    """Retorna títulos dos posts mais votados."""
    posts = []
    for p in resultados:
        if not isinstance(p, dict):
            continue
        posts.append({
            "titulo": p.get("title", ""),
            "upvotes": p.get("score", 0),
            "subreddit": p.get("subreddit", ""),
            "url": p.get("url", ""),
        })
    return sorted(posts, key=lambda x: x["upvotes"], reverse=True)


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

def main():
    config = load_config()
    research = config.get("research", {})
    site_name = config["site"]["name"]

    queries_google = research.get("apify_google_queries", [])
    hashtags_tiktok = research.get("apify_tiktok_hashtags", [])

    if not queries_google:
        print("ERRO: 'research.apify_google_queries' vazio em blog.config.json", file=sys.stderr)
        sys.exit(1)

    print("=" * 60)
    print(f"Apify Social Research — Ideias de Conteúdo para {site_name}")
    print(f"Iniciado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    raw = {}

    # ── Google ──────────────────────────────────────────────
    print("\n[1/4] Google Search — PAA e buscas relacionadas...")
    google_raw = pesquisar_google(queries_google)
    raw["google"] = google_raw
    google_signals = extrair_google_signals(google_raw)
    print(f"  PAA: {len(google_signals['paa'])} perguntas | Related: {len(google_signals['related'])} buscas")

    # ── TikTok — hashtags PT-BR ──────────────────────────────
    print("\n[2/4] TikTok — Videos em alta (hashtags PT-BR)...")
    tiktok_raw = pesquisar_tiktok(hashtags_tiktok, max_items=15)
    raw["tiktok"] = tiktok_raw
    tiktok_signals = extrair_tiktok_signals(tiktok_raw)
    print(f"  {len(tiktok_signals)} videos encontrados")

    # ── YouTube ─────────────────────────────────────────────
    print("\n[3/4] YouTube — Busca de conteudo em alta...")
    queries_yt = [queries_google[0]]
    youtube_raw = pesquisar_youtube(queries_yt)
    raw["youtube"] = youtube_raw
    print(f"  {len(youtube_raw)} videos encontrados")

    # ── Reddit ──────────────────────────────────────────────
    print("\n[4/4] Reddit — Discussoes...")
    queries_reddit = queries_google[:2]
    reddit_raw = pesquisar_reddit(queries_reddit)
    raw["reddit"] = reddit_raw
    reddit_signals = extrair_reddit_signals(reddit_raw)
    print(f"  {len(reddit_signals)} posts encontrados")

    # ── Salvar tudo ─────────────────────────────────────────
    os.makedirs(".tmp", exist_ok=True)
    # Top YouTube
    top_youtube = []
    for v in youtube_raw:
        if isinstance(v, dict):
            top_youtube.append({
                "titulo": v.get("title", v.get("snippet", {}).get("title", "")),
                "views": v.get("viewCount", v.get("statistics", {}).get("viewCount", 0)),
                "canal": v.get("channelTitle", ""),
            })

    output = {
        "timestamp": datetime.now().isoformat(),
        "google_paa": google_signals["paa"],
        "google_related": google_signals["related"],
        "tiktok_top_videos": tiktok_signals[:20],
        "youtube_top_videos": top_youtube[:15],
        "reddit_top_posts": reddit_signals[:15],
        "raw": raw,
    }
    with open(".tmp/apify_research_results.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # ── Imprimir resumo ─────────────────────────────────────
    print("\n" + "=" * 60)
    print("SINAIS COLETADOS")
    print("=" * 60)

    print(f"\n[GOOGLE PAA] People Also Ask ({len(google_signals['paa'])}):")
    for q in google_signals["paa"][:20]:
        print(f"  ? {q}")

    print(f"\n[GOOGLE RELATED] Buscas Relacionadas ({len(google_signals['related'])}):")
    for s in google_signals["related"][:20]:
        print(f"  -> {s}")

    print(f"\n[TIKTOK] Top videos por views:")
    for v in tiktok_signals[:10]:
        tags = " ".join(f"#{t}" for t in v["hashtags"][:3]) if v["hashtags"] else ""
        print(f"  [{v['views']:,} views] {v['texto'][:70]} {tags}")

    print(f"\n[REDDIT] Posts mais votados:")
    for p in reddit_signals[:8]:
        print(f"  [{p['upvotes']} upvotes] r/{p['subreddit']} - {p['titulo'][:80]}")

    print(f"\nResultados completos salvos em: .tmp/apify_research_results.json")


if __name__ == "__main__":
    main()
