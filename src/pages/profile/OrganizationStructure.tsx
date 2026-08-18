import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { User } from 'lucide-react';
import type { Staff } from '../../lib/content-types';
import { fetchPublicContent, publicProfileApi, resolveImageUrl, type PublicDirectoryEntry } from '../../lib/api';
import { PersonAvatar, EmptyState } from '../management/ManagementShared';

interface Person {
  name: string;
  position: string;
  department?: string;
  photo?: string;
}

const Fallback: React.FC<{ photo?: string; size?: 'lg' | 'md'; alt: string }> = ({ photo, size = 'md', alt }) => (
  <div className={`mx-auto mb-4 ${size === 'lg' ? 'h-32 w-32' : 'h-24 w-24'} flex items-center justify-center overflow-hidden rounded-full bg-[#1B2A4A] text-white ${size === 'lg' ? 'border-4 border-[#C8A951]' : 'border-4 border-[#FAF6F0]'} shadow-sm`}>
    {resolveImageUrl(photo) ? <img src={resolveImageUrl(photo)} alt={alt} className="h-full w-full object-cover" /> : <User size={size === 'lg' ? 56 : 40} />}
  </div>
);

const OrganizationStructure: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [gurus, setGurus] = useState<PublicDirectoryEntry[]>([]);
  useEffect(() => {
    void fetchPublicContent<Staff[]>('staff').then(setStaff);
    publicProfileApi.directory().then(({ data }) => { if (data) setGurus(data.gurus); });
  }, []);

  const guruPeople: Person[] = gurus.map((g) => ({
    name: g.name,
    position: g.position || g.subject || 'Guru',
    department: g.position?.startsWith('Kepala Program') ? g.subject || g.position : g.subject || undefined,
    photo: g.photo,
  }));

  const staffPeople: Person[] = staff.map((s) => ({ name: s.name, position: s.position, department: s.department, photo: s.photo }));
  const allPeople = [...guruPeople, ...staffPeople];
  const dedupe = (list: Person[]) => {
    const seen = new Set<string>();
    return list.filter((p) => { const key = p.name.trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
  };

  const principal = allPeople.find((p) => p.position === 'Kepala Sekolah');
  const vicePrincipals = dedupe(allPeople.filter((p) => p.position.startsWith('Wakil')));
  const departmentHeads = dedupe(allPeople.filter((p) => p.position.startsWith('Kepala Program')));
  const teachers = dedupe(
    guruPeople.filter((p) => p.position !== 'Kepala Sekolah' && !p.position.startsWith('Wakil') && !p.position.startsWith('Kepala Program'))
  );

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
              <div className="w-full max-w-sm rounded-2xl bg-[#1B2A4A] p-8 text-center text-[#FAF6F0] shadow-lg">
                <PersonAvatar
                  photo={principal.photo}
                  name={principal.name}
                  className="mx-auto h-28 w-28 rounded-full border-4 border-[#C8A951] object-cover"
                  iconClassName="h-14 w-14"
                />
                <h3 className="mt-4 text-xl font-bold">{principal.name}</h3>
                <p className="mt-1 font-medium text-[#C8A951]">{principal.position}</p>
              </div>
            </div>

            {/* Connector */}
            <div className="mx-auto mb-10 hidden h-10 w-px bg-[#1B2A4A]/30 md:block" />

            {/* Vice Principals */}
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-[#1B2A4A] px-4 py-1.5 text-sm font-bold text-[#FAF6F0]">Wakil Kepala Sekolah</span>
            </div>
            <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {vicePrincipals.map((vp) => (
                <div key={vp.name} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <PersonAvatar photo={vp.photo} name={vp.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#FAF6F0] object-cover shadow-sm" iconClassName="h-12 w-12" />
                  <h4 className="mt-4 text-lg font-bold text-[#1B2A4A]">{vp.name}</h4>
                  <p className="mt-1 text-sm font-medium text-[#23314D]">{vp.position}</p>
                  {vp.department && <p className="mt-3 text-xs leading-relaxed text-[#23314D]">{vp.department}</p>}
                </div>
              ))}
            </div>

            {/* Connector */}
            <div className="mx-auto mb-10 hidden h-10 w-px bg-[#1B2A4A]/30 md:block" />

            {/* Department heads */}
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-[#1B2A4A] px-4 py-1.5 text-sm font-bold text-[#FAF6F0]">Kepala Program Keahlian</span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {departmentHeads.map((head) => (
                <div key={head.name} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <PersonAvatar photo={head.photo} name={head.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#FAF6F0] object-cover shadow-sm" iconClassName="h-12 w-12" />
                  {head.department && <span className="mt-3 inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{head.department}</span>}
                  <h4 className="mt-3 text-base font-bold text-[#1B2A4A]">{head.name}</h4>
                  <p className="mt-1 text-xs font-medium text-[#23314D]">{head.position}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Teachers / Gurus */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-10 pb-4">Guru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {teachers.map((head, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <Fallback photo={head.photo} alt={head.name} />
                {head.department && <span className="inline-block px-3 py-1 bg-[#FAF6F0] text-[#1B2A4A] text-xs font-bold rounded-full mb-3">{head.department}</span>}
                <h4 className="font-bold text-[#1B2A4A] text-base mb-1">{head.name}</h4>
                <p className="text-gray-600 text-xs">{head.position}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrganizationStructure;
