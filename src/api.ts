import type { GetResponse, PostResponse, Writable } from './types';

const BASE_URL = import.meta.env.VITE_API_URL;
const TOKEN = import.meta.env.VITE_API_TOKEN;

export class ConfigError extends Error {}
export class ApiError extends Error {}

function assertConfig() {
  if (!BASE_URL || !TOKEN) {
    throw new ConfigError(
      'Missing API config. Set VITE_API_URL and VITE_API_TOKEN (in .env for local, or in Vercel project settings), then reload.',
    );
  }
}

/** READ — GET {BASE}?token={TOKEN} → { ok, count, rows } */
export async function fetchProspects(signal?: AbortSignal): Promise<GetResponse> {
  assertConfig();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}?token=${encodeURIComponent(TOKEN)}`, {
      method: 'GET',
      redirect: 'follow', // Apps Script 302-redirects to a googleusercontent.com host
      signal,
    });
  } catch (e) {
    throw new ApiError(
      `Network error reaching the backend. Check your connection and that VITE_API_URL is correct. (${(e as Error).message})`,
    );
  }
  if (!res.ok) {
    throw new ApiError(`Backend returned HTTP ${res.status}. The Apps Script may be down or the URL is wrong.`);
  }

  let data: GetResponse;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('Backend did not return JSON. Token may be wrong, or the Web App needs re-deploying.');
  }
  if (!data.ok) {
    throw new ApiError(data.error || 'Backend responded ok:false (check the token).');
  }
  return data;
}

/**
 * WRITE — POST {BASE} with the JSON body as text/plain.
 *
 * CRITICAL: Apps Script Web Apps don't answer CORS preflight, so a JSON
 * Content-Type triggers a preflight that fails. Sending text/plain avoids the
 * preflight entirely; Apps Script still parses e.postData.contents as JSON.
 */
export async function updateProspect(place_id: string, updates: Writable): Promise<PostResponse> {
  assertConfig();
  let res: Response;
  try {
    res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ token: TOKEN, place_id, updates }),
    });
  } catch (e) {
    throw new ApiError(`Network error saving. Your change was not written. (${(e as Error).message})`);
  }
  if (!res.ok) {
    throw new ApiError(`Save failed: HTTP ${res.status}.`);
  }

  let data: PostResponse;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('Save returned a non-JSON response — change may not have been written.');
  }
  if (!data.ok) {
    throw new ApiError(data.error || 'Backend rejected the write.');
  }
  return data;
}
