import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import { jobs as fallbackJobs } from '../../data/jobs'
import {
  fetchJobVacancyBySlug,
  resolveImageUrl,
  JOB_STATUS_LABELS,
  JOB_EMPLOYMENT_LABELS,
  type JobVacancyRow,
} from '../../lib/api'
import {
  Building2,
  MapPin,
  CalendarClock,
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Phone,
  CheckCircle2,
  ListChecks,
  UserRound,
  Link2,
} from 'lucide-react'

const statusStyles: Record<string, string> = {
  open: 'bg-green-50 text-green-700',
  closing: 'bg-amber-50 text-amber-700',
  closed: 'bg-[#1B2A4A]/10 text-[#5B7088]',
}

function splitLines(text?: string): string[] {
  return (text || '').split('\n').map((s) => s.trim()).filter(Boolean)
}

function Block({ title, icon: Icon, items, children }: { title: string; icon: React.ElementType; items?: string[]; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]">
        <Icon className="h-5 w-5 text-[#866D2C]" /> {title}
      </h3>
      {items && items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[#23314D]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A951]" /> {item}
            </li>
          ))}
        </ul>
      ) : (
        children ?? <p className="text-sm text-[#5B7088]">-</p>
      )}
    </div>
  )
}

const BkkDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [job, setJob] = useState<JobVacancyRow | undefined>(
    fallbackJobs.find((j) => j.slug === slug)
  )

  useEffect(() => {
    fetchJobVacancyBySlug(slug || '').then((apiJob) => {
      if (apiJob) setJob(apiJob)
      else {
        const local = fallbackJobs.find((j) => j.slug === slug)
        if (local) setJob(local)
      }
    })
  }, [slug])

  const formatDeadline = (d?: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Lowongan Tidak Ditemukan" />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="mb-6 text-lg text-[#23314D]">Lowongan yang Anda cari tidak tersedia.</p>
          <Link to="/bkk">
            <Button variant="outline">Kembali ke BKK</Button>
          </Link>
        </div>
      </div>
    )
  }

  const registrationLink = job.registration_link?.trim()

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={job.position}
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'BKK', href: '/bkk' },
          { label: job.position },
        ]}
        backgroundImage="https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=1600&q=80"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {job.company_logo ? (
                <img
                  src={resolveImageUrl(job.company_logo)}
                  alt={job.company_name}
                  className="h-16 w-16 rounded-xl border border-[#1B2A4A]/10 object-cover"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#1B2A4A]/5 text-[#1B2A4A]">
                  <Building2 className="h-8 w-8" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-[#1B2A4A]">{job.company_name}</h2>
                <p className="text-sm text-[#23314D]">{job.company_description}</p>
              </div>
            </div>
            <span className={`w-fit shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${statusStyles[job.status]}`}>
              {JOB_STATUS_LABELS[job.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-[#1B2A4A]/10 bg-[#FAF6F0] p-6 sm:grid-cols-2 lg:grid-cols-4">
            <Meta icon={MapPin} label="Lokasi" value={[job.location, job.city].filter(Boolean).join(', ')} />
            <Meta icon={Briefcase} label="Tipe Pekerjaan" value={JOB_EMPLOYMENT_LABELS[job.employment_type]} />
            <Meta icon={CalendarClock} label="Deadline" value={formatDeadline(job.deadline)} />
            <Meta icon={GraduationCap} label="Pendidikan" value={job.education || '-'} />
          </div>
          <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-4">
            <Meta icon={UserRound} label="Jurusan Diterima" value={job.major && job.major.length ? job.major.join(', ') : '-'} />
            <Meta icon={UserRound} label="Pengalaman" value={job.experience || '-'} />
            <Meta icon={Phone} label="Kontak HR" value={job.hr_contact || '-'} />
            <Meta icon={Link2} label="Kode" value={job.id ? job.id.slice(0, 8).toUpperCase() : '-'} />
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Block title="Deskripsi Pekerjaan" icon={Briefcase} items={splitLines(job.job_description)} />
            <Block title="Tanggung Jawab" icon={ListChecks} items={splitLines(job.responsibilities)} />
            <Block title="Persyaratan" icon={CheckCircle2} items={splitLines(job.requirements)} />
            <Block title="Benefit" icon={Building2} items={splitLines(job.benefits)} />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Tertarik Bergabung?</h3>
              {registrationLink ? (
                <>
                  <p className="mb-4 text-sm text-[#23314D]">
                    Jika Anda memenuhi kualifikasi, silakan daftar sekarang melalui tautan pendaftaran resmi.
                  </p>
                  <a
                    href={registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8A951] px-4 py-3 font-bold text-[#1B2A4A] transition-colors hover:bg-[#B59640]"
                  >
                    Daftar Sekarang <ExternalLink className="h-4 w-4" />
                  </a>
                </>
              ) : (
                <p className="text-sm text-[#5B7088]">Tautan pendaftaran belum tersedia. Silakan hubungi pihak HR di perusahaan terkait.</p>
              )}
              <div className="mt-6 space-y-2 border-t border-[#1B2A4A]/10 pt-4 text-sm text-[#23314D]">
                {job.hr_contact && (
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#866D2C]" /> {job.hr_contact}</p>
                )}
                {job.company_name && (
                  <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#866D2C]" /> {job.company_name}</p>
                )}
              </div>
            </div>

            <Link to="/bkk">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" /> Kembali ke BKK
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
      <Icon className="h-5 w-5 shrink-0 text-[#866D2C]" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5B7088]">{label}</p>
        <p className="truncate text-sm font-semibold text-[#1B2A4A]">{value}</p>
      </div>
    </div>
  )
}

export default BkkDetail