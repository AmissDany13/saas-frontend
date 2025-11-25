import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'
// 🔹 Importa jwtDecode así para que funcione con Vite/ESM
import jwtDecode from 'jwt-decode'

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
  
  const isAuthenticated = !!tokens?.id_token || !!tokens?.access_token

  useEffect(() => {
    // Si no hay tokens, ya estamos listos
    if (!tokens) {
      setUser(null)
      setAuthReady(true)
      return
    }

    const loadUser = async () => {
      try {
        // Decodifica token (opcional, solo si necesitas payload)
        jwtDecode(tokens.id_token || tokens.access_token)

        // Consulta el backend para obtener perfil completo
        const { data } = await api.get('/auth/whoami')
        const { sub, email, name } = data || {}
        setUser({ sub, email, name })
      } catch {
        setUser(null)
      } finally {
        setAuthReady(true)
      }
    }

    loadUser()
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
