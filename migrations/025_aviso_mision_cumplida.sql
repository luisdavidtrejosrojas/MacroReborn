-- ============================================
-- MacroReborn — Migración 025: el aviso de misión cumplida
-- ============================================
-- Decidido el 28/09/2026. Con los datos de los días anteriores: de cada
-- tres misiones cumplidas se cobraba una. Para cobrar hay que entrar en
-- "Mi día" o "Progreso", casi nadie entra, nada avisaba, y la diaria se
-- pierde a las 00:00 de Argentina.
--
-- Ahora, en el momento en que alguien cumple la misión del día o la de
-- la semana, le llega una notificación ("¡Misión cumplida! Cobrá..."): a
-- la campana, y con su aviso emergente aunque esté jugando
-- (avisarSiSeCumplen, en api/_misiones.js).
--
-- Esta tabla apunta a quién se le avisó de qué, para avisar una sola vez
-- aunque el minuto o el juego que la cumple se repitan.
-- ============================================

CREATE TABLE IF NOT EXISTS player_mission_avisos (
  user_id     INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_key TEXT      NOT NULL,
  period_key  TEXT      NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_key, period_key)
);
