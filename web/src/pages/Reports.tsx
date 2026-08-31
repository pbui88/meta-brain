import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listCompetitorAds, listTemplates } from '../api';
import { TopNav } from '../components/TopNav';
import { button, card, colors, eyebrow, page, pageTitle } from '../styles';
import type { Report } from '../types';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(type: 'daily' | 'weekly') {
    setStatus(null);
    setError(null);
    try {
      const [ads, templates] = await Promise.all([listCompetitorAds(), listTemplates()]);
      const flaggedTemplates = templates.filter((template) => (template.latest_flags || []).length > 0);
      const sections =
        type === 'daily'
          ? [
              {
                title: 'Policy/Algorithm Alerts',
                content:
                  flaggedTemplates.length > 0
                    ? `${flaggedTemplates.length} template(s) currently have readiness flags that warrant operator review.`
                    : 'No major policy or delivery alerts surfaced today.',
              },
              {
                title: 'New Competitor Ads',
                content: `${ads.length} competitor ad records are currently available for review.`,
              },
              {
                title: 'Pattern Observations',
                content:
                  ads.length > 0
                    ? 'Focus on repeated hooks, persistent offers, and creatives surviving beyond short-lived bursts.'
                    : 'No competitor imports yet, so pattern observation is still pending.',
              },
              {
                title: 'Compliance Alerts',
                content:
                  flaggedTemplates.length > 0
                    ? flaggedTemplates.map((template) => template.name).join(', ')
                    : 'No templates are carrying active compliance flags.',
              },
              {
                title: 'Top Actions',
                content:
                  flaggedTemplates.length > 0
                    ? `Prioritize scoring fixes for ${flaggedTemplates[0].name}${flaggedTemplates[1] ? ` and ${flaggedTemplates[1].name}` : ''}.`
                    : 'Refresh competitor imports or generate a new ad test brief.',
              },
              {
                title: 'Recommended Test',
                content: 'Clone your top market template and pressure-test a benchmark-backed hook against the current control.',
              },
            ]
          : [
              {
                title: 'Weekly Executive Summary',
                content: `${templates.length} template(s) tracked and ${ads.length} competitor ad records monitored this week.`,
              },
              {
                title: 'Creative Market Shift',
                content: 'Review which offers and hooks persisted long enough to deserve packaging into the next round of tests.',
              },
              {
                title: 'Compliance Alerts',
                content:
                  flaggedTemplates.length > 0
                    ? `${flaggedTemplates.length} template(s) still need policy or setup remediation before scaling.`
                    : 'No major compliance issues surfaced this week.',
              },
              {
                title: 'Top Actions',
                content: 'Promote one high-readiness template, retire one weak concept, and queue one new test for the next 7-day cycle.',
              },
              {
                title: 'Recommended Test',
                content: 'Package one operator-approved hook into two formats and compare lead quality rather than surface click signals.',
              },
            ];

      const report: Report = {
        id: makeId(),
        type,
        generated_at: new Date().toISOString(),
        title: type === 'daily' ? 'Daily Operator Report' : 'Weekly Operator Report',
        sections,
      };

      setReports((current) => [report, ...current]);
      setStatus(`${report.title} generated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report.');
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
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Link to="/" style={{ ...eyebrow, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <h1 style={pageTitle}>Reports</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={button('secondary')} onClick={() => generate('daily')}>
              Generate Daily Report Now
            </button>
            <button style={button('primary')} onClick={() => generate('weekly')}>
              Generate Weekly Report Now
            </button>
          </div>
        </div>

        <div style={{ ...card, marginBottom: 18, borderColor: colors.borderStrong }}>
          Schedule/email/Slack delivery is planned for a future release.
        </div>

        {status && <div style={{ color: colors.good, marginBottom: 12 }}>{status}</div>}
        {error && <div style={{ color: colors.bad, marginBottom: 12 }}>{error}</div>}

        {reports.length === 0 ? (
          <div style={{ ...card, color: colors.muted }}>No reports generated yet. Create a daily or weekly report to start the archive.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reports.map((report) => (
              <div key={report.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{report.title}</div>
                    <div style={{ color: colors.muted, fontSize: 12.5 }}>
                      {report.type.toUpperCase()} · {new Date(report.generated_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.sections.map((section, index) => {
                    const key = `${report.id}:${index}`;
                    const isOpen = expanded[key] ?? true;
                    return (
                      <div key={key} style={{ border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
                        <button
                          onClick={() => setExpanded((current) => ({ ...current, [key]: !isOpen }))}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: 15,
                            fontWeight: 600,
                            color: colors.text,
                          }}
                        >
                          {isOpen ? '▾' : '▸'} {section.title}
                        </button>
                        {isOpen && <div style={{ fontSize: 13.5, color: colors.muted, marginTop: 8 }}>{section.content}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
