import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, Search, ChevronLeft, ChevronRight, Building2, Briefcase, Home, Contact, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { fetchPublicContent, type BkkHomeContent, type BkkContactContent } from '../../lib/api';
import {
  jobAdminApi,
  bkkPartnerAdminApi,
  resolveImageUrl,
  JOB_STATUS_LABELS,
  JOB_EMPLOYMENT_LABELS,
  type JobVacancyRow,
  type JobStatus,
  type JobEmploymentType,
  type JobListMeta,
  type BkkPartner,
} from '../../lib/api';
import { backendApi } from '../../lib/api';
import { can } from '../../lib/permissions';
import ImageField from './ImageField';

interface Props {
  permissions: string[];
  isAdmin: boolean;
}

const PAGE_SIZE = 10;

const statusStyles: Record<string, string> = {
  open: 'bg-green-50 text-green-700',
  closing: 'bg-amber-50 text-amber-700',
  closed: 'bg-[#1B2A4A]/10 text-[#5B7088]',
};

const inputClass = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';

export default function BkkManagement({ permissions, isAdmin }: Props) {
  const [tab, setTab] = useState<'jobs' | 'partners' | 'home' | 'contact'>('jobs');

  const tabs = [
    { key: 'jobs' as const, label: 'Lowongan Kerja', icon: Briefcase },
    { key: 'partners' as const, label: 'Perusahaan Partner', icon: Building2 },
    { key: 'home' as const, label: 'Beranda BKK', icon: Home, adminOnly: true },
    { key: 'contact' as const, label: 'Kontak BKK', icon: Contact, adminOnly: true },
  ].filter((t) => !t.adminOnly || isAdmin);

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

      {tab === 'jobs' && <JobsTab permissions={permissions} />}
      {tab === 'partners' && <PartnersTab permissions={permissions} />}
      {tab === 'home' && isAdmin && <HomeTab />}
      {tab === 'contact' && isAdmin && <ContactTab />}
    </div>
  );
}

// ==========================================================================
// TAB: LOWONGAN KERJA (existing BKK feature, unchanged)
// ==========================================================================

