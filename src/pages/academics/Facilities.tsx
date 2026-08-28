import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import type { Facility } from '../../lib/content-types';
import { usePageBanner } from '../../lib/usePageBanner';
import Card from '../../components/ui/Card';
import { fetchPublicContent, resolveImageUrl } from '../../lib/api';

const Facilities: React.FC = () => {
  const { backgroundImage } = usePageBanner('akademik_fasilitas');
  const [filter, setFilter] = useState<string>('Semua');
  const [items, setItems] = useState<Facility[]>([]);
  useEffect(() => { fetchPublicContent<Facility[]>('facilities').then(setItems); }, []);
  const categories = ['Semua', ...new Set(items.map((facility) => facility.category).filter(Boolean))];

  const filteredFacilities = filter === 'Semua'
    ? items
    : items.filter((f: Facility) => f.category === filter);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero title="Fasilitas" subtitle="Sarana dan prasarana modern untuk mendukung pembelajaran yang optimal." backgroundImage={backgroundImage} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                filter === cat
                  ? 'bg-[#1B2A4A] text-[#FAF6F0] shadow-sm'
                  : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredFacilities.map((facility: Facility) => (
            <Card key={facility.id} link={`/akademik/fasilitas/${facility.slug}`} className="h-full">
              {resolveImageUrl(facility.photo) && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img src={resolveImageUrl(facility.photo)!} alt={facility.name} loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/60 to-transparent" />
                  {facility.category && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-semibold text-[#1B2A4A]">
                      {facility.category}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                {!resolveImageUrl(facility.photo) && facility.category && (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#866D2C]">{facility.category}</p>
                )}
                <h3 className="mb-3 text-xl font-semibold text-[#1B2A4A]">{facility.name}</h3>
                <p className="text-sm leading-7 text-[#1B2A4A]/70 line-clamp-3">{facility.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Facilities;
