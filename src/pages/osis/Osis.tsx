import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { usePageBanner } from '../../lib/usePageBanner';
import { fetchOsisProfile, resolveImageUrl } from '../../lib/api';
import type { OsisProfile } from '../../lib/content-types';
import { ArrowRight, CalendarDays, Users } from 'lucide-react';
import logoSekolah from '../../assets/logo.png';

const Osis: React.FC = () => {
  const { backgroundImage } = usePageBanner('osis');
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
        <PageHero title="OSIS" subtitle="Organisasi Siswa Intra Sekolah SMKN 11 Kabupaten Tangerang" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS' }]} backgroundImage={backgroundImage} />
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
        backgroundImage={backgroundImage}
      />

      {/* Profil OSIS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Profil OSIS" subtitle="Identitas dan pengantar organisasi siswa SMKN 11" align="center" />
        <div className="mt-10 flex flex-col items-center gap-6 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm sm:gap-8 md:flex-row md:p-10">
          <div className="grid h-32 w-32 sm:h-44 sm:w-44 shrink-0 place-items-center rounded-2xl bg-[#FAF6F0] p-4">
            {profile.logo ? (
              <img src={resolveImageUrl(profile.logo)} alt={profile.name} className="h-full w-full object-contain" />
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

      </section>

      {/* CTA Struktur & Kegiatan */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Jelajahi OSIS" subtitle="Kenali lebih dekat struktur kepengurusan dan kegiatan kami" align="center" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Link
            to="/osis/struktur"
            className="group flex items-center justify-between gap-4 rounded-2xl bg-[#1B2A4A] p-6 text-white shadow-sm transition-all hover:-translate-y-1 hover:bg-[#15203a] sm:p-8"
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
            className="group flex items-center justify-between gap-4 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-8"
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
