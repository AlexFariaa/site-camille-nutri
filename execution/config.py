"""
Config Loader — Carrega blog.config.json como fonte centralizada de configuração.

Todos os scripts de execução devem usar este módulo para acessar
configurações do projeto ao invés de valores hardcoded.

Uso:
  from config import load_config, PROJECT_ROOT
  config = load_config()
  site_name = config["site"]["name"]
"""

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "blog.config.json"


def load_config() -> dict:
    """Carrega e retorna o blog.config.json do projeto."""
    if not CONFIG_PATH.exists():
        print(
            f"ERRO: blog.config.json não encontrado em {CONFIG_PATH}\n"
            "Execute o instalador ou crie o arquivo manualmente.",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERRO: blog.config.json inválido: {e}", file=sys.stderr)
        sys.exit(1)


def get_config_value(config: dict, dotpath: str, default=None):
    """Acessa valor aninhado via dot notation (ex: 'site.name')."""
    keys = dotpath.split(".")
    current = config
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            if default is not None:
                return default
            print(
                f"ERRO: Campo '{dotpath}' não encontrado em blog.config.json",
                file=sys.stderr,
            )
            sys.exit(1)
    return current
