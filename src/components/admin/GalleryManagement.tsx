import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Camera, GripVertical, ImagePlus, Images, Loader2, Pencil, Plus, Search, Trash2, Upload, X, Calendar, CheckCircle2, ChevronUp, ChevronDown, Link } from 'lucide-react';
import {
  galleryAdminApi, resolveImageUrl, youtubeThumbnailUrl,
  GALLERY_CATEGORIES,
  type GalleryRow, type GalleryImageRow, type GalleryVideoRow, type GalleryMeta,
} from '../../lib/api';

const PAGE_SIZE = 100;

interface GalleryImageDisplay {
  key: string;
  url?: string;
  file?: File;
}

export default function GalleryManagement() {
  const [albums, setAlbums] = useState<GalleryRow[]>([]);
  const [meta, setMeta] = useState<GalleryMeta>({ total: 0, page: 1, limit: PAGE_SIZE, last_page: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GalleryRow | null | 'new'>(null);

  const load = async (page: number, term: string) => {
    setLoading(true);
    const { data, error, meta } = await galleryAdminApi.list({ search: term || undefined, page, limit: PAGE_SIZE });
    if (!error && data) {
      setAlbums(data);
      setMeta((meta as GalleryMeta | undefined) ?? { total: 0, page: 1, limit: PAGE_SIZE, last_page: 1 });
    } else {
      setAlbums([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaved = async () => {
    setEditing(null);
    await load(meta.page, search);
  };

  return (
    <div>
      {editing ? (
        <GalleryForm
          key={editing === 'new' ? 'new' : editing.id}
          existing={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onDone={onSaved}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[#23314D]">Kelola album galeri kegiatan sekolah.</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') load(1, e.currentTarget.value); }}
                  placeholder="Cari judul/lokasi..."
                  className="w-56 rounded-lg border border-[#1B2A4A]/20 bg-white py-2.5 pl-10 pr-4 text-sm"
                />
              </div>
              <button
                onClick={() => setEditing('new')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2.5 font-bold text-[#1B2A4A] hover:bg-[#b69740]"
              >
                <Plus size={18} /> Tambah Album
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-white">
                  <div className="aspect-[4/3] bg-[#1B2A4A]/10" />
                  <div className="space-y-2 p-4"><div className="h-4 w-3/4 rounded bg-[#1B2A4A]/10" /><div className="h-3 w-1/2 rounded bg-[#1B2A4A]/10" /></div>
                </div>
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="grid place-items-center rounded-xl bg-white py-20 text-center shadow-sm">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#FAF6F0] text-[#866D2C]"><Images className="h-8 w-8" /></div>
              <h3 className="mt-4 text-lg font-bold text-[#1B2A4A]">Belum ada album</h3>
              <p className="mt-1 text-sm text-[#5B7088]">Buat album galeri pertama Anda.</p>
              <button onClick={() => setEditing('new')} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a]">
                <Plus size={18} /> Tambah Album
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {albums.map((album) => (
                  <div key={album.id} className="overflow-hidden rounded-xl border border-[#1B2A4A]/10 bg-white shadow-sm">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {album.cover_image ? (
                        <img src={resolveImageUrl(album.cover_image)} alt={album.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid h-full place-items-center bg-[#FAF6F0] text-[#23314D]/40"><Camera className="h-10 w-10" /></div>
                      )}
                      <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${album.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {album.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="truncate font-bold text-[#1B2A4A]">{album.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#5B7088]">
                        <span className="flex items-center gap-1"><Images className="h-3.5 w-3.5" />{album.images_count ?? 0} foto</span>
                        {album.event_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(album.event_date).getFullYear()}</span>}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => setEditing(album)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2A4A]/10 px-3 py-1.5 text-xs font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/20">
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Hapus album "${album.title}" beserta seluruh fotonya?`)) return;
                            const { error } = await galleryAdminApi.remove(album.id);
                            if (!error) await load(meta.page, search);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {meta.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-[#5B7088]">Total {meta.total} album</span>
                  <div className="flex gap-2">
                    <button disabled={meta.page <= 1} onClick={() => load(meta.page - 1, search)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-1.5 disabled:opacity-40 hover:bg-[#FAF6F0]">Prev</button>
                    <span className="px-3 py-1.5 font-semibold">{meta.page} / {meta.last_page}</span>
                    <button disabled={meta.page >= meta.last_page} onClick={() => load(meta.page + 1, search)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-1.5 disabled:opacity-40 hover:bg-[#FAF6F0]">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------------- FORM ----------------
function GalleryForm({ existing, onCancel, onDone }: { existing: GalleryRow | null; onCancel: () => void; onDone: () => void }) {
  const isEdit = Boolean(existing);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'Kegiatan');
  const [eventDate, setEventDate] = useState(existing?.event_date ? existing.event_date.slice(0, 10) : '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [existingImages, setExistingImages] = useState<GalleryImageRow[]>(existing?.images ?? []);
  const [newImages, setNewImages] = useState<GalleryImageDisplay[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [savedVideos, setSavedVideos] = useState<GalleryVideoRow[]>(existing?.videos ?? []);
  const [draftVideos, setDraftVideos] = useState<{ key: string; youtube_url: string; title: string }[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');

  const allImages: GalleryImageDisplay[] = useMemo(() => {
    const existingMapped = existingImages.map((im) => ({ key: `e-${im.id}`, url: im.image }));
    return [...existingMapped, ...newImages];
  }, [existingImages, newImages]);

  useEffect(() => {
    setExistingImages(existing?.images ?? []);
    setNewImages([]);
    setCoverFile(null);
    setSavedVideos(existing?.videos ?? []);
    setDraftVideos([]);
    setVideoUrlInput('');
    setVideoTitleInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const coverPreview = coverFile
    ? URL.createObjectURL(coverFile)
    : existing?.cover_image
      ? resolveImageUrl(existing.cover_image)
      : '';

  const uploadCover = (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setCoverFile(file);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setUploading(true);
    setMessage(null);
    if (isEdit && existing?.id) {
      const { error } = await galleryAdminApi.addImages(existing.id, arr);
      if (error) {
        setMessage({ type: 'error', text: 'Satu atau lebih foto gagal diunggah.' });
      } else {
        const { data } = await galleryAdminApi.list({ search: existing.title, page: 1, limit: PAGE_SIZE });
        const fresh = data?.find((g) => g.id === existing.id);
        setExistingImages(fresh?.images ?? []);
      }
    } else {
      setNewImages((prev) => [...prev, ...arr.map((f) => ({ key: `p-${Date.now()}-${f.name}`, file: f }))]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = async (index: number) => {
    const item = allImages[index];
    if (!item) return;
    if (item.key.startsWith('e-')) {
      const imageId = existingImages[index]?.id;
      if (!imageId) return;
      if (!confirm('Hapus foto ini?')) return;
      const { error } = await galleryAdminApi.removeImage(imageId);
      if (error) { setMessage({ type: 'error', text: 'Gagal menghapus foto.' }); return; }
      setExistingImages((prev) => prev.filter((im) => im.id !== imageId));
    } else {
      setNewImages((prev) => prev.filter((p) => p.key !== item.key));
    }
  };

  const onDrop = (from: number, to: number) => {
    if (from === to) return;
    const reordered = [...existingImages];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setExistingImages(reordered);
    if (existing?.id) {
      galleryAdminApi.reorder(reordered.map((im, i) => ({ id: im.id as string, sort_order: i })));
    }
    setDragIndex(null);
  };

  const addVideoDraft = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    setDraftVideos((prev) => [
      ...prev,
      { key: `v-${Date.now()}`, youtube_url: url, title: videoTitleInput.trim() },
    ]);
    setVideoUrlInput('');
    setVideoTitleInput('');
  };

  const removeVideo = async (video: GalleryVideoRow) => {
    if (video.id && video.id.startsWith('local-')) {
      setDraftVideos((prev) => prev.filter((v) => v.key !== video.id));
      return;
    }
    if (!confirm('Hapus video ini?')) return;
    const { error } = await galleryAdminApi.removeVideo(video.id);
    if (error) { setMessage({ type: 'error', text: 'Gagal menghapus video.' }); return; }
    setSavedVideos((prev) => prev.filter((v) => v.id !== video.id));
  };

  const moveVideo = async (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= savedVideos.length) return;
    const reordered = [...savedVideos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(to, 0, moved);
    setSavedVideos(reordered);
    galleryAdminApi.reorderVideos(reordered.map((v, i) => ({ id: v.id, sort_order: i })));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPublishing(true);
    setMessage(null);

    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Judul wajib diisi.' });
      setPublishing(false);
      return;
    }
    if (isEdit && existing?.id) {
      if (existingImages.length + newImages.length === 0) {
        setMessage({ type: 'error', text: 'Minimal satu foto diperlukan.' });
        setPublishing(false);
        return;
      }
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description);
      form.append('category', category);
      if (eventDate) form.append('event_date', eventDate);
      form.append('location', location);
      form.append('is_published', isPublished ? '1' : '0');
      if (coverFile) form.append('cover_image', coverFile);
      const { error } = await galleryAdminApi.update(existing.id, form);
      if (error) { setMessage({ type: 'error', text: 'Gagal menyimpan album.' }); setPublishing(false); return; }
      if (draftVideos.length) {
        await galleryAdminApi.addVideos(existing.id, draftVideos.map((v) => ({ youtube_url: v.youtube_url, title: v.title })));
      }
      setPublishing(false);
      onDone();
      return;
    }

    // CREATE
    const files = newImages.filter((n) => n.file).map((n) => n.file as File);
    if (!coverFile) { setMessage({ type: 'error', text: 'Cover wajib diunggah.' }); setPublishing(false); return; }
    if (files.length === 0) { setMessage({ type: 'error', text: 'Minimal satu foto wajib diunggah.' }); setPublishing(false); return; }

    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description);
    form.append('category', category);
    if (eventDate) form.append('event_date', eventDate);
    form.append('location', location);
    form.append('is_published', isPublished ? '1' : '0');
    form.append('cover_image', coverFile);
    files.forEach((f) => form.append('images[]', f));

    const created = await galleryAdminApi.create(form);
    if (created.error) { setMessage({ type: 'error', text: 'Gagal membuat album.' }); setPublishing(false); return; }
    const newId = created.data?.id;
    if (newId && draftVideos.length) {
      await galleryAdminApi.addVideos(newId, draftVideos.map((d) => ({ youtube_url: d.youtube_url, title: d.title })));
    }
    setPublishing(false);
    onDone();
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
      {message && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />} {message.text}
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B2A4A]">{isEdit ? 'Edit Album' : 'Tambah Album'}</h2>
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B2A4A]/20 px-3 py-1.5 text-sm font-semibold text-[#1B2A4A] hover:bg-[#FAF6F0]">
            <X size={16} /> Batal
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-[#1B2A4A]">Judul <span className="text-red-600">*</span></span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2.5 text-sm" placeholder="Contoh: Lomba Sekolah Se-Kabupaten" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#1B2A4A]">Tanggal Kegiatan</span>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2.5 text-sm" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#1B2A4A]">Lokasi</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2.5 text-sm" placeholder="Contoh: Lapangan SMKN 11" />
          </label>

          <div className="md:col-span-2 rounded-xl border border-[#1B2A4A]/15 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-[#1B2A4A]" />
              <span className="text-sm font-semibold text-[#1B2A4A]">Video YouTube</span>
            </div>
            <p className="mt-1 text-xs text-[#5B7088]">Video diambil dari link YouTube, tidak diunggah ke server. Bisa lebih dari satu.</p>

            {(savedVideos.length + draftVideos.length) === 0 && (
              <p className="mt-3 text-sm text-[#5B7088]">Belum ada video.</p>
            )}

            {savedVideos.map((video, i) => (
              <div key={video.id} className="mt-3 flex items-center gap-3 rounded-lg border border-[#1B2A4A]/15 bg-white p-2">
                <img src={youtubeThumbnailUrl(video.youtube_url)} alt="" className="h-14 w-20 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1B2A4A]">{video.title || 'Video tanpa judul'}</p>
                  <p className="truncate text-xs text-[#5B7088]">{video.youtube_url}</p>
                </div>
                <button type="button" onClick={() => moveVideo(i, -1)} disabled={i === 0} className="rounded p-1 text-[#5B7088] hover:text-[#1B2A4A] disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveVideo(i, 1)} disabled={i === savedVideos.length - 1} className="rounded p-1 text-[#5B7088] hover:text-[#1B2A4A] disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeVideo(video)} className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}

            {draftVideos.map((video) => (
              <div key={video.key} className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-[#1B2A4A]/20 bg-white p-2">
                <img src={youtubeThumbnailUrl(video.youtube_url) || ''} alt="" className="h-14 w-20 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1B2A4A]">{video.title || 'Video baru (belum disimpan)'}</p>
                  <p className="truncate text-xs text-[#5B7088]">{video.youtube_url}</p>
                </div>
                <button type="button" onClick={() => setDraftVideos((prev) => prev.filter((v) => v.key !== video.key))} className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700"><X className="h-4 w-4" /></button>
              </div>
            ))}

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input value={videoTitleInput} onChange={(e) => setVideoTitleInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVideoDraft(); } }} className="rounded-lg border border-[#1B2A4A]/20 px-3 py-2 text-sm" placeholder="Judul video (opsional)" />
              <input value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVideoDraft(); } }} className="rounded-lg border border-[#1B2A4A]/20 px-3 py-2 text-sm" placeholder="Tempel link YouTube, contoh: https://youtu.be/xxxx atau https://www.youtube.com/watch?v=xxxx" />
              <button type="button" onClick={addVideoDraft} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white hover:bg-[#2B3D66]"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-[#1B2A4A]">Deskripsi</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2.5 text-sm" placeholder="Cerita singkat kegiatan..." />
          </label>

          <div>
            <span className="text-sm font-semibold text-[#1B2A4A]">Kategori</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2.5 text-sm">
              {GALLERY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <span className="text-sm font-semibold text-[#1B2A4A]">Status</span>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setIsPublished(true)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${isPublished ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'border border-[#1B2A4A]/20 text-[#5B7088]'}`}>Publish</button>
              <button type="button" onClick={() => setIsPublished(false)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${!isPublished ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'border border-[#1B2A4A]/20 text-[#5B7088]'}`}>Draft</button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <span className="text-sm font-semibold text-[#1B2A4A]">Foto Cover <span className="text-red-600">*</span></span>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <label className="block">
            <span className="text-xs font-medium text-[#5B7088]">Unggah cover</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => { uploadCover(e.target.files?.[0]); e.target.value = ''; }}
              className="mt-1 block w-full text-sm text-[#1B2A4A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B2A4A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#15203a] disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-[#5B7088]">jpg, jpeg, png, webp • maks 5MB</p>
          </label>
          <div className="flex items-center gap-3">
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="h-24 w-40 rounded-lg object-cover" />
            ) : (
              <div className="grid h-24 w-40 place-items-center rounded-lg border border-dashed border-[#1B2A4A]/30 text-[#5B7088]"><Camera className="h-8 w-8" /></div>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#1B2A4A]">Foto Kegiatan <span className="text-red-600">*</span></h3>
            <p className="text-xs text-[#5B7088]">{isEdit ? 'Seret foto untuk mengubah urutan.' : 'Bisa pilih banyak foto sekaligus.'}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white hover:bg-[#15203a]">
            <Upload size={16} /> {uploading ? 'Mengunggah...' : 'Tambah Foto'}
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </label>
        </div>

        {allImages.length === 0 ? (
          <div className="grid place-items-center rounded-lg border border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0] py-12 text-center">
            <ImagePlus className="h-10 w-10 text-[#866D2C]" />
            <p className="mt-2 text-sm text-[#5B7088]">Belum ada foto. Klik "Tambah Foto" untuk mengunggah.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {allImages.map((item, index) => (
              <div
                key={item.key}
                draggable={isEdit && item.key.startsWith('e-')}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIndex !== null) onDrop(dragIndex, index); }}
                className={`group relative aspect-square overflow-hidden rounded-lg border bg-black/5 ${dragIndex === index ? 'opacity-50' : ''} ${isEdit && item.key.startsWith('e-') ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <img
                  src={item.file ? URL.createObjectURL(item.file) : resolveImageUrl(item.url || '')}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center gap-1 bg-black/40 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {isEdit && item.key.startsWith('e-') && <span className="flex items-center justify-center rounded bg-black/60 p-1.5 text-white"><GripVertical className="h-4 w-4" /></span>}
                  <button type="button" onClick={() => removeImage(index)} className="ml-auto rounded bg-red-600 p-1.5 text-white hover:bg-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
                <span className="absolute bottom-0 left-0 rounded-tr-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">{index + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#1B2A4A]/20 px-5 py-2.5 font-semibold text-[#1B2A4A] hover:bg-[#FAF6F0]">Batal</button>
        <button type="submit" disabled={publishing} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] disabled:opacity-60">
          {publishing && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit ? 'Simpan Perubahan' : 'Buat Album'}
        </button>
      </div>
    </form>
  );
}