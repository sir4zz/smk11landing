import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { publicProfileApi, type PublicDirectoryEntry } from '../../lib/api';
import { usePageBanner } from '../../lib/usePageBanner';
import { PersonAvatar, EmptyState } from './ManagementShared';

interface DisplayMember {
  id: string;
  slug: string;
  role: 'guru' | 'tendik';
  name: string;
  position: string;
  department: string;
  photo: string;
}

const DEPT_KEAMANAN = 'Keamanan';
const DEPT_PRAMUBAKTI = 'Pramubakti & Pramusaji';
const DEPT_TENDIK = 'Tenaga Kependidikan';

function classifyTendik(entry: PublicDirectoryEntry): string {
  const k = (entry as Record<string, unknown>).kategori as string | undefined;
  if (k === 'keamanan') return DEPT_KEAMANAN;
  if (k === 'pramubakti') return DEPT_PRAMUBAKTI;
  return DEPT_TENDIK;
}

const TenagaKependidikan: React.FC = () => {
  const { backgroundImage } = usePageBanner('manajemen_tendik');
  const [gurus, setGurus] = useState<PublicDirectoryEntry[]>([]);
  const [tendiks, setTendiks] = useState<PublicDirectoryEntry[]>([]);
  useEffect(() => {
    publicProfileApi.directory().then(({ data }) => {
      if (!data) return;
      setGurus(data.gurus);
      setTendiks(data.tendiks);
    });
  }, []);

  const grouped = useMemo(() => {
    const guruMembers: DisplayMember[] = gurus.map((g) => ({
      id: g.slug,
      slug: g.slug,
      role: 'guru',
      name: g.name,
      position: g.position || g.subject || 'Guru',
      department: 'Guru',
      photo: g.photo,
    }));

    const tendikMembers: DisplayMember[] = tendiks.map((t) => ({
      id: t.slug,
      slug: t.slug,
      role: 'tendik',
      name: t.name,
      position: t.position || t.subject || 'Tenaga Kependidikan',
      department: classifyTendik(t),
      photo: t.photo,
    }));

    const all = [...guruMembers, ...tendikMembers];
    const map = new Map<string, DisplayMember[]>();
    all.forEach((member) => {
      const key = member.department;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(member);
    });

    const order = ['Guru', DEPT_TENDIK, DEPT_PRAMUBAKTI, DEPT_KEAMANAN];
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [gurus, tendiks]);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Tenaga Kependidikan"
        subtitle="Staf yang mendukung kelancaran operasional dan layanan SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen', href: '/manajemen' }, { label: 'Tenaga Kependidikan' }]}
        backgroundImage={backgroundImage}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Tenaga Kependidikan"
          subtitle="Seluruh tenaga kependidikan berperan penting dalam mendukung pelayanan terbaik bagi murid dan orang tua"
          align="center"
        />

        {grouped.length === 0 ? (
          <EmptyState message="Belum ada data tenaga kependidikan." />
        ) : (
          grouped.map(([department, members]) => (
            <div key={department} className="mb-12">
              <h3 className="mb-6 text-center text-xl font-bold text-[#1B2A4A] md:text-2xl">{department}</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {members.map((member) => (
                  <Link key={member.id} to={`/profil/${member.role}/${encodeURIComponent(member.slug)}`} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                    <PersonAvatar photo={member.photo} name={member.name} className="mx-auto h-24 w-24 rounded-full object-cover" iconClassName="h-12 w-12" />
                    <h4 className="mt-4 font-bold text-[#1B2A4A]">{member.name}</h4>
                    <p className="mt-1 text-sm font-medium text-[#23314D]">{member.position}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default TenagaKependidikan;
