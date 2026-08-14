import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Plus, Pencil, Trash2, X, Save, Loader2, Search, ChevronLeft, ChevronRight,
  GraduationCap, BarChart3, ClipboardCheck, FileText, Download, Users,
  Briefcase, BookOpen, Store, Clock, CheckCircle,
} from 'lucide-react';
import {
  kelulusanAdminApi,
  apiBaseUrl,
  ALUMNI_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  type AlumniGraduationRow,
  type AlumniGraduationStats,
  type AlumniStatus,
  type VerificationStatus,
  type JobListMeta,
} from '../../lib/api';
import { can } from '../../lib/permissions';
import { fetchPublicContent } from '../../lib/api';

interface Props {
  permissions: string[];
  isAdmin: boolean;
}

const PAGE_SIZE = 10;
const inputClass = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';

const statusStyles: Record<string, string> = {
  bekerja: 'bg-green-50 text-green-700',
  kuliah: 'bg-blue-50 text-blue-700',
  wirausaha: 'bg-purple-50 text-purple-700',
  belum_bekerja: 'bg-amber-50 text-amber-700',
};

const verificationStyles: Record<string, string> = {
  menunggu: 'bg-[#C8A951]/20 text-[#866D2C]',
  terverifikasi: 'bg-green-50 text-green-700',
  ditolak: 'bg-red-50 text-red-700',
};

