import { useRef, useState } from 'react';
import { ImageIcon, Loader2, Plus, Trash2, Clapperboard } from 'lucide-react';
import { backendApi, resolveImageUrl, youtubeVideoId } from '../../lib/api';
import type { MadingVideo } from '../../lib/content-types';

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
  disabled?: boolean;
  bucket?: string;
  maxSizeMb?: number;
}

export function GalleryUpload({ value, onChange, hint, disabled = false, bucket = 'mading', maxSizeMb = 10 }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const urls = Array.isArray(value) ? value.filter(Boolean) : [];

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setError(`Ukuran file melebihi ${maxSizeMb} MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { data, error } = await backendApi.storage.from(bucket).uploadAuto(file);
      if (error) throw error;
      if (!data?.url) throw new Error('Gagal mengunggah foto.');
      onChange([...urls, data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    onChange([...urls, u]);
    setUrlInput('');
  };

  const removeAt = (i: number) => {
    onChange(urls.filter((_, idx) => idx !== i));
  };

  return (
    <div className="block">
      <span className="text-sm font-semibold">Foto / Galeri (opsional)</span>
      {urls.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="group relative overflow-hidden rounded-lg border border-[#1B2A4A]/10 bg-[#FAF6F0]">
              {resolveImageUrl(u)
                ? <img src={resolveImageUrl(u)!} alt={`Foto ${i + 1}`} loading="lazy" className="h-24 w-full object-cover" />
                : <div className="grid h-24 place-items-center text-[#5B7088]"><ImageIcon size={24} /></div>}
              {!disabled && (
                <button
                  type="button"
                  title="Hapus foto"
                  onClick={() => removeAt(i)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-100 transition-opacity hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 overflow-hidden rounded-lg border border-[#1B2A4A]/20 bg-white">
        <div className="flex items-center gap-2 p-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={disabled || uploading}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              void files.reduce(async (promise, file) => {
                await promise;
                await upload(file);
              }, Promise.resolve());
            }}
            className="block w-full text-sm text-[#1B2A4A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B2A4A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#15203a] disabled:opacity-60"
          />
          {uploading && <Loader2 size={18} className="shrink-0 animate-spin text-[#866D2C]" />}
        </div>
        <div className="flex items-center gap-2 border-t border-[#1B2A4A]/10 px-3 py-2">
          <input
            type="text"
            value={urlInput}
            disabled={disabled}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            placeholder="...atau tempel URL gambar lalu tekan Enter"
            className="block w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 text-sm font-normal disabled:opacity-60"
          />
          <button type="button" onClick={addUrl} disabled={disabled || !urlInput.trim()} className="inline-flex items-center gap-1 rounded-lg bg-[#1B2A4A] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
            <Plus size={14} /> Tambah
          </button>
        </div>
      </div>
      {hint && <p className="mt-1 text-xs font-normal text-[#5B7088]">{hint}</p>}
      {error && <p className="mt-1 text-xs font-normal text-red-600">{error}</p>}
    </div>
  );
}

interface VideoUrlsFieldProps {
  value: MadingVideo[];
  onChange: (videos: MadingVideo[]) => void;
  hint?: string;
  disabled?: boolean;
}

export function VideoUrlsField({ value, onChange, hint, disabled = false }: VideoUrlsFieldProps) {
  const videos = Array.isArray(value) ? value : [];

  const update = (i: number, patch: Partial<MadingVideo>) => {
    onChange(videos.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };

  const addRow = () => onChange([...videos, { url: '', title: '' }]);

  const removeRow = (i: number) => onChange(videos.filter((_, idx) => idx !== i));

  return (
    <div className="block">
      <span className="text-sm font-semibold">Video (opsional)</span>
      <p className="mt-0.5 text-xs font-normal text-[#5B7088]">Gunakan link YouTube / hosting video. Video tidak akan diputar otomatis.</p>
      <div className="mt-2 space-y-2">
        {videos.map((v, i) => {
          const valid = Boolean(v.url && youtubeVideoId(v.url));
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-[#1B2A4A]/20 bg-white">
              <div className="flex items-center gap-2 p-2.5">
                <Clapperboard className={`h-5 w-5 shrink-0 ${valid ? 'text-red-600' : 'text-[#5B7088]'}`} />
                <input
                  type="text"
                  value={v.url}
                  disabled={disabled}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 text-sm font-normal disabled:opacity-60"
                />
                {!disabled && (
                  <button type="button" title="Hapus video" onClick={() => removeRow(i)} className="text-red-600 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="border-t border-[#1B2A4A]/10 px-3 py-2">
                <input
                  type="text"
                  value={v.title ?? ''}
                  disabled={disabled}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder="Judul video (opsional)"
                  className="w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 text-sm font-normal disabled:opacity-60"
                />
              </div>
            </div>
          );
        })}
      </div>
      {!disabled && (
        <button type="button" onClick={addRow} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1B2A4A] hover:bg-[#FAF6F0]">
          <Plus size={14} /> Tambah Video
        </button>
      )}
      {hint && <p className="mt-1 text-xs font-normal text-[#5B7088]">{hint}</p>}
    </div>
  );
}
