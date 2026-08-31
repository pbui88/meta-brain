import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { computeBenchmarks } from './_research/benchmarks';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed. Use GET.' });
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('competitor_ads')
    .select('brand_name, format, cta, hook_text, funnel_stage, longevity_days');

  if (error) {
    return jsonResponse(500, { error: error.message });
  }

  return jsonResponse(200, computeBenchmarks(data || []));
};
