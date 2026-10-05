# SEO en MacroReborn — guía de mantenimiento

Este documento explica qué se hizo, por qué, y qué hay que recordar al
agregar páginas nuevas. Pensado para que cualquiera (o vos en seis
meses) pueda mantenerlo sin tener que releer todo el código.

⚠️ **Antes de publicar**: todo el sitio usa el dominio de ejemplo
`https://www.macroreborn.com` como placeholder (en los `<link
rel="canonical">`, Open Graph, `sitemap.xml` y `robots.txt`). Reemplazá
ese dominio por el real en todos esos archivos antes de salir a
producción. Es un buscar-y-reemplazar global de
`https://www.macroreborn.com` por tu dominio definitivo.

---

## 1. Qué se hizo en cada página

Cada una de las 15 páginas HTML tiene en su `<head>`:

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

### Tabla de indexación por página

| Página | robots | ¿Por qué? |
|---|---|---|
| `index.html` | `index, follow` | Home, contenido público evergreen |
| `juegos.html` | `index, follow` | Catálogo público, buen contenido de búsqueda |
| `juego.html` | `index, follow` | Ficha de cada juego (ver sección 2) |
| `comunidad.html` | `index, follow` | Directorio público de jugadores |
| `ranking.html` | `index, follow` | Contenido público, cambia seguido |
| `noticias.html` | `index, follow` | Contenido evergreen, bueno para SEO |
| `usuario.html` | `noindex, follow` | Perfiles públicos pero con contenido muy variable/escaso por ahora — mejor no indexarlos masivamente hasta v1.0. Se puede pasar a `index` más adelante si los perfiles tienen contenido sustancial (bio, reseñas, logros). |
| `perfil.html` | `noindex, follow` | Es "tu" perfil (siempre la misma URL para cualquier usuario logueado) — no hay nada único que indexar ahí |
| `amigos.html` | `noindex, follow` | Utilitaria, privada |
| `login.html` / `registro.html` | `noindex, follow` | Páginas de utilidad, sin valor de búsqueda propio |
| `jugar.html` | `noindex, follow` | Pantalla del iframe del juego — poco contenido propio, duplica intención con `juego.html`. El canonical dinámico apunta a la ficha del juego correspondiente. |
| `chat.html` | `noindex, nofollow` | Contenido en tiempo real generado por usuarios; `nofollow` extra porque el chat puede tener links pegados por usuarios |
| `notificaciones.html` | `noindex, nofollow` | Privada, sin contenido público |
| `admin.html` | `noindex, nofollow` | Panel de administración |

`follow` vs `nofollow`: casi todas usan `follow` para que Google
igual pueda recorrer los links del navbar hacia las páginas públicas.
Solo `chat.html` usa `nofollow` porque ahí los links los escriben
usuarios (no querés que Google le pase autoridad a lo que sea que
alguien pegue en el chat).

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
- `juegos.html` (dinámico, vía `juegos.js`): `ItemList` con las 42
  fichas del catálogo.

Podés verificar que cualquiera de estos bloques sea válido pegando la
página en el [Rich Results Test de
Google](https://search.google.com/test/rich-results).

---

## 4. `sitemap.xml` y `robots.txt`

- **`sitemap.xml`** se generó con un script (`gen_sitemap.py`, no
  forma parte del sitio, quedó solo como referencia si querés
  regenerarlo) que lee los IDs de juego directamente de
  `js/datos-juegos.js`. Si agregás juegos nuevos al catálogo, no te
  olvides de agregar también su URL al sitemap (o volver a correr un
  script similar). Contiene: home, catálogo, comunidad, ranking,
  noticias, y una entrada por cada ficha de juego. **No** incluye las
  páginas `noindex` (no tiene sentido pedirle a Google que indexe algo
  marcado como "no indexar").

- **`robots.txt`** solo bloquea `/admin.html` (no está enlazada desde
  ningún lado, así que bloquearla es gratis en términos de SEO). El
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
  `pngquant` (mismo formato, mismo nombre, mismas dimensiones — cero
  cambios de código): pasaron de **17 MB a ~4.8 MB** en total (-72%)
  sin pérdida visible.
- Todas las imágenes tienen `alt` descriptivo (portadas de juego,
  logo, avatares con nombre) o `alt=""` cuando son decorativas y el
  texto de al lado ya las identifica (evita que un lector de pantalla
  anuncie lo mismo dos veces).
- `loading="lazy"` en toda imagen que normalmente aparece fuera de la
  pantalla inicial: catálogo de juegos, listas de comentarios, chat,
  ranking, tarjetas de la comunidad.
- La imagen principal de la ficha de un juego (`juego.html`, la
  portada grande) carga con `loading="eager" fetchpriority="high"` en
  vez de lazy — es lo primero que se ve, así que lazy-loadearla
  perjudicaría el tiempo de carga percibido (Largest Contentful
  Paint).
- Se creó `imagenes/og-image.png` (1200×630, con los mismos colores e
  identidad visual del sitio) para que compartir un link de
  MacroReborn se vea bien en redes sociales.

Si agregás portadas de juego nuevas, corré `pngquant --quality=65-85
--strip archivo.png` (o `--quality=40-85` si se resiste) antes de
subirlas al repo.

---

## 6. Estructura semántica y encabezados

Cada página tiene ahora exactamente un `<h1>` (antes `juego.html`,
`jugar.html`, `chat.html` y `noticias.html` no tenían ninguno, y
`admin.html` tenía dos). La estructura ya usaba bastante bien
`<header>`, `<main>`, `<nav>`, `<footer>` y `<section>` desde antes;
no hizo falta tocar eso.

---

## 7. URLs limpias — recomendación para la v1.0

Hoy el sitio es HTML estático puro, y páginas como `juego.html?id=7`
o `usuario.html?id=nombre` usan query strings. Funciona bien y es
válido, pero para la v1.0 (con dominio propio y, probablemente, algo
de backend) conviene migrar a URLs "limpias":

```
juego.html?id=7            →  /juegos/baldis-basics
usuario.html?id=nombre     →  /jugador/nombre
```

Esto **no se implementó ahora** porque requiere decidir primero cómo
se va a hostear la v1.0:

- **Sigue siendo estático** (Netlify, Vercel, GitHub Pages, etc.): se
  logra con reglas de *rewrite* del hosting (por ejemplo, un
  `_redirects` en Netlify: `/juegos/:slug  /juego.html?id=:slug  200`)
  más un pequeño cambio en `juego.js` para leer el slug de la URL en
  vez de (o además de) `?id=`. Es la opción más simple, no rompe nada
  de lo que ya funciona.
- **Pasa a tener backend real** (Node/Express, PHP, etc.): ahí las
  URLs limpias se resuelven del lado del servidor de forma nativa, y
  además permite server-side rendering (mejor todavía para SEO, sobre
  todo si la ficha de cada juego se sirve ya con su `<title>` y meta
  tags correctos sin depender de que el JS termine de ejecutar).

Cualquiera de los dos caminos es compatible con todo lo que se hizo en
esta pasada de SEO (el `id` numérico de cada juego en
`datos-juegos.js` puede convertirse en slug fácilmente, ej. agregando
un campo `slug: "baldis-basics"` a cada juego).

---

## 8. Rendimiento — qué ya estaba bien

El proyecto ya venía con `preconnect` + `display=swap` para Google
Fonts en las 15 páginas, así que no hizo falta tocar la carga de
fuentes.
