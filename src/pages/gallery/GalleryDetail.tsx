import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight, Images, MapPin, Play, X } from 'lucide-react';
import PageHero from '../../components/ui/PageHero';
import { fetchGalleryBySlug, resolveImageUrl, youtubeEmbedUrl, type GalleryRow } from '../../lib/api';

export default function GalleryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [gallery, setGallery] = useState<GalleryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    fetchGalleryBySlug(slug ?? '')
      .then((row) => {
        if (!active) return;
        if (!row) setNotFound(true);
        else setGallery(row);
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const images = gallery?.images ?? [];
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const prevImage = useCallback(() => {
    setLightbox((current) => (current === null ? null : (current - 1 + images.length) % images.length));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setLightbox((current) => (current === null ? null : (current + 1) % images.length));
  }, [images.length]);

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
        <PageHero title="Album Galeri" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Galeri', href: '/galeri' }]} />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl animate-pulse space-y-4 text-center">
            <div className="mx-auto h-8 w-1/2 rounded bg-[#1B2A4A]/10" />
            <div className="mx-auto h-4 w-2/3 rounded bg-[#1B2A4A]/10" />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-[1.25rem] bg-[#1B2A4A]/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !gallery) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Album Galeri" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Galeri', href: '/galeri' }]} />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1B2A4A]">Album tidak ditemukan</h2>
          <p className="mt-2 text-[#5B7088]">Album mungkin telah dihapus atau tidak dipublikasikan.</p>
          <Link to="/galeri" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-3 font-bold text-white hover:bg-[#15203a]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Galeri
          </Link>
        </div>
      </div>
    );
  }

  const dateLabel = gallery.event_date
    ? new Date(gallery.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const videos = (gallery.videos ?? [])
    .map((v) => ({ ...v, embed: youtubeEmbedUrl(v.youtube_url) }))
    .filter((v) => v.embed);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* Hero */}
      <div className="relative isolate overflow-hidden bg-[#1B2A4A]">
        <img
          src={resolveImageUrl(gallery.cover_image)}
          alt={gallery.title}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A] via-[#1B2A4A]/80 to-[#1B2A4A]/50" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/70">
            <Link to="/" className="hover:text-[#C8A951]">Beranda</Link>
            <span>/</span>
            <Link to="/galeri" className="hover:text-[#C8A951]">Galeri</Link>
            <span>/</span>
            <span className="text-[#C8A951]">{gallery.title}</span>
          </nav>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-[#C8A951] px-3 py-1 font-semibold text-[#1B2A4A]">{gallery.category ?? 'Kegiatan'}</span>
              {dateLabel && (
                <span className="flex items-center gap-1.5 text-white/85"><Calendar className="h-4 w-4" /> {dateLabel}</span>
              )}
              {gallery.location && (
                <span className="flex items-center gap-1.5 text-white/85"><MapPin className="h-4 w-4" /> {gallery.location}</span>
              )}
              <span className="flex items-center gap-1.5 text-white/85"><Images className="h-4 w-4" /> {images.length} foto</span>
              {videos.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold text-white backdrop-blur-sm"><Play className="h-3.5 w-3.5" /> {videos.length} video</span>
              )}
            </div>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">{gallery.title}</h1>
            {gallery.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">{gallery.description}</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Video */}
      {videos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className={`${
            videos.length > 1 ? 'grid grid-cols-1 gap-5 md:grid-cols-2' : ''
          }`}>
            {videos.map((video, index) => (
              <div key={video.id} className="overflow-hidden rounded-[1.25rem] bg-white p-2 shadow-sm md:p-3">
                {video.title && (
                  <p className="mb-2 px-2 text-sm font-semibold text-[#1B2A4A]">{video.title}</p>
                )}
                <div className="relative aspect-video w-full">
                  <iframe
                    src={video.embed}
                    title={video.title || `Video ${gallery.title} ${index + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 h-full w-full rounded-2xl border-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Masonry grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
        {images.length === 0 ? (
          <div className="grid place-items-center rounded-[1.25rem] bg-white py-20 text-center">
            <Images className="h-10 w-10 text-[#866D2C]" />
            <p className="mt-3 text-[#5B7088]">Belum ada foto pada album ini.</p>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {images.map((image, index) => (
              <motion.button
                key={image.id ?? `${image.image}-${index}`}
                type="button"
                onClick={() => setLightbox(index)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: (index % 3) * 0.05 }}
                className="group relative mb-5 block w-full overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                <img
                  src={resolveImageUrl(image.image)}
                  alt={image.caption || gallery.title}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#1B2A4A]/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  {image.caption && <p className="text-left text-sm font-medium text-white">{image.caption}</p>}
                  <span className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C8A951] text-[#1B2A4A]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/galeri" className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-3 font-bold text-white transition-colors hover:bg-[#15203a]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Galeri
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && images[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
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
              className="max-h-[90vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={resolveImageUrl(images[lightbox].image)}
                alt={images[lightbox].caption || gallery.title}
                className="mx-auto max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              <figcaption className="mt-3 flex items-center justify-between text-sm text-white/80">
                <span>{images[lightbox].caption || gallery.title}</span>
                <span>{lightbox + 1} / {images.length}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}