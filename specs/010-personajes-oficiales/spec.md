# Especificación: los personajes oficiales de MacroReborn

**Rama**: `010-personajes-oficiales`
**Creada**: 2026-10-09
**Estado**: Borrador, con tres preguntas abiertas que esperan la respuesta de Bell (y del equipo)
**Tipo**: spec completa: después vienen las aclaraciones, el plan y las tareas, cada paso con el OK de Luis.
**Pedido**: Bell, en un mensaje a Luis del 09/10/2026, y Luis: «specs para todo lo que pidió Bell».

## Contexto

**Lo que pide Bell.** El equipo quedó en crear avatares nuevos, los oficiales de MacroReborn, que
reemplacen a los heredados de Macrojuegos. Ya están los personajes, sus poses y parte de sus prendas;
faltan otras. Iban a salir a principios de octubre y se retrasaron: Bell los quiere fuera **el viernes 16
o el sábado 17 de octubre como muy tarde**, para que la comunidad se entretenga durante octubre (Bell
tenía dinámicas pensadas, que van por su lado). Pide además:

- un lienzo nuevo, porque «el que usan los avatares actuales es muy pequeño y afecta la calidad de los
  nuevos»;
- una «sección de pre-publicación», que ya había propuesto antes;
- más adelante, un apartado con los personajes en fila y la historia de cada uno al pulsarlo. Por ahora
  las historias van al canal de anuncios de Discord: eso es la spec `013-galeria-de-personajes`.

Luis le preguntó el 09/10 qué quiere decir exactamente con el lienzo (si son proporciones nuevas, con un
ejemplo visual) y con la pre-publicación (si es un adelanto para todos o un sitio escondido del equipo).
Esas respuestas son las aclaraciones de abajo.

**Lo que hay hoy**, mirado el 09/10 en el código y en la documentación
([AVATARES](../../docs/referencia/AVATARES.md), [ARTE](../../docs/referencia/ARTE.md),
[TIENDA](../../docs/referencia/TIENDA.md)):

- **Seis personajes**, todos heredados de Macrojuegos: tora, cereza, fiora, max, fenglei y fengchao. El
  28/09 los llevaban 73, 39, 2, 2, 1 y 1 cuentas.
- **Un solo lienzo, de 327×504**, para todos: cada prenda se dibuja sobre él, y el panel de arte y el
  taller exigen esa medida al subir. Lo que llega con otra medida, el servidor lo encaja a ese lienzo.
- **El avatar se compone en el servidor** al guardarlo, en una sola imagen: 327×504 para el perfil, 62×96
  para las listas y la cara a 96×96 para las fotos de perfil, con un recorte de la cara medido a mano para
  cada personaje.
- **Cada prenda es de un personaje** y se vende en el Bazar por su rareza: 629 comunes del catálogo
  heredado y unas 130 del equipo de arte, de rara a legendaria. Lo comprado es de quien lo compró.
- **Ya hay borradores**: una prenda subida por el equipo no la ve nadie más hasta que se publica, y se
  puede retirar.
- **El arte no se publica** (regla XXIX): los dibujos sueltos solo los ve el equipo, con direcciones
  firmadas; el resto de la gente ve el avatar ya compuesto.

## Aclaraciones

Pendientes. Las tres marcas [NEEDS CLARIFICATION] de los requisitos se preguntaron a Bell el 09/10 (las
dos primeras) o son del equipo (la tercera). Se cierran con `/speckit-clarify` cuando lleguen las
respuestas.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - El equipo de arte prepara los personajes nuevos sin que se vean (Prioridad: P1)

El equipo de arte sube cada personaje nuevo, con su cuerpo y sus prendas, a su lienzo nuevo, y lo ve
puesto en el maniquí exactamente como lo verá la gente, ajustando lo que haga falta. Nadie fuera del
equipo lo ve hasta el día del lanzamiento.

**Por qué esta prioridad**: sin esto no hay nada que lanzar, y es lo que el equipo necesita ya para
terminar a tiempo.

**Prueba independiente**: subir un personaje de prueba con dos prendas y mirarlo desde una cuenta del
equipo y desde una cuenta normal.

**Escenarios de aceptación**:

1. **Dado** un personaje nuevo subido por el equipo, **cuando** lo mira alguien del equipo, **entonces** lo
   ve vestido en el maniquí, a la calidad de su dibujo.
