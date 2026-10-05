# LAS CONTRASEÑAS EN CLARO — cómo se pasó a bcrypt (16/09/2026)

> **De qué trata:** cómo se dejó de guardar las contraseñas en texto plano: el problema, lo que cambió
> en la API, el relleno de las que quedaban (`scripts/migrar-passwords.js`), el plan de activación en
> producción y su despliegue, terminado el 16/09/2026.
>
> **Para quién:** quien toque el registro, el login o las contraseñas, o quiera saber por qué la base
> conserva aún la columna `users.password`.
>
> **Revisado:** 05/10/2026

Salió el 05/10/2026, entero, de la referencia de cuentas (antes `SEGURIDAD.md`) y de la guía de
desarrollo; por eso el relleno se cuenta dos veces, una desde cada documento. Cómo funcionan hoy las
contraseñas lo cuenta [CUENTAS](../referencia/CUENTAS.md).

---

## El problema que se atacó

El proyecto guardaba las contraseñas en TEXTO PLANO en la columna
`users.password`, y el login comparaba directo en SQL
(`WHERE username = ? AND password = ?`). Cualquiera con acceso a la
base podía leer la contraseña de todos los usuarios. Ese era el riesgo
más grave y fue lo primero que se resolvió.

---

## Cambios en `api/auth.js` y `api/users.js`

| Archivo | Acciones que ahora usan `PasswordService` |
|---|---|
| `api/auth.js` | `login`, `register`, `delete-account` |
| `api/users.js` | `change-password` |

Las respuestas al frontend mantienen exactamente la misma forma que
antes (el contrato de la API no cambió).

---

## Backfill (`scripts/migrar-passwords.js`)

La migración perezosa cubre a los usuarios que vuelven a entrar. El
backfill cubre al resto (los que nunca más entran), picando todas las
contraseñas en texto plano de una sola vez.

### Alcance

Solo toca las columnas `password` / `password_hash` de la tabla
`users`. No borra usuarios ni modifica ninguna otra tabla. Es seguro
de re-ejecutar.

### Protecciones

- **`--local`** → corre contra la maqueta PGlite (crea usuarios de
  prueba). Sin riesgo.
- **`--produccion`** → obligatorio para tocar la base real; sin esa
  bandera el script se niega a correr.
- **Confirmación escrita**: con `--produccion`, pide tipear "SI"
  antes de tocar nada.
- **`--simular`** → solo muestra qué haría, no cambia nada.
- **Chequeo de migración**: con `--produccion` verifica que la
  columna `password_hash` exista (migración 013); si no, se detiene
  sin cambios.

### Uso

```bash
node scripts/migrar-passwords.js --local --simular   # ver qué haría (local)
node scripts/migrar-passwords.js --local             # ejecutar en la maqueta
DATABASE_URL="postgres://..." node scripts/migrar-passwords.js --produccion --simular  # ver qué haría (real)
DATABASE_URL="postgres://..." node scripts/migrar-passwords.js --produccion           # ejecutar (pide confirmación)
```

---

## `scripts/migrar-passwords.js` — backfill

