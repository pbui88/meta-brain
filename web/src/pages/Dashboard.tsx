import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteTemplate, getBenchmarks, listCompetitorAds, listTemplates } from '../api';
import type { BenchmarksResult, CompetitorAd, TemplateSummary } from '../types';
import { TopNav } from '../components/TopNav';
import { button, card, chip, colors, eyebrow, fonts, page, pageTitle, sectionTitle, statNumber } from '../styles';

function statusChip(t: TemplateSummary) {
  if (t.latest_total_score == null) return <span style={chip('neutral')}>Not scored</span>;
  if (t.latest_total_score >= 85) return <span style={chip('good')}>Score OK</span>;
  if ((t.latest_flags || []).some((f) => f.severity === 'high')) {
    return <span style={chip('bad')}>Needs changes</span>;
  }
  return <span style={chip('warn')}>Needs changes</span>;
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return 'No data yet';
  return new Date(value).toLocaleString(undefined, withTime ? undefined : { dateStyle: 'medium' });
}

function getPriorityActions(templates: TemplateSummary[]): string[] {
  return templates
    .flatMap((template) => {
      const hasHighSeverity = (template.latest_flags || []).some((flag) => flag.severity === 'high');
      if (template.latest_total_score == null) return [`Run a readiness score for "${template.name}".`];
      if (hasHighSeverity) return [`Resolve high-severity blockers in "${template.name}".`];
      if (template.latest_total_score < 85) return [`Lift "${template.name}" above the 85-point readiness threshold.`];
      return [];
    })
    .slice(0, 5);
}

function emptyText(message: string) {
  return <div style={{ color: colors.muted, fontSize: 13.5 }}>{message}</div>;
}

