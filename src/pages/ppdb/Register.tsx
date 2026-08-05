import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { backendApi } from '../../lib/api'
import { UserPlus, Mail, Lock, Phone, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import logoSekolah from '../../assets/logo.png'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const email = fd.get('email') as string
    const phone = fd.get('phone') as string
    const password = fd.get('password') as string

    try {
      const { data: signUpData, error: signUpError } = await backendApi.auth.signUp({
        email,
        password,
        name,
      })
      if (signUpError) throw signUpError

      const { error: profileError } = await backendApi.database
        .from('profiles')
        .update({ phone })
        .eq('id', signUpData?.user?.id ?? '')
      if (profileError) throw profileError

      setSuccess(true)
      setTimeout(() => navigate('/ppdb/dashboard'), 1000)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  if (success) return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"><UserPlus className="h-8 w-8" /></div>
        <h2 className="text-xl font-bold text-[#1B2A4A]">Registrasi Berhasil!</h2>
        <p className="mt-2 text-[#23314D]">Mengalihkan ke dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[#1B2A4A] font-bold text-xl">
            <img src={logoSekolah} alt="Logo SMKN 11" className="h-8 w-auto" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} /> SMKN 11
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#1B2A4A]">Buat Akun PPDB</h1>
          <p className="mt-1 text-sm text-[#23314D]">Daftar untuk memulai pendaftaran siswa baru</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-8 shadow-xl">
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#1B2A4A]">
              Nama Lengkap
              <div className="relative mt-1">
                <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
                <input name="name" required className="w-full rounded-lg border border-[#1B2A4A]/20 py-3 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]" placeholder="Nama lengkap" />
              </div>
            </label>

            <label className="block text-sm font-semibold text-[#1B2A4A]">
              Email
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
                <input name="email" type="email" required className="w-full rounded-lg border border-[#1B2A4A]/20 py-3 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]" placeholder="contoh@email.com" />
              </div>
            </label>

            <label className="block text-sm font-semibold text-[#1B2A4A]">
              Nomor WhatsApp
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
                <input name="phone" type="tel" required className="w-full rounded-lg border border-[#1B2A4A]/20 py-3 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]" placeholder="08xxxxxxxxxx" />
              </div>
            </label>

            <label className="block text-sm font-semibold text-[#1B2A4A]">
              Password
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
                <input name="password" type="password" required minLength={6} className="w-full rounded-lg border border-[#1B2A4A]/20 py-3 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]" placeholder="Minimal 6 karakter" />
              </div>
            </label>
          </div>

          <Button type="submit" disabled={loading} className="mt-6 w-full bg-[#C8A951] py-3 font-bold text-[#1B2A4A] disabled:opacity-70">
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </Button>

          <p className="mt-4 text-center text-sm text-[#23314D]">
            Sudah punya akun?{' '}
            <Link to="/ppdb/masuk" className="font-semibold text-[#C8A951] hover:text-[#B59640]">Masuk</Link>
          </p>
        </form>

        <div className="mt-4 text-center">
          <Link to="/ppdb" className="text-sm text-[#23314D] hover:text-[#C8A951]">
            <ArrowRight className="mr-1 inline h-3.5 w-3.5" />Kembali ke halaman PPDB
          </Link>
        </div>
      </div>
    </div>
  )
}
