# Especificación: la galería de los personajes, con la historia de cada uno

**Rama**: `013-galeria-de-personajes`
**Creada**: 2026-10-09
**Estado**: Borrador, para después del lanzamiento de los personajes (spec 010)
**Tipo**: spec completa: después vienen las aclaraciones, el plan y las tareas, cada paso con el OK de Luis.
**Pedido**: Bell, en un mensaje a Luis del 09/10/2026: «Los avatares tienen una historia cada uno [...]
había pensado en un apartado propio donde estén alineados cada avatar para al darle click salga toda su
historia [...] pero eso lleva tiempo, por lo que por ahora se van a mandar no más en el canal de
anuncios». Y Luis: «specs para todo lo que pidió Bell».

## Contexto

Cada personaje oficial (spec `010-personajes-oficiales`) tiene su historia, escrita por el equipo. Para el
lanzamiento, las historias van al canal de anuncios de Discord, una por una; esta spec es el apartado de
la web que Bell imaginó para después: los personajes en fila y, al pulsar uno, su historia entera.

Hoy no hay nada parecido: los personajes heredados de Macrojuegos no tienen historia, y en la web solo se
ven como avatares de la gente.

## Aclaraciones

Ninguna por ahora: la forma la propuso Bell, y lo que no dijo va en los supuestos. Se revisa con Bell
antes del plan, cuando la 010 esté lanzada.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - Conocer a los personajes (Prioridad: P1)

Quien entra en la galería ve los personajes oficiales en fila, cada uno con su dibujo y su nombre. Al
pulsar uno, lee su historia entera.

**Por qué esta prioridad**: es lo que pidió Bell.

**Prueba independiente**: abrir la galería y pulsar cada personaje.

**Escenarios de aceptación**:

1. **Dada** la galería, **cuando** alguien la abre, **entonces** ve todos los personajes publicados, con
   su dibujo y su nombre, en PC y en móvil.
2. **Dado** un personaje, **cuando** se pulsa, **entonces** se lee su historia entera, y se puede volver a
   la fila.

---

### Historia 2 - De la galería al editor, y del editor a la galería (Prioridad: P2)

Quien elige personaje en su editor puede leer su historia, y desde la historia puede ir a ponérselo.

**Por qué esta prioridad**: une la historia con lo que la gente hace en la web, pero la galería sirve sola.

**Prueba independiente**: seguir los dos enlaces.

**Escenarios de aceptación**:

1. **Dado** el editor, **cuando** alguien mira un personaje, **entonces** tiene a mano su historia.
2. **Dada** una historia, **cuando** se pulsa para usar ese personaje, **entonces** se abre el editor con
   él (o se pide iniciar sesión).

---

### Casos límite

- **Un personaje sin historia todavía**: sale en la fila con «Muy pronto» y no se puede abrir vacío.
- **Una historia larga**: se lee bien en móvil, sin cortar el texto.
- **Un personaje sin publicar**: no sale en la galería.
- **El arte, protegido** (regla XXIX): la galería enseña los dibujos de presentación, nunca las prendas por
  separado.
- **Los textos** se pintan como texto, nunca como HTML (regla XXIV).

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: La web DEBE tener una galería con los personajes oficiales publicados, cada uno con su dibujo
  y su nombre.
- **RF-002**: Pulsar un personaje DEBE enseñar su historia entera, y DEBE poder volverse a la fila.
- **RF-003**: Un personaje sin historia DEBE salir como «Muy pronto», sin abrirse vacío.
- **RF-004**: Desde el editor DEBE poder leerse la historia de un personaje, y desde la historia, ir a
  usarlo.
- **RF-005**: La galería DEBE mirarse en móvil y en PC (regla XXVIII), con voseo en sus textos (regla I).
- **RF-006**: La galería NO DEBE dejar sacar los dibujos de las prendas (regla XXIX).
- **RF-007**: La galería DEBE poder encontrarse desde la barra de arriba o la portada, y en los buscadores
  ([SEO](../../docs/referencia/SEO.md)).

### Entidades clave

- **Personaje**: el de la spec 010, con su nombre, su dibujo de presentación y su historia.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Todos los personajes publicados salen en la galería, y todos los que tienen historia la
  enseñan entera, en PC y en móvil (capturas).
- **CE-002**: Desde cualquier personaje se llega al editor con él en un paso.
- **CE-003**: `npm test` y la prueba de humo, en verde con Node 22 y 24.

## Supuestos

- **Las historias y los dibujos de presentación** los da el equipo de arte; son los mismos que se publican
  en Discord.
- **Cambiar una historia** es, en esta primera versión, un cambio que se despliega; si el equipo las
  cambia a menudo, el plan puede proponer editarlas desde el panel de arte.

## Dependencias

- **La spec 010**: sin personajes oficiales publicados no hay galería.
- **Bell**: los textos de las historias.

## Fuera de alcance

- Historias de los personajes heredados de Macrojuegos.
- Comentarios, votos o reacciones en cada historia.
