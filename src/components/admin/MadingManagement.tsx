import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, Search, CheckCircle2, XCircle, Send, Eye, Sparkles, Clapperboard, Image } from 'lucide-react';
import { backendApi } from '../../lib/api';
import type { MadingPostRow } from '../../lib/api';
import { can } from '../../lib/permissions';
import { MADING_STATUSES } from '../../lib/ui-constants';
import ImageField from './ImageField';
import BannerTab from './BannerTab';
import AIContentAssistant from '../mading/AIContentAssistant';
import { GalleryUpload, VideoUrlsField } from '../mading/MediaEditor';
import { resolveImageUrl, youtubeThumbnailUrl } from '../../lib/api';

interface Props {
  permissions: string[];
}

interface PostItem extends MadingPostRow {
  category?: string;
}

const STATUS_ORDER = ['pending_review', 'draft', 'published', 'approved', 'rejected'];

function normalizeCategory(row: MadingPostRow): string {
  const rel = row['mading_categories'] as { name?: string } | null | undefined;
  return rel?.name ?? 'Lainnya';
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function MadingManagement({ permissions }: Props) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string; slug?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PostItem | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<PostItem | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id?: string; name: string; slug?: string } | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' });

  const load = useCallback(async () => {
    const { data, error } = await backendApi.database.from('mading_posts').select('*, mading_categories(name)');
    if (!error && data) {
      setPosts((data as MadingPostRow[]).map((r) => ({ ...r, category: normalizeCategory(r) })));
    }
    const { data: cats } = await backendApi.database.from('mading_categories').select('id, name, slug').order('sort_order', { ascending: true });
    if (cats) setCategories(cats as { id: string; name: string; slug?: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const filtered = useMemo(() => {
    return posts
      .filter((p) => (statusFilter ? p.status === statusFilter : true))
      .filter((p) => (categoryFilter ? String(p.category_id) === categoryFilter : true))
      .filter((p) => (search ? `${p.title ?? ''} ${p.author_name ?? ''}`.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => {
        const ia = STATUS_ORDER.indexOf(a.status ?? '');
        const ib = STATUS_ORDER.indexOf(b.status ?? '');
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
  }, [posts, statusFilter, categoryFilter, search]);

  const save = async (record: PostItem) => {
    const payload: Record<string, unknown> = { ...record };
    delete payload.id;
    delete payload.category;
    delete payload['mading_categories'];
    if (payload.category_id === '') payload.category_id = null;
    if (!payload.status) payload.status = 'draft';

    if (editing?.id) {
      const r = await backendApi.database.from('mading_posts').update(payload).eq('id', editing.id);
      if (r.error) { flash('err', r.error.message); return false; }
    } else {
      const r = await backendApi.database.from('mading_posts').insert([payload]);
      if (r.error) { flash('err', r.error.message); return false; }
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus karya ini?')) return;
    const r = await backendApi.database.from('mading_posts').delete().eq('id', id);
    if (r.error) { flash('err', r.error.message); return; }
    await load();
    flash('ok', 'Karya dihapus.');
  };

  const review = async (action: 'approve' | 'reject', feedback: string) => {
    if (!reviewTarget?.id) return;
    const r = await backendApi.database.rpc('review_mading_post', { p_post_id: reviewTarget.id, p_action: action, p_feedback: feedback });
    if (r.error) { flash('err', r.error.message); return; }
    setReviewOpen(false);
    setReviewTarget(null);
    await load();
    flash('ok', action === 'approve' ? 'Karya disetujui.' : 'Karya ditolak dengan feedback.');
  };

  const publish = async (id: string) => {
    const r = await backendApi.database.rpc('publish_mading_post', { p_post_id: id });
    if (r.error) { flash('err', r.error.message); return; }
    await load();
    flash('ok', 'Karya dipublikasikan.');
  };

  const openCategoryModal = (category?: { id?: string; name: string; slug?: string } | null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, slug: category.slug ?? slugify(category.name) });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '' });
    }
    setCategoryOpen(true);
  };

  const saveCategory = async () => {
    const name = categoryForm.name.trim();
    const slug = (categoryForm.slug || slugify(name)).trim();
    if (!name) {
      flash('err', 'Nama kategori wajib diisi.');
      return;
    }
    const payload = { name, slug };
    if (editingCategory?.id) {
      const { error } = await backendApi.database.from('mading_categories').update(payload).eq('id', editingCategory.id);
      if (error) { flash('err', error.message); return; }
    } else {
      const { error } = await backendApi.database.from('mading_categories').insert([payload]);
      if (error) { flash('err', error.message); return; }
    }
    setCategoryOpen(false);
    await load();
    flash('ok', 'Kategori tersimpan.');
  };

  const removeCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    const { error } = await backendApi.database.from('mading_categories').delete().eq('id', id);
    if (error) { flash('err', error.message); return; }
    await load();
    flash('ok', 'Kategori dihapus.');
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Kelola konten Mading sekolah.</p>
        <div className="flex flex-wrap gap-2">
          {can(permissions, 'mading.edit_all') && (
            <button onClick={() => openCategoryModal()} className="inline-flex items-center gap-2 rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 font-bold text-[#1B2A4A]">Kelola Kategori</button>
          )}
          {can(permissions, 'mading.create') && (
            <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Buat Konten</button>
          )}
        </div>
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul / penulis..." className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Status</option>
          {Object.entries(MADING_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {can(permissions, 'mading.edit_all') && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-[#1B2A4A]">Kategori Mading</h3>
            <button onClick={() => openCategoryModal()} className="text-sm font-semibold text-[#866D2C]">Tambah</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category.id} className="inline-flex items-center gap-2 rounded-full bg-[#FAF6F0] px-3 py-1 text-sm font-semibold text-[#1B2A4A]">
                {category.name}
                <button onClick={() => openCategoryModal(category)} className="text-[#866D2C]">Edit</button>
                <button onClick={() => removeCategory(category.id)} className="text-red-600">Ã—</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
            <tr>
              <th className="p-4">Judul</th>
              <th className="p-4">Penulis</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#5B7088]">Tidak ada karya.</td></tr>}
            {filtered.map((post) => (
              <tr key={String(post.id)} className="border-t border-[#1B2A4A]/10">
                <td className="p-4"><span className="font-semibold">{post.title || '-'}</span></td>
                <td className="p-4">{post.author_name || '-'}</td>
                <td className="p-4">{post.category || '-'}</td>
                <td className="p-4">
                  <StatusBadge status={post.status ?? 'draft'} />
                  {post.status === 'rejected' && post.feedback && <p className="mt-1 max-w-[220px] text-xs text-red-600 line-clamp-2">Feedback: {post.feedback}</p>}
                </td>
                <td className="p-4">
                  {(post.status === 'pending_review' || post.status === 'draft' || post.status === 'approved') && can(permissions, 'mading.review') && (
                    <button onClick={() => { setReviewTarget(post); setReviewOpen(true); }} className="mr-2 inline-flex items-center gap-1 rounded-lg bg-[#C8A951]/20 px-2 py-1 text-xs font-bold text-[#866D2C]"><Eye size={13} /> Review</button>
                  )}
                  {post.status === 'approved' && can(permissions, 'mading.publish') && (
                    <button onClick={() => publish(String(post.id))} className="mr-2 inline-flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-700"><Send size={13} /> Publish</button>
                  )}
                  {post.status === 'published' && can(permissions, 'mading.publish') && (
                    <button onClick={() => publish(String(post.id))} className="mr-2 inline-flex items-center gap-1 rounded-lg bg-[#FAF6F0] px-2 py-1 text-xs font-bold text-[#5B7088]">Republish</button>
                  )}
                  {can(permissions, 'mading.edit_all') && (
                    <button onClick={() => { setEditing(post); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>
                  )}
                  {can(permissions, 'mading.delete') && <button onClick={() => remove(String(post.id))} className="text-red-600"><Trash2 size={17} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <MadingForm
          item={editing}
          categories={categories}
          permissions={permissions}
          onClose={() => setOpen(false)}
          onSave={async (record) => {
            const ok = await save({ ...record, id: editing?.id });
            if (ok) { setOpen(false); await load(); flash('ok', 'Konten mading disimpan.'); }
          }}
        />
      )}

      {reviewOpen && reviewTarget && (
        <ReviewModal
          post={reviewTarget}
          onClose={() => { setReviewOpen(false); setReviewTarget(null); }}
          onApprove={() => review('approve', '')}
          onReject={(feedback) => review('reject', feedback)}
        />
      )}

      {categoryOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1B2A4A]">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setCategoryOpen(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold">Nama Kategori
                <input value={categoryForm.name} onChange={(e) => setCategoryForm((v) => ({ ...v, name: e.target.value, slug: v.slug || slugify(e.target.value) }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
              </label>
              <label className="block text-sm font-semibold">Slug
                <input value={categoryForm.slug} onChange={(e) => setCategoryForm((v) => ({ ...v, slug: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCategoryOpen(false)} className="px-4 py-2 text-[#5B7088]">Batal</button>
              <button onClick={() => void saveCategory()} className="rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Banner Mading</h3>
        <BannerTab pageKey="mading" label="Banner Mading" />
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-[#FAF6F0] text-[#5B7088]',
    pending_review: 'bg-amber-50 text-amber-700',
    approved: 'bg-blue-50 text-blue-700',
    rejected: 'bg-red-50 text-red-700',
    published: 'bg-green-50 text-green-700',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? map.draft}`}>{MADING_STATUSES[status as keyof typeof MADING_STATUSES] ?? status}</span>;
}

function MadingForm({ item, categories, permissions, onClose, onSave }: { item: PostItem | null; categories: { id: string; name: string }[]; permissions: string[]; onClose: () => void; onSave: (r: PostItem) => void }) {
  const [values, setValues] = useState<PostItem>(item ?? { title: '', content: '', category_id: '', author_name: '', author_role: 'guru', cover_image: '', images: [], videos: [], status: 'draft', feedback: '', ai_assisted: false });
  const [aiOpen, setAiOpen] = useState(false);
  const canUseAi = can(permissions, 'mading.ai_generate');
  const [aiAssisted, setAiAssisted] = useState<boolean>(Boolean(values.ai_assisted));

  const f = (key: keyof PostItem, type = 'text') => ({
    type,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{item ? 'Ubah' : 'Buat'} Konten Mading</h2>
          <button onClick={onClose}><X /></button>
        </div>
        {aiAssisted && <p className="mb-4 rounded-lg bg-[#C8A951]/10 p-3 text-sm text-[#866D2C]">Konten ini dibuat dengan bantuan AI dan tetap harus melalui proses review sebelum dipublikasikan.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Judul" {...f('title')} /></div>
          <label className="block text-sm font-semibold">Kategori
            <select value={String(values.category_id ?? '')} onChange={(e) => setValues((v) => ({ ...v, category_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
              <option value="">Lainnya</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <Field label="Nama Penulis" {...f('author_name')} />
          <div className="sm:col-span-2"><Field label="Isi Karya" multiline {...f('content')} /></div>
          <div className="sm:col-span-2"><ImageField label="Cover (opsional)" value={String(values.cover_image ?? '')} onChange={(url) => setValues((v) => ({ ...v, cover_image: url }))} /></div>
          <div className="sm:col-span-2"><GalleryUpload value={Array.isArray(values.images) ? values.images : []} onChange={(urls) => setValues((v) => ({ ...v, images: urls }))} /></div>
          <div className="sm:col-span-2"><VideoUrlsField value={Array.isArray(values.videos) ? values.videos : []} onChange={(videos) => setValues((v) => ({ ...v, videos }))} /></div>
        </div>
        {canUseAi && (
          <div className="mt-4">
            <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951]/15 px-4 py-2 text-sm font-bold text-[#866D2C] hover:bg-[#C8A951]/25"><Sparkles className="h-4 w-4" /> Bantu dengan AI</button>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button onClick={() => onSave({ ...values, ai_assisted: aiAssisted })} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white"><Save className="h-4 w-4" /> Simpan</button>
        </div>
      </div>
      <AIContentAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        categories={categories}
        editorContent={String(values.content ?? '')}
        editorCategoryId={String(values.category_id ?? '')}
        onUseResult={(r) => {
          setValues((v) => ({ ...v, title: r.title, content: r.content, category_id: r.category_id }));
          setAiAssisted(true);
        }}
      />
    </div>
  );
}

function ReviewModal({ post, onClose, onApprove, onReject }: { post: PostItem; onClose: () => void; onApprove: () => void; onReject: (feedback: string) => void }) {
  const [feedback, setFeedback] = useState('');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">Review Karya</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="rounded-xl bg-[#FAF6F0] p-4">
          <p className="text-xs font-semibold text-[#5B7088]">{post.category} · {post.author_role} · {post.author_name}</p>
          <h3 className="mt-1 text-lg font-bold text-[#1B2A4A]">{post.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#23314D]">{post.content}</p>
          {Array.isArray(post.images) && post.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {post.images.map((img, i) => (
                resolveImageUrl(img) ? <img key={`${img}-${i}`} src={resolveImageUrl(img)!} alt={`Foto ${i + 1}`} loading="lazy" className="h-20 w-full rounded-lg object-cover" /> : null
              ))}
            </div>
          )}
          {Array.isArray(post.videos) && post.videos.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {post.videos.map((vid, i) => {
                const thumb = youtubeThumbnailUrl(vid.url ?? '');
                return (
                  <a key={`${vid.url}-${i}`} href={vid.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-white p-2 text-xs font-semibold text-[#1B2A4A] hover:bg-[#FAF6F0]">
                    {thumb ? <img src={thumb} alt="" loading="lazy" className="h-10 w-16 rounded object-cover" /> : <Clapperboard className="h-5 w-5 shrink-0 text-red-600" />}
                    <span className="truncate">{vid.title || vid.url}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <label className="mt-5 block text-sm font-semibold">Feedback / Alasan penolakan
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" placeholder="cth. Silakan perbaiki bagian pembuka dan sesuaikan dengan tema Mading." />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button onClick={() => onReject(feedback)} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-bold text-white"><XCircle className="h-4 w-4" /> Reject</button>
          <button onClick={onApprove} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-bold text-white"><CheckCircle2 className="h-4 w-4" /> Approve</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, type = 'text', placeholder }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; multiline?: boolean; type?: string; placeholder?: string }) {
  const className = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';
  return (
    <label className="block text-sm font-semibold">{label}
      {multiline
        ? <textarea value={value} onChange={onChange} rows={6} placeholder={placeholder} className={className} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={className} />}
    </label>
  );
}
