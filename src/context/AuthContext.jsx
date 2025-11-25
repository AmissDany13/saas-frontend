// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'
// 🔹 Importación corregida para Vite/ESM
import { decode as jwtDecode } from 'jwt-decode'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const TOKENS_KEY = 'tokens' // { access_token, id_token }

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : null
  })

  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  
  // 🔹 Considera cualquier token válido para autenticar
  const isAuthenticated = !!tokens?.id_token || !!tokens?.access_token

  useEffect(() => {
    if (!tokens) {
      setUser(null)
      setAuthReady(true)
      return
    }

    try {
      // Decodifica el token
      const payload = jwtDecode(tokens.id_token || tokens.access_token)

      api.get('/auth/whoami')
        .then(r => {
          const { sub, email, name } = r.data || {}
          setUser({ sub, email, name })
          setAuthReady(true)
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
            setAuthReady(true)
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
        authReady,
        loginWithTokens,
        logout
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}
