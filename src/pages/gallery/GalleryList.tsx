import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Image as ImageIcon, MapPin, Images, Play } from 'lucide-react';
import PageHero from '../../components/ui/PageHero';
import { fetchGalleries, fetchGalleryCategories, resolveImageUrl, GALLERY_CATEGORIES, type GalleryRow, type GalleryMeta } from '../../lib/api';

const PAGE_SIZE = 9;

function filterBtn(active: boolean) {
  return `cursor-pointer whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
    active ? 'bg-[#1B2A4A] text-white shadow' : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
  }`;
}

function filterYearBtn(active: boolean) {
  return `cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
    active ? 'bg-[#C8A951] text-[#1B2A4A] shadow' : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
  }`;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[1.25rem] border border-[#1B2A4A]/10 bg-white">
      <div className="aspect-[4/3] w-full bg-[#1B2A4A]/10" />
      <div className="space-y-2 p-5">
        <div className="h-4 w-3/4 rounded bg-[#1B2A4A]/10" />
        <div className="h-3 w-1/2 rounded bg-[#1B2A4A]/10" />
      </div>
    </div>
  );
}

function GalleryCard({ gallery, index }: { gallery: GalleryRow; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
    >
      <Link
        to={`/galeri/${gallery.slug}`}
        className="group relative block aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <img
          src={resolveImageUrl(gallery.cover_image)}
          alt={gallery.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/90 via-[#1B2A4A]/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

        <span className="absolute left-3 top-3 rounded-full bg-[#C8A951]/95 px-3 py-1 text-xs font-semibold text-[#1B2A4A] shadow">
          {gallery.category ?? 'Kegiatan'}
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <Images className="h-3.5 w-3.5" /> {gallery.images_count ?? 0}
        </span>
        {gallery.videos_count && gallery.videos_count > 0 ? (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[#C8A951] px-2.5 py-1 text-xs font-bold text-[#1B2A4A] shadow">
            <Play className="h-3 w-3" /> Video
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-lg font-bold leading-snug text-white drop-shadow">{gallery.title}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-white/85">
            {gallery.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(gallery.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {gallery.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {gallery.location}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function GalleryList() {
  const [galleries, setGalleries] = useState<GalleryRow[]>([]);
  const [meta, setMeta] = useState<GalleryMeta>({ total: 0, page: 1, limit: PAGE_SIZE, last_page: 1 });
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const loadRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (page: number, append: boolean) => {
    const { rows, meta: m } = await fetchGalleries({ year: year || undefined, category: category || undefined, page, limit: PAGE_SIZE });
    setMeta(m);
    if (append) {
      setGalleries((prev) => {
        const ids = new Set(prev.map((g) => g.id));
        return [...prev, ...rows.filter((r) => !ids.has(r.id))];
      });
    } else {
      setGalleries(rows);
    }
  }, [year, category]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    Promise.all([
      fetchGalleries({ year: year || undefined, category: category || undefined, page: 1, limit: PAGE_SIZE }),
      fetchGalleryCategories(),
    ])
      .then(([{ rows, meta: m }, cats]) => {
        if (!active) return;
        setGalleries(rows);
        setMeta(m);
        if (cats.length) setCategories(cats);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [year, category]);

  useEffect(() => {
    const el = loadRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !loadingMore && meta.page < meta.last_page) {
        setLoadingMore(true);
        load(meta.page + 1, true).finally(() => setLoadingMore(false));
      }
    }, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, loadingMore, meta, load]);

  const years = Array.from(new Set(galleries.map((g) => (g.event_date ? new Date(g.event_date).getFullYear() : null)).filter(Boolean))) as number[];
  years.sort((a, b) => b - a);

  const categoryOptions = Array.from(new Set([...GALLERY_CATEGORIES, ...categories]));

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Galeri Kegiatan"
        subtitle="Dokumentasi kegiatan dan momen berharga di SMKN 11 Kabupaten Tangerang."
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Galeri' }]}
        backgroundImage="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
        <div className="mb-10 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <button className={filterBtn(category === '')} onClick={() => setCategory('')}>Semua</button>
            {categoryOptions.map((c) => (
              <button key={c} className={filterBtn(category === c)} onClick={() => setCategory(category === c ? '' : c)}>{c}</button>
            ))}
          </div>
          {years.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-xs font-semibold uppercase tracking-wider text-[#5B7088]">Tahun:</span>
              {years.map((y) => (
                <button key={y} className={filterYearBtn(year === String(y))} onClick={() => setYear(year === String(y) ? '' : String(y))}>{y}</button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="grid place-items-center rounded-[1.25rem] bg-white py-20 text-center">
            <p className="text-[#5B7088]">Gagal memuat galeri. Silakan muat ulang halaman.</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="grid place-items-center rounded-[1.25rem] bg-white py-24 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#FAF6F0] text-[#866D2C]">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-[#1B2A4A]">Belum ada galeri</h3>
            <p className="mt-2 max-w-md text-sm text-[#5B7088]">
              Belum ada dokumentasi {category ? category.toLowerCase() : ''}{category && year ? ' • ' : ''}{year ? `tahun ${year}` : ''} yang dipublikasikan.
            </p>
            {(category || year) && (
              <button onClick={() => { setCategory(''); setYear(''); }} className="mt-6 rounded-lg bg-[#1B2A4A] px-5 py-2 text-sm font-bold text-white hover:bg-[#15203a]">
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {galleries.map((g, i) => <GalleryCard key={g.id} gallery={g} index={i} />)}
            </motion.div>
            {meta.page < meta.last_page && (
              <div ref={loadRef} className="grid place-items-center py-10">
                {loadingMore && <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#C8A951] border-t-transparent" />}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}