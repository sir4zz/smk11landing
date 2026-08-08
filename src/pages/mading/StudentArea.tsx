import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Compass, BookMarked, PenLine, UserRound, LogOut, Loader2, Send, Save, CheckCircle2, XCircle, Clock, Eye, X, Sparkles, KeyRound } from 'lucide-react';
import { backendApi } from '../../lib/api';
import { myProfileApi, type MyProfilePayload } from '../../lib/api';
import type { MadingPostRow } from '../../lib/api';
import PageHero from '../../components/ui/PageHero';
import AIContentAssistant, { AiNote } from '../../components/mading/AIContentAssistant';
import ImageField from '../../components/admin/ImageField';
import { MADING_STATUSES } from '../../lib/ui-constants';

const studentSessionKey = 'smkn11-student-session';

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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [tab, setTab] = useState<Tab>('explore');

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
      const { data: me } = await myProfileApi.show();
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
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Mading Saya" subtitle="Area siswa SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading', href: '/mading' }, { label: 'Area Siswa' }]} />
        <div className="py-24"><Loader2 className="mx-auto h-10 w-10 animate-spin text-[#C8A951]" /></div>
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
        subtitle={profile ? `${profile.class} · ${profile.major}` : 'Area siswa Mading SMKN 11'}
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
        <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C8A951]" /></div>
      ) : rows.length === 0 ? (
        <Empty text="Belum ada karya yang dipublikasikan." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((post) => {
            const rel = post['mading_categories'] as { name?: string } | null | undefined;
            return (
              <article key={String(post.id)} className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
                <span className="inline-block rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{rel?.name ?? catName(categories, post.category_id)}</span>
                <h3 className="mt-2 font-bold text-[#1B2A4A]">{post.title}</h3>
                {post.ai_assisted && <div className="mt-1.5"><AiNote /></div>}
                <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#23314D]">{post.content}</p>
                <p className="mt-3 text-xs font-medium text-[#5B7088]">{post.author_name} · {post.published_at ? new Date(post.published_at).toLocaleDateString('id-ID') : '-'}</p>
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
  const [editingValues, setEditingValues] = useState({ title: '', content: '', category_id: '', cover_image: '' });
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
        <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C8A951]" /></div>
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
  const [values, setValues] = useState({ title: '', content: '', category_id: '', cover_image: '' });

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
      author_id: userId,
      author_name: name,
      author_role: 'siswa',
      status,
      ai_assisted: aiAssisted || undefined,
    };
    const r = await backendApi.database.from('mading_posts').insert([payload]);
    if (r.error) { flash('err', r.error.message); setSaving(false); return; }
    setValues({ title: '', content: '', category_id: '', cover_image: '' });
    setAiAssisted(false);
    setSaving(false);
    flash('ok', status === 'draft' ? 'Draft tersimpan.' : 'Karya dikirim untuk review. Tunggu persetujuan Guru/Admin.');
  };

  const f = (key: keyof typeof values, type = 'text') => ({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    myProfileApi.show().then(({ data, error }) => {
      if (!active) return;
      if (data) {
        setMe(data);
        setValues({
          photo: data.photo ?? '',
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          bio: data.bio ?? '',
          address: data.address ?? '',
          instagram: data.social?.instagram ?? '',
          facebook: data.social?.facebook ?? '',
          twitter: data.social?.twitter ?? '',
          tiktok: data.social?.tiktok ?? '',
          youtube: data.social?.youtube ?? '',
          linkedin: data.social?.linkedin ?? '',
          website: data.social?.website ?? '',
          github: data.social?.github ?? '',
          class: data.student?.class ?? '',
          major: data.student?.major ?? '',
          achievements: (data.student?.achievements ?? []).join('\n'),
        });
      } else {
        setMsg({ type: 'err', text: error?.message ?? 'Gagal memuat profil.' });
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const save = async () => {
    const name = values.name?.trim() ?? '';
    if (name.length < 2) {
      flash('err', 'Nama wajib diisi.');
      return;
    }
    setSaving(true);
    setMsg(null);
    const splitLines = (value: string) => (value ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
    const payload: Record<string, unknown> = {
      photo: values.photo ?? '',
      name,
      email: (values.email ?? '').trim(),
      phone: (values.phone ?? '').trim(),
      bio: (values.bio ?? '').trim(),
      address: (values.address ?? '').trim(),
      instagram: (values.instagram ?? '').trim(),
      facebook: (values.facebook ?? '').trim(),
      twitter: (values.twitter ?? '').trim(),
      tiktok: (values.tiktok ?? '').trim(),
      youtube: (values.youtube ?? '').trim(),
      linkedin: (values.linkedin ?? '').trim(),
      website: (values.website ?? '').trim(),
      github: (values.github ?? '').trim(),
      class: (values.class ?? '').trim(),
      major: (values.major ?? '').trim(),
      achievements: splitLines(values.achievements),
    };
    const { error } = await myProfileApi.updateProfile(payload);
    setSaving(false);
    if (error) {
      flash('err', error.message ?? 'Gagal menyimpan profil.');
      return;
    }
    flash('ok', 'Profil berhasil diperbarui.');
  };

  const socials: { key: string; label: string }[] = [
    { key: 'instagram', label: 'Instagram' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'twitter', label: 'X (Twitter)' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'website', label: 'Website Pribadi' },
    { key: 'github', label: 'GitHub' },
  ];

  if (loading) {
    return (
      <Section title="Profil">
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>
      </Section>
    );
  }

  if (!profile && !me) return <Empty text="Data profil tidak ditemukan." />;

  return (
    <Section title="Profil Saya">
      {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
      <div className="max-w-2xl space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-bold text-[#1B2A4A]">{me?.name ?? profile?.name}</p>
              <p className="text-sm text-[#5B7088]">NISN {me?.student?.nisn ?? profile?.nisn ?? '-'}</p>
            </div>
          </div>
          <div className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
            Kelas, jurusan, prestasi, bio, dan media sosial yang diisi akan tampil di halaman profil publik.
          </div>
          <ImageField label="Foto Profil" value={values.photo ?? ''} onChange={(url) => setValues((v) => ({ ...v, photo: url }))} hint="Direkomendasikan foto persegi (1:1)." />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-[#1B2A4A]">Data Dasar</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap" value={values.name ?? ''} onChange={set('name')} />
            <Field label="Email" type="email" value={values.email ?? ''} onChange={set('email')} />
            <Field label="Nomor Telepon" value={values.phone ?? ''} onChange={set('phone')} />
            <Field label="Kelas" value={values.class ?? ''} onChange={set('class')} />
            <Field label="Jurusan" value={values.major ?? ''} onChange={set('major')} />
            <div className="sm:col-span-2"><Field label="Bio / Tentang Saya" multiline value={values.bio ?? ''} onChange={set('bio')} /></div>
            <div className="sm:col-span-2"><Field label="Alamat (Opsional)" multiline value={values.address ?? ''} onChange={set('address')} /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-[#1B2A4A]">Prestasi &amp; Karya</h3>
          <Field label="Prestasi" multiline value={values.achievements ?? ''} onChange={set('achievements')} hint="Satu prestasi per baris." />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-[#1B2A4A]">Media Sosial</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {socials.map((s) => (
              <Field key={s.key} label={s.label} value={values[s.key] ?? ''} onChange={set(s.key)} />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Profil
          </button>
        </div>

        <ChangePinCard />
      </div>
    </Section>
  );
}

function ChangePinCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const submit = async () => {
    setSaving(true);
    setMsg(null);
    if (next.length < 4) {
      setMsg({ type: 'err', text: 'PIN baru minimal 4 karakter.' });
      setSaving(false);
      return;
    }
    if (next !== confirm) {
      setMsg({ type: 'err', text: 'Konfirmasi PIN baru tidak cocok.' });
      setSaving(false);
      return;
    }
    const { error } = await myProfileApi.updatePassword({ current_password: current, new_password: next });
    setSaving(false);
    if (error) {
      setMsg({ type: 'err', text: error.message ?? 'Gagal mengubah PIN.' });
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setMsg({ type: 'ok', text: 'PIN berhasil diubah.' });
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-bold text-[#1B2A4A]">Ubah PIN Login</h3>
      {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="PIN Saat Ini" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Field label="PIN Baru" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        <Field label="Ulangi PIN Baru" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Ganti PIN
      </button>
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
