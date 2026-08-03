import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { staffData, type Staff } from '../../data/staff';
import { fetchPublicContent } from '../../lib/api';
import { PersonAvatar, EmptyState } from './ManagementShared';

const StrukturManajemen: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>(staffData);
  useEffect(() => {
    fetchPublicContent('staff', staffData).then(setStaff);
  }, []);

  const principal = staff.find((item) => item.position === 'Kepala Sekolah');
  const vicePrincipals = staff.filter((item) => item.position.startsWith('Wakil'));
  const departmentHeads = staff.filter((item) => item.position.startsWith('Kepala Program'));

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Struktur Manajemen"
        subtitle="Bagan struktur manajemen SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen', href: '/manajemen' }, { label: 'Struktur Manajemen' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Bagan Struktur Manajemen"
          subtitle="Tata kelola sekolah dimulai dari kepala sekolah, dibantu wakil kepala sekolah, hingga kepala program keahlian"
          align="center"
        />

        {!principal ? (
          <EmptyState message="Data struktur manajemen belum tersedia." />
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
                <div key={vp.id} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <PersonAvatar photo={vp.photo} name={vp.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#FAF6F0] object-cover shadow-sm" iconClassName="h-12 w-12" />
                  <h4 className="mt-4 text-lg font-bold text-[#1B2A4A]">{vp.name}</h4>
                  <p className="mt-1 text-sm font-medium text-[#23314D]">{vp.position}</p>
                  {vp.description && <p className="mt-3 text-xs leading-relaxed text-[#23314D]">{vp.description}</p>}
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
                <div key={head.id} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <PersonAvatar photo={head.photo} name={head.name} className="mx-auto h-24 w-24 rounded-full border-4 border-[#FAF6F0] object-cover shadow-sm" iconClassName="h-12 w-12" />
                  <span className="mt-3 inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{head.department}</span>
                  <h4 className="mt-3 text-base font-bold text-[#1B2A4A]">{head.name}</h4>
                  <p className="mt-1 text-xs font-medium text-[#23314D]">{head.position}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default StrukturManajemen;
