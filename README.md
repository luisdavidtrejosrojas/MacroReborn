# MacroReborn — documentación del trabajo realizado

Documentación del trabajo realizado sobre el proyecto MacroReborn en
dos frentes:

1. **Hash de contraseñas** (fin de las contraseñas en texto plano) y
   la infraestructura local para probarlo — rama `hash-contrasenas`.
2. **Agregar juegos al catálogo** (proceso completo, con el ejemplo
   real de Superfighters) — rama `juego/superfighters`.

Esta documentación cubre **únicamente lo que se hizo en estas ramas**:
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

## Registro de commits (los 16 de esta rama)

| Commit | Descripción |
|---|---|
| `55e81c5` | Agregar dependencias `bcryptjs` y `@electric-sql/pglite` |
| `3e31f75` | Crear `api/_db.js`, conector único de base de datos |
| `4c7ee9e` | Crear `api/_password.js` (hash + migración perezosa) y migración 013 |
| `ed3b43c` | Usar hash en login, registro y borrado de cuenta (`api/auth.js`) |
| `94c0cac` | Usar hash en el cambio de contraseña (`api/users.js`) |
| `7912175` | Base local PGlite y tests de contraseñas |
| `939ac22` | Servidor local para probar en el navegador |
| `790e023` | Script de backfill para hashear contraseñas existentes |
| `c7ee822` | Endurecer el backfill (bandera `--produccion`, confirmación, `--simular`) |
| `5db7d59` | Silenciar Pusher cuando faltan credenciales (modo local) |
| `96065c8` | Soportar fragmentos SQL anidados en el adaptador local |
| `7f35dc7` | Mensaje de migración preciso en el servidor local y sin emojis |
| `27fa742` | Agregar README y guías de desarrollo y seguridad |
| `92a6372` | Acotar la documentación a lo realizado en esta rama |
| `cfe9644` | Actualizar el registro de commits del README con los hashes nuevos |
| `59f6d8d` | Agregar GitHub Actions (CI) que corre los tests en cada push y PR |

## Trabajo de la rama `juego/superfighters` (juegos)

Agregado **Superfighters (2011)** al catálogo (id 111): juego original
gratuito de MythoLogic Interactive, reproducido con Ruffle desde un
CDN externo (jsdelivr), sin subir ningún binario al repo. Portada
480x270 como el resto del catálogo. El proceso completo para agregar
un juego está documentado en `docs/JUEGOS.md`.

Archivos: `html/juegos/superfighters.html` (juego con Ruffle),
`imagenes/juegos/superfighters.jpg` (portada), `js/datos-juegos.js`
(entrada id 111) y `sitemap.xml` (URL de la ficha).

Commit: `460b735` — "Agregar Superfighters (2011) al catálogo de
juegos".

## Documentación relacionada

| Guía | Contenido |
|---|---|
| `docs/SEGURIDAD.md` | Sistema de contraseñas: problema, solución, backfill, pruebas y plan de activación en producción |
| `docs/DESARROLLO.md` | Desarrollo de los cambios de contraseñas: módulos, infraestructura local, tests, despliegue y convenciones |
| `docs/JUEGOS.md` | Cómo agregar un juego al catálogo: proceso completo, prueba local, notas de Ruffle/CORS y el caso Superfighters |
