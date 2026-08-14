-- ============================================
-- MacroReborn — Migración / Ranking por tiempo jugado
-- ============================================
-- Cambia el criterio del ranking: deja de basarse en nivel/XP y pasa
-- a basarse en cuánto tiempo juega cada usuario, qué tan seguido
-- (frecuencia/días activos) y qué tan variados son los juegos que
-- juega (si siempre son los mismos, no debería subir de posición).
--
-- Se agregan DOS tablas nuevas:
--
--   ranking_actividad_semanal
--     Un registro por (usuario, semana) con los minutos jugados y la
--     cantidad de días distintos que jugó esa semana. Se actualiza
--     solo, de a un "tick" por vez (ver api/users.js -> sumarXp() /
--     registrarTickTiempoJugado()), reusando el mismo pulso de 1 vez
--     por minuto que ya existía para el XP mientras se está jugando
--     (js/motor/xp.js). No hace falta pedir nada nuevo al servidor.
--
--   ranking_juegos_semanales
--     Un registro por (usuario, semana, juego) con los minutos que
--     jugó CADA juego esa semana. Sirve para calcular la diversidad:
--     cuántos juegos distintos jugó y cuánto se repiten respecto a
--     las semanas anteriores.
--
-- Se agrega una columna nueva a "users":
--
--   ranking_puntuacion
--     Puntuación acumulada que usa el ranking para ordenar. Se
--     recalcula una vez por semana (ver api/system.js ->
--     recalcularRankingSemanal(), disparado por un cron de Vercel
--     los lunes a las 5:00 (hora Argentina) — ver vercel.json).
--     Las columnas rank_actual / rank_anterior / rank_actualizado_at
--     de la migración 010 se siguen usando tal cual para el
--     indicador de +1/-1, solo que ahora se recalculan con este
--     criterio nuevo en vez del anterior (nivel*100000+xp+logros).
--
-- NO modifica ni elimina columnas ni tablas existentes.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- TIEMPO JUGADO POR SEMANA (total)
-- ==============================
-- "semana" siempre es un lunes (date_trunc('week', ...)), calculado
-- en horario de Argentina para que la semana coincida con el
-- calendario real del usuario, no con UTC.
--
-- ultimo_dia_registrado guarda el último día (fecha, no hora) en que
-- se sumó un minuto; sirve solo para poder incrementar
-- "dias_activos" una única vez por día sin tener que guardar un
-- registro por día aparte.

CREATE TABLE IF NOT EXISTS ranking_actividad_semanal (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semana DATE NOT NULL,
  minutos_jugados INTEGER NOT NULL DEFAULT 0,
  dias_activos INTEGER NOT NULL DEFAULT 0,
  ultimo_dia_registrado DATE,
  UNIQUE (user_id, semana)
);

CREATE INDEX IF NOT EXISTS idx_ranking_actividad_semana ON ranking_actividad_semanal(semana);


-- ==============================
-- TIEMPO JUGADO POR SEMANA, POR JUEGO
-- ==============================
-- Mismo concepto que la tabla de arriba pero desglosado por juego.
-- Se usa para calcular la diversidad (juegos distintos jugados esa
-- semana) y la repetición (cuántos de esos juegos ya se venían
-- jugando en las 4 semanas previas).

CREATE TABLE IF NOT EXISTS ranking_juegos_semanales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semana DATE NOT NULL,
  game_id TEXT NOT NULL,
  minutos INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, semana, game_id)
);

CREATE INDEX IF NOT EXISTS idx_ranking_juegos_semana ON ranking_juegos_semanales(user_id, semana);


-- ==============================
-- PUNTUACIÓN DE RANKING (acumulada, se recalcula cada lunes)
-- ==============================

ALTER TABLE users ADD COLUMN IF NOT EXISTS ranking_puntuacion NUMERIC NOT NULL DEFAULT 0;
