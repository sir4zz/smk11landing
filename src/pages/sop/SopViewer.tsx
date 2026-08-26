import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PdfCanvasViewer from '../../components/sop/PdfCanvasViewer';

export default function SopViewer() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  return <div className="min-h-screen bg-[#FAF6F0] px-3 py-6 sm:px-6 lg:px-8"><main className="mx-auto max-w-7xl"><Link to="/sop" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#866D2C] hover:text-[#1B2A4A]"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar SOP</Link><PdfCanvasViewer sourcePath={`/sop/${encodeURIComponent(slug)}/view`} title="Dokumen SOP" /></main></div>;
}
