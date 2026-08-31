import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { categorizeAd } from './_research/heuristics';
import type { ImportedAdInput } from './_research/types';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

interface ImportPayload {
  watchlistId?: string;
  ads: ImportedAdInput[];
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  let body: ImportPayload;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  if (!Array.isArray(body.ads) || body.ads.length === 0) {
    return jsonResponse(400, { error: 'ads must be a non-empty array.' });
  }

  const invalid = body.ads.find((ad) => !ad.brand_name);
  if (invalid) {
    return jsonResponse(400, { error: 'Every ad must include brand_name.' });
  }

  const supabase = getSupabaseClient();

  const rows = body.ads.map((ad) => {
    const categorized = categorizeAd(ad);
    return { ...categorized, watchlist_id: body.watchlistId || null };
  });

  const { data, error } = await supabase.from('competitor_ads').insert(rows).select();

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

  return jsonResponse(200, { imported: data?.length || 0, ads: data });
};
