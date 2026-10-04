-- ============================================
-- MacroReborn — Migración 027: la rareza de cada prenda
-- ============================================
-- Decidido el 04/10/2026 (docs/ECONOMIA.md), a raíz de lo que más se
-- quejaba la gente: "todas las prendas están muy caras". El equipo de
-- arte ponía el precio a mano, de 1.500 a 50.000, y a quien juega media
-- hora al día una de esas le costaba de uno a catorce meses.
--
-- Desde ahora cada prenda tiene una rareza, y su precio es el de la
-- rareza (api/_precios.js):
--
--   comun 50 · rara 500 · epica 1.400 · legendaria 6.000
--
-- Las que ya estaban a la venta la toman por el precio que tenían, con
-- los mismos cortes que rarezaPorPrecio() en api/_precios.js
-- (tests/precios.test.js vigila que digan lo mismo). Con esos cortes
-- ninguna sube: lo más barato de cada rareza costaba ya su precio nuevo o
-- más.
--
-- Las compras guardan lo que costaron (precio_pagado): esta migración no
-- las toca. Lo pagado de más se devuelve aparte, con el recálculo de los
-- saldos (scripts/recalcular-saldos.js).
--
-- Se puede aplicar más de una vez: la rareza solo se pone a quien no la
-- tiene, y el precio vuelve a ser el de su rareza.
-- ============================================

ALTER TABLE avatar_shop_items
  ADD COLUMN IF NOT EXISTS rareza TEXT CHECK (rareza IN ('comun', 'rara', 'epica', 'legendaria'));

UPDATE avatar_shop_items
SET rareza = CASE
  WHEN precio >= 15000 THEN 'legendaria'
  WHEN precio >= 3001  THEN 'epica'
  WHEN precio >= 500   THEN 'rara'
  ELSE 'comun'
END
WHERE rareza IS NULL;

UPDATE avatar_shop_items
SET precio = CASE rareza
  WHEN 'legendaria' THEN 6000
  WHEN 'epica'      THEN 1400
  WHEN 'rara'       THEN 500
  ELSE 50
END;

ALTER TABLE avatar_shop_items ALTER COLUMN rareza SET DEFAULT 'comun';
ALTER TABLE avatar_shop_items ALTER COLUMN rareza SET NOT NULL;
