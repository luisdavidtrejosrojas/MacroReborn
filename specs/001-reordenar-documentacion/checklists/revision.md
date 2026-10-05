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
| `docs/referencia/SEO.md` | | | | |
| `docs/referencia/TIENDA.md` | | | | |
| `docs/referencia/VPS.md` | 05/10/2026 | El código (`api/_pg.js`, `server.js`, `cluster.js`, `api/auth.js`); `infra/`, cuyas nueve copias coinciden con el servidor directiva a directiva; el servidor, solo con lectura (sistema, versiones, servicios, cortafuegos, crontab, respaldos, certificados y los nombres de las variables del `.env`); el DNS y la API pública | La IP entera (§1 y §8): fuera. fail2ban «con seis cárceles»: apagado y deshabilitado desde el 17/09. El cron con `curl`: ahora es un script con `CRON_SECRET`, que faltaba en el `.env`. El párrafo de Pusher: fuera. La copia de nginx de antes del HTTPS y `vercel.json`: ya no existen. «60 GB libres»: 55 al 05/10. «PostgreSQL 16.15»: 16, con el cliente 18. Faltaba la zona `estaticos`. Los `?v=`: hoy conviven varias fechas. `/api/users`: de 1,38 MB a 169 kB. Secciones renumeradas y citadas por enlace. Visto en T040: las copias de `~/respaldos/` de fuera de `diarios/` no se borran solas, y ahora se cuentan |  |

## Guías

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/guias/SUMARSE.md` | | | | |
| `docs/guias/DESARROLLO.md` | | | | |
| `docs/guias/DESPLEGAR.md` | 05/10/2026 | El `CLAUDE.md`, §4 de `RETOMAR.md` y §5 de `VPS.md`; el servidor, solo con lectura (el servicio activo, `receive.denyCurrentBranch=updateInstead` en `~/MacroReborn`, `sudo` sin contraseña para `azureuser` y que se entra por el dominio); y la comprobación mínima, contra la web real (200, 404 y 400 como se espera) | «`git pull`» en el servidor (§5 de `VPS.md`): ya no se despliega así. La IP entera de §4 de `RETOMAR.md`: fuera, se usa el dominio |  |
| `docs/guias/JUEGOS.md` | | | | |
| `docs/guias/CAMBIOS-DE-OTROS-DEVS.md` | | | | |
| `docs/guias/RETOMAR.md` | | | | |

## Listas vivas

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/listas/AUDITORIA.md` | | | | |
| `docs/listas/SUGERENCIAS.md` | | | | |

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
| `sugerencias-discord/` (fuera de git; solo guarda la exportación) | | | | |

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
