import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authReady } = useAuth()
  const location = useLocation()

  // 🔹 Espera a que AuthContext cargue los tokens
  if (!authReady) return <p style={{ padding: 16 }}>Cargando sesión…</p>

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />

  return children
}
