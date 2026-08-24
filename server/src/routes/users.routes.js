import { Router } from 'express';
import _ from 'lodash';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = Router();

// Todas las rutas de este archivo exigen sesión iniciada.
usersRouter.use(requireAuth);

// GET /api/users  — lista los usuarios
usersRouter.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY id').all();
  res.json(users);
});

// GET /api/users/:id  — un usuario
usersRouter.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// POST /api/users  — crea un usuario
usersRouter.post('/', (req, res) => {
  const { username, password, email, full_name, phone, role } = req.body ?? {};

  const info = db
    .prepare('INSERT INTO users (username, password, email, full_name, phone, role) VALUES (?,?,?,?,?,?)')
    .run(username, password, email, full_name, phone ?? null, role ?? 'ALUMNO');

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PATCH /api/users/:id  — modifica un usuario
usersRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Usuario no encontrado' });

  const merged = _.merge({}, current, req.body ?? {});

  db.prepare(
    'UPDATE users SET username=?, password=?, email=?, full_name=?, phone=?, role=? WHERE id=?'
  ).run(merged.username, merged.password, merged.email, merged.full_name, merged.phone ?? null, merged.role, id);

  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
});

// DELETE /api/users/:id  — borra un usuario
usersRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.status(204).end();
});
