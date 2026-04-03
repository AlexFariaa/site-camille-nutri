import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { BlogNavbar } from "@/components/BlogNavbar";
import { blogPosts } from "@/data/blog-posts";

export default function Blog() {
  return (
    <div className="min-h-[100dvh] bg-background-offwhite selection:bg-accent selection:text-background-offwhite">
      <BlogNavbar />
      
      <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <header className="mb-20">
          <h1 className="text-5xl md:text-7xl tracking-tighter font-medium mb-6 mt-12 md:mt-2">O Blog</h1>
          <p className="text-xl text-primary/70 font-light max-w-[50ch]">Artigos avançados sobre nutrição baseada em ciência, organização alimentar e mudança de hábitos.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-10 md:gap-y-16">
          {blogPosts.map((post, index) => (
            <article key={post.slug} className="group cursor-pointer flex flex-col h-full">
              <Link href={`/blog/${post.slug}`} className="block h-full flex flex-col">
                <div className="w-full aspect-[4/3] relative rounded-[2rem] overflow-hidden mb-6 bg-primary/5 border border-primary/10">
                  <Image
                    src={post.thumbImage}
                    alt={post.title}
                    title={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out mix-blend-multiply opacity-90"
                    priority={index === 0}
                  />
                </div>
                <div className="text-xs font-medium text-accent mb-3 tracking-widest uppercase">{post.category} • {post.date}</div>
                <h2 className="text-2xl font-medium mb-3 group-hover:text-tertiary transition-colors line-clamp-2">{post.title}</h2>
                <p className="text-primary/70 font-light leading-relaxed mb-6 flex-grow line-clamp-3">{post.excerpt}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors mt-auto">
                  Ler Artigo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
