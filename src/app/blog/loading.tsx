import { BlogNavbar } from "@/components/BlogNavbar";

export default function BlogLoading() {
  return (
    <div className="min-h-[100dvh] bg-background-offwhite">
      <BlogNavbar />
      <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <header className="mb-20">
          <div className="h-16 w-48 bg-primary/10 rounded-2xl animate-pulse mt-12 md:mt-2 mb-6" />
          <div className="h-6 w-96 bg-primary/10 rounded-xl animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-10 md:gap-y-16">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col h-full">
              <div className="w-full aspect-[4/3] rounded-[2rem] bg-primary/10 animate-pulse mb-6" />
              <div className="h-3 w-32 bg-primary/10 rounded-lg animate-pulse mb-3" />
              <div className="h-7 w-full bg-primary/10 rounded-xl animate-pulse mb-2" />
              <div className="h-7 w-3/4 bg-primary/10 rounded-xl animate-pulse mb-3" />
              <div className="h-4 w-full bg-primary/5 rounded-lg animate-pulse mb-1" />
              <div className="h-4 w-5/6 bg-primary/5 rounded-lg animate-pulse mb-1" />
              <div className="h-4 w-4/6 bg-primary/5 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
