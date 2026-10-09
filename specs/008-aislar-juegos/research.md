# Investigación: que los juegos no puedan leer la sesión

**Rama**: `008-aislar-juegos` | **Fecha**: 2026-10-09 | **Especificación**: [spec.md](spec.md)

Todo lo de aquí se comprobó el 09/10/2026, solo leyendo: el código, el servidor (órdenes de lectura) y
el código de los motores de los juegos, bajado de su CDN para leerlo. La base de producción se consultó
en modo lectura y solo para contar.

## Lo que hay hoy

- **El catálogo**: 112 juegos. 107 son de terceros y se abren desde `html/juegos/<nombre>.html`, en la
  propia web. Uno es Macro Snake, del equipo, en `html/juegos/macro-snake.html`. Cuatro están en otras
  webs. En la carpeta hay además un envoltorio que no está en el catálogo, `pokemontowerdefense.html`.
- **El marco**: `js/jugar.js` es el único sitio que abre un juego. Lo hace con un `iframe` sin
  `sandbox`, con la ruta relativa del catálogo: el juego es, para el navegador, la misma web.
- **El riesgo**: 75 de los 107 cargan código de 18 cuentas de GitHub, en 190 sitios, desde ramas o
  páginas que su dueño puede cambiar (por ejemplo, 43 emuladores cargan EmulatorJS de la rama `master` de
  una cuenta ajena). La sesión, `macroSessionToken`, vive en el `localStorage` de la web.
- **La actividad** (`js/motor/actividad-jugador.js`): escucha teclado, ratón y pantalla en la página y
  dentro del `iframe`, porque es de la misma web. Si el `iframe` es de otra web, entrar en él vale diez
  minutos. `js/motor/xp.js` pregunta `hayAlguien()` antes de cada pulso.
- **Lo que guardan los juegos**, a nombre de la web, en el navegador de cada persona:

  | Motor | Juegos | Partidas | Ajustes | Cachés que se vuelven a bajar |
  |---|---|---|---|---|
  | EmulatorJS | 46 | IndexedDB `/data/saves` (las del juego) y `EmulatorJS-states` (los estados) | `localStorage` `ejs-...` | IndexedDB `EmulatorJS-roms`, `-bios` y `-core` |
  | Ruffle (Flash) | 32 | `localStorage` | | |
  | Unity | 11 | IndexedDB `/idbfs` | | IndexedDB `UnityCache` |
  | Otros de HTML5 | 18 | `localStorage` o IndexedDB | | |

  Los nombres salen del código de cada motor: `emulator.js` crea las cuatro bases de EmulatorJS (y dice
  de `EmulatorJS-states`: «This is not cache. This is save data»), su `GameManager.js` monta
  `/data/saves` con IDBFS, y el cargador de Unity usa `UnityCache` y `/idbfs`.
- **Lo que guarda el sitio** en `localStorage`, contado en todo su código: 11 claves fijas
  (`macroSessionToken`, `usuarioActivo`, `presenciaMacro`, `macroRebornRecomendacionesBase`,
  `macroRebornRetoDiario`, `mr_originals_played`, `temaMacroReborn`, `paletaMacroReborn` y tres
  `macro:last-...`) y dos familias (`chatAntispam_<nombre>` y `estadisticas_<nombre>`). No usa
  IndexedDB, ni `sessionStorage`, ni cookies propias.
- **Quién juega**: en las cuatro semanas hasta el 09/10, 84 personas distintas jugaron a los 107, y 27
  pasaron una hora o más en alguno. Solo en emuladores, 868 horas.
- **El servidor**: `server.js` sirve todo desde el mismo proceso, por lista blanca, detrás de nginx.
  `scripts/servidor-local.js` es otro servidor, y por eso las rutas especiales viven en módulos de `api/`
  que usan los dos (`api/_prendas-ruta.js`, `api/_ruta-estatica.js`) y se prueban solos.
- **nginx** (`infra/nginx/macroreborn.conf`, igual que el del servidor salvo cinco comentarios con rutas
  de documentos de antes de la spec 001): pone `X-Frame-Options: SAMEORIGIN` y HSTS con
  `includeSubDomains` en todo.
