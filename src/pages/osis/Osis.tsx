import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchOsisProfile, fetchOsisMembers, fetchOsisActivities } from '../../lib/api';
import { defaultOsisProfile, defaultOsisMembers, defaultOsisActivities } from '../../data/osis';
import type { OsisProfile, OsisMember, OsisActivity } from '../../data/osis';
import { Users, CalendarDays, Award, Target, Sparkles } from 'lucide-react';
import logoSekolah from '../../assets/logo.png';

const positionOrder = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Ketua Bidang'];

const Osis: React.FC = () => {
  const [profile, setProfile] = useState<OsisProfile>(defaultOsisProfile);
  const [members, setMembers] = useState<OsisMember[]>(defaultOsisMembers);
  const [activities, setActivities] = useState<OsisActivity[]>(defaultOsisActivities);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchOsisProfile(defaultOsisProfile),
      fetchOsisMembers(defaultOsisMembers),
      fetchOsisActivities(defaultOsisActivities),
    ]).then(([p, m, a]) => {
      if (!active) return;
      setProfile(p);
      setMembers(m);
      setActivities(a.filter((item) => item.status === 'published'));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const sortedMembers = [...members].sort((a, b) => {
    const ia = positionOrder.indexOf(a.position);
    const ib = positionOrder.indexOf(b.position);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.sort_order - b.sort_order;
  });
  const leaders = sortedMembers.filter((m) => positionOrder.slice(0, 4).includes(m.position));
  const divisions = sortedMembers.filter((m) => !positionOrder.slice(0, 4).includes(m.position) || m.position === 'Ketua Bidang');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="OSIS" subtitle="Organisasi Siswa Intra Sekolah SMKN 11 Kabupaten Tangerang" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS' }]} />
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
      />

      {/* Profil OSIS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Profil OSIS" subtitle="Identitas dan pengantar organisasi siswa SMKN 11" align="center" />
        <div className="mt-10 flex flex-col items-center gap-8 rounded-2xl border border-[#1B2A4A]/10 bg-white p-8 shadow-sm md:flex-row md:p-10">
          <div className="grid h-44 w-44 shrink-0 place-items-center rounded-2xl bg-[#FAF6F0] p-4">
            {profile.logo ? (
              <img src={profile.logo} alt={profile.name} className="h-full w-full object-contain" />
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

      {/* Struktur OSIS */}
      <section id="struktur" className="bg-[#1B2A4A] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Struktur Organisasi" subtitle="Pengurus inti dan bidang OSIS SMKN 11" align="center" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map((member) => (
              <div key={member.id} className="rounded-2xl bg-white/5 p-6 text-center backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/10">
                <div className="mx-auto mb-4 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-[#C8A951]/60 bg-[#1B2A4A]/40">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-[#C8A951]" />
                  )}
                </div>
                <h4 className="font-bold text-white">{member.name}</h4>
                <p className="mt-1 text-sm font-semibold text-[#C8A951]">{member.position}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h4 className="mb-6 text-center text-lg font-bold text-[#F3E8D0]">Bidang / Seksi</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {divisions.map((member) => (
                <div key={member.id} className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#C8A951]/20">
                    {member.photo ? <img src={member.photo} alt={member.name} className="h-full w-full object-cover" /> : <Target className="h-5 w-5 text-[#C8A951]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{member.name}</p>
                    <p className="truncate text-sm text-[#F3E8D0]">{member.division || member.position}</p>
                  </div>
                </div>
              ))}
            </div>
            {divisions.length === 0 && (
              <p className="text-center text-sm text-[#F3E8D0]/70">Belum ada data bidang/seksi.</p>
            )}
          </div>
        </div>
      </section>

      {/* Kegiatan OSIS */}
      <section id="kegiatan" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Kegiatan OSIS" subtitle="Aktivitas dan program yang dijalankan oleh OSIS SMKN 11" align="center" />
        {activities.length === 0 ? (
          <div className="mt-10 py-16 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Belum ada kegiatan yang dipublikasikan</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <article key={activity.id} className="group overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  {activity.photo ? (
                    <img src={activity.photo} alt={activity.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
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

export default Osis;
