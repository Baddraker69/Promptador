"use client";

import { useState, useEffect } from "react";
import { Key, CreditCard, Trash2, Check, AlertCircle, Zap, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { MODELS, type ModelProvider } from "@/types";

interface SavedKey {
  id: string;
  provider: ModelProvider;
  key_preview: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [newKey, setNewKey] = useState<Partial<Record<ModelProvider, string>>>({});
  const [showKey, setShowKey] = useState<Partial<Record<ModelProvider, boolean>>>({});
  const [saving, setSaving] = useState<ModelProvider | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState<ModelProvider | null>(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<{ subscription_status: string; email: string | null } | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: keyData }] = await Promise.all([
        supabase.from("profiles").select("subscription_status, email").eq("id", user.id).single(),
        supabase.from("api_keys").select("id, provider, key_preview").eq("user_id", user.id),
      ]);

      setProfile(profileData);
      setKeys((keyData as SavedKey[]) || []);
    };
    fetchData();
  }, [supabase]);

  const handleSaveKey = async (provider: ModelProvider) => {
    const key = newKey[provider];
    if (!key?.trim()) return;
    setSaving(provider);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const preview = key.slice(0, 6) + "…" + key.slice(-4);
      const { error: upsertError } = await supabase.from("api_keys").upsert(
        {
          user_id: user.id,
          provider,
          key_encrypted: key, // In production: encrypt before storing
          key_preview: preview,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

      if (upsertError) throw upsertError;

      setKeys((prev) => {
        const existing = prev.find((k) => k.provider === provider);
        if (existing) return prev.map((k) => k.provider === provider ? { ...k, key_preview: preview } : k);
        return [...prev, { id: crypto.randomUUID(), provider, key_preview: preview }];
      });

      setNewKey((prev) => ({ ...prev, [provider]: "" }));
      setSuccess(provider);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save key");
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteKey = async (id: string, provider: ModelProvider) => {
    setDeleting(id);
    await supabase.from("api_keys").delete().eq("id", id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setDeleting(null);
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSubscribe = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError("Failed to start checkout");
    } finally {
      setLoadingPortal(false);
    }
  };

  const isPro = profile?.subscription_status === "active";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your API keys and subscription.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* API Keys */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">API Keys</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Your keys are stored encrypted and used only to make requests on your behalf. We never log or share them.
        </p>

        <div className="space-y-4">
          {(Object.keys(MODELS) as ModelProvider[]).map((provider) => {
            const savedKey = keys.find((k) => k.provider === provider);
            return (
              <div key={provider} className="rounded-xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-sm">{MODELS[provider].label}</div>
                    <div className="text-xs text-muted-foreground">
                      {MODELS[provider].models.map((m) => m.label).join(", ")}
                    </div>
                  </div>
                  {savedKey && (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{savedKey.key_preview}</code>
                      <Badge variant="success">Saved</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteKey(savedKey.id, provider)}
                        disabled={deleting === savedKey.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey[provider] ? "text" : "password"}
                      value={newKey[provider] || ""}
                      onChange={(e) => setNewKey((prev) => ({ ...prev, [provider]: e.target.value }))}
                      placeholder={savedKey ? "Update key…" : "Paste API key…"}
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((prev) => ({ ...prev, [provider]: !prev[provider] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey[provider] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <Button
                    onClick={() => handleSaveKey(provider)}
                    disabled={saving === provider || !newKey[provider]?.trim()}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                  >
                    {success === provider ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    {saving === provider ? "Saving…" : success === provider ? "Saved!" : "Save"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Billing */}
      <section id="billing">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Billing</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your subscription. Cancel anytime.
        </p>

        <div className="rounded-xl border border-border/60 bg-card/40 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium mb-1">
                {isPro ? "Pro plan" : "Free plan"}
              </div>
              <div className="text-sm text-muted-foreground">
                {isPro
                  ? "Unlimited prompts · Versioning · Public sharing"
                  : "Up to 10 prompts · All agents · Community gallery"}
              </div>
              {!isPro && (
                <div className="text-xs text-muted-foreground mt-1">
                  Upgrade to Pro for unlimited prompts at just £2/month
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{isPro ? "£2" : "£0"}</div>
              <div className="text-xs text-muted-foreground">{isPro ? "/month" : "forever"}</div>
            </div>
          </div>

          <div className="mt-6">
            {isPro ? (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={loadingPortal}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {loadingPortal ? "Loading…" : "Manage billing"}
              </Button>
            ) : (
              <Button
                onClick={handleSubscribe}
                disabled={loadingPortal}
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                {loadingPortal ? "Loading…" : "Upgrade to Pro · £2/month"}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
