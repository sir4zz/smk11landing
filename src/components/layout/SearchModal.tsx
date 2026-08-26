import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Search, Loader2, Newspaper, GraduationCap, Users, Images,
  Megaphone, Briefcase, FileText, LayoutGrid, CornerDownLeft,
} from 'lucide-react';
import {
  fetchPublicContent, fetchExtracurriculars, fetchGalleries,
  fetchMadingPublished, fetchJobVacancies,
} from '../../lib/api';
import type { NewsItem, Program } from '../../lib/content-types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  path: string;
  type: string;
}

const STATIC_PAGES: SearchResult[] = [
  { id: 'page-home', title: 'Beranda', path: '/', type: 'Halaman' },
  { id: 'page-sejarah', title: 'Sejarah Sekolah', path: '/profil/sejarah', type: 'Halaman' },
  { id: 'page-visi-misi', title: 'Visi & Misi', path: '/profil/visi-misi', type: 'Halaman' },
  { id: 'page-struktur', title: 'Struktur Organisasi', path: '/profil/struktur-organisasi', type: 'Halaman' },
  { id: 'page-direktori', title: 'Direktori Guru & Tendik', path: '/profil/direktori', type: 'Halaman' },
  { id: 'page-program', title: 'Program Keahlian', path: '/akademik/program-keahlian', type: 'Halaman' },
  { id: 'page-fasilitas', title: 'Fasilitas Sekolah', path: '/akademik/fasilitas', type: 'Halaman' },
  { id: 'page-prestasi', title: 'Prestasi Siswa', path: '/kesiswaan/prestasi', type: 'Halaman' },
  { id: 'page-ekskul', title: 'Ekstrakurikuler', path: '/kesiswaan/ekstrakurikuler', type: 'Halaman' },
  { id: 'page-berita', title: 'Berita & Informasi', path: '/informasi/berita', type: 'Halaman' },
  { id: 'page-faq', title: 'FAQ / Pertanyaan Umum', path: '/informasi/faq', type: 'Halaman' },
  { id: 'page-spmb', title: 'SPMB / PPDB', path: '/spmb', type: 'Halaman' },
  { id: 'page-osis', title: 'OSIS', path: '/osis', type: 'Halaman' },
  { id: 'page-mading', title: 'Mading Siswa', path: '/mading', type: 'Halaman' },
  { id: 'page-galeri', title: 'Galeri Kegiatan', path: '/galeri', type: 'Halaman' },
  { id: 'page-manajemen', title: 'Manajemen Sekolah', path: '/manajemen', type: 'Halaman' },
  { id: 'page-bkk', title: 'BKK (Bursa Kerja Khusus)', path: '/bkk', type: 'Halaman' },
  { id: 'page-lowongan', title: 'Lowongan Kerja', path: '/bkk/lowongan', type: 'Halaman' },
  { id: 'page-kontak', title: 'Kontak', path: '/kontak', type: 'Halaman' },
];

const TYPE_ORDER = ['Berita', 'Program Keahlian', 'Ekstrakurikuler', 'Galeri', 'Mading', 'Lowongan Kerja', 'Halaman'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Berita': <Newspaper size={16} className="text-[#C8A951]" />,
  'Program Keahlian': <GraduationCap size={16} className="text-[#C8A951]" />,
  'Ekstrakurikuler': <Users size={16} className="text-[#C8A951]" />,
  'Galeri': <Images size={16} className="text-[#C8A951]" />,
  'Mading': <Megaphone size={16} className="text-[#C8A951]" />,
  'Lowongan Kerja': <Briefcase size={16} className="text-[#C8A951]" />,
  'Halaman': <FileText size={16} className="text-[#C8A951]" />,
};

