"use client";

import { useState } from "react";
import { Users, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/agents/model-selector";
import { PromptOutput } from "@/components/agents/prompt-output";
import { createClient } from "@/lib/supabase/client";

const EXAMPLES = [
  "A customer support pipeline with triage, specialist agents, and escalation handling",
  "A research assistant that searches the web, synthesises findings, and writes reports",
  "A software development team: architect, coder, reviewer, and documentation writer",
];

export default function AgenticTeamPage() {
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("anthropic:claude-sonnet-4-6");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ content: string; model: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>();

  const handleGenerate = async () => {
    if (!description.trim() || !apiKey.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSavedId(undefined);

    try {
      const res = await fetch("/api/agents/agentic-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, model, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
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

      const title = `Agentic Team: ${description.slice(0, 60)}`;
      const { data, error } = await supabase.from("prompts").insert({
        user_id: user.id,
        title,
        content: result.content,
        type: "agentic",
        agent_type: "agentic-team",
        model_used: result.model,
        tags: ["agentic", "multi-agent"],
        metadata: { description },
      }).select().single();

      if (error) throw error;
      setSavedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Agentic Team</h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Describe a system or workflow. Get back a complete set of agent prompts — orchestrator, specialists, and protocols.
        </p>
      </div>

      <div className="space-y-6">
        {/* Config */}
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

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-2 block">System description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the agentic system you want to build…"
            className="min-h-[140px]"
          />
          {/* Examples */}
          <div className="flex flex-wrap gap-2 mt-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                {ex.slice(0, 50)}…
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !description.trim() || !apiKey.trim()}
          className="gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          {loading ? "Generating…" : "Generate agent prompts"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <PromptOutput
            title={`Agentic Team: ${description.slice(0, 40)}…`}
            content={result.content}
            type="agentic"
            agentType="agentic-team"
            modelUsed={result.model}
            metadata={{ description }}
            onSave={savedId ? undefined : handleSave}
            isSaving={saving}
            savedId={savedId}
          />
        )}
      </div>
    </div>
  );
}
