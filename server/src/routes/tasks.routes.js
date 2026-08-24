import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

// GET /api/tasks  — lista las tareas
tasksRouter.get('/', (req, res) => {
  const tasks = db
    .prepare(
      `SELECT t.*, u.full_name AS author_name
         FROM tasks t JOIN users u ON u.id = t.created_by
        ORDER BY t.id`
    )
    .all();
  res.json(tasks);
});

// GET /api/tasks/search?q=...  — busca tareas por texto
tasksRouter.get('/search', (req, res) => {
  const q = req.query.q ?? '';
  const sql = `SELECT id, title, description, due_date, created_by, created_at
                 FROM tasks
                WHERE title LIKE '%${q}%' OR description LIKE '%${q}%'`;

  const rows = db.prepare(sql).all();
  res.json({ sql, rows });
});

// GET /api/tasks/:id  — una tarea
tasksRouter.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(task);
});

// POST /api/tasks  — crea una tarea
tasksRouter.post('/', (req, res) => {
  const { title, description, due_date } = req.body ?? {};

  const info = db
    .prepare('INSERT INTO tasks (title, description, due_date, created_by) VALUES (?,?,?,?)')
    .run(title, description ?? '', due_date ?? null, req.user.id);

  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
});

// PATCH /api/tasks/:id  — modifica una tarea
tasksRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

  const { title, description, due_date } = req.body ?? {};
  db.prepare('UPDATE tasks SET title=?, description=?, due_date=? WHERE id=?').run(
    title ?? task.title,
    description ?? task.description,
    due_date ?? task.due_date,
    id
  );

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

// DELETE /api/tasks/:id  — borra una tarea
tasksRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM comments WHERE task_id = ?').run(id);
  db.prepare('DELETE FROM submissions WHERE task_id = ?').run(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.status(204).end();
});

// --- Comentarios de una tarea ---

// GET /api/tasks/:id/comments  — comentarios de una tarea
tasksRouter.get('/:id/comments', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, u.full_name AS author_name
         FROM comments c JOIN users u ON u.id = c.author_id
        WHERE c.task_id = ? ORDER BY c.id`
    )
    .all(Number(req.params.id));
  res.json(rows);
});

// POST /api/tasks/:id/comments  — añade un comentario
tasksRouter.post('/:id/comments', (req, res) => {
  const taskId = Number(req.params.id);
  const { body } = req.body ?? {};

  const info = db
    .prepare('INSERT INTO comments (task_id, author_id, body) VALUES (?,?,?)')
    .run(taskId, req.user.id, body);

  res.status(201).json(db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid));
});
