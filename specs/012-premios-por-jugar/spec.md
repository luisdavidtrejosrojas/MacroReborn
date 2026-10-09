# Especificación: más premios por jugar, monedas y XP

**Rama**: `012-premios-por-jugar`
**Creada**: 2026-10-09
**Estado**: Borrador, con dos preguntas abiertas para Luis
**Tipo**: spec completa: después vienen las aclaraciones, el plan y las tareas, cada paso con el OK de Luis.
**Pedido**: Bell, en un mensaje a Luis del 09/10/2026: «recomiendo enfocarse en la bonificación de los
juegos; dinero y experiencia. Para el tema este de ganar más dinero del poco que se puede ganar». Y Luis:
«specs para todo lo que pidió Bell».

## Contexto

**Lo que se gana hoy**, desde la economía nueva del 04/10/2026
([ECONOMIA](../../docs/referencia/ECONOMIA.md)):

- **Jugar**: de 10 a 30 monedas al azar cada 10 minutos de juego; enteras hasta los 120 minutos del día,
  la mitad hasta los 240, y después nada. Y 10 de XP por cada minuto con alguien delante.
- **Además**: la racha (5 por día seguido, hasta 35), subir de nivel (15 por nivel), las misiones (de 31 a
  75 las diarias, de 175 a 375 las semanales) y los logros.
- **Lo que da al día**, según la simulación de ese día: quien juega 10 minutos tres días por semana saca 17
  monedas al día; quien juega media hora todos los días, unas 200. Una prenda épica cuesta 1.400 y una
  legendaria 6.000: para esa media hora diaria, una semana y un mes.

Esas cifras se eligieron a propósito, simulando 1.152 combinaciones, para que una épica esté a una semana
y una legendaria a un mes del jugador de referencia. Para quien juega poco, sigue siendo poco: es lo que
dice Bell.

**Lo que ya pidió la comunidad**, en [SUGERENCIAS](../../docs/listas/SUGERENCIAS.md): más monedas, como
en el Macro viejo (la 44, hecha en parte con la economía nueva); eventos y torneos para ganar monedas (la
52, también de Bell); más XP en los juegos de Pokémon (la 8); y ver el progreso de nivel mientras se
juega (la 7).

**Y lo que viene**: los personajes oficiales salen el 16 o 17 de octubre (spec
`010-personajes-oficiales`), con sus prendas a la venta, y Bell tiene dinámicas pensadas para octubre.
Un premio extra esos días le da a la gente monedas para estrenarlas.

## Aclaraciones

Pendientes: las dos marcas [NEEDS CLARIFICATION] de los requisitos, para Luis, que decidió la economía del
04/10. Se cierran con `/speckit-clarify`.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - Días de premio doble (Prioridad: P1)

El equipo programa un evento con fecha de inicio y de fin, por ejemplo el fin de semana del lanzamiento.
Mientras dura, jugar da más monedas y más XP, y toda la web lo dice: cuánto da, hasta cuándo.

**Por qué esta prioridad**: es lo que más se nota con menos riesgo: no toca la economía de siempre, y sirve
para las dinámicas de octubre de Bell.

**Prueba independiente**: programar un evento corto y jugar dentro y fuera de él.

**Escenarios de aceptación**:

1. **Dado** un evento en curso, **cuando** alguien juega, **entonces** gana más monedas y más XP que fuera
   de él, en la medida del evento.
2. **Dado** un evento en curso, **cuando** alguien entra en la web, **entonces** ve que hay premio extra y
   hasta cuándo.
3. **Dado** un evento terminado, **cuando** alguien juega, **entonces** gana lo de siempre.

---

### Historia 2 - Juegos destacados de la semana (Prioridad: P2)

Cada semana, unos pocos juegos dan un premio extra, y se ven destacados en el catálogo. Ayuda a descubrir
juegos, también los nuevos (spec `011-juegos-nuevos`).

**Por qué esta prioridad**: suma variedad sin subir todo, pero el evento de la historia 1 ya cubre lo
urgente.

**Prueba independiente**: jugar a un juego destacado y a uno que no lo es.

**Escenarios de aceptación**:

1. **Dado** un juego destacado esa semana, **cuando** alguien lo juega, **entonces** gana el extra.
2. **Dado** el catálogo, **cuando** se mira, **entonces** los destacados se distinguen y dicen cuánto dan.

---

### Historia 3 - Ver lo que se gana mientras se juega (Prioridad: P3)

Mientras juega, cada persona ve su nivel, cuánto le falta para el siguiente y lo que lleva ganado hoy, sin
salir del juego (sugerencia 7).

**Por qué esta prioridad**: hace que el premio se sienta, pero no cambia cuánto se gana.

**Prueba independiente**: jugar unos minutos y mirar el progreso.

