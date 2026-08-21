import { useRef, useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
import { spmbPosterApi } from '../../lib/api';

interface PdfFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  disabled?: boolean;
}

export default function PdfField({ label, value, onChange, hint, disabled = false }: PdfFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Ukuran file melebihi 20 MB.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { data, error } = await spmbPosterApi.uploadPdf(file);
      if (error) throw error;
      if (!data?.url) throw new Error('Gagal mengunggah PDF.');
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah PDF.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const fileName = value ? value.split('/').pop()?.replace(/^[^_]+-[^_]+-\d+-\d+-/, '') || value.split('/').pop() : '';

  return (
    <div className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1 overflow-hidden rounded-lg border border-[#1B2A4A]/20 bg-white">
        {value ? (
          <div className="relative flex items-center gap-3 bg-[#FAF6F0] px-4 py-3">
            <FileText size={24} className="shrink-0 text-[#866D2C]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1B2A4A]">{fileName || 'file.pdf'}</p>
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-[#866D2C] hover:underline">Buka di tab baru</a>
            </div>
            {!disabled && (
              <button
                type="button"
                title="Hapus PDF"
                onClick={() => onChange('')}
                className="shrink-0 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid h-24 place-items-center text-[#5B7088]">
            <FileText size={28} />
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[#1B2A4A]/10 p-3">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            disabled={disabled || uploading}
            onChange={(e) => upload(e.target.files?.[0])}
            className="block w-full text-sm text-[#1B2A4A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B2A4A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#15203a] disabled:opacity-60"
          />
          {uploading && <Loader2 size={18} className="shrink-0 animate-spin text-[#866D2C]" />}
        </div>
        <div className="border-t border-[#1B2A4A]/10 px-3 py-2">
          <input
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="...atau tempel URL PDF"
            className="block w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 text-sm font-normal disabled:opacity-60"
          />
        </div>
      </div>
      {hint && <p className="mt-1 text-xs font-normal text-[#5B7088]">{hint}</p>}
      {error && <p className="mt-1 text-xs font-normal text-red-600">{error}</p>}
    </div>
  );
}
