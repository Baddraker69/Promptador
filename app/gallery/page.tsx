import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Globe, Heart, Users, Sparkles, ImageIcon, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Prompt, PromptType } from "@/types";

const TYPE_ICONS: Record<PromptType, React.ElementType> = {
  agentic: Users,
  general: BookOpen,
  image: ImageIcon,
  optimized: Sparkles,
};

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: prompts } = await supabase
    .from("prompts")
    .select(`
      *,
      profiles!inner(full_name, avatar_url),
      like_count:prompt_likes(count)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Nav */}
      <nav className="border-b border-border/40 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold tracking-tight">Promptador</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            Community Gallery
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Community Gallery</h1>
          <p className="text-muted-foreground">
            {prompts?.length ?? 0} public prompts shared by the community
          </p>
        </div>

        {!prompts?.length ? (
          <div className="text-center py-24">
            <Globe className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No public prompts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(prompts as (Prompt & { profiles: { full_name: string; avatar_url: string } })[]).map((prompt) => {
              const Icon = TYPE_ICONS[prompt.type] || BookOpen;
              return (
                <Link key={prompt.id} href={`/p/${prompt.id}`}>
                  <div className="group rounded-xl border border-border/60 bg-card/40 p-5 hover:bg-card/70 hover:border-border transition-all duration-200 h-full flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Badge variant="outline" className="capitalize text-xs">{prompt.type}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3 h-3" />
                        {(prompt as unknown as { like_count: { count: number }[] }).like_count?.[0]?.count ?? 0}
                      </div>
                    </div>

                    <h3 className="font-medium text-sm mb-2 line-clamp-2 flex-1">{prompt.title}</h3>

                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                      {prompt.content.slice(0, 200)}…
                    </p>

                    {prompt.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {prompt.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        {prompt.profiles?.avatar_url ? (
                          <img src={prompt.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center">
                            {prompt.profiles?.full_name?.[0] || "U"}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground truncate max-w-24">
                          {prompt.profiles?.full_name || "Anonymous"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(prompt.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
