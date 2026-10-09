---

description: "Tareas para que los juegos no puedan leer la sesión"
---

# Tareas: que los juegos no puedan leer la sesión

**Entrada**: los documentos de diseño de `specs/008-aislar-juegos/`

**Requisitos previos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/) y [quickstart.md](quickstart.md)

**Pruebas**: las pide la spec (RF-008 y RF-010) y la constitución (regla XXII: todo cambio del servidor
lleva su prueba). Cada tarea de código trae su prueba, en el mismo commit, y la prueba tiene que fallar
sin el cambio. Las comprobaciones largas (los 107 juegos, el navegador, la web real) van juntas en las
fases 7 y 10 (regla IV), con [quickstart.md](quickstart.md).

**Organización**: por las historias de uso de la spec, en el orden que pidió Luis: primero lo que
prepara (el DNS y la revisión de los juegos), después el código (la base, el marco, el puente y la
mudanza), y la comprobación de que los juegos funcionan (historia 2) cuando ya está todo el código,
porque es la que lo mide entero. Por eso las fases no van en el orden de las prioridades.

## Formato: `[ID] [P?] [Historia de uso] Descripción`

- **[P]**: se podría hacer a la vez que otra (archivos distintos, sin esperar a nada). Aun así se hacen
  una tras otra, sin subagentes (regla VIII).
- **[US1] a [US5]**: las historias de uso de la spec: 1, jugar sin arriesgar la cuenta; 2, los juegos
  funcionan como antes; 3, el XP cuenta igual; 4, las partidas pasan solas; 5, en local y la
  documentación. Las fases de preparación, base, la página de jugar, nginx y cierre no llevan.
- **(Luis)**: la tarea la hace o la decide Luis. **(Servidor)**: toca el servidor, y espera el OK de Luis
  en ese momento (regla XXI).
- **Una tarea, un commit, un push** a `origin` (reglas V y X). Lo que se comprueba se anota en la sección
  «Comprobación» de `spec.md`, que nace con la T001; lo del despliegue, en su sección «Despliegue».

## Rutas

| Qué | Dónde |
|---|---|
| El servidor | `api/_juegos-aparte.js` (nuevo), `server.js`, `scripts/servidor-local.js`, `scripts/smoke-local.js` |
| El navegador | `js/motor/juegos-aparte.js` (nuevo), `js/motor/actividad-jugador.js`, `js/jugar.js`, `jugar.html` |
| La dirección de los juegos | `html/juegos/_puente.js`, `html/juegos/_mudanza.html` y `html/juegos/_mudanza.js` (nuevos) |
| Las pruebas | `tests/juegos-aparte-servidor.test.js`, `tests/juegos-aparte-navegador.test.js`, `tests/puente-actividad.test.js` y `tests/mudanza-partidas.test.js` (nuevas); `tests/actividad-jugador.test.js` |
| La herramienta | `scripts/revision-juegos.js` (nueva); sus informes y capturas, fuera de git |
| nginx | `infra/nginx/macroreborn.conf`, `infra/LEEME.md` |
| La documentación | `docs/referencia/` (VPS, ECONOMIA, ARQUITECTURA, CUENTAS), `docs/guias/` (DESARROLLO, JUEGOS), `docs/historia/` (HISTORIAL, CONTRASENAS-EN-CLARO), `docs/listas/AUDITORIA.md`, `CLAUDE.md`, `specs/006-volcados-en-claro/spec.md` |

## Fase 1: Preparación

- [X] T001 [P] (Luis) El DNS (research D5). Con Luis, una sola acción cada vez y con el texto exacto de
  los botones de IONOS (regla VI): en la zona DNS de `macroreborn.com`, un registro **A** con nombre de
  host `juegos` y la misma IP que el registro `@` (la del servidor), y **ningún AAAA**. Comprobar desde el
  servidor, solo leyendo: `dig +short A juegos.macroreborn.com` da la IP del servidor, y `dig +short AAAA
  juegos.macroreborn.com`, nada. Crear la sección «Comprobación» de `specs/008-aislar-juegos/spec.md` y
  anotar la fecha y el resultado, sin la IP (regla XXV). No cambia nada visible: nada usa todavía la
  dirección.
