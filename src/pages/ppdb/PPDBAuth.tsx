import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { apiUrl } from '../../lib/api'

interface User { id: string; name: string; email: string; phone: string }
interface AuthCtx {
  user: User | null; token: string | null;
  login: (token: string, user: User) => void; logout: () => void
}
const AuthContext = createContext<AuthCtx>({ user: null, token: null, login: () => {}, logout: () => {} })
export const usePpdbAuth = () => useContext(AuthContext)

export function PpdbAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('ppdb_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(apiUrl('/api/ppdb/me'), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) { setUser(data.user) } else { localStorage.removeItem('ppdb_token'); setToken(null) } })
      .catch(() => { localStorage.removeItem('ppdb_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = (t: string, u: User) => { localStorage.setItem('ppdb_token', t); setToken(t); setUser(u) }
  const logout = () => { localStorage.removeItem('ppdb_token'); setToken(null); setUser(null) }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C8A951] border-t-transparent" /></div>
  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = usePpdbAuth()
  if (!user) return <Navigate to="/ppdb/masuk" replace />
  return <>{children}</>
}
