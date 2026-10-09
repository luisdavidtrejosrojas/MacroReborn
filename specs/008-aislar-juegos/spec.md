# Especificación: que los juegos no puedan leer la sesión

**Rama**: `008-aislar-juegos`
**Creada**: 2026-10-09
**Estado**: Spec, plan y tareas aprobados por Luis el 09/10/2026; en implementación
**Tipo**: spec completa: después vienen el plan y las tareas, cada paso con el OK de Luis.
**Pedido**: Luis, 09/10/2026: «Proteger la sesión», el siguiente paso que eligió después de la 007. Es el
punto 1 de la auditoría, en el bloque de lo urgente desde el 18/09.

## Contexto

Comprobado el 09/10 en el código de hoy, solo leyendo:

- **Cómo se abre un juego.** El catálogo tiene 112 juegos. Al pulsar «Jugar», `jugar.html` lo abre en un
  marco (`iframe`) sin ninguna restricción (`js/jugar.js`). En 108 juegos, lo que se abre es un archivo de
  la propia web, en `html/juegos/`: 107 son juegos de terceros, y uno es Macro Snake, el juego propio. Los
  otros cuatro están en otras webs.
- **Lo que eso permite.** Un marco de la propia web es, para el navegador, la misma web. El código del
  juego puede leer lo que el sitio guarda en el navegador, también la sesión (`macroSessionToken`), y
  usarla como si fuera quien juega. También puede leer y cambiar la página que lo contiene, y llevarla a
  otra dirección.
- **De dónde sale ese código.** 75 de los 107 juegos de terceros cargan código de cuentas de GitHub que no
  son del equipo: 18 cuentas, en 190 sitios. Lo cargan de ramas o páginas que su dueño puede cambiar
  cuando quiera, y sin aviso. Basta con que una de esas cuentas cambie su código, por mala fe o porque se
  la roben, para que se lleve la sesión de cada persona que abra ese juego, también la de un
  administrador. La sesión dura siete días, y cerrar sesión no la invalida (punto 12).
- **Lo que depende de que sea la misma web.** El XP, la racha y las monedas de jugar solo cuentan si en
  los últimos tres minutos alguien tocó algo, y el sitio lo sabe escuchando dentro del juego
  (`js/motor/actividad-jugador.js`, decidido el 04/10). En los cuatro juegos de otras webs no puede
  hacerlo: ahí entrar en el juego vale diez minutos, y para seguir contando hay que volver a entrar.
- **Macro Snake** es código del equipo, no carga nada de fuera y usa la sesión para guardar los récords.
- **Lo que los juegos guardan en el navegador.** Hoy, lo que guarda cada juego, como sus partidas, queda
  a nombre de la web. Si el juego se abre desde otro sitio, no lo ve. 89 de los 107 juegos llevan un
  motor que guarda: 46 emuladores (Pokémon, Mario...), 32 de Flash y 11 de Unity. En las cuatro semanas
  hasta el 09/10, sin contar nombres, los jugaron:

  | Motor | Personas | Con una hora o más en un mismo juego | Horas |
  |---|---|---|---|
  | Emuladores | 45 | 12 | 868 |
  | Flash | 54 | 16 | 353 |
  | Unity | 41 | 11 | 269 |
  | Otros de HTML5 | 34 | 10 | 477 |

  Quien juega a varios motores sale en varias filas. En total son 84 personas distintas, y 27 de ellas
  pasaron una hora o más en algún juego.

  El sitio, por su parte, guarda sus cosas en `localStorage` y no usa IndexedDB.

## Aclaraciones

### Sesión 2026-10-09

- P: Lo que cada juego guarda en el navegador no se verá desde la dirección de los juegos. ¿Se pasa
  solo, o se pierde avisando antes? → R: Se pasa solo, la primera vez que se abre cada juego después del
  cambio, nunca con la sesión ni con lo que guarda el sitio (Historia 4, RF-008).
- P: Si hace falta una dirección nueva, ¿puede Luis entrar en IONOS, donde está el dominio? → R: Sí. La
  añade él, con la guía de Claude (Dependencias).

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - Jugar sin arriesgar la cuenta (Prioridad: P1)

Mientras alguien juega a un juego de terceros, el código del juego no puede leer su sesión ni nada de lo
que el sitio guarda en su navegador, no puede tocar la página del sitio y no puede llevarla a otra
dirección.

**Por qué esta prioridad**: es el riesgo que da sentido a la spec: una cuenta, incluida la de un
administrador, por un solo juego.

**Prueba independiente**: en cada juego de terceros, desde dentro del juego, intentar leer la sesión,
tocar la página y cambiar su dirección.

