import { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchKesemaptaanProfile, fetchKesemaptaanActivities, fetchKesemaptaanSchedules, fetchKesemaptaanInstructors, fetchKesemaptaanAchievements } from '../../lib/api';
import { defaultKesemaptaanProfile, defaultKesemaptaanActivities, defaultKesemaptaanSchedules, defaultKesemaptaanInstructors, defaultKesemaptaanAchievements } from '../../data/kesemaptaan';
import type { KesemaptaanProfile, KesemaptaanActivity, KesemaptaanSchedule, KesemaptaanInstructor, KesemaptaanAchievement } from '../../data/kesemaptaan';
import { CalendarDays, User, Trophy, Shield } from 'lucide-react';

const Kesemaptaan: React.FC = () => {
  const [profile, setProfile] = useState<KesemaptaanProfile>(defaultKesemaptaanProfile);
  const [activities, setActivities] = useState<KesemaptaanActivity[]>(defaultKesemaptaanActivities);
  const [schedules, setSchedules] = useState<KesemaptaanSchedule[]>(defaultKesemaptaanSchedules);
  const [instructors, setInstructors] = useState<KesemaptaanInstructor[]>(defaultKesemaptaanInstructors);
  const [achievements, setAchievements] = useState<KesemaptaanAchievement[]>(defaultKesemaptaanAchievements);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchKesemaptaanProfile(defaultKesemaptaanProfile),
      fetchKesemaptaanActivities(defaultKesemaptaanActivities),
      fetchKesemaptaanSchedules(defaultKesemaptaanSchedules),
      fetchKesemaptaanInstructors(defaultKesemaptaanInstructors),
      fetchKesemaptaanAchievements(defaultKesemaptaanAchievements),
    ]).then(([p, a, s, i, c]) => {
      if (!active) return;
      setProfile(p);
      setActivities(a.filter((item) => item.status === 'published'));
      setSchedules(s);
      setInstructors(i);
      setAchievements(c);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Kesemaptaan" subtitle="Pembinaan kedisiplinan, fisik, dan karakter siswa" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Kesemaptaan' }]} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Kesemaptaan SMKN 11 Kabupaten Tangerang"
        subtitle="Pembinaan kedisiplinan, kesamaptaan fisik, dan keterampilan baris-berbaris siswa"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Kesemaptaan' }]}
      />

      {/* Profil */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Profil Kesemaptaan" subtitle="Identitas dan pengantar program kesemaptaan" align="center" />
        <div className="mt-10 flex flex-col items-center gap-8 rounded-2xl border border-[#1B2A4A]/10 bg-white p-8 shadow-sm md:flex-row md:p-10">
          <div className="grid h-44 w-44 shrink-0 place-items-center rounded-2xl bg-[#1B2A4A] p-6 text-white">
            <Shield className="h-16 w-16 text-[#C8A951]" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#1B2A4A]">{profile.title}</h3>
            <p className="mt-4 leading-relaxed text-[#23314D]">{profile.description}</p>
          </div>
        </div>
      </section>

      {/* Program / Kegiatan */}
      <section className="bg-[#1B2A4A] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Program & Kegiatan" subtitle="Aktivitas kesamaptaan yang dijalankan sekolah" align="center" />
          {activities.length === 0 ? (
            <p className="mt-10 text-center text-[#F3E8D0]/70">Belum ada kegiatan yang dipublikasikan.</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <article key={activity.id} className="rounded-2xl bg-white/5 p-6 text-white backdrop-blur">
                  <h3 className="text-lg font-bold text-[#C8A951]">{activity.title}</h3>
                  {activity.activity_date && (
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#F3E8D0]">
                      <CalendarDays className="h-3.5 w-3.5" /> {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  <p className="mt-3 text-sm leading-6 text-[#F3E8D0]/90">{activity.description}</p>
                  {Array.isArray(activity.documentation) && activity.documentation.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {activity.documentation.map((url, i) => <img key={i} src={url} alt={`Dokumentasi ${i + 1}`} className="h-24 w-full rounded-lg object-cover" />)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Jadwal */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Jadwal Latihan" subtitle="Waktu dan tempat pelaksanaan kegiatan" align="center" />
        {schedules.length === 0 ? (
          <p className="mt-10 text-center text-[#5B7088]">Belum ada jadwal.</p>
        ) : (
          <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-4">Hari</th>
                  <th className="p-4">Jam</th>
                  <th className="p-4">Tempat</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-t border-[#1B2A4A]/10">
                    <td className="p-4 font-semibold">{s.day}</td>
                    <td className="p-4">{s.time}</td>
                    <td className="p-4">{s.place}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pembina / Instruktur */}
      <section className="bg-[#FAF6F0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Pembina & Instruktur" subtitle="Tim yang membimbing kegiatan kesamaptaan" align="center" />
          {instructors.length === 0 ? (
            <p className="mt-10 text-center text-[#5B7088]">Belum ada data pembina.</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {instructors.map((ins) => (
                <div key={ins.id} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#FAF6F0]">
                    {ins.photo ? <img src={ins.photo} alt={ins.name} className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-[#C8A951]" />}
                  </div>
                  <h4 className="font-bold text-[#1B2A4A]">{ins.name}</h4>
                  <p className="mt-1 text-sm font-semibold text-[#866D2C]">{ins.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Prestasi */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Prestasi" subtitle="Pencapaian tim kesamaptaan sekolah" align="center" />
        {achievements.length === 0 ? (
          <p className="mt-10 text-center text-[#5B7088]">Belum ada data prestasi.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <article key={a.id} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#C8A951]/20 text-[#866D2C]"><Trophy className="h-5 w-5" /></span>
                  <span className="rounded-full bg-[#1B2A4A] px-3 py-1 text-xs font-semibold text-white">{a.year}</span>
                </div>
                <h4 className="font-bold text-[#1B2A4A]">{a.name}</h4>
                <p className="mt-2 text-sm leading-6 text-[#23314D]">{a.description}</p>
                {Array.isArray(a.documentation) && a.documentation.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {a.documentation.map((doc, i) => <img key={i} src={doc} alt={`Dokumentasi ${i + 1}`} className="h-24 w-full rounded-lg object-cover" />)}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Kesemaptaan;