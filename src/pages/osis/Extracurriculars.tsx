import { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchExtracurriculars, resolveImageUrl } from '../../lib/api';
import { User, Clock, ChevronRight, ImageIcon } from 'lucide-react';

export interface ExtracurricularRecord {
  id?: string;
  name: string;
  slug?: string;
  category: string;
  description: string;
  short_description: string;
  full_description: string;
  photo: string;
  logo: string;
  advisor: string;
  schedule: string;
  place: string;
  achievements: string[];
  documentation: string[];
  gallery: string[];
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
      <div className="min-h-screen bg-gradient-to-b from-[#FAF6F0] to-white">
        <PageHero title="Ekstrakurikuler" subtitle="Wadah pengembangan bakat, minat, dan karakter siswa" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler' }]} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF6F0] to-white">
      <PageHero
        title="Ekstrakurikuler"
        subtitle="Wadah pengembangan bakat, minat, dan karakter siswa di luar jam pelajaran"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Pilihan Ekstrakurikuler" subtitle="Temukan wadah yang sesuai dengan minat dan bakatmu" align="center" />

        <div className="mb-12 mt-8 flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                filter === cat
                  ? 'bg-[#1B2A4A] text-white shadow-md'
                  : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:border-[#1B2A4A]/40 hover:bg-[#1B2A4A]/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#C8A951]/10">
              <ImageIcon className="h-10 w-10 text-[#C8A951]/50" />
            </div>
            <p className="text-lg font-medium text-[#23314D]">Tidak ada ekstrakurikuler yang ditemukan</p>
            <p className="mt-2 text-sm text-[#5B7088]">Coba pilih kategori lain atau hubungi admin untuk informasi lebih lanjut</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ekskul) => (
              <a
                key={ekskul.id ?? ekskul.name}
                href={`/osis/ekstrakurikuler/${ekskul.slug ?? ekskul.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#FAF6F0] to-[#F5EFE3]">
                  {ekskul.photo && resolveImageUrl(ekskul.photo) ? (
                    <img
                      src={resolveImageUrl(ekskul.photo)!}
                      alt={ekskul.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <ImageIcon className="h-12 w-12 text-[#C8A951]/30" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {ekskul.logo && resolveImageUrl(ekskul.logo) && (
                    <div className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-lg">
                      <img
                        src={resolveImageUrl(ekskul.logo)!}
                        alt={`Logo ${ekskul.name}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1B2A4A] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-[#C8A951]/10 px-3 py-1 text-xs font-semibold text-[#866D2C]">
                      {ekskul.category}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-[#1B2A4A] transition-colors group-hover:text-[#866D2C]">
                    {ekskul.name}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[#5B7088]">
                    {ekskul.short_description || ekskul.description}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-4 text-xs font-medium text-[#5B7088]">
                    {ekskul.advisor && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#C8A951]" />
                        {ekskul.advisor}
                      </span>
                    )}
                    {ekskul.schedule && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#C8A951]" />
                        {ekskul.schedule}
                      </span>
                    )}
                  </div>

                  {Array.isArray(ekskul.gallery) && ekskul.gallery.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {ekskul.gallery.slice(0, 3).map((url, i) => (
                          <img
                            key={i}
                            src={resolveImageUrl(url) || url}
                            alt=""
                            className="h-8 w-8 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#5B7088]">+{ekskul.gallery.length} foto</span>
                    </div>
                  )}
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
