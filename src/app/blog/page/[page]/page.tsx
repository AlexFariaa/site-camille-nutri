import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BlogNavbar } from "@/components/BlogNavbar";
import { formatPostDate, getAllSlugs, getPostsPage, getPostExcerpt } from "@/lib/cms";

const PER_PAGE = 9;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  const totalPages = Math.ceil(slugs.length / PER_PAGE);
  const params: { page: string }[] = [];
  for (let p = 2; p <= totalPages; p++) {
    params.push({ page: String(p) });
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Blog — Página ${page} | Camille Barbosa`,
    alternates: {
      canonical: `https://camillebarbosa.com.br/blog/page/${page}`,
    },
  };
}

export default async function BlogPaginated({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = Number.parseInt(page, 10);

  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const { data: posts, has_more, total } = await getPostsPage(pageNum, PER_PAGE);

  if (posts.length === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const prevHref = pageNum === 2 ? "/blog" : `/blog/page/${pageNum - 1}`;
  const nextHref = `/blog/page/${pageNum + 1}`;

  return (
    <div className="min-h-[100dvh] bg-background-offwhite selection:bg-accent selection:text-background-offwhite">
      <BlogNavbar />

      <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <header className="mb-20">
          <h1 className="text-5xl md:text-7xl tracking-tighter font-medium mb-6 mt-12 md:mt-2">O Blog</h1>
          <p className="text-xl text-primary/70 font-light max-w-[50ch]">Artigos avançados sobre nutrição baseada em ciência, organização alimentar e mudança de hábitos.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-10 md:gap-y-16">
          {posts.map((post) => (
            <article key={post.slug} className="group cursor-pointer flex flex-col h-full">
              <Link href={`/blog/${post.slug}`} className="block h-full flex flex-col">
                <div className="w-full aspect-[4/3] relative rounded-[2rem] overflow-hidden mb-6 bg-primary/5 border border-primary/10">
                  {post.thumb_image_url ? (
                    <Image
                      src={post.thumb_image_url}
                      alt={post.title}
                      title={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out mix-blend-multiply opacity-90"
                    />
                  ) : null}
                </div>
                <div className="text-xs font-medium text-accent mb-3 tracking-widest uppercase">{post.seo_title ? `${post.seo_title} • ` : ""}{formatPostDate(post.published_at)}</div>
                <h2 className="text-2xl font-medium mb-3 group-hover:text-tertiary transition-colors line-clamp-2">{post.title}</h2>
                <p className="text-primary/70 font-light leading-relaxed mb-6 flex-grow line-clamp-3">{getPostExcerpt(post.content)}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors mt-auto">
                  Ler Artigo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </article>
          ))}
        </div>

        <nav aria-label="Paginação dos artigos" className="mt-20 flex items-center justify-between gap-4 border-t border-primary/10 pt-8">
          <Link href={prevHref} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors">
            <ArrowLeft size={16} /> Anterior
          </Link>
          <span className="text-sm text-primary/60">Página {pageNum} de {totalPages}</span>
          {has_more ? (
            <Link href={nextHref} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors">
              Próximo <ArrowRight size={16} />
            </Link>
          ) : (
            <span className="invisible inline-flex items-center gap-2 text-sm font-medium text-primary/40">
              Próximo <ArrowRight size={16} />
            </span>
          )}
        </nav>
      </div>
    </div>
  );
}
