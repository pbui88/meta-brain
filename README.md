# Meta Brain

**Internal wholesale real estate ads intelligence copilot** for motivated single-family home seller lead generation.

---

## Important: Public Competitor Data Limitation

> **Meta Ad Library and third-party ad-spy data do NOT reveal competitors' true CTR, CPL, conversion rate, ROAS, spend, targeting parameters, or lead quality.** All public ad findings are labeled as "long-running creative," "observed market pattern," "visibility/survival proxy," or "test hypothesis." Source and captured timestamp are surfaced for every imported ad. Never label a competitor ad "highest-converting." Do not copy competitor ad text verbatim into generated ads.

---

## Local Development

### Prerequisites

- Node.js 18+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
- A Supabase project

### Setup

```bash
# Install root dependencies (Netlify Functions)
npm install

# Install frontend dependencies
cd web && npm install && cd ..

# Create a .env file (see Required Environment Variables below)
cp .env.example .env   # edit with your values
```

### Run locally

```bash
# Starts both the Vite frontend and Netlify Functions dev server
netlify dev
```

The frontend will be served at `http://localhost:8888` with functions at `/.netlify/functions/*`.

### Build frontend only

```bash
cd web && npm run build
```

---

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Claude API key for ad generation |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role key (server-side only — never exposed to the browser) |
| `META_AD_LIBRARY_ACCESS_TOKEN` | Optional | Meta Ad Library API token for live ad fetches |
| `ANTHROPIC_WORKSPACE_ID` | Optional | Anthropic workspace ID for usage tracking |

Set these in a `.env` file at the repo root (Netlify CLI will load it automatically).

> ⚠️ The Supabase service role key is used server-side only inside Netlify Functions. It is never sent to the client. Do not add it to any frontend environment variable.

---

## Deployment (Netlify)

1. Connect this repository to a Netlify project.
2. Set all required environment variables in the Netlify dashboard under **Site Settings → Environment Variables**.
3. Build command: `cd web && npm run build`
4. Publish directory: `web/dist`
5. Functions directory: `netlify/functions` (auto-detected)

---

## Supabase Schema

Apply migrations in order from `supabase/migrations/`. Tables used:

- `campaign_templates` — saved campaign JSON definitions
- `campaign_scores` — readiness score history per template
- `competitor_watchlist` — brands being tracked
- `competitor_ads` — imported competitor ad observations
- `generated_ads` — AI-generated ad concepts

Row-level security (RLS) is enabled. See individual migration files for policies.

---

## Architecture Overview

```
web/               Vite + React + TypeScript frontend (SPA)
  src/
    pages/         Route-level page components
    components/    Shared UI components
    api.ts         Typed API client (calls /.netlify/functions/*)
    types.ts       Shared domain type definitions
    styles.ts      Design tokens and CSS-in-JS helpers
netlify/
  functions/       Netlify Functions (TypeScript, Node 18)
    _scoring/      Pure scoring logic (no HTTP handlers)
    _research/     Pure benchmark/pattern logic
    _supabase.ts   Supabase client factory
```

---

## Feature Overview

| Feature | Status |
|---|---|
| Campaign Architect (build + score templates) | ✅ Live |
| Campaign Compliance Center (100-pt readiness score) | ✅ Live |
| Research Lab (import competitor ads) | ✅ Live |
| Competitors (watchlist, structured tags, filters) | ✅ Live |
| Patterns & Benchmarks (confidence score, test briefs) | ✅ Live |
| Generate Ads (AI concepts with compliance review) | ✅ Live |
| Bulk Ad Generator | ✅ Live |
| Reports (daily/weekly, manual generation) | ✅ Live |
| Performance Imports | 🚧 Planned |
| Report email/Slack delivery | 🚧 Planned |
| Meta Ads Manager API integration | 🚧 Out of initial scope |

---

## Compliance & Legal Notes

- This tool is for internal campaign planning only.
- The readiness score is not a guarantee of Meta approval, ad delivery, legal compliance, CPL, or conversion rate.
- All HOUSING special ad category requirements must be independently verified before campaign launch.
- Consult qualified legal counsel for Fair Housing Act compliance review.
