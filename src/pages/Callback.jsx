import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyStateOrThrow } from '../utils/auth'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Callback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithTokens } = useAuth()
  const ran = useRef(false)

  const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        const code = params.get('code')
        const state = params.get('state')
        verifyStateOrThrow(state)
        if (!code) throw new Error('Missing code')

        const { data } = await api.post('/auth/callback', { code, redirect_uri: REDIRECT_URI })

        loginWithTokens(data)
        localStorage.removeItem('oauth_state')
        await api.get('/auth/whoami')
        navigate('/', { replace: true })
      } catch (e) {
        console.error('LOGIN ERROR >>>', e?.response?.status, e?.response?.data || e?.message)
        navigate('/login', { replace: true })
      }
    })()
  }, [])

  return <p>Procesando inicio de sesión…</p>
}
