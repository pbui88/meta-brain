-- Industry Research & Ad Generation module

create table if not exists competitor_watchlist (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  page_source text,
  notes text,
  last_imported_at timestamptz,
  ad_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table competitor_ads
  add column if not exists watchlist_id uuid references competitor_watchlist (id) on delete set null,
  add column if not exists offer_text text,
  add column if not exists funnel_stage text
    check (funnel_stage in ('awareness', 'consideration', 'conversion') or funnel_stage is null),
  add column if not exists destination_url text,
  add column if not exists longevity_days integer;

create index if not exists idx_competitor_ads_watchlist_id
  on competitor_ads (watchlist_id);

alter table creative_patterns
  add column if not exists confidence text
    check (confidence in ('low', 'medium', 'high') or confidence is null);

-- Generated ad concepts (output of the ad generation engine)
create table if not exists generated_ads (
  id uuid primary key default gen_random_uuid(),
  campaign_template_id uuid references campaign_templates (id) on delete set null,
  market_city text,
  market_radius_miles numeric,
  hook_pattern text,
  offer_pattern text,
  format text,
  primary_text text,
  headline text,
  description text,
  video_script text,
  lead_form_questions jsonb not null default '[]'::jsonb,
  source_pattern_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
