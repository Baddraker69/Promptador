import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthModal } from "@/components/layout/auth-modal";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthModal
        authError={
          searchParams.error === "auth_failed"
            ? "Sign in failed. Please try again."
            : undefined
        }
      />
    </div>
  );
}
