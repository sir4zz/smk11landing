import React, { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import SectionHeading from '../../components/ui/SectionHeading'
import { usePageBanner } from '../../lib/usePageBanner'
import type { Achievement } from '../../lib/content-types'
import { fetchPublicContent, resolveImageUrl } from '../../lib/api'
import { Trophy, Users, Calendar, X, ZoomIn } from 'lucide-react'

const levelColors: Record<string, string> = {
  Nasional: 'bg-[#C8A951]/20 text-[#866D2C]',
  Provinsi: 'bg-[#1B2A4A]/10 text-[#1B2A4A]',
  Kabupaten: 'bg-[#FAF6F0] text-[#23314D] border border-[#1B2A4A]/10',
  Regional: 'bg-[#C8A951]/10 text-[#866D2C]',
}

const Achievements: React.FC = () => {
  const { backgroundImage } = usePageBanner('kesiswaan_prestasi')
  const [items, setItems] = useState<Achievement[]>([])
  const [filterYear, setFilterYear] = useState<string>('Semua')
  const [filterLevel, setFilterLevel] = useState<string>('Semua')
  const [selected, setSelected] = useState<Achievement | null>(null)
  const [lightbox, setLightbox] = useState(false)
  useEffect(() => { fetchPublicContent<Achievement[]>('achievements').then(setItems) }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setLightbox(false); setSelected(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = selected || lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected, lightbox])

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

  const openDetail = (achievement: Achievement) => {
    setSelected(achievement)
    setLightbox(false)
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Prestasi Siswa"
        subtitle="Raihan prestasi membanggakan siswa SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Prestasi Siswa' }]}
        backgroundImage={backgroundImage}
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
          {filtered.map((achievement) => {
            const photoUrl = resolveImageUrl(achievement.photo)
            return (
              <button
                key={achievement.id}
                type="button"
                onClick={() => openDetail(achievement)}
                className="group flex flex-col rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#C8A951]/50 hover:shadow-lg"
              >
                {photoUrl && (
                  <div className="relative mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-2xl">
                    <img src={photoUrl} alt={achievement.title} loading="lazy" className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      <ZoomIn className="h-3.5 w-3.5" /> Lihat Detail
                    </span>
                  </div>
                )}

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
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-[#1B2A4A]">{achievement.title}</h3>
                    <p className="truncate text-sm text-[#23314D]">{achievement.event}</p>
                  </div>
                </div>

                <div className="mb-2 inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-sm font-semibold text-[#866D2C]">
                  {achievement.rank}
                </div>

                <div className="mt-auto flex items-start gap-2 pt-3 text-sm text-[#23314D]">
                  <Users className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{achievement.students.join(', ')}</span>
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Tidak ada prestasi yang ditemukan</p>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 py-10" onClick={() => setSelected(null)}>
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#1B2A4A]/10 px-6 py-4">
              <h2 className="text-lg font-bold text-[#1B2A4A]">Detail Prestasi</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-[#5B7088] transition-colors hover:bg-[#FAF6F0] hover:text-[#1B2A4A]" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>

            {resolveImageUrl(selected.photo) && (
              <button type="button" onClick={() => setLightbox(true)} className="group relative block w-full cursor-zoom-in overflow-hidden bg-[#FAF6F0]">
                <img src={resolveImageUrl(selected.photo)} alt={selected.title} className="max-h-[420px] w-full object-cover" />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  <ZoomIn className="h-3.5 w-3.5" /> Perbesar Foto
                </span>
              </button>
            )}

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelColors[selected.level] || 'bg-gray-100 text-gray-800'}`}>
                  {selected.level}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-medium text-[#23314D]">
                  <Calendar className="h-3.5 w-3.5" />
                  {selected.year}
                </span>
                <span className="rounded-full bg-[#C8A951]/15 px-3 py-1 text-xs font-semibold text-[#866D2C]">
                  {selected.rank}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#1B2A4A]">{selected.title}</h3>
                <p className="mt-1 text-[#23314D]">{selected.event}</p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1B2A4A]">
                  <Users className="h-4 w-4 text-[#866D2C]" /> Siswa yang Meraih Prestasi
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.students.map((student, index) => (
                    <span key={student} className="rounded-full border border-[#1B2A4A]/10 bg-[#FAF6F0] px-3 py-1.5 text-sm font-medium text-[#23314D]">
                      {index + 1}. {student}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {lightbox && selected && resolveImageUrl(selected.photo) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}>
          <button className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" onClick={() => setLightbox(false)} aria-label="Tutup">
            <X className="h-6 w-6" />
          </button>
          <img
            src={resolveImageUrl(selected.photo)}
            alt={selected.title}
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
            {selected.title} &mdash; {selected.rank}
          </p>
        </div>
      )}
    </div>
  )
}

export default Achievements
