# SUGERENCIAS — lo que pidió la comunidad

Todas las ideas del canal viejo de sugerencias de Discord
(`╭ᰍ📌﹒sugerencias`), del 12 de agosto al 29 de septiembre de 2026. Se
exportó el 29/09/2026 con DiscordChatExporter, antes de que el canal
desapareciera: hoy en su lugar está el foro `ᨳଓ．．sugerencias`, que esta
lista **no** incluye todavía.

Son 452 mensajes de 19 personas. La mayoría es charla (partidas de
MOBA, bromas, un reporte de broma); aquí está cada idea concreta, una
por fila, con lo que hay hoy en la web (revisado contra el código el
05/10/2026) y una recomendación para decidir.

Es una lista de trabajo, como `docs/listas/AUDITORIA.md`: se va decidiendo una
por una y se marca aquí.

---

## Cómo se usa

**Decidir algo:** se cambia el Estado y se apunta la fecha y el motivo en
su detalle. Nunca se borra una fila ni se cambia su número, aunque se
descarte: una fila descartada con su motivo evita volver a discutirla.

**Añadir algo nuevo** (por ejemplo, lo del foro nuevo): al final de su
tabla, con el siguiente número libre.

**Las capturas y la exportación completa** están en
`sugerencias-discord/`, fuera de git: llevan nombres, avatares y
mensajes de la comunidad, igual que `datos-locales/`. Viajan a Drive con
la carpeta. `sugerencias-discord/mensajes.txt` tiene los 452 mensajes en
texto, en orden, para buscar una cita.

**Lo que pasa a ser trabajo** se apunta donde toque (`AUDITORIA.md`,
`TIENDA.md`, `JUEGOS.md`...) y aquí se deja el estado.

---

## Estados

Cada sugerencia tiene uno. Agrupados por momento:

| Grupo | Estado | Qué quiere decir |
|---|---|---|
| Sin decidir | `Pendiente` | Nadie la ha decidido todavía |
| | `Por confirmar` | Falta un dato: mirarlo en la web, probarlo o preguntar a quien la pidió |
| Ya está | `Hecha` | Ya funciona en la web |
| | `Hecha en parte` | Una parte está; lo que falta se dice en su detalle |
| | `Ya existía` | Estaba cuando se pidió: no se encontró o no se entendió |
| Se hará | `Aprobada` | Decidido hacerla, sin fecha |
| | `Planeada` | Tiene plan o fecha, o ya se anunció |
| | `En curso` | Alguien está en ello |
| Más adelante | `Futuro` | Buena idea, pero no ahora |
| | `En espera` | Depende de otra cosa que todavía no existe (se dice cuál) |
| No se hará | `Descartada` | No encaja con MacroReborn (con el motivo) |
| | `Imposible` | No se puede, por técnica o por derechos |
| | `Duplicada` | Es la misma que otra (se dice cuál) |
| | `Fuera de la web` | Es del Discord o de otra cosa, no del sitio |

Además del estado, dos campos que cruzan a todos:

- **Área:** Juegos, Avatares, Perfil, Cuenta, Comentarios, Comunidad,
  Economía, Moderación, Interfaz, Eventos, Discord.
- **La haría:** quién tendría que mover ficha. Programación, Arte,
  Contenido (meter juegos), Moderación, Discord o Equipo (cuando antes
  hay que decidir algo entre todos).

---

## Resumen al 05/10/2026

| | Funciones (1-52) | Juegos (J1-J36) |
|---|---|---|
| Hecha | 14 | 7 |
| Hecha en parte | 6 | 1 |
| Planeada | 1 | - |
| Por confirmar | 5 | 1 |
| Fuera de la web | 1 | - |
| Pendiente | 25 | 27 |

---

## Funciones

