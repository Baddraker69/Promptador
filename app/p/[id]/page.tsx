import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Sparkles, ArrowLeft, Copy, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Prompt } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: prompt } = await supabase
    .from("prompts")
    .select("title, content")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!prompt) return { title: "Prompt not found" };

  return {
    title: `${prompt.title} — Promptador`,
    description: (prompt.content as string).slice(0, 160),
  };
}

export default async function PublicPromptPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prompt } = await supabase
    .from("prompts")
    .select("*, profiles!inner(full_name, avatar_url)")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!prompt) notFound();

  const p = prompt as Prompt & { profiles: { full_name: string; avatar_url: string } };

  return (
    <div className="min-h-screen bg-background grid-bg">
      <nav className="border-b border-border/40 backdrop-blur-xl bg-background/60">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold tracking-tight">Promptador</span>
          </Link>
          <Link href="/gallery" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Gallery
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="capitalize">{p.type}</Badge>
            {p.model_used && (
              <Badge variant="secondary" className="text-xs">{p.model_used.split(":")[1] || p.model_used}</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">{p.title}</h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {p.profiles?.avatar_url ? (
                <img src={p.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {p.profiles?.full_name?.[0] || "U"}
                </div>
              )}
              <div>
                <div className="text-sm font-medium">{p.profiles?.full_name || "Anonymous"}</div>
                <div className="text-xs text-muted-foreground">{formatDate(p.created_at)}</div>
              </div>
            </div>

            {p.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/60">
            <span className="text-sm text-muted-foreground font-mono">prompt</span>
            <div className="flex gap-1">
              <CopyButton content={p.content} />
            </div>
          </div>
          <div className="p-5">
            <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
              {p.content}
            </pre>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-xl border border-border/60 bg-card/40 p-6 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Want to generate and optimise your own prompts?
          </p>
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors">
              Try Promptador free
              <Sparkles className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}

function CopyButton({ content }: { content: string }) {
  "use client";
  return (
    <button
      className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
      title="Copy"
      onClick={() => navigator.clipboard.writeText(content)}
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}