function JobsTab({ permissions }: { permissions: string[] }) {
  const [rows, setRows] = useState<JobVacancyRow[]>([]);
  const [meta, setMeta] = useState<JobListMeta>({ total: 0, page: 1, limit: PAGE_SIZE, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobVacancyRow | null>(null);

  const [programs, setPrograms] = useState<{ name: string; shortName: string }[]>([]);

  useEffect(() => {
    fetchPublicContent<{ name: string; shortName: string }[]>('programs')
      .then((rows) => setPrograms(rows.filter((r) => r.shortName)))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const { data, error, meta } = await jobAdminApi.list({
      search: search || undefined,
      status: statusFilter || undefined,
      employment_type: typeFilter || undefined,
      page,
      limit: PAGE_SIZE,
    });
    if (!error && data) {
      setRows(data);
      setMeta((meta as JobListMeta) ?? { total: 0, page: 1, limit: PAGE_SIZE, last_page: 1 });
    } else if (error) {
      setMsg({ type: 'err', text: (error as { message?: string }).message ?? 'Gagal memuat data.' });
    }
    setLoading(false);
  }, [search, statusFilter, typeFilter, page]);

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

  const save = async (record: Partial<JobVacancyRow>) => {
    const payload: Record<string, unknown> = {
      ...record,
      is_published: Boolean(record.is_published),
      deadline: record.deadline || null,
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    let r;
    if (editing?.id) {
      r = await jobAdminApi.update(editing.id, payload);
    } else {
      r = await jobAdminApi.create(payload);
    }
    if (r.error) {
      const message =
        (r.error as { message?: string }).message ??
        Object.values((r.error as Record<string, unknown>) ?? {}).map((v) => String(v)).join('; ') ??
        'Terjadi kesalahan.';
      flash('err', message);
      return false;
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus lowongan ini?')) return;
    const r = await jobAdminApi.remove(id);
    if (r.error) { flash('err', (r.error as { message?: string }).message ?? 'Gagal menghapus.'); return; }
    await load();
    flash('ok', 'Lowongan dihapus.');
  };

  const formatDeadline = (d?: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading && rows.length === 0) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Kelola lowongan kerja Bursa Kerja Khusus (BKK) sekolah.</p>
        {can(permissions, 'job.create') && (
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"
          >
            <Plus size={18} /> Tambah Lowongan
          </button>
        )}
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari posisi / perusahaan / kota..."
            className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Status</option>
          {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Tipe</option>
          {Object.entries(JOB_EMPLOYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
            <tr>
              <th className="p-4">Perusahaan</th>
              <th className="p-4">Posisi</th>
              <th className="p-4">Tipe</th>
              <th className="p-4">Status</th>
              <th className="p-4">Deadline</th>
              <th className="p-4">Publish</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-[#5B7088]">Tidak ada lowongan.</td></tr>
            )}
            {rows.map((job) => (
              <tr key={job.id} className="border-t border-[#1B2A4A]/10">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {job.company_logo ? (
                      <img src={resolveImageUrl(job.company_logo)} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1B2A4A]/5"><Building2 className="h-4 w-4 text-[#5B7088]" /></div>
                    )}
                    <span className="font-semibold">{job.company_name || '-'}</span>
                  </div>
                </td>
                <td className="p-4">{job.position || '-'}</td>
                <td className="p-4">{JOB_EMPLOYMENT_LABELS[job.employment_type] ?? '-'}</td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>{JOB_STATUS_LABELS[job.status] ?? job.status}</span></td>
                <td className="p-4">{formatDeadline(job.deadline)}</td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${job.is_published ? 'bg-green-50 text-green-700' : 'bg-[#FAF6F0] text-[#5B7088]'}`}>
                    {job.is_published ? 'Terbit' : 'Draft'}
                  </span>
                </td>
                <td className="p-4">
                  {can(permissions, 'job.edit') && (
                    <button onClick={() => { setEditing(job); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>
                  )}
                  {can(permissions, 'job.delete') && <button onClick={() => remove(job.id)} className="text-red-600"><Trash2 size={17} /></button>}
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
          <span className="px-4 text-sm font-medium text-[#23314D]">Halaman {meta.page} dari {totalPages} · {meta.total} lowongan</span>
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
        <JobForm
          item={editing}
          programs={programs}
          onClose={() => setOpen(false)}
          onSave={async (record) => {
            const ok = await save({ ...record, id: editing?.id });
            if (ok) { setOpen(false); setPage(1); await load(); flash('ok', 'Lowongan disimpan.'); }
          }}
        />
      )}
    </div>
  );
}

function JobForm({ item, programs, onClose, onSave }: { item: JobVacancyRow | null; programs: { name: string; shortName: string }[]; onClose: () => void; onSave: (r: Partial<JobVacancyRow>) => void }) {
  const [values, setValues] = useState<Record<string, string>>({
    company_name: item?.company_name ?? '',
    company_logo: item?.company_logo ?? '',
    position: item?.position ?? '',
    company_description: item?.company_description ?? '',
    job_description: item?.job_description ?? '',
    responsibilities: item?.responsibilities ?? '',
    requirements: item?.requirements ?? '',
    benefits: item?.benefits ?? '',
    education: item?.education ?? '',
    experience: item?.experience ?? '',
    city: item?.city ?? '',
    location: item?.location ?? '',
    employment_type: item?.employment_type ?? 'full_time',
    registration_link: item?.registration_link ?? '',
    hr_contact: item?.hr_contact ?? '',
    deadline: item?.deadline ? String(item.deadline).slice(0, 10) : '',
    status: item?.status ?? 'open',
  });
  const [isPublished, setIsPublished] = useState<boolean>(Boolean(item?.is_published));
  const [majors, setMajors] = useState<string[]>(item?.major ?? []);

  const toggleMajor = (shortName: string) => {
    setMajors((prev) => (prev.includes(shortName) ? prev.filter((m) => m !== shortName) : [...prev, shortName]));
  };

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{item ? 'Edit' : 'Tambah'} Lowongan</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Perusahaan *" value={values.company_name} onChange={set('company_name')} />
          <Field label="Posisi *" value={values.position} onChange={set('position')} />
          <div className="sm:col-span-2">
            <ImageField label="Logo Perusahaan" value={values.company_logo} onChange={(url) => setValues((v) => ({ ...v, company_logo: url }))} bucket="bkk/logos" />
          </div>
          <div className="sm:col-span-2"><Field label="Deskripsi Perusahaan" multiline value={values.company_description} onChange={set('company_description')} /></div>
          <div className="sm:col-span-2"><Field label="Deskripsi Pekerjaan" multiline value={values.job_description} onChange={set('job_description')} /></div>
          <div className="sm:col-span-2"><Field label="Tanggung Jawab (satu baris per item)" multiline value={values.responsibilities} onChange={set('responsibilities')} /></div>
          <div className="sm:col-span-2"><Field label="Persyaratan (satu baris per item)" multiline value={values.requirements} onChange={set('requirements')} /></div>
          <div className="sm:col-span-2"><Field label="Benefit (satu baris per item)" multiline value={values.benefits} onChange={set('benefits')} /></div>
          <Field label="Pendidikan Minimal" value={values.education} onChange={set('education')} />
          <Field label="Pengalaman" value={values.experience} onChange={set('experience')} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">Jurusan yang Diterima
              <span className={`mt-1 block overflow-hidden rounded-lg border border-[#1B2A4A]/20 bg-white p-1`}>
                <div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
                  {programs.length === 0 && <p className="col-span-full p-3 text-xs text-[#5B7088]">Memuat daftar jurusan...</p>}
                  {programs.map((program) => (
                    <label
                      key={program.shortName}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${majors.includes(program.shortName) ? 'bg-[#C8A951]/20 text-[#1B2A4A]' : 'bg-[#FAF6F0] text-[#23314D] hover:bg-[#F1E9DB]'}`}
                    >
                      <input
                        type="checkbox"
                        checked={majors.includes(program.shortName)}
                        onChange={() => toggleMajor(program.shortName)}
                        className="h-3.5 w-3.5 accent-[#1B2A4A]"
                      />
                      <span className="truncate">{program.shortName}<span className="ml-1 hidden font-normal text-[#5B7088] lg:inline">{program.name}</span></span>
                    </label>
                  ))}
                </div>
              </span>
            </label>
          </div>
          <Field label="Kota" value={values.city} onChange={set('city')} />
          <Field label="Lokasi (Alamat Detail)" value={values.location} onChange={set('location')} />
          <label className="block text-sm font-semibold">Tipe Pekerjaan
            <select value={values.employment_type} onChange={set('employment_type')} className={inputClass}>
              {Object.entries(JOB_EMPLOYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <Field label="Deadline" type="date" value={values.deadline} onChange={set('deadline')} />
          <Field label="Link Pendaftaran" value={values.registration_link} onChange={set('registration_link')} />
          <Field label="Kontak HR (opsional)" value={values.hr_contact} onChange={set('hr_contact')} />
          <label className="block text-sm font-semibold">Status
            <select value={values.status} onChange={set('status')} className={inputClass}>
              {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 accent-[#1B2A4A]"
              />
              Publish (tampil di website)
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button
            onClick={() =>
              onSave({
                ...values,
                major: majors,
                employment_type: values.employment_type as JobEmploymentType,
                status: values.status as JobStatus,
                is_published: isPublished,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white"
          >
            <Save className="h-4 w-4" /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, type = 'text', placeholder }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; multiline?: boolean; type?: string; placeholder?: string }) {
  return (
    <label className="block text-sm font-semibold">{label}
      {multiline
        ? <textarea value={value} onChange={onChange} rows={4} placeholder={placeholder} className={inputClass} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />}
    </label>
  );
}

// ==========================================================================
// TAB: PERUSAHAAN PARTNER
// ==========================================================================

function PartnersTab({ permissions }: { permissions: string[] }) {
  const [rows, setRows] = useState<BkkPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BkkPartner | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await bkkPartnerAdminApi.list({ search: search || undefined });
    if (!error && data) {
      setRows(data);
    } else if (error) {
      setMsg({ type: 'err', text: (error as { message?: string }).message ?? 'Gagal memuat data.' });
    }
    setLoading(false);
  }, [search]);

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

  const save = async (record: Partial<BkkPartner>) => {
    const payload: Record<string, unknown> = {
      ...record,
      is_active: Boolean(record.is_active),
      sort_order: Number(record.sort_order ?? 0),
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    let r;
    if (editing?.id) {
      r = await bkkPartnerAdminApi.update(editing.id, payload);
    } else {
      r = await bkkPartnerAdminApi.create(payload);
    }
    if (r.error) {
      const message =
        (r.error as { message?: string }).message ??
        Object.values((r.error as Record<string, unknown>) ?? {}).map((v) => String(v)).join('; ') ??
        'Terjadi kesalahan.';
      flash('err', message);
      return false;
    }
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus perusahaan partner ini?')) return;
    const r = await bkkPartnerAdminApi.remove(id);
    if (r.error) { flash('err', (r.error as { message?: string }).message ?? 'Gagal menghapus.'); return; }
    await load();
    flash('ok', 'Perusahaan partner dihapus.');
  };

  if (loading && rows.length === 0) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Kelola perusahaan partner yang ditampilkan pada Beranda BKK.</p>
        {can(permissions, 'job.create') && (
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"
          >
            <Plus size={18} /> Tambah Perusahaan
          </button>
        )}
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="relative min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / bidang industri / lokasi..."
          className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
            <tr>
              <th className="p-4">Logo</th>
              <th className="p-4">Nama Perusahaan</th>
              <th className="p-4">Bidang Industri</th>
              <th className="p-4">Lokasi</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-[#5B7088]">Belum ada perusahaan partner.</td></tr>
            )}
            {rows.map((partner) => (
              <tr key={partner.id} className="border-t border-[#1B2A4A]/10">
                <td className="p-4">
                  {partner.logo ? (
                    <img src={resolveImageUrl(partner.logo)} alt={partner.name} className="h-10 w-10 rounded-lg border border-[#1B2A4A]/10 object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#1B2A4A]/5"><Building2 className="h-5 w-5 text-[#5B7088]" /></div>
                  )}
                </td>
                <td className="p-4 font-semibold text-[#1B2A4A]">{partner.name || '-'}</td>
                <td className="p-4 text-[#23314D]">{partner.industry || '-'}</td>
                <td className="p-4 text-[#23314D]">{partner.location || '-'}</td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${partner.is_active ? 'bg-green-50 text-green-700' : 'bg-[#FAF6F0] text-[#5B7088]'}`}>
                    {partner.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="p-4">
                  {can(permissions, 'job.edit') && (
                    <button onClick={() => { setEditing(partner); setOpen(true); }} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>
                  )}
                  {can(permissions, 'job.delete') && <button onClick={() => remove(partner.id)} className="text-red-600"><Trash2 size={17} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <PartnerForm
          item={editing}
          onClose={() => setOpen(false)}
          onSave={async (record) => {
            const ok = await save({ ...record, id: editing?.id });
            if (ok) { setOpen(false); await load(); flash('ok', 'Perusahaan partner disimpan.'); }
          }}
        />
      )}
    </div>
  );
}

function PartnerForm({ item, onClose, onSave }: { item: BkkPartner | null; onClose: () => void; onSave: (r: Partial<BkkPartner>) => void }) {
  const [name, setName] = useState(item?.name ?? '');
  const [industry, setIndustry] = useState(item?.industry ?? '');
  const [location, setLocation] = useState(item?.location ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [logo, setLogo] = useState(item?.logo ?? '');
  const [isActive, setIsActive] = useState<boolean>(Boolean(item?.is_active));
  const [sortOrder, setSortOrder] = useState<number>(item?.sort_order ?? 0);
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setError('Nama perusahaan wajib diisi.');
      return;
    }
    setError('');
    onSave({ name: name.trim(), industry: industry.trim(), location: location.trim(), description: description.trim(), logo, is_active: isActive, sort_order: sortOrder });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold text-[#1B2A4A]">{item ? 'Edit' : 'Tambah'} Perusahaan Partner</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImageField label="Logo Perusahaan" value={logo} onChange={setLogo} hint="Unggah file gambar atau tempel URL." />
          </div>
          <label className="block text-sm font-semibold">Nama Perusahaan *
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">Bidang Industri
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass} placeholder="cth: Teknologi Informasi" />
          </label>
          <label className="block text-sm font-semibold">Lokasi
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="cth: Tangerang" />
          </label>
          <label className="block text-sm font-semibold">Urutan Tampil
            <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} className={inputClass} />
          </label>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">Deskripsi
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
            </label>
          </div>
          <div className="flex items-end sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#1B2A4A]"
              />
              Aktif (tampil di Beranda BKK)
            </label>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white"
          >
            <Save className="h-4 w-4" /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// TAB: BERANDA BKK (pengaturan konten)
// ==========================================================================

function HomeTab() {
  const [recordId, setRecordId] = useState<string | null>(null);
  const [values, setValues] = useState<BkkHomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    backendApi.database.from('content_records').select('*').eq('content_type', 'bkk_home').limit(1).maybeSingle().then((r: any) => {
      if (r.error) setMessage({ type: 'err', text: r.error.message });
      else if (!r.data) setMessage({ type: 'err', text: 'Pengaturan Beranda BKK belum tersedia. Jalankan seeder terlebih dahulu.' });
      else {
        setRecordId(r.data.id);
        const data = (r.data.data as BkkHomeContent) ?? {};
        setValues({
          banner: { title: data.banner?.title ?? '', subtitle: data.banner?.subtitle ?? '', image: data.banner?.image ?? '' },
          about: { title: data.about?.title ?? '', subtitle: data.about?.subtitle ?? '', paragraphs: data.about?.paragraphs ?? [] },
          services: data.services ?? [],
        });
      }
      setLoading(false);
    });
  }, []);

  const set = (section: 'banner' | 'about' | 'services', next: unknown) => {
    setValues((current) => (current ? { ...current, [section]: next } : current));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recordId || !values) return;
    setSaving(true);
    setMessage(null);
    const r = await backendApi.database.from('content_records').update({ content_type: 'bkk_home', data: values }).eq('id', recordId);
    if (r.error) setMessage({ type: 'err', text: r.error.message });
    else setMessage({ type: 'ok', text: 'Pengaturan Beranda BKK berhasil disimpan.' });
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  if (!values) return <p className="rounded-xl bg-white p-6 text-[#5B7088]">Pengaturan Beranda BKK belum tersedia.</p>;

  const updateBanner = (field: 'title' | 'subtitle' | 'image', next: string) =>
    set('banner', { ...values.banner, [field]: next });

  const updateAbout = (field: 'title' | 'subtitle' | 'paragraphs', next: string) => {
    if (field === 'paragraphs') {
      set('about', { ...values.about, paragraphs: next.split('\n').map((line) => line.trim()).filter(Boolean) });
    } else {
      set('about', { ...values.about, [field]: next });
    }
  };

  const servicesText = (values.services ?? []).map((s) => `${s.title} | ${s.description}`).join('\n');
  const setServices = (text: string) =>
    set('services', text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [title = '', ...description] = line.split('|');
      return { title: title.trim(), description: description.join('|').trim() };
    }));

  return (
    <form onSubmit={save} className="space-y-6">
      {message && <p className={`rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Banner BKK</h3>
        <div className="grid gap-4">
          <ImageField label="Gambar Banner" value={values.banner.image} onChange={(url) => updateBanner('image', url)} hint="Unggah file gambar atau tempel URL." />
          <Field label="Judul / Banner BKK" value={values.banner.title} onChange={(e) => updateBanner('title', e.target.value)} />
          <Field label="Deskripsi Singkat (Subtitle)" multiline value={values.banner.subtitle} onChange={(e) => updateBanner('subtitle', e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Informasi Tentang BKK</h3>
        <div className="grid gap-4">
          <Field label="Judul" value={values.about.title} onChange={(e) => updateAbout('title', e.target.value)} />
          <Field label="Subtitle" value={values.about.subtitle} onChange={(e) => updateAbout('subtitle', e.target.value)} />
          <Field label="Paragraf (satu paragraf per baris)" multiline value={(values.about.paragraphs ?? []).join('\n')} onChange={(e) => updateAbout('paragraphs', e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Layanan BKK</h3>
        <Field label="Layanan (satu baris: judul | deskripsi)" multiline value={servicesText} onChange={(e) => setServices(e.target.value)} />
        <p className="mt-2 text-xs text-[#5B7088]">Setiap baris diisi dengan format: Nama Layanan | Deskripsi layanan.</p>
      </div>

      <div className="flex justify-end">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan Beranda BKK'}
        </button>
      </div>
    </form>
  );
}

// ==========================================================================
// TAB: KONTAK BKK (pengaturan kontak)
// ==========================================================================

const DEFAULT_CONTACT: BkkContactContent = { whatsapp: '', whatsapp_link: '', email: '', location: '', hours: '' };

function ContactTab() {
  const [recordId, setRecordId] = useState<string | null>(null);
  const [values, setValues] = useState<BkkContactContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    backendApi.database.from('content_records').select('*').eq('content_type', 'bkk_contact').limit(1).maybeSingle().then((r: any) => {
      if (r.error) setMessage({ type: 'err', text: r.error.message });
      else if (!r.data) setMessage({ type: 'err', text: 'Pengaturan Kontak BKK belum tersedia. Jalankan seeder terlebih dahulu.' });
      else {
        setRecordId(r.data.id);
        const data = (r.data.data as BkkContactContent) ?? {};
        setValues({ ...DEFAULT_CONTACT, ...data });
      }
      setLoading(false);
    });
  }, []);

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((current) => (current ? { ...current, [key]: e.target.value } : current));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recordId || !values) return;
    setSaving(true);
    setMessage(null);
    const r = await backendApi.database.from('content_records').update({ content_type: 'bkk_contact', data: values }).eq('id', recordId);
    if (r.error) setMessage({ type: 'err', text: r.error.message });
    else setMessage({ type: 'ok', text: 'Pengaturan Kontak BKK berhasil disimpan.' });
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  if (!values) return <p className="rounded-xl bg-white p-6 text-[#5B7088]">Pengaturan Kontak BKK belum tersedia.</p>;

  return (
    <form onSubmit={save} className="space-y-6">
      {message && <p className={`rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Informasi Kontak BKK</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nomor WhatsApp" value={values.whatsapp} onChange={set('whatsapp')} placeholder="cth: 0812 9922 0831" />
          <Field label="Link WhatsApp" value={values.whatsapp_link} onChange={set('whatsapp_link')} placeholder="cth: https://wa.me/6281299220831" />
          <div className="sm:col-span-2">
            <Field label="Email" value={values.email} onChange={set('email')} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Alamat / Lokasi BKK" multiline value={values.location} onChange={set('location')} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Jam Pelayanan" value={values.hours} onChange={set('hours')} placeholder="cth: Senin - Jumat, 07.00 - 15.00 WIB" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[#1B2A4A] p-5 text-white">
        <h3 className="mb-2 flex items-center gap-2 text-base font-bold"><Phone className="h-4 w-4 text-[#C8A951]" /> Data yang diubah langsung tampil di</h3>
        <ul className="space-y-1 text-sm text-[#F3E8D0]">
          <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#C8A951]" /> Halaman Kontak BKK (/bkk/kontak)</li>
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#C8A951]" /> Bagian kontak di Beranda BKK (/bkk)</li>
          <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#C8A951]" /> Jam pelayanan dan lokasi BKK</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan Kontak BKK'}
        </button>
      </div>
    </form>
  );
}
