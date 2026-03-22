"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, BookOpen, Clock, Tag, Download, Copy, Trash2,
  Check, Share2, Globe, Lock, Users, Sparkles, ImageIcon, Edit3, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate, downloadAsMarkdown, downloadAsJSON, copyToClipboard } from "@/lib/utils";
import type { Prompt, PromptType } from "@/types";
import Link from "next/link";

const TYPE_ICONS: Record<PromptType, React.ElementType> = {
  agentic: Users,
  general: BookOpen,
  image: ImageIcon,
  optimized: Sparkles,
};

const TYPE_COLORS: Record<PromptType, string> = {
  agentic: "text-blue-400",
  general: "text-foreground",
  image: "text-amber-400",
  optimized: "text-violet-400",
};

type FilterType = "all" | PromptType;

export default function LibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (filter !== "all") query = query.eq("type", filter);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data } = await query;
    setPrompts((data as Prompt[]) || []);
    setLoading(false);
  }, [supabase, filter, search]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleCopy = async (prompt: Prompt) => {
    await copyToClipboard(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("prompts").delete().eq("id", id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDeletingId(null);
  };

  const handleTogglePublic = async (prompt: Prompt) => {
    const { data } = await supabase
      .from("prompts")
      .update({ is_public: !prompt.is_public })
      .eq("id", prompt.id)
      .select()
      .single();
    if (data) {
      setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? (data as Prompt) : p)));
    }
  };

  const selected = prompts.find((p) => p.id === selectedId);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List pane */}
      <div className="w-80 shrink-0 border-r border-border/40 flex flex-col">
        {/* Search + filter */}
        <div className="p-4 border-b border-border/40 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "agentic", "optimized", "image", "general"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all capitalize ${
                  filter === f
                    ? "bg-foreground/10 border-border text-foreground"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search || filter !== "all" ? "No matching prompts" : "Your library is empty"}
              </p>
            </div>
          ) : (
            prompts.map((prompt) => {
              const Icon = TYPE_ICONS[prompt.type] || BookOpen;
              return (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedId(prompt.id)}
                  className={`w-full text-left rounded-lg p-3 transition-all mb-1 ${
                    selectedId === prompt.id
                      ? "bg-foreground/10 border border-border"
                      : "hover:bg-foreground/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${TYPE_COLORS[prompt.type]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{prompt.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatDate(prompt.updated_at)}</span>
                        {prompt.is_public && <Globe className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-center px-8">
            <div>
              <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">Select a prompt to view it</p>
              <div className="flex gap-3 justify-center">
                <Link href="/agents/agentic-team"><Button variant="outline" size="sm">Agentic Team</Button></Link>
                <Link href="/agents/optimizer"><Button variant="outline" size="sm">Optimiser</Button></Link>
                <Link href="/agents/image"><Button variant="outline" size="sm">Image</Button></Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl font-semibold leading-tight">{selected.title}</h1>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(selected)}
                    title="Copy"
                  >
                    {copiedId === selected.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => downloadAsMarkdown(selected.title, selected.content)}
                    title="Download MD"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => downloadAsJSON(selected.title, selected)}
                    title="Download JSON"
                  >
                    <span className="text-xs font-mono font-bold">J</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTogglePublic(selected)}
                    title={selected.is_public ? "Make private" : "Share publicly"}
                  >
                    {selected.is_public ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
                  </Button>
                  {selected.is_public && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(`${window.location.origin}/p/${selected.id}`)}
                      title="Copy share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(selected.id)}
                    disabled={deletingId === selected.id}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">{selected.type}</Badge>
                {selected.model_used && (
                  <Badge variant="secondary" className="text-xs">
                    {selected.model_used.split(":")[1] || selected.model_used}
                  </Badge>
                )}
                {selected.is_public && <Badge variant="success">Public</Badge>}
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(selected.updated_at)}
                </div>
              </div>

              {selected.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  {selected.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="rounded-xl border border-border/60 bg-card/40 p-5">
              <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                {selected.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
