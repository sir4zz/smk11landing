import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import type { Facility } from '../../lib/content-types'
import { fetchPublicContentById, resolveImageUrl } from '../../lib/api'
import { ArrowLeft, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { SkeletonDetail } from '../../components/ui/Skeleton'

const FacilityDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [item, setItem] = useState<Facility & { photos?: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)

  const load = () => {
    setLoading(true); setError(false)
    fetchPublicContentById<Facility & { photos?: string[] }>('facilities', slug || '')
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

  const allPhotos: string[] = [
    ...(item.photo ? [item.photo] : []),
    ...((item.photos ?? []).filter(Boolean)),
  ]
  const hasMultiplePhotos = allPhotos.length > 1

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

        {allPhotos.length > 0 && (
          <div className="mb-10 overflow-hidden rounded-[1.25rem] shadow-lg">
            <div className="relative">
              <img
                src={resolveImageUrl(allPhotos[activePhoto])!}
                alt={`${item.name} - Foto ${activePhoto + 1}`}
                className="h-auto w-full object-cover"
              />
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={() => setActivePhoto(p => p === 0 ? allPhotos.length - 1 : p - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActivePhoto(p => p === allPhotos.length - 1 ? 0 : p + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {allPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhoto(idx)}
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${idx === activePhoto ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {hasMultiplePhotos && (
          <div className="mb-10 grid grid-cols-4 sm:grid-cols-6 gap-3">
            {allPhotos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhoto(idx)}
                className={`overflow-hidden rounded-lg border-2 transition-all ${idx === activePhoto ? 'border-[#C8A951] shadow-md' : 'border-transparent hover:border-[#1B2A4A]/20'}`}
              >
                <img
                  src={resolveImageUrl(photo)!}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-20 w-full object-cover"
                />
              </button>
            ))}
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
