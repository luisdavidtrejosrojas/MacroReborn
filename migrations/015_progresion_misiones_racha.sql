-- ============================================
-- MacroReborn — Migración 015 / Progresión social
-- ============================================
-- Añade únicamente tablas nuevas para:
--   * misiones reclamadas por usuario
--   * rachas diarias
--   * progreso de desafíos globales
--
-- No modifica ni elimina ninguna tabla existente.
-- Seguro de re-ejecutar.
-- ============================================

CREATE TABLE IF NOT EXISTS player_mission_claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_key, period_key)
);

CREATE INDEX IF NOT EXISTS idx_player_mission_claims_user
  ON player_mission_claims(user_id, claimed_at DESC);

CREATE TABLE IF NOT EXISTS player_streaks (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS macro_global_challenges (
  challenge_key TEXT PRIMARY KEY,
  target_value INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_macro_global_challenges_window
  ON macro_global_challenges(starts_at, ends_at);
