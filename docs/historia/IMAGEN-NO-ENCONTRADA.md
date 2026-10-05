# LA IMAGEN NO ENCONTRADA — la marca de imagen rota sobre los avatares (16/09/2026)

> **De qué trata:** el arreglo del 16/09/2026 de la marca de «imagen no encontrada» que dejaba sobre
> el avatar una prenda quitada o retirada: de dónde salía, cómo se arregló en dos mitades, el detalle
> del taller que casi muerde y lo que quedó.
>
> **Para quién:** quien toque cómo se dibujan los avatares en el navegador o el vestidor del equipo de
> arte.
>
> **Revisado:** 05/10/2026

Salió de la guía de desarrollo el 05/10/2026, entera. Desde el 24/09/2026 las páginas ya no apilan
capas: cada avatar es una sola imagen compuesta por el servidor, y solo el vestidor del equipo de arte
las apila todavía. Cómo es hoy lo cuenta [AVATARES](../referencia/AVATARES.md).

Síntoma tal como se ve: al quitar o retirar una prenda queda **un
recuadro de borde fino con el icono de imagen rota en la esquina
superior izquierda**, del tamaño de la capa.

No es un resto que haya que limpiar. Es lo que el navegador dibuja
cuando una `<img>` tiene `src` y ese `src` da 404: no deja el hueco
vacío, pinta su propia marca ocupando la caja que el CSS le dio. Encima
de un avatar eso no se lee como un error de red, se lee como una prenda
rota que la persona lleva puesta.

## De dónde salía

`rutaCapaAvatar()` en `js/core.js` es el embudo por el que pasan los
ocho ficheros del frontend que dibujan avatares. Cuando el valor no
estaba en el catálogo, se inventaba la ruta de siempre:

    "imagenes/" + modelo + "/" + resto + ".png"

Eso tenía sentido cuando el catálogo solo traía lo publicado: una prenda
retirada no aparecía, y a quien la llevara puesta había que seguir
dibujándosela. Desde `d54251f` el servidor manda la lista `retiradas`
con su URL con huella (`construirCatalogo`, en `api/content.js`), así
que una retirada entra en el mapa como cualquier otra y ya no llega a
ese respaldo.

Lo único que llega hoy es un valor **colgando**: no existe en ninguna
fila de `avatar_prendas`. Y ahí adivinar una ruta no arregla nada,
porque ese fichero tampoco está. Lo único que consigue es el 404, o sea
la marca.

Medido contra la copia de producción (ver §8), hoy hay exactamente uno:

| valor | puesto | ruta que se inventaba | existe |
|---|---|---|---|
| `tora_piel7` | 5 veces | `imagenes/tora/piel7.png` | no |

Cinco: tres cuentas y dos casilleros de galería. Es el mismo caso que ya
está contado en `scripts/avatares-colgando.js`.

## El arreglo, en dos mitades

**1. `rutaCapaAvatar()` devuelve `null` si el valor cuelga.** La capa
sencillamente no se dibuja y el avatar sale con las otras catorce. Es lo
mismo que `rutaDePrenda()` de `js/perfil.js` ya hacía desde que se
arregló ahí; esto pone de acuerdo a las otras siete páginas.

El límite importa y está sujeto por tests: **sin catálogo en la mano no
se puede saber si un valor cuelga**, así que mientras el mapa esté vacío
—porque todavía no llegó, o porque la red se cayó— se sigue dibujando
por la ruta de siempre. Devolver `null` ahí dejaría a todo el mundo sin
avatar cada vez que fallara una petición.

**2. Una capa que no carga se esconde sola.** Lo anterior solo tapa el
caso que se puede saber de antemano, y solo después de que el catálogo
llegue. Quedan tres que no dependen de nosotros:

- El avatar se dibuja **antes** de que el catálogo cargue, que es lo
  normal: ahí todavía se adivina la ruta.
- Un 404 que nginx marcó como `immutable` y el navegador se guardó
  treinta días. Ya pasó de verdad: está contado en `api/content.js`.
- Un fichero que desaparece con la fila todavía puesta.

Así que `js/core.js` escucha `error` **una vez en el documento** y pone
`display:none` en la capa que falló.

Tres decisiones de esa escucha, porque las tres se pueden deshacer sin
querer:

- **En el documento y no en cada `<img>`.** Acordarse de poner `onerror`
  en los ocho ficheros que dibujan capas es justo lo que ya se olvidó una
  vez. Además hay capas que se escriben con `innerHTML` (chat, reseñas,
  galería), donde no hay dónde colgarlo.
- **En fase de captura** (`addEventListener(..., true)`). Los `error` de
  una `<img>` **no burbujean**, pero sí bajan. Sin ese `true` no se
  entera de nada.
- **`style.display` y no el atributo `hidden`.** Cualquier regla de CSS
  que ponga un `display` le gana al atributo, y estas capas llevan reglas
  propias en cinco hojas distintas.

Un avatar que es un PNG entero (`avatar-png-personalizado`) no se
esconde: no hay capas debajo y quedaría un círculo vacío. Ese cae a
`imagenes/avatar.png`, que es lo que ya se enseña cuando alguien no
tiene avatar.

## El detalle que casi muerde

El maniquí del taller no es como el resto del sitio: sus 15 `<img>` son
**siempre las mismas** y van cambiando de prenda toda la tarde. Un
`display:none` puesto a mano sobrevive al cambio de `src`, así que una
sola prenda que fallara dejaba esa ranura muerta hasta recargar la
página. `refrescarCapa()` en `js/arte-vestidor.js` limpia la marca al
asignar un `src` nuevo.

## Qué queda

`tora_piel7` sigue guardado en las cinco filas. Ya no se ve —se salta la
capa— y el hueco de numeración tampoco es peligroso, porque
`siguienteValor()` no reutiliza identificadores: comprobado, a la
siguiente piel de tora le tocó `tora_piel8`. Limpiarlo es higiene, no
urgencia, y para eso está `scripts/avatares-colgando.js --limpiar`, que
pone esas capas en `ninguno`. Sin `--limpiar` solo informa.

## Tests

- `catalogo-en-core.test.js` (borrado el 24/09/2026, cuando `js/core.js`
  dejó de dibujar por capas) — las retiradas por su URL con huella,
  el valor colgando sin ruta, y los dos límites (sin catálogo todavía, y
  catálogo que no llega nunca).
- `tests/capas-rotas.test.js` — las ocho clases de capa, que no toca nada
  que no sea un avatar, el PNG entero, y que vale para capas escritas
  después con `innerHTML`.
- `tests/vestidor-pantalla.test.js` — que la ranura del maniquí revive al
  cambiar de prenda.
