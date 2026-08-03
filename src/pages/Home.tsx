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
} from 'lucide-react';
import Button from '../components/ui/Button';
import SectionHeading from '../components/ui/SectionHeading';
import StatsBar from '../components/ui/StatsBar';
import Card from '../components/ui/Card';
import { programs } from '../data/programs';
import { news } from '../data/news';
import { achievements } from '../data/achievements';
import { fetchPublicContent } from '../lib/api';

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

const heroImages = [
  'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2Nob29sfGVufDB8fDB8fHww',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80',
];

const Home: React.FC = () => {
  const [activeImage, setActiveImage] = useState(0);
  const [publicPrograms, setPublicPrograms] = useState(programs);
  const [publicNews, setPublicNews] = useState(news);
  const [publicAchievements, setPublicAchievements] = useState(achievements);
  const [stats] = useState([
    { value: '1.124+', label: 'Siswa Aktif', icon: <Users className="h-6 w-6" /> },
    { value: '51+', label: 'Tenaga Pengajar', icon: <GraduationCap className="h-6 w-6" /> },
    { value: '6', label: 'Program Keahlian', icon: <BookOpen className="h-6 w-6" /> },
    { value: '33', label: 'Rombel', icon: <Trophy className="h-6 w-6" /> },
  ]);

  useEffect(() => {
    fetchPublicContent('programs', programs).then(setPublicPrograms);
    fetchPublicContent('news', news).then(setPublicNews);
    fetchPublicContent('achievements', achievements).then(setPublicAchievements);
    // Statistik hanya menampilkan informasi sekolah; SPMB tidak menyimpan data pendaftar di situs ini.
    const timer = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);



  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6F0] font-sans">
      <section className="relative isolate min-h-[95vh] overflow-hidden bg-[#1B2A4A] flex items-center">
        {/* Background Images & Overlay */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <img
              key={image}
              src={image}
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

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Content */}
            <div className="flex flex-col items-start justify-center">
              
              {/* Formal Logos Row */}
              <div className="mb-10 flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2">
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
                  <div className="text-[7px] font-bold tracking-widest text-white/80 uppercase">
                    Siap Kerja • Santun • Mandiri • Kreatif
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
                <h1 className="text-6xl font-black italic tracking-tighter sm:text-7xl lg:text-[6.5rem] text-white [-webkit-text-stroke:1px_#C8A951] sm:[-webkit-text-stroke:2px_#C8A951]">
                  SMKN <span className="text-[#C8A951] text-[1.15em] leading-none [-webkit-text-stroke:1px_white] sm:[-webkit-text-stroke:2px_white]">11</span>
                </h1>
                <h2 className="mt-1 text-2xl font-bold tracking-[0.3em] text-[#1B2A4A] sm:text-4xl uppercase [-webkit-text-stroke:1px_white] sm:[-webkit-text-stroke:2px_white] [text-shadow:0_0_12px_rgba(200,169,81,0.5)]">
                  Kab. Tangerang
                </h2>
              </div>
              
              <p className="mt-8 max-w-xl text-lg font-medium leading-relaxed text-[#FBEFCC] sm:text-xl">
                Sekolah kejuruan favorit yang menyiapkan lulusan unggul, berkarakter, dan memiliki kompetensi tinggi sesuai kebutuhan industri masa depan.
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
                  Layanan 08.00 s.d 15.30 WIB
                </div>
              </div>
            </div>

            {/* Right Content - Abstract Frame (replaces rigid shapes) */}
            <div className="hidden lg:block relative h-[650px] w-full">
              {/* Modern Glass Frame instead of boring box */}
              <div className="absolute inset-y-10 right-0 left-10 overflow-hidden rounded-bl-[140px] rounded-tr-[140px] border-[6px] border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm transition-transform hover:scale-[1.02] duration-500">
                <img 
                  src={heroImages[1]} 
                  alt="Sekolah" 
                  className="h-full w-full object-cover mix-blend-overlay opacity-90 transition-transform duration-1000 hover:scale-110"
                />
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
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider drop-shadow-md">Fasilitas Modern</h3>
                        <p className="mt-1 text-sm font-medium text-[#FBEFCC]">Mendukung penuh kompetensi siswa di era digital.</p>
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
                    <span className="text-base font-black text-white">Peringkat B</span>
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
              <div className="relative overflow-hidden rounded-3xl rounded-tr-[80px] rounded-bl-[80px] bg-[#FAF6F0] p-4 shadow-sm">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" alt="Kepala Sekolah SMKN 11" className="h-[250px] sm:h-[350px] md:h-[450px] w-full object-cover rounded-2xl rounded-tr-[70px] rounded-bl-[70px]" />
                <div className="absolute bottom-10 left-0 bg-[#1B2A4A] text-white p-4 pr-8 rounded-r-2xl shadow-xl border-l-4 border-[#C8A951]">
                  <h4 className="font-bold text-lg">Emma Sukmayati</h4>
                  <p className="text-[#F9E7A8] text-sm">Kepala SMKN 11 Kab. Tangerang</p>
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
              <h2 className="mb-6 text-3xl font-bold leading-tight text-[#1B2A4A] md:text-4xl">
                Selamat Datang di Portal Resmi SMKN 11 Kabupaten Tangerang
              </h2>
              <div className="space-y-4 text-lg text-[#23314D] leading-relaxed mb-8">
                <p>
                  Puji syukur kita panjatkan ke hadirat Allah SWT atas rahmat dan karunia-Nya. Di era digitalisasi dan disrupsi teknologi saat ini, pendidikan vokasi memegang peran krusial dalam mencetak generasi muda yang tidak hanya kompeten, tetapi juga memiliki karakter dan daya adaptasi yang tinggi.
                </p>
                <p>
                  SMKN 11 Kabupaten Tangerang berkomitmen penuh untuk menjadi lembaga pendidikan yang inovatif, berdaya saing global, dan berakar pada nilai-nilai luhur bangsa. Melalui sinkronisasi kurikulum dengan industri, kami berupaya memastikan lulusan kami siap menghadapi tantangan dunia kerja masa depan.
                </p>
                <p className="font-semibold text-[#1B2A4A] italic border-l-4 border-[#C8A951] pl-4 mt-6">
                  "SMK BISA, SMK HEBAT, Vokasi Kuat Menguatkan Indonesia!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Tentang SMKN 11 Kabupaten Tangerang" subtitle="Sekolah vokasi yang menyiapkan lulusan unggul, kompeten, dan siap bersaing di dunia kerja." />

          <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 text-lg leading-8 text-[#23314D]">
              <p>SMKN 11 Kabupaten Tangerang adalah lembaga pendidikan kejuruan negeri yang berdiri pada tahun 2013 dan berkomitmen mencetak siswa berprestasi, berakhlaqul karimah, dan memiliki kompetensi sesuai kebutuhan industri.</p>
              <p>Berlokasi di Kp. Saradan, Desa Pangkat, Kecamatan Jayanti, sekolah ini memiliki 6 program keahlian unggulan dengan 1.124 siswa aktif dan 51 tenaga pengajar profesional yang berdedikasi.</p>
              <p>Dengan akreditasi B dan didukung fasilitas laboratorium, bengkel, serta lingkungan belajar yang kondusif, lulusan kami tidak hanya siap bekerja, tetapi juga memiliki jiwa kewirausahaan dan akhlak mulia yang kuat.</p>
            </div>

            <div className="rounded-[1.5rem] border border-[#1B2A4A]/10 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-3 text-[#1B2A4A]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#866D2C]">Sekolah kami</p>
                  <h3 className="text-xl font-semibold text-[#1B2A4A]">Lingkungan belajar yang memotivasi</h3>
                </div>
              </div>

              <div className="mt-6 rounded-[1.25rem] bg-[#1B2A4A] p-6 text-[#FFF9F1]">
                <p className="text-sm uppercase tracking-[0.3em] text-[#C8A951]">Sambutan</p>
                <p className="mt-4 text-lg leading-8">
                  "Kami terus mendorong setiap siswa untuk tumbuh menjadi pribadi yang unggul, disiplin, dan siap memberikan kontribusi nyata bagi masyarakat dan bangsa."
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4" />
                  Kabupaten Tangerang, Banten
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
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF6F0]">
                    {getProgramIcon(program.slug)}
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

      <StatsBar stats={stats} />

      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeading title="Berita & Informasi Terkini" subtitle="Update kegiatan, prestasi, dan berita sekolah terbaru." align="left" />
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {publicNews.slice(0, 2).map((item) => (
                  <Card key={item.id} image={item.thumbnail} title={item.title} description={item.excerpt} badge={item.category} link={`/informasi/berita/${item.slug}`} />
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
          <div className="overflow-hidden rounded-[2rem] bg-[#1B2A4A] p-8 text-center text-white shadow-2xl md:p-16">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C8A951]">SPMB 2026/2027</p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Dapatkan informasi lengkap SPMB SMKN 11 Kabupaten Tangerang.</h2>
              <p className="mt-6 text-lg font-medium text-white/95">Lihat persyaratan, jadwal, alur, dan tautan menuju portal resmi SPMB Provinsi Banten.</p>
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
