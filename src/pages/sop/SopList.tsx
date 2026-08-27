import { useEffect, useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { Skeleton as Loader2 } from '../../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import { fetchPublishedSops, type SopRow } from '../../lib/api';

export default function SopList() {
  const [sops, setSops] = useState<SopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPublishedSops().then(setSops).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  return <div className="min-h-screen bg-[#FAF6F0]">
    <PageHero title="Standar Operasional Prosedur" subtitle="Dokumen prosedur resmi SMKN 11 Kabupaten Tangerang." breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Profil', href: '/profil/sejarah' }, { label: 'SOP' }]} />
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {loading ? <div className="grid min-h-56 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#866D2C]" /></div> : error ? <p className="rounded-lg bg-white p-8 text-center text-[#5B7088]">Daftar SOP tidak dapat dimuat. Silakan coba lagi.</p> : sops.length === 0 ? <div className="grid min-h-64 place-items-center bg-white p-8 text-center"><FolderOpen className="h-10 w-10 text-[#866D2C]" /><p className="mt-3 text-[#5B7088]">Belum ada SOP yang dipublikasikan.</p></div> : <div className="grid gap-4 md:grid-cols-2">
        {sops.map((sop) => <article key={sop.id} className="flex gap-4 border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
          <div className="grid h-11 w-11 shrink-0 place-items-center bg-[#FAF6F0] text-[#866D2C]"><FileText className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1"><span className="inline-block bg-[#F3E8D0] px-2 py-1 text-xs font-semibold text-[#866D2C]">{sop.category}</span><h2 className="mt-3 text-lg font-bold text-[#1B2A4A]">{sop.title}</h2><p className="mt-2 text-sm leading-6 text-[#5B7088]">{sop.description || 'Dokumen SOP resmi sekolah.'}</p><Link to={`/sop/${sop.slug}/view`} className="mt-4 inline-flex items-center gap-2 bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2B3D66]"><FileText className="h-4 w-4" /> Lihat Dokumen</Link></div>
        </article>)}
      </div>}
    </section>
  </div>;
}
