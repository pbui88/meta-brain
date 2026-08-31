import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  const supabase = getSupabaseClient();
  const id = event.queryStringParameters?.id;

  try {
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('competitor_watchlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, data);
    }

    if (event.httpMethod === 'POST') {
      let body: { brand_name: string; page_source?: string; notes?: string };
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return jsonResponse(400, { error: 'Invalid JSON body.' });
      }

      if (!body.brand_name) {
        return jsonResponse(400, { error: 'brand_name is required.' });
      }

      const { data, error } = await supabase
        .from('competitor_watchlist')
        .insert({ brand_name: body.brand_name, page_source: body.page_source, notes: body.notes })
        .select()
        .single();

      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return jsonResponse(400, { error: 'id query parameter is required.' });

      const { error } = await supabase.from('competitor_watchlist').delete().eq('id', id);
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(405, { error: 'Method not allowed.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    return jsonResponse(500, { error: message });
  }
};
