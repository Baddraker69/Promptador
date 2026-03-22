export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due';
export type PromptType = 'agentic' | 'general' | 'image' | 'optimized';
export type AgentType = 'agentic-team' | 'optimizer' | 'image' | 'manual';
export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'mistral';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  provider: ModelProvider;
  key_encrypted: string;
  key_preview: string;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: PromptType;
  agent_type: AgentType | null;
  tags: string[];
  model_used: string | null;
  is_public: boolean;
  metadata: Record<string, unknown>;
  version: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  like_count?: number;
  user_has_liked?: boolean;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  content: string;
  version: number;
  change_note: string | null;
  created_at: string;
}

export const MODELS: Record<ModelProvider, { label: string; models: { id: string; label: string }[] }> = {
  anthropic: {
    label: 'Anthropic',
    models: [
      { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'o1', label: 'o1' },
    ],
  },
  google: {
    label: 'Google',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
  mistral: {
    label: 'Mistral',
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large' },
      { id: 'mistral-small-latest', label: 'Mistral Small' },
    ],
  },
};

export const FREE_TIER_PROMPT_LIMIT = 10;
