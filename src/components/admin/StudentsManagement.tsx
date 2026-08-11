import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Plus, Trash2, X, Loader2, KeyRound, Search, UserRound, Upload } from 'lucide-react';
import { backendApi } from '../../lib/api';
import StudentImportModal from './StudentImportModal';

interface StudentRow {
  id: string;
  nisn: string;
  pin?: string;
  name: string;
  class: string;
  major: string;
  gender?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  address?: string;
  created_at?: string;
}

export default function StudentsManagement() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [createValues, setCreateValues] = useState({ nisn: '', name: '', class: '', major: '', gender: '', date_of_birth: '', place_of_birth: '', address: '', pin: '' });

  const load = useCallback(async () => {
    const { data, error } = await backendApi.database.from('students').select('*').order('name', { ascending: true });
    if (!error && data) setStudents(data as StudentRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const filtered = students.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.toLowerCase().includes(search.toLowerCase())
  );

  const createStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setMsg(null);
    const { nisn, name, class: klass, major, pin } = createValues;
    if (!nisn.trim() || !name.trim() || pin.length < 4) {
      flash('err', 'NISN, nama wajib diisi dan PIN minimal 4 karakter.');
      setCreating(false);
      return;
    }
    const r = await backendApi.database.rpc('admin_create_student', {
      p_nisn: nisn.trim(),
      p_name: name.trim(),
      p_class: klass.trim(),
      p_major: major.trim(),
      p_gender: createValues.gender,
      p_date_of_birth: createValues.date_of_birth,
      p_place_of_birth: createValues.place_of_birth.trim(),
      p_address: createValues.address.trim(),
      p_pin: pin,
    });
    if (r.error) {
      flash('err', r.error.message);
      setCreating(false);
      return;
    }
    setCreateValues({ nisn: '', name: '', class: '', major: '', gender: '', date_of_birth: '', place_of_birth: '', address: '', pin: '' });
    setOpen(false);
    await load();
    flash('ok', `Akun siswa ${name.trim()} berhasil dibuat. Login siswa: NISN + PIN.`);
    setCreating(false);
  };

  const resetPin = async (student: StudentRow) => {
    const newPin = prompt(`Reset PIN untuk ${student.name} (NISN ${student.nisn}):\nMasukkan PIN baru (minimal 4 karakter).`);
    if (newPin === null) return;
    if (newPin.length < 4) {
      flash('err', 'PIN minimal 4 karakter.');
      return;
    }
    const r = await backendApi.database.rpc('admin_reset_student_pin', { p_student_id: student.id, p_new_pin: newPin });
    if (r.error) { flash('err', r.error.message); return; }
    flash('ok', `PIN siswa ${student.name} berhasil direset.`);
  };

  const removeStudent = async (student: StudentRow) => {
    if (!confirm(`Hapus akun ${student.name}? Akun login siswa akan ikut terhapus.`)) return;
    const r = await backendApi.database.from('student_accounts').delete().eq('student_id', student.id);
    if (r.error) { flash('err', r.error.message); return; }
    const r2 = await backendApi.database.from('students').delete().eq('id', student.id);
    if (r2.error) { flash('err', r2.error.message); return; }
    await load();
    flash('ok', 'Akun siswa dihapus.');
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Buat dan kelola akun siswa untuk Mading (login NISN + PIN).</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><Upload size={18} /> Import Excel/CSV</button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Tambah Siswa</button>
        </div>
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

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
              <th className="p-4">PIN Login</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Jurusan</th>
              <th className="p-4">Jenis Kelamin</th>
              <th className="p-4">Tanggal Lahir</th>
              <th className="p-4">Tempat Lahir</th>
              <th className="p-4">Alamat</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-[#5B7088]">Belum ada siswa terdaftar.</td></tr>}
            {filtered.map((student) => (
              <tr key={student.id} className="border-t border-[#1B2A4A]/10">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FAF6F0]"><UserRound className="h-4 w-4 text-[#866D2C]" /></span>
                    <span className="font-semibold">{student.name}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs">{student.nisn}</td>
                <td className="p-4 font-mono text-xs">{student.pin || '-'}</td>
                <td className="p-4">{student.class || '-'}</td>
                <td className="p-4">{student.major || '-'}</td>
                <td className="p-4">{genderLabel(student.gender)}</td>
                <td className="p-4 whitespace-nowrap">{formatDate(student.date_of_birth)}</td>
                <td className="p-4">{student.place_of_birth || '-'}</td>
                <td className="p-4 max-w-[200px] truncate" title={student.address || ''}>{student.address || '-'}</td>
                <td className="p-4 whitespace-nowrap">
                  <button onClick={() => resetPin(student)} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><KeyRound size={15} /> Reset PIN</button>
                  <button onClick={() => removeStudent(student)} className="text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={createStudent} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex justify-between">
              <h2 className="text-xl font-bold text-[#1B2A4A]">Tambah Akun Siswa</h2>
              <button type="button" onClick={() => setOpen(false)}><X /></button>
            </div>
            <p className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
              Siswa login ke Mading menggunakan <strong>NISN sebagai identitas</strong> dan <strong>PIN sebagai autentikasi</strong>. PIN disimpan terenkripsi.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NISN" value={createValues.nisn} onChange={(e) => setCreateValues((v) => ({ ...v, nisn: e.target.value }))} placeholder="cth. 0061234567" />
              <Field label="Nama Lengkap" value={createValues.name} onChange={(e) => setCreateValues((v) => ({ ...v, name: e.target.value }))} />
              <Field label="Kelas" value={createValues.class} onChange={(e) => setCreateValues((v) => ({ ...v, class: e.target.value }))} placeholder="cth. X TJKT 1" />
              <Field label="Jurusan" value={createValues.major} onChange={(e) => setCreateValues((v) => ({ ...v, major: e.target.value }))} placeholder="cth. Teknik Jaringan" />
              <label className="block text-sm font-semibold">Jenis Kelamin
                <select value={createValues.gender} onChange={(e) => setCreateValues((v) => ({ ...v, gender: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-normal">
                  <option value="">Pilih</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">Tanggal Lahir
                <input value={createValues.date_of_birth} type="date" onChange={(e) => setCreateValues((v) => ({ ...v, date_of_birth: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
              </label>
              <Field label="Tempat Lahir" value={createValues.place_of_birth} onChange={(e) => setCreateValues((v) => ({ ...v, place_of_birth: e.target.value }))} placeholder="cth. Bandung" />
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold">Alamat
                  <textarea value={createValues.address} onChange={(e) => setCreateValues((v) => ({ ...v, address: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" placeholder="Alamat lengkap" />
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold">PIN Siswa (min. 4 karakter)
                  <input value={createValues.pin} type="text" inputMode="numeric" onChange={(e) => setCreateValues((v) => ({ ...v, pin: e.target.value }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" placeholder="cth. 1234" />
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-[#5B7088]">Batal</button>
              <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white disabled:opacity-60">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Buat Akun
              </button>
            </div>
          </form>
        </div>
      )}

      {importOpen && <StudentImportModal onClose={() => setImportOpen(false)} onImported={() => void load()} />}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <label className="block text-sm font-semibold">{label}
      <input value={value} onChange={onChange} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
    </label>
  );
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