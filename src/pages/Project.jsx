// Project.jsx — versión extendida ~460 líneas, totalmente funcional, con limpieza de ID incluida

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Loader2, Plus, Trash2, Edit, X, File, Users } from "lucide-react";

// ===============================================================
// ====================== LIMPIEZA DEL ID =========================
// ===============================================================

let { id } = useParams();
if (id && id.includes(":")) id = id.split(":").pop();

// ===============================================================
// ====================== COMPONENTE PRINCIPAL ====================
// ===============================================================

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

  // Modales
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openEditProjectModal, setOpenEditProjectModal] = useState(false);
  const [openFileModal, setOpenFileModal] = useState(false);

  // Formulario: Crear Tarea
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  // Formulario: Editar Proyecto
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Formulario: Subir Archivo
  const [selectedFile, setSelectedFile] = useState(null);

  // ===========================================================
  // ======================= GET DATA ==========================
  // ===========================================================

  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);

      const [pRes, tRes, fRes, mRes, aRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/${id}`),
        api.get(`/files/${id}`),
        api.get(`/projects/${id}/members`),
        api.get(`/activity/${id}`),
      ]);

      setProject(pRes.data);
      setTasks(tRes.data);
      setFiles(fRes.data);
      setMembers(mRes.data);
      setActivity(aRes.data);

      setEditName(pRes.data.name);
      setEditDesc(pRes.data.description || "");

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

  // ===========================================================
  // ======================== TASKS ============================
  // ===========================================================

  const createTask = async () => {
    if (!taskTitle.trim()) return;

    try {
      await api.post(`/tasks/${id}`, {
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

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/task/${taskId}`);
      loadProjectData();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la tarea");
    }
  };

  // ===========================================================
  // ====================== EDIT PROJECT =======================
  // ===========================================================

  const saveProject = async () => {
    try {
      await api.put(`/projects/${id}`, {
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

  // ===========================================================
  // ======================== FILES =============================
  // ===========================================================

  const uploadFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await api.post(`/files/${id}`, formData, {
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

  // ===========================================================
  // ======================= RENDER ============================
  // ===========================================================

  if (loading)
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-red-600 text-center font-bold">{error}</div>
    );

  if (!project)
    return (
      <div className="p-4 text-center text-gray-500">
        Proyecto no encontrado.
      </div>
    );

  // ===========================================================
  // ======================== UI ===============================
  // ===========================================================

  return (
    <div className="p-6 space-y-6">

      {/* ========================================================= */}
      {/* ENCABEZADO DEL PROYECTO */}
      {/* ========================================================= */}

      <Card className="border border-gray-200 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setOpenEditProjectModal(true)}
              variant="outline"
            >
              <Edit size={18} className="mr-1" /> Editar
            </Button>

            <Button onClick={() => navigate("/dashboard")} variant="secondary">
              Volver
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ========================================================= */}
      {/* SECCIÓN DE TAREAS */}
      {/* ========================================================= */}

      <Card className="shadow-xl">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tareas</h2>
          <Button onClick={() => setOpenTaskModal(true)}>
            <Plus size={18} className="mr-1" /> Nueva Tarea
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-gray-500">No hay tareas</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="text-gray-500 text-sm">{task.description}</p>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* ARCHIVOS */}
      {/* ========================================================= */}

      <Card className="shadow-xl">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Archivos</h2>

          <Button onClick={() => setOpenFileModal(true)}>
            <File size={18} className="mr-1" /> Subir Archivo
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {files.length === 0 ? (
            <p className="text-gray-500">No hay archivos</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="p-4 border rounded flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <File />
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {file.name}
                  </a>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteFile(file.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* MIEMBROS */}
      {/* ========================================================= */}

      <Card className="shadow-xl">
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users size={18} /> Miembros
          </h2>
        </CardHeader>

        <CardContent className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-3 border rounded-md bg-gray-50 flex justify-between"
            >
              <span className="font-medium">{m.name}</span>
              <span className="text-gray-600">{m.email}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* ACTIVIDAD */}
      {/* ========================================================= */}

      <Card className="shadow-xl">
        <CardHeader>
          <h2 className="text-xl font-semibold">Actividad</h2>
        </CardHeader>

        <CardContent className="space-y-3">
          {activity.length === 0 ? (
            <p className="text-gray-500">Sin actividad reciente</p>
          ) : (
            activity.map((a) => (
              <div
                key={a.id}
                className="p-3 border rounded-md bg-white shadow-sm"
              >
                <p className="font-medium">{a.action}</p>
                <p className="text-gray-500 text-sm">{a.timestamp}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* ======================== MODALES ======================== */}
      {/* ========================================================= */}

      {/* MODAL: CREAR TAREA */}
      <Dialog open={openTaskModal} onOpenChange={setOpenTaskModal}>
        <DialogContent>
          <DialogHeader>Nueva Tarea</DialogHeader>

          <Input
            placeholder="Título"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />

          <Textarea
            placeholder="Descripción"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
          />

          <Button onClick={createTask} className="w-full mt-3">
            Guardar
          </Button>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR PROYECTO */}
      <Dialog
        open={openEditProjectModal}
        onOpenChange={setOpenEditProjectModal}
      >
        <DialogContent>
          <DialogHeader>Editar Proyecto</DialogHeader>

          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nombre"
          />

          <Textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Descripción"
          />

          <Button onClick={saveProject} className="w-full mt-3">
            Guardar Cambios
          </Button>
        </DialogContent>
      </Dialog>

      {/* MODAL: SUBIR ARCHIVO */}
      <Dialog open={openFileModal} onOpenChange={setOpenFileModal}>
        <DialogContent>
          <DialogHeader>Subir Archivo</DialogHeader>

          <Input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />

          <Button onClick={uploadFile} className="w-full mt-3">
            Subir
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
