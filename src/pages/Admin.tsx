import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Building2, FileText, GraduationCap, LogOut, Mail, Menu, Pencil, Plus, Trophy, Trash2, Users, X, Search, Download, CheckCircle2, Eye } from 'lucide-react';
import logoSekolah from '../assets/logo.png';
import { news as initialNews } from '../data/news';
import { programs as initialPrograms } from '../data/programs';
import { facilities as initialFacilities } from '../data/facilities';
import { staffData as initialStaff } from '../data/staff';
import { achievements as initialAchievements } from '../data/achievements';
import { insforge } from '../lib/api';
import { LoadingInline } from '../components/ui/LoadingScreen';

type Section = 'dashboard' | 'news' | 'programs' | 'facilities' | 'staff' | 'achievements' | 'ppdb' | 'contact';
type EditableSection = Exclude<Section, 'dashboard' | 'contact'>;
type Item = Record<string, unknown>;
const sessionKey = 'smkn11-admin-session';

const seed = {
  news: initialNews,
  programs: initialPrograms,
  facilities: initialFacilities,
  staff: initialStaff,
  achievements: initialAchievements,
  ppdb: [
    { id: 'ppdb-1', name: 'Aulia Rahman', program: 'Teknik Jaringan Komputer dan Telekomunikasi', status: 'Menunggu Verifikasi', date: '2026-07-23' },
    { id: 'ppdb-2', name: 'Nadia Putri', program: 'Desain Komunikasi Visual', status: 'Terverifikasi', date: '2026-07-22' },
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
    const email = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');

    try {
      const { data, error: signInError } = await insforge.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      if (!data?.user) throw new Error('Sesi admin tidak dapat dibuat.');
      
      const { data: profile } = await insforge.database.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile?.role !== 'admin') {
        await insforge.auth.signOut();
        throw new Error('Unauthorized. Not an admin.');
      }

      localStorage.setItem(sessionKey, 'true');
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data.user) navigate('/admin', { replace: true });
    })
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#FAF6F0] grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#FAF6F0] p-2"><img src={logoSekolah} alt="Logo SMKN 11" className="h-full w-full object-contain" /></div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Admin SMKN 11</h1>
          <p className="mt-2 text-sm text-[#23314D]">Masuk untuk mengelola konten website.</p>
        </div>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mb-4 block text-sm font-semibold text-[#1B2A4A]">Email Admin<input name="username" type="email" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" /></label>
        <label className="mb-6 block text-sm font-semibold text-[#1B2A4A]">Kata sandi<input name="password" type="password" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" /></label>
        <button disabled={loading} className="w-full rounded-lg bg-[#1B2A4A] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Memeriksa...' : 'Masuk'}</button>
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
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (!data.user) return;
      Promise.all([
        insforge.database.from('content_records').select('*').eq('content_type', 'news').then((r: any) => r.data?.map((d: any) => ({ ...d.data, id: d.id })) || []),
        insforge.database.from('content_records').select('*').eq('content_type', 'programs').then((r: any) => r.data?.map((d: any) => ({ ...d.data, id: d.id })) || []),
        insforge.database.from('content_records').select('*').eq('content_type', 'facilities').then((r: any) => r.data?.map((d: any) => ({ ...d.data, id: d.id })) || []),
        insforge.database.from('content_records').select('*').eq('content_type', 'staff').then((r: any) => r.data?.map((d: any) => ({ ...d.data, id: d.id })) || []),
        insforge.database.from('content_records').select('*').eq('content_type', 'achievements').then((r: any) => r.data?.map((d: any) => ({ ...d.data, id: d.id })) || []),
        insforge.database.from('ppdb_registrations').select('*').then((r: any) => r.data?.map((d: any) => ({...d, name: d.full_name})) || []),
        insforge.database.from('contact_messages').select('*').then((r: any) => r.data || []),
      ]).then(([news, programs, facilities, staff, achievements, ppdb, contact]) => setData({
        news, programs, facilities, staff, achievements, ppdb: normalizePpdbApplications(ppdb), contact,
      })).catch(() => {});
    })
  }, []);

  const menu = (Object.keys(configs) as EditableSection[]);
  const total = useMemo(() => Object.values(data).reduce((sum, list) => sum + list.length, 0), [data]);

  if (!localStorage.getItem(sessionKey)) return <Navigate to="/admin/login" replace />;

  const update = async (next: Item) => {
    try {
      const isPpdb = section === 'ppdb';
      let payload;
      
      if (isPpdb) {
        if (editing) {
          const { error, data } = await insforge.database.from('ppdb_registrations').update(next).eq('id', editing.id).select().single();
          if (error) throw error;
          payload = data;
        }
      } else {
        const { id, ...dataToSave } = next;
        if (editing) {
          const { error, data } = await insforge.database.from('content_records').update({ data: dataToSave }).eq('id', editing.id).select().single();
          if (error) throw error;
          payload = { ...data.data, id: data.id };
        } else {
          const { error, data } = await insforge.database.from('content_records').insert([{ content_type: section, data: dataToSave }]).select().single();
          if (error) throw error;
          payload = { ...data.data, id: data.id };
        }
      }

      if (payload) {
        setData(current => ({ ...current, [section]: editing ? current[section].map(item => item.id === editing.id ? payload : item) : [payload, ...current[section]] }));
      }
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      return false;
    }
  };

  const remove = async (id: unknown) => {
    if (!confirm('Hapus data ini?')) return;
    try {
      if (section === 'ppdb') {
        const { error } = await insforge.database.from('ppdb_registrations').delete().eq('id', id);
        if (error) throw error;
      } else if (section === 'contact') {
        const { error } = await insforge.database.from('contact_messages').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await insforge.database.from('content_records').delete().eq('id', id);
        if (error) throw error;
      }
      setData(current => ({ ...current, [section]: current[section].filter(item => item.id !== id) }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  const markRead = async (id: unknown) => {
    await insforge.database.from('contact_messages').update({ is_read: true }).eq('id', id);
    setData(current => ({
      ...current,
      contact: current.contact.map(item => item.id === id ? { ...item, is_read: true } : item),
    }));
  };

  const active = section === 'dashboard' ? null : section === 'contact' ? { title: 'Pesan Kontak', icon: Mail, fields: [] } : configs[section];
  const editableSections = section !== 'dashboard' && section !== 'contact';

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1B2A4A]">
      <aside className={`${mobile ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-72 bg-[#1B2A4A] p-5 text-white transition-transform lg:translate-x-0`}>
        <div className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold"><img src={logoSekolah} alt="Logo SMKN 11" className="h-7 w-auto" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} /> ADMIN SMKN 11</span>
          <button className="lg:hidden" onClick={() => setMobile(false)}><X /></button>
        </div>
        <nav className="space-y-1">
          <Nav label="Dashboard" icon={BarChart3} active={section === 'dashboard'} onClick={() => setSection('dashboard')} />
          {menu.map(key => <Nav key={key} label={configs[key].title} icon={configs[key].icon} active={section === key} onClick={() => setSection(key)} />)}
          <Nav label="Pesan Kontak" icon={Mail} active={section === 'contact'} onClick={() => setSection('contact')} />
        </nav>
        <button onClick={async () => {
          await insforge.auth.signOut();
          localStorage.removeItem(sessionKey);
          navigate('/admin/login');
        }} className="absolute bottom-6 flex items-center gap-2 text-sm text-[#F3E8D0]"><LogOut size={18} /> Keluar</button>
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

          {section === 'ppdb' && <PPDBManagement />}

          {editableSections && section !== 'ppdb' && (
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

/* ===== PPDB Management (New System) ===== */
const ppdbStatuses = ['Menunggu Verifikasi', 'Sedang Diverifikasi', 'Perlu Perbaikan Dokumen', 'Lolos Seleksi', 'Cadangan', 'Tidak Lolos', 'Sudah Daftar Ulang'];

function PPDBManagement() {
  const [stats, setStats] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [programs, setPrograms] = useState<string[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      let query = insforge.database.from('ppdb_registrations').select('*', { count: 'exact' });
      if (search) query = query.or(`full_name.ilike.%${search}%,nisn.ilike.%${search}%,registration_number.ilike.%${search}%`);
      if (statusFilter) query = query.eq('status', statusFilter);
      if (programFilter) query = query.eq('program', programFilter);
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);
        
      if (!error && data) {
        setList(data.map((d: any) => ({ ...d, name: d.full_name })));
        setTotal(count || 0);
        setTotalPages(Math.ceil((count || 0) / 20));
        
        // Also fetch unique programs for filter
        const { data: progs } = await insforge.database.from('content_records').select('data').eq('content_type', 'programs');
        if (progs) setPrograms((progs as any[]).map((p: any) => p.data.name));
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await insforge.database.from('ppdb_registrations').select('status');
      if (error) return;
      const dataArr = data as { status: string }[];
      const counts: Record<string, number> = { total: dataArr.length };
      dataArr.forEach(d => {
        counts[d.status] = (counts[d.status] || 0) + 1;
      });
      setStats(counts);
    } catch {}
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchList(); }, [page, statusFilter, programFilter]);

  const searchTimer = useMemo(() => {
    let t: any;
    return {
      run: () => { clearTimeout(t); t = setTimeout(() => { setPage(1); fetchList(); }, 300); },
      cancel: () => clearTimeout(t),
    };
  }, [search]);

  useEffect(() => { searchTimer.run(); return () => searchTimer.cancel(); }, [search]);

  const statCards = stats ? [
    { label: 'Total Pendaftar', value: stats.total, color: 'text-[#1B2A4A]' },
    { label: 'Menunggu Verifikasi', value: stats['Menunggu Verifikasi'] || 0, color: 'text-[#C8A951]' },
    { label: 'Lolos Seleksi', value: (stats['Lolos Seleksi'] || 0) + (stats['Sudah Daftar Ulang'] || 0), color: 'text-green-600' },
    { label: 'Tidak Lolos', value: (stats['Tidak Lolos'] || 0) + (stats['Cadangan'] || 0), color: 'text-red-600' },
  ] : [];

  const openDetail = async (id: string) => {
    try {
    const { data: registration, error } = await insforge.database.from('ppdb_registrations').select('*').eq('id', id).single();
      if (error) throw error;
      
    const { data: documents } = await insforge.database.from('ppdb_documents').select('*').eq('application_id', id).order('created_at', { ascending: true });
    const { data: activities } = await insforge.database.from('ppdb_activity_log').select('*').eq('application_id', id).order('created_at', { ascending: false });
      
      setDetail({ registration, documents: documents || [], activities: activities || [] });
    } catch {}
  };

  const updateStatus = async (id: string, status: string, note: string) => {
    const { error } = await insforge.database.from('ppdb_registrations').update({ status, admin_note: note }).eq('id', id);
    if (!error) {
      await insforge.database.from('ppdb_activity_log').insert([{ application_id: id, action: `Status diubah menjadi ${status}`, note }]);
      fetchList(); fetchStats(); setDetail(null);
    }
  };

  const verifyDoc = async (docId: string, verified: boolean, note: string) => {
    const { error } = await insforge.database.from('ppdb_documents').update({ verified: verified ? 1 : 0, note }).eq('id', docId);
    if (!error) {
      if (detail) openDetail(detail.registration.id);
    }
  };

  return (
    <div>
      {/* Stats */}
      {statCards.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((s: any) => (
            <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-[#5B7088]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter & Search */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama/NISN/no. daftar..." className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2.5 pl-10 pr-4 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2.5 text-sm">
          <option value="">Semua Status</option>
          {ppdbStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2.5 text-sm">
          <option value="">Semua Jurusan</option>
          {programs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={async () => {
          try {
            // Build CSV from data
            const { data } = await insforge.database.from('ppdb_registrations').select('*').order('created_at', { ascending: false });
            if (!data) return;
            const headers = ['No. Daftar', 'Nama', 'Program', 'Status', 'Tgl Daftar'];
            const rows = data.map((d: any) => [d.registration_number, d.full_name, d.program, d.status, d.submitted_at || d.created_at].join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'ppdb-export.csv'; a.click();
            URL.revokeObjectURL(url);
          } catch {}
        }} className="inline-flex items-center gap-2 rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#1B2A4A] hover:bg-[#FAF6F0]">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
            <tr>
              <th className="p-4">No. Daftar</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Jurusan</th>
              <th className="p-4">Status</th>
              <th className="p-4">Dokumen</th>
              <th className="p-4">Tgl Daftar</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item: any) => (
              <tr key={item.id} className="border-t border-[#1B2A4A]/10 hover:bg-[#FAF6F0]/50">
                <td className="p-4 font-mono text-xs">{item.registration_number}</td>
                <td className="p-4 font-semibold">{item.name}</td>
                <td className="p-4 text-[#23314D]">{item.program}</td>
                <td className="p-4"><StatusBadge status={item.status} /></td>
                <td className="p-4 text-xs">{item.documents_verified}/{item.documents_count}</td>
                <td className="p-4 text-[#23314D]/70">{item.date ? new Date(item.date).toLocaleDateString('id-ID') : '-'}</td>
                <td className="p-4">
                  <button onClick={() => openDetail(item.id)} className="text-[#866D2C] hover:text-[#C8A951]"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-[#5B7088]">Belum ada pendaftar.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="p-8 text-center"><LoadingInline /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[#5B7088]">Total: {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-1.5 disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5 font-semibold">{page}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <PPDBDetail
          data={detail}
          onClose={() => setDetail(null)}
          onUpdateStatus={updateStatus}
          onVerifyDoc={verifyDoc}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Menunggu Verifikasi': 'bg-[#C8A951]/20 text-[#866D2C]',
    'Sedang Diverifikasi': 'bg-blue-50 text-blue-700',
    'Perlu Perbaikan Dokumen': 'bg-red-50 text-red-700',
    'Lolos Seleksi': 'bg-green-50 text-green-700',
    'Cadangan': 'bg-orange-50 text-orange-700',
    'Tidak Lolos': 'bg-gray-100 text-gray-600',
    'Sudah Daftar Ulang': 'bg-green-50 text-green-700',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function PPDBDetail({ data, onClose, onUpdateStatus, onVerifyDoc }: {
  data: any; onClose: () => void;
  onUpdateStatus: (id: string, status: string, note: string) => void;
  onVerifyDoc: (docId: string, verified: boolean, note: string) => void;
}) {
  const [status, setStatus] = useState(data.registration?.status || data.status || '');
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1B2A4A]/10 px-6 py-4">
          <h2 className="text-lg font-bold text-[#1B2A4A]">Detail Pendaftar</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-6 p-6">
          {/* Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div><span className="text-xs text-[#5B7088]">No. Pendaftaran</span><p className="font-mono font-bold">{data.registration?.registration_number || data.registration_number}</p></div>
            <div><span className="text-xs text-[#5B7088]">Nama</span><p className="font-semibold">{data.registration?.full_name || data.full_name || data.name}</p></div>
            <div><span className="text-xs text-[#5B7088]">NISN</span><p>{data.registration?.nisn || data.nisn || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">NIK</span><p>{data.registration?.nik || data.nik || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Jenis Kelamin</span><p>{(data.registration?.gender || data.gender) === 'L' ? 'Laki-laki' : (data.registration?.gender || data.gender) === 'P' ? 'Perempuan' : '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Tempat/Tgl Lahir</span><p>{(data.registration?.place_of_birth || data.place_of_birth) ? `${data.registration?.place_of_birth || data.place_of_birth}, ${new Date(data.registration?.date_of_birth || data.date_of_birth).toLocaleDateString('id-ID')}` : '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Agama</span><p>{data.registration?.religion || data.religion || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Status</span><p><StatusBadge status={data.registration?.status || data.status} /></p></div>
            <div className="md:col-span-2"><span className="text-xs text-[#5B7088]">Alamat</span><p>{data.registration?.address || data.address || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">No. HP</span><p>{data.registration?.phone || data.phone || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Email</span><p>{data.registration?.user_email || data.user_email || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Jurusan</span><p className="font-semibold">{data.registration?.program || data.program}</p></div>
          </div>

          {/* Parent Data */}
          <div>
            <h3 className="mb-3 font-semibold text-[#1B2A4A]">Data Orang Tua</h3>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-xs text-[#5B7088]">Ayah</span><p>{(data.registration?.father_name || data.father_name) || '-'} {(data.registration?.father_occupation || data.father_occupation) ? `(${data.registration?.father_occupation || data.father_occupation})` : ''}</p></div>
              <div><span className="text-xs text-[#5B7088]">Ibu</span><p>{(data.registration?.mother_name || data.mother_name) || '-'} {(data.registration?.mother_occupation || data.mother_occupation) ? `(${data.registration?.mother_occupation || data.mother_occupation})` : ''}</p></div>
              <div><span className="text-xs text-[#5B7088]">Wali</span><p>{data.registration?.guardian_name || data.guardian_name || '-'}</p></div>
              <div><span className="text-xs text-[#5B7088]">Alamat Orang Tua</span><p>{data.registration?.parent_address || data.parent_address || '-'}</p></div>
            </div>
          </div>

          {/* Previous School */}
          <div>
            <h3 className="mb-3 font-semibold text-[#1B2A4A]">Sekolah Asal</h3>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-xs text-[#5B7088]">Sekolah</span><p>{data.registration?.previous_school || data.previous_school || '-'}</p></div>
              <div><span className="text-xs text-[#5B7088]">Tahun Lulus</span><p>{data.registration?.graduation_year || data.graduation_year || '-'}</p></div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="mb-3 font-semibold text-[#1B2A4A]">Dokumen</h3>
            {(!data.documents || data.documents.length === 0) ? (
              <p className="text-sm text-[#5B7088]">Belum ada dokumen.</p>
            ) : (
              <div className="space-y-2">
                {data.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0] p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#866D2C]" />
                      <div>
                        <p className="text-sm font-semibold">{doc.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-[#5B7088]">{doc.filename} ({Math.round(doc.file_size / 1024)}KB)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.file_path && (
                        <button onClick={async () => {
                          const { data: urlData } = await insforge.storage.from('ppdb_documents').createSignedUrl(doc.file_path, 3600);
                          if (urlData?.signedUrl) window.open(urlData.signedUrl, '_blank');
                        }} className="rounded-lg bg-[#1B2A4A]/10 px-3 py-1 text-xs font-semibold text-[#1B2A4A] hover:bg-[#1B2A4A]/20"><Eye className="mr-1 inline h-3 w-3" />Lihat</button>
                      )}
                      {doc.verified ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Sudah</span>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => onVerifyDoc(doc.id, true, '')} className="rounded-lg bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-200">Setuju</button>
                          <button onClick={() => { const n = prompt('Catatan penolakan:'); if (n !== null) onVerifyDoc(doc.id, false, n); }} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">Tolak</button>
                        </div>
                      )}
                      {doc.note && <span className="text-xs text-red-600">{doc.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Status */}
          <div>
            <h3 className="mb-3 font-semibold text-[#1B2A4A]">Ubah Status</h3>
            <div className="flex flex-wrap gap-3">
              <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2.5 text-sm">
                {ppdbStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Catatan (opsional)" className="flex-1 rounded-lg border border-[#1B2A4A]/20 px-4 py-2.5 text-sm min-w-[200px]" />
              <button onClick={() => onUpdateStatus(data.registration?.id || data.id, status, note)} className="rounded-lg bg-[#1B2A4A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15203a]">Simpan</button>
            </div>
          </div>

          {/* Activity Log */}
          {data.activities && data.activities.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-[#1B2A4A]">Riwayat Aktivitas</h3>
              <div className="space-y-2">
                {data.activities.map((act: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 border-b border-[#1B2A4A]/5 pb-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C8A951]" />
                    <div>
                      <p className="font-semibold text-[#1B2A4A]">{act.action}</p>
                      {act.note && <p className="text-xs text-[#5B7088]">{act.note}</p>}
                      <p className="text-xs text-[#5B7088]/60">{new Date(act.created_at).toLocaleString('id-ID')} {act.admin_name ? `oleh ${act.admin_name}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
