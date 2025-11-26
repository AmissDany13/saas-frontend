import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useProjects from "../context/ProjectContext";
import { getProjectById, createTask, deleteTask } from "../api/projects";

export default function Project() {
  const { id } = useParams();

  const cleanId = id.includes(":") ? id.split(":")[1] : id;

  const { setCurrentProject } = useProjects();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskName, setTaskName] = useState("");
  const [error, setError] = useState("");

  // ============================
  // CARGAR PROYECTO
  // ============================
  useEffect(() => {
    async function load() {
      try {
        setError("");
        const data = await getProjectById(cleanId);
        setProject(data);
        setCurrentProject(data);
      } catch (err) {
        setError("No se pudo cargar el proyecto");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cleanId]);

  // ============================
  // CREAR TAREA
  // ============================
  async function handleCreateTask(e) {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const newTask = await createTask(cleanId, { name: taskName });

      setProject((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));

      setTaskName("");
    } catch (err) {
      setError("No se pudo crear la tarea");
    }
  }

  // ============================
  // ELIMINAR TAREA
  // ============================
  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(cleanId, taskId);

      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t._id !== taskId),
      }));
    } catch (err) {
      setError("No se pudo eliminar la tarea");
    }
  }

  // ============================
  // RENDER
  // ============================
  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{project?.name}</h1>

      {/* FORM CREAR TAREA */}
      <form onSubmit={handleCreateTask} className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Nueva tarea"
          className="border p-2 rounded w-72"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Crear tarea
        </button>
      </form>

      {/* LISTA DE TAREAS */}
      <div className="space-y-3">
        {project?.tasks?.length === 0 && <p>No hay tareas.</p>}

        {project?.tasks?.map((task) => (
          <div
            key={task._id}
            className="p-3 border rounded flex justify-between items-center"
          >
            <span>{task.name}</span>

            <button
              onClick={() => handleDeleteTask(task._id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
