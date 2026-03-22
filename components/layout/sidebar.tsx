"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Users,
  Sparkles,
  ImageIcon,
  Settings,
  Globe,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

const nav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Library",
    href: "/library",
    icon: Library,
  },
  {
    label: "Agents",
    type: "group",
    items: [
      { label: "Agentic Team", href: "/agents/agentic-team", icon: Users },
      { label: "Optimiser", href: "/agents/optimizer", icon: Sparkles },
      { label: "Image Prompts", href: "/agents/image", icon: ImageIcon },
    ],
  },
  {
    label: "Gallery",
    href: "/gallery",
    icon: Globe,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  profile: Profile | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isPro = profile?.subscription_status === "active";

  return (
    <aside className="w-60 shrink-0 border-r border-border/60 bg-card/20 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-background" />
          </div>
          <span className="font-semibold tracking-tight">Promptador</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          if ("type" in item && item.type === "group" && item.items) {
            return (
              <div key={item.label} className="pt-2 pb-1">
                <div className="px-3 py-1 text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
                  {item.label}
                </div>
                {item.items.map((subItem) => (
                  <NavLink
                    key={subItem.href}
                    href={subItem.href}
                    icon={subItem.icon}
                    label={subItem.label}
                    active={pathname === subItem.href || pathname.startsWith(subItem.href + "/")}
                  />
                ))}
              </div>
            );
          }
          if ("href" in item && item.href && item.icon) {
            return (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
              />
            );
          }
          return null;
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border/40 p-3">
        {!isPro && (
          <Link href="/settings#billing" className="block mb-3">
            <div className="rounded-xl border border-border/60 bg-gradient-to-r from-amber-500/5 to-amber-500/10 p-3 hover:from-amber-500/10 hover:to-amber-500/20 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-muted-foreground">Unlimited prompts for £2/mo</p>
            </div>
          </Link>
        )}
        <div className="flex items-center gap-2 px-2 py-1.5">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "User"}
              className="w-7 h-7 rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {profile?.full_name?.[0] || profile?.email?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">
              {profile?.full_name || profile?.email || "User"}
            </div>
            {isPro && (
              <div className="text-xs text-amber-400">Pro</div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        active
          ? "bg-foreground/10 text-foreground font-medium"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}