| # | Estado | Área | Qué se pide | Pedida por | Hoy | La haría |
|---|---|---|---|---|---|---|
| 1 | Pendiente | Juegos | Una categoría o filtro de juegos Flash | Clover (10/09) | No existe: las categorías son géneros | Programación |
| 2 | Pendiente | Juegos | Filtrar juegos por PC o móvil | Ram (17/08) | No existe | Programación + Contenido |
| 3 | Hecha | Juegos | Filtrar juegos por categoría | 1234478 (16/08) | `juegos.html?categoria=` | - |
| 4 | Hecha | Juegos | Botón de pantalla completa | Cambita.Sc (16/08), 1234478 (17/08) | Botón en `js/jugar.js` | - |
| 5 | Hecha | Juegos | Jugar desde últimos jugados o favoritos | 1234478 (12/08) | En el perfil | - |
| 6 | Pendiente | Juegos | Un apartado para recomendar juegos | Ram (17/08) | No existe en la web | Equipo |
| 7 | Pendiente | Juegos | Ver el progreso de nivel mientras se juega | Ram (09/09), Lucass | Solo en el perfil | Programación |
| 8 | Pendiente | Juegos | Más XP en los juegos de Pokémon | Jerez (14/08) | No | Equipo |
| 9 | Pendiente | Juegos | Que la gente pueda publicar sus propios juegos | SuiryBell (15/08) | Solo los Macro Originals del equipo | Equipo |
| 10 | Pendiente | Juegos | Aprender de Macroplay (juegos propios en 3D) | SoyDegurime (19/08) | Idea | Equipo |
| 11 | Hecha | Avatares | Varios avatares guardados y poder votarlos | 1234478 (12/08) | Galería de 6 diseños con 👍/👎 | - |
| 12 | Pendiente | Avatares | Poder ponerse un diseño guardado de la galería | Lucass (15/09) | Solo "Reemplazar" y "Quitar" | Programación |
| 13 | Por confirmar | Avatares | Que el círculo de los comentarios muestre la cabeza | SuiryBell (12/08), 1234478 (12/08) | Arreglado en parte el 13/08 | Programación |
| 14 | Pendiente | Avatares | Mascotas detrás del avatar, no encima | Raicireth (17/08), KYOTO | La mascota es la última capa | Arte + Programación |
| 15 | Hecha | Avatares | Una capa de pelo de atrás | SuiryBell (15/08, 08/09, 15/09) | Desde el 04/10/2026 | - |
| 16 | Hecha | Avatares | Una tienda de prendas aparte de lo que ya se tiene | SuiryBell (15/08) | El Bazar | - |
| 17 | Pendiente | Avatares | Usar una imagen propia en vez del avatar desde nivel 100 o 200 | SuiryBell (15/08) | No: se rechazó entonces | Equipo |
| 18 | Pendiente | Avatares | Unas prendas concretas (con foto) | Aura_ (21/08) | Sin hacer | Arte |
| 19 | Por confirmar | Avatares | Unos guantes salen en Accesorios en vez de en Guantes | Raicireth (17/09) | Sin comprobar | Arte |
| 20 | Pendiente | Avatares | Marcos por nivel: hierro, oro, diamante y más | ValentinCARP (07/09) | Hay capa de borde, no marcos por nivel | Arte + Programación |
| 21 | Pendiente | Avatares | Un apartado para recomendar avatares | Ram (17/08) | No existe | Equipo |
| 22 | Pendiente | Perfil | Elegir género | ✿ ꪀﺃ᥅ (14/08) | No | Programación |
| 23 | Pendiente | Cuenta | Cambiarse el nombre de usuario | SuiryBell (17/08) | No | Programación |
| 24 | Pendiente | Cuenta | Recuperar la contraseña olvidada | Raicireth (17/08), SuiryBell | No | Programación |
| 25 | Hecha | Cuenta | Botón de eliminar cuenta | SuiryBell (14/08) | Funciona | - |
| 26 | Pendiente | Perfil | Estado como en Discord: en línea, invisible, ausente, no molestar | SuiryBell (15/08) | Solo "en línea" automático | Programación |
| 27 | Por confirmar | Perfil | Poder contraer la información de arriba del perfil | 🌙Naay (15/09), valen | Sin comprobar | Programación |
| 28 | Pendiente | Perfil | Biografía con formato e imágenes enlazadas | SoyDegurime (15/08) | Texto plano | Programación |
| 29 | Hecha en parte | Interfaz | Modo claro y perfil como en el Macrojuegos viejo | 1234478 (16/08) | Hay modo claro y tarjeta clásica | Programación |
| 30 | Pendiente | Avatares | Nivel mínimo para crear el avatar | ✿ ꪀﺃ᥅ (17/08) | No | Equipo |
| 31 | Hecha | Comentarios | La caja de escribir arriba, sin bajar hasta el final | 1234478 (12/08) | Arriba desde el 12/08 | - |
| 32 | Hecha en parte | Comentarios | Un límite de largo en los comentarios | ✿ ꪀﺃ᥅ (14/08) | El chat corta en 200; los comentarios, sin ver | Programación |
| 33 | Pendiente | Comentarios | Nivel mínimo para comentar | ✿ ꪀﺃ᥅ (17/08) | No | Equipo |
| 34 | Pendiente | Comentarios | Stickers en los comentarios | ✿ ꪀﺃ᥅ (14/08) | No | Arte + Programación |
| 35 | Hecha en parte | Comentarios | Reacciones a los comentarios | ✿ ꪀﺃ᥅ (14/08) | Hay "me gusta" (corazón) | Programación |
| 36 | Hecha | Comunidad | Que la campanita vuelva a 0 al ver los avisos | Đarkus (12/08) | Desde el 12/08 | - |
| 37 | Hecha | Comunidad | Que las solicitudes enviadas vayan aparte | ✿ ꪀﺃ᥅ (13/08) | Lista "Solicitudes enviadas" | - |
| 38 | Hecha | Comunidad | Que bloquear usuarios bloquee de verdad | Samchrius (13/08) | Arreglado el 13/08 | - |
| 39 | Hecha | Comunidad | Comunidad como la del Macro original | SuiryBell (14/08) | Conectados, registrados, ranking, actividad, buscador | - |
| 40 | Por confirmar | Comunidad | Que la sección Comunidad sea más sencilla | SuiryBell (08/09) | Cambió el 03/10 | Equipo |
| 41 | Por confirmar | Interfaz | Quitar el botón de Ranking, que repite Comunidad | SuiryBell (14/08) | Siguen las dos páginas | Programación |
| 42 | Hecha | Interfaz | Barra de arriba con avatar, nombre, nivel y experiencia | SuiryBell (08/09) | Barra nueva del 03/10 | - |
| 43 | Hecha en parte | Economía | El Bazar viejo: ropa, pilas de experiencia, rasca y gana | 1234478 (18/08) | Ropa sí; pilas y rasca no | Equipo |
| 44 | Hecha en parte | Economía | Más monedas, como en el Macro viejo | Lucass (15/09) | Economía nueva del 04/10 | Equipo |
| 45 | Hecha | Economía | Monedas al subir de nivel, más cuanto más alto | 🌙Naay (25/09) | 15 × el nivel nuevo, desde el 04/10 | - |
| 46 | Planeada | Economía | Pasar monedas a amigos, tras unos días de amistad | Lucass (16/09) | Anunciado el 04/10 | Programación |
| 47 | Pendiente | Economía | Logros únicos, que solo tenga quien los consiga | ✿ ꪀﺃ᥅ (14/08) | Hay logros, no exclusivos | Equipo |
| 48 | Pendiente | Eventos | Eventos temporales con premios exclusivos | ✿ ꪀﺃ᥅ (14/08) | Hay retos y misiones, no eventos | Equipo |
| 49 | Pendiente | Moderación | Los corazones (3 vidas) del Macro viejo | ✿ ꪀﺃ᥅ (14/08) | No | Equipo |
| 50 | Hecha en parte | Moderación | Sanción por groserías: días sin jugar ni comentar | ✿ ꪀﺃ᥅ (14/08) | Sanciones desde el 28/09, sin filtro automático | Moderación |
| 51 | Fuera de la web | Discord | Un canal para memes | KYOTO (20/08) | Se usa el de multimedia | - |
| 52 | Pendiente | Eventos | Eventos y torneos para ganar monedas | Cambita.Sc (19/08), Jerez, SuiryBell | No | Discord + Equipo |

