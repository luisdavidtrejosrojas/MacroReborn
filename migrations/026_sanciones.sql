-- ============================================
-- MacroReborn — Migración 026: las sanciones
-- ============================================
-- Decidido el 28/09/2026 (docs/MODERACION.md). Hasta hoy "suspender"
-- solo ponía users.suspendido = true, y el servidor no lo miraba en
-- ningún sitio: la única cuenta suspendida siguió entrando y escribiendo.
-- Las advertencias del panel tampoco llegaban a nadie (puntos 16 y 17 de
-- docs/listas/AUDITORIA.md).
--
-- Cada sanción es una fila, con quién la puso, por qué y hasta cuándo:
--
--   advertencia  un aviso: le llega como notificación y queda apuntada;
--   suspension   hasta "hasta" (1, 3, 7 o 30 días): puede entrar, jugar
--                y mirar, pero no escribir;
--   baneo        sin fin: no puede entrar.
--
-- Levantar una no la borra: se apunta cuándo y quién (levantada_en,
-- levantada_por), y así queda el historial entero.
--
-- Las columnas viejas de users (suspendido, fecha_suspension,
-- motivo_suspension) dejan de usarse. Se quedan, sin tocar, hasta que se
-- quiten en una migración aparte.
-- ============================================

CREATE TABLE IF NOT EXISTS sanciones (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('advertencia', 'suspension', 'baneo')),
  motivo        TEXT NOT NULL,
  desde         TIMESTAMPTZ NOT NULL DEFAULT now(),
  hasta         TIMESTAMPTZ,
  impuesta_por  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  levantada_en  TIMESTAMPTZ,
  levantada_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
  CHECK (tipo <> 'suspension' OR hasta IS NOT NULL)
);

-- Las que siguen en pie, por cuenta: es lo que se mira en cada petición
-- (api/_sanciones.js) y en las listas de usuarios (api/users.js).
CREATE INDEX IF NOT EXISTS idx_sanciones_en_pie ON sanciones (user_id) WHERE levantada_en IS NULL;
