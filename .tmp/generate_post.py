with open('.tmp/article_body.html', 'r', encoding='utf-8') as f:
    content = f.read().strip()

ts = '''// Este arquivo centraliza todo o conteúdo do blog de forma bem modular.
// Você pode sempre copiar, colar e alterar um objeto inteiro para gerar um NOVO ARTIGO no site!

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  author: string;
  readTime: string;
  coverImage: string;
  content: string;
};

// Quando seu script for gerar os artigos, ele deve preencher este Array:
export const blogPosts: BlogPost[] = [
  {
    slug: "recomposicao-corporal-como-perder-gordura-e-ganhar-massa",
    title: "Recomposição Corporal: Como Perder Gordura e Ganhar Massa ao Mesmo Tempo",
    excerpt: "Descubra como a recomposição corporal pode ajudar a perder gordura e ganhar massa simultaneamente. Transforme seu corpo agora!",
    date: "27 Mar 2026",
    category: "Emagrecimento",
    author: "Camille Barbosa",
    readTime: "8 min de leitura",
    coverImage: "/images/blog/recomposicao-corporal-como-perder-gordura-e-ganhar-massa.avif",
    content: `''' + content + '''`,
  },
];

// Helper para buscar post pelo slug
export function getPostBySlug(slug: string) {
  return blogPosts.find(post => post.slug === slug);
}
'''

with open('src/data/blog-posts.ts', 'w', encoding='utf-8') as f:
    f.write(ts)

print('blog-posts.ts gerado com sucesso.')
