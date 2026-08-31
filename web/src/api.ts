import type { CampaignJson, ScoreResult, TemplateSummary, TemplateRecord } from './types';

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
