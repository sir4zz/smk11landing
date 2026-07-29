import React, { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import SectionHeading from '../../components/ui/SectionHeading'
import { achievements, type Achievement } from '../../data/achievements'
import { fetchPublicContent } from '../../lib/api'
import { Trophy, Users, Calendar } from 'lucide-react'

const levelColors: Record<string, string> = {
  Nasional: 'bg-[#C8A951]/20 text-[#866D2C]',
  Provinsi: 'bg-[#1B2A4A]/10 text-[#1B2A4A]',
  Kabupaten: 'bg-[#FAF6F0] text-[#23314D] border border-[#1B2A4A]/10',
  Regional: 'bg-[#C8A951]/10 text-[#866D2C]',
}

const Achievements: React.FC = () => {
  const [items, setItems] = useState<Achievement[]>(achievements)
  const [filterYear, setFilterYear] = useState<string>('Semua')
  const [filterLevel, setFilterLevel] = useState<string>('Semua')
  useEffect(() => { fetchPublicContent('achievements', achievements).then(setItems) }, [])

  const years = ['Semua', ...new Set(items.map((a) => a.year.toString()))].sort((a, b) => {
    if (a === 'Semua') return -1
    if (b === 'Semua') return 1
    return parseInt(b) - parseInt(a)
  })
  const levels = ['Semua', ...new Set(items.map((a) => a.level))]

  const filtered = items.filter((a) => {
    if (filterYear !== 'Semua' && a.year.toString() !== filterYear) return false
    if (filterLevel !== 'Semua' && a.level !== filterLevel) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Prestasi"
        subtitle="Raihan prestasi membanggakan siswa SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Prestasi' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <SectionHeading title="Prestasi Siswa" subtitle="Berbagai penghargaan yang telah diraih oleh siswa-siswi SMKN 11 di berbagai ajang kompetisi" align="center" />

        <div className="mb-10 flex flex-wrap justify-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#1B2A4A]">Tahun:</span>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setFilterYear(y)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filterYear === y
                    ? 'bg-[#1B2A4A] text-[#FAF6F0]'
                    : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#1B2A4A]">Tingkat:</span>
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setFilterLevel(l)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filterLevel === l
                    ? 'bg-[#1B2A4A] text-[#FAF6F0]'
                    : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((achievement) => (
            <div
              key={achievement.id}
              className="group rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelColors[achievement.level] || 'bg-gray-100 text-gray-800'}`}>
                  {achievement.level}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-[#866D2C]">
                  <Calendar className="h-3.5 w-3.5" />
                  {achievement.year}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8A951]/20 text-[#C8A951]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1B2A4A]">{achievement.title}</h3>
                  <p className="text-sm text-[#23314D]">{achievement.event}</p>
                </div>
              </div>

              <div className="mb-2 inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-sm font-semibold text-[#866D2C]">
                {achievement.rank}
              </div>

              <div className="mt-3 flex items-start gap-2 text-sm text-[#23314D]">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="break-words">{achievement.students.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Tidak ada prestasi yang ditemukan</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Achievements
