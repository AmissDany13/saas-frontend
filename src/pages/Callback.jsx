import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyStateOrThrow } from '../utils/auth'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Callback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithTokens } = useAuth()
  const ran = useRef(false) // evita doble ejecución en React 18 StrictMode

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        const code = params.get('code')
        const state = params.get('state')

        verifyStateOrThrow(state)            // valida state (no lo borres aquí)
        if (!code) throw new Error('Missing code')

        // ⚠️ Si tu backend usa otro path (ej. /api/auth/callback), cámbialo aquí
        const { data } = await api.post('/auth/callback', {
          code,
          redirect_uri: import.meta.env.VITE_REDIRECT_URI
        })

        // ✅ Guarda tokens en el contexto de auth
        loginWithTokens(data)

        // ✅ Limpia el state temporal del OAuth
        localStorage.removeItem('oauth_state')

        // ✅ Llama a /auth/whoami para completar el perfil y activar invitaciones
        await api.get('/auth/whoami')

        // ✅ Redirige a la página principal
        navigate('/', { replace: true })

      } catch (e) {
        console.error('LOGIN ERROR >>>', e?.response?.status, e?.response?.data || e.message)
        navigate('/login', { replace: true })
      }
    })()
  }, []) // eslint-disable-line

  return <p>Procesando inicio de sesión…</p>
}
