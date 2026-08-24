# Gestor de Entregas Académicas · aplicación base

Aplicación web **deliberadamente vulnerable** para la asignatura *Desarrollo de
Software Seguro*. La iremos **descubriendo y asegurando sesión a sesión**.

La primera intención no es arreglarla. Antes de corregir hay que aprender a mirar:
entender **por qué** ocurren las fallas y qué decisión las dejó entrar.

> ⚠️ **Uso exclusivamente académico.** Esta aplicación contiene fallas de
> seguridad a propósito. No la despliegues en internet ni la ejecutes en una
> red que no controles.

## Qué hace

Gestiona entregas académicas con tres roles: **ADMIN**, **PROFESOR** y **ALUMNO**.
Permite iniciar sesión, administrar usuarios, crear tareas, comentar, y subir y
descargar archivos de entrega.

## Requisitos

- **Node.js ≥ 24** (usa el módulo integrado `node:sqlite`; la versión está fijada
  en `.nvmrc`). Comprueba con `node --version`.
- No necesitas Docker, ni PostgreSQL, ni compiladores: la base de datos es un
  archivo SQLite que se crea solo.

## Arranque

```bash
npm install      # desde esta carpeta (dss-proyecto-base/)
npm run dev      # levanta API y cliente a la vez
```

- API: <http://localhost:4000/api> · salud en `/api/health`
- Cliente: <http://localhost:5173>

Otros comandos:

```bash
npm test          # ejecuta la suite de pruebas (Vitest + Supertest)
npm run db:reset  # reinicia la base de datos al estado inicial
```

## Integración continua

El repositorio trae un pipeline en `.github/workflows/ci.yml`: en cada push y en
cada Pull Request corre `npm test`.

## Estructura

```
dss-proyecto-base/
├── server/            API Express + node:sqlite
│   ├── src/
│   │   ├── app.js         montaje de Express, CORS, manejo de errores
│   │   ├── config.js      configuración de la aplicación
│   │   ├── auth.js        emisión y verificación del token de sesión
│   │   ├── db/            esquema y datos de ejemplo
│   │   ├── middleware/    autenticación
│   │   └── routes/        auth · users · tasks · files
│   └── tests/         suite de pruebas
└── client/            React + Vite
    └── src/           App.jsx · api.js
```
