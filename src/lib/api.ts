import { defaultSpmbContent, type SpmbContent } from '../data/spmb';

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '') + '/api';

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/')) return apiOrigin ? `${apiOrigin}${url}` : url;
  return url;
}

export { apiBaseUrl };

type ApiError = { message?: string; [key: string]: unknown } | null;
type ApiResponse<T> = { data: T | null; error: ApiError; count?: number | null; meta?: unknown };
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
      return { data: null, error: body?.error ?? body ?? { message: 'Permintaan ke server gagal.' } };
    }
    const result = { data: (body?.data ?? body) as T, error: body?.error ?? null, count: body?.count, meta: body?.meta };
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
      };
      const path = paths[name];
      if (!path) return { data: null, error: { message: `RPC ${name} tidak tersedia.` } };
      if (name === 'get_my_permissions') return request(path);
      if (name === 'get_student_login_email') return request(path, { method: 'POST', body: JSON.stringify({ nisn: params.p_nisn }) });
      if (name === 'submit_mading_post' || name === 'publish_mading_post') return request(path, { method: 'POST' });
      if (name === 'review_mading_post') return request(path, { method: 'POST', body: JSON.stringify({ action: params.p_action, feedback: params.p_feedback }) });
      if (name === 'admin_create_student') return request(path, { method: 'POST', body: JSON.stringify(params) });
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
    from(_bucket: string) { return {
      async uploadAuto(file: File) { const form = new FormData(); form.append('file', file); const result = await request<{ url: string }>('/upload', { method: 'POST', body: form }); return { data: result.data ? { url: result.data.url } : null, error: result.error }; },
      async upload(_path: string, file: File) { const form = new FormData(); form.append('file', file); const result = await request('/upload', { method: 'POST', body: form }); return { data: result.data, error: result.error }; },
      async remove(paths: string[]) { return request('/uploads', { method: 'DELETE', body: JSON.stringify({ paths }) }); },
      async createSignedUrl(path: string) { return request<{ url: string }>(`/uploads/url?path=${encodeURIComponent(path)}`); },
    }; },
  },
};

const contentPath: Record<string, string> = { news: 'news', programs: 'programs', facilities: 'facilities', staff: 'staff', achievements: 'achievements', teacherActivities: 'teacher-activities', educationStaff: 'education-staff' };
function normalizeContentRows<T>(type: string, rows: unknown[]): T { return (type === 'programs' ? rows.map((row) => { const program = row as Record<string, unknown>; return { ...program, shortName: program.shortName ?? program.short_name, shortDescription: program.shortDescription ?? program.short_description, careerProspects: program.careerProspects ?? program.career_prospects }; }) : rows) as T; }
export async function fetchPublicContent<T>(type: string, fallback: T): Promise<T> { const path = contentPath[type]; if (!path) return fallback; const result = await request<unknown[]>(`/${path}`); return result.data?.length ? normalizeContentRows<T>(type, result.data) : fallback; }
export async function fetchPublicContentById<T extends { slug?: string }>(type: string, slug: string, fallback: T): Promise<T> { const path = contentPath[type]; if (!path) return fallback; const result = await request<T>(`/${path}/${encodeURIComponent(slug)}`); return result.data ?? fallback; }
function normalizeSpmbContent(row: Record<string, unknown>): SpmbContent { return { id: row.id as string | undefined, status: (row.status as SpmbContent['status']) || defaultSpmbContent.status, title: (row.title as string) || defaultSpmbContent.title, description: (row.description as string) || defaultSpmbContent.description, latest_info: (row.latest_info as string) || defaultSpmbContent.latest_info, requirements: Array.isArray(row.requirements) ? row.requirements as string[] : defaultSpmbContent.requirements, schedule: Array.isArray(row.schedule) ? row.schedule as SpmbContent['schedule'] : defaultSpmbContent.schedule, flow_steps: Array.isArray(row.flow_steps) ? row.flow_steps as SpmbContent['flow_steps'] : defaultSpmbContent.flow_steps, faq: Array.isArray(row.faq) ? row.faq as SpmbContent['faq'] : defaultSpmbContent.faq, portal_url: (row.portal_url as string) || defaultSpmbContent.portal_url, banner_image: (row.banner_image as string) || defaultSpmbContent.banner_image, banner_title: (row.banner_title as string) || defaultSpmbContent.banner_title, banner_description: (row.banner_description as string) || defaultSpmbContent.banner_description, updated_at: row.updated_at as string | undefined }; }
export async function fetchSpmbContent(fallback: SpmbContent = defaultSpmbContent): Promise<SpmbContent> { const result = await request<Record<string, unknown>>('/spmb'); return result.data ? normalizeSpmbContent(result.data) : fallback; }
async function fetchFallback<T>(path: string, fallback: T, nonEmpty = true): Promise<T> { const result = await request<any>(path); return result.data && (!nonEmpty || result.data.length) ? result.data as T : fallback; }
export const fetchOsisProfile = <T>(fallback: T) => fetchFallback('/osis', fallback, false);
export const fetchOsisMembers = <T>(fallback: T) => fetchFallback('/osis/members', fallback);
export const fetchOsisActivities = <T>(fallback: T) => fetchFallback('/osis/activities', fallback);
export const fetchExtracurriculars = <T>(fallback: T) => fetchFallback('/extracurriculars', fallback);
export const fetchExtracurricularBySlug = <T>(slug: string, fallback: T) => fetchFallback(`/extracurriculars/${encodeURIComponent(slug)}`, fallback, false);
export const fetchKesemaptaanProfile = <T>(fallback: T) => fetchFallback('/kesemaptaan', fallback, false);
export const fetchKesemaptaanActivities = <T>(fallback: T) => fetchFallback('/kesemaptaan/activities', fallback);
export const fetchKesemaptaanSchedules = <T>(fallback: T) => fetchFallback('/kesemaptaan/schedules', fallback);
export const fetchKesemaptaanInstructors = <T>(fallback: T) => fetchFallback('/kesemaptaan/instructors', fallback);
export const fetchKesemaptaanAchievements = <T>(fallback: T) => fetchFallback('/kesemaptaan/achievements', fallback);
export const fetchMadingCategories = <T>(fallback: T) => fetchFallback('/mading/categories', fallback);
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
export type AccountRole = 'admin' | 'guru' | 'osis' | 'student';

export interface AccountRow {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
  phone?: string;
  nisn?: string;
  class?: string;
  major?: string;
  status?: string;
  must_change_password?: boolean;
  achievements?: string[];
  guru?: { nip?: string; nuptk?: string; teacher_id?: string; subject?: string; position?: string; certifications?: string[] } | null;
  osis?: { member_id?: string; nisn?: string; division?: string; position?: string; work_programs?: string[] } | null;
  created_at?: string;
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
  images_count?: number;
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
  student?: { nisn?: string; class?: string; major?: string; achievements?: string[] } | null;
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
