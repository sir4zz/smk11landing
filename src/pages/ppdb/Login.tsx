import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { backendApi } from '../../lib/api'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import logoSekolah from '../../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const email = fd.get('email') as string
      const password = fd.get('password') as string
      
      const { error: signInError } = await backendApi.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError
      navigate('/ppdb/dashboard')
    } catch (err: any) { setError(err.message || 'Login gagal.') } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[#1B2A4A] font-bold text-xl">
            <img src={logoSekolah} alt="Logo SMKN 11" className="h-8 w-auto" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} /> SMKN 11
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#1B2A4A]">Masuk PPDB</h1>
          <p className="mt-1 text-sm text-[#23314D]">Masuk ke akun pendaftaran Anda</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-8 shadow-xl">
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#1B2A4A]">
              Email
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
                <input name="email" type="email" required className="w-full rounded-lg border border-[#1B2A4A]/20 py-3 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]" placeholder="contoh@email.com" />
              </div>
            </label>

            <label className="block text-sm font-semibold text-[#1B2A4A]">
              Password
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
                <input name="password" type="password" required className="w-full rounded-lg border border-[#1B2A4A]/20 py-3 pl-10 pr-4 text-sm text-[#1B2A4A] placeholder-[#23314D]/50 focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]" placeholder="Masukkan password" />
              </div>
            </label>
          </div>

          <Button type="submit" disabled={loading} className="mt-6 w-full bg-[#1B2A4A] py-3 font-bold text-white disabled:opacity-70">
            {loading ? 'Memeriksa...' : 'Masuk'}
          </Button>

          <p className="mt-4 text-center text-sm text-[#23314D]">
            Belum punya akun?{' '}
            <Link to="/ppdb/daftar" className="font-semibold text-[#C8A951] hover:text-[#B59640]">Daftar</Link>
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