---

## Juegos pedidos

| # | Estado | Juego | Pedido por | Nota |
|---|---|---|---|---|
| J1 | Pendiente | Skytrip | Lucass (12/08) | No está |
| J2 | Hecha en parte | Papa's Louie, toda la saga | Lucass (12/08), Samchrius, ✿ ꪀﺃ᥅ | Están Pizzeria y Freezeria; los demás son J14-J22 y J36 |
| J3 | Hecha | Earn to Die | Lucass (12/08) | Está |
| J4 | Hecha | Crazy Zombie | Lucass (12/08) | Están el 8 y el 9; tardan en cargar |
| J5 | Pendiente | Sports Heads Football | Lucass (12/08, en captura) | No está |
| J6 | Pendiente | Tomb of the Mask | Lucass (12/08, en captura) | No está; es de móvil, hay que buscar versión web |
| J7 | Pendiente | Transformice | Lucass (12/08), SuiryBell (18/08) | Recomendación: Imposible (ver abajo) |
| J8 | Por confirmar | Pokémon Tower Defense, versión nueva | Jerez (12/08) | Está; falta saber qué versión quería |
| J9 | Pendiente | School Flirt | Lucass (15/08) | No está |
| J10 | Hecha | BitLife (en español) | Lucass (15/08) | Está; sin comprobar si en español |
| J11 | Pendiente | Zombie Trapper | Lucass (15/08) | No está |
| J12 | Pendiente | Crazy Taxi | Lucass (15/08) | No está |
| J13 | Pendiente | Ace Gangster Taxi | Lucass (15/08) | No está |
| J14 | Pendiente | Papa's Cheeseria | Lucass (15/08) | No está |
| J15 | Pendiente | Papa's Pancakeria | Lucass (15/08) | No está |
| J16 | Pendiente | Papa's Bakeria | Lucass (15/08) | No está |
| J17 | Pendiente | Papa's Sushiria | Lucass (15/08) | No está |
| J18 | Pendiente | Papa's Pastaria | Lucass (15/08) | No está |
| J19 | Pendiente | Papa's Wingeria | Lucass (15/08) | No está |
| J20 | Pendiente | Papa's Cupcakeria | Lucass (15/08) | No está |
| J21 | Pendiente | Papa's Hot Doggeria | Lucass (15/08) | No está |
| J22 | Pendiente | Papa's Burgeria | Lucass (15/08) | No está |
| J23 | Pendiente | Jetpack Joyride | Lucass (15/08) | No está |
| J24 | Hecha | Subway Surfers | Lucass (15/08) | Está |
| J25 | Pendiente | Doc HoneyBerry Puppy Surgery | Lucass (15/08) | No está |
| J26 | Pendiente | Wonder High Dress-Up | Lucass (15/08) | No está |
| J27 | Pendiente | My Cozy Home | Lucass (15/08) | No está |
| J28 | Pendiente | Jacksmith | Lucass (15/08) | No está |
| J29 | Pendiente | Doctor Hero | Lucass (15/08) | No está |
| J30 | Pendiente | Fantasy Sandbox | Lucass (15/08) | No está |
| J31 | Pendiente | Prison Punch | Lucass (15/08) | No está |
| J32 | Hecha | I Am Hall Security | Lucass (15/08) | Añadido el 16/08 |
| J33 | Hecha | PokePath TD | Jerez (15/08) | Está |
| J34 | Pendiente | PokeRogue | Jerez (15/08) | No está; ver abajo |
| J35 | Hecha | Superfighters | Cambita.Sc (16/08) | Añadido el 16/08 |
| J36 | Pendiente | El resto de Papa's (Taco Mia, Donuteria, Scooperia...) | Samchrius y ✿ ꪀﺃ᥅ ("todas las sagas") | No están |

