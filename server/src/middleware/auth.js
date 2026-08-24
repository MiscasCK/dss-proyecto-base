import { verifyToken } from '../auth.js';

// Verifica el token de sesión de la petición.
export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Falta el token de autenticación' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.user = user;
  next();
}

