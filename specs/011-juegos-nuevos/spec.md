# Especificación: juegos nuevos, de los más pedidos

**Rama**: `011-juegos-nuevos`
**Creada**: 2026-10-09
**Estado**: Borrador, con una pregunta abierta para Bell
**Tipo**: spec completa: después vienen las aclaraciones, el plan y las tareas, cada paso con el OK de Luis.
**Pedido**: Bell, en un mensaje a Luis del 09/10/2026 («necesito incorporar nuevos juegos y optimizar las
partes visibles de la página para que la gente sepa que se anda trabajando»), y Luis: «specs para todo lo
que pidió Bell».

## Contexto

Mirado el 09/10 en el código y en la documentación:

- **El catálogo tiene 112 juegos**: 107 de terceros servidos desde la propia web, Macro Snake (el del
  equipo) y cuatro de otras webs. Cómo se añade uno lo cuenta [JUEGOS](../../docs/guias/JUEGOS.md), con
  sus cuatro formas (HTML, HTML5 completo, Flash con Ruffle, y el enlace por un intermediario para los
  que solo se dejan jugar dentro de su plataforma).
- **La comunidad ya pidió juegos**: la lista de [SUGERENCIAS](../../docs/listas/SUGERENCIAS.md) tiene 36
  (J1 a J36), y 27 siguen pendientes. Lo más pedido es la saga entera de Papa's, por tres personas: están
  Pizzeria y Freezeria, y faltan diez (J14 a J22, y el resto en J36). Transformice (J7) ya está marcado
  como imposible.
- **«Nuevo» no distingue nada**: 111 de los 112 juegos llevan la etiqueta «⭐ Nuevo» (el otro es Macro
  Snake, «Original»). Un juego añadido hoy no se distinguiría de uno de agosto.
- **La spec 008 está a medias**: lleva los juegos de terceros a su propia dirección, para que su código no
  pueda leer la sesión, y trae una herramienta que abre cada juego en el navegador, en PC y en móvil, y
  dice si carga. Los juegos nuevos entran en ese mismo sistema.

## Aclaraciones

Pendiente: la marca [NEEDS CLARIFICATION] de RF-001, para Bell. Se cierra con `/speckit-clarify`.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - Una tanda de juegos nuevos (Prioridad: P1)

Quien entra encuentra juegos que antes no estaban, de los que pidió la comunidad, y se notan como nuevos.

**Por qué esta prioridad**: es lo que se pidió, y lo que más se ve.

**Prueba independiente**: abrir el catálogo y jugar a cada juego nuevo.

**Escenarios de aceptación**:

1. **Dada** la tanda publicada, **cuando** alguien abre el catálogo, **entonces** ve los juegos nuevos con
   su portada, su categoría y su descripción.
2. **Dado** un juego nuevo, **cuando** se pulsa «Jugar», **entonces** carga y se puede jugar en PC, y en
   móvil si el juego lo permite.

---

### Historia 2 - Los juegos nuevos funcionan como los demás (Prioridad: P1)

En los juegos nuevos cuentan el XP, la racha y las monedas como en el resto, guardan las partidas si el
juego guarda, y están igual de protegidos que los demás.

**Por qué esta prioridad**: un juego que no carga, o en el que no cuenta el XP, resta más de lo que suma.

**Prueba independiente**: jugar unos minutos a cada juego nuevo con una cuenta y mirar el XP.

**Escenarios de aceptación**:

1. **Dado** un juego nuevo, **cuando** alguien juega tocando el teclado o la pantalla, **entonces** su XP
   sube como en cualquier otro juego.
2. **Dado** un juego nuevo que guarda partidas, **cuando** se vuelve a abrir, **entonces** la partida
   sigue ahí.

---

### Historia 3 - «Nuevo» quiere decir nuevo (Prioridad: P2)

La etiqueta «Nuevo» la llevan solo los juegos añadidos hace poco, y desaparece sola con el tiempo.

**Por qué esta prioridad**: es lo que hace que los juegos nuevos se noten, que es lo que pide Bell.

**Prueba independiente**: mirar el catálogo después de añadir la tanda.

**Escenarios de aceptación**:

1. **Dada** la tanda nueva, **cuando** se mira el catálogo, **entonces** solo esos juegos dicen «Nuevo».
2. **Dado** un juego añadido hace más del tiempo acordado, **cuando** se mira, **entonces** ya no lo dice.

---

