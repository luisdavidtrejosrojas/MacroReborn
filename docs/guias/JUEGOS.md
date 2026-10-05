# JUEGOS — cómo se agrega y se quita un juego

> **De qué trata:** cómo está armado el catálogo de juegos, el proceso para agregar uno (el archivo,
> la portada, la entrada y el sitemap), cómo probarlo en local, dos casos reales y cómo se quita un
> juego sin romper lo que la gente jugó.
>
> **Para quién:** quien añade o quita juegos.
>
> **Revisado:** 05/10/2026

Guía para agregar un juego nuevo al catálogo de MacroReborn.
Documenta el proceso completo, con dos casos reales: Superfighters
(id 111, Flash) e I Am Hall Security (id 112, HTML5/Unity). Y cómo
se quita uno, con el caso del 30.

---

## 1. Qué cubre esta guía

- Cómo está armado el catálogo de juegos (dónde vive cada pieza).
- El proceso paso a paso para agregar un juego nuevo.
- Cómo probarlo localmente sin tocar la base real ni el servidor.
- Los dos formatos de juego usados en el catálogo, con sus notas:
  SWF con Ruffle (y por qué el SWF se sirve desde jsdelivr y no desde
  archive.org) y HTML5/Unity embebido por iframe a una URL externa
  (y el tema de los permisos del iframe: fullscreen y pointer-lock).
- Cómo se quita un juego sin romper lo que la gente jugó.

## 2. Cómo está armado el catálogo

El catálogo es 100% estático del lado del navegador: no hay base de
datos de juegos. Cada juego tiene 3 piezas:

| Pieza | Ubicación | Rol |
|---|---|---|
| Entrada del catálogo | `js/datos-juegos.js` (array `juegos`) | Los datos: `id`, `nombre`, `imagen`, `categoria`, `estado`, `tipo`, `descripcion`, `iframe` |
| Archivo del juego | `html/juegos/<slug>.html` | El juego en sí (embebido, HTML5, o Ruffle para SWF) |
| Portada | `imagenes/juegos/<slug>.jpg` | JPEG de 480x270 (16:9), igual que el resto del catálogo |

Todo el resto del sitio ya sabe leer el array `juegos` con el `id`:
el catálogo (`juegos.html` + `js/juegos.js`), la ficha (`juego.html`
+ `js/juego.js`), la pantalla de jugar (`jugar.html` + `js/jugar.js`),
el buscador, favoritos, historial, XP/ranking por tiempo jugado,
valoraciones y reseñas. Por eso agregar un juego es agregar datos,
no código.

## 3. Proceso para agregar un juego nuevo

### 3.1 Conseguir el juego

Cuatro formatos posibles, todos ya usados en el catálogo:

- **HTML embebible** (con `<base href>` a un CDN), como `chess.html`.
- **Juego HTML5 completo** (canvas + scripts), como
  `brawl-stars-remake.html`.
- **SWF con Ruffle** (para juegos Flash), como `superfighters.html`.
- **HTML5/Unity embebido por iframe a una URL externa**, como
  `i-am-hall-security.html` (el juego vive en un CDN ajeno que bloquea
  el acceso directo, y se enlaza a través de un proxy).

En el caso de un SWF, el archivo se reproduce con Ruffle
(`https://cdn.jsdelivr.net/npm/@ruffle-rs/ruffle@0.2.0-nightly.2025.10.2/ruffle.min.js`,
la misma versión que usan los demás juegos Flash del catálogo).

En el caso de un HTML5/Unity que solo se puede jugar dentro de una
plataforma (como Poki), el juego original suele estar en un CDN que
bloquea el acceso directo (403) y tiene "sitelock" (una redirección
anti-embedding). Se enlaza en vivo a través de un proxy que manda
CORS, bloquea el sitelock y oculta que el juego corre dentro de un
iframe. No se sube ningún binario al repo: se referencia la URL
externa, igual que el resto del catálogo.

### 3.2 Guardar el archivo del juego

Crear `html/juegos/<slug>.html`. El `<slug>` suele coincidir con el
nombre del juego (ej: `superfighters.html`, `i-am-hall-security.html`).

**Nota CORS para SWF (importante):** Ruffle descarga el SWF con
`fetch()` desde el navegador, y para eso el servidor que lo aloja
debe responder con el header `Access-Control-Allow-Origin`.
archive.org **no** lo envía (verificado), así que un SWF enlazado
directo a archive.org no carga en el navegador. jsdelivr **sí** lo
envía (`access-control-allow-origin: *`), por eso los SWF del
catálogo se sirven desde jsdelivr (a través de mirrors de GitHub),
igual que el resto del catálogo con CDNs de terceros.

