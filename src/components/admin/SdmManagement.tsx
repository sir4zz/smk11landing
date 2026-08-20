import { Fragment, useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArrowLeft, ChevronRight, Download, Eye, KeyRound, Loader2, Pencil, Plus, Search, Trash2, Upload, UserRound, X } from 'lucide-react';
import { resolveImageUrl, sdmAccountApi, sdmApi } from '../../lib/api';
import type { GuruAccountSummary, SdmPersonRow, SdmType } from '../../lib/api';
import { can } from '../../lib/permissions';
import ImageField from './ImageField';
import SdmImport from './SdmImport';

const SDM_TYPE_LABELS: Record<SdmType, string> = {
  guru: 'Guru',
  tendik: 'Tenaga Kependidikan',
};

const TAB_DEFS: { id: string; label: string }[] = [
  { id: 'pribadi', label: 'Data Pribadi' },
  { id: 'kepegawaian', label: 'Kepegawaian' },
  { id: 'kontak', label: 'Kontak' },
  { id: 'sosmed', label: 'Sosial Media' },
  { id: 'pendidikan', label: 'Pendidikan' },
  { id: 'tugas', label: 'Tugas' },
  { id: 'sertifikasi', label: 'Sertifikasi' },
  { id: 'kgb', label: 'KGB' },
  { id: 'sk', label: 'SK Pengangkatan' },
];

const SK_KATEGORI_LABELS: Record<string, string> = {
  awal_sekolah: 'SK Awal (Sekolah)',
  akhir_sekolah: 'SK Akhir (Sekolah)',
  awal_dindikbud: 'SK Awal (Dindikbud)',
  akhir_dindikbud: 'SK Akhir (Dindikbud)',
};

const SK_KATEGORI_OPTIONS = Object.entries(SK_KATEGORI_LABELS).map(([value, label]) => ({ value, label }));

interface SdmForm {
  name: string;
  nip: string;
  nipppk: string;
  nuptk: string;
  gender: string;
  religion: string;
  birth_place: string;
  birth_date: string;
  status_kepegawaian: string;
  pangkat_golongan: string;
  jabatan: string;
  tmt_golongan: string;
  tmt_cpns: string;
  tmt_pns_pppk: string;
  tmt_sk_sekolah: string;
  nik: string;
  address: string;
  phone: string;
  npwp: string;
  akta_lahir: string;
  bpjs: string;
  email: string;
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  website: string;
  github: string;
  photo: string;
  bio: string;
  is_active: boolean;
  educations: Record<string, string>[];
  assignments: Record<string, string>[];
  certifications: Record<string, string>[];
  kgb: Record<string, string>;
  sk_pengangkatans: Record<string, string>[];
}

function emptyForm(): SdmForm {
  return {
    name: '', nip: '', nipppk: '', nuptk: '', gender: '', religion: '',
    birth_place: '', birth_date: '', status_kepegawaian: '', pangkat_golongan: '',
    jabatan: '', tmt_golongan: '', tmt_cpns: '', tmt_pns_pppk: '', tmt_sk_sekolah: '',
    nik: '', address: '', phone: '', npwp: '', akta_lahir: '', bpjs: '', email: '',
    instagram: '', facebook: '', twitter: '', tiktok: '', youtube: '', linkedin: '', website: '', github: '',
    photo: '', bio: '', is_active: true,
    educations: [], assignments: [], certifications: [], kgb: {}, sk_pengangkatans: [],
  };
}

function formFromPerson(person: SdmPersonRow): SdmForm {
  const base = emptyForm();
  base.name = person.name ?? '';
  base.nip = person.nip ?? '';
  base.nipppk = person.nipppk ?? '';
  base.nuptk = person.nuptk ?? '';
  base.gender = person.gender ?? '';
  base.religion = person.religion ?? '';
  base.birth_place = person.birth_place ?? '';
  base.birth_date = sliceDate(person.birth_date);
  base.status_kepegawaian = person.status_kepegawaian ?? '';
  base.pangkat_golongan = person.pangkat_golongan ?? '';
  base.jabatan = person.jabatan ?? '';
  base.tmt_golongan = sliceDate(person.tmt_golongan);
  base.tmt_cpns = sliceDate(person.tmt_cpns);
  base.tmt_pns_pppk = sliceDate(person.tmt_pns_pppk);
  base.tmt_sk_sekolah = sliceDate(person.tmt_sk_sekolah);
  base.nik = person.nik ?? '';
  base.address = person.address ?? '';
  base.phone = person.phone ?? '';
  base.npwp = person.npwp ?? '';
  base.akta_lahir = person.akta_lahir ?? '';
  base.bpjs = person.bpjs ?? '';
  base.email = person.email ?? '';
  base.instagram = person.instagram ?? '';
  base.facebook = person.facebook ?? '';
  base.twitter = person.twitter ?? '';
  base.tiktok = person.tiktok ?? '';
  base.youtube = person.youtube ?? '';
  base.linkedin = person.linkedin ?? '';
  base.website = person.website ?? '';
  base.github = person.github ?? '';
  base.photo = person.photo ?? '';
  base.bio = person.bio ?? '';
  base.is_active = person.is_active !== false;
  base.educations = (person.educations ?? []).map((e) => ({
    jenjang: e.jenjang ?? '',
    jurusan: e.jurusan ?? '',
    perguruan_tinggi: e.perguruan_tinggi ?? '',
    tahun_lulus: e.tahun_lulus != null ? String(e.tahun_lulus) : '',
    tempat: e.tempat ?? '',
    nomor_ijazah: e.nomor_ijazah ?? '',
    tanggal_ijazah: sliceDate(e.tanggal_ijazah),
  }));
  base.assignments = (person.assignments ?? []).map((a) => ({
    jenis: a.jenis ?? 'tugas_tambahan',
    uraian: a.uraian ?? '',
    jumlah_jam: a.jumlah_jam ?? '',
  }));
  base.certifications = (person.certifications ?? []).map((c) => ({
    status: c.status ?? '',
    no_sertifikat: c.no_sertifikat ?? '',
    no_peserta: c.no_peserta ?? '',
    no_nrg: c.no_nrg ?? '',
    bidang_studi: c.bidang_studi ?? '',
    penyelenggara: c.penyelenggara ?? '',
    tahun_lulus: c.tahun_lulus != null ? String(c.tahun_lulus) : '',
  }));
  if (person.kgb) {
    base.kgb = {
      no_sk: person.kgb.no_sk ?? '',
      tanggal_sk: sliceDate(person.kgb.tanggal_sk),
      gaji_pokok: person.kgb.gaji_pokok ?? '',
      mkg: person.kgb.mkg ?? '',
      tmt_kgb_akhir: sliceDate(person.kgb.tmt_kgb_akhir),
      tmt_kgb_berikutnya: sliceDate(person.kgb.tmt_kgb_berikutnya),
    };
  }
  base.sk_pengangkatans = (person.sk_pengangkatans ?? []).map((sk) => ({
    kategori: sk.kategori ?? '',
    nomor_sk: sk.nomor_sk ?? '',
    tanggal_sk: sliceDate(sk.tanggal_sk),
    pejabat: sk.pejabat ?? '',
  }));
  return base;
}

