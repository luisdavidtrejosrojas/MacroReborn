-- ============================================
-- MacroReborn — Migración Fase 2 / Bloque 3
-- ============================================
-- Crea las tablas necesarias para:
--   - Notificaciones
--   - Actividad reciente
--
-- NO modifica ni elimina las tablas de bloques anteriores.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- NOTIFICACIONES
-- ==============================
-- Reemplaza "notificaciones_<nombre>" (localStorage).

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, id DESC);


-- ==============================
-- ACTIVIDAD RECIENTE
-- ==============================
-- Reemplaza "actividad_<nombre>" (localStorage).
-- tipo: "juego" | "favorito" | "logro" | "nivel" | "amigo" | "comentario"
-- (mismos valores que ya usa js/motor/actividad.js).

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  detalle TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, id DESC);
