-- ============================================
-- MacroReborn — Migración Fase 2 / Bloque 2
-- ============================================
-- Crea la tabla necesaria para:
--   - Chat general
--
-- NO modifica ni elimina las tablas de bloques anteriores.
-- Seguro de re-ejecutar (usa IF NOT EXISTS / WHERE NOT EXISTS).
-- ============================================


-- ==============================
-- CHAT GENERAL
-- ==============================
-- Reemplaza "chatGeneral" (localStorage).
-- user_id queda NULL para mensajes "de sistema" (ej: los de
-- bienvenida de MacroBot, que no son una cuenta real). Para mensajes
-- de usuarios reales, ON DELETE CASCADE borra sus mensajes del chat
-- si se borra la cuenta (mismo criterio que profile_comments).

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_id ON chat_messages(id);


-- ==============================
-- MENSAJES DE BIENVENIDA (una sola vez)
-- ==============================

INSERT INTO chat_messages (user_id, username, texto)
SELECT NULL, 'MacroBot', '👋 ¡Bienvenido al chat general de MacroReborn!'
WHERE NOT EXISTS (SELECT 1 FROM chat_messages);

INSERT INTO chat_messages (user_id, username, texto)
SELECT NULL, 'MacroBot', '🎮 Respetá a los demás jugadores y disfrutá la comunidad.'
WHERE NOT EXISTS (
  SELECT 1 FROM chat_messages
  WHERE texto = '🎮 Respetá a los demás jugadores y disfrutá la comunidad.'
);