### Historia 4 - La lista de sugerencias, al día (Prioridad: P3)

Cada juego pedido que se añade queda marcado en la lista de sugerencias, con su fecha; el que no se pudo
añadir, con su motivo.

**Por qué esta prioridad**: para que la comunidad vea que sus pedidos se atienden, y para no buscar dos
veces lo mismo.

**Prueba independiente**: leer la lista.

**Escenarios de aceptación**:

1. **Dada** la tanda publicada, **cuando** se lee la lista, **entonces** cada juego añadido está «Hecha»
   con su fecha, y cada uno descartado tiene su motivo (regla XXXI).

---

### Casos límite

- **Un juego que solo funciona en PC** (con teclado, sin pantalla táctil): se puede añadir, y su ficha lo
  dice, porque gran parte de la comunidad entra desde el móvil.
- **Un juego que no se encuentra en una versión jugable en la web**, o que pide su propio servidor o una
  cuenta: no entra, y la lista dice por qué.
- **Un juego con anuncios o rastreadores de terceros**: no entra así (regla XVI); se busca otra versión o
  se descarta.
- **Un juego que carga de una web ajena**: si esa web desaparece, el juego deja de funcionar (regla
  XXVI). Se prefiere servirlo desde el propio servidor cuando se pueda.
- **Una partida guardada** en un juego nuevo vive ya en la dirección de los juegos: no necesita mudanza.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: La tanda DEBE tener [NEEDS CLARIFICATION: cuántos juegos y cuáles. Por defecto, los más
  pedidos de la lista de sugerencias, empezando por la saga de Papa's; ¿Bell o el equipo tienen otros en
  mente?].
- **RF-002**: Cada juego nuevo DEBE cargar y poder jugarse en PC; en móvil, si el juego lo permite, y si
  no, su ficha DEBE decir que es solo para PC.
- **RF-003**: Cada juego nuevo DEBE tener su portada, su categoría y una descripción en español, con voseo
  (regla I), y aparecer en el mapa del sitio, como cuenta la guía de juegos.
- **RF-004**: Ningún juego nuevo DEBE traer anuncios ni rastreadores de terceros (regla XVI), ni depender
  de algo de pago (regla VII).
- **RF-005**: Los juegos nuevos DEBEN abrirse desde la dirección de los juegos, protegidos como los demás
  (spec 008), y contar el XP como los demás.
- **RF-006**: Cada juego nuevo DEBE comprobarse antes de unir, en PC y en móvil, con la herramienta de
  revisión de la spec 008, y la spec DEBE anotar el resultado.
- **RF-007**: La etiqueta «Nuevo» DEBE quedar solo en los juegos añadidos en los últimos 30 días.
- **RF-008**: La lista de sugerencias DEBE quedar al día (regla XXXI), y la guía de juegos, si el proceso
  cambia.
- **RF-009**: Al unirse a `main`, el historial DEBE tener su entrada; se despliega después, con el OK de
  Luis (regla XXI).

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Todos los juegos de la tanda cargan en PC según la herramienta de revisión, y en móvil los
  que lo permiten.
- **CE-002**: 0 juegos nuevos con anuncios o rastreadores de terceros.
- **CE-003**: Los 112 juegos de antes siguen cargando igual que antes de la tanda (la herramienta, antes y
  después).
- **CE-004**: En el catálogo, «Nuevo» lo llevan solo los juegos de los últimos 30 días (hoy, 111 de 112).
- **CE-005**: `npm test` y la prueba de humo, en verde con Node 22 y 24.

## Supuestos

- **La primera tanda** es de unos diez juegos, para que salga pronto; las siguientes, con el mismo
  proceso.
- **Los 30 días** de «Nuevo» se pueden cambiar en el plan si el equipo prefiere otro plazo.
- Los juegos se buscan en versiones que ya circulan para jugar en la web, como el resto del catálogo.

## Dependencias

- **La spec 008** se une antes: así los juegos nuevos entran ya protegidos, y sus pruebas, que cuentan los
  juegos del catálogo, se ajustan una sola vez.
- **La spec 009** (el aviso al entrar) puede anunciar la tanda cuando salga.

## Fuera de alcance

- Juegos propios del equipo (Macro Originals) y juegos que publique la comunidad (sugerencia 9).
- Juegos que necesitan su propio servidor o una cuenta, como Transformice (J7).
- Cambiar los premios por jugar: spec `012-premios-por-jugar`.
