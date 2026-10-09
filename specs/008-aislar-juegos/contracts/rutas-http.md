# Contrato: qué responde cada dirección

Lo cumplen `server.js` y `scripts/servidor-local.js` a través de `api/_juegos-aparte.js` (research D3), y
nginx en producción (D4). `<juego>` es el nombre de un envoltorio de terceros que está en `html/juegos/`.
En local, la web es `http://localhost:<p>` y los juegos, `http://localhost:<p+1>`.

## La web (`macroreborn.com` y `www.macroreborn.com`)

| Petición | Respuesta |
|---|---|
| `GET /html/juegos/<juego>.html` | **302**, `Location: https://juegos.macroreborn.com/html/juegos/<juego>.html`, con la misma consulta (`?...`) |
| `GET /html/juegos/macro-snake.html`, `.css` y `.js` | **200**, como hoy |
| `GET /html/juegos/_mudanza.html`, `_mudanza.js` y `_puente.js` | **404** |
| Un `<juego>` que no existe | **404**, como hoy |
| Todo lo demás | como hoy |

## La dirección de los juegos (`juegos.macroreborn.com`)

| Petición | Respuesta |
|---|---|
| `GET` o `HEAD /html/juegos/<juego>.html` | **200**, el envoltorio con el puente dentro (ver abajo) |
| `GET /html/juegos/_mudanza.html` | **200**, sin puente |
| `GET /html/juegos/_mudanza.js` | **200**, `text/javascript; charset=utf-8` |
| `GET /html/juegos/macro-snake.*` y `/html/juegos/_puente.js` | **404** |
| `GET /api/...`, `/`, cualquier otra ruta | **404** (nginx ya no la pasa a Node; Node también da 404) |
| Una ruta con `..`, codificada o no, o con subcarpetas | **400** o **404**, nunca un archivo de fuera de `html/juegos/` |
| Cualquier método que no sea `GET` ni `HEAD` | **405** |

### Las cabeceras de un 200

| Cabecera | Valor | Quién la pone |
|---|---|---|
| `Content-Type` | `text/html; charset=utf-8` (o `text/javascript; charset=utf-8`) | Node |
| `Content-Security-Policy` | `frame-ancestors https://macroreborn.com https://www.macroreborn.com` | Node |
| `Cache-Control` | `no-cache` | Node |
| `ETag` | del archivo y de la versión del puente; con `If-None-Match` igual, **304** | Node |
| `X-Robots-Tag` | `noindex`: la dirección de los juegos no sale en los buscadores | Node |
| `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security` | las de la web | nginx |
| `X-Frame-Options` | **no va**: impediría meter el juego en la página | — |

### El puente dentro del envoltorio

El contenido de `html/juegos/_puente.js`, en un `<script>` en línea, justo después de la etiqueta de
apertura de `<head>`. Si no hay `<head>`, después de la de `<html>`. Si tampoco, después del
`<!doctype>`. Si no hay nada de eso, al principio. Nunca antes del `<!doctype>`, que pondría la página en
modo quirks. El resto del archivo sale tal cual.

## nginx en producción

- `juegos.macroreborn.com`, en el 443 (IPv4 e IPv6, con HTTP/2), con el mismo certificado que la web:
  solo `location ^~ /html/juegos/` va a Node (`127.0.0.1:3000`, con `Host` y el límite `general`), y
  `location /` da 404.
- En el 80, el nombre nuevo redirige con un 301 a HTTPS, como los otros dos.
- La web no cambia en nginx: la redirección del 302 la da Node.
