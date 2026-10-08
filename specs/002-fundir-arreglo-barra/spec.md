# Especificación: fundir el arreglo de la barra (spec corta)

**Rama**: `002-fundir-arreglo-barra`
**Creada**: 2026-10-08
**Estado**: Borrador
**Tipo**: spec corta (regla XIX): especificación, plan y tareas en esta página, aprobados una vez.
**Pedido**: Luis, 08/10/2026, al unir la spec 001: «Una spec corta que lo funda bien: se queda su
arreglo de la barra y las versiones de los scripts de Comunidad vuelven a subir. Antes de cualquier
despliegue».

## Contexto

El 06/10/2026 SamuMacro subió tres commits directos a `main` desde la web de GitHub, con el asunto
«arreglo-navbar-comunidad» y sin pasar por Spec Kit. Están en `main` y no se han desplegado.

| Commit | Qué trae |
|---|---|
| `84e703a` | `comunidad-ranking.html` pide siete de sus hojas y scripts con versiones (`?v=`) del 18 y el 21/09, en vez de las del 03 y el 04/10 |
| `a254f21` | El arreglo: `overflow-x: clip` en vez de `hidden` en `html` y `body` (`css/theme-canonical.css`) y en `.mr-root` (`css/inicio.css`); y en `css/comunidad-ranking.css`, la barra sale de la regla que sube el contenido sobre el fondo de estrellas |
| `eb3b224` | Vacío: no cambia ningún archivo |

**El arreglo funciona.** Medido el 08/10 con Edge sin ventana, bajando 1.200 píxeles en Inicio y en
Comunidad: antes de su subida, la barra se iba con la página, en PC y en móvil; con ella, se queda
arriba y nada se sale de lado. La barra es `sticky` desde el principio, pero desde el 20/08/2026
(`8c83953`) el `overflow-x: hidden` de `html` y `body` convertía el `body` en contenedor de scroll, y
dejó de quedarse fija. En Comunidad, en PC, además, la regla de su hoja le quitaba el `sticky`.

**La página es una copia vieja.** Su `comunidad-ranking.html` es idéntico al del commit `08567fc`
(03/10), de antes de que se subieran sus versiones (`4b8d6e7`, 03/10, y `acc7b11`, 04/10). Contra esa
base no cambió nada, así que, fundido a tres bandas (regla XXVII), el resultado es el archivo de antes
de su subida. De los 107 archivos que las páginas piden con versión, siete se piden con fechas
distintas según la página: cinco por esta copia, y `css/modal.css` y `js/modal.js`, que el Bazar pide
del 24/09 y las demás páginas del 18/09. Como los `.js` y `.css` se revalidan a los cinco minutos
([VPS](../../docs/referencia/VPS.md), «Caché del navegador»), la copia no deja código viejo días
después; pero la próxima subida de versión de `js/core.js` en todas las páginas no alcanzaría a esta.

**Lo que trae que la barra vuelva a quedarse fija**, medido también el 08/10:

- La barra mide de 148 a 162 píxeles en PC (dos filas) y 124 en móvil (con la búsqueda). Un salto al
  principio de una sección, como los que llevan al editor del avatar en el perfil y al vestidor en
  Arte, deja ese principio debajo de la barra.
- El aviso de cuenta suspendida también se pega arriba, encima de la barra, y le tapa 42 píxeles en PC
  y 63 en móvil.

**Lo que había de antes, en la misma regla que él tocó.** Desde el 28/09 (`28dd472`), en Comunidad la
regla que sube el contenido sobre el fondo de estrellas atrapa también lo que los scripts cuelgan del
`body`: la ventana que explica una suspensión sale al final de la página en vez de encima, y el aviso
de cuenta suspendida no se queda arriba. Solo lo ven las cuentas suspendidas, y solo en Comunidad.

## Aclaraciones

### Sesión 2026-10-08

- P: ¿Entra aquí el arreglo de la ventana de una suspensión en Comunidad, que es de antes de SamuMacro
  (28/09), o va a la auditoría para otra spec? → R: Entra aquí: es la misma regla que él tocó y se
  comprueba con las mismas medidas.
