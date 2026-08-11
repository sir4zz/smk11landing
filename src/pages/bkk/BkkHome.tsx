import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BkkSubNav from '../../components/bkk/BkkSubNav'
import PageHero from '../../components/ui/PageHero'
import SectionHeading from '../../components/ui/SectionHeading'
import Button from '../../components/ui/Button'
import {
  fetchPublicContent,
  fetchJobVacancies,
  fetchBkkHomeContent,
  fetchBkkContactContent,
  fetchBkkPartners,
  resolveImageUrl,
  JOB_STATUS_LABELS,
  JOB_EMPLOYMENT_LABELS,
  type JobVacancyRow,
  type BkkHomeContent,
  type BkkContactContent,
  type BkkPartner,
} from '../../lib/api'
import type { NewsItem } from '../../lib/content-types'
import {
  Briefcase,
  Building2,
  MapPin,
  CalendarClock,
  Loader2,
  ArrowRight,
  Handshake,
  Compass,
  Phone,
  Mail,
  Clock,
} from 'lucide-react'

const BKK_HERO_IMAGE = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80'

const statusStyles: Record<string, string> = {
  open: 'bg-green-50 text-green-700',
  closing: 'bg-amber-50 text-amber-700',
  closed: 'bg-[#1B2A4A]/10 text-[#5B7088]',
}

const employmentStyles: Record<string, string> = {
  full_time: 'bg-blue-50 text-blue-700',
  contract: 'bg-purple-50 text-purple-700',
  internship: 'bg-[#C8A951]/15 text-[#866D2C]',
}

const DEFAULT_SERVICES = [
  {
    icon: Briefcase,
    title: 'Informasi Lowongan Kerja',
    description: 'Menyediakan informasi lowongan kerja terbaru dari perusahaan mitra yang sesuai dengan kompetensi lulusan.',
  },
  {
    icon: Handshake,
    title: 'Penyaluran Lulusan',
    description: 'Menjembatani alumni dengan dunia usaha dan industri melalui rekrutmen langsung maupun kerja sama mitra.',
  },
  {
    icon: Compass,
    title: 'Bimbingan Karir',
    description: 'Membantu siswa dan alumni mempersiapkan diri memasuki dunia kerja, termasuk penyusunan lamaran dan wawancara.',
  },
]

const DEFAULT_HOME: BkkHomeContent = {
  banner: {
    title: 'Bursa Kerja Khusus (BKK)',
    subtitle: 'Pusat layanan informasi lowongan kerja, penyaluran lulusan, dan bimbingan karir SMKN 11 Kabupaten Tangerang',
    image: BKK_HERO_IMAGE,
  },
  about: {
    title: 'Apa itu BKK SMKN 11 Kabupaten Tangerang?',
    subtitle: 'Menghubungkan alumni dengan dunia kerja',
    paragraphs: [
      'Bursa Kerja Khusus (BKK) adalah unit layanan di SMKN 11 Kabupaten Tangerang yang memfasilitasi penempatan lulusan ke dunia usaha dan dunia industri (DUDI). Melalui BKK, alumni dapat mengakses informasi lowongan kerja yang relevan dengan kompetensi keahlian mereka.',
      'Kami bekerja sama dengan berbagai perusahaan mitra untuk memastikan lulusan mendapatkan peluang karir terbaik, mulai dari lowongan full time, kontrak, hingga program magang.',
    ],
  },
  services: DEFAULT_SERVICES.map(({ title, description }) => ({ title, description })),
}

const DEFAULT_CONTACT: BkkContactContent = {
  whatsapp: '0812 9922 0831',
  whatsapp_link: 'https://wa.me/6281299220831',
  email: 'admin@smkn11kabtang.sch.id',
  location: 'Kp. Saradan RT. 03/01, Desa Pangkat, Kec. Jayanti, Kab. Tangerang, Banten 15610',
  hours: 'Senin - Jumat, 07.00 - 15.00 WIB',
}

