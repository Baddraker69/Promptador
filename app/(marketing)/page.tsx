"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, ImageIcon, Library, Star, Zap, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/layout/auth-modal";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "login") setShowAuth(true);
  }, []);

  return (
    <div className="min-h-screen bg-background grid-bg noise">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold tracking-tight">Promptador</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/gallery">
              <Button variant="ghost" size="sm">Gallery</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Get started <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-32 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Free tier available · From £2/month for unlimited
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-6xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6"
          >
            Prompts that
            <br />
            <span className="gradient-text">actually work.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Generate production-ready prompts for agentic AI teams, optimise your existing prompts,
            and craft stunning image generation prompts — all in one place.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 text-base">
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="text-base">
                Browse gallery
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group rounded-2xl border border-border/60 bg-card/40 p-6 hover:bg-card/70 transition-all duration-300 hover:border-border"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border/60 flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                  <feature.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Agents showcase */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tighter mb-4">Three specialised agents</h2>
            <p className="text-muted-foreground text-lg">Each built for a specific craft.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                variants={fadeUp}
                className="relative rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-card/20 p-6 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${agent.glow}`} />
                <div className={`w-10 h-10 rounded-xl ${agent.iconBg} flex items-center justify-center mb-4`}>
                  <agent.icon className={`w-5 h-5 ${agent.iconColor}`} />
                </div>
                <div className="text-xs text-muted-foreground mb-1">Agent {String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-semibold text-lg mb-2">{agent.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{agent.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tighter mb-4">Simple pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you&apos;re ready.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Free tier */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-border/60 bg-card/40 p-8">
              <div className="text-sm text-muted-foreground mb-2">Free forever</div>
              <div className="text-4xl font-bold mb-1">£0</div>
              <div className="text-muted-foreground text-sm mb-8">No credit card required</div>
              <ul className="space-y-3 mb-8">
                {freeTierFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Star className="w-3.5 h-3.5 text-muted-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">Get started free</Button>
              </Link>
            </motion.div>

            {/* Pro tier */}
            <motion.div variants={fadeUp} className="relative rounded-2xl border border-foreground/20 bg-gradient-to-b from-card to-card/50 p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
              <div className="text-sm text-muted-foreground mb-2">Pro</div>
              <div className="text-4xl font-bold mb-1">£2<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
              <div className="text-muted-foreground text-sm mb-8">Billed monthly, cancel anytime</div>
              <ul className="space-y-3 mb-8">
                {proTierFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard">
                <Button className="w-full">Start pro trial</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded bg-foreground/10 flex items-center justify-center">
              <Sparkles className="w-3 h-3" />
            </div>
            Promptador · Bring your own API key
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">App</Link>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Your keys stay private
            </div>
          </div>
        </div>
      </footer>
      {showAuth && <AuthModal onClose={() => { setShowAuth(false); window.history.replaceState({}, "", "/"); }} />}
    </div>
  );
}

const features = [
  {
    icon: Users,
    title: "Agentic team prompts",
    description: "Generate complete multi-agent system prompts — orchestrator, specialists, reviewers — structured as JSON.",
  },
  {
    icon: Sparkles,
    title: "Prompt optimiser",
    description: "Score, analyse, and rewrite any prompt. Get specific feedback on clarity, context, constraints, and format.",
  },
  {
    icon: ImageIcon,
    title: "Image prompt generator",
    description: "Craft optimised prompts for Imagen, Midjourney, DALL-E 3, and Stable Diffusion simultaneously.",
  },
  {
    icon: Library,
    title: "Prompt library",
    description: "Organise all your prompts with tags, search, and version history. Download as MD or JSON.",
  },
  {
    icon: Star,
    title: "Community gallery",
    description: "Share your best prompts publicly. Discover and fork community prompts. Upvote your favourites.",
  },
  {
    icon: Lock,
    title: "BYOK — your keys, your data",
    description: "Bring your own API keys for any model. We never store your keys in plain text.",
  },
];

const agents = [
  {
    name: "Agentic Team",
    description: "Describe a system and get back a full suite of agent prompts — orchestrator, specialists, and inter-agent communication protocols.",
    icon: Users,
    glow: "bg-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    tags: ["Multi-agent", "JSON output", "Orchestrator", "Specialists"],
  },
  {
    name: "Prompt Optimiser",
    description: "Paste any prompt. Get a score, detailed feedback, and a rewritten version with every improvement explained.",
    icon: Sparkles,
    glow: "bg-violet-500",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    tags: ["Scoring", "Rewriting", "Analysis", "Tips"],
  },
  {
    name: "Image Prompts",
    description: "One concept, four model-optimised prompts. Includes negative prompts, parameters, style variants, and Nanobanana-ready JSON.",
    icon: ImageIcon,
    glow: "bg-amber-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    tags: ["Imagen", "Midjourney", "DALL-E 3", "Stable Diffusion"],
  },
];

const freeTierFeatures = [
  "10 saved prompts",
  "All 3 agents",
  "Community gallery access",
  "Download as MD or JSON",
  "Bring your own API keys",
];

const proTierFeatures = [
  "Unlimited saved prompts",
  "Prompt versioning",
  "Share prompts publicly",
  "Priority support",
  "Everything in free",
];
