import { Outlet, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user, logout } = useAuth()

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* --- HEADER ELEGANTE --- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 9999,
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backdropFilter: "blur(14px)",
          background: "#a94523", // Transparente-elegante
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          fontFamily: "'Trebuchet MS', Tahoma, sans-serif",
        }}
      >
        {/* LOGO / NOMBRE */}
        <Link
          to="/"
          style={{
            color: "#2c100c",
            fontSize: 22,
            textDecoration: "none",
            fontFamily: "Georgia, serif",
            fontWeight: "bold",
          }}
        >
          SaaS Proyectos
        </Link>

        {/* NAVEGACIÓN */}
        <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>

          {user ? (
            <>
              <span style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>
                {user?.name || user?.email}
              </span>

              <button
                onClick={logout}
                style={{
                  padding: "8px 16px",
                  background: "#c47d51",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                  transition: "0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#c47d51")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#a94523")
                }
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                padding: "8px 18px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.5)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: "bold",
                transition: "0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#a94523"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.25)"
              }}
            >
              Entrar
            </Link>
          )}
        </nav>
      </header>
      {/* --- FIN HEADER ELEGANTE --- */}

      {/* CONTENIDO DINÁMICO */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  )
}
