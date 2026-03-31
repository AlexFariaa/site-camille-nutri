# Step 01: Pesquisa de Temas

Este step e executado apenas quando o usuario escolheu a opcao "Pesquisar" no /gerar-artigo.

## Execucao

**1. Leia `blog/links_permitidos.md`** para conhecer os posts existentes e evitar duplicacao de temas.

**2. Perguntar o metodo de pesquisa:**

Apresente exatamente assim:

---

**Como quer pesquisar os temas?**

**1. Google Trends** — Uso o SerpAPI para buscar queries em alta no Brasil (rapido)
**2. Apify** — Busco em multiplas plataformas: TikTok, Google Search, YouTube (mais completo)
**3. Turbinado** — Uso os dois juntos para o maior volume de sinais
**4. Eu tenho os temas** — Me informe os temas agora e eu lapido e rankeo

Responda com 1, 2, 3 ou 4.

---

**3. Executar conforme o metodo escolhido:**

**Se escolheu 1 (Google Trends):**
Leia o campo `research.trends_seeds` de `blog.config.json` e passe como argumento `--seeds`:
```
python execution/google_trends_research.py --seeds "{valor de research.trends_seeds}" --geo BR --timeframe "today 3-m"
```
Resultado salvo em `.tmp/trends_results.json`.

**Se escolheu 2 (Apify):**
```
python execution/apify_social_research.py
```
Resultado salvo em `.tmp/apify_research_results.json`.
Nota: leva 2-4 minutos. Avise o usuario que esta pesquisando.

**Se escolheu 3 (Turbinado):**
Execute os dois scripts acima em sequencia. Combine os sinais de ambos na analise.

**Se escolheu 4 (proprios temas):**
- Pergunte: "Informe os temas. Pode ser uma lista, titulos ou ideias brutas."
- Aguarde o usuario enviar os temas
- Pule para o passo 4 diretamente, avaliando os temas fornecidos

**4. Analisar e rankear exatamente 5 temas** considerando:
- Volume de busca potencial (queries rising, views TikTok, related queries Google)
- Relevancia para o publico-alvo (conforme `site.target_audience` em `blog.config.json`)
- Lacunas: temas que complementam posts existentes sem sobrepor
- Potencial de link building com artigos ja publicados
- Diversidade de nicho (evitar 5 temas do mesmo nicho)

## Salvar todos os temas + angulos no banco (automatico, sem aprovacao)

Antes de apresentar os temas ao usuario, salve imediatamente todos os 5 temas no banco de ideias — cada um com todos os angulos aplicaveis.

**Regra:** Para cada tema, gere entradas separadas por angulo. Aplique apenas os angulos que fazem sentido para o tema (nao force todos — use 4 a 6 angulos por tema). Verifique `blog/links_permitidos.md` para nao salvar angulos ja cobertos por posts existentes.

**Angulos disponiveis:**
- Tutorial — passo a passo, trafego recorrente, alto SEO
- Jornada/Processo — narrativa da experiencia do paciente, engajamento
- Estudo de caso — prova social, fundo de funil, conversao
- Infografico — visual, backlinks SEO, viralização
- Erros e acertos — CTR alto, problema + solucao
- Lista — topo de funil (usar com moderacao — nao adicionar se o blog ja tem muitas listas sobre o tema)
- Comparativo — alta intencao de compra, fundo de funil
- Checklist — pratico, facil de rankear

**Formato de cada entrada no banco:**
```json
{
  "id": 0,
  "tema": "{titulo lapidado com palavras-chave + angulo refletido no titulo}",
  "justificativa": "Angulo: {nome do angulo}. {justificativa: sinal de demanda + lacuna no blog}",
  "nicho": "{psicologo | dentista | nutricionista | clinica | medico | geral}",
  "data_adicionado": "{data atual YYYY-MM-DD}"
}
```

**Processo:**
1. Leia `.agent/idea_bank.json`
2. Para cada tema × angulo: compare `tema` (case-insensitive) com entradas existentes. Nao adicione duplicatas.
3. Adicione todas as novas entradas ao final do array
4. Renumere todos os IDs sequencialmente (1, 2, 3...)
5. Salve `.agent/idea_bank.json`
6. Informe: "{X} ideias salvas no banco (total: {Y})."

## GATE 1 — Apresentar 5 temas ao usuario

Mostre exatamente 5 temas rankeados com justificativa curta para cada um. Aguarde o usuario escolher um (ou sugerir outro tema).

Se o usuario sugerir um tema fora da lista: aceite sem questionar e salve-o no banco com todos os angulos antes de prosseguir.

Formato:
```
1. {tema lapidado com palavras-chave} — {justificativa curta: sinal + lacuna no blog} ({nicho})
2. ...
```

## GATE Angulo — Apresentar angulos para o tema escolhido

Apos o usuario confirmar o tema, apresente os angulos possiveis.

Consulte `blog/links_permitidos.md` para verificar quais angulos ja foram usados em posts existentes sobre o mesmo tema — avise se algum ja esta coberto.

Apresente no formato:

---

**Tema:** {tema confirmado}

**Angulos possiveis:**

1. **Tutorial** → "{titulo sugerido}" — Trafego recorrente, alto SEO
2. **Jornada/Processo** → "{titulo sugerido}" — Engajamento
3. **Estudo de caso** → "{titulo sugerido}" — Conversao, fundo de funil
4. **Infografico** → "{titulo sugerido}" — Backlinks SEO
5. **Erros e acertos** → "{titulo sugerido}" — CTR alto
6. **Lista** → "{titulo sugerido}" — Topo de funil (usar com moderacao)
7. **Comparativo** → "{titulo sugerido}" — Alta intencao de compra
8. **Checklist** → "{titulo sugerido}" — Pratico, ranqueia bem

[inclua outros angulos relevantes para o tema especifico]

Qual angulo quer trabalhar? Responda com o numero ou descreva outro angulo.

---

**Regra de diversidade:** Avise se algum angulo ja foi muito usado no blog recentemente. Priorize tutoriais, estudos de caso e infograficos.

## Transicao

Apos o GATE Angulo (angulo confirmado pelo usuario): leia `.agent/workflows/steps/02-conteudo.md` e execute com o tema + angulo escolhidos.
