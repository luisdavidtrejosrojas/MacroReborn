# Lista de revisión: cada documento, leído entero y comparado con el sistema

**Para qué**: dejar constancia de que cada documento se leyó entero y se comparó con el código, con
`infra/` y, si habla del servidor, con el VPS solo con órdenes de lectura (RF-008, CE-004, research
D7).
**Creada**: 2026-10-05, vacía. Se rellena en la implementación, una fila por documento.
**Especificación**: [spec.md](../spec.md)

**Cómo se rellena**: al terminar de revisar un documento se escribe la fecha, con qué se comparó, cada
afirmación caducada y cómo quedó, y lo que no se pudo comprobar (con su motivo). Una afirmación
caducada nunca se queda sin corregir: si no se puede arreglar en esta spec, pasa a «Pendiente de
probar» con su motivo.

## Punto de partida

Lo que había antes de tocar nada (T001): cuántas pruebas y archivos de prueba, cuánto tarda
`npm test`, y que `npm run test:smoke` falla solo en la comprobación de monedas (la causa de la spec
002).

| Fecha | Pruebas | Archivos de prueba | `npm test` tarda | Prueba de humo |
|---|---|---|---|---|
| 05/10/2026 | 1.331 en 270 suites: 1.330 pasan y 1 se salta | 93 | 81 s, con Node 24.19 en el PC de Luis | Falla solo en la comprobación de monedas (`monedas.monto` entre 10 y 30), la causa de la spec 002 |

