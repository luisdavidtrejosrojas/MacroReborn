# Modelo de datos: que los juegos no puedan leer la sesión

**Rama**: `008-aislar-juegos` | **Fecha**: 2026-10-09 | **Investigación**: [research.md](research.md)

No hay tablas nuevas ni migraciones: nada de esto pasa por la base. Son las piezas que viajan entre la
web, la dirección de los juegos y el navegador de quien juega.

## Juego

Una entrada del catálogo (`js/datos-juegos.js`). Según su `iframe`, es de uno de tres tipos:

| Tipo | Cómo se reconoce | Cuántos | Dónde se abre |
|---|---|---|---|
| De terceros | `./html/juegos/<nombre>.html`, y `<nombre>` no es un propio | 107 | la dirección de los juegos |
| Propio | `./html/juegos/macro-snake.html` | 1 | la web, como hoy |
| De otra web | una dirección `https://...` | 4 | su web, como hoy |

**Reglas**: la lista de propios (`macro-snake`) está en el navegador (`js/motor/juegos-aparte.js`) y en
el servidor (`api/_juegos-aparte.js`), y una prueba vigila que sean la misma. Un propio no carga nada de
otras webs. Los archivos de `html/juegos/` que empiezan por `_` son de la dirección de los juegos (la
mudanza y el puente), no juegos.

## Dirección de los juegos

El origen desde el que se abren los juegos de terceros, según dónde esté la página:

| La página está en | Los juegos están en | Las direcciones de la web que pueden meterlos en un marco |
|---|---|---|
| `macroreborn.com` o `www.macroreborn.com` | `https://juegos.macroreborn.com` | `https://macroreborn.com`, `https://www.macroreborn.com` |
| `localhost:<p>` o `127.0.0.1:<p>` | el mismo nombre, puerto `<p>+1` | `http://localhost:<p>`, `http://127.0.0.1:<p>` |

**Reglas**: el servidor reconoce la dirección de los juegos por el nombre de la petición (`Host:
juegos.macroreborn.com`) en producción, y por el puerto en el que escucha en local.

## Marco del juego

El `iframe` que arma `js/jugar.js`: su `src` según la dirección de los juegos, y su `sandbox` y su
`allow` según el tipo de juego. Lo detalla el [contrato del marco](contracts/marco-del-juego.md).

## Aviso de actividad

Un mensaje del puente a la página: `{ tipo: "mr-actividad" }`.

**Reglas**: el puente manda uno como mucho cada 5 segundos, cuando hay teclado, ratón, rueda o pantalla
en la ventana del juego. La página solo lo cuenta si `event.origin` es la dirección de los juegos y
`event.source` es la ventana del marco del juego abierto. Contarlo es lo mismo que un evento en la
página: pone la última actividad en «ahora». Detalle en el [contrato de los
mensajes](contracts/mensajes.md).

## Lo que guarda un juego

Lo que el código de los juegos dejó en el navegador de quien juega, a nombre de la web:

- **Claves de `localStorage`**: pares de texto `clave` y `valor`. Por ejemplo, los ajustes de los
  emuladores (`ejs-settings`) y las partidas de Flash.
- **Bases de IndexedDB**: cada una con su `nombre`, su `version` y sus almacenes. Cada almacén, con su
  `nombre`, su `keyPath`, su `autoIncrement`, sus índices (`nombre`, `keyPath`, `unique`, `multiEntry`) y
  sus registros (`clave` y `valor`, que pueden ser binarios).

**Reglas**: es caché, y no se pasa, lo que se vuelve a bajar solo: `EmulatorJS-roms`, `EmulatorJS-bios`,
`EmulatorJS-core` y `UnityCache`. Una base de más de 64 MB no se pasa, y en total no se pasan más de
128 MB.

## Claves del sitio

Lo que guarda el sitio en el `localStorage` de la web y no puede pasar nunca a la dirección de los
juegos:

- **Fijas**: `macroSessionToken`, `usuarioActivo`, `presenciaMacro`, `macroRebornRecomendacionesBase`,
  `macroRebornRetoDiario`, `mr_originals_played`, `temaMacroReborn`, `paletaMacroReborn`,
  `macro:last-achievement-unlocked`, `macro:last-activity-recorded`, `macro:last-game-played` y la marca
  `mrPartidasMudadas`.
- **Por prefijo**: `macro`, `mr_`, `chatAntispam_` y `estadisticas_`.

**Reglas**: `macroSessionToken` y `usuarioActivo` se comprueban además aparte, en la página y en la
mudanza. Una prueba recorre el código del sitio y falla si una clave de `localStorage` no está cubierta.
La clave de la sonda de `scripts/revision-juegos.js` empieza por `mr_`.

## Paquete de la mudanza

Lo que la página manda a la mudanza, una sola vez por navegador y por dirección de la web:

| Campo | Qué es |
|---|---|
| `tipo`, `version` | `"mr-mudanza"`, `1` |
| `claves` | las claves de `localStorage` de los juegos, como `[clave, valor]` |
| `bases` | las bases de IndexedDB de los juegos, con lo de «Lo que guarda un juego» |
| `saltadas` | las bases que no van, con su nombre y el motivo (`cache` o `demasiado-grande`) |

**La respuesta** de la mudanza: `mr-mudanza-hecha`, con las claves puestas y las que ya estaban, y los
registros puestos y los que ya estaban; o `mr-mudanza-fallo`, con el motivo. Detalle en el [contrato de
los mensajes](contracts/mensajes.md).

**Reglas**: no se pisa nada. Una clave que ya está en la dirección de los juegos no cambia. Una base que
no existe se crea con la misma versión, almacenes e índices. En una que ya existe solo entran los
registros que falten; un almacén que no tenga se salta y se cuenta.

## Marca de mudanza hecha

`mrPartidasMudadas`, en el `localStorage` de la web: `{ version: 1, fecha, claves, registros, saltadas
}`. `claves` y `registros` son los que se pusieron (`claves.puestas` y `registros.puestos` de la
respuesta); `saltadas`, las bases que no se pasaron, con su motivo. Si no había nada que pasar, van a 0 y
vacías.

**Estados**: sin marca, hay que mudar. Con la marca puesta ya no se muda más en ese navegador y esa
dirección de la web. La marca solo se pone con la respuesta `mr-mudanza-hecha`, o si no había nada que
pasar. Si la mudanza falla o tarda más de 60 segundos, no se pone, y se reintenta la próxima vez.

## Informe de la revisión de juegos

Lo que deja `scripts/revision-juegos.js` de cada juego: `id`, `nombre`, `tipo`, `motor`, si cargó (el
elemento más grande que pinta, en píxeles), los errores de JavaScript del marco, la captura, con
`--pulsar` los botones que pulsó para empezar y, con `--sonda`, si desde dentro del juego se lee la
clave de prueba de la web y si se llega a la página que lo contiene. Dos informes, el de antes y el de
después, se comparan juego a juego.
