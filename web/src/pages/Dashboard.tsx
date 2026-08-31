import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTemplates } from '../api';
import type { TemplateSummary } from '../types';
import { button, card, chip, colors } from '../styles';

function statusChip(t: TemplateSummary) {
  if (t.latest_total_score == null) return <span style={chip('neutral')}>Not scored</span>;
  if (t.latest_total_score >= 85) return <span style={chip('good')}>Score OK</span>;
  if ((t.latest_flags || []).some((f) => f.severity === 'high')) {
    return <span style={chip('bad')}>Needs changes</span>;
  }
  return <span style={chip('warn')}>Needs changes</span>;
}

export function Dashboard() {
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>meta-brain</h1>
          <div style={{ color: colors.muted }}>Campaign Templates Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={button('secondary')} disabled title="Coming soon">
            View Meta Changes
          </button>
          <button style={button('secondary')} disabled title="Coming soon">
            Upload Performance Report
          </button>
          <Link to="/architect">
            <button style={button('primary')}>+ New Campaign Template</button>
          </Link>
        </div>
      </div>

      {error && <div style={{ color: colors.bad, marginBottom: 16 }}>{error}</div>}

      {!templates && !error && <div style={{ color: colors.muted }}>Loading...</div>}

      {templates && templates.length === 0 && (
        <div style={{ ...card, textAlign: 'center', color: colors.muted, padding: 40 }}>
          No campaign templates yet. Create your first one to get started.
        </div>
      )}

      {templates && templates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map((t) => (
            <Link key={t.id} to={`/architect/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  ...card,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: colors.muted }}>
                    {t.market_city} · {t.market_radius_miles} mi · updated{' '}
                    {new Date(t.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {t.latest_total_score != null && (
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{t.latest_total_score}</div>
                  )}
                  {statusChip(t)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
