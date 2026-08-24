import { useEffect, useState } from 'react';
import { api, getToken, getUser, setToken, setUser, clearToken } from './api.js';

function Login({ onLogin }) {
  const [username, setUsername] = useState('alumno');
  const [password, setPassword] = useState('Alumno123');
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const data = await api.login(username, password);
      setToken(data.token);
      setUser(data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h2>Iniciar sesión</h2>
      <label>
        Usuario
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Contraseña
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit">Entrar</button>
      {error && <p className="error">{error}</p>}
      <p className="hint">
        Cuenta de ejemplo: <code>alumno/Alumno123</code>
      </p>
    </form>
  );
}

function Comentarios({ taskId }) {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState('');

  const load = () => api.listComments(taskId).then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, [taskId]);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    await api.addComment(taskId, body);
    setBody('');
    load();
  }

  return (
    <div className="comentarios">
      <h4>Comentarios</h4>
      {items.map((c) => (
        <div className="comentario" key={c.id}>
          <strong>{c.author_name}</strong>
          <div dangerouslySetInnerHTML={{ __html: c.body }} />
        </div>
      ))}
      <form onSubmit={submit}>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe un comentario" />
        <button type="submit">Comentar</button>
      </form>
    </div>
  );
}

function Tareas() {
  const [tasks, setTasks] = useState([]);
  const [q, setQ] = useState('');
  const [sql, setSql] = useState(null);
  const [abierta, setAbierta] = useState(null);

  const load = () => api.listTasks().then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []);

  async function buscar(e) {
    e.preventDefault();
    if (!q) { setSql(null); return load(); }
    const data = await api.searchTasks(q);
    setSql(data.sql);
    setTasks(data.rows);
  }

  return (
    <div>
      <form className="buscador" onSubmit={buscar}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tareas..." />
        <button type="submit">Buscar</button>
      </form>
      {sql && <pre className="sql">{sql}</pre>}

      {tasks.map((t) => (
        <div className="card" key={t.id}>
          <div className="fila">
            <div>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              <small>Entrega: {t.due_date ?? 'sin fecha'} · id {t.id}</small>
            </div>
            <div className="acciones">
              <button onClick={() => setAbierta(abierta === t.id ? null : t.id)}>
                {abierta === t.id ? 'Cerrar' : 'Comentarios'}
              </button>
              <button
                className="peligro"
                onClick={async () => { await api.deleteTask(t.id); load(); }}
              >
                Borrar
              </button>
            </div>
          </div>
          {abierta === t.id && <Comentarios taskId={t.id} />}
        </div>
      ))}
    </div>
  );
}

function Usuarios() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const load = () => api.listUsers().then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function cambiarRol(u, role) {
    await api.patchUser(u.id, { role });
    load();
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>id</th><th>usuario</th><th>contraseña</th><th>correo</th><th>teléfono</th><th>rol</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.username}</td>
            <td className="clave">{u.password}</td>
            <td>{u.email}</td>
            <td>{u.phone}</td>
            <td>
              <select value={u.role} onChange={(e) => cambiarRol(u, e.target.value)}>
                <option>ALUMNO</option>
                <option>PROFESOR</option>
                <option>ADMIN</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Archivos() {
  const [files, setFiles] = useState([]);
  const load = () => api.listFiles().then(setFiles).catch(() => setFiles([]));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <input
        type="file"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) { await api.uploadFile(f); load(); }
        }}
      />
      <ul>
        {files.map((f) => (
          <li key={f.id}>
            <a href={`/api/files/${f.id}/download`} target="_blank" rel="noreferrer">
              {f.original_name}
            </a>{' '}
            <small>({f.size} bytes · propietario {f.owner_id})</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [user, setUsuario] = useState(getUser());
  const [tab, setTab] = useState('usuarios');

  if (!getToken() || !user) return <div className="app"><Login onLogin={setUsuario} /></div>;

  return (
    <div className="app">
      <header>
        <h1>Gestor de Entregas Académicas</h1>
        <div>
          <span className="badge">{user.full_name} · {user.role}</span>
          <button onClick={() => { clearToken(); localStorage.removeItem('user'); setUsuario(null); }}>
            Salir
          </button>
        </div>
      </header>

      <nav>
        {['tareas', 'usuarios', 'archivos'].map((t) => (
          <button key={t} className={tab === t ? 'activo' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'tareas' && <Tareas />}
        {tab === 'usuarios' && <Usuarios />}
        {tab === 'archivos' && <Archivos />}
      </main>

      <footer>Versión 0.1.0-vulnerable · uso académico</footer>
    </div>
  );
}
