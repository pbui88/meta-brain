-- Bulk ad generation: track market state alongside city/offer pattern

alter table generated_ads
  add column if not exists market_state text;

create index if not exists idx_generated_ads_market_city_state
  on generated_ads (market_city, market_state);
