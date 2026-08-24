// Cliente HTTP de la aplicación.

const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUser = () => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};
export const setUser = (u) => localStorage.setItem('user', JSON.stringify(u));

async function req(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw Object.assign(new Error(data?.error ?? res.statusText), { data, status: res.status });
  return data;
}

export const api = {
  login: (username, password) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  listTasks: () => req('/tasks'),
  searchTasks: (q) => req(`/tasks/search?q=${encodeURIComponent(q)}`),
  createTask: (task) => req('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  deleteTask: (id) => req(`/tasks/${id}`, { method: 'DELETE' }),

  listComments: (taskId) => req(`/tasks/${taskId}/comments`),
  addComment: (taskId, body) =>
    req(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

  listUsers: () => req('/users'),
  patchUser: (id, patch) => req(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  listFiles: () => req('/files'),
  uploadFile: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return req('/files', { method: 'POST', body: fd });
  },
};