function formToPayload(form: SdmForm): Record<string, unknown> {
  const optional = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    name: form.name.trim(),
    nip: optional(form.nip),
    nipppk: optional(form.nipppk),
    nuptk: optional(form.nuptk),
    gender: form.gender.trim(),
    religion: form.religion.trim(),
    birth_place: form.birth_place.trim(),
    birth_date: optional(form.birth_date),
    status_kepegawaian: form.status_kepegawaian.trim(),
    pangkat_golongan: form.pangkat_golongan.trim(),
    jabatan: form.jabatan.trim(),
    tmt_golongan: optional(form.tmt_golongan),
    tmt_cpns: optional(form.tmt_cpns),
    tmt_pns_pppk: optional(form.tmt_pns_pppk),
    tmt_sk_sekolah: optional(form.tmt_sk_sekolah),
    nik: optional(form.nik),
    address: form.address.trim(),
    phone: form.phone.trim(),
    npwp: form.npwp.trim(),
    akta_lahir: form.akta_lahir.trim(),
    bpjs: form.bpjs.trim(),
    email: form.email.trim(),
    instagram: form.instagram.trim(),
    facebook: form.facebook.trim(),
    twitter: form.twitter.trim(),
    tiktok: form.tiktok.trim(),
    youtube: form.youtube.trim(),
    linkedin: form.linkedin.trim(),
    website: form.website.trim(),
    github: form.github.trim(),
    photo: form.photo.trim(),
    bio: form.bio.trim(),
    is_active: form.is_active,
    educations: form.educations.map((e) => ({
      jenjang: e.jenjang.trim(),
      jurusan: e.jurusan.trim(),
      perguruan_tinggi: e.perguruan_tinggi.trim(),
      tahun_lulus: e.tahun_lulus.trim() === '' ? null : Number(e.tahun_lulus),
      tempat: e.tempat.trim(),
      nomor_ijazah: e.nomor_ijazah.trim(),
      tanggal_ijazah: optional(e.tanggal_ijazah),
    })),
    assignments: form.assignments
      .filter((a) => a.uraian.trim() !== '')
      .map((a) => ({
        jenis: a.jenis === 'tugas_mengajar' ? 'tugas_mengajar' : 'tugas_tambahan',
        uraian: a.uraian.trim(),
        jumlah_jam: a.jumlah_jam.trim(),
      })),
    certifications: form.certifications
      .filter((c) => c.no_sertifikat.trim() !== '')
      .map((c) => ({
        status: c.status.trim(),
        no_sertifikat: c.no_sertifikat.trim(),
        no_peserta: c.no_peserta.trim(),
        no_nrg: c.no_nrg.trim(),
        bidang_studi: c.bidang_studi.trim(),
        penyelenggara: c.penyelenggara.trim(),
        tahun_lulus: c.tahun_lulus.trim() === '' ? null : Number(c.tahun_lulus),
      })),
    kgb: Object.keys(form.kgb).length
      ? {
          no_sk: form.kgb.no_sk ?? '',
          tanggal_sk: optional(form.kgb.tanggal_sk ?? ''),
          gaji_pokok: form.kgb.gaji_pokok ?? '',
          mkg: form.kgb.mkg ?? '',
          tmt_kgb_akhir: optional(form.kgb.tmt_kgb_akhir ?? ''),
          tmt_kgb_berikutnya: optional(form.kgb.tmt_kgb_berikutnya ?? ''),
        }
      : null,
    sk_pengangkatans: form.sk_pengangkatans
      .filter((sk) => sk.nomor_sk.trim() !== '')
      .map((sk) => ({
        kategori: sk.kategori ?? '',
        nomor_sk: sk.nomor_sk.trim(),
        tanggal_sk: optional(sk.tanggal_sk),
        pejabat: sk.pejabat.trim(),
      })),
  };
}

