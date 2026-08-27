import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import BkkSubNav from '../../components/bkk/BkkSubNav'
import { fetchPublicContent } from '../../lib/api'
import {
  fetchJobVacancies,
  resolveImageUrl,
  JOB_STATUS_LABELS,
  JOB_EMPLOYMENT_LABELS,
  type JobVacancyRow,
  type JobStatus,
  type JobEmploymentType,
} from '../../lib/api'
import { Search, MapPin, Building2, CalendarClock, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { SkeletonList } from '../../components/ui/Skeleton'

const PAGE_SIZE = 9

const statusStyles: Record<JobStatus, string> = {
  open: 'bg-green-50 text-green-700',
  closing: 'bg-amber-50 text-amber-700',
  closed: 'bg-[#1B2A4A]/10 text-[#5B7088]',
}

const employmentStyles: Record<JobEmploymentType, string> = {
  full_time: 'bg-blue-50 text-blue-700',
  contract: 'bg-purple-50 text-purple-700',
  internship: 'bg-[#C8A951]/15 text-[#866D2C]',
}

const BkkList: React.FC = () => {
  const [rows, setRows] = useState<JobVacancyRow[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [major, setMajor] = useState('')
  const [city, setCity] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [status, setStatus] = useState('')

  const [majorOptions, setMajorOptions] = useState<string[]>([])
  const [cityOptions, setCityOptions] = useState<string[]>([])

  useEffect(() => {
    fetchJobVacancies({ limit: 200 })
      .then(({ rows: all }) => {
        setCityOptions([...new Set(all.map((r) => r.city).filter(Boolean))] as string[])
      })
      .catch(() => {})
    fetchPublicContent<any[]>('programs')
      .then((progs) => setMajorOptions(progs.map((p) => p.shortName).filter(Boolean)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const delay = window.setTimeout(() => {
      setLoading(true)
      fetchJobVacancies({
        search: search || undefined,
        major: major || undefined,
        city: city || undefined,
        employment_type: employmentType || undefined,
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
      })
        .then(({ rows, meta }) => {
           setRows(rows)
          setMeta({ total: meta.total, page: meta.page, last_page: meta.last_page })
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => window.clearTimeout(delay)
  }, [search, major, city, employmentType, status, page])

  const selectClass =
    'rounded-full border border-[#1B2A4A]/20 bg-white py-2.5 pl-3 pr-8 text-sm text-[#1B2A4A] focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]'

  const resetPage = () => setPage(1)

  const totalPages = Math.max(meta.last_page, 1)

  const formatDeadline = (d?: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const resultCount = useMemo(() => (loading ? meta.total : meta.total), [meta.total, loading])

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Bursa Kerja Khusus (BKK)"
        subtitle="Temukan lowongan kerja terbaru dari perusahaan mitra untuk alumni SMKN 11 Kabupaten Tangerang"
        backgroundImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'BKK', href: '/bkk' }, { label: 'Lowongan Kerja' }]}
      />

      <div className="relative z-10 -mt-6">
        <BkkSubNav />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
            <input
              type="text"
              placeholder="Cari posisi / perusahaan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="w-full rounded-full border border-[#1B2A4A]/20 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]"
            />
          </div>
          <select value={major} onChange={(e) => { setMajor(e.target.value); resetPage() }} className={selectClass}>
            <option value="">Semua Jurusan</option>
            {majorOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={city} onChange={(e) => { setCity(e.target.value); resetPage() }} className={selectClass}>
            <option value="">Semua Kota</option>
            {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={employmentType} onChange={(e) => { setEmploymentType(e.target.value); resetPage() }} className={selectClass}>
            <option value="">Semua Tipe</option>
            {Object.entries(JOB_EMPLOYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); resetPage() }} className={selectClass}>
            <option value="">Semua Status</option>
            {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <p className="mb-6 text-sm font-medium text-[#23314D]/70">
          Menampilkan {resultCount} lowongan kerja
        </p>

        {loading ? (
          <SkeletonList count={6} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" />
        ) : rows.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Tidak ada lowongan yang ditemukan</p>
            <p className="mt-1 text-sm text-[#5B7088]">Coba ubah kata kunci atau filter pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((job) => (
              <Link
                key={job.id}
                to={`/bkk/lowongan/${job.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3 p-5 pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {job.company_logo && resolveImageUrl(job.company_logo) ? (
                      <img
                        src={resolveImageUrl(job.company_logo)!}
                        alt={job.company_name}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-xl border border-[#1B2A4A]/10 bg-white object-cover"
                      />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#1B2A4A]/5 text-[#1B2A4A]">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#23314D]">{job.company_name}</p>
                      <h3 className="truncate text-base font-bold text-[#1B2A4A] transition-colors group-hover:text-[#C8A951]">
                        {job.position}
                      </h3>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 px-5 pb-4 text-sm text-[#23314D]">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-[#866D2C]" />
                    {[job.location, job.city].filter(Boolean).join(', ')}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 shrink-0 text-[#866D2C]" />
                    Deadline: {formatDeadline(job.deadline)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#1B2A4A]/10 px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${employmentStyles[job.employment_type]}`}>
                    {JOB_EMPLOYMENT_LABELS[job.employment_type]}
                  </span>
                  <span className="text-sm font-semibold text-[#866D2C] transition-colors group-hover:text-[#C8A951]">
                    Lihat Detail →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1B2A4A] disabled:opacity-40 hover:bg-[#FAF6F0]"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            <span className="px-4 text-sm font-medium text-[#23314D]">
              Halaman {meta.page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1B2A4A] disabled:opacity-40 hover:bg-[#FAF6F0]"
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default BkkList
