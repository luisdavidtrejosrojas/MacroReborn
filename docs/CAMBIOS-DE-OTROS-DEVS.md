# CAMBIOS QUE LLEGAN DE OTROS DEVS

Cómo se meten en el proyecto los cambios que otra persona manda en un
zip, y los casos del 28/09/2026 y del 03/10/2026.

---

## 1. El caso del 28/09/2026

Llegaron cuatro zips de otro dev, hechos entre el 22 y el 23/09:

| Zip | Qué traía | Qué se hizo |
|---|---|---|
| `Bazar-cambios-produccion` | Una tienda nueva, el Bazar (`bazar.html`), con su acción en el servidor (`?action=bazar`), su enlace en la barra y `?next=` en el login | Se eligió frente a la tienda del 24/09 (`tienda.html`) viendo las dos en capturas. Se tomó el diseño; ver `docs/TIENDA.md` |
| `eliminar-identidad-gamer` | Quitar del perfil el bloque "Identidad gamer" | Hecho, con sus dos archivos y la prueba que los vigilaba |
| `Online-Corazones` | En la tarjeta del perfil, el nombre al pie y Online/Offline debajo, junto a las insignias | Hecho, en el perfil propio y en el público |
| `per` | Las carpetas `css/` y `js/` enteras: un rediseño de la tarjeta del perfil, el avatar y una barra de XP en la barra de navegación, y un rediseño de Comunidad | Hecho, solo lo que cambió él (abajo) |

**Ninguno se copió encima.** El zip `per` traía 108 archivos, pero solo
13 los había cambiado él; el resto eran copias de su base. Esa base era
el código del 15/09 (`ca72e35`), y 30 de esas copias eran versiones
anteriores a las nuestras: copiarlas deshacía la tienda, la sesión, las
misiones y los arreglos de seguridad de esas dos semanas. Su `perfil.js`
era incluso el nuestro del 13/08 con unas 34 líneas suyas: volvía a
meter el mapa de 622 prendas escritas a mano.

Lo que se hizo, archivo por archivo:

1. Encontrar su base: el commit en el que todos sus archivos sin tocar
   coinciden con el repositorio.
2. Sacar su cambio contra esa base (`git diff`).
3. Fundirlo con el código de hoy a tres bandas (`git merge-file`: la
   base, lo nuestro, lo suyo) y resolver a mano los conflictos.
4. Revisar el resultado, probarlo y mirarlo en capturas.

**Lo que no entró, y por qué:**

- `mock-backend.js`: un servidor de mentira que se carga en cuatro
  páginas y suplanta la API cuando el sitio se abre en `localhost`. En
  producción no hacía nada, pero en el servidor local de pruebas
  secuestraba las peticiones.
- `?action=bazar`: daba el dibujo suelto de cada prenda por
  `/prendas/<huella>.png`, que está cerrado desde el 24/09. El Bazar lee
  `avatar-shop`, como la tienda.
- `?next=` en el login: ya existía `?volver=`.
- En los comentarios del perfil, apuntar una actividad "mencion" por
  cada mencionado en vez de la actividad "comentario": "mencion" no es un
  tipo que la actividad sepa pintar, y las menciones ya salen dentro del
  comentario.

**Fallos del zip, arreglados al meterlo:**

- En Comunidad, el panel "Conectados" llamaba a `comEstaConectado`, que
  vivía en la lista de "Todos los jugadores" que él mismo quitó: el panel
  fallaba, y con él el resto de la carga de la página. Ahora usa
  `usuarioEstaConectado` (`js/core.js`).
- Los "Usuarios destacados" dibujaban el avatar con una función que ya
  no existe (`crAvatarCapasHTML`).
- Las pestañas del ranking (Todos / Hoy / Esta semana / Este mes) solo
  cambiaban de color. Ahora ordenan de verdad (`api/users.js` manda los
  minutos de hoy y del mes).
- Al quitar selectores del CSS dejaba comas colgando, y la regla se
  pegaba a la siguiente: las insignias habrían salido con el borde y el
  fondo de la caja de estadísticas.
- Tres reglas forzaban `display: block !important` en la imagen del
  avatar de la tarjeta, que le gana a `img[hidden]`: volvía el recuadro
  roto del avatar PNG que no carga.
- El nombre en la barra de navegación iba sin escapar, y la miniatura
  del avatar sin la persona (salía la silueta).
- En el Bazar: las 750 prendas de golpe (300.000 píxeles de alto en el
  móvil) y las imágenes saliéndose de la tarjeta.
- La tarjeta nueva del perfil usa una medalla con los puntos de logros
  que no estaba en el HTML: se añadió.

**Cambiado después, con el administrador:**