function sliceDate(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function fmtDate(value: unknown): string {
  const s = sliceDate(value);
  if (!s) return '-';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

interface SdmManagementProps {
  type: SdmType;
  permissions: string[];
}

export default function SdmManagement({ type, permissions }: SdmManagementProps) {
  const [items, setItems] = useState<SdmPersonRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SdmPersonRow | null>(null);
  const [form, setForm] = useState<SdmForm>(emptyForm());
  const [tab, setTab] = useState('pribadi');
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [accountGuruId, setAccountGuruId] = useState<string | null>(null);

  const canEdit = can(permissions, 'sdm.edit') || can(permissions, 'sdm.create');
  const canDelete = can(permissions, 'sdm.delete');
  const canImport = can(permissions, 'sdm.import');
  const canExport = can(permissions, 'sdm.export');
  const canViewAccount = can(permissions, 'sdm.view');
  const canEditAccount = can(permissions, 'sdm.edit');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sdmApi.list(type, { search: debouncedSearch, page, per_page: perPage });
    if (!error && data) {
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } else if (error) {
      setMsg({ type: 'err', text: error.message ?? 'Gagal memuat data.' });
    }
    setLoading(false);
  }, [type, debouncedSearch, page, perPage]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const flash = (t: 'ok' | 'err', text: string) => {
    setMsg({ type: t, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setTab('pribadi');
    setOpen(true);
  };

  const openEdit = (person: SdmPersonRow) => {
    setEditing(person);
    setForm(formFromPerson(person));
    setTab('pribadi');
    setOpen(true);
  };

  const setField = (key: keyof SdmForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((v) => ({ ...v, [key]: value }));
  };

  const setListField = (key: 'educations' | 'assignments' | 'certifications' | 'sk_pengangkatans', index: number, field: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((v) => {
      const rows = (v[key] as Record<string, string>[]).map((row, i) => (i === index ? { ...row, [field]: event.target.value } : row));
      return { ...v, [key]: rows };
    });
  };

  const setKgbField = (field: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((v) => ({ ...v, kgb: { ...v.kgb, [field]: event.target.value } }));
  };

  const removeListRow = (key: 'educations' | 'assignments' | 'certifications' | 'sk_pengangkatans', index: number) => {
    setForm((v) => ({ ...v, [key]: (v[key] as Record<string, string>[]).filter((_, i) => i !== index) }));
  };

  const addListRow = (key: 'educations' | 'assignments' | 'certifications' | 'sk_pengangkatans') => {
    const template: Record<string, string> =
      key === 'educations'
        ? { jenjang: '', jurusan: '', perguruan_tinggi: '', tahun_lulus: '', tempat: '', nomor_ijazah: '', tanggal_ijazah: '' }
        : key === 'assignments'
          ? { jenis: 'tugas_tambahan', uraian: '', jumlah_jam: '' }
          : key === 'certifications'
            ? { status: '', no_sertifikat: '', no_peserta: '', no_nrg: '', bidang_studi: '', penyelenggara: '', tahun_lulus: '' }
            : { kategori: 'awal_sekolah', nomor_sk: '', tanggal_sk: '', pejabat: '' };
    setForm((v) => ({ ...v, [key]: [...(v[key] as Record<string, string>[]), template] }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      flash('err', 'Nama wajib diisi.');
      return;
    }
    setSaving(true);
    const payload = formToPayload(form);
    if (editing?.id) {
      const r = await sdmApi.update(type, editing.id, payload);
      if (r.error) {
        flash('err', r.error.message ?? 'Gagal menyimpan data.');
        setSaving(false);
        return;
      }
      flash('ok', `Data ${form.name} berhasil diperbarui.`);
    } else {
      const r = await sdmApi.create(type, payload);
      if (r.error) {
        flash('err', r.error.message ?? 'Gagal membuat data.');
        setSaving(false);
        return;
      }
      flash('ok', `${form.name} berhasil ditambahkan.`);
    }
    setOpen(false);
    setSaving(false);
    await load();
  };

  const remove = async (person: SdmPersonRow) => {
    if (!person.id) return;
    if (!confirm(`Hapus data ${person.name}? Semua data pendidikan, tugas, sertifikasi, KGB dan SK ikut terhapus.`)) return;
    const r = await sdmApi.remove(type, person.id);
    if (r.error) {
      flash('err', r.error.message ?? 'Gagal menghapus data.');
      return;
    }
    flash('ok', `Data ${person.name} dihapus.`);
    if (detailId === person.id) setDetailId(null);
    await load();
  };

  const detailPerson = detailId ? items.find((i) => i.id === detailId) ?? null : null;
  const detailPersonId = detailPerson?.id ?? null;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Kelola data {SDM_TYPE_LABELS[type].toLowerCase()} beserta data kepegawaian, pendidikan, sertifikasi dan SK.</p>
        {!detailId && (
          <div className="flex flex-wrap gap-2">
            {canImport && (
              <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><Upload size={18} /> Import Excel</button>
            )}
            {canExport && (
              <a href={sdmApi.exportUrl(type)} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A]/30 px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><Download size={18} /> Export CSV</a>
            )}
            {canEdit && (
              <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Tambah</button>
            )}
          </div>
        )}
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      {detailId ? (
        detailPerson ? (
          <SdmDetail person={detailPerson} onBack={() => setDetailId(null)} onEdit={canEdit ? () => openEdit(detailPerson) : undefined} onDelete={canDelete ? () => remove(detailPerson) : undefined} onManageAccount={type === 'guru' && canViewAccount && detailPersonId ? () => setAccountGuruId(detailPersonId!) : undefined} />
        ) : (
          <div className="rounded-xl bg-white p-8 text-center text-[#5B7088] shadow-sm">
            Data tidak ditemukan.{' '}
            <button onClick={() => setDetailId(null)} className="font-semibold text-[#866D2C]">Kembali</button>
          </div>
        )
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / NIP / NUPTK / NIK..." className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm" />
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-4">{SDM_TYPE_LABELS[type]}</th>
                  <th className="p-4">NIP / NIPPPK</th>
                  <th className="p-4">NUPTK</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Pangkat / Gol</th>
                  <th className="p-4">Jabatan</th>
                  <th className="p-4">Aktif</th>
                  {type === 'guru' && canViewAccount && <th className="p-4">Akun Login</th>}
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!loading && items.length === 0 && <tr><td colSpan={type === 'guru' && canViewAccount ? 9 : 8} className="p-8 text-center text-[#5B7088]">Belum ada data {SDM_TYPE_LABELS[type].toLowerCase()}.</td></tr>}
                {items.map((person) => (
                  <tr key={person.id} className="border-t border-[#1B2A4A]/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {person.photo ? (
                          <img src={resolveImageUrl(person.photo)} alt={person.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FAF6F0]"><UserRound className="h-4 w-4 text-[#866D2C]" /></span>
                        )}
                        <div>
                          <p className="font-semibold">{person.name}</p>
                          {person.linked_account && <p className="text-xs text-[#5B7088]">terhubung akun</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{person.nip || person.nipppk || '-'}</td>
                    <td className="p-4 font-mono text-xs">{person.nuptk || '-'}</td>
                    <td className="p-4">{person.status_kepegawaian || '-'}</td>
                    <td className="p-4">{person.pangkat_golongan || '-'}</td>
                    <td className="p-4 max-w-[220px] truncate" title={person.jabatan ?? ''}>{person.jabatan || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${person.is_active !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {person.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {type === 'guru' && canViewAccount && (
                      <td className="p-4">
                        {person.linked_account ? (
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Terhubung</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Belum ada</span>
                        )}
                      </td>
                    )}
                    <td className="p-4 whitespace-nowrap">
                      <button onClick={() => { if (person.id) setDetailId(person.id); }} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><Eye size={15} /> Detail</button>
                      {type === 'guru' && canViewAccount && (
                        <button onClick={() => { if (person.id) setAccountGuruId(person.id); }} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><KeyRound size={15} /> Akun</button>
                      )}
                      {canEdit && (
                        <button onClick={() => openEdit(person)} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><Pencil size={15} /> Edit</button>
                      )}
                      {canDelete && <button onClick={() => remove(person)} className="text-red-600"><Trash2 size={16} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5B7088]">Total: {total} data</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-1.5 disabled:opacity-40">Prev</button>
                <span className="px-3 py-1.5 font-semibold">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#C8A951]" /></div>}

      {open && (
        <SdmFormModal
          type={type}
          editing={editing}
          form={form}
          tab={tab}
          setTab={setTab}
          setField={setField}
          setListField={setListField}
          setKgbField={setKgbField}
          onPhotoChange={(url) => setForm((v) => ({ ...v, photo: url }))}
          addListRow={addListRow}
          removeListRow={removeListRow}
          saving={saving}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        />
      )}

      {importOpen && <SdmImport type={type} onClose={() => setImportOpen(false)} onImported={() => { void load(); }} />}

      {accountGuruId && (
        <GuruAccountModal
          person={items.find((i) => i.id === accountGuruId) ?? null}
          canEdit={canEditAccount}
          onClose={() => setAccountGuruId(null)}
          onChanged={() => { void load(); }}
        />
      )}
    </div>
  );
}

function GuruAccountModal({ person, canEdit, onClose, onChanged }: { person: SdmPersonRow | null; canEdit: boolean; onClose: () => void; onChanged: () => void }) {
  const [account, setAccount] = useState<GuruAccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!person?.id) return;
    setLoading(true);
    const { data, error } = await sdmAccountApi.get(person.id);
    if (!error && data) {
      setAccount(data);
      setEmail(data.user?.email ?? '');
    }
    setLoading(false);
  }, [person?.id]);

  useEffect(() => { void load(); }, [load]);

  if (!person) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-6 text-center text-[#5B7088] shadow-xl">Data guru tidak ditemukan.</div>
      </div>
    );
  }

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const createAccount = async () => {
    if (!canEdit) return;
    setBusy(true);
    setMsg(null);
    setGeneratedPassword(null);
    const { data, error } = await sdmAccountApi.create(person.id!, {
      email: email.trim() || undefined,
      password: password || undefined,
    });
    setBusy(false);
    if (error) {
      flash('err', error.message ?? 'Gagal membuat akun.');
      return;
    }
    if (data?.generated_password) setGeneratedPassword(data.generated_password);
    setPassword('');
    await load();
    onChanged();
  };

  const resetPassword = async () => {
    if (!canEdit) return;
    if (!password.trim()) {
      flash('err', 'Password baru wajib diisi.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await sdmAccountApi.update(person.id!, { password });
    setBusy(false);
    if (error) {
      flash('err', error.message ?? 'Gagal mereset password.');
      return;
    }
    setPassword('');
    await load();
    onChanged();
    flash('ok', 'Password akun berhasil direset.');
  };

  const toggleStatus = async () => {
    if (!canEdit) return;
    const next = account?.user?.status === 'active' ? 'inactive' : 'active';
    setBusy(true);
    setMsg(null);
    const { error } = await sdmAccountApi.update(person.id!, { status: next });
    setBusy(false);
    if (error) {
      flash('err', error.message ?? 'Gagal mengubah status akun.');
      return;
    }
    await load();
    onChanged();
    flash('ok', next === 'active' ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.');
  };

  const unlink = async () => {
    if (!canEdit) return;
    if (!confirm(`Lepaskan akun login dari ${person.name}? Akun login beserta profil publiknya akan dihapus permanen. Data SDM tetap tersimpan dan dapat dibuatkan akun baru.`)) return;
    setBusy(true);
    setMsg(null);
    const { error } = await sdmAccountApi.remove(person.id!);
    setBusy(false);
    if (error) {
      flash('err', error.message ?? 'Gagal melepas akun.');
      return;
    }
    await load();
    onChanged();
    flash('ok', 'Akun berhasil dilepas.');
  };

  const identifiers = [person.nip, person.nipppk, person.nuptk].filter(Boolean).join(' • ');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Kelola Akun Login</h2>
            <p className="mt-1 text-sm text-[#5B7088]">{person.name}{identifiers ? ` — ${identifiers}` : ''}</p>
          </div>
          <button onClick={onClose}><X /></button>
        </div>

        {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

        {generatedPassword && (
          <div className="mb-4 rounded-lg border border-[#C8A951]/50 bg-[#FFF9E8] p-4">
            <p className="text-sm font-bold text-[#866D2C]">Akun berhasil dibuat! Berikan password ini kepada guru secara aman:</p>
            <p className="mt-2 rounded-lg bg-white p-3 text-center font-mono text-lg font-bold tracking-widest text-[#1B2A4A]">{generatedPassword}</p>
            <p className="mt-2 text-xs text-[#5B7088]">Password hanya ditampilkan sekali dan tidak dapat dilihat lagi.</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>
        ) : account?.linked ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#FAF6F0] p-4 text-sm">
              <RowValue label="Email Login" value={account.user?.email ?? '-'} mono />
              <RowValue label="Status" value={account.user?.status === 'active' ? 'Aktif' : 'Nonaktif'} />
              <RowValue label="Wajib Ganti Password" value={account.user?.must_change_password ? 'Ya' : 'Tidak'} />
              <RowValue label="Dibuat" value={account.user?.created_at ? new Date(account.user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
            </div>

            {canEdit && (
              <>
                <div>
                  <label className="block text-sm font-semibold">
                    Reset Password
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password baru (min. 6 karakter)"
                      className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal"
                    />
                  </label>
                  <button onClick={resetPassword} disabled={busy} className="mt-2 inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5 disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound size={16} />} Reset Password
                  </button>
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-[#1B2A4A]/10 pt-4">
                  <button onClick={toggleStatus} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#866D2C]/40 px-4 py-2 font-bold text-[#866D2C] hover:bg-[#C8A951]/10 disabled:opacity-50">
                    {account.user?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'} Akun
                  </button>
                  <button onClick={unlink} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border-2 border-red-200 px-4 py-2 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                    <Trash2 size={16} /> Lepas Akun
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#FAF6F0] p-3 text-sm text-[#5B7088]">
              Guru ini belum memiliki akun login. Setelah dibuat, guru dapat login menggunakan NIP / NUPTK / ID Guru dan email di bawah.
            </div>
            {canEdit ? (
              <>
                <label className="block text-sm font-semibold">
                  Email Login (opsional)
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={account?.identifier ? `Otomatis dibuat jika kosong` : 'cth. nama@sekolah.sch.id'}
                    className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Password (opsional)
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter — kosongkan untuk otomatis dibuat"
                    className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal"
                  />
                </label>
                <div className="flex justify-end">
                  <button onClick={createAccount} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Buat Akun
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#5B7088]">Anda tidak memiliki izin untuk mengelola akun login.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RowValue({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#1B2A4A]/5 py-1.5 last:border-0">
      <span className="text-[#5B7088]">{label}</span>
      <span className={`font-semibold text-[#1B2A4A] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function SdmDetail({ person, onBack, onEdit, onDelete, onManageAccount }: { person: SdmPersonRow; onBack: () => void; onEdit?: () => void; onDelete?: () => void; onManageAccount?: () => void }) {
  const [tab, setTab] = useState('pribadi');

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A4A]/10 p-6">
        <div className="flex items-center gap-4">
          {person.photo ? (
            <img src={resolveImageUrl(person.photo)} alt={person.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[#FAF6F0]"><UserRound className="h-8 w-8 text-[#866D2C]" /></span>
          )}
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">{person.name}</h2>
            <p className="mt-1 text-sm text-[#5B7088]">{person.jabatan || 'Belum ada jabatan'}{person.linked_account ? ' — terhubung akun login' : ''}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onManageAccount && <button onClick={onManageAccount} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#C8A951]/60 px-4 py-2 font-bold text-[#866D2C] hover:bg-[#C8A951]/10"><KeyRound size={16} /> Kelola Akun</button>}
          {onEdit && <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Pencil size={16} /> Edit</button>}
          {onDelete && <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg border-2 border-red-200 px-4 py-2 font-bold text-red-600 hover:bg-red-50"><Trash2 size={16} /> Hapus</button>}
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><ArrowLeft size={16} /> Kembali</button>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#1B2A4A]/10 px-6 py-3">
        {TAB_DEFS.map((t, i) => (
          <Fragment key={t.id}>
            {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-[#5B7088]/40" />}
            <button
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${tab === t.id ? 'bg-[#1B2A4A] text-white' : 'bg-[#FAF6F0] text-[#5B7088] hover:bg-[#1B2A4A]/10'}`}
            >
              {t.label}
            </button>
          </Fragment>
        ))}
      </div>

      <div className="p-6">
        {tab === 'pribadi' && (
          <div className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            <Row label="Nama Lengkap" value={person.name} />
            <Row label="NIP" value={person.nip} />
            <Row label="NIPPPK" value={person.nipppk} />
            <Row label="NUPTK" value={person.nuptk} />
            <Row label="Jenis Kelamin" value={person.gender} />
            <Row label="Agama" value={person.religion} />
            <Row label="Tempat Lahir" value={person.birth_place} />
            <Row label="Tanggal Lahir" value={fmtDate(person.birth_date)} />
            <Row label="NIK" value={person.nik} />
          </div>
        )}
        {tab === 'kepegawaian' && (
          <div className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            <Row label="Status Kepegawaian" value={person.status_kepegawaian} />
            <Row label="Pangkat / Golongan" value={person.pangkat_golongan} />
            <Row label="Jabatan" value={person.jabatan} />
            <Row label="TMT Golongan" value={fmtDate(person.tmt_golongan)} />
            <Row label="TMT CPNS" value={fmtDate(person.tmt_cpns)} />
            <Row label="TMT PNS / PPPK" value={fmtDate(person.tmt_pns_pppk)} />
            <Row label="TMT SK Sekolah" value={fmtDate(person.tmt_sk_sekolah)} />
          </div>
        )}
        {tab === 'kontak' && (
          <div className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            <Row label="Alamat" value={person.address} wide />
            <Row label="No. HP" value={person.phone} />
            <Row label="Email" value={person.email} />
            <Row label="NPWP" value={person.npwp} />
            <Row label="No. Akta Lahir" value={person.akta_lahir} />
            <Row label="No. BPJS" value={person.bpjs} />
          </div>
        )}
        {tab === 'sosmed' && (
          <div className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            <Row label="Instagram" value={person.instagram} />
            <Row label="Facebook" value={person.facebook} />
            <Row label="X / Twitter" value={person.twitter} />
            <Row label="TikTok" value={person.tiktok} />
            <Row label="YouTube" value={person.youtube} />
            <Row label="LinkedIn" value={person.linkedin} />
            <Row label="Website" value={person.website} />
            <Row label="GitHub" value={person.github} />
          </div>
        )}
        {tab === 'pendidikan' && (
          <ListTable
            columns={['Jenjang', 'Jurusan', 'Perguruan Tinggi', 'Tahun', 'Nomor Ijazah']}
            rows={(person.educations ?? []).map((e) => [e.jenjang, e.jurusan, e.perguruan_tinggi, e.tahun_lulus != null ? String(e.tahun_lulus) : '', e.nomor_ijazah])}
          />
        )}
        {tab === 'tugas' && (
          <ListTable
            columns={['Jenis', 'Uraian', 'Jumlah Jam']}
            rows={(person.assignments ?? []).map((a) => [a.jenis === 'tugas_mengajar' ? 'Tugas Pokok / Mengajar' : 'Tugas Tambahan', a.uraian, a.jumlah_jam])}
          />
        )}
        {tab === 'sertifikasi' && (
          <ListTable
            columns={['Status', 'No. Sertifikat', 'Bidang Studi', 'Penyelenggara', 'Tahun']}
            rows={(person.certifications ?? []).map((c) => [c.status, c.no_sertifikat, c.bidang_studi, c.penyelenggara, c.tahun_lulus != null ? String(c.tahun_lulus) : ''])}
          />
        )}
        {tab === 'kgb' && (
          person.kgb ? (
            <div className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
              <Row label="No. SK" value={person.kgb.no_sk} />
              <Row label="Tanggal SK" value={fmtDate(person.kgb.tanggal_sk)} />
              <Row label="Gaji Pokok" value={person.kgb.gaji_pokok} />
              <Row label="MKG" value={person.kgb.mkg} />
              <Row label="TMT KGB Akhir" value={fmtDate(person.kgb.tmt_kgb_akhir)} />
              <Row label="TMT KGB Berikutnya" value={fmtDate(person.kgb.tmt_kgb_berikutnya)} />
            </div>
          ) : (
            <p className="text-sm text-[#5B7088]">Belum ada data KGB.</p>
          )
        )}
        {tab === 'sk' && (
          <ListTable
            columns={['Kategori', 'Nomor SK', 'Tanggal', 'Pejabat']}
            rows={(person.sk_pengangkatans ?? []).map((sk) => [SK_KATEGORI_LABELS[sk.kategori] ?? sk.kategori, sk.nomor_sk, fmtDate(sk.tanggal_sk), sk.pejabat])}
          />
        )}
      </div>
    </div>
  );
}

function Row({ label, value, wide }: { label: string; value: unknown; wide?: boolean }) {
  const display = value === null || value === undefined || value === '' ? '-' : String(value);
  return (
    <div className={wide ? 'sm:col-span-2 flex gap-2' : 'flex gap-2'}>
      <dt className="w-40 shrink-0 font-medium text-[#5B7088]">{label}</dt>
      <dd className="font-semibold text-[#1B2A4A]">{display}</dd>
    </div>
  );
}

function ListTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-[#5B7088]">Belum ada data.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-[#1B2A4A]/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
          <tr>{columns.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#1B2A4A]/10">
              {row.map((cell, j) => <td key={j} className="max-w-xs p-3">{cell || '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SdmFormModalProps {
  type: SdmType;
  editing: SdmPersonRow | null;
  form: SdmForm;
  tab: string;
  setTab: (tab: string) => void;
  setField: (key: keyof SdmForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setListField: (key: 'educations' | 'assignments' | 'certifications' | 'sk_pengangkatans', index: number, field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setKgbField: (field: string) => (e: ChangeEvent<HTMLInputElement>) => void;
  onPhotoChange: (url: string) => void;
  addListRow: (key: 'educations' | 'assignments' | 'certifications' | 'sk_pengangkatans') => void;
  removeListRow: (key: 'educations' | 'assignments' | 'certifications' | 'sk_pengangkatans', index: number) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function SdmFormModal({ type, editing, form, tab, setTab, setField, setListField, setKgbField, onPhotoChange, addListRow, removeListRow, saving, onClose, onSubmit }: SdmFormModalProps) {
  const inputCls = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-normal';
  const btnRemove = 'text-red-600 hover:text-red-800';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">{editing ? `Edit Data ${SDM_TYPE_LABELS[type]}` : `Tambah ${SDM_TYPE_LABELS[type]}`}</h2>
            <p className="mt-1 text-sm text-[#5B7088]">{editing ? editing.name : 'Lengkapi data sesuai struktur kepegawaian sekolah.'}</p>
          </div>
          <button type="button" onClick={onClose}><X /></button>
        </div>

        <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
          {TAB_DEFS.map((t, i) => (
            <Fragment key={t.id}>
              {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-[#5B7088]/40" />}
              <button type="button" onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${tab === t.id ? 'bg-[#1B2A4A] text-white' : 'bg-[#FAF6F0] text-[#5B7088] hover:bg-[#1B2A4A]/10'}`}>{t.label}</button>
            </Fragment>
          ))}
        </div>

        <div className="rounded-xl border border-[#1B2A4A]/10 p-4">
          {tab === 'pribadi' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ImageField label="Foto (opsional)" value={form.photo} onChange={onPhotoChange} accept="image/jpeg,image/png" maxSizeMb={2} hint="JPG/PNG maks. 2 MB, direkomendasikan persegi (1:1)." />
              </div>
              <Field label="Nama Lengkap *"><input className={inputCls} value={form.name} onChange={setField('name')} /></Field>
              <Field label="NIP"><input className={inputCls} value={form.nip} onChange={setField('nip')} placeholder="18 digit" /></Field>
              <Field label="NIPPPK"><input className={inputCls} value={form.nipppk} onChange={setField('nipppk')} placeholder="18 digit" /></Field>
              <Field label="NUPTK"><input className={inputCls} value={form.nuptk} onChange={setField('nuptk')} /></Field>
              <Field label="Jenis Kelamin">
                <select className={inputCls} value={form.gender} onChange={setField('gender')}>
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </Field>
              <Field label="Agama"><input className={inputCls} value={form.religion} onChange={setField('religion')} /></Field>
              <Field label="Tempat Lahir"><input className={inputCls} value={form.birth_place} onChange={setField('birth_place')} /></Field>
              <Field label="Tanggal Lahir"><input type="date" className={inputCls} value={form.birth_date} onChange={setField('birth_date')} /></Field>
              <Field label="NIK"><input className={inputCls} value={form.nik} onChange={setField('nik')} /></Field>
            </div>
          )}

          {tab === 'kepegawaian' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status Kepegawaian">
                <select className={inputCls} value={form.status_kepegawaian} onChange={setField('status_kepegawaian')}>
                  <option value="">Pilih</option>
                  {['PNS', 'PPPK', 'Honorer Sekolah', 'Honorer Daerah', 'GTT', 'PTT'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Pangkat / Golongan"><input className={inputCls} value={form.pangkat_golongan} onChange={setField('pangkat_golongan')} placeholder="cth. Pembina Tk. I / IV/b" /></Field>
              <Field label="Jabatan"><input className={inputCls} value={form.jabatan} onChange={setField('jabatan')} /></Field>
              <Field label="TMT Golongan"><input type="date" className={inputCls} value={form.tmt_golongan} onChange={setField('tmt_golongan')} /></Field>
              <Field label="TMT CPNS"><input type="date" className={inputCls} value={form.tmt_cpns} onChange={setField('tmt_cpns')} /></Field>
              <Field label="TMT PNS / PPPK"><input type="date" className={inputCls} value={form.tmt_pns_pppk} onChange={setField('tmt_pns_pppk')} /></Field>
              <Field label="TMT SK Sekolah"><input type="date" className={inputCls} value={form.tmt_sk_sekolah} onChange={setField('tmt_sk_sekolah')} /></Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.is_active} onChange={setField('is_active')} className="h-4 w-4" /> Aktif ditampilkan
              </label>
            </div>
          )}

          {tab === 'kontak' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Alamat" wide><textarea className={inputCls} rows={3} value={form.address} onChange={setField('address')} /></Field>
              <Field label="No. HP"><input className={inputCls} value={form.phone} onChange={setField('phone')} /></Field>
              <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={setField('email')} /></Field>
              <Field label="NPWP"><input className={inputCls} value={form.npwp} onChange={setField('npwp')} /></Field>
              <Field label="No. Akta Lahir"><input className={inputCls} value={form.akta_lahir} onChange={setField('akta_lahir')} /></Field>
              <Field label="No. BPJS"><input className={inputCls} value={form.bpjs} onChange={setField('bpjs')} /></Field>
              <Field label="Profil Singkat" wide><textarea className={inputCls} rows={3} value={form.bio} onChange={setField('bio')} /></Field>
            </div>
          )}

          {tab === 'sosmed' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instagram" wide><input className={inputCls} value={form.instagram} onChange={setField('instagram')} placeholder="username atau URL" /></Field>
              <Field label="Facebook" wide><input className={inputCls} value={form.facebook} onChange={setField('facebook')} placeholder="username atau URL" /></Field>
              <Field label="X / Twitter" wide><input className={inputCls} value={form.twitter} onChange={setField('twitter')} placeholder="username atau URL" /></Field>
              <Field label="TikTok" wide><input className={inputCls} value={form.tiktok} onChange={setField('tiktok')} placeholder="username atau URL" /></Field>
              <Field label="YouTube" wide><input className={inputCls} value={form.youtube} onChange={setField('youtube')} placeholder="URL" /></Field>
              <Field label="LinkedIn" wide><input className={inputCls} value={form.linkedin} onChange={setField('linkedin')} placeholder="username atau URL" /></Field>
              <Field label="Website" wide><input className={inputCls} value={form.website} onChange={setField('website')} placeholder="URL" /></Field>
              <Field label="GitHub" wide><input className={inputCls} value={form.github} onChange={setField('github')} placeholder="username atau URL" /></Field>
              <p className="sm:col-span-2 text-xs text-[#5B7088]">Cukup isi username tanpa tanda @. Akan tampil sebagai ikon media sosial di profil publik.</p>
            </div>
          )}

          {tab === 'pendidikan' && (
            <div className="space-y-3">
              {form.educations.map((edu, i) => (
                <div key={i} className="rounded-lg border border-[#1B2A4A]/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold">Pendidikan #{i + 1}</p>
                    <button type="button" onClick={() => removeListRow('educations', i)} className={btnRemove}><Trash2 size={15} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Jenjang"><select className={inputCls} value={edu.jenjang} onChange={setListField('educations', i, 'jenjang')}><option value="">Pilih</option>{['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'S3'].map((j) => <option key={j} value={j}>{j}</option>)}</select></Field>
                    <Field label="Jurusan"><input className={inputCls} value={edu.jurusan} onChange={setListField('educations', i, 'jurusan')} /></Field>
                    <Field label="Perguruan Tinggi / Sekolah"><input className={inputCls} value={edu.perguruan_tinggi} onChange={setListField('educations', i, 'perguruan_tinggi')} /></Field>
                    <Field label="Tahun Lulus"><input className={inputCls} value={edu.tahun_lulus} onChange={setListField('educations', i, 'tahun_lulus')} /></Field>
                    <Field label="Tempat"><input className={inputCls} value={edu.tempat} onChange={setListField('educations', i, 'tempat')} /></Field>
                    <Field label="Nomor Ijazah"><input className={inputCls} value={edu.nomor_ijazah} onChange={setListField('educations', i, 'nomor_ijazah')} /></Field>
                    <Field label="Tanggal Ijazah"><input type="date" className={inputCls} value={edu.tanggal_ijazah} onChange={setListField('educations', i, 'tanggal_ijazah')} /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addListRow('educations')} className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#1B2A4A]/30 px-4 py-2 text-sm font-bold text-[#866D2C] hover:border-[#C8A951]"><Plus size={16} /> Tambah Pendidikan</button>
            </div>
          )}

          {tab === 'tugas' && (
            <div className="space-y-3">
              {form.assignments.map((a, i) => (
                <div key={i} className="rounded-lg border border-[#1B2A4A]/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold">Tugas #{i + 1}</p>
                    <button type="button" onClick={() => removeListRow('assignments', i)} className={btnRemove}><Trash2 size={15} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Jenis">
                      <select className={inputCls} value={a.jenis} onChange={setListField('assignments', i, 'jenis')}>
                        <option value="tugas_tambahan">Tugas Tambahan</option>
                        <option value="tugas_mengajar">Tugas Pokok / Mengajar</option>
                      </select>
                    </Field>
                    <Field label="Uraian"><input className={inputCls} value={a.uraian} onChange={setListField('assignments', i, 'uraian')} /></Field>
                    <Field label="Jumlah Jam"><input className={inputCls} value={a.jumlah_jam} onChange={setListField('assignments', i, 'jumlah_jam')} /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addListRow('assignments')} className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#1B2A4A]/30 px-4 py-2 text-sm font-bold text-[#866D2C] hover:border-[#C8A951]"><Plus size={16} /> Tambah Tugas</button>
            </div>
          )}

          {tab === 'sertifikasi' && (
            <div className="space-y-3">
              {form.certifications.map((c, i) => (
                <div key={i} className="rounded-lg border border-[#1B2A4A]/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold">Sertifikasi #{i + 1}</p>
                    <button type="button" onClick={() => removeListRow('certifications', i)} className={btnRemove}><Trash2 size={15} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Status">
                      <select className={inputCls} value={c.status} onChange={setListField('certifications', i, 'status')}>
                        <option value="">Pilih</option>
                        <option value="SUDAH">Sudah</option>
                        <option value="BELUM">Belum</option>
                      </select>
                    </Field>
                    <Field label="No. Sertifikat"><input className={inputCls} value={c.no_sertifikat} onChange={setListField('certifications', i, 'no_sertifikat')} /></Field>
                    <Field label="No. Peserta"><input className={inputCls} value={c.no_peserta} onChange={setListField('certifications', i, 'no_peserta')} /></Field>
                    <Field label="No. NRG"><input className={inputCls} value={c.no_nrg} onChange={setListField('certifications', i, 'no_nrg')} /></Field>
                    <Field label="Bidang Studi"><input className={inputCls} value={c.bidang_studi} onChange={setListField('certifications', i, 'bidang_studi')} /></Field>
                    <Field label="Penyelenggara"><input className={inputCls} value={c.penyelenggara} onChange={setListField('certifications', i, 'penyelenggara')} /></Field>
                    <Field label="Tahun Lulus"><input className={inputCls} value={c.tahun_lulus} onChange={setListField('certifications', i, 'tahun_lulus')} /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addListRow('certifications')} className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#1B2A4A]/30 px-4 py-2 text-sm font-bold text-[#866D2C] hover:border-[#C8A951]"><Plus size={16} /> Tambah Sertifikasi</button>
            </div>
          )}

          {tab === 'kgb' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="No. SK KGB"><input className={inputCls} value={form.kgb.no_sk ?? ''} onChange={setKgbField('no_sk')} /></Field>
              <Field label="Tanggal SK"><input type="date" className={inputCls} value={form.kgb.tanggal_sk ?? ''} onChange={setKgbField('tanggal_sk')} /></Field>
              <Field label="Gaji Pokok"><input className={inputCls} value={form.kgb.gaji_pokok ?? ''} onChange={setKgbField('gaji_pokok')} /></Field>
              <Field label="MKG"><input className={inputCls} value={form.kgb.mkg ?? ''} onChange={setKgbField('mkg')} /></Field>
              <Field label="TMT KGB Akhir"><input type="date" className={inputCls} value={form.kgb.tmt_kgb_akhir ?? ''} onChange={setKgbField('tmt_kgb_akhir')} /></Field>
              <Field label="TMT KGB Berikutnya"><input type="date" className={inputCls} value={form.kgb.tmt_kgb_berikutnya ?? ''} onChange={setKgbField('tmt_kgb_berikutnya')} /></Field>
            </div>
          )}

          {tab === 'sk' && (
            <div className="space-y-3">
              {form.sk_pengangkatans.map((sk, i) => (
                <div key={i} className="rounded-lg border border-[#1B2A4A]/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold">SK Pengangkatan #{i + 1}</p>
                    <button type="button" onClick={() => removeListRow('sk_pengangkatans', i)} className={btnRemove}><Trash2 size={15} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Kategori">
                      <select className={inputCls} value={sk.kategori} onChange={setListField('sk_pengangkatans', i, 'kategori')}>
                        {SK_KATEGORI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Nomor SK"><input className={inputCls} value={sk.nomor_sk} onChange={setListField('sk_pengangkatans', i, 'nomor_sk')} /></Field>
                    <Field label="Tanggal SK"><input type="date" className={inputCls} value={sk.tanggal_sk} onChange={setListField('sk_pengangkatans', i, 'tanggal_sk')} /></Field>
                    <Field label="Pejabat" wide><input className={inputCls} value={sk.pejabat} onChange={setListField('sk_pengangkatans', i, 'pejabat')} /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addListRow('sk_pengangkatans')} className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#1B2A4A]/30 px-4 py-2 text-sm font-bold text-[#866D2C] hover:border-[#C8A951]"><Plus size={16} /> Tambah SK Pengangkatan</button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[#5B7088]">Batal</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2 font-bold text-white disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm font-semibold ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}