"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/agents/model-selector";
import { PromptOutput } from "@/components/agents/prompt-output";
import { createClient } from "@/lib/supabase/client";

interface OptimiserResult {
  content: string;
  model: string;
  parsed?: {
    original_score: number;
    optimised_prompt: string;
    weaknesses: string[];
    changes: { change: string; reason: string }[];
    score_breakdown: Record<string, number>;
  };
}

export default function OptimizerPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("anthropic:claude-sonnet-4-6");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OptimiserResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>();

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

  const handleOptimise = async () => {
    if (!prompt.trim() || !apiKey.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSavedId(undefined);

    try {
      const res = await fetch("/api/agents/optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Try to parse JSON from the response
      let parsed;
      try {
        const jsonMatch = data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // Keep raw content if JSON parse fails
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

      const optimisedContent = result.parsed?.optimised_prompt || result.content;
      const title = `Optimised: ${prompt.slice(0, 60)}`;
      const { data, error } = await supabase.from("prompts").insert({
        user_id: user.id,
        title,
        content: optimisedContent,
        type: "optimized",
        agent_type: "optimizer",
        model_used: result.model,
        tags: ["optimised"],
        metadata: {
          original_prompt: prompt,
          score: result.parsed?.original_score,
          full_analysis: result.content,
        },
      }).select().single();

      if (error) throw error;
      setSavedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const score = result?.parsed?.original_score;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Prompt Optimiser</h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Paste any prompt. Get a score, detailed analysis, and a rewritten version with every improvement explained.
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

        <div>
          <label className="text-sm font-medium mb-2 block">Your prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste the prompt you want to optimise…"
            className="min-h-[180px]"
          />
        </div>

        <Button
          onClick={handleOptimise}
          disabled={loading || !prompt.trim() || !apiKey.trim()}
          className="gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Analysing…" : "Optimise prompt"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Score summary */}
            {result.parsed && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Original prompt score</span>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${score && score >= 7 ? "text-emerald-400" : score && score >= 4 ? "text-amber-400" : "text-red-400"}`}>
                      {score}/10
                    </div>
                  </div>
                </div>
                {result.parsed.score_breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {Object.entries(result.parsed.score_breakdown).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <div className="text-xs text-muted-foreground capitalize mb-1">{key}</div>
                        <div className="text-sm font-semibold">{val}/10</div>
                        <div className="mt-1 h-1 rounded-full bg-border">
                          <div
                            className="h-1 rounded-full bg-violet-400"
                            style={{ width: `${(val as number / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {result.parsed.weaknesses?.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Weaknesses identified</div>
                    <ul className="space-y-1">
                      {result.parsed.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Optimised output */}
            <PromptOutput
              title="Optimised prompt"
              content={result.parsed?.optimised_prompt || result.content}
              type="optimized"
              agentType="optimizer"
              modelUsed={result.model}
              metadata={{ original_prompt: prompt, full_analysis: result.content }}
              onSave={savedId ? undefined : handleSave}
              isSaving={saving}
              savedId={savedId}
            />

            {/* Changes explained */}
            {(result.parsed?.changes?.length ?? 0) > 0 && result.parsed && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-5">
                <div className="text-sm font-medium mb-3">Changes made</div>
                <div className="space-y-3">
                  {result.parsed.changes.map((c, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <div className="font-medium">{c.change}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{c.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