- **El dominio**: en IONOS, con dos registros A (`@` y `www`) y ningún AAAA, a propósito (VPS). El
  certificado, de Let's Encrypt (ECDSA), cubre `macroreborn.com` y `www`, vence el 30/11/2026 y certbot
  (2.9.0) lo renueva solo. nginx es la 1.24. `juegos.macroreborn.com` no existe.
- **Service workers**: cuatro envoltorios intentan registrar `sw.js`. Nunca pudo quedar ninguno en la
  web: `html/juegos/sw.js` no existe ni ha existido en git (la web da 404), y en el cuarto la dirección
  es de otro dominio, que el navegador no deja registrar. No hay nada que limpiar.
- **Envoltorios que miran fuera de sí**: 27 llaman a `window.parent.maeExportApis_()`, que en la página
  de jugar no existe (hoy da un error y sigue); uno (`grindcraft.html`) lee `window.top.location`; 15
  llevan `<base href>` a jsDelivr.

## Decisiones

### D1. Los juegos de terceros, en `juegos.macroreborn.com`

Los 107 (y el envoltorio fuera del catálogo) se abren desde `https://juegos.macroreborn.com`, con la
misma ruta de hoy: `/html/juegos/<nombre>.html`. Es otro origen: el navegador no deja a su código leer
el `localStorage` de la web, ni tocar la página que lo contiene. Como es el mismo sitio (el mismo
dominio), cada juego conserva su almacenamiento propio, sin las particiones que los navegadores ponen a
los marcos de otros dominios.

Descartadas:

- **`sandbox` sin `allow-same-origin`** (un origen opaco, sin dirección nueva): el juego no puede usar
  `localStorage` ni IndexedDB, y los 89 juegos que guardan partidas o ajustes fallarían. Y no habría a
  dónde pasar las partidas.
- **Un dominio aparte** (por ejemplo, comprar otro): cuesta dinero (regla VII). Un subdominio basta,
  porque la sesión vive en `localStorage`, que va por origen, no en una cookie.
- **Copiar a la web el código de los juegos**, en vez de cargarlo de GitHub: no separa nada, porque el
  juego seguiría en la misma web, y son cientos de archivos de terceros que mantener.
- **Pasar la sesión a una cookie `HttpOnly`** (punto 12): no resuelve esto. Un juego en la misma web
  puede pedir a la API con la cookie y leer la página.

### D2. Qué se mueve y qué no

- **Se mueven**: los 107 de terceros (y `pokemontowerdefense.html`).
- **Se queda**: Macro Snake. Es código del equipo, no carga nada de fuera (comprobado) y necesita la
  sesión para guardar récords. Una prueba vigila que siga sin cargar nada de fuera.
- **No cambian de sitio**: los cuatro de otras webs. Reciben el mismo `sandbox` que los demás (D6).
- **Las rutas** no cambian: el envoltorio sigue en `html/juegos/`, y en la dirección nueva se pide con
  la misma ruta. Así el cambio de dirección es de una sola pieza, y los enlaces viejos se pueden
  redirigir sin tabla.

### D3. Quién sirve los juegos: el mismo Node, por el nombre de la dirección

Un módulo nuevo, `api/_juegos-aparte.js`, como `api/_prendas-ruta.js`: lo usan `server.js` y
`scripts/servidor-local.js`, para que los dos hagan exactamente lo mismo, y se prueba solo. Va antes de
la API y de los archivos estáticos:

- **En la dirección de los juegos** atiende todas las peticiones: solo sirve los envoltorios de
  terceros (con el puente de D7 dentro) y los dos archivos de la mudanza (D8); todo lo demás, también
  `/api/`, da 404. Pone `Content-Security-Policy: frame-ancestors` con las dos direcciones de la web
  (solo ellas pueden meter un juego en un marco), `Content-Type` con `charset=utf-8`, `Cache-Control:
  no-cache` con su ETag, y `X-Robots-Tag: noindex`: son páginas de terceros, sin nada propio, que no
  deben salir en los buscadores, como `jugar.html`. Se deja rastrear (no hay `robots.txt` que lo
  impida) para que el buscador vea el `noindex`, como explica `robots.txt` para las páginas privadas.
