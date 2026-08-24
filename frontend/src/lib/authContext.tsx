import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getApiAuthMe, postApiAuthLogout } from '@/api/generated/client'
import { clearUserId, withCredentials } from '@/lib/userId'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  markAuthenticated: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    getApiAuthMe(withCredentials())
      .then((res) =>
        setStatus(res.status === 200 ? 'authenticated' : 'unauthenticated'),
      )
      .catch(() => setStatus('unauthenticated'))
  }, [])

  const markAuthenticated = useCallback(() => setStatus('authenticated'), [])

  const logout = useCallback(async () => {
    try {
      await postApiAuthLogout(withCredentials())
    } finally {
      clearUserId()
      setStatus('unauthenticated')
    }
  }, [])

  return (
    <AuthContext.Provider value={{ status, markAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