**Nota iframe para HTML5/Unity (importante):** si el juego se embebe
con un `<iframe>` a una URL externa, el iframe debe declarar los
permisos que el juego usa con el atributo `allow`, porque la página
del juego es cross-origin y el navegador los niega por defecto. Como
mínimo suele hacer falta `allow="autoplay; fullscreen"` y, si el
juego tiene cámara en primera persona, `pointer-lock` (sin él, el
cursor no queda capturado y se ve por afuera del iframe mientras la
cámara se mueve).

### 3.3 Agregar la portada

- Archivo: `imagenes/juegos/<slug>.jpg`.
- Formato: JPEG de **480x270** (16:9), igual que las demás (verificadas
  con el header del archivo). Peso típico: 15-30 KB.

Si la portada todavía no existe, el sistema no se rompe:
`crearImagenJuego()` en `js/datos-juegos.js` muestra un placeholder
hasta que se agregue el campo `imagen`.

### 3.4 Agregar la entrada en el catálogo

En `js/datos-juegos.js`, agregar un objeto al array `juegos`. El `id`
debe ser el máximo existente + 1 (el 05/10/2026 el máximo es 113, así que el
siguiente es el 114), y nunca uno quitado ([quitar un juego](#7-quitar-un-juego)).
Ejemplo real:

```js
{
    id: 112,
    nombre: "I Am Hall Security",
    imagen: "imagenes/juegos/i-am-hall-security.jpg",
    categoria: "Simulación",
    estado: "⭐ Nuevo",
    tipo: "destacado",
    descripcion: "Convertite en el guardia de una escuela llena de caos...",
    iframe: "./html/juegos/i-am-hall-security.html"
},
```

- `categoria` debe ser una de las existentes (Plataformas, RPG,
  Acción, Terror, Simulación, Deportes, Estrategia, Lucha, Aventura,
  Arcade, Puzzles, Casual, Cooperativo).
- `estado` y `tipo`: el 05/10/2026 todos usan `tipo: "destacado"`, y
  todos menos uno el `estado` del ejemplo; el otro, Macro Snake, el
  original de la casa, lleva el de "Original".
- `iframe` puede ser un archivo local (`./html/juegos/x.html`) o una
  URL externa embebible.
- Si la portada todavía no existe, se omite el campo `imagen` y el
  sistema muestra el placeholder.

### 3.5 Actualizar el sitemap

En `sitemap.xml`, agregar la URL de la ficha con el mismo formato que
las demás (el 05/10/2026 tiene las fichas de 111 de los 112 juegos: falta
la del 113, Macro Snake):

```xml
<url>
  <loc>https://www.macroreborn.com/juego.html?id=112</loc>
  <lastmod>2026-08-16</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.5</priority>
</url>
```

## 4. Probar localmente

Todo corre en esta máquina con el servidor local existente
(`scripts/servidor-local.js`), que sirve los archivos estáticos tal
cual y no requiere que el juego esté en `js/datos-juegos.js` para
probar el archivo del juego solo.

```bash
npm install        # solo la primera vez (instala las dependencias)
npm run db:local   # sitio local en http://localhost:3001
```

| Qué probar | URL | Qué verificar |
|---|---|---|
| El juego solo (sin catálogo) | `http://localhost:3001/html/juegos/superfighters.html` | El juego corre dentro de Ruffle; sin CORS el texto muestra "Error al cargar el juego" |
| El juego solo (sin catálogo) | `http://localhost:3001/html/juegos/i-am-hall-security.html` | La página del juego carga y el juego 3D corre; su carga es pesada (~46 MB), primero aparece la pantalla de carga propia del juego |
| Catálogo | `http://localhost:3001/juegos.html` | La tarjeta aparece (con portada o placeholder) sin romper el layout |
| Ficha | `http://localhost:3001/juego.html?id=112` | Título, categoría, descripción, portada |
| Jugar | `http://localhost:3001/jugar.html?id=112` | El iframe monta el juego y arranca el sistema de XP |

Notas:

- La consola del servidor local **no** imprime los pulsos de XP ni la
  actividad: solo imprime, la primera vez que entra `demo`, que su
  contraseña pasó a hash. Para ver el XP, abrir la pestaña Network del
  navegador (F12): cada 60 segundos aparece un POST a
  `/api/users?action=xp` con `gameId: 112`, mientras se toque el teclado
  o el ratón (a los 3 minutos sin nada, el pulso se para).
- En modo local están `/api/auth`, `/api/users`, `/api/content` y
  `/api/avisos`; lo demás contesta 404 y sus secciones se ven vacías
  (esperado; ver
  [el servidor local](DESARROLLO.md#scriptsservidor-localjs--probar-en-el-navegador)).
- En un juego embebido por iframe a una URL externa, la página del
  juego es cross-origin: el texto "Cargando juego..." del wrapper
  desaparece cuando carga la *página* (liviana), y después el juego
  muestra su propia pantalla de carga mientras descarga el build.

## 5. Casos reales

### 5.1 Superfighters (id 111, Flash)

- Juego original gratuito de MythoLogic Interactive (2011), NO la
  secuela de pago "Superfighters Deluxe" (Steam).
- SWF: Flash 9, escenario 800x600 (4:3), verificado leyendo el header
  del archivo. El archivo de juego usa proporción 4:3 con cajas negras
  (patrón de `badicecream.html`, pero con `player.load()` explícito y
  manejo de errores).
- Fuente: mirror de GitHub servido por jsdelivr (CORS OK). Motivo
  documentado en el propio `html/juegos/superfighters.html`.

### 5.2 I Am Hall Security (id 112, HTML5/Unity)

- Juego gratuito de simulación 3D (guardia de una escuela) de
  GeniGames (2025), hecho con Unity WebGL (2022.3.39f1). Es HTML5,
  no Flash: no usa Ruffle ni `.swf`.
- El juego original vive en el CDN de Poki (`poki-gdn.com`), que
  bloquea el acceso directo (403) y tiene sitelock. Se enlaza en vivo
  a través del proxy `gamecdn.onl` (el mismo que usa Chicken Clicker
  para este juego): el proxy manda CORS, bloquea el sitelock, bloquea
  anuncios y oculta que el juego corre dentro de un iframe. Verificado:
  el index del juego y los 4 archivos del build (`Build2.*`) responden
  200 vía el proxy, y el master-loader de Poki no hace chequeos de
  host. No se sube ningún binario al repo.
- El wrapper es un iframe a pantalla completa; la página del juego se
  encarga del escalado y las cajas negras (resolución original 960x600,
  16:10).
- El iframe lleva `allow="autoplay; fullscreen; pointer-lock"`. Sin
  `pointer-lock`, el modo primera persona se buguea (la cámara gira
  pero el cursor no queda capturado y se ve por afuera del iframe).
  Nota: con el permiso puesto, el cursor puede seguir comportándose
  raro según el navegador — es un capricho del juego o del proxy, no
  de la integración, y se dejó así.
- El juego pesa ~46 MB: la primera carga tarda (1-3 min según la
  conexión) y aparece la pantalla de carga propia de Poki antes del
  juego.

## 6. Convenciones del proyecto

Las manda la constitución (`.specify/memory/constitution.md`): español, explicando el porqué; sin
emojis en lo nuevo; un cambio lógico por commit, y buscar lo que ya existe antes de escribir nada
(reglas I, XXX, V y XI). Para un juego, eso es seguir el patrón de los que ya están (Ruffle desde
jsdelivr, iframe con permisos, portadas 480x270, entrada en `js/datos-juegos.js`) y no inventar un
sistema paralelo.

## 7. Quitar un juego

Caso real: el 30 (The Binding of Isaac: Wrath of the Lamb - Eternal
Edition), quitado el 28/09/2026 porque no cargaba. No era un enlace
caído: sus tres trozos de SWF seguían respondiendo 200 en jsdelivr.

1. Borrar su entrada de `js/datos-juegos.js` y dejar en su lugar un
   comentario con el número, para que no se vuelva a usar.
2. Borrar su `<url>` de `sitemap.xml`.
3. Borrar el archivo del juego (`html/juegos/<slug>.html`) y la
   portada (`imagenes/juegos/<slug>.jpg`). Siguen en el historial de
   Git por si se quiere recuperar.

La base no se toca. El historial, los favoritos, las valoraciones, las
reseñas y el ranking semanal por juego guardan el número del juego
(`game_id`) y se quedan como están:

- Las páginas que buscan un juego por su número se saltan el que no
  está en el catálogo (perfil propio y ajeno, recomendaciones,
  personalización), y las estadísticas del panel de administración lo
  nombran "Juego #30".
- `jugar.html?id=30` dice "Juego no encontrado", y su ficha
  (`juego.html?id=30`) también, sin botón de jugar.
- Lo jugado antes sigue contando para la racha y las misiones.

Por eso el número no se reusa: un juego nuevo con el 30 heredaría ese
historial, esos favoritos y esas reseñas.

`tests/juego-quitado.test.js` vigila que el sitemap solo enlace juegos
del catálogo y que la ficha de uno quitado lo diga.
