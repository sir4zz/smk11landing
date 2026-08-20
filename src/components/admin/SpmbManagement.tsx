import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ImageIcon,
  Images,
  Loader2,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { SpmbContent, SpmbFaqItem, SpmbFlowStep, SpmbPoster, SpmbScheduleItem } from '../../lib/content-types';
import { backendApi, resolveImageUrl, spmbPosterApi } from '../../lib/api';
import { LoadingInline } from '../ui/LoadingScreen';
import ImageField from './ImageField';

interface Props {
  permissions: string[];
  isAdmin: boolean;
}

const inputClass = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';

function errorMessage(error: unknown): string {
  const e = error as { message?: string } | null;
  if (e?.message) return e.message;
  if (typeof error === 'object' && error !== null) {
    const joined = Object.values(error as Record<string, unknown>).map((v) => String(v)).join('; ');
    if (joined) return joined;
  }
  return 'Terjadi kesalahan.';
}

export default function SpmbManagement({ isAdmin }: Props) {
  const [tab, setTab] = useState<'posters' | 'settings'>('posters');

  const tabs = [
    { key: 'posters' as const, label: 'Pengumuman', icon: Images },
    { key: 'settings' as const, label: 'Pengaturan Portal', icon: GraduationCap, adminOnly: true },
  ].filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-[#1B2A4A] text-[#FAF6F0]' : 'text-[#23314D] hover:bg-[#FAF6F0]'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'posters' && <PostersTab />}
      {tab === 'settings' && isAdmin && <PortalSettingsTab />}
    </div>
  );
}

// ==========================================================================
// TAB: POSTER INFORMASI SPMB
// ==========================================================================

