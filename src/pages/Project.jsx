import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

// --- CONSTANTES ---
const ESTADOS_PROYECTO = ['activo', 'en_progreso', 'pausado', 'cerrado'];
const ESTADOS_TAREA = ['pendiente', 'en_progreso', 'bloqueada', 'terminada'];

// --- ESTILOS VISUALES ---
const theme = {
  textDark: '#2c100c',    
  primary: '#a94523',     
  secondary: '#c47d51',   
  accent: '#ccd17d',      
  bg: '#ffffff',          
  fontTitle: "Georgia, serif",
  fontBody: "'Trebuchet MS', Tahoma, sans-serif"
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = d.length === 10 ? new Date(`${d}T00:00:00Z`) : new Date(d);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return d;
  }
}

export default function Project() {
  const { id } = useParams();
  
  // --- 1. ID LIMPIO: Quitamos el prefijo 'project:' para las peticiones de tareas ---
  const cleanId = id ? id.replace('project:', '') : '';

  const { user, authReady } = useAuth();
  
  const [project, setProject] = useState(null);
  const [editing, setEditing] = useState({ estado: 'activo', fecha_inicio: '', fecha_fin: '' });
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [myRole, setMyRole] = useState("viewer");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({ titulo: '', descripcion: '', estado: 'pendiente', responsables: [], fecha_inicio: '', fecha_fin: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ titulo: "", descripcion: "", estado: "pendiente", responsables: [], fecha_inicio: "", fecha_fin: "" });
  const [estadoFilter, setEstadoFilter] = useState('');
  const [responsableFilter, setResponsableFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProject, setSavingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedTasks, setExpandedTasks] = useState({});
  const canEdit = myRole === "editor" || myRole === "owner";
  const isOwner = myRole === "owner";
  const [taskFiles, setTaskFiles] = useState({});
  const [activity, setActivity] = useState([]);
  const [showActivity, setShowActivity] = useState(false);

  const loadProject = useCallback(async () => {
    // Usamos ID original para documentos de CouchDB
    const r = await api.get(`/proyectos/${id}`);
    setProject(r.data);
    setEditing({
      estado: r.data?.estado || 'activo',
      fecha_inicio: r.data?.fecha_inicio || '',
      fecha_fin: r.data?.fecha_fin || '',
    });
  }, [id]);
  
  const loadMembers = useCallback(async () => {
    const r = await api.get(`/proyectos/${id}/members`);
    setMembers(Array.isArray(r.data) ? r.data : []);
  }, [id]);

  const loadTasks = useCallback(async () => {
    try {
      // Usamos cleanId para tareas
      const res = await api.get(`/proyectos/${cleanId}/tareas`);
      setTasks(res.data || []);
    } catch (err) {
      console.error("Error cargando tareas (puede ser permiso 403)", err);
      // No lanzamos error global para no romper la UI
    }
  }, [cleanId]);

  const loadActivity = useCallback(async () => {
    try {
      // Usamos cleanId para actividad
      const res = await api.get(`/proyectos/${cleanId}/activity`);
      setActivity(res.data || []);
    } catch (err) {
      console.error("Error cargando actividad", err);
    }
  }, [cleanId]);

  // --- 2. FUNCIÓN DE CARGA BLINDADA ---
  const loadAll = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // A. CARGA CRÍTICA: Primero el proyecto y miembros.
      // Si esto falla, el proyecto no existe, así que aquí sí dejamos que salte al catch global.
      const projectReq = api.get(`/proyectos/${id}`);
      const membersReq = api.get(`/proyectos/${id}/members`);

      const [projectRes, membersRes] = await Promise.all([projectReq, membersReq]);

      setProject(projectRes.data);
      setMembers(membersRes.data || []);

      const me = membersRes.data.find(m => m.user_id === user?.sub);
      const userRole = me?.rol || "viewer";
      setMyRole(userRole);

      // B. CARGA SECUNDARIA: Tareas y Actividad.
      // Lo ponemos en un try/catch interno. Si falla (ej. error 403), la página SIGUE funcionando.
      try {
          const tasksReq = api.get(`/proyectos/${cleanId}/tareas`);
          let activityReq = null;
          if (userRole !== "viewer") {
             activityReq = api.get(`/proyectos/${cleanId}/activity`);
          }

          const [tasksRes, activityRes] = await Promise.all([
             tasksReq, 
             activityReq ? activityReq : Promise.resolve({ data: [] })
          ]);

          setTasks(tasksRes.data || []);
          if (activityRes) setActivity(activityRes.data || []);

      } catch (secondaryError) {
          console.warn("No se pudieron cargar tareas o actividad (posible error 403):", secondaryError);
          // Dejamos las listas vacías pero NO bloqueamos la página
      }

      setLoading(false);
    } catch (err) {
      console.error("Error crítico cargando proyecto:", err);
      setErrorMsg("No se pudieron cargar los datos del proyecto.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!user) return;
    loadAll();
  }, [authReady, user, id, cleanId]);

  useEffect(() => {
    if (!showActivity) return;
    const interval = setInterval(() => { loadActivity() }, 5000);
    return () => clearInterval(interval);
  }, [showActivity, id, loadActivity]);

  const selectableMembers = useMemo(() => members.filter((m) => m.status === 'active' && !!m.user_id), [members]);
  const memberLabel = (m) => m.name || m.email || m.invited_email || m.user_id;
  function getResponsibleName(userId) {
    const m = members.find((x) => x.user_id === userId);
    return m ? memberLabel(m) : userId;
  }

  const filteredTasks = useMemo(() => {
    let arr = [...tasks];
    if (estadoFilter) arr = arr.filter((t) => t.estado === estadoFilter);
    if (responsableFilter) arr = arr.filter((t) => Array.isArray(t.responsables) && t.responsables.includes(responsableFilter));
    arr.sort((a, b) => {
      const af = fmtDate(a.fecha_fin);
      const bf = fmtDate(b.fecha_fin);
      if (!af && !bf) return (a.estado || '').localeCompare(b.estado || '');
      if (!af) return 1;
      if (!bf) return -1;
      return af.localeCompare(bf);
    });
    return arr;
  }, [tasks, estadoFilter, responsableFilter]);

  const taskStats = useMemo(() => {
    const stats = { pendiente: 0, en_progreso: 0, bloqueada: 0, terminada: 0 };
    for (const t of tasks) if (stats[t.estado] !== undefined) stats[t.estado]++;
    const total = tasks.length;
    return { ...stats, total };
  }, [tasks]);

  function getSegments(stats) {
    const { pendiente, en_progreso, bloqueada, terminada, total } = stats;
    if (total === 0) return [];
    const data = [
      { label: "Pendiente", value: pendiente, color: theme.secondary }, 
      { label: "En progreso", value: en_progreso, color: theme.accent }, 
      { label: "Bloqueada", value: bloqueada, color: theme.textDark },
      { label: "Terminada", value: terminada, color: theme.primary }, 
    ];
    let cumulative = 0;
    return data.filter((d) => d.value > 0).map((d) => {
        const start = (cumulative / total) * 2 * Math.PI;
        cumulative += d.value;
        const end = (cumulative / total) * 2 * Math.PI;
        return { ...d, start, end };
      });
  }

  const onSaveProject = async (e) => {
    e.preventDefault();
    if (savingProject) return;
    try {
      setSavingProject(true);
      await api.patch(`/proyectos/${id}`, {
        estado: editing.estado,
        fecha_inicio: editing.fecha_inicio || null,
        fecha_fin: editing.fecha_fin || null,
      });
      await loadProject();
    } catch (e) { setErrorMsg('No se pudo guardar el proyecto.'); } finally { setSavingProject(false); }
  };

  const onInvite = async (e) => {
    e.preventDefault();
    if (inviting) return;
    const email = String(inviteEmail).trim();
    if (!email || !isValidEmail(email)) { setErrorMsg('Escribe un correo válido.'); return; }
    try {
      setInviting(true);
      await api.post(`/proyectos/${id}/members`, { email, rol: inviteRole });
      setInviteEmail('');
      await loadMembers();
    } catch (e) { setErrorMsg('No se pudo agregar el miembro.'); } finally { setInviting(false); }
  };

  const onRemoveMember = async (userId) => {
    if (!userId) return;
    if (!window.confirm('¿Quitar miembro?')) return;
    try { await api.delete(`/proyectos/${id}/members/${userId}`); } catch (e) { setErrorMsg('Error al quitar miembro.'); } finally { await loadMembers(); }
  };

  async function onRoleChange(member, newRole) {
    const idUser = member.user_id || member.invited_email;
    try { await api.patch(`/proyectos/${project._id}/members/${idUser}/role`, { rol: newRole }); await loadMembers(); } catch (e) { setErrorMsg("Error al actualizar rol."); }
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("csv", file);
    try {
      // Usamos cleanId
      const r = await api.post(`/proyectos/${cleanId}/tareas/import-csv`, form, { headers: { "Content-Type": "multipart/form-data" } });
      alert(`Importadas: ${r.data.created} / ${r.data.total}\nErrores: ${r.data.errors.length}`);
      await loadTasks(); await loadActivity();
    } catch (err) { alert("Error al importar CSV"); }
  }

  const onCreateTask = async (e) => {
    e.preventDefault();
    if (creatingTask) return;
    const titulo = String(taskForm.titulo || '').trim();
    if (!titulo) return;
    try {
      setCreatingTask(true);
      // Usamos cleanId
      await api.post(`/proyectos/${cleanId}/tareas`, {
        titulo,
        descripcion: taskForm.descripcion || '',
        estado: taskForm.estado,
        responsables: taskForm.responsables,
        fecha_inicio: taskForm.fecha_inicio || null,
        fecha_fin: taskForm.fecha_fin || null,
      });
      setTaskForm({ titulo: '', descripcion: '', estado: 'pendiente', responsables: [], fecha_inicio: '', fecha_fin: '' });
      await loadTasks(); await loadActivity();
    } catch (e) { setErrorMsg('Error al crear tarea.'); } finally { setCreatingTask(false); }
  };

  async function loadFiles(taskId) {
    // Usamos cleanId
    const r = await api.get(`/proyectos/${cleanId}/tareas/${taskId}/files`);
    setTaskFiles((prev) => ({ ...prev, [taskId]: r.data || [] }));
  }

  async function uploadFiles(taskId, files) {
    for (const f of files) {
      const form = new FormData();
      form.append("file", f);
      // Usamos cleanId
      await api.post(`/proyectos/${cleanId}/tareas/${taskId}/files`, form, { headers: { "Content-Type": "multipart/form-data" } });
    }
    await loadFiles(taskId);
  }

  function toggleTask(taskId) {
    setExpandedTasks(prev => {
      const isOpen = !!prev[taskId];
      if (!isOpen && !taskFiles[taskId]) loadFiles(taskId);
      return { ...prev, [taskId]: !isOpen };
    });
  }

  async function deleteFile(taskId, fileId) {
    // Usamos cleanId
    await api.delete(`/proyectos/${cleanId}/tareas/${taskId}/files/${fileId}`);
    await loadFiles(taskId);
  }

  function startEditTask(task) {
    setEditingTask(task._id);
    setEditForm({
      titulo: task.titulo || "",
      descripcion: task.descripcion || "",
      estado: task.estado || "pendiente",
      responsables: task.responsables || [],
      fecha_inicio: fmtDate(task.fecha_inicio) || "",
      fecha_fin: fmtDate(task.fecha_fin) || ""
    });
  }

  async function onEditTask(e) {
    e.preventDefault();
    if (!editingTask) return;
    try {
      // Usamos cleanId
      await api.patch(`/proyectos/${cleanId}/tareas/${editingTask}`, {
        titulo: editForm.titulo,
        descripcion: editForm.descripcion,
        estado: editForm.estado,
        responsables: editForm.responsables,
        fecha_inicio: editForm.fecha_inicio || null,
        fecha_fin: editForm.fecha_fin || null,
      });
      setEditingTask(null); await loadTasks(); await loadActivity();
    } catch (err) { setErrorMsg("Error al editar tarea."); }
  }

  async function onDeleteTask(taskId) {
    if (!window.confirm("¿Eliminar tarea?")) return;
    // Usamos cleanId
    try { await api.delete(`/proyectos/${cleanId}/tareas/${taskId}`); await loadTasks(); await loadActivity(); } catch (err) { setErrorMsg("Error al eliminar tarea."); }
  }

  async function onDeleteProject() {
    if (!window.confirm("¿Eliminar proyecto completo?")) return;
    try { await api.delete(`/proyectos/${id}`); window.location.href = "/"; } catch (err) { setErrorMsg("Error al eliminar proyecto."); }
  }

  const projectDatesBadge = useMemo(() => {
    const ini = fmtDate(project?.fecha_inicio);
    const fin = fmtDate(project?.fecha_fin);
    if (!ini && !fin) return null;
    if (ini && fin) return `(${ini} → ${fin})`;
    if (ini) return `(inicio: ${ini})`;
    return `(vence: ${fin})`;
  }, [project]);

  const containerStyle = { padding: "40px 20px", maxWidth: 1000, margin: '0 auto', fontFamily: theme.fontBody, color: theme.textDark };
  const cardStyle = { background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #eee", borderTop: `5px solid ${theme.primary}`, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "30px" };
  const inputStyle = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontFamily: theme.fontBody, boxSizing: "border-box" };
  const btnPrimary = { background: theme.primary, color: "white", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "bold", cursor: "pointer", fontFamily: theme.fontBody };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: theme.fontBody }}>Cargando proyecto…</div>;
  if (!project) return <div style={{ padding: 40, textAlign: 'center', fontFamily: theme.fontBody }}>Proyecto no encontrado.<button onClick={loadAll} style={btnPrimary}>Reintentar</button></div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.bg }}>
      <div style={containerStyle}>
        <header style={{ marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontFamily: theme.fontTitle, color: theme.textDark, fontSize: '32px' }}>
            {project.nombre} <small style={{ fontWeight: 400, color: theme.secondary, fontSize: '0.6em' }}>{project?.estado ? `· ${project.estado.toUpperCase()}` : ''} {projectDatesBadge || ''}</small>
          </h1>
          <p style={{ marginTop: 8, color: '#555' }}>{project.descripcion || 'Sin descripción'}</p>
          {isOwner && <button onClick={onDeleteProject} style={{ background: "transparent", border: "1px solid #ffb3b3", color: "#d32f2f", padding: "6px 12px", borderRadius: 8, cursor: "pointer", marginTop: 10, fontSize: '12px' }}>Eliminar proyecto</button>}
        </header>

        {errorMsg && <div style={{ background: '#ffe8e8', border: `1px solid ${theme.primary}`, color: theme.primary, padding: 15, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}><span>{errorMsg}</span><button onClick={loadAll} style={{...btnPrimary, padding: '4px 10px', fontSize: 12}}>Reintentar</button></div>}

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, fontFamily: theme.fontTitle, color: theme.textDark }}>Configuración</h2>
          {canEdit ? (
            <form onSubmit={onSaveProject} style={{ display: "grid", gap: 15 }}>
              <div style={{ display: "grid", gap: 6 }}><label style={{fontSize: '14px', fontWeight: 'bold'}}>Estado</label><select value={editing.estado} onChange={(e) => setEditing((s) => ({ ...s, estado: e.target.value }))} style={inputStyle}>{ESTADOS_PROYECTO.map((op) => <option key={op} value={op}>{op.replace("_", " ")}</option>)}</select></div>
              <div style={{ display: "grid", gap: 15, gridTemplateColumns: "1fr 1fr" }}>
                <div><label style={{fontSize: '14px', fontWeight: 'bold', display:'block', marginBottom: 5}}>Inicio</label><input type="date" value={editing.fecha_inicio || ""} onChange={(e) => setEditing((s) => ({ ...s, fecha_inicio: e.target.value }))} style={inputStyle} /></div>
                <div><label style={{fontSize: '14px', fontWeight: 'bold', display:'block', marginBottom: 5}}>Fin</label><input type="date" value={editing.fecha_fin || ""} onChange={(e) => setEditing((s) => ({ ...s, fecha_fin: e.target.value }))} style={inputStyle} /></div>
              </div>
              <button type="submit" disabled={savingProject} style={{...btnPrimary, width: 'fit-content'}}>{savingProject ? "Guardando..." : "Guardar cambios"}</button>
            </form>
          ) : <p style={{ color: "#666" }}>🔒 Solo lectura.</p>}
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, fontFamily: theme.fontTitle, color: theme.textDark }}>Equipo <small style={{ color: theme.secondary }}>({members.length})</small></h2>
          <form onSubmit={onInvite} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input type="email" placeholder="email@ejemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{...inputStyle, flex: 1}} />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{...inputStyle, width: 'auto'}}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="owner">Owner</option></select>
            <button type="submit" disabled={inviting || !isValidEmail(inviteEmail)} style={btnPrimary}>{inviting ? '...' : 'Invitar'}</button>
          </form>
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {members.map((m) => (
              <li key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <strong style={{color: theme.textDark}}>{memberLabel(m)}</strong>
                  <div style={{fontSize: '12px', color: '#666'}}>{isOwner && m.user_id !== user?.sub ? <select value={m.rol} onChange={(e) => onRoleChange(m, e.target.value)} style={{padding: 2, borderRadius: 4}}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="owner">Owner</option></select> : <span>{m.rol}</span>}<span style={{marginLeft: 8}}>• {m.status}</span></div>
                </div>
                {m.user_id ? <button onClick={() => onRemoveMember(m.user_id || m.invited_email)} style={{ background: 'white', border: '1px solid #ccc', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>Quitar</button> : <span style={{ fontSize: 12, color: '#999' }}>(pendiente)</span>}
              </li>
            ))}
          </ul>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, fontFamily: theme.fontTitle, color: theme.textDark }}>Progreso</h2>
          {taskStats.total === 0 ? <p style={{ color: "#666" }}>No hay tareas.</p> : (
            <div style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: "wrap" }}>
              <svg width="160" height="160" viewBox="0 0 32 32" style={{transform: 'rotate(-90deg)'}}>
                {getSegments(taskStats).map((seg, i) => {
                  if (seg.value === taskStats.total) return <circle key={i} cx="16" cy="16" r="16" fill={seg.color} />;
                  const radius = 16, x1 = 16 + radius * Math.cos(seg.start), y1 = 16 + radius * Math.sin(seg.start), x2 = 16 + radius * Math.cos(seg.end), y2 = 16 + radius * Math.sin(seg.end), largeArc = seg.end - seg.start > Math.PI ? 1 : 0;
                  return <path key={i} d={`M 16 16 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth={0.5} />;
                })}
              </svg>
              <ul style={{ listStyle: 'none', padding: 0 }}><li style={{marginBottom: 5}}><strong>Total:</strong> {taskStats.total}</li><li style={{color: theme.secondary}}>Pendiente: {taskStats.pendiente}</li><li style={{color: theme.accent}}>En progreso: {taskStats.en_progreso}</li><li style={{color: theme.textDark}}>Bloqueada: {taskStats.bloqueada}</li><li style={{color: theme.primary}}>Terminada: {taskStats.terminada}</li></ul>
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, fontFamily: theme.fontTitle, color: theme.textDark }}>Tareas <small style={{ color: theme.secondary }}>({filteredTasks.length} visibles)</small></h2>
          {canEdit && <div style={{ marginBottom: 20, padding: 10, background: '#f9f9f9', borderRadius: 8 }}><label style={{fontSize: 14, fontWeight: 'bold'}}>Importar CSV: </label><input type="file" accept=".csv" onChange={handleCsvUpload} style={{fontSize: 14}} /></div>}
          <div style={{ display: 'grid', gap: 15, gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
            <div><label style={{display:'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4}}>Estado</label><select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} style={inputStyle}><option value="">(Todos)</option>{ESTADOS_TAREA.map((op) => <option key={op} value={op}>{op.replace('_', ' ')}</option>)}</select></div>
            <div><label style={{display:'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4}}>Responsable</label><select value={responsableFilter} onChange={(e) => setResponsableFilter(e.target.value)} style={inputStyle}><option value="">(Todos)</option>{selectableMembers.map((m) => <option key={`opt-${m._id}`} value={m.user_id}>{memberLabel(m)}</option>)}</select></div>
          </div>
          {canEdit && (
            <form onSubmit={onCreateTask} style={{ background: '#fafafa', padding: 20, borderRadius: 12, border: '1px solid #eee', marginBottom: 25 }}>
              <h4 style={{marginTop: 0, fontFamily: theme.fontTitle, color: theme.secondary}}>Nueva Tarea</h4>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{display:'flex', gap: 10}}><input placeholder="Título" value={taskForm.titulo} onChange={(e) => setTaskForm((s) => ({ ...s, titulo: e.target.value }))} required style={{...inputStyle, flex: 2}} /><select value={taskForm.estado} onChange={(e) => setTaskForm((s) => ({ ...s, estado: e.target.value }))} style={{...inputStyle, flex: 1}}>{ESTADOS_TAREA.map((op) => <option key={op} value={op}>{op.replace('_', ' ')}</option>)}</select></div>
                <input placeholder="Descripción" value={taskForm.descripcion} onChange={(e) => setTaskForm((s) => ({ ...s, descripcion: e.target.value }))} style={inputStyle} />
                <label style={{fontSize: 12, fontWeight: 'bold'}}>Responsables:</label><select multiple value={taskForm.responsables} onChange={(e) => setTaskForm((s) => ({ ...s, responsables: Array.from(e.target.selectedOptions).map(o => o.value) }))} style={{...inputStyle, height: 60}}>{selectableMembers.length === 0 ? <option disabled>Sin miembros</option> : selectableMembers.map((m) => <option key={m._id} value={m.user_id}>{memberLabel(m)}</option>)}</select>
                <div style={{display:'flex', gap: 10}}><input type="date" value={taskForm.fecha_inicio} onChange={(e) => setTaskForm((s) => ({ ...s, fecha_inicio: e.target.value }))} style={inputStyle} /><input type="date" value={taskForm.fecha_fin} onChange={(e) => setTaskForm((s) => ({ ...s, fecha_fin: e.target.value }))} style={inputStyle} /></div>
                <button type="submit" disabled={creatingTask} style={btnPrimary}>{creatingTask ? 'Creando...' : 'Agregar tarea'}</button>
              </div>
            </form>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
             {filteredTasks.length === 0 ? <p style={{textAlign:'center', color: '#888'}}>No hay tareas.</p> : filteredTasks.map((t) => (
                <div key={t._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 15, background: 'white', borderLeft: `4px solid ${theme.accent}` }}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div><button onClick={() => toggleTask(t._id)} style={{background:'none', border:'none', cursor:'pointer', fontSize: 16, marginRight: 5}}>{expandedTasks[t._id] ? '▼' : '▶'}</button><strong style={{color: theme.textDark}}>{t.titulo}</strong><span style={{fontSize: 12, marginLeft: 10, background: '#f0f0f0', padding: '2px 6px', borderRadius: 4}}>{t.estado}</span></div>
                      <div style={{fontSize: 12, color: '#666'}}>{t.responsables?.length > 0 && <span>👥 {t.responsables.length} </span>}{t.fecha_fin && <span>📅 {fmtDate(t.fecha_fin)}</span>}</div>
                   </div>
                   {expandedTasks[t._id] && (
                      <div style={{marginTop: 15, paddingLeft: 25, borderTop: '1px solid #f5f5f5', paddingTop: 10}}>
                          {editingTask !== t._id ? (
                             <><p style={{fontSize: 14, color: '#555'}}>{t.descripcion || 'Sin descripción'}</p><div style={{fontSize: 13, color: '#888', marginBottom: 10}}>Responsables: {t.responsables.map(r => getResponsibleName(r)).join(', ')}</div><div style={{marginBottom: 10}}><strong style={{fontSize: 12}}>Archivos:</strong>{canEdit && <input type="file" multiple onChange={(e) => uploadFiles(t._id, e.target.files)} style={{marginLeft: 10}} />}<ul style={{paddingLeft: 15, fontSize: 13}}>{(taskFiles[t._id] || []).map(f => (<li key={f._id}><a href={f.url} target="_blank" rel="noopener noreferrer" style={{color: theme.primary}}>{f.filename}</a>{canEdit && <button onClick={() => deleteFile(t._id, f._id)} style={{marginLeft:10, border:'none', color:'red', background:'none', cursor:'pointer'}}>x</button>}</li>))}</ul></div>{canEdit && (<div style={{display:'flex', gap: 10}}><button onClick={() => startEditTask(t)} style={{background:'#fff', border:'1px solid #ccc', padding:'5px 10px', borderRadius: 5, cursor:'pointer'}}>Editar</button><button onClick={() => onDeleteTask(t._id)} style={{background:'#fff0f0', border:'1px solid #ffcccb', color: '#d32f2f', padding:'5px 10px', borderRadius: 5, cursor:'pointer'}}>Eliminar</button></div>)}</>
                          ) : (
                             <form onSubmit={onEditTask} style={{display:'grid', gap: 8}}><input value={editForm.titulo} onChange={(e) => setEditForm({...editForm, titulo: e.target.value})} style={inputStyle} /><input value={editForm.descripcion} onChange={(e) => setEditForm({...editForm, descripcion: e.target.value})} style={inputStyle} /><div style={{display:'flex', gap: 5}}><button type="submit" style={btnPrimary}>Guardar</button><button type="button" onClick={() => setEditingTask(null)} style={{...btnPrimary, background: '#ccc', color: '#333'}}>Cancelar</button></div></form>
                          )}
                      </div>
                   )}
                </div>
             ))}
          </div>
        </section>

        {canEdit && (
          <section style={{ marginTop: 30, borderTop: '1px solid #eee', paddingTop: 20 }}>
            <h2 onClick={() => setShowActivity(!showActivity)} style={{ fontSize: 18, fontFamily: theme.fontTitle, cursor: 'pointer', color: theme.secondary }}>{showActivity ? '▼' : '▶'} Historial de actividad</h2>
            {showActivity && (
              <ul style={{ listStyle: 'none', background: '#fafafa', padding: 15, borderRadius: 8 }}>
                {activity.length === 0 ? <li>Sin actividad reciente.</li> : activity.map(a => (
                   <li key={a._id} style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 5 }}><strong style={{color: theme.textDark}}>{a.action}</strong><span style={{fontSize: 13, marginLeft: 8, color: '#555'}}>{a.description}</span><div style={{fontSize: 11, color: '#999'}}>{new Date(a.created_at).toLocaleString()}</div></li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}