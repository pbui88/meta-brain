import type { Config } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { categorizeAd } from './_research/heuristics';
import { fetchAdLibraryEntries, toImportedAd } from './_research/metaAdLibrary';

interface WatchlistRow {
  id: string;
  brand_name: string;
  page_source: string | null;
  ad_count: number | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async () => {
  const accessToken = process.env.META_AD_LIBRARY_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('scheduledMetaAdLibrarySync: META_AD_LIBRARY_ACCESS_TOKEN not configured, skipping run.');
    return new Response('skipped: no META_AD_LIBRARY_ACCESS_TOKEN configured', { status: 200 });
  }

  const supabase = getSupabaseClient();
  const { data: watchlist, error } = await supabase
    .from('competitor_watchlist')
    .select('id, brand_name, page_source, ad_count');

  if (error) {
    console.error('scheduledMetaAdLibrarySync: failed to load watchlist', error.message);
    return new Response(`error loading watchlist: ${error.message}`, { status: 500 });
  }

  let totalFetched = 0;
  let totalImported = 0;
  const errors: string[] = [];

  for (const entry of (watchlist || []) as WatchlistRow[]) {
    try {
      const result = await fetchAdLibraryEntries({
        accessToken,
        pageId: entry.page_source || undefined,
        searchTerms: entry.page_source ? undefined : entry.brand_name,
      });

      if (!result.ok) {
        errors.push(`${entry.brand_name}: ${result.error}`);
        continue;
      }

      totalFetched += result.entries.length;
      if (result.entries.length === 0) continue;

      const rows = result.entries.map((e) => ({
        ...categorizeAd(toImportedAd(e, entry.brand_name)),
        watchlist_id: entry.id,
      }));

      const { data: inserted, error: insertError } = await supabase.from('competitor_ads').insert(rows).select();
      if (insertError) {
        errors.push(`${entry.brand_name}: ${insertError.message}`);
        continue;
      }

      totalImported += inserted?.length || 0;
      await supabase
        .from('competitor_watchlist')
        .update({
          last_imported_at: new Date().toISOString(),
          ad_count: (entry.ad_count || 0) + (inserted?.length || 0),
        })
        .eq('id', entry.id);
    } catch (err) {
      errors.push(`${entry.brand_name}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }

    // Be polite to the Graph API rate limits across multiple watchlist entries.
    await sleep(500);
  }

  const summary = { watchlistEntries: watchlist?.length || 0, totalFetched, totalImported, errors };
  console.log('scheduledMetaAdLibrarySync:', JSON.stringify(summary));
  return new Response(JSON.stringify(summary), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const config: Config = {
  schedule: '@daily',
};
