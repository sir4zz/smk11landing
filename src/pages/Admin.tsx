import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Briefcase, Building2, CalendarDays, FileText, GraduationCap, LogOut, Mail, Menu, Pencil, Plus, Trophy, Trash2, Upload, Users, X, Save, ShieldCheck, UsersRound, Dumbbell, Newspaper, UserCog, Camera, UserRound } from 'lucide-react';
import logoSekolah from '../assets/logo.png';
import { news as initialNews } from '../data/news';
import { programs as initialPrograms } from '../data/programs';
import { facilities as initialFacilities } from '../data/facilities';
import { staffData as initialStaff } from '../data/staff';
import { achievements as initialAchievements } from '../data/achievements';
import { teacherActivities as initialTeacherActivities } from '../data/teacherActivities';
import { educationStaff as initialEducationStaff } from '../data/educationStaff';
import { defaultSpmbContent, type SpmbContent, type SpmbFaqItem, type SpmbFlowStep, type SpmbScheduleItem } from '../data/spmb';
import { backendApi, apiBaseUrl, resolveImageUrl } from '../lib/api';
import { LoadingInline } from '../components/ui/LoadingScreen';
import ImportModal from '../components/admin/ImportModal';
import ImageField from '../components/admin/ImageField';
import RolePermissions from '../components/admin/RolePermissions';
import OsisManagement from '../components/admin/OsisManagement';
import ExtracurricularManagement from '../components/admin/ExtracurricularManagement';
import KesemaptaanManagement from '../components/admin/KesemaptaanManagement';
import MadingManagement from '../components/admin/MadingManagement';
import GalleryManagement from '../components/admin/GalleryManagement';
import StudentsManagement from '../components/admin/StudentsManagement';
import AccountsManagement from '../components/admin/AccountsManagement';
import MyProfile from '../components/admin/MyProfile';
import { StaffAuthProvider, useStaffAuth } from '../lib/staffAuth';
import { can, STAFF_ROLES } from '../lib/permissions';

type Section = 'dashboard' | 'news' | 'programs' | 'facilities' | 'staff' | 'achievements' | 'teacherActivities' | 'educationStaff' | 'spmb' | 'contact' | 'permissions' | 'osis' | 'extracurriculars' | 'kesemaptaan' | 'mading' | 'students' | 'accounts' | 'gallery' | 'myProfile';
type EditableSection = Exclude<Section, 'dashboard' | 'contact' | 'spmb' | 'permissions' | 'osis' | 'extracurriculars' | 'kesemaptaan' | 'mading' | 'students' | 'accounts' | 'gallery' | 'myProfile'>;
type Item = Record<string, unknown>;
const ADMIN_SECTION_PATHS: Record<Section, string> = {
  dashboard: '/admin',
  myProfile: '/admin/profil',
  news: '/admin/berita',
  programs: '/admin/program-keahlian',
  facilities: '/admin/fasilitas',
  staff: '/admin/staf-guru',
  achievements: '/admin/prestasi',
  teacherActivities: '/admin/kegiatan-guru',
  educationStaff: '/admin/tenaga-kependidikan',
  spmb: '/admin/spmb',
  contact: '/admin/pesan-kontak',
  permissions: '/admin/role-permission',
  osis: '/admin/osis',
  extracurriculars: '/admin/ekstrakurikuler',
  kesemaptaan: '/admin/kesemaptaan',
  mading: '/admin/mading',
  students: '/admin/data-siswa',
  accounts: '/admin/akun',
  gallery: '/admin/galeri',
};
const sessionKey = 'smkn11-admin-session';
const TABLE_MAP: Record<string, string> = {
  news: 'news', programs: 'programs', facilities: 'facilities',
  staff: 'staff', achievements: 'achievements',
  teacherActivities: 'teacher_activities', educationStaff: 'education_staff',
};

const seed = {
  news: initialNews,
  programs: initialPrograms,
  facilities: initialFacilities,
  staff: initialStaff,
  achievements: initialAchievements,
  teacherActivities: initialTeacherActivities,
  educationStaff: initialEducationStaff,
  contact: [] as Item[],
};

const configs: Record<EditableSection, { title: string; icon: typeof FileText; fields: { key: string; label: string; type?: string; multiline?: boolean }[] }> = {
  news: { title: 'Berita', icon: FileText, fields: [{ key: 'title', label: 'Judul' }, { key: 'slug', label: 'Slug' }, { key: 'category', label: 'Kategori', type: 'select' }, { key: 'author', label: 'Penulis', type: 'select' }, { key: 'date', label: 'Tanggal', type: 'date' }, { key: 'excerpt', label: 'Ringkasan', multiline: true }, { key: 'content', label: 'Isi Berita', multiline: true }, { key: 'thumbnail', label: 'Gambar Sampul', type: 'image' }, { key: 'source_label', label: 'Jenis / Sumber', type: 'select' }, { key: 'source_note', label: 'Deskripsi Sumber', multiline: true }] },
  programs: { title: 'Program Keahlian', icon: BookOpen, fields: [{ key: 'name', label: 'Nama Program' }, { key: 'slug', label: 'Slug' }, { key: 'short_name', label: 'Singkatan' }, { key: 'short_description', label: 'Deskripsi Singkat', multiline: true }, { key: 'description', label: 'Deskripsi Lengkap', multiline: true }, { key: 'image', label: 'Gambar', type: 'image' }] },
  facilities: { title: 'Fasilitas', icon: Building2, fields: [{ key: 'name', label: 'Nama Fasilitas' }, { key: 'category', label: 'Kategori', type: 'select' }, { key: 'description', label: 'Deskripsi', multiline: true }, { key: 'photo', label: 'Foto', type: 'image' }] },
  staff: { title: 'Staf & Guru', icon: Users, fields: [{ key: 'name', label: 'Nama' }, { key: 'position', label: 'Jabatan', type: 'select' }, { key: 'department', label: 'Unit / Departemen', type: 'select' }, { key: 'photo', label: 'Foto', type: 'image' }, { key: 'description', label: 'Deskripsi Singkat', multiline: true }] },
  achievements: { title: 'Prestasi', icon: Trophy, fields: [{ key: 'title', label: 'Judul Prestasi' }, { key: 'event', label: 'Acara' }, { key: 'level', label: 'Tingkat', type: 'select' }, { key: 'rank', label: 'Peringkat', type: 'select' }, { key: 'year', label: 'Tahun', type: 'number' }, { key: 'photo', label: 'Foto', type: 'image' }] },
  teacherActivities: { title: 'Kegiatan Guru', icon: CalendarDays, fields: [{ key: 'title', label: 'Judul Kegiatan' }, { key: 'category', label: 'Kategori', type: 'select' }, { key: 'date', label: 'Tanggal', type: 'date' }, { key: 'photo', label: 'Foto', type: 'image' }, { key: 'description', label: 'Deskripsi', multiline: true }] },
  educationStaff: { title: 'Tenaga Kependidikan', icon: Briefcase, fields: [{ key: 'name', label: 'Nama' }, { key: 'position', label: 'Jabatan', type: 'select' }, { key: 'department', label: 'Unit / Departemen', type: 'select' }, { key: 'photo', label: 'Foto', type: 'image' }] },
};

