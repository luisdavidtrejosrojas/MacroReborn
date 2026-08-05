-- ============================================
-- MacroReborn — Migración Fase 2 / Bloque 1
-- ============================================
-- Crea las tablas necesarias para:
--   - Comentarios de perfil
--   - Likes (sistema genérico: comentarios, chat, reseñas)
--   - Reportes de comentarios/mensajes
--
-- NO modifica ni elimina las tablas de la Fase 1.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- COMENTARIOS DE PERFIL
-- ==============================
-- Reemplaza "comentarios_<nombre>" (localStorage).
-- author_user_id queda en NULL para comentarios de invitados
-- ("Usuario"/"Invitado") o si el autor borró su cuenta más tarde
-- (por eso ON DELETE SET NULL en vez de CASCADE en esa columna: el
-- comentario se borra en cascada solo si se borra el DUEÑO del perfil;
-- si se borra el AUTOR, el comentario desaparece igual porque
-- también cae bajo la FK CASCADE de author_user_id).

CREATE TABLE IF NOT EXISTS profile_comments (
  id SERIAL PRIMARY KEY,
  profile_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  author_username TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_comments_profile ON profile_comments(profile_user_id, id);


-- ==============================
-- LIKES (genérico)
-- ==============================
-- Reemplaza "likes_<clave>" (localStorage).
-- target_type: 'comment' | 'chat' | 'resena'
-- target_id:   id del comentario (profile_comments.id) | id del
--              mensaje de chat | "<idJuego>:<usuario>" para reseñas.
-- No lleva FK a users: se guarda el username tal cual (igual que hacía
-- la clave del array en JS), para que un like sobreviva aunque se
-- borre la cuenta de quien lo dio, y para poder likear contenido de
-- distinto origen (comentarios, chat, reseñas) con una sola tabla.

CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, username)
);

CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_username ON likes(username);


-- ==============================
-- REPORTES DE COMENTARIOS / MENSAJES
-- ==============================
-- Reemplaza "reportesComentarios" (localStorage).
-- target_type: 'comment' (vive en profile_comments) | 'chat' (vive en
-- chat_messages, tabla creada más abajo en 003_fase2_chat.sql).
-- estado: 'pendiente' | 'ignorado' | 'eliminado' | 'eliminado_no_encontrado'

CREATE TABLE IF NOT EXISTS comment_reports (
  id SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT,
  origen TEXT NOT NULL,
  content_username TEXT,
  content_texto TEXT,
  reported_by TEXT NOT NULL,
  motivo TEXT NOT NULL DEFAULT 'No especificado',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_estado ON comment_reports(estado, id);