function PostersTab() {
  const [rows, setRows] = useState<SpmbPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SpmbPoster | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await spmbPosterApi.listAll();
    if (!error && data) setRows(data);
    else if (error) setMsg({ type: 'err', text: errorMessage(error) });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const save = async (record: Partial<SpmbPoster>) => {
    const payload = {
      title: record.title ?? '',
      image: record.image ?? '',
      is_active: Boolean(record.is_active),
      sort_order: Number(record.sort_order ?? 0),
      published_at: record.published_at ?? null,
      is_featured: Boolean(record.is_featured),
    };
    let r;
    if (editing?.id) {
      r = await spmbPosterApi.update(editing.id, payload);
    } else {
      r = await spmbPosterApi.create(payload);
    }
    if (r.error) {
      flash('err', errorMessage(r.error));
      return false;
    }
    return true;
  };

  const toggleActive = async (poster: SpmbPoster) => {
    if (!poster.id) return;
    const { error } = await spmbPosterApi.update(poster.id, { is_active: !poster.is_active });
    if (error) { flash('err', errorMessage(error)); return; }
    await load();
    flash('ok', poster.is_active ? 'Pengumuman dinonaktifkan.' : 'Pengumuman diaktifkan.');
  };

  const toggleFeatured = async (poster: SpmbPoster) => {
    if (!poster.id) return;
    const { error } = await spmbPosterApi.update(poster.id, { is_featured: !poster.is_featured });
    if (error) { flash('err', errorMessage(error)); return; }
    await load();
    flash('ok', poster.is_featured ? 'Pengumuman utama dibatalkan.' : 'Pengumuman ini ditetapkan sebagai Pengumuman Utama.');
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus poster ini?')) return;
    const { error } = await spmbPosterApi.remove(id);
    if (error) { flash('err', errorMessage(error)); return; }
    await load();
    flash('ok', 'Poster dihapus.');
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    if (!a.id || !b.id) return;
    const [ra, rb] = await Promise.all([
      spmbPosterApi.update(a.id, { sort_order: b.sort_order ?? 0 }),
      spmbPosterApi.update(b.id, { sort_order: a.sort_order ?? 0 }),
    ]);
    const error = ra.error ?? rb.error;
    if (error) { flash('err', errorMessage(error)); return; }
    await load();
  };

  if (loading && rows.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">
          Kelola pengumuman SPMB dalam bentuk poster. Pengumuman aktif akan tampil di halaman publik SPMB, dan satu
          pengumuman dapat ditetapkan sebagai Pengumuman Utama.
        </p>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"
        >
          <Plus size={18} /> Tambah Pengumuman
        </button>
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      {sorted.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <ImageIcon className="mx-auto h-12 w-12 text-[#C8A951]/50" />
          <p className="mt-4 font-semibold text-[#1B2A4A]">Belum ada pengumuman SPMB</p>
          <p className="mt-1 text-sm text-[#5B7088]">Unggah poster pengumuman SPMB untuk ditampilkan pada halaman publik.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((poster, index) => (
            <div key={poster.id ?? index} className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
              <div className="grid aspect-[3/4] place-items-center bg-[#FAF6F0] p-4">
                {poster.image && resolveImageUrl(poster.image) ? (
                  <img src={resolveImageUrl(poster.image)!} alt={poster.title || 'Poster SPMB'} className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-[#C8A951]/50" />
                )}
              </div>
              <div className="p-4">
                <h3 className="truncate font-bold text-[#1B2A4A]">{poster.title || 'Tanpa judul'}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {poster.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A951]/20 px-3 py-1 text-xs font-bold text-[#866D2C]">
                      <Star className="h-3 w-3 fill-[#866D2C]" /> Pengumuman Utama
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${poster.is_active ? 'bg-green-50 text-green-700' : 'bg-[#FAF6F0] text-[#5B7088]'}`}>
                    {poster.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <span className="rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#5B7088]">
                    Urutan: {poster.sort_order ?? 0}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5B7088]">
                  {formatDateLabel(poster.published_at ?? poster.created_at)}
                  {poster.creator_name && ` • Oleh ${poster.creator_name}`}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      title="Naikkan urutan"
                      className="rounded-lg border border-[#1B2A4A]/10 p-1.5 text-[#1B2A4A] transition-colors hover:bg-[#FAF6F0] disabled:opacity-40"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === sorted.length - 1}
                      title="Turunkan urutan"
                      className="rounded-lg border border-[#1B2A4A]/10 p-1.5 text-[#1B2A4A] transition-colors hover:bg-[#FAF6F0] disabled:opacity-40"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { setEditing(poster); setOpen(true); }} title="Edit" className="rounded-lg p-1.5 text-[#866D2C] hover:bg-[#FAF6F0]"><Pencil size={16} /></button>
                    <button type="button" onClick={() => toggleFeatured(poster)} title={poster.is_featured ? 'Batal sebagai Pengumuman Utama' : 'Tetapkan sebagai Pengumuman Utama'} className={`rounded-lg p-1.5 hover:bg-[#FAF6F0] ${poster.is_featured ? 'text-[#866D2C]' : 'text-[#1B2A4A]'}`}>
                      <Star size={16} className={poster.is_featured ? 'fill-[#866D2C]' : ''} />
                    </button>
                    <button type="button" onClick={() => toggleActive(poster)} title={poster.is_active ? 'Nonaktifkan' : 'Aktifkan'} className="rounded-lg p-1.5 text-[#1B2A4A] hover:bg-[#FAF6F0]">
                      {poster.is_active ? <X size={16} /> : <GraduationCap size={16} />}
                    </button>
                    <button type="button" onClick={() => poster.id && remove(poster.id)} title="Hapus" className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <PosterForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (record) => {
            const ok = await save({ ...record, id: editing?.id });
            if (ok) { setOpen(false); await load(); flash('ok', editing ? 'Poster diperbarui.' : 'Poster ditambahkan.'); }
          }}
        />
      )}
    </div>
  );
}

function PosterForm({ item, onClose, onSave }: { item: SpmbPoster | null; onClose: () => void; onSave: (r: Partial<SpmbPoster>) => void }) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [image, setImage] = useState(item?.image ?? '');
  const [isActive, setIsActive] = useState<boolean>(item ? Boolean(item.is_active) : true);
  const [sortOrder, setSortOrder] = useState<number>(item?.sort_order ?? 0);
  const [publishedAt, setPublishedAt] = useState<string>(item?.published_at ? item.published_at.slice(0, 10) : '');
  const [isFeatured, setIsFeatured] = useState<boolean>(item ? Boolean(item.is_featured) : false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!image.trim()) { setError('Poster/gambar wajib diisi.'); return; }
    setError('');
    onSave({
      title: title.trim(),
      image: image.trim(),
      is_active: isActive,
      sort_order: sortOrder,
      published_at: publishedAt || null,
      is_featured: isFeatured,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{item ? 'Edit' : 'Tambah'} Pengumuman SPMB</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PosterImageField label="Poster / Gambar" value={image} onChange={setImage} hint="JPG, JPEG, atau PNG (maks. 10 MB). Gambar otomatis dikompres ke WebP." />
          </div>
          <label className="block text-sm font-semibold">Judul
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="cth: Pengumuman Hasil Seleksi SPMB 2026" />
          </label>
          <label className="block text-sm font-semibold">Urutan
            <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">Tanggal Publikasi (opsional)
            <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-[#5B7088]">Kosongkan agar tampil segera. Diisi untuk menjadwalkan.</span>
          </label>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[#1B2A4A]" />
              Aktif (tampil di halaman publik)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 accent-[#866D2C]" />
              Jadikan Pengumuman Utama
            </label>
            <span className="text-xs font-normal text-[#5B7088]">Hanya satu pengumuman utama pada satu waktu.</span>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a]">
            <Save size={18} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function PosterImageField({ label, value, onChange, hint }: { label: string; value: string; onChange: (url: string) => void; hint?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data, error } = await spmbPosterApi.upload(file);
      if (error) throw error;
      if (!data?.url) throw new Error('Gagal mengunggah poster.');
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah poster.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1 overflow-hidden rounded-lg border border-[#1B2A4A]/20 bg-white">
        {value && resolveImageUrl(value) ? (
          <div className="relative">
            <img src={resolveImageUrl(value)!} alt="" className="mx-auto h-64 w-full bg-[#FAF6F0] object-contain" />
            <button
              type="button"
              title="Hapus gambar"
              onClick={() => onChange('')}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="grid h-40 place-items-center bg-[#FAF6F0] text-[#5B7088]">
            <ImageIcon size={28} />
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[#1B2A4A]/10 p-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => upload(e.target.files?.[0])}
            className="block w-full text-sm text-[#1B2A4A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B2A4A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#15203a] disabled:opacity-60"
          />
          {uploading && <Loader2 size={18} className="shrink-0 animate-spin text-[#866D2C]" />}
        </div>
        <div className="border-t border-[#1B2A4A]/10 px-3 py-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="...atau tempel URL gambar"
            className="block w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 text-sm font-normal"
          />
        </div>
      </div>
      {hint && <p className="mt-1 text-xs font-normal text-[#5B7088]">{hint}</p>}
      {error && <p className="mt-1 text-xs font-normal text-red-600">{error}</p>}
    </div>
  );
}

// ==========================================================================
// TAB: PENGATURAN PORTAL SPMB (existing single-row portal settings)
// ==========================================================================

function normalizeSpmbRow(row: Record<string, unknown>): SpmbContent {
  return {
    id: row.id as string | undefined,
    status: (row.status as SpmbContent['status']) || 'ditutup',
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    latest_info: String(row.latest_info ?? ''),
    requirements: Array.isArray(row.requirements) ? (row.requirements as string[]) : [],
    schedule: Array.isArray(row.schedule) ? (row.schedule as SpmbScheduleItem[]) : [],
    flow_steps: Array.isArray(row.flow_steps) ? (row.flow_steps as SpmbFlowStep[]) : [],
    faq: Array.isArray(row.faq) ? (row.faq as SpmbFaqItem[]) : [],
    portal_url: String(row.portal_url ?? ''),
    banner_image: String(row.banner_image ?? ''),
    banner_title: String(row.banner_title ?? ''),
    banner_description: String(row.banner_description ?? ''),
    updated_at: row.updated_at as string | undefined,
  };
}

function PortalSettingsTab() {
  const [content, setContent] = useState<SpmbContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await backendApi.database.from('spmb_content').select('*').limit(1).maybeSingle();
      if (!error && data) setContent(normalizeSpmbRow(data as Record<string, unknown>));
      setLoading(false);
    };
    void load();
  }, []);

  const update = <K extends keyof SpmbContent>(key: K, value: SpmbContent[K]) => {
    setContent((current) => (current ? { ...current, [key]: value } : null));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const { data: { user } } = await backendApi.auth.getCurrentUser();
    if (!user) {
      setMessage('Sesi telah habis. Silakan login ulang.');
      setSaving(false);
      return;
    }
    if (!content) return;
    const { id, ...payload } = content;
    try {
      let dbError;
      if (id) {
        const { error } = await backendApi.database.from('spmb_content').update(payload).eq('id', id);
        dbError = error;
      } else {
        const { error } = await backendApi.database.from('spmb_content').insert([payload]);
        dbError = error;
      }
      if (dbError) throw dbError;
      const { data: refreshed, error: refetchError } = await backendApi.database.from('spmb_content').select('*').limit(1).maybeSingle();
      if (refetchError) throw refetchError;
      if (!refreshed) throw new Error('Data tidak ditemukan setelah simpan.');
      setContent(normalizeSpmbRow(refreshed as Record<string, unknown>));
      setMessage('Informasi SPMB berhasil disimpan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan informasi SPMB.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingInline />;
  if (!content) return <p className="rounded-xl bg-white p-6 text-[#5B7088]">Data SPMB belum tersedia.</p>;

  return (
    <form onSubmit={save} className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Pengaturan Portal SPMB</h2>
            <p className="mt-1 text-sm text-[#5B7088]">Status pendaftaran dan link portal resmi tetap dikelola di sini.</p>
          </div>
          <label className="flex items-center gap-3 rounded-lg bg-[#FAF6F0] px-4 py-2 text-sm font-semibold">
            Status pendaftaran
            <select value={content.status} onChange={(event) => update('status', event.target.value as SpmbContent['status'])} className="rounded border border-[#1B2A4A]/20 bg-white px-2 py-1">
              <option value="dibuka">Dibuka</option>
              <option value="ditutup">Ditutup</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul" value={content.title} onChange={(value) => update('title', value)} />
          <Field label="Link pendaftaran resmi" type="url" value={content.portal_url} onChange={(value) => update('portal_url', value)} />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Banner SPMB</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><ImageField label="Gambar banner" value={content.banner_image} onChange={(url) => update('banner_image', url)} hint="Unggah file gambar atau tempel URL." /></div>
          <Field label="Judul banner" value={content.banner_title} onChange={(value) => update('banner_title', value)} />
          <div className="md:col-span-2"><Field label="Deskripsi banner" multiline value={content.banner_description} onChange={(value) => update('banner_description', value)} /></div>
        </div>
      </div>

      {message && <p className={`rounded-lg p-3 text-sm ${message.startsWith('Informasi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</p>}
      <div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan SPMB'}</button></div>
    </form>
  );
}

function Field({ label, value, onChange, multiline = false, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputClass} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </label>
  );
}

function formatDateLabel(value?: string | null): string {
  if (!value) return 'Belum dipublikasikan';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

