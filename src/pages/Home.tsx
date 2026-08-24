import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Monitor,
  Palette,
  Car,
  Zap,
  Calculator,
  Scissors,
  Users,
  GraduationCap,
  BookOpen,
  Trophy,
  Building2,
  MapPin,
  Sparkles,
  Camera,
  Calendar,
  ArrowRight as ArrowRightIcon,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SectionHeading from '../components/ui/SectionHeading';
import StatsBar from '../components/ui/StatsBar';
import Card from '../components/ui/Card';
import { isImportedNews } from '../lib/content-types';
import { formatLeadershipTitle } from './management/ManagementShared';
import { fetchPublicContent, fetchGalleries, fetchHomeContent, fetchSpmbContent, fetchStats, publicProfileApi, resolveImageUrl, type GalleryRow, type HomeContent, type LeadershipEntry } from '../lib/api';
import type { SpmbContent } from '../lib/content-types';

const getProgramIcon = (slug: string) => {
  switch (slug) {
    case 'tkj':
      return <Monitor className="h-8 w-8 text-[#C8A951]" />;
    case 'dkv':
      return <Palette className="h-8 w-8 text-[#C8A951]" />;
    case 'otomotif':
      return <Car className="h-8 w-8 text-[#C8A951]" />;
    case 'titl':
      return <Zap className="h-8 w-8 text-[#C8A951]" />;
    case 'mplb':
      return <Calculator className="h-8 w-8 text-[#C8A951]" />;
    case 'busana':
      return <Scissors className="h-8 w-8 text-[#C8A951]" />;
    default:
      return <Monitor className="h-8 w-8 text-[#C8A951]" />;
  }
};