2. **Dado** el mismo personaje sin publicar, **cuando** entra una cuenta normal, **entonces** no aparece
   en el editor, ni en el Bazar, ni en ningún otro sitio.
3. **Dada** una prenda que no mide el lienzo de su personaje, **cuando** se sube, **entonces** el panel lo
   dice antes de publicarla.

---

### Historia 2 - El día del lanzamiento, cualquiera puede ser un personaje nuevo (Prioridad: P1)

Desde el momento del lanzamiento, quien entra puede elegir uno de los personajes nuevos en su editor,
comprar sus prendas en el Bazar y verse en todas partes (perfil, barra de arriba, comentarios, listas,
rankings) con la calidad del dibujo.

**Por qué esta prioridad**: es el lanzamiento.

**Prueba independiente**: con el lanzamiento hecho, elegir un personaje nuevo, comprar y ponerse una de
sus prendas, y mirar el avatar en cada sitio donde sale.

**Escenarios de aceptación**:

1. **Dado** el lanzamiento, **cuando** alguien abre su editor, **entonces** puede elegir los personajes
   nuevos.
2. **Dado** un personaje nuevo con prendas puestas, **cuando** se guarda, **entonces** el avatar se ve
   nítido en el perfil, en la barra de arriba, en los comentarios y en las listas, en PC y en móvil.
3. **Dadas** las prendas de un personaje nuevo, **cuando** se abren en el Bazar, **entonces** tienen su
   rareza y su precio, como las demás.

---

### Historia 3 - Nadie pierde lo que tenía (Prioridad: P1)

Quien lleva hoy un personaje heredado, y las prendas que compró, no pierde nada sin que se haya decidido
y avisado antes.

**Por qué esta prioridad**: hay más de cien cuentas con avatar, y muchas compraron prendas con sus
monedas.

**Prueba independiente**: después del lanzamiento, mirar una cuenta con un personaje heredado y prendas
compradas.

**Escenarios de aceptación**:

1. **Dada** una cuenta con un personaje heredado, **cuando** se lanza, **entonces** su avatar y lo que
   compró quedan como decida la aclaración 3.

---

### Historia 4 - La pre-publicación (Prioridad: P2)

Lo que Bell llama «pre-publicación», en la forma que diga su respuesta (aclaración 2): un adelanto para
todos, una página con los personajes que llegan, antes de poder usarlos; o el espacio del equipo para
ajustarlos, que es la historia 1; o las dos cosas.

**Por qué esta prioridad**: ayuda a crear expectativa, pero el lanzamiento puede salir sin el adelanto.

**Prueba independiente**: según la forma elegida.

**Escenarios de aceptación**:

1. **Dado** un adelanto para todos, **cuando** alguien lo abre antes del lanzamiento, **entonces** ve los
   personajes que llegan y cuándo, sin poder ponérselos ni ver sus prendas sueltas.

---

### Casos límite

- **El arte llega tarde**: se lanza con los personajes y las prendas que estén listos; lo que falte se
  publica después, sin cambiar nada más.
- **El lanzamiento se mueve**: la fecha se cambia sin tocar el código de nuevo.
- **Un personaje sin recorte de cara**: su foto de perfil sale centrada por defecto hasta que se mide la
  suya, nunca rota ni vacía.
- **Prendas de un personaje en otro**: cada prenda sigue siendo de su personaje; no se puede poner en uno
  para el que no se dibujó.
- **El tamaño de las imágenes**: un lienzo más grande pesa más; las páginas no deben tardar más en cargar
  de forma que se note, en PC ni en móvil.
- **El arte, protegido**: los dibujos sueltos de los personajes nuevos quedan igual de protegidos que los
  de hoy (regla XXIX): el adelanto enseña imágenes compuestas, nunca las prendas por separado.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: Los personajes nuevos DEBEN dibujarse y componerse en su propio lienzo, [NEEDS
  CLARIFICATION: la medida en píxeles y la proporción del lienzo nuevo (hoy, 327×504 para todos), y si
  cada personaje tiene una pose o varias; preguntado a Bell el 09/10], y conservar la calidad de su dibujo
  en cada tamaño al que se ven.
- **RF-002**: El equipo de arte DEBE poder subir los personajes nuevos y sus prendas por el panel de arte
  y el taller, que comprueban la medida del lienzo de cada personaje.
- **RF-003**: Hasta su publicación, un personaje nuevo y sus prendas NO DEBEN verse fuera del equipo de
  arte y de los administradores.
