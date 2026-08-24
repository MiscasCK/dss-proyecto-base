import { Router } from 'express';
import multer from 'multer';
import { createReadStream } from 'node:fs';
import { join, resolve } from 'node:path';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

export const filesRouter = Router();

const uploadRoot = resolve(process.cwd(), config.uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

filesRouter.use(requireAuth);

// POST /api/files  — sube un archivo
filesRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });

  const info = db
    .prepare('INSERT INTO files (original_name, stored_name, mime, size, owner_id) VALUES (?,?,?,?,?)')
    .run(req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.user.id);

  res.status(201).json(db.prepare('SELECT * FROM files WHERE id = ?').get(info.lastInsertRowid));
});

// GET /api/files  — lista los archivos
filesRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM files ORDER BY id').all());
});

// GET /api/files/raw?name=...  — devuelve un archivo por su nombre
filesRouter.get('/raw', (req, res) => {
  const name = String(req.query.name ?? '');
  const target = join(uploadRoot, name);

  res.type('text/plain');
  createReadStream(target)
    .on('error', () => res.status(404).json({ error: 'Archivo no encontrado' }))
    .pipe(res);
});

// GET /api/files/:id/download  — descarga un archivo
filesRouter.get('/:id/download', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(Number(req.params.id));
  if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });

  res.setHeader('Content-Type', file.mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
  createReadStream(join(uploadRoot, file.stored_name))
    .on('error', () => res.status(404).json({ error: 'Archivo no encontrado en disco' }))
    .pipe(res);
});
