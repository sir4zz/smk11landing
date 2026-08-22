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

  const closeLightbox = () => setLightbox(null);
  const prevPoster = () => setLightbox((current) => (current === null ? null : (current - 1 + posters.length) % posters.length));
  const nextPoster = () => setLightbox((current) => (current === null ? null : (current + 1) % posters.length));

  const openLightbox = (id: string | undefined) => {
    const index = posters.findIndex((p) => p.id === id);
    setLightbox(index >= 0 ? index : null);
  };

  const downloadPoster = async (poster: SpmbPoster) => {
    const url = resolveImageUrl(poster.image);
    if (!url) return;
    const ext = (url.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] ?? 'jpg').toLowerCase();
    const slug = (poster.title || 'poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'poster';
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `pengumuman-spmb-${slug}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPoster();
      if (e.key === 'ArrowRight') nextPoster();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, posters.length]);

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
                      <button
                        type="button"
                        onClick={() => openLightbox(featured.id)}
                        className="block w-full"
                        aria-label={`Lihat poster ${featured.title || 'Pengumuman Utama'}`}
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-white shadow-inner">
                          {resolveImageUrl(featured.image) && (
                            <img
                              src={resolveImageUrl(featured.image)!}
                              alt={featured.title || 'Pengumuman Utama SPMB'}
                              className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                            />
                          )}
                        </div>
                      </button>
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
                        onView={() => openLightbox(poster.id)}
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
        {content.pdf_attachment && (
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
                <a
                  href={content.pdf_attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15203a]"
                >
                  <Download className="h-5 w-5" /> Unduh PDF
                </a>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-[#1B2A4A] text-center text-white">
          {heroImage && resolveImageUrl(heroImage) && (
            <>
              <img src={resolveImageUrl(heroImage)!} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0C1527]/60 via-[#1B2A4A]/50 to-[#1B2A4A]/20" />
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
        {lightbox !== null && posters[lightbox] && (
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
              onClick={(e) => { e.stopPropagation(); prevPoster(); }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-6"
              aria-label="Poster sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextPoster(); }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-6"
              aria-label="Poster berikutnya"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); void downloadPoster(posters[lightbox]); }}
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
              {resolveImageUrl(posters[lightbox].image) && (
                <img
                  src={resolveImageUrl(posters[lightbox].image)!}
                  alt={posters[lightbox].title || `Poster SPMB ${lightbox + 1}`}
                  className="mx-auto max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
                />
              )}
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-white/80">
                <span>
                  {posters[lightbox].title || `Poster SPMB`}
                  {formatPosterDate(posters[lightbox].published_at ?? posters[lightbox].created_at) && (
                    <span className="ml-3 inline-flex items-center gap-1 text-white/60">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatPosterDate(posters[lightbox].published_at ?? posters[lightbox].created_at)}
                    </span>
                  )}
                </span>
                <span>{lightbox + 1} / {posters.length}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function SpmbPosterCard({ poster, onView, onDownload }: { poster: SpmbPoster; onView: () => void; onDownload: () => void }) {
  const dateText = formatPosterDate(poster.published_at ?? poster.created_at);
  return (
    <div className="group overflow-hidden rounded-2xl bg-white p-4 text-left shadow-sm">
      <button type="button" onClick={onView} className="block w-full" aria-label={`Lihat poster ${poster.title || 'Pengumuman SPMB'}`}>
        <div className="aspect-[3/4] overflow-hidden rounded-xl bg-[#FAF6F0]">
          {resolveImageUrl(poster.image) && (
            <img
              src={resolveImageUrl(poster.image)!}
              alt={poster.title || 'Pengumuman SPMB'}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
      </button>
      <div className="mt-3">
        <h3 className="truncate text-sm font-semibold text-[#1B2A4A]">{poster.title || 'Pengumuman SPMB'}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5B7088]">
          {dateText && <><CalendarDays className="h-3.5 w-3.5" /> {dateText}</>}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onView}
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
