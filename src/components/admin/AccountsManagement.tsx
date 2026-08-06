import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Plus, Trash2, X, Loader2, KeyRound, Search, FileSpreadsheet, Pencil, Users, ShieldCheck } from 'lucide-react';
import { accountsApi, type AccountRole, type AccountRow } from '../../lib/api';

const ROLE_LABELS: Record<AccountRole, string> = { admin: 'Admin', guru: 'Guru', osis: 'OSIS', student: 'Siswa' };
const ROLE_BADGES: Record<AccountRole, string> = {
  admin: 'bg-[#1B2A4A] text-white',
  guru: 'bg-blue-50 text-blue-700',
  osis: 'bg-[#C8A951]/20 text-[#866D2C]',
  student: 'bg-green-50 text-green-700',
};

const ROLE_HINTS: Record<AccountRole, string> = {
  admin: 'Akses penuh ke seluruh panel pengelolaan.',
  guru: 'Akses sesuai permission yang diberikan admin.',
  osis: 'Akses untuk fitur OSIS, ekstrakurikuler, kesemaptaan, dan mading.',
  student: 'Login ke Mading menggunakan NISN + PIN.',
};

interface FormValues {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  nisn: string;
  class: string;
  major: string;
  pin: string;
}

const emptyForm = (role: AccountRole = 'guru'): FormValues => ({ role, name: '', email: '', password: '', nisn: '', class: '', major: '', pin: '' });