const Home: React.FC = () => {
  const [activeImage, setActiveImage] = useState(0);
  const [loadedImageCount, setLoadedImageCount] = useState(1);
  const [publicPrograms, setPublicPrograms] = useState<any[]>([]);
  const [publicNews, setPublicNews] = useState<any[]>([]);
  const [publicAchievements, setPublicAchievements] = useState<any[]>([]);
  const [gallery, setGallery] = useState<GalleryRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [home, setHome] = useState<HomeContent | null>(null);
  const [principal, setPrincipal] = useState<LeadershipEntry | null>(null);
  const [spmb, setSpmb] = useState<SpmbContent | null>(null);
  const [stats, setStats] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    let active = true;
    fetchPublicContent<any[]>('programs').then((data) => { if (active) setPublicPrograms(data); });
    fetchPublicContent<any[]>('news', { limit: 2 }).then((data) => { if (active) setPublicNews(data); });
    fetchPublicContent<any[]>('achievements', { limit: 3 }).then((data) => { if (active) setPublicAchievements(data); });
    fetchHomeContent().then((data) => { if (active) setHome(data); });
    publicProfileApi.leadership().then(({ data }) => { if (active && data) setPrincipal(data.principal); });
    fetchSpmbContent().then((data) => { if (active) setSpmb(data); });
    fetchStats().then((data) => { if (active) setStats(data); });
    fetchGalleries({ page: 1, limit: 8 })
      .then(({ rows }) => { if (active) setGallery(rows); })
      .catch(() => {})
      .finally(() => { if (active) setGalleryLoading(false); });
    return () => { active = false; };
  }, []);

  const heroImages = home?.hero?.images ?? [];
  const heroFrameImage = home?.hero?.frame_image || heroImages[1] || '';
  const principalName = principal?.name || home?.welcome?.principal_name || '';
  const principalPosition = formatLeadershipTitle(principal?.title) || principal?.position || home?.welcome?.principal_title || '';
  const principalPhoto = resolveImageUrl(principal?.photo);
  const statIcons = [Users, GraduationCap, BookOpen];
  const statsWithIcons = (stats ?? []).map((stat, index) => ({ ...stat, icon: React.createElement(statIcons[index] ?? Users, { className: 'h-6 w-6' }) }));

  useEffect(() => {
    if (heroImages.length < 2) return;
    const timer = window.setInterval(() => setActiveImage((prev) => (prev + 1) % heroImages.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    setLoadedImageCount((count) => Math.max(count, Math.min(activeImage + 2, heroImages.length)));
  }, [activeImage, heroImages.length]);



  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6F0] font-sans">
      <section className="relative isolate min-h-[80vh] sm:min-h-[90vh] lg:min-h-[95vh] overflow-hidden bg-[#1B2A4A] flex items-center">
        {/* Background Images & Overlay */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <img
              key={image}
              src={index < loadedImageCount ? resolveImageUrl(image) : undefined}
              alt={index === 0 ? 'Siswa SMKN 11 sedang belajar' : 'Kegiatan sekolah SMKN 11'}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === activeImage ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          {/* Main Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C1527] via-[#121F38]/90 to-[#1B2A4A]/40" />
          {/* Subtle Background Elements */}
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Content */}
            <div className="flex flex-col items-start justify-center">
              
              {/* Slogan TOP */}
              <div className="-mt-2 mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 sm:-mt-3 sm:mb-7 lg:-mt-5">
                <span className="-rotate-3 inline-flex items-center rounded-md bg-gradient-to-br from-[#E9CE7B] to-[#C8A951] px-2.5 py-1 text-xl font-black italic leading-none tracking-tight text-[#1B2A4A] shadow-[3px_3px_0_#0C1527] ring-1 ring-white/40 sm:px-3.5 sm:py-1.5 sm:text-2xl">
                  TOP
                </span>
                <span className="text-lg font-black italic uppercase leading-tight tracking-wide text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.5)] sm:text-2xl lg:text-3xl">
                  <span className="text-[#F9E7A8]">T</span>erampil{' '}
                  <span className="text-[#F9E7A8]">O</span>ptimis{' '}
                  <span className="text-[#F9E7A8]">P</span>ercaya-Diri
                </span>
              </div>

              {/* Formal Logos Row */}
              <div className="mb-6 sm:mb-10 flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3 shadow-sm backdrop-blur-md">
                <div className="mt-1 flex items-center gap-2 sm:mt-1.5">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" alt="Kemdikbud" className="h-8 w-auto" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
                  <div className="hidden sm:block text-left text-[8px] font-bold tracking-widest text-white/90 uppercase leading-tight">
                    Kementerian Pendidikan,<br/>Kebudayaan, Riset,<br/>dan Teknologi
                  </div>
                </div>
                
                <div className="h-8 w-px bg-white/20"></div>
                
                <div className="flex flex-col items-start justify-center">
                  <div className="text-base font-black italic tracking-tighter text-white">
                    SMK<span className="text-[#C8A951]">BISA</span><span className="text-[#F9E7A8]">-HEBAT</span>
                  </div>
                 
                </div>

                <div className="hidden sm:block h-8 w-px bg-white/20"></div>

                <div className="hidden sm:flex items-center gap-2 text-white">
                  <div className="rounded-full bg-white/10 p-1.5">
                    <GraduationCap className="h-5 w-5 text-[#C8A951]" />
                  </div>
                  <div className="text-[8px] font-bold tracking-widest uppercase leading-tight">
                    Vokasi Kuat<br/>Menguatkan<br/>Indonesia
                  </div>
                </div>
              </div>

              {/* Massive Hero Titles */}
              <div className="flex flex-col">
                <h1 className="text-5xl font-black italic tracking-tighter sm:text-7xl lg:text-[6.5rem] text-white [-webkit-text-stroke:1px_#C8A951] sm:[-webkit-text-stroke:2px_#C8A951]">
                  SMKN <span className="text-[#C8A951] text-[1.15em] leading-none [-webkit-text-stroke:1px_white] sm:[-webkit-text-stroke:2px_white]">11</span>
                </h1>
                <h2 className="mt-1 text-xl font-bold tracking-[0.3em] text-[#1B2A4A] sm:text-4xl uppercase [-webkit-text-stroke:1px_white] sm:[-webkit-text-stroke:2px_white] [text-shadow:0_0_12px_rgba(200,169,81,0.5)]">
                  Kab. Tangerang
                </h2>
              </div>
              
              <p className="mt-6 sm:mt-8 max-w-xl text-base font-medium leading-relaxed text-[#FBEFCC] sm:text-lg md:text-xl">
                {home?.hero?.description}
              </p>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Button as="link" href="/kontak" variant="primary" size="lg" className="rounded-full px-8 py-4 text-lg font-bold uppercase tracking-wider transition-all hover:scale-105">
                  Kontak Kami
                </Button>
                <div className="flex items-center justify-center rounded-full border border-white/20 bg-[#121F38]/60 px-6 py-4 text-sm font-semibold text-[#FFF8E8] backdrop-blur-md">
                  <span className="mr-3 relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C8A951]"></span>
                  </span>
                  {home?.contact?.hours ?? 'Layanan sekolah'}
                </div>
              </div>
            </div>

            {/* Right Content - Abstract Frame (replaces rigid shapes) */}
            <div className="hidden lg:block relative h-[650px] w-full">
              {/* Modern Glass Frame instead of boring box */}
              <div className="absolute inset-y-10 right-0 left-10 overflow-hidden rounded-bl-[140px] rounded-tr-[140px] border-[6px] border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm transition-transform hover:scale-[1.02] duration-500">
                {resolveImageUrl(heroFrameImage) && (
                  <img 
                    src={resolveImageUrl(heroFrameImage)!} 
                    alt="Sekolah" 
                    className="h-full w-full object-cover mix-blend-overlay opacity-90 transition-transform duration-1000 hover:scale-110"
                  />
                )}
                {/* Inner Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1527] via-transparent to-transparent opacity-90" />
                
                {/* Overlay Card for Principal / Highlight */}
                <div className="absolute bottom-12 left-10 right-10">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-[#C8A951] p-4 text-[#1B2A4A] shadow-lg">
                        <Building2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider drop-shadow-md">{home?.hero?.facility_title}</h3>
                        <p className="mt-1 text-sm font-medium text-[#FBEFCC]">{home?.hero?.facility_description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute top-20 left-0 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-4 rounded-2xl border border-[#C8A951]/50 bg-gradient-to-br from-[#23314D]/95 to-[#1B2A4A]/95 p-4 pr-6 shadow-2xl backdrop-blur-xl">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E9CE7B] to-[#C8A951] shadow-[0_0_20px_rgba(200,169,81,0.5)]" />
                    <div className="absolute inset-[3px] rounded-full border-2 border-dashed border-[#1B2A4A]/60" />
                    <span className="relative text-2xl font-black italic text-[#1B2A4A]">B</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A951]">Akreditasi</span>
                    <span className="text-base font-black text-white">{home?.hero?.accreditation}</span>
                    <span className="text-[10px] font-semibold text-white/60">BAN-S/M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Slider Controls Container */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3 rounded-full bg-black/20 p-2 backdrop-blur-md">
          {heroImages.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Pilih slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${index === activeImage ? 'w-8 bg-[#C8A951]' : 'w-2.5 bg-white/40 hover:bg-white/60'}`}
              onClick={() => setActiveImage(index)}
            />
          ))}
        </div>
      </section>

      {/* Sambutan Kepala Sekolah */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image/Photo */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative overflow-hidden rounded-3xl rounded-tr-[40px] sm:rounded-tr-[80px] rounded-bl-[40px] sm:rounded-bl-[80px] bg-[#FAF6F0] p-3 sm:p-4 shadow-sm">
                {principalPhoto && <img src={principalPhoto} alt="Kepala Sekolah SMKN 11" loading="lazy" className="h-[250px] sm:h-[350px] md:h-[450px] w-full object-cover rounded-2xl rounded-tr-[70px] rounded-bl-[70px]" />}
                <div className="absolute bottom-10 left-0 bg-[#1B2A4A] text-white p-4 pr-8 rounded-r-2xl shadow-xl border-l-4 border-[#C8A951]">
                  <h4 className="font-bold text-lg">{principalName}</h4>
                  <p className="text-[#F9E7A8] text-sm">{principalPosition}</p>
                </div>
              </div>
              <div className="absolute -z-10 -bottom-5 -right-5 h-full w-full rounded-3xl rounded-tr-[80px] rounded-bl-[80px] border-2 border-[#C8A951]/20"></div>
            </div>
            
            {/* Content */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-[#C8A951]"></span>
                <span className="text-sm font-bold uppercase tracking-widest text-[#C8A951]">Sambutan Kepala Sekolah</span>
              </div>
                <h2 className="mb-4 sm:mb-6 text-2xl font-bold leading-tight text-[#1B2A4A] sm:text-3xl md:text-4xl">
                 {home?.welcome?.title}
              </h2>
              <div className="space-y-4 text-base sm:text-lg text-[#23314D] leading-relaxed mb-6 sm:mb-8">
                {(home?.welcome?.paragraphs ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <p className="font-semibold text-[#1B2A4A] italic border-l-4 border-[#C8A951] pl-4 mt-6">
                  {home?.welcome?.quote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={home?.about?.title ?? ''} subtitle={home?.about?.subtitle ?? ''} />

          <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 text-lg leading-8 text-[#23314D]">
              {(home?.about?.paragraphs ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            <div className="rounded-[1.5rem] border border-[#1B2A4A]/10 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-3 text-[#1B2A4A]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#866D2C]">{home?.about?.card_label}</p>
                   <h3 className="text-xl font-semibold text-[#1B2A4A]">{home?.about?.card_title}</h3>
                </div>
              </div>

              <div className="mt-6 rounded-[1.25rem] bg-[#1B2A4A] p-6 text-[#FFF9F1]">
                <p className="text-sm uppercase tracking-[0.3em] text-[#C8A951]">Sambutan</p>
                <p className="mt-4 text-lg leading-8">
                   {home?.about?.quote}
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4" />
                   {home?.about?.location}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Program Keahlian Unggulan" subtitle="Pilih jurusan yang sesuai dengan minat dan bakatmu." align="center" />

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {publicPrograms.map((program) => (
              <Card key={program.id} image={program.image} title={program.name} description={program.shortDescription} badge={program.shortName} className="h-full">
                <div className="flex flex-col flex-1 p-6">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#FAF6F0]">
                    {program.logo && resolveImageUrl(program.logo) ? (
                      <img src={resolveImageUrl(program.logo)!} alt={`Logo ${program.name}`} loading="lazy" className="h-full w-full object-contain p-1" />
                    ) : (
                      getProgramIcon(program.slug)
                    )}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-[#1B2A4A]">{program.name}</h3>
                  <p className="mb-6 text-sm font-medium leading-7 text-[#23314D]">{program.shortDescription}</p>
                  <Link to={`/akademik/program/${program.slug}`} className="mt-auto inline-flex items-center gap-2 font-semibold text-[#866D2C] transition-colors hover:text-[#1B2A4A]">
                    Pelajari lebih lanjut <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              as="link"
              href="/akademik/program-keahlian"
              variant="solid-navy"
              size="lg"
              style={{ color: '#FFFFFF' }}
            >
              Lihat Semua Program
            </Button>
          </div>
        </div>
      </section>

      <StatsBar stats={statsWithIcons} />

      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeading title="Berita & Informasi Terkini" subtitle="Update kegiatan, prestasi, dan berita sekolah terbaru." align="left" />
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {publicNews.slice(0, 2).map((item) => (
                  <Card key={item.id} image={item.thumbnail} title={item.title} description={item.excerpt} badge={item.category}
                    tag={isImportedNews(item) ? 'Sumber Eksternal' : 'Berita Sekolah'}
                    tagClassName={isImportedNews(item) ? 'bg-blue-600/90 text-white' : 'bg-[#C8A951]/90 text-[#1B2A4A]'}
                    link={`/informasi/berita/${item.slug}`} />
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#1B2A4A]/10 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-3 text-[#1B2A4A]">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#866D2C]">Prestasi terbaru</p>
                  <h3 className="text-xl font-semibold text-[#1B2A4A]">Pencapaian siswa yang terus bertumbuh</h3>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {publicAchievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="rounded-2xl border border-[#1B2A4A]/10 bg-[#FAF6F0] p-4">
                    <p className="text-sm font-semibold text-[#1B2A4A]">{achievement.title}</p>
                    <p className="mt-1 text-sm font-medium text-[#23314D]">{achievement.event} • {achievement.rank}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="Galeri Kegiatan" subtitle="Dokumentasi momen dan kegiatan sekolah dalam galeri foto." align="left" />
            <Link to="/galeri" className="mb-8 inline-flex items-center gap-2 font-semibold text-[#866D2C] transition-colors hover:text-[#1B2A4A]">
              Lihat Semua Galeri <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {galleryLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-[1.25rem] bg-[#1B2A4A]/10" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="grid place-items-center rounded-[1.25rem] border border-dashed border-[#1B2A4A]/20 bg-white py-16 text-center">
              <Camera className="h-10 w-10 text-[#866D2C]" />
              <p className="mt-3 text-[#5B7088]">Galeri masih kosong. Segera hadir dokumentasi kegiatan kami.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {gallery.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/galeri/${item.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {resolveImageUrl(item.cover_image) && (
                    <img
                      src={resolveImageUrl(item.cover_image)!}
                      alt={item.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/90 via-[#1B2A4A]/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="absolute left-3 top-3 rounded-full bg-[#C8A951]/95 px-3 py-1 text-xs font-semibold text-[#1B2A4A]">
                    {item.category ?? 'Kegiatan'}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-base font-bold leading-snug text-white">{item.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/80">
                      <Calendar className="h-3.5 w-3.5" />
                      {item.event_date ? new Date(item.event_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : 'Kegiatan'}
                      <Sparkles className="ml-1 h-3.5 w-3.5 text-[#C8A951]" />
                      <span>{item.images_count ?? 0} foto</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl sm:rounded-[2rem] bg-[#1B2A4A] p-6 text-center text-white shadow-2xl sm:p-8 md:p-16">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C8A951]">Informasi SPMB</p>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl md:text-4xl">{spmb?.banner_title || spmb?.title || 'Informasi SPMB SMKN 11 Kabupaten Tangerang'}</h2>
              <p className="mt-6 text-lg font-medium text-white/95">{spmb?.banner_description || spmb?.description || 'Lihat persyaratan, jadwal, alur, dan tautan menuju portal resmi SPMB Provinsi Banten.'}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button as="link" href="/spmb" variant="primary" size="lg" className="px-8">
                  Lihat Informasi SPMB
                </Button>
                <Button as="link" href="/kontak" variant="outline-light" size="lg" className="px-8">
                  Hubungi Kami
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
