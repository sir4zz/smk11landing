import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchSopViewer } from '../../lib/api';

interface PdfCanvasViewerProps {
  sourcePath: string;
  title: string;
}

export default function PdfCanvasViewer({ sourcePath, title }: PdfCanvasViewerProps) {
  const [embedUrl, setEmbedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setEmbedUrl('');
    fetchSopViewer(sourcePath)
      .then((viewer) => { if (!cancelled) setEmbedUrl(viewer.embed_url); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Dokumen SOP tidak dapat dimuat.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [sourcePath]);

  useEffect(() => {
    document.body.classList.add('sop-print-protected');
    const blockShortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['p', 's', 'u', 'c'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        return;
      }
      if (event.key === 'PrintScreen') event.preventDefault();
    };
    const wipeClipboard = (event: KeyboardEvent) => {
      if (event.key !== 'PrintScreen') return;
      navigator.clipboard?.writeText('Konten dokumen SOP dilindungi dan tidak dapat disalin.').catch(() => undefined);
    };
    window.addEventListener('keydown', blockShortcuts);
    window.addEventListener('keyup', wipeClipboard);
    return () => {
      document.body.classList.remove('sop-print-protected');
      window.removeEventListener('keydown', blockShortcuts);
      window.removeEventListener('keyup', wipeClipboard);
    };
  }, []);

  return (
    <div
      data-pdf-viewer
      tabIndex={0}
      onContextMenu={(event) => event.preventDefault()}
      className="overflow-hidden rounded-lg border border-[#1B2A4A]/15 bg-[#E8E3DA] outline-none"
      aria-label={`Pembaca dokumen ${title}`}
    >
      <div className="flex min-h-12 items-center border-b border-[#1B2A4A]/15 bg-white px-3 py-2">
        <p className="min-w-0 truncate text-sm font-semibold text-[#1B2A4A]">{title}</p>
      </div>
      <div className="min-h-[70vh] overflow-hidden bg-[#E8E3DA]">
        {loading && <div className="grid min-h-[48vh] place-items-center text-[#5B7088]"><Loader2 className="h-7 w-7 animate-spin" /></div>}
        {error && <div className="grid min-h-[48vh] place-items-center p-6 text-center text-sm text-red-700">{error}</div>}
        {!loading && !error && embedUrl && <iframe src={embedUrl} title={title} className="h-[70vh] w-full border-0" allow="fullscreen" referrerPolicy="strict-origin-when-cross-origin" />}
      </div>
    </div>
  );
}