**Escenarios de aceptación**:

1. **Dado** quien juega con su sesión iniciada, **cuando** el código de un juego de terceros intenta leer
   la sesión o lo que guarda el sitio, **entonces** no obtiene nada.
2. **Dado** un juego de terceros abierto, **cuando** su código intenta leer o cambiar la página que lo
   contiene, o llevarla a otra dirección, **entonces** el navegador no lo deja.
3. **Dado** un enlace a la dirección vieja de un juego de terceros en la web, **cuando** alguien lo abre,
   **entonces** el juego no se ejecuta en la web: se abre desde la dirección de los juegos.

---

### Historia 2 - Los juegos funcionan como antes (Prioridad: P1)

Cada juego que carga hoy sigue cargando y jugándose igual, con su pantalla completa, en PC y en móvil.
Macro Snake sigue guardando los récords.

**Por qué esta prioridad**: sin juegos que funcionen, el arreglo no sirve.

**Prueba independiente**: abrir cada juego antes y después, y comparar.

**Escenarios de aceptación**:

1. **Dado** un juego que hoy carga, **cuando** se abre después del cambio, **entonces** carga y responde
   igual.
2. **Dado** Macro Snake, **cuando** se termina una partida, **entonces** su récord se guarda y sale en el
   top, como hoy.
3. **Dado** un juego, **cuando** se pulsa pantalla completa, **entonces** funciona como hoy.

---

### Historia 3 - El XP y las monedas cuentan igual (Prioridad: P1)

Jugar a un juego de terceros sigue contando para el XP, el ranking, la racha y las monedas exactamente
como hoy: cuenta mientras alguien toca algo dentro del juego, y deja de contar a los tres minutos sin
nada.

**Por qué esta prioridad**: sin esto, quien juega dejaría de ganar, o tendría que salir y volver a
entrar cada diez minutos.

**Prueba independiente**: jugar, tocando y sin tocar nada, y mirar qué minutos cuentan.

**Escenarios de aceptación**:

1. **Dado** alguien que juega y toca el teclado, el ratón o la pantalla dentro del juego, **cuando** pasa
   un minuto, **entonces** cuenta, como hoy.
2. **Dado** un juego abierto sin nadie delante, **cuando** pasan tres minutos, **entonces** deja de
   contar, como hoy.
3. **Dada** otra web cualquiera, **cuando** intenta hacerse pasar por un juego para que cuente,
   **entonces** no cuenta.

---

### Historia 4 - Las partidas guardadas pasan solas (Prioridad: P2)

Lo que cada juego guardó en el navegador de quien juega, como sus partidas o sus ajustes, pasa solo a la
dirección de los juegos la primera vez que se abre ese juego después del cambio. Quien juega no tiene
que hacer nada. Lo que guarda el sitio, sesión incluida, no pasa nunca.

**Por qué esta prioridad**: no afecta a la seguridad, pero sí a quien más juega: 868 horas de emuladores
en cuatro semanas.

**Prueba independiente**: guardar partida en un juego de cada motor antes del cambio, y abrirla después.

**Escenarios de aceptación**:

1. **Dado** alguien con una partida guardada en un juego antes del cambio, **cuando** abre ese juego
   después, **entonces** la partida sigue ahí.
2. **Dado** lo que guarda el sitio en el navegador (la sesión, el usuario y lo demás), **cuando** pasan
   las partidas, **entonces** nada de eso llega a la dirección de los juegos.
3. **Dado** alguien que ya jugó en la dirección de los juegos, **cuando** vuelve a abrir el juego,
   **entonces** lo nuevo no se pisa con lo de antes del cambio.

---

### Historia 5 - Se puede probar en local, y la documentación lo cuenta (Prioridad: P3)

Quien trabaja en el sitio puede abrir los juegos en su PC con `npm run db:local`, también separados de la
sesión. La documentación cuenta dónde están los juegos, cómo se sabe que alguien juega y cómo se sirve
la dirección de los juegos, y la auditoría cierra el punto 1 cuando está en la web real.

**Por qué esta prioridad**: para que el arreglo se mantenga cuando alguien añada un juego nuevo.

**Prueba independiente**: arrancar el sitio local y abrir un juego; leer la documentación.

**Escenarios de aceptación**:

1. **Dado** el sitio local, **cuando** se abre un juego, **entonces** carga, separado de la sesión como
   en la web.
2. **Dado** un juego nuevo añadido a `html/juegos/`, **cuando** se pasan las pruebas, **entonces**
   avisan si no cumple lo que piden los demás (por ejemplo, avisar de que alguien juega).

---

### Casos límite