**Sobre los juegos en general.** El 15/08 SoyDegurime contestó a la lista
de Lucass: "Todos esos se pueden añadir. Es conseguir los archivos Flash,
instalar el emulador y ya". El proceso está en `docs/guias/JUEGOS.md`. Antes
de cada uno hay que comprobar que exista una versión jugable en la web
(Flash con Ruffle, HTML5 o emulador).

- **Transformice (J7):** no corre con Ruffle (lo dijo Samchrius el
  12/08), y además es un juego en línea que sigue vivo en su propio
  servidor: no hay archivo que meter. Como mucho, un enlace a su web.
- **PokeRogue (J34):** es un juego en línea con cuentas propias y
  personajes de Nintendo. Meterlo dentro tiene el mismo problema que
  Transformice, y además el de los derechos.
- **Tomb of the Mask (J6):** es una app de móvil; puede que exista una
  versión web oficial, hay que buscarla.

---

## Detalle de cada función

La recomendación es mía (Claude, 05/10/2026), para tener un punto de
partida; decide el equipo.

### 1. Filtro de juegos Flash
- **Pedida por:** Clover, 10/09: "yo vengo por los juegos flash, no para
  ver en el primer puesto a brawl". Lucass le contestó que ya hay
  algunos; Clover insistió en que quiere un filtro, no buscarlos. 🌙Naay
  dijo que vendrán más cambios en los juegos.
- **Hoy:** las categorías de `js/datos-juegos.js` son géneros
  (Plataformas, RPG, Acción...). Ningún campo dice si un juego es Flash.
- **Recomendación:** aprobar. Es lo que trae a los veteranos de Macro, y
  sale barato: los Flash se pueden encontrar mirando qué páginas de
  `html/juegos/` cargan Ruffle, sin marcarlos a mano.
- **Esfuerzo:** 1-2 h.

### 2. Filtrar por PC o móvil
- **Pedida por:** Ram, 17/08, "en caso que un juego no sea compatible
  para ambos".
- **Hoy:** no existe, y el catálogo no sabe qué juego funciona en móvil.
- **Recomendación:** futuro. Hay que probar los 112 juegos en un móvil y
  marcarlos uno por uno. Un paso intermedio: avisar en la ficha "necesita
  teclado".
- **Esfuerzo:** 2 h de código y una tarde de pruebas.

### 3. Filtrar por categoría — Hecha
- **Pedida por:** 1234478, 16/08.
- **Hoy:** `juegos.html?categoria=Acción`, etc., y la portada enlaza las
  categorías.

### 4. Pantalla completa — Hecha
- **Pedida por:** Cambita.Sc, 16/08; 1234478, 17/08, porque un juego que
  no era ni Ruffle ni emulador no la tenía.
- **Hoy:** botón "Pantalla completa" en `js/jugar.js`, para cualquier
  juego.

### 5. Jugar desde últimos jugados o favoritos — Hecha
- **Pedida por:** 1234478, 12/08. Samchrius respondió esa noche: "Tus
  peticiones fueron escuchadas y han sido aplicadas".
- **Hoy:** el perfil tiene "Tu actividad de juego" y "Tus favoritos", con
  los juegos para abrir.

### 6. Apartado para recomendar juegos
- **Pedida por:** Ram, 17/08.
- **Hoy:** no existe en la web. En Discord está el foro de sugerencias.
- **Recomendación:** fuera de la web por ahora: el foro ya hace eso.
  Hacerlo en la web pide formulario, moderación y alguien que lo lea.