export function Dashboard() {
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [competitorAds, setCompetitorAds] = useState<CompetitorAd[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarksResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setError(null);
    Promise.all([listTemplates(), listCompetitorAds(), getBenchmarks()])
      .then(([templateData, competitorData, benchmarkData]) => {
        setTemplates(templateData);
        setCompetitorAds(competitorData);
        setBenchmarks(benchmarkData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'));
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

  const priorityActions = useMemo(() => getPriorityActions(templates || []), [templates]);
  const attentionTemplates = useMemo(
    () =>
      (templates || []).filter(
        (template) =>
          template.latest_total_score == null ||
          template.latest_total_score < 85 ||
          (template.latest_flags || []).some((flag) => flag.severity === 'high')
      ),
    [templates]
  );
  const latestImportAt = useMemo(
    () =>
      competitorAds.reduce<string | null>((latest, ad) => {
        if (!latest || new Date(ad.created_at).getTime() > new Date(latest).getTime()) return ad.created_at;
        return latest;
      }, null),
    [competitorAds]
  );
  const freshnessNote = useMemo(() => {
    if (!latestImportAt) return 'No competitor imports yet. Load public Meta Ad Library data to activate trend radar.';
    const ageDays = Math.floor((Date.now() - new Date(latestImportAt).getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays <= 1) return 'Data looks fresh enough for daily operator decisions.';
    if (ageDays <= 7) return 'Research is usable, but a fresh import would improve test confidence.';
    return 'Research is stale. Refresh imports before making major creative calls.';
  }, [latestImportAt]);

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
            <div style={eyebrow}>Operator Command Center</div>
            <h1 style={pageTitle}>Dashboard</h1>
            <div style={{ color: colors.muted, fontSize: 13.5 }}>
              Monitor template readiness, competitor movement, and next-best tests from one premium control surface.
            </div>
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
              marginBottom: 20,
            }}
          >
            <div style={{ fontFamily: fonts.display, fontSize: 20, color: colors.text, marginBottom: 6 }}>
              No campaign templates yet
            </div>
            Create your first one to start planning a compliant, optimized campaign.
          </div>
        )}

        {templates && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <div style={{ ...card, gridColumn: '1 / -1' }}>
              <div style={sectionTitle}>Today's Priority Actions</div>
              {priorityActions.length === 0 ? (
                emptyText('No urgent template issues detected. You can shift focus toward new tests and competitor monitoring.')
              ) : (
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {priorityActions.map((action) => (
                    <li key={action} style={{ marginBottom: 8, fontSize: 13.5 }}>
                      {action}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div style={{ ...card, gridColumn: 'span 2' }}>
              <div style={sectionTitle}>Campaign Health</div>
              {templates.length === 0 ? (
                emptyText('Templates will appear here once you create them.')
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: 10,
                        padding: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <Link
                          to={`/architect/${template.id}`}
                          style={{ textDecoration: 'none', color: colors.text, fontFamily: fonts.display, fontSize: 16 }}
                        >
                          {template.name}
                        </Link>
                        <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 4 }}>
                          {template.market_city} · {template.market_radius_miles} mi radius · updated{' '}
                          {formatDate(template.updated_at)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {template.latest_total_score != null && (
                          <div style={{ ...statNumber, fontSize: 22 }}>{template.latest_total_score}</div>
                        )}
                        {statusChip(template)}
                        <button
                          onClick={() => handleDelete(template)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: colors.muted,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: fonts.mono,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <div style={sectionTitle}>Campaigns Needing Attention</div>
              {attentionTemplates.length === 0 ? (
                emptyText('No campaigns are currently below threshold.')
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {attentionTemplates.map((template) => (
                    <div key={template.id} style={{ paddingBottom: 10, borderBottom: `1px solid ${colors.border}` }}>
                      <Link
                        to={`/architect/${template.id}`}
                        style={{ textDecoration: 'none', color: colors.text, fontWeight: 600, fontSize: 13.5 }}
                      >
                        {template.name}
                      </Link>
                      <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                        {template.latest_total_score == null
                          ? 'Not scored yet'
                          : `Score ${template.latest_total_score} · ${(template.latest_flags || []).length} flagged item(s)`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <div style={sectionTitle}>New Competitor Activity</div>
              <div style={{ ...statNumber, fontSize: 36, marginBottom: 8 }}>{competitorAds.length}</div>
              <div style={{ color: colors.muted, fontSize: 13.5 }}>
                {competitorAds.length > 0
                  ? 'Tracked public ads currently available for operator review.'
                  : 'No competitor ads imported yet.'}
              </div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>Patterns Ready to Test</div>
              {benchmarks && benchmarks.totalAds > 0 && benchmarks.topHooks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {benchmarks.topHooks.slice(0, 4).map((hook) => (
                    <div key={hook.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 13.5 }}>{hook.label}</span>
                      <span style={{ ...statNumber, fontSize: 12, color: colors.muted }}>{hook.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                emptyText('Import competitor ads and tag hooks to surface reusable patterns.')
              )}
            </div>

            <div style={card}>
              <div style={sectionTitle}>Recent Imports</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{formatDate(latestImportAt, true)}</div>
              <div style={{ color: colors.muted, fontSize: 13.5 }}>
                {latestImportAt ? 'Latest captured competitor record in the workspace.' : 'Manual or live imports will show up here.'}
              </div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>Trend Radar</div>
              <div style={{ fontSize: 13.5, marginBottom: 8 }}>{benchmarks?.note || 'Benchmark trends will appear after imports.'}</div>
              <div style={{ color: colors.muted, fontSize: 12.5 }}>{freshnessNote}</div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>Next Best Tests</div>
              {benchmarks && benchmarks.topHooks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {benchmarks.topHooks.slice(0, 3).map((hook, index) => (
                    <div key={hook.label}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                        {index + 1}. {hook.label}
                      </div>
                      <div style={{ color: colors.muted, fontSize: 12 }}>
                        {hook.brands} brand{hook.brands === 1 ? '' : 's'}
                        {hook.avgLongevityDays != null ? ` · avg ${hook.avgLongevityDays}d live` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                emptyText('No benchmark-backed test ideas yet.')
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
