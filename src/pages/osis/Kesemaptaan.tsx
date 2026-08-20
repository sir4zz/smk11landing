import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Image as ImageIcon, MapPin, Play, Shield, Sparkles, Target, X, ZoomIn } from 'lucide-react';
import { fetchKesemaptaanProfile, fetchKesemaptaanActivities, fetchKesemaptaanSchedules, fetchKesemaptaanGallery, fetchKesemaptaanVideos, resolveImageUrl, youtubeEmbedUrl, youtubeThumbnailUrl } from '../../lib/api';
import type { KesemaptaanProfile, KesemaptaanActivity, KesemaptaanSchedule, KesemaptaanGalleryPhoto, KesemaptaanVideo } from '../../lib/content-types';
import { LoadingInline } from '../../components/ui/LoadingScreen';

interface GalleryVideo extends KesemaptaanVideo {
  embed: string;
  thumbnail: string;
}

const Kesemaptaan: React.FC = () => {
  const [profile, setProfile] = useState<KesemaptaanProfile | null>(null);
  const [activities, setActivities] = useState<KesemaptaanActivity[]>([]);
  const [schedules, setSchedules] = useState<KesemaptaanSchedule[]>([]);
  const [gallery, setGallery] = useState<KesemaptaanGalleryPhoto[]>([]);
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ type: 'gallery' | 'activity'; index: number } | null>(null);
  const [activeVideo, setActiveVideo] = useState<GalleryVideo | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchKesemaptaanProfile<KesemaptaanProfile>(),
      fetchKesemaptaanActivities<KesemaptaanActivity[]>(),
      fetchKesemaptaanSchedules<KesemaptaanSchedule[]>(),
      fetchKesemaptaanGallery<KesemaptaanGalleryPhoto[]>(),
      fetchKesemaptaanVideos<KesemaptaanVideo[]>(),
    ]).then(([p, a, s, g, v]) => {
      if (!active) return;
      setProfile(p);
      setActivities((a ?? []).filter((item) => item.status === 'published'));
      setSchedules(s ?? []);
      const photos = g ?? [];
      setGallery([...photos].sort((x, y) => (y.is_primary ? 1 : 0) - (x.is_primary ? 1 : 0)));
      setVideos((v ?? [])
        .map((vid) => ({ ...vid, embed: youtubeEmbedUrl(vid.youtube_url), thumbnail: youtubeThumbnailUrl(vid.youtube_url) }))
        .filter((vid) => vid.embed));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage = useCallback(() => {
    setLightbox((current) => {
      if (!current) return null;
      const length = current.type === 'activity' ? activities.length : gallery.length;
      return { ...current, index: (current.index - 1 + length) % length };
    });
  }, [gallery.length, activities.length]);
  const nextImage = useCallback(() => {
    setLightbox((current) => {
      if (!current) return null;
      const length = current.type === 'activity' ? activities.length : gallery.length;
      return { ...current, index: (current.index + 1) % length };
    });
  }, [gallery.length, activities.length]);

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
        <div className="grid min-h-[320px] place-items-center bg-[#1B2A4A] md:min-h-[420px]">
          <LoadingInline />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl animate-pulse space-y-4 text-center">
            <div className="mx-auto h-8 w-1/2 rounded bg-[#1B2A4A]/10" />
            <div className="mx-auto h-4 w-2/3 rounded bg-[#1B2A4A]/10" />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-[1.25rem] bg-[#1B2A4A]/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const heroTitle = profile?.hero_title || profile?.title || 'Kesemaptaan';
  const heroDescription = profile?.hero_description || profile?.description || '';
  const heroImage = resolveImageUrl(profile?.hero_image || profile?.photo);
  const hasAbout = Boolean(profile?.about_description);
  const hasGoals = Array.isArray(profile?.goals) && profile.goals!.length > 0;
  const hasDocumentation = gallery.length > 0 || videos.length > 0;

  const lightboxItem = lightbox === null ? null : (lightbox.type === 'activity' ? activities[lightbox.index] : gallery[lightbox.index]);
  const lightboxImage = lightboxItem
    ? lightbox!.type === 'activity'
      ? resolveImageUrl((lightboxItem as KesemaptaanActivity).photo)
      : resolveImageUrl((lightboxItem as KesemaptaanGalleryPhoto).image)
    : null;
  const lightboxTitle = lightboxItem
    ? lightbox!.type === 'activity'
      ? (lightboxItem as KesemaptaanActivity).title
      : (lightboxItem as KesemaptaanGalleryPhoto).caption || 'Dokumentasi Kesemaptaan'
    : '';
  const lightboxCount = lightbox === null ? 0 : (lightbox.type === 'activity' ? activities.length : gallery.length);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* ===== HERO KESEMAPTAAN ===== */}
      <section className="relative isolate overflow-hidden bg-[#1B2A4A]">
        {heroImage && (
          <img src={heroImage} alt={heroTitle} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A] via-[#1B2A4A]/85 to-[#1B2A4A]/60" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-white/70">
            <Link to="/" className="transition-colors hover:text-[#C8A951]">Beranda</Link>
            <span>/</span>
            <Link to="/osis" className="transition-colors hover:text-[#C8A951]">OSIS</Link>
            <span>/</span>
            <span className="text-[#C8A951]">Kesemaptaan</span>
          </nav>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#C8A951]/15 px-4 py-1.5 text-sm font-semibold text-[#C8A951] ring-1 ring-[#C8A951]/30">
              <Shield className="h-4 w-4" /> Pembinaan Karakter & Kedisiplinan
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
              {heroTitle}
            </h1>
            {heroDescription && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
                {heroDescription}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== TENTANG KESEMAPTAAN ===== */}
      {hasAbout && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#866D2C]">
              <Sparkles className="h-4 w-4" /> Tentang Kesemaptaan
            </span>
            <h2 className="mt-3 text-2xl font-bold text-[#1B2A4A] md:text-3xl">
              {profile?.about_title || 'Tentang Kesemaptaan'}
            </h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#C8A951]" />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-8 max-w-3xl text-center text-base leading-relaxed text-[#23314D] md:text-lg"
          >
            {profile!.about_description}
          </motion.p>

          {hasGoals && (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {profile!.goals!.map((goal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
                  className="group rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#C8A951]/40 hover:shadow-lg"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#C8A951]/15 text-[#866D2C] transition-colors group-hover:bg-[#C8A951] group-hover:text-[#1B2A4A]">
                    <Target className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-bold text-[#1B2A4A]">{goal.title}</h3>
                  {goal.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[#5B7088]">{goal.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== KEGIATAN KESEMAPTAAN ===== */}
      {activities.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#866D2C]">
                <CalendarDays className="h-4 w-4" /> Kegiatan Kesemaptaan
              </span>
              <h2 className="mt-3 text-2xl font-bold text-[#1B2A4A] md:text-3xl">Program & Kegiatan</h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#C8A951]" />
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity, index) => {
                const photo = resolveImageUrl(activity.photo);
                return (
                  <motion.article
                    key={activity.id ?? index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
                    className="group overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#1B2A4A]/5">
                      {photo ? (
                        <button
                          type="button"
                          onClick={() => setLightbox({ type: 'activity', index })}
                          className="group/photo block h-full w-full cursor-pointer"
                          aria-label={`Lihat foto ${activity.title}`}
                        >
                          <img
                            src={photo}
                            alt={activity.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 grid place-items-center bg-[#1B2A4A]/0 transition-colors duration-300 group-hover/photo:bg-[#1B2A4A]/35">
                            <span className="grid h-11 w-11 scale-75 place-items-center rounded-full bg-[#C8A951] text-[#1B2A4A] opacity-0 shadow-lg transition-all duration-300 group-hover/photo:scale-100 group-hover/photo:opacity-100">
                              <ZoomIn className="h-5 w-5" />
                            </span>
                          </span>
                        </button>
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[#C8A951]">
                          <Shield className="h-14 w-14" />
                        </div>
                      )}
                      {activity.activity_date && (
                        <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#1B2A4A]/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-[#1B2A4A]">{activity.title}</h3>
                      {activity.description && (
                        <p className="mt-2 text-sm leading-relaxed text-[#5B7088]">{activity.description}</p>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== DOKUMENTASI ===== */}
      {hasDocumentation && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#866D2C]">
              <ImageIcon className="h-4 w-4" /> Dokumentasi
            </span>
            <h2 className="mt-3 text-2xl font-bold text-[#1B2A4A] md:text-3xl">Galeri Foto & Video</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#C8A951]" />
          </div>

          {videos.length > 0 && (
            <div className={`mt-10 ${videos.length > 1 ? 'grid gap-5 md:grid-cols-2' : 'mx-auto max-w-2xl'}`}>
              {videos.map((video, index) => (
                <div key={video.id ?? index} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#1B2A4A]/10">
                  {video.title && (
                    <p className="px-5 pt-4 text-sm font-semibold text-[#1B2A4A]">{video.title}</p>
                  )}
                  <div className={`relative aspect-video w-full ${video.title ? 'p-3 pt-2' : ''}`}>
                    {activeVideo?.id === video.id ? (
                      <iframe
                        src={video.embed}
                        title={video.title || `Video Kesemaptaan ${index + 1}`}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="absolute inset-0 h-full w-full rounded-2xl border-0"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveVideo(video)}
                        className="group absolute inset-0 block h-full w-full cursor-pointer overflow-hidden rounded-2xl bg-[#1B2A4A]"
                        aria-label={`Putar video ${video.title || index + 1}`}
                      >
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt={video.title || `Video Kesemaptaan ${index + 1}`}
                            loading="lazy"
                            className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <span className="absolute inset-0 grid place-items-center bg-gradient-to-t from-[#1B2A4A]/70 via-[#1B2A4A]/20 to-transparent">
                          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#C8A951]/95 text-[#1B2A4A] shadow-xl transition-transform duration-300 group-hover:scale-110">
                            <Play className="h-7 w-7 fill-current" />
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {gallery.length > 0 && (
            <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
              {gallery.map((photo, index) => (
                <motion.button
                  key={photo.id ?? `${photo.image}-${index}`}
                  type="button"
                  onClick={() => setLightbox({ type: 'gallery', index })}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: (index % 3) * 0.05 }}
                  className={`group relative mb-5 block w-full overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg ${photo.is_primary ? 'ring-2 ring-[#C8A951]' : ''}`}
                >
                  {resolveImageUrl(photo.image) && (
                    <img
                      src={resolveImageUrl(photo.image)!}
                      alt={photo.caption || `Dokumentasi Kesemaptaan ${index + 1}`}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#1B2A4A]/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    {photo.caption && <p className="text-left text-sm font-medium text-white">{photo.caption}</p>}
                    <span className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#C8A951] text-[#1B2A4A]">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== JADWAL KEGIATAN ===== */}
      {schedules.length > 0 && (
        <section className="bg-[#1B2A4A] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#C8A951]">
                <CalendarDays className="h-4 w-4" /> Jadwal Kegiatan
              </span>
              <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">Jadwal Kegiatan Kesemaptaan</h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#C8A951]" />
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {schedules.map((schedule, index) => {
                const date = schedule.date ? new Date(schedule.date) : null;
                const fullDateLabel = date ? date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
                return (
                  <motion.div
                    key={schedule.id ?? index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
                    className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/10 hover:ring-[#C8A951]/40"
                  >
                    <div className="flex items-start gap-4">
                      {date && (
                        <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-[#C8A951] py-2 text-center text-[#1B2A4A]">
                          <span className="text-2xl font-bold leading-none">{date.getDate()}</span>
                          <span className="mt-0.5 text-[10px] font-bold uppercase">
                            {date.toLocaleDateString('id-ID', { month: 'short' })}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-white">{schedule.name || 'Kegiatan Kesemaptaan'}</h3>
                        {fullDateLabel && <p className="mt-0.5 text-xs font-semibold text-[#C8A951]">{fullDateLabel}</p>}
                        {schedule.location && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-[#F3E8D0]/85">
                            <MapPin className="h-4 w-4 shrink-0 text-[#C8A951]" /> {schedule.location}
                          </p>
                        )}
                        {schedule.description && (
                          <p className="mt-2 text-sm leading-relaxed text-[#F3E8D0]/70">{schedule.description}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && lightboxItem && (
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
              key={`${lightbox.type}-${lightbox.index}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="max-h-[90vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImage && (
                <img
                  src={lightboxImage}
                  alt={lightboxTitle || 'Kesemaptaan'}
                  className="mx-auto max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
                />
              )}
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-white/80">
                <span className="min-w-0 truncate">{lightboxTitle || 'Dokumentasi Kesemaptaan'}</span>
                <span className="shrink-0">{lightbox.index + 1} / {lightboxCount}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Kesemaptaan;