- [X] T002 [P] Crear `scripts/revision-juegos.js` (research D12, data-model «Informe de la revisión de
  juegos»), con su comentario de cabecera como el de `scripts/revision-avatares.js`.
  - **El navegador**: abre Edge sin ventana (`--headless=new`, con un perfil temporal nuevo y un puerto
    de depuración libre; `--navegador <ruta>` para usar otro). Lo maneja por su protocolo de depuración,
    con el `WebSocket` y el `fetch` de Node, sin dependencias.
  - **Qué juegos**: los del catálogo (`js/datos-juegos.js`), o solo `--ids 5,113`. De cada uno abre
    `<base>/jugar.html?id=<id>` (`--base`, por defecto `http://localhost:3001`), y espera a que cargue el
    marco y `--espera` segundos más (12 por defecto).
  - **Qué apunta**:
    - `id`, `nombre` y tipo (de terceros, propio o de otra web);
    - el motor: emulador, Flash, Unity u otro, por el contenido del envoltorio, como en research «Lo que
      hay hoy»;
    - el elemento más grande que pinta el marco (`canvas`, `embed`, `object`, `video`, `iframe`,
      `ruffle-player` o `ruffle-object`), en píxeles, y «carga» si mide 64.000 px² o más;
    - los errores de JavaScript del marco;
    - una captura del marco.
  - **Con `--sonda`**: antes de cada juego deja `localStorage["mr_sonda"] = "1"` en la web. Desde un
    mundo aislado del marco del juego, mira si lee esa clave y si llega a `parent.document`.
  - **Con `--pulsar`**: pulsa el botón de empezar del juego («Play», «Start Game», «Jugar»), con un clic
    de ratón de verdad y hasta dos veces, antes de medir (research D12). El sonido puede arrancar sin
    esperar un toque.
  - **Con `--movil`**: 390×844 con pantalla táctil; sin él, 1366×800.
  - **Lo que deja**: en `--salida`, un `informe.json` y un `index.html` con las capturas. Con `--comparar
    <otro informe.json>`, las dos capturas de cada juego lado a lado, y marcado como «roto» lo que
    cargaba y ya no.
  - **Sin parar ni callar** (regla XIII): si falla un juego, se apunta el fallo y sigue con el siguiente.
    Al terminar cierra Edge. No la corre `npm test`.
- [ ] T003 El «antes» en el PC (quickstart 2), con el código todavía como `main`: `npm run db:local`
  (antes, mirar el 3001 con `netstat -ano`; si está ocupado, `PORT=3101`), y dos revisiones, en PC y en
  móvil (RF-004): `node scripts/revision-juegos.js --sonda --pulsar --salida <scratchpad>/revision-008/antes` y lo
  mismo con `--movil --salida <scratchpad>/revision-008/antes-movil`. Anotar en la «Comprobación» de
  `specs/008-aislar-juegos/spec.md` cuántos de los 112 cargan en cada una, y lo de la sonda: hoy, en los
  107 de terceros, se lee la clave de la web y se llega a la página. Los informes y las capturas se
  quedan fuera de git.

---

## Fase 2: Base (bloquea todas las historias)

- [X] T004 Crear `api/_juegos-aparte.js` (research D3, contracts/rutas-http.md), con el comentario del
  porqué, como `api/_prendas-ruta.js`.
  - **La configuración de producción**: `hostJuegos` `juegos.macroreborn.com`, `origenJuegos`
    `https://juegos.macroreborn.com` y `origenesDeLaWeb` `https://macroreborn.com` y
    `https://www.macroreborn.com`. Y la lista de propios, `macro-snake`.
  - **`esPeticionDeJuegos(req)`**: por el nombre de la petición (`Host`, sin el puerto).
  - **`atender(req, res, url, opciones)`**, que devuelve si atendió. En la dirección de los juegos lo
    atiende todo:
    - solo `GET` y `HEAD`; con otro método, 405;
    - la ruta se resuelve con `resolverRutaEstatica` de `api/_ruta-estatica.js`; si no es válida, 400;
    - tiene que ser un archivo directamente en `html/juegos/`: un `<nombre>.html` que no sea propio ni
      empiece por `_`, o `_mudanza.html` o `_mudanza.js`. Si no, o si no existe, 404;
    - la respuesta lleva `Content-Type` con `charset=utf-8`, `Content-Security-Policy: frame-ancestors`
      con `origenesDeLaWeb`, `Cache-Control: no-cache`, `X-Robots-Tag: noindex` y `ETag` del tamaño y
      la fecha del archivo, con 304 si `If-None-Match` es igual. Nunca `X-Frame-Options`;
    - si no puede leer el archivo, lo dice con `console.error` y da 500.
  - **En la web**: un envoltorio de terceros da 302 a `origenJuegos`, con la misma ruta y la misma
    consulta. `_mudanza.html`, `_mudanza.js` y `_puente.js` dan 404. Lo demás no lo atiende.
  - **Su prueba**, en `tests/juegos-aparte-servidor.test.js`: un servidor `http` de prueba en un puerto
    libre, con `http.request` y la cabecera `Host` de cada dirección. Cubre cada fila del contrato, las
    rutas con `..` (también `%2e%2e` y `..%2f`), y que **cada** envoltorio de terceros de `html/juegos/`
    sale en la dirección de los juegos y redirige en la web (RF-010).
  - **En el mismo commit** (regla XIX), una fila en la tabla de `docs/referencia/SEO.md`: la dirección
    de los juegos, con `noindex` por la cabecera, y por qué (research D3).