## Referencia

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/referencia/ARQUITECTURA.md` | | | | |
| `docs/referencia/ARTE.md` | 05/10/2026 | `api/content.js` (el catálogo, el panel y `avatarPrenda`), `api/_rafaga.js`, `api/_prendas-firma.js`, `api/_ruta-estatica.js`, `api/_compositor.js`, `api/_lienzo.js`, `scripts/hornear-catalogo.js`, `js/arte.js`, los CSS del lienzo, `terminos.html`, el `sitemap.xml` y `infra/nginx/`; la base de producción, solo con lectura (las medidas de `avatar_archivos`), y la web real (404 en `imagenes/`, 403 en `/prendas/` sin firma, 400 y 401 en el catálogo) | El correo de §4 y §7: se nombra el buzón que publica `terminos.html`. El índice público de lo puesto (§1) y su «ventana de un minuto»: se fue el 24/09. `/prendas/` «que hay que conocer»: con firma desde el 24/09. La caché de nginx de `/prendas/` (§2 y §5): ya no existe, y con ella el primer agujero del aviso. «80 fuera del lienzo»: 0 de 552 el 05/10. §6, «lo que se decidió NO hacer»: se adoptó el 21/09; el texto de entonces, entero, a la historia del avatar compuesto. «La memoria del proyecto»: se enlaza la historia. §7 pasa a «Lo que queda»: del lienzo solo queda el CSS 327/505. Cifras con fecha. Sin tocar, por ser código: los comentarios de `api/_rafaga.js`, de `avatarPrenda` y de `scripts/hornear-catalogo.js` siguen contando la caché de `/prendas/` y el índice público, y `explorar.html` y `mi-dia.html` tienen pie sin el enlace a los términos; contado a Luis |  |
| `docs/referencia/AVATARES.md` | 05/10/2026 | `api/_avatar-compuesto.js`, `api/_compositor.js`, `api/_avatar-catalogo.js`, `api/_recortes.js`, `api/_previsualizaciones.js`, `api/_prendas-firma.js`, `api/recortes-cara.json`, `js/core.js`, `js/perfil.js`, `scripts/importar-catalogo.js` y los límites de `infra/nginx/` | «En PNG si no lleva fondo», dos veces: todo sale en JPG, aplanado sobre blanco. El freno agotado «lo dibuja por capas»: se sirve la silueta y se compone al pedirlo (el comentario del código decía lo mismo y se corrigió, sin tocar lo que hace). Lo que faltaba de las fases 3 y 5: hecho el 24/09. El punto 18: arreglado el 25/09, y la economía rehecha el 04/10. «La tienda de la comunidad»: el Bazar. El original del artista «hoy se baja entero»: con firma desde el 24/09. Las 768 prendas, los 6 de 117 y los 170 ms, con su fecha. Los costes de la URL descartada, en condicional. Los «Ver N» y «en 8», a enlaces; títulos sin número, con las anclas del código al día. Lo pendiente (el orden de capas, vender ranuras, corregir una prenda sola), en «Lo que queda» |  |
| `docs/referencia/AVISOS.md` | 05/10/2026 | `api/_avisos.js`, `api/_avisos-sse.js`, `js/avisos.js`, `cluster.js`, el pase de `api/_auth.js` y `api/content.js`, y el bloque de `/api/avisos` en `infra/nginx/macroreborn.conf` | «8000 bytes por aviso»: el código corta en 7000, con margen; «nginx corta a los 60 segundos»: ese bloque lo sube a una hora, y el latido queda por la otra razón; «los diez avisos del sitio»: cifra que cambia sola, fuera; «las 22 páginas», con su «entonces» |  |
| `docs/referencia/CUENTAS.md` | 05/10/2026 | `api/_password.js`, `api/auth.js`, `api/users.js`, `api/_auth.js`, `tests/password.test.js`, las migraciones 013 y 014, los límites de `infra/nginx/` y la auditoría; el servidor, solo con lectura (qué hay en `~/respaldos/`) | El título «SEGURIDAD — sistema de contraseñas»: las cuentas, con su cabecera. «Qué NO incluyó [...] candidatos para futuras iteraciones»: la sesión, el límite al entrar, la moderación y el escapado ya existen, y ahora se enlaza dónde, con los puntos 1, 12 y 73 que siguen pendientes. «En el VPS se borran solos a los 14 días»: los diarios sí, pero los dos volcados de Neon del 01/09, con contraseñas en claro, siguen en `~/respaldos/` (corregido también en `VPS.md`, y contado a Luis). La mención a `DESARROLLO.md`, como enlace. «Lo que queda», al final, y los títulos sin número |  |
| `docs/referencia/ECONOMIA.md` | 05/10/2026 | `api/_precios.js`, `api/_monedas.js`, `api/_misiones.js`, `api/_logros.js`, `api/users.js` (`sumarXp`), `js/motor/actividad-jugador.js`, `jugar.html`, `js/datos-juegos.js`, las migraciones 012, 015, 024 y 027, y las pruebas que lista | Nada del funcionamiento: precios, saldo inicial, premios, racha, niveles, misiones, logros sin monedas y los 3 y 10 minutos coinciden con el código. Faltaba la cabecera. Las citas «(sección N)», a enlaces. El total de 243.500 y los 108 de 112 juegos, con su fecha, y la simulación con la suya. La mención a `TIENDA.md`, como enlace |  |
| `docs/referencia/MODERACION.md` | 05/10/2026 | `api/_sanciones.js`, `api/_auth.js`, `api/auth.js`, `api/users.js`, el bloqueo de escrituras de `api/content.js`, `api/social.js` y `api/users.js`, `js/core.js` (`MRTexto`), `css/inicio.css`, `terminos.html` y las pruebas que lista | Nada del funcionamiento: los escalones, los días de suspensión, el enlace para reclamar, los 403 con su código, la recarga cada 30 segundos, `?moderacion=1` y el texto tapado coinciden con el código, y las partes 3 y 4 siguen sin hacer. Faltaba la cabecera. Los «ver 4» y «Ver 7», a enlaces, y la mención a la auditoría también. «Lo que falta, ya decidido» pasa a «Lo que queda» |  |
| `docs/referencia/SEO.md` | 05/10/2026 | El `<head>` de las 30 páginas (robots, canonical, descripción, Open Graph, Twitter, theme-color, iconos, `<h1>` y fuentes), `robots.txt`, `sitemap.xml` frente a `js/datos-juegos.js`, `js/seo.js`, `js/juego.js`, `js/juegos.js`, `js/datos-juegos.js` y la web real (`www` y sin `www` contestan los dos) | «El dominio de ejemplo, reemplazalo antes de publicar» (con su emoji): es el dominio real. «Cada una de las 15 páginas»: son 30, y 14 lo llevan entero. La tabla: faltaban 15 páginas, y `notificaciones.html` es `noindex, follow`. «Solo chat usa nofollow»: también los tres paneles. «Las 42 fichas»: todas, 112. El sitemap «se generó con `gen_sitemap.py`»: no existe, se mantiene a mano, y tiene 111 de los 112 juegos. `robots.txt` «solo bloquea `/admin.html`»: también `/api/`. «Exactamente un `<h1>`»: con dos excepciones. Las fuentes, en 28 páginas. Las URL limpias «para la v1.0, si sigue estático»: ya hay servidor propio, y pasan a «Lo que queda». Sin tocar, por ser código o contenido: falta Macro Snake en el sitemap, siete páginas se indexan sin estar en él y tres del sitemap no tienen Open Graph; contado a Luis. Visto en T047: las portadas son JPEG desde el 17/08, así que el consejo de `pngquant` sobraba |  |
| `docs/referencia/TIENDA.md` | 05/10/2026 | `api/content.js` (`avatar-shop`, `avatar-shop-buy`, `mis-monedas` y `avatarEditarPrenda`, con su registro `[arte]`), `api/_precios.js`, `api/_pg.js`, las migraciones 012, 022 y 027, `js/bazar.js`, `js/login.js`, `js/navbar.js`, `js/perfil.js`, `js/comunidad-ranking.js`, `comunidad-ranking.html`, `portal-growth.js` y la historia de los zips | «El portal de la portada ("Abrir Bazar", `portal-growth.js`)»: ese enlace no sale en ninguna página, porque ninguna tiene su hueco (`mrEconomiaPerfil`); los caminos son los de hoy, con el "+" de la barra y los dos botones de Comunidad. «El zip que mandó otro dev el 22/09»: hecho el 22/09 y llegado el 28/09. «`docs/referencia/AVATARES.md`, fase 5»: la fase está en la historia; se enlaza «la puerta cerrada». Faltaba la cabecera. Los «Ver 4», «(ver 2)» y «(sección 5)», a enlaces, y las menciones a `ECONOMIA.md` también. Sin tocar, por ser código: el «Abrir Bazar» muerto de `portal-growth.js` y el comentario de `js/perfil.js` que aún habla de `js/tienda.js`; contado a Luis |  |
| `docs/referencia/VPS.md` | 05/10/2026 | El código (`api/_pg.js`, `server.js`, `cluster.js`, `api/auth.js`); `infra/`, cuyas nueve copias coinciden con el servidor directiva a directiva; el servidor, solo con lectura (sistema, versiones, servicios, cortafuegos, crontab, respaldos, certificados y los nombres de las variables del `.env`); el DNS y la API pública | La IP entera (§1 y §8): fuera. fail2ban «con seis cárceles»: apagado y deshabilitado desde el 17/09. El cron con `curl`: ahora es un script con `CRON_SECRET`, que faltaba en el `.env`. El párrafo de Pusher: fuera. La copia de nginx de antes del HTTPS y `vercel.json`: ya no existen. «60 GB libres»: 55 al 05/10. «PostgreSQL 16.15»: 16, con el cliente 18. Faltaba la zona `estaticos`. Los `?v=`: hoy conviven varias fechas. `/api/users`: de 1,38 MB a 169 kB. Secciones renumeradas y citadas por enlace. Visto en T040: las copias de `~/respaldos/` de fuera de `diarios/` no se borran solas, y ahora se cuentan. Visto en T049: «las sesiones están en Postgres» (el cluster): son pases firmados, y se cuenta lo que sí guarda cada proceso; llega de `RETOMAR.md` la trampa de la memoria de la base, con lo medido el 05/10 (179 MB, ya no cabe en `shared_buffers`) |  |

## Guías

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/guias/SUMARSE.md` | | | | |
| `docs/guias/DESARROLLO.md` | 05/10/2026 | `api/_db.js` y los handlers de `api/`, `scripts/pglite.js`, `scripts/servidor-local.js`, `scripts/sembrar-arte.js`, `scripts/smoke-local.js`, `scripts/traer-base.js`, `scripts/revision-avatares.js`, la herramienta de recortes y su prueba, `api/_monedas.js`, `js/motor/actividad-jugador.js`, `js/datos-juegos.js`, `package.json` y `.gitignore` | La entrada y «Qué cubre»: hablaban de contraseñas y del relleno, que ya no están aquí. «Módulos nuevos». El adaptador «imita el driver de Neon»: imita el `sql` de los handlers. El servidor local también sirve `/api/avisos`, y además de social y system tampoco tiene progreso ni originales-ranking. «(ver la sección 6)», «sección 8» y «sección 9»: ya no existen; son enlaces. La verificación manual de monedas era de antes del 04/10: la racha, el minuto 10 y los 3 minutos sin tocar nada. La prueba de humo falla en esa comprobación (su propia spec). «La pantalla de tienda»: el Bazar. «756 pruebas»: unas 1.300. «Como las apila hoy el navegador»: hasta el 24/09. «Generará las 768»: las genera. Cifras con fecha, `cd D:\Macroreborn` fuera, menciones a enlaces y secciones sin número (sus anclas, al día). Sin tocar, por ser código: `scripts/traer-base.js` lleva la IP entera como valor por defecto, y los comentarios de `scripts/servidor-local.js` (Vercel/Neon) y `scripts/revision-avatares.js` («lo que hace el navegador hoy») caducaron; contado a Luis |  |
| `docs/guias/DESPLEGAR.md` | 05/10/2026 | El `CLAUDE.md`, §4 de `RETOMAR.md` y §5 de `VPS.md`; el servidor, solo con lectura (el servicio activo, `receive.denyCurrentBranch=updateInstead` en `~/MacroReborn`, `sudo` sin contraseña para `azureuser` y que se entra por el dominio); y la comprobación mínima, contra la web real (200, 404 y 400 como se espera) | «`git pull`» en el servidor (§5 de `VPS.md`): ya no se despliega así. La IP entera de §4 de `RETOMAR.md`: fuera, se usa el dominio |  |
| `docs/guias/JUEGOS.md` | 05/10/2026 | `js/datos-juegos.js` (campos, estados, tipos, categorías, el mayor id y el comentario del 30), `html/juegos/` (los ejemplos y la versión de Ruffle), `imagenes/juegos/`, `sitemap.xml`, `scripts/servidor-local.js`, `js/motor/actividad-jugador.js`, `tests/juego-quitado.test.js` y la constitución (reglas I, V, XI y XXX) | Faltaba la cabecera. «El id, máximo + 1 (hoy: 112)»: el máximo es 113. «Todos usan el estado Nuevo»: todos menos Macro Snake. «El sitemap solo llega hasta el id 42»: tiene 111 de 112. «En modo local solo `/api/auth` y `/api/users`»: también `/api/content` y `/api/avisos`. El pulso de XP solo sigue tocando algo. §6, las convenciones: dice lo que la constitución, y pasa a su enlace con lo propio de los juegos. De paso, `SEO.md` daba las portadas por PNG: son JPEG desde el 17/08 (commit aparte). Ruffle: 27 juegos usan la versión que dice la guía y 4 otra; se deja, porque la guía dice cuál usar en uno nuevo |  |
| `docs/guias/CAMBIOS-DE-OTROS-DEVS.md` | 05/10/2026 | La regla XXVII de la constitución, `git log` de los renombrados (los 15 de la tabla, y ninguno borrado), `tests/documentacion.test.js` y la guía de desarrollo | Faltaba la cabecera. «Ver `docs/guias/JUEGOS.md#4-probar-localmente`»: el servidor local lo explica `DESARROLLO.md`, y va como enlace; la spec 001, también como enlace. El método y la tabla de rutas, correctos |  |
| `docs/guias/RETOMAR.md` | 05/10/2026 | `~/.claude/projects/` y `memoria-claude/` (cuántas memorias y conversaciones), `node_modules/`, `git remote -v`, la regla V de la constitución, `docs/referencia/VPS.md` y el servidor, solo con lectura (el tamaño de la base, `shared_buffers`, las lecturas desde memoria y la memoria de la máquina) | La IP de §2 (dos veces): fuera, se entra por el dominio. El correo de autor: se nombra la regla V. «Público»: privado, comprobado el 05/10. La ruta vieja del PC, con el usuario de Windows: fuera. «Última actualización»: la cabecera. «Ver §1.1» y las menciones, a enlaces. El apartado de la memoria de Claude estaba sin título dentro del de la llave: ahora es 1.3, con sus cifras con fecha, y 1.3 pasa a 1.2. «655 pruebas, ~45 s»: unas 1.300, ~1 min. «76 MB» de `node_modules`: 50. Las trampas del servidor van a `VPS.md`: fail2ban ya lo contaba, con su `ignoreip`, y la de `shared_buffers` llega con lo medido hoy (la base ya pasó de 128 MB: 179). Su §5 no se toca, como pide T049: pasa al historial en T063 |  |

