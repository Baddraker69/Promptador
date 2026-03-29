"use client";

import { useState } from "react";
import { Plus, History, FileText, RefreshCw, Users, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const GODZILLA_IMG = "/godzilla.jpg";

export default function AgenticTeamPage() {
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [placeholderInput, setPlaceholderInput] = useState("");
  const [agentMode, setAgentMode] = useState<"single" | "agentic">("agentic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();

  const addTool = () => {
    const t = toolInput.trim();
    if (t && !tools.includes(t)) setTools((prev) => [...prev, t]);
    setToolInput("");
  };

  const addPlaceholder = () => {
    const p = placeholderInput.trim().toUpperCase();
    if (p && !placeholders.includes(p)) setPlaceholders((prev) => [...prev, p]);
    setPlaceholderInput("");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data: keyData } = await supabase
        .from("api_keys")
        .select("key_encrypted")
        .eq("provider", "anthropic")
        .single();

      const apiKey = keyData?.key_encrypted;
      if (!apiKey) throw new Error("No Anthropic API key saved. Add one in Settings.");

      const description = [
        prompt,
        context && `Context: ${context}`,
        tools.length && `Available tools: ${tools.join(", ")}`,
        placeholders.length && `Placeholders: ${placeholders.map((p) => `{{${p}}}`).join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/agents/agentic-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          model: "anthropic:claude-sonnet-4-6",
          apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("prompts").insert({
      user_id: user.id,
      title: `Agentic Team: ${prompt.slice(0, 60)}`,
      content: result,
      type: "agentic",
      agent_type: "agentic-team",
      model_used: "anthropic:claude-sonnet-4-6",
      tags: ["agentic", "multi-agent"],
      metadata: { prompt, context, tools, placeholders },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-[#2a2a2a]">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-[#d4a017] uppercase">
            Prompt Generator
          </h1>
          <p className="text-[#666] text-xs mt-0.5">Forge multi-agent prompts that level cities</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-xs text-[#888] border border-[#333] px-3 py-1.5 rounded hover:border-[#555] hover:text-[#aaa] transition-colors">
            <History className="w-3.5 h-3.5" />
            History
          </button>
          <button className="flex items-center gap-1.5 text-xs text-[#888] border border-[#333] px-3 py-1.5 rounded hover:border-[#555] hover:text-[#aaa] transition-colors">
            <FileText className="w-3.5 h-3.5" />
            Templates
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left form panel */}
        <div className="w-80 shrink-0 border-r border-[#2a2a2a] flex flex-col overflow-y-auto">
          <div className="p-5 space-y-5 flex-1">
            {/* Feed Me Your Prompt */}
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#d4a017] uppercase block mb-2">
                Feed Me Your Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what this agent team should accomplish..."
                rows={4}
                className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm text-[#ccc] placeholder:text-[#555] resize-none focus:outline-none focus:border-[#d4a017]/50"
              />
            </div>

            {/* Context */}
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#888] uppercase block mb-2">
                Context / Background
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any relevant context or constraints..."
                rows={3}
                className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm text-[#ccc] placeholder:text-[#555] resize-none focus:outline-none focus:border-[#555]"
              />
            </div>

            {/* Attach File */}
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#888] uppercase block mb-2">
                Attach File <span className="text-[#555] normal-case">(optional)</span>
              </label>
              <label className="flex items-center gap-2 border border-dashed border-[#333] rounded px-3 py-2 text-sm text-[#555] cursor-pointer hover:border-[#555] hover:text-[#888] transition-colors">
                <FileText className="w-3.5 h-3.5 text-[#d4a017]" />
                Click to attach .txt, .md, .json, .csv
                <input type="file" accept=".txt,.md,.json,.csv" className="hidden" />
              </label>
            </div>

            {/* Available Tools */}
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#888] uppercase block mb-1">
                Available Tools <span className="text-[#555] normal-case">(optional)</span>
              </label>
              <p className="text-[10px] text-[#555] mb-2">Injected into relevant agent prompts</p>
              {tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {tools.map((t) => (
                    <span
                      key={t}
                      onClick={() => setTools((prev) => prev.filter((x) => x !== t))}
                      className="text-xs bg-[#2a2a2a] border border-[#333] text-[#999] px-2 py-0.5 rounded cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-colors"
                    >
                      {t} ×
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTool()}
                  placeholder="Type a tool and press Enter..."
                  className="flex-1 bg-[#222] border border-[#333] rounded px-3 py-1.5 text-sm text-[#ccc] placeholder:text-[#555] focus:outline-none focus:border-[#555]"
                />
                <button
                  onClick={addTool}
                  className="w-8 h-8 flex items-center justify-center bg-[#222] border border-[#333] rounded hover:border-[#555] text-[#888] hover:text-[#ccc] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Placeholders */}
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#888] uppercase block mb-1">
                Placeholders <span className="text-[#555] normal-case">(optional)</span>
              </label>
              <p className="text-[10px] text-[#555] mb-2">
                Variables that change per client or use case. Added as {`{{PLACEHOLDER}}`} syntax in every prompt.
              </p>
              {placeholders.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {placeholders.map((p) => (
                    <span
                      key={p}
                      onClick={() => setPlaceholders((prev) => prev.filter((x) => x !== p))}
                      className="text-xs bg-[#2a2a2a] border border-[#333] text-[#d4a017] px-2 py-0.5 rounded cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-colors font-mono"
                    >
                      {`{{${p}}}`} ×
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={placeholderInput}
                  onChange={(e) => setPlaceholderInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlaceholder()}
                  placeholder="e.g. CLIENT_NAME, INDUSTRY..."
                  className="flex-1 bg-[#222] border border-[#333] rounded px-3 py-1.5 text-sm text-[#ccc] placeholder:text-[#555] focus:outline-none focus:border-[#555]"
                />
                <button
                  onClick={addPlaceholder}
                  className="w-8 h-8 flex items-center justify-center bg-[#222] border border-[#333] rounded hover:border-[#555] text-[#888] hover:text-[#ccc] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Agent Structure */}
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#888] uppercase block mb-2">
                Agent Structure
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAgentMode("single")}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded border text-xs font-medium transition-colors ${
                    agentMode === "single"
                      ? "bg-[#d4a017]/10 border-[#d4a017] text-[#d4a017]"
                      : "bg-[#222] border-[#333] text-[#666] hover:border-[#555] hover:text-[#999]"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Single Agent
                </button>
                <button
                  onClick={() => setAgentMode("agentic")}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded border text-xs font-medium transition-colors ${
                    agentMode === "agentic"
                      ? "bg-[#d4a017]/10 border-[#d4a017] text-[#d4a017]"
                      : "bg-[#222] border-[#333] text-[#666] hover:border-[#555] hover:text-[#999]"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Agentic Team
                </button>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <div className="p-5 border-t border-[#2a2a2a]">
            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-[#c0392b] hover:bg-[#a93226] disabled:bg-[#c0392b]/40 disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase py-3 rounded flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {loading ? "Generating..." : "Generate →"}
            </button>
          </div>
        </div>

        {/* Right image/output panel */}
        <div className="flex-1 relative overflow-hidden">
          {result ? (
            /* Output */
            <div className="absolute inset-0 flex flex-col bg-[#1a1a1a]">
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a2a]">
                <span className="text-xs font-bold tracking-widest text-[#d4a017] uppercase">Output</span>
                <button
                  onClick={handleSave}
                  className="text-xs text-[#888] border border-[#333] px-3 py-1.5 rounded hover:border-[#555] hover:text-[#aaa] transition-colors"
                >
                  Save to Library
                </button>
              </div>
              <pre className="flex-1 overflow-y-auto p-6 text-sm font-mono text-[#ccc] leading-relaxed whitespace-pre-wrap break-words">
                {result}
              </pre>
            </div>
          ) : (
            /* Awaiting state — image fills entire panel */
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GODZILLA_IMG}
                alt="Awaiting transmission"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <p className="text-[#d4a017] font-black tracking-widest uppercase text-2xl">
                  Awaiting Transmission
                </p>
                <p className="text-[#ccc] text-sm italic mt-2">Feed the monster a prompt.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