- [X] T005 `server.js`: llamar a `atender` de `api/_juegos-aparte.js` justo después de crear `url` y
  antes de todo lo demás (prendas, avatares, avisos, API y estáticos), con `esPeticionDeJuegos(req)` y
  la configuración de producción. Con una prueba en `tests/juegos-aparte-servidor.test.js` que mira en
  el código de `server.js` que lo hace antes de `/api/`.
- [X] T006 `scripts/servidor-local.js` (research D10):
  - con la configuración local: `origenJuegos` `http://localhost:<PUERTO+1>`, y `origenesDeLaWeb`
    `http://localhost:<PUERTO>` y `http://127.0.0.1:<PUERTO>`;
  - un segundo servidor en `PUERTO + 1`, que lo manda todo a `atender` como dirección de los juegos;
  - en el de siempre, `atender` como web, antes de lo demás;
  - al arrancar, dice las dos direcciones.

  En el mismo commit (regla XIX): en `docs/guias/DESARROLLO.md`, la sección del servidor local; en
  `docs/guias/SUMARSE.md`, lo de abrir el sitio en local y el puerto ocupado; y en `CLAUDE.md`, la línea
  de `npm run db:local`. Los juegos van en el puerto siguiente (3002), y con `PORT`, en `PORT + 1`, que
  también tiene que estar libre.
- [X] T007 `scripts/smoke-local.js`: buscar dos puertos libres seguidos para el servidor efímero, y
  comprobar el contrato de rutas en las dos direcciones:
  - en la web, un envoltorio de terceros da 302, con `Location` en el puerto siguiente;
  - en la dirección de los juegos, el mismo da 200, con `frame-ancestors` y `X-Robots-Tag: noindex`, y
    sin `X-Frame-Options`;
  - allí, `/api/users` da 404;
  - en la web, `html/juegos/macro-snake.html` da 200.

  Con su sección de `docs/guias/DESARROLLO.md` al día.
- [X] T008 Crear `js/motor/juegos-aparte.js` (research D1, D2, D6 y D10; data-model «Juego», «Dirección
  de los juegos» y «Marco del juego»; contracts/marco-del-juego.md). Va después de la T004, porque su
  prueba compara la lista de propios con la del servidor. Deja `window.MRJuegosAparte` con:
  - `origen(location)`: «en `macroreborn.com` o `www.macroreborn.com`, los juegos están en
    `https://juegos.macroreborn.com`; en `localhost` o `127.0.0.1`, en el mismo nombre con el puerto
    siguiente»;
  - `tipo(juego)`: `terceros`, `propio` u `otra-web`;
  - `direccion(juego, location)`;
  - `marco(juego)`: el `sandbox` y el `allow` del contrato, o nada para el propio;
  - la lista de propios.

  Su prueba, en `tests/juegos-aparte-navegador.test.js`: las direcciones de cada caso, el tipo de los
  112 juegos del catálogo (107, 1 y 4), y que la lista de propios es la misma que la de
  `api/_juegos-aparte.js`.

**Punto de control**: el servidor local sirve los juegos en el puerto siguiente y redirige desde la web;
la página todavía no los abre allí.

---

## Fase 3: Historia de uso 1, jugar sin arriesgar la cuenta (P1). El MVP

**Objetivo**: los 107 juegos de terceros se abren desde la dirección de los juegos, con su `sandbox`, y
desde dentro no se lee la sesión, ni se llega a la página, ni se la puede mover.

**Prueba independiente**: en cada juego de terceros, desde dentro, intentar leer la sesión, tocar la
página y cambiar su dirección.

- [X] T009 [US1] `js/jugar.js`: armar el marco con `MRJuegosAparte`, con el `src` de `direccion()` y el
  `sandbox` y el `allow` de `marco()`. Macro Snake, como hoy. `jugar.html` carga
  `js/motor/juegos-aparte.js`, con su `?v=`, después de `js/datos-juegos.js` y antes de `js/jugar.js`.
  Su prueba, en `tests/juegos-aparte-navegador.test.js`, sobre `jugar.html` con jsdom, como
  `tests/explorar-y-ficha.test.js`: el marco de un juego de terceros, el de uno de otra web y el de Macro
  Snake, y el orden de los scripts. En el mismo commit, la fila de los juegos de «Las partes» en
  `docs/referencia/ARQUITECTURA.md`.
- [ ] T010 [US1] Una prueba en `tests/juegos-aparte-navegador.test.js` de que Macro Snake no carga nada
  de otras webs: ningún `src`, `href` ni `fetch` con `http://`, `https://` o `//` en
  `html/juegos/macro-snake.html`, `.js` y `.css` (research D2).
