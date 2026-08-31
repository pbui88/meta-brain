import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTemplates, deleteTemplate } from '../api';
import type { TemplateSummary } from '../types';
import { TopNav } from '../components/TopNav';
import { button, card, chip, colors, eyebrow, fonts, page, pageTitle, statNumber } from '../styles';

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

  function refresh() {
    listTemplates()
      .then(setTemplates)
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, []);

  async function handleDelete(t: TemplateSummary) {
    if (!window.confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await deleteTemplate(t.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
    <div>
      <TopNav />
      <div style={page} className="fade-up">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 28,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={eyebrow}>Campaign Templates</div>
            <h1 style={pageTitle}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={button('secondary', true)} disabled title="Coming soon">
              Meta Changes
            </button>
            <button style={button('secondary', true)} disabled title="Coming soon">
              Performance Report
            </button>
            <Link to="/architect">
              <button style={button('primary')}>+ New Template</button>
            </Link>
          </div>
        </div>

        {error && <div style={{ color: colors.bad, marginBottom: 16 }}>{error}</div>}

        {!templates && !error && <div style={{ color: colors.muted }}>Loading…</div>}

        {templates && templates.length === 0 && (
          <div
            style={{
              ...card,
              textAlign: 'center',
              color: colors.muted,
              padding: 56,
              borderStyle: 'dashed',
            }}
          >
            <div style={{ fontFamily: fonts.display, fontSize: 20, color: colors.text, marginBottom: 6 }}>
              No campaign templates yet
            </div>
            Create your first one to start planning a compliant, optimized campaign.
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
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.borderStrong)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                >
                  <div>
                    <div style={{ fontFamily: fonts.display, fontSize: 17, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>
                      {t.market_city} · {t.market_radius_miles} mi radius · updated{' '}
                      {new Date(t.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {t.latest_total_score != null && (
                      <div style={{ ...statNumber, fontSize: 22 }}>{t.latest_total_score}</div>
                    )}
                    {statusChip(t)}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(t);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: colors.muted,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: fonts.mono,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = colors.bad)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = colors.muted)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
