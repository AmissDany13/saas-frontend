import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'
import { jwtDecode } from 'jwt-decode'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const TOKENS_KEY = 'tokens' // { access_token, id_token }

export function AuthProvider({ children }) {

  const [tokens, setTokens] = useState(() => {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : null
  })

  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)   // 🔥 AÑADIDO
  const isAuthenticated = !!tokens?.access_token

  useEffect(() => {
    if (!tokens?.access_token) {
      setUser(null)
      setAuthReady(true)      // 🔥 listo aunque no haya login
      return
    }

    try {
      const payload = jwtDecode(tokens.id_token || tokens.access_token)

      api.get('/auth/whoami')
        .then(r => {
          const { sub, email, name } = r.data || {}
          setUser({ sub, email, name })
          setAuthReady(true)    // 🔥 listo
        })
        .catch(async () => {
          try {
            const r = await api.get('/me')
            setUser(r.data?.profile || {
              sub: r.data?.sub,
              email: r.data?.email,
              name: r.data?.name
            })
          } catch {
            setUser(null)
          } finally {
            setAuthReady(true)   // 🔥 listo pase lo que pase
          }
        })

    } catch {
      setUser(null)
      setAuthReady(true)
    }

  }, [tokens])

  const loginWithTokens = (t) => {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(t))
    setTokens(t)
  }

  const logout = () => {
    localStorage.removeItem(TOKENS_KEY)
    setTokens(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider
      value={{
        tokens,
        user,
        isAuthenticated,
        authReady,            // 🔥 AHORA SE EXPONE AL FRONT
        loginWithTokens,
        logout
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}
