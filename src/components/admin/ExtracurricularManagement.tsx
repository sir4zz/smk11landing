import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, Images } from 'lucide-react';
import { backendApi, resolveImageUrl } from '../../lib/api';
import type { ExtracurricularRecord } from '../../pages/osis/Extracurriculars';
import { can } from '../../lib/permissions';
import ImageField from './ImageField';
import BannerTab from './BannerTab';

interface Props {
  permissions: string[];
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function ExtracurricularManagement({ permissions }: Props) {
  const [items, setItems] = useState<ExtracurricularRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExtracurricularRecord | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await backendApi.database.from('extracurriculars').select('*').order('name', { ascending: true });
    setItems((data as ExtracurricularRecord[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const save = async (record: ExtracurricularRecord) => {
    const payload: Record<string, unknown> = { ...record };
    if (!payload.slug) payload.slug = slugify(String(payload.name)) || 'ekstrakurikuler';

    if (editing?.id) {
      const { id, ...rest } = payload;
      const r = await backendApi.database.from('extracurriculars').update(rest).eq('id', id);
      if (r.error) { flash('err', r.error.message); return false; }
    } else {
      const r = await backendApi.database.from('extracurriculars').insert([payload]);
      if (r.error) { flash('err', r.error.message); return false; }
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus ekstrakurikuler ini?')) return;
    const r = await backendApi.database.from('extracurriculars').delete().eq('id', id);
    if (r.error) { flash('err', r.error.message); return; }
    await load();
    flash('ok', 'Ekstrakurikuler dihapus.');
  };

  const togglePublish = async (record: ExtracurricularRecord) => {
    const next = record.status === 'published' ? 'draft' : 'published';
    const r = await backendApi.database.from('extracurriculars').update({ status: next }).eq('id', record.id);
    if (r.error) { flash('err', r.error.message); return; }
    await load();
    flash('ok', next === 'published' ? 'Ekstrakurikuler diterbitkan.' : 'Ekstrakurikuler di-unpublish.');
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Kelola ekstrakurikuler yang ditampilkan di area OSIS.</p>
        {can(permissions, 'extracurricular.create') && (
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Tambah</button>
        )}
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Pembina</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#5B7088]">Belum ada ekstrakurikuler.</td></tr>}
            {items.map((ekskul) => (
              <tr key={String(ekskul.id)} className="border-t border-[#1B2A4A]/10">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {ekskul.logo && resolveImageUrl(ekskul.logo) ? (
                      <img src={resolveImageUrl(ekskul.logo)!} alt="" className="h-10 w-10 rounded-lg object-contain" />
                    ) : ekskul.photo && resolveImageUrl(ekskul.photo) ? (
                      <img src={resolveImageUrl(ekskul.photo)!} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FAF6F0]"><Images className="h-4 w-4 text-[#866D2C]" /></div>
                    )}
                    <div>
                      <span className="font-semibold">{ekskul.name || '-'}</span>
                      {ekskul.short_description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#5B7088]">{ekskul.short_description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">{ekskul.category || '-'}</td>
                <td className="p-4">{ekskul.advisor || '-'}</td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ekskul.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-[#FAF6F0] text-[#5B7088]'}`}>{ekskul.status === 'published' ? 'Terbit' : 'Draf'}</span>
                </td>
                <td className="p-4">
                  {can(permissions, 'extracurricular.edit') && <button onClick={() => { setEditing(ekskul); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>}
                  {can(permissions, 'extracurricular.publish') && (
                    <button onClick={() => togglePublish(ekskul)} className="mr-3 text-[#1B2A4A]">{ekskul.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                  )}
                  {can(permissions, 'extracurricular.delete') && <button onClick={() => remove(String(ekskul.id))} className="text-red-600"><Trash2 size={17} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <ExtracurricularForm
          item={editing}
          categories={[...new Set(items.map((ekskul) => String(ekskul.category ?? '').trim()).filter(Boolean))]}
          onClose={() => setOpen(false)}
          onSave={async (record) => { const ok = await save(record); if (ok) { setOpen(false); await load(); flash('ok', 'Data ekstrakurikuler disimpan.'); } }}
        />
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Banner Ekstrakurikuler</h3>
        <BannerTab pageKey="ekstrakurikuler" label="Banner Ekstrakurikuler" />
      </section>
    </div>
  );
}

function ExtracurricularForm({ item, onClose, onSave, categories = [] }: { item: ExtracurricularRecord | null; onClose: () => void; onSave: (r: ExtracurricularRecord) => void; categories?: string[] }) {
  const [values, setValues] = useState<ExtracurricularRecord>(item ?? {
    name: '', category: '', description: '', short_description: '', full_description: '', photo: '', logo: '', advisor: '', schedule: '', place: '',
    achievements: [], documentation: [], gallery: [], status: 'published',
  });

  const f = (key: keyof ExtracurricularRecord, type: string = 'text') => ({
    type,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  const listField = (key: 'achievements' | 'documentation') => ({
    value: Array.isArray(values[key]) ? (values[key] as string[]).join('\n') : '',
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const text = 'value' in e.target ? String(e.target.value) : '';
      setValues((v) => ({ ...v, [key]: text.split('\n').map((s) => s.trim()).filter(Boolean) }));
    },
  });

  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState('');
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const uploadDocumentation = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setDocUploading(true);
    setDocError('');
    try {
      const urls: string[] = [];
      for (const file of arr) {
        const { data, error } = await backendApi.storage.from('extracurriculars').uploadAuto(file);
        if (error) throw error;
        if (!data?.url) throw new Error('Gagal mengunggah foto.');
        urls.push(data.url);
      }
      setValues((v) => ({ ...v, documentation: [...(Array.isArray(v.documentation) ? v.documentation : []), ...urls] }));
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    } finally {
      setDocUploading(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const uploadGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setGalleryUploading(true);
    setGalleryError('');
    try {
      const urls: string[] = [];
      for (const file of arr) {
        const { data, error } = await backendApi.storage.from('extracurriculars/gallery').uploadAuto(file);
        if (error) throw error;
        if (!data?.url) throw new Error('Gagal mengunggah foto.');
        urls.push(data.url);
      }
      setValues((v) => ({ ...v, gallery: [...(Array.isArray(v.gallery) ? v.gallery : []), ...urls] }));
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setValues((v) => ({
      ...v,
      gallery: (Array.isArray(v.gallery) ? v.gallery : []).filter((_, i) => i !== index),
    }));
  };

  const removeDocumentationImage = (index: number) => {
    setValues((v) => ({
      ...v,
      documentation: (Array.isArray(v.documentation) ? v.documentation : []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{item ? 'Ubah' : 'Tambah'} Ekstrakurikuler</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nama Ekstrakurikuler" {...f('name')} placeholder="cth. Karate" />
            </div>

            <label className="block text-sm font-semibold">Kategori
              <select value={String(values.category ?? '')} onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
                <option value="">— Pilih —</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                <option value="Olahraga">Olahraga</option>
                <option value="Seni">Seni</option>
                <option value="Keagamaan">Keagamaan</option>
                <option value="Kepemudaan">Kepemudaan</option>
                <option value="Kepramukaan">Kepramukaan</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </label>

            <Field label="Pembina" {...f('advisor')} placeholder="cth. Pak Budi" />
            <Field label="Jadwal Latihan" placeholder="cth. Jumat & Sabtu, 15:00-17:00" {...f('schedule')} />
            <Field label="Tempat" placeholder="cth. Lapangan Basket, Ruang 101" {...f('place')} />

            <label className="block text-sm font-semibold">Status
              <select value={String(values.status)} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
                <option value="published">Terbit</option>
                <option value="draft">Draf</option>
              </select>
            </label>

            <div className="sm:col-span-2">
              <ImageField label="Logo Ekstrakurikuler" value={String(values.logo ?? '')} onChange={(url) => setValues((v) => ({ ...v, logo: url }))} />
              <p className="mt-1 text-xs text-[#5B7088]">Logo akan ditampilkan di card dan detail. Gunakan gambar dengan transparansi PNG untuk hasil terbaik.</p>
            </div>

            <div className="sm:col-span-2">
              <Field label="Deskripsi Singkat" hint="Deskripsi pendek yang ditampilkan di card (maks. 150 karakter)." {...f('short_description')} placeholder="cth. Wadah pengembangan bela diri karate" />
            </div>

            <div className="sm:col-span-2">
              <Field label="Deskripsi Lengkap" hint="Deskripsi lengkap yang ditampilkan di halaman detail." multiline {...f('full_description')} placeholder="Ceritakan tentang ekstrakurikuler ini secara lengkap..." />
            </div>

            <div className="sm:col-span-2">
              <ImageField label="Foto Utama" value={String(values.photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, photo: url }))} />
            </div>

            <div className="sm:col-span-2">
              <Field label="Prestasi" hint="Satu prestasi per baris." multiline {...listField('achievements')} placeholder="Juara 1 Lomba Karate Tingkat Provinsi 2024" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold">
                Dokumentasi
                <span className="block font-normal text-xs text-[#5B7088]">Foto dokumentasi kegiatan lama (legacy). Upload atau masukkan URL, satu per baris.</span>
              </label>
              <textarea {...listField('documentation')} rows={3} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" placeholder="https://example.com/foto1.jpg" />
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={docUploading}
                  onChange={(e) => uploadDocumentation(e.target.files)}
                  className="block w-full text-sm text-[#1B2A4A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B2A4A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#15203a] disabled:opacity-60"
                />
                {docUploading && <Loader2 size={18} className="shrink-0 animate-spin text-[#866D2C]" />}
              </div>
              {docError && <p className="mt-1 text-xs font-normal text-red-600">{docError}</p>}
              {Array.isArray(values.documentation) && values.documentation.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {values.documentation.map((url, i) => (
                    <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg">
                      <img src={resolveImageUrl(url) || url} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeDocumentationImage(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold">
                Galeri Kegiatan
                <span className="block font-normal text-xs text-[#5B7088]">Foto-foto kegiatan terbaru. Upload beberapa foto sekaligus.</span>
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={galleryUploading}
                  onChange={(e) => uploadGallery(e.target.files)}
                  className="block w-full text-sm text-[#1B2A4A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B2A4A] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#15203a] disabled:opacity-60"
                />
                {galleryUploading && <Loader2 size={18} className="shrink-0 animate-spin text-[#866D2C]" />}
              </div>
              {galleryError && <p className="mt-1 text-xs font-normal text-red-600">{galleryError}</p>}
              {Array.isArray(values.gallery) && values.gallery.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {values.gallery.map((url, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg">
                      <img src={resolveImageUrl(url) || url} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeGalleryImage(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button onClick={() => onSave(values)} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white"><Save className="h-4 w-4" /> Simpan</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, type = 'text', hint, placeholder }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; multiline?: boolean; type?: string; hint?: string; placeholder?: string }) {
  const className = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';
  return (
    <label className="block text-sm font-semibold">{label}
      {hint && <span className="block font-normal text-xs text-[#5B7088]">{hint}</span>}
      {multiline
        ? <textarea value={value} onChange={onChange} rows={4} placeholder={placeholder} className={className} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} />}
    </label>
  );
}
