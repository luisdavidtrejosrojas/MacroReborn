-- ============================================
-- MacroReborn — Migración Fase 2 / Bloque 4
-- ============================================
-- Crea las tablas necesarias para:
--   - Favoritos de juegos
--   - Últimos juegos jugados (historial corto, últimos 5)
--   - Juegos jugados para logros (juegos distintos, para siempre)
--
-- NO modifica ni elimina las tablas de bloques anteriores.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- FAVORITOS DE JUEGOS
-- ==============================
-- Reemplaza "favoritos_<nombre>" (localStorage).
-- game_id queda como TEXT porque así se usa en todo el sitio
-- (String(idJuego)), sin FK a una tabla de juegos (el catálogo de
-- juegos vive en js/datos-juegos.js, no en la base).

CREATE TABLE IF NOT EXISTS game_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_favorites_user ON game_favorites(user_id);


-- ==============================
-- ÚLTIMOS JUGADOS (historial corto)
-- ==============================
-- Reemplaza "historial_<nombre>" (localStorage, quedaban los últimos
-- 5). Una fila por (usuario, juego): cada vez que se juega de nuevo,
-- se actualiza "played_at" (ON CONFLICT) en vez de duplicar la fila,
-- así "ORDER BY played_at DESC LIMIT 5" arma el mismo orden que antes
-- (el juego vuelve al principio si se vuelve a jugar).

CREATE TABLE IF NOT EXISTS game_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  played_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_history_user ON game_history(user_id, played_at DESC);


-- ==============================
-- JUEGOS JUGADOS (para logros: Explorador / Coleccionista)
-- ==============================
-- Reemplaza "juegosJugados_<nombre>" (localStorage). A diferencia de
-- game_history, esto NUNCA se acorta: sirve para contar cuántos
-- juegos DISTINTOS jugó el usuario a lo largo de toda su cuenta.

CREATE TABLE IF NOT EXISTS games_played (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  first_played_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_games_played_user ON games_played(user_id);