- **RF-004**: El lanzamiento DEBE poder hacerse en un momento fijado, sin desplegar ese día, y deshacerse
  si algo sale mal.
- **RF-005**: Las prendas de los personajes nuevos DEBEN tener rareza y precio como las demás
  ([ECONOMIA](../../docs/referencia/ECONOMIA.md)).
- **RF-006**: El avatar de un personaje nuevo DEBE verse bien en todos los sitios donde sale un avatar:
  perfil, barra de arriba, comentarios, listas, rankings y foto de perfil.
- **RF-007**: Las cuentas con un personaje heredado DEBEN quedar como se decida: [NEEDS CLARIFICATION:
  ¿los personajes nuevos reemplazan a los heredados, que se retiran, o conviven con ellos? Y en cualquier
  caso, ¿qué pasa con las prendas ya compradas de los heredados? Lo decide el equipo].
- **RF-008**: La pre-publicación DEBE ser [NEEDS CLARIFICATION: un adelanto para todos con los personajes
  que llegan, el espacio escondido del equipo para ajustarlos (historia 1), o las dos cosas; preguntado a
  Bell el 09/10].
- **RF-009**: El arte de los personajes nuevos DEBE quedar protegido como el de hoy (regla XXIX).
- **RF-010**: Lo que se vea DEBE mirarse en móvil y en PC (regla XXVIII), y lo que cambie el servidor
  DEBE llevar su prueba (regla XXII).
- **RF-011**: Si cambia la base, DEBE ser con una migración, con respaldo y ensayo antes de aplicarla en
  producción (reglas XVII y XX).
- **RF-012**: AVATARES, ARTE y TIENDA DEBEN contar el lienzo nuevo y los personajes nuevos.

### Entidades clave

- **Personaje**: un cuerpo base con su lienzo, su recorte de cara y su estado (borrador o publicado).
  Hoy hay seis, todos heredados.
- **Prenda**: un dibujo de un personaje, con su capa, su rareza y su estado; quien la compra la conserva.
- **Lanzamiento**: el momento en que los personajes nuevos y sus prendas pasan de borrador a publicados.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Puestos lado a lado, el avatar compuesto de un personaje nuevo y su dibujo original no se
  distinguen en calidad al tamaño del perfil, en PC y en móvil (capturas miradas por el equipo de arte).
- **CE-002**: Antes del lanzamiento, 0 personajes o prendas nuevas se ven desde una cuenta normal.
- **CE-003**: El día del lanzamiento, los personajes nuevos se pueden elegir y sus prendas comprar sin
  desplegar nada ese día.
- **CE-004**: 0 cuentas pierden prendas compradas sin una decisión del equipo anunciada antes.
- **CE-005**: Guardar un avatar y cargar las páginas con avatares tarda, medido antes y después, como
  mucho lo que se acuerde en el plan (regla XVIII).
- **CE-006**: `npm test` y la prueba de humo, en verde con Node 22 y 24.

## Supuestos

- **«Lanzar»** es que la gente pueda elegir los personajes nuevos y comprar sus prendas. Si Bell quiere
  decir solo enseñarlos, el lanzamiento del 16 o 17 se queda en el adelanto y el resto va después.
- **El arte** lo entrega el equipo con tiempo para probarlo antes del lanzamiento: lo ideal, el martes 13
  o el miércoles 14 de octubre.
- **El texto y la fecha** del anuncio los da Bell; el aviso al entrar es la spec `009-aviso-al-entrar`.

## Dependencias y riesgos

- **Las respuestas de Bell** a las aclaraciones 1 y 2, y la decisión del equipo en la 3: sin ellas no se
  puede planificar.
- **La fecha**: es el cambio más grande de los que pidió Bell, y toca el compositor, el panel de arte, el
  taller, el editor y el Bazar. El plan dirá qué entra para el 16 o 17 y qué puede ir después.
- **La spec 008** (los juegos en su propia dirección) está a medias: se termina antes o en paralelo, sin
  que una espere a la otra.

## Fuera de alcance

- La galería con la historia de cada personaje: spec `013-galeria-de-personajes`.
- Los premios por jugar y los eventos de octubre: spec `012-premios-por-jugar`.
- Vender ranuras de avatar y el resto de lo pendiente de [AVATARES](../../docs/referencia/AVATARES.md).