- [ ] T011 [US1] Comprobar en el PC (quickstart 3 y 4):
  - la tabla de `curl` del apartado 3;
  - en Edge, con `demo`, en tres juegos de terceros de motores distintos: el marco no lee la sesión, no
    llega a la página, y `top.location = ...` no la mueve.

  Anotar en la «Comprobación» de `specs/008-aislar-juegos/spec.md`.

**Punto de control**: la historia 1 se cumple en el PC. El XP de los juegos de terceros todavía no
cuenta bien: lo arregla la fase 4.

---

## Fase 4: Historia de uso 3, el XP cuenta igual (P1)

**Objetivo**: jugar a un juego de terceros cuenta como hoy: con actividad dentro en los últimos tres
minutos, sí; sin ella, no.

**Prueba independiente**: jugar tocando y sin tocar nada, y mirar qué minutos cuentan.

- [ ] T012 [US3] Crear `html/juegos/_puente.js` (research D7; contracts/mensajes.md «Actividad»):
  - en la ventana del juego escucha `keydown`, `pointerdown`, `pointermove`, `mousedown`, `mousemove`,
    `wheel` y `touchstart`, en captura y pasivos;
  - avisa a `window.parent`, con destino `"*"`, con `{ tipo: "mr-actividad" }`, «como mucho uno cada 5
    segundos»;
  - si el juego no está en un marco, no manda nada; si no puede mandar, lo dice en la consola.

  En `api/_juegos-aparte.js`, meterlo en línea en cada envoltorio que sirve la dirección de los juegos,
  salvo `_mudanza.html`. Va justo después de la etiqueta de apertura de `<head>`. Si no hay, después de
  la de `<html>`; si tampoco, después del `<!doctype>`; y si no hay nada de eso, al principio. El `ETag`
  incluye la versión del puente.

  Sus pruebas:
  - en `tests/juegos-aparte-servidor.test.js`, cada posición, y que **cada** envoltorio de
    `html/juegos/` sale con el puente (RF-010);
  - en `tests/puente-actividad.test.js`, el puente con jsdom y un reloj de mentira.
- [ ] T013 [US3] `js/motor/actividad-jugador.js` (research D7):
  - `vigilarJuego(iframe, { origen })` acepta `mr-actividad` solo si `event.origin` es `origen` y
    `event.source` es la ventana de ese marco, y lo cuenta como un evento;
  - ese marco cuenta como «de la web» en `alPerderElFoco`: la regla de los diez minutos queda para los
    de otras webs;
  - sin `origen`, como hoy (Macro Snake).

  `js/jugar.js` pasa `{ origen: MRJuegosAparte.origen(location) }` en los de terceros.

  Sus pruebas:
  - en `tests/puente-actividad.test.js`: el aviso que cuenta, los que no (de otra dirección o de otra
    ventana), y que el foco en el marco puenteado no da diez minutos;
  - `tests/actividad-jugador.test.js`, al día.

  En el mismo commit, el comentario de cabecera del archivo y el apartado «4. Solo con alguien delante»
  de `docs/referencia/ECONOMIA.md`.
- [ ] T014 [US3] Comprobar el XP en el PC (quickstart 6), con `demo` y en un juego de terceros:
  - tocando dentro una vez cada 30 segundos, sale un pulso por minuto a `/api/users?action=xp` y el XP
    sube;
  - sin tocar, a los tres minutos no sale ninguno;
  - al volver a tocar, vuelven.

  Anotar en la «Comprobación» de `specs/008-aislar-juegos/spec.md`.

**Punto de control**: las historias 1 y 3 se cumplen en el PC.

---

## Fase 5: Historia de uso 4, las partidas pasan solas (P2)

**Objetivo**: lo que guardaron los juegos pasa solo a la dirección de los juegos, sin las cachés, sin
nada del sitio y sin pisar nada.

**Prueba independiente**: guardar partida en un juego de cada motor antes del cambio, y abrirla después.

