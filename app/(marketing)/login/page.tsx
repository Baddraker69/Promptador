"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/layout/auth-modal";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <AuthModal
      authError={error === "auth_failed" ? "Sign in failed. Please try again." : undefined}
    />
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Suspense>
        <LoginContent />
      </Suspense>
    </div>
  );
}
