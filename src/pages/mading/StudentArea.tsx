import { Fragment, useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, BookMarked, PenLine, UserRound, LogOut, Loader2, Send, Save, CheckCircle2, XCircle, Clock, Eye, X, Sparkles, KeyRound, Trash2, FileText, ChevronRight, Download } from 'lucide-react';
import { backendApi } from '../../lib/api';
import { myProfileApi, studentDataApi, STUDENT_CHANGE_REQUEST_STATUS_LABELS, type MyProfilePayload, type StudentChangeRequestRow, type StudentChangeRequestStatus } from '../../lib/api';
import type { MadingPostRow } from '../../lib/api';
import { resolveImageUrl } from '../../lib/api';
import type { MadingVideo } from '../../lib/content-types';
import PageHero from '../../components/ui/PageHero';
import AIContentAssistant, { AiNote } from '../../components/mading/AIContentAssistant';
import ImageField from '../../components/admin/ImageField';
import { SkeletonList, SkeletonProfile } from '../../components/ui/Skeleton';
import { GalleryUpload, VideoUrlsField } from '../../components/mading/MediaEditor';
import { MADING_STATUSES } from '../../lib/ui-constants';
import { BIODATA_FIELDS, BIODATA_SECTIONS, STUDENT_READONLY_KEYS, formatClass, groupFieldsBySubsection } from '../../lib/studentBiodata';
import type { BiodataFieldDef } from '../../lib/studentBiodata';

const studentSessionKey = 'smkn11-student-session';

// Dokumen siswa — set yang sama persis dengan Dokumen Siswa di Admin
// (StudentsManagement STUDENT_DOCS), dipakai untuk tampilan & pengajuan.
const STUDENT_DOCS = [
  { key: 'doc_kk', label: 'KK (Kartu Keluarga)' },
  { key: 'doc_akta', label: 'Akta Kelahiran' },
  { key: 'doc_ijazah', label: 'Ijazah' },
  { key: 'doc_lainnya', label: 'Dokumen Lainnya' },
];
const WIZARD_STEPS = [...BIODATA_SECTIONS, { id: 'docs', title: 'J. Dokumen Siswa' }];

type Tab = 'explore' | 'mine' | 'create' | 'profile';

interface Category { id: string; slug: string; name: string; sort_order: number; }

interface StudentProfile {
  nisn: string;
  name: string;
  class: string;
  major: string;
  email?: string;
}

