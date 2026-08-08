import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, LayoutGrid, CalendarDays, Clock, User, Trophy } from 'lucide-react';
import { backendApi } from '../../lib/api';
import { can } from '../../lib/permissions';
import type { KesemaptaanProfile, KesemaptaanActivity, KesemaptaanSchedule, KesemaptaanInstructor, KesemaptaanAchievement } from '../../lib/content-types';
import ImageField from './ImageField';

type Tab = 'profile' | 'activities' | 'schedules' | 'instructors' | 'achievements';

interface Props {
  permissions: string[];
}

export default function KesemaptaanManagement({ permissions }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<KesemaptaanProfile | null>(null);
  const [activities, setActivities] = useState<KesemaptaanActivity[]>([]);
  const [schedules, setSchedules] = useState<KesemaptaanSchedule[]>([]);
  const [instructors, setInstructors] = useState<KesemaptaanInstructor[]>([]);
  const [achievements, setAchievements] = useState<KesemaptaanAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    const [p, a, s, i, c] = await Promise.all([
      backendApi.database.from('kesemaptaan').select('*').limit(1).maybeSingle(),
      backendApi.database.from('kesemaptaan_activities').select('*').order('activity_date', { ascending: false }),
      backendApi.database.from('kesemaptaan_schedules').select('*'),
      backendApi.database.from('kesemaptaan_instructors').select('*').order('sort_order', { ascending: true }),
      backendApi.database.from('kesemaptaan_achievements').select('*'),
    ]);
    setProfile(p.data ? (p.data as KesemaptaanProfile) : null);
    setActivities((a.data as KesemaptaanActivity[] | null) ?? []);
    setSchedules((s.data as KesemaptaanSchedule[] | null) ?? []);
    setInstructors((i.data as KesemaptaanInstructor[] | null) ?? []);
    setAchievements((c.data as KesemaptaanAchievement[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const tabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'profile', label: 'Profil', icon: LayoutGrid },
    { key: 'activities', label: 'Kegiatan', icon: CalendarDays },
    { key: 'schedules', label: 'Jadwal', icon: Clock },
    { key: 'instructors', label: 'Pembina', icon: User },
    { key: 'achievements', label: 'Prestasi', icon: Trophy },
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
        <ProfileForm
          profile={profile}
          canSave={can(permissions, 'kesemaptaan.edit') || can(permissions, 'kesemaptaan.create')}
          onSaved={() => { void loadAll(); flash('ok', 'Profil kesemaptaan disimpan.'); }}
          onError={(text) => flash('err', text)}
        />
      )}

      {tab === 'activities' && (
        <SimpleList
          items={activities.map((a) => ({ id: String(a.id), title: a.title, subtitle: a.activity_date ? new Date(a.activity_date).toLocaleDateString('id-ID') : '', status: a.status }))}
          canCreate={can(permissions, 'kesemaptaan.create')}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={can(permissions, 'kesemaptaan.delete')}
          label="Kegiatan"
          onSave={async (item) => {
            const payload = { title: item.title, description: item.subtitle, status: 'published' };
            if (item.id) {
              const { error } = await backendApi.database.from('kesemaptaan_activities').update(payload).eq('id', item.id);
              if (error) return flash('err', error.message);
            } else {
              const { error } = await backendApi.database.from('kesemaptaan_activities').insert([payload]);
              if (error) return flash('err', error.message);
            }
            await loadAll(); flash('ok', 'Data kegiatan disimpan.');
          }}
          onDelete={async (id) => {
            const { error } = await backendApi.database.from('kesemaptaan_activities').delete().eq('id', id);
            if (error) return flash('err', error.message);
            await loadAll(); flash('ok', 'Kegiatan dihapus.');
          }}
        />
      )}

      {tab === 'schedules' && (
        <SimpleList
          items={schedules.map((s) => ({ id: String(s.id), title: s.day, subtitle: `${s.time} — ${s.place}` }))}
          canCreate={can(permissions, 'kesemaptaan.create')}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={can(permissions, 'kesemaptaan.delete')}
          label="Jadwal"
          onSave={async (item) => {
            const payload = { day: item.title, time: '', place: '' };
            const parts = item.subtitle.split('—');
            payload.time = (parts[0] ?? '').trim();
            payload.place = (parts[1] ?? '').trim();
            if (item.id) {
              const { error } = await backendApi.database.from('kesemaptaan_schedules').update(payload).eq('id', item.id);
              if (error) return flash('err', error.message);
            } else {
              const { error } = await backendApi.database.from('kesemaptaan_schedules').insert([payload]);
              if (error) return flash('err', error.message);
            }
            await loadAll(); flash('ok', 'Data jadwal disimpan.');
          }}
          onDelete={async (id) => {
            const { error } = await backendApi.database.from('kesemaptaan_schedules').delete().eq('id', id);
            if (error) return flash('err', error.message);
            await loadAll(); flash('ok', 'Jadwal dihapus.');
          }}
        />
      )}

      {tab === 'instructors' && (
        <SimpleList
          items={instructors.map((i) => ({ id: String(i.id), title: i.name, subtitle: i.role }))}
          canCreate={can(permissions, 'kesemaptaan.create')}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={can(permissions, 'kesemaptaan.delete')}
          label="Pembina"
          onSave={async (item) => {
            const payload = { name: item.title, role: item.subtitle, sort_order: 1 };
            if (item.id) {
              const { error } = await backendApi.database.from('kesemaptaan_instructors').update(payload).eq('id', item.id);
              if (error) return flash('err', error.message);
            } else {
              const { error } = await backendApi.database.from('kesemaptaan_instructors').insert([payload]);
              if (error) return flash('err', error.message);
            }
            await loadAll(); flash('ok', 'Data pembina disimpan.');
          }}
          onDelete={async (id) => {
            const { error } = await backendApi.database.from('kesemaptaan_instructors').delete().eq('id', id);
            if (error) return flash('err', error.message);
            await loadAll(); flash('ok', 'Pembina dihapus.');
          }}
        />
      )}

      {tab === 'achievements' && (
        <SimpleList
          items={achievements.map((a) => ({ id: String(a.id), title: a.name, subtitle: `${a.year} — ${a.description}` }))}
          canCreate={can(permissions, 'kesemaptaan.create')}
          canEdit={can(permissions, 'kesemaptaan.edit')}
          canDelete={can(permissions, 'kesemaptaan.delete')}
          label="Prestasi"
          onSave={async (item) => {
            const parts = item.subtitle.split('—');
            const payload = { name: item.title, year: (parts[0] ?? '').trim(), description: (parts[1] ?? '').trim(), documentation: [] };
            if (item.id) {
              const { error } = await backendApi.database.from('kesemaptaan_achievements').update(payload).eq('id', item.id);
              if (error) return flash('err', error.message);
            } else {
              const { error } = await backendApi.database.from('kesemaptaan_achievements').insert([payload]);
              if (error) return flash('err', error.message);
            }
            await loadAll(); flash('ok', 'Data prestasi disimpan.');
          }}
          onDelete={async (id) => {
            const { error } = await backendApi.database.from('kesemaptaan_achievements').delete().eq('id', id);
            if (error) return flash('err', error.message);
            await loadAll(); flash('ok', 'Prestasi dihapus.');
          }}
        />
      )}
    </div>
  );
}

