import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { sopAdminApi, type SopRow } from '../../lib/api';
import PdfCanvasViewer from '../sop/PdfCanvasViewer';

const empty = { title: '', slug: '', description: '', category: 'Umum', sort_order: '0', is_published: false };
type FormState = typeof empty;

export default function SopManagement() {
  const [rows, setRows] = useState<SopRow[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<SopRow | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<SopRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await sopAdminApi.list();
    if (error) setMessage(error.message ?? 'Daftar SOP tidak dapat dimuat.');
    else setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setFile(null); setOpen(true); setMessage(''); };
  const openEdit = (row: SopRow) => { setEditing(row); setForm({ title: row.title, slug: row.slug, description: row.description ?? '', category: row.category ?? 'Umum', sort_order: String(row.sort_order ?? 0), is_published: row.is_published }); setFile(null); setOpen(true); setMessage(''); };
  const closeForm = () => { setOpen(false); setFile(null); if (fileRef.current) fileRef.current.value = ''; };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing && !file) { setMessage('Pilih file PDF untuk SOP baru.'); return; }
    if (file && (file.type !== 'application/pdf' || file.size > 20 * 1024 * 1024)) { setMessage('File harus PDF dengan ukuran maksimal 20 MB.'); return; }
    const payload = new FormData();
    payload.set('title', form.title);
    payload.set('slug', form.slug);
    payload.set('description', form.description);
    payload.set('category', form.category);
    payload.set('sort_order', form.sort_order || '0');
    payload.set('is_published', form.is_published ? '1' : '0');
    if (file) payload.set('file', file);
    setSaving(true);
    const result = editing ? await sopAdminApi.update(editing.id, payload) : await sopAdminApi.create(payload);
    setSaving(false);
    if (result.error || !result.data) { setMessage(result.error?.message ?? 'SOP gagal disimpan.'); return; }
    closeForm();
    await load();
  };

  const remove = async (row: SopRow) => {
    if (!confirm(`Hapus SOP "${row.title}"? File privatnya juga akan dihapus.`)) return;
    const { error } = await sopAdminApi.remove(row.id);
    if (error) { setMessage(error.message ?? 'SOP gagal dihapus.'); return; }
    setRows((current) => current.filter((item) => item.id !== row.id));
  };

  return <section>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-[#5B7088]">Kelola dokumen SOP yang disimpan pada penyimpanan privat.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2B3D66]"><Plus className="h-4 w-4" /> Tambah SOP</button></div>
    {message && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <div className="overflow-x-auto rounded-lg border border-[#1B2A4A]/10 bg-white"><table className="min-w-full text-sm"><thead className="bg-[#FAF6F0] text-left text-xs uppercase tracking-wide text-[#5B7088]"><tr><th className="px-4 py-3">Dokumen</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Urutan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-[#5B7088]">Memuat SOP...</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-[#5B7088]">Belum ada SOP.</td></tr> : rows.map((row) => <tr key={row.id} className="border-t border-[#1B2A4A]/10"><td className="px-4 py-3"><p className="font-semibold text-[#1B2A4A]">{row.title}</p><p className="mt-1 max-w-md truncate text-xs text-[#5B7088]">{row.description || '-'}</p></td><td className="px-4 py-3">{row.category}</td><td className="px-4 py-3">{row.sort_order}</td><td className="px-4 py-3"><span className={row.is_published ? 'text-green-700' : 'text-amber-700'}>{row.is_published ? 'Published' : 'Draft'}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" title="Preview PDF" onClick={() => setPreview(row)} className="rounded p-2 text-[#866D2C] hover:bg-[#FAF6F0]"><Eye className="h-4 w-4" /></button><button type="button" title="Ubah SOP" onClick={() => openEdit(row)} className="rounded p-2 text-[#1B2A4A] hover:bg-[#FAF6F0]"><Pencil className="h-4 w-4" /></button><button type="button" title="Hapus SOP" onClick={() => remove(row)} className="rounded p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-4"><form onSubmit={submit} className="mx-auto my-8 max-w-2xl rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#1B2A4A]/10 px-5 py-4"><h2 className="font-bold text-[#1B2A4A]">{editing ? 'Ubah SOP' : 'Tambah SOP'}</h2><button type="button" title="Tutup" onClick={closeForm} className="rounded p-1 text-[#5B7088] hover:bg-[#FAF6F0]"><X className="h-5 w-5" /></button></div><div className="grid gap-4 p-5 md:grid-cols-2"><label className="md:col-span-2 text-sm font-semibold text-[#1B2A4A]">Judul SOP<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" /></label><label className="text-sm font-semibold text-[#1B2A4A]">Kategori<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" /></label><label className="text-sm font-semibold text-[#1B2A4A]">Urutan tampil<input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" /></label><label className="md:col-span-2 text-sm font-semibold text-[#1B2A4A]">Deskripsi singkat<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" /></label><label className="md:col-span-2 text-sm font-semibold text-[#1B2A4A]">File PDF {editing ? '(kosongkan jika tidak diganti)' : ''}<input ref={fileRef} type="file" accept="application/pdf,.pdf" required={!editing} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full font-normal text-sm file:mr-3 file:rounded file:border-0 file:bg-[#1B2A4A] file:px-3 file:py-2 file:text-white" /><span className="mt-1 block text-xs font-normal text-[#5B7088]">Maksimal 20 MB. File tidak dipublikasikan ke URL storage.</span></label><label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-[#1B2A4A]"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Publikasikan SOP</label></div><div className="flex justify-end gap-2 border-t border-[#1B2A4A]/10 px-5 py-4"><button type="button" onClick={closeForm} className="rounded-lg border border-[#1B2A4A]/20 px-4 py-2 text-sm font-semibold">Batal</button><button disabled={saving} className="rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan SOP'}</button></div></form></div>}
    {preview && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6"><div className="mx-auto max-w-6xl"><div className="mb-2 flex justify-end"><button type="button" onClick={() => setPreview(null)} className="rounded bg-white p-2 text-[#1B2A4A]" title="Tutup preview"><X className="h-5 w-5" /></button></div><PdfCanvasViewer sourcePath={sopAdminApi.previewPath(preview.id)} title={`Preview: ${preview.title}`} /></div></div>}
  </section>;
}
