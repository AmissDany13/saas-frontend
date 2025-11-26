import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/AuthContext";

// limpiamos el id por si trae project:xxxx
let { id } = useParams();
if (id?.includes(":")) id = id.split(":").pop();

export default function Project() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modales
  const [taskModal, setTaskModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [fileModal, setFileModal] = useState(false);

  // formularios
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  // cargar datos
  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);

      const [p, t, f, m, a] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/${id}`),
        api.get(`/files/${id}`),
        api.get(`/projects/${id}/members`),
        api.get(`/activity/${id}`),
      ]);

      setProject(p.data);
      setTasks(t.data);
      setFiles(f.data);
      setMembers(m.data);
      setActivity(a.data);

      setEditName(p.data.name);
      setEditDesc(p.data.description || "");
    } catch (err) {
      setError("Error al cargar el proyecto");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // crear tarea
  const createTask = async () => {
    if (!taskTitle.trim()) return;

    try {
      await api.post(`/tasks/${id}`, {
        title: taskTitle,
        description: taskDescription,
      });

      setTaskTitle("");
      setTaskDescription("");
      setTaskModal(false);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("Error al crear la tarea");
    }
  };

  // eliminar tarea
  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/task/${taskId}`);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la tarea");
    }
  };

  // guardar proyecto
  const saveProject = async () => {
    try {
      await api.put(`/projects/${id}`, {
        name: editName,
        description: editDesc,
      });

      setEditModal(false);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el proyecto");
    }
  };

  // subir archivos
  const uploadFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await api.post(`/files/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedFile(null);
      setFileModal(false);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("Error al subir el archivo");
    }
  };

  // eliminar archivo
  const deleteFile = async (fileId) => {
    try {
      await api.delete(`/files/file/${fileId}`);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20 text-lg font-bold">
        Cargando...
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-center text-red-600 font-bold">{error}</div>
    );

  if (!project)
    return (
      <div className="p-4 text-center text-gray-500">Proyecto no encontrado.</div>
    );

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded shadow flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600">{project.description}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setEditModal(true)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Editar
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Volver
          </button>
        </div>
      </div>

      {/* TAREAS */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between">
          <h2 className="text-xl font-bold">Tareas</h2>
          <button
            onClick={() => setTaskModal(true)}
            className="px-3 py-2 bg-green-500 text-white rounded"
          >
            Nueva Tarea
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {tasks.length === 0 ? (
            <p className="text-gray-500">No hay tareas</p>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                className="p-4 border rounded flex justify-between"
              >
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-gray-500 text-sm">{t.description}</div>
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

      {/* ARCHIVOS */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between">
          <h2 className="text-xl font-bold">Archivos</h2>

          <button
            onClick={() => setFileModal(true)}
            className="px-3 py-2 bg-indigo-500 text-white rounded"
          >
            Subir Archivo
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {files.map((file) => (
            <div key={file.id} className="p-3 border rounded flex justify-between">
              <a
                href={file.url}
                target="_blank"
                className="underline text-blue-600"
                rel="noreferrer"
              >
                {file.name}
              </a>

              <button
                onClick={() => deleteFile(file.id)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MIEMBROS */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-3">Miembros</h2>

        {members.map((m) => (
          <div key={m.id} className="p-3 border rounded mb-2 bg-gray-50">
            <div className="font-medium">{m.name}</div>
            <div className="text-gray-600">{m.email}</div>
          </div>
        ))}
      </div>

      {/* ACTIVIDAD */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-3">Actividad</h2>

        {activity.length === 0 ? (
          <p className="text-gray-500">Sin actividad reciente</p>
        ) : (
          activity.map((a) => (
            <div key={a.id} className="p-3 border rounded mb-2">
              <p className="font-medium">{a.action}</p>
              <p className="text-gray-500 text-sm">{a.timestamp}</p>
            </div>
          ))
        )}
      </div>

      {/* MODAL: CREAR TAREA */}
      {taskModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded space-y-3 w-80">
            <h3 className="font-bold text-lg">Nueva tarea</h3>

            <input
              className="border p-2 w-full"
              placeholder="Título"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />

            <textarea
              className="border p-2 w-full"
              placeholder="Descripción"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />

            <button
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
              onClick={createTask}
            >
              Crear
            </button>

            <button
              className="mt-2 text-gray-600 underline w-full"
              onClick={() => setTaskModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded space-y-3 w-80">
            <h3 className="font-bold text-lg">Editar Proyecto</h3>

            <input
              className="border p-2 w-full"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <textarea
              className="border p-2 w-full"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
              onClick={saveProject}
            >
              Guardar
            </button>

            <button
              className="mt-2 text-gray-600 underline w-full"
              onClick={() => setEditModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SUBIR ARCHIVO */}
      {fileModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded space-y-3 w-80">
            <h3 className="font-bold text-lg">Subir archivo</h3>

            <input
              type="file"
              className="border p-2 w-full"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />

            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
              onClick={uploadFile}
            >
              Subir
            </button>

            <button
              className="mt-2 text-gray-600 underline w-full"
              onClick={() => setFileModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
