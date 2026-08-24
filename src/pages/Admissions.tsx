import React, { useEffect, useState } from 'react';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { LoadingInline } from '../components/ui/LoadingScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, Download, ExternalLink, Eye, FileImage, FileText, GraduationCap, Lock, Star, X } from 'lucide-react';
import { fetchSpmbContent, fetchSpmbPosters, resolveImageUrl } from '../lib/api';
import type { SpmbContent, SpmbPoster } from '../lib/content-types';

function RegisterButton({ content }: { content: SpmbContent }) {
  if (content.status === 'dibuka') {
    return (
      <Button as="link" href={content.portal_url} variant="primary" size="lg" className="px-8 py-4">
        <ExternalLink className="mr-2 h-5 w-5" /> DAFTAR SPMB
      </Button>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <span className="inline-flex cursor-not-allowed items-center rounded-xl bg-[#1B2A4A]/20 px-8 py-4 text-lg font-semibold text-[#5B7088]">
        <Lock className="mr-2 h-5 w-5" /> Pendaftaran Ditutup
      </span>
      <p className="max-w-md text-sm text-[#E8DCC7]">
        Pendaftaran SPMB saat ini sedang ditutup. Silakan pantau halaman ini untuk informasi pembukaan berikutnya.
      </p>
    </div>
  );
}

const Admissions: React.FC = () => {
  const [content, setContent] = useState<SpmbContent | null>(null);
  const [posters, setPosters] = useState<SpmbPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [featuredSlide, setFeaturedSlide] = useState(0);

  const PER_PAGE = 6;

  useEffect(() => {
    Promise.all([fetchSpmbContent(), fetchSpmbPosters()])
      .then(([contentData, posterData]) => {
        setContent(contentData);
        setPosters(posterData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [posters.length]);

  useEffect(() => {
    setFeaturedSlide(0);
  }, [posters]);

  const closeLightbox = () => setLightbox(null);

  // Setiap pengumuman bisa memuat beberapa foto: gabungkan semua foto menjadi
  // satu daftar slide agar lightbox bisa menelusurinya secara berurutan.
  const slides = posters.flatMap((poster) => posterImages(poster).map((url, photo) => ({ poster, url, photo })));

  const prevSlide = () => setLightbox((current) => (current === null ? null : (current - 1 + slides.length) % slides.length));
  const nextSlide = () => setLightbox((current) => (current === null ? null : (current + 1) % slides.length));

  const openLightbox = (id: string | undefined, slide = 0) => {
    let offset = 0;
    for (const poster of posters) {
      const count = posterImages(poster).length;
      if (poster.id === id && count > 0) {
        setLightbox(offset + Math.min(Math.max(slide, 0), count - 1));
        return;
      }
      offset += count;
    }
    setLightbox(null);
  };

  const downloadPoster = async (poster: SpmbPoster, imageUrl?: string) => {
    const raw = imageUrl || poster.image;
    const url = resolveImageUrl(raw);
    if (!url) return;
    const ext = (url.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] ?? 'jpg').toLowerCase();
    const slug = (poster.title || 'poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'poster';
    const filename = `pengumuman-spmb-${slug}.${ext}`;

    // For same-origin or proxy-served images, create a temporary <a> with the
    // download attribute so the browser saves the file directly.
    const isSameOrigin = url.startsWith(window.location.origin);
    if (isSameOrigin) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // For cross-origin images, try fetching as blob first. If that fails
    // (CORS, network), fall back to opening the image in a new tab where the
    // user can save it manually.
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, slides.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
        <LoadingInline />
      </div>
    );
  }

  if (!content) return <div className="min-h-screen bg-[#FAF6F0]" />;

  const heroImage = content.banner_image || posters[0]?.image || '';
  const featured = posters.find((p) => p.is_featured) ?? null;
  const featuredImages = featured ? posterImages(featured) : [];
  const featuredIndex = Math.min(featuredSlide, Math.max(0, featuredImages.length - 1));
  const others = featured ? posters.filter((p) => p.id !== featured.id) : posters;
  const totalPages = Math.max(1, Math.ceil(others.length / PER_PAGE));
  const paged = others.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <section className="relative flex min-h-[260px] w-full items-center bg-[#1B2A4A] text-[#FAF6F0] md:min-h-[320px]">
        {heroImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${resolveImageUrl(heroImage)})` }}
            />
            <div className="absolute inset-0 bg-[#1B2A4A]/80 bg-gradient-to-r from-[#1B2A4A]/90 to-[#1B2A4A]/60" />
          </>
        )}
        <div className="container relative z-10 mx-auto px-4 py-10 md:py-16">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#C8A951]/20 px-4 py-1.5 text-sm font-semibold text-[#C8A951]">
            <GraduationCap className="h-4 w-4" /> Portal Informasi SPMB
          </span>
          <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">{content.banner_title || content.title}</h1>
          {(content.banner_description || content.description) && (
            <p className="mb-6 max-w-2xl text-lg text-white/80 md:text-xl">{content.banner_description || content.description}</p>
          )}
          <nav className="flex text-sm text-[#FAF6F0]" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a href="/" className="transition-colors hover:text-[#C8A951]">Beranda</a>
              </li>
              <li className="inline-flex items-center">
                <span className="mx-2 text-white/50">/</span>
                <span className="font-medium text-[#C8A951]">SPMB</span>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* Status SPMB */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#5B7088]">
            <span className={`h-2.5 w-2.5 rounded-full ${content.status === 'dibuka' ? 'bg-green-500' : 'bg-red-500'}`} />
            Pendaftaran {content.status === 'dibuka' ? 'Dibuka' : 'Ditutup'}
          </span>
          {content.status === 'dibuka' && <RegisterButton content={content} />}
        </div>

        {/* Pengumuman SPMB */}
        <section className="mb-16">
          <SectionHeading
            title="Pengumuman SPMB"
            subtitle="Pengumuman resmi SPMB dalam bentuk poster. Klik Lihat Poster untuk memperbesar, atau Download untuk menyimpan."
            align="center"
          />

          {posters.length === 0 ? (
            <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl bg-white p-12 text-center shadow-sm">
              <FileImage className="h-14 w-14 text-[#C8A951]/50" />
              <p className="mt-4 text-lg font-semibold text-[#1B2A4A]">Belum ada pengumuman SPMB</p>
              <p className="mt-2 text-sm text-[#5B7088]">Pengumuman SPMB dalam bentuk poster akan segera tersedia.</p>
            </div>
          ) : (
            <>
              {featured && (
                <div className="mt-10 overflow-hidden rounded-2xl border border-[#C8A951]/50 bg-white shadow-md">
                  <div className="grid items-stretch lg:grid-cols-[1fr_1.05fr]">
                    <div className="relative bg-[#FAF6F0] p-6">
                      <span className="absolute left-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#C8A951] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#1B2A4A]">
                        <Star className="h-3.5 w-3.5 fill-[#1B2A4A]" /> Pengumuman Utama
                      </span>
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-white shadow-inner">
                        {featuredImages[featuredIndex] && (
                          <img
                            src={featuredImages[featuredIndex]}
                            alt={`${featured.title || 'Pengumuman Utama SPMB'} — foto ${featuredIndex + 1}`}
                            className="absolute inset-0 h-full w-full cursor-zoom-in object-contain transition-transform duration-300 hover:scale-[1.03]"
                            onClick={() => openLightbox(featured.id, featuredIndex)}
                          />
                        )}
                        {featuredImages.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setFeaturedSlide((s) => (s - 1 + featuredImages.length) % featuredImages.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
                              aria-label="Foto sebelumnya"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFeaturedSlide((s) => (s + 1) % featuredImages.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
                              aria-label="Foto berikutnya"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                            <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-semibold text-white">
                              {featuredIndex + 1} / {featuredImages.length}
                            </span>
                            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                              {featuredImages.map((_, dot) => (
                                <button
                                  key={dot}
                                  type="button"
                                  onClick={() => setFeaturedSlide(dot)}
                                  aria-label={`Ke foto ${dot + 1}`}
                                  className={`h-2 rounded-full transition-all ${dot === featuredIndex ? 'w-4 bg-[#C8A951]' : 'w-2 bg-white/70 hover:bg-white'}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
                      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#FAF6F0] px-4 py-1.5 text-sm font-semibold text-[#866D2C]">
                        <CalendarDays className="h-4 w-4" /> {formatPosterDate(featured.published_at ?? featured.created_at)}
                      </span>
                      <h3 className="text-2xl font-bold text-[#1B2A4A] md:text-3xl">{featured.title || 'Pengumuman SPMB'}</h3>
                      <p className="max-w-lg text-sm leading-relaxed text-[#5B7088] md:text-base">
                        Pengumuman ini merupakan informasi resmi SPMB yang dikeluarkan oleh sekolah. Informasi lengkap
                        tercantum pada poster. Anda dapat melihat poster dalam ukuran besar atau mengunduhnya untuk dibagikan.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <Button as="button" onClick={() => openLightbox(featured.id)} variant="primary" className="inline-flex items-center gap-2">
                          <Eye className="h-5 w-5" /> Lihat Poster
                        </Button>
                        <Button as="button" onClick={() => void downloadPoster(featured)} variant="outline" className="inline-flex items-center gap-2">
                          <Download className="h-5 w-5" /> Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <>
                  <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {paged.map((poster) => (
                      <SpmbPosterCard
                        key={poster.id}
                        poster={poster}
                        onViewSlide={(slide) => openLightbox(poster.id, slide)}
                        onDownload={() => void downloadPoster(poster)}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Halaman sebelumnya"
                        className="inline-flex items-center gap-1 rounded-lg border-2 border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1B2A4A] transition-colors hover:bg-[#1B2A4A]/5 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" /> Sebelumnya
                      </button>
                      <span className="text-sm font-semibold text-[#5B7088]">Halaman {page} / {totalPages}</span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Halaman berikutnya"
                        className="inline-flex items-center gap-1 rounded-lg border-2 border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1B2A4A] transition-colors hover:bg-[#1B2A4A]/5 disabled:opacity-40"
                      >
                        Berikutnya <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Lampiran PDF */}
        {(() => {
          const allPdfs = [...new Set([content.pdf_attachment, ...(content.pdf_attachments ?? [])].filter(Boolean) as string[])];
          if (allPdfs.length === 0) return null;
          const pdfName = (url: string) => url.split('/').pop()?.replace(/^[^_]+-[^_]+-\d+-\d+-/, '') || url.split('/').pop() || 'file.pdf';
          return (
            <section className="mb-16">
              <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#C8A951]/30 bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#C8A951]/15">
                    <FileText className="h-8 w-8 text-[#866D2C]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1B2A4A]">Lampiran Dokumen</h3>
                  <p className="mt-2 max-w-md text-sm text-[#5B7088]">
                    Unduh dokumen lampiran untuk informasi lengkap terkait SPMB.
                  </p>
                </div>
                <ul className="mt-6 space-y-2">
                  {allPdfs.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0] px-4 py-3 text-left transition-colors hover:bg-[#1B2A4A]/5"
                      >
                        <FileText className="h-5 w-5 shrink-0 text-[#866D2C]" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1B2A4A]">{pdfName(url)}</span>
                        <Download className="h-4 w-4 shrink-0 text-[#5B7088]" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })()}

        {/* CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-[#1B2A4A] text-center text-white">
          {heroImage && resolveImageUrl(heroImage) && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${resolveImageUrl(heroImage)})` }}
              />
              <div className="absolute inset-0 bg-[#1B2A4A]/80 bg-gradient-to-r from-[#1B2A4A]/90 to-[#1B2A4A]/60" />
            </>
          )}
          <div className="relative z-10 p-12">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-[#C8A951]" />
            <h2 className="mb-4 text-3xl font-bold">Siap Bergabung Bersama Kami?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-[#E8DCC7]">
              Daftar melalui portal resmi SPMB Provinsi Banten. Website sekolah hanya menyediakan informasi dan
              pengarahan — seluruh proses pendaftaran dilakukan di portal pemerintah.
            </p>
            <RegisterButton content={content} />
            {content.status === 'dibuka' && (
              <p className="mt-4 text-sm text-[#E8DCC7]">
                Anda akan diarahkan ke{' '}
                <a
                  href={content.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#C8A951] hover:underline"
                >
                  portal resmi SPMB Banten
                </a>
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && slides[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Tutup"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-6"
              aria-label="Poster sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-6"
              aria-label="Poster berikutnya"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); void downloadPoster(slides[lightbox].poster, slides[lightbox].url); }}
              className="absolute right-4 top-16 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Download poster"
            >
              <Download className="h-4 w-4" /> Download
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
                src={slides[lightbox].url}
                alt={`${slides[lightbox].poster.title || 'Pengumuman SPMB'} — foto ${(slides[lightbox].photo ?? lightbox) + 1}`}
                className="mx-auto max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-white/80">
                <span>
                  {slides[lightbox].poster.title || `Pengumuman SPMB`}
                  {formatPosterDate(slides[lightbox].poster.published_at ?? slides[lightbox].poster.created_at) && (
                    <span className="ml-3 inline-flex items-center gap-1 text-white/60">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatPosterDate(slides[lightbox].poster.published_at ?? slides[lightbox].poster.created_at)}
                    </span>
                  )}
                </span>
                <span>{lightbox + 1} / {slides.length}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function posterImages(poster: SpmbPoster): string[] {
  const urls: string[] = [];
  for (const src of [poster.image, ...(poster.images ?? [])]) {
    const url = resolveImageUrl(src ?? '');
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

function SpmbPosterCard({ poster, onViewSlide, onDownload }: { poster: SpmbPoster; onViewSlide: (slide: number) => void; onDownload: () => void }) {
  const images = posterImages(poster);
  const total = images.length;
  const [slide, setSlide] = useState(0);
  const index = Math.min(slide, Math.max(0, total - 1));
  const dateText = formatPosterDate(poster.published_at ?? poster.created_at);
  return (
    <div className="group overflow-hidden rounded-2xl bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#FAF6F0]">
        {total > 0 ? (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={index}
              src={images[index]}
              alt={`${poster.title || 'Pengumuman SPMB'} — foto ${index + 1}`}
              loading="lazy"
              onClick={() => onViewSlide(index)}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (total < 2) return;
                if (info.offset.x <= -48) setSlide((s) => (s + 1) % total);
                else if (info.offset.x >= 48) setSlide((s) => (s - 1 + total) % total);
              }}
              className="absolute inset-0 h-full w-full cursor-zoom-in object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </AnimatePresence>
        ) : (
          <div className="grid h-full place-items-center text-[#C8A951]/50"><FileImage className="h-10 w-10" /></div>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => setSlide((s) => (s - 1 + total) % total)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSlide((s) => (s + 1) % total)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
              aria-label="Foto berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">
              {index + 1}/{total}
            </span>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, dot) => (
                <button
                  key={dot}
                  type="button"
                  onClick={() => setSlide(dot)}
                  aria-label={`Ke foto ${dot + 1}`}
                  className={`h-2 rounded-full transition-all ${dot === index ? 'w-4 bg-[#C8A951]' : 'w-2 bg-white/70 hover:bg-white'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-3">
        <h3 className="truncate text-sm font-semibold text-[#1B2A4A]">{poster.title || 'Pengumuman SPMB'}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5B7088]">
          {dateText && <><CalendarDays className="h-3.5 w-3.5" /> {dateText}</>}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onViewSlide(index)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1B2A4A] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#15203a]"
          >
            <Eye className="h-4 w-4" /> Lihat Poster
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-[#1B2A4A]/20 px-3 py-2 text-xs font-semibold text-[#1B2A4A] transition-colors hover:bg-[#1B2A4A]/5"
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPosterDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default Admissions;
