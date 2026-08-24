import { Router } from 'express';
import { findUserByCredentials, issueToken } from '../auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

// POST /api/auth/login  — inicia sesión y devuelve el token
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};

  const user = findUserByCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  return res.json({
    token: issueToken(user),
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    },
  });
});

// GET /api/auth/me  — datos del usuario de la sesión actual
authRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});
