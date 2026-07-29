import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY
});

// We keep these helper methods to maintain compatibility if possible,
// but they'll query InsForge DB instead of custom endpoints.
export async function fetchPublicContent<T>(type: string, fallback: T): Promise<T> {
  try {
    const { data: rows, error } = await insforge.database
      .from('content_records')
      .select('data')
      .eq('content_type', type);

    if (error) throw error;
    if (rows && rows.length > 0) return rows.map(r => r.data) as T;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function fetchPublicContentById<T extends { slug?: string }>(type: string, slug: string, fallback: T): Promise<T> {
  try {
    const { data: rows, error } = await insforge.database
      .from('content_records')
      .select('data')
      .eq('content_type', type);

    if (error) throw error;
    if (rows && rows.length > 0) {
      const found = rows.map(r => r.data as T).find(item => item.slug === slug);
      if (found) return found;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
