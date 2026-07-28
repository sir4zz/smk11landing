import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Building2, FileText, GraduationCap, LogOut, Mail, Menu, Pencil, Plus, Trophy, Trash2, Users, X } from 'lucide-react';
import { news as initialNews } from '../data/news';
import { programs as initialPrograms } from '../data/programs';
import { facilities as initialFacilities } from '../data/facilities';
import { staffData as initialStaff } from '../data/staff';
import { achievements as initialAchievements } from '../data/achievements';
import { apiUrl, readJsonResponse } from '../lib/api';

type Section = 'dashboard' | 'news' | 'programs' | 'facilities' | 'staff' | 'achievements' | 'ppdb' | 'contact';
type EditableSection = Exclude<Section, 'dashboard' | 'contact'>;
type Item = Record<string, unknown>;
const sessionKey = 'smkn11-admin-session';
const tokenKey = 'smkn11-admin-token';

const seed = {
  news: initialNews,
  programs: initialPrograms,
  facilities: initialFacilities,
  staff: initialStaff,
  achievements: initialAchievements,
  ppdb: [
    { id: 'ppdb-1', name: 'Aulia Rahman', program: 'Teknik Komputer dan Jaringan', status: 'Menunggu Verifikasi', date: '2026-07-23' },
    { id: 'ppdb-2', name: 'Nadia Putri', program: 'Rekayasa Perangkat Lunak', status: 'Terverifikasi', date: '2026-07-22' },
  ],
  contact: [] as Item[],
};

