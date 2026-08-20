import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { ChevronRight, Plus, Trash2, X, Loader2, KeyRound, Search, UserRound, Upload, Pencil, Eye, ArrowLeft, Download } from 'lucide-react';
import { accountsApi, downloadApiFile, resolveImageUrl } from '../../lib/api';
import StudentImportModal from './StudentImportModal';
import ImageField from './ImageField';
import { BIODATA_FIELDS, BIODATA_SECTIONS, emptyBiodata, formatRupiah, isRupiahField, isValidClass, normalizeClass, normalizeGender } from '../../lib/studentBiodata';
import type { BiodataFieldDef } from '../../lib/studentBiodata';

interface StudentRow {
  id: string;
  nisn: string;
  nis?: string;
  pin?: string;
  name: string;
  class: string;
  major: string;
  gender?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  religion?: string;
  address?: string;
  foto?: string;
  doc_kk?: string;
  doc_akta?: string;
  doc_ijazah?: string;
  doc_lainnya?: string;
  [key: string]: unknown;
}

const dateForInput = (value: unknown): string => (typeof value === 'string' ? value.slice(0, 10) : '');

function initFormFrom(student: StudentRow | null): Record<string, string> {
  const form = emptyBiodata();
  if (!student) return form;
  for (const field of BIODATA_FIELDS) {
    const raw = student[field.key];
    if (raw === null || raw === undefined) continue;
    if (field.type === 'date') form[field.key] = dateForInput(raw);
    else if (field.type === 'decimal') form[field.key] = trimDecimal(String(raw));
    else form[field.key] = String(raw);
  }
  form.nisn = String(student.nisn ?? '');
  form.nis = String(student.nis ?? '');
  form.name = String(student.name ?? '');
  const normalizedClass = normalizeClass(student.class);
  form.class = isValidClass(normalizedClass) ? normalizedClass : '';
  form.major = String(student.major ?? '');
  form.gender = String(student.gender ?? '');
  form.date_of_birth = dateForInput(student.date_of_birth);
  form.place_of_birth = String(student.place_of_birth ?? '');
  form.religion = String(student.religion ?? '');
  form.address = String(student.address ?? '');
  form.pin = '';
  form.foto = String(student.foto ?? '');
  form.doc_kk = String(student.doc_kk ?? '');
  form.doc_akta = String(student.doc_akta ?? '');
  form.doc_ijazah = String(student.doc_ijazah ?? '');
  form.doc_lainnya = String(student.doc_lainnya ?? '');
  return form;
}

