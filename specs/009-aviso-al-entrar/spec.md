# Especificación: un aviso al entrar, «pronto llegan nuevos personajes» (spec corta)

**Rama**: `009-aviso-al-entrar`
**Creada**: 2026-10-09
**Estado**: Borrador, pendiente de la aprobación de Luis (y de su decisión en D1)
**Tipo**: spec corta (regla XIX): especificación, plan y tareas en esta página, aprobados una vez.
**Pedido**: Luis, 09/10/2026: «quiero colocar un anuncio en la página que cuando entres aparezca un aviso
de que pronto llegan nuevos personajes», y «Prepara ya lo de la spec del aviso». Bell mandó como
referencia una captura de la ventana que enseña Mobile Legends al abrirlo: el dibujo grande del
personaje, un título, las fechas del evento, un botón para ir y una X para cerrar.

## Contexto

El equipo de arte está terminando los personajes oficiales de MacroReborn, los que van a reemplazar a los
heredados de Macrojuegos, y quiere lanzarlos el viernes 16 o el sábado 17 de octubre (su spec es la
`010-personajes-oficiales`). Mientras tanto, Bell quiere que la gente sepa que se está trabajando.

Lo que hay hoy, mirado el 09/10 en el código:

- **No hay ningún aviso general.** La campanita y los avisos en vivo son de cada persona (una mención, una
  solicitud de amistad, un comentario: [AVISOS](../../docs/referencia/AVISOS.md)), y la página de
  noticias (`noticias.html`) es fija, con tres noticias escritas a mano.
- **La barra de arriba está en 25 de las 30 páginas** (`js/navbar.js`). No la tienen `login.html`,
  `registro.html`, `comunidad.html`, `taller.html` y `tienda.html`.
- **La constitución pide no molestar** (regla XIV): «sin ventanas emergentes, sonidos, avisos ni permisos
  del navegador innecesarios. Si algo tiene que avisar, se usa el canal menos intrusivo: la campanita o un
  aviso dentro de la página». Una ventana encima de la página, como la de Mobile Legends, es justo lo que
  esa regla evita; por eso es la decisión D1 del plan.

## Aclaraciones

Una decisión para Luis antes de aprobar: **D1, ventana encima de la página o aviso dentro de ella**. El
resto tiene una forma clara de hacerse y va en el plan.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - Quien entra, se entera (Prioridad: P1)

Quien entra en la web, con cuenta o sin ella, ve enseguida que pronto llegan personajes nuevos: un título,
una frase, la fecha si ya se sabe, un botón para saber más y otro para cerrarlo.

**Por qué esta prioridad**: es lo que se pidió, y lo que dice a la comunidad que el equipo está trabajando.

**Prueba independiente**: abrir la portada y otra página cualquiera con la barra de arriba.

**Escenarios de aceptación**:

1. **Dado** el aviso en sus fechas, **cuando** alguien abre la portada, **entonces** lo ve en la primera
   pantalla, en PC y en móvil.
2. **Dado** el aviso en sus fechas, **cuando** alguien entra por otra página con la barra de arriba,
   **entonces** también lo ve.
3. **Dado** el aviso, **cuando** se pulsa «Ver más», **entonces** se abre la noticia con los detalles.

---

### Historia 2 - Se cierra y no vuelve (Prioridad: P1)

Quien lo cierra no lo vuelve a ver en ese navegador: ni en otra página, ni al día siguiente. Un aviso
nuevo, más adelante, sí se ve.

**Por qué esta prioridad**: un aviso que no se puede quitar, o que vuelve en cada página, cansa (regla XIV).

**Prueba independiente**: cerrarlo, recargar y cambiar de página.

**Escenarios de aceptación**:

1. **Dado** el aviso cerrado, **cuando** se recarga o se abre otra página, **entonces** no sale.
2. **Dado** el aviso cerrado, **cuando** se publica otro aviso distinto, **entonces** el nuevo sí sale.

---

### Historia 3 - No estorba al jugar (Prioridad: P1)

Mientras se juega, el aviso no tapa nada: no sale en la página de jugar.

**Por qué esta prioridad**: tapar un juego es peor que no avisar.

**Prueba independiente**: abrir un juego con el aviso sin cerrar.

**Escenarios de aceptación**:

1. **Dado** el aviso sin cerrar, **cuando** se abre `jugar.html`, **entonces** no sale.

---

### Historia 4 - Con el dibujo de los personajes, en PC y en móvil (Prioridad: P2)

Cuando el equipo de arte mande la imagen del anuncio, el aviso la enseña: apaisada en PC y vertical en
móvil. Hasta entonces, el aviso es solo texto, con los colores del sitio.

**Por qué esta prioridad**: el dibujo es lo que da ganas, pero el aviso puede salir antes sin él.

**Prueba independiente**: ver el aviso con imagen y sin ella, en los dos tamaños.

**Escenarios de aceptación**:

