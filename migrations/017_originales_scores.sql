-- ============================================
-- MacroReborn — Migración 016: puntuaciones de Originals
-- ============================================
-- Solo añade una tabla nueva. No elimina ni modifica tablas existentes.
-- Pensada para récords y rankings de juegos propios.
-- ============================================

CREATE TABLE IF NOT EXISTS originales_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score BIGINT NOT NULL CHECK (score >= 0 AND score <= 1000000000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_originales_scores_game_score
  ON originales_scores(game_id, score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_originales_scores_user_game
  ON originales_scores(user_id, game_id, score DESC, created_at ASC);
