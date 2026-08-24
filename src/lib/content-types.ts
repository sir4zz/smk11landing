export interface Program {
  id: string;
  name: string;
  slug: string;
  shortName?: string;
  icon?: string;
  logo?: string;
  image?: string;
  description?: string;
  shortDescription?: string;
  competencies?: string[];
  careerProspects?: string[];
  facilities?: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  category: string;
  author: string;
  source_type?: 'manual' | 'imported';
  source_label?: string;
  source_note?: string;
  source_url?: string;
}

export const isImportedNews = (item: Pick<NewsItem, 'source_type' | 'source_url'>): boolean =>
  item.source_type === 'imported' || Boolean(item.source_url);

export interface Facility { id: string; name: string; description: string; category: string; photo: string }
export interface Staff { id: string; name: string; position: string; department: string; photo: string; description?: string }
export interface EducationStaff { id: string; name: string; position: string; department: string; photo: string }
export interface TeacherActivity { id: string; title: string; date: string; category: string; description: string; photo: string }
export interface Achievement { id: string; title: string; event: string; year: number; level: string; rank: string; students: string[]; photo: string }

export interface OsisProfile { id?: string; name: string; description: string; period: string; logo: string }
export interface OsisMember { id?: string; osis_id?: string; name: string; position: string; division: string; photo: string; sort_order: number }
export interface OsisActivity { id?: string; title: string; description: string; photo: string; activity_date?: string | null; status: string }

export interface MadingCategory { id?: string; slug: string; name: string; sort_order: number }
export type MadingPostStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
export interface MadingVideo { url: string; title?: string }
export interface MadingPost { id?: string; title: string; content: string; category_id?: string | null; category?: string; author_id?: string | null; author_name: string; author_role: string; cover_image: string; images?: string[]; videos?: MadingVideo[]; status: MadingPostStatus; feedback: string; ai_assisted?: boolean; published_at?: string | null; created_at?: string; updated_at?: string }

export type SpmbStatus = 'dibuka' | 'ditutup';
export interface SpmbScheduleItem { category: 'pendaftaran' | 'seleksi' | 'pengumuman' | 'daftar_ulang'; date: string; title: string }
export interface SpmbFlowStep { title: string; description: string }
export interface SpmbFaqItem { question: string; answer: string }
export interface SpmbContent {
  id?: string; status: SpmbStatus; title: string; description: string; latest_info: string;
  requirements: string[]; schedule: SpmbScheduleItem[]; flow_steps: SpmbFlowStep[]; faq: SpmbFaqItem[];
  portal_url: string; banner_image: string; banner_title: string; banner_description: string; pdf_attachment?: string | null; pdf_attachments?: string[] | null; updated_at?: string;
}
export interface SpmbPoster {
  id?: string; title: string; image: string; images?: string[] | null; is_active: boolean; sort_order: number;
  published_at?: string | null; is_featured?: boolean; created_by?: string | null; creator_name?: string | null;
  created_at?: string; updated_at?: string;
}

export interface PageBanner {
  id?: string;
  page_key: string;
  title: string;
  subtitle: string;
  image: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
