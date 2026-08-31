import type { ImportedAdInput } from './types';

export const GRAPH_API_VERSION = 'v23.0';

const AD_LIBRARY_FIELDS = [
  'page_name',
  'ad_creative_bodies',
  'ad_creative_link_titles',
  'ad_creative_link_descriptions',
  'ad_creative_link_captions',
  'ad_snapshot_url',
  'publisher_platforms',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'impressions',
].join(',');

export interface MetaAdArchiveEntry {
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  publisher_platforms?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  impressions?: { lower_bound?: string; upper_bound?: string };
  ad_snapshot_url?: string;
}

export function toImportedAd(entry: MetaAdArchiveEntry, brandFallback: string): ImportedAdInput {
  return {
    brand_name: entry.page_name || brandFallback,
    format: entry.publisher_platforms?.includes('instagram') ? 'INSTAGRAM' : 'FACEBOOK',
    primary_text: entry.ad_creative_bodies?.[0],
    headline: entry.ad_creative_link_titles?.[0],
    start_date: entry.ad_delivery_start_time,
    end_date: entry.ad_delivery_stop_time,
    impression_bucket: entry.impressions
      ? `${entry.impressions.lower_bound ?? '?'}-${entry.impressions.upper_bound ?? '?'}`
      : undefined,
    destination_url: entry.ad_snapshot_url,
    raw_source: entry,
  };
}

export async function fetchAdLibraryEntries(args: {
  accessToken: string;
  searchTerms?: string;
  pageId?: string;
  countries?: string[];
}): Promise<{ ok: true; entries: MetaAdArchiveEntry[] } | { ok: false; status: number; error: string; details: unknown }> {
  const countries = args.countries?.length ? args.countries : ['US'];

  const params = new URLSearchParams({
    access_token: args.accessToken,
    ad_type: 'HOUSING_EMPLOYMENT_CREDIT_ADS',
    ad_reached_countries: JSON.stringify(countries),
    fields: AD_LIBRARY_FIELDS,
    limit: '25',
  });

  if (args.searchTerms) params.set('search_terms', args.searchTerms);
  if (args.pageId) params.set('search_page_ids', JSON.stringify([args.pageId]));

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/ads_archive?${params.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data?.error?.message || 'Meta Ad Library API request failed.',
      details: data,
    };
  }

  return { ok: true, entries: data.data || [] };
}
