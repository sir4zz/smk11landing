import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchOsisProfile } from '../../lib/api';
import type { OsisProfile } from '../../lib/content-types';
import { ArrowRight, BookOpen, CalendarDays, Dumbbell, Eye, Globe, Heart, Megaphone, Palette, Sparkles, Target, Users } from 'lucide-react';
import logoSekolah from '../../assets/logo.png';

const misiList = [
  'Membina keimanan dan ketaqwaan siswa terhadap Tuhan Yang Maha Esa.',
  'Mengembangkan potensi, minat, dan bakat siswa melalui kegiatan yang positif.',
  'Menumbuhkan jiwa kepemimpinan, kedisiplinan, dan tanggung jawab siswa.',
  'Menjalin kerja sama dan komunikasi yang baik antara siswa, guru, dan sekolah.',
  'Meningkatkan kreativitas dan kepedulian sosial di lingkungan sekolah maupun masyarakat.',
];

const bidangSeksi: { name: string; desc: string; icon: typeof Heart }[] = [
  { name: 'Pembinaan Karakter', desc: 'Pembinaan kedisiplinan dan penguatan karakter siswa.', icon: Heart },
  { name: 'Seni & Kreativitas', desc: 'Wadah pengembangan seni, budaya, dan kreativitas siswa.', icon: Palette },
  { name: 'Olahraga', desc: 'Pembinaan minat dan bakat siswa di bidang olahraga.', icon: Dumbbell },
  { name: 'Keagamaan', desc: 'Pembinaan kegiatan keagamaan dan kerohanian siswa.', icon: BookOpen },
  { name: 'Wawasan & Teknologi', desc: 'Pengembangan wawasan kebangsaan dan literasi teknologi.', icon: Globe },
  { name: 'Humas & Publikasi', desc: 'Publikasi kegiatan dan hubungan masyarakat OSIS.', icon: Megaphone },
];

const Osis: React.FC = () => {
  const [profile, setProfile] = useState<OsisProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOsisProfile<OsisProfile>().then((data) => {
      if (!active) return;
      setProfile(data);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="OSIS" subtitle="Organisasi Siswa Intra Sekolah SMKN 11 Kabupaten Tangerang" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS' }]} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="OSIS SMKN 11 Kabupaten Tangerang"
        subtitle="Organisasi Siswa Intra Sekolah — wadah pengembangan kepemimpinan, kreativitas, dan kepedulian siswa"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS' }]}
      />

      {/* Profil OSIS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Profil OSIS" subtitle="Identitas dan pengantar organisasi siswa SMKN 11" align="center" />
        <div className="mt-10 flex flex-col items-center gap-8 rounded-2xl border border-[#1B2A4A]/10 bg-white p-8 shadow-sm md:flex-row md:p-10">
          <div className="grid h-44 w-44 shrink-0 place-items-center rounded-2xl bg-[#FAF6F0] p-4">
            {profile.logo ? (
              <img src={profile.logo} alt={profile.name} className="h-full w-full object-contain" />
            ) : (
              <img src={logoSekolah} alt="Logo OSIS" className="h-full w-full object-contain" />
            )}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#1B2A4A]">{profile.name}</h3>
            <span className="mt-2 inline-block rounded-full bg-[#C8A951]/20 px-4 py-1 text-sm font-semibold text-[#866D2C]">
              Periode {profile.period}
            </span>
            <p className="mt-4 leading-relaxed text-[#23314D]">{profile.description}</p>
          </div>
        </div>

        {/* Visi & Misi */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-[#1B2A4A] p-8 text-white shadow-sm">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#C8A951]/20">
              <Eye className="h-6 w-6 text-[#C8A951]" />
            </div>
            <h3 className="text-xl font-bold text-[#F3E8D0]">Visi</h3>
            <p className="mt-3 leading-relaxed text-[#E8DCC7]">
              Mewujudkan OSIS SMKN 11 yang religius, berkarakter, kreatif, dan berdaya saing melalui pembinaan
              siswa yang berlandaskan iman dan taqwa serta menguasai ilmu pengetahuan dan teknologi.
            </p>
          </div>
          <div className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-8 shadow-sm">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#C8A951]/20">
              <Target className="h-6 w-6 text-[#866D2C]" />
            </div>
            <h3 className="text-xl font-bold text-[#1B2A4A]">Misi</h3>
            <ul className="mt-3 space-y-2.5">
              {misiList.map((misi) => (
                <li key={misi} className="flex gap-2 text-sm leading-6 text-[#23314D]">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#C8A951]" />
                  {misi}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Bidang / Seksi */}
      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Bidang Seksi & Program Kerja" subtitle="Ruang kerja OSIS dalam mengembangkan potensi siswa" align="center" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bidangSeksi.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#1B2A4A]">
                    <Icon className="h-6 w-6 text-[#C8A951]" />
                  </div>
                  <h4 className="font-bold text-[#1B2A4A]">{item.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#23314D]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Struktur & Kegiatan */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Jelajahi OSIS" subtitle="Kenali lebih dekat struktur kepengurusan dan kegiatan kami" align="center" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Link
            to="/osis/struktur"
            className="group flex items-center justify-between gap-4 rounded-2xl bg-[#1B2A4A] p-8 text-white shadow-sm transition-all hover:-translate-y-1 hover:bg-[#15203a]"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#C8A951]/20">
                <Users className="h-7 w-7 text-[#C8A951]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F3E8D0]">Struktur OSIS</h3>
                <p className="mt-1 text-sm text-[#E8DCC7]">Pengurus inti dan bidang seksi OSIS</p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-[#C8A951] transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/osis/kegiatan"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-[#1B2A4A]/10 bg-white p-8 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#C8A951]/20">
                <CalendarDays className="h-7 w-7 text-[#866D2C]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1B2A4A]">Kegiatan OSIS</h3>
                <p className="mt-1 text-sm text-[#23314D]">Aktivitas dan program yang sudah berjalan</p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-[#866D2C] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Osis;
