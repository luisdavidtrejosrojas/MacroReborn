# Especificación: arreglos rápidos que ve todo el mundo (spec corta)

**Rama**: `005-arreglos-rapidos`
**Creada**: 2026-10-08
**Estado**: Aprobada por Luis el 08/10/2026
**Tipo**: spec corta (regla XIX): especificación, plan y tareas en esta página, aprobados una vez.
**Pedido**: Luis, 08/10/2026: el camino que eligió al retomar el proyecto («la spec 003 ahora, y
después la 004 y la 005») y el «A» para lanzar esta.

## Contexto

Siete puntos pequeños de la auditoría (del 18/09) que ve la gente. Comprobados uno a uno el 08/10, en el
código y en la web real (las cifras de producción, solo en lectura y solo recuentos):

| Punto | Qué ve la gente hoy | Por qué |
|---|---|---|
| 20, Explorar | «No hay juegos para mostrar todavía», tres veces, para todos | `js/explorar.js` busca `window.juegos`, y `js/datos-juegos.js` declara los juegos con `const`, que no cuelga de `window` |
| Nuevo, la ficha de cada juego | En los 112 juegos, «Anterior», «Más de esta categoría» y «Siguiente» se ven y llevan a «#» | El mismo: `js/juego.js` también busca `window.juegos`, y sin él no les pone destino |
| 28, los amigos en la ficha | El panel «Tus amigos jugaron este juego» no sale nunca | `portal-growth.js` espera `window.macroRebornJuegoActual`, que solo define una copia vieja de `juego.js` en la raíz que no carga ninguna página |
| 87, «Abrir Bazar» | La línea con el saldo y «Abrir Bazar» no sale nunca | Ninguna página tiene su hueco (`#mrEconomiaPerfil`). La barra ya enseña el saldo en todas las páginas, con un «+» que lleva al Bazar |
| 40, el menú en modo claro | Ya se ve bien | Lo arregló la barra nueva el 03/10 (`7bda14d`) |
| 33, el top 20 de Macro Snake | Enseña 5 personas, de las 36 que han jugado | Saca las 20 mejores partidas y después quita las repetidas, y de sus 430.062 partidas las mejores son de unas pocas personas |
| 36, el ranking semanal | 99 de las 219 cuentas, empatadas a cero, cambian de puesto al azar cada lunes; y hay 15 grupos de empate | La lista de cuentas llega sin orden fijo y el desempate, los minutos, no decide entre ceros |
| 32, guardar el avatar | Si el servidor no lo acepta, el editor se cierra igual, no dice nada y da el logro «primer avatar» | El botón no mira si se guardó |

## Aclaraciones

Ninguna: cada arreglo tiene una forma clara de hacerse, y las dos decisiones que cambian algo a la vista
(que funcionen los botones de la ficha y quitar «Abrir Bazar») están en el plan, para aprobarlas con la
spec.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - Explorar enseña juegos (Prioridad: P1)

Quien entra en Explorar ve juegos en sus secciones y las categorías para elegir.

**Por qué esta prioridad**: es una página entera vacía, para todo el mundo.

**Prueba independiente**: abrir Explorar.

**Escenarios de aceptación**:

1. **Dado** el catálogo, **cuando** se abre Explorar, **entonces** sus secciones enseñan tarjetas de
   juegos y no el aviso de vacío.

---

### Historia 2 - Los botones de cada juego llevan a algún sitio (Prioridad: P1)

En la ficha de un juego, «Anterior» y «Siguiente» llevan al juego anterior y al siguiente de su misma
categoría, y el tercero, a la categoría.

**Por qué esta prioridad**: se ven en los 112 juegos y hoy no hacen nada.

**Prueba independiente**: abrir la ficha de un juego y seguir los tres botones.

**Escenarios de aceptación**:

1. **Dado** un juego con otros en su categoría, **cuando** se abre su ficha, **entonces** los tres
   botones llevan a páginas que existen.
2. **Dado** un juego solo en su categoría, **cuando** se abre su ficha, **entonces** «Anterior» y
   «Siguiente» no se ven, y el de la categoría sí.

---

