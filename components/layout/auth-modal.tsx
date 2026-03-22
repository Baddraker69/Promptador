"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

export function AuthModal({ onClose, authError }: { onClose?: () => void; authError?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(authError ?? null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-2">Welcome to Promptador</h2>
          <p className="text-sm text-muted-foreground">Sign in to access your prompt library and agents.</p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full gap-3"
          size="lg"
        >
          <Chrome className="w-5 h-5" />
          {loading ? "Redirecting…" : "Continue with Google"}
        </Button>

        {error && (
          <p className="text-xs text-center text-red-500 mt-4">{error}</p>
        )}
        <p className="text-xs text-center text-muted-foreground mt-6">
          By signing in you agree to our terms. Your API keys are encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
