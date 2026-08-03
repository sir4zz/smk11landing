import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { staffData, type Staff } from '../../data/staff';
import { fetchPublicContent } from '../../lib/api';
import { PersonAvatar, EmptyState } from './ManagementShared';

const WakilKepalaSekolah: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>(staffData);
  useEffect(() => {
    fetchPublicContent('staff', staffData).then(setStaff);
  }, []);

  const vicePrincipals = staff.filter((item) => item.position.startsWith('Wakil'));

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Wakil Kepala Sekolah"
        subtitle="Jajaran wakil kepala sekolah beserta bidang tugasnya di SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen', href: '/manajemen' }, { label: 'Wakil Kepala Sekolah' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Wakil Kepala Sekolah"
          subtitle="Wakil kepala sekolah membantu kepala sekolah dalam mengelola bidang kurikulum, kesiswaan, sarana prasarana, serta humas dan hubungan industri"
          align="center"
        />

        {vicePrincipals.length === 0 ? (
          <EmptyState message="Belum ada data wakil kepala sekolah." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {vicePrincipals.map((vp) => (
              <div key={vp.id} className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <PersonAvatar photo={vp.photo} name={vp.name} className="h-52 w-full object-cover" iconClassName="h-14 w-14" />
                <div className="p-6 text-center">
                  <span className="inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{vp.department}</span>
                  <h3 className="mt-3 text-lg font-bold text-[#1B2A4A]">{vp.name}</h3>
                  <p className="mt-1 text-sm font-medium text-[#23314D]">{vp.position}</p>
                  {vp.description && <p className="mt-3 text-sm leading-relaxed text-[#23314D]">{vp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default WakilKepalaSekolah;
