import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createDefaultCampaign } from '../defaultCampaign';
import { getTemplate, saveTemplate, scoreCampaign } from '../api';
import type { CampaignJson, ScoreResult } from '../types';
import { CampaignBuilder } from '../components/CampaignBuilder';
import { ScoreCard } from '../components/ScoreCard';
import { Checklist } from '../components/Checklist';
import { GeneratePanel } from '../components/GeneratePanel';
import { TopNav } from '../components/TopNav';
import { button, colors, eyebrow, fonts, page, pageTitle } from '../styles';

export function Architect() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignJson>(createDefaultCampaign());
  const [advanced, setAdvanced] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [view, setView] = useState<'score' | 'checklist' | 'generate'>('score');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getTemplate(id)
      .then((t) => setCampaign(t.json_definition))
      .catch((err) => setRequestError(err.message));
  }, [id]);

  useEffect(() => {
    setJsonText(JSON.stringify(campaign, null, 2));
  }, [advanced]);

  function applyJsonText() {
    try {
      setCampaign(JSON.parse(jsonText));
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON.');
    }
  }

  async function runScore() {
    setRequestError(null);
    setLoading(true);
    try {
      const data = await scoreCampaign({ campaignJson: campaign });
      setResult(data);
      setView('score');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setRequestError(null);
    setSaving(true);
    try {
      const saved = await saveTemplate(campaign, id);
      if (!id) {
        navigate(`/architect/${saved.id}`, { replace: true });
      }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
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
            <h1 style={pageTitle}>Campaign Architect</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label
              style={{
                fontFamily: fonts.mono,
                fontSize: 11.5,
                color: colors.muted,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
              Advanced (JSON)
            </label>
            <button style={button('secondary', saving)} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : id ? 'Update Template' : 'Save Template'}
            </button>
            <button style={button('primary', loading)} onClick={runScore} disabled={loading}>
              {loading ? 'Scoring…' : 'Run Score'}
            </button>
          </div>
        </div>

        {requestError && <div style={{ color: colors.bad, marginBottom: 16 }}>{requestError}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            {advanced ? (
              <div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  onBlur={applyJsonText}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    height: 640,
                    fontFamily: fonts.mono,
                    fontSize: 13,
                    padding: 14,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    boxSizing: 'border-box',
                    background: colors.paper,
                  }}
                />
                {jsonError && <div style={{ color: colors.bad, marginTop: 8, fontSize: 13 }}>{jsonError}</div>}
              </div>
            ) : (
              <CampaignBuilder campaign={campaign} onChange={setCampaign} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button style={button(view === 'score' ? 'primary' : 'secondary')} onClick={() => setView('score')}>
                Scorecard
              </button>
              <button
                style={button(view === 'checklist' ? 'primary' : 'secondary')}
                onClick={() => setView('checklist')}
              >
                Checklist
              </button>
              <button
                style={button(view === 'generate' ? 'primary' : 'secondary')}
                onClick={() => setView('generate')}
              >
                Generate Ad
              </button>
            </div>

            {view === 'score' &&
              (result ? (
                <ScoreCard result={result} />
              ) : (
                <div style={{ color: colors.muted, fontSize: 14 }}>Run a score to see results here.</div>
              ))}

            {view === 'checklist' && <Checklist campaign={campaign} />}

            {view === 'generate' && <GeneratePanel campaign={campaign} onApply={setCampaign} />}
          </div>
        </div>
      </div>
    </div>
  );
}
