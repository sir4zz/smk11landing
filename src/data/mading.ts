export interface MadingCategory {
  id?: string;
  slug: string;
  name: string;
  sort_order: number;
}

export const MADING_STATUSES = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
} as const;

export type MadingPostStatus = keyof typeof MADING_STATUSES;

export interface MadingPost {
  id?: string;
  title: string;
  content: string;
  category_id?: string | null;
  category?: string;
  author_id?: string | null;
  author_name: string;
  author_role: string;
  cover_image: string;
  status: MadingPostStatus;
  feedback: string;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const defaultMadingCategories: MadingCategory[] = [
  { slug: 'puisi', name: 'Puisi', sort_order: 1 },
  { slug: 'cerpen', name: 'Cerpen', sort_order: 2 },
  { slug: 'artikel', name: 'Artikel', sort_order: 3 },
  { slug: 'pantun', name: 'Pantun', sort_order: 4 },
  { slug: 'esai', name: 'Esai', sort_order: 5 },
  { slug: 'opini', name: 'Opini', sort_order: 6 },
  { slug: 'edukasi', name: 'Edukasi', sort_order: 7 },
  { slug: 'teknologi', name: 'Teknologi', sort_order: 8 },
  { slug: 'motivasi', name: 'Motivasi', sort_order: 9 },
  { slug: 'karya-kreatif', name: 'Karya Kreatif', sort_order: 10 },
  { slug: 'lainnya', name: 'Lainnya', sort_order: 11 },
];

export const defaultMadingPosts: MadingPost[] = [
  {
    id: 'mp1',
    title: 'Menjaga Semangat Belajar di Tengah Kesibukan',
    content:
      'Di tengah banyaknya kegiatan sekolah, penting bagi kita untuk tetap menjaga semangat belajar. Manajemen waktu yang baik, istirahat yang cukup, dan lingkungan yang mendukung adalah kunci agar tetap produktif dan tidak kehilangan motivasi.',
    category: 'Motivasi',
    category_id: 'motivasi',
    author_name: 'Redaksi Mading',
    author_role: 'siswa',
    cover_image: '',
    status: 'published',
    feedback: '',
    published_at: '2026-07-01T00:00:00.000Z',
    created_at: '2026-06-28T10:00:00.000Z',
  },
  {
    id: 'mp2',
    title: 'Puisi: Senyum Hangus Rindu',
    content:
      'Di balik jendela yang kau tinggal,\nada senyum yang malam ini ku simpan.\nHingga hari-hari ini semakin panjang,\nkasih tak pernah kehilangan peta hatimu.',
    category: 'Puisi',
    category_id: 'puisi',
    author_name: 'Siswa Kelas X',
    author_role: 'siswa',
    cover_image: '',
    status: 'published',
    feedback: '',
    published_at: '2026-06-20T00:00:00.000Z',
    created_at: '2026-06-18T09:00:00.000Z',
  },
];