Pica las contraseñas en texto plano restantes y borra el texto.
Protecciones (ver [las protecciones](#protecciones), más arriba):

- Sin `--local` ni `--produccion` se niega a correr.
- `--produccion` exige confirmación escrita ("SI").
- `--simular` solo muestra qué haría.
- Con `--produccion` verifica que la migración 013 esté aplicada.

---

## Plan de activación en producción

Orden estricto:

1. Aplicar la migración 013 (agrega `users.password_hash`).
2. Aplicar la migración 014 (quita el NOT NULL de `users.password`).
   Este paso es OBLIGATORIO: sin él, el registro y el login fallan con
   `null value in column "password" violates not-null constraint`,
   porque el código nuevo ya no escribe en `password` pero la columna
   sigue marcada como obligatoria (fue el error que se vio en
   producción).
3. Desplegar el código nuevo (`api/_db.js`, `api/_password.js`,
   `api/auth.js`, `api/users.js` y el antiguo `_pusher.js`).
4. Verificar: registrar un usuario de prueba y entrar con un usuario
   existente (se migra solo).
5. Correr el backfill con `--produccion` (cubre a los que no entran).
6. Verificar que no quede texto plano:
   `SELECT COUNT(*) FROM users WHERE password IS NOT NULL;` → 0.
7. Tras un período de gracia: crear una migración futura para borrar
   `users.password` y quitar la rama de comparación legacy de
   `api/_password.js`.

### Estado (16/09/2026)

Los pasos 1 a 6 están hechos. El backfill se corrió contra el VPS ese
día y migró 17 cuentas: las que tenían texto plano y ningún hash, o sea
las que no habían vuelto a entrar desde el despliegue (las otras 124 ya
las había migrado el login). Hoy `SELECT COUNT(*) FROM users WHERE
password IS NOT NULL` devuelve 0, y las 141 filas guardan un hash `$2b$`
de 60 caracteres.

Se comprobó además lo que el backfill no puede comprobar por sí solo:
que nadie perdió el acceso. Con el respaldo anterior al cambio delante,
se verificó con `bcrypt.compare` que las 17 contraseñas originales
validan contra su hash nuevo. 17 de 17.

Una trampa que casi se cuela, por si se repite la comprobación: verificar
el formato con una expresión regular a través de `ssh ... psql -c "..."`
no funciona. Los `$` se expanden por el camino, el patrón llega vacío y
**devuelve 0 coincidencias sin error**, que es justo lo que uno quiere
ver. Es más seguro agrupar por `left(password_hash, 4)`, que no lleva
caracteres especiales.

Queda el paso 7, y queda a propósito: `users.password` sigue existiendo y
`api/_password.js` conserva su rama legacy.

Lo que el backfill **no** limpia son los respaldos ya sacados: cualquier
`.sql.gz` anterior al 16/09/2026 sigue llevando esas 17 contraseñas en
claro. En el VPS se borran solos a los 14 días; una copia bajada a un
portátil, no (ver `docs/guias/DESARROLLO.md#8-probar-contra-los-datos-de-verdad`).

Si se despliega el código sin la 013, registro y login fallan (la
columna `password_hash` no existe). Si se despliega sin la 014,
registro y login fallan por la restricción NOT NULL de `password`.
Por eso el orden importa: migraciones primero, código después.

---

## Despliegue de estos cambios

Orden estricto (la migración SIEMPRE antes que el código que la usa):

1. Aplicar la migración 013 a la base de producción (agrega
   `users.password_hash`).
2. Aplicar la migración 014 (quita el NOT NULL de `users.password`;
   sin ella, registro y login fallan con el error de not-null
   constraint — ver [el plan de activación](#plan-de-activación-en-producción)).
3. Aplicar la migración 015 (agrega la contabilidad de monedas por tiempo;
   no modifica `users.monedas`).
4. Desplegar el código nuevo (todo el repo).
5. Verificar: registrar un usuario de prueba y entrar con un usuario
   existente (se migra solo).
6. Correr el backfill con `--produccion` (cubre a los que no entran).
7. Verificar que no quede texto plano:
   `SELECT COUNT(*) FROM users WHERE password IS NOT NULL;` → 0.
8. Recién entonces planificar una migración futura (borrar
   `users.password` y la rama legacy de `api/_password.js`).

**Estado (16/09/2026)**: los pasos 1 a 7 están hechos. El backfill se
corrió contra el VPS y no queda ni una contraseña en texto plano. El
paso 8 sigue pendiente a propósito; el detalle está en
[el plan de activación](#plan-de-activación-en-producción), más arriba.

Si se despliega el código sin la 013, registro y login fallan (la
columna `password_hash` no existe). Si se despliega sin la 014,
fallan por la restricción NOT NULL de `password`. Si se despliega sin la
015, el primer pulso de XP intentará usar columnas que no existen. Las tres
migraciones van antes que el código.
