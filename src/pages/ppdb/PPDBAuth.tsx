import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { backendApi } from '../../lib/api'
import LoadingScreen from '../../components/ui/LoadingScreen'

interface SessionUser { id: string; email?: string }
interface User { id: string; name: string; email: string; phone: string; role?: string }
interface AuthCtx {
  user: User | null;
  sessionUser: SessionUser | null;
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthCtx>({ user: null, sessionUser: null, logout: async () => {} })
export const usePpdbAuth = () => useContext(AuthContext)

export function PpdbAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const hydrateAuth = async () => {
      const { data: authData, error } = await backendApi.auth.getCurrentUser()
      if (cancelled) return

      const currentUser = error ? null : authData.user
      setSessionUser(currentUser)
      if (!currentUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data: profile } = await backendApi.database.from('profiles').select('*').eq('id', currentUser.id).single()
      if (cancelled) return
      setUser(profile ? {
        id: profile.id,
        name: profile.name,
        email: currentUser.email || '',
        phone: profile.phone,
        role: profile.role,
      } : null)
      setLoading(false)
    }

    void hydrateAuth()

    const unsubscribe = backendApi.auth.onAuthStateChange(() => {
      void hydrateAuth()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    await backendApi.auth.signOut()
  }

  if (loading) return <LoadingScreen message="Memeriksa sesi..." />
  return <AuthContext.Provider value={{ user, sessionUser, logout }}>{children}</AuthContext.Provider>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = usePpdbAuth()
  if (!user) return <Navigate to="/ppdb/masuk" replace />
  return <>{children}</>
}
