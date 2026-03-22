"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/agents/model-selector";
import { PromptOutput } from "@/components/agents/prompt-output";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

const STYLE_PRESETS = [
  "Photorealistic",
  "Cinematic",
  "Anime/Manga",
  "Oil painting",
  "Watercolour",
  "Minimalist",
  "Dark fantasy",
  "Neon noir",
];

const EXAMPLES = [
  "A lone astronaut standing on a red desert planet at dusk, twin moons on the horizon",
  "A cosy bookshop in the rain at night, warm amber light spilling onto wet cobblestones",
  "An AI robot meditating in a Japanese zen garden, cherry blossoms falling",
];

export default function ImagePromptPage() {
  const [concept, setConcept] = useState("");
  const [style, setStyle] = useState("");
  const [model, setModel] = useState("anthropic:claude-sonnet-4-6");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ content: string; model: string; parsed?: Record<string, unknown> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<"imagen" | "midjourney" | "dalle3" | "stable_diffusion">("imagen");

  useEffect(() => {
    const provider = model.split(":")[0];
    const supabase = createClient();
    supabase
      .from("api_keys")
      .select("key_encrypted")
      .eq("provider", provider)
      .single()
      .then(({ data }) => {
        if (data?.key_encrypted) setApiKey(data.key_encrypted);
      });
  }, [model]);

  const handleGenerate = async () => {
    if (!concept.trim() || !apiKey.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSavedId(undefined);

    try {
      const res = await fetch("/api/agents/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, style, model, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Try to parse JSON from content
      let parsed;
      try {
        const jsonMatch = data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // Keep raw
      }

      setResult({ ...data, parsed });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const title = `Image: ${concept.slice(0, 60)}`;
      const { data, error } = await supabase.from("prompts").insert({
        user_id: user.id,
        title,
        content: result.content,
        type: "image",
        agent_type: "image",
        model_used: result.model,
        tags: ["image", "nanobanana", style ? style.toLowerCase() : ""].filter(Boolean),
        metadata: { concept, style, parsed: result.parsed },
      }).select().single();

      if (error) throw error;
      setSavedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const prompts = result?.parsed?.prompts as Record<string, { prompt: string; negative_prompt?: string; parameters?: string }> | undefined;
  const variants = result?.parsed?.style_variants as { name: string; description: string; modifier: string }[] | undefined;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Image Prompts</h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Describe a concept. Get optimised prompts for Nanobanana (Imagen), Midjourney, DALL-E 3, and Stable Diffusion.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Model</label>
            <ModelSelector value={model} onChange={setModel} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key…"
              className="flex h-10 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Style presets */}
        <div>
          <label className="text-sm font-medium mb-2 block">Style (optional)</label>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(style === s ? "" : s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  style === s
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Concept */}
        <div>
          <label className="text-sm font-medium mb-2 block">Concept</label>
          <Textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Describe what you want to visualise…"
            className="min-h-[120px]"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setConcept(ex)}
                className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                {ex.slice(0, 50)}…
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !concept.trim() || !apiKey.trim()}
          className="gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          {loading ? "Generating…" : "Generate image prompts"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Model tabs */}
            {prompts && (
              <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
                <div className="flex border-b border-border/40 overflow-x-auto">
                  {(["imagen", "midjourney", "dalle3", "stable_diffusion"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab
                          ? "text-foreground border-b-2 border-foreground -mb-px bg-card/60"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab === "imagen" ? "Nanobanana (Imagen)" : tab === "dalle3" ? "DALL-E 3" : tab === "stable_diffusion" ? "Stable Diffusion" : "Midjourney"}
                    </button>
                  ))}
                </div>
                <div className="p-5">
                  {prompts[activeTab] && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1.5">Prompt</div>
                        <pre className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                          {prompts[activeTab].prompt}
                          {activeTab === "midjourney" && prompts[activeTab].parameters && ` ${prompts[activeTab].parameters}`}
                        </pre>
                      </div>
                      {prompts[activeTab].negative_prompt && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1.5">Negative prompt</div>
                          <pre className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">
                            {prompts[activeTab].negative_prompt}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Style variants */}
            {variants && variants.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-5">
                <div className="text-sm font-medium mb-3">Style variants</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {variants.map((v) => (
                    <div key={v.name} className="border border-border/40 rounded-lg p-3">
                      <div className="font-medium text-sm mb-1">{v.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">{v.description}</div>
                      <Badge variant="outline" className="text-xs font-mono">{v.modifier.slice(0, 40)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full raw output */}
            <PromptOutput
              title={`Image prompts: ${concept.slice(0, 40)}`}
              content={result.content}
              type="image"
              agentType="image"
              modelUsed={result.model}
              metadata={{ concept, style, parsed: result.parsed }}
              onSave={savedId ? undefined : handleSave}
              isSaving={saving}
              savedId={savedId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