### Historia 3 - El top 20 de Macro Snake tiene 20 personas (Prioridad: P1)

El top enseña hasta 20 personas distintas, cada una con su mejor partida, de mayor a menor.

**Por qué esta prioridad**: hoy es un top de 5.

**Prueba independiente**: pedir el top con varias personas que tienen muchas partidas.

**Escenarios de aceptación**:

1. **Dada** una persona con muchas de las mejores partidas, **cuando** se pide el top, **entonces** sale
   una vez, con la mejor, y el resto del top lo llenan las demás.
2. **Dado** un empate en la mejor puntuación, **cuando** se pide el top, **entonces** va primero la
   partida más antigua.

---

### Historia 4 - El ranking no se baraja (Prioridad: P2)

Quien empata conserva su puesto respecto de los demás empatados, semana tras semana; las cuentas que
todavía no tenían puesto van detrás.

**Por qué esta prioridad**: casi la mitad de las cuentas cambian de puesto cada lunes sin haber hecho
nada, y su «+2 / −1» no significa nada.

**Prueba independiente**: recalcular el ranking dos veces sin actividad nueva.

**Escenarios de aceptación**:

1. **Dadas** varias cuentas empatadas, **cuando** se recalcula, **entonces** quedan en el orden que
   tenían.
2. **Dado** un recálculo, **cuando** se repite sin actividad nueva, **entonces** nadie cambia de puesto.

---

### Historia 5 - Si guardar el avatar falla, se dice (Prioridad: P2)

Si el servidor no acepta un avatar, el editor sigue abierto y dice por qué; el logro «primer avatar» llega
solo cuando se guarda de verdad.

**Por qué esta prioridad**: hoy se pierde el cambio sin aviso, y el logro se da igual.

**Prueba independiente**: guardar con el servidor contestando un error.

**Escenarios de aceptación**:

1. **Dado** un avatar que el servidor rechaza, **cuando** se pulsa Guardar, **entonces** el editor sigue
   abierto, sale el motivo y no se da el logro.
2. **Dado** un avatar que el servidor acepta, **cuando** se pulsa Guardar, **entonces** todo sigue como
   hoy: se cierra el editor, cambia el avatar y llega el logro si es el primero.

---

### Historia 6 - En cada juego, qué amigos lo jugaron (Prioridad: P2)

Con la sesión abierta, la ficha de un juego dice cuáles de tus amigos lo tienen entre sus últimos juegos;
sin amigos, invita a agregarlos.

**Por qué esta prioridad**: el panel existe y no sale nunca.

**Prueba independiente**: abrir la ficha con amigos que lo jugaron.

**Escenarios de aceptación**:

1. **Dados** amigos que jugaron el juego hace poco, **cuando** se abre su ficha, **entonces** salen en el
   panel, con su nombre y su nivel.

---

### Historia 7 - La auditoría queda al día (Prioridad: P3)

Lo que no sale nunca y repite lo que ya hace la barra («Abrir Bazar») se quita, lo que ya estaba arreglado
(el menú en modo claro) se cierra con su fecha, y el hallazgo nuevo queda apuntado.

**Por qué esta prioridad**: para que la lista diga la verdad.

**Prueba independiente**: leer la auditoría.

**Escenarios de aceptación**:

1. **Dada** la auditoría, **cuando** se lee, **entonces** los puntos de esta spec tienen fecha y nota.

---

### Casos límite

- Un juego solo en su categoría: «Anterior» y «Siguiente» se esconden (ya lo hace el código).
- El panel de amigos mira los últimos cinco juegos de cada amigo, para hasta 12 amigos: abre hasta 13
  peticiones más al entrar en un juego con sesión. Con la comunidad de hoy es poco; aligerarlo sería del
  punto 69.
- Sin sesión, el panel no sale; con sesión y sin amigos, invita a agregarlos.
- El top de Snake sigue sin cuentas baneadas, y con su tope de 100 si se pide más.
- En el ranking, una cuenta baneada sigue sin puesto y no cuenta para los demás.
- Guardar el avatar sin conexión o con la sesión caducada: sale un motivo general, y el editor sigue
  abierto.