export default function KelulusanSiswaManagement({ permissions, isAdmin }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'data' | 'rekap'>('dashboard');

  const tabs = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { key: 'data' as const, label: 'Data Kelulusan', icon: Users },
    { key: 'rekap' as const, label: 'Rekapitulasi', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-[#1B2A4A] text-[#FAF6F0]' : 'text-[#23314D] hover:bg-[#FAF6F0]'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'data' && <DataTab permissions={permissions} isAdmin={isAdmin} />}
      {tab === 'rekap' && <RekapTab />}
    </div>
  );
}

// ==========================================================================
// TAB: DASHBOARD
// ==========================================================================

function DashboardTab() {
  const [stats, setStats] = useState<AlumniGraduationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [majorFilter, setMajorFilter] = useState('');
  const [programs, setPrograms] = useState<{ name: string; shortName: string }[]>([]);

  useEffect(() => {
    fetchPublicContent<{ name: string; shortName: string }[]>('programs')
      .then((rows) => setPrograms(rows.filter((r) => r.shortName)))
      .catch(() => {});
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const { data } = await kelulusanAdminApi.stats({
      graduation_year: yearFilter || undefined,
      major: majorFilter || undefined,
    });
    if (data) setStats(data);
    setLoading(false);
  }, [yearFilter, majorFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  if (!stats) return <p className="text-[#5B7088]">Gagal memuat data statistik.</p>;

  const cards = [
    { label: 'Total Lulusan', value: stats.total, icon: GraduationCap, color: 'text-[#1B2A4A]' },
    { label: 'Data Terisi', value: stats.filled, icon: ClipboardCheck, color: 'text-[#866D2C]' },
    { label: 'Bekerja', value: stats.bekerja, icon: Briefcase, color: 'text-green-600' },
    { label: 'Kuliah', value: stats.kuliah, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Wirausaha', value: stats.wirausaha, icon: Store, color: 'text-purple-600' },
    { label: 'Belum Bekerja', value: stats.belum_bekerja, icon: Clock, color: 'text-amber-600' },
    { label: 'Keterserapan', value: `${stats.keterserapan}%`, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Rata-rata Masa Tunggu', value: `${stats.avg_wait_time} bln`, icon: Clock, color: 'text-[#866D2C]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : '')} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Tahun</option>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={majorFilter} onChange={(e) => setMajorFilter(e.target.value)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Jurusan</option>
          {programs.map((p) => <option key={p.shortName} value={p.shortName}>{p.shortName}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
              <Icon className={`mb-4 ${card.color}`} size={24} />
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm text-[#5B7088]">{card.label}</p>
            </div>
          );
        })}
      </div>

      {stats.by_year.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Statistik per Tahun Lulus</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-3">Tahun</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Bekerja</th>
                  <th className="p-3">Kuliah</th>
                  <th className="p-3">Wirausaha</th>
                  <th className="p-3">Belum Bekerja</th>
                  <th className="p-3">Keterserapan</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_year.map((row) => (
                  <tr key={row.year} className="border-t border-[#1B2A4A]/10">
                    <td className="p-3 font-semibold">{row.year}</td>
                    <td className="p-3">{row.total}</td>
                    <td className="p-3 text-green-600">{row.bekerja}</td>
                    <td className="p-3 text-blue-600">{row.kuliah}</td>
                    <td className="p-3 text-purple-600">{row.wirausaha}</td>
                    <td className="p-3 text-amber-600">{row.belum_bekerja}</td>
                    <td className="p-3 font-semibold">{row.keterserapan}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.by_major.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Statistik per Jurusan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-3">Jurusan</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Bekerja</th>
                  <th className="p-3">Kuliah</th>
                  <th className="p-3">Wirausaha</th>
                  <th className="p-3">Belum Bekerja</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_major.map((row) => (
                  <tr key={row.major} className="border-t border-[#1B2A4A]/10">
                    <td className="p-3 font-semibold">{row.major}</td>
                    <td className="p-3">{row.total}</td>
                    <td className="p-3 text-green-600">{row.bekerja}</td>
                    <td className="p-3 text-blue-600">{row.kuliah}</td>
                    <td className="p-3 text-purple-600">{row.wirausaha}</td>
                    <td className="p-3 text-amber-600">{row.belum_bekerja}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// TAB: DATA KELULUSAN
// ==========================================================================

function DataTab({ permissions, isAdmin: _isAdmin }: { permissions: string[]; isAdmin: boolean }) {
  const [rows, setRows] = useState<AlumniGraduationRow[]>([]);
  const [meta, setMeta] = useState<JobListMeta>({ total: 0, page: 1, limit: PAGE_SIZE, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [majorFilter, setMajorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifyFilter, setVerifyFilter] = useState('');
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AlumniGraduationRow | null>(null);
  const [detail, setDetail] = useState<AlumniGraduationRow | null>(null);
  const [verifyModal, setVerifyModal] = useState<AlumniGraduationRow | null>(null);

  const [programs, setPrograms] = useState<{ name: string; shortName: string }[]>([]);

  useEffect(() => {
    fetchPublicContent<{ name: string; shortName: string }[]>('programs')
      .then((rows) => setPrograms(rows.filter((r) => r.shortName)))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const { data, error, meta: m } = await kelulusanAdminApi.list({
      search: search || undefined,
      graduation_year: yearFilter || undefined,
      major: majorFilter || undefined,
      status: statusFilter || undefined,
      verification_status: verifyFilter || undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (!error && data) {
      setRows(data);
      setMeta((m as JobListMeta) ?? { total: 0, page: 1, limit: PAGE_SIZE, last_page: 1 });
    } else if (error) {
      setMsg({ type: 'err', text: (error as { message?: string }).message ?? 'Gagal memuat data.' });
    }
    setLoading(false);
  }, [search, yearFilter, majorFilter, statusFilter, verifyFilter, page]);

  useEffect(() => {
    const delay = window.setTimeout(() => {
      setLoading(true);
      void load();
    }, 300);
    return () => window.clearTimeout(delay);
  }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const totalPages = Math.max(meta.last_page, 1);

  const save = async (record: Partial<AlumniGraduationRow>) => {
    const payload: Record<string, unknown> = { ...record };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    let r;
    if (editing?.id) {
      r = await kelulusanAdminApi.update(editing.id, payload);
    } else {
      r = await kelulusanAdminApi.create(payload);
    }
    if (r.error) {
      const message = (r.error as { message?: string }).message ?? 'Terjadi kesalahan.';
      flash('err', message);
      return false;
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus data kelulusan ini?')) return;
    const r = await kelulusanAdminApi.remove(id);
    if (r.error) { flash('err', (r.error as { message?: string }).message ?? 'Gagal menghapus.'); return; }
    await load();
    flash('ok', 'Data kelulusan dihapus.');
  };

  if (loading && rows.length === 0) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Kelola data kelulusan siswa/alumni.</p>
        <div className="flex flex-wrap gap-2">
          {can(permissions, 'job.create') && (
            <button
              onClick={() => { setEditing(null); setOpen(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"
            >
              <Plus size={18} /> Tambah Data
            </button>
          )}
          <button
            onClick={async () => {
              const q = new URLSearchParams();
              if (yearFilter) q.set('graduation_year', String(yearFilter));
              if (majorFilter) q.set('major', majorFilter);
              if (statusFilter) q.set('status', statusFilter);
              const suffix = q.size ? `?${q}` : '';
              const res = await fetch(`${apiBaseUrl}/admin/kelulusan/export${suffix}`, { credentials: 'include' });
              if (!res.ok) { flash('err', 'Gagal export data.'); return; }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'kelulusan-siswa.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama / NISN..."
            className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Tahun</option>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={majorFilter} onChange={(e) => { setMajorFilter(e.target.value); setPage(1); }} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Jurusan</option>
          {programs.map((p) => <option key={p.shortName} value={p.shortName}>{p.shortName}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Status</option>
          {Object.entries(ALUMNI_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={verifyFilter} onChange={(e) => { setVerifyFilter(e.target.value); setPage(1); }} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Verifikasi</option>
          {Object.entries(VERIFICATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">NISN</th>
              <th className="p-4">Jurusan</th>
              <th className="p-4">Tahun Lulus</th>
              <th className="p-4">Status</th>
              <th className="p-4">Verifikasi</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-[#5B7088]">Tidak ada data kelulusan.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#1B2A4A]/10">
                <td className="p-4 font-semibold">{row.name || '-'}</td>
                <td className="p-4">{row.nisn || '-'}</td>
                <td className="p-4">{row.major || '-'}</td>
                <td className="p-4">{row.graduation_year || '-'}</td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[row.status]}`}>{ALUMNI_STATUS_LABELS[row.status] ?? row.status}</span></td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${verificationStyles[row.verification_status]}`}>{VERIFICATION_STATUS_LABELS[row.verification_status] ?? row.verification_status}</span></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDetail(row)} className="text-[#866D2C] hover:text-[#C8A951]" title="Detail"><FileText size={16} /></button>
                    {can(permissions, 'job.edit') && (
                      <button onClick={() => { setEditing(row); setOpen(true); }} className="text-[#866D2C]" title="Edit"><Pencil size={16} /></button>
                    )}
                    {can(permissions, 'job.edit') && (
                      <button onClick={() => setVerifyModal(row)} className="text-blue-600" title="Verifikasi"><ClipboardCheck size={16} /></button>
                    )}
                    {can(permissions, 'job.delete') && (
                      <button onClick={() => remove(row.id)} className="text-red-600" title="Hapus"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1B2A4A] disabled:opacity-40 hover:bg-[#FAF6F0]"
          >
            <ChevronLeft className="h-4 w-4" /> Sebelumnya
          </button>
          <span className="px-4 text-sm font-medium text-[#23314D]">Halaman {meta.page} dari {totalPages} · {meta.total} data</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1B2A4A] disabled:opacity-40 hover:bg-[#FAF6F0]"
          >
            Berikutnya <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {open && (
        <AlumniForm
          item={editing}
          programs={programs}
          onClose={() => setOpen(false)}
          onSave={async (record) => {
            const ok = await save({ ...record, id: editing?.id });
            if (ok) { setOpen(false); setPage(1); await load(); flash('ok', 'Data kelulusan disimpan.'); }
          }}
        />
      )}

      {detail && (
        <AlumniDetailModal item={detail} onClose={() => setDetail(null)} />
      )}

      {verifyModal && (
        <VerifyModal
          item={verifyModal}
          onClose={() => setVerifyModal(null)}
          onVerify={async (status, note) => {
            const r = await kelulusanAdminApi.verify(verifyModal.id, { verification_status: status, verification_note: note });
            if (r.error) {
              flash('err', (r.error as { message?: string }).message ?? 'Gagal memverifikasi.');
            } else {
              flash('ok', 'Verifikasi diperbarui.');
              setVerifyModal(null);
              await load();
            }
          }}
        />
      )}
    </div>
  );
}

// ==========================================================================
// ALUMNI FORM (Add/Edit)
// ==========================================================================

function AlumniForm({ item, programs, onClose, onSave }: {
  item: AlumniGraduationRow | null;
  programs: { name: string; shortName: string }[];
  onClose: () => void;
  onSave: (r: Partial<AlumniGraduationRow>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    name: item?.name ?? '',
    nisn: item?.nisn ?? '',
    major: item?.major ?? '',
    graduation_year: item?.graduation_year ? String(item.graduation_year) : '',
    phone: item?.phone ?? '',
    email: item?.email ?? '',
    domicile: item?.domicile ?? '',
    status: item?.status ?? 'belum_bekerja',
  });

  const [detail, setDetail] = useState<Record<string, string>>({
    // Bekerja
    company_name: (item?.status_detail as Record<string, string>)?.company_name ?? '',
    position: (item?.status_detail as Record<string, string>)?.position ?? '',
    job_field: (item?.status_detail as Record<string, string>)?.job_field ?? '',
    job_location: (item?.status_detail as Record<string, string>)?.job_location ?? '',
    start_year: (item?.status_detail as Record<string, string>)?.start_year ?? '',
    wait_time_months: (item?.status_detail as Record<string, string>)?.wait_time_months ?? '',
    job_matches_major: (item?.status_detail as Record<string, string>)?.job_matches_major === 'true' ? 'true' : 'false',
    // Kuliah
    university_name: (item?.status_detail as Record<string, string>)?.university_name ?? '',
    study_program: (item?.status_detail as Record<string, string>)?.study_program ?? '',
    education_level: (item?.status_detail as Record<string, string>)?.education_level ?? '',
    entry_year: (item?.status_detail as Record<string, string>)?.entry_year ?? '',
    // Wirausaha
    business_name: (item?.status_detail as Record<string, string>)?.business_name ?? '',
    business_field: (item?.status_detail as Record<string, string>)?.business_field ?? '',
    business_location: (item?.status_detail as Record<string, string>)?.business_location ?? '',
    business_start_year: (item?.status_detail as Record<string, string>)?.business_start_year ?? '',
    // Belum bekerja
    current_status: (item?.status_detail as Record<string, string>)?.current_status ?? '',
    reason: (item?.status_detail as Record<string, string>)?.reason ?? '',
  });

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const setDetailField = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDetailValues((v) => ({ ...v, [key]: e.target.value }));

  const setDetailValues = (fn: (v: Record<string, string>) => Record<string, string>) => {
    setDetail(fn);
  };

  const status = values.status as AlumniStatus;

  const buildStatusDetail = (): Record<string, unknown> => {
    if (status === 'bekerja') {
      return {
        company_name: detail.company_name,
        position: detail.position,
        job_field: detail.job_field,
        job_location: detail.job_location,
        start_year: detail.start_year,
        wait_time_months: detail.wait_time_months,
        job_matches_major: detail.job_matches_major,
      };
    }
    if (status === 'kuliah') {
      return {
        university_name: detail.university_name,
        study_program: detail.study_program,
        education_level: detail.education_level,
        entry_year: detail.entry_year,
      };
    }
    if (status === 'wirausaha') {
      return {
        business_name: detail.business_name,
        business_field: detail.business_field,
        business_location: detail.business_location,
        business_start_year: detail.business_start_year,
      };
    }
    return {
      current_status: detail.current_status,
      reason: detail.reason,
    };
  };

  const submit = () => {
    if (!values.name.trim() || !values.nisn.trim()) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }
    onSave({
      ...values,
      graduation_year: Number(values.graduation_year) || 0,
      status: values.status as AlumniStatus,
      status_detail: buildStatusDetail(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{item ? 'Edit' : 'Tambah'} Data Kelulusan</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto space-y-6">
          {/* Data Dasar */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Data Dasar</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Nama Lengkap *
                <input value={values.name} onChange={set('name')} className={inputClass} placeholder="Nama lengkap alumni" />
              </label>
              <label className="block text-sm font-semibold">NISN *
                <input value={values.nisn} onChange={set('nisn')} className={inputClass} placeholder="Nomor Induk Siswa Nasional" />
              </label>
              <label className="block text-sm font-semibold">Jurusan
                <select value={values.major} onChange={set('major')} className={inputClass}>
                  <option value="">Pilih Jurusan</option>
                  {programs.map((p) => <option key={p.shortName} value={p.shortName}>{p.shortName} - {p.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">Tahun Lulus
                <input type="number" value={values.graduation_year} onChange={set('graduation_year')} className={inputClass} placeholder="cth: 2025" />
              </label>
              <label className="block text-sm font-semibold">No. HP
                <input value={values.phone} onChange={set('phone')} className={inputClass} placeholder="Nomor HP/WhatsApp" />
              </label>
              <label className="block text-sm font-semibold">Email
                <input type="email" value={values.email} onChange={set('email')} className={inputClass} placeholder="Email aktif" />
              </label>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold">Domisili
                  <input value={values.domicile} onChange={set('domicile')} className={inputClass} placeholder="Kota/Kabupaten domisili saat ini" />
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold">Status Setelah Lulus *
                  <select value={values.status} onChange={set('status')} className={inputClass}>
                    {Object.entries(ALUMNI_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Detail Status */}
          {status === 'bekerja' && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Detail Pekerjaan</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Nama Perusahaan
                  <input value={detail.company_name} onChange={setDetailField('company_name')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Posisi/Jabatan
                  <input value={detail.position} onChange={setDetailField('position')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Bidang Pekerjaan
                  <input value={detail.job_field} onChange={setDetailField('job_field')} className={inputClass} placeholder="cth: Teknologi Informasi" />
                </label>
                <label className="block text-sm font-semibold">Lokasi
                  <input value={detail.job_location} onChange={setDetailField('job_location')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Tahun Mulai Bekerja
                  <input type="number" value={detail.start_year} onChange={setDetailField('start_year')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Masa Tunggu (bulan)
                  <input type="number" value={detail.wait_time_months} onChange={setDetailField('wait_time_months')} className={inputClass} placeholder="Jumlah bulan" />
                </label>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold">Pekerjaan Sesuai Jurusan?
                    <select value={detail.job_matches_major} onChange={setDetailField('job_matches_major')} className={inputClass}>
                      <option value="true">Ya</option>
                      <option value="false">Tidak</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          {status === 'kuliah' && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Detail Kuliah</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Nama Perguruan Tinggi
                  <input value={detail.university_name} onChange={setDetailField('university_name')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Program Studi
                  <input value={detail.study_program} onChange={setDetailField('study_program')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Jenjang
                  <select value={detail.education_level} onChange={setDetailField('education_level')} className={inputClass}>
                    <option value="">Pilih Jenjang</option>
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold">Tahun Masuk
                  <input type="number" value={detail.entry_year} onChange={setDetailField('entry_year')} className={inputClass} />
                </label>
              </div>
            </div>
          )}

          {status === 'wirausaha' && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Detail Wirausaha</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Nama Usaha
                  <input value={detail.business_name} onChange={setDetailField('business_name')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Bidang Usaha
                  <input value={detail.business_field} onChange={setDetailField('business_field')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Lokasi Usaha
                  <input value={detail.business_location} onChange={setDetailField('business_location')} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold">Tahun Mulai Usaha
                  <input type="number" value={detail.business_start_year} onChange={setDetailField('business_start_year')} className={inputClass} />
                </label>
              </div>
            </div>
          )}

          {status === 'belum_bekerja' && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Keterangan</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold">Status/Keterangan Saat Ini
                    <input value={detail.current_status} onChange={setDetailField('current_status')} className={inputClass} placeholder="cth: Sedang mencari kerja, Istirahat, dll." />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold">Alasan/Kondisi
                    <textarea value={detail.reason} onChange={setDetailField('reason')} rows={3} className={inputClass} placeholder="Jelaskan kondisi atau alasan saat ini..." />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white">
            <Save className="h-4 w-4" /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// ALUMNI DETAIL MODAL
// ==========================================================================

function AlumniDetailModal({ item, onClose }: { item: AlumniGraduationRow; onClose: () => void }) {
  const detail = (item.status_detail ?? {}) as Record<string, string>;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">Detail Data Kelulusan</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div><span className="text-xs text-[#5B7088]">Nama</span><p className="font-semibold">{item.name}</p></div>
            <div><span className="text-xs text-[#5B7088]">NISN</span><p>{item.nisn}</p></div>
            <div><span className="text-xs text-[#5B7088]">Jurusan</span><p>{item.major}</p></div>
            <div><span className="text-xs text-[#5B7088]">Tahun Lulus</span><p>{item.graduation_year}</p></div>
            <div><span className="text-xs text-[#5B7088]">No. HP</span><p>{item.phone || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Email</span><p>{item.email || '-'}</p></div>
            <div><span className="text-xs text-[#5B7088]">Domisili</span><p>{item.domicile || '-'}</p></div>
            <div>
              <span className="text-xs text-[#5B7088]">Status</span>
              <p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>{ALUMNI_STATUS_LABELS[item.status]}</span></p>
            </div>
            <div>
              <span className="text-xs text-[#5B7088]">Verifikasi</span>
              <p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${verificationStyles[item.verification_status]}`}>{VERIFICATION_STATUS_LABELS[item.verification_status]}</span></p>
            </div>
            {item.verification_note && (
              <div className="sm:col-span-2"><span className="text-xs text-[#5B7088]">Catatan Verifikasi</span><p>{item.verification_note}</p></div>
            )}
          </div>

          {item.status === 'bekerja' && (
            <div className="rounded-lg bg-[#FAF6F0] p-4">
              <h4 className="mb-2 font-semibold text-[#1B2A4A]">Detail Pekerjaan</h4>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-xs text-[#5B7088]">Perusahaan</span><p>{detail.company_name || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Posisi</span><p>{detail.position || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Bidang</span><p>{detail.job_field || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Lokasi</span><p>{detail.job_location || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Tahun Mulai</span><p>{detail.start_year || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Masa Tunggu</span><p>{detail.wait_time_months ? `${detail.wait_time_months} bulan` : '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Sesuai Jurusan</span><p>{detail.job_matches_major === 'true' ? 'Ya' : 'Tidak'}</p></div>
              </div>
            </div>
          )}

          {item.status === 'kuliah' && (
            <div className="rounded-lg bg-[#FAF6F0] p-4">
              <h4 className="mb-2 font-semibold text-[#1B2A4A]">Detail Kuliah</h4>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-xs text-[#5B7088]">Perguruan Tinggi</span><p>{detail.university_name || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Program Studi</span><p>{detail.study_program || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Jenjang</span><p>{detail.education_level || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Tahun Masuk</span><p>{detail.entry_year || '-'}</p></div>
              </div>
            </div>
          )}

          {item.status === 'wirausaha' && (
            <div className="rounded-lg bg-[#FAF6F0] p-4">
              <h4 className="mb-2 font-semibold text-[#1B2A4A]">Detail Wirausaha</h4>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-xs text-[#5B7088]">Nama Usaha</span><p>{detail.business_name || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Bidang Usaha</span><p>{detail.business_field || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Lokasi</span><p>{detail.business_location || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Tahun Mulai</span><p>{detail.business_start_year || '-'}</p></div>
              </div>
            </div>
          )}

          {item.status === 'belum_bekerja' && (
            <div className="rounded-lg bg-[#FAF6F0] p-4">
              <h4 className="mb-2 font-semibold text-[#1B2A4A]">Keterangan</h4>
              <div className="grid gap-2 text-sm">
                <div><span className="text-xs text-[#5B7088]">Status Saat Ini</span><p>{detail.current_status || '-'}</p></div>
                <div><span className="text-xs text-[#5B7088]">Alasan/Kondisi</span><p>{detail.reason || '-'}</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088] hover:bg-[#FAF6F0] rounded-lg">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// VERIFY MODAL
// ==========================================================================

function VerifyModal({ item, onClose, onVerify }: {
  item: AlumniGraduationRow;
  onClose: () => void;
  onVerify: (status: string, note: string) => void;
}) {
  const [status, setStatus] = useState<VerificationStatus>(item.verification_status === 'menunggu' ? 'terverifikasi' : item.verification_status);
  const [note, setNote] = useState(item.verification_note ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-lg font-bold text-[#1B2A4A]">Verifikasi Data</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-sm">
          <p className="font-semibold">{item.name}</p>
          <p className="text-[#5B7088]">NISN: {item.nisn} · {item.major} · {item.graduation_year}</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold">Status Verifikasi
            <select value={status} onChange={(e) => setStatus(e.target.value as VerificationStatus)} className={inputClass}>
              {Object.entries(VERIFICATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Catatan (opsional)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputClass} placeholder="Catatan untuk alumni..." />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button onClick={() => onVerify(status, note)} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white">
            <CheckCircle className="h-4 w-4" /> Simpan Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// TAB: REKAPITULASI
// ==========================================================================

function RekapTab() {
  const [stats, setStats] = useState<AlumniGraduationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [majorFilter, setMajorFilter] = useState('');
  const [programs, setPrograms] = useState<{ name: string; shortName: string }[]>([]);

  useEffect(() => {
    fetchPublicContent<{ name: string; shortName: string }[]>('programs')
      .then((rows) => setPrograms(rows.filter((r) => r.shortName)))
      .catch(() => {});
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const { data } = await kelulusanAdminApi.stats({
      graduation_year: yearFilter || undefined,
      major: majorFilter || undefined,
    });
    if (data) setStats(data);
    setLoading(false);
  }, [yearFilter, majorFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  if (!stats) return <p className="text-[#5B7088]">Gagal memuat data.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Rekapitulasi data kelulusan siswa.</p>
        <button
          onClick={async () => {
            const q = new URLSearchParams();
            if (yearFilter) q.set('graduation_year', String(yearFilter));
            if (majorFilter) q.set('major', majorFilter);
            const suffix = q.size ? `?${q}` : '';
            const res = await fetch(`${apiBaseUrl}/admin/kelulusan/export${suffix}`, { credentials: 'include' });
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'rekap-kelulusan-siswa.csv'; a.click();
            URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"
        >
          <Download size={18} /> Export Data
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : '')} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Tahun</option>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={majorFilter} onChange={(e) => setMajorFilter(e.target.value)} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Jurusan</option>
          {programs.map((p) => <option key={p.shortName} value={p.shortName}>{p.shortName}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <GraduationCap className="mb-4 text-[#1B2A4A]" size={24} />
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-[#5B7088]">Total Lulusan</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <CheckCircle className="mb-4 text-green-600" size={24} />
          <p className="text-3xl font-bold">{stats.keterserapan}%</p>
          <p className="text-sm text-[#5B7088]">Persentase Keterserapan</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <Clock className="mb-4 text-[#866D2C]" size={24} />
          <p className="text-3xl font-bold">{stats.avg_wait_time}</p>
          <p className="text-sm text-[#5B7088]">Rata-rata Masa Tunggu (bulan)</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <Briefcase className="mb-4 text-blue-600" size={24} />
          <p className="text-3xl font-bold">{stats.job_match_percentage}%</p>
          <p className="text-sm text-[#5B7088]">Pekerjaan Sesuai Jurusan</p>
        </div>
      </div>

      {/* Rekap per Tahun */}
      {stats.by_year.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Jumlah Lulusan per Tahun</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-3">Tahun</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Bekerja</th>
                  <th className="p-3">Kuliah</th>
                  <th className="p-3">Wirausaha</th>
                  <th className="p-3">Belum Bekerja</th>
                  <th className="p-3">Keterserapan</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_year.map((row) => (
                  <tr key={row.year} className="border-t border-[#1B2A4A]/10">
                    <td className="p-3 font-semibold">{row.year}</td>
                    <td className="p-3">{row.total}</td>
                    <td className="p-3 text-green-600">{row.bekerja}</td>
                    <td className="p-3 text-blue-600">{row.kuliah}</td>
                    <td className="p-3 text-purple-600">{row.wirausaha}</td>
                    <td className="p-3 text-amber-600">{row.belum_bekerja}</td>
                    <td className="p-3 font-semibold">{row.keterserapan}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rekap per Jurusan */}
      {stats.by_major.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Jumlah Lulusan per Jurusan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-3">Jurusan</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Bekerja</th>
                  <th className="p-3">Kuliah</th>
                  <th className="p-3">Wirausaha</th>
                  <th className="p-3">Belum Bekerja</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_major.map((row) => (
                  <tr key={row.major} className="border-t border-[#1B2A4A]/10">
                    <td className="p-3 font-semibold">{row.major}</td>
                    <td className="p-3">{row.total}</td>
                    <td className="p-3 text-green-600">{row.bekerja}</td>
                    <td className="p-3 text-blue-600">{row.kuliah}</td>
                    <td className="p-3 text-purple-600">{row.wirausaha}</td>
                    <td className="p-3 text-amber-600">{row.belum_bekerja}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Breakdown */}
      <div className="rounded-xl bg-[#1B2A4A] p-6 text-white">
        <h3 className="mb-4 text-lg font-bold">Ringkasan Keterserapan Lulusan</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/20"><Briefcase className="h-5 w-5 text-green-400" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.bekerja}</p>
              <p className="text-xs text-[#F3E8D0]">Bekerja ({stats.total > 0 ? Math.round(stats.bekerja / stats.total * 100) : 0}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/20"><BookOpen className="h-5 w-5 text-blue-400" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.kuliah}</p>
              <p className="text-xs text-[#F3E8D0]">Kuliah ({stats.total > 0 ? Math.round(stats.kuliah / stats.total * 100) : 0}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/20"><Store className="h-5 w-5 text-purple-400" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.wirausaha}</p>
              <p className="text-xs text-[#F3E8D0]">Wirausaha ({stats.total > 0 ? Math.round(stats.wirausaha / stats.total * 100) : 0}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/20"><Clock className="h-5 w-5 text-amber-400" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.belum_bekerja}</p>
              <p className="text-xs text-[#F3E8D0]">Belum Bekerja ({stats.total > 0 ? Math.round(stats.belum_bekerja / stats.total * 100) : 0}%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
