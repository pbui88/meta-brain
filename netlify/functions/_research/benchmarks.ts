import type { BenchmarksResult } from './types';

interface AdRow {
  brand_name: string;
  format: string | null;
  cta: string | null;
  hook_text: string | null;
  funnel_stage: string | null;
  longevity_days: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

export function computeBenchmarks(ads: AdRow[]): BenchmarksResult {
  if (ads.length === 0) {
    return {
      totalAds: 0,
      topHooks: [],
      formatDistribution: [],
      ctaDistribution: [],
      funnelStageDistribution: {},
      avgLongevityDays: null,
      note: 'No ads imported yet. Import ads from your watchlist to see benchmarks.',
    };
  }

  const hookMap = new Map<string, { count: number; brands: Set<string>; longevities: number[] }>();
  const formatMap = new Map<string, number>();
  const ctaMap = new Map<string, number>();
  const funnelMap: Record<string, number> = {};
  const longevities: number[] = [];

  for (const ad of ads) {
    if (ad.hook_text) {
      const entry = hookMap.get(ad.hook_text) || { count: 0, brands: new Set<string>(), longevities: [] };
      entry.count += 1;
      entry.brands.add(ad.brand_name);
      if (ad.longevity_days != null) entry.longevities.push(ad.longevity_days);
      hookMap.set(ad.hook_text, entry);
    }
    if (ad.format) formatMap.set(ad.format, (formatMap.get(ad.format) || 0) + 1);
    if (ad.cta) ctaMap.set(ad.cta, (ctaMap.get(ad.cta) || 0) + 1);
    if (ad.funnel_stage) funnelMap[ad.funnel_stage] = (funnelMap[ad.funnel_stage] || 0) + 1;
    if (ad.longevity_days != null) longevities.push(ad.longevity_days);
  }

  const topHooks = [...hookMap.entries()]
    .map(([label, v]) => ({
      label,
      count: v.count,
      brands: v.brands.size,
      avgLongevityDays: v.longevities.length
        ? Math.round(v.longevities.reduce((a, b) => a + b, 0) / v.longevities.length)
        : null,
      medianLongevityDays: median(v.longevities),
      variationDensity: Number((v.count / Math.max(1, v.brands.size)).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);

  const formatDistribution = [...formatMap.entries()]
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count);

  const ctaDistribution = [...ctaMap.entries()]
    .map(([cta, count]) => ({ cta, count }))
    .sort((a, b) => b.count - a.count);

  const avgLongevityDays = longevities.length
    ? Math.round(longevities.reduce((a, b) => a + b, 0) / longevities.length)
    : null;

  const topFormat = formatDistribution[0];
  const topHook = topHooks[0];
  const note =
    topHook && topFormat
      ? `Category leans on "${topHook.label}" (${topHook.count} ads, ${topHook.brands} brands) and ${topFormat.format} as the dominant format.`
      : 'Not enough categorized data yet for a summary note.';

  return {
    totalAds: ads.length,
    topHooks,
    formatDistribution,
    ctaDistribution,
    funnelStageDistribution: funnelMap,
    avgLongevityDays,
    note,
  };
}
