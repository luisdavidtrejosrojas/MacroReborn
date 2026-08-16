# DESARROLLO de los cambios de la rama `hash-contrasenas`

Guía para desarrollar y probar **el trabajo de esta rama**: el hash de
contraseñas y la infraestructura local asociada. No cubre el resto del
proyecto (para eso está el código existente, que quedó intacto).

---

## 1. Qué cubre esta guía

- Los módulos nuevos del backend (`api/_db.js`, `api/_password.js`) y
  los cambios en `api/auth.js`, `api/users.js` y `api/_pusher.js`.
- La infraestructura local: `scripts/pglite.js`,
  `scripts/servidor-local.js`, `scripts/migrar-passwords.js` y
  `tests/password.test.js`.
- Cómo correr, probar y desplegar estos cambios, y las convenciones
  que se siguen.

## 2. Módulos nuevos del backend

### 2.1 `api/_db.js` — conector único de base

Antes cada archivo de la API creaba su conexión con
`neon(process.env.DATABASE_URL)`. Ahora la conexión pasa por acá:

- `obtenerSql()` → devuelve la función `sql` lista (Neon en
  producción).
- `usarSqlLocal(sqlLocal)` → reemplaza la conexión por una base local
  (PGlite) en desarrollo/tests.

Los handlers de esta rama (`api/auth.js`, `api/users.js`) usan
`obtenerSql()` en vez de crear la conexión a mano. Los otros archivos
de la API (`content.js`, `social.js`, `system.js`) no se tocaron.

### 2.2 `api/_password.js` — contraseñas

El único lugar que sabe hashear y verificar contraseñas:

- Funciones puras: `hashContrasena(plana)`, `verificarHash(plana,
  hash)`, `verificarContrasenaYMigrar(sql, username, plana)`.
- Clase `PasswordService(sql)` con `registrar`, `verificar`,
  `cambiarContrasena` y `eliminarCuenta`.

Detalles del flujo (ver `docs/SEGURIDAD.md` para el panorama
completo):

- **Registro**: guarda solo `password_hash`; el texto plano nunca se
  escribe.
- **Login**: si el usuario tiene hash, compara con bcrypt; si todavía
  tiene texto plano (usuario viejo), compara el texto y, si coincide,
  migra a hash en la misma operación (migración perezosa).

### 2.3 `api/_pusher.js` — instancia muda

Si faltan las variables `PUSHER_*` (típico en desarrollo local),
`getPusher()` devuelve una instancia "muda" (`trigger` no hace nada)
en vez de una rota que explota en cada aviso. En producción las
variables siempre existen, así que ahí no cambia nada.

### 2.4 Cambios en `api/auth.js` y `api/users.js`

| Archivo | Acciones que ahora usan `PasswordService` |
|---|---|
| `api/auth.js` | `login`, `register`, `delete-account` |
| `api/users.js` | `change-password` |

Las respuestas al frontend mantienen exactamente la misma forma que
antes (el contrato de la API no cambió).

## 3. Infraestructura local

### 3.1 `scripts/pglite.js` — base de práctica

- `crearBaseLocal()` → crea un Postgres real embebido (PGlite, WASM),
  arma la tabla `users` base y aplica todas las migraciones de
  `migrations/` en orden (incluida la 013).
- `crearSqlPGlite(db)` → adaptador que imita la interfaz del driver de
  Neon (`sql\`...\``), para que los mismos handlers corran contra la
  base local. Soporta **fragmentos SQL anidados**: pedazos `sql\`...\``
  incrustados dentro de otros (como hace `api/users.js` con
  `semanaActualSQL`); un fragmento solo se ejecuta cuando se espera
  con `await`, y al incrustarse se pega su SQL con los parámetros
  renumerados.

### 3.2 `scripts/servidor-local.js` — probar en el navegador

```bash
npm run db:local
```

Abre `http://localhost:3001`:

- Sirve los archivos estáticos del sitio.
- Rutea `/api/auth` y `/api/users` con los handlers reales contra la
  base de práctica (son las únicas rutas que toca esta rama).
- Crea un usuario de prueba `demo` / `demo1234` con contraseña en
  texto plano, para ver la migración perezosa en vivo: la consola
  avisa `"demo" entró: su contraseña en texto plano fue migrada a
  hash` solo cuando hubo una migración real (los usuarios nuevos no
  imprimen nada).
- Limitación a propósito: `/api/content`, `/api/social` y
  `/api/system` no están activados en el modo local; las secciones que
  los usan se ven vacías (esperado).

### 3.3 `scripts/migrar-passwords.js` — backfill

Pica las contraseñas en texto plano restantes y borra el texto.
Protecciones (ver `docs/SEGURIDAD.md`):

- Sin `--local` ni `--produccion` se niega a correr.
- `--produccion` exige confirmación escrita ("SI").
- `--simular` solo muestra qué haría.
- Con `--produccion` verifica que la migración 013 esté aplicada.

### 3.4 `tests/password.test.js` — tests

```bash
npm test
```

Usa `node:test` (incluido en Node). Los tests crean su propia base de
práctica, inyectan la conexión con `usarSqlLocal()` y ejercitan los
handlers reales. Cubren: registro con hash, login correcto/incorrecto,
migración legacy, cambio de contraseña, borrado de cuenta y usuario
duplicado.

## 4. Despliegue de estos cambios

Orden estricto (la migración SIEMPRE antes que el código que la usa):

1. Aplicar la migración 013 a la base de producción.
2. Desplegar el código nuevo (todo el repo).
3. Verificar: registrar un usuario de prueba y entrar con un usuario
   existente (se migra solo).
4. Correr el backfill con `--produccion` (cubre a los que no entran).
5. Verificar que no quede texto plano:
   `SELECT COUNT(*) FROM users WHERE password IS NOT NULL;` → 0.
6. Recién entonces planificar la migración 014 (borrar `users.password`
   y la rama legacy de `api/_password.js`).

Si se despliega el código sin la 013, registro y login fallan (la
columna `password_hash` no existe).

## 5. Convenciones de este trabajo

- **Idioma**: comentarios y mensajes en español, explicando el "por
  qué".
- **Sin emojis**: en código, consola, commits y documentación nueva.
  Lo preexistente no se toca.
- **Commits**: autor "Luis David Trejos Rojas"
  `<luisdavid.trejosrojas@gmail.com>`, sin firmas ni pies de autoría
  automáticos, un cambio lógico por commit.
- **Reutilizar**: la lógica compartida va en `api/_*.js`; no duplicar
  lo que ya existe.
