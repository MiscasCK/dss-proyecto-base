// Acceso a datos con node:sqlite, el módulo SQLite integrado de Node.
// Se usa un driver "crudo", con SQL escrito a mano, en lugar de un ORM.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config } from '../config.js';

// `node:sqlite` no aparece en `module.builtinModules` con su nombre simple
// (`sqlite`): solo figura la forma con prefijo. Las herramientas que usan esa
// lista para saber que es un módulo integrado (Vite, Vitest, empaquetadores)
// intentan resolverlo como un paquete de npm llamado "sqlite" y fallan.
// Cargarlo con createRequire lo resuelve en tiempo de ejecución, donde Node sí
// lo reconoce, y evita tener que configurar cada herramienta por separado.
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const dbPath = resolve(process.cwd(), config.dbFile);
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

// SQLite no aplica claves foráneas si no se piden explícitamente.
db.exec('PRAGMA foreign_keys = ON;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  full_name  TEXT    NOT NULL,
  phone      TEXT,
  role       TEXT    NOT NULL DEFAULT 'ALUMNO',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  due_date    TEXT,
  created_by  INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT    NOT NULL,
  stored_name   TEXT    NOT NULL,
  mime          TEXT,
  size          INTEGER,
  owner_id      INTEGER NOT NULL REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  note       TEXT    NOT NULL DEFAULT '',
  file_id    INTEGER REFERENCES files(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id),
  author_id  INTEGER NOT NULL REFERENCES users(id),
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
`;

export function initSchema() {
  db.exec(SCHEMA);
}

export function seedIfEmpty() {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM users').get();
  if (total > 0) return false;

  const users = [
    ['admin', 'Admin123', 'admin@tecdesoftware.example', 'Ana Admin', '9991110001', 'ADMIN'],
    ['profesor', 'Profe123', 'profesor@tecdesoftware.example', 'Pablo Profesor', '9991110002', 'PROFESOR'],
    ['profesor2', 'Profe456', 'profesor2@tecdesoftware.example', 'Paola Profesora', '9991110003', 'PROFESOR'],
    ['alumno', 'Alumno123', 'alumno@tecdesoftware.example', 'Alma Alumna', '9991110004', 'ALUMNO'],
    ['alumno2', 'Alumno456', 'alumno2@tecdesoftware.example', 'Beto Alumno', '9991110005', 'ALUMNO'],
  ];
  const insUser = db.prepare(
    'INSERT INTO users (username, password, email, full_name, phone, role) VALUES (?,?,?,?,?,?)'
  );
  for (const u of users) insUser.run(...u);

  const insTask = db.prepare(
    'INSERT INTO tasks (title, description, due_date, created_by) VALUES (?,?,?,?)'
  );
  insTask.run('Práctica 1: Modelo de amenazas', 'Entregar el DFD de la aplicación.', '2026-09-15', 2);
  insTask.run('Práctica 2: Validación de entradas', 'Implementar la validación en el módulo asignado.', '2026-09-29', 2);
  insTask.run('Proyecto integrador (confidencial)', 'Rúbrica interna del profesor. No visible para alumnos.', '2026-12-01', 3);

  const insComment = db.prepare(
    'INSERT INTO comments (task_id, author_id, body) VALUES (?,?,?)'
  );
  insComment.run(1, 4, 'Profe, ¿se entrega en equipo o individual?');
  insComment.run(1, 2, 'En equipo de 3 personas.');

  return true;
}

export function initDb() {
  initSchema();
  const seeded = seedIfEmpty();
  return { seeded, dbPath };
}

// Deja la base de datos en su estado semilla, borrando cualquier dato previo.
// Pensado para las pruebas: llámalo en beforeEach para que cada prueba parta
// del mismo estado, independientemente de lo que hicieran las anteriores.
export function resetForTests() {
  // Primero recreamos el esquema: una prueba de ataque pudo haber hecho DROP TABLE,
  // así que la tabla podría ya no existir. CREATE TABLE IF NOT EXISTS la devuelve.
  // Solo después vaciamos y volvemos a sembrar.
  initSchema();
  db.exec(`
    DELETE FROM comments;
    DELETE FROM submissions;
    DELETE FROM files;
    DELETE FROM tasks;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('users','tasks','files','submissions','comments');
  `);
  seedIfEmpty();
}
