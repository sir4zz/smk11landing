import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHero from '../../components/ui/PageHero';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { usePageBanner } from '../../lib/usePageBanner';
import { fetchMadingPostById, resolveImageUrl, youtubeEmbedUrl, type MadingPostRow } from '../../lib/api';
import { AiNote } from '../../components/mading/AIContentAssistant';
import { ArrowLeft, Calendar, User, Share2, ChevronLeft, ChevronRight, X, Clapperboard, Play, ImageIcon } from 'lucide-react';

function categoryName(row: MadingPostRow): string {
  const rel = row['category'] as { name?: string } | null | undefined;
  if (rel?.name) return rel.name;
  const legacy = row['mading_categories'] as { name?: string } | null | undefined;
  return legacy?.name ?? 'Lainnya';
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const MadingDetail: React.FC = () => {
  const { backgroundImage } = usePageBanner('mading_detail');
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<MadingPostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    fetchMadingPostById(id ?? '')
      .then((row) => {
        if (!active) return;
        if (!row) setNotFound(true);
        else setPost(row);
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const images = (post ? (Array.isArray(post.images) ? post.images : []) : []).map(resolveImageUrl).filter((u): u is string => Boolean(u));
  const videos = (post ? (Array.isArray(post.videos) ? post.videos : []) : []).map((v) => ({ ...v, embed: youtubeEmbedUrl(v.url ?? '') })).filter((v) => v.url);
  const embeddable = videos.filter((v) => v.embed);
  const linkOnly = videos.filter((v) => !v.embed);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage = useCallback(() => setLightbox((current) => (current === null ? null : (current - 1 + images.length) % images.length)), [images.length]);
  const nextImage = useCallback(() => setLightbox((current) => (current === null ? null : (current + 1) % images.length)), [images.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, closeLightbox, prevImage, nextImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Mading" subtitle="Media Aspirasi Digital SMKN 11 Kabupaten Tangerang" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading', href: '/mading' }]} backgroundImage={backgroundImage} />
        <SkeletonDetail />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Mading" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading', href: '/mading' }]} backgroundImage={backgroundImage} />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1B2A4A]">Karya tidak ditemukan</h2>
          <p className="mt-2 text-[#5B7088]">Karya mungkin telah dihapus atau tidak dipublikasikan.</p>
          <Link to="/mading" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-3 font-bold text-white transition-colors hover:bg-[#15203a]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Mading
          </Link>
        </div>
      </div>
    );
  }

  const category = categoryName(post);
  const dateLabel = formatDate(post.published_at);
  const cover = resolveImageUrl(post.cover_image);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Mading SMKN 11 Kabupaten Tangerang"
        subtitle="Tempat publikasi karya, aspirasi, dan informasi siswa & guru"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading', href: '/mading' }, { label: post.title ?? 'Karya' }]}
        backgroundImage={backgroundImage}
      />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
        <span className="mb-4 inline-block w-fit rounded-full bg-[#FAF6F0] px-4 py-1.5 text-xs font-semibold text-[#866D2C] ring-1 ring-[#C8A951]/30">{category}</span>
        <h1 className="text-2xl font-bold leading-snug text-[#1B2A4A] md:text-4xl">{post.title}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[#5B7088]">
          <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-[#C8A951]" /> {post.author_name || 'Anonim'}</span>
          {dateLabel && (
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-[#C8A951]" /> {dateLabel}</span>
          )}
          {post.ai_assisted && <AiNote />}
        </div>

        {cover && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#1B2A4A]/10 shadow-sm">
            <img src={cover} alt={post.title} className="h-auto w-full object-cover" />
          </div>
        )}

        <div className="mt-8 whitespace-pre-wrap break-words text-base leading-8 text-[#23314D] md:text-lg">
          {post.content || 'Tidak ada isi karya.'}
        </div>

        {images.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><ImageIcon className="h-5 w-5 text-[#C8A951]" /> Galeri Foto</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setLightbox(index)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-[#1B2A4A]/10 bg-white shadow-sm"
                >
                  <img src={img} alt={`Foto ${index + 1} ${post.title}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          </section>
        )}

        {embeddable.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><Clapperboard className="h-5 w-5 text-red-600" /> Video</h2>
            <div className={`${embeddable.length > 1 ? 'grid gap-4 md:grid-cols-2' : ''} space-y-4 md:space-y-0`}>
              {embeddable.map((video, index) => (
                <div key={`${video.url}-${index}`} className="overflow-hidden rounded-xl border border-[#1B2A4A]/10 bg-white p-2 shadow-sm md:p-3">
                  {video.title && <p className="mb-2 truncate px-1 text-sm font-semibold text-[#1B2A4A]">{video.title}</p>}
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={video.embed}
                      title={video.title || `Video ${post.title} ${index + 1}`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="absolute inset-0 h-full w-full rounded-lg border-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {linkOnly.length > 0 && (
          <section className="mt-8 space-y-2">
            {linkOnly.map((video, index) => (
              <a key={`${video.url}-${index}`} href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-[#1B2A4A]/10 bg-white px-4 py-3 text-sm font-semibold text-[#1B2A4A] transition-colors hover:bg-[#FAF6F0]">
                <Play className="h-5 w-5 shrink-0 text-[#C8A951]" />
                <span className="truncate">{video.title || video.url}</span>
              </a>
            ))}
          </section>
        )}

        <div className="mt-12 flex flex-col gap-4 border-t border-[#1B2A4A]/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/mading" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-3 font-bold text-white transition-colors hover:bg-[#15203a]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Mading
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).catch(() => {});
              alert('Link karya telah disalin!');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1B2A4A]/20 bg-white px-4 py-3 text-sm font-semibold text-[#1B2A4A] transition-colors hover:bg-[#FAF6F0]"
          >
            <Share2 className="h-4 w-4" /> Bagikan
          </button>
        </div>
      </article>

      <AnimatePresence>
        {lightbox !== null && images[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20" aria-label="Tutup">
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-6"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-6"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <motion.figure
              key={lightbox}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="max-h-[90vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={images[lightbox]} alt={`Foto ${lightbox + 1} ${post.title}`} className="mx-auto max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl" />
              <figcaption className="mt-3 flex items-center justify-between text-sm text-white/80">
                <span>{lightbox + 1} / {images.length}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MadingDetail;
