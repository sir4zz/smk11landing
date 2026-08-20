import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { usePageBanner } from '../../lib/usePageBanner';
import { fetchOsisMembers, resolveImageUrl } from '../../lib/api';
import type { OsisMember } from '../../lib/content-types';
import { Users, Target } from 'lucide-react';

const positionOrder = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Ketua Bidang'];

const OsisStruktur: React.FC = () => {
  const { backgroundImage } = usePageBanner('osis_struktur');
  const [members, setMembers] = useState<OsisMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOsisMembers<OsisMember[]>().then((data) => {
      if (!active) return;
      setMembers(data);
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
        <PageHero title="Struktur OSIS" subtitle="Pengurus inti dan bidang OSIS SMKN 11 Kabupaten Tangerang" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Struktur OSIS' }]} backgroundImage={backgroundImage} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Struktur OSIS"
        subtitle="Pengurus inti dan bidang OSIS SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Struktur OSIS' }]}
        backgroundImage={backgroundImage}
      />

      <section className="bg-[#1B2A4A] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Struktur Organisasi" subtitle="Pengurus inti dan bidang OSIS SMKN 11" align="center" variant="light" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map((member) => (
              <div key={String(member.id)} className="rounded-2xl bg-white/5 p-6 text-center backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/10">
                <div className="mx-auto mb-4 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-[#C8A951]/60 bg-[#1B2A4A]/40">
                  {member.photo && resolveImageUrl(member.photo) ? (
                    <img src={resolveImageUrl(member.photo)!} alt={member.name} loading="lazy" className="h-full w-full object-cover" />
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
                <div key={String(member.id)} className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#C8A951]/20">
                    {member.photo && resolveImageUrl(member.photo) ? <img src={resolveImageUrl(member.photo)!} alt={member.name} loading="lazy" className="h-full w-full object-cover" /> : <Target className="h-5 w-5 text-[#C8A951]" />}
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
    </div>
  );
};

export default OsisStruktur;
