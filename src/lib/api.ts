const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export function apiUrl(path: string) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function fetchPublicContent<T>(type: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(apiUrl(`/api/public/content/${type}`), { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json() as T;
  } catch {
    return fallback;
  }
}

export async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text }; }
}

export async function fetchPublicContentById<T>(type: string, id: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(apiUrl(`/api/public/content/${type}/${encodeURIComponent(id)}`), { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json() as T;
  } catch {
    return fallback;
  }
}
