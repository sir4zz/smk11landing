import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import Button from '../../components/ui/Button';
import type { TeacherActivity } from '../../lib/content-types';
import { fetchContentById, resolveImageUrl } from '../../lib/api';
import { SkeletonDetail } from '../../components/ui/Skeleton';
import { Calendar, ArrowLeft } from 'lucide-react';
import { formatDate } from './ManagementShared';

const KegiatanGuruDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<TeacherActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchContentById<TeacherActivity>('teacherActivities', id || '')
      .then((apiItem) => {
        if (apiItem) setItem(apiItem);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, reloadKey]);

  if (loading) return <div className="min-h-screen bg-[#FAF6F0]"><PageHero title="Detail Kegiatan Guru" /><SkeletonDetail /></div>;
  if (!item || error) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Kegiatan Tidak Ditemukan" />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="mb-6 text-lg text-[#23314D]">{error ? 'Kegiatan gagal dimuat.' : 'Kegiatan yang Anda cari tidak tersedia.'}</p>
          {error && <button onClick={() => setReloadKey((k) => k + 1)} className="mb-4 rounded-lg bg-[#1B2A4A] px-5 py-2 text-sm font-bold text-white">Coba Lagi</button>}
          <Link to="/manajemen/kegiatan-guru">
            <Button variant="outline">Kembali ke Kegiatan Guru</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={item.title}
        subtitle="Kegiatan guru SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Manajemen', href: '/manajemen' },
          { label: 'Kegiatan Guru', href: '/manajemen/kegiatan-guru' },
          { label: item.title },
        ]}
        backgroundImage={resolveImageUrl(item.photo)}
      />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm font-medium">
          <span className="flex items-center gap-2 text-[#23314D]/70">
            <Calendar className="h-4 w-4" />
            {formatDate(item.date)}
          </span>
          {item.category && (
            <span className="rounded-full bg-[#C8A951]/20 px-3 py-1 text-xs font-semibold text-[#866D2C]">
              {item.category}
            </span>
          )}
        </div>

        <h1 className="mb-6 text-2xl font-bold text-[#1B2A4A] md:text-3xl">{item.title}</h1>

        <div className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
          {resolveImageUrl(item.photo) && (
            <div className="relative h-64 w-full overflow-hidden sm:h-80 md:h-96">
              <img src={resolveImageUrl(item.photo)} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-6 sm:p-8 md:p-10">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#866D2C]">Deskripsi Kegiatan</h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[#23314D]">{item.description}</p>
          </div>
        </div>

        <div className="mt-10 border-t border-[#1B2A4A]/10 pt-8">
          <Link to="/manajemen/kegiatan-guru">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Kegiatan Guru
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
};

export default KegiatanGuruDetail;