export default function AccountsManagement() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AccountRole | ''>('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await accountsApi.list();
    if (!error && data) setAccounts(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const filtered = useMemo(() => accounts.filter((acc) => {
    const matchesRole = !roleFilter || acc.role === roleFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || acc.name.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q) || (acc.nisn ?? '').toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  }), [accounts, roleFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setCreating(true);
  };

  const openEdit = (account: AccountRow) => {
    setEditing(account);
    setForm({
      role: account.role,
      name: account.name,
      email: account.email,
      password: '',
      nisn: account.nisn ?? '',
      class: account.class ?? '',
      major: account.major ?? '',
      pin: '',
    });
    setCreating(true);
  };

  const setField = (key: keyof FormValues) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMsg(null);

    const name = form.name.trim();
    if (name.length < 2) {
      flash('err', 'Nama wajib diisi.');
      setSaving(false);
      return;
    }

    try {
      if (form.role === 'student') {
        const nisn = form.nisn.trim();
        if (nisn.length < 4) throw new Error('NISN tidak valid (minimal 4 karakter).');
        const needsPin = form.pin.length < 4 && !(editing && editing.role === 'student');
        if (needsPin) throw new Error('PIN minimal 4 karakter.');
        const payload = { role: 'student', name, nisn, class: form.class.trim(), major: form.major.trim() } as Record<string, unknown>;
        if (form.pin) payload.pin = form.pin;
        const { error } = editing ? await accountsApi.update(editing.id, payload) : await accountsApi.create(payload);
        if (error) throw new Error(error.message ?? 'Gagal menyimpan akun.');
      } else {
        const email = form.email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email wajib diisi dengan benar.');
        const needsPassword = form.password.length < 6 && !editing;
        if (needsPassword) throw new Error('Password minimal 6 karakter.');
        const payload: Record<string, unknown> = { role: form.role, name, email };
        if (form.password) payload.password = form.password;
        const { error } = editing ? await accountsApi.update(editing.id, payload) : await accountsApi.create(payload);
        if (error) throw new Error(error.message ?? 'Gagal menyimpan akun.');
      }

      await load();
      setCreating(false);
      flash('ok', editing ? 'Akun berhasil diperbarui.' : `Akun ${ROLE_LABELS[form.role].toLowerCase()} berhasil dibuat.`);
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (account: AccountRow) => {
    if (account.role === 'student') {
      const newPin = prompt(`Reset PIN untuk ${account.name} (NISN ${account.nisn}):\nMasukkan PIN baru (minimal 4 karakter).`);
      if (newPin === null) return;
      if (newPin.length < 4) { flash('err', 'PIN minimal 4 karakter.'); return; }
      const { error } = await accountsApi.update(account.id, { pin: newPin });
      if (error) { flash('err', error.message ?? 'Gagal reset PIN.'); return; }
      flash('ok', `PIN ${account.name} berhasil direset.`);
    } else {
      const newPass = prompt(`Reset password untuk ${account.name} (${account.email}):\nMasukkan password baru (minimal 6 karakter).`);
      if (newPass === null) return;
      if (newPass.length < 6) { flash('err', 'Password minimal 6 karakter.'); return; }
      const { error } = await accountsApi.update(account.id, { password: newPass });
      if (error) { flash('err', error.message ?? 'Gagal reset password.'); return; }
      flash('ok', `Password ${account.name} berhasil direset.`);
    }
  };

  const removeAccount = async (account: AccountRow) => {
    if (!confirm(`Hapus akun ${account.name} (${ROLE_LABELS[account.role]})?\nAkun login akan terhapus permanen.`)) return;
    const { error } = await accountsApi.remove(account.id);
    if (error) { flash('err', error.message ?? 'Gagal menghapus akun.'); return; }
    await load();
    flash('ok', 'Akun dihapus.');
  };

  const exportExcel = async () => {
    const { data } = await accountsApi.list();
    if (!data) { flash('err', 'Gagal mengambil data untuk ekspor.'); return; }
    try {
      const XLSX = await import('xlsx');
      const rows = data.map((acc, i) => ({
        No: i + 1,
        Nama: acc.name,
        Email: acc.email,
        Role: ROLE_LABELS[acc.role],
        NISN: acc.role === 'student' ? acc.nisn ?? '' : '-',
        Kelas: acc.role === 'student' ? acc.class ?? '' : '-',
        Jurusan: acc.role === 'student' ? acc.major ?? '' : '-',
        'Dibuat': acc.created_at ? new Date(acc.created_at).toLocaleDateString('id-ID') : '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Akun');
      XLSX.writeFile(wb, `akun-smkn11-${new Date().toISOString().slice(0, 10)}.xlsx`);
      flash('ok', `Berhasil mengekspor ${data.length} akun ke Excel.`);
    } catch {
      flash('err', 'Gagal membuat file Excel.');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#23314D]">Kelola semua akun login: admin, guru, OSIS, dan siswa. Buat akun manual atau ekspor ke Excel.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1B2A4A] px-4 py-2 font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5"><FileSpreadsheet size={18} /> Export Excel</button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A]"><Plus size={18} /> Tambah Akun</button>
        </div>
      </div>

      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / email / NISN..." className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as AccountRole | '')} className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm">
          <option value="">Semua Role</option>
          {(Object.keys(ROLE_LABELS) as AccountRole[]).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
            <tr>
              <th className="p-4">Akun</th>
              <th className="p-4">Role</th>
              <th className="p-4">Detail</th>
              <th className="p-4">Dibuat</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#5B7088]">Tidak ada akun yang cocok.</td></tr>}
            {filtered.map((account) => (
              <tr key={account.id} className="border-t border-[#1B2A4A]/10">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${account.role === 'student' ? 'bg-green-50' : 'bg-[#FAF6F0]'}`}>
                      {account.role === 'student' ? <Users className="h-4 w-4 text-green-600" /> : <ShieldCheck className="h-4 w-4 text-[#866D2C]" />}
                    </span>
                    <div>
                      <p className="font-semibold">{account.name}</p>
                      <p className="text-xs text-[#5B7088]">{account.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGES[account.role]}`}>{ROLE_LABELS[account.role]}</span></td>
                <td className="p-4 text-[#23314D]">
                  {account.role === 'student'
                    ? <div className="font-mono text-xs"><p>NISN {account.nisn || '-'}</p><p className="text-[#5B7088]">{account.class || '-'} · {account.major || '-'}</p></div>
                    : <span className="text-[#5B7088]">—</span>}
                </td>
                <td className="p-4 text-[#23314D]/70">{account.created_at ? new Date(account.created_at).toLocaleDateString('id-ID') : '-'}</td>
                <td className="p-4 whitespace-nowrap">
                  <button onClick={() => resetPassword(account)} className="mr-3 inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]"><KeyRound size={15} /> {account.role === 'student' ? 'Reset PIN' : 'Reset PW'}</button>
                  <button onClick={() => openEdit(account)} className="mr-3 text-[#866D2C]"><Pencil size={17} /></button>
                  <button onClick={() => removeAccount(account)} className="text-red-600"><Trash2 size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={submit} className="my-8 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex justify-between">
              <h2 className="text-xl font-bold text-[#1B2A4A]">{editing ? 'Ubah Akun' : 'Tambah Akun'}</h2>
              <button type="button" onClick={() => setCreating(false)}><X /></button>
            </div>

            <label className="mb-4 block text-sm font-semibold">Role Akun
              <select value={form.role} onChange={setField('role')} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
                {(Object.keys(ROLE_LABELS) as AccountRole[]).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
              <span className="mt-1 block text-xs font-normal text-[#5B7088]">{ROLE_HINTS[form.role]}</span>
            </label>

            {editing && form.role !== editing.role && (
              <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Mengubah role dari {ROLE_LABELS[editing.role]} menjadi {ROLE_LABELS[form.role]}. Jika menjadi siswa, data guru/OSIS akan diganti dengan data siswa; jika dari siswa, akun siswa &amp; NISN lama dihapus.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Nama Lengkap" value={form.name} onChange={setField('name')} /></div>

              {form.role === 'student' ? (
                <>
                  <Field label="NISN" value={form.nisn} onChange={setField('nisn')} placeholder="cth. 0061234567" />
                  <Field label="Kelas" value={form.class} onChange={setField('class')} placeholder="cth. X TJKT 1" />
                  <Field label="Jurusan" value={form.major} onChange={setField('major')} placeholder="cth. Teknik Jaringan" />
                  <div>
                    <label className="block text-sm font-semibold">{editing ? 'PIN Baru (opsional)' : 'PIN Siswa (min. 4 karakter)'}
                      <input value={form.pin} type="text" inputMode="numeric" onChange={setField('pin')} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" placeholder="cth. 1234" />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2"><Field label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="cth. nama@smkn11.sch.id" /></div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold">{editing ? 'Password Baru (opsional)' : 'Password (min. 6 karakter)'}
                      <input value={form.password} type="password" onChange={setField('password')} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" placeholder="Kosongkan jika tidak diubah" />
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-[#5B7088]">Batal</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 font-bold text-white disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {editing ? 'Simpan Perubahan' : 'Buat Akun'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm font-semibold">{label}
      <input value={value} type={type} onChange={onChange} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
    </label>
  );
}
