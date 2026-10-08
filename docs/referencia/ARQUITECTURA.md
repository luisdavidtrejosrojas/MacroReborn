# ARQUITECTURA — el sistema de un vistazo

> **De qué trata:** las partes de MacroReborn, cómo se conectan, dónde vive cada una y qué documento
> cuenta cada área, con su código principal. Es el mapa: el detalle está en cada documento.
>
> **Para quién:** quien llega al proyecto, y quien busca dónde está algo.
>
> **Revisado:** 05/10/2026

MacroReborn es una comunidad de juegos web, en [macroreborn.com](https://macroreborn.com): un
catálogo de juegos gratis con ficha por juego, calificaciones, reseñas, favoritos, historial y ranking
por tiempo jugado, más perfiles con avatar, amigos, chat, notificaciones, una economía de monedas y
moderación.

---

## Las partes

| Parte | Qué es | Dónde |
|---|---|---|
| El navegador | 30 páginas en la raíz (el 05/10/2026), con su JavaScript en `js/` y `js/motor/` y sus estilos en `css/`. HTML, CSS y JavaScript sin frameworks ni paso de compilación | la raíz, `js/`, `css/` |
| Los juegos | El catálogo es un array de `js/datos-juegos.js` (112 juegos el 05/10/2026), y cada juego, una página de `html/juegos/` que lo embebe; lo pesado viene de CDN externos, nada de binarios en el repositorio | `js/datos-juegos.js`, `html/juegos/`, `imagenes/juegos/` |
| El servidor | `server.js` sobre Node: sirve los archivos estáticos, por lista blanca, y pasa cada `/api/<nombre>` a su handler de `api/`. `cluster.js` lo arranca en un proceso por núcleo | `server.js`, `cluster.js`, `api/` |
| Los módulos compartidos | La lógica que usan varios handlers: la conexión a la base, la sesión, las contraseñas, las monedas, los avisos, el compositor de avatares... (29 archivos el 05/10/2026) | `api/_*.js` |
| La base de datos | PostgreSQL 16 en el propio servidor. El esquema crece con las migraciones numeradas, aunque ninguna crea la tabla `users` (punto 67 de la [auditoría](../listas/AUDITORIA.md)) | `migrations/` |
| Producción | Un VPS de Azure: nginx delante, con el HTTPS, los límites de peticiones y una caché; systemd mantiene vivo el servicio; un respaldo cada noche y un cron los lunes | [VPS](VPS.md) |
| Las pruebas | `npm test`, unas 1.300 al 05/10/2026, con `node:test` sobre una base de práctica (PGlite) y sin tocar producción; y la prueba de humo, que levanta un servidor y lo recorre por HTTP | `tests/`, `scripts/smoke-local.js` |
| La integración continua | GitHub Actions en cada push: `npm test` con Node 20 y 22, y la prueba de humo con Node 22 | `.github/workflows/ci.yml` |
| Las herramientas | Lo que se corre a mano: la base de práctica, el servidor local, traer una copia de la base real, componer y revisar avatares, hornear la autoría del arte... | `scripts/` |
| La copia de la configuración | nginx, systemd, fail2ban, los respaldos y el cron, tal como están en el servidor | `infra/` |
| Lo que no está en git | El `.env` (solo en el servidor), la copia local de la base, los originales del arte, la memoria de Claude y la exportación de Discord | [RETOMAR](../guias/RETOMAR.md) |

**Con qué está hecho.** Node 20.19 o más, y cuatro dependencias: `pg`, `bcryptjs`, `jpeg-js` y el
driver de Neon, que solo se usa para leer la base de antes de la mudanza. Para las pruebas, PGlite y
jsdom. Lo demás está escrito a mano: lo que se acepta como dependencia lo dice la regla XXVI de la
constitución.

En la raíz hay además cuatro scripts sueltos: `portal-growth.js`, que cargan tres páginas, y
`script.js`, `home-portal.js` y `juego.js`, que el 05/10/2026 no carga ninguna.

---

## Cómo se conectan

- **Todo entra por nginx**, que pone el HTTPS, los límites de peticiones y una caché para los avatares
  y las previsualizaciones, y se lo pasa a Node, en la misma máquina.
- **`server.js`** sirve los archivos que deja la lista blanca y pasa cada `/api/<nombre>` al handler
  `api/<nombre>.js`: `auth`, `users`, `content`, `social`, `system`, `progreso` y
  `originales-ranking`. Casi todos deciden qué hacer por `?action=`. Aparte, `/api/avisos` es la línea
  abierta de los avisos en vivo ([AVISOS](AVISOS.md)), y `/avatares/`, `/previsualizaciones/` y
  `/prendas/` sirven las imágenes de los avatares ([AVATARES](AVATARES.md)).
- **La sesión** es un pase firmado (`api/_auth.js`) que el navegador guarda y manda en cada petición
  ([CUENTAS](CUENTAS.md#lo-que-no-cubre)).
- **La base.** Todos los handlers piden la conexión a `api/_db.js` (`obtenerSql()`), que elige el driver
  por la `DATABASE_URL`: `pg`, a través de `api/_pg.js`, para el Postgres del VPS, y el de Neon si la
  dirección es de Neon, una rama que sigue ahí aunque los datos se migraron el 01/09/2026. `api/_pg.js`
  conserva la forma en que los handlers escriben sus consultas (`` sql`...` ``, con fragmentos
  anidados). En las pruebas y en local, `usarSqlLocal()` la cambia por una base de práctica, con los
  mismos handlers ([DESARROLLO](../guias/DESARROLLO.md)). Cómo era antes, en
  [LA MUDANZA AL VPS](../historia/MUDANZA-AL-VPS.md).
- **Dos procesos.** `cluster.js` arranca uno por núcleo y systemd lo mantiene vivo. Lo que cada uno
  guarda en memoria está contado en [VPS](VPS.md#modo-cluster); los avisos cruzan de uno a otro con
  `LISTEN`/`NOTIFY` de Postgres.
- **Lo que va al disco y no a la base**: los avatares compuestos y las previsualizaciones, en
  `datos-locales/` del servidor, fuera de git ([por qué en disco](AVATARES.md#por-qué-en-disco-y-no-en-postgres)).
- **Desplegar** es un `git push` al servidor y reiniciar el servicio ([DESPLEGAR](../guias/DESPLEGAR.md)):
  lo que está en el repositorio es lo que se sirve.

---

## Dónde vive cada cosa

| | |
|---|---|
| Sitio en producción | https://macroreborn.com |
| Servidor | Azure, Ubuntu 24.04 **ARM64**, 2 vCPU, 950 MB de RAM ([VPS](VPS.md)) |
| Ruta del proyecto en el servidor | `/home/azureuser/MacroReborn` |
| Repositorio | `github.com/valenmgg/MacroReborn`, privado (comprobado el 05/10/2026, sin fecha exacta del cambio) |
| Base de datos | PostgreSQL 16 en el propio servidor, solo escucha en `127.0.0.1` |
| Respaldos | `~/respaldos/diarios/` en el servidor, uno cada noche a las 3:30, se guardan 14 días ([respaldos](VPS.md#respaldos)) |

Lo que solo sirve para volver a montar el PC de Luis (la llave, Bitwarden, la copia de Drive) está en
[RETOMAR](../guias/RETOMAR.md).

---

## Qué documento lleva cada área

| Área | Documento | Código principal |
|---|---|---|
| Las cuentas: contraseñas y nombres de usuario | [CUENTAS](CUENTAS.md) | `api/auth.js`, `api/_password.js`, `api/_auth.js`, `api/_nombre-usuario.js`, `api/_utils.js` |
| Los avatares | [AVATARES](AVATARES.md) | `api/_compositor.js`, `api/_avatar-compuesto.js`, `api/_avatar-catalogo.js`, `api/_previsualizaciones.js`, `js/perfil.js`, `js/core.js` |
| El arte y su protección | [ARTE](ARTE.md) | `api/_png.js`, `api/_lienzo.js`, `api/_prendas-firma.js`, `api/_rafaga.js`, `js/arte.js`, `scripts/hornear-catalogo.js` |
| La tienda, el Bazar | [TIENDA](TIENDA.md) | `bazar.html`, `js/bazar.js`, las acciones `avatar-shop` de `api/content.js` |
| Las monedas | [ECONOMIA](ECONOMIA.md) | `api/_monedas.js`, `api/_precios.js`, `js/motor/xp.js`, `js/motor/actividad-jugador.js` |
| La moderación | [MODERACION](MODERACION.md) | `api/_sanciones.js`, `admin.html`, `js/admin.js` |
| Los avisos en vivo | [AVISOS](AVISOS.md) | `api/_avisos.js`, `api/_avisos-sse.js`, `js/avisos.js` |
| Lo que ven los buscadores | [SEO](SEO.md) | `js/seo.js`, `sitemap.xml`, `robots.txt` |
| Los juegos | [JUEGOS](../guias/JUEGOS.md) | `js/datos-juegos.js`, `html/juegos/`, `js/juego.js`, `js/jugar.js` |
| El servidor y producción | [VPS](VPS.md) y [DESPLEGAR](../guias/DESPLEGAR.md) | `server.js`, `cluster.js`, `infra/` |
| Trabajar en local | [DESARROLLO](../guias/DESARROLLO.md) | `scripts/pglite.js`, `scripts/servidor-local.js`, `tests/` |
| Perfiles | Sin documento propio: [abajo](#las-áreas-sin-documento-propio) | `perfil.html`, `usuario.html`, `js/perfil.js`, `js/usuario.js`, `api/users.js` |
| Amigos | Sin documento propio: [abajo](#las-áreas-sin-documento-propio) | `amigos.html`, `js/amigos.js`, `api/social.js` |
| Chat | Sin documento propio: [abajo](#las-áreas-sin-documento-propio) | `chat.html`, `js/chat.js`, la acción `chat` de `api/content.js` |
| Comunidad y rankings | Sin documento propio: [abajo](#las-áreas-sin-documento-propio) | `comunidad-ranking.html`, `liga-global.html`, `js/comunidad-ranking.js`, `api/system.js`, `api/originales-ranking.js` |
| Misiones y logros | Sin documento propio: [abajo](#las-áreas-sin-documento-propio) | `mi-dia.html`, `progreso.html`, `api/_misiones.js`, `api/progreso.js`, `api/_logros.js` |
| Notificaciones y noticias | Sin documento propio: [abajo](#las-áreas-sin-documento-propio) | `notificaciones.html`, `js/notificaciones.js`, `api/_notifications.js`, `noticias.html` |
| Descubrir juegos | Sin documento propio: [abajo](#las-áreas-sin-documento-propio) | `index.html`, `explorar.html`, `js/home-portal.js`, `js/descubrimiento.js` |
| Lo que hay por arreglar | [AUDITORIA](../listas/AUDITORIA.md) | — |
| Lo que pidió la comunidad | [SUGERENCIAS](../listas/SUGERENCIAS.md) | — |

### Las áreas sin documento propio

**Perfiles.** `perfil.html` es el perfil propio: el editor del avatar, la biografía, la actividad, los
favoritos, el historial y la configuración (`js/perfil.js` y los `js/perfil-*.js`). `usuario.html` es
el de otra persona (`js/usuario.js` y los `js/usuario-*.js`). En el servidor, `api/users.js` guarda el
avatar, la biografía y la contraseña, y `api/content.js` da los comentarios del muro, la actividad, los
favoritos y el historial de juegos.

**Amigos.** `amigos.html` y `js/amigos.js`, contra `api/social.js`: las solicitudes (mandar, aceptar,
rechazar, cancelar), quitar un amigo y los bloqueos.

**Chat.** `chat.html` y `js/chat.js`, contra la acción `chat` de `api/content.js`. No se actualiza solo:
es el punto 29 de la auditoría.

**Comunidad y rankings.** `comunidad-ranking.html` (`js/comunidad-ranking.js`) junta la comunidad y el
ranking; `liga-global.html` son las ligas y `actividad-comunidad.html`, la actividad de todos. El
ranking semanal lo recalcula el cron de los lunes ([el cron](VPS.md#6-el-cron-semanal)). Los juegos
originales de la casa, hoy Macro Snake, tienen su propio ranking en `api/originales-ranking.js`, con
`macro-originals.html` y `originales-competicion.html`.

**Misiones y logros.** Las misiones diarias y semanales están en `api/_misiones.js` y se miran y se
cobran por `api/progreso.js`, desde `mi-dia.html` y `progreso.html`. Los logros los comprueba el
servidor, en `api/_logros.js`, y salen por `api/social.js`. Lo que dan en monedas, en
[ECONOMIA](ECONOMIA.md#3-cómo-se-ganan).

**Notificaciones y noticias.** `notificaciones.html` y `js/notificaciones.js`, que cargan casi todas
las páginas para el contador; en el servidor, `api/_notifications.js` y las acciones `notifications` y
`notifications-mark-read` de `api/content.js`. Las nuevas llegan por los avisos en vivo
([AVISOS](AVISOS.md)). `noticias.html` es estática: las noticias se escriben en su propio HTML.

**Descubrir juegos.** La portada (`index.html`, con `js/home-portal.js`), el catálogo (`juegos.html`),
`explorar.html`, y las categorías y colecciones (`categoria.html` y `coleccion.html`, con
`js/descubrimiento.js`). El catálogo sale de `js/datos-juegos.js`, sin pasar por el servidor.

---

## Por qué el navegador no usa un framework

Se pensó el 22/09/2026. El problema no era la falta de framework sino que el navegador no tiene forma
de que algo exista una sola vez; reescribirlo cambiaría problemas conocidos por otros nuevos, y el
camino barato son los elementos propios del navegador. Si algún día se empezara de cero, Astro. Todo
el razonamiento, con sus números, en [FRONTEND](../historia/FRONTEND.md).
