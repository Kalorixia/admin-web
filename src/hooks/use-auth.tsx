import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { authService, type UsuarioActual } from "@/services/authService"
import { ApiError } from "@/services/http"
import { setRefreshHandler, setSessionTokens } from "@/services/session"

const STORAGE_KEY = "kalorixia-admin-auth"

interface StoredTokens {
  accessToken: string
  refreshToken: string
}

interface AuthContextValue {
  user: UsuarioActual | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

function readStoredTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredTokens
  } catch {
    return null
  }
}

function writeStoredTokens(tokens: StoredTokens | null) {
  if (tokens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<StoredTokens | null>(() =>
    readStoredTokens()
  )
  const [user, setUser] = useState<UsuarioActual | null>(null)
  const [loading, setLoading] = useState(true)

  // Mirrors `tokens` for use inside callbacks that must read the latest
  // value synchronously (state updates aren't visible until next render).
  const tokensRef = useRef(tokens)
  useEffect(() => {
    tokensRef.current = tokens
  }, [tokens])

  // Applies a token change to localStorage, the session singleton (used by
  // adminFetch, synchronously — no need to wait for the effect below), and
  // React state (for anything rendering off useAuth()).
  const applyTokens = useCallback((next: StoredTokens | null) => {
    writeStoredTokens(next)
    setSessionTokens(next)
    setTokens(next)
  }, [])

  const refreshSession = useCallback(async () => {
    const current = tokensRef.current
    if (!current) throw new Error("No hay sesión para refrescar")
    try {
      const refreshed = await authService.refresh(current.refreshToken)
      applyTokens({
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
      })
    } catch (error) {
      // El refresh token también venció o es inválido: cerramos la sesión
      // para que RequireAuth redirija a /login en vez de quedar en un loop.
      applyTokens(null)
      setUser(null)
      throw error
    }
  }, [applyTokens])

  // Registers the refresh handler adminFetch calls on a 401 mid-session, so
  // a long-lived tab keeps working past the 1h access-token expiry without
  // needing a reload.
  useEffect(() => {
    setRefreshHandler(tokens ? refreshSession : null)
  }, [tokens, refreshSession])

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const stored = readStoredTokens()
      if (!stored) {
        setLoading(false)
        return
      }
      try {
        const me = await authService.me(stored.accessToken)
        if (!cancelled) {
          applyTokens(stored)
          setUser(me)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          try {
            const refreshed = await authService.refresh(stored.refreshToken)
            const next: StoredTokens = {
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
            }
            const me = await authService.me(next.accessToken)
            if (!cancelled) {
              applyTokens(next)
              setUser(me)
            }
          } catch {
            if (!cancelled) applyTokens(null)
          }
        } else {
          if (!cancelled) applyTokens(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSession()
    return () => {
      cancelled = true
    }
  }, [applyTokens])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await authService.login(email, password)
      const next: StoredTokens = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      }
      const me = await authService.me(next.accessToken)
      if (me.perfil?.tipo !== "administrador") {
        await authService.logout(next.accessToken).catch(() => {})
        throw new Error("Esta cuenta no tiene permisos de administrador")
      }
      applyTokens(next)
      setUser(me)
    },
    [applyTokens]
  )

  const signOut = useCallback(async () => {
    const current = tokensRef.current
    if (current) {
      await authService.logout(current.accessToken).catch(() => {})
    }
    applyTokens(null)
    setUser(null)
  }, [applyTokens])

  const isAdmin = user?.perfil?.tipo === "administrador"

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
