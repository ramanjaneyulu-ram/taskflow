// Set VITE_API_URL in Vercel (e.g. https://taskflow-api.onrender.com).
// Locally it falls back to the Spring Boot dev server.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  list: () => request("/tasks"),
  create: (task) => request("/tasks", { method: "POST", body: JSON.stringify(task) }),
  update: (id, task) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) }),
  toggle: (id) => request(`/tasks/${id}/toggle`, { method: "PATCH" }),
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