export default function StudentsManagement() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(emptyBiodata());
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const totalSteps = BIODATA_SECTIONS.length;

  const load = useCallback(async () => {
    const { data, error } = await accountsApi.list({ role: 'student' });
    if (!error && data) setStudents(data as StudentRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const filtered = students.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || String(s.nisn ?? '').toLowerCase().includes(search.toLowerCase()) || (s.nis ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const detailStudent = detailId ? students.find((s) => s.id === detailId) ?? null : null;

  const openCreate = () => {
    setEditing(null);
    const fresh = emptyBiodata();
    fresh.foto = '';
    fresh.doc_kk = '';
    fresh.doc_akta = '';
    fresh.doc_ijazah = '';
    fresh.doc_lainnya = '';
    setForm(fresh);
    setStep(1);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (student: StudentRow) => {
    setEditing(student);
    setForm(initFormFrom(student));
    setStep(1);
    setErrors({});
    setOpen(true);
  };

  const setValue = (key: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((v) => ({ ...v, [key]: event.target.value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = (current: Record<string, string>, stepIdx: number): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    const section = BIODATA_SECTIONS[stepIdx - 1];
    const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);

    if (stepIdx === 1) {
      const nisn = current.nisn.trim();
      const name = current.name.trim();
      const pin = current.pin.trim();
      if (!nisn) fieldErrors.nisn = 'NISN wajib diisi.';
      else if (nisn.length < 4) fieldErrors.nisn = 'NISN minimal 4 karakter.';
      if (!name) fieldErrors.name = 'Nama wajib diisi.';
      if (!editing && pin.length < 4) fieldErrors.pin = 'PIN minimal 4 karakter.';
      if (editing && pin !== '' && pin.length < 4) fieldErrors.pin = 'PIN minimal 4 karakter.';
    }

    for (const f of fields) {
      const value = (current[f.key] ?? '').trim();
      if (!value) continue;
      if ((f.type === 'number' || f.type === 'decimal') && !/^\d+(\.\d+)?$/.test(value)) fieldErrors[f.key] = 'Harus berupa angka.';
      if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) fieldErrors[f.key] = 'Tanggal tidak valid.';
    }

    return fieldErrors;
  };

  const goNext = () => {
    const fieldErrors = validateStep(form, step);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    const next = Math.min(step + 1, totalSteps);
    setStep(next);
    setErrors({});
  };

  const goBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const goSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const jumpTo = (target: number) => {
    if (target >= 1 && target <= totalSteps) {
      setStep(target);
      setErrors({});
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMsg(null);

    const currentErrors = validateStep(form, step);
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      setSaving(false);
      return;
    }

    const nisn = form.nisn.trim();
    const name = form.name.trim();
    const pin = form.pin.trim();

    if (!nisn || !name) {
      flash('err', 'NISN dan nama wajib diisi.');
      setSaving(false);
      return;
    }
    if (!editing && pin.length < 4) {
      flash('err', 'PIN minimal 4 karakter.');
      setSaving(false);
      return;
    }
    if (editing && pin !== '' && pin.length < 4) {
      flash('err', 'PIN minimal 4 karakter.');
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = { role: 'student', nisn, name };
    for (const field of BIODATA_FIELDS) {
      if (field.key === 'nisn' || field.key === 'name') continue;
      let value = (form[field.key] ?? '').trim();
      if (field.key === 'gender') value = normalizeGender(value) || form.gender;
      payload[field.key] = value;
    }
    payload.achievements = [];
    payload.foto = form.foto ?? '';
    payload.doc_kk = form.doc_kk ?? '';
    payload.doc_akta = form.doc_akta ?? '';
    payload.doc_ijazah = form.doc_ijazah ?? '';
    payload.doc_lainnya = form.doc_lainnya ?? '';

    if (editing) {
      if (pin) payload.pin = pin;
      const r = await accountsApi.update(editing.id, payload);
      if (r.error) {
        flash('err', r.error.message ?? 'Gagal memperbarui siswa.');
        setSaving(false);
        return;
      }
      setOpen(false);
      await load();
      flash('ok', `Data siswa ${name} berhasil diperbarui.`);
      setStep(1);
      setErrors({});
      setSaving(false);
      return;
    }

    payload.pin = pin;
    const r = await accountsApi.create(payload);
    if (r.error) {
      flash('err', r.error.message ?? 'Gagal membuat akun siswa.');
      setSaving(false);
      return;
    }
    setForm(emptyBiodata());
    setOpen(false);
    await load();
    flash('ok', `Akun siswa ${name} berhasil dibuat. Login siswa: NISN + PIN.`);
    setStep(1);
    setErrors({});
    setSaving(false);
  };

  const resetPin = async (student: StudentRow) => {
    const newPin = prompt(`Reset PIN untuk ${student.name} (NISN ${student.nisn}):\nMasukkan PIN baru (minimal 4 karakter).`);
    if (newPin === null) return;
    if (newPin.length < 4) {
      flash('err', 'PIN minimal 4 karakter.');
      return;
    }
    const r = await accountsApi.update(student.id, { pin: newPin });
    if (r.error) { flash('err', String(r.error.message ?? 'Gagal mereset PIN.')); return; }
    flash('ok', `PIN siswa ${student.name} berhasil direset.`);
  };

  const removeStudent = async (student: StudentRow) => {
    if (!confirm(`Hapus akun ${student.name}? Akun login siswa akan ikut terhapus.`)) return;
    const r = await accountsApi.remove(student.id);
    if (r.error) { flash('err', String(r.error.message ?? 'Gagal menghapus siswa.')); return; }
    await load();
    flash('ok', 'Akun siswa dihapus.');
  };

  const exportExcel = async () => {
    if (filtered.length === 0) {
      flash('err', 'Tidak ada data siswa untuk diexport.');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const headers = ['PIN Login', ...BIODATA_FIELDS.map((f) => f.label)];
      const rows = filtered.map((s) => [
        s.pin ?? '',
        ...BIODATA_FIELDS.map((f) => {
          const raw = s[f.key];
          if (raw === null || raw === undefined || raw === '') return '';
          if (f.key === 'gender') return genderLabel(String(raw));
          if (f.type === 'date') return dateForInput(raw);
          return String(raw);
        }),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 12) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
      XLSX.writeFile(wb, `data-siswa-${new Date().toISOString().slice(0, 10)}.xlsx`);
      flash('ok', `Export ${filtered.length} siswa berhasil.`);
    } catch {
      flash('err', 'Gagal membuat file Excel.');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Buat dan kelola akun siswa untuk Mading (login NISN + PIN) beserta data BIODATA lengkap.</p>
        {!detailId && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void exportExcel()} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><Download size={18} /> Export Excel</button>
            <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><Upload size={18} /> Import Excel</button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Tambah Siswa</button>
          </div>
        )}
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      {detailId ? (
        detailStudent ? (
          <StudentDetailView
            student={detailStudent}
            onBack={() => setDetailId(null)}
            onEdit={() => openEdit(detailStudent)}
            flash={flash}
          />
        ) : (
          <div className="rounded-xl bg-white p-8 text-center text-[#5B7088] shadow-sm">
            Data siswa tidak ditemukan.{' '}
            <button onClick={() => setDetailId(null)} className="font-semibold text-[#866D2C]">Kembali ke Data Siswa</button>
          </div>
        )
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / NISN..." className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm" />
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-4">Siswa</th>
                  <th className="p-4">NISN</th>
                  <th className="p-4">NIS</th>
                  <th className="p-4">PIN Login</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Jurusan</th>
                  <th className="p-4">Jenis Kelamin</th>
                  <th className="p-4">Tanggal Lahir</th>
                  <th className="p-4">Tempat Lahir</th>
                  <th className="p-4">Agama</th>
                  <th className="p-4">Alamat</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={12} className="p-8 text-center text-[#5B7088]">Belum ada siswa terdaftar.</td></tr>}
                {filtered.map((student) => (
                  <tr key={student.id} className="border-t border-[#1B2A4A]/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {student.foto ? (
                          <img src={resolveImageUrl(student.foto)} alt={student.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FAF6F0]"><UserRound className="h-4 w-4 text-[#866D2C]" /></span>
                        )}
                        <span className="font-semibold">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{student.nisn}</td>
                    <td className="p-4 font-mono text-xs">{student.nis || '-'}</td>
                    <td className="p-4 font-mono text-xs">{student.pin || '-'}</td>
                    <td className="p-4">{student.class || '-'}</td>
                    <td className="p-4">{student.major || '-'}</td>
                    <td className="p-4">{genderLabel(student.gender)}</td>
                    <td className="p-4 whitespace-nowrap">{formatDate(student.date_of_birth)}</td>
                    <td className="p-4">{student.place_of_birth || '-'}</td>
                    <td className="p-4">{student.religion || '-'}</td>
                    <td className="p-4 max-w-[200px] truncate" title={String(student.address ?? '')}>{student.address || '-'}</td>
                    <td className="p-4 whitespace-nowrap">
                      <button onClick={() => setDetailId(student.id)} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><Eye size={15} /> Detail</button>
                      <button onClick={() => openEdit(student)} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><Pencil size={15} /> Edit</button>
                      <button onClick={() => resetPin(student)} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><KeyRound size={15} /> Reset PIN</button>
                      <button onClick={() => removeStudent(student)} className="text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form ref={formRef} onSubmit={submit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex justify-between">
              <h2 className="text-xl font-bold text-[#1B2A4A]">{editing ? 'Edit Data Siswa' : 'Tambah Akun Siswa'}</h2>
              <button type="button" onClick={() => setOpen(false)}><X /></button>
            </div>

            <p className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
              {editing
                ? 'Perbarui data siswa mengikuti format BIODATA PESERTA DIDIK BARU. Jika mengubah NISN, akun login ikut diperbarui. Kosongkan PIN jika tidak ingin mengganti PIN.'
                : <>Siswa login ke Mading menggunakan <strong>NISN sebagai identitas</strong> dan <strong>PIN sebagai autentikasi</strong>. PIN disimpan terenkripsi.</>}
            </p>

            <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
              {BIODATA_SECTIONS.map((section, i) => {
                const n = i + 1;
                const active = n === step;
                const done = n < step;
                return (
                  <Fragment key={section.id}>
                    {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-[#5B7088]/40" />}
                    <button
                      type="button"
                      onClick={() => jumpTo(n)}
                      title={section.title}
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        active ? 'bg-[#1B2A4A] text-white'
                          : done ? 'bg-[#C8A951] text-[#1B2A4A] hover:opacity-80'
                            : 'bg-[#FAF6F0] text-[#5B7088] hover:bg-[#1B2A4A]/10'
                      }`}
                    >
                      {n}. {stepShortLabel(section.title)}
                    </button>
                  </Fragment>
                );
              })}
            </div>

            {(() => {
              const section = BIODATA_SECTIONS[step - 1];
              const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);
              return (
                <div key={section.id} className="rounded-xl border border-[#1B2A4A]/10 p-4">
                  <p className="mb-3 font-bold text-[#1B2A4A]">{section.title}</p>
                  <div
                    className="grid gap-4 sm:grid-cols-2"
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' || (e.target as HTMLElement).tagName !== 'INPUT') return;
                      e.preventDefault();
                      const grid = e.currentTarget;
                      const inputs = Array.from(grid.querySelectorAll('input')) as HTMLInputElement[];
                      const target = e.target as HTMLInputElement;
                      const idx = inputs.indexOf(target);
                      const next = idx >= 0 ? inputs[idx + 1] : undefined;
                      if (next) next.focus();
                      else if (step < totalSteps) goNext();
                      else goSubmit();
                    }}
                  >
                    {section.id === 'identity' && (
                      <BiodataField field={{ key: 'pin', label: editing ? 'PIN Baru (opsional, min. 4 karakter)' : 'PIN Siswa (min. 4 karakter)', section: 'identity', type: 'number' }} value={form.pin} onChange={setValue('pin')} placeholder={editing ? 'Kosongkan jika tidak diubah' : 'cth. 1234'} error={errors.pin} />
                    )}
                    {section.id === 'identity' && (
                      <div className="sm:col-span-2">
                        <ImageField label="Foto Siswa (opsional)" value={form.foto ?? ''} onChange={(url) => { setForm((v) => ({ ...v, foto: url })); if (url) setErrors((p) => { if (!p.foto) return p; const n = { ...p }; delete n.foto; return n; }); }} accept="image/jpeg,image/png" maxSizeMb={2} hint="JPG/JPEG atau PNG, maks. 2 MB, direkomendasikan persegi (1:1)." />
                        <div className="mt-4 rounded-xl border border-[#1B2A4A]/10 p-4">
                          <p className="mb-3 font-bold text-[#1B2A4A]">DOKUMEN SISWA</p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <ImageField label="KK (Kartu Keluarga) — opsional" value={form.doc_kk ?? ''} onChange={(url) => setForm((v) => ({ ...v, doc_kk: url }))} bucket="student/documents" accept="image/jpeg,image/png,image/webp" maxSizeMb={5} hint="JPG/PNG/WEBP, maks. 5 MB." />
                            <ImageField label="Akta Kelahiran — opsional" value={form.doc_akta ?? ''} onChange={(url) => setForm((v) => ({ ...v, doc_akta: url }))} bucket="student/documents" accept="image/jpeg,image/png,image/webp" maxSizeMb={5} hint="JPG/PNG/WEBP, maks. 5 MB." />
                            <ImageField label="Ijazah — opsional" value={form.doc_ijazah ?? ''} onChange={(url) => setForm((v) => ({ ...v, doc_ijazah: url }))} bucket="student/documents" accept="image/jpeg,image/png,image/webp" maxSizeMb={5} hint="JPG/PNG/WEBP, maks. 5 MB." />
                            <ImageField label="Dokumen Lainnya — opsional" value={form.doc_lainnya ?? ''} onChange={(url) => setForm((v) => ({ ...v, doc_lainnya: url }))} bucket="student/documents" accept="image/jpeg,image/png,image/webp" maxSizeMb={5} hint="JPG/PNG/WEBP, maks. 5 MB." />
                          </div>
                        </div>
                      </div>
                    )}
                    {fields.map((field) => (
                      <BiodataField key={field.key} field={field} value={form[field.key] ?? ''} onChange={setValue(field.key)} error={errors[field.key]} />
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-[#5B7088]">Batal</button>
              {step > 1 && (
                <button type="button" onClick={goBack} className="px-4 py-2 font-semibold text-[#866D2C]">Kembali</button>
              )}
              {step < totalSteps ? (
                <button type="button" onClick={goNext} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2 font-bold text-white">
                  Lanjut <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2 font-bold text-white disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Simpan Siswa
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {importOpen && <StudentImportModal onClose={() => setImportOpen(false)} onImported={() => void load()} />}
    </div>
  );
}

function BiodataField({ field, value, onChange, placeholder, error }: { field: BiodataFieldDef; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; placeholder?: string; error?: string }) {
  const cls = field.full ? 'sm:col-span-2' : '';
  const inputCls = `mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal ${error ? 'border-red-400' : 'border-[#1B2A4A]/20'}`;

  const isNumeric = field.type === 'number';
  const isDecimal = field.type === 'decimal';
  const blockLetters = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isNumeric && !isDecimal) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const allowDot = isDecimal && e.key === '.';
    if (e.key.length === 1 && !/[0-9]/.test(e.key) && !allowDot) e.preventDefault();
  };

  return (
    <label className={`block text-sm font-semibold ${cls}`}>
      {field.label}
      {field.type === 'select' ? (
        <select value={value} onChange={onChange} className={inputCls}>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt === '' ? 'Pilih' : selectLabel(field.key, opt)}
            </option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea value={value} onChange={onChange} rows={2} className={inputCls} placeholder={placeholder ?? field.placeholder} />
      ) : (
        <input
          value={value}
          type={field.type === 'date' ? 'date' : 'text'}
          inputMode={isNumeric || isDecimal ? 'decimal' : undefined}
          pattern={isNumeric ? '[0-9]*' : isDecimal ? '[0-9]*[.]?[0-9]*' : undefined}
          onKeyDown={blockLetters}
          onChange={(e) => {
            if (isNumeric) {
              e.target.value = e.target.value.replace(/[^0-9]/g, '');
            } else if (isDecimal) {
              let clean = e.target.value.replace(/[^0-9.]/g, '');
              const firstDot = clean.indexOf('.');
              if (firstDot !== -1) {
                clean = clean.slice(0, firstDot + 1) + clean.slice(firstDot + 1).replace(/\./g, '');
              }
              e.target.value = clean;
            }
            onChange(e);
          }}
          className={inputCls}
          placeholder={placeholder ?? field.placeholder}
        />
      )}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function stepShortLabel(title: string): string {
  return title.replace(/^[A-J]\.\s*/, '');
}

function StudentDetailView({ student, onBack, onEdit, flash }: { student: StudentRow; onBack: () => void; onEdit: () => void; flash: (type: 'ok' | 'err', text: string) => void }) {
  const achievements = Array.isArray(student.achievements) ? (student.achievements as unknown[]).filter(Boolean) : [];
  const achievementsText = achievements.map(String).join(', ');
  const fotoSrc = resolveImageUrl(student.foto);

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A4A]/10 p-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2A4A]">Detail Siswa</h2>
          <p className="mt-1 text-sm text-[#5B7088]">{student.name} — NISN {student.nisn}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Pencil size={16} /> Edit Siswa</button>
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><ArrowLeft size={16} /> Kembali</button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {BIODATA_SECTIONS.map((section) => {
          const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);
          const isIdentity = section.id === 'identity';
          return (
            <div key={section.id} className="rounded-xl border border-[#1B2A4A]/10 p-4">
              <p className="mb-3 font-bold text-[#1B2A4A]">{section.title}</p>
              <div className={`flex flex-col gap-4 sm:flex-row ${isIdentity ? '' : 'sm:flex-col'}`}>
                {isIdentity && (
                  <div className="w-full shrink-0 sm:w-80">
                    <div className="overflow-hidden rounded-xl border border-[#1B2A4A]/10 bg-white">
                      {fotoSrc ? (
                        <div className="flex max-h-[420px] items-start justify-center bg-[#FAF6F0] p-2">
                          <img src={fotoSrc} alt={`Foto ${student.name}`} className="max-h-[400px] w-auto max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="grid h-64 place-items-center bg-[#FAF6F0]">
                          <div className="text-center text-[#866D2C]/60">
                            <UserRound className="mx-auto mb-2 h-12 w-12" />
                            <p className="text-xs font-semibold">Belum ada foto</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {fotoSrc && (
                      <button
                        onClick={() => void downloadApiFile(String(student.foto ?? ''), studentPhotoFileName(student)).then((res) => { if (!res.ok) flash('err', res.message); })}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B2A4A] px-3 py-2 text-sm font-bold text-white hover:opacity-90"
                      >
                        <Download size={15} /> Download Foto
                      </button>
                    )}
                  </div>
                )}
                <dl className="grid flex-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                  {isIdentity && (
                    <DetailRow label="PIN Login" value={student.pin} />
                  )}
                  {fields.map((field) => (
                    <DetailRow key={field.key} label={field.label} value={detailValue(field, student[field.key])} />
                  ))}
                  {isIdentity && achievementsText && (
                    <DetailRow label="Prestasi" value={achievementsText} />
                  )}
                </dl>
              </div>
            </div>
          );
        })}

        <div className="rounded-xl border border-[#1B2A4A]/10 p-4">
          <p className="mb-4 font-bold text-[#1B2A4A]">DOKUMEN SISWA</p>
          <div className="space-y-4">
            {STUDENT_DOCS.map((doc) => {
              const docSrc = resolveImageUrl(String(student[doc.key] ?? ''));
              return (
                <div key={doc.key} className="overflow-hidden rounded-xl border border-[#1B2A4A]/10">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B2A4A]/10 bg-[#FAF6F0]/70 px-4 py-3">
                    <p className="font-bold text-[#1B2A4A]">{doc.label}</p>
                    {docSrc && (
                      <button
                          onClick={() => void downloadApiFile(String(student[doc.key] ?? ''), docFileName(doc, student)).then((res) => { if (!res.ok) flash('err', res.message); })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B2A4A] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                        >
                          <Download size={14} /> Download
                        </button>
                    )}
                  </div>
                  {docSrc ? (
                    <div className="flex max-h-[560px] items-start justify-center bg-white p-3">
                      <img src={docSrc} alt={doc.label} className="max-h-[540px] w-auto max-w-full object-contain" />
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm text-[#5B7088]">Belum diunggah</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  const display = value === null || value === undefined || value === '' ? '-' : String(value);
  return (
    <div className="flex gap-2">
      <dt className="w-40 shrink-0 font-medium text-[#5B7088]">{label}</dt>
      <dd className="font-semibold text-[#1B2A4A]">{display}</dd>
    </div>
  );
}

function detailValue(field: BiodataFieldDef, raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '-';
  if (isRupiahField(field.key)) return formatRupiah(raw);
  if (field.type === 'date') return formatDate(String(raw));
  if (field.key === 'gender') return genderLabel(String(raw));
  if (field.type === 'decimal') return trimDecimal(String(raw));
  return String(raw);
}

function trimDecimal(value: string): string {
  const clean = value.trim();
  if (!clean) return '';
  if (!/^[+-]?\d*\.?\d+$/.test(clean)) return clean;
  const num = Number(clean);
  if (Number.isNaN(num)) return clean;
  return String(num);
}

function selectLabel(key: string, value: string): string {
  if (key === 'gender') return value === 'L' ? 'Laki-laki' : value === 'P' ? 'Perempuan' : value;
  if (key === 'anak_yatim_piatu') return value === 'Yatim' ? 'Yatim' : value === 'Piatu' ? 'Piatu' : value === 'Yatim-Piatu' ? 'Yatim-Piatu' : value;
  return value;
}

function genderLabel(value?: string): string {
  if (value === 'L') return 'Laki-laki';
  if (value === 'P') return 'Perempuan';
  return '-';
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return value;
}

const STUDENT_DOCS = [
  { key: 'doc_kk', label: 'KK (Kartu Keluarga)' },
  { key: 'doc_akta', label: 'Akta Kelahiran' },
  { key: 'doc_ijazah', label: 'Ijazah' },
  { key: 'doc_lainnya', label: 'Dokumen Lainnya' },
];

const DOC_SLUGS: Record<string, string> = {
  doc_kk: 'KK',
  doc_akta: 'Akta-Kelahiran',
  doc_ijazah: 'Ijazah',
  doc_lainnya: 'Dokumen-Lainnya',
};

function safeName(value: string): string {
  const clean = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return clean.slice(0, 50) || 'file';
}

function extFromUrl(url: string): string {
  const last = url.split('/').pop() ?? '';
  const dot = last.lastIndexOf('.');
  return dot > 0 && dot < last.length - 1 ? last.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

function fileBase(prefix: string, name: string, nisn: string, ext: string): string {
  const core = [prefix, safeName(name), nisn ? `NISN-${nisn}` : ''].filter(Boolean).join('_');
  return `${core}.${ext || 'jpg'}`;
}

function docFileName(doc: { key: string }, student: StudentRow): string {
  return fileBase(DOC_SLUGS[doc.key] ?? 'Dokumen', student.name, String(student.nisn ?? ''), extFromUrl(String(student[doc.key] ?? '')));
}

function studentPhotoFileName(student: StudentRow): string {
  return fileBase('Foto', student.name, String(student.nisn ?? ''), extFromUrl(String(student.foto ?? '')));
}
