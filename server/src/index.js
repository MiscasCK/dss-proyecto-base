import { createApp } from './app.js';
import { initDb } from './db/index.js';
import { config } from './config.js';

const { seeded, dbPath } = initDb();

const app = createApp();

app.listen(config.port, () => {
  console.log('');
  console.log('  Gestor de Entregas Académicas  ·  versión 0.1.0-vulnerable');
  console.log('  ---------------------------------------------------------');
  console.log(`  API      http://localhost:${config.port}/api`);
  console.log(`  Salud    http://localhost:${config.port}/api/health`);
  console.log(`  BD       ${dbPath}${seeded ? '  (datos de ejemplo creados)' : ''}`);
  console.log('');
  console.log('  ADVERTENCIA: esta aplicación es deliberadamente insegura.');
  console.log('  Uso exclusivamente académico. No exponer en una red pública.');
  console.log('');
});
