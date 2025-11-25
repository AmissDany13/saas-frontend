import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyStateOrThrow } from '../utils/auth'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Callback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithTokens } = useAuth()
  const ran = useRef(false) // Evita doble ejecución en React 18 StrictMode

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        const code = params.get('code')
        const state = params.get('state')
        verifyStateOrThrow(state)
        if (!code) throw new Error('Missing code')

        // Intercambia el code por tokens en tu backend
        const { data } = await api.post('/auth/callback', {
          code,
          redirect_uri: import.meta.env.VITE_REDIRECT_URI
        })

        // Guardar tokens y limpiar state temporal
        loginWithTokens(data)
        localStorage.removeItem('oauth_state')

        // Forzar carga del perfil (opcional, AuthContext ya lo hace)
        await api.get('/auth/whoami')

        // Redirige al dashboard
        navigate('/dashboard', { replace: true })
      } catch (e) {
        console.error('LOGIN ERROR >>>', e?.response?.status, e?.response?.data || e.message)
        navigate('/login', { replace: true })
      }
    })()
  }, [])

  return <p style={{ padding: 16 }}>Procesando inicio de sesión…</p>
}