- P: ¿Se añade una prueba que falle si una página pide un archivo con otra versión que las demás,
  igualando antes el modal del Bazar? → R: Sí, con su nota en VPS.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - La barra se queda arriba al bajar (Prioridad: P1)

Quien baja por cualquier página con la barra la sigue teniendo arriba, en el móvil y en el PC, para
buscar o cambiar de sección sin volver al principio, y nada choca con ella.

**Por qué esta prioridad**: es lo que arregló SamuMacro y lo que se queda.

**Prueba independiente**: abrir cada página con barra, bajar y mirar dónde queda la barra.

**Escenarios de aceptación**:

1. **Dada** cualquiera de las 25 páginas con barra, **cuando** se baja por ella en PC o en móvil,
   **entonces** la barra sigue pegada arriba y la página no se mueve de lado.
2. **Dado** un salto al principio de una sección (el editor del avatar, el vestidor de Arte, un enlace
   a un ancla), **cuando** se hace, **entonces** ese principio queda a la vista, justo debajo de la
   barra.
3. **Dada** una cuenta suspendida, **cuando** baja por cualquier página, **entonces** su aviso no tapa
   la barra.
4. **Dado** un navegador antiguo (Safari anterior a la 16, de 2022), **cuando** abre cualquier página,
   **entonces** la ve como hasta ahora: nada se sale de lado, aunque la barra no se quede fija.

---

### Historia 2 - Comunidad pide sus archivos al día (Prioridad: P1)

`comunidad-ranking.html` vuelve a pedir sus hojas y scripts con las versiones de antes de la copia,
las mismas que el resto de páginas, para que la próxima subida de versión la alcance como a las demás.

**Por qué esta prioridad**: una copia vieja no se queda encima de lo de hoy (regla XXVII).

**Prueba independiente**: contar con qué versión pide cada página cada archivo.

**Escenarios de aceptación**:

1. **Dada** Comunidad, **cuando** se mira con qué versión pide cada archivo, **entonces** son las de
   antes del 06/10: `css/inicio.css`, `css/comunidad-ranking.css`, `css/navbar-macrojuegos.css`,
   `js/comunidad-ranking.js`, `js/navbar.js` y `js/buscador.js` del 03/10, y `js/core.js` del 04/10.
2. **Dado** el sitio entero, **cuando** se cuentan las versiones, **entonces** ningún archivo se pide
   con fechas distintas por culpa de la copia.

---

### Historia 3 - En Comunidad, la ventana de una suspensión sale encima (Prioridad: P2)

A una cuenta suspendida, en Comunidad, la ventana que explica la suspensión le sale encima de la
página, como en el resto del sitio, y no al final.

**Por qué esta prioridad**: solo lo ven las cuentas suspendidas, y solo en esa página.

**Prueba independiente**: abrir la ventana en Comunidad y mirar dónde sale.

**Escenarios de aceptación**:

1. **Dada** una cuenta suspendida en Comunidad, **cuando** intenta escribir, **entonces** la ventana
   sale encima de la página, como en Inicio.

---

### Historia 4 - Una página que se queda atrás salta en las pruebas (Prioridad: P3)

Si una página vuelve a pedir un archivo con otra versión que las demás, como con esta copia, las
pruebas lo dicen, con la página y el archivo, antes de unir o desplegar.

**Por qué esta prioridad**: las copias viejas son el problema que se repite con lo que mandan otros
devs (los casos del 28/09 y el 03/10, y este).

**Prueba independiente**: cambiar a mano una versión de una página y correr las pruebas.

**Escenarios de aceptación**:

1. **Dada** una página que pide un archivo con otra versión que las demás, **cuando** se corren las
   pruebas, **entonces** fallan y dicen qué página y qué archivo.

---

### Casos límite

- Las cinco páginas sin barra (`login`, `registro`, `taller`, y `comunidad` y `tienda`, que
  redirigen) no cambian.
- La franja de avisos de `js/core.js` y los avisos en vivo de `js/realtime.js` llevan su posición
  escrita en el propio elemento: ninguna regla los atrapa, ni antes ni después.
