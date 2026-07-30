import { createClient } from '@insforge/sdk';
import { defaultSpmbContent, type SpmbContent } from '../data/spmb';

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY
});

const contentTable: Record<string, string> = {
  news: 'news',
  programs: 'programs',
  facilities: 'facilities',
  staff: 'staff',
  achievements: 'achievements',
};

function normalizeContentRows<T>(type: string, rows: unknown[]): T {
  if (type !== 'programs') return rows as T;

  return rows.map((row) => {
    const program = row as Record<string, unknown>;
    return {
      ...program,
      shortName: program.shortName ?? program.short_name,
      shortDescription: program.shortDescription ?? program.short_description,
      careerProspects: program.careerProspects ?? program.career_prospects,
    };
  }) as T;
}

export async function fetchPublicContent<T>(type: string, fallback: T): Promise<T> {
  const table = contentTable[type]
  if (!table) return fallback
  try {
    const { data, error } = await insforge.database.from(table).select('*');
    if (error) throw error;
    if (data && data.length > 0) return normalizeContentRows<T>(type, data);
    return fallback;
  } catch {
    return fallback;
  }
}

export async function fetchPublicContentById<T extends { slug?: string }>(type: string, slug: string, fallback: T): Promise<T> {
  const table = contentTable[type]
  if (!table) return fallback
  try {
    const { data, error } = await insforge.database.from(table).select('*').eq('slug', slug).limit(1).maybeSingle();
    if (error) throw error;
    if (data) return data as T;
    return fallback;
  } catch {
    return fallback;
  }
}

function normalizeSpmbContent(row: Record<string, unknown>): SpmbContent {
  return {
    id: row.id as string | undefined,
    status: (row.status as SpmbContent['status']) || defaultSpmbContent.status,
    title: (row.title as string) || defaultSpmbContent.title,
    description: (row.description as string) || defaultSpmbContent.description,
    latest_info: (row.latest_info as string) || defaultSpmbContent.latest_info,
    requirements: Array.isArray(row.requirements) ? (row.requirements as string[]) : defaultSpmbContent.requirements,
    schedule: Array.isArray(row.schedule) ? (row.schedule as SpmbContent['schedule']) : defaultSpmbContent.schedule,
    flow_steps: Array.isArray(row.flow_steps) ? (row.flow_steps as SpmbContent['flow_steps']) : defaultSpmbContent.flow_steps,
    faq: Array.isArray(row.faq) ? (row.faq as SpmbContent['faq']) : defaultSpmbContent.faq,
    portal_url: (row.portal_url as string) || defaultSpmbContent.portal_url,
    banner_image: (row.banner_image as string) || defaultSpmbContent.banner_image,
    banner_title: (row.banner_title as string) || defaultSpmbContent.banner_title,
    banner_description: (row.banner_description as string) || defaultSpmbContent.banner_description,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function fetchSpmbContent(fallback: SpmbContent = defaultSpmbContent): Promise<SpmbContent> {
  try {
    const { data, error } = await insforge.database.from('spmb_content').select('*').limit(1).maybeSingle();
    if (error) throw error;
    if (data) return normalizeSpmbContent(data as Record<string, unknown>);
    return fallback;
  } catch {
    return fallback;
  }
}
