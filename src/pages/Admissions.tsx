import React, { useEffect, useState } from 'react';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { LoadingInline } from '../components/ui/LoadingScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, FileImage, GraduationCap, Lock, X } from 'lucide-react';
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

  useEffect(() => {
    Promise.all([fetchSpmbContent(), fetchSpmbPosters()])
      .then(([contentData, posterData]) => {
        setContent(contentData);
        setPosters(posterData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const closeLightbox = () => setLightbox(null);
  const prevPoster = () => setLightbox((current) => (current === null ? null : (current - 1 + posters.length) % posters.length));
  const nextPoster = () => setLightbox((current) => (current === null ? null : (current + 1) % posters.length));

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
          <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">{content.title}</h1>
          {content.description && (
            <p className="mb-6 max-w-2xl text-lg text-white/80 md:text-xl">{content.description}</p>
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

        {/* Poster / Informasi */}
        <section className="mb-16">
          <SectionHeading
            title="Poster & Informasi SPMB"
            subtitle="Klik pada poster untuk melihat lebih besar"
            align="center"
          />

          {posters.length === 0 ? (
            <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl bg-white p-12 text-center shadow-sm">
              <FileImage className="h-14 w-14 text-[#C8A951]/50" />
              <p className="mt-4 text-lg font-semibold text-[#1B2A4A]">Belum ada poster SPMB</p>
              <p className="mt-2 text-sm text-[#5B7088]">Informasi SPMB dalam bentuk poster akan segera tersedia.</p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posters.map((poster, index) => (
                <button
                  key={poster.id ?? index}
                  type="button"
                  onClick={() => setLightbox(index)}
                  className="group overflow-hidden rounded-2xl bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-xl bg-[#FAF6F0]">
                    {resolveImageUrl(poster.image) && (
                      <img
                        src={resolveImageUrl(poster.image)!}
                        alt={poster.title || `Poster SPMB ${index + 1}`}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  {poster.title && (
                    <p className="mt-3 text-center text-sm font-semibold text-[#1B2A4A]">{poster.title}</p>
                  )}
                  <span className="mt-2 block text-center text-xs text-[#866D2C]">Klik untuk memperbesar</span>
                </button>
              ))}
            </div>
          )}
        </section>

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
                <span>{posters[lightbox].title || `Poster SPMB`}</span>
                <span>{lightbox + 1} / {posters.length}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admissions;