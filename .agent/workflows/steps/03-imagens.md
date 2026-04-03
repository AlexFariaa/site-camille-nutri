# Step 03: Imagens Inline + Capa Canva

Input: `.tmp/article_body.html` e `.tmp/seo_plan.json` ja existem.

## Passo 3.1 — Imagens Inline

Execute:
```
python execution/generate_inline_images.py --article .tmp/article_body.html --slug "{slug do seo_plan}"
```
O script extrai os placeholders `<!-- INLINE_IMAGE: descricao -->` do HTML, gera cada imagem via fal.ai (800x450, AVIF), substitui pelos `<img>` tags e salva o HTML atualizado em `.tmp/article_body.html`.

Confirme que os arquivos existem: `public/images/blog/{slug}-inline-*.avif`

## Passo 3.2 — Verificar biblioteca de nicho (condicional)

Leia `canva.use_niche_image` do `blog.config.json`.

**Se `use_niche_image` for `false`:** pule os passos 3.2 e 3.3 e va direto para o passo 3.4.

**Se `use_niche_image` for `true`:**

Leia `niche` do `.tmp/seo_plan.json`.
Verifique se `public/images/library/{niche}.avif` existe.

- Nichos disponiveis: conforme `image_library.niches` em `blog.config.json`
- Se o niche nao tiver correspondencia: use o `seo.default_niche` do `blog.config.json` como fallback e informe o usuario
- Se a biblioteca nao existir: execute `python execution/generate_image_library.py`

## Passo 3.3 — Upload da imagem de nicho para fal.ai (condicional)

Execute apenas se `canva.use_niche_image` for `true`.

Canva exige URL HTTPS. O servidor local e HTTP — por isso e necessario fazer upload via fal.ai.

Execute este codigo Python:
```python
import fal_client, os
from dotenv import load_dotenv
load_dotenv()
os.environ["FAL_KEY"] = os.getenv("FAL_KEY")
with open("public/images/library/{niche}.avif", "rb") as f:
    url = fal_client.upload(f.read(), "image/avif")
print(url)
```

Se falhar: retry 1x. Se falhar novamente: informe o usuario e peca para verificar `FAL_KEY` no `.env`.

## Passo 3.4 — Montagem da capa no Canva

### Pre-requisito: verificar se o MCP do Canva esta conectado

As ferramentas do Canva (`start-editing-transaction`, `perform-editing-operations` etc.) so ficam disponiveis se o MCP estiver conectado **antes do inicio da conversa**. Se nao estiverem disponiveis, o agente nao consegue executar este passo.

**Como conectar o MCP do Canva (fazer uma vez, fica salvo):**
1. Abra o Claude Code no terminal
2. Digite `/mcp` para ver os servidores MCP configurados
3. Se o Canva nao aparecer na lista: va em **claude.ai → Settings → Integrations** e conecte o Canva
4. Apos conectar, **feche e reabra o terminal** do Claude Code — as ferramentas so carregam no inicio de cada sessao

**Se as ferramentas nao carregarem nesta sessao:**
- Salve o estado em `.tmp/retomar_atual.md` com: design ID, URL da imagem fal.ai, texto do titulo e subtitulo
- Informe o usuario: *"As ferramentas do Canva nao estao disponiveis nesta sessao. Inicie uma nova conversa no Claude Code e execute `/gerar-artigo` — o agente continuara do passo 3.4 automaticamente."*
- Nao tente continuar sem as ferramentas — os passos seguintes dependem delas

Leia os IDs do Canva de `blog.config.json` campo `canva`:
- `canva.template_id` — ID do design template
- `canva.use_niche_image` — boolean que controla se a imagem de fundo do template e atualizada
- `canva.elements.niche_image` — ID do elemento de imagem (obrigatorio apenas se `use_niche_image=true`)
- `canva.elements.title` — ID do elemento de titulo
- `canva.elements.subtitle` — ID do elemento de subtitulo

Leia `cover_title` e `cover_subtitle` de `.tmp/seo_plan.json` — sao os valores aprovados no GATE 2.

1. Abra o template via `start-editing-transaction` com o design ID do config
2. Execute UMA unica chamada `perform-editing-operations` com todas as operacoes:
   - **Se `use_niche_image=true`:** inclua `update_fill` na imagem: element ID do config, use o asset_id da URL obtida no passo 3.3
   - **Se `use_niche_image=false`:** omita o `update_fill` — o fundo do template ja esta correto
   - `replace_text` no titulo: element ID do config, valor = `cover_title` (ja em MAIUSCULAS)
   - `replace_text` no subtitulo: element ID do config, valor = `cover_subtitle`
   - `format_text` no titulo: `{"font_weight": "bold"}` (NAO altere a cor — o template ja tem as cores corretas definidas)
   - NAO altere a cor do subtitulo
3. Confirme o preview e salve via `commit-editing-transaction`
4. Exporte via `export-design` no design ID do config — formato JPG, qualidade pro, SEM especificar width/height (exportar sempre nas dimensoes originais do template): `{"type": "jpg", "quality": 90, "export_quality": "pro"}`
5. Baixe o JPG exportado e converta para AVIF: salve em `public/images/blog/{slug}.avif`

Se a transacao Canva falhar no meio: cancele via `cancel-editing-transaction`, reabra e reaplique todas as operacoes em uma unica chamada.

## Passo 3.5 — Gerar miniatura via Canva

Use o template de miniatura do Canva (`canva.thumb.template_id` de `blog.config.json`).

1. Abra o template via `start-editing-transaction` com o `canva.thumb.template_id`
2. Execute UMA unica chamada `perform-editing-operations` com:
   - `replace_text` no titulo: element ID `canva.thumb.elements.title`, valor = `cover_title` de `.tmp/seo_plan.json` (ja em MAIUSCULAS)
   - `replace_text` no subtitulo: element ID `canva.thumb.elements.subtitle`, valor = `cover_subtitle` de `.tmp/seo_plan.json`
   - `format_text` no titulo: `{"font_weight": "bold"}` (NAO altere a cor — o template de miniatura tem fundo claro)
   - NAO altere a cor do subtitulo
3. Confirme o preview e salve via `commit-editing-transaction`
4. Exporte via `export-design` — formato JPG, qualidade pro, SEM especificar width/height (exportar sempre nas dimensoes originais do template): `{"type": "jpg", "quality": 90, "export_quality": "pro"}`
5. Baixe o JPG exportado e converta para AVIF: salve em `public/images/blog/thumb-{slug}.avif`

Confirme que os dois arquivos existem:
- `public/images/blog/{slug}.avif` (capa)
- `public/images/blog/thumb-{slug}.avif` (miniatura)

## GATE 3 — Apresentacao combinada

Mostre ao usuario as imagens inline geradas e a capa. Aguarde aprovacao.

**Se imagens inline rejeitadas:** re-execute `generate_inline_images.py` adicionando `--force` para cada imagem rejeitada.
**Se capa rejeitada por motivo visual do nicho (apenas quando `use_niche_image=true`):** execute `python execution/generate_image_library.py --niche {niche} --force` para gerar nova versao do nicho, depois repita os passos 3.3 a 3.5.

## Transicao

Apos aprovacao: leia `.agent/workflows/steps/04-publicacao.md` e execute.
