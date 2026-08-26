import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus } from 'lucide-react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { fetchSopPdf } from '../../lib/api';

GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfCanvasViewerProps {
  sourcePath: string;
  title: string;
}

export default function PdfCanvasViewer({ sourcePath, title }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [obscured, setObscured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPage(1);
    setPageCount(0);
    pdfRef.current?.destroy();
    pdfRef.current = null;

    fetchSopPdf(sourcePath)
      .then(async (blob) => {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const pdf = await getDocument({ data: bytes, disableAutoFetch: true, disableStream: true }).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Dokumen SOP tidak dapat dimuat.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      pdfRef.current?.destroy();
    };
  }, [sourcePath]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas) return;
      const pdfPage = await pdf.getPage(page);
      const viewport = pdfPage.getViewport({ scale: zoom * 1.3 });
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext('2d');
      if (!context || cancelled) return;
      await pdfPage.render({ canvas, canvasContext: context, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] }).promise;
    };
    render().catch(() => { if (!cancelled) setError('Halaman PDF tidak dapat ditampilkan.'); });
    return () => { cancelled = true; };
  }, [page, pageCount, zoom]);

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
    const obscure = () => setObscured(true);
    const restore = () => {
      if (!document.hidden) setObscured(false);
    };
    const onVisibilityChange = () => { if (document.hidden) obscure(); };
    window.addEventListener('keydown', blockShortcuts);
    window.addEventListener('keyup', wipeClipboard);
    window.addEventListener('blur', obscure);
    window.addEventListener('focus', restore);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.body.classList.remove('sop-print-protected');
      window.removeEventListener('keydown', blockShortcuts);
      window.removeEventListener('keyup', wipeClipboard);
      window.removeEventListener('blur', obscure);
      window.removeEventListener('focus', restore);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={viewerRef}
      data-pdf-viewer
      tabIndex={0}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={() => viewerRef.current?.focus()}
      className="overflow-hidden rounded-lg border border-[#1B2A4A]/15 bg-[#E8E3DA] outline-none select-none"
      aria-label={`Pembaca dokumen ${title}`}
    >
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[#1B2A4A]/15 bg-white px-3 py-2">
        <p className="min-w-0 truncate text-sm font-semibold text-[#1B2A4A]">{title}</p>
        <div className="flex items-center gap-1" aria-label="Kontrol pembaca PDF">
          <button type="button" title="Perkecil" onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.2).toFixed(1))))} className="grid h-8 w-8 place-items-center rounded border border-[#1B2A4A]/15 text-[#1B2A4A] hover:bg-[#FAF6F0]"><Minus className="h-4 w-4" /></button>
          <span className="w-12 text-center text-xs font-semibold text-[#5B7088]">{Math.round(zoom * 100)}%</span>
          <button type="button" title="Perbesar" onClick={() => setZoom((value) => Math.min(2.4, Number((value + 0.2).toFixed(1))))} className="grid h-8 w-8 place-items-center rounded border border-[#1B2A4A]/15 text-[#1B2A4A] hover:bg-[#FAF6F0]"><Plus className="h-4 w-4" /></button>
          <span className="mx-1 h-6 w-px bg-[#1B2A4A]/15" />
          <button type="button" title="Halaman sebelumnya" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded border border-[#1B2A4A]/15 text-[#1B2A4A] hover:bg-[#FAF6F0] disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-14 text-center text-xs font-semibold text-[#5B7088]">{pageCount ? `${page}/${pageCount}` : '-'}</span>
          <button type="button" title="Halaman berikutnya" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded border border-[#1B2A4A]/15 text-[#1B2A4A] hover:bg-[#FAF6F0] disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="min-h-[55vh] overflow-auto p-3 sm:p-6">
        {loading && <div className="grid min-h-[48vh] place-items-center text-[#5B7088]"><Loader2 className="h-7 w-7 animate-spin" /></div>}
        {error && <div className="grid min-h-[48vh] place-items-center p-6 text-center text-sm text-red-700">{error}</div>}
        {!loading && !error && <canvas ref={canvasRef} className="mx-auto block bg-white shadow-lg" />}
      </div>
      {obscured && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-white p-6 text-center" aria-hidden="true">
          <div>
            <p className="text-lg font-bold text-[#1B2A4A]">Konten disembunyikan</p>
            <p className="mt-2 text-sm text-[#5B7088]">Tangkapan layar tidak diizinkan. Kembali ke halaman ini untuk melanjutkan membaca.</p>
          </div>
        </div>
      )}
    </div>
  );
}