- La tarjeta de "Mi perfil" recortaba el avatar en escritorio: su caja
  tenía un alto fijo (563 px) y la imagen `object-fit: cover`, así que en
  el tema oscuro se perdía un 24 % del dibujo por los lados y en el claro
  un 9 % por arriba y por abajo; y la placa del nombre tapaba los pies.
  El 28/09/2026, sobre capturas de antes, ahora y dos propuestas, se
  eligió enseñar el avatar entero y llevar el nombre dentro de la imagen,
  sobre un degradado, como en macrojuegos: la última sección de
  `css/perfil-macrojuegos-light.css`, sujeta por
  `tests/tarjeta-perfil.test.js`.
- Esa tarjeta solo la tenía "Mi perfil": el zip "per" no tocó
  `usuario.html`, y el perfil de los demás seguía con la de antes. El
  mismo día se pidió para todos: `usuario.html` carga la misma hoja, lleva
  la medalla, y `js/usuario.js` pinta el nivel y la medalla como
  `js/perfil.js`.
- El lateral de la tarjeta compacta medía 300 px en una columna de 280, y
  la caja de estadísticas se metía bajo el panel de la derecha; se notó
  en perfiles con una biografía larga. Ahora ocupa su columna.

---

## 2. El caso del 03/10/2026

Llegó `MacroReborn-main.zip`. Esta vez partía del código del día: su
base era `51cd7aa`, el último commit, así que no hubo que fundir nada a
tres bandas. Traía 9 archivos cambiados y 3 nuevos, y no borraba
ninguno:

| Qué | Archivos |
|---|---|
| Barra nueva: fondo violeta oscuro, botones en pastilla, logo de imagen, la página actual resaltada y un "+" junto a las monedas que lleva al Bazar | `css/navbar-macrojuegos.css` (reescrita), `css/inicio.css` (fuera su bloque de barra en rejilla), `js/navbar.js`, `imagenes/macro-reborn-wordmark.png` |
| Buscador: el texto de ayuda dice qué busca | `js/buscador.js` |
| Comunidad: fuera la pestaña General, que repetía los números de arriba, y el panel Conectados, que estaba oculto, vuelve a verse | `comunidad-ranking.html`, `css/comunidad-ranking.css`, `js/comunidad-ranking.js` |
| Perfil en modo claro con el diseño de referencia de macrojuegos | `css/perfil-macrojuegos-referencia.css`, `js/perfil-referencia.js` y su carga en `perfil.html` y `usuario.html` |

Entró todo, en un commit por cambio. Las pruebas pasaban con el zip tal
cual, y en capturas de antes y después la barra nueva se reparte mejor
que la vieja entre 900 y 1100 px de ancho, donde la vieja se montaba.

**Arreglado al meterlo:**

- En modo claro la barra salía a medias: `theme-canonical.css` pinta en
  claro `nav.navbar` de azul, los `<input>` de blanco y los `<button>` de
  celeste, con selectores más específicos (el de los botones lleva cuatro
  `:not()`). La fila de arriba quedaba azul y la de abajo oscura. Ahora
  es la misma que en el oscuro: sección 10 de `css/navbar-macrojuegos.css`.
- En la tarjeta del modo claro, un nombre de más de unos diez caracteres
  se metía debajo de la estrella. Ahora se achica hasta que cabe
  (`js/perfil-referencia.js`).
- El logo llegó a 1536x777 (678 KB) para pintarse a 150 px de ancho, en
  todas las páginas: va a 360x182 (84 KB). El de antes,
  `imagenes/navbar-macroreborn.png`, el que llevaba el "1.0" dibujado,
  queda sin usar.
- No subía el `?v=` de nada. Con la barra en rejilla de la hoja vieja y
  la flex de la nueva, quien tuviera guardada una de las dos la habría
  visto rota un rato. Se subió en las 28 páginas.

**Decisiones suyas que quedan como llegaron**, por si hay que revisarlas:

- En modo claro, encima del perfil sale la palabra "Anuncio" sobre un
  hueco vacío, como el de la publicidad en macrojuegos.
- En modo claro, quien no ha iniciado sesión ve "Enviar petición
  amistad" en amarillo. El botón sigue sin hacer nada, y al pasar el
  ratón explica que hace falta una cuenta.
- En modo claro, el nombre de la tarjeta va en una banda rosa. El
  degradado del 28/09 sigue en el oscuro.

---

## 3. Para la próxima vez

Lo que ahorraría casi todo lo de arriba, para pedírselo a quien mande
cambios:

- **Partir del código de hoy**, no de una copia guardada: `git pull`
  antes de empezar.
- **Mandar solo lo que se cambió**, mejor como rama o parche de Git
  (`git diff`, `git format-patch`) que como carpetas enteras.
- **No mandar herramientas de prueba propias** (como `mock-backend.js`)
  dentro de las páginas.
- **Probar con el servidor local** (`npm run db:local`, ver
  `docs/guias/JUEGOS.md`, 4) y con `npm test`.
