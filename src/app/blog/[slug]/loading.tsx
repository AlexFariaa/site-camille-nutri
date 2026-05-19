import { BlogNavbar } from "@/components/BlogNavbar";

export default function ArticleLoading() {
  return (
    <div className="min-h-[100dvh] bg-background-offwhite">
      <BlogNavbar />
      <div className="pt-32 pb-24 px-6 md:px-12 max-w-3xl mx-auto">
        <div className="h-4 w-40 bg-primary/10 rounded-lg animate-pulse mb-12" />
        <div className="w-full aspect-[16/9] rounded-[2rem] bg-primary/10 animate-pulse mb-12" />
        <div className="h-3 w-32 bg-primary/10 rounded-lg animate-pulse mb-6" />
        <div className="h-12 w-full bg-primary/10 rounded-2xl animate-pulse mb-3" />
        <div className="h-12 w-3/4 bg-primary/10 rounded-2xl animate-pulse mb-10" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-4 bg-primary/5 rounded-lg animate-pulse ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
