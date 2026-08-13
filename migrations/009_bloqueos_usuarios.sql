-- ============================================
-- MacroReborn — Migración Fase 3 / Bloqueos de usuario
-- ============================================
-- Crea la tabla necesaria para que un usuario pueda bloquear a otro
-- desde su perfil visitado (botón "Bloquear a este usuario" en
-- usuario.html).
--
-- Mismo patrón que friend_favorites (migración 007): una fila por
-- (bloqueador, bloqueado), con UNIQUE para poder usar ON CONFLICT al
-- bloquear y CHECK para no poder bloquearse a uno mismo.
--
-- NO modifica ni elimina las tablas de migraciones anteriores.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