1. **Dado** el aviso sin imagen, **cuando** se ve, **entonces** se lee bien y no queda un hueco vacío.
2. **Dada** la imagen en sus dos formatos, **cuando** se ve en PC y en móvil, **entonces** cada pantalla
   usa la suya, sin deformarla ni cortar el título.
3. **Dada** una imagen que no carga, **cuando** se ve el aviso, **entonces** queda la versión de texto.

---

### Historia 5 - Se apaga solo (Prioridad: P2)

El aviso tiene una fecha de inicio y una de fin; fuera de ellas no sale, sin tener que desplegar nada para
quitarlo.

**Por qué esta prioridad**: el día del lanzamiento, «pronto llegan» ya no es verdad.

**Prueba independiente**: mirar el aviso con la fecha de fin pasada.

**Escenarios de aceptación**:

1. **Dada** la fecha de fin pasada, **cuando** alguien entra, **entonces** el aviso no sale.

---

### Casos límite

- **El navegador no deja guardar** (modo privado estricto, almacenamiento lleno o bloqueado): el aviso se
  cierra igual en esa página y nada se rompe; puede volver a salir en la siguiente. Se avisa en la consola,
  sin tragarse el error (regla XIII).
- **Varias pestañas abiertas**: cerrar en una no lo quita de las otras hasta que se recarguen. Es
  aceptable.
- **Sin JavaScript**: no sale. Es aceptable: es un adorno, no información necesaria.
- **El texto del aviso** se pinta como texto, nunca como HTML, aunque lo escriba el equipo (regla XXIV).
- **Lectores de pantalla y teclado**: el aviso se anuncia como una región con nombre, y se cierra con el
  teclado.
- **Las páginas sin la barra de arriba** (inicio de sesión, registro, el taller...) no lo enseñan.
- **Lo que guarda el navegador** es del sitio: con el prefijo `mr_`, para que nunca pase a la dirección de
  los juegos (spec 008, que trata esas claves como del sitio por su prefijo).

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: Al entrar en cualquier página con la barra de arriba, salvo la de jugar, el aviso DEBE verse
  en la primera pantalla, en la forma que decida D1.
- **RF-002**: El aviso DEBE tener un título, una frase, la fecha si se conoce, un botón «Ver más» que lleva
  a la noticia y un botón para cerrarlo.
- **RF-003**: Cerrar el aviso DEBE recordarse en ese navegador para ese aviso: no vuelve en otras páginas
  ni otros días; un aviso con otra identidad sí sale.
- **RF-004**: El aviso DEBE tener fecha de inicio y de fin, y fuera de ellas NO DEBE salir.
- **RF-005**: Con la imagen del equipo de arte, el aviso DEBE usar la apaisada en PC y la vertical en
  móvil; sin imagen, o si no carga, DEBE quedar una versión de solo texto que se lea bien.
- **RF-006**: Los textos de la web DEBEN ir con voseo (regla I), y el aviso NO DEBE tener sonidos.
- **RF-007**: Si el navegador no deja guardar, el aviso DEBE cerrarse igual, sin romper la página y
  dejando constancia en la consola (regla XIII).
- **RF-008**: Lo que el aviso guarde en el navegador DEBE llevar el prefijo `mr_` (spec 008).
- **RF-009**: `noticias.html` DEBE tener una noticia con los detalles, a la que lleva «Ver más».
- **RF-010**: El aviso DEBE tener sus pruebas: sale, se cierra y se recuerda, caduca, no sale al jugar, y
  funciona sin imagen.
- **RF-011**: El aviso DEBE mirarse en móvil y en PC antes de unir, con capturas (regla XXVIII).
- **RF-012**: Al unirse a `main`, el historial DEBE tener su entrada; se despliega después, con el OK de
  Luis (regla XXI).

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Con el aviso en sus fechas, sale en la primera pantalla de la portada y de otra página, en
  PC (1366×800) y en móvil (390×844), con capturas.
- **CE-002**: Después de cerrarlo, sale 0 veces más en ese navegador para ese aviso (prueba y Edge).
- **CE-003**: Con la fecha de fin pasada, sale 0 veces (prueba).
- **CE-004**: En la página de jugar, sale 0 veces (prueba y Edge).
- **CE-005**: Las páginas con el aviso no dan errores de JavaScript (Edge).
- **CE-006**: `npm test` y la prueba de humo, en verde con Node 22 y 24.

## Supuestos

- **El texto**, mientras Luis o Bell no digan otro: título «¡Pronto llegan nuevos personajes!», frase «El
  equipo de arte está terminando los personajes oficiales de MacroReborn. Muy pronto vas a poder
  conocerlos.» y «Ver más». La fecha se pone cuando se confirme (16 o 17 de octubre).
- **El fin**, el día del lanzamiento; si el lanzamiento se mueve, se mueve la fecha.
- **La imagen** llega después: el aviso sale antes, solo con texto.
- Lo ve todo el mundo, con cuenta o sin ella.