- **Macro Snake** se queda en la web: es código del equipo, no carga nada de fuera y necesita la sesión.
- **Los cuatro juegos de otras webs** siguen en su web, ya separados, con la regla de los diez minutos.
  Solo ganan el marco protegido de los demás: tampoco pueden llevarse la página a otra dirección.
- **Los juegos que hoy no cargan** (15 según el punto 21) siguen sin cargar: arreglarlos es otra cosa.
- **Los enlaces viejos**, de buscadores o compartidos, a `html/juegos/...`, siguen llevando al juego.
- **Un juego que escucha a la página que lo contiene o le manda mensajes**, como hacen 28 envoltorios
  hoy: lo que necesite de la página deja de estar. Al probar los juegos se mira cuáles se quejan.
- **Quien entró por `www.macroreborn.com`** tiene lo suyo guardado aparte del resto de la web: vale
  igual para las dos direcciones.
- **Lo que los juegos guardan en cookies**, si alguno lo hace, no se mira.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: El código de un juego de terceros NO DEBE poder leer la sesión ni nada de lo que el sitio
  guarda en el navegador de quien juega.
- **RF-002**: El código de un juego de terceros NO DEBE poder leer ni cambiar la página que lo contiene,
  ni llevarla a otra dirección.
- **RF-003**: La web principal NO DEBE ejecutar el código de un juego de terceros en ninguna de sus
  direcciones. Las direcciones viejas de los juegos DEBEN seguir llevando al juego, en la dirección de
  los juegos.
- **RF-004**: Cada juego que cargue antes del cambio DEBE seguir cargando después, en PC y en móvil.
- **RF-005**: El minuto de juego DEBE contar como hoy: con actividad dentro del juego en los últimos tres
  minutos, sí, y sin ella, no. Los avisos de actividad DEBEN aceptarse solo del juego abierto en la
  página, nunca de otra web.
- **RF-006**: Macro Snake DEBE seguir en la web y guardando los récords como hoy.
- **RF-007**: Los cuatro juegos de otras webs DEBEN seguir en su web y con la regla de los diez minutos,
  y DEBEN llevar el mismo marco protegido que los de terceros: no pueden llevarse la página a otra
  dirección.
- **RF-008**: Lo que cada juego guardó en el navegador DEBE pasar solo a la dirección de los juegos la
  primera vez que se abre ese juego después del cambio, sin pisar lo que ya haya allí. La sesión y lo
  demás que guarda el sitio NO DEBEN pasar nunca, y una prueba DEBE vigilarlo.
- **RF-009**: Los juegos DEBEN poder probarse en local, separados de la sesión como en la web.
- **RF-010**: Las pruebas DEBEN avisar si un juego de `html/juegos/` no cumple lo que piden los demás, y
  si un cambio vuelve a abrir los juegos en la web.
- **RF-011**: Los cambios en el servidor (una dirección nueva, su certificado y su configuración) DEBEN
  hacerse con el OK de Luis en ese momento (regla XXI). Se despliega después de unir, con su OK.
- **RF-012**: La documentación DEBE contar el cambio en cada documento que lo toca (research D15): la
  dirección de los juegos, cómo se sabe que alguien juega, la mudanza y la regla de las claves del sitio,
  cómo se prueba en local y cómo se despliega. La dirección de los juegos NO DEBE salir en los buscadores.
  La auditoría DEBE cerrar el punto 1 cuando esté en la web real.
- **RF-013**: La documentación DEBE dejar de dar por pendiente nada de Neon: Luis dijo el 09/10 que ya
  no lo tienen ni lo usan. Son los puntos 1 y 2 de lo que falta en VPS y las líneas que la spec 006 le
  añadió en VPS, CUENTAS, CONTRASENAS-EN-CLARO, la nota al 86 y el historial.
- **RF-014**: Al unirse a `main`, el historial DEBE tener su entrada.

### Entidades clave

- **Lo que guarda cada juego**: partidas, ajustes o progreso que el código de un juego deja en el
  navegador de quien juega. Hoy está a nombre de la web, mezclado con lo que guarda el sitio, sesión
  incluida. No pasa por el servidor.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Desde dentro del juego, leer la sesión no da nada en ninguno de los 107 juegos de terceros.
  Hoy la da en los 107.
- **CE-002**: Ninguno de los 107 juegos de terceros puede leer, cambiar ni mover la página que lo
  contiene. Hoy pueden los 107.
- **CE-003**: Abrir en la web la dirección vieja de cualquiera de los 107 no ejecuta el juego en la web.
- **CE-004**: Los juegos que cargan antes del cambio, medidos uno a uno en el navegador, cargan todos
  después.
