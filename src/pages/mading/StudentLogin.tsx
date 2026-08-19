import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, LogIn, Loader2 } from 'lucide-react';
import { backendApi } from '../../lib/api';
import PageHero from '../../components/ui/PageHero';

const studentSessionKey = 'smkn11-student-session';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/mading/area';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await backendApi.auth.getCurrentUser();
      if (cancelled || !data?.user) return;
      const { data: prof } = await backendApi.database.from('profiles').select('role').eq('id', data.user.id).single();
      if (!cancelled && prof?.role === 'student') setAlreadyIn(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (alreadyIn) return <Navigate to={returnUrl} replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const nisn = String(form.get('nisn') ?? '').trim();
    const pin = String(form.get('pin') ?? '');

    try {
      if (!nisn || nisn.length < 4) throw new Error('Masukkan NISN yang valid.');
      if (!pin || pin.length < 4) throw new Error('PIN minimal 4 karakter.');

      const { data: emailData, error: lookupError } = await backendApi.database.rpc('get_student_login_email', { p_nisn: nisn });
      if (lookupError) throw new Error('Gagal memproses login. Silakan coba lagi.');
      if (!emailData) throw new Error('NISN tidak terdaftar. Hubungi admin sekolah.');

      const { data, error: signInError } = await backendApi.auth.signInWithPassword({ email: String(emailData), password: pin });
      if (signInError) throw new Error('NISN atau PIN salah.');
      if (!data?.user) throw new Error('Sesi siswa tidak dapat dibuat.');

      const { data: profile } = await backendApi.database.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile?.role !== 'student') {
        await backendApi.auth.signOut();
        throw new Error('Akun ini bukan akun siswa.');
      }

      localStorage.setItem(studentSessionKey, 'true');
      navigate(returnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Login Siswa"
        subtitle="Masuk ke Mading SMKN 11 untuk membuat dan mengelola karya"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading', href: '/mading' }, { label: 'Login Siswa' }]}
      />
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#FAF6F0]"><BookOpen className="h-7 w-7 text-[#866D2C]" /></div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">Area Siswa</h1>
            <p className="mt-2 text-sm text-[#23314D]">Masuk menggunakan NISN dan PIN untuk mengelola karya Mading.</p>
          </div>

          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <label className="mb-4 block text-sm font-semibold text-[#1B2A4A]">
            NIS / NISN
            <input name="nisn" inputMode="numeric" pattern="[0-9]*" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" placeholder="cth. 12345 atau 0061234567" />
          </label>
          <label className="mb-6 block text-sm font-semibold text-[#1B2A4A]">
            PIN / Password
            <input name="pin" type="password" required className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2" placeholder="PIN siswa" />
          </label>

          <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B2A4A] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} {loading ? 'Memeriksa...' : 'Masuk'}
          </button>

          <p className="mt-5 text-center text-sm text-[#5B7088]">
            Belum punya akun? Hubungi <Link to="/kontak" className="font-semibold text-[#866D2C]">Admin Sekolah</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
