export type BlogPost = {
  slug: string;
  title: string;
  metaTitle?: string; // título SEO (máx 60 chars) — se omitido, usa title
  excerpt: string;
  date: string;
  category: string;
  author: string;
  readTime: string;
  coverImage: string;   // 2400×960px (2.5:1) — exibida dentro do artigo
  thumbImage: string;   // 800×600px (4:3) — exibida no card da listagem
  content: string;
};

import dietaLowCarbGuiaCompletoSeguro from "./blog/dieta-low-carb-guia-completo-seguro";
import jejumIntermitenteComoFazerComSeguranca from "./blog/jejum-intermitente-como-fazer-com-seguranca";
import checklistNutricionalMounjaroOzempic from "./blog/checklist-nutricional-mounjaro-ozempic";
import alimentacaoAntesEDepoisDoTreino from "./blog/alimentacao-antes-e-depois-do-treino";
import alimentacaoTratamentoTirzepatidaSemaglutida from "./blog/alimentacao-tratamento-tirzepatida-semaglutida";
import alimentosQueAumentamGorduraAbdominal from "./blog/alimentos-que-aumentam-gordura-abdominal";
import checklistCalcularAjustarMacrosDieta from "./blog/checklist-calcular-ajustar-macros-dieta";
import dietaHiperproteicaErrosEAcertos from "./blog/dieta-hiperproteica-erros-e-acertos";
import errosAlimentacaoPreTreino from "./blog/erros-alimentacao-pre-treino";
import errosAoEmagrecerComPoucoDinheiro from "./blog/erros-ao-emagrecer-com-pouco-dinheiro";
import errosNaEscolhaDoWhey from "./blog/erros-na-escolha-do-whey";
import folhasVerdesAVontadeExplicacaoCientifica from "./blog/folhas-verdes-a-vontade-explicacao-cientifica";
import recomposicaoCorporalNaPraticaEstudoDeCaso from "./blog/recomposicao-corporal-na-pratica-estudo-de-caso";
import calculoDeMacrosNaPraticaEstudoDeCaso from "./blog/calculo-de-macros-na-pratica-estudo-de-caso";
import comoEntenderOsPropriosMacrosPassoAPasso from "./blog/como-entender-os-proprios-macros-passo-a-passo";
import dietaParaEmagrecerVsGanharMassa from "./blog/dieta-para-emagrecer-vs-ganhar-massa";
import emagrecerGastandoPoucoCardapio10Reais from "./blog/emagrecer-gastando-pouco-cardapio-10-reais";
import recomposicaoCorporalComoPerderGorduraEGanharMassa from "./blog/recomposicao-corporal-como-perder-gordura-e-ganhar-massa";
import errosDietaCetogenicaCuidadosEssenciais from "./blog/erros-dieta-cetogenica-cuidados-essenciais";
import dietaEconomicaParaEmagrecer30Dias from "./blog/dieta-economica-para-emagrecer-30-dias";
import tiposDeDietaExplicadosNutricionista from "./blog/tipos-de-dieta-explicados-nutricionista";
import checklistAlimentacaoEconomicaParaEmagrecer from "./blog/checklist-alimentacao-economica-para-emagrecer";
import recomposicaoCorporalAlimentosOQueComer from "./blog/recomposicao-corporal-alimentos-o-que-comer";
// novos artigos: adicionar 1 linha de import aqui

export const blogPosts: BlogPost[] = [
  dietaLowCarbGuiaCompletoSeguro,
  jejumIntermitenteComoFazerComSeguranca,
  checklistNutricionalMounjaroOzempic,
  alimentacaoAntesEDepoisDoTreino,
  alimentacaoTratamentoTirzepatidaSemaglutida,
  alimentosQueAumentamGorduraAbdominal,
  checklistCalcularAjustarMacrosDieta,
  dietaHiperproteicaErrosEAcertos,
  errosAlimentacaoPreTreino,
  errosAoEmagrecerComPoucoDinheiro,
  errosNaEscolhaDoWhey,
  folhasVerdesAVontadeExplicacaoCientifica,
  recomposicaoCorporalNaPraticaEstudoDeCaso,
  calculoDeMacrosNaPraticaEstudoDeCaso,
  comoEntenderOsPropriosMacrosPassoAPasso,
  dietaParaEmagrecerVsGanharMassa,
  emagrecerGastandoPoucoCardapio10Reais,
  recomposicaoCorporalComoPerderGorduraEGanharMassa,
    errosDietaCetogenicaCuidadosEssenciais,
  dietaEconomicaParaEmagrecer30Dias,
  tiposDeDietaExplicadosNutricionista,
  checklistAlimentacaoEconomicaParaEmagrecer,
  recomposicaoCorporalAlimentosOQueComer,
// novos artigos: adicionar 1 item no array aqui
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}
