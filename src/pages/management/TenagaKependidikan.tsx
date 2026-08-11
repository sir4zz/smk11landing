import React, { useEffect, useMemo, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import type { EducationStaff } from '../../lib/content-types';
import { fetchPublicContent } from '../../lib/api';
import { PersonAvatar, EmptyState } from './ManagementShared';

const TenagaKependidikan: React.FC = () => {
  const [items, setItems] = useState<EducationStaff[]>([]);
  useEffect(() => {
    fetchPublicContent<EducationStaff[]>('educationStaff').then(setItems);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, EducationStaff[]>();
    items.forEach((member) => {
      const key = member.department || 'Lainnya';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(member);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Tenaga Kependidikan"
        subtitle="Staf yang mendukung kelancaran operasional dan layanan SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen', href: '/manajemen' }, { label: 'Tenaga Kependidikan' }]}
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
                  <div key={member.id} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                    <PersonAvatar photo={member.photo} name={member.name} className="mx-auto h-24 w-24 rounded-full object-cover" iconClassName="h-12 w-12" />
                    <h4 className="mt-4 font-bold text-[#1B2A4A]">{member.name}</h4>
                    <p className="mt-1 text-sm font-medium text-[#23314D]">{member.position}</p>
                  </div>
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
