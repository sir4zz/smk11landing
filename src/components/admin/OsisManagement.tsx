import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, UserRound, CalendarDays, LayoutGrid, Image, Vote } from 'lucide-react';
import { backendApi, electionApi, resolveImageUrl } from '../../lib/api';
import type { OsisProfile, OsisMember, OsisActivity, OsisElectionAdminState, OsisCandidate } from '../../lib/content-types';
import { can } from '../../lib/permissions';
import ImageField from './ImageField';
import BannerTab from './BannerTab';

type Tab = 'profile' | 'members' | 'activities' | 'election' | 'banner';

interface Props {
  permissions: string[];
}

export default function OsisManagement({ permissions }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<OsisProfile | null>(null);
  const [members, setMembers] = useState<OsisMember[]>([]);
  const [activities, setActivities] = useState<OsisActivity[]>([]);
  const [election, setElection] = useState<OsisElectionAdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    const [p, m, a, e] = await Promise.all([
      backendApi.database.from('osis').select('*').limit(1).maybeSingle(),
      backendApi.database.from('osis_members').select('*').order('sort_order', { ascending: true }),
      backendApi.database.from('osis_activities').select('*').order('activity_date', { ascending: false }),
      electionApi.adminList(),
    ]);
    setProfile(p.data ? (p.data as OsisProfile) : null);
    setMembers((m.data as OsisMember[] | null) ?? []);
    setActivities((a.data as OsisActivity[] | null) ?? []);
    setElection(e.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const tabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'profile', label: 'Profil OSIS', icon: LayoutGrid },
    { key: 'members', label: 'Struktur', icon: UserRound },
    { key: 'activities', label: 'Kegiatan', icon: CalendarDays },
    { key: 'election', label: 'Pemilihan', icon: Vote },
    { key: 'banner', label: 'Banner', icon: Image },
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

      {tab === 'profile' && (
        <OsisProfileForm
          profile={profile}
          canEdit={can(permissions, 'osis.edit') || can(permissions, 'osis.create')}
          onSaved={() => { void loadAll(); flash('ok', 'Profil OSIS disimpan.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'members' && (
        <OsisMembersList
          items={members}
          canEdit={can(permissions, 'osis.edit')}
          canCreate={can(permissions, 'osis.create')}
          canDelete={can(permissions, 'osis.delete')}
          onChanged={async () => { await loadAll(); flash('ok', 'Data struktur diperbarui.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'activities' && (
        <OsisActivitiesList
          items={activities}
          canEdit={can(permissions, 'osis.activities.edit')}
          canCreate={can(permissions, 'osis.activities.create')}
          canDelete={can(permissions, 'osis.activities.delete')}
          onChanged={async () => { await loadAll(); flash('ok', 'Data kegiatan diperbarui.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'election' && (
        <OsisElectionPanel
          state={election}
          canEdit={can(permissions, 'osis.edit') || can(permissions, 'osis.create')}
          canCreate={can(permissions, 'osis.create')}
          canDelete={can(permissions, 'osis.delete')}
          onChanged={async () => { await loadAll(); flash('ok', 'Data pemilihan diperbarui.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'banner' && (
        <BannerTab pageKey="osis" label="Banner OSIS" />
      )}
    </div>
  );
}

function OsisElectionPanel({
  state,
  canEdit,
  canCreate,
  canDelete,
  onChanged,
  onError,
}: {
  state: OsisElectionAdminState | null;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onChanged: () => void;
  onError: (t: string) => void;
}) {
  const election = state?.election ?? null;
  const candidates = state?.candidates ?? [];
  const totalVotes = state?.total_votes ?? 0;
  const [title, setTitle] = useState(election?.title ?? '');
  const [description, setDescription] = useState(election?.description ?? '');
  const [isActive, setIsActive] = useState(!!election?.is_active);
  const [isVisible, setIsVisible] = useState(!!election?.is_visible);
  const [savingElection, setSavingElection] = useState(false);
  const [openCandidate, setOpenCandidate] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<OsisCandidate | null>(null);

  useEffect(() => {
    setTitle(election?.title ?? '');
    setDescription(election?.description ?? '');
    setIsActive(!!election?.is_active);
    setIsVisible(!!election?.is_visible);
  }, [election]);

  const saveElection = async () => {
    if (!canEdit) return;
    if (!title.trim()) {
      onError('Judul pemilihan wajib diisi.');
      return;
    }
    setSavingElection(true);
    try {
      if (election?.id) {
        const { error } = await electionApi.adminUpdateElection(election.id, {
          title: title.trim(),
          description,
          is_active: isActive,
          is_visible: isVisible,
        });
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await electionApi.adminSaveElection({
          title: title.trim(),
          description,
          is_active: isActive,
          is_visible: isVisible,
        });
        if (error || !data?.id) throw new Error(error?.message ?? 'Gagal menyimpan pemilihan.');
      }
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Gagal menyimpan pemilihan.');
    } finally {
      setSavingElection(false);
    }
  };

  const saveCandidate = async (candidate: OsisCandidate): Promise<boolean> => {
    if (!election?.id) {
      onError('Simpan info pemilihan terlebih dahulu.');
      return false;
    }
  const payload = {
    number: Number(candidate.number) || 1,
    name: candidate.name,
    class: candidate.class ?? '',
    wakil_name: candidate.wakil_name ?? '',
    wakil_class: candidate.wakil_class ?? '',
    vision: candidate.vision ?? '',
    mission: candidate.mission ?? '',
    photo: candidate.photo ?? '',
    wakil_photo: candidate.wakil_photo ?? '',
    banner_photo: candidate.banner_photo ?? '',
    sort_order: Number(candidate.sort_order) || 0,
    is_active: candidate.is_active !== false,
  };
    const { error } = await electionApi.adminSaveCandidate(
      election.id,
      payload,
      editingCandidate?.id,
    );
    if (error) {
      onError(error.message ?? 'Gagal menyimpan kandidat.');
      return false;
    }
    return true;
  };

  const removeCandidate = async (id: string) => {
    if (!election?.id) return;
    if (!confirm('Hapus kandidat ini?')) return;
    const { error } = await electionApi.adminDeleteCandidate(election.id, id);
    if (error) {
      onError(error.message ?? 'Gagal menghapus kandidat.');
      return;
    }
    onChanged();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[#23314D]">Kelola pemilihan OSIS dan daftar kandidat untuk halaman Ruang Siswa.</p>
            {election?.id && (
              <p className="mt-1 text-sm font-semibold text-[#866D2C]">Total suara terkumpul: {totalVotes}</p>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !isVisible ? 'bg-[#FAF6F0] text-[#5B7088]'
              : isActive ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
          }`}>
            {!isVisible ? 'Halaman tersembunyi'
              : isActive ? 'Pemilihan aktif'
                : 'Mode kampanye (tanpa voting)'}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul Pemilihan" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} />
          <div className="flex flex-col gap-2 self-end pb-2">
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isVisible}
                disabled={!canEdit}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 accent-[#C8A951]"
              />
              Tampilkan halaman untuk siswa
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isActive}
                disabled={!canEdit || !isVisible}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#C8A951]"
              />
              Aktifkan pemilihan (siswa dapat memilih)
            </label>
          </div>
          <div className="md:col-span-2">
            <Field label="Deskripsi" multiline value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEdit} />
          </div>
        </div>

        {canEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveElection}
              disabled={savingElection}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a] disabled:opacity-60"
            >
              {savingElection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Pemilihan
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[#23314D]">Daftar pasangan calon ketua &amp; wakil ketua yang tampil di halaman pemilihan siswa.</p>
          {canCreate && election?.id && (
            <button
              onClick={() => { setEditingCandidate(null); setOpenCandidate(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]"
            >
              <Plus className="h-4 w-4" /> Tambah Pasangan
            </button>
          )}
        </div>

        {!election?.id && (
          <p className="rounded-lg bg-[#FAF6F0] p-4 text-sm text-[#5B7088]">Simpan info pemilihan terlebih dahulu sebelum menambah kandidat.</p>
        )}

        {election?.id && (
          <AdminTable
            headers={['No.', 'Pasangan', 'Kelas', 'Suara', 'Status', 'Aksi']}
            rows={candidates.map((c) => ({
              key: String(c.id),
              cells: [
                <span key="no" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C8A951] text-xs font-bold text-[#1B2A4A]">{c.number}</span>,
                <div key="name" className="flex items-center gap-3">
                  {(c.banner_photo || c.photo) ? (
                    <img src={resolveImageUrl(c.banner_photo || c.photo)} alt="" className="h-11 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-11 w-16 place-items-center rounded-lg bg-[#FAF6F0] text-xs font-bold text-[#866D2C]">{c.number}</div>
                  )}
                  <div>
                    <span className="font-semibold">{c.name}</span>
                    {c.wakil_name && <span className="block text-xs text-[#5B7088]">& {c.wakil_name}</span>}
                  </div>
                </div>,
                <div key="class" className="text-xs">
                  <span>{c.class || '—'}</span>
                  {c.wakil_name && <span className="block text-[#5B7088]">{c.wakil_class || '—'}</span>}
                </div>,
                String(c.votes ?? 0),
                <span key="status" className={`rounded-full px-3 py-1 text-xs font-semibold ${c.is_active !== false ? 'bg-green-50 text-green-700' : 'bg-[#FAF6F0] text-[#5B7088]'}`}>
                  {c.is_active !== false ? 'Aktif' : 'Nonaktif'}
                </span>,
              ],
              actions: (
                <>
                  {canEdit && <button onClick={() => { setEditingCandidate(c); setOpenCandidate(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>}
                  {canDelete && <button onClick={() => removeCandidate(String(c.id))} className="text-red-600"><Trash2 size={17} /></button>}
                </>
              ),
            }))}
            empty="Belum ada pasangan kandidat."
          />
        )}

        {openCandidate && election?.id && (
          <OsisCandidateForm
            item={editingCandidate}
            onClose={() => { setOpenCandidate(false); setEditingCandidate(null); }}
            onSave={async (c) => {
              const ok = await saveCandidate(c);
              if (ok) {
                setOpenCandidate(false);
                setEditingCandidate(null);
                onChanged();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function OsisCandidateForm({ item, onClose, onSave }: { item: OsisCandidate | null; onClose: () => void; onSave: (c: OsisCandidate) => void }) {
  const [values, setValues] = useState<OsisCandidate>(item ?? {
    number: 1,
    name: '',
    class: '',
    wakil_name: '',
    wakil_class: '',
    vision: '',
    mission: '',
    photo: '',
    wakil_photo: '',
    banner_photo: '',
    sort_order: 1,
    is_active: true,
  });
  const f = (key: keyof OsisCandidate, type: string = 'text') => ({
    type,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Modal title={item ? 'Ubah Pasangan Kandidat' : 'Tambah Pasangan Kandidat'} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor Urut" type="number" value={String(values.number ?? 1)} onChange={(e) => setValues((v) => ({ ...v, number: Number(e.target.value) || 1 }))} />
        <label className="block text-sm font-semibold">Status
          <select
            value={values.is_active !== false ? '1' : '0'}
            onChange={(e) => setValues((v) => ({ ...v, is_active: e.target.value === '1' }))}
            className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal"
          >
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </label>

        <div className="sm:col-span-2 rounded-lg border border-[#C8A951]/50 bg-[#C8A951]/5 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#866D2C]">Foto Pasangan (Banner utama)</p>
          <ImageField label="Satu foto berisi ketua & wakil" value={String(values.banner_photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, banner_photo: url }))} bucket="osis" />
        </div>

        <div className="sm:col-span-2 rounded-lg border border-[#1B2A4A]/10 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#866D2C]">Ketua</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Ketua" placeholder="Wajib diisi" {...f('name')} />
            <Field label="Kelas Ketua" placeholder="cth. XII TJKT 1" {...f('class')} />
            <div className="sm:col-span-2">
              <ImageField label="Foto Ketua (potret)" value={String(values.photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, photo: url }))} bucket="osis" />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 rounded-lg border border-[#1B2A4A]/10 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#866D2C]">Wakil Ketua <span className="normal-case font-normal text-[#5B7088]">(opsional)</span></p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Wakil" {...f('wakil_name')} />
            <Field label="Kelas Wakil" placeholder="cth. XII DKV 2" {...f('wakil_class')} />
            <div className="sm:col-span-2">
              <ImageField label="Foto Wakil (potret, opsional)" value={String(values.wakil_photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, wakil_photo: url }))} bucket="osis" />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2"><Field label="Visi (Pasangan)" multiline value={String(values.vision ?? '')} onChange={(e) => setValues((v) => ({ ...v, vision: e.target.value }))} /></div>
        <div className="sm:col-span-2"><Field label="Misi (Pasangan)" multiline value={String(values.mission ?? '')} onChange={(e) => setValues((v) => ({ ...v, mission: e.target.value }))} /></div>
        <Field label="Urutan Tampil" type="number" value={String(values.sort_order ?? 1)} onChange={(e) => setValues((v) => ({ ...v, sort_order: Number(e.target.value) || 1 }))} />
      </div>
      <ModalFooter
        onClose={onClose}
        onSave={() => onSave({
          ...values,
          number: Number(values.number) || 1,
          sort_order: Number(values.sort_order) || 1,
          is_active: values.is_active !== false,
        })}
      />
    </Modal>
  );
}

function OsisProfileForm({ profile, canEdit, onSaved, onError }: { profile: OsisProfile | null; canEdit: boolean; onSaved: () => void; onError: (t: string) => void }) {
  const [values, setValues] = useState<OsisProfile>(profile ?? {
    name: 'OSIS SMKN 11 Kabupaten Tangerang',
    description: '',
    period: '',
    logo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(profile ?? { name: 'OSIS SMKN 11 Kabupaten Tangerang', description: '', period: '', logo: '' });
  }, [profile]);

  const field = (key: keyof OsisProfile) => ({
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  const save = async () => {
    setSaving(true);
    if (profile?.id) {
      const { id, ...rest } = values;
      const r = await backendApi.database.from('osis').update(rest).eq('id', id);
      if (r.error) { onError(r.error.message); setSaving(false); return; }
    } else {
      const r = await backendApi.database.from('osis').insert([values]);
      if (r.error) { onError(r.error.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nama Organisasi" {...field('name')} disabled={!canEdit} />
        <Field label="Periode Kepengurusan" placeholder="cth. 2025/2026" {...field('period')} disabled={!canEdit} />
        <div className="md:col-span-2"><Field label="Deskripsi" multiline {...field('description')} disabled={!canEdit} /></div>
        <div className="md:col-span-2"><ImageField label="Logo" value={String(values.logo ?? '')} onChange={(url) => setValues((v) => ({ ...v, logo: url }))} disabled={!canEdit} /></div>
      </div>
      {canEdit && (
        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Profil
          </button>
        </div>
      )}
    </div>
  );
}

function OsisMembersList({ items, canEdit, canCreate, canDelete, onChanged, onError }: { items: OsisMember[]; canEdit: boolean; canCreate: boolean; canDelete: boolean; onChanged: () => void; onError: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OsisMember | null>(null);

  const save = async (member: OsisMember) => {
    if (editing?.id) {
      const { id, ...rest } = member;
      const r = await backendApi.database.from('osis_members').update(rest).eq('id', id);
      if (r.error) { onError(r.error.message); return false; }
    } else {
      const r = await backendApi.database.from('osis_members').insert([member]);
      if (r.error) { onError(r.error.message); return false; }
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus anggota ini?')) return;
    const r = await backendApi.database.from('osis_members').delete().eq('id', id);
    if (r.error) { onError(r.error.message); return; }
    onChanged();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#23314D]">Kelola struktur kepengurusan OSIS.</p>
        {canCreate && (
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
            <Plus className="h-4 w-4" /> Tambah Anggota
          </button>
        )}
      </div>
      <AdminTable
        headers={['Nama', 'Jabatan', 'Bidang / Seksi', 'Urutan', 'Aksi']}
        rows={items.map((m) => ({
          key: String(m.id),
          cells: [
            <div key="member" className="flex items-center gap-3">
              {m.photo ? <img src={m.photo} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FAF6F0]"><UserRound className="h-4 w-4 text-[#866D2C]" /></div>}
              <span className="font-semibold">{m.name}</span>
            </div>,
            m.position,
            m.division || '-',
            String(m.sort_order ?? 0),
          ],
          actions: (
            <>
              {canEdit && <button onClick={() => { setEditing(m); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>}
              {canDelete && <button onClick={() => remove(String(m.id))} className="text-red-600"><Trash2 size={17} /></button>}
            </>
          ),
        }))}
        empty="Belum ada anggota OSIS."
      />
      {open && (
        <OsisMemberForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (m) => { const ok = await save(m); if (ok) { setOpen(false); onChanged(); } }}
        />
      )}
    </div>
  );
}

function OsisMemberForm({ item, onClose, onSave }: { item: OsisMember | null; onClose: () => void; onSave: (m: OsisMember) => void }) {
  const [values, setValues] = useState<OsisMember>(item ?? { name: '', position: '', division: '', photo: '', sort_order: 1 });
  const f = (key: keyof OsisMember, type: string = 'text') => ({
    type,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Modal title={item ? 'Ubah Anggota' : 'Tambah Anggota'} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama" {...f('name')} />
        <label className="block text-sm font-semibold">Jabatan
          <select value={String(values.position ?? '')} onChange={(e) => setValues((v) => ({ ...v, position: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
            <option value="">— Pilih —</option>
            {(['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Ketua Bidang'] as const).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <Field label="Bidang / Seksi" placeholder="cth. Pembinaan Karakter" {...f('division')} />
        <div className="sm:col-span-2"><ImageField label="Foto" value={String(values.photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, photo: url }))} /></div>
        <Field label="Urutan Tampil" {...f('sort_order', 'number')} />
      </div>
      <ModalFooter onClose={onClose} onSave={() => onSave({ ...values, sort_order: Number(values.sort_order) || 1 })} />
    </Modal>
  );
}

function OsisActivitiesList({ items, canEdit, canCreate, canDelete, onChanged, onError }: { items: OsisActivity[]; canEdit: boolean; canCreate: boolean; canDelete: boolean; onChanged: () => void; onError: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OsisActivity | null>(null);

  const save = async (activity: OsisActivity) => {
    if (editing?.id) {
      const { id, ...rest } = activity;
      const r = await backendApi.database.from('osis_activities').update(rest).eq('id', id);
      if (r.error) { onError(r.error.message); return false; }
    } else {
      const r = await backendApi.database.from('osis_activities').insert([activity]);
      if (r.error) { onError(r.error.message); return false; }
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus kegiatan ini?')) return;
    const r = await backendApi.database.from('osis_activities').delete().eq('id', id);
    if (r.error) { onError(r.error.message); return; }
    onChanged();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#23314D]">Kelola kegiatan yang ditampilkan di halaman publik OSIS.</p>
        {canCreate && (
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
            <Plus className="h-4 w-4" /> Tambah Kegiatan
          </button>
        )}
      </div>
      <AdminTable
        headers={['Judul', 'Tanggal', 'Status', 'Aksi']}
        rows={items.map((a) => ({
          key: String(a.id),
          cells: [
            <span key="title" className="font-semibold">{a.title || '-'}</span>,
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
        empty="Belum ada kegiatan OSIS."
      />
      {open && (
        <OsisActivityForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (a) => { const ok = await save(a); if (ok) { setOpen(false); onChanged(); } }}
        />
      )}
    </div>
  );
}

function OsisActivityForm({ item, onClose, onSave }: { item: OsisActivity | null; onClose: () => void; onSave: (a: OsisActivity) => void }) {
  const [values, setValues] = useState<OsisActivity>(item ?? { title: '', description: '', photo: '', activity_date: '', status: 'published' });
  const f = (key: keyof OsisActivity, type: string = 'text', multiline = false) => ({
    type,
    multiline,
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Modal title={item ? 'Ubah Kegiatan' : 'Tambah Kegiatan'} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Judul Kegiatan" {...f('title')} /></div>
        <Field label="Tanggal" {...f('activity_date', 'date')} />
        <label className="block text-sm font-semibold">Status
          <select value={String(values.status)} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
            <option value="published">Terbit</option>
            <option value="draft">Draf</option>
          </select>
        </label>
        <div className="sm:col-span-2"><Field label="Deskripsi" {...f('description', 'text', true)} /></div>
        <div className="sm:col-span-2"><ImageField label="Foto" value={String(values.photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, photo: url }))} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={() => onSave(values)} />
    </Modal>
  );
}

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="max-h-[92vh] overflow-y-auto p-6">
          <div className="mb-5 flex justify-between">
            <h2 className="text-xl font-bold text-[#1B2A4A]">{title}</h2>
            <button onClick={onClose}><X /></button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex justify-end gap-3 border-t border-[#1B2A4A]/10 bg-white px-6 py-4">
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
