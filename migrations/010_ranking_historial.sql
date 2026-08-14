-- ============================================
-- MacroReborn — Migración / Historial de posición en el ranking
-- ============================================
-- Agrega a "users" las columnas necesarias para mostrar en el
-- ranking combinado (comunidad-ranking.html) si cada jugador subió o
-- bajó puestos, comparando su posición actual con la última que se
-- guardó.
--
-- rank_actual        -> última posición calculada (1 = primer puesto)
-- rank_anterior       -> la posición que tenía antes de ese cálculo
-- rank_actualizado_at -> cuándo se recalculó por última vez
--
-- Se recalculan solas desde api/users.js (acción interna, sin cron:
-- se dispara sola cuando pasaron más de ~20hs desde el último
-- cálculo) — no hace falta correr nada a mano después de esta
-- migración.
--
-- NO modifica ni elimina columnas ni tablas existentes.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_actual INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_anterior INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_actualizado_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_rank_actualizado ON users(rank_actualizado_at);