### 7. Ver el progreso de nivel mientras se juega
- **Pedida por:** Ram, 09/09: "en el mismo lugar donde estás jugando y
  no solo en tu perfil". Lucass: "X2".
- **Hoy:** el minuto se cuenta en `js/jugar.js`, pero la barra solo sale
  en el perfil (y ahora en la barra de arriba).
- **Recomendación:** aprobar. Una barrita de experiencia en la página del
  juego que suba con cada minuto contado motiva a seguir jugando.
- **Esfuerzo:** 1-2 h.

### 8. Más XP en los juegos de Pokémon
- **Pedida por:** Jerez, 14/08.
- **Hoy:** el servidor da 10 de XP por minuto, igual en todos los juegos
  (punto 82 de `AUDITORIA.md`).
- **Recomendación:** descartar como regla fija: un juego que da más XP
  vacía los demás y descompensa el ranking. Encaja mejor como evento
  temporal ("fin de semana Pokémon: doble XP"), ver el 48.

### 9. Que la gente publique sus propios juegos
- **Pedida por:** SuiryBell, 15/08, de parte de otra persona. Samchrius:
  "eso ya estaba"; SoyDegurime: "Me gusta esa idea... Hoy MacroReborn,
  mañana Steam 2 (broma)".
- **Hoy:** hay Macro Originals (juegos del propio equipo, como Macro
  Snake, con competición), pero nadie de fuera puede subir uno.
- **Recomendación:** futuro. Subir juegos de otros pide revisar el código
  de cada uno (seguridad), alojarlo y moderarlo. Se puede empezar
  invitando a quien quiera hacer un Macro Original con el equipo.

### 10. Aprender de Macroplay
- **Idea de:** SoyDegurime, 19/08: "En Macroplay hay juegos buenos...
  ENCIMA ES 3D". Capturas: `sugerencias-discord/capturas/10-macroplay-*.png`.
- **Recomendación:** futuro. Mirar qué hace la competencia (juegos
  propios, 3D, qué los engancha) cuando se planee lo siguiente.

### 11. Varios avatares y poder votarlos — Hecha
- **Pedida por:** 1234478, 12/08.
- **Hoy:** galería de hasta 6 diseños por persona, que los demás votan
  con 👍 o 👎 (`js/perfil-avatares-galeria.js`).

### 12. Ponerse un diseño guardado de la galería
- **Pedida por:** Lucass, 15/09: "Estaría bueno poder tener la opción de
  equipar las skins ya hechas". Captura:
  `capturas/12-galeria-sin-boton-de-usar-lucass.png`.
- **Hoy:** cada diseño guardado tiene "Reemplazar con el diseño actual" y
  "Quitar de la galería", pero no "Usar este diseño".
- **Recomendación:** aprobar. La galería ya guarda el diseño entero, así
  que es un botón que lo copia al avatar actual (con las prendas que la
  persona todavía tenga).
- **Esfuerzo:** 1-2 h.

### 13. La cabeza del avatar en el círculo de los comentarios
- **Pedida por:** SuiryBell, 12/08 ("el circulito de perfil"); 1234478,
  12/08 ("pongan que sea la cabeza del avatar"). Capturas:
  `capturas/13-circulo-del-perfil-suirybell.jpg` y
  `13-circulos-vacios-1234478.png`.
- **Hoy:** Samchrius lo arregló en parte el 13/08 (captura
  `13-arreglo-de-samchrius-13-08.jpg`): sale el avatar entero dentro del
  círculo, no la cabeza. Desde entonces el avatar se compone en el
  servidor y hay herramienta de recortes, pero solo para las
  previsualizaciones de la tienda.
- **Recomendación:** por confirmar mirando un comentario en la web. Si
  sigue saliendo el cuerpo entero, un recorte de cara por modelo (son
  seis) resuelve todos los círculos.

### 14. Mascotas detrás del avatar
- **Pedida por:** Raicireth, 17/08: "Hay algunas mascotas que tapan el
  avatar". Captura: `capturas/14-mascota-tapa-el-avatar-raicireth.jpg`
  (un zorro de nueve colas que tapa todo). KYOTO: "Severoo".
- **Hoy:** la mascota y el marco son las dos últimas capas
  (`api/_avatar-compuesto.js`), así que se pintan encima de todo.
- **Recomendación:** aprobar, pero decide Arte el cómo: o la mascota va
  siempre detrás del cuerpo, o cada mascota dice si va delante o detrás.
  También se puede limitar el tamaño de las más grandes.
- **Esfuerzo:** 1-2 h de código, más revisar las mascotas.