const FIELD_OPTION_PRESETS: Record<string, string[]> = {
  category: ['Informasi', 'Kegiatan', 'Prestasi', 'Pengumuman', 'Akademik', 'Fasilitas Umum', 'Keagamaan', 'Pendukung'],
  author: ['Tim Humas', 'Admin', 'Pembina OSIS', 'Kesiswaan'],
  source_label: ['Berita mandiri', 'Diambil dari URL', 'Rilis resmi', 'Kerja sama media'],
  position: ['Kepala Sekolah', 'Wakil Kepala Sekolah', 'Kepala Tata Usaha', 'Guru', 'Staf Kesiswaan', 'Staf Humas', 'Laboran', 'Pustakawan', 'Operator Sekolah (Dapodik)'],
  department: ['Manajemen', 'Kurikulum', 'Kesiswaan', 'Humas', 'Sarana Prasarana', 'Tata Usaha', 'Perpustakaan', 'Laboratorium'],
  level: ['Kabupaten', 'Provinsi', 'Nasional', 'Internasional'],
  rank: ['Juara 1', 'Juara 2', 'Juara 3', 'Medali Emas', 'Medali Perak', 'Medali Perunggu', 'Harapan', 'Peserta', 'Partisipasi'],
};

function normalizeSpmbRow(row: Record<string, unknown>): SpmbContent {
  return {
    id: row.id as string | undefined,
    status: (row.status as SpmbContent['status']) || 'ditutup',
    title: String(row.title ?? defaultSpmbContent.title),
    description: String(row.description ?? ''),
    latest_info: String(row.latest_info ?? ''),
    requirements: Array.isArray(row.requirements) ? (row.requirements as string[]) : [],
    schedule: Array.isArray(row.schedule) ? (row.schedule as SpmbScheduleItem[]) : [],
    flow_steps: Array.isArray(row.flow_steps) ? (row.flow_steps as SpmbFlowStep[]) : [],
    faq: Array.isArray(row.faq) ? (row.faq as SpmbFaqItem[]) : [],
    portal_url: String(row.portal_url ?? defaultSpmbContent.portal_url),
    banner_image: String(row.banner_image ?? ''),
    banner_title: String(row.banner_title ?? ''),
    banner_description: String(row.banner_description ?? ''),
    updated_at: row.updated_at as string | undefined,
  };
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
    const identifier = String(form.get('identifier') ?? '').trim();
    const password = String(form.get('password') ?? '');

    try {
      const { data, error: signInError } = await backendApi.auth.signInWithPassword({ identifier, password });
      if (signInError) throw signInError;
      if (!data?.user) throw new Error('Sesi login tidak dapat dibuat.');

      const { data: profile } = await backendApi.database.from('profiles').select('role').eq('id', data.user.id).single();
      if (!profile?.role || !(STAFF_ROLES as readonly string[]).includes(profile.role)) {
        await backendApi.auth.signOut();
        throw new Error('Akun ini bukan akun admin, guru, atau OSIS.');
      }

      localStorage.setItem(sessionKey, 'true');
      if (data.must_change_password) {
        navigate('/admin/ubah-password');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await backendApi.auth.getCurrentUser();
      if (cancelled || !data?.user) return;
      const { data: profile } = await backendApi.database.from('profiles').select('role').eq('id', data.user.id).single();
      if (!cancelled && profile?.role && (STAFF_ROLES as readonly string[]).includes(profile.role)) {
        navigate(data.mustChangePassword ? '/admin/ubah-password' : '/admin', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#FAF6F0] grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#FAF6F0] p-2"><img src={logoSekolah} alt="Logo SMKN 11" className="h-full w-full object-contain" /></div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Login Panel SMKN 11</h1>
          <p className="mt-2 text-sm text-[#23314D]">Masuk menggunakan email (admin), NIP/NUPTK/ID Guru, atau ID Anggota OSIS.</p>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={submit}>
          <label className="mb-4 block text-sm font-semibold text-[#1B2A4A]">Email / NIP / ID Anggota<input name="identifier" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" placeholder="email@smkn11.sch.id, NIP, atau ID Anggota" /></label>
          <label className="mb-6 block text-sm font-semibold text-[#1B2A4A]">Kata sandi<input name="password" type="password" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" /></label>
          <button disabled={loading} className="w-full rounded-lg bg-[#1B2A4A] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Memeriksa...' : 'Masuk ke Panel'}</button>
        </form>
      </div>
    </main>
  );
}

export default function Admin() {
  return (
    <StaffAuthProvider>
      <AdminPanel />
    </StaffAuthProvider>
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<Record<string, Item[]>>(seed as unknown as Record<string, Item[]>);
  const [section, setSection] = useState<Section>('dashboard');
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { role, permissions, loading: authLoading, mustChangePassword } = useStaffAuth();
  const isAdmin = role === 'admin';
  const canViewOsis = isAdmin || can(permissions, 'osis.view');
  const canViewEkstra = isAdmin || can(permissions, 'extracurricular.view');
  const canViewKesemaptaan = isAdmin || can(permissions, 'kesemaptaan.view');
  const canViewMading = isAdmin || can(permissions, 'mading.view');
  const canViewStudents = isAdmin || can(permissions, 'mading.edit_all');
  const canViewGallery = isAdmin || can(permissions, 'gallery.view');

  useEffect(() => {
    const nextSection = (Object.entries(ADMIN_SECTION_PATHS).find(([, path]) => path === location.pathname)?.[0] ?? 'dashboard') as Section;
    setSection(nextSection);
    if (location.pathname !== ADMIN_SECTION_PATHS[nextSection]) {
      navigate(ADMIN_SECTION_PATHS.dashboard, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (mustChangePassword) navigate('/admin/ubah-password', { replace: true });
  }, [authLoading, mustChangePassword, navigate]);

  useEffect(() => {
    if (authLoading) return;
    backendApi.auth.getCurrentUser() .then(({ data }: any) => {
      if (!data || !data.user) {
        localStorage.removeItem(sessionKey);
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!isAdmin) return;
      Promise.all([
        backendApi.database.from(TABLE_MAP.news).select('*').then((r: any) => r.data || []),
        backendApi.database.from(TABLE_MAP.programs).select('*').then((r: any) => r.data || []),
        backendApi.database.from(TABLE_MAP.facilities).select('*').then((r: any) => r.data || []),
        backendApi.database.from(TABLE_MAP.staff).select('*').then((r: any) => r.data || []),
        backendApi.database.from(TABLE_MAP.achievements).select('*').then((r: any) => r.data || []),
        backendApi.database.from(TABLE_MAP.teacherActivities).select('*').then((r: any) => r.data || []),
        backendApi.database.from(TABLE_MAP.educationStaff).select('*').then((r: any) => r.data || []),
        backendApi.database.from('contact_messages').select('*').then((r: any) => r.data || []),
      ]).then(([news, programs, facilities, staff, achievements, teacherActivities, educationStaff, contact]) => setData({
        news, programs, facilities, staff, achievements, teacherActivities, educationStaff, contact,
      })).catch(() => {});
    })
  }, [authLoading, isAdmin, navigate]);

  const menu = (Object.keys(configs) as EditableSection[]);
  const total = useMemo(() => Object.values(data).reduce((sum, list) => sum + list.length, 0), [data]);
  const fieldOptions = useMemo(() => {
    if (!(section in configs)) return {};
    const config = configs[section as EditableSection];
    const opts: Record<string, string[]> = {};
    for (const field of config.fields) {
      if (field.type !== 'select') continue;
      const set = new Set<string>(FIELD_OPTION_PRESETS[field.key] ?? []);
      for (const row of data[section] ?? []) {
        const value = (row as Record<string, unknown>)[field.key];
        if (typeof value === 'string' && value.trim()) set.add(value.trim());
      }
      opts[field.key] = [...set];
    }
    return opts;
  }, [section, data]);

  if (authLoading) return <div className="min-h-screen bg-[#FAF6F0]"><LoadingInline /></div>;

  const update = async (next: Item) => {
    try {
      const normalizedNext = section === 'news'
        ? {
            ...next,
            source_type: next.source_type ?? (next.source_url ? 'imported' : 'manual'),
            source_label: String(next.source_label ?? (next.source_url ? 'Diambil dari URL' : 'Berita mandiri')),
            source_note: String(next.source_note ?? ''),
            source_url: String(next.source_url ?? ''),
          }
        : next;
      const { id: _id, ...dataToSave } = normalizedNext;
      let payload;
      if (editing) {
        const { error, data } = await backendApi.database.from(TABLE_MAP[section as EditableSection]).update(dataToSave).eq('id', editing.id).select().single();
        if (error) throw error;
        payload = data;
      } else {
        const { error, data } = await backendApi.database.from(TABLE_MAP[section as EditableSection]).insert([dataToSave]).select().single();
        if (error) throw error;
        payload = data;
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
      if (section === 'contact') {
        const { error } = await backendApi.database.from('contact_messages').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await backendApi.database.from(TABLE_MAP[section]).delete().eq('id', id);
        if (error) throw error;
      }
      setData(current => ({ ...current, [section]: current[section].filter(item => item.id !== id) }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  const markRead = async (id: unknown) => {
    await backendApi.database.from('contact_messages').update({ is_read: true }).eq('id', id);
    setData(current => ({
      ...current,
      contact: current.contact.map(item => item.id === id ? { ...item, is_read: true } : item),
    }));
  };

  const refresh = async (key: EditableSection) => {
    const { data } = await backendApi.database.from(TABLE_MAP[key]).select('*');
    if (data) setData(current => ({ ...current, [key]: data as Item[] }));
  };

  const active = section === 'dashboard' ? null : section === 'myProfile' ? { title: 'Profil Saya', icon: UserRound, fields: [] } : section === 'contact' ? { title: 'Pesan Kontak', icon: Mail, fields: [] } : section === 'spmb' ? { title: 'Kelola SPMB', icon: GraduationCap, fields: [] } : section === 'permissions' ? { title: 'Role & Permission', icon: ShieldCheck, fields: [] } : section === 'osis' ? { title: 'OSIS', icon: UsersRound, fields: [] } : section === 'extracurriculars' ? { title: 'Ekstrakurikuler', icon: Dumbbell, fields: [] } : section === 'kesemaptaan' ? { title: 'Kesemaptaan', icon: ShieldCheck, fields: [] } : section === 'mading' ? { title: 'Mading', icon: Newspaper, fields: [] } : section === 'students' ? { title: 'Data Siswa', icon: UserCog, fields: [] } : section === 'accounts' ? { title: 'Kelola Akun', icon: Users, fields: [] } : section === 'gallery' ? { title: 'Galeri', icon: Camera, fields: [] } : configs[section];
  const editableSections = section !== 'dashboard' && section !== 'myProfile' && section !== 'contact' && section !== 'spmb' && section !== 'permissions' && section !== 'osis' && section !== 'extracurriculars' && section !== 'kesemaptaan' && section !== 'mading' && section !== 'students' && section !== 'accounts' && section !== 'gallery';

  const navGroups: { label: string; items: { key: Section; label: string; icon: typeof FileText; visible: boolean }[] }[] = [
    { label: 'Menu', items: [{ key: 'dashboard', label: 'Dashboard', icon: BarChart3, visible: can(permissions, 'dashboard.view') }] },
    { label: 'Akun Saya', items: [{ key: 'myProfile', label: 'Profil Saya', icon: UserRound, visible: true }] },
    { label: 'Konten', items: menu.map((key) => ({ key: key as Section, label: configs[key].title, icon: configs[key].icon, visible: isAdmin })) },
    { label: 'Modul Sekolah', items: [
      { key: 'spmb', label: 'Kelola SPMB', icon: GraduationCap, visible: isAdmin },
      { key: 'osis', label: 'OSIS', icon: UsersRound, visible: canViewOsis },
      { key: 'extracurriculars', label: 'Ekstrakurikuler', icon: Dumbbell, visible: canViewEkstra },
      { key: 'kesemaptaan', label: 'Kesemaptaan', icon: ShieldCheck, visible: canViewKesemaptaan },
      { key: 'mading', label: 'Mading', icon: Newspaper, visible: canViewMading },
      { key: 'gallery', label: 'Galeri', icon: Camera, visible: canViewGallery },
      { key: 'students', label: 'Data Siswa', icon: UserCog, visible: canViewStudents },
    ]},
    { label: 'Sistem', items: [
      { key: 'contact', label: 'Pesan Kontak', icon: Mail, visible: isAdmin },
      { key: 'permissions', label: 'Role & Permission', icon: ShieldCheck, visible: isAdmin },
      { key: 'accounts', label: 'Kelola Akun', icon: Users, visible: isAdmin },
    ]},
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1B2A4A]">
      <aside className={`${mobile ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-[#1B2A4A] p-5 text-white transition-transform lg:translate-x-0`}>
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <span className="flex items-center gap-2 font-bold"><img src={logoSekolah} alt="Logo SMKN 11" className="h-7 w-auto" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} /> ADMIN SMKN 11</span>
          <button className="lg:hidden" onClick={() => setMobile(false)}><X /></button>
        </div>
<nav className="min-h-0 flex-1 overflow-y-auto">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-[#F3E8D0]/50">{group.label}</p>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <Nav key={item.key} label={item.label} icon={item.icon} active={section === item.key} onClick={() => { navigate(ADMIN_SECTION_PATHS[item.key]); setMobile(false); }} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <button onClick={async () => {
          await backendApi.auth.signOut();
          localStorage.removeItem(sessionKey);
          navigate('/admin/login');
        }} className="mt-4 -mx-5 flex shrink-0 items-center gap-2 border-t border-white/10 px-5 pt-3 text-sm text-[#F3E8D0]"><LogOut size={18} /> Keluar</button>
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

        <div className="mx-auto w-full max-w-6xl p-5 md:p-8">
          {section === 'dashboard' && <Dashboard data={data} total={total} />}

          {section === 'myProfile' && <MyProfile />}

          {section === 'contact' && (
            <ContactMessages items={data.contact} onMarkRead={markRead} onDelete={remove} />
          )}

          {section === 'spmb' && <SPMBManagement />}

          {section === 'permissions' && isAdmin && <RolePermissions />}

          {section === 'osis' && canViewOsis && <OsisManagement permissions={permissions} />}

          {section === 'extracurriculars' && canViewEkstra && <ExtracurricularManagement permissions={permissions} />}

          {section === 'kesemaptaan' && canViewKesemaptaan && <KesemaptaanManagement permissions={permissions} />}

          {section === 'mading' && canViewMading && <MadingManagement permissions={permissions} />}

          {section === 'gallery' && canViewGallery && <GalleryManagement />}

          {section === 'students' && canViewStudents && <StudentsManagement />}

          {section === 'accounts' && isAdmin && <AccountsManagement />}

          {editableSections && (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[#23314D]">Kelola data {active!.title.toLowerCase()}.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><Upload size={18} /> Import Excel/CSV</button>
                  <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Tambah</button>
                </div>
              </div>
              <Table items={data[section]} config={active!} onEdit={item => { setEditing(item); setOpen(true); }} onDelete={id => remove(id)} />
            </>
          )}

          {open && editableSections && (
            <Editor section={section} config={active!} item={editing} options={fieldOptions} onClose={() => setOpen(false)} onSave={async item => { const ok = await update(item); if (ok) setOpen(false); }} />
          )}

          {importOpen && editableSections && (
            <ImportModal
              config={active!}
              table={TABLE_MAP[section as EditableSection]}
              onClose={() => setImportOpen(false)}
              onImported={() => refresh(section as EditableSection)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Nav({ label, icon: Icon, active, onClick }: { label: string; icon: typeof FileText; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${active ? 'bg-[#C8A951] font-bold text-[#1B2A4A]' : 'text-[#F3E8D0] hover:bg-white/10'}`}><Icon size={18} />{label}</button>;
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
  const renderCell = (field: { key: string; label: string }, item: Item) => {
    if (field.key === 'photo' && item[field.key]) {
      return <img src={resolveImageUrl(String(item[field.key]))} alt="" className="h-10 w-10 rounded-full object-cover" />;
    }

    if (['image', 'thumbnail'].includes(field.key) && item[field.key]) {
      return <img src={resolveImageUrl(String(item[field.key]))} alt="" className="h-10 w-16 rounded object-cover" />;
    }

    if (field.key === 'source_label' && item.source_type === 'imported') {
      return (
        <div>
          <span className="inline-flex rounded-full bg-[#C8A951]/20 px-2.5 py-1 text-xs font-semibold text-[#866D2C]">{String(item[field.key] ?? 'Diambil dari URL')}</span>
          {item.source_note ? <p className="mt-1 text-xs text-[#5B7088]">{String(item.source_note)}</p> : null}
        </div>
      );
    }

    if (field.key === 'source_label') {
      return <span className="text-[#23314D]">{String(item[field.key] ?? 'Berita mandiri')}</span>;
    }

    return String(item[field.key] ?? '-');
  };

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
              {config.fields.map(field => (
                <td key={field.key} className="max-w-xs p-4">
                  {renderCell(field, item)}
                </td>
              ))}
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

/* Legacy PPDB applicant-management code is intentionally disabled. SPMB is an
   information portal and must not expose registration, document, or selection tools.

===== PPDB Management (New System) =====
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
      let query = backendApi.database.from('ppdb_registrations').select('*', { count: 'exact' });
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
        const { data: progs } = await backendApi.database.from(TABLE_MAP.programs).select('name');
        if (progs) setPrograms((progs as any[]).map((p: any) => p.name));
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await backendApi.database.from('ppdb_registrations').select('status');
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
    const { data: registration, error } = await backendApi.database.from('ppdb_registrations').select('*').eq('id', id).single();
      if (error) throw error;
      
    const { data: documents } = await backendApi.database.from('ppdb_documents').select('*').eq('application_id', id).order('created_at', { ascending: true });
    const { data: activities } = await backendApi.database.from('ppdb_activity_log').select('*').eq('application_id', id).order('created_at', { ascending: false });
      
      setDetail({ registration, documents: documents || [], activities: activities || [] });
    } catch {}
  };

  const updateStatus = async (id: string, status: string, note: string) => {
    const { error } = await backendApi.database.from('ppdb_registrations').update({ status, admin_note: note }).eq('id', id);
    if (!error) {
      await backendApi.database.from('ppdb_activity_log').insert([{ application_id: id, action: `Status diubah menjadi ${status}`, note }]);
      fetchList(); fetchStats(); setDetail(null);
    }
  };

  const verifyDoc = async (docId: string, verified: boolean, note: string) => {
    const { error } = await backendApi.database.from('ppdb_documents').update({ verified: verified ? 1 : 0, note }).eq('id', docId);
    if (!error) {
      if (detail) openDetail(detail.registration.id);
    }
  };

  return (
    <div>
      {/* Stats * /}
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

      {/* Filter & Search * /}
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
            const { data } = await backendApi.database.from('ppdb_registrations').select('*').order('created_at', { ascending: false });
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

      {/* Table * /}
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

      {/* Pagination * /}
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

      {/* Detail Modal * /}
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
          {/* Info * /}
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

          {/* Parent Data * /}
          <div>
            <h3 className="mb-3 font-semibold text-[#1B2A4A]">Data Orang Tua</h3>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-xs text-[#5B7088]">Ayah</span><p>{(data.registration?.father_name || data.father_name) || '-'} {(data.registration?.father_occupation || data.father_occupation) ? `(${data.registration?.father_occupation || data.father_occupation})` : ''}</p></div>
              <div><span className="text-xs text-[#5B7088]">Ibu</span><p>{(data.registration?.mother_name || data.mother_name) || '-'} {(data.registration?.mother_occupation || data.mother_occupation) ? `(${data.registration?.mother_occupation || data.mother_occupation})` : ''}</p></div>
              <div><span className="text-xs text-[#5B7088]">Wali</span><p>{data.registration?.guardian_name || data.guardian_name || '-'}</p></div>
              <div><span className="text-xs text-[#5B7088]">Alamat Orang Tua</span><p>{data.registration?.parent_address || data.parent_address || '-'}</p></div>
            </div>
          </div>

          {/* Previous School * /}
          <div>
            <h3 className="mb-3 font-semibold text-[#1B2A4A]">Sekolah Asal</h3>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-xs text-[#5B7088]">Sekolah</span><p>{data.registration?.previous_school || data.previous_school || '-'}</p></div>
              <div><span className="text-xs text-[#5B7088]">Tahun Lulus</span><p>{data.registration?.graduation_year || data.graduation_year || '-'}</p></div>
            </div>
          </div>

          {/* Documents * /}
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
                          const { data: urlData } = await backendApi.storage.from('ppdb_documents').createSignedUrl(doc.file_path, 3600);
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

          {/* Update Status * /}
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

          {/* Activity Log * /}
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

*/

function SPMBManagement() {
  const [content, setContent] = useState<SpmbContent>(defaultSpmbContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await backendApi.database.from('spmb_content').select('*').limit(1).maybeSingle();
      if (!error && data) setContent(normalizeSpmbRow(data as Record<string, unknown>));
      setLoading(false);
    };
    load();
  }, []);

  const update = <K extends keyof SpmbContent>(key: K, value: SpmbContent[K]) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const { data: { user } } = await backendApi.auth.getCurrentUser();
    if (!user) {
      setMessage('Sesi telah habis. Silakan login ulang.');
      setSaving(false);
      return;
    }
    const { id, ...payload } = content;
    try {
      let dbError;
      if (id) {
        const { error } = await backendApi.database.from('spmb_content').update(payload).eq('id', id);
        dbError = error;
      } else {
        const { error } = await backendApi.database.from('spmb_content').insert([payload]);
        dbError = error;
      }
      if (dbError) throw dbError;
      const { data: refreshed, error: refetchError } = await backendApi.database.from('spmb_content').select('*').limit(1).maybeSingle();
      if (refetchError) throw refetchError;
      if (!refreshed) throw new Error('Data tidak ditemukan setelah simpan.');
      setContent(normalizeSpmbRow(refreshed as Record<string, unknown>));
      setMessage('Informasi SPMB berhasil disimpan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan informasi SPMB.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingInline />;

  return (
    <form onSubmit={save} className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Pengaturan Portal SPMB</h2>
            <p className="mt-1 text-sm text-[#5B7088]">Semua informasi pada halaman publik diambil dari data ini.</p>
          </div>
          <label className="flex items-center gap-3 rounded-lg bg-[#FAF6F0] px-4 py-2 text-sm font-semibold">
            Status pendaftaran
            <select value={content.status} onChange={(event) => update('status', event.target.value as SpmbContent['status'])} className="rounded border border-[#1B2A4A]/20 bg-white px-2 py-1">
              <option value="dibuka">Dibuka</option>
              <option value="ditutup">Ditutup</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul" value={content.title} onChange={(value) => update('title', value)} />
          <Field label="Link pendaftaran resmi" type="url" value={content.portal_url} onChange={(value) => update('portal_url', value)} />
          <Field label="Deskripsi" multiline value={content.description} onChange={(value) => update('description', value)} />
          <Field label="Informasi pendaftaran terbaru" multiline value={content.latest_info} onChange={(value) => update('latest_info', value)} />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Banner SPMB</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="URL gambar banner" type="url" value={content.banner_image} onChange={(value) => update('banner_image', value)} />
          <Field label="Judul banner" value={content.banner_title} onChange={(value) => update('banner_title', value)} />
          <div className="md:col-span-2"><Field label="Deskripsi banner" multiline value={content.banner_description} onChange={(value) => update('banner_description', value)} /></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListField label="Persyaratan" hint="Satu persyaratan per baris." value={content.requirements.join('\n')} onChange={(value) => update('requirements', lines(value))} />
        <ListField label="Jadwal" hint="Satu baris: kategori | tanggal | judul. Kategori: pendaftaran, seleksi, pengumuman, daftar_ulang." value={content.schedule.map((item) => `${item.category} | ${item.date} | ${item.title}`).join('\n')} onChange={(value) => update('schedule', lines(value).map((line) => { const [category = 'pendaftaran', date = '', title = ''] = line.split('|').map((part) => part.trim()); return { category: ['pendaftaran', 'seleksi', 'pengumuman', 'daftar_ulang'].includes(category) ? category as SpmbScheduleItem['category'] : 'pendaftaran', date, title }; }))} />
        <ListField label="Alur pendaftaran" hint="Satu baris: judul | deskripsi." value={content.flow_steps.map((item) => `${item.title} | ${item.description}`).join('\n')} onChange={(value) => update('flow_steps', lines(value).map((line) => { const [title = '', ...description] = line.split('|'); return { title: title.trim(), description: description.join('|').trim() }; }))} />
        <ListField label="FAQ" hint="Satu baris: pertanyaan | jawaban." value={content.faq.map((item) => `${item.question} | ${item.answer}`).join('\n')} onChange={(value) => update('faq', lines(value).map((line) => { const [question = '', ...answer] = line.split('|'); return { question: question.trim(), answer: answer.join('|').trim() }; }))} />
      </div>

      {message && <p className={`rounded-lg p-3 text-sm ${message.startsWith('Informasi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</p>}
      <div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan SPMB'}</button></div>
    </form>
  );
}

function lines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function Field({ label, value, onChange, multiline = false, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string }) {
  const className = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';
  return <label className="block text-sm font-semibold">{label}{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className={className} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function ListField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
  return <label className="block rounded-xl bg-white p-6 text-sm font-semibold shadow-sm">{label}<span className="mt-1 block font-normal text-[#5B7088]">{hint}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={8} className="mt-3 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" /></label>;
}

function slugify(value: string) {
  return value.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const READER_FALLBACKS: { name: string; build: (url: string) => { url: string; init?: RequestInit } }[] = [
  {
    name: 'Proxy Lokal',
    build: (url) => ({
      url: `${apiBaseUrl}/admin/proxy/fetch?url=${encodeURIComponent(url)}`,
      init: { credentials: 'include' },
    }),
  },
  { name: 'CORSProxy', build: (url) => ({ url: `https://corsproxy.io/?url=${encodeURIComponent(url)}` }) },
];

async function fetchPageText(url: string, timeoutMs = 25000): Promise<string> {
  const errors: string[] = [];
  for (const fallback of READER_FALLBACKS) {
    const { url: fetchUrl, init } = fallback.build(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(fetchUrl, { ...init, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      let raw = text;
      if (text.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) throw new Error(parsed.error.message ?? 'Gagal');
          if (typeof parsed?.data?.text === 'string') raw = parsed.data.text;
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      }
      if (!raw || !raw.trim()) throw new Error('respon kosong');
      return raw;
    } catch (error) {
      errors.push(`${fallback.name}: ${error instanceof Error ? error.message : 'gagal'}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Gagal mengambil halaman melalui semua layanan (${errors.join(' | ')})`);
}

function looksLikeHtml(text: string): boolean {
  const head = text.trim().toLowerCase().slice(0, 4000);
  return /^(<!doctype html|<html|<head|<body)/.test(head)
    || head.includes('<meta')
    || head.includes('<article')
    || head.includes('<div');
}

function stripMarkdownInline(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)\s]+(?:[^)]*)?\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+(?:[^)]*)?\)/g, '$1')
    .replace(/\[\]\([^)]*\)/g, '')
    .replace(/[*_~`#]/g, '')
    .trim();
}

function isJunkParagraph(value: string): boolean {
  return value.length < 20
    || /^(image|gambar|foto|menu|login|beranda|kategori)\b/i.test(value)
    || /^[A-Za-z ]+:\s*$/.test(value)
    || /\((foto|dok|dok\.|istimewa)[^)]*\)\s*$/i.test(value)
    || /^[A-Z][\w\u00C0-\u024F .'-]+\s-\s[A-Za-z\u00C0-\u024F]+$/.test(value)
    || /^\w+, \d{1,2} \w+ \d{4} \d{2}:\d{2} \w{3}$/.test(value);
}

function isBadImageUrl(value: string): boolean {
  return /favicon|logo|icon|sprite|avatar|framebar|emblem|blank/i.test(value);
}

function parseMarkdownNews(text: string, pageUrl: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const hasContentMarker = /^Markdown Content:\s*$/im.test(text);

  let title = '';
  const titleHeading = lines.find((line) => /^#{1,4}\s+\S/.test(line));
  if (titleHeading) title = titleHeading.replace(/^#+\s*/, '');
  if (!title) {
    const titleMeta = lines.find((line) => /^Title:\s*/i.test(line));
    if (titleMeta) title = titleMeta.replace(/^Title:\s*/i, '');
  }
  if (!title) {
    const firstMeaningful = lines.find((line) => line
      && !/^#{1,4}\s/.test(line)
      && !/^(https?:)?\/\//i.test(line)
      && !line.startsWith('![')
      && !/^[A-Za-z ]+:\s*$/i.test(line)
      && line.length <= 250);
    if (firstMeaningful) title = firstMeaningful;
  }
  title = stripMarkdownInline(title) || 'Judul berita';

  let thumbnail = '';
  let excerpt = '';
  const paragraphs: string[] = [];
  let buffer = '';
  let inContent = !hasContentMarker;
  const push = () => {
    const trimmed = buffer.replace(/\s+/g, ' ').trim();
    if (trimmed && !isJunkParagraph(trimmed)) paragraphs.push(trimmed);
    buffer = '';
  };

  for (const line of lines) {
    if (!inContent) {
      if (/^Markdown Content:\s*$/i.test(line)) inContent = true;
      continue;
    }
    if (!line || line === '---') { push(); continue; }
    if (/^Title:\s*/i.test(line) || /^URL Source:\s*/i.test(line)) continue;
    if (/^```/.test(line)) continue;
    if (!thumbnail) {
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)\s]+)/);
      if (imageMatch && imageMatch[2] && !isBadImageUrl(imageMatch[2])) {
        try { thumbnail = new URL(imageMatch[2], pageUrl).toString(); } catch { thumbnail = imageMatch[2]; }
      }
    }
    const cleaned = stripMarkdownInline(line);
    if (!cleaned) { push(); continue; }
    if (cleaned === title) continue;
    if (!excerpt && cleaned.length > 60 && !isJunkParagraph(cleaned)) excerpt = cleaned;
    buffer = buffer ? `${buffer} ${cleaned}` : cleaned;
  }
  push();

  if (!excerpt) excerpt = paragraphs.find((paragraph) => paragraph.length > 80) ?? paragraphs[0] ?? '';
  const content = paragraphs.length > 0
    ? paragraphs.slice(0, 20).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
    : `<p>${escapeHtml(text.replace(/\s+/g, ' ').slice(0, 2000) || 'Konten berita tidak tersedia.')}</p>`;

  return {
    title,
    slug: slugify(title),
    excerpt,
    thumbnail,
    author: '',
    content,
    category: 'Informasi',
  };
}

function parseHtmlNews(html: string, pageUrl: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('meta[property="og:title"], meta[name="twitter:title"], meta[itemprop="headline"]')?.getAttribute('content')
    || doc.querySelector('h1')?.textContent?.trim()
    || doc.querySelector('title')?.textContent?.trim()
    || 'Judul berita';

  const description = doc.querySelector('meta[name="description"], meta[property="og:description"]')?.getAttribute('content')?.trim()
    || doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content')?.trim()
    || '';

  const image = doc.querySelector('meta[property="og:image"], meta[name="twitter:image"]')?.getAttribute('content')?.trim();
  const author = doc.querySelector('meta[name="author"], meta[property="article:author"]')?.getAttribute('content')?.trim() || '';

  const contentRoot = doc.querySelector('article, main, .article-content, .entry-content, .post-content, .content, .news-content') ?? doc.body;
  const paragraphs = Array.from(contentRoot.querySelectorAll('p, li, h1, h2, h3'))
    .map((node) => node.textContent?.trim())
    .filter((value): value is string => Boolean(value) && value.length > 20)
    .slice(0, 20);

  const content = paragraphs.length > 0
    ? paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
    : `<p>${escapeHtml(doc.body.textContent?.trim() || 'Konten berita tidak tersedia.')}</p>`;

  return {
    title,
    slug: slugify(title),
    excerpt: description,
    thumbnail: image ? new URL(image, pageUrl).toString() : '',
    author,
    content,
    category: doc.querySelector('meta[property="article:section"]')?.getAttribute('content')?.trim() || 'Informasi',
  };
}

function extractNewsData(raw: string, pageUrl: string) {
  if (looksLikeHtml(raw)) return parseHtmlNews(raw, pageUrl);
  return parseMarkdownNews(raw, pageUrl);
}

function Editor({ config, item, onClose, onSave, section, options }: { config: { title: string; fields: { key: string; label: string; type?: string; multiline?: boolean }[] }; item: Item | null; onClose: () => void; onSave: (item: Item) => void; section?: string; options?: Record<string, string[]> }) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceMeta, setSourceMeta] = useState({ sourceType: 'manual' as 'manual' | 'imported', sourceUrl: '', sourceLabel: 'Berita mandiri', sourceNote: '' });
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({});
  const imageFields = useMemo(() => config.fields.filter(field => field.type === 'image'), [config]);
  const [imageValues, setImageValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const field of imageFields) init[field.key] = String(item?.[field.key] ?? '');
    setImageValues(init);
  }, [item, imageFields]);

  useEffect(() => {
    if (section !== 'news') return;

    const currentItem = item as Record<string, unknown> | null;
    const existingSourceUrl = typeof currentItem?.source_url === 'string' ? currentItem.source_url : '';
    const existingSourceType = currentItem?.source_type === 'imported' || existingSourceUrl ? 'imported' : 'manual';
    const existingSourceLabel = typeof currentItem?.source_label === 'string' && currentItem.source_label ? String(currentItem.source_label) : (existingSourceUrl ? 'Diambil dari URL' : 'Berita mandiri');
    const existingSourceNote = typeof currentItem?.source_note === 'string' ? String(currentItem.source_note) : '';

    setSourceUrl(existingSourceUrl);
    setSourceMeta({
      sourceType: existingSourceType,
      sourceUrl: existingSourceUrl,
      sourceLabel: existingSourceLabel,
      sourceNote: existingSourceNote,
    });
  }, [item, section]);

  const applyFieldValue = (key: string, value: string) => {
    if (imageFields.some(field => field.key === key)) {
      setImageValues(current => ({ ...current, [key]: value }));
      return;
    }
    const field = fieldRefs.current[key];
    if (!field) return;
    if (field instanceof HTMLSelectElement) {
      if (!Array.from(field.options).some(option => option.value === value)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        field.add(option);
      }
      field.value = value;
      return;
    }
    field.value = value;
  };

  const importFromUrl = async () => {
    const value = sourceUrl.trim();
    if (!value) {
      setFetchMessage('Masukkan URL berita terlebih dahulu.');
      return;
    }

    setFetching(true);
    setFetchMessage('');

    try {
      const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      const raw = await fetchPageText(normalized);
      const data = extractNewsData(raw, normalized);

      applyFieldValue('title', data.title);
      applyFieldValue('slug', data.slug);
      applyFieldValue('excerpt', data.excerpt);
      applyFieldValue('content', data.content);
      applyFieldValue('thumbnail', data.thumbnail);
      applyFieldValue('author', data.author || 'Tim Humas');
      applyFieldValue('category', data.category);
      applyFieldValue('source_label', 'Diambil dari URL');
      applyFieldValue('source_note', `Diambil dari ${normalized}`);
      setSourceUrl(normalized);
      setSourceMeta({
        sourceType: 'imported',
        sourceUrl: normalized,
        sourceLabel: 'Diambil dari URL',
        sourceNote: `Diambil dari ${normalized}`,
      });
      setFetchMessage('Berhasil mengambil data berita dari URL.');
    } catch (error) {
      setFetchMessage(error instanceof Error ? error.message : 'Gagal mengambil data berita.');
    } finally {
      setFetching(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formValues = Object.fromEntries(form as any) as Record<string, string>;

    if (section === 'news') {
      const sourceUrlValue = sourceMeta.sourceUrl || String((item as Record<string, unknown> | null)?.source_url ?? '');
      const sourceTypeValue = sourceUrlValue ? 'imported' : 'manual';
      const sourceLabelValue = formValues.source_label || sourceMeta.sourceLabel || (sourceUrlValue ? 'Diambil dari URL' : 'Berita mandiri');
      const sourceNoteValue = formValues.source_note || sourceMeta.sourceNote || '';

      onSave({
        ...(item ?? {}),
        ...formValues,
        source_type: sourceTypeValue,
        source_label: sourceLabelValue,
        source_note: sourceNoteValue,
        source_url: sourceUrlValue,
      });
      return;
    }

    onSave({ ...(item ?? {}), ...formValues });
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold">{item ? 'Ubah' : 'Tambah'} {config.title}</h2>
          <button type="button" onClick={onClose}><X /></button>
        </div>

        {section === 'news' && (
          <div className="mb-4 rounded-lg border border-[#1B2A4A]/10 bg-[#FAF6F0] p-4">
            <label className="block text-sm font-semibold text-[#1B2A4A]">
              Ambil berita dari URL
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://contoh.com/berita"
                  className="w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal"
                />
                <button type="button" onClick={importFromUrl} disabled={fetching} className="rounded-lg bg-[#1B2A4A] px-4 py-2 font-semibold text-white disabled:opacity-60">
                  {fetching ? 'Mengambil...' : 'Ambil data'}
                </button>
              </div>
            </label>
            {fetchMessage && <p className={`mt-2 text-sm ${fetchMessage.startsWith('Berhasil') ? 'text-green-700' : 'text-red-700'}`}>{fetchMessage}</p>}
          </div>
        )}

        <div className="space-y-4">
          {config.fields.map(field => (
            field.type === 'image'
              ? <div key={field.key}>
                  <ImageField label={field.label} value={imageValues[field.key] ?? ''} onChange={(url) => setImageValues(current => ({ ...current, [field.key]: url }))} />
                  <input type="hidden" name={field.key} value={imageValues[field.key] ?? ''} />
                </div>
              : <label key={field.key} className="block text-sm font-semibold">
              {field.label}
              {field.multiline
                ? <textarea ref={(element) => { fieldRefs.current[field.key] = element; }} name={field.key} rows={4} defaultValue={String(item?.[field.key] ?? '')} required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
                : field.type === 'select'
                  ? (() => {
                      const currentValue = String(item?.[field.key] ?? '');
                      const choices = [...new Set([...(options?.[field.key] ?? []), ...(currentValue ? [currentValue] : [])])];
                      if (choices.length === 0) {
                        return <input ref={(element) => { fieldRefs.current[field.key] = element; }} name={field.key} type="text" defaultValue={currentValue} required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />;
                      }
                      return (
                        <select ref={(element) => { fieldRefs.current[field.key] = element; }} name={field.key} defaultValue={currentValue} required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-normal">
                          <option value="">— Pilih —</option>
                          {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
                        </select>
                      );
                    })()
                  : <input ref={(element) => { fieldRefs.current[field.key] = element; }} name={field.key} type={field.type || 'text'} defaultValue={String(item?.[field.key] ?? '')} required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />}
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