## Fuera de alcance

- Cambiar los avisos desde el panel de administración, sin desplegar: si los avisos se vuelven
  frecuentes, será otra spec.
- Varios avisos a la vez, en carrusel, como los juegos de móvil.
- Un aviso en la campanita de todo el mundo: la campanita es de cada persona, y uno para todos es otro
  cambio.
- Las historias de los personajes: van al canal de anuncios de Discord (y, más adelante, a la spec
  `013-galeria-de-personajes`).

## Plan

**Qué cambia**: un archivo nuevo, `js/aviso-al-entrar.js`, con su CSS, `css/aviso-al-entrar.css`,
cargados en las 24 páginas con la barra de arriba menos `jugar.html`; una noticia en `noticias.html`; la
imagen, en `imagenes/avisos/`, cuando llegue; sus pruebas, en `tests/aviso-al-entrar.test.js`; y la guía
de desarrollo.

**Decisiones**:

- **D1. Dentro de la página, no encima (recomendado; lo decide Luis).** Una franja ancha justo debajo de
  la barra de arriba, con el dibujo de fondo, el título, la frase, la fecha, «Ver más» y la X: lo vistoso
  de la referencia de Mobile Legends, pero sin tapar la página, como pide la regla XIV. En la portada,
  más grande, como cabecera. La alternativa es la ventana encima de la página, como en Mobile Legends,
  una sola vez por aviso: es lo que la regla XIV evita, así que, si Luis la prefiere, queda aprobada aquí
  como excepción escrita (Gobierno de la constitución).
- **D2. Una vez por aviso.** Cerrar se recuerda con la identidad del aviso (`mr_aviso_cerrado`). Descartado:
  una vez al día, como los juegos de móvil: en una web que se abre a diario, saldría a diario.
- **D3. Los datos, en el propio archivo.** Una constante al principio de `js/aviso-al-entrar.js`:
  identidad, título, frase, fecha, inicio, fin, enlace e imágenes. Cambiarlo es un commit y un despliegue.
  Descartado por ahora: editarlo desde el panel de administración, que es más trabajo y solo compensa si
  los avisos se vuelven frecuentes.
- **D4. La imagen del anuncio, como imagen del sitio.** No es el dibujo de una prenda ni deja sacar
  ninguna: es un anuncio aplanado, del tamaño al que se ve, hecho para que lo vea todo el mundo. Va en
  `imagenes/avisos/`; los originales siguen con el equipo de arte (regla XXIX). Se piden dos formatos:
  apaisado para PC y vertical para móvil.
- **D5. Sin imagen, solo texto**, con los colores del sitio: el aviso puede salir hoy y ganar el dibujo
  después.
- **D6. No en `jugar.html`**: no se tapa un juego.
- **D7. Accesible y sin ruido**: una región con nombre, botones con texto para los lectores de pantalla,
  se cierra con el teclado, sin sonidos ni animaciones que distraigan.
- **D8. Sin tocar la barra de arriba**: archivos nuevos y dos líneas en cada página. No hace falta subir
  ninguna versión `?v=` de lo que ya existe.

**Cómo se comprueba**: `npm test` y la prueba de humo con Node 22 y 24 oficiales; y el servidor local con
Edge, en PC y en móvil: la portada y otra página, cerrar y recargar, cambiar de página, la página de jugar,
y el aviso con la fecha de fin pasada. Después de desplegar, lo mismo en la web real.

**Documentación**: en [DESARROLLO](../../docs/guias/DESARROLLO.md), dónde está el aviso y cómo se cambia
o se apaga; y el historial, al unir.

## Tareas

Un commit por tarea, subido a `origin` al cerrarla.

- [ ] T001 El aviso: `js/aviso-al-entrar.js` y `css/aviso-al-entrar.css`, con sus pruebas en jsdom (sale,
  se cierra y se recuerda, caduca, no sale al jugar, sin imagen) (RF-001 a RF-008, RF-010, D1 a D7).
- [ ] T002 Cargarlo en las 24 páginas con la barra de arriba menos la de jugar, con una prueba que lo
  vigile (RF-001, D6, D8).
- [ ] T003 La noticia en `noticias.html` (RF-009).
- [ ] T004 Comprobar en Edge, en PC y en móvil, con capturas (CE-001 a CE-005, RF-011).
- [ ] T005 La guía de desarrollo: dónde está el aviso y cómo se cambia.
- [ ] T006 `npm test` y la prueba de humo con Node 22 y 24; la entrada del historial y la unión a `main`
  (CE-006, RF-012).
- [ ] T007 Con el OK de Luis, desplegar y comprobar en la web real (RF-012).
- [ ] T008 Cuando el equipo de arte mande la imagen, ponerla y mirarla en PC y en móvil; hasta entonces,
  «Pendiente de la imagen» (RF-005, D4).
