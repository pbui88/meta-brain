import { useState } from 'react';
import { DEFAULT_CAMPAIGN } from './defaultCampaign';
import { ScoreCard } from './ScoreCard';
import type { ScoreResult } from './types';

export default function App() {
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_CAMPAIGN, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  async function runScore() {
    setRequestError(null);
    setJsonError(null);

    let campaignJson: unknown;
    try {
      campaignJson = JSON.parse(jsonText);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/scoreCampaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignJson }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRequestError(data.error || `Request failed with status ${res.status}`);
        return;
      }

      setResult(data);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 4 }}>meta-brain</h1>
      <div style={{ color: '#666', marginBottom: 24 }}>Campaign Architect</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontWeight: 600 }}>Campaign JSON</label>
            <button
              onClick={runScore}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#1565c0',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Scoring...' : 'Run Score'}
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%',
              height: 560,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              padding: 12,
              border: '1px solid #ccc',
              borderRadius: 8,
              boxSizing: 'border-box',
            }}
          />
          {jsonError && (
            <div style={{ color: '#d32f2f', marginTop: 8, fontSize: 13 }}>
              JSON parse error: {jsonError}
            </div>
          )}
          {requestError && (
            <div style={{ color: '#d32f2f', marginTop: 8, fontSize: 13 }}>{requestError}</div>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Results</div>
          {result ? (
            <ScoreCard result={result} />
          ) : (
            <div style={{ color: '#999' }}>Run a score to see results here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