- El menú del móvil va dentro de la barra: al abrirlo, la barra crece; los saltos no deben contar esa
  altura.
- Al desplegar, las hojas cambiadas conviven cinco minutos con las de antes sin romper nada (como
  mucho, la barra no se queda fija en ese rato).
- La barra fija ocupa del 15 al 20 % de la pantalla. Es su diseño, y cambiarlo no entra aquí.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: En las 25 páginas con barra, la barra DEBE seguir arriba al bajar, en PC y en móvil.
- **RF-002**: Ninguna página DEBE moverse de lado en el móvil.
- **RF-003**: En un navegador antiguo (Safari anterior a la 16), las páginas DEBEN verse como antes del
  06/10.
- **RF-004**: Un salto al principio de una sección DEBE dejarla a la vista, debajo de la barra.
- **RF-005**: El aviso de cuenta suspendida NO DEBE tapar la barra.
- **RF-006**: `comunidad-ranking.html` DEBE pedir sus siete hojas y scripts con las versiones de antes
  del 06/10, que es lo que da fundir su copia a tres bandas.
- **RF-007**: En Comunidad, la ventana y el aviso de una suspensión DEBEN comportarse como en el resto
  del sitio.
- **RF-008**: Una prueba DEBE fallar si una página pide un archivo con otra versión que las demás, y
  decir qué página y qué archivo.
- **RF-009**: Esta especificación DEBE contar qué no entró y por qué (regla XXVII): las siete
  versiones de la copia y el commit vacío.
- **RF-010**: Al unirse a `main`, el historial DEBE tener su entrada, con la fecha de la unión y el
  enlace a esta especificación.
- **RF-011**: Nada se despliega sin el OK de Luis (regla XXI).

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Tras bajar, la barra está arriba en las 25 páginas con barra, en PC (1366×800) y en
  móvil (390×844): 50 de 50 medidas.
- **CE-002**: En móvil, ninguna de las 25 páginas se desplaza de lado (0 píxeles).
- **CE-003**: Comunidad pide 0 archivos con una versión más vieja que las demás páginas (hoy, 5).
- **CE-004**: Tras un salto al principio de una sección, 0 píxeles de ella quedan debajo de la barra
  (hoy, 124 en móvil).
- **CE-005**: Con el aviso de suspensión, 0 píxeles de la barra tapados (hoy, 42 en PC y 63 en móvil).
- **CE-006**: En Comunidad, la ventana de una suspensión sale encima de la página, como en Inicio.
- **CE-007**: `npm test` en verde, y la integración continua como antes de esta rama: solo en rojo la
  prueba de humo, que tiene su propia especificación.
- **CE-008**: Capturas de Inicio y Comunidad, en PC y en móvil, miradas antes de unir (regla XXVIII).
- **CE-009**: Con una versión cambiada a mano en una página, las pruebas fallan y nombran la página y
  el archivo; con las versiones igualadas, pasan. Hoy, 7 archivos se piden con versiones distintas.

## Supuestos

- El diseño de la barra (sus filas y su altura) se queda como está: aquí solo vuelve a quedarse fija y
  nada choca con ella.
- El móvil se prueba con Edge emulando uno de 390×844, con capturas. Un Safari anterior a la 16 no se
  puede probar aquí: su respaldo se comprueba leyendo las reglas y queda «Pendiente de probar» en un
  dispositivo así.
- Entienden `clip` Chrome y Edge desde la 90, Firefox desde la 81 y Safari desde la 16.
- Los commits de SamuMacro se quedan en la historia de `main`; esta rama añade los suyos encima.

## Fuera de alcance

- Desplegar: después de unir, con el OK de Luis y los pasos de
  [DESPLEGAR](../../docs/guias/DESPLEGAR.md).
- La prueba de humo en rojo: tiene su propia especificación.
- Cambiar el diseño o la altura de la barra.

## Plan

**Cómo se funde** ([CAMBIOS-DE-OTROS-DEVS](../../docs/guias/CAMBIOS-DE-OTROS-DEVS.md), el método):

