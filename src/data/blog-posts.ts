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

import recomposicaoCorporal from "./blog/recomposicao-corporal-como-perder-gordura-e-ganhar-massa";
import emagrecer10reais from "./blog/emagrecer-gastando-pouco-cardapio-10-reais";
import dietaEmagrecerVsGanharMassa from "./blog/dieta-para-emagrecer-vs-ganhar-massa";
import entenderMacros from "./blog/como-entender-os-proprios-macros-passo-a-passo";
import calculoMacros from "./blog/calculo-de-macros-na-pratica-estudo-de-caso";
import checklistMacros from "./blog/checklist-calcular-ajustar-macros-dieta";
import checklistMounjaroOzempic from "./blog/checklist-nutricional-mounjaro-ozempic";
// novos artigos: adicionar 1 linha de import aqui

export const blogPosts: BlogPost[] = [
  checklistMounjaroOzempic,
  checklistMacros,
  calculoMacros,
  entenderMacros,
  dietaEmagrecerVsGanharMassa,
  emagrecer10reais,
  recomposicaoCorporal,
  // novos artigos: adicionar 1 item no array aqui
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}
