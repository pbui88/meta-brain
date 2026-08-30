-- meta-brain database schema
-- Postgres / Supabase compatible

create extension if not exists "uuid-ossp";

-- =========================================================
-- 1. campaign_templates
-- =========================================================
create table if not exists campaign_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  market_city text not null,
  market_radius_miles numeric not null,
  objective text not null,
  special_ad_category text not null default 'HOUSING',
  json_definition jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaign_templates_market_city
  on campaign_templates (market_city);

-- =========================================================
-- 2. campaign_scores
-- =========================================================
create table if not exists campaign_scores (
  id uuid primary key default uuid_generate_v4(),
  campaign_template_id uuid references campaign_templates (id) on delete cascade,
  total_score numeric not null,
  housing_score numeric not null,
  creative_score numeric not null,
  destination_score numeric not null,
  tracking_score numeric not null,
  algorithm_score numeric not null,
  flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_campaign_scores_template_id
  on campaign_scores (campaign_template_id);

-- =========================================================
-- 3. meta_change_events + template_change_links
-- =========================================================
create table if not exists meta_change_events (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  date date not null,
  category text not null,
  summary text not null,
  impact_scope text,
  recommended_actions jsonb not null default '[]'::jsonb,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meta_change_events_date
  on meta_change_events (date desc);

create table if not exists template_change_links (
  id uuid primary key default uuid_generate_v4(),
  campaign_template_id uuid not null references campaign_templates (id) on delete cascade,
  meta_change_event_id uuid not null references meta_change_events (id) on delete cascade,
  status text not null default 'needs_action'
    check (status in ('needs_action', 'applied', 'ignored')),
  created_at timestamptz not null default now(),
  unique (campaign_template_id, meta_change_event_id)
);

create index if not exists idx_template_change_links_template
  on template_change_links (campaign_template_id);
create index if not exists idx_template_change_links_event
  on template_change_links (meta_change_event_id);

-- =========================================================
-- 4. competitor_ads + creative_patterns
-- =========================================================
create table if not exists competitor_ads (
  id uuid primary key default uuid_generate_v4(),
  brand_name text not null,
  page_source text,
  country text,
  format text,
  hook_text text,
  primary_text text,
  headline text,
  cta text,
  start_date date,
  end_date date,
  impression_bucket text,
  raw_source jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_competitor_ads_brand_name
  on competitor_ads (brand_name);

create table if not exists creative_patterns (
  id uuid primary key default uuid_generate_v4(),
  pattern_type text not null check (pattern_type in ('hook', 'offer', 'format')),
  description text not null,
  evidence jsonb not null default '[]'::jsonb, -- list of competitor_ads ids
  recommended_use text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 5. performance_imports + performance_metrics
-- =========================================================
create table if not exists performance_imports (
  id uuid primary key default uuid_generate_v4(),
  campaign_template_id uuid references campaign_templates (id) on delete set null,
  file_name text not null,
  imported_rows integer not null default 0,
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

create table if not exists performance_metrics (
  id uuid primary key default uuid_generate_v4(),
  performance_import_id uuid not null references performance_imports (id) on delete cascade,
  meta_object_id text,
  level text not null check (level in ('campaign', 'adset', 'ad')),
  name text,
  spend numeric,
  impressions bigint,
  clicks bigint,
  leads numeric,
  cpl numeric,
  cpa numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_performance_metrics_import_id
  on performance_metrics (performance_import_id);

-- =========================================================
-- updated_at trigger for campaign_templates
-- =========================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_campaign_templates_updated_at on campaign_templates;
create trigger trg_campaign_templates_updated_at
  before update on campaign_templates
  for each row
  execute function set_updated_at();
