// Prueba del estado inicial del proyecto.

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';

let app;

beforeAll(() => {
  initDb();
  app = createApp();
});

describe('humo', () => {
  it('la API responde en /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
