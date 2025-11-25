import { startLogin } from '../utils/auth'

export default function Login() {
  return (
    <div
      style={{
        // 1. CONFIGURACIÓN DE PANTALLA COMPLETA
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        zIndex: 9999,
        overflowY: "auto", 
        
        // 2. ESTILOS DEL FONDO (Panda Rojo)
        background: "#a94523", 
        display: "flex",
        flexDirection: "column", 
        alignItems: "center",
        fontFamily: "'Trebuchet MS', sans-serif"
      }}
    >
      
      {/* --- BARRA DE NAVEGACIÓN --- */}
      <div style={{
        width: "100%",
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between", 
        alignItems: "center",
        boxSizing: "border-box"
      }}>
        {/* Logo */}
        <a href="/" style={{ 
          textDecoration: "none", 
          fontSize: "20px", 
          fontWeight: "bold", 
          fontFamily: "Georgia, serif",
          color: "#fff" 
        }}>
          SaaS Proyectos
        </a>

        {/* Botón Entrar (Header) */}
        <a href="/login" style={{ 
          textDecoration: "none", 
          fontSize: "16px", 
          fontWeight: "600", 
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.3)",
          padding: "8px 20px",
          borderRadius: "20px",
          transition: "background 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
        >
          Entrar
        </a>
      </div>

      {/* --- CONTENEDOR CENTRAL --- */}
      <div style={{
        flex: 1, 
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        padding: 20,
      }}>
        
        {/* TARJETA BLANCA */}
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#ffffff",
            borderRadius: 20,
            padding: "50px 30px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 32,
              fontWeight: "bold",
              fontFamily: "Georgia, serif",
              color: "#2c100c", 
            }}
          >
            Inicia sesión
          </h2>

          <p style={{ marginTop: 4, marginBottom: 30, color: "#666", fontSize: "16px" }}>
            Accede con tu cuenta segura de IBM
          </p>

          {/* BOTÓN PRINCIPAL (Actualizado) */}
          <button
            onClick={startLogin}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "#a94523", 
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(169, 69, 35, 0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(169, 69, 35, 0.4)"
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(169, 69, 35, 0.3)"
            }}
          >
            ENTRAR (VERSIÓN NUBE)
          </button>

          <p style={{ marginTop: 30, color: "#888", fontSize: "14px" }}>
            © Tu SaaS – {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}