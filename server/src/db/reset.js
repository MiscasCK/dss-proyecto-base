// Reinicia la base de datos a su estado inicial.
// Se ejecuta con: `npm run db:reset`.

import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';

const dbPath = resolve(process.cwd(), config.dbFile);
rmSync(dbPath, { force: true });

const { initDb } = await import('./index.js');
const { dbPath: created } = initDb();

console.log(`Base de datos reiniciada: ${created}`);
