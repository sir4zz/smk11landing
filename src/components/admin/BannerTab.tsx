import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import type { PageBanner } from '../../lib/content-types';
import { pageBannerApi, resolveImageUrl } from '../../lib/api';
import ImageField from './ImageField';

interface Props {
  pageKey: string;
  label?: string;
}

const inputClass = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';

export default function BannerTab({ pageKey, label }: Props) {
  const [banner, setBanner] = useState<PageBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await pageBannerApi.listAll();
    const existing = data?.find((b) => b.page_key === pageKey) ?? null;
    setBanner(existing);
    setLoading(false);
  }, [pageKey]);

  useEffect(() => { void load(); }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const update = (key: keyof PageBanner, value: unknown) => {
    setBanner((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      if (banner?.id) {
        const { error } = await pageBannerApi.update(banner.id, {
          title: banner.title,
          subtitle: banner.subtitle,
          image: banner.image,
          is_active: banner.is_active,
        });
        if (error) throw error;
      } else {
        const { data, error } = await pageBannerApi.create({
          page_key: pageKey,
          title: banner?.title ?? '',
          subtitle: banner?.subtitle ?? '',
          image: banner?.image ?? '',
          is_active: true,
        });
        if (error) throw error;
        if (data) setBanner(data);
      }
      flash('ok', 'Banner berhasil disimpan.');
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Gagal menyimpan banner.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#1B2A4A]">{label ?? 'Banner Halaman'}</h3>
          <p className="mt-1 text-sm text-[#5B7088]">Atur gambar banner yang tampil di hero section halaman publik.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={banner?.is_active ?? false}
            onChange={(e) => update('is_active', e.target.checked)}
            className="h-4 w-4 accent-[#1B2A4A]"
          />
          Aktif
        </label>
      </div>

      <div className="grid gap-4">
        <ImageField
          label="Gambar Banner"
          value={banner?.image ?? ''}
          onChange={(url) => update('image', url)}
          hint="Ukuran optimal: 1920x400px. JPG, JPEG, atau PNG (maks. 10 MB)."
        />

        {banner?.image && resolveImageUrl(banner.image) && (
          <div className="overflow-hidden rounded-lg border border-[#1B2A4A]/10">
            <div className="relative h-32 bg-[#FAF6F0]">
              <img src={resolveImageUrl(banner.image)!} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => update('image', '')}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <label className="block text-sm font-semibold">
          Judul (opsional)
          <input
            value={banner?.title ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className={inputClass}
            placeholder="Judul yang ditampilkan di atas banner"
          />
        </label>

        <label className="block text-sm font-semibold">
          Subtitle (opsional)
          <input
            value={banner?.subtitle ?? ''}
            onChange={(e) => update('subtitle', e.target.value)}
            className={inputClass}
            placeholder="Deskripsi singkat di bawah judul"
          />
        </label>
      </div>

      {msg && <p className={`mt-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a] disabled:opacity-60"
        >
          <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Banner'}
        </button>
      </div>
    </div>
  );
}
