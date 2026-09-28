# CAMBIOS QUE LLEGAN DE OTROS DEVS

Cómo se meten en el proyecto los cambios que otra persona manda en un
zip, y el caso del 28/09/2026.

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

- `js/mock-backend.js`: un servidor de mentira que se carga en cuatro
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

---

## 2. Para la próxima vez

Lo que ahorraría casi todo lo de arriba, para pedírselo a quien mande
cambios:

- **Partir del código de hoy**, no de una copia guardada: `git pull`
  antes de empezar.
- **Mandar solo lo que se cambió**, mejor como rama o parche de Git
  (`git diff`, `git format-patch`) que como carpetas enteras.
- **No mandar herramientas de prueba propias** (como `mock-backend.js`)
  dentro de las páginas.
- **Probar con el servidor local** (`npm run db:local`, ver
  `docs/JUEGOS.md`, 4) y con `npm test`.