- [ ] T015 [US4] Las claves del sitio, en `js/motor/juegos-aparte.js` (research D9, data-model «Claves
  del sitio»), con `esDelSitio(clave)`:
  - fijas: «`macroSessionToken`, `usuarioActivo`, `presenciaMacro`, `macroRebornRecomendacionesBase`,
    `macroRebornRetoDiario`, `mr_originals_played`, `temaMacroReborn`, `paletaMacroReborn`,
    `macro:last-achievement-unlocked`, `macro:last-activity-recorded`, `macro:last-game-played` y la marca
    `mrPartidasMudadas`»;
  - por prefijo: «`macro`, `mr_`, `chatAntispam_` y `estadisticas_`».

  Su prueba, en `tests/juegos-aparte-navegador.test.js`, recorre el código del sitio (la raíz y `js/`, sin
  `html/juegos/`) buscando `localStorage.getItem`, `setItem` y `removeItem`. Falla si una clave escrita
  tal cual no la cubre la lista, o si aparece una clave calculada en un archivo que la prueba no conoce.
  Hoy son `js/chat.js`, `js/core.js`, `js/motor/estadisticas.js`, `js/retos-diarios.js`,
  `js/session.js` y `js/tema.js`, cada uno con lo que vale su clave. En el mismo commit (regla XIX), en
  «Convenciones del proyecto» de `docs/guias/DESARROLLO.md`: una clave nueva del sitio en el
  `localStorage` va en esta lista (y en la de `html/juegos/_mudanza.js`), y la prueba avisa si falta.
- [ ] T016 [P] [US4] Añadir `fake-indexeddb` 6.2.5, exacta y solo para las pruebas (`npm install
  --save-dev --save-exact fake-indexeddb@6.2.5`), en `package.json` y `package-lock.json` (research
  D11). Comprobar que no trae dependencias, `npm audit` y `npm test` en verde.
- [ ] T017 [US4] Crear `html/juegos/_mudanza.html` y `html/juegos/_mudanza.js` (research D8;
  contracts/mensajes.md «Mudanza»; data-model «Paquete de la mudanza»): código del equipo, sin nada de
  terceros.
  - Al cargar, avisa `mr-mudanza-lista`.
  - Acepta `mr-mudanza` solo de las direcciones de la web, como en data-model «Dirección de los juegos»:
    en `juegos.macroreborn.com`, de `https://macroreborn.com` y `https://www.macroreborn.com`; en local,
    de `http://localhost:<p>` y de `http://127.0.0.1:<p>`, siendo `<p>` el puerto anterior al suyo.
  - Tira cualquier clave del sitio, con la misma lista de la T015 (una prueba vigila que sea la misma).
  - Guarda sin pisar nada: «Una clave que ya está en la dirección de los juegos no cambia. Una base que
    no existe se crea con la misma versión, almacenes e índices. En una que ya existe solo entran los
    registros que falten; un almacén que no tenga se salta y se cuenta».
  - Contesta `mr-mudanza-hecha` con las cuentas, o `mr-mudanza-fallo` con el motivo, que también dice en
    la consola.

  Sus pruebas:
  - en `tests/mudanza-partidas.test.js`, con jsdom y `fake-indexeddb`;
  - en `tests/juegos-aparte-servidor.test.js`, que los dos archivos salen en la dirección de los juegos
    sin puente, y que en la web dan 404.
- [ ] T018 [US4] La parte de la página, en `js/motor/juegos-aparte.js` (research D8;
  contracts/mensajes.md).
  - **`recogerPartidas()`**:
    - el `localStorage`, sin lo del sitio;
    - las bases de `indexedDB.databases()`, sin las cachés «`EmulatorJS-roms`, `EmulatorJS-bios`,
      `EmulatorJS-core` y `UnityCache`», con su versión, sus almacenes, sus índices y sus registros;
    - «Una base de más de 64 MB no se pasa, y en total no se pasan más de 128 MB»: van como `saltadas`;
    - si no hay `indexedDB.databases()`, solo el `localStorage`.
  - **`mudarPartidas()`**:
    - con la marca `mrPartidasMudadas`, no hace nada; sin nada que pasar, pone la marca;
    - si hay algo, abre un marco invisible a `_mudanza.html` y manda el paquete solo a la dirección de
      los juegos;
    - la marca, `{ version: 1, fecha, claves, registros, saltadas }`, con las claves y los registros
      puestos (data-model «Marca de mudanza hecha»), solo se pone con `mr-mudanza-hecha`;
    - con `mr-mudanza-fallo`, o a los «60 segundos» sin respuesta, no pone la marca y lo dice en la
      consola;
    - siempre quita el marco.

  Sus pruebas, en `tests/mudanza-partidas.test.js`: lo que se recoge y lo que no (las cachés, las claves
  del sitio, los límites); la ida y vuelta entera con la mudanza de la T017; que no pisa nada; y que sin
  respuesta no pone la marca.
- [ ] T019 [US4] `js/jugar.js`: en un juego de terceros, antes de armar el marco, llamar a
  `MRJuegosAparte.mudarPartidas()`. Mientras dura, si hay algo que pasar, el aviso de carga (`#overlayCarga
  p`) dice «Pasando tus partidas guardadas…», y después vuelve a «Cargando juego…». Si falla, abre el
  juego igual. Su prueba, en `tests/juegos-aparte-navegador.test.js`.
