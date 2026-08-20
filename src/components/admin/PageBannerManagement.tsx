import { useCallback, useEffect, useState } from 'react';
import { Image, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type { PageBanner } from '../../lib/content-types';
import { pageBannerApi, resolveImageUrl } from '../../lib/api';
import ImageField from './ImageField';

const PAGE_KEY_OPTIONS = [
  { value: 'profil_direktori', label: 'Profil - Direktori' },
  { value: 'profil_guru', label: 'Profil - Guru / Tendik / OSIS' },
  { value: 'manajemen', label: 'Manajemen Sekolah' },
  { value: 'manajemen_kepsek', label: 'Manajemen - Kepala Sekolah' },
  { value: 'manajemen_wakasek', label: 'Manajemen - Wakil Kepala Sekolah' },
  { value: 'manajemen_kegiatan_guru', label: 'Manajemen - Kegiatan Guru' },
  { value: 'manajemen_tendik', label: 'Manajemen - Tenaga Kependidikan' },
  { value: 'osis', label: 'OSIS' },
  { value: 'osis_struktur', label: 'OSIS - Struktur' },
  { value: 'osis_kegiatan', label: 'OSIS - Kegiatan' },
  { value: 'osis_ekskul', label: 'OSIS - Ekstrakurikuler' },
  { value: 'kesiswaan_prestasi', label: 'Kesiswaan - Prestasi' },
  { value: 'akademik_fasilitas', label: 'Akademik - Fasilitas' },
  { value: 'mading', label: 'Mading' },
  { value: 'mading_detail', label: 'Mading - Detail' },
  { value: 'bkk_kelulusan', label: 'BKK - Kelulusan' },
];

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

export default function PageBannerManagement() {
  const [rows, setRows] = useState<PageBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PageBanner | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await pageBannerApi.listAll();
    if (!error && data) setRows(data);
    else if (error) setMsg({ type: 'err', text: errorMessage(error) });
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const save = async (record: Partial<PageBanner>) => {
    let r;
    if (editing?.id) {
      r = await pageBannerApi.update(editing.id, record);
    } else {
      r = await pageBannerApi.create(record as Record<string, unknown>);
    }
    if (r.error) {
      flash('err', errorMessage(r.error));
      return false;
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return;
    const { error } = await pageBannerApi.remove(id);
    if (error) { flash('err', errorMessage(error)); return; }
    await load();
    flash('ok', 'Banner dihapus.');
  };

  const toggleActive = async (banner: PageBanner) => {
    if (!banner.id) return;
    const { error } = await pageBannerApi.update(banner.id, { is_active: !banner.is_active });
    if (error) { flash('err', errorMessage(error)); return; }
    await load();
    flash('ok', banner.is_active ? 'Banner dinonaktifkan.' : 'Banner diaktifkan.');
  };

  if (loading && rows.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">
          Kelola banner gambar untuk setiap halaman. Banner aktif akan tampil sebagai background hero di halaman publik.
        </p>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"
        >
          <Plus size={18} /> Tambah Banner
        </button>
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      {rows.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Image className="mx-auto h-12 w-12 text-[#C8A951]/50" />
          <p className="mt-4 font-semibold text-[#1B2A4A]">Belum ada banner</p>
          <p className="mt-1 text-sm text-[#5B7088]">Tambahkan banner untuk ditampilkan pada halaman publik.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((banner) => {
            const label = PAGE_KEY_OPTIONS.find((o) => o.value === banner.page_key)?.label ?? banner.page_key;
            return (
              <div key={banner.id} className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
                <div className="relative h-32 bg-[#FAF6F0]">
                  {banner.image && resolveImageUrl(banner.image) ? (
                    <img src={resolveImageUrl(banner.image)!} alt={label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-[#5B7088]"><Image size={28} /></div>
                  )}
                  <span className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {banner.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#1B2A4A]">{label}</h3>
                  {banner.title && <p className="mt-1 text-sm text-[#5B7088] truncate">{banner.title}</p>}
                  <div className="mt-3 flex items-center justify-end gap-1">
                    <button type="button" onClick={() => toggleActive(banner)} title={banner.is_active ? 'Nonaktifkan' : 'Aktifkan'} className="rounded-lg p-1.5 text-[#1B2A4A] hover:bg-[#FAF6F0]">
                      {banner.is_active ? <X size={16} /> : <Image size={16} />}
                    </button>
                    <button type="button" onClick={() => { setEditing(banner); setOpen(true); }} title="Edit" className="rounded-lg p-1.5 text-[#866D2C] hover:bg-[#FAF6F0]"><Pencil size={16} /></button>
                    <button type="button" onClick={() => banner.id && remove(banner.id)} title="Hapus" className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <BannerForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (record) => {
            const ok = await save({ ...record, id: editing?.id });
            if (ok) { setOpen(false); await load(); flash('ok', editing ? 'Banner diperbarui.' : 'Banner ditambahkan.'); }
          }}
        />
      )}
    </div>
  );
}

function BannerForm({ item, onClose, onSave }: { item: PageBanner | null; onClose: () => void; onSave: (r: Partial<PageBanner>) => void }) {
  const [pageKey, setPageKey] = useState(item?.page_key ?? '');
  const [title, setTitle] = useState(item?.title ?? '');
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? '');
  const [image, setImage] = useState(item?.image ?? '');
  const [isActive, setIsActive] = useState<boolean>(item ? Boolean(item.is_active) : true);
  const [error, setError] = useState('');

  const usedKeys = PAGE_KEY_OPTIONS.map((o) => o.value);

  const submit = () => {
    if (!pageKey.trim()) { setError('Page key wajib diisi.'); return; }
    if (!item && usedKeys.includes(pageKey) ) {
      // Allow editing existing keys, but warn for new ones
    }
    setError('');
    onSave({
      page_key: pageKey.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      image: image.trim(),
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{item ? 'Edit' : 'Tambah'} Banner Halaman</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="grid gap-4">
          <div>
            <ImageField
              label="Gambar Banner"
              value={image}
              onChange={setImage}
              hint="Ukuran optimal: 1920x400px. JPG, JPEG, atau PNG (maks. 10 MB)."
            />
          </div>

          <label className="block text-sm font-semibold">
            Halaman
            <select value={pageKey} onChange={(e) => setPageKey(e.target.value)} className={inputClass}>
              <option value="">-- Pilih Halaman --</option>
              {PAGE_KEY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Judul Banner (opsional)
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Judul yang ditampilkan di atas banner" />
          </label>

          <label className="block text-sm font-semibold">
            Subtitle Banner (opsional)
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} placeholder="Deskripsi singkat di bawah judul" />
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[#1B2A4A]" />
            Aktif (tampil di halaman publik)
          </label>
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
