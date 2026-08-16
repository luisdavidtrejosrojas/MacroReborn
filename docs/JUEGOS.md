# Cómo agregar un juego al catálogo

Guía para desarrollar el trabajo de la rama `juego/superfighters` y,
en general, para agregar un juego nuevo al catálogo de MacroReborn.
Documenta el proceso completo con el ejemplo real de Superfighters
(id 111).

---

## 1. Qué cubre esta guía

- Cómo está armado el catálogo de juegos (dónde vive cada pieza).
- El proceso paso a paso para agregar un juego nuevo.
- Cómo probarlo localmente sin tocar la base real ni el servidor.
- Notas sobre Ruffle y CORS (por qué el SWF de Superfighters se sirve
  desde jsdelivr y no desde archive.org).

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

Tres formatos posibles, todos ya usados en el catálogo:

- **HTML embebible** (con `<base href>` a un CDN), como `chess.html`.
- **Juego HTML5 completo** (canvas + scripts), como
  `brawl-stars-remake.html`.
- **SWF con Ruffle** (para juegos Flash), como `superfighters.html`.

En el caso de un SWF, el archivo se reproduce con Ruffle
(`https://cdn.jsdelivr.net/npm/@ruffle-rs/ruffle@0.2.0-nightly.2025.10.2/ruffle.min.js`,
la misma versión que usan los demás juegos Flash del catálogo).

### 3.2 Guardar el archivo del juego

Crear `html/juegos/<slug>.html`. El `<slug>` suele coincidir con el
nombre del juego (ej: `superfighters.html`).

**Nota CORS para SWF (importante):** Ruffle descarga el SWF con
`fetch()` desde el navegador, y para eso el servidor que lo aloja
debe responder con el header `Access-Control-Allow-Origin`.
archive.org **no** lo envía (verificado), así que un SWF enlazado
directo a archive.org no carga en el navegador. jsdelivr **sí** lo
envía (`access-control-allow-origin: *`), por eso los SWF del
catálogo se sirven desde jsdelivr (a través de mirrors de GitHub),
igual que el resto del catálogo con CDNs de terceros. Ningún binario
se sube al repo.

### 3.3 Agregar la portada

- Archivo: `imagenes/juegos/<slug>.jpg`.
- Formato: JPEG de **480x270** (16:9), igual que las demás (verificadas
  con el header del archivo). Peso típico: 15-30 KB.

Si la portada todavía no existe, el sistema no se rompe:
`crearImagenJuego()` en `js/datos-juegos.js` muestra un placeholder
hasta que se agregue el campo `imagen`.

### 3.4 Agregar la entrada en el catálogo

En `js/datos-juegos.js`, agregar un objeto al array `juegos`. El `id`
debe ser el máximo existente + 1 (hoy: 111). Ejemplo real:

```js
{
    id: 111,
    nombre: "Superfighters",
    imagen: "imagenes/juegos/superfighters.jpg",
    categoria: "Lucha",
    estado: "⭐ Nuevo",
    tipo: "destacado",
    descripcion: "Controlá a pequeños luchadores y enfrentate en combates 2D llenos de acción...",
    iframe: "./html/juegos/superfighters.html"
},
```

- `categoria` debe ser una de las existentes (Plataformas, RPG,
  Acción, Terror, Simulación, Deportes, Estrategia, Lucha, Aventura,
  Arcade, Puzzles, Casual, Cooperativo).
- `estado` y `tipo`: hoy todos los juegos usan `estado: "⭐ Nuevo"` y
  `tipo: "destacado"`.
- `iframe` puede ser un archivo local (`./html/juegos/x.html`) o una
  URL externa embebible.

### 3.5 Actualizar el sitemap

En `sitemap.xml`, agregar la URL de la ficha con el mismo formato que
las demás (nota: el sitemap no está al día con los 110 juegos — solo
llega hasta el id 42 —, se agrega el juego nuevo nada más):

```xml
<url>
  <loc>https://www.macroreborn.com/juego.html?id=111</loc>
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
| Catálogo | `http://localhost:3001/juegos.html` | La tarjeta aparece (con portada o placeholder) sin romper el layout |
| Ficha | `http://localhost:3001/juego.html?id=111` | Título, categoría, descripción, portada |
| Jugar | `http://localhost:3001/jugar.html?id=111` | El iframe monta el juego y arranca el sistema de XP |

Notas:

- La consola del servidor local **no** imprime los pulsos de XP ni la
  actividad: solo imprime el aviso de migración de contraseñas del
  usuario `demo` (de la rama de contraseñas). Para ver el XP, abrir la
  pestaña Network del navegador (F12): cada 60 segundos aparece un
  POST a `/api/users?action=xp` con `gameId: 111`.
- En modo local solo están activos `/api/auth` y `/api/users`; las
  secciones que usan `/api/content` se ven vacías (esperado).

## 5. Caso real: Superfighters (id 111)

- Juego original gratuito de MythoLogic Interactive (2011), NO la
  secuela de pago "Superfighters Deluxe" (Steam).
- SWF: Flash 9, escenario 800x600 (4:3), verificado leyendo el header
  del archivo. El archivo de juego usa proporción 4:3 con cajas negras
  (patrón de `badicecream.html`, pero con `player.load()` explícito y
  manejo de errores).
- Fuente: mirror de GitHub servido por jsdelivr (CORS OK). Motivo
  documentado en el propio `html/juegos/superfighters.html`.
- Commit: `460b735` — "Agregar Superfighters (2011) al catálogo de
  juegos" (4 archivos: juego, portada, catálogo, sitemap).

## 6. Convenciones de este trabajo

Las mismas que el resto de la documentación:

- **Idioma**: comentarios y mensajes en español, explicando el "por
  qué".
- **Sin emojis**: en código, consola, commits y documentación nueva.
  Lo preexistente no se toca.
- **Commits**: autor "Luis David Trejos Rojas"
  `<luisdavid.trejosrojas@gmail.com>`, sin firmas ni pies de autoría
  automáticos, un cambio lógico por commit.
- **Reutilizar**: seguir el patrón de los juegos existentes (Ruffle
  desde jsdelivr, portadas 480x270, entrada en `datos-juegos.js`);
  no inventar un sistema paralelo.
