import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const EMPTY = { title: "", description: "", priority: "MEDIUM" };
const FILTERS = ["all", "active", "done"];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setTasks(await api.list());
    } catch (e) {
      setError(`Could not reach the server. ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "done") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const doneCount = tasks.filter((t) => t.completed).length;

  async function run(action) {
    try {
      setError("");
      await action();
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    run(async () => {
      if (editingId) {
        const current = tasks.find((t) => t.id === editingId);
        await api.update(editingId, { ...form, completed: current?.completed ?? false });
      } else {
        await api.create(form);
      }
      setForm(EMPTY);
      setEditingId(null);
    });
  }

  function startEdit(task) {
    setEditingId(task.id);
    setForm({ title: task.title, description: task.description || "", priority: task.priority });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  return (
    <main className="container">
      <header>
        <h1>TaskFlow</h1>
        <p className="subtitle">
          {tasks.length === 0
            ? "Nothing here yet — add your first task."
            : `${doneCount} of ${tasks.length} tasks completed`}
        </p>
      </header>

      {error && <div className="error">{error}</div>}

      <form className="card form" onSubmit={submit}>
        <input
          placeholder="What needs doing?"
          value={form.title}
          maxLength={120}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Details (optional)"
          value={form.description}
          maxLength={500}
          rows={2}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="form-row">
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="LOW">Low priority</option>
            <option value="MEDIUM">Medium priority</option>
            <option value="HIGH">High priority</option>
          </select>
          <div className="actions">
            {editingId && (
              <button type="button" className="ghost" onClick={cancelEdit}>
                Cancel
              </button>
            )}
            <button type="submit">{editingId ? "Save changes" : "Add task"}</button>
          </div>
        </div>
      </form>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={filter === f ? "chip active" : "chip"}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading… (the free server may take ~30s to wake up)</p>
      ) : visible.length === 0 ? (
        <p className="muted">No tasks to show.</p>
      ) : (
        <ul className="list">
          {visible.map((t) => (
            <li key={t.id} className={`card task ${t.completed ? "done" : ""}`}>
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => run(() => api.toggle(t.id))}
                aria-label={`Mark "${t.title}" as ${t.completed ? "active" : "done"}`}
              />
              <div className="task-body">
                <div className="task-title">
                  {t.title}
                  <span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                </div>
                {t.description && <p className="task-desc">{t.description}</p>}
              </div>
              <div className="task-actions">
                <button className="ghost" onClick={() => startEdit(t)}>
                  Edit
                </button>
                <button className="ghost danger" onClick={() => run(() => api.remove(t.id))}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
