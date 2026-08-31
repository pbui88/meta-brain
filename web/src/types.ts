export interface LeadFormQuestion {
  question: string;
  type: 'TIMELINE' | 'PROPERTY_TYPE' | 'OCCUPANCY' | 'CUSTOM';
}

export interface CampaignJson {
  name: string;
  market_city: string;
  special_ad_category: string;
  objective: 'LEADS' | 'SALES' | string;
  adset: {
    market_radius_miles: number;
    budget: {
      type: 'DAILY' | 'LIFETIME';
      amount: number;
    };
    schedule: {
      start_date: string;
      end_date?: string;
    };
    optimization_event: string;
    placements: string;
  };
  ad: {
    destination_type: 'LEAD_FORM' | 'WEBSITE' | 'MESSENGER' | string;
    primary_text: string;
    headline: string;
    description: string;
    video_script_snippet?: string;
    lead_form?: {
      type: string;
      sms_consent: boolean;
      custom_questions: LeadFormQuestion[];
    };
  };
  tracking: {
    pixel: boolean;
    capi: boolean;
  };
}

export interface ScoreFlag {
  category: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface ScoreResult {
  totalScore: number;
  housingScore: number;
  creativeScore: number;
  destinationScore: number;
  trackingScore: number;
  algorithmScore: number;
  flags: ScoreFlag[];
}

export interface TemplateSummary {
  id: string;
  name: string;
  market_city: string;
  market_radius_miles: number;
  objective: string;
  special_ad_category: string;
  created_at: string;
  updated_at: string;
  latest_score_id: string | null;
  latest_total_score: number | null;
  latest_flags: ScoreFlag[] | null;
  latest_score_at: string | null;
}

export interface TemplateRecord {
  id: string;
  name: string;
  market_city: string;
  market_radius_miles: number;
  objective: string;
  special_ad_category: string;
  json_definition: CampaignJson;
  created_at: string;
  updated_at: string;
}

export interface ImportedAdInput {
  brand_name: string;
  page_source?: string;
  country?: string;
  format?: string;
  primary_text?: string;
  headline?: string;
  cta?: string;
  start_date?: string;
  end_date?: string;
  impression_bucket?: string;
  destination_url?: string;
}

export interface WatchlistEntry {
  id: string;
  brand_name: string;
  page_source: string | null;
  notes: string | null;
  last_imported_at: string | null;
  ad_count: number;
  created_at: string;
}

export interface CompetitorAd {
  id: string;
  watchlist_id: string | null;
  brand_name: string;
  page_source: string | null;
  country: string | null;
  format: string | null;
  hook_text: string | null;
  offer_text: string | null;
  primary_text: string | null;
  headline: string | null;
  cta: string | null;
  funnel_stage: 'awareness' | 'consideration' | 'conversion' | null;
  destination_url: string | null;
  start_date: string | null;
  end_date: string | null;
  longevity_days: number | null;
  impression_bucket: string | null;
  created_at: string;
}

export interface HookBreakdown {
  label: string;
  count: number;
  brands: number;
  avgLongevityDays: number | null;
}

export interface BenchmarksResult {
  totalAds: number;
  topHooks: HookBreakdown[];
  formatDistribution: Array<{ format: string; count: number }>;
  ctaDistribution: Array<{ cta: string; count: number }>;
  funnelStageDistribution: Record<string, number>;
  avgLongevityDays: number | null;
  note: string;
}

export interface GeneratedAd {
  id?: string;
  market_city: string;
  market_state?: string | null;
  market_radius_miles: number;
  hook_pattern: string;
  offer_pattern: string;
  format: string;
  primary_text: string;
  headline: string;
  description: string;
  video_script: string;
  lead_form_questions: LeadFormQuestion[];
  warning?: string;
  created_at?: string;
}

export interface MarketLocation {
  city: string;
  state?: string;
}