- **En la web**, un envoltorio de terceros responde con una redirección 302 a la dirección de los
  juegos, con su consulta. Así un enlace viejo sigue llevando al juego (RF-003) y la web no lo ejecuta
  nunca. Los archivos de Macro Snake se sirven como hoy. Los dos de la mudanza y el puente dan 404.
- **La ruta** se resuelve con `api/_ruta-estatica.js`, la misma de los estáticos, y solo vale un archivo
  que esté directamente en `html/juegos/`: nada de `..`, ni de subcarpetas.
- **302 y no 301**: un 301 se queda guardado en el navegador para siempre, y si hubiera que volver
  atrás, seguiría mandando a la dirección nueva. Cuando lleve un tiempo sin problemas se puede pasar a
  301.

Descartado: que lo haga nginx solo. No se puede probar en `npm test`, y en local no habría nginx.

### D4. nginx y el certificado

- **Un bloque `server` nuevo** para `juegos.macroreborn.com` en el mismo archivo: solo `location ^~
  /html/juegos/`, hacia Node, con el límite de ritmo `general`; todo lo demás, 404. Las cabeceras de
  seguridad de siempre (`nosniff`, `Referrer-Policy`, HSTS) **sin `X-Frame-Options`**, que impediría
  meter los juegos en la página; en su lugar, el `frame-ancestors` de D3.
- **El bloque del puerto 80** suma el nombre nuevo, con su redirección a HTTPS.
- **El certificado se amplía** al nombre nuevo con `certbot certonly --nginx --cert-name
  macroreborn.com`, con los tres nombres, primero con `--dry-run`. `certonly` no deja cambiada la
  configuración de nginx (con `--nginx` la toca solo mientras dura el desafío, y la devuelve como
  estaba): el bloque nuevo apunta al mismo certificado. La renovación automática sigue igual.
- **La copia de `infra/`** se prepara en la rama y es la que se sube al servidor, con la copia de antes
  en `/etc/nginx/respaldos/` y `nginx -t` antes de recargar. Al subirla quedan iguales también los cinco
  comentarios.

### D5. El DNS, en IONOS

Un registro A, `juegos`, con la IP del servidor, y **ningún AAAA**: el servidor solo tiene IPv4, y un
AAAA suelto mandaría a la página aparcada de IONOS, como ya pasó con `@` (VPS). Lo añade Luis, que
tiene acceso, con un paso cada vez (regla VI); se comprueba con `dig` desde el servidor. Puede hacerse
al principio: no cambia nada hasta que se despliega el código, y así da tiempo a que se propague.

### D6. El marco del juego

| Juego | `src` | `sandbox` | `allow` |
|---|---|---|---|
| Los 107 de terceros | `https://juegos.macroreborn.com/html/juegos/<nombre>.html` | sí | `fullscreen; gamepad; autoplay` |
| Los 4 de otras webs | el de hoy | sí | `fullscreen; gamepad; autoplay` |
| Macro Snake | el de hoy (relativo) | no | el de hoy |

El `sandbox` lleva `allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups
allow-popups-to-escape-sandbox allow-modals allow-downloads allow-orientation-lock allow-presentation`.
Sin `allow-top-navigation`: el juego no puede llevarse la página a otra dirección (RF-002).
`allow-same-origin` deja al juego su propio origen, para que guarde sus partidas. Es seguro porque es
otro origen que la página: junto con `allow-scripts` solo es peligroso en un marco de la misma web, que
podría quitarse el `sandbox`. `allow-downloads` deja exportar partidas desde el menú de los emuladores.
`allow-popups-to-escape-sandbox` deja que los enlaces que abra un juego funcionen normal. En `allow`,
los mandos (`gamepad`) y el sonido (`autoplay`) los necesita un marco de otro origen, que no los hereda
de la página; `fullscreen` acompaña al `allowfullscreen` de hoy.

Macro Snake no lleva `sandbox`: es de la misma web y del equipo, y con `allow-same-origin` y
`allow-scripts` el `sandbox` no le pondría ningún límite.