- [ ] T020 [US4] Comprobar la mudanza en el PC (quickstart 7), con un script de un solo uso, fuera del
  repositorio, que deja partidas de prueba de cada motor en `localhost:3001`. Tiene que salir:
  - pasan las claves y las cuatro bases, con sus registros;
  - no pasan las cachés ni nada del sitio;
  - la marca lleva las cuentas, y no se repite;
  - no pisa una clave que se cambió a mano.

  Y una partida de verdad de un emulador, guardada con `main` y cargada con la rama, o «Pendiente de
  probar». Anotar en la «Comprobación» de `specs/008-aislar-juegos/spec.md`.

**Punto de control**: las historias 1, 3 y 4 se cumplen en el PC.

---

## Fase 6: La página de jugar, al día

- [ ] T021 En `jugar.html`, subir la versión `?v=` de `js/jugar.js` y de `js/motor/actividad-jugador.js` a
  la fecha del cambio, junto con la de `js/motor/juegos-aparte.js` (research D13). `tests/versiones.test.js`
  y `tests/actividad-jugador.test.js`, en verde.

---

## Fase 7: Historia de uso 2, los juegos funcionan como antes (P1). La comprobación en el PC

**Objetivo**: cada juego que cargaba sigue cargando, con su pantalla completa, en PC y en móvil, y Macro
Snake sigue igual.

**Prueba independiente**: abrir cada juego antes y después, y comparar.

- [ ] T022 [US2] La revisión de «después» (quickstart 4 y 5), con el servidor local nuevo, en PC y en
  móvil: `node scripts/revision-juegos.js --sonda --pulsar --comparar
  <scratchpad>/revision-008/antes/informe.json --salida <scratchpad>/revision-008/despues`, y lo mismo
  con `--movil`, comparando con `antes-movil` y saliendo en `despues-movil`. Tiene que salir, en las dos:
  0 de 107 leen la clave de la web, 0 llegan a la página, y 0 juegos que cargaban y ya no. Los 4 de
  otras webs, con su marco nuevo, también tienen que cargar (RF-007). Mirar las páginas de capturas
  enteras, y anotar en la «Comprobación» de `specs/008-aislar-juegos/spec.md` los que se rompan.
- [ ] T023 [US2] Por cada juego que se rompa al estar aparte, arreglar su envoltorio en
  `html/juegos/<nombre>.html`, con un commit por juego y el porqué en el commit, y volver a revisarlo con
  `--ids`. Si no se rompe ninguno, se anota en la «Comprobación».
- [ ] T024 [US2] Comprobar en el PC (quickstart 5):
  - la pantalla completa del botón de la página y la de un emulador;
  - Macro Snake se abre desde la web, sin `sandbox`, y se juega;
  - la página de jugar en PC (1366×800) y en móvil (390×844), con tres juegos de terceros de motores
    distintos y Macro Snake, con capturas fuera de git (regla XXVIII).

  Anotar en la «Comprobación» de `specs/008-aislar-juegos/spec.md`.
