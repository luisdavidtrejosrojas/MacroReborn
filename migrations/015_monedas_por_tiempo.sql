-- ============================================
-- MacroReborn — Migración 015: monedas por tiempo jugado
-- ============================================
-- Agrega las tres columnas que necesita el "banco" de monedas
-- (api/_monedas.js) para poder OTORGAR monedas por jugar. Hasta ahora
-- las monedas solo se restaban: la migración 012 dio un saldo inicial
-- de 500 y la tienda de avatares lo gastaba, pero no existía ninguna
-- forma de ganarlas, así que el saldo solo podía bajar.
--
-- La columna "users.monedas" (el saldo, creada en la 012) NO se toca:
-- sigue siendo el saldo real y único. Lo que se agrega acá es la
-- contabilidad necesaria para decidir CUÁNDO y CUÁNTO otorgar.
--
-- La regla que sostienen estas columnas (detalle completo en el
-- encabezado de api/_monedas.js):
--   - Se otorga cada 10 minutos reales de juego, no en cada pulso.
--     El cliente (js/motor/xp.js) manda un pulso por minuto, así que
--     el servidor necesita recordar cuándo fue el último otorgamiento.
--   - El premio es aleatorio entre 10 y 30 monedas.
--   - Tope de 500 monedas GANADAS JUGANDO por día UTC. El saldo de
--     bienvenida y lo gastado en la tienda no cuentan para el tope,
--     por eso el acumulado del día se lleva en su propia columna y no
--     se puede deducir de "monedas".
--
-- Seguro de re-ejecutar (usa ADD COLUMN IF NOT EXISTS).
-- ============================================


-- ==============================
-- CUÁNDO FUE EL ÚLTIMO OTORGAMIENTO
-- ==============================
-- Marca de tiempo del último otorgamiento (haya entregado monedas o
-- haya entregado 0 por tope alcanzado). Es lo que hace que los pulsos
-- de 1 minuto no cobren: el servidor compara esta marca contra su
-- propio now() y solo otorga si pasaron 10 minutos o más.
--
-- TIMESTAMPTZ (con huso), a diferencia de las columnas viejas de esta
-- tabla que son TIMESTAMP sin huso: acá la comparación de "pasaron 10
-- minutos" tiene que ser correcta sí o sí, y una columna sin huso se
-- interpreta según cómo esté configurada la sesión que la lee.
--
-- Arranca en NULL para todos (nadie tuvo nunca un otorgamiento). NULL
-- se trata como "ya toca": el primer pulso de XP de cada usuario
-- otorga monedas de entrada, sin esperar 10 minutos.

ALTER TABLE users ADD COLUMN IF NOT EXISTS monedas_ultimo_otorgamiento TIMESTAMPTZ;


-- ==============================
-- CONTADOR DIARIO (con reseteo perezoso)
-- ==============================
-- Cuántas monedas GANÓ JUGANDO el usuario en el día que indica
-- monedas_ganadas_fecha. Son dos columnas y no una porque el contador
-- no sirve sin saber de qué día es: el reseteo diario no lo hace
-- ninguna tarea programada, lo hace la propia lectura.
--
-- Cómo funciona el reseteo perezoso (mismo criterio que la migración
-- perezosa de contraseñas de la 013, ver api/_password.js y
-- docs/SEGURIDAD.md): cuando el código va a otorgar, compara
-- monedas_ganadas_fecha contra la fecha UTC de hoy. Si no coinciden
-- -es de ayer, o es NULL en los usuarios que ya existían antes de esta
-- migración-, el acumulado guardado se ignora y se cuenta como 0.
--
-- Por qué sin cron: un cron de medianoche es una pieza más que puede
-- fallar (y en Vercel plan Hobby están contados). Si nadie juega,
-- tampoco hace falta resetear nada.
--
-- El día se corta a medianoche UTC a propósito, aunque el ranking
-- semanal (migración 011) use horario de Argentina: el tope diario es
-- una defensa contra el farmeo, no una fecha que el usuario vea en
-- pantalla, así que conviene que sea la fecha estable del servidor y
-- no una que dependa del huso.

ALTER TABLE users ADD COLUMN IF NOT EXISTS monedas_ganadas_hoy INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monedas_ganadas_fecha DATE;
