-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  subscription_status text default 'free' check (subscription_status in ('free', 'active', 'canceled', 'past_due')),
  subscription_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- API keys table (encrypted at rest via Supabase vault or app-level)
create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  provider text not null, -- 'anthropic', 'openai', 'google', 'mistral', 'cohere'
  key_encrypted text not null,
  key_preview text not null, -- e.g. "sk-...abcd"
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, provider)
);

-- Prompts table
create table if not exists prompts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  type text not null check (type in ('agentic', 'general', 'image', 'optimized')),
  agent_type text check (agent_type in ('agentic-team', 'optimizer', 'image', 'manual')),
  tags text[] default '{}',
  model_used text,
  is_public boolean default false,
  metadata jsonb default '{}', -- JSON structured data (e.g. image prompt params)
  version integer default 1,
  parent_id uuid references prompts(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Prompt versions table
create table if not exists prompt_versions (
  id uuid default gen_random_uuid() primary key,
  prompt_id uuid references prompts(id) on delete cascade not null,
  content text not null,
  version integer not null,
  change_note text,
  created_at timestamp with time zone default now()
);

-- Prompt likes (for community gallery)
create table if not exists prompt_likes (
  id uuid default gen_random_uuid() primary key,
  prompt_id uuid references prompts(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(prompt_id, user_id)
);

-- RLS Policies
alter table profiles enable row level security;
alter table api_keys enable row level security;
alter table prompts enable row level security;
alter table prompt_versions enable row level security;
alter table prompt_likes enable row level security;

-- Profiles policies
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- API keys policies
create policy "Users can manage their own API keys"
  on api_keys for all using (auth.uid() = user_id);

-- Prompts policies
create policy "Users can manage their own prompts"
  on prompts for all using (auth.uid() = user_id);

create policy "Anyone can view public prompts"
  on prompts for select using (is_public = true);

-- Prompt versions policies
create policy "Users can manage versions of their prompts"
  on prompt_versions for all using (
    exists (select 1 from prompts where prompts.id = prompt_versions.prompt_id and prompts.user_id = auth.uid())
  );

create policy "Anyone can view versions of public prompts"
  on prompt_versions for select using (
    exists (select 1 from prompts where prompts.id = prompt_versions.prompt_id and prompts.is_public = true)
  );

-- Prompt likes policies
create policy "Anyone can view likes"
  on prompt_likes for select using (true);

create policy "Authenticated users can like prompts"
  on prompt_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on prompt_likes for delete using (auth.uid() = user_id);

-- Trigger to create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Trigger to update updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure handle_updated_at();

create trigger prompts_updated_at before update on prompts
  for each row execute procedure handle_updated_at();

create trigger api_keys_updated_at before update on api_keys
  for each row execute procedure handle_updated_at();

-- Indexes
create index if not exists prompts_user_id_idx on prompts(user_id);
create index if not exists prompts_is_public_idx on prompts(is_public);
create index if not exists prompts_type_idx on prompts(type);
create index if not exists prompts_tags_idx on prompts using gin(tags);
create index if not exists prompt_versions_prompt_id_idx on prompt_versions(prompt_id);
