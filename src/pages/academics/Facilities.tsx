import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import type { Facility } from '../../lib/content-types';
import Card from '../../components/ui/Card';
import { fetchPublicContent } from '../../lib/api';

const Facilities: React.FC = () => {
  const [filter, setFilter] = useState<string>('Semua');
  const [items, setItems] = useState<Facility[]>([]);
  useEffect(() => { fetchPublicContent<Facility[]>('facilities').then(setItems); }, []);
  const categories = ['Semua', 'Akademik', 'Fasilitas Umum', 'Keagamaan', 'Pendukung'];

  const filteredFacilities = filter === 'Semua'
    ? items
    : items.filter((f: Facility) => f.category === filter);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero title="Fasilitas" subtitle="Sarana dan prasarana modern untuk mendukung pembelajaran yang optimal." />

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
            <Card key={facility.id} image={facility.photo} title={facility.name} description={facility.description} badge={facility.category} className="h-full">
              <div className="flex flex-col flex-1 p-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#866D2C]">{facility.category}</p>
                <h3 className="mb-3 text-xl font-semibold text-[#1B2A4A]">{facility.name}</h3>
                <p className="text-sm leading-7 text-[#1B2A4A]/70">{facility.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Facilities;
