-- ============================================
-- MacroReborn — Migración Fase 2 / Bloque 5 (cierre de migración)
-- ============================================
-- Crea las tablas necesarias para:
--   - Reseñas de juegos (texto + calificación propia de la reseña)
--   - Calificación en estrellas "suelta" (widget de la ficha de juego,
--     independiente de si el usuario escribió una reseña)
--   - Voto like/dislike por juego
--   - Historial de moderación (acciones del panel admin/moderador)
--   - Suspensión de cuentas (antes vivía en "usuariosMacro", una clave
--     de localStorage que en la práctica ya no se llenaba)
--
-- NO modifica ni elimina las tablas de bloques anteriores.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- RESEÑAS DE JUEGOS
-- ==============================
-- Reemplaza "resenas_<idJuego>" (localStorage). Un usuario solo puede
-- tener una reseña por juego (UNIQUE), igual que antes.

CREATE TABLE IF NOT EXISTS game_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  texto TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  editado BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_reviews_game ON game_reviews(game_id, updated_at DESC);


-- ==============================
-- CALIFICACIÓN EN ESTRELLAS (widget suelto de la ficha de juego)
-- ==============================
-- Reemplaza "calificaciones_<idJuego>" (localStorage, objeto
-- { "usuario": puntuacion }).

CREATE TABLE IF NOT EXISTS game_ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_ratings_game ON game_ratings(game_id);


-- ==============================
-- VOTO LIKE / DISLIKE POR JUEGO
-- ==============================
-- Reemplaza "votosJuego_<idJuego>" (localStorage, objeto
-- { "usuario": "like"|"dislike" }).

CREATE TABLE IF NOT EXISTS game_votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  voto TEXT NOT NULL CHECK (voto IN ('like', 'dislike')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_votes_game ON game_votes(game_id);


-- ==============================
-- HISTORIAL DE MODERACIÓN
-- ==============================
-- Reemplaza "historialModeracion" (localStorage). Igual que
-- "comment_reports", guarda los nombres de usuario tal cual (TEXT, sin
-- FK) para que una entrada del historial sobreviva aunque se borre la
-- cuenta del moderador o del usuario afectado.

CREATE TABLE IF NOT EXISTS moderation_log (
  id SERIAL PRIMARY KEY,
  moderator_username TEXT NOT NULL,
  moderator_role TEXT NOT NULL,
  accion TEXT NOT NULL,
  usuario_afectado TEXT,
  motivo TEXT NOT NULL DEFAULT 'No especificado',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_fecha ON moderation_log(id DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_log_afectado ON moderation_log(usuario_afectado);


-- ==============================
-- SUSPENSIÓN DE CUENTAS
-- ==============================
-- Antes vivía en "usuariosMacro" (localStorage), una clave que dejó de
-- llenarse cuando el registro/login pasaron a Neon (Fase 1), así que
-- la suspensión no tenía ningún efecto real. Ahora es parte de la
-- propia fila de "users".

ALTER TABLE users ADD COLUMN IF NOT EXISTS suspendido BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS motivo_suspension TEXT;
