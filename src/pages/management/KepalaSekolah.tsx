import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { publicProfileApi, type LeadershipEntry } from '../../lib/api';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PersonAvatar, EmptyState, formatLeadershipTitle } from './ManagementShared';

const responsibilities = [
  'Menetapkan kebijakan, program, dan rencana kerja sekolah',
  'Memimpin pendidik dan tenaga kependidikan dalam pelaksanaan pembelajaran',
  'Mengelola keuangan serta sarana dan prasarana sekolah secara transparan',
  'Mengembangkan kemitraan dengan dunia usaha dan dunia industri',
  'Menyelenggarakan penilaian dan evaluasi terhadap kinerja seluruh warga sekolah',
];

const KepalaSekolah: React.FC = () => {
  const [principal, setPrincipal] = useState<LeadershipEntry | null>(null);
  useEffect(() => {
    publicProfileApi.leadership().then(({ data }) => { if (data) setPrincipal(data.principal); });
  }, []);

  if (!principal) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Kepala Sekolah" subtitle="Profil pimpinan SMKN 11 Kabupaten Tangerang" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen', href: '/manajemen' }, { label: 'Kepala Sekolah' }]} />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <EmptyState message="Data kepala sekolah belum tersedia." />
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Kepala Sekolah"
        subtitle="Profil pimpinan SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen', href: '/manajemen' }, { label: 'Kepala Sekolah' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
          <div className="grid md:grid-cols-3">
            <PersonAvatar
              photo={principal.photo}
              name={principal.name}
              className="h-80 w-full object-cover md:h-full"
              iconClassName="h-20 w-20"
            />
            <div className="p-8 md:col-span-2 md:p-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#866D2C]">{formatLeadershipTitle(principal.title) || 'Manajemen'}</p>
              <h2 className="mt-2 text-2xl font-bold text-[#1B2A4A] md:text-4xl">{principal.name}</h2>
              {principal.position && <p className="mt-2 text-lg font-semibold text-[#23314D]">{principal.position}</p>}
              {principal.bio && (
                <p className="mt-6 max-w-3xl leading-relaxed text-[#23314D]">{principal.bio}</p>
              )}
              <Link
                to={`/profil/guru/${encodeURIComponent(principal.slug)}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-[#C8A951] transition-colors hover:bg-[#23314D]"
              >
                Profil Lengkap <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading title="Tugas dan Tanggung Jawab" subtitle="Beberapa tanggung jawab utama yang dijalankan oleh kepala sekolah" />
        <div className="grid gap-4 sm:grid-cols-2">
          {responsibilities.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#C8A951]" />
              <p className="font-medium text-[#23314D]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#1B2A4A] p-8 text-center text-[#FAF6F0] md:p-12">
          <h3 className="text-xl font-bold md:text-2xl">Kenali lebih dekat jajaran manajemen sekolah</h3>
          <p className="mx-auto mt-2 max-w-2xl text-[#F3E8D0]">Lihat siapa saja yang membantu kepala sekolah dalam memimpin SMKN 11 Kabupaten Tangerang.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/manajemen/wakil-kepala-sekolah" className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-5 py-2.5 font-bold text-[#1B2A4A] transition-colors hover:bg-[#B59640]">
              Wakil Kepala Sekolah <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/profil/struktur-organisasi" className="inline-flex items-center gap-2 rounded-lg border-2 border-[#FAF6F0] px-5 py-2.5 font-bold text-[#FAF6F0] transition-colors hover:bg-[#FAF6F0]/10">
              Struktur Organisasi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KepalaSekolah;
