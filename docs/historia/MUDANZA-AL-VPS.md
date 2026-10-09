# LA MUDANZA AL VPS — de Vercel y Neon a un servidor propio (1/09/2026)

> **De qué trata:** lo que cambió del código para dejar Vercel y Neon y correr en un VPS propio, cómo
> se migraron los datos el 1/09/2026 y cómo era la conexión a la base antes de la mudanza.
>
> **Para quién:** quien quiera saber por qué el servidor y la base son como son, o vaya a tocar cómo
> habla el código con Postgres.
>
> **Revisado:** 05/10/2026

Salió el 05/10/2026, entero, de la referencia del servidor (`VPS.md`) y de la guía de desarrollo.
Cómo es hoy el servidor lo cuenta [VPS](../referencia/VPS.md).

---

## Qué se cambió del código

### `api/_pg.js` — adaptador nuevo

El driver de Neon (`@neondatabase/serverless`) habla SQL sobre HTTPS
contra la infraestructura de Neon. Un Postgres normal habla el
protocolo nativo por TCP, así que ese driver no sirve en el VPS.

Lo que sí se conservó es la **interfaz**: los handlers escriben
`` sql`SELECT ... ${valor}` `` y reciben un array de filas. `_pg.js`
traduce eso al driver `pg`, incluido el soporte de **fragmentos
anidados** (`api/users.js` arma `semanaActualSQL` como pedazo suelto y
lo incrusta en otras consultas; sin ese soporte, todo `GET /api/users`
falla con un error de sintaxis en `date_trunc`).

Es el gemelo de `scripts/pglite.js`, que ya hacía lo mismo para los
tests. Misma técnica, distinto motor debajo. **Ningún handler se tocó.**

### `api/_db.js` — elige driver según la URL

`obtenerSql()` mira `DATABASE_URL`: si el host contiene `.neon.tech`
usa el driver de Neon, si no usa `_pg.js`. La decisión se toma desde
la URL y no desde una variable aparte, para que no exista el caso de
apuntar a un Postgres normal pero hablarle por HTTP (un error que solo
se descubriría en producción).

Se conserva la rama de Neon a propósito: sirve para leer la base vieja
cuando se pueda hacer la migración de datos pendiente.

### `api/social.js` y `api/system.js`

Estos dos **se saltaban `_db.js`** y llamaban a `neon()` directo en su
primera línea (`docs/guias/DESARROLLO.md` lo decía: "no se tocaron"). Contra
el VPS habrían seguido intentando conectarse a Neon. Ahora los siete
handlers pasan por `obtenerSql()`.

### `package.json`

Se agregó `pg`. Se dejó `@neondatabase/serverless` para la migración
de datos pendiente; cuando esté hecha, se puede quitar.

---

## La migración de los datos

Hecha el 1 de septiembre de 2026, una vez que se liberó la cuota de
Neon. Se volcó con `pg_dump` y se restauró completo (esquema + datos)
sobre un esquema vacío, no solo los datos sobre las migraciones: así el
esquema que manda es el que la app venía usando de verdad en Neon, y no
una reconstrucción a partir de los archivos de migración.

Detalle que costó un rato: **Neon corre PostgreSQL 18.6 y el VPS 16.15**.
`pg_dump` se niega a volcar un servidor más nuevo que él, así que hubo
que agregar el repositorio PGDG e instalar `postgresql-client-18`. El
volcado se hace con `/usr/lib/postgresql/18/bin/pg_dump`.

Al restaurar aparece un único error, y es inofensivo:
`unrecognized configuration parameter "transaction_timeout"`. Ese
parámetro existe desde Postgres 17; el 16 no lo conoce. No afecta a los
datos.

Se verificó comparando el conteo de filas **tabla por tabla contra
Neon**: las 33 coinciden exactamente. En total 63 usuarios (más de los
~30-40 que se estimaban), 4131 filas de actividad y 2372 puntajes.

Ojo con `n_live_tup` de `pg_stat_user_tables` si se rehace esta
comprobación: es una estimación del planificador y muestra diferencias
de unas pocas filas que no son datos perdidos. Hay que contar con
`count(*)`.

Sobre las contraseñas: 42 usuarios tienen `password_hash` (bcrypt) y 21
siguen con `password` en texto plano. Es el estado esperado — las
migraciones 013/014 convierten cada cuenta a bcrypt en su siguiente
inicio de sesión, no todas de golpe.

Los volcados originales quedaron en `~/respaldos/` del VPS y en
`Documentos\Proyectos de código\MacroReborn - respaldos\` del PC. Los del
VPS se borraron el 09/10/2026, porque llevaban esas 21 contraseñas en
claro ([spec 006](../../specs/006-volcados-en-claro/spec.md)). La copia
del PC no está en el de ahora, formateado el 19/09/2026.

---

## El conector único, como lo contaba la guía de desarrollo

Antes cada archivo de la API creaba su conexión con
`neon(process.env.DATABASE_URL)`. Ahora la conexión pasa por acá:

- `obtenerSql()` → devuelve la función `sql` lista (Neon en
  producción).
- `usarSqlLocal(sqlLocal)` → reemplaza la conexión por una base local
  (PGlite) en desarrollo/tests.

Los handlers de esta rama (`api/auth.js`, `api/users.js` y
`api/content.js`) usan `obtenerSql()` en vez de crear la conexión a mano.

Cuando se escribió esto, `social.js` y `system.js` no pasaban por acá:
llamaban a `neon()` directo en su primera línea. La mudanza al VPS lo
arregló —contra un Postgres normal habrían seguido intentando hablar con
Neon— y hoy **los siete handlers** pasan por `obtenerSql()`. Ver
[`api/social.js` y `api/system.js`](#apisocialjs-y-apisystemjs), más arriba.