const POPULAR_PAGES = ['page-spmb', 'page-berita', 'page-program', 'page-lowongan', 'page-kontak'];

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dynamicResults, setDynamicResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadContent = useCallback(async () => {
    if (loadedRef.current) return;
    setLoading(true);
    const results: SearchResult[] = [];
    const push = (type: string, items: SearchResult[]) => {
      items.forEach((item) => results.push({ ...item, type }));
    };

    const [news, programs, extracurriculars, galleries, mading, jobs] = await Promise.all([
      fetchPublicContent<NewsItem[]>('news').catch(() => [] as NewsItem[]),
      fetchPublicContent<Program[]>('programs').catch(() => [] as Program[]),
      fetchExtracurriculars<{ id?: string; name: string; slug?: string; short_description?: string; description?: string }[]>().catch(() => []),
      fetchGalleries({ limit: 100 }).catch(() => ({ rows: [], meta: { total: 0, page: 1, limit: 0, last_page: 1 } })),
      fetchMadingPublished().catch(() => []),
      fetchJobVacancies({ limit: 100 }).catch(() => ({ rows: [], meta: { total: 0, page: 1, limit: 0, last_page: 1 } })),
    ]);

    push('Berita', news.map((n) => ({
      id: `news-${n.id}`,
      title: n.title,
      description: n.excerpt,
      path: `/informasi/berita/${n.slug}`,
      type: '',
    })));
    push('Program Keahlian', programs.map((p) => ({
      id: `program-${p.id}`,
      title: p.name,
      description: p.shortDescription || p.description,
      path: `/akademik/program/${p.slug}`,
      type: '',
    })));
    push('Ekstrakurikuler', extracurriculars.filter((e) => e.slug || e.id).map((e) => ({
      id: `ekskul-${e.slug ?? e.id}`,
      title: e.name,
      description: e.short_description || e.description,
      path: `/osis/ekstrakurikuler/${e.slug ?? e.id}`,
      type: '',
    })));
    push('Galeri', galleries.rows.filter((g) => g.is_published !== false).map((g) => ({
      id: `galeri-${g.id}`,
      title: g.title,
      description: g.description,
      path: `/galeri/${g.slug}`,
      type: '',
    })));
    push('Mading', mading.map((m) => ({
      id: `mading-${m.id}`,
      title: m.title ?? 'Tanpa Judul',
      description: typeof m.content === 'string' ? m.content.slice(0, 120) : undefined,
      path: `/mading/${m.id}`,
      type: '',
    })));
    push('Lowongan Kerja', jobs.rows.map((j) => ({
      id: `job-${j.id}`,
      title: `${j.position} — ${j.company_name}`,
      description: j.city || j.location,
      path: `/bkk/lowongan/${j.slug}`,
      type: '',
    })));

    const total = news.length + programs.length + extracurriculars.length
      + galleries.rows.length + mading.length + jobs.rows.length;
    if (total > 0) loadedRef.current = true;
    setDynamicResults(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadContent();
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    setQuery('');
  }, [isOpen, loadContent]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const allResults = useMemo(
    () => [...STATIC_PAGES, ...dynamicResults],
    [dynamicResults],
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const groups = new Map<string, SearchResult[]>();
    for (const item of allResults) {
      const haystack = `${item.title} ${item.description ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) continue;
      const list = groups.get(item.type) ?? [];
      if (list.length < 5) list.push(item);
      groups.set(item.type, list);
    }
    return TYPE_ORDER
      .filter((type) => groups.has(type))
      .map((type) => ({ type, items: groups.get(type)! }));
  }, [query, allResults]);

  const totalResults = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups],
  );

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && totalResults > 0) {
      goTo(filteredGroups[0].items[0].path);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-24 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#1B2A4A] p-4 text-white">
          <h2 className="text-lg font-semibold">Pencarian</h2>
          <button onClick={onClose} className="transition-colors hover:text-[#C8A951]" aria-label="Tutup">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari berita, program, ekstrakurikuler..."
              className="w-full rounded border border-gray-300 py-3 pl-10 pr-4 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>

          <div className="mt-4 max-h-[50vh] overflow-y-auto">
            {!query.trim() ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#23314D]/50">Halaman Populer</p>
                <div className="flex flex-wrap gap-2">
                  {STATIC_PAGES.filter((p) => POPULAR_PAGES.includes(p.id)).map((page) => (
                    <button
                      key={page.id}
                      onClick={() => goTo(page.path)}
                      className="flex items-center gap-2 rounded-full border border-[#1B2A4A]/20 px-4 py-2 text-sm font-medium text-[#1B2A4A] transition-all hover:border-[#C8A951] hover:bg-[#FAF6F0]"
                    >
                      <LayoutGrid size={14} className="text-[#C8A951]" />
                      {page.title}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#23314D]/60">
                  {loading ? 'Memuat indeks pencarian...' : 'Ketik untuk mencari di seluruh konten situs: berita, program keahlian, ekstrakurikuler, galeri, mading, dan lowongan kerja.'}
                </p>
              </div>
            ) : filteredGroups.length === 0 ? (
              loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#23314D]/70">
                  <Loader2 size={18} className="animate-spin text-[#C8A951]" />
                  Mencari...
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Search size={40} className="mx-auto text-[#C8A951]/40" />
                  <p className="mt-3 font-medium text-[#23314D]">Tidak ada hasil untuk "{query}"</p>
                  <p className="mt-1 text-sm text-[#23314D]/60">Coba kata kunci lain yang lebih umum.</p>
                </div>
              )
            ) : (
              <div className="space-y-5">
                {filteredGroups.map((group) => (
                  <div key={group.type}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#23314D]/50">{group.type}</p>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => goTo(item.path)}
                            className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[#FAF6F0]"
                          >
                            <span className="mt-0.5 shrink-0">{TYPE_ICONS[item.type] ?? <FileText size={16} className="text-[#C8A951]" />}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-[#1B2A4A]">{item.title}</span>
                              {item.description && (
                                <span className="mt-0.5 block truncate text-xs text-[#23314D]/70">{item.description}</span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {totalResults > 0 && (
                  <p className="flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-[#23314D]/50">
                    Tekan <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px]"><CornerDownLeft size={10} className="inline" /></kbd> untuk membuka hasil teratas
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
