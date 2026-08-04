-- ============================================
-- MacroReborn — Migración Fase 1
-- ============================================
-- Crea las tablas necesarias para:
--   - Insignias / roles (administrador, moderador, colaborador)
--   - Logros
--   - Solicitudes de amistad y amistades
--
-- NO modifica ni elimina la tabla "users" existente.
-- NO borra usuarios.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- INSIGNIAS / ROLES
-- ==============================
-- badge_id: "administrador" | "moderador" | "colaborador"
-- (mismos ids que usa hoy js/motor/insignias.js)

CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);


-- ==============================
-- LOGROS
-- ==============================
-- achievement_id: coincide con las claves del catálogo LOGROS
-- en js/motor/logros.js (ej: "primerAvatar", "nivel10", "popular")

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);


-- ==============================
-- SOLICITUDES DE AMISTAD
-- ==============================
-- status: 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada'
-- Solo puede haber UNA solicitud pendiente por par (from,to) a la vez
-- (índice único parcial más abajo).

CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  responded_at TIMESTAMP,
  CHECK (from_user_id <> to_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_requests_pending
  ON friend_requests (from_user_id, to_user_id)
  WHERE status = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id, status);


-- ==============================
-- AMISTADES
-- ==============================
-- Se guarda UNA fila por dirección (igual que hoy "amigos_<A>" y
-- "amigos_<B>" se mantienen como dos listas separadas), para que
-- listar "mis amigos" sea un simple WHERE user_id = X.

CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