- [ ] T025 [US2] `npm test` y la prueba de humo con los Node oficiales 24.21.0 y 22.23.3 de
  `D:\node-oficial\` (quickstart 1). Anotar el resultado en la «Comprobación» de
  `specs/008-aislar-juegos/spec.md` (regla XXII).

**Punto de control**: todo el código, comprobado en el PC.

---

## Fase 8: nginx, preparado en `infra/`

- [ ] T026 Preparar en `infra/nginx/macroreborn.conf` el bloque de `juegos.macroreborn.com` (research D4;
  contracts/rutas-http.md «nginx en producción»):
  - en el 443, con IPv4 e IPv6, HTTP/2 y el mismo certificado;
  - `nosniff`, `Referrer-Policy` y HSTS, sin `X-Frame-Options`;
  - `location ^~ /html/juegos/` a `127.0.0.1:3000`, con `Host` y el límite `general`, y `location /` con
    404;
  - en el bloque del 80, el nombre nuevo, con su redirección;
  - ninguna IP nueva (regla XXIV).

  En el mismo commit:
  - `infra/LEEME.md`;
  - en `docs/referencia/VPS.md`, el apartado «7. Dominio y HTTPS» (los tres nombres, el registro
    `juegos` y la orden de certbot), y uno nuevo sobre la dirección de los juegos: qué sirve, por qué va
    sin `X-Frame-Options` y quién pone `frame-ancestors`;
  - en «4. Comprobar en la web real» de `docs/guias/DESPLEGAR.md`, dos comprobaciones más para cada
    despliegue: un juego en la dirección de los juegos da 200, y su dirección vieja en la web da 302.

  No toca el servidor.

---

## Fase 9: Historia de uso 5, la documentación (P3)

**Objetivo**: la documentación cuenta dónde están los juegos, cómo se sabe que alguien juega, cómo se
sirve la dirección de los juegos y qué hace la mudanza; lo de Neon deja de estar pendiente; la
auditoría lleva la nota del punto 1, que se cierra al desplegar (T038). Lo de probar en local, el
`noindex` y la regla de las claves del sitio ya entraron con las T004, T006, T007 y T015.

**Prueba independiente**: leer la documentación, y que la pase `tests/documentacion.test.js`.

- [ ] T027 [P] [US5] `docs/guias/JUEGOS.md`:
  - probar un juego en local con las dos direcciones (el 3001 redirige al 3002);
  - el marco de la página de jugar y sus permisos (`sandbox` y `allow`), y lo que eso significa para el
    marco de dentro de un envoltorio;
  - el puente, que se pone solo;
  - la mudanza: qué pasa la primera vez que se abre un juego (qué se copia y qué no) y la marca
    `mrPartidasMudadas`;
  - los archivos con `_` de `html/juegos/`;
  - Macro Snake, que se queda en la web;
  - `scripts/revision-juegos.js`, para mirar un juego nuevo.
- [ ] T028 [US5] Lo de Neon (RF-013; Luis, 09/10: ya no lo tienen ni lo usan):
  - en `docs/referencia/VPS.md`, el punto 1 de «Lo que falta» pasa a «Resuelto», y el 2 se queda solo en
    quitar `@neondatabase/serverless` y la rama de Neon de `api/_db.js`, sin la razón que le añadió la
    spec 006;
  - fuera las líneas sobre la base de Neon que la spec 006 añadió en `docs/referencia/CUENTAS.md`,
    `docs/historia/CONTRASENAS-EN-CLARO.md`, la nota al 86 de `docs/listas/AUDITORIA.md` y su entrada de
    `docs/historia/HISTORIAL.md`;
  - una nota en `specs/006-volcados-en-claro/spec.md`.
- [ ] T029 [US5] `docs/listas/AUDITORIA.md`: la «Nota al 1». Cuenta qué se hizo, con las cifras (75
  juegos y 18 cuentas; 107 aparte), y lo que queda (los puntos 6 y 12). El punto **sigue abierto**: hasta
  el despliegue, la web real sigue igual. Lo cierra la T038, con la fecha del despliegue.

---

## Fase 10: Cierre, unión y despliegue

- [ ] T030 La «Comprobación» de `specs/008-aislar-juegos/spec.md`, completa, y la entrada de
  `docs/historia/HISTORIAL.md` con la fecha de la unión, el área (juegos), quién y el enlace a la spec
  (RF-014).
- [ ] T031 Unir `008-aislar-juegos` a `main` (`git merge --no-ff`). En `main`, `npm test` y la prueba de
  humo con 24.21.0 y 22.23.3, como en el apartado 1 de `specs/008-aislar-juegos/quickstart.md`; si
  pasan, `git push origin main`.
- [ ] T032 La revisión de «antes» en la web real, antes de desplegar (quickstart 8): `node
  scripts/revision-juegos.js --base https://macroreborn.com --sonda --pulsar --salida
  <scratchpad>/revision-008/web-antes`, sin entrar con ninguna cuenta. Solo navega, como una visita, y no
  toca el servidor. Crear la sección «Despliegue» de `specs/008-aislar-juegos/spec.md` y anotarlo.
- [ ] T033 (Servidor) Ampliar el certificado (research D14): `sudo certbot certonly --nginx --cert-name
  macroreborn.com -d macroreborn.com -d www.macroreborn.com -d juegos.macroreborn.com --dry-run`, y si
  sale bien, lo mismo sin `--dry-run`. Comprobar `sudo certbot certificates` (tres nombres) y `sudo
  certbot renew --dry-run`. Anotar en el «Despliegue» de `specs/008-aislar-juegos/spec.md`.
- [ ] T034 (Servidor) nginx:
  - copiar `/etc/nginx/sites-enabled/macroreborn` a `/etc/nginx/respaldos/`, con la fecha;
  - subir `infra/nginx/macroreborn.conf`, `sudo nginx -t` y recargar.

  Comprobar:
  - `https://juegos.macroreborn.com/html/juegos/pvz.html` da 200, con el certificado válido y sin
    `X-Frame-Options`;
  - allí, `/api/users` da 404;
  - la web sigue igual (las comprobaciones de DESPLEGAR).

  Anotar en el «Despliegue» de `specs/008-aislar-juegos/spec.md`.
