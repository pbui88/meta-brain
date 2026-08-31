import { TopNav } from '../components/TopNav';
import { card, colors, page, pageTitle } from '../styles';

export function Settings() {
  return (
    <div>
      <TopNav />
      <div style={page} className="fade-up">
        <h1 style={pageTitle}>Settings</h1>
        <div style={card}>
          <div style={{ marginBottom: 10 }}>
            <strong>Required env vars:</strong> ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>Optional env vars:</strong> META_AD_LIBRARY_ACCESS_TOKEN, ANTHROPIC_WORKSPACE_ID
          </div>
          <a href="https://docs.netlify.com/functions/overview/" target="_blank" rel="noreferrer" style={{ color: colors.primary }}>
            View documentation
          </a>
        </div>
      </div>
    </div>
  );
}
