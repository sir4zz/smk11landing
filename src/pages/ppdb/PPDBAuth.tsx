import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { insforge } from '../../lib/api'
import LoadingScreen from '../../components/ui/LoadingScreen'

interface InsForgeUser { id: string; email?: string }
interface User { id: string; name: string; email: string; phone: string; role?: string }
interface AuthCtx {
  user: User | null;
  insforgeUser: InsForgeUser | null;
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthCtx>({ user: null, insforgeUser: null, logout: async () => {} })
export const usePpdbAuth = () => useContext(AuthContext)

const SESSION_KEY = 'insforge_session'

function saveSession() {
  try {
    const cl = insforge as any
    const session = cl.tokenManager?.getSession()
    if (session?.accessToken && session?.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        accessToken: session.accessToken,
        refreshToken: cl.http?.refreshToken,
        user: session.user,
      }))
    }
  } catch {}
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { accessToken, refreshToken, user } = JSON.parse(raw)
    if (!accessToken || !user) return false
    const cl = insforge as any
    cl.setAccessToken(accessToken)
    cl.tokenManager?.setUser(user)
    cl.http?.setRefreshToken(refreshToken)
    return true
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return false
  }
}

export function PpdbAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [insforgeUser, setInsforgeUser] = useState<InsForgeUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const hydrateAuth = async () => {
      const { data: authData, error } = await insforge.auth.getCurrentUser()
      if (cancelled) return

      const currentUser = error ? null : authData.user
      setInsforgeUser(currentUser)
      if (!currentUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data: profile } = await insforge.database.from('profiles').select('*').eq('id', currentUser.id).single()
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

    const run = async () => {
      restoreSession()
      await hydrateAuth()
    }
    void run()

    const unsubscribe = insforge.auth.onAuthStateChange((event) => {
      if (event === 'signedIn' || event === 'tokenRefreshed') saveSession()
      if (event === 'signedOut') localStorage.removeItem(SESSION_KEY)
      void hydrateAuth()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    await insforge.auth.signOut()
    localStorage.removeItem(SESSION_KEY)
  }

  if (loading) return <LoadingScreen message="Memeriksa sesi..." />
  return <AuthContext.Provider value={{ user, insforgeUser, logout }}>{children}</AuthContext.Provider>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = usePpdbAuth()
  if (!user) return <Navigate to="/ppdb/masuk" replace />
  return <>{children}</>
}