## Listas vivas

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/listas/AUDITORIA.md` | 05/10/2026 | Los puntos 14 y 75 y sus notas, la cabecera y las notas en prosa frente a los documentos que citan; las filas, comparadas antes y después por script, quedan idénticas (regla XXXI) | Faltaba la cabecera. Los puntos 14 y 75 decían «público»: el repositorio es privado (comprobado el 05/10, sin fecha exacta del cambio), con una nota fechada en cada uno. Las cinco menciones a documentos de las notas, a enlaces; la «fase 3 de AVATARES.md» ahora está en la historia. Las filas no se tocan: el estado de cada punto lo lleva quien lo arregla. La fila del mapa se fecha con T069, que le añade la sección de pendientes |  |
| `docs/listas/SUGERENCIAS.md` | 05/10/2026 | La cabecera y la entrada; dos filas al azar contra el código (la galería de 6 diseños con sus votos, en la migración 020 y `js/perfil-avatares-galeria.js`, y las 15 monedas por nivel, en `api/_monedas.js`); el resto ya se había revisado contra el código ese mismo día. Números y estados, comparados antes y después por script | Faltaba la cabecera. Los 12 emojis, fuera (research D16): el nombre del canal viejo se escribe sin ellos, el nombre de una persona sin el suyo, los votos se describen y el rol de la corona, entre corchetes. `emojis.js` cuenta 0. La mención a la auditoría, como enlace. Números, estados y filas, intactos (regla XXXI) | Lo que dice de la exportación (452 mensajes de 19 personas): está en `sugerencias-discord/`, fuera de git, con datos de la comunidad; no se volvió a contar |

## Historia

En la historia no se corrige lo que se contó: se comprueba que se pasó entero, que sus enlaces
funcionan y que no lleva datos sensibles. Si algo que cuenta ya no es así, se añade una nota con fecha.

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/historia/HISTORIAL.md` | | | | |
| `docs/historia/FRONTEND.md` | | | | |
| `docs/historia/AVATARES-AL-SERVIDOR.md` | 05/10/2026 | Con lo que era `AVATARES-SERVIDOR.md`: su entrada, §1, §2, §4, §5 (menos «Cómo mirarlo con los ojos»), lo de macrojuegos de §8 y §12, y de §13 cómo se decidió y el relleno; todo movido por script | Nada: es historia. Los títulos pierden su número y los de la foto de perfil y las previsualizaciones ganan contexto |  |
| `docs/historia/LIENZO-DEL-CATALOGO.md` | 05/10/2026 | Con §6 de `DESARROLLO.md`, de donde salió entera (149 líneas, movidas por script) | Nada: es historia | |
| `docs/historia/IMAGEN-NO-ENCONTRADA.md` | 05/10/2026 | Con §7 de `DESARROLLO.md`, de donde salió entera (115 líneas, movidas por script) | Nada: es historia |  |
| `docs/historia/AVISOS-ROTOS.md` | 05/10/2026 | Con §9 de `DESARROLLO.md` («Por qué llevaba dos semanas roto», 17 líneas) y la frase de §2.3 sobre `_pusher.js` | Nada: es historia |  |
| `docs/historia/MUDANZA-AL-VPS.md` | 05/10/2026 | Con §3 (menos 3.4) y §7 de `VPS.md` y con §2.1 de `DESARROLLO.md`, de donde salieron enteras | Nada: es historia. Su cita a la §3.3 de `VPS.md`, que ya no existe, pasa a un enlace dentro del propio documento |  |
| `docs/historia/FUGA-DEL-ENV.md` | 05/10/2026 | Con «La fuga del `.env`» de §9 de `VPS.md`, de donde salió entera | Nada: es historia. Sus tres IP de fuera, tapadas (regla XXV) |  |
| `docs/historia/CONTRASENAS-EN-CLARO.md` | 05/10/2026 | Con §1, §3 y §5 de `CUENTAS.md` y §2.4, §3.3 y §4 de `DESARROLLO.md`, de donde salieron enteras; §2.2 de `DESARROLLO.md` se fundió en §2 de `CUENTAS.md` | Nada: es historia. Sus tres citas a `CUENTAS.md` pasaron a enlaces dentro del propio documento |  |
| `docs/historia/LLAVE-SSH.md` | 05/10/2026 | Con §1.1 (el relato y la lección) y §1.2 de `RETOMAR.md`, de donde salieron enteras | Nada: es historia |  |
| `docs/historia/SALDOS-REHECHOS.md` | 05/10/2026 | Con §5 de `ECONOMIA.md`, de donde salió entera | Nada: es historia |  |
| `docs/historia/ACTIVAR-LA-MODERACION.md` | 05/10/2026 | Con §5 de `MODERACION.md`, de donde salió entera | Nada: es historia. Lo que sigue vigente (las columnas viejas sin usar, comprobado en el código) se queda también resumido en la referencia |  |
| `docs/historia/CASOS-DE-OTROS-DEVS.md` | 05/10/2026 | Con §1 y §2 de `CAMBIOS-DE-OTROS-DEVS.md`, de donde salieron enteras | Nada: es historia. La guía se queda con el método, sacado de lo que se repite en los dos casos |  |

