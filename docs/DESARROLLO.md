# DESARROLLO — MacroReborn

Guía para desarrolladores. Explica cómo está armado el proyecto, cómo
correrlo localmente, cómo se prueba y cómo se despliega, siguiendo el
mismo criterio de "explicar el por qué" que ya usa `docs/SEO.md`.

---

## 1. Arquitectura

```
Navegador (HTML/CSS/JS vanilla)
   │
   ├── archivos estáticos (páginas, css/, js/, html/juegos/, imagenes/)
   │
   └── /api/* (Serverless Functions en Vercel)
            │
            ├── PostgreSQL en Neon  (@neondatabase/serverless)
            └── Pusher              (push en tiempo real, opcional)

Desarrollo local
   └── scripts/servidor-local.js  (sirve estáticos + /api/auth y /api/users)
            └── PGlite             (Postgres embebido, misma interfaz que Neon)
```

Decisiones de fondo:

- **Frontend sin framework ni build**: páginas estáticas con JavaScript
  vanilla y módulos por responsabilidad (`js/`, `js/motor/`).
- **Backend como funciones serverless**: un archivo por dominio
  (`auth`, `users`, `content`, `social`, `system`), todos con la misma
  firma `handler(req, res)` que espera Vercel.
- **Un solo archivo por dominio** a propósito: Vercel (plan Hobby)
  limita la cantidad de funciones, así que los endpoints se agrupan
  con `?action=...` en vez de un archivo por endpoint.
- **La conexión a la base pasa por `api/_db.js`**: en producción usa
  Neon; en desarrollo se puede inyectar una base local (PGlite) para
  probar sin tocar nada real.

---

## 2. Estructura de carpetas

| Ruta | Qué es |
|---|---|
| `*.html` (raíz) | Páginas del sitio (cada una con su SEO en el `<head>`) |
| `css/` | Una hoja de estilos por página + `style.css`/`inicio.css` base |
| `js/` | Scripts del frontend; `core.js` centraliza utilidades compartidas |
| `js/motor/` | Módulos de dominio: `xp`, `logros`, `insignias`, `permisos`, `actividad`, `likes`, `historial`, `reportes`, `estadisticas`, `panelEstadisticas` |
| `html/juegos/` | Una página por juego embebido (iframes, varias desde CDN de terceros) |
| `api/` | Backend (ver sección 3) |
| `migrations/` | Migraciones SQL numeradas (ver sección 4) |
| `scripts/` | Herramientas de desarrollo local (ver sección 5) |
| `tests/` | Tests automáticos con `node:test` |
| `docs/` | Documentación (este archivo, SEO, seguridad) |
| `imagenes/` | Imágenes del sitio, avatares (`<modelo>/<capa>.png`) y portadas (`juegos/`) |

---

## 3. Backend (API)

### 3.1 Patrón general

Cada archivo de `api/` exporta un único `handler(req, res)` con esta
forma:

```js
module.exports = async function handler(req, res) {
  setCors(res, "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  const action = req.query.action;
  try {
    if (action === "algo") return await algo(req, res);
    // ...
    return res.status(400).json({ success: false, error: "Acción inválida" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
```

Todas las respuestas usan `{ success: true|false, ... }`. El cuerpo de
las peticiones POST llega ya parseado (lo hace Vercel).

### 3.2 Módulos compartidos

| Archivo | Rol |
|---|---|
| `_utils.js` | `setCors`, `getUserId`, `hayBloqueoEntreUsuarios`, `usuarioBloqueaA` |
| `_db.js` | `obtenerSql()` (Neon) y `usarSqlLocal()` (PGlite en desarrollo) |
| `_password.js` | Funciones puras de hash/verificación + clase `PasswordService` |
| `_pusher.js` | `getPusher()` (devuelve una instancia "muda" si faltan credenciales) y `canalNotificaciones()` |

### 3.3 Referencia de endpoints

