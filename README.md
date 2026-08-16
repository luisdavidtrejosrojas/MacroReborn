# MacroReborn

Portal web de juegos retro y gratis para jugar online, con comunidad:
registro y perfiles con avatar en capas, chat general en tiempo real,
amigos, notificaciones, reseñas y valoraciones de juegos, ranking
semanal por tiempo jugado, moderación, panel de administración y una
tienda de prendas para avatares con monedas.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML, CSS y JavaScript vanilla (sin frameworks, sin build) |
| Backend | Serverless Functions en Vercel (`api/`) |
| Base de datos | PostgreSQL en Neon (`@neondatabase/serverless`) |
| Tiempo real | Pusher (chat, notificaciones, actividad) |
| Base local de desarrollo | PGlite (Postgres embebido en WASM, sin servidor) |

## Estructura del proyecto

```
├── *.html                Páginas del sitio (index, juegos, perfil, chat, admin, ...)
├── css/                  Hojas de estilo por página
├── js/                   Scripts del frontend
│   ├── core.js           Utilidades compartidas (avatares, fechas, presencia)
│   └── motor/            Módulos de dominio (xp, logros, insignias, permisos, ...)
├── html/juegos/          Páginas de cada juego embebido (iframes)
├── api/                  Backend (Serverless Functions)
│   ├── auth.js           Login, registro, borrado de cuenta
│   ├── users.js          Perfiles, XP, suspensión, cambio de contraseña
│   ├── content.js        Comentarios, chat, reseñas, reportes, tienda, ...
│   ├── social.js         Amigos, logros, insignias, bloqueos
│   ├── system.js         Estadísticas, ranking semanal
│   ├── _utils.js         Helpers compartidos (CORS, ids, bloqueos)
│   ├── _db.js            Conector único de base de datos
│   ├── _password.js      Hash y verificación de contraseñas (bcrypt)
│   └── _pusher.js        Cliente Pusher (con instancia "muda" en local)
├── migrations/           Migraciones SQL de la base, numeradas (001-013)
├── scripts/              Herramientas de desarrollo
│   ├── pglite.js         Base local de práctica (PGlite) + adaptador Neon
│   ├── servidor-local.js Servidor local para probar en el navegador
│   └── migrar-passwords.js  Backfill de contraseñas a hash
├── tests/                Tests automáticos (node:test)
├── docs/                 Documentación (SEO, desarrollo, seguridad)
└── imagenes/             Imágenes, avatares y portadas de juegos
```

## Comandos útiles

```bash
npm install          # instala dependencias (bcryptjs, pglite, pusher, neon)
npm test             # corre los tests automáticos (node:test)
npm run db:local     # levanta el sitio local en http://localhost:3001
```

### Probar el sitio localmente (sin tocar producción)

```bash
npm run db:local
```

Abrí `http://localhost:3001`. Todo corre dentro de tu computadora con
una base de práctica (PGlite): el sitio, `/api/auth` y `/api/users`
funcionan con los mismos handlers de producción. El resto de los
endpoints de la API no están activados en el modo local a propósito
(ver `docs/DESARROLLO.md`).

## Documentación

| Guía | Contenido |
|---|---|
| `docs/DESARROLLO.md` | Arquitectura, referencia de la API, base de datos, desarrollo local, tests, convenciones y despliegue |
| `docs/SEGURIDAD.md` | Sistema de contraseñas (hash bcrypt), migración, backfill y plan de activación |
| `docs/SEO.md` | Guía de mantenimiento SEO (dominio, sitemap, robots, metadatos) |

## Notas

- El proyecto original usa contraseñas con hash bcrypt (ver
  `docs/SEGURIDAD.md`). El frontend es HTML estático y el backend
  vive en Vercel + Neon.
- La documentación está escrita en español, en el mismo estilo que el
  resto del proyecto.
