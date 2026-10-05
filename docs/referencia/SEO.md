# SEO — lo que ven los buscadores y las redes

> **De qué trata:** cómo se presenta el sitio a los buscadores y al compartir un enlace: las etiquetas
> de cada página y cuáles se indexan, el SEO de las páginas que cambian según la URL, los datos
> estructurados, el sitemap y `robots.txt`, las imágenes, los encabezados, la carga de fuentes y lo que
> queda para las URL limpias.
>
> **Para quién:** el equipo de desarrollo, sobre todo al añadir una página.
>
> **Revisado:** 05/10/2026

Este documento explica qué se hizo, por qué, y qué hay que recordar al
agregar páginas nuevas. La pasada de SEO es de antes del 23/07/2026, cuando
el sitio tenía 15 páginas; lo que llegó después va con su fecha.

**El dominio.** Las URL absolutas (el `canonical`, Open Graph, `sitemap.xml` y `robots.txt`) usan
`https://www.macroreborn.com`, que es el dominio real. El sitio contesta igual en `macroreborn.com` y
en `www`, sin redirigir de uno a otro, y el `canonical` hace que los buscadores se queden con la de
`www` ([el dominio](VPS.md#7-dominio-y-https)).

---

## 1. Qué se hizo en cada página

Las páginas de la pasada de SEO tienen en su `<head>`:

- `<title>` único y descriptivo (no el mismo texto repetido en todas).
- `<meta name="description">` propia, pensada para lo que esa página
  ofrece.
- `<link rel="canonical">` — la URL "oficial" de esa página.
- `<meta name="robots">` — decide si se indexa o no (ver tabla abajo).
- Open Graph completo (`og:title`, `og:description`, `og:image`,
  `og:url`, `og:type`, `og:site_name`, `og:locale`) y Twitter Card
  (`summary_large_image`), para que al compartir un link en WhatsApp,
  Twitter/X, Facebook, etc. se vea una tarjeta con imagen, título y
  descripción en vez de solo el link pelado.
- Favicon y `apple-touch-icon` (usan `imagenes/logo.png`, no había
  ninguno antes).
- `theme-color` para que el navegador tiña su barra superior en
  móviles con el color del sitio.

El 05/10/2026 lo llevan entero 14 de las 30 páginas. A las demás les falta algo, casi siempre Open
Graph y Twitter Card, y entre ellas hay tres que están en el sitemap: `categoria.html`,
`coleccion.html` y `terminos.html`.

### Tabla de indexación por página

| Página | robots | ¿Por qué? |
|---|---|---|
| `index.html` | `index, follow` | Home, contenido público evergreen |
| `juegos.html` | `index, follow` | Catálogo público, buen contenido de búsqueda |
| `juego.html` | `index, follow` | Ficha de cada juego ([SEO dinámico](#2-juegohtml-jugarhtml-y-usuariohtml-seo-dinámico)) |
| `comunidad-ranking.html` | `index, follow` | Comunidad y ranking, juntos en una página |
| `noticias.html` | `index, follow` | Contenido evergreen, bueno para SEO |
| `bazar.html` | `index, follow` | El Bazar, las prendas a la venta |
| `categoria.html`, `coleccion.html`, `terminos.html` | sin etiqueta, así que se indexan | Están en el sitemap |
| `usuario.html` | `noindex, follow` | Perfiles públicos pero con contenido muy variable/escaso por ahora — mejor no indexarlos masivamente hasta v1.0. Se puede pasar a `index` más adelante si los perfiles tienen contenido sustancial (bio, reseñas, logros). |
| `perfil.html` | `noindex, follow` | Es "tu" perfil (siempre la misma URL para cualquier usuario logueado) — no hay nada único que indexar ahí |
| `amigos.html` | `noindex, follow` | Utilitaria, privada |
| `login.html` / `registro.html` | `noindex, follow` | Páginas de utilidad, sin valor de búsqueda propio |
| `jugar.html` | `noindex, follow` | Pantalla del iframe del juego — poco contenido propio, duplica intención con `juego.html`. El canonical dinámico apunta a la ficha del juego correspondiente. |
| `notificaciones.html` | `noindex, follow` | Privada, sin contenido público |
| `chat.html` | `noindex, nofollow` | Contenido en tiempo real generado por usuarios; `nofollow` extra porque el chat puede tener links pegados por usuarios |
| `admin.html`, `arte.html`, `taller.html` | `noindex, nofollow` | Los paneles de la administración y del equipo de arte |
| `comunidad.html`, `ranking.html`, `tienda.html` | `noindex, follow` | Direcciones viejas: redirigen a `comunidad-ranking.html` y a `bazar.html`, y su `canonical` apunta allí |
| `actividad-comunidad.html`, `explorar.html`, `liga-global.html`, `macro-originals.html`, `mi-dia.html`, `originales-competicion.html`, `progreso.html` | sin etiqueta, así que se indexan | No están en el sitemap |

`follow` vs `nofollow`: casi todas usan `follow` para que Google
igual pueda recorrer los links del navbar hacia las páginas públicas.
Usan `nofollow` `chat.html`, porque ahí los links los escriben usuarios
(no querés que Google le pase autoridad a lo que sea que alguien pegue
en el chat), y los paneles de la administración y del equipo de arte.

---

## 2. `juego.html`, `jugar.html` y `usuario.html`: SEO dinámico

Estas tres páginas son un único archivo HTML que muestra contenido
distinto según un parámetro en la URL (`?id=`). El `<head>` estático
tiene valores por defecto (fallback), pero **`js/seo.js`** los
sobreescribe en tiempo de ejecución apenas se conoce qué juego/usuario
se está mostrando:

- `juego.js` actualiza título, descripción, canonical, OG/Twitter, e
  inyecta dos bloques de datos estructurados (JSON-LD): `VideoGame` y
  `BreadcrumbList`.
- `jugar.js` actualiza el título de la pestaña y apunta el canonical a
  la ficha del juego (`juego.html?id=...`), porque esa es la versión
  "de verdad" indexable.
- `usuario.js` actualiza título y descripción con el nombre real del
  jugador.

**Si agregás una página nueva con el mismo patrón** (un archivo que
muestra contenido distinto según la URL), incluí `js/seo.js` en el
`<head>` y llamá a `seoActualizar({...})` con los datos ya cargados.
Mirá `js/seo.js` — son ~70 líneas simples, con comentarios.

---

## 3. Datos estructurados (Schema.org / JSON-LD)

- `index.html`: `Organization` + `WebSite` (estático, describen el
  sitio en general).
- `juego.html` (dinámico, vía `juego.js`): `VideoGame` con nombre,
  descripción, imagen, género y precio (gratis); `BreadcrumbList`
  Juegos → nombre del juego.
- `juegos.html` (dinámico, vía `juegos.js`): `ItemList` con todas las
  fichas del catálogo (112 el 05/10/2026).

Podés verificar que cualquiera de estos bloques sea válido pegando la
página en el [Rich Results Test de
Google](https://search.google.com/test/rich-results).

---

## 4. `sitemap.xml` y `robots.txt`

- **`sitemap.xml`** se mantiene a mano: no hay script que lo genere en el
  repositorio. El 05/10/2026 tiene 136 direcciones: la home, el
  catálogo, Comunidad, el Bazar, las noticias, los términos, 13
  categorías, 6 colecciones y las fichas de 111 de los 112 juegos (falta
  la de Macro Snake, el 113). Cómo se agrega la de un juego nuevo:
  [JUEGOS](../guias/JUEGOS.md#35-actualizar-el-sitemap), y
  `tests/juego-quitado.test.js` vigila que no enlace juegos que ya no
  están. **No** incluye las páginas `noindex` (no tiene sentido pedirle a
  Google que indexe algo marcado como "no indexar").

- **`robots.txt`** bloquea `/admin.html` (no está enlazada desde ningún
  lado, así que bloquearla es gratis en términos de SEO) y `/api/`. El
  resto de las páginas privadas/utilitarias **no** están bloqueadas
  acá a propósito: usan `noindex` en su `<head>`, y para que Google
  respete esa etiqueta necesita poder rastrear la página. Si la
  bloqueás también por `robots.txt`, Google no llega a leer el
  `noindex` y a veces termina mostrando la URL pelada igual (sin
  título ni descripción) en vez de excluirla del todo — es un error
  común, evitalo.

Ambos archivos van en la raíz del sitio (mismo nivel que
`index.html`) para que sean accesibles en `/sitemap.xml` y
`/robots.txt`.

---

## 5. Imágenes

- Las portadas de juego (`imagenes/juegos/*.png`) se comprimieron con
  `pngquant`, antes del 23/07/2026 (mismo formato, mismo nombre, mismas
  dimensiones — cero cambios de código): pasaron de **17 MB a ~4.8 MB**
  en total (-72%) sin pérdida visible.
- Todas las imágenes tienen `alt` descriptivo (portadas de juego,
  logo, avatares con nombre) o `alt=""` cuando son decorativas y el
  texto de al lado ya las identifica (evita que un lector de pantalla
  anuncie lo mismo dos veces).
- `loading="lazy"` en toda imagen que normalmente aparece fuera de la
  pantalla inicial: catálogo de juegos, listas de comentarios, chat,
  ranking, tarjetas de la comunidad.
- La imagen principal de la ficha de un juego (`juego.html`, la
  portada grande) carga con `loading="eager" fetchpriority="high"` en
  vez de lazy (`crearImagenJuego`, en `js/datos-juegos.js`) — es lo
  primero que se ve, así que lazy-loadearla perjudicaría el tiempo de
  carga percibido (Largest Contentful Paint).
- Se creó `imagenes/og-image.png` (1200×630, con los mismos colores e
  identidad visual del sitio) para que compartir un link de
  MacroReborn se vea bien en redes sociales.

Si agregás portadas de juego nuevas, corré `pngquant --quality=65-85
--strip archivo.png` (o `--quality=40-85` si se resiste) antes de
subirlas al repo.

---

## 6. Estructura semántica y encabezados

Cada página tiene un `<h1>` (antes de la pasada de SEO, `juego.html`,
`jugar.html`, `chat.html` y `noticias.html` no tenían ninguno, y
`admin.html` tenía dos). El 05/10/2026 hay dos excepciones: `index.html`
tiene dos, el del portal y el del título del sitio, y las tres
direcciones viejas que solo redirigen no tienen ninguno. La estructura
ya usaba bastante bien `<header>`, `<main>`, `<nav>`, `<footer>` y
`<section>` desde antes; no hizo falta tocar eso.

---

## 7. Rendimiento — qué ya estaba bien

El proyecto ya venía con `preconnect` + `display=swap` para Google
Fonts, así que no hizo falta tocar la carga de fuentes. El 05/10/2026
lo llevan las 28 páginas que cargan fuentes; las otras dos,
`comunidad.html` y `tienda.html`, solo redirigen.

---

## 8. Lo que queda: URLs limpias

Páginas como `juego.html?id=7` o `usuario.html?id=nombre` usan query
strings. Funciona bien y es válido, pero conviene migrar a URLs
"limpias":

```
juego.html?id=7            →  /juegos/baldis-basics
usuario.html?id=nombre     →  /jugador/nombre
```

Cuando se escribió esto el sitio era estático, y cómo hacerlo dependía
de dónde se alojara. Desde el 01/09/2026 tiene servidor propio
(`server.js` detrás de nginx, ver [VPS](VPS.md)), así que las URL
limpias se pueden resolver en el servidor, que además podría servir la
ficha de cada juego con su `<title>` y sus metadatos sin depender de que
el JS termine de ejecutar. El `id` numérico de cada juego en
`js/datos-juegos.js` puede convertirse en slug fácilmente, ej.
agregando un campo `slug: "baldis-basics"` a cada juego. No está
decidido ni hecho.
