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
  raw_source?: unknown;
}

export interface CategorizedAd extends ImportedAdInput {
  hook_text: string | null;
  offer_text: string | null;
  funnel_stage: 'awareness' | 'consideration' | 'conversion' | null;
  longevity_days: number | null;
}

export interface HookMatch {
  label: string;
  keywords: string[];
}

export interface FormatBreakdown {
  format: string;
  count: number;
}

export interface CtaBreakdown {
  cta: string;
  count: number;
}

export interface HookBreakdown {
  label: string;
  count: number;
  brands: number;
  avgLongevityDays: number | null;
  medianLongevityDays?: number | null;
  variationDensity?: number;
}

export interface BenchmarksResult {
  totalAds: number;
  topHooks: HookBreakdown[];
  formatDistribution: FormatBreakdown[];
  ctaDistribution: CtaBreakdown[];
  funnelStageDistribution: Record<string, number>;
  avgLongevityDays: number | null;
  note: string;
}
