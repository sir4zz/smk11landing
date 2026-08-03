import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { teacherActivities, type TeacherActivity } from '../../data/teacherActivities';
import { fetchPublicContent } from '../../lib/api';
import { Calendar, CalendarDays } from 'lucide-react';
import { EmptyState, formatDate } from './ManagementShared';

const KegiatanGuru: React.FC = () => {
  const [items, setItems] = useState<TeacherActivity[]>(teacherActivities);
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  useEffect(() => {
    fetchPublicContent('teacherActivities', teacherActivities).then(setItems);
  }, []);

  const categories = ['Semua', ...new Set(items.map((item) => item.category).filter(Boolean))];

  const filtered = filterCategory === 'Semua' ? items : items.filter((item) => item.category === filterCategory);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Kegiatan Guru"
        subtitle="Agenda dan kegiatan para pendidik SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen', href: '/manajemen' }, { label: 'Kegiatan Guru' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Agenda Kegiatan Guru"
          subtitle="Workshop, pelatihan, rapat, dan kegiatan lain yang diikuti oleh guru-guru SMKN 11"
          align="center"
        />

        {categories.length > 1 && (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filterCategory === category
                    ? 'bg-[#1B2A4A] text-[#FAF6F0]'
                    : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState message="Tidak ada kegiatan guru yang ditemukan." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((activity) => (
              <div key={activity.id} className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-48 w-full overflow-hidden">
                  <img src={activity.photo} alt={activity.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/70 to-transparent" />
                  <span className="absolute right-3 top-3 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-semibold text-[#1B2A4A]">{activity.category}</span>
                </div>
                <div className="p-6">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#866D2C]">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(activity.date)}
                  </p>
                  <h3 className="mt-2 mb-2 text-lg font-bold text-[#1B2A4A]">{activity.title}</h3>
                  <p className="text-sm font-medium leading-6 text-[#23314D] line-clamp-3">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-[#1B2A4A] p-8 text-center text-[#FAF6F0]">
          <CalendarDays className="mx-auto h-8 w-8 text-[#C8A951]" />
          <h3 className="mt-3 text-xl font-bold">Ikuti perkembangan kegiatan guru</h3>
          <p className="mx-auto mt-2 max-w-2xl text-[#F3E8D0]">Kegiatan pengembangan profesional guru terus diadakan untuk meningkatkan mutu pembelajaran di SMKN 11 Kabupaten Tangerang.</p>
        </div>
      </section>
    </div>
  );
};

export default KegiatanGuru;
