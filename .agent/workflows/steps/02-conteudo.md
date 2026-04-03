---
description: 
---

# Step 02: SEO + Geracao do Artigo

Input: tema confirmado + angulo escolhido (vindo do banco, do usuario, ou da pesquisa).

## Passo 2.1 — Plano SEO

Execute passando o tema E o angulo como contexto:
```
python execution/seo_analyzer.py --topic "{tema confirmado} (angulo: {angulo escolhido})"
```
Resultado salvo em `.tmp/seo_plan.json`.

Valide o JSON gerado:
- Slug sem acentos ou caracteres especiais
- `meta_title` com menos de 60 caracteres (sem o sufixo " | {site.name}" de `blog.config.json`)
- `meta_description` com menos de 160 caracteres
- `structure_type` coerente com o angulo escolhido:
  - Tutorial → structure_type deve indicar passo a passo / guia
  - Estudo de caso → structure_type deve indicar narrativa / caso real
  - Infografico → structure_type deve indicar visual / resumo
  - Lista → structure_type deve indicar listicle
  - Checklist → structure_type deve indicar checklist
  - Comparativo → structure_type deve indicar comparacao
  - Se o structure_type gerado conflitar com o angulo: corrija antes de prosseguir
- H2s sugeridos sao criativos e contextuais (nao genericos como "Introducao" ou "Conclusao")

- `word_count_target` deve respeitar a faixa definida em `.agent/prompts/article-generator.md`:
  - Alvo: 1.400 a 1.800 palavras (margem de ±15% — mínimo ~1.190, máximo ~2.070)
  - Se o seo_analyzer gerar um target fora dessa faixa: corrija manualmente antes de prosseguir

Se algum campo estiver invalido: corrija antes de prosseguir.

## Passo 2.1b — Titulo e Subtitulo da Capa

Apos validar o SEO plan, gere o titulo e subtitulo que serao usados na capa (Canva) e miniatura.

**Regras do titulo:**
- Nomeia o assunto com forca: direto, concreto e capaz de despertar interesse imediato
- Sintese do tema central — deve fazer sentido isolado, sem depender do subtitulo
- Favorece indexacao: inclui a keyword principal ou variacao proxima
- MAIUSCULAS, max ~35 chars (precisa ser legivel em imagem)

**Regras do subtitulo:**
- Complementa o titulo com o detalhe ou promessa que nao coube nele
- Contextualiza: indica o angulo, o publico ou o beneficio concreto
- Nao repete palavras do titulo — acrescenta informacao nova
- Title case, max ~55 chars

Salve ambos no `.tmp/seo_plan.json` como `cover_title` e `cover_subtitle`.

Exemplo para angulo Comparativo, tema "Dieta para Emagrecer vs Ganhar Massa":
- cover_title: "EMAGRECER OU GANHAR MASSA?"
- cover_subtitle: "Como escolher a dieta certa para o seu objetivo"

## Passo 2.2 — Geracao do Artigo

Execute imediatamente, sem pausar para aprovacao:
```
python execution/generate_article.py --seo-plan .tmp/seo_plan.json --prompt-file .agent/prompts/article-generator.md --links-file blog/links_permitidos.md --structure-type {structure_type do seo_plan}
```
Resultado salvo em `.tmp/article_body.html`.

O script executa validacao automatica. Verifique os avisos:
- Keyword presente no H1, intro e pelo menos 1 H2
- Contagem de palavras dentro da faixa alvo
- Nenhum link externo nao autorizado
- H2s nao sao genericos
- 2-4 links internos presentes

**Validacao adicional obrigatoria (fazer apos o script):**
- Buscar travessao (—) no HTML gerado: nenhum deve aparecer em nenhuma parte do texto. Se encontrado: substitua por virgula, ponto, dois-pontos ou reescreva a frase. Nunca use travessao.

Se houver avisos criticos: corrija o artigo antes de mostrar ao usuario.

## GATE 2 — Apresentacao ao usuario

Mostre ao usuario apenas o resumo do SEO plan:

| Campo | Valor |
|-------|-------|
| Slug | {slug} |
| Keyword | {primary_keyword} |
| Angulo | {angulo escolhido} |
| Tipo de texto | {descricao do structure_type em linguagem clara} |
| Titulo SEO | {meta_title} |
| Descricao | {meta_description} |
| H2s | {lista dos H2s} |
| **Titulo da capa** | {cover_title} |
| **Subtitulo da capa** | {cover_subtitle} |
| **Palavras** | {contagem de palavras do artigo gerado} |
| **Links internos** | {numero de links internos} |

Nao mostre o HTML do artigo. O usuario revisa diretamente em `.tmp/article_body.html`.

Aguarde aprovacao ou pedidos de alteracao.

**Se usuario pedir mudancas no SEO plan:** re-execute `seo_analyzer.py` com o ajuste, depois re-execute `generate_article.py`. Mostre a tabela novamente.
**Se usuario pedir mudancas apenas no artigo:** re-execute so `generate_article.py` com instrucoes adicionais via `--structure-type` ou ajuste manual no HTML. Mostre a tabela atualizada.

## Transicao

Apos aprovacao: leia `.agent/workflows/steps/03-imagens.md` e execute.