### D7. Saber que alguien juega: un puente

El servidor inyecta en cada envoltorio, al servirlo en la dirección de los juegos, un script corto, el
**puente** (`html/juegos/_puente.js`). Escucha los mismos eventos que hoy (teclado, ratón, rueda,
pantalla) en la ventana del juego y, como mucho cada 5 segundos, avisa a la página con
`postMessage({ tipo: "mr-actividad" })`. La página (`js/motor/actividad-jugador.js`) solo lo cree si el
mensaje viene de la dirección de los juegos **y** de la ventana de ese marco. Ese marco cuenta como «de
la web» para la regla de los diez minutos, que sigue solo para los cuatro de otras webs. El resultado es
el de hoy: un minuto cuenta si alguien tocó algo en los últimos tres.

- **Inyectado y no escrito en cada archivo**: así no hay que tocar 107 envoltorios, y uno nuevo lo trae
  solo. Va en línea, justo después de `<head>` (o de `<html>`, o del `<!doctype>`, nunca antes, que
  pondría la página en modo quirks), porque 15 envoltorios llevan `<base href>` a jsDelivr: un `src`
  relativo iría a buscar el puente allí. El `charset=utf-8` va en la cabecera, así que da igual que el
  puente empuje el `<meta charset>` más allá de los primeros 1.024 bytes.
- **`postMessage` con destino `*`**: el puente no sabe si la página es `macroreborn.com` o `www`, y el
  mensaje no lleva nada. Quien filtra es la página, por origen y por ventana.
- **Lo que no cambia**: hoy se escucha la ventana del envoltorio, no los marcos que este abra dentro
  (los de otro origen no dejan). El puente escucha lo mismo. Y un juego podía fingir actividad hoy
  (lanzando eventos en su ventana), igual que podrá mandando el mensaje: el servidor sigue contando como
  mucho un minuto por minuto y las monedas de jugar se paran a las cuatro horas (regla XXIII).

Descartado: escribir el puente en los 107 archivos; y dejar a todos con la regla de los diez minutos,
que cambiaría la economía y dejaría contar diez minutos sin nadie delante.

### D8. Las partidas pasan solas: la mudanza

La primera vez que alguien abre un juego de terceros después del cambio, antes de abrir el juego:

1. La página de jugar mira la marca `mrPartidasMudadas` en el `localStorage` de la web. Si está, abre el
   juego sin más.
2. Recoge lo que hay de los juegos en el navegador, a nombre de la web:
   - del `localStorage`, todo menos lo del sitio (D9);
   - de IndexedDB, todas las bases (el sitio no usa ninguna) menos las cachés que se vuelven a bajar:
     `EmulatorJS-roms`, `EmulatorJS-bios`, `EmulatorJS-core` y `UnityCache`. Con cada base, su versión,
     sus almacenes, sus índices y sus registros. Una base de más de 64 MB, o lo que pase de 128 MB en
     total, no se pasa, y se anota.
3. Si no hay nada, pone la marca y abre el juego: casi todo el mundo no espera nada.
4. Si hay algo, abre en un marco invisible `https://juegos.macroreborn.com/html/juegos/_mudanza.html`
   (código del equipo, sin nada de terceros), espera a que diga que está lista y le manda todo con
   `postMessage`, solo a esa dirección. El aviso de carga dice «Pasando tus partidas guardadas…».
5. La mudanza solo acepta lo que llega de las dos direcciones de la web, y **no pisa nada**: una clave
   que ya esté no se cambia; una base que no exista se crea igual (versión, almacenes e índices) y se
   llena; en una que ya exista, solo entran los registros que falten. Contesta con lo que puso y lo que
   ya estaba.
6. Con la respuesta, la página pone la marca, con las cuentas, y abre el juego. Si algo falla o pasan 60
   segundos, abre el juego igual, sin marca, lo dice en la consola, y se reintenta la próxima vez.

Lo de la web **se queda donde está**, sin uso: si hubiera que volver atrás, ahí sigue. Borrarlo sería
otra decisión.