### 15. Pelo de atrás — Hecha
- **Pedida por:** SuiryBell, tres veces (15/08, 08/09 y 15/09: "el
  cabello completo choca con el cuerpo y las ropas").
- **Hoy:** capa "Pelo de atrás" desde el 04/10/2026, justo debajo del
  pelo.

### 16. Tienda de prendas — Hecha
- **Pedida por:** SuiryBell, 15/08 ("la tienda de los accesorios del
  avatar para que no choque con las prendas que son de nuestra
  propiedad").
- **Hoy:** el Bazar, con rarezas y precios desde el 04/10.

### 17. Imagen propia en vez del avatar desde nivel alto
- **Pedida por:** SuiryBell, 15/08.
- **Ya se habló:** Samchrius dijo que no (llenaría la base de datos con
  imágenes sin comprimir). SoyDegurime: "le quita la gracia... la gracia
  de un creador de avatar es que cada quien use su avatar", y propuso a
  cambio el 28.
- **Recomendación:** descartar, por lo mismo que se dijo entonces, y
  porque habría que moderar cada imagen subida.

### 18. Prendas pedidas por Aura_
- **Pedida por:** Aura_, 21/08, a SuiryBell y 🌙Naay. Captura:
  `capturas/18-prendas-que-pide-aura.png`: una tarjeta del Macro viejo
  con pelo blanco, parche, top negro, mangas de rejilla, medias a rayas,
  botas con hebillas y un hacha-guitarra.
- **Hoy:** SuiryBell contestó "Veremos qué podemos hacer".
- **Recomendación:** pasarlo al equipo de arte para la próxima tanda.

### 19. Guantes en Accesorios
- **Pedida por:** Raicireth, 17/09. Captura:
  `capturas/19-guantes-en-accesorios-raicireth.jpg`.
- **Hoy:** sin comprobar. La pestaña Guantes existe en el editor.
- **Recomendación:** comprobarlo en el panel de arte y moverlos si es un
  error. Cinco minutos.

### 20. Marcos por nivel
- **Pedida por:** ValentinCARP, 07/09: "los marcos para nivel, eso de
  hierro, oro y diamante, pero pongan más si pueden, eran re piolas
  esos". SuiryBell: "Estamos trabajando en ello".
- **Hoy:** el avatar ya tiene capa de borde (marco), y Liga Global tiene
  rangos como Diamante, pero ningún marco se gana por nivel.
- **Recomendación:** aprobar. Marcos que se desbloquean por nivel (por
  ejemplo hierro 25, oro 50, diamante 100) dan una razón para subir, y
  la capa ya existe.
- **Esfuerzo:** los dibujos (Arte) y 1-2 h de código.

### 21. Apartado para recomendar avatares
- **Pedida por:** Ram, 17/08.
- **Recomendación:** fuera de la web por ahora, igual que el 6: un canal
  o hilo de Discord para el equipo de arte.

### 22. Elegir género
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08. Samchrius: "Claro, pero más adelante".
- **Recomendación:** futuro. Si se hace: campo opcional en el perfil, con
  "Prefiero no decirlo".
- **Esfuerzo:** 1-2 h.

### 23. Cambiarse el nombre
- **Pedida por:** SuiryBell, 17/08 ("esas personas que les gusta
  cambiarse su nombre a cada rato (yo)"). Samchrius: "Para esto
  necesitaremos una mejor base de datos".
- **Hoy:** el nombre todavía se guarda como texto en varias tablas
  (`likes`, `moderation_log`, avisos), así que cambiarlo dejaría restos.
- **Recomendación:** futuro, con límite (una vez cada 30 días) y
  guardando el nombre anterior para la moderación.
- **Esfuerzo:** alrededor de un día.

### 24. Recuperar la contraseña
- **Pedida por:** Raicireth, 17/08 ("estuve como 3 días intentando
  acordarme"), y a SuiryBell le pasó lo mismo. Samchrius: "Pronto
  añadiremos eso... se había implementado al principio, pero se quitó".
- **Hoy:** no hay forma, y el registro no pide correo, así que no hay
  adónde mandar un enlace.
- **Recomendación:** aprobar la versión corta. Un administrador
  restablece la contraseña desde el panel, tras comprobar por Discord
  que la cuenta es de quien lo pide. El correo, más adelante.
- **Esfuerzo:** 1-2 h.

### 25. Eliminar la cuenta — Hecha
- **Pedida por:** SuiryBell, 14/08: no le dejaba. El botón existía pero
  no hacía nada (`js/perfil-eliminar-cuenta.js` lo cuenta); hoy
  funciona.

### 26. Estado como en Discord
- **Pedida por:** SuiryBell, 15/08: en línea, invisible, ausente, no
  molestar.
- **Hoy:** "en línea" sale solo, según la última conexión.
- **Recomendación:** futuro. "Invisible" y "no molestar" piden decidir
  qué deja de llegar (avisos, menciones).
- **Esfuerzo:** 3-4 h.

### 27. Contraer la información del perfil
- **Pedida por:** 🌙Naay, 15/09: "ocupa espacio en la pantalla. Para ver
  los comentarios o amigos hay que bajar siempre". Captura:
  `capturas/27-perfil-ocupa-mucho-naay.png`. valen propuso quitar la
  actividad de juego y los favoritos.
- **Hoy:** el perfil ha cambiado desde entonces; sin comprobar.
- **Recomendación:** por confirmar mirando el perfil actual en el móvil.

### 28. Biografía con formato e imágenes enlazadas
- **Idea de:** SoyDegurime, 15/08, como alternativa al 17 ("las personas
  pueden subir sus propias imágenes a Gyazo o algo así y poner el
  link").
- **Recomendación:** futuro, con cuidado: el formato sí, pero las
  imágenes de webs ajenas permiten rastrear quién visita un perfil y
  colar imágenes inapropiadas. Si se hace, con una lista de sitios
  permitidos.

### 29. Modo claro y perfil como el Macrojuegos viejo
- **Pedida por:** 1234478, 16/08, con una maqueta:
  `capturas/29-modo-claro-como-el-viejo-1234478.png`.
- **Hoy:** hay modo claro y una tarjeta de perfil "estilo clásico"
  (`js/perfil-tarjeta-clasica.js`). La disposición entera del viejo no.
- **Recomendación:** futuro, cuando se vuelva a tocar el diseño.

### 30. Nivel mínimo para crear el avatar
- **Pedida por:** ✿ ꪀﺃ᥅, 17/08, junto con el 33.
- **Recomendación:** descartar: el avatar es lo primero que engancha a
  quien llega.

### 31. La caja de comentar arriba — Hecha
- **Pedida por:** 1234478, 12/08. Samchrius: "Ya arreglé lo de
  comentarios".

### 32. Límite de largo en los comentarios
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08, "para mantenerlos más ordenados".
- **Hoy:** el chat corta en 200 caracteres. En los comentarios de
  perfil no vi límite en `api/content.js`.
- **Recomendación:** aprobar si de verdad no hay límite: 500 caracteres,
  comprobado en el servidor.
- **Esfuerzo:** 15 min.

### 33. Nivel mínimo para comentar
- **Pedida por:** ✿ ꪀﺃ᥅, 17/08, para que la gente nueva juegue antes de
  quedarse en nivel 1.
- **Recomendación:** aprobar con un nivel bajo (2 o 3). Además frena el
  spam de cuentas recién creadas, como la ráfaga de 213 de octubre.
- **Esfuerzo:** 30 min.

### 34. Stickers en los comentarios
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08, "haría la interacción más divertida".
- **Recomendación:** futuro. Pide dibujos (Arte) y encaja como premio de
  eventos (el 48).

### 35. Reacciones a los comentarios
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08.
- **Hoy:** cada comentario tiene "me gusta" con corazón.
- **Recomendación:** futuro, si se pide más.

### 36. La campanita vuelve a 0 — Hecha
- **Pedida por:** Đarkus, 12/08 ("me da toc que no se actualice").
  Samchrius: "Solucionado amigo!", esa misma noche.

### 37. Solicitudes enviadas aparte — Hecha
- **Pedida por:** ✿ ꪀﺃ᥅, 13/08, como en Macro.
- **Hoy:** lista "Solicitudes enviadas" en `js/amigos.js`.

### 38. Bloquear de verdad — Hecha
- Lo encontró Samchrius el 13/08 probando ("No bloquea como tal") y lo
  arregló ese día.

### 39. Comunidad como la del Macro original — Hecha
- **Pedida por:** SuiryBell, 14/08: usuarios activos, buscador,
  conectados, registrados, ranking y actividad de comentarios.
  Samchrius: "Ya lo añadí, todo eso".
- **Hoy:** Comunidad tiene conectados, registrados, ranking y actividad,
  y el buscador de arriba encuentra usuarios.

### 40. Comunidad más sencilla
- **Pedida por:** SuiryBell, 08/09: "no entiendo el apartado de la
  comunidad... ¿por qué no dejarlo como el Macro original o más
  sencillo?".
- **Hoy:** Comunidad cambió el 03/10.
- **Recomendación:** por confirmar: preguntarle a SuiryBell si la nueva
  le sigue pareciendo complicada.

### 41. Quitar el botón de Ranking
- **Pedida por:** SuiryBell, 14/08: "es el mismo de la comunidad".
  Samchrius: "Hoy me encargo de eso".
- **Hoy:** siguen existiendo `ranking.html` y `comunidad-ranking.html`;
  sin comprobar si la barra muestra los dos.
- **Recomendación:** por confirmar: si son lo mismo, dejar uno.

### 42. Barra de arriba con avatar, nombre, nivel y experiencia — Hecha
- **Pedida por:** SuiryBell, 08/09 ("como está se ve muy mal, al igual
  que la campanita"). Captura de cómo estaba:
  `capturas/42-barra-vieja-suirybell.jpg`.
- **Hoy:** la barra nueva del 03/10 lleva nivel y experiencia
  (`js/navbar.js`).

### 43. El Bazar viejo
- **Pedida por:** 1234478, 18/08: "comprar mi ropa, mis pilas de
  experiencia y mis rasca y gana". Samchrius: "Tu petición será
  escuchada... pero hasta ahí nomás".
- **Hoy:** la ropa sí, en el Bazar. Pilas y rasca y gana no.
- **Recomendación:**
  - **Pilas de experiencia:** descartar. Fueron justo lo que rompió los
    niveles en Macro, según contó Thomilpm en el chat el 05/10: "de
    nivel 100 como en 5 años pasaron a nivel 400, 500 o incluso 800-900
    en solo 1 año".
  - **Rasca y gana:** futuro, y solo con monedas del juego y premios de
    objetos, nunca con dinero real (azar más menores).

### 44. Más monedas
- **Pedida por:** Lucass, 15/09: en Macro "te llegaban a dar hasta 15k
  o 30k" al subir de nivel.
- **Hoy:** la economía se rehízo el 04/10 (`docs/referencia/ECONOMIA.md`): monedas
  por jugar, racha, nivel, misiones y logros, y los precios bajaron.
- **Recomendación:** dejarla como hecha en parte y revisarla en unas
  semanas con datos reales.

### 45. Monedas al subir de nivel — Hecha
- **Pedida por:** 🌙Naay, 25/09. Desde el 04/10: 15 × el nivel nuevo.

### 46. Pasar monedas a amigos
- **Pedida por:** Lucass, 16/09, solo entre amigos y tras unos días (en
  Macro eran 15 desde la amistad).
- **Hoy:** el anuncio de la economía nueva (04/10) ya dice "cuando llegue
  el sistema de transferencia de monedas". Por eso está como Planeada.
- **Recomendación:** con las reglas de Lucass y un tope diario, para que
  las multicuentas no sirvan para pasarse monedas.

### 47. Logros únicos
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08: logros que "solo pueda obtener quien
  realmente cumplió el requisito".
- **Recomendación:** futuro, junto con los eventos (48): el premio de un
  evento es el logro único.

### 48. Eventos temporales con premios exclusivos
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08: marcos, stickers, títulos o ropa que solo
  se consigan durante el evento. Samchrius: "tomaría bastante tiempo,
  pero lo tendré en cuenta".
- **Hoy:** hay retos diarios, misiones y Liga Global, pero no eventos con
  fecha.
- **Recomendación:** futuro, pero de lo más pedido en espíritu (el 8, el
  34, el 47 y el 52 caben aquí). Necesita un sistema de eventos con
  fechas, premios y arte.

### 49. Los corazones del Macro viejo
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08: "También pongan los corazones de 3
  vidas". En la tarjeta del Macro viejo se veían tres corazones (se ven
  en `capturas/18-prendas-que-pide-aura.png`), y por lo que se recordó
  en general el 05/10 se perdían con las sanciones (Alexaa, sobre una
  cuenta veterana: "nunca perdió corazones").
- **Hoy:** las sanciones existen desde el 28/09, pero solo las ve la
  cuenta sancionada.
- **Recomendación:** decisión de moderación. Ojo: enseñar corazones
  perdidos es hacer pública una sanción, justo lo que se discutió en
  general el 04-05/10 a raíz de lo de Nat15.

### 50. Sanción por groserías
- **Pedida por:** ✿ ꪀﺃ᥅, 14/08: días sin jugar ni comentar, y que afecte al
  ranking.
- **Hoy:** desde el 28/09 hay advertencias, suspensiones de 1, 3, 7 o 30
  días (no se puede escribir) y baneos (`docs/referencia/MODERACION.md`). No hay
  filtro automático de groserías.
- **Recomendación:** dejarla así. Un filtro automático da muchos falsos
  positivos en español con jerga de cada país.

### 51. Canal de memes — Fuera de la web
- **Pedida por:** KYOTO, 20/08. valen: "pueden mandar ahí", en el canal
  de multimedia.

### 52. Eventos y torneos para ganar monedas
- **Pedida por:** Cambita.Sc, 19/08: eventos en Discord, concurso de
  talentos que aporten a la página, torneo de Rocket League. Jerez
  propuso Free Fire y SuiryBell un MOBA. SoyDegurime: "El que me gane un
  1v1 en Valorant le doy 100 monedas".
- **Recomendación:** del equipo de Discord. Lo único que toca a la web es
  poder dar monedas como premio: hoy solo se puede tocando la base.

---

## Lo que no entró

- La charla del canal: partidas de Mobile Legends, bromas, el reporte de
  broma a Lucass del 19/08 y las capturas que no eran sugerencias.
- Avisos de que algo no cargaba (Crazy Zombie 8, 13/08), que se
  resolvieron solos.
- **El foro nuevo `ᨳଓ．．sugerencias`**, que sustituyó a este canal.
  Para añadirlo hay que leerlo, y el bot de lectura no tiene acceso
  desde el 30/09 (hay que prestarle el rol 👑 un momento).
