export function startLogin() {
  const auth = import.meta.env.VITE_APPID_AUTH_URL
  const clientId = import.meta.env.VITE_APPID_CLIENT_ID
  const redirect = encodeURIComponent(import.meta.env.VITE_REDIRECT_URI)
  const scope = encodeURIComponent(import.meta.env.VITE_SCOPES || 'openid email')

  // Genera y guarda state en localStorage (no en sessionStorage)
  const state = crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
  localStorage.setItem('oauth_state', state)

  const url = `${auth}?response_type=code&client_id=${clientId}`+`&redirect_uri=${redirect}&scope=${scope}&state=${state}&language=en`
  window.location.assign(url)
}

export function verifyStateOrThrow(stateParam) {
  const saved = localStorage.getItem('oauth_state')
  if (!stateParam || !saved || stateParam !== saved) {
    // Log para depurar rápido
    console.error('STATE MISMATCH', { stateParam, saved })
    throw new Error('Invalid OAuth state')
  }

}