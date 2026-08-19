import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, LayoutGrid, CalendarDays, Clock, Image as ImageIcon, Video as VideoIcon, Target, Star, Shield, Upload, MapPin } from 'lucide-react';
import { backendApi, resolveImageUrl } from '../../lib/api';
import { can } from '../../lib/permissions';
import type { KesemaptaanProfile, KesemaptaanActivity, KesemaptaanSchedule, KesemaptaanGalleryPhoto, KesemaptaanVideo, KesemaptaanGoal } from '../../lib/content-types';
import ImageField from './ImageField';

type Tab = 'hero' | 'about' | 'goals' | 'activities' | 'gallery' | 'videos' | 'schedule';

interface Props {
  permissions: string[];
}

export default function KesemaptaanManagement({ permissions }: Props) {
  const [tab, setTab] = useState<Tab>('hero');
  const [profile, setProfile] = useState<KesemaptaanProfile | null>(null);
  const [activities, setActivities] = useState<KesemaptaanActivity[]>([]);
  const [schedules, setSchedules] = useState<KesemaptaanSchedule[]>([]);
  const [gallery, setGallery] = useState<KesemaptaanGalleryPhoto[]>([]);
  const [videos, setVideos] = useState<KesemaptaanVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const canEdit = can(permissions, 'kesemaptaan.edit') || can(permissions, 'kesemaptaan.create');
  const canCreate = can(permissions, 'kesemaptaan.create');
  const canDelete = can(permissions, 'kesemaptaan.delete');

  const loadAll = useCallback(async () => {
    const [p, a, s, g, v] = await Promise.all([
      backendApi.database.from('kesemaptaan').select('*').limit(1).maybeSingle(),
      backendApi.database.from('kesemaptaan_activities').select('*').order('activity_date', { ascending: false }),
      backendApi.database.from('kesemaptaan_schedules').select('*').order('date', { ascending: true }),
      backendApi.database.from('kesemaptaan_gallery').select('*').order('sort_order', { ascending: true }),
      backendApi.database.from('kesemaptaan_videos').select('*').order('sort_order', { ascending: true }),
    ]);
    setProfile(p.data ? (p.data as KesemaptaanProfile) : null);
    setActivities((a.data as KesemaptaanActivity[] | null) ?? []);
    setSchedules((s.data as KesemaptaanSchedule[] | null) ?? []);
    setGallery((g.data as KesemaptaanGalleryPhoto[] | null) ?? []);
    setVideos((v.data as KesemaptaanVideo[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const saveProfile = async (patch: Partial<KesemaptaanProfile>): Promise<boolean> => {
    if (profile?.id) {
      const { error } = await backendApi.database.from('kesemaptaan').update(patch).eq('id', profile.id);
      if (error) { flash('err', error.message); return false; }
    } else {
      const { error } = await backendApi.database.from('kesemaptaan').insert([patch]);
      if (error) { flash('err', error.message); return false; }
    }
    await loadAll();
    return true;
  };

  const tabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'hero', label: 'Hero / Banner', icon: Shield },
    { key: 'about', label: 'Tentang', icon: LayoutGrid },
    { key: 'goals', label: 'Tujuan & Manfaat', icon: Target },
    { key: 'activities', label: 'Kegiatan', icon: CalendarDays },
    { key: 'gallery', label: 'Dokumentasi', icon: ImageIcon },
    { key: 'videos', label: 'Video', icon: VideoIcon },
    { key: 'schedule', label: 'Jadwal', icon: Clock },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
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

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      {tab === 'hero' && (
        <HeroForm
          profile={profile}
          canEdit={canEdit}
          onSave={saveProfile}
          onSaved={() => flash('ok', 'Hero & banner disimpan.')}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'about' && (
        <AboutForm
          profile={profile}
          canEdit={canEdit}
          onSave={saveProfile}
          onSaved={() => flash('ok', 'Deskripsi kesemaptaan disimpan.')}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'goals' && (
        <GoalsForm
          profile={profile}
          canEdit={canEdit}
          onSave={saveProfile}
          onSaved={() => flash('ok', 'Tujuan & manfaat disimpan.')}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'activities' && (
        <ActivitiesList
          items={activities}
          canCreate={canCreate}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={canDelete}
          onChanged={async () => { await loadAll(); flash('ok', 'Data kegiatan diperbarui.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'gallery' && (
        <GalleryList
          items={gallery}
          canCreate={canCreate}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={canDelete}
          onChanged={async () => { await loadAll(); flash('ok', 'Dokumentasi diperbarui.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'videos' && (
        <VideosList
          items={videos}
          canCreate={canCreate}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={canDelete}
          onChanged={async () => { await loadAll(); flash('ok', 'Data video diperbarui.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'schedule' && (
        <ScheduleList
          items={schedules}
          canCreate={canCreate}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={canDelete}
          onChanged={async () => { await loadAll(); flash('ok', 'Jadwal kegiatan diperbarui.'); }}
          onError={(text) => flash('err', text)}
        />
      )}
    </div>
  );
}

// ---------- HERO / BANNER ----------
function HeroForm({ profile, canEdit, onSave, onSaved, onError }: {
  profile: KesemaptaanProfile | null; canEdit: boolean;
  onSave: (patch: Partial<KesemaptaanProfile>) => Promise<boolean>;
  onSaved: () => void; onError: (t: string) => void;
}) {
  const [values, setValues] = useState({ hero_title: profile?.hero_title ?? profile?.title ?? '', hero_description: profile?.hero_description ?? profile?.description ?? '', hero_image: profile?.hero_image ?? profile?.photo ?? '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues({ hero_title: profile?.hero_title ?? profile?.title ?? '', hero_description: profile?.hero_description ?? profile?.description ?? '', hero_image: profile?.hero_image ?? profile?.photo ?? '' });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    const ok = await onSave({ hero_title: values.hero_title, hero_description: values.hero_description, hero_image: values.hero_image });
    setSaving(false);
    if (ok) onSaved(); else onError('Gagal menyimpan hero.');
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm text-[#5B7088]">Judul, deskripsi singkat, dan banner foto untuk bagian paling atas halaman Kesemaptaan.</p>
      <div className="grid gap-4">
        <Field label="Judul Hero" value={values.hero_title} onChange={(e) => setValues((v) => ({ ...v, hero_title: e.target.value }))} disabled={!canEdit} />
        <Field label="Deskripsi Singkat" multiline value={values.hero_description} onChange={(e) => setValues((v) => ({ ...v, hero_description: e.target.value }))} disabled={!canEdit} />
        <ImageField label="Foto / Banner" bucket="kesemaptaan" value={values.hero_image} onChange={(url) => setValues((v) => ({ ...v, hero_image: url }))} disabled={!canEdit} />
      </div>
      {canEdit && <SaveButton saving={saving} label="Simpan Hero" onClick={save} />}
    </div>
  );
}

// ---------- TENTANG ----------
function AboutForm({ profile, canEdit, onSave, onSaved, onError }: {
  profile: KesemaptaanProfile | null; canEdit: boolean;
  onSave: (patch: Partial<KesemaptaanProfile>) => Promise<boolean>;
  onSaved: () => void; onError: (t: string) => void;
}) {
  const [values, setValues] = useState({ about_title: profile?.about_title ?? 'Tentang Kesemaptaan', about_description: profile?.about_description ?? '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues({ about_title: profile?.about_title ?? 'Tentang Kesemaptaan', about_description: profile?.about_description ?? '' });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    const ok = await onSave({ about_title: values.about_title, about_description: values.about_description });
    setSaving(false);
    if (ok) onSaved(); else onError('Gagal menyimpan deskripsi.');
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm text-[#5B7088]">Deskripsi yang menjelaskan tentang program kesemaptaan.</p>
      <div className="grid gap-4">
        <Field label="Judul Bagian" value={values.about_title} onChange={(e) => setValues((v) => ({ ...v, about_title: e.target.value }))} disabled={!canEdit} />
        <Field label="Deskripsi Kesemaptaan" multiline value={values.about_description} onChange={(e) => setValues((v) => ({ ...v, about_description: e.target.value }))} disabled={!canEdit} />
      </div>
      {canEdit && <SaveButton saving={saving} label="Simpan Deskripsi" onClick={save} />}
    </div>
  );
}

// ---------- TUJUAN & MANFAAT ----------
function GoalsForm({ profile, canEdit, onSave, onSaved, onError }: {
  profile: KesemaptaanProfile | null; canEdit: boolean;
  onSave: (patch: Partial<KesemaptaanProfile>) => Promise<boolean>;
  onSaved: () => void; onError: (t: string) => void;
}) {
  const [items, setItems] = useState<KesemaptaanGoal[]>(profile?.goals?.length ? profile.goals : []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(profile?.goals?.length ? profile.goals : []);
  }, [profile]);

  const update = (index: number, key: keyof KesemaptaanGoal, value: string) => {
    setItems((list) => list.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const save = async () => {
    setSaving(true);
    const clean = items.filter((item) => item.title.trim() || item.description.trim());
    const ok = await onSave({ goals: clean });
    setSaving(false);
    if (ok) onSaved(); else onError('Gagal menyimpan tujuan & manfaat.');
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5B7088]">Tujuan / manfaat program kesemaptaan yang ditampilkan sebagai kartu.</p>
        {canEdit && (
          <button onClick={() => setItems((list) => [...list, { title: '', description: '' }])} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
            <Plus className="h-4 w-4" /> Tambah Tujuan
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg bg-[#FAF6F0] p-6 text-center text-[#5B7088]">Belum ada tujuan/manfaat. Bagian ini tidak akan ditampilkan di halaman.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0]/60 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                <Field label="Judul Tujuan" value={item.title} onChange={(e) => update(index, 'title', e.target.value)} disabled={!canEdit} />
                <Field label="Deskripsi" value={item.description} onChange={(e) => update(index, 'description', e.target.value)} disabled={!canEdit} />
                {canEdit && (
                  <div className="flex items-end pb-1">
                    <button onClick={() => setItems((list) => list.filter((_, i) => i !== index))} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100" title="Hapus tujuan">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && <SaveButton saving={saving} label="Simpan Tujuan & Manfaat" onClick={save} />}
    </div>
  );
}

// ---------- KEGIATAN ----------
function ActivitiesList({ items, canCreate, canEdit, canDelete, onChanged, onError }: {
  items: KesemaptaanActivity[]; canCreate: boolean; canEdit: boolean; canDelete: boolean;
  onChanged: () => void; onError: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KesemaptaanActivity | null>(null);

  const save = async (activity: KesemaptaanActivity) => {
    const { id: _id, ...rest } = activity;
    const r = editing?.id
      ? await backendApi.database.from('kesemaptaan_activities').update(rest).eq('id', editing.id)
      : await backendApi.database.from('kesemaptaan_activities').insert([{ ...rest, status: 'published' }]);
    if (r.error) { onError(r.error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus kegiatan ini?')) return;
    const r = await backendApi.database.from('kesemaptaan_activities').delete().eq('id', id);
    if (r.error) { onError(r.error.message); return; }
    onChanged();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#23314D]">Kelola kegiatan yang tampil sebagai kartu di halaman Kesemaptaan.</p>
        {canCreate && (
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
            <Plus className="h-4 w-4" /> Tambah Kegiatan
          </button>
        )}
      </div>
      <AdminTable
        headers={['Kegiatan', 'Tanggal', 'Status', 'Aksi']}
        rows={items.map((a) => ({
          key: String(a.id),
          cells: [
            <div key="title" className="flex items-center gap-3">
              {a.photo ? <img src={resolveImageUrl(a.photo)} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" /> : <div className="grid h-10 w-14 shrink-0 place-items-center rounded-lg bg-[#FAF6F0]"><ImageIcon className="h-4 w-4 text-[#866D2C]" /></div>}
              <div className="min-w-0">
                <p className="font-semibold">{a.title || '-'}</p>
                {a.description && <p className="line-clamp-1 text-xs text-[#5B7088]">{a.description}</p>}
              </div>
            </div>,
            a.activity_date ? new Date(a.activity_date).toLocaleDateString('id-ID') : '-',
            <span key="status" className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-[#FAF6F0] text-[#5B7088]'}`}>{a.status === 'published' ? 'Terbit' : 'Draf'}</span>,
          ],
          actions: (
            <>
              {canEdit && <button onClick={() => { setEditing(a); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>}
              {canDelete && <button onClick={() => remove(String(a.id))} className="text-red-600"><Trash2 size={17} /></button>}
            </>
          ),
        }))}
        empty="Belum ada kegiatan kesemaptaan."
      />
      {open && (
        <ActivityForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (a) => { const ok = await save(a); if (ok) { setOpen(false); onChanged(); } }}
        />
      )}
    </div>
  );
}

function ActivityForm({ item, onClose, onSave }: { item: KesemaptaanActivity | null; onClose: () => void; onSave: (a: KesemaptaanActivity) => void }) {
  const [values, setValues] = useState<KesemaptaanActivity>(item ?? { title: '', description: '', activity_date: '', documentation: [], photo: '', status: 'published' });
  const f = (key: keyof KesemaptaanActivity, type = 'text', multiline = false) => ({
    type, multiline,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Modal title={item ? 'Ubah Kegiatan' : 'Tambah Kegiatan'} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Nama Kegiatan" {...f('title')} /></div>
        <Field label="Tanggal Kegiatan" {...f('activity_date', 'date')} />
        <label className="block text-sm font-semibold">Status
          <select value={String(values.status)} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
            <option value="published">Terbit</option>
            <option value="draft">Draf</option>
          </select>
        </label>
        <div className="sm:col-span-2"><Field label="Deskripsi" {...f('description', 'text', true)} /></div>
        <div className="sm:col-span-2"><ImageField label="Foto Kegiatan" bucket="kesemaptaan" value={String(values.photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, photo: url }))} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={() => onSave(values)} />
    </Modal>
  );
}

// ---------- DOKUMENTASI FOTO ----------
function GalleryList({ items, canCreate, canEdit, canDelete, onChanged, onError }: {
  items: KesemaptaanGalleryPhoto[]; canCreate: boolean; canEdit: boolean; canDelete: boolean;
  onChanged: () => void; onError: (t: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<KesemaptaanGalleryPhoto | null>(null);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let nextOrder = items.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0);
    for (const file of Array.from(files)) {
      const { data, error } = await backendApi.storage.from('kesemaptaan').uploadAuto(file);
      if (error) { onError(error.message); continue; }
      if (!data?.url) continue;
      nextOrder += 1;
      await backendApi.database.from('kesemaptaan_gallery').insert([{ image: data.url, caption: '', is_primary: false, sort_order: nextOrder }]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    onChanged();
  };

  const remove = async (photo: KesemaptaanGalleryPhoto) => {
    if (!confirm('Hapus foto ini?')) return;
    const r = await backendApi.database.from('kesemaptaan_gallery').delete().eq('id', photo.id);
    if (r.error) { onError(r.error.message); return; }
    onChanged();
  };

  const setPrimary = async (photo: KesemaptaanGalleryPhoto) => {
    for (const item of items) {
      await backendApi.database.from('kesemaptaan_gallery').update({ is_primary: item.id === photo.id }).eq('id', item.id);
    }
    onChanged();
  };

  const saveCaption = async () => {
    if (!editingCaption?.id) return;
    const r = await backendApi.database.from('kesemaptaan_gallery').update({ caption: editingCaption.caption ?? '' }).eq('id', editingCaption.id);
    if (r.error) { onError(r.error.message); return; }
    setEditingCaption(null);
    onChanged();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Galeri foto kegiatan. Foto bertanda <Star className="inline h-3.5 w-3.5 text-[#C8A951]" /> adalah foto utama.</p>
        {canCreate && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? 'Mengunggah...' : 'Upload Foto'}
            </button>
          </>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg bg-[#FAF6F0] p-8 text-center text-[#5B7088]">Belum ada foto dokumentasi.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((photo) => (
            <div key={String(photo.id)} className={`group overflow-hidden rounded-xl border bg-white ${photo.is_primary ? 'border-[#C8A951] ring-2 ring-[#C8A951]/30' : 'border-[#1B2A4A]/10'}`}>
              <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF6F0]">
                {resolveImageUrl(photo.image) && (
                  <img src={resolveImageUrl(photo.image)!} alt={photo.caption || 'Dokumentasi'} className="h-full w-full object-cover" />
                )}
                {photo.is_primary && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#C8A951] px-2 py-0.5 text-[10px] font-bold text-[#1B2A4A]">
                    <Star className="h-3 w-3 fill-current" /> Utama
                  </span>
                )}
              </div>
              {photo.caption && <p className="line-clamp-1 px-3 pt-2 text-xs text-[#5B7088]">{photo.caption}</p>}
              <div className="flex items-center justify-end gap-2 p-2">
                {canEdit && (
                  <>
                    {!photo.is_primary && (
                      <button onClick={() => setPrimary(photo)} title="Jadikan foto utama" className="rounded-lg p-1.5 text-[#866D2C] hover:bg-[#FAF6F0]"><Star size={15} /></button>
                    )}
                    <button onClick={() => setEditingCaption(photo)} title="Ubah keterangan" className="rounded-lg p-1.5 text-[#866D2C] hover:bg-[#FAF6F0]"><Pencil size={15} /></button>
                  </>
                )}
                {canDelete && (
                  <button onClick={() => remove(photo)} title="Hapus foto" className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCaption && (
        <Modal title="Ubah Keterangan Foto" onClose={() => setEditingCaption(null)}>
          <Field label="Keterangan (caption)" value={editingCaption.caption ?? ''} onChange={(e) => setEditingCaption((c) => (c ? { ...c, caption: e.target.value } : c))} />
          <ModalFooter onClose={() => setEditingCaption(null)} onSave={saveCaption} />
        </Modal>
      )}
    </div>
  );
}

// ---------- VIDEO (YouTube) ----------
function VideosList({ items, canCreate, canEdit, canDelete, onChanged, onError }: {
  items: KesemaptaanVideo[]; canCreate: boolean; canEdit: boolean; canDelete: boolean;
  onChanged: () => void; onError: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KesemaptaanVideo | null>(null);

  const save = async (video: KesemaptaanVideo) => {
    const { id: _id, ...rest } = video;
    const r = editing?.id
      ? await backendApi.database.from('kesemaptaan_videos').update(rest).eq('id', editing.id)
      : await backendApi.database.from('kesemaptaan_videos').insert([{ ...rest, sort_order: items.length + 1 }]);
    if (r.error) { onError(r.error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus video ini?')) return;
    const r = await backendApi.database.from('kesemaptaan_videos').delete().eq('id', id);
    if (r.error) { onError(r.error.message); return; }
    onChanged();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#23314D]">Video dokumentasi. Gunakan URL YouTube agar tetap ringan (tidak mengunggah file video ke server).</p>
        {canCreate && (
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
            <Plus className="h-4 w-4" /> Tambah Video
          </button>
        )}
      </div>
      <AdminTable
        headers={['Judul', 'URL YouTube', 'Aksi']}
        rows={items.map((v) => ({
          key: String(v.id),
          cells: [
            <span key="title" className="font-semibold">{v.title || '-'}</span>,
            <span key="url" className="break-all text-xs text-[#5B7088]">{v.youtube_url}</span>,
          ],
          actions: (
            <>
              {canEdit && <button onClick={() => { setEditing(v); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>}
              {canDelete && <button onClick={() => remove(String(v.id))} className="text-red-600"><Trash2 size={17} /></button>}
            </>
          ),
        }))}
        empty="Belum ada video."
      />
      {open && (
        <VideoForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (v) => { const ok = await save(v); if (ok) { setOpen(false); onChanged(); } }}
        />
      )}
    </div>
  );
}

function VideoForm({ item, onClose, onSave }: { item: KesemaptaanVideo | null; onClose: () => void; onSave: (v: KesemaptaanVideo) => void }) {
  const [values, setValues] = useState<KesemaptaanVideo>(item ?? { youtube_url: '', title: '' });
  const f = (key: keyof KesemaptaanVideo, type = 'text') => ({
    type,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Modal title={item ? 'Ubah Video' : 'Tambah Video'} onClose={onClose}>
      <div className="grid gap-4">
        <Field label="URL YouTube" placeholder="cth. https://www.youtube.com/watch?v=xxxxxxxxxxx" {...f('youtube_url')} />
        <Field label="Judul Video" {...f('title')} />
        <p className="text-xs text-[#5B7088]">Video akan ditampilkan menggunakan thumbnail YouTube dan baru diputar saat diklik.</p>
      </div>
      <ModalFooter onClose={onClose} onSave={() => onSave(values)} />
    </Modal>
  );
}

// ---------- JADWAL KEGIATAN ----------
function ScheduleList({ items, canCreate, canEdit, canDelete, onChanged, onError }: {
  items: KesemaptaanSchedule[]; canCreate: boolean; canEdit: boolean; canDelete: boolean;
  onChanged: () => void; onError: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KesemaptaanSchedule | null>(null);

  const save = async (schedule: KesemaptaanSchedule) => {
    const { id: _id, ...rest } = schedule;
    const r = editing?.id
      ? await backendApi.database.from('kesemaptaan_schedules').update(rest).eq('id', editing.id)
      : await backendApi.database.from('kesemaptaan_schedules').insert([rest]);
    if (r.error) { onError(r.error.message); return false; }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus jadwal ini?')) return;
    const r = await backendApi.database.from('kesemaptaan_schedules').delete().eq('id', id);
    if (r.error) { onError(r.error.message); return; }
    onChanged();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#23314D]">Kelola jadwal kegiatan (nama kegiatan, tanggal, lokasi, dan keterangan).</p>
        {canCreate && (
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
            <Plus className="h-4 w-4" /> Tambah Jadwal
          </button>
        )}
      </div>
      <AdminTable
        headers={['Nama Kegiatan', 'Tanggal', 'Lokasi', 'Keterangan', 'Aksi']}
        rows={items.map((s) => ({
          key: String(s.id),
          cells: [
            <span key="name" className="font-semibold">{s.name || '-'}</span>,
            s.date ? new Date(s.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-',
            <span key="loc" className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#866D2C]" /> {s.location || '-'}</span>,
            <span key="desc" className="line-clamp-2 text-[#5B7088]">{s.description || '-'}</span>,
          ],
          actions: (
            <>
              {canEdit && <button onClick={() => { setEditing(s); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>}
              {canDelete && <button onClick={() => remove(String(s.id))} className="text-red-600"><Trash2 size={17} /></button>}
            </>
          ),
        }))}
        empty="Belum ada jadwal kegiatan."
      />
      {open && (
        <ScheduleForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (s) => { const ok = await save(s); if (ok) { setOpen(false); onChanged(); } }}
        />
      )}
    </div>
  );
}

function ScheduleForm({ item, onClose, onSave }: { item: KesemaptaanSchedule | null; onClose: () => void; onSave: (s: KesemaptaanSchedule) => void }) {
  const [values, setValues] = useState<KesemaptaanSchedule>(item ?? { name: '', date: '', location: '', description: '' });
  const f = (key: keyof KesemaptaanSchedule, type = 'text', multiline = false) => ({
    type, multiline,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Modal title={item ? 'Ubah Jadwal' : 'Tambah Jadwal'} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Nama Kegiatan" {...f('name')} /></div>
        <Field label="Tanggal" {...f('date', 'date')} />
        <Field label="Lokasi" {...f('location')} />
        <div className="sm:col-span-2"><Field label="Keterangan" {...f('description', 'text', true)} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={() => onSave(values)} />
    </Modal>
  );
}

// ---------- SHARED UI ----------
function Field({ label, value, onChange, multiline = false, type = 'text', disabled = false, placeholder }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; multiline?: boolean; type?: string; disabled?: boolean; placeholder?: string }) {
  const className = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal disabled:bg-[#FAF6F0]';
  return (
    <label className="block text-sm font-semibold">{label}
      {multiline
        ? <textarea value={value} onChange={onChange} rows={4} disabled={disabled} placeholder={placeholder} className={className} />
        : <input type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} className={className} />}
    </label>
  );
}

function SaveButton({ saving, label, onClick }: { saving: boolean; label: string; onClick: () => void }) {
  return (
    <div className="mt-6 flex justify-end">
      <button onClick={onClick} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {label}
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{title}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
      <button onClick={onSave} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white"><Save className="h-4 w-4" /> Simpan</button>
    </div>
  );
}

function AdminTable({ headers, rows, empty }: { headers: string[]; rows: { key: string; cells: ReactNode[]; actions?: ReactNode }[]; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
          <tr>{headers.map((h) => <th key={h} className="p-4">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={headers.length} className="p-8 text-center text-[#5B7088]">{empty}</td></tr>}
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-[#1B2A4A]/10">
              {row.cells.map((c, i) => <td key={i} className="max-w-xs p-4">{c}</td>)}
              {row.actions && <td className="p-4">{row.actions}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}