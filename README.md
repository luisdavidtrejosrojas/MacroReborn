# MacroReborn — trabajo de la rama `hash-contrasenas`

Documentación del trabajo realizado sobre el proyecto MacroReborn:
**hash de contraseñas** (fin de las contraseñas en texto plano) y la
**infraestructura local para probarlo** (base de práctica PGlite,
servidor local, tests y backfill).

Esta documentación cubre **únicamente lo que se hizo en esta rama**:
los archivos creados o modificados, los commits y cómo verificar que
todo funciona. El resto del proyecto quedó intacto y no se documenta
acá.

---

## Qué se hizo (resumen)

1. **Contraseñas con hash bcrypt**: registro, login, cambio de
   contraseña y borrado de cuenta ya no guardan ni comparan texto
   plano; se guarda solo el hash (`users.password_hash`, migración
   013).
2. **Migración perezosa**: los usuarios existentes (con texto plano)
   se migran solos al entrar con su contraseña correcta, sin que
   noten nada.
3. **Backfill protegido**: script para picar las contraseñas de los
   usuarios que nunca más entran, con candados contra corridas
   accidentales.
4. **Todo 100% local**: base de práctica PGlite, servidor local y
   tests que corren en esta máquina sin tocar la base real.

## Archivos creados y modificados

| Tipo | Archivo | Qué es |
|---|---|---|
| Creado | `api/_db.js` | Conector único de base (Neon en producción, local en desarrollo) |
| Creado | `api/_password.js` | Hash/verificación de contraseñas + clase `PasswordService` |
| Creado | `scripts/pglite.js` | Base local de práctica (PGlite) y adaptador de la interfaz de Neon |
| Creado | `scripts/servidor-local.js` | Servidor local para probar en el navegador (`npm run db:local`) |
| Creado | `scripts/migrar-passwords.js` | Backfill de contraseñas a hash |
| Creado | `tests/password.test.js` | Tests automáticos del flujo de contraseñas |
| Creado | `migrations/013_hash_contrasenas.sql` | Columna `users.password_hash` |
| Modificado | `api/auth.js` | Login, registro y borrado usan hash |
| Modificado | `api/users.js` | Cambio de contraseña usa hash |
| Modificado | `api/_pusher.js` | Instancia "muda" cuando faltan credenciales (modo local) |
| Modificado | `package.json` | Dependencias `bcryptjs`, `@electric-sql/pglite` y scripts `test`, `db:local` |

## Cómo verificar el trabajo

```bash
npm install          # instala las dependencias nuevas
npm test             # 6 tests del flujo de contraseñas (base local)
npm run db:local     # sitio local en http://localhost:3001 (usuario demo / demo1234)
node scripts/migrar-passwords.js --local --simular   # ver qué haría el backfill
```

Todo corre en esta máquina; nada toca la base real ni el proyecto
original.

## Registro de commits (los 13 de esta rama)

| Commit | Descripción |
|---|---|
| `ed91a1c` | Agregar dependencias `bcryptjs` y `@electric-sql/pglite` |
| `ecda777` | Crear `api/_db.js`, conector único de base de datos |
| `d860259` | Crear `api/_password.js` (hash + migración perezosa) y migración 013 |
| `b6dc25d` | Usar hash en login, registro y borrado de cuenta (`api/auth.js`) |
| `4004ba9` | Usar hash en el cambio de contraseña (`api/users.js`) |
| `33573a4` | Base local PGlite y tests de contraseñas |
| `38b6c8f` | Servidor local para probar en el navegador |
| `0888bef` | Script de backfill para hashear contraseñas existentes |
| `d396f08` | Endurecer el backfill (bandera `--produccion`, confirmación, `--simular`) |
| `7de7591` | Silenciar Pusher cuando faltan credenciales (modo local) |
| `ab7a2fa` | Soportar fragmentos SQL anidados en el adaptador local |
| `189a189` | Mensaje de migración preciso en el servidor local y sin emojis |
| `b85d5c8` | Documentación (esta) |

## Documentación relacionada

| Guía | Contenido |
|---|---|
| `docs/SEGURIDAD.md` | Sistema de contraseñas: problema, solución, backfill, pruebas y plan de activación en producción |
| `docs/DESARROLLO.md` | Desarrollo de estos cambios: módulos, infraestructura local, tests, despliegue y convenciones |
