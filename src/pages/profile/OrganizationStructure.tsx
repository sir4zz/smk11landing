import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { User } from 'lucide-react';
import { publicProfileApi, resolveImageUrl, type Leadership, type PublicDirectoryEntry } from '../../lib/api';
import { PersonAvatar, EmptyState, formatLeadershipTitle } from '../management/ManagementShared';

interface Person {
  slug: string;
  name: string;
  position: string;
  department?: string;
  photo?: string;
}

const Fallback: React.FC<{ photo?: string; size?: 'lg' | 'md'; alt: string }> = ({ photo, size = 'md', alt }) => (
  <div className={`mx-auto mb-4 ${size === 'lg' ? 'h-32 w-32' : 'h-24 w-24'} flex items-center justify-center overflow-hidden rounded-full bg-[#1B2A4A] text-white ${size === 'lg' ? 'border-4 border-[#C8A951]' : 'border-4 border-[#FAF6F0]'} shadow-sm`}>
    {resolveImageUrl(photo) ? <img src={resolveImageUrl(photo)} alt={alt} className="h-full w-full object-cover object-top" /> : <User size={size === 'lg' ? 56 : 40} />}
  </div>
);

const OrganizationStructure: React.FC = () => {
  const [leadership, setLeadership] = useState<Leadership | null>(null);
  const [gurus, setGurus] = useState<PublicDirectoryEntry[]>([]);
  const [tendiks, setTendiks] = useState<PublicDirectoryEntry[]>([]);
  useEffect(() => {
    publicProfileApi.leadership().then(({ data }) => { if (data) setLeadership(data); });
    publicProfileApi.directory().then(({ data }) => { if (data) { setGurus(data.gurus); setTendiks(data.tendiks); } });
  }, []);

  const principal = leadership?.principal ?? null;
  const vicePrincipals = leadership?.vice_principals ?? [];
  const programHeads = leadership?.program_heads ?? [];

  const leadershipSlugs = new Set<string>([
    ...(principal ? [principal.slug] : []),
    ...vicePrincipals.map((v) => v.slug),
    ...programHeads.map((h) => h.slug),
  ]);

  const teachers: Person[] = gurus
    .filter((g) => !leadershipSlugs.has(g.slug))
    .map((g) => ({
      slug: g.slug,
      name: g.name,
      position: g.position || g.subject || 'Guru',
      department: g.subject || undefined,
      photo: g.photo,
    }));

  const staff: Person[] = tendiks.map((t) => ({
    slug: t.slug,
    name: t.name,
    position: t.position || t.subject || 'Tenaga Kependidikan',
    department: (t as unknown as { kategori?: string }).kategori || undefined,
    photo: t.photo,
  }));

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Struktur Organisasi"
        subtitle="Jajaran pimpinan, pengelola, dan guru SMKN 11 Kabupaten Tangerang"
        backgroundImage="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1600&q=80"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Profil', href: '/profil' }, { label: 'Struktur Organisasi' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Bagan Struktur Manajemen"
          subtitle="Tata kelola sekolah dimulai dari kepala sekolah, dibantu wakil kepala sekolah, hingga kepala program keahlian"
          align="center"
        />

        {!principal ? (
          <EmptyState message="Data struktur organisasi belum tersedia." />
        ) : (
          <>
            {/* Principal */}
            <div className="mb-10 flex justify-center">
              <Link to={`/profil/guru/${encodeURIComponent(principal.slug)}`} className="w-full max-w-sm rounded-2xl bg-[#1B2A4A] p-8 text-center text-[#FAF6F0] shadow-lg transition-transform hover:-translate-y-1">
                <PersonAvatar
                  photo={principal.photo}
                  name={principal.name}
                  className="mx-auto h-28 w-28 rounded-full border-4 border-[#C8A951] object-cover object-top"
                  iconClassName="h-14 w-14"
                />
                <h3 className="mt-4 text-xl font-bold">{principal.name}</h3>
                <p className="mt-1 font-medium text-[#C8A951]">{formatLeadershipTitle(principal.title) || principal.position}</p>
              </Link>
            </div>

            {/* Connector */}
            <div className="mx-auto mb-10 hidden h-10 w-px bg-[#1B2A4A]/30 md:block" />

            {/* Vice Principals */}
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-[#1B2A4A] px-4 py-1.5 text-sm font-bold text-[#FAF6F0]">Wakil Kepala Sekolah</span>
            </div>
            <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {vicePrincipals.map((vp) => (
                <Link key={vp.slug} to={`/profil/guru/${encodeURIComponent(vp.slug)}`} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <PersonAvatar photo={vp.photo} name={vp.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#FAF6F0] object-cover object-top shadow-sm" iconClassName="h-12 w-12" />
                  <h4 className="mt-4 text-lg font-bold text-[#1B2A4A]">{vp.name}</h4>
                  <p className="mt-1 text-sm font-medium text-[#23314D]">{formatLeadershipTitle(vp.title)}</p>
                </Link>
              ))}
            </div>

            {/* Connector */}
            <div className="mx-auto mb-10 hidden h-10 w-px bg-[#1B2A4A]/30 md:block" />

            {/* Department heads */}
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-[#1B2A4A] px-4 py-1.5 text-sm font-bold text-[#FAF6F0]">Kepala Program Keahlian</span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programHeads.map((head) => (
                <Link key={head.slug} to={`/profil/guru/${encodeURIComponent(head.slug)}`} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <PersonAvatar photo={head.photo} name={head.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#FAF6F0] object-cover object-top shadow-sm" iconClassName="h-12 w-12" />
                  <h4 className="mt-3 text-base font-bold text-[#1B2A4A]">{head.name}</h4>
                  <p className="mt-1 text-xs font-medium text-[#23314D]">{formatLeadershipTitle(head.title)}</p>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Teachers / Gurus */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-10 pb-4">Guru</h2>
          {teachers.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada data guru.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {teachers.map((head, index) => (
                <Link key={head.slug || index} to={`/profil/guru/${encodeURIComponent(head.slug)}`} className="bg-white rounded-lg p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <Fallback photo={head.photo} alt={head.name} />
                  {head.department && <span className="inline-block px-3 py-1 bg-[#FAF6F0] text-[#1B2A4A] text-xs font-bold rounded-full mb-3">{head.department}</span>}
                  <h4 className="font-bold text-[#1B2A4A] text-base mb-1">{head.name}</h4>
                  <p className="text-gray-600 text-xs">{head.position}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Staff / Tenaga Kependidikan */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-10 pb-4">Tenaga Kependidikan</h2>
          {staff.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada data tenaga kependidikan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {staff.map((member, index) => (
                <Link key={member.slug || index} to={`/profil/tendik/${encodeURIComponent(member.slug)}`} className="bg-white rounded-lg p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <Fallback photo={member.photo} alt={member.name} />
                  <h4 className="font-bold text-[#1B2A4A] text-base mb-1">{member.name}</h4>
                  <p className="text-gray-600 text-xs">{member.position}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OrganizationStructure;