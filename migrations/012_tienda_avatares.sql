-- ============================================
-- MacroReborn — Migración 012
-- ============================================
-- Agrega:
--   - Monedas (users.monedas) — moneda del sitio, se muestra en el
--     header de "Ranking y comunidad" (ícono 🪙) y se gasta en la
--     tienda de avatares.
--   - Tienda de avatares (avatar_shop_items) — catálogo de prendas
--     comprables. Reusa el MISMO sistema de capas que ya existe en
--     imagenes/<modelo>/<capa>.png (ver ORDEN_CAPAS_AVATAR en
--     js/core.js): "valor_capa" queda listo para usarse tal cual en
--     el objeto avatar del usuario (ej. "tora_pelo3").
--   - Compras (avatar_shop_purchases) — qué prenda compró cada
--     usuario, para no dejarlo comprar dos veces la misma.
--
-- NO modifica ni elimina ninguna tabla existente.
-- Seguro de re-ejecutar (usa IF NOT EXISTS).
-- ============================================


-- ==============================
-- MONEDAS
-- ==============================
-- Arranca en 500 para cuentas nuevas y existentes (no rompe a nadie,
-- nadie tenía monedas hasta ahora). El "banco" real (cómo se ganan
-- monedas jugando) queda fuera de esta migración: por ahora es un
-- saldo inicial + lo que se gasta en la tienda.

ALTER TABLE users ADD COLUMN IF NOT EXISTS monedas INTEGER NOT NULL DEFAULT 500;


-- ==============================
-- CATÁLOGO DE LA TIENDA
-- ==============================
-- categoria: mismo vocabulario que ORDEN_CAPAS_AVATAR en js/core.js
--   ("pelo","ojos","cara","piel","boca","botas","pantalon","remera",
--    "guantes","accesorio","mascota","borde","fondo","espalda")
-- modelo: "cereza" | "tora" | "fengchao" (a qué avatar base pertenece)
-- valor_capa: valor listo para guardar en el avatar del usuario,
--   formato "<modelo>_<archivo sin .png>" (ej. "tora_pelo3"),
--   igual a como ya lo arma rutaCapaAvatar() en js/core.js.

CREATE TABLE IF NOT EXISTS avatar_shop_items (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  modelo TEXT NOT NULL,
  valor_capa TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  precio INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_shop_items_recientes ON avatar_shop_items(created_at DESC);


-- ==============================
-- COMPRAS
-- ==============================

CREATE TABLE IF NOT EXISTS avatar_shop_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES avatar_shop_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_avatar_shop_purchases_user ON avatar_shop_purchases(user_id);


-- ==============================
-- SEED — catálogo inicial
-- ==============================
-- Se arma a partir de las prendas que YA existen como imagen en
-- imagenes/cereza/*.png e imagenes/tora/*.png (no se sube arte
-- nuevo). "fengchao" queda afuera del seed: solo tiene 2 imágenes
-- sueltas, no un set de prendas por categoría.
-- ON CONFLICT (valor_capa) DO NOTHING: re-ejecutar esta migración
-- no duplica filas ni resetea el catálogo si un admin ya lo tocó.

INSERT INTO avatar_shop_items (categoria, modelo, valor_capa, nombre, precio) VALUES
  ('pelo',      'cereza', 'cereza_pelo1',      'Melena clásica',        120),
  ('pelo',      'cereza', 'cereza_pelo2',      'Flequillo lacio',       120),
  ('pelo',      'cereza', 'cereza_pelo3',      'Coletas altas',         150),
  ('pelo',      'cereza', 'cereza_pelo4',      'Corte corto',           120),
  ('ojos',      'cereza', 'cereza_ojos3',      'Mirada brillante',       80),
  ('ojos',      'cereza', 'cereza_ojos5',      'Mirada felina',          80),
  ('ojos',      'cereza', 'cereza_ojos7',      'Mirada dulce',           80),
  ('ojos',      'cereza', 'cereza_ojos9',      'Mirada intensa',         90),
  ('remera',    'cereza', 'cereza_remera1',    'Remera casual',         100),
  ('remera',    'cereza', 'cereza_remera2',    'Remera a rayas',        110),
  ('pantalon',  'cereza', 'cereza_pantalon1',  'Jean clásico',          100),
  ('pantalon',  'cereza', 'cereza_pantalon2',  'Falda plisada',         110),
  ('botas',     'cereza', 'cereza_botas1',     'Botas urbanas',          90),
  ('botas',     'cereza', 'cereza_botas2',     'Botas altas',           100),
  ('guantes',   'cereza', 'cereza_guantes2',   'Guantes de cuero',       70),
  ('accesorio', 'cereza', 'cereza_accesorio1', 'Collar simple',          60),
  ('accesorio', 'cereza', 'cereza_accesorio2', 'Aros brillantes',        60),
  ('mascota',   'cereza', 'cereza_mascota1',   'Compañero misterioso',  220),
  ('mascota',   'cereza', 'cereza_mascota5',   'Compañero alado',       220),
  ('mascota',   'cereza', 'cereza_mascota6',   'Compañero de fuego',    240),
  ('borde',     'cereza', 'cereza_borde4',     'Marco dorado',          150),
  ('borde',     'cereza', 'cereza_borde9',     'Marco de neón',         150),
  ('fondo',     'cereza', 'cereza_fondo3',     'Fondo atardecer',       130),
  ('fondo',     'cereza', 'cereza_fondo7',     'Fondo espacial',        130),
  ('fondo',     'cereza', 'cereza_fondo14',    'Fondo bosque',          130),
  ('pelo',      'tora',   'tora_pelo1',        'Peinado desafiante',    120),
  ('pelo',      'tora',   'tora_pelo2',        'Peinado despeinado',    120),
  ('remera',    'tora',   'tora_remera1',      'Campera urbana',        110),
  ('pantalon',  'tora',   'tora_pantalon1',    'Pantalón cargo',        100),
  ('botas',     'tora',   'tora_botas1',       'Botas de combate',      100),
  ('accesorio', 'tora',   'tora_accesorio1',   'Cadena plateada',        60),
  ('mascota',   'tora',   'tora_mascota1',     'Compañero rocoso',      220),
  ('borde',     'tora',   'tora_borde1',       'Marco eléctrico',       150),
  ('fondo',     'tora',   'tora_fondo1',       'Fondo urbano',          130),
  ('fondo',     'tora',   'tora_fondo2',       'Fondo neón',            130)
ON CONFLICT (valor_capa) DO NOTHING;