const configs: Record<EditableSection, { title: string; icon: typeof FileText; fields: { key: string; label: string; type?: string }[] }> = {
  news: { title: 'Berita', icon: FileText, fields: [{ key: 'title', label: 'Judul' }, { key: 'category', label: 'Kategori' }, { key: 'author', label: 'Penulis' }, { key: 'date', label: 'Tanggal', type: 'date' }, { key: 'excerpt', label: 'Ringkasan' }] },
  programs: { title: 'Program Keahlian', icon: BookOpen, fields: [{ key: 'name', label: 'Nama Program' }, { key: 'shortName', label: 'Singkatan' }, { key: 'shortDescription', label: 'Deskripsi Singkat' }] },
  facilities: { title: 'Fasilitas', icon: Building2, fields: [{ key: 'name', label: 'Nama Fasilitas' }, { key: 'category', label: 'Kategori' }, { key: 'description', label: 'Deskripsi' }] },
  staff: { title: 'Staf & Guru', icon: Users, fields: [{ key: 'name', label: 'Nama' }, { key: 'position', label: 'Jabatan' }, { key: 'department', label: 'Unit / Departemen' }] },
  achievements: { title: 'Prestasi', icon: Trophy, fields: [{ key: 'title', label: 'Judul Prestasi' }, { key: 'event', label: 'Acara' }, { key: 'level', label: 'Tingkat' }, { key: 'rank', label: 'Peringkat' }, { key: 'year', label: 'Tahun', type: 'number' }] },
  ppdb: { title: 'Pendaftar PPDB', icon: GraduationCap, fields: [{ key: 'name', label: 'Nama Calon Siswa' }, { key: 'program', label: 'Program Pilihan' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Tanggal', type: 'date' }] },
};

function normalizePpdbApplications(items: Array<Record<string, unknown>>) {
  return items.map(item => ({
    id: item.id ?? '',
    name: item.name ?? '-',
    program: item.program ?? '-',
    status: item.status ?? 'Menunggu Verifikasi',
    date: (item.date as string | undefined) ?? (item.submitted_at as string | undefined) ?? '',
    email: item.email ?? '',
    nisn: item.nisn ?? '',
    phone: item.phone ?? '',
    address: item.address ?? '',
  }));
}

export function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.message || 'Username atau kata sandi salah.');

      localStorage.setItem(sessionKey, 'true');
      localStorage.setItem(tokenKey, payload.token);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Username atau kata sandi salah.');
    } finally {
      setLoading(false);
    }
  };

  if (localStorage.getItem(sessionKey) && localStorage.getItem(tokenKey)) return <Navigate to="/admin" replace />;

  return (
    <main className="min-h-screen bg-[#FAF6F0] grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#1B2A4A] text-white"><GraduationCap /></div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Admin SMKN 11</h1>
          <p className="mt-2 text-sm text-[#23314D]">Masuk untuk mengelola konten website.</p>
        </div>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mb-4 block text-sm font-semibold text-[#1B2A4A]">Username<input name="username" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" /></label>
        <label className="mb-6 block text-sm font-semibold text-[#1B2A4A]">Kata sandi<input name="password" type="password" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" /></label>
        <button disabled={loading} className="w-full rounded-lg bg-[#1B2A4A] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Memeriksa...' : 'Masuk'}</button>
        <p className="mt-4 text-center text-xs text-[#5B7088]">Demo: admin / password123</p>
      </form>
    </main>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, Item[]>>(seed as unknown as Record<string, Item[]>);
  const [section, setSection] = useState<Section>('dashboard');
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) return;
    Promise.all([
      fetch(apiUrl('/api/content/news'), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(apiUrl('/api/content/programs'), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(apiUrl('/api/content/facilities'), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(apiUrl('/api/content/staff'), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(apiUrl('/api/content/achievements'), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(apiUrl('/api/ppdb'), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(apiUrl('/api/contact'), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([news, programs, facilities, staff, achievements, ppdb, contact]) => setData({
      news, programs, facilities, staff, achievements, ppdb: normalizePpdbApplications(ppdb), contact,
    })).catch(() => {});
  }, []);

  const menu = (Object.keys(configs) as EditableSection[]);
  const total = useMemo(() => Object.values(data).reduce((sum, list) => sum + list.length, 0), [data]);

  if (!localStorage.getItem(sessionKey)) return <Navigate to="/admin/login" replace />;

  const update = async (next: Item) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) return false;
    try {
      const isPpdb = section === 'ppdb';
      const endpoint = isPpdb
        ? apiUrl(`/api/ppdb${editing ? `/${editing.id}` : ''}`)
        : apiUrl(`/api/content/${section}${editing ? `/${editing.id}` : ''}`);
      const response = await fetch(endpoint, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.message || 'Gagal menyimpan data.');
      setData(current => ({ ...current, [section]: editing ? current[section].map(item => item.id === editing.id ? payload : item) : [payload, ...current[section]] }));
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      return false;
    }
  };

  const remove = async (id: unknown) => {
    if (!confirm('Hapus data ini?')) return;
    const token = localStorage.getItem(tokenKey);
    if (!token) return;
    try {
      const endpoint = section === 'ppdb'
        ? apiUrl(`/api/ppdb/${id}`)
        : section === 'contact'
          ? apiUrl(`/api/contact/${id}`)
          : apiUrl(`/api/content/${section}/${id}`);
      const response = await fetch(endpoint, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Gagal menghapus data.');
      setData(current => ({ ...current, [section]: current[section].filter(item => item.id !== id) }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  const markRead = async (id: unknown) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) return;
    await fetch(apiUrl(`/api/contact/${id}/read`), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setData(current => ({
      ...current,
      contact: current.contact.map(item => item.id === id ? { ...item, isRead: 1 } : item),
    }));
  };

  const active = section === 'dashboard' ? null : section === 'contact' ? { title: 'Pesan Kontak', icon: Mail, fields: [] } : configs[section];
  const editableSections = section !== 'dashboard' && section !== 'contact';

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1B2A4A]">
      <aside className={`${mobile ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-72 bg-[#1B2A4A] p-5 text-white transition-transform lg:translate-x-0`}>
        <div className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold"><GraduationCap className="text-[#C8A951]" /> ADMIN SMKN 11</span>
          <button className="lg:hidden" onClick={() => setMobile(false)}><X /></button>
        </div>
        <nav className="space-y-1">
          <Nav label="Dashboard" icon={BarChart3} active={section === 'dashboard'} onClick={() => setSection('dashboard')} />
          {menu.map(key => <Nav key={key} label={configs[key].title} icon={configs[key].icon} active={section === key} onClick={() => setSection(key)} />)}
          <Nav label="Pesan Kontak" icon={Mail} active={section === 'contact'} onClick={() => setSection('contact')} />
        </nav>
        <button onClick={() => { localStorage.removeItem(sessionKey); localStorage.removeItem(tokenKey); navigate('/admin/login'); }} className="absolute bottom-6 flex items-center gap-2 text-sm text-[#F3E8D0]"><LogOut size={18} /> Keluar</button>
      </aside>

      <main className="lg:ml-72">
        <header className="flex items-center justify-between border-b border-[#1B2A4A]/10 bg-white px-5 py-4">
          <button className="lg:hidden" onClick={() => setMobile(true)}><Menu /></button>
          <div>
            <p className="text-sm text-[#5B7088]">Panel pengelolaan website</p>
            <h1 className="text-xl font-bold">{section === 'dashboard' ? 'Dashboard' : active!.title}</h1>
          </div>
          <Link to="/" className="text-sm font-semibold text-[#866D2C]">Lihat Website</Link>
        </header>

        <div className="p-5 md:p-8">
          {section === 'dashboard' && <Dashboard data={data} total={total} />}

          {section === 'contact' && (
            <ContactMessages items={data.contact} onMarkRead={markRead} onDelete={remove} />
          )}

          {editableSections && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-[#23314D]">Kelola data {active!.title.toLowerCase()}.</p>
                <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Tambah</button>
              </div>
              <Table items={data[section]} config={active!} onEdit={item => { setEditing(item); setOpen(true); }} onDelete={id => remove(id)} />
            </>
          )}

          {open && editableSections && (
            <Editor config={active!} item={editing} onClose={() => setOpen(false)} onSave={async item => { const ok = await update(item); if (ok) setOpen(false); }} />
          )}
        </div>
      </main>
    </div>
  );
}

function Nav({ label, icon: Icon, active, onClick }: { label: string; icon: typeof FileText; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active ? 'bg-[#C8A951] font-bold text-[#1B2A4A]' : 'text-[#F3E8D0] hover:bg-white/10'}`}><Icon size={18} />{label}</button>;
}

function Dashboard({ data, total }: { data: Record<string, Item[]>; total: number }) {
  const cards = [{ label: 'Total Konten', value: total, icon: BarChart3 }, ...Object.entries(configs).slice(0, 3).map(([key, value]) => ({ label: value.title, value: data[key]?.length ?? 0, icon: value.icon }))];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => {
          const Icon = card.icon;
          return <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm"><Icon className="mb-4 text-[#866D2C]" /><p className="text-3xl font-bold">{card.value}</p><p className="text-sm text-[#5B7088]">{card.label}</p></div>;
        })}
      </div>
      <div className="mt-8 rounded-xl bg-[#1B2A4A] p-6 text-white">
        <h2 className="text-xl font-bold">Selamat datang, Administrator</h2>
        <p className="mt-2 text-[#F3E8D0]">Gunakan menu di samping untuk memperbarui konten website sekolah.</p>
      </div>
    </>
  );
}

function ContactMessages({ items, onMarkRead, onDelete }: { items: Item[]; onMarkRead: (id: unknown) => void; onDelete: (id: unknown) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!items.length) {
    return <div className="rounded-xl bg-white p-8 text-center shadow-sm"><Mail className="mx-auto mb-4 text-[#866D2C]" size={40} /><p className="text-[#5B7088]">Belum ada pesan masuk.</p></div>;
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const isRead = item.isRead === 1 || item.isRead === true;
        const isExpanded = expanded === item.id;
        return (
          <div key={String(item.id)} className={`rounded-xl border p-4 shadow-sm transition-all ${isRead ? 'bg-white' : 'border-[#C8A951]/40 bg-[#FFF9E8]'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!isRead && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#C8A951]" />}
                  <h3 className="font-bold text-[#1B2A4A] truncate">{String(item.subject)}</h3>
                </div>
                <p className="mt-1 text-sm text-[#5B7088]">
                  {String(item.name)} &lt;{String(item.email)}&gt; &mdash; {String(item.date ?? '')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { setExpanded(isExpanded ? null : String(item.id)); if (!isRead) onMarkRead(item.id); }} className="rounded-lg bg-[#1B2A4A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#15203a]">
                  {isExpanded ? 'Tutup' : 'Buka'}
                </button>
                <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
              </div>
            </div>
            {isExpanded && (
              <div className="mt-4 rounded-lg bg-[#FAF6F0] p-4 text-sm text-[#23314D] leading-relaxed whitespace-pre-wrap">
                {String(item.message)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Table({ items, config, onEdit, onDelete }: { items: Item[]; config: { fields: { key: string; label: string }[] }; onEdit: (item: Item) => void; onDelete: (id: unknown) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
          <tr>
            {config.fields.map(field => <th key={field.key} className="p-4">{field.label}</th>)}
            <th className="p-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={String(item.id)} className="border-t border-[#1B2A4A]/10">
              {config.fields.map(field => <td key={field.key} className="max-w-xs p-4">{String(item[field.key] ?? '-')}</td>)}
              <td className="p-4">
                <button onClick={() => onEdit(item)} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>
                <button onClick={() => onDelete(item.id)} className="text-red-600"><Trash2 size={17} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Editor({ config, item, onClose, onSave }: { config: { title: string; fields: { key: string; label: string; type?: string }[] }; item: Item | null; onClose: () => void; onSave: (item: Item) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({ ...item, ...Object.fromEntries(form as any) });
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold">{item ? 'Ubah' : 'Tambah'} {config.title}</h2>
          <button type="button" onClick={onClose}><X /></button>
        </div>
        <div className="space-y-4">
          {config.fields.map(field => (
            <label key={field.key} className="block text-sm font-semibold">
              {field.label}
              <input name={field.key} type={field.type || 'text'} defaultValue={String(item?.[field.key] ?? '')} required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2">Batal</button>
          <button className="rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white">Simpan</button>
        </div>
      </form>
    </div>
  );
}
