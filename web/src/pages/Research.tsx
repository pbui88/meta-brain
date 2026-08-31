import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listWatchlist,
  addWatchlistEntry,
  deleteWatchlistEntry,
  importCompetitorAds,
  fetchMetaAdLibrary,
  listCompetitorAds,
  updateCompetitorAd,
  deleteCompetitorAd,
} from '../api';
import type { WatchlistEntry, CompetitorAd, ImportedAdInput } from '../types';
import { TopNav } from '../components/TopNav';
import { button, card, colors, eyebrow, fonts, input, label, page, pageTitle, sectionTitle } from '../styles';

function parseImportText(text: string): ImportedAdInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  // CSV: first line = headers
  const lines = trimmed.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] || ''));
    return row as unknown as ImportedAdInput;
  });
}

export function Research() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | undefined>(undefined);
  const [newBrand, setNewBrand] = useState('');
  const [newPage, setNewPage] = useState('');
  const [importText, setImportText] = useState('');
  const [searchTerms, setSearchTerms] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshAll(watchlistId?: string) {
    listWatchlist().then(setWatchlist).catch((e) => setError(e.message));
    listCompetitorAds(watchlistId).then(setAds).catch((e) => setError(e.message));
  }

  useEffect(() => {
    refreshAll(selectedWatchlistId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWatchlistId]);

  async function handleAddWatchlist() {
    if (!newBrand) return;
    try {
      await addWatchlistEntry(newBrand, newPage || undefined);
      setNewBrand('');
      setNewPage('');
      refreshAll(selectedWatchlistId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add.');
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

  async function handleLiveFetch() {
    setError(null);
    setStatus(null);
    try {
      const res = await fetchMetaAdLibrary({
        searchTerms: searchTerms || undefined,
        watchlistId: selectedWatchlistId,
        autoImport: true,
      });
      setStatus(`Fetched ${res.fetched} ads from Meta Ad Library, imported ${res.imported ?? 0}.`);
      refreshAll(selectedWatchlistId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Live fetch failed.');
    }
  }

  async function handleAdEdit(ad: CompetitorAd, field: keyof CompetitorAd, value: string) {
    try {
      const updated = await updateCompetitorAd(ad.id, { [field]: value } as Partial<CompetitorAd>);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update.');
    }
  }

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
            <h1 style={pageTitle}>Industry Research</h1>
          </div>
          <Link to="/benchmarks">
            <button style={button('secondary')}>View Patterns &amp; Benchmarks →</button>
          </Link>
        </div>

        {error && <div style={{ color: colors.bad, marginBottom: 12 }}>{error}</div>}
        {status && <div style={{ color: colors.good, marginBottom: 12 }}>{status}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        <div>
          {/* Watchlist */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Watchlist</div>
            <div style={{ marginBottom: 10 }}>
              <input
                style={{ ...input, marginBottom: 6 }}
                placeholder="Brand name"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
              />
              <input
                style={{ ...input, marginBottom: 6 }}
                placeholder="Meta page ID / URL (optional)"
                value={newPage}
                onChange={(e) => setNewPage(e.target.value)}
              />
              <button style={{ ...button('secondary'), width: '100%' }} onClick={handleAddWatchlist}>
                + Add to Watchlist
              </button>
            </div>
            <div
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: !selectedWatchlistId ? 700 : 400,
                background: !selectedWatchlistId ? colors.bg : 'transparent',
              }}
              onClick={() => setSelectedWatchlistId(undefined)}
            >
              All ads
            </div>
            {watchlist.map((w) => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: selectedWatchlistId === w.id ? 600 : 400,
                  background: selectedWatchlistId === w.id ? colors.bg : 'transparent',
                }}
              >
                <div onClick={() => setSelectedWatchlistId(w.id)} style={{ flex: 1 }}>
                  <div>{w.brand_name}</div>
                  <div style={{ fontSize: 11, color: colors.muted }}>
                    {w.ad_count} ads
                    {w.last_imported_at ? ` · last import ${new Date(w.last_imported_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => deleteWatchlistEntry(w.id).then(() => refreshAll(selectedWatchlistId))}
                  style={{ border: 'none', background: 'none', color: colors.bad, cursor: 'pointer', fontSize: 12 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Live fetch */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Fetch from Meta Ad Library</div>
            <label style={label}>Search Terms</label>
            <input
              style={{ ...input, marginBottom: 8 }}
              placeholder="e.g. sell your house fast"
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
            />
            <button style={{ ...button('primary'), width: '100%' }} onClick={handleLiveFetch}>
              Fetch & Import
            </button>
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
              Requires META_AD_LIBRARY_ACCESS_TOKEN to be configured on the server.
            </div>
          </div>

          {/* Manual import */}
          <div style={card}>
            <div style={sectionTitle}>Manual Import</div>
            <label style={label}>Paste JSON array or CSV</label>
            <textarea
              style={{ ...input, height: 140, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"brand_name":"Acme Homes","primary_text":"Sell as-is for cash","cta":"Get Offer"}]'
            />
            <button style={{ ...button('secondary'), width: '100%', marginTop: 8 }} onClick={handleManualImport}>
              Import Ads
            </button>
          </div>
        </div>

        {/* Ad list / analysis */}
        <div>
          <div style={sectionTitle}>
            Ad Analysis {selectedWatchlistId ? `(${watchlist.find((w) => w.id === selectedWatchlistId)?.brand_name})` : '(All)'}
          </div>
          {ads.length === 0 && <div style={{ color: colors.muted }}>No ads imported yet.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ads.map((ad) => (
              <div key={ad.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 15.5 }}>{ad.brand_name}</div>
                  <button
                    onClick={() => deleteCompetitorAd(ad.id).then(() => refreshAll(selectedWatchlistId))}
                    style={{ border: 'none', background: 'none', color: colors.bad, cursor: 'pointer', fontSize: 12 }}
                  >
                    Remove
                  </button>
                </div>
                {ad.primary_text && <div style={{ fontSize: 13, margin: '6px 0' }}>{ad.primary_text}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
                  <div>
                    <label style={label}>Hook</label>
                    <input
                      style={input}
                      defaultValue={ad.hook_text || ''}
                      onBlur={(e) => handleAdEdit(ad, 'hook_text', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={label}>Offer</label>
                    <input
                      style={input}
                      defaultValue={ad.offer_text || ''}
                      onBlur={(e) => handleAdEdit(ad, 'offer_text', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={label}>Funnel Stage</label>
                    <select
                      style={input}
                      defaultValue={ad.funnel_stage || ''}
                      onChange={(e) => handleAdEdit(ad, 'funnel_stage', e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="awareness">Awareness</option>
                      <option value="consideration">Consideration</option>
                      <option value="conversion">Conversion</option>
                    </select>
                  </div>
                  <div>
                    <label style={label}>CTA</label>
                    <input
                      style={input}
                      defaultValue={ad.cta || ''}
                      onBlur={(e) => handleAdEdit(ad, 'cta', e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
                  {ad.format || 'unknown format'} · {ad.longevity_days != null ? `${ad.longevity_days}d live` : 'no duration'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