const BkkHome: React.FC = () => {
  const [jobs, setJobs] = useState<JobVacancyRow[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [news, setNews] = useState<NewsItem[]>([])
  const [home, setHome] = useState<BkkHomeContent | null>(null)
  const [contact, setContact] = useState<BkkContactContent | null>(null)
  const [partners, setPartners] = useState<BkkPartner[]>([])

  const homeContent = home ?? DEFAULT_HOME
  const contactContent = contact ?? DEFAULT_CONTACT

  useEffect(() => {
    fetchJobVacancies({ limit: 6 })
      .then(({ rows }) => setJobs(rows))
      .finally(() => setJobsLoading(false))
    fetchPublicContent<NewsItem[]>('news')
      .then((items) => {
        const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const announcements = sorted.filter((n) => n.category === 'Pengumuman')
        setNews(announcements.length ? announcements : sorted)
      })
      .catch(() => {})
    fetchBkkHomeContent().then(setHome).catch(() => {})
    fetchBkkContactContent().then(setContact).catch(() => {})
    fetchBkkPartners().then(setPartners).catch(() => {})
  }, [])

  const partnerCompanies = useMemo(() => {
    const seen = new Set<string>()
    const companies: { name: string; logo: string }[] = []
    for (const partner of partners) {
      const name = partner.name?.trim()
      if (!name || seen.has(name)) continue
      seen.add(name)
      companies.push({ name, logo: partner.logo ?? '' })
    }
    return companies
  }, [partners])

  const formatDate = (d?: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={homeContent.banner.title}
        subtitle={homeContent.banner.subtitle}
        backgroundImage={homeContent.banner.image || BKK_HERO_IMAGE}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'BKK' }]}
      />

      <div className="relative z-10 -mt-6">
        <BkkSubNav />
      </div>

      {/* Deskripsi singkat BKK */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              title={homeContent.about.title}
              subtitle={homeContent.about.subtitle}
            />
            <div className="space-y-4 text-base leading-relaxed text-[#23314D] md:text-lg">
              {homeContent.about.paragraphs.length > 0 ? (
                homeContent.about.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              ) : (
                <p>Bursa Kerja Khusus (BKK) adalah unit layanan di SMKN 11 Kabupaten Tangerang yang memfasilitasi penempatan lulusan ke dunia kerja.</p>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as="link" href="/bkk/lowongan" variant="primary" size="lg" className="gap-2">
                Lihat Lowongan Kerja <ArrowRight className="h-5 w-5" />
              </Button>
              <Button as="link" href="/bkk/kontak" variant="outline" size="lg">
                Hubungi BKK
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-1">
            {homeContent.services.map((service) => {
              const Icon = service.title === 'Penyaluran Lulusan' ? Handshake : service.title === 'Bimbingan Karir' ? Compass : Briefcase
              return (
                <div
                  key={service.title}
                  className="flex items-start gap-4 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#1B2A4A] text-[#C8A951]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1B2A4A]">{service.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#23314D]">{service.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Lowongan Terbaru */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              title="Lowongan Kerja Terbaru"
              subtitle="Lowongan terbaru dari perusahaan mitra BKK SMKN 11 Kabupaten Tangerang"
              align="left"
            />
            <Link to="/bkk/lowongan" className="mb-8 inline-flex items-center gap-2 font-semibold text-[#866D2C] transition-colors hover:text-[#1B2A4A]">
              Lihat Semua Lowongan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-[#C8A951]" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-[#C8A951]/40" />
              <p className="mt-4 text-lg font-medium text-[#23314D]">Belum ada lowongan kerja tersedia</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/bkk/lowongan/${job.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-[#FAF6F0] shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3 p-5 pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {job.company_logo ? (
                        <img
                          src={resolveImageUrl(job.company_logo)}
                          alt={job.company_name}
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
                      Deadline: {formatDate(job.deadline)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-[#1B2A4A]/10 bg-white px-5 py-3">
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
        </div>
      </section>

      {/* Perusahaan Partner */}
      {partnerCompanies.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
          <SectionHeading
            title="Perusahaan Partner"
            subtitle="Perusahaan mitra yang mempercayakan lowongan kerjanya melalui BKK SMKN 11 Kabupaten Tangerang"
            align="center"
          />
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {partnerCompanies.map((company) => (
              <div
                key={company.name}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {company.logo ? (
                  <img
                    src={resolveImageUrl(company.logo)}
                    alt={company.name}
                    className="h-14 w-14 rounded-xl border border-[#1B2A4A]/10 object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#1B2A4A]/5 text-[#1B2A4A]">
                    <Building2 className="h-7 w-7" />
                  </div>
                )}
                <p className="text-sm font-bold leading-snug text-[#1B2A4A]">{company.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pengumuman Terbaru */}
      {news.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                title="Pengumuman Terbaru"
                subtitle="Informasi dan pengumuman terkini seputar sekolah dan BKK"
                align="left"
              />
              <Link to="/informasi/berita" className="mb-8 inline-flex items-center gap-2 font-semibold text-[#866D2C] transition-colors hover:text-[#1B2A4A]">
                Lihat Semua Pengumuman <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {news.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  to={`/informasi/berita/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-[#FAF6F0] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/60 to-transparent" />
                    {item.category && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#C8A951]/90 px-3 py-1 text-xs font-semibold text-[#1B2A4A]">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#23314D]/70">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDate(item.date)}
                    </p>
                    <h3 className="mb-2 text-base font-bold leading-snug text-[#1B2A4A] transition-colors group-hover:text-[#C8A951] line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#23314D] line-clamp-2">
                      {item.excerpt}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C] transition-colors group-hover:text-[#C8A951]">
                      Baca selengkapnya <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Informasi & Kontak singkat BKK */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="overflow-hidden rounded-[2rem] bg-[#1B2A4A] text-white shadow-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 md:p-12">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C8A951]">Kontak Singkat BKK</p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Butuh bantuan atau informasi lowongan?</h2>
              <p className="mt-4 text-base font-medium text-white/85">
                Hubungi BKK SMKN 11 Kabupaten Tangerang melalui kanal berikut untuk informasi selengkapnya.
              </p>
              <div className="mt-8">
                <Button as="link" href="/bkk/kontak" variant="primary" size="lg" className="gap-2">
                  Halaman Kontak BKK <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 border-t border-white/10 bg-[#121F38]/60 p-8 md:p-12 lg:border-l lg:border-t-0">
              {contactContent.whatsapp && (
                <a
                  href={contactContent.whatsapp_link || `https://wa.me/${contactContent.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#C8A951] text-[#1B2A4A]">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">WhatsApp</p>
                    <p className="text-base font-bold">{contactContent.whatsapp}</p>
                  </div>
                </a>
              )}
              {contactContent.email && (
                <a
                  href={`mailto:${contactContent.email}`}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#C8A951] text-[#1B2A4A]">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">Email</p>
                    <p className="text-base font-bold">{contactContent.email}</p>
                  </div>
                </a>
              )}
              {contactContent.hours && (
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#C8A951] text-[#1B2A4A]">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">Jam Pelayanan</p>
                    <p className="text-base font-bold">{contactContent.hours}</p>
                  </div>
                </div>
              )}
              {contactContent.location && (
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#C8A951] text-[#1B2A4A]">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">Lokasi BKK</p>
                    <p className="text-base font-bold leading-snug">{contactContent.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BkkHome
