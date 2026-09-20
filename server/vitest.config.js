import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Todos los archivos de prueba comparten el mismo archivo SQLite en disco
    // (server/data/dss.db). Ejecutarlos en paralelo hace que resetForTests()
    // de un archivo choque con el de otro y falle con "database is locked".
    fileParallelism: false,
  },
});