## Fuera de `docs/`

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `README.md` | | | | |
| `CLAUDE.md` | | | | |
| `infra/LEEME.md` | | | | |
| `.gitignore` (sus comentarios) | | | | |
| `memoria-claude/LEEME.md` (fuera de git) | 05/10/2026 | La copia y la memoria viva | Decía que el repositorio es público (es privado, comprobado el 05/10/2026); «nueve archivos» de memoria (son dieciséis); la carpeta de Claude para una ruta en `C:` estaba mal calculada; la receta de refresco empezaba con `rm -rf` y se llevaba el propio `LEEME.md` y el zip; citaba la auditoría con su ruta de antes. Todo corregido | |
| La memoria de Claude, la viva y su copia (fuera de git) | 05/10/2026, solo sus citas a documentos | Las rutas nuevas | 12 citas en seis archivos con las rutas de antes; las dos que citaban por número (1.1 a 1.3 de `RETOMAR.md`, la sección 3 de `ECONOMIA.md`) citan ahora por tema. La copia tenía 13 archivos y ahora tiene los 17 de la viva | |
| `sugerencias-discord/` (fuera de git; solo guarda la exportación) | 05/10/2026 | Lo que contiene, sin abrir los mensajes: la exportación y las capturas | Nada: solo guarda la exportación (mensajes y capturas) y no lleva documentación que pueda caducar |  |

## Validación final

Los resultados de los escenarios de [quickstart.md](../quickstart.md), con su fecha.

| Escenario | Resultado | Fecha |
|---|---|---|
| 1. Las pruebas, en verde | | |
| 2. Las diez preguntas en dos clics | | |
| 3. Confiar en lo que dice | | |
| 4. La visión de conjunto | | |
| 5. Sumarse en menos de 30 minutos (Claude, sobre una copia limpia) | | |
| 5. Sumarse en menos de 30 minutos (una persona del equipo) | | |
| 6. El historial | | |
| 7. Nada se pierde | | |
| 8. Sin emojis ni datos sensibles | | |
| 9. Fuera del repositorio | | |
| 10. La constitución v1.0.1 | | |
