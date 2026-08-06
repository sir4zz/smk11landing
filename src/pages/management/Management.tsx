import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { staffData, type Staff } from '../../data/staff';
import { teacherActivities, type TeacherActivity } from '../../data/teacherActivities';
import { educationStaff, type EducationStaff } from '../../data/educationStaff';
import { fetchPublicContent, resolveImageUrl } from '../../lib/api';
import { ArrowRight, Briefcase, CalendarDays, Network, User, Users } from 'lucide-react';
import { PersonAvatar, formatDate } from './ManagementShared';

const sections = [
  { label: 'Kepala Sekolah', href: '/manajemen/kepala-sekolah', icon: User },
  { label: 'Wakil Kepala Sekolah', href: '/manajemen/wakil-kepala-sekolah', icon: Users },
  { label: 'Kegiatan Guru', href: '/manajemen/kegiatan-guru', icon: CalendarDays },
  { label: 'Tenaga Kependidikan', href: '/manajemen/tenaga-kependidikan', icon: Briefcase },
  { label: 'Struktur Manajemen', href: '/manajemen/struktur-manajemen', icon: Network },
];

const Management: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>(staffData);
  const [activities, setActivities] = useState<TeacherActivity[]>(teacherActivities);
  const [educationStaffList, setEducationStaffList] = useState<EducationStaff[]>(educationStaff);
  useEffect(() => {
    fetchPublicContent('staff', staffData).then(setStaff);
    fetchPublicContent('teacherActivities', teacherActivities).then(setActivities);
    fetchPublicContent('educationStaff', educationStaff).then(setEducationStaffList);
  }, []);

  const principal = staff.find((item) => item.position === 'Kepala Sekolah');
  const latestActivities = activities.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Manajemen Sekolah"
        subtitle="Informasi tentang jajaran pimpinan, pendidik, dan tenaga kependidikan SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Manajemen' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                to={section.href}
                className="group rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2A4A] text-[#C8A951] transition-colors group-hover:bg-[#C8A951] group-hover:text-[#1B2A4A]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1B2A4A]">{section.label}</h3>
              </Link>
            );
          })}
        </div>
      </section>

      {principal && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-[#1B2A4A] shadow-lg">
            <div className="grid md:grid-cols-3">
              <PersonAvatar
                photo={principal.photo}
                name={principal.name}
                className="h-64 w-full object-cover md:h-full"
                iconClassName="h-16 w-16"
              />
              <div className="p-8 text-[#FAF6F0] md:col-span-2 md:p-12">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#C8A951]">Kepala Sekolah</p>
                <h2 className="mt-2 text-2xl font-bold md:text-3xl">{principal.name}</h2>
                {principal.description && (
                  <p className="mt-4 max-w-2xl leading-relaxed text-[#F3E8D0]">{principal.description}</p>
                )}
                <Link
                  to="/manajemen/kepala-sekolah"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-5 py-2.5 font-bold text-[#1B2A4A] transition-colors hover:bg-[#B59640]"
                >
                  Profil Kepala Sekolah <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {latestActivities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="Kegiatan Guru" subtitle="Agenda terbaru para pendidik SMKN 11" />
            <Link to="/manajemen/kegiatan-guru" className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C] hover:text-[#1B2A4A]">
              Semua kegiatan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latestActivities.map((activity) => (
              <div key={activity.id} className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={resolveImageUrl(activity.photo)} alt={activity.title} className="h-full w-full object-cover" />
                  <span className="absolute right-3 top-3 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-semibold text-[#1B2A4A]">{activity.category}</span>
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold text-[#866D2C]">{formatDate(activity.date)}</p>
                  <h3 className="mt-1 mb-2 text-lg font-bold text-[#1B2A4A]">{activity.title}</h3>
                  <p className="text-sm font-medium text-[#23314D] line-clamp-3">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {educationStaffList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="Tenaga Kependidikan" subtitle={`${educationStaffList.length} staf yang mendukung operasional sekolah`} />
            <Link to="/manajemen/tenaga-kependidikan" className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C] hover:text-[#1B2A4A]">
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {educationStaffList.slice(0, 4).map((member) => (
              <div key={member.id} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <PersonAvatar photo={member.photo} name={member.name} className="mx-auto h-20 w-20 rounded-full object-cover" iconClassName="h-10 w-10" />
                <h3 className="mt-4 font-bold text-[#1B2A4A]">{member.name}</h3>
                <p className="mt-1 text-sm text-[#23314D]">{member.position}</p>
                <span className="mt-3 inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{member.department}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Management;
