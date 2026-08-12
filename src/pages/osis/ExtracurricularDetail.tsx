import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchExtracurricularBySlug } from '../../lib/api';
import type { ExtracurricularRecord } from './Extracurriculars';
import { User, Clock, MapPin, Trophy, ChevronLeft, ImageIcon } from 'lucide-react';

const ExtracurricularDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<ExtracurricularRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchExtracurricularBySlug<ExtracurricularRecord>(slug ?? '').then((data) => {
      if (!active) return;
      setItem(data);
      setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Ekstrakurikuler" subtitle="Detail kegiatan ekstrakurikuler" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler', href: '/osis/ekstrakurikuler' }]} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={item.name}
        subtitle={item.category}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler', href: '/osis/ekstrakurikuler' }, { label: item.name }]}
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <Link to="/osis/ekstrakurikuler" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C] hover:text-[#C8A951]">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Ekstrakurikuler
        </Link>

        <div className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
          <div className="h-72 w-full overflow-hidden bg-[#FAF6F0] sm:h-80">
            {item.photo ? (
              <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center"><ImageIcon className="h-16 w-16 text-[#C8A951]/40" /></div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <span className="mb-3 inline-block rounded-full bg-[#FAF6F0] px-4 py-1.5 text-sm font-semibold text-[#866D2C]">{item.category}</span>
            <p className="leading-relaxed text-[#23314D]">{item.description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-1">
              <InfoRow icon={<User className="h-4 w-4" />} label="Pembina" value={item.advisor} />
              <InfoRow icon={<Clock className="h-4 w-4" />} label="Jadwal Latihan" value={item.schedule} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Tempat" value={item.place} />
            </div>

            {Array.isArray(item.achievements) && item.achievements.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><Trophy className="h-5 w-5 text-[#C8A951]" /> Prestasi</h3>
                <ul className="space-y-2">
                  {item.achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#23314D]"><Trophy className="mt-0.5 h-4 w-4 shrink-0 text-[#866D2C]" /> {typeof a === 'string' ? a : String(a)}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(item.documentation) && item.documentation.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><ImageIcon className="h-5 w-5 text-[#C8A951]" /> Dokumentasi</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {item.documentation.map((url, i) => (
                    <img key={i} src={url} alt={`Dokumentasi ${i + 1}`} loading="lazy" className="h-40 w-full rounded-xl object-cover" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#FAF6F0] p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#C8A951]/20 text-[#866D2C]">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-[#5B7088]">{label}</p>
        <p className="font-semibold text-[#1B2A4A]">{value || '-'}</p>
      </div>
      <span className="ml-auto rounded-full bg-[#C8A951]/20 px-3 py-1 text-xs font-semibold text-[#866D2C]">{label}</span>
    </div>
  );
}

export default ExtracurricularDetail;
