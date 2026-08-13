import { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchExtracurriculars, resolveImageUrl } from '../../lib/api';
import { User, Clock, Link } from 'lucide-react';

export interface ExtracurricularRecord {
  id?: string;
  name: string;
  slug?: string;
  category: string;
  description: string;
  photo: string;
  advisor: string;
  schedule: string;
  place: string;
  achievements: string[];
  documentation: string[];
  status: string;
}


const Extracurriculars: React.FC = () => {
  const [items, setItems] = useState<ExtracurricularRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');

  useEffect(() => {
    let active = true;
    fetchExtracurriculars<ExtracurricularRecord[]>().then((data) => {
      if (!active) return;
      setItems(data.filter((item) => item.status === 'published'));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const categories = ['Semua', ...new Set(items.map((e) => e.category))];
  const filtered = filter === 'Semua' ? items : items.filter((e) => e.category === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Ekstrakurikuler" subtitle="Wadah pengembangan bakat, minat, dan karakter siswa" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler' }]} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Ekstrakurikuler"
        subtitle="Wadah pengembangan bakat, minat, dan karakter siswa di luar jam pelajaran"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Pilihan Ekstrakurikuler" subtitle="Temukan wadah yang sesuai dengan minat dan bakatmu" align="center" />

        <div className="mb-12 mt-8 flex flex-wrap justify-center gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                filter === cat ? 'bg-[#1B2A4A] text-[#FAF6F0]' : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Tidak ada ekstrakurikuler yang ditemukan</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {filtered.map((ekskul) => (
              <a
                key={ekskul.id ?? ekskul.name}
                href={`/osis/ekstrakurikuler/${ekskul.slug ?? ekskul.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:flex-row"
              >
                <div className="h-48 w-full flex-shrink-0 overflow-hidden sm:h-auto sm:w-56">
                  {ekskul.photo && resolveImageUrl(ekskul.photo) ? (
                    <img src={resolveImageUrl(ekskul.photo)!} alt={ekskul.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[#FAF6F0]" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <span className="mb-2 inline-block w-fit rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{ekskul.category}</span>
                  <h3 className="mb-2 text-xl font-bold text-[#1B2A4A]">{ekskul.name}</h3>
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[#23314D]">{ekskul.description}</p>
                  <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#23314D]">
                    {ekskul.advisor && (
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#C8A951]" /> {ekskul.advisor}</span>
                    )}
                    {ekskul.schedule && (
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#C8A951]" /> {ekskul.schedule}</span>
                    )}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]">
                    Lihat Detail <Link className="h-3.5 w-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Extracurriculars;