Límites conocidos: un navegador sin `indexedDB.databases()` (Firefox anterior a la 126, de mayo de 2024)
solo pasa el `localStorage`; las cookies y el `sessionStorage` de los juegos no pasan. Quien entró por
`www` y por `macroreborn.com` tiene dos copias: pasan las dos, y como no se pisa nada, gana la primera.

Descartado: pasarlas juego por juego, porque nada dice qué clave o qué base es de qué juego; y que se
pierdan, que descartó Luis.

### D9. Lo del sitio no pasa nunca

`js/motor/juegos-aparte.js` lleva la lista de lo que es del sitio: las 11 claves fijas, la marca
`mrPartidasMudadas` y los prefijos `macro`, `mr_`, `chatAntispam_` y `estadisticas_`. La mudanza nunca
manda nada de eso, y `macroSessionToken` y `usuarioActivo` además se comprueban aparte, en los dos
lados. Una prueba recorre el código del sitio, como se hizo para esta investigación, y falla si
aparece una clave de `localStorage` que la lista no cubre. Así una clave nueva del sitio no se puede
colar en la mudanza.

### D10. En el PC: dos puertos

`scripts/servidor-local.js` escucha en su puerto (3001) y en el siguiente (3002), que hace de dirección
de los juegos con el mismo módulo de D3. En el navegador, la regla es: en `macroreborn.com` o `www`, los
juegos están en `https://juegos.macroreborn.com`; en `localhost` o `127.0.0.1`, en el mismo nombre con
el puerto siguiente. Puertos distintos son orígenes distintos, así que en local se separan igual que en
la web. La prueba de humo busca dos puertos libres seguidos y prueba también las dos direcciones.

### D11. Las pruebas automáticas

- **El servidor** (`api/_juegos-aparte.js`), con peticiones de verdad: qué sirve cada dirección, con
  qué cabeceras, la redirección, el 404 de `/api/` en la de los juegos, las rutas con `..`, y que cada
  uno de los envoltorios de la carpeta sale con el puente y con `frame-ancestors` (RF-010).
- **El navegador**, con jsdom sobre los archivos de verdad: la dirección de los juegos en cada caso; el
  marco que arma `js/jugar.js` para un juego de terceros, uno de otra web y Macro Snake; el puente; la
  actividad que llega por mensaje (y la que no se cree, de otra dirección o de otra ventana); la regla de
  los diez minutos, que sigue para los de otras webs.
- **La mudanza**, con **`fake-indexeddb`** (6.2.5, de noviembre de 2025, Apache-2.0, sin dependencias,
  solo para las pruebas): que pasa lo que tiene que pasar, que no pasan las cachés ni lo del sitio, que
  no pisa nada, que respeta los límites y que, si falla, no pone la marca. jsdom no tiene IndexedDB, y
  escribir uno de mentira sería más código que mantener y menos fiel.
- **La lista del sitio** (D9) y que **Macro Snake** no carga nada de fuera.
- Las que ya hay de la actividad se adaptan: la del marco de la misma web sigue para Macro Snake.

### D12. Mirar los 107 juegos, antes y después

Una herramienta nueva, `scripts/revision-juegos.js`, como `scripts/revision-avatares.js`: no la corre
`npm test`. Abre cada juego en Edge sin ventana, por el protocolo de depuración, y apunta:

- si el juego **carga**: el elemento más grande que pinta (un `canvas`, el reproductor de Flash, un
  vídeo...) y los errores de JavaScript del marco;
- una **captura**;
- con `--sonda`, si el juego **puede ver la web**: antes de abrirlo deja una clave de prueba en el
  `localStorage` de la web y mira desde dentro del juego si la lee y si llega a la página que lo
  contiene. Una clave de prueba, y no la sesión, para poder hacerlo también en la web real sin entrar
  con ninguna cuenta.

Deja un informe y una página con las capturas lado a lado. Se corre en local antes de cambiar nada y
después, con los dos puertos, en PC y en móvil (`--movil`, porque RF-004 pide los dos), y en la web real
antes y después de desplegar. Cuenta como roto lo que cargaba
antes y después no. Los que ya no cargaban (punto 21) se ven igual en los dos. Si alguno se rompe por
estar aparte (por ejemplo, `grindcraft.html`, que lee la dirección de la página), se arregla su
envoltorio dentro de esta spec.

