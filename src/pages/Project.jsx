// Project.jsx — versión corregida con limpieza de ID y protección de rutas

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/AuthContext";

export default function Project() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ============================
  //     1. CAPTURAR ID SUCIO
  // ============================
  let { id } = useParams();

  // ============================
  //     2. LIMPIAR EL ID
  // ============================
  const cleanId = id?.includes(":") ? id.split(":").pop() : id;

  // Si el ID sucio viene en la URL, reescribimos la ruta limpia.
  useEffect(() => {
    if (id !== cleanId) {
      navigate(`/project/${cleanId}`, { replace: true });
    }
  }, [id, cleanId, navigate]);

  // ============================
  //     ESTADOS GLOBALES
  // ============================
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modales
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openEditProjectModal, setOpenEditProjectModal] = useState(false);
  const [openFileModal, setOpenFileModal] = useState(false);

  // Formularios
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  // ============================
  //   CARGAR DATOS DEL PROYECTO
  // ============================
  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);

      const [pRes, tRes, fRes, mRes, aRes] = await Promise.all([
        api.get(`/projects/${cleanId}`),
        api.get(`/tasks/${cleanId}`),
        api.get(`/files/${cleanId}`),
        api.get(`/projects/${cleanId}/members`),
        api.get(`/activity/${cleanId}`),
      ]);

      setProject(pRes.data);
      setTasks(tRes.data);
      setFiles(fRes.data);
      setMembers(mRes.data);
      setActivity(aRes.data);

      setEditName(pRes.data.name);
      setEditDesc(pRes.data.description || "");
    } catch (err) {
      console.error(err);
      setError("Error al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  }, [cleanId]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // ============================
  //      CREAR TAREA
  // ============================
  const createTask = async () => {
    if (!taskTitle.trim()) return;

    try {
      await api.post(`/tasks/${cleanId}`, {
        title: taskTitle,
        description: taskDescription,
      });

      setTaskTitle("");
      setTaskDescription("");
      setOpenTaskModal(false);

      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la tarea");
    }
  };

  // ============================
  //     ELIMINAR TAREA
  // ============================
  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/task/${taskId}`);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la tarea");
    }
  };

  // ============================
  //   EDITAR DATOS DEL PROYECTO
  // ============================
  const saveProject = async () => {
    try {
      await api.put(`/projects/${cleanId}`, {
        name: editName,
        description: editDesc,
      });

      setOpenEditProjectModal(false);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el proyecto");
    }
  };

  // ============================
  //       MANEJO DE ARCHIVOS
  // ============================
  const uploadFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await api.post(`/files/${cleanId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedFile(null);
      setOpenFileModal(false);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("Error al subir archivo");
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await api.delete(`/files/file/${fileId}`);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el archivo");
    }
  };

  // ============================
  //           RENDER UI
  // ============================

  if (loading)
    return (
      <div className="w-full flex justify-center py-20">
        <div className="animate-spin">Cargando…</div>
      </div>
    );

  if (error)
    return <div className="p-4 text-red-600 font-bold">{error}</div>;

  if (!project)
    return <div className="p-4 text-gray-500">Proyecto no encontrado.</div>;

  return (
    <div className="p-6 space-y-6">

      {/* ======================= HEADER ======================= */}
      <div className="border p-4 rounded shadow">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-gray-600">{project.description}</p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setOpenEditProjectModal(true)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Editar
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-orange-400 text-white rounded"
          >
            Volver
          </button>
        </div>
      </div>

      {/* ======================= TAREAS ======================= */}
      <div className="border p-4 rounded shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tareas</h2>

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setOpenTaskModal(true)}
          >
            + Nueva Tarea
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {tasks.length === 0 ? (
            <p className="text-gray-500">No hay tareas</p>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="p-3 border rounded flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">{t.title}</h3>
                  <p className="text-gray-500 text-sm">{t.description}</p>
                </div>

                <button
                  onClick={() => deleteTask(t.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================= ARCHIVOS ======================= */}
      <div className="border p-4 rounded shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Archivos</h2>

          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={() => setOpenFileModal(true)}
          >
            Subir archivo
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {files.length === 0 ? (
            <p className="text-gray-500">No hay archivos</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="p-3 border rounded flex justify-between items-center"
              >
                <a
                  href={file.url}
                  target="_blank"
                  className="underline text-blue-600"
                >
                  {file.name}
                </a>

                <button
                  onClick={() => deleteFile(file.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  X
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================= MIEMBROS ======================= */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Miembros</h2>

        {members.map((m) => (
          <div
            key={m.id}
            className="p-3 border rounded mb-2 bg-gray-50 flex justify-between"
          >
            <span>{m.name}</span>
            <span className="text-gray-600">{m.email}</span>
          </div>
        ))}
      </div>

      {/* ======================= ACTIVIDAD ======================= */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Actividad</h2>

        {activity.length === 0 ? (
          <p className="text-gray-500 mt-2">Sin actividad reciente</p>
        ) : (
          <div className="mt-2 space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="p-3 border bg-white rounded">
                <p className="font-medium">{a.action}</p>
                <p className="text-gray-500 text-sm">{a.timestamp}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================= MODAL CREAR TAREA ======================= */}
      {openTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-80">
            <h3 className="font-bold mb-3">Nueva Tarea</h3>

            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Título"
              className="border p-2 w-full mb-2"
            />

            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Descripción"
              className="border p-2 w-full mb-2"
            />

            <button
              className="w-full bg-blue-600 text-white p-2 rounded"
              onClick={createTask}
            >
              Guardar
            </button>

            <button
              className="w-full mt-2 p-2 bg-gray-300 rounded"
              onClick={() => setOpenTaskModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ======================= MODAL SUBIR ARCHIVO ======================= */}
      {openFileModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-80">
            <h3 className="font-bold mb-3">Subir archivo</h3>

            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="mb-3"
            />

            <button
              className="w-full bg-green-600 text-white p-2 rounded"
              onClick={uploadFile}
            >
              Subir
            </button>

            <button
              className="w-full mt-2 p-2 bg-gray-300 rounded"
              onClick={() => setOpenFileModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ======================= MODAL EDITAR PROYECTO ======================= */}
      {openEditProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96">
            <h3 className="font-bold mb-3">Editar Proyecto</h3>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border p-2 w-full mb-2"
            />

            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="border p-2 w-full mb-2"
            />

            <button
              className="w-full bg-blue-600 text-white p-2 rounded"
              onClick={saveProject}
            >
              Guardar Cambios
            </button>

            <button
              className="w-full mt-2 p-2 bg-gray-300 rounded"
              onClick={() => setOpenEditProjectModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
