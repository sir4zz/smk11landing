import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { backendApi, myProfileApi } from '../../lib/api';
import { StaffAuthProvider, useStaffAuth } from '../../lib/staffAuth';
import { LoadingInline } from '../../components/ui/LoadingScreen';

export default function MustChangePassword() {
  return (
    <StaffAuthProvider>
      <ChangePasswordScreen />
    </StaffAuthProvider>
  );
}

function ChangePasswordScreen() {
  const navigate = useNavigate();
  const { role, mustChangePassword, loading } = useStaffAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!mustChangePassword) navigate('/admin', { replace: true });
  }, [loading, mustChangePassword, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] grid place-items-center">
        <LoadingInline />
      </div>
    );
  }

  const minLength = 6;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    if (next.length < minLength) {
      setError(`Password baru minimal ${minLength} karakter.`);
      setSaving(false);
      return;
    }
    if (next !== confirm) {
      setError('Konfirmasi password baru tidak cocok.');
      setSaving(false);
      return;
    }

    try {
      const { error: updateError } = await myProfileApi.updatePassword({ current_password: current, new_password: next });
      if (updateError) throw new Error(updateError.message ?? 'Gagal mengubah password.');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password.');
    } finally {
      setSaving(false);
    }
  };

  const goBackToLogin = async () => {
    await backendApi.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <main className="min-h-screen bg-[#FAF6F0] grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#C8A951]/20 p-2"><KeyRound className="h-7 w-7 text-[#866D2C]" /></div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Ubah Password</h1>
          <p className="mt-2 text-sm text-[#23314D]">Akun {role === 'guru' ? 'guru' : role === 'osis' ? 'OSIS' : role} harus mengganti password sebelum dapat menggunakan panel.</p>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Demi keamanan, password awal wajib diganti. Gunakan password baru yang tidak mudah ditebak.</span>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={submit}>
          <label className="mb-4 block text-sm font-semibold text-[#1B2A4A]">Password Saat Ini<input name="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" /></label>
          <label className="mb-4 block text-sm font-semibold text-[#1B2A4A]">Password Baru<input name="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={minLength} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" placeholder={`Minimal ${minLength} karakter`} /></label>
          <label className="mb-6 block text-sm font-semibold text-[#1B2A4A]">Ulangi Password Baru<input name="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" /></label>
          <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B2A4A] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} {saving ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>

        <div className="mt-6 border-t border-[#1B2A4A]/10 pt-4 text-center">
          <button onClick={() => void goBackToLogin()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B7088] transition-colors hover:text-[#866D2C]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Halaman Login
          </button>
        </div>
      </div>
    </main>
  );
}