function ProfileForm({ profile, canSave, onSaved, onError }: { profile: KesemaptaanProfile | null; canSave: boolean; onSaved: () => void; onError: (t: string) => void }) {
  const [values, setValues] = useState<KesemaptaanProfile>(profile ?? { title: '', description: '', photo: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(profile ?? { title: '', description: '', photo: '' });
  }, [profile]);

  const field = (key: keyof KesemaptaanProfile) => ({
    value: String(values[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  const save = async () => {
    setSaving(true);
    if (profile?.id) {
      const { id, ...rest } = values;
      const r = await backendApi.database.from('kesemaptaan').update(rest).eq('id', id);
      if (r.error) { onError(r.error.message); setSaving(false); return; }
    } else {
      const r = await backendApi.database.from('kesemaptaan').insert([values]);
      if (r.error) { onError(r.error.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid gap-4">
        <Field label="Judul" {...field('title')} disabled={!canSave} />
        <Field label="Deskripsi" multiline {...field('description')} disabled={!canSave} />
        <ImageField label="Foto" value={String(values.photo ?? '')} onChange={(url) => setValues((v) => ({ ...v, photo: url }))} disabled={!canSave} />
      </div>
      {canSave && (
        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Profil
          </button>
        </div>
      )}
    </div>
  );
}

interface SimpleListItem {
  id: string;
  title: string;
  subtitle: string;
}

function SimpleList({ items, canCreate, canEdit, canDelete, label, onSave, onDelete }: {
  items: SimpleListItem[]; canCreate: boolean; canEdit: boolean; canDelete: boolean;
  label: string; onSave: (item: SimpleListItem) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SimpleListItem | null>(null);

  const remove = async (id: string) => {
    if (!confirm(`Hapus ${label.toLowerCase()} ini?`)) return;
    onDelete(id);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[#23314D]">Kelola data {label.toLowerCase()}.</p>
        {canCreate && (
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A]">
            <Plus className="h-4 w-4" /> Tambah {label}
          </button>
        )}
      </div>
      <AdminTable
        headers={['Judul / Nama', 'Detail', 'Aksi']}
        rows={items.map((item) => ({
          key: item.id,
          cells: [<span key="t" className="font-semibold">{item.title}</span>, item.subtitle || '-'],
          actions: (
            <>
              {canEdit && <button onClick={() => { setEditing(item); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>}
              {canDelete && <button onClick={() => remove(item.id)} className="text-red-600"><Trash2 size={17} /></button>}
            </>
          ),
        }))}
        empty={`Belum ada data ${label.toLowerCase()}.`}
      />
      {open && (
        <SimpleModal
          title={editing ? `Ubah ${label}` : `Tambah ${label}`}
          item={editing ?? { id: '', title: '', subtitle: '' }}
          onClose={() => setOpen(false)}
          onSave={(item) => { setOpen(false); onSave({ ...item, id: editing?.id ?? '' }); }}
        />
      )}
    </div>
  );
}

function SimpleModal({ title, item, onClose, onSave }: { title: string; item: SimpleListItem; onClose: () => void; onSave: (v: SimpleListItem) => void }) {
  const [values, setValues] = useState<SimpleListItem>(item);
  const f = (key: 'title' | 'subtitle', type = 'text', multiline = false) => ({
    type, multiline,
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-4">
        <Field label="Judul / Nama" {...f('title')} />
        <Field label="Detail (tanggal, jam, deskripsi, dst.)" {...f('subtitle', 'text', true)} />
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
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
