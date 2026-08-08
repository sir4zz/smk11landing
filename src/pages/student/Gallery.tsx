import React, { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { fetchGalleries, type GalleryRow } from '../../lib/api'
import { X } from 'lucide-react'

const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryRow[]>([])
  const [filter, setFilter] = useState<string>('Semua')
  const [selected, setSelected] = useState<GalleryRow | null>(null)
  useEffect(() => { fetchGalleries({ limit: 500 }).then(({ rows }) => setItems(rows)) }, [])

  const categories = ['Semua', ...new Set(items.map((g) => g.category).filter(Boolean) as string[])]
  const filtered = filter === 'Semua' ? items : items.filter((g) => g.category === filter)

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Galeri"
        subtitle="Dokumentasi kegiatan dan momen berharga di SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Galeri' }]}
        backgroundImage="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                filter === cat
                  ? 'bg-[#1B2A4A] text-[#FAF6F0]'
                  : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="group relative mb-6 block w-full overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-lg"
            >
              <img
                src={item.cover_image}
                alt={item.title}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#1B2A4A]/80 via-transparent to-transparent p-5 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-sm font-medium text-white text-left leading-snug">
                  {item.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.cover_image}
              alt={selected.title}
              className="max-h-[50vh] sm:max-h-[80vh] w-full object-contain"
            />
            <div className="bg-white p-4">
              <p className="font-semibold text-[#1B2A4A]">{selected.title}</p>
              <p className="mt-1 text-sm text-[#23314D]">{selected.category} &middot; {selected.event_date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
