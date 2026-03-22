import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { AGENTIC_TEAM_SYSTEM_PROMPT } from "@/lib/agents/system-prompts";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { description, model, apiKey } = await request.json();

  if (!description || !apiKey) {
    return NextResponse.json({ error: "Missing description or API key" }, { status: 400 });
  }

  const [provider, modelId] = model.split(":");

  try {
    let content: string;

    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: modelId || "claude-sonnet-4-6",
        max_tokens: 4096,
        system: AGENTIC_TEAM_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Generate agentic team prompts for: ${description}` }],
      });
      content = (message.content[0] as { type: string; text: string }).text;
    } else if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: AGENTIC_TEAM_SYSTEM_PROMPT },
            { role: "user", content: `Generate agentic team prompts for: ${description}` },
          ],
          max_tokens: 4096,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI error");
      content = data.choices[0].message.content;
    } else if (provider === "google") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: AGENTIC_TEAM_SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: `Generate agentic team prompts for: ${description}` }] }],
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Google error");
      content = data.candidates[0].content.parts[0].text;
    } else if (provider === "mistral") {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: AGENTIC_TEAM_SYSTEM_PROMPT },
            { role: "user", content: `Generate agentic team prompts for: ${description}` },
          ],
          max_tokens: 4096,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Mistral error");
      content = data.choices[0].message.content;
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    return NextResponse.json({ content, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
