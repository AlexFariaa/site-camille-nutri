Voce foi acionado via /gerar-artigo. Siga exatamente os passos abaixo.

## Passo 1 — Ler o banco de ideias

Leia `.agent/idea_bank.json` agora. Conte quantas ideias ha no array.

## Passo 2 — Apresentar opcoes ao usuario

Apresente exatamente assim (substituindo N pelo numero real):

---

**Gerar Artigo para o Blog**

Tenho **N ideias** salvas no banco. Como quer prosseguir?

**1. Banco de ideias** — Listo as ideias salvas e voce escolhe uma
**2. Tenho um tema** — Voce me informa o tema agora
**3. Pesquisar** — Pesquiso temas nas plataformas e sugiro os melhores

Responda com 1, 2 ou 3.

---

## Passo 3 — Roteamento apos a escolha

**Se escolheu 1 (banco de ideias):**
- Se o banco estiver vazio: informe e pergunte se quer opcao 2 ou 3
- Se tiver ideias: liste todas no formato:
  ```
  1. {tema} — {justificativa curta} ({nicho}, adicionado em {data})
  2. ...
  ```
- Aguarde o usuario informar o numero da ideia que quer gerar
- Remova a ideia escolhida do array, renumere todos os IDs sequencialmente (1, 2, 3...), salve `.agent/idea_bank.json`
- Confirme: "Ideia removida do banco. Tema escolhido: {tema}"
- As ideias no banco ja possuem tema e angulo definidos no titulo. Nao apresente angulos — leia `.agent/workflows/steps/02-conteudo.md` e execute diretamente com o tema + angulo da ideia escolhida.

**Se escolheu 2 (proprio tema):**
- Pergunte: "Qual e o tema? Pode ser um titulo ou ideia geral."
- Aguarde o tema informado pelo usuario
- Execute o **Passo 4 — Apresentar angulos** antes de continuar

**Se escolheu 3 (pesquisar):**
- Leia `.agent/workflows/steps/01-pesquisa.md` e execute completamente
- O proprio step 01 ja apresenta os angulos apos o GATE 1 — nao repita aqui
- Apos o GATE Angulo (angulo confirmado), leia `.agent/workflows/steps/02-conteudo.md` e continue

## Passo 4 — Salvar no banco + Apresentar angulos (somente opcao 2)

Apos confirmar o tema (opcao 2 — proprio tema), execute os dois sub-passos abaixo sem pedir aprovacao.

### 4a — Salvar tema com todos os angulos no banco (automatico)

Leia `blog/links_permitidos.md` para verificar angulos ja cobertos por posts existentes.
Leia `.agent/idea_bank.json`.

Para o tema confirmado, crie uma entrada por angulo aplicavel (4 a 6 angulos — nao force todos, so os que fazem sentido para o tema). Nao salve angulos ja cobertos por posts existentes.

Formato de cada entrada:
```json
{
  "id": 0,
  "tema": "{titulo lapidado com palavras-chave + angulo refletido no titulo}",
  "justificativa": "Angulo: {nome}. {justificativa: por que esse angulo funciona para esse tema}",
  "nicho": "{um dos nichos listados em seo.niches de blog.config.json}",
  "data_adicionado": "{data atual YYYY-MM-DD}"
}
```

Apos salvar: renumere IDs sequencialmente, salve `.agent/idea_bank.json` e informe: "{X} variacoes salvas no banco (total: {Y})."

### 4b — Apresentar angulos ao usuario

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

**Regra de diversidade:** Consulte os ultimos posts publicados (`blog/links_permitidos.md`) e avise se algum angulo ja foi muito usado no blog recentemente. Priorize tutoriais, estudos de caso e infograficos — evite sugerir mais listas se o blog ja tem muitas.

Apos o usuario confirmar o angulo: leia `.agent/workflows/steps/02-conteudo.md` e execute com o tema + angulo escolhidos.

## Regra critica

Leia cada arquivo de step APENAS quando for executar aquela etapa. Nunca carregue steps antecipadamente.
Apos `02-conteudo.md`: leia `03-imagens.md`. Apos `03-imagens.md`: leia `04-publicacao.md`.
