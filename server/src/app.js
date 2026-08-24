import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { filesRouter } from './routes/files.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, cb) => cb(null, true),
      credentials: true,
    })
  );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '0.1.0-vulnerable' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/files', filesRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
  });

  app.use((err, req, res, next) => {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      query: req.query,
      body: req.body,
    });
  });

  return app;
}
