// Emisión y verificación del "token" de sesión.

import { db } from './db/index.js';

export function issueToken(user) {
  return Buffer.from(`${user.id}:${user.username}`).toString('base64');
}

export function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [rawId] = decoded.split(':');
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) return null;

    const user = db
      .prepare('SELECT id, username, email, full_name, phone, role FROM users WHERE id = ?')
      .get(id);
    return user ?? null;
  } catch {
    return null;
  }
}

export function findUserByCredentials(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}
