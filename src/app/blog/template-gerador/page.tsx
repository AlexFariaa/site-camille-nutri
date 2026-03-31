import Link from "next/link";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import type { Metadata } from "next";
import { BlogNavbar } from "@/components/BlogNavbar";
import { Footer } from "@/components/Footer";
import { ShareArticle } from "@/components/ShareArticle";

// --------------------------------------------------------------------------------------
// TEMPLATE DO GERADOR DE ARTIGOS
// Este arquivo serve como MOLDE P/ SEU PROGRAMA. Ele já contém todos os componentes (Menu, Footer, Compartilhamento).
// Não aparece na página inicial e instruímos os buscadores a IGNORÁ-LO (noindex).
// --------------------------------------------------------------------------------------

// 1. INFORMAÇÕES DO ARTIGO (O seu programa deve substituir esses valores ao gerar a página)
const postInfo = {
  title: "[TÍTULO DO ARTIGO GERADO]",
  date: "DD MMM AAAA",
  category: "[CATEGORIA]",
  author: "Camille Barbosa",
  readTime: "X min de leitura",
  coverImage: "https://picsum.photos/seed/placeholder/1200/600",
  excerpt: "[RESUMO/DESCRIÇÃO CURTA DO ARTIGO PARA SEO E COMPARTILHAMENTO]"
};

// 2. METADADOS AUTOMÁTICOS PRO GOOGLE/FACEBOOK/WHATSAPP (NÃO PRECISA MEXER NA ESTRUTURA)
export const metadata: Metadata = {
  title: `${postInfo.title} | Blog Camille Barbosa`,
  description: postInfo.excerpt,
  robots: {
    index: false, // ISSO GARANTE QUE O GOOGLE NÃO VAI INDEXAR O TEMPLATE. NOS ARTIGOS REAIS, APAGUE ESSA LINHA 'robots'.
    follow: false,
  },
  openGraph: {
    title: postInfo.title,
    description: postInfo.excerpt,
    images: [postInfo.coverImage],
    type: 'article',
    publishedTime: postInfo.date,
    authors: [postInfo.author]
  }
};

export default function TemplateBlogPost() {
  return (
    <div className="min-h-[100dvh] bg-background-offwhite selection:bg-accent selection:text-background-offwhite">
      {/* MENU NAVEGAÇÃO REPETIDO/PADRÃO */}
      <BlogNavbar />
      
      <div className="pt-32 pb-32 px-6 md:px-12">
        <div className="max-w-[75ch] mx-auto mt-12 md:mt-2">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-primary/60 hover:text-accent transition-colors mb-12">
            ← Voltar para todos os artigos
          </Link>
          
          <header className="mb-12 text-center md:text-left">
            <div className="text-sm font-medium text-accent mb-6 tracking-widest uppercase">{postInfo.category} • {postInfo.date}</div>
            <h1 className="text-4xl md:text-6xl tracking-tight leading-[1.1] font-medium mb-8 max-w-[20ch]">{postInfo.title}</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-primary/70 text-sm">
              <span>Por {postInfo.author}</span>
              <span className="hidden md:inline">•</span>
              <span>{postInfo.readTime}</span>
            </div>
          </header>
        </div>

        <div className="w-full max-w-5xl mx-auto aspect-[21/9] md:aspect-[2.5/1] relative rounded-[2rem] overflow-hidden mb-16 bg-primary/5 border border-primary/10">
          <Image 
            src={postInfo.coverImage}
            alt={`Capa do artigo: ${postInfo.title}`}
            fill
            sizes="100vw"
            className="object-cover mix-blend-multiply opacity-90"
          />
        </div>

        <div className="max-w-[65ch] mx-auto">
          {/* 3. CONTEÚDO DO ARTIGO. (O programa deve injetar o HTML aqui dentro do <article>) */}
          <article className="prose prose-lg prose-p:text-primary/80 prose-p:font-light prose-p:leading-relaxed prose-headings:font-medium prose-headings:text-primary prose-a:text-accent hover:prose-a:text-tertiary transition-colors prose-img:rounded-[1.5rem] prose-img:shadow-lg prose-img:border prose-img:border-primary/10 w-full max-w-none">
            
            <p>
              [PARÁGRAFO DE INTRODUÇÃO GERADO AQUI]
            </p>
            
            <h2>[SUBTÍTULO GERADO]</h2>
            <p>
              [TEXTO GERADO...]
            </p>
            
            <blockquote>
              "[CITAÇÃO GERADA]"
            </blockquote>

          </article>

          {/* COMPARTILHAMENTO DE MÍDIA REPETIDO/PADRÃO */}
          <ShareArticle title={postInfo.title} />

          {/* CALL TO ACTION REPETIDO/PADRÃO */}
          <section className="mt-24 p-8 md:p-12 bg-secondary/10 border border-primary/10 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-medium mb-4">Chega de sofrer com dietas genéricas.</h3>
              <p className="text-primary/70 font-light">Vamos construir seu planejamento nutricional ao vivo, lado a lado, respeitando suas preferências.</p>
            </div>
            <a href="https://api.whatsapp.com/send/?phone=5511956831515&text=Ol%C3%A1%2C+vim+pelo+site+e+gostaria+de+saber+como+funciona+sua+consulta%21&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2 bg-primary text-background-offwhite px-8 py-4 rounded-full text-sm hover:bg-tertiary active:scale-95 transition-all w-full md:w-auto justify-center">
              <WhatsappLogo weight="regular" size={20} />
              Agendar Consulta
            </a>
          </section>
        </div>
      </div>
      
      {/* REDAPÉ REPETIDO/PADRÃO */}
      <Footer />
    </div>
  );
}
