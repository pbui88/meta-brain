import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { categorizeAd } from './_research/heuristics';
import { fetchAdLibraryEntries, toImportedAd } from './_research/metaAdLibrary';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

interface FetchPayload {
  searchTerms: string;
  pageId?: string;
  countries?: string[];
  watchlistId?: string;
  autoImport?: boolean;
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

  try {
    const result = await fetchAdLibraryEntries({
      accessToken,
      searchTerms: body.searchTerms,
      pageId: body.pageId,
      countries: body.countries,
    });

    if (!result.ok) {
      return jsonResponse(result.status, { error: result.error, details: result.details });
    }

    const importedAds = result.entries.map((e) => toImportedAd(e, body.searchTerms || 'Unknown'));

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
