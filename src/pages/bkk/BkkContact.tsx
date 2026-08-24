import React, { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import SectionHeading from '../../components/ui/SectionHeading'
import BkkSubNav from '../../components/bkk/BkkSubNav'
import { fetchBkkContactContent, type BkkContactContent } from '../../lib/api'
import { Phone, Mail, MapPin, Clock, MessageCircle, ExternalLink, Loader2 } from 'lucide-react'

const BKK_HERO_IMAGE = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80'

const DEFAULT_CONTACT: BkkContactContent = {
  whatsapp: '0812 9922 0831',
  whatsapp_link: 'https://wa.me/6281299220831',
  email: 'admin@smkn11kabtang.sch.id',
  location: 'Kp. Saradan RT. 03/01, Desa Pangkat, Kec. Jayanti, Kab. Tangerang, Banten 15610',
  hours: 'Senin - Jumat, 07.00 - 15.00 WIB',
}

const BkkContact: React.FC = () => {
  const [contact, setContact] = useState<BkkContactContent | null>(null)

  useEffect(() => {
    fetchBkkContactContent().then(setContact).catch(() => {})
  }, [])

  const content = contact ?? DEFAULT_CONTACT
  const whatsappLink = content.whatsapp_link || (content.whatsapp ? `https://wa.me/${content.whatsapp.replace(/\D/g, '')}` : '')

  const contactItems = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: content.whatsapp,
      href: whatsappLink,
      note: 'Hubungi kami melalui WhatsApp untuk informasi lowongan dan penyaluran lulusan.',
    },
    {
      icon: Mail,
      label: 'Email',
      value: content.email,
      href: `mailto:${content.email}`,
      note: 'Kirim surat elektronik untuk pertanyaan atau kerja sama dengan perusahaan.',
    },
    {
      icon: MapPin,
      label: 'Lokasi BKK',
      value: content.location,
      note: 'Kunjungi BKK SMKN 11 Kabupaten Tangerang pada jam pelayanan.',
    },
    {
      icon: Clock,
      label: 'Jam Pelayanan',
      value: content.hours,
      note: 'Pelayanan informasi lowongan dan administrasi BKK selama hari kerja.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Kontak BKK"
        subtitle="Hubungi Bursa Kerja Khusus (BKK) SMKN 11 Kabupaten Tangerang"
        backgroundImage={BKK_HERO_IMAGE}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'BKK', href: '/bkk' }, { label: 'Kontak BKK' }]}
      />

      <div className="relative z-10 -mt-6">
        <BkkSubNav />
      </div>

      {contact === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#C8A951]" />
        </div>
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
          <SectionHeading
            title="Informasi Kontak BKK"
            subtitle="Layanan informasi lowongan kerja dan penyaluran lulusan SMKN 11 Kabupaten Tangerang"
            align="center"
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {contactItems.map((item) => {
              const Icon = item.icon
              const hoverClass = item.href ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : ''
              const contentCard = (
                <div className={`flex h-full flex-col rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm transition-all ${hoverClass}`}>
                  <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#1B2A4A] text-[#C8A951]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#866D2C]">{item.label}</p>
                  <p className="mt-2 text-base font-bold leading-snug text-[#1B2A4A]">{item.value}</p>
                  {item.note && <p className="mt-3 text-sm leading-relaxed text-[#5B7088]">{item.note}</p>}
                  {item.href && (
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#866D2C]">
                      {item.label === 'WhatsApp' ? 'Chat WhatsApp' : 'Kirim Email'} <ExternalLink className="h-4 w-4" />
                    </span>
                  )}
                </div>
              )

              return item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block h-full"
                >
                  {contentCard}
                </a>
              ) : (
                <div key={item.label} className="h-full">
                  {contentCard}
                </div>
              )
            })}
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-8 shadow-sm">
              <SectionHeading title="Lokasi BKK" subtitle="Kunjungi langsung kantor BKK di lingkungan sekolah" />
              <div className="space-y-4 text-[#23314D]">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#866D2C]" />
                  <span className="font-medium">{content.location}</span>
                </p>
                <p className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-[#866D2C]" />
                  <span className="font-medium">{content.hours}</span>
                </p>
                {content.whatsapp && (
                  <p className="flex items-start gap-3">
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-[#866D2C]" />
                    <span className="font-medium">{content.whatsapp}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 shadow-sm">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(content.location)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '320px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi BKK SMKN 11 Kabupaten Tangerang"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default BkkContact
