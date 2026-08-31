import type {
  CampaignJson,
  ScoreResult,
  TemplateSummary,
  TemplateRecord,
  WatchlistEntry,
  CompetitorAd,
  BenchmarksResult,
  GeneratedAd,
  ImportedAdInput,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/.netlify/functions${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request to ${path} failed with status ${res.status}`);
  }
  return data as T;
}

export function listTemplates() {
  return request<TemplateSummary[]>('/campaignTemplates');
}

export function getTemplate(id: string) {
  return request<TemplateRecord>(`/campaignTemplates?id=${id}`);
}

export function saveTemplate(campaignJson: CampaignJson, id?: string) {
  return request<TemplateRecord>('/campaignTemplates', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ id, campaignJson }),
  });
}

export function deleteTemplate(id: string) {
  return request<{ success: true }>(`/campaignTemplates?id=${id}`, { method: 'DELETE' });
}

export function scoreCampaign(args: { campaignJson?: CampaignJson; campaignTemplateId?: string }) {
  return request<ScoreResult>('/scoreCampaign', {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

// --- Industry Research & Ad Generation ---

export function listWatchlist() {
  return request<WatchlistEntry[]>('/competitorWatchlist');
}

export function addWatchlistEntry(brand_name: string, page_source?: string, notes?: string) {
  return request<WatchlistEntry>('/competitorWatchlist', {
    method: 'POST',
    body: JSON.stringify({ brand_name, page_source, notes }),
  });
}

export function deleteWatchlistEntry(id: string) {
  return request<{ success: true }>(`/competitorWatchlist?id=${id}`, { method: 'DELETE' });
}

export function importCompetitorAds(ads: ImportedAdInput[], watchlistId?: string) {
  return request<{ imported: number; ads: CompetitorAd[] }>('/importCompetitorAds', {
    method: 'POST',
    body: JSON.stringify({ ads, watchlistId }),
  });
}

export function fetchMetaAdLibrary(args: {
  searchTerms?: string;
  pageId?: string;
  countries?: string[];
  watchlistId?: string;
  autoImport?: boolean;
}) {
  return request<{ fetched: number; imported?: number; ads: (ImportedAdInput | CompetitorAd)[] }>(
    '/fetchMetaAdLibrary',
    { method: 'POST', body: JSON.stringify(args) }
  );
}

export function listCompetitorAds(watchlistId?: string) {
  const query = watchlistId ? `?watchlistId=${watchlistId}` : '';
  return request<CompetitorAd[]>(`/competitorAds${query}`);
}

export function updateCompetitorAd(id: string, patch: Partial<CompetitorAd>) {
  return request<CompetitorAd>(`/competitorAds?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export function deleteCompetitorAd(id: string) {
  return request<{ success: true }>(`/competitorAds?id=${id}`, { method: 'DELETE' });
}

export function getBenchmarks() {
  return request<BenchmarksResult>('/benchmarks');
}

export function generateAdFromPattern(args: {
  marketCity: string;
  marketState?: string;
  marketRadiusMiles: number;
  hookPattern: string;
  offerPattern: string;
  format: string;
  funnelStage?: string;
  campaignTemplateId?: string;
}) {
  return request<GeneratedAd>('/generateAdFromPattern', {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

export function listGeneratedAds() {
  return request<GeneratedAd[]>('/generatedAds');
}

export function deleteGeneratedAd(id: string) {
  return request<{ success: true }>(`/generatedAds?id=${id}`, { method: 'DELETE' });
}
