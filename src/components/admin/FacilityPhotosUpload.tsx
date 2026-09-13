import { useCallback, useRef, useState } from 'react';
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { backendApi, resolveImageUrl } from '../../lib/api';

interface FacilityPhotosUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  maxPhotos?: number;
  disabled?: boolean;
}

export function FacilityPhotosUpload({
  value,
  onChange,
  bucket = 'photos',
  maxPhotos = 20,
  disabled = false,
}: FacilityPhotosUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(0);

  const urls = Array.isArray(value) ? value.filter(Boolean) : [];

  const uploadFiles = useCallback(async (files: File[]) => {
    const remaining = maxPhotos - urls.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length < files.length) {
      setError(`Maks ${maxPhotos} foto. Hanya ${toUpload.length} yang diunggah.`);
    }
    setUploading(true);
    setError('');
    setUploadCount({ done: 0, total: toUpload.length });

    let current = [...urls];
    for (const file of toUpload) {
      try {
        const { data, error: upErr } = await backendApi.storage.from(bucket).uploadAuto(file);
        if (upErr) throw upErr;
        if (data?.url) {
          current = [...current, data.url];
          onChange(current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal upload.');
      }
      setUploadCount(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setUploading(false);
    setUploadCount({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = '';
  }, [urls, maxPhotos, bucket, onChange]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(prev => prev + 1);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(prev => Math.max(0, prev - 1));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(0);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) void uploadFiles(files);
  }, [uploadFiles]);

  const removeAt = (idx: number) => {
    onChange(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Preview Grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-[#1B2A4A]/10 bg-[#FAF6F0]">
              {resolveImageUrl(u) ? (
                <img src={resolveImageUrl(u)!} alt={`Foto ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-[#5B7088]"><ImageIcon size={20} /></div>
              )}
              {!disabled && (
                <button
                  type="button"
                  title="Hapus"
                  onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          dragging > 0
            ? 'border-[#C8A951] bg-[#C8A951]/10 scale-[1.01]'
            : 'border-[#1B2A4A]/20 bg-white hover:border-[#C8A951]/50 hover:bg-[#FAF6F0]'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || uploading}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) void uploadFiles(files);
          }}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="animate-spin text-[#866D2C]" />
            <p className="text-sm font-semibold text-[#866D2C]">Mengunggah {uploadCount.done}/{uploadCount.total}...</p>
          </div>
        ) : (
          <>
            <Upload size={28} className={`mx-auto mb-2 ${dragging > 0 ? 'text-[#C8A951]' : 'text-[#5B7088]'}`} />
            <p className="text-sm font-semibold text-[#1B2A4A]">
              {dragging > 0 ? 'Lepaskan foto di sini...' : 'Seret & lepas foto, atau klik untuk memilih'}
            </p>
            <p className="mt-1 text-xs text-[#5B7088]">
              Bisa pilih banyak sekaligus &middot; {urls.length}/{maxPhotos} foto
            </p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
