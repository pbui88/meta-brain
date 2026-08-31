import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBenchmarks, generateAdFromPattern, listGeneratedAds, deleteGeneratedAd } from '../api';
import type { GeneratedAd, MarketLocation } from '../types';
import { OFFER_OPTIONS } from '../components/GeneratePanel';
import { TopNav } from '../components/TopNav';
import { button, card, colors, eyebrow, fonts, input, label, page, pageTitle, sectionTitle, chip } from '../styles';

const FORMAT_OPTIONS = [
  { value: 'VIDEO', label: 'Video Script' },
  { value: 'STATIC', label: 'Static Image' },
  { value: 'LEAD_AD', label: 'Lead Ad' },
];

const CONCURRENCY = 3;

function parseMarkets(text: string): MarketLocation[] {
  const seen = new Set<string>();
  const markets: MarketLocation[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const [cityPart, statePart] = line.split(',').map((s) => s.trim());
    if (!cityPart) continue;
    const key = `${cityPart.toLowerCase()}|${(statePart || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    markets.push({ city: cityPart, state: statePart || undefined });
  }
  return markets;
}

async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number, onEach: (result: T) => void) {
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      const result = await tasks[index]();
      onEach(result);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

interface JobResult {
  market: MarketLocation;
  offerPattern: string;
  status: 'success' | 'error';
  ad?: GeneratedAd;
  error?: string;
}

export function BulkGenerate() {
  const [marketsText, setMarketsText] = useState('');
  const [hookOptions, setHookOptions] = useState<string[]>([]);
  const [hookPattern, setHookPattern] = useState('');
  const [selectedOffers, setSelectedOffers] = useState<string[]>([OFFER_OPTIONS[0]]);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0].value);
  const [radius, setRadius] = useState(20);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [history, setHistory] = useState<GeneratedAd[]>([]);
  const [error, setError] = useState<string | null>(null);

  const markets = useMemo(() => parseMarkets(marketsText), [marketsText]);
  const totalJobs = markets.length * selectedOffers.length;

  function refreshHistory() {
    listGeneratedAds()
      .then(setHistory)
      .catch(() => {
        // history is best-effort; ignore failures
      });
  }

  useEffect(() => {
    getBenchmarks()
      .then((b) => {
        const labels = b.topHooks.map((h) => h.label);
        setHookOptions(labels);
        if (labels.length) setHookPattern(labels[0]);
      })
      .catch(() => {
        // Benchmarks unavailable; fall back to manual hook entry below.
      });
    refreshHistory();
  }, []);

  function toggleOffer(offer: string) {
    setSelectedOffers((prev) => (prev.includes(offer) ? prev.filter((o) => o !== offer) : [...prev, offer]));
  }

  async function generateAll() {
    setError(null);
    if (markets.length === 0) {
      setError('Import at least one city/state.');
      return;
    }
    if (selectedOffers.length === 0) {
      setError('Select at least one offer pattern.');
      return;
    }
    if (!hookPattern) {
      setError('Choose a hook pattern.');
      return;
    }

    const jobs: Array<() => Promise<JobResult>> = [];
    for (const market of markets) {
      for (const offerPattern of selectedOffers) {
        jobs.push(async () => {
          try {
            const ad = await generateAdFromPattern({
              marketCity: market.city,
              marketState: market.state,
              marketRadiusMiles: radius,
              hookPattern,
              offerPattern,
              format,
            });
            return { market, offerPattern, status: 'success', ad };
          } catch (e) {
            return {
              market,
              offerPattern,
              status: 'error',
              error: e instanceof Error ? e.message : 'Generation failed.',
            };
          }
        });
      }
    }

    setJobResults([]);
    setProgress({ done: 0, total: jobs.length });
    setRunning(true);
    try {
      await runWithConcurrency(jobs, CONCURRENCY, (result) => {
        setJobResults((prev) => [...prev, result]);
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      });
    } finally {
      setRunning(false);
      refreshHistory();
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    try {
      await deleteGeneratedAd(id);
      setHistory((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete.');
    }
  }

  const successCount = jobResults.filter((r) => r.status === 'success').length;
  const errorCount = jobResults.filter((r) => r.status === 'error').length;

  return (
    <div>
      <TopNav />
      <div style={{ ...page, maxWidth: 1320 }} className="fade-up">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Link to="/" style={{ ...eyebrow, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <h1 style={pageTitle}>Bulk Ad Generator</h1>
          </div>
        </div>

        {error && <div style={{ color: colors.bad, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={sectionTitle}>Import Markets</div>
              <label style={label}>Paste cities & states (one per line: City, ST)</label>
              <textarea
                style={{ ...input, height: 140, resize: 'vertical', fontFamily: fonts.mono, fontSize: 12 }}
                value={marketsText}
                onChange={(e) => setMarketsText(e.target.value)}
                placeholder={'Houston, TX\nDallas, TX\nPhoenix, AZ'}
              />
              <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 6 }}>
                {markets.length} market{markets.length === 1 ? '' : 's'} parsed
              </div>
            </div>

            <div style={{ ...card, marginBottom: 16 }}>
              <div style={sectionTitle}>Pattern & Format</div>
              <label style={label}>Hook Pattern</label>
              {hookOptions.length > 0 ? (
                <select
                  style={{ ...input, marginBottom: 10 }}
                  value={hookPattern}
                  onChange={(e) => setHookPattern(e.target.value)}
                >
                  {hookOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={{ ...input, marginBottom: 10 }}
                  placeholder="e.g. Sell as-is, skip repairs"
                  value={hookPattern}
                  onChange={(e) => setHookPattern(e.target.value)}
                />
              )}

              <label style={label}>Offer Patterns (buyer programs)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {OFFER_OPTIONS.map((offer) => {
                  const active = selectedOffers.includes(offer);
                  return (
                    <button
                      key={offer}
                      type="button"
                      onClick={() => toggleOffer(offer)}
                      style={{
                        ...chip(active ? 'good' : 'neutral'),
                        border: `1px solid ${active ? colors.good : colors.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      {offer}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={label}>Format</label>
                  <select style={input} value={format} onChange={(e) => setFormat(e.target.value)}>
                    {FORMAT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Radius (mi)</label>
                  <input
                    style={input}
                    type="number"
                    min={1}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button
                style={{ ...button('primary', running || totalJobs === 0), width: '100%', marginTop: 14 }}
                onClick={generateAll}
                disabled={running || totalJobs === 0}
              >
                {running
                  ? `Generating ${progress.done}/${progress.total}...`
                  : `Generate ${totalJobs || ''} ad${totalJobs === 1 ? '' : 's'}`}
              </button>
              {jobResults.length > 0 && !running && (
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
                  {successCount} succeeded{errorCount > 0 ? `, ${errorCount} failed` : ''}
                </div>
              )}
            </div>
          </div>

          <div>
            {jobResults.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionTitle}>This run</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {jobResults.map((r, i) => (
                    <div key={i} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 15 }}>
                            {r.market.city}
                            {r.market.state ? `, ${r.market.state}` : ''}
                          </div>
                          <span style={chip(r.status === 'success' ? 'good' : 'bad')}>{r.offerPattern}</span>
                        </div>
                        {r.status === 'error' && <span style={{ color: colors.bad, fontSize: 12 }}>{r.error}</span>}
                      </div>
                      {r.ad && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.ad.headline}</div>
                          <div style={{ fontSize: 13, color: colors.text, marginTop: 4 }}>{r.ad.primary_text}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={sectionTitle}>Generated Ad History</div>
              {history.length === 0 && <div style={{ color: colors.muted, fontSize: 14 }}>No ads generated yet.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((ad) => (
                  <div key={ad.id} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 15 }}>
                          {ad.market_city}
                          {ad.market_state ? `, ${ad.market_state}` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={chip('neutral')}>{ad.offer_pattern}</span>
                          <span style={chip('neutral')}>{ad.format}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        style={{ border: 'none', background: 'none', color: colors.bad, cursor: 'pointer', fontSize: 12 }}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 8 }}>{ad.headline}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{ad.primary_text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
