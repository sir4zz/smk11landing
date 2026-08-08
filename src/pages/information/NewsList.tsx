import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import { isImportedNews, type NewsItem } from '../../lib/content-types'
import { fetchPublicContent } from '../../lib/api'
import { Calendar, User, ArrowRight, Search } from 'lucide-react'

const NewsList: React.FC = () => {
  const [items, setItems] = useState<NewsItem[]>([])
  const [filterCat, setFilterCat] = useState<string>('Semua')
  const [search, setSearch] = useState('')
  useEffect(() => { fetchPublicContent<NewsItem[]>('news').then(setItems) }, [])

  const categories = ['Semua', ...new Set(items.map((n) => n.category))]

  const filtered = items.filter((n) => {
    if (filterCat !== 'Semua' && n.category !== filterCat) return false
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Berita & Informasi"
        subtitle="Ikuti perkembangan terbaru dari SMKN 11 Kabupaten Tangerang"
        backgroundImage="https://images.unsplash.com/photo-1504711434969-e33886168d6c?auto=format&fit=crop&w=1600&q=80"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Berita' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`rounded-full px-5 py-2 font-medium transition-all ${
                  filterCat === cat
                    ? 'bg-[#1B2A4A] text-[#FAF6F0]'
                    : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
            <input
              type="text"
              placeholder="Cari berita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#1B2A4A]/20 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951] sm:w-64"
            />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              to={`/informasi/berita/${item.slug}`}
              className="group overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/60 to-transparent" />
                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${isImportedNews(item) ? 'bg-blue-600/90 text-white' : 'bg-[#C8A951]/90 text-[#1B2A4A]'}`}>
                  {isImportedNews(item) ? 'Sumber Eksternal' : 'Berita Sekolah'}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-semibold text-[#1B2A4A]">
                  {item.category}
                </span>
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-center gap-4 text-xs font-medium text-[#23314D]/70">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {item.author}
                  </span>
                </div>
                <h3 className="mb-3 text-lg font-bold leading-snug text-[#1B2A4A] transition-colors group-hover:text-[#C8A951]">
                  {item.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-[#23314D] line-clamp-3">
                  {item.excerpt}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C] transition-colors group-hover:text-[#C8A951]">
                  Baca selengkapnya <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Search className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Tidak ada berita yang ditemukan</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default NewsList
