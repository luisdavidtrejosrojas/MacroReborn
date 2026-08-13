-- ============================================
-- MacroReborn — Migración: Galería de avatares guardados
-- ============================================
-- Agrega la posibilidad de que cada usuario guarde hasta 6 diseños de
-- avatar ya armados (como las "tarjetas de avatar" de Macrojuegos),
-- visibles tanto en el perfil propio (perfil.html) como en el perfil
-- público (usuario.html), con voto like/dislike de otros usuarios.
--
-- NO modifica ni elimina ninguna tabla existente. Seguro de
-- re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- AVATARES GUARDADOS (galería, 6 casilleros por usuario)
-- ==============================
-- "slot" va de 1 a 6 (un casillero de la galería). El avatar viaja
-- como JSONB con el mismo formato { modelo, fondo, piel, ojos, ... }
-- que ya usa la columna users.avatar.

CREATE TABLE IF NOT EXISTS saved_avatars (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 6),
  avatar JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_saved_avatars_user ON saved_avatars(user_id, slot);


-- ==============================
-- VOTO LIKE / DISLIKE SOBRE UN AVATAR GUARDADO
-- ==============================
-- Mismo criterio que "game_votes" (migración 006): un voto por
-- usuario y avatar guardado (UNIQUE), con toggle manejado en la API.

CREATE TABLE IF NOT EXISTS avatar_votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_id INTEGER NOT NULL REFERENCES saved_avatars(id) ON DELETE CASCADE,
  voto TEXT NOT NULL CHECK (voto IN ('like', 'dislike')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, avatar_id)
);

CREATE INDEX IF NOT EXISTS idx_avatar_votes_avatar ON avatar_votes(avatar_id);
