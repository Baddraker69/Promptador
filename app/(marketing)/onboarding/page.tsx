"use client";

import { useState } from "react";
import { RefreshCw, Flame, Zap } from "lucide-react";

const features = [
  "Prompt Generator — multi-agent prompts",
  "Prompt Optimiser — with diff view",
  "Image Prompt Generator",
  "Unlimited prompt library",
  "Collections & organisation",
  "Community gallery access",
  "7 output formats",
  "Prompt version history",
];

export default function OnboardingPage() {
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingOneTime, setLoadingOneTime] = useState(false);

  const handleSubscribe = async () => {
    setLoadingMonthly(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoadingMonthly(false);
    }
  };

  const handlePayOnce = async () => {
    setLoadingOneTime(true);
    try {
      const res = await fetch("/api/stripe/checkout-once", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoadingOneTime(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-widest text-[#c0392b] uppercase mb-2">
          Promptzilla 3000
        </h1>
        <div className="text-[#d4a017] text-sm font-bold tracking-widest uppercase mb-6">
          3000
        </div>
        <h2 className="text-3xl font-black tracking-widest text-[#d4a017] uppercase mb-3">
          One Final Step
        </h2>
        <p className="text-[#999] text-sm">
          Choose your destruction package. The city awaits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        {/* Monthly card */}
        <div className="bg-[#222] rounded-lg p-8">
          <div className="flex items-center gap-2 text-[#d4a017] font-bold tracking-widest uppercase text-sm mb-4">
            <RefreshCw className="w-4 h-4" />
            Monthly
          </div>
          <div className="mb-4">
            <span className="text-5xl font-black text-[#c0392b]">£5</span>
            <span className="text-[#999] text-sm ml-1">/month</span>
          </div>
          <p className="text-[#999] text-xs mb-6">
            Cancel anytime. Access until end of billing period.
          </p>
          <ul className="space-y-2 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[#ccc] text-sm">
                <Zap className="w-3.5 h-3.5 text-[#d4a017] mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubscribe}
            disabled={loadingMonthly}
            className="w-full bg-[#c0392b] hover:bg-[#a93226] text-white font-bold tracking-widest uppercase py-3 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {loadingMonthly ? "Loading…" : "Subscribe →"}
          </button>
        </div>

        {/* One month card */}
        <div className="bg-[#222] rounded-lg p-8">
          <div className="flex items-center gap-2 text-[#d4a017] font-bold tracking-widest uppercase text-sm mb-4">
            <Flame className="w-4 h-4" />
            One Month
          </div>
          <div className="mb-4">
            <span className="text-5xl font-black text-[#d4a017]">£12</span>
            <span className="text-[#999] text-sm ml-2">one-off</span>
          </div>
          <p className="text-[#999] text-xs mb-6">
            30 days full access. No recurring charge.
          </p>
          <ul className="space-y-2 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[#ccc] text-sm">
                <Zap className="w-3.5 h-3.5 text-[#d4a017] mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handlePayOnce}
            disabled={loadingOneTime}
            className="w-full border border-[#d4a017] text-[#d4a017] hover:bg-[#d4a017]/10 font-bold tracking-widest uppercase py-3 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {loadingOneTime ? "Loading…" : "Pay Once →"}
          </button>
        </div>
      </div>

      <p className="text-[#555] text-xs mt-10">
        Cheaper than rebuilding Tokyo. Payments processed securely by Stripe.
      </p>
    </div>
  );
}
