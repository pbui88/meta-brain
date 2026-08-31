import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { categorizeAd } from './_research/heuristics';
import type { ImportedAdInput } from './_research/types';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const GRAPH_API_VERSION = 'v23.0';
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

interface FetchPayload {
  searchTerms: string;
  pageId?: string;
  countries?: string[];
  watchlistId?: string;
  autoImport?: boolean;
}

interface MetaAdArchiveEntry {
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

function toImportedAd(entry: MetaAdArchiveEntry, brandFallback: string): ImportedAdInput {
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

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  const accessToken = process.env.META_AD_LIBRARY_ACCESS_TOKEN;
  if (!accessToken) {
    return jsonResponse(400, {
      error:
        'META_AD_LIBRARY_ACCESS_TOKEN is not configured. Create a Meta Developer App with Ad Library access, ' +
        'generate a token, and set it as an env var before using live fetch.',
    });
  }

  let body: FetchPayload;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  if (!body.searchTerms && !body.pageId) {
    return jsonResponse(400, { error: 'Provide searchTerms or pageId.' });
  }

  const countries = body.countries?.length ? body.countries : ['US'];

  const params = new URLSearchParams({
    access_token: accessToken,
    ad_type: 'HOUSING_EMPLOYMENT_CREDIT_ADS',
    ad_reached_countries: JSON.stringify(countries),
    fields: AD_LIBRARY_FIELDS,
    limit: '25',
  });

  if (body.searchTerms) params.set('search_terms', body.searchTerms);
  if (body.pageId) params.set('search_page_ids', JSON.stringify([body.pageId]));

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/ads_archive?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      return jsonResponse(res.status, {
        error: data?.error?.message || 'Meta Ad Library API request failed.',
        details: data,
      });
    }

    const entries: MetaAdArchiveEntry[] = data.data || [];
    const importedAds = entries.map((e) => toImportedAd(e, body.searchTerms || 'Unknown'));

    if (!body.autoImport) {
      return jsonResponse(200, { fetched: importedAds.length, ads: importedAds });
    }

    const supabase = getSupabaseClient();
    const rows = importedAds.map((ad) => ({
      ...categorizeAd(ad),
      watchlist_id: body.watchlistId || null,
    }));

    const { data: inserted, error } = await supabase.from('competitor_ads').insert(rows).select();
    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    if (body.watchlistId) {
      const { data: existing } = await supabase
        .from('competitor_watchlist')
        .select('ad_count')
        .eq('id', body.watchlistId)
        .single();

      await supabase
        .from('competitor_watchlist')
        .update({
          last_imported_at: new Date().toISOString(),
          ad_count: (existing?.ad_count || 0) + rows.length,
        })
        .eq('id', body.watchlistId);
    }

    return jsonResponse(200, { fetched: importedAds.length, imported: inserted?.length || 0, ads: inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching from Meta Ad Library.';
    return jsonResponse(500, { error: message });
  }
};
