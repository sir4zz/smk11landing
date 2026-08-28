import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import type { Facility } from '../../lib/content-types'
import { fetchPublicContentById, resolveImageUrl } from '../../lib/api'
import { ArrowLeft, Building2 } from 'lucide-react'
import { SkeletonDetail } from '../../components/ui/Skeleton'

const FacilityDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [item, setItem] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setLoading(true); setError(false)
    fetchPublicContentById<Facility>('facilities', slug || '')
      .then((apiItem) => {
        if (apiItem) setItem(apiItem); else setError(true)
      }).catch(() => setError(true)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [slug])

  if (loading) return <div className="min-h-screen bg-[#FAF6F0]"><PageHero title="Fasilitas" /><SkeletonDetail /></div>
  if (!item || error) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Fasilitas Tidak Ditemukan" />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="mb-6 text-lg text-[#23314D]">{error ? 'Fasilitas gagal dimuat.' : 'Fasilitas yang Anda cari tidak tersedia.'}</p>
          {error && <button onClick={load} className="mb-4 rounded-lg bg-[#1B2A4A] px-5 py-2 text-sm font-bold text-white">Coba Lagi</button>}
          <Link to="/akademik/fasilitas">
            <Button variant="outline">Kembali ke Fasilitas</Button>
          </Link>
        </div>
      </div>
    )
  }

  const photoUrl = resolveImageUrl(item.photo)

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={item.name}
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Fasilitas', href: '/akademik/fasilitas' },
          { label: item.name },
        ]}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {item.category && (
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#C8A951]/20 px-4 py-1.5 text-sm font-semibold text-[#866D2C]">
              <Building2 className="h-4 w-4" />
              {item.category}
            </span>
          </div>
        )}

        {photoUrl && (
          <div className="mb-10 overflow-hidden rounded-[1.25rem] shadow-lg">
            <img
              src={photoUrl}
              alt={item.name}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-[#23314D] leading-relaxed">
          <p className="whitespace-pre-line">{item.description}</p>
        </div>

        <div className="mt-12 border-t border-[#1B2A4A]/10 pt-8">
          <Link to="/akademik/fasilitas">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Fasilitas
            </Button>
          </Link>
        </div>
      </article>
    </div>
  )
}

export default FacilityDetail