1. La base de su `comunidad-ranking.html` es `08567fc`. Lo suyo (`84e703a`) es igual a esa base, y lo
   nuestro es el de `0050e55`: `git merge-file` a tres bandas da lo nuestro, con las siete versiones
   de antes.
2. Sus hojas partían del código de hoy: su cambio entra tal cual, y ya está en `main`.
3. El commit vacío no trae nada que fundir.

**Decisiones**:

- **D1. Respaldo para los navegadores sin `clip`.** `overflow-x: hidden;` justo antes de cada
  `overflow-x: clip;`: el que no entiende `clip` se queda con `hidden`, como antes. Descartado:
  dejarlo sin respaldo, porque en Safari 15 o anterior lo que se sale de lado movería la página.
- **D2. Los saltos, debajo de la barra.** `js/navbar.js` mide la barra cerrada y pone su altura como
  margen de los saltos (`scroll-padding-top` en `html`), y la vuelve a medir si cambia de tamaño.
  Vale para `scrollIntoView` y para los enlaces a un ancla. Descartado: una altura fija en la hoja,
  porque la barra mide distinto según el ancho.
- **D3. El aviso de suspensión deja de pegarse arriba.** Queda en lo alto de cada página, antes de la
  barra, y se va al bajar; la ventana de la suspensión sigue saliendo al intentar escribir.
  Descartado: pegar la barra debajo del aviso, porque juntos ocuparían hasta 187 píxeles del móvil.
- **D4. En Comunidad, la regla del fondo de estrellas solo para los bloques de la página.** Se
  aplica a sus `section` y su `footer`, en vez de a todo hijo del `body` menos la barra: lo que
  cuelguen los scripts queda fuera sin nombrarlo. Descartado: excepciones una a una, que se rompen con
  la próxima capa nueva.
- **D5. No se sube la versión** de las hojas ni de `js/navbar.js`: cada cambio convive cinco minutos
  con el de antes sin romper nada, que es cuando VPS dice que no hace falta.
- **D6. La prueba de las versiones.** Por cada archivo que las páginas piden con `?v=`, una sola
  versión en todas. Para que pase hoy, las páginas que piden el modal del 18/09 pasan al del 24/09, el
  del Bazar: el archivo es el mismo, solo cambia su dirección. Se apunta en VPS.

**Cómo se comprueba**: `npm test`, y el servidor local (`npm run db:local`, mirando antes el puerto
3001) con Edge sin ventana: en las 25 páginas con barra, en PC y en móvil, la barra arriba tras bajar,
nada que se mueva de lado, un salto que queda a la vista y el aviso que no tapa la barra; en
Comunidad, la ventana encima. Capturas de Inicio y Comunidad en los dos tamaños.

**Documentación**: VPS (D6); CAMBIOS-DE-OTROS-DEVS, que lo que se sube directo a `main` desde la web
de GitHub entra igual por el método, porque subir archivos en la web copia encima los que se tengan;
y el historial, al unir.

## Tareas

Un commit por tarea, subido a `origin` al cerrarla.

- [ ] T001 Fundir `comunidad-ranking.html` a tres bandas: vuelven sus siete versiones (RF-006).
- [ ] T002 El respaldo para los navegadores sin `clip`, en `css/theme-canonical.css` y
  `css/inicio.css` (RF-003, D1).
- [ ] T003 Los saltos quedan a la vista: `js/navbar.js` (RF-004, D2).
- [ ] T004 El aviso de suspensión no tapa la barra: `css/inicio.css` (RF-005, D3).
- [ ] T005 Comunidad: la regla del fondo de estrellas, solo para los bloques de la página, en
  `css/comunidad-ranking.css` (RF-007, D4).
- [ ] T006 El modal del 24/09 en todas las páginas, la prueba de las versiones y su nota en VPS
  (RF-008, D6).
- [ ] T007 Comprobar: `npm test`, las 25 páginas en PC y en móvil, y las capturas (CE-001 a CE-009).
- [ ] T008 CAMBIOS-DE-OTROS-DEVS: lo que se sube directo a `main`.
- [ ] T009 La entrada del historial y la unión a `main`, con `npm test` en verde en `main` (RF-010).