- **CE-005**: En los juegos de terceros, un minuto con actividad cuenta, y tres minutos sin nada dejan de
  contar, igual que antes del cambio.
- **CE-006**: Macro Snake guarda una partida y sale en el top, como antes.
- **CE-007**: En un juego de cada motor que guarda (un emulador, uno de Flash, uno de Unity y uno de
  HTML5), una partida guardada antes del cambio sigue después. En el sitio de los juegos no aparece nada
  de lo que guarda el sitio: 0 claves.
- **CE-008**: `npm test` y la prueba de humo en verde con Node 24 y 22. La página de jugar, mirada en PC y
  en móvil.

## Supuestos

- Lo que se gana jugando (XP, monedas, ranking, récords de Macro Snake) está en el servidor y no cambia.
- Que un juego deje de poder leer la sesión no cambia lo que ve quien juega: los juegos de terceros no
  usan la sesión para nada.
- Una separación así suele necesitar una dirección propia para los juegos, por ejemplo
  `juegos.macroreborn.com`. Cuál, y cómo, lo decide el plan.

## Dependencias

- Si hace falta una dirección nueva, hay que añadir una entrada en la zona DNS del dominio, en IONOS. La
  añade Luis, que tiene acceso (lo confirmó el 09/10), con la guía de Claude.
- El servidor necesita un certificado para esa dirección, con el OK de Luis (RF-011).

## Fuera de alcance

- **La política de seguridad del contenido (punto 6)** y **una sesión que se pueda cerrar de verdad (punto
  12)**. Son la siguiente capa, y cada una va en su spec.
- **Arreglar los juegos que no cargan (punto 21)**, **la analítica de terceros de los envoltorios (punto
  62)** y **quitar el código de los juegos que ya no se usa**, como las llamadas a la página que lo
  contiene.
- **Copiar a otro sitio el código de los juegos que hoy viene de GitHub**, para no depender de esas
  cuentas. Con los juegos aparte, deja de ser un riesgo para las cuentas.

## Comprobación

### El DNS (T001, 09/10/2026)

Luis añadió en IONOS (Domains & SSL, macroreborn.com, DNS, Add record) un registro A con nombre de host
`juegos`, la IP del servidor y un TTL de una hora, sin AAAA. Comprobado desde el servidor el mismo día,
solo leyendo: el servidor de nombres de IONOS y dos resolutores públicos devuelven para
`juegos.macroreborn.com` la misma IP que para la web, que es la del propio servidor, y ningún AAAA. Nada
usa todavía esa dirección.

### Jugar sin arriesgar la cuenta, en el PC (T011, 09/10/2026)

Con el servidor local de la rama (la web en el 3301 y los juegos en el 3302):

- **Las rutas** (quickstart 3): en la web, `html/juegos/pvz.html` da 302 al 3302, que lo sirve con 200,
  `frame-ancestors` de las dos direcciones locales y `noindex`, sin `X-Frame-Options`. En el 3302,
  `/api/users` y la ruta con `..%2f` dan 404. Macro Snake sigue en el 3301.
- **Desde dentro de tres juegos de terceros** (quickstart 4), con la sesión de `demo` abierta en la web:
  Plantas vs. Zombies (Flash), Pokémon Emerald (emulador) y Baldi's Basics (Unity). El código del propio
  juego, en su marco del 3302 y con su `sandbox`, lee la sesión vacía (`null`). Al tocar
  `parent.document`, el navegador da un error de seguridad, y lo mismo al intentar llevarse la página
  con `top.location`. La página se queda en `jugar.html`.

### El XP, en el PC (T014, 09/10/2026)

Con la cuenta `demo`, en Plantas vs. Zombies abierto desde su dirección (el 3302), y Edge pulsando una
tecla dentro del juego cada 30 segundos (quickstart 6):

- **Tocando** (del segundo 14 al 194): un pulso de XP por minuto, a los 67, 127 y 187 s.
- **Sin tocar** (del 194 al 464): dos pulsos más, a los 247 y 307 s, que caen dentro de los tres minutos
  desde el último toque (a los 164 s); después, ninguno, ni a los 367 ni a los 427.
- **Al volver a tocar** (del 464 al 615): vuelven, a los 487, 547 y 607 s.
- Los ocho pulsos tuvieron respuesta 200, y el XP de `demo` pasó de 120 a 200: diez por pulso.

La primera pasada no valió: el servidor local llevaba encendido desde antes del puente (T012) y servía los
juegos sin él, así que solo salieron los dos pulsos que da abrir la página. Con el servidor reiniciado,
salió lo de arriba.
