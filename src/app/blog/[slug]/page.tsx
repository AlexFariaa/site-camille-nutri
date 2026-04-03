import Link from "next/link";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlogNavbar } from "@/components/BlogNavbar";
import { Footer } from "@/components/Footer";
import { ShareArticle } from "@/components/ShareArticle";
import { getPostBySlug } from "@/data/blog-posts";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    return { title: 'Artigo não encontrado | Camille Barbosa' };
  }
  
  return {
    title: post.metaTitle ?? `${post.title} | Camille Barbosa`,
    description: post.excerpt,
    authors: [{ name: post.author, url: 'https://camillebarbosa.com.br' }],
    alternates: {
      canonical: `https://camillebarbosa.com.br/blog/${slug}`,
    },
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      siteName: 'Camille Barbosa',
    }
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }
  
  return (
    <div className="min-h-[100dvh] bg-background-offwhite selection:bg-accent selection:text-background-offwhite">
      <BlogNavbar />
      
      <div className="pt-32 pb-32 px-6 md:px-12">
        <div className="max-w-[75ch] mx-auto mt-12 md:mt-2">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-primary/60 hover:text-accent transition-colors mb-12">
            ← Voltar para todos os artigos
          </Link>
          
          <header className="mb-12 text-center md:text-left">
            <div className="text-sm font-medium text-accent mb-6 tracking-widest uppercase">{post.category} • {post.date}</div>
            <h1 className="text-4xl md:text-6xl tracking-tight leading-[1.1] font-medium mb-8 max-w-[20ch]">{post.title}</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-primary/70 text-sm">
              <span>Por {post.author}</span>
              <span className="hidden md:inline">•</span>
              <span>{post.readTime}</span>
            </div>
          </header>
        </div>

        <div className="w-full max-w-5xl mx-auto rounded-[2rem] overflow-hidden mb-16 bg-primary/5 border border-primary/10">
          <Image
            src={post.coverImage}
            alt={`Capa do artigo: ${post.title}`}
            title={`Capa do artigo: ${post.title}`}
            width={2400}
            height={960}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="w-full h-auto mix-blend-multiply opacity-90"
          />
        </div>

        <div className="max-w-[65ch] mx-auto">
          {/* Aqui é injetado dinamicamente todo o código HTML do artigo contido no array */}
          <article 
            className="prose prose-lg prose-p:text-primary/80 prose-p:font-light prose-p:leading-relaxed prose-headings:font-medium prose-headings:text-primary prose-li:text-primary/80 prose-strong:text-primary prose-a:text-accent hover:prose-a:text-tertiary transition-colors prose-img:rounded-[1.5rem] prose-img:shadow-lg prose-img:border prose-img:border-primary/10 prose-blockquote:text-primary/80 w-full max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <ShareArticle title={post.title} />

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
      
      <Footer />
    </div>
  );
}
