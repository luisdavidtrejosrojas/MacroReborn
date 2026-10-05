# AUDITORÍA — lo que hay por arreglar

> **De qué trata:** la lista viva de lo que hay por arreglar, nacida de la auditoría del 18/09/2026:
> cada punto con su estado, en bloques por importancia, con las notas de cómo se resolvió cada uno y
> lo que está bien y conviene no romper.
>
> **Para quién:** todo el equipo.
>
> **Revisado:** 05/10/2026

Lista viva de todo lo que se encontró en la auditoría del 18 de
septiembre de 2026. No es un informe cerrado: es la lista de trabajo. Se
marca aquí lo que se va haciendo y se añade aquí lo que se va
encontrando.

---

## Cómo se usa

**Marcar algo como hecho:** se escribe la fecha en la columna Estado.
Nunca se borra la fila ni se cambia su número, aunque quede resuelta.
Una fila resuelta con su fecha explica por qué el código está como está;
una fila borrada deja un hueco que nadie sabe interpretar seis meses
después. ([VPS](../referencia/VPS.md#9-lo-que-falta) ya contó lo que pasa cuando se borran puntos
de una lista numerada sin renumerar: no hay forma de saber si se
hicieron o se perdieron.)

**Añadir algo nuevo:** al final del bloque que le corresponda, con el
siguiente número libre. Los números no se reutilizan aunque se borre
algo.

**Estado:** `-` mientras esté pendiente, o la fecha en formato
`2026-09-18` cuando esté hecho. Si se decide no hacerlo, `descartado` y
una nota al pie explicando por qué.

**El orden es de importancia, no de ejecución.** Mezcla daño potencial,
probabilidad y coste de no arreglarlo. Dentro de un bloque se puede
hacer en cualquier orden.

---

## Cómo se hizo la auditoría

Catorce revisiones en paralelo, en dos rondas, más una auditoría del
servidor en vivo por SSH. Lo que aparece aquí está verificado contra
producción el 18 de septiembre de 2026: las afirmaciones con números
salen de consultas a la base real o de peticiones reales al sitio, no de
leer el código y suponer.

Algunas cifras de referencia de ese día, para que se pueda medir si algo
mejoró: 144 cuentas (141 personas), 271.626 partidas de Macro Snake,
277.000 filas en `activity_log`, entre 300.000 y 1.400.000 peticiones
diarias con unos 500 visitantes únicos, y la base en 127 MB.

---

## Bloque 1 — Urgente

Los catorce primeros suman una tarde de trabajo entre todos, y son los
que pueden costar una cuenta de usuario o el sitio entero.

| # | Estado | Categoría | Qué pasa | Dónde | Esfuerzo |
|---|---|---|---|---|---|
| 1 | - | Seguridad | 109 de 113 juegos se sirven desde el propio origen, sin `sandbox`. 177 referencias a ramas mutables de GitHub pueden leer el token de sesión de quien juega | `js/jugar.js:60` | 1 tarde + probar juegos |
| 2 | 2026-09-18 | Seguridad | XSS en los reportes: `contentTexto` es texto libre y se pinta sin escapar dentro del navegador de un administrador | `js/admin.js:583` | 30 min |
| 3 | 2026-09-21 | Seguridad | `/api/avisos` no pide sesión: cualquiera lee en vivo las notificaciones y la presencia de cualquiera | `api/_avisos-sse.js:71` | 1 h |
| 4 | 2026-09-18 | Seguridad | XSS almacenado en la biografía: se ejecuta en todo el que abra la comunidad | `js/comunidad-ranking.js:398` | 15 min |
| 5 | 2026-09-18 | Seguridad | XSS dirigido por notificación: cualquiera se la manda a quien quiera | `js/notificaciones.js:179` | 15 min |
| 6 | - | Seguridad | No hay `Content-Security-Policy` en ninguna parte. Es la red que falta bajo los cuatro anteriores | nginx | 1 h |
| 7 | 2026-09-18 | Seguridad | Cualquier usuario borra cualquier mensaje del chat omitiendo el campo `username` | `api/content.js:1217` | 10 min |
| 8 | 2026-09-18 | Seguridad | Cualquier usuario borra todas las notificaciones de otro | `api/content.js:1270` | 10 min |
| 9 | 2026-09-18 | Seguridad | Se puede firmar un comentario con el nombre de otra persona | `api/content.js:947` | 15 min |
| 10 | 2026-09-18 | Seguridad | `GET /%C0%80` tumba el proceso: `decodeURIComponent` sin `try/catch` | `server.js:249` | 10 min |
| 11 | 2026-09-18 | Seguridad | La barra de más expone el arte: `/imagenes//tora/pelo3.png` devuelve 200. Mismo arreglo que el 10 | `server.js:249` | incluido en el 10 |
| 12 | - | Seguridad | El token vive 7 días en `localStorage`, sin revocación. Cerrar sesión no lo invalida | `api/_auth.js:3` | 1 día |
| 13 | 2026-09-21 | Infraestructura | 75 commits solo existen en el PC y en el VPS. GitHub está en el 15/09 | — | 2 min |
| 14 | 2026-09-21 | Decisión | El repositorio es público: 630 prendas descargables con `git clone`. Anula todo lo que promete `docs/referencia/ARTE.md` | GitHub | decisión |
| 75 | descartado | Decisión | Las prendas siguen en el historial de GitHub desde el 23/07/2026: con `git clone` se bajan igual aunque ya no estén en el árbol. Sacarlas exige reescribir el historial, subir a la fuerza, pedir a GitHub que purgue lo que ya sirvió y resincronizar el servidor | GitHub | 2 h + decisión |
| 77 | 2026-09-24 | Seguridad | XSS almacenado en el nombre de usuario: el registro acepta cualquier texto y la página de amigos lo pinta sin escapar. Basta con mandar una solicitud de amistad para que se ejecute en quien la recibe, administradores incluidos | `js/amigos.js:212` | 1 h |
| 86 | - | Seguridad | Dos volcados de Neon del 01/09/2026, de la mudanza, siguen en `~/respaldos/` del servidor con 21 contraseñas en claro: la limpieza de 14 días solo borra `diarios/`. Hay otra copia en el PC | VPS | 10 min + decisión |

**Nota al 14.** Se decidió mantener el repositorio público y sacar las prendas
del árbol: el 21/09/2026 salieron 636 archivos (commit `bbe813a`). El sitio
no los echa en falta, porque desde la migración 018 sirve las prendas desde
la base. Lo que queda, el historial, es el punto 75.

**Nota al 14, del 05/10/2026.** El repositorio ya es privado: comprobado ese
día, sin fecha exacta del cambio. Hoy solo lo clona quien tiene acceso.

**Nota al 75.** Descartado el 21/09/2026. Reescribir el historial cambia la
identidad de todos los commits, obliga a resincronizar el servidor y no
recupera lo que ya se hubiera clonado, así que se acepta que el arte
anterior a esa fecha siga en el historial. Lo que protege de verdad ya
está en pie: la ruta por huella y la autoría dentro de cada PNG.

**Nota al 75, del 05/10/2026.** Con el repositorio ya privado (comprobado
ese día, sin fecha exacta del cambio), el arte de antes del 21/09 que
queda en el historial solo lo baja quien tiene acceso. El punto sigue
descartado.

**Nota al 3.** Hecho el 21/09/2026, pero no pidiendo sesión para abrir la
línea: `EventSource` no manda cabeceras, y un visitante anónimo mirando un
perfil tiene que seguir viendo los comentarios al vuelo. Lo que se cerró es
que el buzón y los bloqueos solo salen por la línea que trae un pase de un
minuto de su dueño (`api/_auth.js`, "EL PASE"). La "presencia" del texto es
el latido de última conexión, y se dejó pública porque el perfil ya la
enseña a cualquiera: si eso cambia, es el punto 57.

**Nota al 77.** Visto el 24/09/2026, durante la fase 3 del
[avatar compuesto](../historia/AVATARES-AL-SERVIDOR.md#fase-3--las-listas), y arreglado el mismo día. El registro
(`api/auth.js`) solo comprobaba que el nombre no estuviera vacío: ni
caracteres ni largo. Y `js/amigos.js` metía el nombre en el HTML sin
escapar en tres sitios: la tarjeta de cada amigo, la solicitud recibida
(`${sol.de}`) y la enviada. La recibida era la grave: un nombre como
`<img src=x onerror=...>` se ejecutaba en quien recibiera la solicitud
nada más abrir la página, sin aceptarla, y con el token en
`localStorage` eso es la cuenta entera. Al buscar el resto salió otro
del mismo tipo en el navegador de un administrador: el panel de
estadísticas (`js/admin.js`, `_filaTop`) pintaba en crudo los nombres de
los tops de nivel y de XP, y el id tal cual de la base de un logro, una
insignia o un juego cuando no tenía definición.

Arreglado por las dos puntas. Al pintar, esos sitios pasan por
`MRTexto.escapar`, y por prevención también el nombre propio en la barra
(`js/navbar.js`) y en el aviso de menciones (`js/perfil-actividad.js`).
Al registrarse, `api/_nombre-usuario.js`: nada de `` < > " ' ` & / \ ``,
nada invisible (controles, marcas de dirección, espacios de ancho cero),
sin espacios en los bordes y entre 3 y 25 caracteres. Se revisaron uno a
uno los 186 nombres de producción: ninguno llevaba nada peligroso, y
todos cumplen la regla nueva, incluidos los que usan letras decorativas,
runas, ♡ o espacios por dentro. El resto de interpolaciones de `js/` en
marcado se revisó con un barrido y estaba escapado o eran datos fijos.
Lo sujeta `tests/nombres-de-usuario.test.js`, que ejecuta
`js/amigos.js` entero sobre `amigos.html` con nombres maliciosos. La red
que falta debajo de todo esto sigue siendo el punto 6.

**Nota al 86.** Visto el 05/10/2026 al revisar CUENTAS, que decía que los respaldos de antes del
16/09/2026, los que llevan contraseñas en claro, se borran solos en el servidor a los 14 días. Los
diarios sí; estos dos no, porque están fuera de `diarios/`. Borrarlos, o guardarlos solo donde haga
falta, lo decide Luis. Lo cuentan [CUENTAS](../referencia/CUENTAS.md#lo-que-queda) y
[VPS](../referencia/VPS.md#respaldos).

---

## Bloque 2 — Funciones que existen y no funcionan

Esto es lo que hace que el sitio parezca a medias, más que cualquier
cambio visual: son cosas que los usuarios creen que ya tienen.

| # | Estado | Categoría | Qué pasa | Dónde | Esfuerzo |
|---|---|---|---|---|---|
| 15 | 2026-09-25 | Función rota | Las rachas diarias nunca han subido. Las 17 personas con racha tienen racha 1. Son dos mitades: arreglar solo la primera no basta. Arreglado, y la racha pasa a contarse sola al jugar (nota al pie) | `api/_racha.js`, `api/progreso.js` | 30 min |
| 16 | 2026-09-28 | Moderación | Las advertencias no llegan a nadie. 4 registradas, 0 entregadas. El panel afirma que sí se enviaron. Arreglado con las sanciones (nota al pie) | `js/admin.js:102` | 1 h |
| 17 | 2026-09-28 | Moderación | Suspender no hace nada: el servidor nunca consulta `suspendido`, ni siquiera al iniciar sesión. Arreglado con las sanciones (nota al pie) | `api/_auth.js:70` | 2 h |
| 18 | 2026-09-25 | Economía | El XP y los minutos se conceden por número de peticiones, no por tiempo verificado. Los tres primeros del ranking tienen minutos imposibles. Arreglado: un minuto por minuto y por persona, lo cuente quien lo cuente (nota al pie) | `api/users.js`, `sumarXp` | 1 día |
| 19 | - | Economía | Macro Snake paga XP por muerte. Una cuenta generó 265.605 de las 271.626 partidas | `html/juegos/macro-snake.js:17` | 2 h |
| 20 | - | Función rota | `explorar.html` está vacía para todos: lee `window.juegos` y `datos-juegos.js` declara un `const`, que no cuelga de `window` | `js/explorar.js:14` | 10 min |
| 21 | - | Contenido | 15 de 113 juegos no cargan. El usuario ve una pantalla negra sin mensaje | `js/datos-juegos.js` | 2 h |
| 22 | 2026-09-28 | Contenido | Un juego roto por una errata de un carácter: `fairytail` frente a `fairytale`. Arreglado: el catálogo apunta al archivo que existe, y el juego arranca | `js/datos-juegos.js:887` | 1 min |
| 23 | 2026-09-24 | Función rota | La tienda muestra 12 cajas vacías con precio. 130 de 152 artículos no tienen dibujo en el índice público. Arreglado con las previsualizaciones: 162 de 162 artículos con imagen (docs/referencia/AVATARES.md#las-previsualizaciones-automáticas-y-corregibles-una-a-una-más-adelante) | `js/comunidad-ranking.js:617` | 2 h |
| 24 | 2026-09-24 | Función rota | Se puede comprar una prenda retirada y no poder ponérsela nunca. Arreglado con la tienda nueva: el catálogo y la compra solo aceptan prendas publicadas (nota al pie) | `api/content.js`, `avatarShop` y `avatarShopBuy` | 1 h |
| 25 | 2026-09-25 | Economía | 3 de 7 misiones diarias piden `minutes_today`, métrica que el servidor nunca calcula. 14 días de cada 31 son incompletables. Arreglado con `actividad_diaria` (migración 023; nota al pie) | `api/progreso.js`, `obtenerMetricas` | 3 h |
| 26 | - | Economía | El reto global anuncia 500 XP y 250 monedas que ningún código reparte. El 25/09/2026 se decidió dejarlo para después (nota al pie) | `api/progreso.js:60` | 2 h |
| 27 | - | Función rota | No hay botón para rechazar ni cancelar una solicitud de amistad. El backend existe desde la fase 1 | `js/amigos.js:237` | 2 h |
| 28 | - | Función rota | El panel "Tus amigos jugaron esto" nunca aparece: lee un global que solo define la copia duplicada de la raíz | `portal-growth.js:106` | 15 min |
| 29 | - | Función rota | El chat anunciado "en tiempo real" no se actualiza solo: nadie emite evento de mensaje nuevo | `js/chat.js:411` | 3 h |
| 30 | - | Función rota | 12 usuarios no son mencionables porque la regex no cubre sus nombres. El botón Responder inserta la arroba igual | `api/_notifications.js:47` | 1 h |
| 31 | 2026-10-05 | Datos | Dos personas no pudieron entrar y se registraron de nuevo: `jader`/`Jader` y `yotter`/`Yotter`. El registro compara exacto y `getUserId` con `LOWER()`. Arreglado: el perfil, entrar y el registro ya no distinguen mayúsculas, y las dos parejas siguen separadas (nota al pie) | `api/_utils.js:15` | 2 h |
| 32 | - | Función rota | El guardado del avatar se traga todos los errores del servidor: el editor se cierra igual y no dice nada | `js/perfil.js:1065` | 30 min |
| 33 | - | Función rota | El "top 20" de Macro Snake muestra dos o tres personas: deduplica por usuario después del `LIMIT` | `api/originales-ranking.js:29` | 30 min |
| 34 | - | Economía | La puntuación la fija el cliente hasta 1.000.000.000, sin validar que sea múltiplo de 10 ni el tiempo transcurrido | `api/originales-ranking.js:70` | 1 h |
| 35 | - | Economía | Nivel 1 más 400 XP da nivel 2 por una puerta y nivel 3 por otra. `xp = 0` descarta el excedente | `api/users.js:526` | 1 h |
| 36 | - | Economía | Más de dos tercios del ranking se baraja al azar cada lunes: el `SELECT` no lleva `ORDER BY` y el desempate no rompe los ceros | `api/system.js:262` | 30 min |
| 76 | 2026-09-21 | Función rota | Las menciones en comentarios de perfil llegan por duplicado: el navegador (`js/menciones.js`, desde el 11/08) y el servidor (`notificarMencionesServidor`, desde el 19/08) crean la misma notificación, y la del servidor termina en dos puntos porque el contexto ya trae uno. En chat y reseñas solo existe el camino del navegador, que es falsificable | `js/perfil.js:1892`, `api/content.js:995` | 30 min |
| 78 | 2026-09-24 | Economía | Dos clics a la vez en "Comprar" cobraban la prenda dos veces: mirar si ya la tenía, cobrar y apuntar eran tres pasos sueltos, sin transacción. Y se le cobraba a quien dijera el nombre, buscado sin mayúsculas: con `jader` y `Jader` (punto 31) podía pagar la otra cuenta | `api/content.js`, `avatarShopBuy` | 1 h |
| 80 | 2026-09-25 | Función rota | Para las misiones de juegos, "hoy" iba de 21:00 a 21:00 UTC en vez de medianoche a medianoche de Argentina: `fecha AT TIME ZONE` convierte la fecha con la zona de la sesión. Lo jugado desde las 18:00 de Argentina, la hora punta, no contaba para la misión de hoy | `api/progreso.js`, `obtenerMetricas` | 15 min |
| 81 | 2026-09-25 | Función rota | "Mi día" enseñaba la misión cumplida sin forma de cobrarla: el botón solo estaba en "Progreso", y parecía que no se había validado | `js/mi-dia.js` | 30 min |
| 82 | 2026-09-25 | Economía | El XP de cada pulso lo decidía el navegador: `cantidad` no tenía tope, y bastaba con pedir 1.000.000 | `api/users.js`, `sumarXp` | 15 min |
| 83 | 2026-09-25 | Función rota | A los 7 días de iniciar sesión, todo lo que escribe fallaba en silencio (el XP de jugar, el chat, los comentarios) mientras la página seguía enseñando a la persona como conectada. El pase no se renovaba nunca y el navegador no se enteraba del 401. De 150 a 330 escrituras rechazadas al día | `api/_auth.js`, `js/core.js` | medio día |
| 84 | 2026-09-28 | Función rota | De cada tres misiones cumplidas se cobraba una: para cobrar hay que entrar en "Mi día" o "Progreso", casi nadie entra, nada avisaba de que estaba cumplida, y la diaria se pierde a medianoche. Arreglado con un aviso al cumplirla (nota al pie) | `api/_misiones.js` | medio día |
| 85 | 2026-09-28 | Función rota | Una misión cumplida se perdía si no se cobraba a tiempo: la diaria a las 00:00, la semanal al acabar la semana. La semana del 21/09 quedaron sin cobrar 12 diarias y 8 semanales, de 13 personas. Arreglado: espera hasta que se cobre (nota al pie) | `api/_misiones.js`, `api/progreso.js` | medio día |
| 87 | - | Función rota | El "Abrir Bazar" con el saldo que pinta `portal-growth.js` no sale nunca: ninguna página tiene su hueco, `#mrEconomiaPerfil` | `portal-growth.js:126` | 15 min |

**Nota al 24 y al 78.** Hechos el 24/09/2026 con la tienda nueva
(`tienda.html`, ver [TIENDA](../referencia/TIENDA.md)). El catálogo (`avatarShop`) y la
compra (`avatarShopBuy`) solo aceptan prendas cuya fila de
`avatar_prendas` está publicada: las 5 retiradas que seguían a la venta
ya no salen ni se pueden comprar, y quien las compró (4 compras) las
conserva. La compra va en una transacción (`sql.transaccion`, en
`api/_pg.js`): primero se apunta, y la clave única `(user_id, item_id)`
deja entrar un solo clic; después cobra `api/_monedas.js`, y si no
alcanza se deshace todo. Quién compra lo dice la sesión, no el nombre.
Lo sujetan `tests/tienda-api.test.js` y `tests/transaccion.test.js`.

**Nota al 15, 25, 80 y 81.** Hechos el 25/09/2026 a raíz de un reporte
de la comunidad: "la racha no rachea y las misiones diarias, aunque las
cumplas, no se validan". Eran cuatro fallos distintos:

- **La racha (15).** El servidor pasaba a texto la fecha del último
  registro, que la base devuelve como `Date`: salía "Thu Sep 24", nunca
  igual a "2026-09-24", así que ni era "ayer" ni se detectaba el segundo
  registro del día, y cada registro la devolvía a 1. En dos semanas hubo
  82 registros y las 20 rachas seguían en 1. Se decidió además que se
  cuente sola: un día más por cada día (de Argentina) en que se juega al
  menos un minuto, con el mismo pulso de cada minuto de juego
  (`api/_racha.js`), y las fechas se comparan en la base. Se quitaron el
  botón "Registrar mi día" y su ruta.
- **Las misiones de minutos (25).** Salen de `actividad_diaria`, los
  minutos de cada persona y día (migración 023), que suma ese mismo
  pulso. Empieza vacía: antes no se guardaban por día.
- **La ventana de "hoy" (80).** `'2026-09-25'::date AT TIME ZONE
  'America/Argentina/Buenos_Aires'` convierte primero la fecha a
  `timestamptz` con la zona de la sesión (UTC) y la devuelve como hora de
  Argentina: 21:00 del día anterior. Con `::timestamp` delante, la
  ventana va de 03:00 a 03:00 UTC, que es la medianoche de Argentina.
- **Cobrar desde "Mi día" (81).** Tiene su botón, en la diaria y en la
  semanal. Y cobrar apunta y paga en una transacción.

Lo sujetan `tests/progreso.test.js` (que además vigila que toda misión
mida algo que el servidor calcule), `tests/mi-dia.test.js` y
`tests/progreso-pagina.test.js`.

**Nota al 26.** El 25/09/2026 se decidió dejar el reto global para
después. Los minutos están inflados (punto 18: se cuentan por
peticiones, no por tiempo de verdad), así que la meta se cumple todas las
semanas con creces (una sumó 435.795 minutos entre 53 personas): pagarlo
ahora sería regalar 250 monedas semanales a cualquiera. Se retoma junto
con el 18.

**Nota al 18 y al 82.** Hechos el 25/09/2026, a raíz de un reporte:
"cuando alguien abre varias pestañas se multiplica el contador; 2
ventanas, x2; 3, x3". Cada pestaña del juego manda su pulso por minuto
(`js/motor/xp.js`), y el servidor sumaba 10 de XP y un minuto por cada
pulso que le llegara. No eran solo pestañas: en los registros de nginx
de cuatro días había conexiones con 214, 333 y hasta 536 pulsos en un
minuto, y esa semana una cuenta llevaba 89.104 minutos en dos días
activos, que tienen 2.880. Las monedas por tiempo no se multiplicaban:
ya tenían su freno de 10 minutos en el servidor.

- **Un minuto por minuto.** Un pulso de juego solo cuenta si han pasado
  55 segundos desde el último minuto contado de esa persona
  (`users.ultimo_minuto_jugado`, migración 024), en una sola instrucción:
  de dos a la vez pasa uno, sean de la pestaña, el navegador, el
  dispositivo o el script que sea. Lo que no cuenta no suma XP, ni
  minutos, ni misiones, ni racha.
- **El servidor decide el XP (82):** 10 por minuto, y un tope de 40 para
  el resto de recompensas (hoy solo Macro Snake, que da eso como mucho).
- **Con la pestaña oculta no se cuenta**, decidido ese día: el navegador
  no manda el pulso mientras la pestaña está minimizada o en segundo
  plano.

Lo que queda abierto, a sabiendas: un script puede seguir mandando un
pulso por minuto las 24 horas (1.440 minutos al día como mucho, no
536 por minuto), porque el servidor no puede saber si alguien juega de
verdad. Los minutos ya inflados de esa semana se dejaron como estaban,
también decidido ese día: el ranking del lunes 28/09 los recoge, y la
semana siguiente empieza limpia. El reto global (26) se puede retomar a
partir de ahí.

**Nota al 83.** Hecho el 25/09/2026, a raíz de un reporte: "podía jugar
pero no me subía el XP, y no podía escribir en perfiles ni en el chat, ni
borrar mis mensajes; cerré sesión, volví a entrar y se arregló". El
navegador guarda por separado quién eres (`usuarioActivo`, lo que se ve)
y el pase que acepta el servidor (`macroSessionToken`), y nada comprobaba
que siguieran de acuerdo. Leer no pide sesión, así que se podía jugar y
leer, pero todo lo que escribe se rechazaba. Formas de llegar ahí, todas
cubiertas:

- **El pase caducó.** Duraba 7 días desde el login y nunca se renovaba.
  Ahora `requerirAuth` (`api/_auth.js`) renueva el que se firmó hace más
  de un día (cabecera `X-Sesion-Nueva`, que guarda `js/core.js`): solo
  caduca tras 7 días sin entrar. Con un tope de 30 días desde el login
  (`inicio`), para que un pase robado no viva para siempre mientras
  cerrar sesión no lo invalide (punto 12).
- **Usuario guardado sin pase**, o **usuario de una cuenta y pase de
  otra** en el propio navegador.
- **Otra pestaña entró con otra cuenta o cerró sesión.** El servidor
  contesta 403 "Sesión no corresponde...". Desde el 15/09 se habían
  rechazado así 47 registros de actividad y 2 notificaciones.
- **Una página con su propia copia del pase** (Progreso), que seguía con
  el viejo.
- **Un cambio de la clave de firma**, como el del 2/09: todas las
  sesiones caducan a la vez.

`MRSesionServidor` (`js/core.js`) lo mira al abrir cada página y en cada
respuesta de la API, y lo dice con una franja arriba: si la sesión ya no
vale, la cierra en el navegador y ofrece volver a entrar y volver a la
misma página (`login.html?volver=`); si la cambió otra pestaña, pide
recargar. Lo decide el servidor, no el reloj de quien mira: la barra
pide el saldo con sesión en cada página (`mis-monedas`). No se puede
recuperar lo que se perdió esos días: los registros no dicen de qué
cuenta era cada petición rechazada. Lo sujetan
`tests/sesion-renovar.test.js`, `tests/sesion-navegador.test.js` y
`tests/login-volver.test.js`.

**Nota al 84.** Visto el 28/09/2026 al revisar, a petición del
administrador, si las misiones se estaban cumpliendo tras los arreglos
del 25. Contaban y cobraban bien: los 3 intentos de cobro salieron bien,
nadie cobró sin cumplir, y la de "Jugá 20 minutos", antes imposible, la
cumplieron 6 personas el primer día que tocó. Pero de 9 diarias
cumplidas se cobraron 3, y de 13 semanales, 5. Para cobrar hay que entrar
en "Mi día" o "Progreso" (el 27 no las abrió nadie con sesión), nada
avisaba de que la misión estaba cumplida, y la diaria se pierde a las
00:00 de Argentina.

Se decidió avisar, manteniendo el botón de cobrar: en el momento en que
alguien cumple la misión de hoy o la de la semana le llega una
notificación ("¡Misión cumplida! Cobrá +55 XP y 🪙 40 en Mi día antes de
las 00:00"), a la campana y, por la línea de avisos, como aviso
emergente aunque esté jugando (`js/realtime.js`). Lo miran el minuto de
juego (`api/users.js`) y el botón "Jugar" (`api/content.js`), con
`avisarSiSeCumplen` (`api/_misiones.js`): una sola vez por misión y
período (`player_mission_avisos`, migración 025), y nunca de lo ya
cobrado. Lo sujeta `tests/misiones-avisos.test.js`. El margen para
cobrar se decidió ese mismo día: ver la nota al 85.

**Nota al 16 y al 17.** Hechos el 28/09/2026, con las sanciones
([MODERACION](../referencia/MODERACION.md), migración 026, `api/_sanciones.js`), decididas
ese día con el administrador. La advertencia fallaba porque el panel
mandaba la notificación sin `origenNombre`, el servidor la rechazaba con
un 403 y el panel, que no miraba la respuesta, decía "enviada". Suspender
ponía `users.suspendido`, que ningún código del servidor leía: la única
cuenta suspendida, del 15/09, entró el 20/09 como si nada.

Ahora advertir, suspender (1, 3, 7 o 30 días), banear y levantar son
acciones del servidor, que comprueba quién puede, apunta el historial y
avisa a la cuenta; la suspendida no escribe y la baneada no entra, y su
sesión deja de valer en el acto. Esa cuenta del 15/09 quedó baneada. Lo
sujetan `tests/sanciones.test.js` y `tests/moderacion-navegador.test.js`.

**Nota al 85.** Decidido el 28/09/2026, a petición del administrador,
tras el aviso del 84: "da margen para cobrar la diaria en el momento que
se desee, puede durar una cantidad infinita de días que haga falta y el
día en que se reclame se muestra la siguiente". Lo mismo para la semanal.

- **La cumplida espera.** Se queda en Mi día y en Progreso, con su fecha
  ("Del 26/09 · sin cobrar"), los días que haga falta. Qué se cumplió lo
  dice la fila que apunta el aviso (`player_mission_avisos`, migración
  025): no hizo falta migración. `pendienteSinCobrar`
  (`api/_misiones.js`) busca la de un período anterior sin cobrar.
- **Una a la vez.** Mientras una espera no aparece otra del mismo tipo:
  la de hoy ni se apunta ni se avisa. Al cobrarla aparece la de ese día
  (o esa semana), y lo jugado mientras tanto cuenta: si ya está
  cumplida, el cobro la apunta y la avisa en ese momento, para que
  tampoco se pierda.
- **El aviso** dice "Te espera hasta que la cobres" en vez de "antes de
  las 00:00".
- **Lo de la semana del 21/09**, también decidido ese día: a cada uno se
  le guardó su diaria cumplida y sin cobrar más reciente de esa semana y
  la semanal, con un aviso (`scripts/rescatar-misiones.js`, una sola
  vez). Las diarias de juegos se contaron de menos: `game_history` solo
  guarda la última vez que se jugó cada juego. Las de minutos del 22 y
  el 24 no se podían saber: `actividad_diaria` empezó el 25.

Lo sujetan `tests/progreso.test.js`, `tests/misiones-avisos.test.js`,
`tests/mi-dia.test.js`, `tests/progreso-pagina.test.js` y
`tests/rescatar-misiones.test.js`.

**Nota al 31.** Hecho el 05/10/2026, a raíz de un caso: el perfil pedido
como "Mateo503" decía "Usuario no encontrado" para la cuenta MATEO503, y
parecía que esa cuenta había bloqueado a quien la buscaba. La regla vive
en `cuentaPorNombre()` (`api/_utils.js`): primero el nombre exacto; si no
hay, la única cuenta que coincida sin mirar mayúsculas; si coinciden
varias, ninguna, porque no se puede saber de quién es.

- **El perfil** (`/api/users?username=`) se abre con otras mayúsculas y
  dice el nombre guardado. La página (`js/usuario.js`) ya usaba ese
  nombre para los botones, así que agregar, bloquear o comentar
  funcionan aunque el enlace venga escrito de otra forma.
- **Entrar** también, y la sesión lleva el nombre guardado. Vale igual
  para cambiar la contraseña y borrar la cuenta.
- **El registro** compara sin mayúsculas: "Jader" no se crea si ya existe
  "jader", y el aviso dice que entre con su cuenta.
- **`getUserId()`** usa la misma regla: antes devolvía la primera cuenta
  que saliera de cada pareja.

Lo que queda abierto, a sabiendas: las dos parejas siguen siendo cuatro
cuentas, y juntarlas es cosa de cada persona. `api/social.js` y
`api/_sanciones.js` tienen su propia búsqueda exacta (la de sanciones
también se llama `cuentaPorNombre`): reciben el nombre de listas y
perfiles, que ya es el guardado. Y `js/usuario.js` manda a tu propio
perfil si el nombre del enlace coincide con el tuyo sin mirar
mayúsculas, así que "jader" no puede ver el perfil de "Jader". Lo sujeta
`tests/nombres-mayusculas.test.js`.

**Nota al 28, del 05/10/2026.** `portal-growth.js` sigue en la raíz, y lo cargan
`comunidad-ranking.html`, `juego.html` y `perfil.html`. Al lado hay otros tres scripts, `script.js`,
`home-portal.js` y `juego.js`, que no carga ninguna página: son copias viejas de los de `js/`.

**Nota al 87.** Visto el 05/10/2026 al revisar TIENDA, que lo daba como uno de los caminos al
Bazar. Es el mismo archivo que el punto 28.

---

## Bloque 3 — Que el sitio se sienta terminado

El 37 es el que más deuda desactiva por hora invertida: casi todo lo que
hace que MacroReborn parezca inacabado es ausencia de chasis, no
fealdad. En cuanto las 28 páginas compartan las mismas hojas en el mismo
orden, la mayoría de los `!important` del punto 44 dejan de tener razón
de ser, y los puntos 38, 40, 41 y 42 caen dentro de esa misma tarea.

| # | Estado | Categoría | Qué pasa | Dónde | Esfuerzo |
|---|---|---|---|---|---|
| 37 | - | Visual | No hay chasis de página: el buscador está en 10 de 28 páginas y el pie en 14 de 28 | las 28 `.html` | 1 semana |
| 38 | - | Visual | 12 páginas no cargan `js/tema.js`: se elige el tema claro, se navega, y vuelve a oscuro sin avisar | 12 `.html` | 1 h |
| 39 | - | Visual | El modo claro es otra marca: una segunda paleta azul corriendo a la vez que la clara real de `inicio.css` | `css/theme-canonical.css` | 3 h |
| 40 | - | Visual | El botón de menú móvil es invisible en modo claro: `.nav-toggle-label` no tiene ninguna regla CSS en todo el proyecto | `js/nav-toggle.js:30` | 30 min |
| 41 | - | Visual | En móvil, el modo claro es una trampa sin salida: el conmutador de tema cuelga de un contenedor oculto | `js/tema.js` | 1 h |
| 42 | - | Accesibilidad | `finalizacion.css` (foco visible, movimiento reducido, 16 px en controles móviles) solo está en 14 de 28 páginas | 14 `.html` | 30 min |
| 43 | - | Visual | 5 páginas llevan dos barras de navegación apiladas. En móvil eso es el 45 % de la pantalla antes del contenido | 5 `.html` | 3 h |
| 44 | - | Visual | 382 colores distintos, 102 tamaños de fuente, 116 sombras, 1.102 `!important` y 9 vocabularios de variables para los mismos seis conceptos | `css/` | 2-3 semanas |
| 45 | - | Contenido | La portada muestra 30 tarjetas con 15 juegos únicos: las cinco estanterías no deduplican entre sí | `js/home-portal.js:145` | 1 h |
| 46 | - | Contenido | 26 de las 30 chapas dicen "Nuevo", porque 112 de 113 juegos tienen `estado: "Nuevo"` y los 113 tienen `tipo: "destacado"` | `js/datos-juegos.js` | 1 h |
| 47 | - | Visual | 34 `alert()`, 21 `confirm()` y 8 `prompt()` nativos, con `MRModal` ya escrito y sin usar en ninguna parte | `js/` | 1 día |
| 48 | - | Seguridad | La contraseña para borrar la cuenta se pide con `prompt()`, en claro y sin enmascarar | `js/perfil-eliminar-cuenta.js:76` | 30 min |
| 49 | - | UX | No hay página 404: texto plano sobre fondo negro, sin título ni enlace de vuelta | `server.js` | 1 h |
| 50 | - | UX | `/juego.html?id=99999` devuelve 200 y se queda en "Cargando..." para siempre, con la página indexable | `js/juego.js:298` | 30 min |
| 51 | - | UX | Un usuario inexistente lanza un `alert()` bloqueante y luego inventa un perfil que dice "Has sido bloqueado por este usuario" | `js/usuario.js:129` | 1 h |
| 52 | - | Contenido | Tuteo y voseo mezclados en la misma pantalla, "1 juegos", textos de 9 px y placeholders cortados a media palabra | varias | 2 h |
| 53 | - | Rendimiento | El editor de avatares reconstruye el DOM entero en cada `pointermove`, sin `requestAnimationFrame` | `js/arte-vestidor.js:1548` | 3 h |

**Nota al 37, del 05/10/2026.** Hoy son 30 páginas y 16 tienen pie, y dos de esos pies, los de
`explorar.html` y `mi-dia.html`, no llevan el enlace a los términos.

---

## Bloque 4 — Contenido, SEO, privacidad y moderación

| # | Estado | Categoría | Qué pasa | Dónde | Esfuerzo |
|---|---|---|---|---|---|
| 54 | - | SEO | Las 112 fichas de juego comparten título, descripción y `canonical`. Ese `canonical` sin `?id=` las declara duplicados de una sola página | `juego.html` | 3 h |
| 55 | - | SEO | `www` y el dominio raíz responden 200 los dos, sin redirección, mientras todo el SEO apunta a `www` | nginx | 15 min |
| 56 | - | SEO | 9 páginas públicas sin `canonical`, `robots` ni Open Graph. Macro Snake no está en el sitemap | 9 `.html` | 2 h |
| 57 | 2026-10-04 | Privacidad | `motivo_suspension`, `last_login` y `monedas` de los 144 usuarios, públicos y sin sesión. Arreglado: el motivo (con las sanciones) y el saldo solo los ven la propia cuenta y la moderación. La última conexión se deja pública a propósito (nota al 3) | `api/users.js:178` | 1 h |
| 58 | - | Privacidad | La lista de a quién bloqueó cada persona es pública | `api/social.js:533` | 30 min |
| 59 | - | Privacidad | El chat, los muros y la actividad completos son legibles sin cuenta, y el filtro de bloqueo se apaga omitiendo un parámetro | `api/content.js` | 3 h |
| 60 | - | Decisión | No hay política de privacidad, ni edad mínima declarada, ni enlace a los términos desde el registro | `terminos.html` | decisión |
| 61 | - | Decisión | No hay recuperación de cuenta. Sin correo, quien olvida la contraseña la pierde, y no hay forma de distinguir al titular de un impostor | — | decisión |
| 62 | - | Privacidad | Analítica de terceros (6 identificadores de GA y GTM ajenos) escribiendo cookies en el dominio propio desde los envoltorios de juego | `html/juegos/` | 1 h |
| 63 | - | Moderación | Bloquear no impide solicitudes de amistad, ni ver el perfil, ni aparecer en el feed global | `api/social.js:121` | 3 h |
| 64 | - | Moderación | Los colaboradores pueden leer y escribir el registro de moderación, aunque `js/motor/permisos.js:81` diga que ese rol no otorga permisos | `api/content.js:2239` | 30 min |
| 65 | - | Moderación | El registro de moderación lo escribe el navegador después de la acción y se puede falsear. El filtro por rol nunca encuentra nada por una diferencia de mayúsculas | `api/content.js:2277` | 3 h |
| 66 | - | Moderación | No se puede silenciar temporalmente, ni borrar contenido sin pasar por un reporte, ni deshacer una acción, ni ver la ficha de una persona | `admin.html` | 1 semana |
| 79 | 2026-09-24 | Privacidad | `avatar-shop?username=X` enseñaba a cualquiera, sin sesión, el saldo y las compras de cualquiera | `api/content.js`, `avatarShop` | 30 min |
| 88 | - | Privacidad | `scripts/traer-base.js` lleva la IP entera del servidor como valor por defecto (regla XXV), cuando todo lo demás entra por el dominio | `scripts/traer-base.js:47` | 5 min |

**Nota al 79.** Visto el 24/09/2026 al auditar la tienda, y arreglado el
mismo día: el saldo y las compras solo se devuelven a quien tiene la
sesión. El saldo de cualquiera siguió saliendo por `/api/users?username=X`
hasta el 04/10/2026 (punto 57).

**Nota al 56, del 05/10/2026.** Sigue abierto. Siete páginas se indexan sin `robots` y sin estar en
el sitemap (`actividad-comunidad.html`, `explorar.html`, `liga-global.html`, `macro-originals.html`,
`mi-dia.html`, `originales-competicion.html` y `progreso.html`); tres de las que están en él no tienen
Open Graph (`categoria.html`, `coleccion.html` y `terminos.html`), y Macro Snake sigue fuera. El
detalle, en [SEO](../referencia/SEO.md#tabla-de-indexación-por-página).

**Nota al 88.** Visto el 05/10/2026 al revisar DESARROLLO. Se puede apuntar a otra máquina con
`MR_VPS_HOST`, y el dominio ya funciona: es por donde se entra hoy al servidor.

---

## Bloque 5 — Datos, rendimiento y mantenibilidad

| # | Estado | Categoría | Qué pasa | Dónde | Esfuerzo |
|---|---|---|---|---|---|
| 67 | - | Datos | `migrations/` no puede reconstruir el sitio: ninguna migración crea la tabla `users`, y aplicarlas en limpio falla en el primer archivo | `migrations/` | 2 h |
| 68 | - | Datos | 271.700 de las 277.000 filas de `activity_log` no las lee nadie, y `originales_scores` guarda cada partida en vez de la mejor | `activity_log`, `originales_scores` | 3 h |
| 69 | - | Rendimiento | `comunidad-ranking.html` pide 201 recursos y 2,4 MB en la carga inicial, con `/api/users?limit=500` pedido dos veces | `js/comunidad-ranking.js` | 3 h |
| 70 | - | Rendimiento | Un solo avatar PNG ocupa 1.313 kB de los 1.349 kB de la columna. Tres endpoints públicos lo siguen mandando entero | `api/system.js`, `api/originales-ranking.js` | 1 h |
| 71 | - | Infraestructura | Nada vigila nada: sin monitorización, sin registro de errores de la aplicación, 16 líneas de log en 24 horas | VPS | 1 día |
| 72 | - | Infraestructura | El despliegue no tiene comprobación de salud ni vuelta atrás, y las 595 pruebas no han visto ninguno de los 75 commits que están en producción | `infra/scripts/` | 1 día |
| 73 | - | Mantenibilidad | 19 copias de la función de escapar HTML en 3 variantes distintas, y `xpNecesaria` copiada en 7 archivos | `js/` | 1 día |
| 74 | - | Mantenibilidad | Cero pruebas de autorización, del ranking, de moderación y de todo el sistema social | `tests/` | 2-3 días |
| 89 | - | Decisión | fail2ban sigue apagado desde el 17/09/2026, aunque su causa principal, el punto 18, se arregló el 25/09. Antes de encenderlo hay que poner al día la IP de `ignoreip` | VPS | decisión |
| 90 | - | Mantenibilidad | Comentarios caducados en seis archivos: `api/_rafaga.js`, `avatarPrenda` en `api/content.js` y `scripts/hornear-catalogo.js` cuentan una caché de `/prendas/` y un índice público que ya no existen; `scripts/servidor-local.js` habla de Vercel y Neon; `scripts/revision-avatares.js`, de un navegador que apila capas; y `js/perfil.js`, del antiguo `tienda.js` | esos seis archivos | 30 min |

**Nota al 68, del 05/10/2026.** Por estas dos tablas la base ya no cabe en `shared_buffers`: ocupa
179 MB, contra 128, y 140 de esos MB son ellas. El 99,99 % de las lecturas siguen saliendo de
memoria: [la base y la memoria](../referencia/VPS.md#la-base-y-la-memoria).

**Nota al 89.** Visto el 05/10/2026 al revisar VPS. Lo que hay que saber antes de encenderlo:
[fail2ban, apagado](../referencia/VPS.md#fail2ban-apagado).

**Nota al 90.** Visto el 05/10/2026 al revisar la documentación. La spec 001 solo cambia en el código
las rutas de documentos, así que estos comentarios se quedaron como estaban. El del freno de
`api/_avatar-compuesto.js` sí se corrigió entonces.

---

## Pendientes que viven en otros documentos

Lo que falta de cada área se cuenta al final de su documento de referencia, con su porqué. No son
puntos de esta lista, salvo los que se citan por su número:

- [ARTE](../referencia/ARTE.md#7-lo-que-queda): leer el buzón de retiradas, el CSS del lienzo que
  aún usa 327/505, las imágenes viejas que los navegadores guardan hasta el 16/10/2026 y el historial
  de GitHub (punto 75, descartado).
- [AVATARES](../referencia/AVATARES.md#lo-que-queda): un solo orden de capas, vender ranuras y
  corregir una previsualización sola.
- [CUENTAS](../referencia/CUENTAS.md#lo-que-queda): borrar `users.password` y la rama del texto
  plano, y los respaldos de antes del 16/09/2026, con contraseñas en claro (punto 86).
- [MODERACION](../referencia/MODERACION.md#7-lo-que-queda): las partes 3 y 4, las IP y la marca del
  navegador.
- [SEO](../referencia/SEO.md#8-lo-que-queda): las URL limpias, además de los puntos 54, 55 y 56.
- [TIENDA](../referencia/TIENDA.md#6-lo-que-queda): el probador, y quien lleva una prenda de la
  tienda sin haberla comprado.
- [VPS](../referencia/VPS.md#9-lo-que-falta): rotar la contraseña de Neon, darlo de baja y decidir si
  se enciende fail2ban (punto 89).

---

## Lo que está bien, y conviene no romper

La auditoría también dejó claro qué piezas están resueltas. Antes de
tocar algo de aquí, conviene saber que ya se pensó:

- **No hay inyección SQL.** Se revisó toda la interpolación: `api/_pg.js`
  parametriza cada valor, los fragmentos anidados son literales del
  propio código y no hay ningún `ORDER BY` construido con entrada del
  usuario.
- **Las contraseñas están terminadas.** 144 de 144 con bcrypt, cero en
  texto plano. El backfill de [CONTRASENAS-EN-CLARO](../historia/CONTRASENAS-EN-CLARO.md) acabó.
- **`api/_monedas.js` es el modelo a copiar.** Resuelve el otorgamiento en
  una sola sentencia condicionada contra el `now()` de Postgres, no
  contando peticiones. Es la única pieza del sitio que hoy no se puede
  falsear, y es exactamente el patrón que necesitan los puntos 18 y 34.
- **`infra/` está sincronizado con el servidor.** Se compararon los siete
  archivos: seis idénticos, y la única diferencia es el marcador
  `TU.IP.AQUI`, que está bien puesto a propósito para no publicar la IP
  del administrador.
- **El servidor está sano.** Sin errores 5xx, sin eventos OOM en 30 días,
  certificado renovándose solo, `ufw` cerrado, Postgres solo en
  `127.0.0.1`, y respaldos diarios cuya integridad se verificó.
- **La lista blanca de estáticos aguanta.** Se probaron diez rutas
  sensibles (`/.env`, `/.git/config`, `/server.js`, `/api/_db.js` y seis
  más) y las diez dan 404. El único hueco es el del punto 11, que es de
  normalización de ruta, no de la lista.
