import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { usePageBanner } from '../../lib/usePageBanner';
import { fetchExtracurricularBySlug, resolveImageUrl } from '../../lib/api';
import type { ExtracurricularRecord } from './Extracurriculars';
import { User, Clock, MapPin, Trophy, ChevronLeft, ImageIcon, Calendar, Star, X } from 'lucide-react';

const ExtracurricularDetail: React.FC = () => {
  const { backgroundImage } = usePageBanner('osis_ekskul');
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<ExtracurricularRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchExtracurricularBySlug<ExtracurricularRecord>(slug ?? '').then((data) => {
      if (!active) return;
      setItem(data);
      setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF6F0] to-white">
        <PageHero title="Ekstrakurikuler" subtitle="Detail kegiatan ekstrakurikuler" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler', href: '/osis/ekstrakurikuler' }]} backgroundImage={backgroundImage} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  const allImages = [
    ...(item.photo ? [item.photo] : []),
    ...(Array.isArray(item.documentation) ? item.documentation : []),
    ...(Array.isArray(item.gallery) ? item.gallery : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF6F0] to-white">
      <PageHero
        title={item.name}
        subtitle={item.category}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'OSIS', href: '/osis' }, { label: 'Ekstrakurikuler', href: '/osis/ekstrakurikuler' }, { label: item.name }]}
        backgroundImage={backgroundImage}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
        <Link to="/osis/ekstrakurikuler" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#866D2C] transition-colors hover:text-[#C8A951]">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Ekstrakurikuler
        </Link>

        <div className="overflow-hidden rounded-3xl border border-[#1B2A4A]/10 bg-white shadow-xl">
          <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-[#1B2A4A] to-[#23314D] sm:h-80">
            {item.photo ? (
              <img src={resolveImageUrl(item.photo) || item.photo} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <ImageIcon className="h-20 w-20 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {item.logo && resolveImageUrl(item.logo) && (
              <div className="absolute bottom-6 left-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-2xl">
                <img
                  src={resolveImageUrl(item.logo)!}
                  alt={`Logo ${item.name}`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#C8A951]/10 px-4 py-1.5 text-sm font-semibold text-[#866D2C]">
                {item.category}
              </span>
              {item.advisor && (
                <span className="flex items-center gap-1.5 text-sm text-[#5B7088]">
                  <User className="h-4 w-4 text-[#C8A951]" />
                  Pembina: {item.advisor}
                </span>
              )}
            </div>

            <h2 className="mb-6 text-2xl font-bold text-[#1B2A4A]">Tentang Ekstrakurikuler</h2>
            <div className="prose max-w-none text-[#23314D] leading-relaxed">
              {item.full_description || item.description ? (
                <p className="whitespace-pre-line">{item.full_description || item.description}</p>
              ) : (
                <p className="text-[#5B7088] italic">Deskripsi belum tersedia</p>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard icon={<User className="h-5 w-5" />} label="Pembina" value={item.advisor} />
              <InfoCard icon={<Clock className="h-5 w-5" />} label="Jadwal Latihan" value={item.schedule} />
              <InfoCard icon={<MapPin className="h-5 w-5" />} label="Tempat" value={item.place} />
            </div>

            {Array.isArray(item.achievements) && item.achievements.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-5 flex items-center gap-2 text-xl font-bold text-[#1B2A4A]">
                  <Trophy className="h-6 w-6 text-[#C8A951]" /> Prestasi
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.achievements.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-[#FAF6F0] p-4 transition-colors hover:bg-[#C8A951]/10">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C8A951]/20">
                        <Star className="h-4 w-4 text-[#866D2C]" />
                      </div>
                      <span className="text-sm leading-relaxed text-[#23314D]">{typeof a === 'string' ? a : String(a)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(Array.isArray(item.documentation) && item.documentation.length > 0) ||
             (Array.isArray(item.gallery) && item.gallery.length > 0) ? (
              <div className="mt-10">
                <h3 className="mb-5 flex items-center gap-2 text-xl font-bold text-[#1B2A4A]">
                  <ImageIcon className="h-6 w-6 text-[#C8A951]" /> Galeri Kegiatan
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(resolveImageUrl(url) || url)}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-[#FAF6F0]"
                    >
                      <img
                        src={resolveImageUrl(url) || url}
                        alt={`Dokumentasi ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={selectedImage}
            alt="Galeri"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#1B2A4A]/5 bg-gradient-to-br from-[#FAF6F0] to-white p-5 transition-all hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C8A951]/15 text-[#866D2C]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5B7088]">{label}</p>
        <p className="mt-0.5 truncate font-semibold text-[#1B2A4A]">{value || '-'}</p>
      </div>
    </div>
  );
}

export default ExtracurricularDetail;
