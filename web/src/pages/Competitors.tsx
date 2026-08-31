import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addWatchlistEntry,
  deleteCompetitorAd,
  deleteWatchlistEntry,
  importCompetitorAds,
  listCompetitorAds,
  listWatchlist,
  updateCompetitorAd,
} from '../api';
import type { CompetitorAd, ImportedAdInput, WatchlistEntry } from '../types';
import { TopNav } from '../components/TopNav';
import { button, card, chip, colors, eyebrow, fonts, input, label, page, pageTitle, sectionTitle } from '../styles';

interface OperatorTags {
  proof?: string;
  aspectRatio?: string;
  sellerAngle?: string;
  singleFamilyRelevance?: number;
}

function parseImportText(text: string): ImportedAdInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('Invalid JSON. Check your input and try again.');
    }
    return Array.isArray(parsed) ? (parsed as ImportedAdInput[]) : [parsed as ImportedAdInput];
  }

  const lines = trimmed.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] || ''));
    return row as unknown as ImportedAdInput;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getTags(ad: CompetitorAd): OperatorTags {
  if (!isRecord(ad.raw_source)) return {};
  const tags = ad.raw_source.operator_tags;
  if (!isRecord(tags)) return {};
  return {
    proof: typeof tags.proof === 'string' ? tags.proof : '',
    aspectRatio: typeof tags.aspectRatio === 'string' ? tags.aspectRatio : '',
    sellerAngle: typeof tags.sellerAngle === 'string' ? tags.sellerAngle : '',
    singleFamilyRelevance:
      typeof tags.singleFamilyRelevance === 'number' && Number.isFinite(tags.singleFamilyRelevance)
        ? Math.max(0, Math.min(5, Math.round(tags.singleFamilyRelevance)))
        : 0,
  };
}

function mergeTags(ad: CompetitorAd, patch: Partial<OperatorTags>) {
  const rawSource = isRecord(ad.raw_source) ? ad.raw_source : {};
  const currentTags = getTags(ad);
  return {
    ...rawSource,
    operator_tags: {
      ...currentTags,
      ...patch,
    },
  };
}