### D13. Las versiones `?v=`

En `jugar.html` se sube la versión de `js/jugar.js` y de `js/motor/actividad-jugador.js`, y entra
`js/motor/juegos-aparte.js` con la suya. Sin eso, un navegador podría usar cinco minutos el `jugar.js`
viejo, abrir el juego por la ruta vieja, llegar a la dirección nueva por la redirección **sin
mudanza**, y empezar con las partidas vacías.

### D14. Desplegar y deshacer

En este orden, cada paso del servidor con el OK de Luis en ese momento (regla XXI):

1. **El DNS** (Luis, en IONOS), comprobado con `dig`.
2. **El certificado**, ampliado, primero en seco.
3. **nginx**, con el bloque nuevo, la copia de antes guardada y `nginx -t`. Desde aquí la dirección de
   los juegos responde, pero nada la usa todavía.
4. **El código**: `git push vps main` y el reinicio. No hace falta `npm install`: la única dependencia
   nueva es de las pruebas.
5. **Comprobar en la web real**: las de siempre, las cabeceras de las dos direcciones, la redirección,
   la revisión de los juegos con la sonda, y a Luis, con su cuenta, que un juego le cuenta el XP.

Deshacer: volver al commit anterior y reiniciar (DESPLEGAR). El bloque de nginx puede quedarse: solo
sirve envoltorios. Las partidas no se pierden: siguen también en la web.

### D15. La documentación

Cada cosa, en el documento que la cuenta, y en el mismo commit que el código que la cambia cuando lo hay
(regla XIX):

| Documento | Qué se cuenta |
|---|---|
| VPS | la dirección de los juegos, su bloque de nginx, el certificado con tres nombres y el registro del DNS |
| DESPLEGAR | las comprobaciones de cada despliegue, también en la dirección de los juegos |
| SEO | la dirección de los juegos, con `noindex` |
| ECONOMIA | cómo se sabe que alguien juega |
| ARQUITECTURA | las partes |
| DESARROLLO, SUMARSE y CLAUDE.md | el segundo puerto en local; y, en las convenciones de DESARROLLO, que una clave nueva del sitio en el `localStorage` va en la lista de D9 |
| JUEGOS | probar un juego en local con las dos direcciones, el marco y sus permisos, el puente que se pone solo, la mudanza (qué pasa y qué no, y la marca) y la revisión de los juegos |
| El código | el comentario de cabecera de `js/motor/actividad-jugador.js` |
| `infra/` | `infra/nginx/macroreborn.conf` e `infra/LEEME.md` |
| AUDITORIA | la nota del punto 1, antes de unir; el punto se cierra con la fecha del despliegue, porque hasta entonces la web real sigue igual |
| HISTORIAL | su entrada, al unir |

Y lo de Neon (RF-013): los puntos 1 y 2 de lo que falta en VPS pasan a resueltos (el 2 deja
pendiente solo quitar el paquete y la rama de `api/_db.js`, que ya no se usan), y salen las líneas que
la spec 006 añadió sobre la base de Neon en VPS, CUENTAS, CONTRASENAS-EN-CLARO, la nota al 86 y el
historial; en la spec 006 queda una nota.

### D16. Nunca en silencio

Lo nuevo no se traga ningún error (regla XIII): la mudanza que falla lo dice en la consola, con qué
falló; el puente que no puede avisar, también; el módulo del servidor que no puede leer un envoltorio
lo dice en el registro del servicio.

## Fuera de alcance

- **La política de seguridad del contenido de la web (punto 6)** y **la sesión que se pueda cerrar de
  verdad (punto 12)**. Con los juegos aparte, son la siguiente capa.
- **Los juegos que no cargan (punto 21)** y **la analítica de terceros de los envoltorios (punto 62)**.
- **Dejar de cargar código de GitHub**: con los juegos aparte, ya no pone en riesgo las cuentas.
- **Borrar de la web lo que guardaron los juegos**, después de la mudanza.
- **Las cookies de los juegos**.