**`/api/auth`** (POST):

| action | Body | Qué hace |
|---|---|---|
| `login` | `{ username, password }` | Verifica la contraseña (hash o migración perezosa) y actualiza `last_login` |
| `register` | `{ username, password }` | Crea el usuario guardando SOLO el hash de la contraseña |
| `delete-account` | `{ username, password }` | Verifica y borra la cuenta (cascada por FK) |

**`/api/users`** (GET sin action):

| Query | Qué devuelve |
|---|---|
| `?username=X` | Un usuario puntual |
| `?q=texto` | Búsqueda por nombre (ILIKE) |
| `?limit=N` | Tope de resultados (máx. 2000) |
| (sin query) | Lista de usuarios ordenada por ranking |

**`/api/users`** (POST con action):

| action | Body | Qué hace |
|---|---|---|
| `update-avatar` | `{ username, avatar }` | Guarda el avatar (JSON) |
| `update-bio` | `{ username, bio }` | Guarda la bio |
| `heartbeat` | `{ username }` | Actualiza `last_login` (presencia) + aviso Pusher |
| `xp` | `{ username, cantidad, gameId }` | Suma XP y registra tiempo jugado para el ranking |
| `suspend` | `{ username, motivo }` | Suspende al usuario |
| `reactivate` | `{ username }` | Reactiva al usuario |
| `change-password` | `{ username, currentPassword, newPassword }` | Verifica la actual y guarda el hash de la nueva |

**`/api/content`** (GET/POST/DELETE con action): `comments`, `likes`,
`chat`, `notifications`, `notifications-mark-read`, `activity`,
`activity-friends`, `favorites`, `game-history`, `reports`,
`reports-resolve`, `reviews`, `game-ratings`, `game-votes`,
`moderation-log`, `avatar-gallery`, `avatar-vote`, `community-feed`,
`avatar-shop`, `avatar-shop-buy`. Cada archivo de la API documenta su
contrato en los comentarios del encabezado.

**`/api/social`** (GET/POST/DELETE con action): `friends`,
`favoriteFriends`, `achievements`, `badges`, `blocks`.

**`/api/system`** (GET/POST con action): `test-db`, `admin-stats`,
`recalcular-ranking` (cron, requiere `CRON_SECRET` en el header
`Authorization: Bearer ...`), `recalcular-ranking-manual` (requiere
insignia de administrador), `community-stats`, `moderators-status`.

---

## 4. Base de datos

### 4.1 Migraciones

Las migraciones viven en `migrations/` numeradas (`001`, `002`, ...),
todas seguras de re-ejecutar (`IF NOT EXISTS`). Resumen:

| Migración | Qué agrega |
|---|---|
| 001 | Insignias, logros, solicitudes de amistad, amistades |
| 002 | Comentarios de perfil, likes, reportes |
| 003 | Chat general |
| 004 | Notificaciones y registro de actividad |
| 005 | Favoritos e historial de juegos |
| 006 | Reseñas y moderación |
| 007 | Amigos favoritos (máx. 10) |
| 008 | Galería de avatares guardados y votos |
| 009 | Bloqueos entre usuarios |
| 010 | Historial de posición en el ranking (`rank_*` en `users`) |
| 011 | Ranking por tiempo jugado (`ranking_*_semanal`, `ranking_puntuacion`) |
| 012 | Monedas y tienda de avatares |
| 013 | Columna `password_hash` (hash bcrypt de contraseñas) |

Tablas existentes: `users`, `badges`, `achievements`,
`friend_requests`, `friendships`, `friend_favorites`, `user_blocks`,
`profile_comments`, `chat_messages`, `notifications`, `activity_log`,
`likes`, `comment_reports`, `game_favorites`, `game_history`,
`games_played`, `game_reviews`, `game_ratings`, `game_votes`,
`saved_avatars`, `avatar_votes`, `moderation_log`,
`avatar_shop_items`, `avatar_shop_purchases`,
`ranking_actividad_semanal`, `ranking_juegos_semanales`.

