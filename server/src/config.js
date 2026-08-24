// Configuración de la aplicación.

export const config = {
  port: Number(process.env.PORT) || 4000,

  appSecret: process.env.APP_SECRET || 'dss-secreto-super-seguro-2026',

  smtp: {
    host: 'smtp.tecdesoftware.example',
    user: 'notificaciones@tecdesoftware.example',
    pass: 'Notif2026!',
  },

  dbFile: process.env.DB_FILE || 'data/dss.db',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',

  useHttps: false,
};