- Al desplegar, cada archivo convive cinco minutos con la versión de antes de los otros sin romper nada;
  como mucho, Explorar tarda esos minutos en llenarse.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: Explorar DEBE enseñar los juegos del catálogo en sus secciones.
- **RF-002**: En la ficha de cada juego, «Anterior» y «Siguiente» DEBEN llevar al juego anterior y al
  siguiente de su categoría, y el tercer botón, a la categoría; sin otro juego en la categoría, los dos
  primeros no se ven.
- **RF-003**: Con sesión y amigos, la ficha de un juego DEBE enseñar qué amigos lo tienen entre sus
  últimos juegos, y su aviso vacío DEBE decir eso mismo.
- **RF-004**: El código que pinta el saldo con «Abrir Bazar» en un hueco que no existe DEBE quitarse, con
  su CSS.
- **RF-005**: El top de Macro Snake DEBE tener hasta 20 personas distintas, cada una con su mejor
  partida, de mayor a menor y, en empate, la partida más antigua primero; sin cuentas baneadas y sin
  hacer más lenta la página.
- **RF-006**: El ranking semanal DEBE desempatar siempre igual: a igual puntuación y minutos, conserva el
  orden de la semana anterior, y las cuentas sin puesto van detrás, de la más antigua a la más nueva.
- **RF-007**: Si el servidor no acepta un avatar, el editor DEBE seguir abierto y decir el motivo (el del
  servidor, o uno general), y el logro «primer avatar» solo se DEBE dar al guardar de verdad.
- **RF-008**: Lo que cambia el servidor (RF-005 y RF-006) DEBE llevar su prueba, y lo del navegador
  también, donde las pruebas de hoy ya saben cargar la página.
- **RF-009**: Lo que se ve DEBE mirarse en móvil y en PC antes de unir (regla XXVIII).
- **RF-010**: La auditoría DEBE cerrar con su fecha los puntos 20, 28, 32, 33, 36 y 87, el 40 con la del
  03/10, y apuntar cerrado el hallazgo de los botones (punto 92).
