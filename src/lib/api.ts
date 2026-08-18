import type { SpmbContent, SpmbPoster } from './content-types';

const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const apiBaseUrl = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`;

const apiOrigin = configuredApiUrl.replace(/\/api$/, '');

export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url || !url.trim()) return undefined;
  if (url.startsWith('/') && !url.startsWith('//')) return `${apiOrigin}${url}`;
  return url;
}

export interface HomeContent {
  hero: { images: string[]; frame_image?: string; description: string; accreditation: string; facility_title: string; facility_description: string };
  welcome: { image: string; principal_name: string; principal_title: string; title: string; paragraphs: string[]; quote: string };
  about: { title: string; subtitle: string; paragraphs: string[]; card_label: string; card_title: string; quote: string; location: string };
  stats: { value: string; label: string }[];
  social?: { instagram: string; tiktok: string; email: string };
  contact?: { address: string; phone: string; email: string; hours: string; map_query: string };
}

export async function fetchHomeContent(): Promise<HomeContent | null> {
  const result = await request<{ data?: HomeContent } | HomeContent>('/data/content_records?content_type=home&single=1');
  if (!result.data) return null;
  return (result.data as { data?: HomeContent }).data ?? result.data as HomeContent;
}

export async function fetchStats(): Promise<{ value: string; label: string }[]> {
  const result = await request<{ value: string; label: string }[]>('/stats');
  if (!result.data) return [];
  return result.data;
}

export function youtubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/(?:watch|embed|shorts|live)\/)([\w-]{11})/,
    /youtube\.com\/watch\?.*v=([\w-]{11})/,
    /youtube\.com\/v\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  try {
    const videoId = new URL(url).searchParams.get('v');
    if (videoId && /^[\w-]{11}$/.test(videoId)) return videoId;
  } catch { /* ignore */ }
  return null;
}

export function youtubeEmbedUrl(url: string): string {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : '';
}

export function youtubeThumbnailUrl(url: string): string {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

export { apiBaseUrl };

type ApiError = { message?: string; [key: string]: unknown } | null;
type ApiResponse<T> = { data: T | null; error: ApiError; status?: number; count?: number | null; meta?: unknown };
type ApiResult<T> = Promise<ApiResponse<T>>;
type Filter = { key: string; value: unknown };

const PUBLIC_CACHE_TTL = 60_000;
const responseCache = new Map<string, { expiresAt: number; value: ApiResponse<unknown> }>();
const pendingRequests = new Map<string, Promise<ApiResponse<unknown>>>();

function canCache(path: string, method: string): boolean {
  return method === 'GET'
    && !path.startsWith('/auth/')
    && !path.startsWith('/admin/')
    && !path.startsWith('/data/')
    && !path.startsWith('/me')
    && !path.startsWith('/upload')
    && !path.startsWith('/uploads');
}

function clearCache(): void {
  responseCache.clear();
}

async function request<T>(path: string, options: RequestInit = {}): ApiResult<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const cacheable = canCache(path, method);
  const cacheKey = `${method}:${path}`;
  if (cacheable) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as ApiResponse<T>;
    responseCache.delete(cacheKey);
    const pending = pendingRequests.get(cacheKey);
    if (pending) return pending as Promise<ApiResponse<T>>;
  } else if (method !== 'GET') {
    clearCache();
  }

  const run = (async (): Promise<ApiResponse<T>> => {
  try {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers ?? {}),
      },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { data: null, status: response.status, error: body?.error ?? body ?? { message: 'Permintaan ke server gagal.' } };
    }
    const payload = body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;
    const result = { data: payload as T, status: response.status, error: body?.error ?? null, count: body?.count, meta: body?.meta };
    if (cacheable) responseCache.set(cacheKey, { expiresAt: Date.now() + PUBLIC_CACHE_TTL, value: result });
    return result;
  } catch {
    return { data: null, error: { message: 'Tidak dapat terhubung ke server.' } };
  }
  })();

  if (cacheable) {
    pendingRequests.set(cacheKey, run as Promise<ApiResponse<unknown>>);
    run.finally(() => pendingRequests.delete(cacheKey));
  }
  return run;
}

const tablePaths: Record<string, string> = {
  news: 'news', programs: 'programs', facilities: 'facilities', staff: 'staff', achievements: 'achievements',
  teacher_activities: 'teacher-activities', education_staff: 'education-staff', spmb_content: 'spmb',
  osis: 'osis', osis_members: 'osis/members', osis_activities: 'osis/activities',
  extracurriculars: 'extracurriculars', kesemaptaan: 'kesemaptaan', kesemaptaan_activities: 'kesemaptaan/activities',
  kesemaptaan_schedules: 'kesemaptaan/schedules', kesemaptaan_instructors: 'kesemaptaan/instructors',
  kesemaptaan_achievements: 'kesemaptaan/achievements', mading_categories: 'mading/categories', mading_posts: 'mading/posts',
};

class QueryBuilder {
  private table: string;
  private filters: Filter[] = [];
  private orderBy?: { column: string; ascending: boolean };
  private take?: number;
  private singleResult = false;
  private countRequested = false;
  private action: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private actionBody?: unknown;

  constructor(table: string) { this.table = table; }

  select(_columns = '*', options?: { count?: 'exact' }): this { this.countRequested = options?.count === 'exact'; return this; }
  eq(key: string, value: unknown): this { this.filters.push({ key, value }); return this; }
  order(column: string, options?: { ascending?: boolean }): this { this.orderBy = { column, ascending: options?.ascending !== false }; return this; }
  limit(value: number): this { this.take = value; return this; }
  maybeSingle(): this { this.singleResult = true; return this; }
  single(): this { this.singleResult = true; return this; }
  insert(rows: Record<string, unknown>[]): this { this.action = 'POST'; this.actionBody = rows; return this; }
  update(row: Record<string, unknown>): this { this.action = 'PATCH'; this.actionBody = row; return this; }
  delete(): this { this.action = 'DELETE'; return this; }
  then<TResult1 = { data: any; error: ApiError }, TResult2 = never>(onfulfilled?: ((value: { data: any; error: ApiError; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> { return this.execute(this.action, this.actionBody).then(onfulfilled, onrejected); }

  private async execute(method: string, body?: unknown): ApiResult<any> {
    const parameters = new URLSearchParams();
    for (const { key, value } of this.filters) parameters.set(key, String(value));
    if (this.orderBy) parameters.set('order', `${this.orderBy.column}|${this.orderBy.ascending ? 'asc' : 'desc'}`);
    if (this.take) parameters.set('limit', String(this.take));
    if (this.singleResult) parameters.set('single', '1');
    if (this.countRequested) parameters.set('count', 'exact');
    const suffix = parameters.size ? `?${parameters}` : '';
    const target = tablePaths[this.table] ? `/data/${this.table}${suffix}` : `/data/${this.table}${suffix}`;
    return request(target, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  }
}

const listeners = new Set<(event: 'signedIn' | 'signedOut') => void>();

export const backendApi: any = {
  database: {
    from: (table: string): any => new QueryBuilder(table),
    async rpc(name: string, params: Record<string, unknown> = {}): ApiResult<any> {
      const paths: Record<string, string> = {
        get_my_permissions: '/auth/permissions',
        get_student_login_email: '/auth/student-email',
        submit_mading_post: `/mading/posts/${params.p_post_id}/submit`,
        review_mading_post: `/mading/posts/${params.p_post_id}/review`,
        publish_mading_post: `/mading/posts/${params.p_post_id}/publish`,
        admin_create_student: '/admin/students',
        admin_reset_student_pin: `/admin/students/${params.p_student_id}/reset-pin`,
        admin_delete_student: `/admin/students/${params.p_student_id}`,
        admin_import_students: '/admin/students/import',
      };
      const path = paths[name];
      if (!path) return { data: null, error: { message: `RPC ${name} tidak tersedia.` } };
      if (name === 'get_my_permissions') return request(path);
      if (name === 'get_student_login_email') return request(path, { method: 'POST', body: JSON.stringify({ nisn: params.p_nisn }) });
      if (name === 'submit_mading_post' || name === 'publish_mading_post') return request(path, { method: 'POST' });
      if (name === 'review_mading_post') return request(path, { method: 'POST', body: JSON.stringify({ action: params.p_action, feedback: params.p_feedback }) });
      if (name === 'admin_create_student') return request(path, { method: 'POST', body: JSON.stringify(params) });
      if (name === 'admin_delete_student') return request(path, { method: 'DELETE' });
      return request(path, { method: 'POST', body: JSON.stringify(params) });
    },
  },
  auth: {
    async getCurrentUser() { const result = await request<any>('/auth/me'); return { data: result.data ? { user: result.data.user, role: result.data.role, status: result.data.status, mustChangePassword: result.data.must_change_password, permissions: result.data.permissions } : null, error: result.error }; },
    async signInWithPassword(credentials: { email?: string; password: string; identifier?: string }) { const body: Record<string, string> = { password: credentials.password }; if (credentials.identifier) body.identifier = credentials.identifier; else if (credentials.email) body.email = credentials.email; const result = await request<{ user: { id: string; email?: string }; role?: string; must_change_password?: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }); if (result.data) listeners.forEach((listener) => listener('signedIn')); return { data: result.data, error: result.error }; },
    async signUp(credentials: { email: string; password: string; name?: string; options?: { data?: { name?: string } } }) { const result = await request<{ user: { id: string; email?: string } }>('/auth/register', { method: 'POST', body: JSON.stringify({ email: credentials.email, password: credentials.password, name: credentials.name ?? credentials.options?.data?.name }) }); if (result.data) listeners.forEach((listener) => listener('signedIn')); return { data: result.data, error: result.error }; },
    async signOut() { const result = await request('/auth/logout', { method: 'POST' }); listeners.forEach((listener) => listener('signedOut')); return result; },
    onAuthStateChange(listener: (event: 'signedIn' | 'signedOut') => void) { listeners.add(listener); return () => listeners.delete(listener); },
  },
  storage: {
    from(bucket: string) { return {
      async uploadAuto(file: File) { const form = new FormData(); form.append('file', file); form.append('bucket', bucket); const result = await request<{ url: string }>('/upload', { method: 'POST', body: form }); return { data: result.data ? { url: result.data.url } : null, error: result.error }; },
      async upload(_path: string, file: File) { const form = new FormData(); form.append('file', file); form.append('bucket', bucket); const result = await request('/upload', { method: 'POST', body: form }); return { data: result.data, error: result.error }; },
      async remove(paths: string[]) { return request('/uploads', { method: 'DELETE', body: JSON.stringify({ paths }) }); },
      async createSignedUrl(path: string) { return request<{ url: string }>(`/uploads/url?path=${encodeURIComponent(path)}`); },
    }; },
  },
};

const contentPath: Record<string, string> = { news: 'news', programs: 'programs', facilities: 'facilities', staff: 'staff', achievements: 'achievements', teacherActivities: 'teacher-activities', educationStaff: 'education-staff' };
function normalizeProgram(row: unknown): unknown {
  const program = row as Record<string, unknown>;
  return {
    ...program,
    shortName: program.shortName ?? program.short_name,
    shortDescription: program.shortDescription ?? program.short_description,
    competencies: program.competencies ?? [],
    careerProspects: program.careerProspects ?? program.career_prospects ?? [],
    facilities: program.facilities ?? [],
  };
}
function normalizeContentRow<T>(type: string, row: unknown): T { return (type === 'programs' ? normalizeProgram(row) : row) as T; }
function normalizeContentRows<T>(type: string, rows: unknown[]): T { return (type === 'programs' ? rows.map(normalizeProgram) : rows) as T; }
export async function fetchPublicContent<T>(type: string, options?: { limit?: number }): Promise<T> { const path = contentPath[type]; if (!path) return [] as T; const suffix = options?.limit ? `?limit=${options.limit}` : ''; const result = await request<unknown[]>(`/${path}${suffix}`); return result.data ? normalizeContentRows<T>(type, result.data) : [] as T; }
export async function fetchPublicContentByIdResult<T extends { slug?: string }>(type: string, slug: string): Promise<{ data: T | null; error: ApiError }> { const path = contentPath[type]; if (!path) return { data: null, error: { message: 'Konten tidak tersedia.' } }; const result = await request<unknown>(`/${path}/${encodeURIComponent(slug)}`); return { data: result.data ? normalizeContentRow<T>(type, result.data) : null, error: result.status === 404 ? null : result.error }; }
export async function fetchPublicContentById<T extends { slug?: string }>(type: string, slug: string): Promise<T | null> { return (await fetchPublicContentByIdResult<T>(type, slug)).data; }
function normalizeSpmbContent(row: Record<string, unknown>): SpmbContent { return { id: row.id as string | undefined, status: (row.status as SpmbContent['status']) || 'ditutup', title: String(row.title ?? ''), description: String(row.description ?? ''), latest_info: String(row.latest_info ?? ''), requirements: Array.isArray(row.requirements) ? row.requirements as string[] : [], schedule: Array.isArray(row.schedule) ? row.schedule as SpmbContent['schedule'] : [], flow_steps: Array.isArray(row.flow_steps) ? row.flow_steps as SpmbContent['flow_steps'] : [], faq: Array.isArray(row.faq) ? row.faq as SpmbContent['faq'] : [], portal_url: String(row.portal_url ?? ''), banner_image: String(row.banner_image ?? ''), banner_title: String(row.banner_title ?? ''), banner_description: String(row.banner_description ?? ''), updated_at: row.updated_at as string | undefined }; }
export async function fetchSpmbContent(): Promise<SpmbContent | null> { const result = await request<Record<string, unknown>>('/spmb'); return result.data ? normalizeSpmbContent(result.data) : null; }

// ---------- SPMB POSTERS (informational flyers / images) ----------
export async function fetchSpmbPosters(): Promise<SpmbPoster[]> {
  const result = await request<SpmbPoster[]>('/spmb/posters');
  return result.data ?? [];
}

export const spmbPosterApi = {
  listAll(): ApiResult<SpmbPoster[]> {
    return request<SpmbPoster[]>('/admin/spmb/posters');
  },
  create(payload: Record<string, unknown>): ApiResult<SpmbPoster> {
    return request<SpmbPoster>('/admin/spmb/posters', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id: string, payload: Record<string, unknown>): ApiResult<SpmbPoster> {
    return request<SpmbPoster>(`/admin/spmb/posters/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id: string): ApiResult<null> {
    return request<null>(`/admin/spmb/posters/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  upload(file: File): ApiResult<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>('/admin/spmb/posters/upload', { method: 'POST', body: form });
  },
};
async function fetchFromApi<T>(path: string): Promise<T> { const result = await request<T>(path); return result.data ?? ([] as T); }
export const fetchOsisProfile = <T>() => fetchFromApi<T>('/osis');
export const fetchOsisMembers = <T>() => fetchFromApi<T>('/osis/members');
export const fetchOsisActivities = <T>() => fetchFromApi<T>('/osis/activities');
export const fetchExtracurriculars = <T>() => fetchFromApi<T>('/extracurriculars');
export const fetchExtracurricularBySlug = <T>(slug: string) => fetchFromApi<T | null>(`/extracurriculars/${encodeURIComponent(slug)}`);
export const fetchKesemaptaanProfile = <T>() => fetchFromApi<T>('/kesemaptaan');
export const fetchKesemaptaanActivities = <T>() => fetchFromApi<T>('/kesemaptaan/activities');
export const fetchKesemaptaanSchedules = <T>() => fetchFromApi<T>('/kesemaptaan/schedules');
export const fetchKesemaptaanInstructors = <T>() => fetchFromApi<T>('/kesemaptaan/instructors');
export const fetchKesemaptaanAchievements = <T>() => fetchFromApi<T>('/kesemaptaan/achievements');
export const fetchMadingCategories = <T>() => fetchFromApi<T>('/mading/categories');

// ---------- FAQ ----------
export interface FaqRow {
  id?: string;
  question: string;
  answer: string;
  category: string;
  sort_order?: number;
}
export const fetchFaqs = <T>() => fetchFromApi<T>('/faqs');
export interface MadingPostRow extends Record<string, unknown> { id?: string; title?: string; content?: string; category_id?: string | null; author_id?: string | null; author_name?: string; author_role?: string; cover_image?: string; status?: string; feedback?: string; ai_assisted?: boolean; published_at?: string | null; created_at?: string; updated_at?: string; }
export async function fetchMadingPosts(filter?: { status?: string; authorId?: string; categoryId?: string }): Promise<MadingPostRow[]> { const params = new URLSearchParams(); if (filter?.status) params.set('status', filter.status); if (filter?.authorId) params.set('author_id', filter.authorId); if (filter?.categoryId) params.set('category_id', filter.categoryId); const result = await request<MadingPostRow[]>(`/mading/posts${params.size ? `?${params}` : ''}`); return result.data ?? []; }
export async function fetchMadingPublished(): Promise<MadingPostRow[]> { return fetchMadingPosts({ status: 'published' }); }

// ---------- MADING AI CONTENT ASSISTANT ----------
export type MadingContentType = 'Puisi' | 'Cerpen' | 'Artikel' | 'Pantun' | 'Esai' | 'Opini' | 'Motivasi' | 'Edukasi' | 'Tips' | 'Pengumuman' | 'Konten Kreatif';
export type MadingAiLength = 'Pendek' | 'Sedang' | 'Panjang';
export type MadingAiStyle = 'Formal' | 'Santai' | 'Inspiratif' | 'Edukatif' | 'Persuasif' | 'Kreatif';

export interface MadingAiDraft { title: string; content: string; category: string; excerpt: string; }
export interface MadingAiIdea { title: string; description: string; category: string; }

export const MADING_AI_CONTENT_TYPES: MadingContentType[] = ['Puisi', 'Cerpen', 'Artikel', 'Pantun', 'Esai', 'Opini', 'Motivasi', 'Edukasi', 'Tips', 'Pengumuman', 'Konten Kreatif'];
export const MADING_AI_LENGTHS: MadingAiLength[] = ['Pendek', 'Sedang', 'Panjang'];
export const MADING_AI_STYLES: MadingAiStyle[] = ['Formal', 'Santai', 'Inspiratif', 'Edukatif', 'Persuasif', 'Kreatif'];

async function madingAiRequest<T>(path: string, body: Record<string, unknown>): ApiResult<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export const madingAiApi = {
  generate(input: { content_type: MadingContentType; topic: string; style?: string; length?: MadingAiLength; context?: string }): ApiResult<MadingAiDraft> {
    return madingAiRequest<MadingAiDraft>('/mading/ai/generate', input);
  },
  improve(input: { content: string; content_type?: string; style?: string }): ApiResult<MadingAiDraft> {
    return madingAiRequest<MadingAiDraft>('/mading/ai/improve', input);
  },
  shorten(input: { content: string; content_type?: string }): ApiResult<MadingAiDraft> {
    return madingAiRequest<MadingAiDraft>('/mading/ai/shorten', input);
  },
  expand(input: { content: string; content_type?: string; style?: string }): ApiResult<MadingAiDraft> {
    return madingAiRequest<MadingAiDraft>('/mading/ai/expand', input);
  },
  changeStyle(input: { content: string; style: string; content_type?: string }): ApiResult<MadingAiDraft> {
    return madingAiRequest<MadingAiDraft>('/mading/ai/change-style', input);
  },
  generateIdeas(input: { topic: string; target?: string }): ApiResult<{ ideas: MadingAiIdea[] }> {
    return madingAiRequest<{ ideas: MadingAiIdea[] }>('/mading/ai/generate-ideas', input);
  },
};

// ---------- ACCOUNT MANAGEMENT (admin) ----------
export type AccountRole = 'admin' | 'operator_sekolah' | 'guru' | 'osis' | 'bkk' | 'student';

export interface AccountRow {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
  phone?: string;
  nisn?: string;
  nis?: string;
  pin?: string;
  class?: string;
  major?: string;
  gender?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  religion?: string;
  address?: string;
  status?: string;
  must_change_password?: boolean;
  achievements?: string[];
  guru?: { nip?: string; nuptk?: string; teacher_id?: string; subject?: string; position?: string; certifications?: string[] } | null;
  osis?: { member_id?: string; nisn?: string; division?: string; position?: string; work_programs?: string[] } | null;
  created_at?: string;
  [key: string]: unknown;
}

export const accountsApi = {
  list(params?: { role?: AccountRole | ''; search?: string }): ApiResult<AccountRow[]> {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.search) q.set('search', params.search);
    const suffix = q.size ? `?${q}` : '';
    return request<AccountRow[]>(`/admin/accounts${suffix}`);
  },
  create(payload: Record<string, unknown>): ApiResult<AccountRow> {
    return request<AccountRow>('/admin/accounts', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id: string, payload: Record<string, unknown>): ApiResult<AccountRow> {
    return request<AccountRow>(`/admin/accounts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id: string): ApiResult<null> {
    return request<null>(`/admin/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  importStudents(rows: Record<string, string>[]): ApiResult<{ imported: number; skipped: number; errors: { row: number; nisn?: string; message: string }[] }> {
    return request('/admin/accounts/import', { method: 'POST', body: JSON.stringify({ rows }) });
  },
};

// ---------- GALLERY ----------
export interface GalleryImageRow {
  id?: string;
  gallery_id?: string;
  image: string;
  caption?: string;
  sort_order?: number;
  created_at?: string;
}

export interface GalleryVideoRow {
  id: string;
  gallery_id?: string;
  youtube_url: string;
  title?: string;
  sort_order?: number;
  created_at?: string;
}

export interface GalleryRow {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  event_date?: string | null;
  location?: string;
  cover_image: string;
  is_published?: boolean;
  images?: GalleryImageRow[];
  videos?: GalleryVideoRow[];
  images_count?: number;
  videos_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GalleryMeta {
  total: number;
  page: number;
  limit: number;
  last_page: number;
}

export const GALLERY_CATEGORIES = ['Akademik', 'Kegiatan', 'Olahraga', 'Seni', 'Keagamaan', 'Lomba', 'Prestasi', 'Lainnya'];

export async function fetchGalleries(params?: {
  year?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ rows: GalleryRow[]; meta: GalleryMeta }> {
  const q = new URLSearchParams();
  if (params?.year) q.set('year', params.year);
  if (params?.category) q.set('category', params.category);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const suffix = q.size ? `?${q}` : '';
  const result = await request<GalleryRow[]>(`/galleries${suffix}`);
  return result.data
    ? { rows: result.data, meta: (result.meta as GalleryMeta) ?? { total: 0, page: 1, limit: 9, last_page: 1 } }
    : { rows: [], meta: { total: 0, page: 1, limit: 9, last_page: 1 } };
}

export async function fetchGalleryCategories(): Promise<string[]> {
  const result = await request<string[]>('/gallery/categories');
  return result.data ?? [];
}

export async function fetchGalleryBySlug(slug: string): Promise<GalleryRow | null> {
  const result = await request<GalleryRow>(`/galleries/${encodeURIComponent(slug)}`);
  return result.data ?? null;
}

export const galleryAdminApi = {
  list(params?: { search?: string; category?: string; page?: number; limit?: number }): ApiResult<GalleryRow[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category) q.set('category', params.category);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 10));
    const suffix = q.size ? `?${q}` : '';
    return request<GalleryRow[]>(`/admin/galleries${suffix}`);
  },
  create(payload: FormData): ApiResult<GalleryRow> {
    return request<GalleryRow>('/admin/galleries', { method: 'POST', body: payload });
  },
  update(id: string, payload: FormData): ApiResult<GalleryRow> {
    return request<GalleryRow>(`/admin/galleries/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
  },
  remove(id: string): ApiResult<null> {
    return request<null>(`/admin/galleries/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  addImages(id: string, images: File[]): ApiResult<GalleryRow> {
    const form = new FormData();
    images.forEach((file) => form.append('images[]', file));
    return request<GalleryRow>(`/admin/galleries/${encodeURIComponent(id)}/images`, { method: 'POST', body: form });
  },
  removeImage(imageId: string): ApiResult<null> {
    return request<null>(`/admin/gallery-images/${encodeURIComponent(imageId)}`, { method: 'DELETE' });
  },
  reorder(images: { id: string; sort_order: number }[]): ApiResult<null> {
    return request<null>('/admin/gallery-images/reorder', { method: 'PUT', body: JSON.stringify({ images }) });
  },
  addVideos(id: string, videos: { youtube_url: string; title?: string }[]): ApiResult<GalleryRow> {
    return request<GalleryRow>(`/admin/galleries/${encodeURIComponent(id)}/videos`, {
      method: 'POST',
      body: JSON.stringify({ videos }),
    });
  },
  removeVideo(videoId: string): ApiResult<null> {
    return request<null>(`/admin/gallery-videos/${encodeURIComponent(videoId)}`, { method: 'DELETE' });
  },
  reorderVideos(videos: { id: string; sort_order: number }[]): ApiResult<null> {
    return request<null>('/admin/gallery-videos/reorder', { method: 'PUT', body: JSON.stringify({ videos }) });
  },
};

// ---------- SELF-SERVICE PROFILE (guru / siswa / osis / admin) ----------
export interface MyProfileSocial {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

export interface MyProfilePayload {
  id: string;
  role: string;
  status: string;
  must_change_password: boolean;
  name: string;
  email: string;
  phone: string;
  photo: string;
  bio: string;
  address: string;
  social: MyProfileSocial;
  guru?: { nip?: string; nuptk?: string; teacher_id?: string; subject?: string; position?: string; achievements?: string[]; certifications?: string[] } | null;
  osis?: { member_id?: string; nisn?: string; division?: string; position?: string; achievements?: string[]; work_programs?: string[] } | null;
  student?: {
    nisn?: string; nis?: string; class?: string; major?: string; gender?: string;
    date_of_birth?: string; place_of_birth?: string; religion?: string; address?: string; achievements?: string[];
    [key: string]: unknown;
  } | null;
}

export const myProfileApi = {
  show(): ApiResult<MyProfilePayload> {
    return request<MyProfilePayload>('/me');
  },
  updateProfile(payload: Record<string, unknown>): ApiResult<MyProfilePayload> {
    return request<MyProfilePayload>('/me/profile', { method: 'PATCH', body: JSON.stringify(payload) });
  },
  updatePassword(payload: { current_password: string; new_password: string }): ApiResult<{ must_change_password: boolean }> {
    return request<{ must_change_password: boolean }>('/me/password', { method: 'PATCH', body: JSON.stringify(payload) });
  },
};

// ---------- PUBLIC PROFILES ----------
export type PublicProfileType = 'guru' | 'siswa' | 'osis';

export interface PublicProfile {
  role: string;
  slug: string;
  name: string;
  photo: string;
  bio: string;
  email: string;
  phone: string;
  address: string;
  social: MyProfileSocial;
  achievements?: string[];
  certifications?: string[];
  subject?: string;
  position?: string;
  class?: string;
  major?: string;
  nisn?: string;
  member_id?: string;
  division?: string;
  work_programs?: string[];
  works?: { title: string; content: string; cover_image?: string; category_id?: string | null; published_at?: string }[];
}

export interface PublicDirectoryEntry {
  role: 'guru' | 'siswa' | 'osis';
  slug: string;
  name: string;
  photo: string;
  position?: string;
  subject?: string;
  class?: string;
  major?: string;
  division?: string;
}

export interface PublicDirectory {
  gurus: PublicDirectoryEntry[];
  siswa: PublicDirectoryEntry[];
  osis: PublicDirectoryEntry[];
}

export const publicProfileApi = {
  get(type: PublicProfileType, slug: string): ApiResult<PublicProfile> {
    return request<PublicProfile>(`/public/${type}/${encodeURIComponent(slug)}`);
  },
  directory(): ApiResult<PublicDirectory> {
    return request<PublicDirectory>('/public/directory');
  },
};

// ---------- BKK / JOB VACANCIES ----------
export type JobStatus = 'open' | 'closing' | 'closed';
export type JobEmploymentType = 'full_time' | 'contract' | 'internship';

export interface JobVacancyRow {
  id: string;
  company_name: string;
  company_logo: string;
  position: string;
  slug: string;
  company_description?: string;
  job_description?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  education?: string;
  experience?: string;
  major?: string[];
  city?: string;
  location?: string;
  employment_type: JobEmploymentType;
  registration_link?: string;
  hr_contact?: string;
  deadline?: string | null;
  status: JobStatus;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Dibuka',
  closing: 'Segera Ditutup',
  closed: 'Ditutup',
};

export const JOB_EMPLOYMENT_LABELS: Record<JobEmploymentType, string> = {
  full_time: 'Full Time',
  contract: 'Kontrak',
  internship: 'Magang',
};

export interface JobListMeta {
  total: number;
  page: number;
  limit: number;
  last_page: number;
}

export async function fetchJobVacancies(params?: {
  search?: string;
  major?: string;
  city?: string;
  employment_type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ rows: JobVacancyRow[]; meta: JobListMeta }> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.major) q.set('major', params.major);
  if (params?.city) q.set('city', params.city);
  if (params?.employment_type) q.set('employment_type', params.employment_type);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const suffix = q.size ? `?${q}` : '';
  const result = await request<JobVacancyRow[]>(`/jobs${suffix}`);
  return result.data
    ? { rows: result.data, meta: (result.meta as JobListMeta) ?? { total: 0, page: 1, limit: 9, last_page: 1 } }
    : { rows: [], meta: { total: 0, page: 1, limit: 9, last_page: 1 } };
}

export async function fetchJobVacancyBySlug(slug: string): Promise<JobVacancyRow | null> {
  const result = await request<JobVacancyRow>(`/jobs/${encodeURIComponent(slug)}`);
  return result.data ?? null;
}

export const jobAdminApi = {
  list(params?: { search?: string; status?: string; employment_type?: string; page?: number; limit?: number }): ApiResult<JobVacancyRow[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.employment_type) q.set('employment_type', params.employment_type);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 10));
    const suffix = q.size ? `?${q}` : '';
    return request<JobVacancyRow[]>(`/admin/jobs${suffix}`);
  },
  create(payload: Record<string, unknown>): ApiResult<JobVacancyRow> {
    return request<JobVacancyRow>('/admin/jobs', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id: string, payload: Record<string, unknown>): ApiResult<JobVacancyRow> {
    return request<JobVacancyRow>(`/admin/jobs/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  remove(id: string): ApiResult<null> {
    return request<null>(`/admin/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

// ---------- BKK / BERANDA & KONTAK SETTINGS ----------
export interface BkkBannerContent { title: string; subtitle: string; image: string }
export interface BkkAboutContent { title: string; subtitle: string; paragraphs: string[] }
export interface BkkServiceContent { title: string; description: string }
export interface BkkHomeContent {
  banner: BkkBannerContent;
  about: BkkAboutContent;
  services: BkkServiceContent[];
}

export interface BkkContactContent {
  whatsapp: string;
  whatsapp_link: string;
  email: string;
  location: string;
  hours: string;
}

function contentRecordData<T>(type: string): Promise<T | null> {
  return request<{ data?: T } | T>(`/data/content_records?content_type=${type}&single=1`).then((result) => {
    if (!result.data) return null;
    return (result.data as { data?: T }).data ?? (result.data as T);
  });
}

export async function fetchBkkHomeContent(): Promise<BkkHomeContent | null> {
  return contentRecordData<BkkHomeContent>('bkk_home');
}

export async function fetchBkkContactContent(): Promise<BkkContactContent | null> {
  return contentRecordData<BkkContactContent>('bkk_contact');
}

// ---------- BKK / PARTNER COMPANIES ----------
export interface BkkPartner {
  id: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  logo: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export async function fetchBkkPartners(): Promise<BkkPartner[]> {
  const result = await request<BkkPartner[]>('/bkk/partners');
  return result.data ?? [];
}

export const bkkPartnerAdminApi = {
  list(params?: { search?: string; is_active?: boolean }): ApiResult<BkkPartner[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (typeof params?.is_active === 'boolean') q.set('is_active', params.is_active ? '1' : '0');
    const suffix = q.size ? `?${q}` : '';
    return request<BkkPartner[]>(`/admin/bkk/partners${suffix}`);
  },
  create(payload: Record<string, unknown>): ApiResult<BkkPartner> {
    return request<BkkPartner>('/admin/bkk/partners', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id: string, payload: Record<string, unknown>): ApiResult<BkkPartner> {
    return request<BkkPartner>(`/admin/bkk/partners/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  remove(id: string): ApiResult<null> {
    return request<null>(`/admin/bkk/partners/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

// ---------- KELULUSAN SISWA (ALUMNI GRADUATION) ----------
export type AlumniStatus = 'bekerja' | 'kuliah' | 'wirausaha' | 'belum_bekerja';
export type VerificationStatus = 'menunggu' | 'terverifikasi' | 'ditolak';

export interface AlumniGraduationRow {
  id: string;
  name: string;
  nisn: string;
  major: string;
  graduation_year: number;
  phone: string;
  email: string;
  domicile: string;
  status: AlumniStatus;
  status_detail: Record<string, unknown> | null;
  verification_status: VerificationStatus;
  verification_note: string;
  submitted_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface AlumniGraduationStats {
  total: number;
  filled: number;
  bekerja: number;
  kuliah: number;
  wirausaha: number;
  belum_bekerja: number;
  keterserapan: number;
  avg_wait_time: number;
  job_match_percentage: number;
  by_major: { major: string; total: number; bekerja: number; kuliah: number; wirausaha: number; belum_bekerja: number }[];
  by_year: { year: number; total: number; bekerja: number; kuliah: number; wirausaha: number; belum_bekerja: number; keterserapan: number }[];
}

export const ALUMNI_STATUS_LABELS: Record<AlumniStatus, string> = {
  bekerja: 'Bekerja',
  kuliah: 'Kuliah',
  wirausaha: 'Wirausaha',
  belum_bekerja: 'Belum Bekerja',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  menunggu: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
};

export const kelulusanAdminApi = {
  list(params?: { search?: string; graduation_year?: number; major?: string; status?: string; verification_status?: string; page?: number; limit?: number }): ApiResult<AlumniGraduationRow[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.graduation_year) q.set('graduation_year', String(params.graduation_year));
    if (params?.major) q.set('major', params.major);
    if (params?.status) q.set('status', params.status);
    if (params?.verification_status) q.set('verification_status', params.verification_status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 10));
    const suffix = q.size ? `?${q}` : '';
    return request<AlumniGraduationRow[]>(`/admin/kelulusan${suffix}`);
  },
  get(id: string): ApiResult<AlumniGraduationRow> {
    return request<AlumniGraduationRow>(`/admin/kelulusan/${encodeURIComponent(id)}`);
  },
  stats(params?: { graduation_year?: number; major?: string }): ApiResult<AlumniGraduationStats> {
    const q = new URLSearchParams();
    if (params?.graduation_year) q.set('graduation_year', String(params.graduation_year));
    if (params?.major) q.set('major', params.major);
    const suffix = q.size ? `?${q}` : '';
    return request<AlumniGraduationStats>(`/admin/kelulusan/stats${suffix}`);
  },
  create(payload: Record<string, unknown>): ApiResult<AlumniGraduationRow> {
    return request<AlumniGraduationRow>('/kelulusan', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id: string, payload: Record<string, unknown>): ApiResult<AlumniGraduationRow> {
    return request<AlumniGraduationRow>(`/admin/kelulusan/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id: string): ApiResult<null> {
    return request<null>(`/admin/kelulusan/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  verify(id: string, payload: { verification_status: string; verification_note?: string }): ApiResult<AlumniGraduationRow> {
    return request<AlumniGraduationRow>(`/admin/kelulusan/${encodeURIComponent(id)}/verify`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  exportUrl(params?: { graduation_year?: number; major?: string; status?: string }): string {
    const q = new URLSearchParams();
    if (params?.graduation_year) q.set('graduation_year', String(params.graduation_year));
    if (params?.major) q.set('major', params.major);
    if (params?.status) q.set('status', params.status);
    const suffix = q.size ? `?${q}` : '';
    return `${apiBaseUrl}/admin/kelulusan/export${suffix}`;
  },
};

// ---------- STUDENT DATA SISWA & CHANGE REQUESTS ----------
export type StudentChangeRequestStatus = 'menunggu' | 'disetujui' | 'ditolak' | 'dibatalkan';

export const STUDENT_CHANGE_REQUEST_STATUS_LABELS: Record<StudentChangeRequestStatus, string> = {
  menunggu: 'Menunggu Verifikasi',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

export interface StudentChangeRequestRow {
  id: string;
  student_id: string;
  old_data: Record<string, unknown>;
  proposed_data: Record<string, unknown>;
  status: StudentChangeRequestStatus;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  student?: { id: string; name: string; nisn: string; class: string; major: string };
  verifier?: { id: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentDataPayload {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  class: string;
  major: string;
  gender: string;
  date_of_birth: string;
  place_of_birth: string;
  religion: string;
  address: string;
  foto: string;
  phone: string;
  [key: string]: unknown;
}

export const studentDataApi = {
  myData(): ApiResult<StudentDataPayload> {
    return request<StudentDataPayload>('/student/data-siswa');
  },
  myChangeRequests(): ApiResult<StudentChangeRequestRow[]> {
    return request<StudentChangeRequestRow[]>('/student/data-siswa/change-requests');
  },
  submitChangeRequest(proposedData: Record<string, unknown>): ApiResult<StudentChangeRequestRow> {
    return request<StudentChangeRequestRow>('/student/data-siswa/change-requests', {
      method: 'POST',
      body: JSON.stringify({ proposed_data: proposedData }),
    });
  },
  cancelChangeRequest(id: string): ApiResult<StudentChangeRequestRow> {
    return request<StudentChangeRequestRow>(`/student/data-siswa/change-requests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export const studentChangeRequestAdminApi = {
  list(params?: { status?: string; search?: string }): ApiResult<StudentChangeRequestRow[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const suffix = q.size ? `?${q}` : '';
    return request<StudentChangeRequestRow[]>(`/admin/student-change-requests${suffix}`);
  },
  get(id: string): ApiResult<StudentChangeRequestRow> {
    return request<StudentChangeRequestRow>(`/admin/student-change-requests/${encodeURIComponent(id)}`);
  },
  verify(id: string, payload: { status: 'disetujui' | 'ditolak'; rejection_reason?: string }): ApiResult<StudentChangeRequestRow> {
    return request<StudentChangeRequestRow>(`/admin/student-change-requests/${encodeURIComponent(id)}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