- [ ] T035 (Servidor) Desplegar `main` (DESPLEGAR): `GIT_SSH_COMMAND='ssh -i ~/.ssh/macroreborn-vps-key'
  git push vps main` y `sudo -n systemctl restart macroreborn`. Sin `npm install`: la única dependencia
  nueva es de las pruebas. Comprobar:
  - las de DESPLEGAR;
  - `https://macroreborn.com/html/juegos/pvz.html` da 302 a la dirección de los juegos;
  - en la dirección de los juegos, la cabecera `frame-ancestors` y el puente dentro del envoltorio.

  Anotar en el «Despliegue» de `specs/008-aislar-juegos/spec.md`.
- [ ] T036 La revisión de «después» en la web real (quickstart 8), con `--sonda --pulsar` y `--comparar
  <scratchpad>/revision-008/web-antes/informe.json`: 0 de 107 leen la clave, 0 llegan a la página, 0
  rotos. Y el servicio, sin errores en su registro, sin respuestas 5xx en nginx y con la memoria de
  siempre. Anotar en el «Despliegue» de `specs/008-aislar-juegos/spec.md`.
- [ ] T037 (Luis) Con su cuenta: unos minutos en un juego de terceros, y el XP sube; una partida de Macro
  Snake, y su récord sale en el top. Si no da tiempo, «Pendiente de probar». Anotar en el «Despliegue» de
  `specs/008-aislar-juegos/spec.md`.
- [ ] T038 La sección «Despliegue» de `specs/008-aislar-juegos/spec.md`, completa, y en
  `docs/listas/AUDITORIA.md` el punto 1 cerrado con la fecha del despliegue (regla XXXI), con su commit
  en `main` y `git push origin main`. La memoria de Claude (`spec-kit-adoptado.md`) al día, con su copia
  en `memoria-claude/`.

---

## Dependencias y orden

### Entre fases

- **Fase 1**: la T001 (Luis) puede ir en cualquier momento antes de la T033, y cuanto antes mejor, para
  que el DNS se propague. La T003 espera a la T002.
- **Fase 2**: después de la T003, para que el «antes» se mida con el código sin cambiar. Bloquea todas
  las historias.
- **Fases 3 a 5**: en orden, cada una sobre la anterior: el puente (fase 4) va en el marco de la fase 3,
  y la mudanza (fase 5), antes de abrirlo.
- **Fase 6**: con las fases 3 a 5 hechas.
- **Fase 7**: con todo el código hecho, porque lo mide entero.
- **Fases 8 y 9**: después de la 7. No dependen entre sí.
- **Fase 10**: la T031, con todo lo anterior; las T032 a T037, en ese orden; la T033 necesita el DNS de
  la T001, ya propagado.

### Entre historias de uso

- **Historia 1**: la base de todas: sin la dirección aparte no hay nada que puentear ni a dónde mudar.
- **Historia 3**: sobre la 1 (el marco de terceros). Si se desplegara la 1 sin la 3, el XP cambiaría de
  regla.
- **Historia 4**: sobre la 1 (la dirección de los juegos) y la 2 de la base (`js/motor/juegos-aparte.js`).
  Si se desplegara la 1 sin la 4, se perderían las partidas.
- **Historia 2**: mide las tres anteriores.
- **Historia 5**: la documentación de todo. Lo de probar en local entró en la base.

### Dentro de cada historia de uso

- La prueba va con su cambio, en el mismo commit, y tiene que fallar sin él.
- El servidor, antes que el navegador; la mudanza del lado de los juegos (T017), antes que la de la
  página (T018).
- La comprobación en el PC cierra cada historia.

### En paralelo

Marcadas [P]: la T001 (Luis) con la T002; la T016 con la T015; y la T027 con la T028. Aun así, Claude
las hace una tras otra (regla VIII).

## Estrategia

### El MVP

No se despliega por partes. La historia 1 sola cerraría el riesgo de las cuentas, pero cambiaría el XP
(historia 3) y dejaría atrás las partidas (historia 4). El mínimo que se puede desplegar son las
historias 1, 3 y 4 juntas, comprobadas con la 2. Por eso la unión a `main` y el despliegue van al final.

### Después, por partes

1. Fases 1 y 2: el DNS, el «antes» y la base, comprobados en el PC.
2. Historias 1, 3 y 4, en ese orden, cada una con su comprobación en el PC.
3. La historia 2 sobre todo el código, y los arreglos de los envoltorios que hagan falta.
4. nginx y la documentación, y la unión.
5. El despliegue por partes, con el OK de Luis en cada paso del servidor.

## Notas

- Cada tarea se marca `[X]` aquí al cerrarla, en su mismo commit.
- Los informes y las capturas de `scripts/revision-juegos.js` se quedan en el scratchpad, fuera de git;
  a la spec van las cifras.
- Ninguna IP, ningún correo y ningún dato de la comunidad en los documentos ni en los commits (regla
  XXV): las cifras, contadas.
- Si algo del código no coincide con la spec o el plan, primero se corrige la spec (regla XIX).