**Escenarios de aceptación**:

1. **Dado** alguien jugando con sesión, **cuando** le llega un pulso de XP, **entonces** ve su progreso al
   día, sin tapar el juego.

---

### Historia 4 - Lo que se gana siempre (Prioridad: P3)

Si Luis lo decide (aclaración 1), lo que se gana de forma normal sube, simulándolo antes como el 04/10.

**Por qué esta prioridad**: cambia lo que se decidió hace cinco días con una simulación; solo si los
eventos no bastan.

**Prueba independiente**: la simulación, antes y después.

**Escenarios de aceptación**:

1. **Dado** un cambio de lo que se gana siempre, **cuando** se aplica, **entonces** la documentación
   cuenta los números nuevos y por qué, y nadie pierde nada de lo que ya tenía.

---

### Casos límite

- **Un evento y un juego destacado a la vez**: los premios no se multiplican sin fin; hay un máximo.
- **Los topes del día** (120 y 240 minutos): lo que diga la aclaración 2.
- **Un evento mal programado** (fin antes que inicio, o un premio desmesurado): no se acepta.
- **Varias pestañas o trucos**: el servidor sigue contando un minuto por minuto, como hoy; el evento
  multiplica lo que se gana, no los minutos.
- **Una cuenta baneada o suspendida**: no gana, como hoy.
- **El cambio de día durante un evento**: se cuenta igual que hoy.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: Los administradores DEBEN poder programar un evento de premio: nombre, inicio, fin y cuánto
  multiplica las monedas y el XP de jugar, sin desplegar.
- **RF-002**: El servidor DEBE aplicar el premio del evento (regla XXIII); el navegador solo lo enseña.
- **RF-003**: Mientras dure un evento, la web DEBE decir que lo hay, cuánto da y hasta cuándo, en PC y en
  móvil.
- **RF-004**: Los juegos destacados de la semana DEBEN dar su extra y distinguirse en el catálogo.
- **RF-005**: Los premios DEBEN tener un máximo, también cuando se suman un evento y un juego destacado:
  [NEEDS CLARIFICATION: cuánto da un evento (por ejemplo, el doble) y si respeta los topes del día de 120
  y 240 minutos o los amplía].
- **RF-006**: Lo que se gana siempre DEBE [NEEDS CLARIFICATION: quedarse como se decidió el 04/10, con los
  eventos como única subida, o subir también; y en ese caso, cuánto, simulándolo antes como ese día].
- **RF-007**: El equipo DEBE poder saber cuántas monedas y cuánto XP repartió cada evento.
- **RF-008**: Mientras se juega, cada persona DEBE poder ver su nivel, lo que le falta para el siguiente y
  lo que lleva ganado hoy, sin tapar el juego (historia 3).
- **RF-009**: Todo cambio de la base DEBE ir en una migración, con respaldo y ensayo antes de aplicarla
  en producción (reglas XVII y XX), y lo que cambie el servidor, con su prueba (regla XXII).
- **RF-010**: [ECONOMIA](../../docs/referencia/ECONOMIA.md) DEBE contar los eventos, los destacados y sus
  límites; y la lista de sugerencias, las que se atienden (regla XXXI).

### Entidades clave

- **Evento de premio**: nombre, inicio, fin, multiplicador de monedas y de XP, y lo que repartió.
- **Juego destacado**: un juego, la semana y su extra.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Con un evento del doble, el mismo tiempo de juego da el doble de monedas y de XP de jugar,
  dentro del máximo (prueba).
- **CE-002**: Fuera de un evento, se gana exactamente lo de hoy (prueba).
- **CE-003**: Ninguna combinación de evento y juego destacado pasa del máximo (prueba).
- **CE-004**: El aviso del evento se ve en PC y en móvil (capturas).
- **CE-005**: Se puede decir cuánto repartió un evento terminado.
- **CE-006**: `npm test` y la prueba de humo, en verde con Node 22 y 24.

## Supuestos

- **Los eventos los programan los administradores** desde su panel, sin desplegar.
- **El primero**, si Luis quiere, el fin de semana del lanzamiento de los personajes (del 16 al 18 de
  octubre), para las dinámicas de octubre de Bell.
- **Los juegos destacados** los eligen los administradores, unos pocos por semana.

## Dependencias

- **La decisión de Luis** en las aclaraciones: la economía del 04/10 es suya.
- **La spec 010** (los personajes): el primer evento tiene más sentido con sus prendas a la venta.

## Fuera de alcance

- Torneos y concursos: van por Discord (sugerencia 52), salvo el premio en monedas que el equipo dé a
  mano.
- Las pilas de experiencia y el rasca y gana del Bazar viejo (sugerencia 43).
- Cambiar los precios de las prendas.
