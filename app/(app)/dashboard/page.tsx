import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Sparkles, ImageIcon, ArrowRight, Library, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Prompt } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: recentPrompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { count: promptCount } = await supabase
    .from("prompts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const isPro = profile?.subscription_status === "active";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Good to see you, {firstName}
        </h1>
        <p className="text-muted-foreground">
          {promptCount ?? 0} prompt{promptCount !== 1 ? "s" : ""} in your library
          {!isPro && ` · ${Math.max(0, 10 - (promptCount ?? 0))} free slots remaining`}
        </p>
      </div>

      {/* Agents */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agentCards.map((agent) => (
            <Link key={agent.href} href={agent.href} className="group">
              <div className="rounded-xl border border-border/60 bg-card/40 p-5 hover:bg-card/80 hover:border-border transition-all duration-200">
                <div className={`w-9 h-9 rounded-lg ${agent.iconBg} flex items-center justify-center mb-3`}>
                  <agent.icon className={`w-4.5 h-4.5 ${agent.iconColor}`} />
                </div>
                <h3 className="font-medium mb-1 flex items-center justify-between">
                  {agent.name}
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent prompts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Recent</h2>
          <Link href="/library">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {!recentPrompts?.length ? (
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
            <Library className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Your library is empty.</p>
            <Link href="/agents/optimizer">
              <Button size="sm" variant="outline">Generate your first prompt</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {(recentPrompts as Prompt[]).map((prompt) => (
              <Link key={prompt.id} href={`/library?id=${prompt.id}`}>
                <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/30 px-4 py-3 hover:bg-card/60 transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">{prompt.title}</span>
                      <Badge variant="outline" className="shrink-0 text-xs capitalize">
                        {prompt.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(prompt.updated_at)}
                      {prompt.tags?.length > 0 && (
                        <span>· {prompt.tags.slice(0, 2).join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const agentCards = [
  {
    name: "Agentic Team",
    href: "/agents/agentic-team",
    description: "Generate full multi-agent system prompts from a description.",
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    name: "Prompt Optimiser",
    href: "/agents/optimizer",
    description: "Score, analyse, and rewrite any prompt for maximum effectiveness.",
    icon: Sparkles,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    name: "Image Prompts",
    href: "/agents/image",
    description: "Generate optimised prompts for Imagen, Midjourney, DALL-E 3, and more.",
    icon: ImageIcon,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
];