- **RF-011**: Se DEBE desplegar después de unir, con el OK de Luis (regla XXI).
- **RF-012**: Al unirse a `main`, el historial DEBE tener su entrada.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Explorar enseña tarjetas en sus secciones (hoy, 0 y tres avisos de vacío).
- **CE-002**: En los 112 juegos, los botones de la ficha llevan a páginas que existen (hoy, los tres a
  «#» en todos).
- **CE-003**: El top 20 de Macro Snake tiene 20 personas distintas (hoy, 5), y su consulta tarda
  milisegundos: medida en producción, 4,5 ms.
- **CE-004**: Recalcular el ranking dos veces sin actividad nueva cambia 0 puestos (hoy se barajan las
  99 cuentas a cero).
- **CE-005**: Con un guardado rechazado, el editor sigue abierto con el motivo, y se dan 0 logros por un
  guardado que falló.
- **CE-006**: Con amigos que jugaron el juego, el panel los enseña.
- **CE-007**: `npm test` y la prueba de humo, en verde con Node 22 y 24.
- **CE-008**: Explorar, la ficha de un juego (los botones y el panel de amigos) y el editor con un error,
  mirados en PC y en móvil, con capturas.

## Supuestos

- Los botones de la ficha son un diseño que ya estaba desde el 18/08 y solo fallaban por esto: cobran
  vida tal cual están.
- No hace falta subir versiones `?v=`: cada cambio funciona con la versión vieja de los demás.
- El servidor local no tiene la parte social (`/api/social`), así que el panel de amigos se mira con
  respuestas simuladas en el navegador.
- La CI de GitHub no arranca (el cupo de minutos): la comprobación es en el PC con Node 22 y 24.

## Fuera de alcance

- Las copias viejas de la raíz (`script.js`, `home-portal.js` y `juego.js`), que no carga ninguna página:
  quitarlas es otra limpieza (nota al 28 de la auditoría).
- Aligerar el panel de amigos o la página de Comunidad (punto 69).
- El resto de los bloques 2 y 3 de la auditoría.

## Plan

**Qué cambia**: `js/datos-juegos.js`, `js/juego.js`, `portal-growth.js`, `js/perfil.js`, el CSS de
«Abrir Bazar» (`css/portal-growth.css` y `css/theme-canonical.css`), `api/originales-ranking.js`,
`api/system.js`, sus pruebas y la auditoría.

**Decisiones**:

- **D1. `window.juegos`, en su origen.** `js/datos-juegos.js` cuelga el catálogo de `window`, además de
  dejarlo como hoy: arregla a la vez Explorar y los botones de la ficha. Descartado: cambiar cada sitio
  que lo lee (dos hoy, quizá más mañana).
- **D2. El juego de la ficha, expuesto por `js/juego.js`** (`window.macroRebornJuegoActual`), como hacía
  la copia vieja; `portal-growth.js` no cambia, salvo el texto de su aviso vacío, que dirá lo que mira:
  los últimos juegos de cada amigo.
- **D3. «Abrir Bazar» se quita, con su CSS.** La barra ya enseña el saldo en todas las páginas, con un
  «+» que lleva al Bazar, y esto pedía la tienda entera solo para leer el saldo. Descartado: darle un
  hueco en el perfil, que repetiría la barra.
- **D4. El top de Snake: la mejor partida de cada persona**, con el índice que ya existe por persona y
  juego. Medido en producción: 4,5 ms. Descartado: quitar las repetidas sobre todas las partidas (337 ms)
  y un índice nuevo (una migración, con su respaldo y su ensayo, para nada).
- **D5. El desempate del ranking**: puntuación, minutos, el puesto de la semana anterior (sin puesto,
  detrás) y la cuenta más antigua; y la lista de cuentas llega ordenada. El comentario de
  `api/system.js` que explica el cálculo lo cuenta. Descartado: desempatar por nivel o experiencia, que
  cambiaría lo que mide el ranking.
- **D6. Guardar el avatar**: `guardarAvatar()` devuelve también el motivo del servidor; el botón se
  desactiva mientras guarda, y si falla deja el editor abierto y enseña el motivo con `MRModal`, que
  escapa el texto. El logro, solo si se guardó.
- **D7. Las pruebas**: las del servidor, con la base de práctica, como las de hoy; las del navegador, con
  jsdom, sobre las páginas de verdad, para Explorar, los botones de la ficha, el juego expuesto y el
  guardado del avatar. El panel de amigos se mira además en Edge, con respuestas simuladas.
- **D8. Sin subir versiones `?v=`.**

**Cómo se comprueba**: `npm test` y la prueba de humo con Node 22 y 24 oficiales; y el servidor local con
Edge, en PC y en móvil: Explorar, la ficha de un juego (los botones y el panel de amigos, con respuestas
simuladas) y el editor con un error forzado. Después de desplegar, lo mismo en la web real.

**Documentación**: la auditoría (los puntos cerrados y el 92), el comentario del cálculo del ranking y el
historial, al unir.

## Tareas

Un commit por tarea, subido a `origin` al cerrarla.

- [X] T001 Explorar y los botones de la ficha: el catálogo colgado de `window`, con su prueba (RF-001,
  RF-002, D1).
- [X] T002 El panel de amigos: el juego expuesto en `js/juego.js` y el texto de su aviso, con su prueba
  (RF-003, D2).
- [ ] T003 Fuera «Abrir Bazar», con su CSS (RF-004, D3).
- [ ] T004 El top 20 de Macro Snake, con su prueba (RF-005, D4).
- [ ] T005 El desempate del ranking, con su prueba y su comentario (RF-006, D5).
- [ ] T006 Guardar el avatar, con su prueba (RF-007, D6).
- [ ] T007 Comprobar: `npm test` y la prueba de humo con Node 22 y 24, y Edge en PC y en móvil, con
  capturas (CE-001 a CE-008).
- [ ] T008 La auditoría: los puntos cerrados, con sus notas, y el 92 (RF-010).
- [ ] T009 La entrada del historial y la unión a `main`, con `npm test` en verde en `main` (RF-012).
- [ ] T010 Con el OK de Luis, desplegar y comprobar en la web real (RF-011).
