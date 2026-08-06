import { useRef, useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { backendApi, resolveImageUrl } from '../../lib/api';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  disabled?: boolean;
}

export default function ImageField({ label, value, onChange, hint, disabled = false }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data, error } = await backendApi.storage.from('photos').uploadAuto(file);
      if (error) throw error;
      if (!data?.url) throw new Error('Gagal mengunggah foto.');
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1 overflow-hidden rounded-lg border border-[#1B2A4A]/20 bg-white">
        {value ? (
          <div className="relative">
            <img src={resolveImageUrl(value)} alt="" className="h-40 w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                title="Hapus foto"
                onClick={() => onChange('')}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid h-24 place-items-center text-[#5B7088]">
            <ImageIcon size={28} />
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[#1B2A4A]/10 p-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={disabled || uploading}
            onChange={(e) => upload(e.target.files?.[0])}
            className="block w-full text-sm text-[#1B2A4A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B2A4A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#15203a] disabled:opacity-60"
          />
          {uploading && <Loader2 size={18} className="shrink-0 animate-spin text-[#866D2C]" />}
        </div>
      </div>
      {hint && <p className="mt-1 text-xs font-normal text-[#5B7088]">{hint}</p>}
      {error && <p className="mt-1 text-xs font-normal text-red-600">{error}</p>}
    </div>
  );
}