export default function StudentArea() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'explore');
  const [rejectionPopup, setRejectionPopup] = useState<StudentChangeRequestRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await backendApi.auth.getCurrentUser();
      if (cancelled) return;
      if (!data?.user) {
        setLoading(false);
        return;
      }
      setUser({ id: data.user.id, email: data.user.email });
      const { data: prof } = await backendApi.database.from('profiles').select('role').eq('id', data.user.id).single();
      if (prof?.role !== 'student') {
        await backendApi.auth.signOut();
        localStorage.removeItem(studentSessionKey);
        navigate('/mading/login', { replace: true });
        return;
      }
      const [{ data: me }, { data: reqs }] = await Promise.all([
        myProfileApi.show(),
        studentDataApi.myChangeRequests(),
      ]);
      if (cancelled) return;
      if (me) {
        setProfile({
          nisn: me.student?.nisn ?? '',
          name: me.name,
          class: me.student?.class ?? '',
          major: me.student?.major ?? '',
          email: me.email,
        });
      }
      if (reqs) {
        const allReqs = reqs as StudentChangeRequestRow[];
        const rejected = allReqs.filter((r) => r.status === 'ditolak');
        if (rejected.length > 0) {
          const sorted = [...rejected].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
          const latestRejection = sorted[0];
          const hasApprovedAfter = allReqs.some((r) => r.status === 'disetujui' && new Date(r.created_at ?? 0).getTime() > new Date(latestRejection.created_at ?? 0).getTime());
          if (!hasApprovedAfter) setRejectionPopup(latestRejection);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const dismissRejection = () => {
    setRejectionPopup(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Mading Saya" subtitle="Area siswa SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading', href: '/mading' }, { label: 'Area Siswa' }]} />
        <SkeletonProfile count={2} />
      </div>
    );
  }
  if (!user) return <Navigate to="/mading/login" replace />;

  const tabs: { key: Tab; label: string; icon: typeof Compass }[] = [
    { key: 'explore', label: 'Jelajahi', icon: Compass },
    { key: 'mine', label: 'Karya Saya', icon: BookMarked },
    { key: 'create', label: 'Buat Karya', icon: PenLine },
    { key: 'profile', label: 'Profil', icon: UserRound },
  ];

  const logout = async () => {
    await backendApi.auth.signOut();
    localStorage.removeItem(studentSessionKey);
    navigate('/mading/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={`Halo, ${profile?.name ?? 'Siswa'}`}
        subtitle={profile ? [formatClass(profile.class), profile.major].filter(Boolean).join(' · ') : 'Area siswa Mading SMKN 11'}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading', href: '/mading' }, { label: 'Area Siswa' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${tab === t.key ? 'bg-[#1B2A4A] text-white' : 'bg-white text-[#1B2A4A] border border-[#1B2A4A]/20 hover:bg-[#FAF6F0]'}`}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 text-sm font-bold text-[#866D2C] hover:text-[#C8A951]"><LogOut size={16} /> Keluar</button>
        </div>

        <div className="mt-6">
          {tab === 'explore' && <ExploreTab />}
          {tab === 'mine' && <MyWorksTab userId={user.id} />}
          {tab === 'create' && <CreateTab userId={user.id} name={profile?.name ?? 'Siswa'} />}
          {tab === 'profile' && <ProfileTab profile={profile} />}
        </div>
      </div>

      {rejectionPopup && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600"><XCircle size={22} /></span>
              <h3 className="text-lg font-bold text-[#1B2A4A]">Pengajuan Data Ditolak</h3>
            </div>
            <p className="mb-2 text-sm text-[#5B7088]">
              Pengajuan perubahan data Anda telah <strong className="text-red-600">ditolak</strong> oleh admin.
            </p>
            {rejectionPopup.rejection_reason && (
              <div className="mb-4 rounded-lg bg-red-50 p-3">
                <p className="mb-1 text-xs font-semibold text-red-700">Alasan Penolakan:</p>
                <p className="text-sm text-red-800">{rejectionPopup.rejection_reason}</p>
              </div>
            )}
            <button onClick={dismissRejection} className="w-full rounded-lg bg-[#1B2A4A] py-2.5 font-bold text-white hover:opacity-90">Mengerti</button>
          </div>
        </div>
      )}
    </div>
  );
}

function useCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    backendApi.database.from('mading_categories').select('*').order('sort_order', { ascending: true }) .then(({ data }: any) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);
  return categories;
}

function catName(categories: Category[], id?: string | null): string {
  const found = categories.find((c) => String(c.id) === String(id));
  return found?.name ?? 'Lainnya';
}

function ExploreTab() {
  const [rows, setRows] = useState<MadingPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const categories = useCategories();

  useEffect(() => {
    let active = true;
    backendApi.database.from('mading_posts').select('*, mading_categories(name)').eq('status', 'published').order('published_at', { ascending: false }) .then(({ data }: any) => {
      if (!active) return;
      setRows((data as MadingPostRow[] | null) ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <Section title="Jelajahi Karya">
      {loading ? (
        <SkeletonList count={3} className="grid gap-5 md:grid-cols-3" />
      ) : rows.length === 0 ? (
        <Empty text="Belum ada karya yang dipublikasikan." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((post) => {
            const rel = post['mading_categories'] as { name?: string } | null | undefined;
            const thumb = resolveImageUrl(post.cover_image) ?? resolveImageUrl((Array.isArray(post.images) ? post.images : [])[0]);
            return (
              <article key={String(post.id)} className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
                {thumb && (
                  <div className="h-36 overflow-hidden">
                    <img src={thumb} alt={post.title} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <span className="inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{rel?.name ?? catName(categories, post.category_id)}</span>
                  <h3 className="mt-2 font-bold text-[#1B2A4A]">{post.title}</h3>
                  {post.ai_assisted && <div className="mt-1.5"><AiNote /></div>}
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#23314D]">{post.content}</p>
                  <p className="mt-3 text-xs font-medium text-[#5B7088]">{post.author_name} · {post.published_at ? new Date(post.published_at).toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function MyWorksTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<MadingPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<MadingPostRow | null>(null);
  const [editingValues, setEditingValues] = useState({ title: '', content: '', category_id: '', cover_image: '', images: [] as string[], videos: [] as MadingVideo[] });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(false);
  const categories = useCategories();

  const load = useCallback(async () => {
    const { data } = await backendApi.database.from('mading_posts').select('*').eq('author_id', userId).order('created_at', { ascending: false });
    setRows((data as MadingPostRow[] | null) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const flashEdit = (type: 'ok' | 'err', text: string) => {
    setEditMsg({ type, text });
    setTimeout(() => setEditMsg(null), 5000);
  };

  const resubmit = async (id: string) => {
    const r = await backendApi.database.rpc('submit_mading_post', { p_post_id: id });
    if (r.error) { alert(r.error.message); return; }
    await load();
  };

  const openEdit = (post: MadingPostRow) => {
    setEditingPost(post);
    setEditingValues({
      title: String(post.title ?? ''),
      content: String(post.content ?? ''),
      category_id: String(post.category_id ?? ''),
      cover_image: String(post.cover_image ?? ''),
      images: Array.isArray(post.images) ? post.images : [],
      videos: Array.isArray(post.videos) ? post.videos : [],
    });
    setAiAssisted(Boolean(post.ai_assisted));
  };

  const saveEdit = async (status: 'draft' | 'pending_review') => {
    if (!editingPost?.id) return;
    if (!editingValues.title.trim() || !editingValues.content.trim()) {
      flashEdit('err', 'Judul dan isi karya wajib diisi.');
      return;
    }
    setSavingEdit(true);
    const payload: Record<string, unknown> = {
      title: editingValues.title.trim(),
      content: editingValues.content.trim(),
      category_id: editingValues.category_id || null,
      cover_image: editingValues.cover_image.trim(),
      images: editingValues.images,
      videos: editingValues.videos,
      status,
      feedback: status === 'pending_review' ? '' : (editingPost.feedback ?? ''),
      ai_assisted: aiAssisted || undefined,
    };
    const { error } = await backendApi.database.from('mading_posts').update(payload).eq('id', editingPost.id);
    setSavingEdit(false);
    if (error) {
      flashEdit('err', error.message);
      return;
    }
    setEditingPost(null);
    await load();
    flashEdit('ok', status === 'draft' ? 'Draft karya berhasil disimpan.' : 'Karya dikirim untuk review.');
  };

  return (
    <Section title="Karya Saya">
      {editMsg && <p className={`mb-4 rounded-lg p-3 text-sm ${editMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{editMsg.text}</p>}
      {loading ? (
        <SkeletonList count={3} className="grid gap-5 md:grid-cols-3" />
      ) : rows.length === 0 ? (
        <Empty text="Kamu belum membuat karya. Mulai dari menu Buat Karya." />
      ) : (
        <div className="space-y-4">
          {rows.map((post) => (
            <div key={String(post.id)} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-[#1B2A4A]">{post.title}</h3>
                    <StatusPill status={post.status ?? 'draft'} />
                    {post.ai_assisted && <AiNote />}
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#5B7088]">{catName(categories, post.category_id)} · {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#23314D]">{post.content}</p>
              {post.status === 'rejected' && post.feedback && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><strong>Feedback:</strong> {post.feedback}</p>
              )}
              {(post.status === 'draft' || post.status === 'rejected') && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(post)} className="inline-flex items-center gap-2 rounded-lg border border-[#1B2A4A]/20 px-4 py-2 text-sm font-bold text-[#1B2A4A]">Edit</button>
                  <button onClick={() => resubmit(String(post.id))} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]"><Send size={15} /> Kirim untuk Review</button>
                  <button
                    onClick={async () => {
                      if (!confirm('Hapus karya ini?')) return;
                      const { error } = await backendApi.database.from('mading_posts').delete().eq('id', String(post.id));
                      if (error) { alert(error.message); return; }
                      await load();
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                  ><Trash2 size={15} /> Hapus</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1B2A4A]">Edit Karya</h3>
              <button onClick={() => setEditingPost(null)}><X className="h-5 w-5" /></button>
            </div>
            {aiAssisted && <p className="mb-4 rounded-lg bg-[#C8A951]/10 p-3 text-sm text-[#866D2C]">Karya ini dibuat dengan bantuan AI dan tetap harus melalui review Guru/Admin.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Jenis Karya
                <select value={editingValues.category_id} onChange={(e) => setEditingValues((v) => ({ ...v, category_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
                  <option value="">Pilih Jenis Karya</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">Judul
                <input value={editingValues.title} onChange={(e) => setEditingValues((v) => ({ ...v, title: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
              </label>
              <div className="sm:col-span-2"><Field label="Isi Karya" multiline value={editingValues.content} onChange={(e) => setEditingValues((v) => ({ ...v, content: e.target.value }))} /></div>
              <div className="sm:col-span-2"><Field label="URL Cover (opsional)" value={editingValues.cover_image} onChange={(e) => setEditingValues((v) => ({ ...v, cover_image: e.target.value }))} /></div>
              <div className="sm:col-span-2"><GalleryUpload value={editingValues.images} onChange={(urls) => setEditingValues((v) => ({ ...v, images: urls }))} /></div>
              <div className="sm:col-span-2"><VideoUrlsField value={editingValues.videos} onChange={(videos) => setEditingValues((v) => ({ ...v, videos }))} /></div>
            </div>
            <div className="mt-4">
              <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951]/15 px-4 py-2 text-sm font-bold text-[#866D2C] hover:bg-[#C8A951]/25"><Sparkles className="h-4 w-4" /> Bantu dengan AI</button>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={() => saveEdit('draft')} disabled={savingEdit} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] disabled:opacity-60"><Save className="h-4 w-4" /> Simpan Draft</button>
              <button onClick={() => saveEdit('pending_review')} disabled={savingEdit} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A] disabled:opacity-60">{savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim untuk Review</button>
            </div>
          </div>
          <AIContentAssistant
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            categories={categories}
            editorContent={editingValues.content}
            editorCategoryId={editingValues.category_id}
            onUseResult={(r) => {
              setEditingValues((v) => ({ ...v, title: r.title, content: r.content, category_id: r.category_id }));
              setAiAssisted(true);
            }}
          />
        </div>
      )}
    </Section>
  );
}

function CreateTab({ userId, name }: { userId: string; name: string }) {
  const categories = useCategories();
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(false);
  const [values, setValues] = useState({ title: '', content: '', category_id: '', cover_image: '', images: [] as string[], videos: [] as MadingVideo[] });

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const save = async (status: 'draft' | 'pending_review') => {
    if (!values.title.trim() || !values.content.trim()) {
      flash('err', 'Judul dan isi wajib diisi.');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      content: values.content.trim(),
      category_id: values.category_id || null,
      cover_image: values.cover_image.trim(),
      images: values.images,
      videos: values.videos,
      author_id: userId,
      author_name: name,
      author_role: 'siswa',
      status,
      ai_assisted: aiAssisted || undefined,
    };
    const r = await backendApi.database.from('mading_posts').insert([payload]);
    if (r.error) { flash('err', r.error.message); setSaving(false); return; }
    setValues({ title: '', content: '', category_id: '', cover_image: '', images: [], videos: [] });
    setAiAssisted(false);
    setSaving(false);
    flash('ok', status === 'draft' ? 'Draft tersimpan.' : 'Karya dikirim untuk review. Tunggu persetujuan Guru/Admin.');
  };

  const f = (key: 'title' | 'content' | 'category_id' | 'cover_image', type = 'text') => ({
    type,
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Section title="Buat Karya">
      {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {aiAssisted && <p className="mb-4 rounded-lg bg-[#C8A951]/10 p-3 text-sm text-[#866D2C]">Karya ini dibuat dengan bantuan AI dan tetap harus melalui review Guru/Admin sebelum dipublikasikan.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Jenis Karya
            <select value={values.category_id} onChange={(e) => setValues((v) => ({ ...v, category_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
              <option value="">Pilih Jenis Karya</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Judul
            <input {...f('title')} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
          </label>
          <div className="sm:col-span-2"><Field label="Isi Karya" multiline value={values.content} onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))} /></div>
          <div className="sm:col-span-2"><Field label="URL Cover (opsional)" value={values.cover_image} onChange={(e) => setValues((v) => ({ ...v, cover_image: e.target.value }))} /></div>
          <div className="sm:col-span-2"><GalleryUpload value={values.images} onChange={(urls) => setValues((v) => ({ ...v, images: urls }))} /></div>
          <div className="sm:col-span-2"><VideoUrlsField value={values.videos} onChange={(videos) => setValues((v) => ({ ...v, videos }))} /></div>
        </div>
        <div className="mt-4">
          <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951]/15 px-4 py-2 text-sm font-bold text-[#866D2C] hover:bg-[#C8A951]/25"><Sparkles className="h-4 w-4" /> Bantu dengan AI</button>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button onClick={() => save('draft')} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] disabled:opacity-60"><Save className="h-4 w-4" /> Simpan Draft</button>
          <button onClick={() => save('pending_review')} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A] disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim untuk Review</button>
        </div>
      </div>
      <AIContentAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        categories={categories}
        editorContent={values.content}
        editorCategoryId={values.category_id}
        onUseResult={(r) => {
          setValues((v) => ({ ...v, title: r.title, content: r.content, category_id: r.category_id }));
          setAiAssisted(true);
        }}
      />
    </Section>
  );
}

function ProfileTab({ profile }: { profile: StudentProfile | null }) {
  const [me, setMe] = useState<MyProfilePayload | null>(null);
  const [requests, setRequests] = useState<StudentChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showChange, setShowChange] = useState(false);
  const [changeForm, setChangeForm] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [changeErrors, setChangeErrors] = useState<Record<string, string>>({});
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentChangeRequestRow | null>(null);

  const std = me?.student ? (me.student as Record<string, unknown>) : null;
  const totalSteps = WIZARD_STEPS.length;
  const pending = requests.find((r) => r.status === 'menunggu') ?? null;

  const loadData = useCallback(async () => {
    const [profileRes, reqRes] = await Promise.all([
      myProfileApi.show(),
      studentDataApi.myChangeRequests(),
    ]);

    if (profileRes.data) {
      setMe(profileRes.data);
    } else if (profileRes.error) {
      setMsg({ type: 'err', text: profileRes.error.message ?? 'Gagal memuat profil.' });
    }

    if (reqRes.data) setRequests(reqRes.data as StudentChangeRequestRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  // ── Change request wizard ─────────────────────────────────────────────

  const openChange = () => {
    const form: Record<string, string> = {};
    for (const field of BIODATA_FIELDS) {
      const raw = std?.[field.key];
      if (raw === null || raw === undefined) {
        form[field.key] = '';
        continue;
      }
      form[field.key] = field.type === 'date' ? String(raw).slice(0, 10) : String(raw);
    }
    form.foto = String(std?.foto ?? '');
    for (const doc of STUDENT_DOCS) {
      form[doc.key] = String(std?.[doc.key] ?? '');
    }
    setChangeForm(form);
    setStep(1);
    setMaxStep(1);
    setChangeErrors({});
    setShowChange(true);
  };

  const setChange = (key: string) => (val: string) => {
    setChangeForm((v) => ({ ...v, [key]: val }));
    setChangeErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateSection = (sectionId: string, form: Record<string, string>): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (sectionId === 'docs') return errs;
    for (const f of BIODATA_FIELDS.filter((x) => x.section === sectionId)) {
      const value = (form[f.key] ?? '').trim();
      if (!value) continue;
      if (f.type === 'number' && !/^\d+(\.\d+)?$/.test(value)) errs[f.key] = 'Harus berupa angka.';
      if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) errs[f.key] = 'Tanggal tidak valid.';
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateSection(WIZARD_STEPS[step - 1].id, changeForm);
    if (Object.keys(errs).length > 0) {
      setChangeErrors(errs);
      return;
    }
    const next = Math.min(step + 1, totalSteps);
    setStep(next);
    setMaxStep((prev) => Math.max(prev, next));
    setChangeErrors({});
  };

  const goBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setChangeErrors({});
  };

  const submitChange = async () => {
    const errs = validateSection(WIZARD_STEPS[step - 1].id, changeForm);
    if (Object.keys(errs).length > 0) {
      setChangeErrors(errs);
      return;
    }

    const proposed: Record<string, unknown> = {};
    for (const field of BIODATA_FIELDS) {
      if (STUDENT_READONLY_KEYS.has(field.key)) continue;
      const newVal = String(changeForm[field.key] ?? '').trim();
      const oldVal = String(std?.[field.key] ?? '').trim();
      if (newVal !== oldVal) {
        proposed[field.key] = field.type === 'number' || field.type === 'decimal'
          ? (newVal === '' ? null : Number(newVal))
          : newVal;
      }
    }
    const newFoto = String(changeForm.foto ?? '').trim();
    const oldFoto = String(std?.foto ?? '').trim();
    if (newFoto !== oldFoto) proposed.foto = newFoto;

    for (const doc of STUDENT_DOCS) {
      const newVal = String(changeForm[doc.key] ?? '').trim();
      const oldVal = String(std?.[doc.key] ?? '').trim();
      if (newVal !== oldVal) proposed[doc.key] = newVal;
    }

    if (Object.keys(proposed).length === 0) {
      flash('err', 'Tidak ada perubahan yang terdeteksi.');
      return;
    }

    setSaving(true);
    setMsg(null);
    const { error } = await studentDataApi.submitChangeRequest(proposed);
    setSaving(false);

    if (error) {
      flash('err', error.message ?? 'Gagal mengirim pengajuan.');
      return;
    }

    setShowChange(false);
    flash('ok', 'Pengajuan berhasil dikirim dan menunggu verifikasi admin.');
    void loadData();
  };

  const cancelRequest = async (id: string) => {
    setCancelId(id);
    const { error } = await studentDataApi.cancelChangeRequest(id);
    setCancelId(null);
    if (error) {
      flash('err', error.message ?? 'Gagal membatalkan pengajuan.');
      return;
    }
    flash('ok', 'Pengajuan berhasil dibatalkan.');
    void loadData();
  };

  if (loading) {
    return (
      <Section title="Profil">
        <SkeletonProfile count={1} />
      </Section>
    );
  }

  if (!profile && !me) return <Empty text="Data profil tidak ditemukan." />;

  return (
    <Section title="Profil Saya">
      {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="max-w-3xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#1B2A4A]/10 bg-[#FAF6F0]">
              {std?.foto ? (
                <img src={resolveImageUrl(String(std.foto))} alt={me?.name ?? profile?.name ?? ''} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[#866D2C]/40"><UserRound className="h-8 w-8" /></span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-[#1B2A4A]">{me?.name ?? profile?.name}</p>
              <p className="text-sm text-[#5B7088]">NISN {me?.student?.nisn ?? profile?.nisn ?? '-'} · {me?.email}</p>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
            Data di bawah adalah biodata siswa yang sudah tersimpan. Perubahan diajukan dan menunggu verifikasi admin sebelum diterapkan ke data utama. Bio &amp; media sosial bisa diubah langsung.
          </p>
        </div>

        {/* Pending banner */}
        {pending && (
          <PendingBanner
            request={pending}
            cancelling={cancelId === pending.id}
            onCancel={() => cancelRequest(pending.id)}
            onDetail={() => setDetail(pending)}
          />
        )}

        {/* Approved biodata (read-only) */}
        {BIODATA_SECTIONS.map((section) => {
          const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);
          const isIdentity = section.id === 'identity';
          return (
            <div key={section.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-[#1B2A4A]">{section.title}</h3>
              {isIdentity && (
                <div className="mb-4 flex items-center gap-4">
                  {std?.foto ? (
                    <img src={resolveImageUrl(String(std.foto))} alt={me?.name ?? ''} className="h-24 w-24 rounded-lg border border-[#1B2A4A]/10 object-cover" />
                  ) : (
                    <span className="grid h-24 w-24 place-items-center rounded-lg border border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0]">
                      <UserRound className="h-10 w-10 text-[#866D2C]/50" />
                    </span>
                  )}
                  <div>
                    <p className="font-bold text-[#1B2A4A]">{me?.name ?? profile?.name}</p>
                    <p className="text-sm text-[#5B7088]">NISN: {me?.student?.nisn ?? profile?.nisn ?? '-'}</p>
                  </div>
                </div>
              )}
              <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                {groupFieldsBySubsection(fields).map((g, gi) => (
                  <Fragment key={gi}>
                    {g.subsection && <dt className="sm:col-span-2 border-b border-[#1B2A4A]/10 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-[#866D2C]">{g.subsection}</dt>}
                    {g.fields.map((field) => (
                      <ProfileDetailRow key={field.key} field={field} value={std?.[field.key]} />
                    ))}
                  </Fragment>
                ))}
              </dl>
            </div>
          );
        })}

        {/* Dokumen siswa (read-only, dari data utama — perubahan lewat pengajuan) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-[#1B2A4A]">DOKUMEN SISWA</h3>
          <div className="space-y-4">
            {STUDENT_DOCS.map((doc) => {
              const docSrc = resolveImageUrl(String(std?.[doc.key] ?? ''));
              return (
                <div key={doc.key} className="overflow-hidden rounded-xl border border-[#1B2A4A]/10">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B2A4A]/10 bg-[#FAF6F0]/70 px-4 py-3">
                    <p className="font-bold text-[#1B2A4A]">{doc.label}</p>
                    {docSrc && (
                      <a
                        href={docSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2A4A] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        <Download size={14} /> Download
                      </a>
                    )}
                  </div>
                  {docSrc ? (
                    <div className="flex max-h-[540px] items-start justify-center bg-white p-3">
                      <img src={docSrc} alt={doc.label} className="max-h-[520px] w-auto max-w-full object-contain" />
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm text-[#5B7088]">Belum diunggah</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-[#1B2A4A]">Riwayat Pengajuan</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-[#5B7088]">Belum ada pengajuan perubahan data.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <RequestCard key={req.id} request={req} onView={() => setDetail(req)} />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={openChange} disabled={!!pending} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] disabled:opacity-50">
            <FileText className="h-4 w-4" /> Ajukan Perubahan Data
          </button>
        </div>

        <ChangePinCard pending={pending} />
      </div>

      {/* Change request wizard */}
      {showChange && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1B2A4A]">Ajukan Perubahan Data</h3>
              <button onClick={() => setShowChange(false)}><X className="h-5 w-5" /></button>
            </div>

            <p className="mb-4 rounded-lg bg-[#C8A951]/10 p-3 text-sm text-[#866D2C]">
              Perubahan akan dikirim sebagai pengajuan dan menunggu verifikasi admin. Data utama tidak berubah sampai pengajuan disetujui.
            </p>

            <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
              {WIZARD_STEPS.map((section, i) => {
                const n = i + 1;
                const active = n === step;
                const done = n < step;
                const reachable = n <= maxStep;
                return (
                  <span key={section.id} className="contents">
                    {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-[#5B7088]/40" />}
                    <button
                      type="button"
                      disabled={!reachable}
                      onClick={() => { if (reachable) { setStep(n); setChangeErrors({}); } }}
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        active ? 'bg-[#1B2A4A] text-white'
                          : done ? 'bg-[#C8A951] text-[#1B2A4A]'
                            : reachable ? 'bg-[#FAF6F0] text-[#5B7088] hover:bg-[#1B2A4A]/10'
                              : 'cursor-not-allowed bg-[#FAF6F0] text-[#5B7088]/40'
                      }`}
                    >
                      {n}. {section.title.replace(/^[A-J]\.\s*/, '')}
                    </button>
                  </span>
                );
              })}
            </div>

            {(() => {
              const section = WIZARD_STEPS[step - 1];
              const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);
              return (
                <div key={section.id} className="rounded-xl border border-[#1B2A4A]/10 p-4">
                  <p className="mb-3 font-bold text-[#1B2A4A]">{section.title}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section.id === 'docs' ? (
                      STUDENT_DOCS.map((doc) => (
                        <div key={doc.key}>
                          <ImageField
                            label={`${doc.label} — opsional`}
                            value={changeForm[doc.key] ?? ''}
                            onChange={(url) => setChange(doc.key)(url)}
                            bucket="student/documents"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            maxSizeMb={5}
                            hint="JPG/PNG/WEBP/PDF, maks. 5 MB. Dokumen baru diterapkan setelah disetujui admin."
                          />
                        </div>
                      ))
                    ) : (
                      <>
                        {section.id === 'identity' && (
                          <div className="sm:col-span-2">
                            <ImageField
                              label="Foto Siswa (opsional)"
                              value={changeForm.foto ?? ''}
                              onChange={(url) => setChange('foto')(url)}
                              accept="image/jpeg,image/png"
                              maxSizeMb={2}
                              hint="Foto baru akan diterapkan setelah disetujui admin."
                            />
                          </div>
                        )}
                        {groupFieldsBySubsection(fields).map((g, gi) => (
                            <Fragment key={gi}>
                              {g.subsection && <p className="sm:col-span-2 border-b border-[#1B2A4A]/10 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#866D2C]">{g.subsection}</p>}
                              {g.fields.map((field) => (
                                <div key={field.key} className={field.full === true ? 'sm:col-span-2' : ''}>
                                  <BioField field={field} value={changeForm[field.key] ?? ''} onChange={setChange(field.key)} disabled={STUDENT_READONLY_KEYS.has(field.key)} />
                                  {changeErrors[field.key] && <span className="mt-1 block text-xs font-medium text-red-600">{changeErrors[field.key]}</span>}
                                </div>
                              ))}
                            </Fragment>
                          ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowChange(false)} className="px-4 py-2 text-[#5B7088]">Batal</button>
              {step > 1 && (
                <button type="button" onClick={goBack} className="px-4 py-2 font-semibold text-[#866D2C]">Kembali</button>
              )}
              {step < totalSteps ? (
                <button type="button" onClick={goNext} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2 font-bold text-white">
                  Lanjut <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={submitChange} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-5 py-2 font-bold text-[#1B2A4A] disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim Pengajuan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {detail && <RequestDetailModal request={detail} onClose={() => setDetail(null)} />}
    </Section>
  );
}

function ProfileDetailRow({ label, value, field }: { label?: string; value: unknown; field?: BiodataFieldDef }) {
  const raw = value ?? '';
  let display = raw === '' || raw === null || raw === undefined ? '-' : String(raw);
  if (field) {
    if (field.type === 'date') {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw));
      display = m ? `${m[3]}/${m[2]}/${m[1]}` : String(raw).slice(0, 10);
    }
    if (field.key === 'gender') display = raw === 'L' ? 'Laki-laki' : raw === 'P' ? 'Perempuan' : display;
  }
  return (
    <div className="flex gap-2">
      <dt className="w-28 sm:w-44 shrink-0 font-medium text-[#5B7088]">{label ?? field?.label ?? '-'}</dt>
      <dd className="font-semibold text-[#1B2A4A]">{display}</dd>
    </div>
  );
}

function profileFieldLabel(key: string): string {
  const def = BIODATA_FIELDS.find((f) => f.key === key);
  if (def) return def.label;
  if (key === 'foto') return 'Foto Siswa';
  const doc = STUDENT_DOCS.find((d) => d.key === key);
  if (doc) return doc.label;
  if (key === 'pin') return 'PIN Login';
  return key;
}

function formatChangeValue(key: string, val: unknown): string {
  if (val === null || val === undefined || val === '') return '-';
  if (key === 'pin') return '••••';
  return String(val);
}

function PendingBanner({ request, cancelling, onCancel, onDetail }: { request: StudentChangeRequestRow; cancelling: boolean; onCancel: () => void; onDetail: () => void }) {
  const keys = Object.keys(request.proposed_data);
  return (
    <div className="rounded-2xl border border-[#C8A951]/40 bg-[#C8A951]/10 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-bold text-[#866D2C]">
          <Clock className="h-4 w-4" /> Menunggu Verifikasi Admin
        </div>
        <div className="flex gap-2">
          <button onClick={onDetail} className="inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><Eye size={15} /> Detail</button>
          <button onClick={onCancel} disabled={cancelling} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 disabled:opacity-50">
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X size={14} />} Batalkan
          </button>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {keys.slice(0, 5).map((key) => (
          <li key={key} className="text-[#5B7088]">
            <span className="font-semibold text-[#1B2A4A]">{profileFieldLabel(key)}</span>: {formatChangeValue(key, request.old_data[key])} → <span className="font-semibold text-[#866D2C]">{formatChangeValue(key, request.proposed_data[key])}</span>
          </li>
        ))}
        {keys.length > 5 && <li className="text-xs text-[#5B7088]">… dan {keys.length - 5} perubahan lainnya</li>}
      </ul>
    </div>
  );
}

function RequestCard({ request, onView }: { request: StudentChangeRequestRow; onView: () => void }) {
  const statusCls: Record<StudentChangeRequestStatus, string> = {
    menunggu: 'bg-[#C8A951]/20 text-[#866D2C]',
    disetujui: 'bg-green-50 text-green-700',
    ditolak: 'bg-red-50 text-red-700',
    dibatalkan: 'bg-[#FAF6F0] text-[#5B7088]',
  };
  const iconCls: Record<StudentChangeRequestStatus, typeof Clock> = {
    menunggu: Clock,
    disetujui: CheckCircle2,
    ditolak: XCircle,
    dibatalkan: XCircle,
  };
  const Icon = iconCls[request.status] ?? Clock;
  return (
    <div className="rounded-xl border border-[#1B2A4A]/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusCls[request.status] ?? ''}`}>
            <Icon className="h-3 w-3" /> {STUDENT_CHANGE_REQUEST_STATUS_LABELS[request.status] ?? request.status}
          </span>
          <span className="text-xs text-[#5B7088]">{Object.keys(request.proposed_data).length} field diubah</span>
          <span className="text-xs text-[#5B7088]">
            {request.created_at ? new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
          </span>
        </div>
        <button onClick={onView} className="inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><Eye size={15} /> Detail</button>
      </div>
      {request.status === 'ditolak' && request.rejection_reason && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><strong>Alasan Penolakan:</strong> {request.rejection_reason}</p>
      )}
    </div>
  );
}

function RequestDetailModal({ request, onClose }: { request: StudentChangeRequestRow; onClose: () => void }) {
  const keys = Object.keys(request.proposed_data);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#1B2A4A]">Detail Pengajuan Perubahan</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
          Status: <strong>{STUDENT_CHANGE_REQUEST_STATUS_LABELS[request.status] ?? request.status}</strong>
          {request.verified_at && <> — Diverifikasi {new Date(request.verified_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} oleh {request.verifier?.name ?? '-'}</>}
        </div>

        {request.status === 'ditolak' && request.rejection_reason && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><strong>Alasan Penolakan:</strong> {request.rejection_reason}</div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF6F0]">
              <tr>
                <th className="p-3 font-semibold text-[#1B2A4A]">Field</th>
                <th className="p-3 font-semibold text-[#1B2A4A]">Data Lama</th>
                <th className="p-3 font-semibold text-[#1B2A4A]">Data Baru</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key} className="border-t border-[#1B2A4A]/10">
                  <td className="p-3 font-medium text-[#5B7088]">{profileFieldLabel(key)}</td>
                  <td className="p-3 text-[#1B2A4A]">{formatChangeValue(key, request.old_data[key])}</td>
                  <td className="p-3 font-semibold text-green-700">{formatChangeValue(key, request.proposed_data[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-lg border-2 border-[#1B2A4A] px-5 py-2 font-bold text-[#1B2A4A]">Tutup</button>
        </div>
      </div>
    </div>
  );
}

function ChangePinCard({ pending }: { pending: StudentChangeRequestRow | null }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const submit = async () => {
    let err: string | null = null;
    if (!/^\d{4}$/.test(next)) err = 'PIN baru harus 4 digit angka.';
    else if (next !== confirm) err = 'Konfirmasi PIN baru tidak cocok.';
    else if (!/^\d{4}$/.test(current)) err = 'PIN saat ini harus 4 digit angka.';
    if (err) {
      setMsg({ type: 'err', text: err });
      return;
    }
    setSaving(true);
    setMsg(null);
    const { error } = await studentDataApi.submitChangeRequest({ current_pin: current, pin: next });
    setSaving(false);
    if (error) {
      setMsg({ type: 'err', text: error.message ?? 'Gagal mengirim pengajuan.' });
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setMsg({ type: 'ok', text: 'Pengajuan ganti PIN berhasil dikirim dan menunggu verifikasi admin.' });
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-bold text-[#1B2A4A]">Ubah PIN Login</h3>
      <p className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
        PIN baru hanya aktif setelah pengajuan disetujui admin. Selama menunggu verifikasi, PIN lama tetap berlaku.
      </p>
      {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="PIN Saat Ini" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Field label="PIN Baru" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        <Field label="Ulangi PIN Baru" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button
        onClick={submit}
        disabled={saving || !!pending}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white disabled:opacity-50"
        title={pending ? 'Tunggu pengajuan yang sedang menunggu verifikasi' : undefined}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Ajukan Ganti PIN
      </button>
      {pending && <p className="mt-3 text-xs font-medium text-[#866D2C]">Ada pengajuan yang sedang menunggu verifikasi admin.</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-5 text-xl font-bold text-[#1B2A4A]">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
      <Compass className="mx-auto mb-3 h-10 w-10 text-[#C8A951]/40" />
      <p className="text-[#5B7088]">{text}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    draft: { label: MADING_STATUSES.draft, cls: 'bg-[#FAF6F0] text-[#5B7088]', icon: Clock },
    pending_review: { label: MADING_STATUSES.pending_review, cls: 'bg-amber-50 text-amber-700', icon: Eye },
    approved: { label: MADING_STATUSES.approved, cls: 'bg-blue-50 text-blue-700', icon: CheckCircle2 },
    rejected: { label: MADING_STATUSES.rejected, cls: 'bg-red-50 text-red-700', icon: XCircle },
    published: { label: MADING_STATUSES.published, cls: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  };
  const conf = map[status] ?? map.draft;
  const Icon = conf.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${conf.cls}`}><Icon className="h-3 w-3" /> {conf.label}</span>;
}

function Field({ label, value, onChange, multiline = false, type = 'text', hint }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; multiline?: boolean; type?: string; hint?: string }) {
  const className = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';
  return (
    <label className="block text-sm font-semibold">{label}
      {multiline ? <textarea value={value} onChange={onChange} rows={4} className={className} /> : <input value={value} type={type} onChange={onChange} className={className} />}
      {hint && <span className="mt-1 block text-xs font-normal text-[#5B7088]">{hint}</span>}
    </label>
  );
}

function selectLabel(key: string, value: string): string {
  if (key === 'gender') return value === 'L' ? 'Laki-laki' : value === 'P' ? 'Perempuan' : value;
  if (key === 'anak_yatim_piatu') return value === 'Yatim-Piatu' ? 'Yatim-Piatu' : value;
  return value;
}

function BioField({ field, value, onChange, disabled }: { field: BiodataFieldDef; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const inputCls = `mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal text-[#1B2A4A] outline-none ${disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : 'focus:border-[#C8A951]'}`;
  const lockLabel = disabled ? <span className="ml-1 text-xs font-normal text-[#5B7088]">🔒 Dikelola admin</span> : null;
  if (field.type === 'select') {
    return (
      <label className="block text-sm font-semibold">{field.label}{lockLabel}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} disabled={disabled}>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt === '' ? 'Pilih' : selectLabel(field.key, opt)}</option>
          ))}
        </select>
      </label>
    );
  }
  if (field.type === 'textarea') {
    return (
      <label className="block text-sm font-semibold">{field.label}{lockLabel}
        <textarea value={value} rows={2} onChange={(e) => onChange(e.target.value)} className={inputCls} disabled={disabled} />
      </label>
    );
  }
  return (
    <label className="block text-sm font-semibold">{field.label}{lockLabel}
      <input
        value={value}
        type={field.type === 'date' ? 'date' : 'text'}
        inputMode={field.type === 'number' || field.type === 'decimal' ? 'decimal' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        placeholder={field.placeholder}
        disabled={disabled}
      />
    </label>
  );
}
