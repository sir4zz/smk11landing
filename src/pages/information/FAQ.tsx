import React, { useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import SectionHeading from '../../components/ui/SectionHeading'
import { faq, type FAQItem } from '../../data/faq'
import { ChevronDown, Search } from 'lucide-react'

const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('Semua')
  const [search, setSearch] = useState('')

  const categories = ['Semua', ...new Set(faq.map((f) => f.category))]

  const filtered = faq.filter((f) => {
    if (filter !== 'Semua' && f.category !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    }
    return true
  })

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="FAQ"
        subtitle="Pertanyaan yang sering diajukan seputar SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'FAQ' }]}
        backgroundImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading
          title="Pertanyaan Umum"
          subtitle="Temukan jawaban atas pertanyaan yang paling sering diajukan"
          align="center"
        />

        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-5 py-2 font-medium transition-all ${
                  filter === cat
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
              placeholder="Cari pertanyaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#1B2A4A]/20 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951] sm:w-72"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all"
            >
              <button
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#FAF6F0]"
              >
                <div className="flex-1 pr-4">
                  <span className="mb-1 inline-block rounded-full bg-[#FAF6F0] px-2.5 py-0.5 text-xs font-semibold text-[#866D2C]">
                    {item.category}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-[#1B2A4A]">{item.question}</h3>
                </div>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-[#C8A951] transition-transform duration-300 ${
                    openId === item.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openId === item.id ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="border-t border-[#1B2A4A]/10 px-6 py-5">
                  <p className="leading-relaxed text-[#23314D]">{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Search className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Tidak ada pertanyaan yang ditemukan</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default FAQ