### 4.2 Aplicar una migración

- **Local**: la base de práctica (`scripts/pglite.js`) aplica todas las
  migraciones en orden automáticamente al crearse.
- **Producción**: aplicar con el editor SQL de Neon o el cliente que
  prefieras. Orden de despliegue: ver `docs/SEGURIDAD.md` y la sección
  7 de esta guía.

---

## 5. Desarrollo local

### 5.1 Base de práctica (PGlite)

`scripts/pglite.js` crea un Postgres real embebido (WASM) en memoria,
aplica las migraciones y expone:

- `crearBaseLocal()` → instancia PGlite lista.
- `crearSqlPGlite(db)` → adaptador que imita la interfaz del driver de
  Neon (`sql\`...\``) para que los mismos handlers corran contra la
  base local. Soporta **fragmentos SQL anidados** (pedazos `sql\`...\``
  incrustados dentro de otros, como usa `api/users.js` con
  `semanaActualSQL`).

### 5.2 Servidor local (navegador)

```bash
npm run db:local
```

Levanta el sitio completo en `http://localhost:3001`:

- Sirve todos los archivos estáticos.
- Rutea `/api/auth` y `/api/users` con los handlers reales contra la
  base de práctica.
- Crea un usuario de prueba `demo` / `demo1234` con contraseña en
  texto plano, para ver la migración a hash en vivo (la consola avisa
  solo cuando hubo una migración real).
- **Limitación a propósito**: el resto de los endpoints (`/api/content`,
  `/api/social`, `/api/system`) no están activados en el modo local,
  porque no forman parte del trabajo actual. Las secciones que los
  usan se ven vacías; eso es esperado.

### 5.3 Tests

```bash
npm test
```

Usa `node:test` (incluido en Node). Los tests crean su propia base de
práctica, inyectan la conexión con `usarSqlLocal()` y ejercitan los
handlers reales por HTTP simulado. Ver `tests/password.test.js`.

---

## 6. Convenciones del proyecto

- **Idioma**: todo el código, comentarios y mensajes en español.
- **Comentarios**: explicar el "por qué", no el "qué" (estilo de todo
  el repo). Documentar decisiones y FIXes.
- **Sin emojis** en código, consola, commits ni documentación nueva
  (decisión del proyecto; lo preexistente no se toca).
- **Commits**: autor "Luis David Trejos Rojas"
  `<luisdavid.trejosrojas@gmail.com>`, sin firmas adicionales ni
  pies de autoría automáticos. Un commit por cambio lógico.
- **Módulos compartidos**: la lógica reutilizable va en `api/_*.js`
  (backend) o `js/core.js` / `js/motor/*` (frontend). No duplicar
  funciones que ya existen (ej.: `getUserId` vive en `api/_utils.js`).

---

## 7. Despliegue

Orden recomendado (importante: la migración SIEMPRE antes que el
código que la usa):

1. Aplicar la migración 013 a la base de producción (columna
   `password_hash`).
2. Desplegar el código nuevo en Vercel (todo el repo).
3. Verificar en producción: un registro de prueba y un login de un
   usuario existente (que migra solo).
4. Correr el backfill para los usuarios que no vuelven a entrar (ver
   `docs/SEGURIDAD.md`).
5. Verificar que no quede ningún password en texto plano:
   `SELECT COUNT(*) FROM users WHERE password IS NOT NULL;`
6. Recién entonces, planificar la migración 014 (borrar la columna
   `password` y la rama de comparación legacy del código).

---

## 8. SEO

Todo lo relacionado con buscadores (dominio, sitemap, robots,
metadatos, datos estructurados) está documentado en `docs/SEO.md`.
Recordar: el dominio `https://www.macroreborn.com` sigue siendo un
placeholder hasta la v1.0.
