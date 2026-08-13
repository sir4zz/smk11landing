import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchOsisActivities, resolveImageUrl } from '../../lib/api';
import type { OsisActivity } from '../../lib/content-types';
import { Award, CalendarDays, Sparkles } from 'lucide-react';

const OsisKegiatan: React.FC = () => {
  const [activities, setActivities] = useState<OsisActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOsisActivities<OsisActivity[]>().then((data) => {
      if (!active) return;
      setActivities(data.filter((item) => item.status === 'published'));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Kegiatan OSIS" subtitle="Aktivitas dan program yang dijalankan oleh OSIS SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Kegiatan OSIS' }]} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Kegiatan OSIS"
        subtitle="Aktivitas dan program yang dijalankan oleh OSIS SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Kegiatan OSIS' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Kegiatan OSIS" subtitle="Aktivitas dan program yang dijalankan oleh OSIS SMKN 11" align="center" />
        {activities.length === 0 ? (
          <div className="mt-10 py-16 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Belum ada kegiatan yang dipublikasikan</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <article key={String(activity.id)} className="group overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  {activity.photo && resolveImageUrl(activity.photo) ? (
                    <img src={resolveImageUrl(activity.photo)!} alt={activity.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[#FAF6F0]"><Award className="h-12 w-12 text-[#C8A951]/40" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/70 to-transparent" />
                </div>
                <div className="p-6">
                  {activity.activity_date && (
                    <span className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[#866D2C]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-[#1B2A4A]">{activity.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#23314D]">{activity.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OsisKegiatan;