export function Competitors() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | undefined>(undefined);
  const [newBrand, setNewBrand] = useState('');
  const [newPage, setNewPage] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [importText, setImportText] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshAll(watchlistId?: string) {
    Promise.all([listWatchlist(), listCompetitorAds(watchlistId)])
      .then(([watchlistData, adData]) => {
        setWatchlist(watchlistData);
        setAds(adData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load competitor workspace.'));
  }

  useEffect(() => {
    refreshAll(selectedWatchlistId);
  }, [selectedWatchlistId]);

  async function handleAddWatchlist() {
    if (!newBrand.trim()) return;
    try {
      await addWatchlistEntry(newBrand.trim(), newPage.trim() || undefined, newNotes.trim() || undefined);
      setNewBrand('');
      setNewPage('');
      setNewNotes('');
      refreshAll(selectedWatchlistId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add watchlist entry.');
    }
  }

  async function handleManualImport() {
    setError(null);
    setStatus(null);
    try {
      const parsedAds = parseImportText(importText);
      if (parsedAds.length === 0) {
        setError('Nothing to import.');
        return;
      }
      const res = await importCompetitorAds(parsedAds, selectedWatchlistId);
      setStatus(`Imported ${res.imported} ads.`);
      setImportText('');
      refreshAll(selectedWatchlistId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed. Check your JSON/CSV format.');
    }
  }

  async function handleFieldUpdate(ad: CompetitorAd, patch: Partial<CompetitorAd>) {
    try {
      const updated = await updateCompetitorAd(ad.id, patch);
      setAds((prev) => prev.map((current) => (current.id === ad.id ? updated : current)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update ad.');
    }
  }

  async function handleTagUpdate(ad: CompetitorAd, patch: Partial<OperatorTags>) {
    await handleFieldUpdate(ad, { raw_source: mergeTags(ad, patch) });
  }

  const brandOptions = useMemo(
    () => Array.from(new Set(ads.map((ad) => ad.brand_name))).sort((a, b) => a.localeCompare(b)),
    [ads]
  );
  const stageOptions = useMemo(
    () =>
      Array.from(
        new Set(
          ads
            .map((ad) => ad.funnel_stage)
            .filter((value): value is NonNullable<CompetitorAd['funnel_stage']> => value !== null)
        )
      ).sort(),
    [ads]
  );
  const formatOptions = useMemo(
    () => Array.from(new Set(ads.map((ad) => ad.format).filter((value): value is string => Boolean(value)))).sort(),
    [ads]
  );

  const filteredAds = useMemo(
    () =>
      ads.filter((ad) => {
        if (brandFilter !== 'ALL' && ad.brand_name !== brandFilter) return false;
        if (stageFilter !== 'ALL' && ad.funnel_stage !== stageFilter) return false;
        if (formatFilter !== 'ALL' && ad.format !== formatFilter) return false;
        return true;
      }),
    [ads, brandFilter, stageFilter, formatFilter]
  );

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
            <h1 style={pageTitle}>Competitors</h1>
          </div>
          <Link to="/benchmarks">
            <button style={button('secondary')}>View Patterns →</button>
          </Link>
        </div>

        {error && <div style={{ color: colors.bad, marginBottom: 12 }}>{error}</div>}
        {status && <div style={{ color: colors.good, marginBottom: 12 }}>{status}</div>}

        <div style={{ ...card, marginBottom: 18, borderColor: colors.borderStrong }}>
          <div style={{ fontSize: 13.5 }}>
            Public Meta Ad Library data does not reveal true CTR, CPL, or ROAS. Labels reflect visibility/survival
            proxies only.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={sectionTitle}>Watchlist</div>
              <input
                style={{ ...input, marginBottom: 6 }}
                placeholder="Brand name"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
              />
              <input
                style={{ ...input, marginBottom: 6 }}
                placeholder="Meta page ID / URL"
                value={newPage}
                onChange={(e) => setNewPage(e.target.value)}
              />
              <textarea
                style={{ ...input, height: 90, resize: 'vertical', marginBottom: 8 }}
                placeholder="Notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
              <button style={{ ...button('secondary'), width: '100%' }} onClick={handleAddWatchlist}>
                + Add to Watchlist
              </button>

              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: !selectedWatchlistId ? 700 : 400,
                  background: !selectedWatchlistId ? colors.bg : 'transparent',
                  marginTop: 12,
                }}
                onClick={() => setSelectedWatchlistId(undefined)}
              >
                All tracked ads
              </div>
              {watchlist.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: `1px solid ${selectedWatchlistId === entry.id ? colors.borderStrong : colors.border}`,
                    borderRadius: 10,
                    padding: 10,
                    marginTop: 8,
                    background: selectedWatchlistId === entry.id ? colors.bg : colors.paper,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div onClick={() => setSelectedWatchlistId(entry.id)} style={{ cursor: 'pointer', flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{entry.brand_name}</div>
                      <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>
                        {entry.ad_count} ads
                        {entry.last_imported_at ? ` · last import ${new Date(entry.last_imported_at).toLocaleDateString()}` : ''}
                      </div>
                      {entry.notes && <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 6 }}>{entry.notes}</div>}
                    </div>
                    <button
                      onClick={() => deleteWatchlistEntry(entry.id).then(() => refreshAll(selectedWatchlistId))}
                      style={{ border: 'none', background: 'none', color: colors.bad, cursor: 'pointer', fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={sectionTitle}>Manual Import</div>
              <label style={label}>Paste JSON array or CSV</label>
              <textarea
                style={{ ...input, height: 180, resize: 'vertical', fontFamily: fonts.mono, fontSize: 12 }}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='[{"brand_name":"Acme Homes","primary_text":"Sell as-is for cash","cta":"Get Offer"}]'
              />
              <button style={{ ...button('primary'), width: '100%', marginTop: 10 }} onClick={handleManualImport}>
                Import Ads
              </button>
            </div>
          </div>

          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={sectionTitle}>Filters</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div>
                  <label style={label}>Brand</label>
                  <select style={input} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                    <option value="ALL">All brands</option>
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Funnel Stage</label>
                  <select style={input} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                    <option value="ALL">All stages</option>
                    {stageOptions.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Format</label>
                  <select style={input} value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
                    <option value="ALL">All formats</option>
                    {formatOptions.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={sectionTitle}>
              Competitive Creative Library{' '}
              <span style={{ color: colors.muted, fontSize: 13, fontFamily: fonts.mono }}>{filteredAds.length} ads</span>
            </div>
            {filteredAds.length === 0 && <div style={{ color: colors.muted }}>No competitor ads match the current filters.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredAds.map((ad) => {
                const tags = getTags(ad);
                return (
                  <div key={ad.id} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 16 }}>{ad.brand_name}</div>
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                          Source: {ad.page_source || ad.country || 'Manual / imported data'} · Captured{' '}
                          {new Date(ad.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {ad.longevity_days != null && ad.longevity_days > 30 ? (
                          <span style={chip('good')}>long-running creative</span>
                        ) : (
                          <span style={chip('warn')}>observed market pattern</span>
                        )}
                        <button
                          onClick={() => deleteCompetitorAd(ad.id).then(() => refreshAll(selectedWatchlistId))}
                          style={{ border: 'none', background: 'none', color: colors.bad, cursor: 'pointer', fontSize: 12 }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {ad.primary_text && <div style={{ fontSize: 13.5, margin: '10px 0 4px' }}>{ad.primary_text}</div>}
                    {ad.headline && <div style={{ color: colors.muted, fontSize: 12.5 }}>{ad.headline}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
                      <div>
                        <label style={label}>Hook</label>
                        <input
                          style={input}
                          defaultValue={ad.hook_text || ''}
                          onBlur={(e) => handleFieldUpdate(ad, { hook_text: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={label}>Offer</label>
                        <input
                          style={input}
                          defaultValue={ad.offer_text || ''}
                          onBlur={(e) => handleFieldUpdate(ad, { offer_text: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={label}>Proof</label>
                        <input
                          style={input}
                          defaultValue={tags.proof || ''}
                          onBlur={(e) => handleTagUpdate(ad, { proof: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={label}>CTA</label>
                        <input
                          style={input}
                          defaultValue={ad.cta || ''}
                          onBlur={(e) => handleFieldUpdate(ad, { cta: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={label}>Format</label>
                        <input
                          style={input}
                          defaultValue={ad.format || ''}
                          onBlur={(e) => handleFieldUpdate(ad, { format: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={label}>Aspect Ratio</label>
                        <input
                          style={input}
                          defaultValue={tags.aspectRatio || ''}
                          onBlur={(e) => handleTagUpdate(ad, { aspectRatio: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={label}>Funnel Stage</label>
                        <select
                          style={input}
                          value={ad.funnel_stage ?? ''}
                          onChange={(e) =>
                            handleFieldUpdate(ad, {
                              funnel_stage:
                                e.target.value === ''
                                  ? null
                                  : (e.target.value as CompetitorAd['funnel_stage']),
                            })
                          }
                        >
                          <option value="">—</option>
                          <option value="awareness">awareness</option>
                          <option value="consideration">consideration</option>
                          <option value="conversion">conversion</option>
                        </select>
                      </div>
                      <div>
                        <label style={label}>Seller Angle</label>
                        <input
                          style={input}
                          defaultValue={tags.sellerAngle || ''}
                          onBlur={(e) => handleTagUpdate(ad, { sellerAngle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={label}>Single-Family Relevance</label>
                        <div style={{ display: 'flex', gap: 4, paddingTop: 8 }}>
                          {Array.from({ length: 5 }, (_, index) => {
                            const value = index + 1;
                            const active = value <= (tags.singleFamilyRelevance || 0);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleTagUpdate(ad, { singleFamilyRelevance: value })}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  color: active ? colors.primary : colors.borderStrong,
                                  fontSize: 18,
                                  padding: 0,
                                }}
                              >
                                ★
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 10 }}>
                      {ad.format || 'unknown format'} · {ad.funnel_stage || 'stage not tagged'} ·{' '}
                      {ad.longevity_days != null ? `${ad.longevity_days}d visible` : 'no longevity data'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
