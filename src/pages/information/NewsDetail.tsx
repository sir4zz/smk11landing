import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageHero from '../../components/ui/PageHero'
import Button from '../../components/ui/Button'
import { isImportedNews, type NewsItem } from '../../lib/content-types'
import { fetchPublicContentById } from '../../lib/api'
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react'

const NewsDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [item, setItem] = useState<NewsItem | null>(null)

  useEffect(() => {
    fetchPublicContentById<NewsItem>('news', slug || '')
      .then((apiItem) => {
        if (apiItem) setItem(apiItem)
      })
  }, [slug])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Berita Tidak Ditemukan" />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="mb-6 text-lg text-[#23314D]">Berita yang Anda cari tidak tersedia.</p>
          <Link to="/informasi/berita">
            <Button variant="outline">Kembali ke Berita</Button>
          </Link>
        </div>
      </div>
    )
  }

  const otherNews: NewsItem[] = []

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={item.title}
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Berita', href: '/informasi/berita' },
          { label: item.title },
        ]}
        backgroundImage={item.thumbnail}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-6 text-sm font-medium text-[#23314D]/70">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(item.date)}
          </span>
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {item.author}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isImportedNews(item) ? 'bg-blue-600/10 text-blue-700' : 'bg-[#C8A951]/20 text-[#866D2C]'}`}>
            {isImportedNews(item) ? 'Sumber Eksternal' : 'Berita Sekolah'}
          </span>
          <span className="rounded-full bg-[#C8A951]/20 px-3 py-1 text-xs font-semibold text-[#866D2C]">
            {item.category}
          </span>
        </div>

        {isImportedNews(item) && item.source_url && (
          <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">Berita ini diambil dari sumber eksternal.</p>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 break-all font-medium underline underline-offset-2 hover:text-blue-600"
            >
              {item.source_url}
            </a>
            {item.source_label && item.source_label !== 'Diambil dari URL' && (
              <p className="mt-2 text-blue-700/80">{item.source_label}</p>
            )}
          </div>
        )}

        <div className="prose prose-lg max-w-none text-[#23314D] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />

        <div className="mt-12 flex flex-col gap-4 border-t border-[#1B2A4A]/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/informasi/berita">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Berita
            </Button>
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Link berita telah disalin!')
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1B2A4A] transition-colors hover:bg-[#FAF6F0]"
          >
            <Share2 className="h-4 w-4" /> Bagikan
          </button>
        </div>
      </article>

      {otherNews.length > 0 && (
        <section className="border-t border-[#1B2A4A]/10 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-[#1B2A4A]">Berita Lainnya</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {otherNews.map((n) => (
                <Link
                  key={n.id}
                  to={`/informasi/berita/${n.slug}`}
                  className="group rounded-2xl border border-[#1B2A4A]/10 bg-[#FAF6F0] p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="mb-2 inline-block rounded-full bg-[#C8A951]/20 px-2.5 py-0.5 text-xs font-semibold text-[#866D2C]">
                    {n.category}
                  </span>
                  <h3 className="font-bold text-[#1B2A4A] transition-colors group-hover:text-[#C8A951]">
                    {n.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#23314D] line-clamp-2">{n.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default NewsDetail
