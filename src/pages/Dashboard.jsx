import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Dashboard() {
  const navigate = useNavigate()

  // Lista de proyectos obtenidos desde el backend
  const [projects, setProjects] = useState([])

  // Bandera para mostrar "Cargando..." mientras se obtienen los datos
  const [loading, setLoading] = useState(true)

  // Estado del formulario para crear un nuevo proyecto
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'activo'
  })

  // Carga inicial de proyectos al montar el componente
  useEffect(() => {
    api
      .get('/proyectos')
      .then(r => setProjects(r.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Envía la información del formulario al backend para crear un proyecto nuevo
  const createProject = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/proyectos', form)

      // Manejo flexible dependiendo de cómo responda el backend
      const newProject = data.proyecto || data || {}

      // Actualiza la lista local sin recargar
      setProjects(prev => [...prev, newProject])

      // Limpia el formulario después de crear el proyecto
      setForm({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'activo'
      })

      alert("¡Proyecto creado con éxito!")
    } catch (err) {
      console.error("Error creando proyecto:", err)
      alert("No se pudo crear el proyecto")
    }
  }

  // Definición de fuentes para mantener coherencia visual
  const fontText = "'Trebuchet MS', Tahoma, sans-serif"
  const fontTitle = "Georgia, serif"

  // Pantalla de carga temporal
  if (loading) return <p style={{ fontFamily: fontText, padding: 20 }}>Cargando...</p>

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: fontText, paddingTop: "40px" }}>

      {/* Contenedor principal centrado */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>

        {/* --- ENCABEZADO DEL MÓDULO --- */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <h2 style={{ color: "#a94523", margin: 0, fontFamily: fontTitle, fontSize: "32px" }}>
            Mis Proyectos
          </h2>
        </div>

        {/* --- FORMULARIO DE CREACIÓN DE PROYECTOS --- */}
        <div style={{
          background: "#ffffff",
          padding: "30px",
          borderRadius: "20px",
          boxShadow: "0 8px 25px rgba(44, 16, 12, 0.1)",
          border: "2px solid #c47d51",
          marginBottom: "40px"
        }}>

          {/* Título del formulario */}
          <h3 style={{ marginTop: 0, color: "#2c100c", fontFamily: fontTitle }}>
            Nuevo Proyecto
          </h3>

          {/* Formulario controlado por React */}
          <form onSubmit={createProject} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

            {/* Campo: Nombre */}
            <input
              placeholder="Nombre"
              value={form.nombre}
              required
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #c47d51",
                background: "#ffffff",
                fontFamily: fontText
              }}
            />

            {/* Campo: Descripción */}
            <input
              placeholder="Descripción"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #c47d51",
                background: "#ffffff",
                fontFamily: fontText
              }}
            />

            {/* Fechas de inicio y fin */}
            <div style={{ display: "flex", gap: "35px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", marginBottom: 5, color: "#a94523", fontWeight: "bold" }}>
                  Inicio
                </label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #c47d51",
                    fontFamily: fontText
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", marginBottom: 5, color: "#a94523", fontWeight: "bold" }}>
                  Fin
                </label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #c47d51",
                    fontFamily: fontText
                  }}
                />
              </div>
            </div>

            {/* Selector de estado */}
            <select
              value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #c47d51",
                background: "#ffffff",
                fontFamily: fontText
              }}
            >
              <option value="activo">Activo</option>
              <option value="en_progreso">En progreso</option>
              <option value="pausado">Pausado</option>
              <option value="cerrado">Cerrado</option>
            </select>

            {/* Botón de envío */}
            <button
              type="submit"
              style={{
                marginTop: "10px",
                padding: "14px",
                background: "#a94523",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: fontText,
                boxShadow: "0 4px 12px rgba(44, 16, 12, 0.3)"
              }}
            >
              Crear Proyecto
            </button>
          </form>
        </div>

        {/* --- LISTA DE PROYECTOS EXISTENTES --- */}
        <div>
          {projects.length === 0 ? (
            // Vista si no existen proyectos creados
            <div style={{ textAlign: "center", color: "#2c100c", padding: "40px" }}>
              <div style={{ fontSize: "50px", marginBottom: "10px" }}>🍂</div>
              <p>No hay proyectos registrados aún...</p>
            </div>
          ) : (
            // Grid de tarjetas de proyectos
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px"
            }}>

              {projects.map(p => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/project/${p._id}`)} // Redirección al detalle del proyecto
                  style={{
                    background: "#ffffff",
                    padding: "20px",
                    borderRadius: "16px",
                    border: "2px solid #c47d51",
                    borderTop: "6px solid #a94523",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >

                  {/* Nombre del proyecto */}
                  <h4 style={{ margin: 0, fontSize: "19px", color: "#2c100c", fontFamily: fontTitle }}>
                    {p.nombre}
                  </h4>

                  {/* Descripción breve */}
                  <p style={{ margin: "10px 0", color: "#6d4c41", fontSize: "14px", lineHeight: "1.4" }}>
                    {p.descripcion}
                  </p>

                  {/* Estado y fecha de vencimiento */}
                  <small style={{ color: "#2c100c" }}>
                    {p.estado || 'activo'}
                    {p.fecha_fin ? ` · vence ${p.fecha_fin}` : ''}
                  </small>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
