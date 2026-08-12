-- ============================================
-- MacroReborn — Migración Fase 3 / Amigos favoritos
-- ============================================
-- Crea la tabla necesaria para:
--   - Amigos favoritos (destacados en el perfil y usados para filtrar
--     la pestaña "Actividad de amigos", que antes mostraba la
--     actividad de TODOS los amigos y ahora solo la de los favoritos)
--
-- Mismo patrón que game_favorites (migración 005): una fila por
-- (usuario, amigo), con UNIQUE para poder usar ON CONFLICT al
-- agregar. El máximo de 10 favoritos por usuario se valida en la API
-- (api/social.js), no acá, para poder devolver un mensaje de error
-- claro en vez de que la base rechace el INSERT.
--
-- NO modifica ni elimina las tablas de bloques anteriores.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================

CREATE TABLE IF NOT EXISTS friend_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_favorites_user ON friend_favorites(user_id);
