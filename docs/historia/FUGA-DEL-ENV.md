# LA FUGA DEL .ENV — el servidor entregaba sus secretos (2/09/2026)

> **De qué trata:** cómo `GET /.env` devolvía la contraseña de Postgres y el secreto de las sesiones
> hasta que se descubrió el 2/09/2026: quién llegó a leerlo, qué alcance tuvo, qué se hizo y la
> lección que dejó.
>
> **Para quién:** quien toque cómo sirve `server.js` los archivos estáticos, o la configuración de
> nginx.
>
> **Revisado:** 05/10/2026

Salió el 05/10/2026, entera, de la referencia del servidor (`VPS.md`). Las IP de fuera van tapadas
(regla XXV de la constitución). Cómo se sirven hoy los archivos lo cuenta
[VPS](../referencia/VPS.md#la-lista-blanca-de-estáticos).

Vale la pena contarlo porque el fallo no estaba en nada de lo que se
instaló para protegerse, sino en algo anterior que nadie miró.

**Qué pasaba.** La raíz del sitio es la raíz del proyecto, y el servidor
de estáticos de `server.js` entregaba *cualquier* archivo que hubiera
ahí. `GET /.env` devolvía **200 con la contraseña de Postgres y el
`SESSION_SECRET` completos**. También salían `/.git/config`,
`/package.json` y el propio `server.js`.

**Se descubrió por casualidad**, probando otra cosa: al simular un
escaneo se vio que `/.env` y `/.git/config` respondían `200` donde el
resto daba `404`.

**Quién llegó a leerlo.** En el log, tres IPs de fuera bajaron el `.env`
con un `200`: `130.x.x.x` (dos veces), `64.x.x.x` y
`165.x.x.x`. Otras cuatro lo pidieron antes de que existiera el
dominio y solo se llevaron el redirect. Son escáneres automáticos, no
alguien que fuera a por este sitio — pero lo que se llevaron es real.

**Alcance.** Limitado, por dos cosas que sí estaban bien: Postgres solo
escucha en `127.0.0.1` y ufw no abre el 5432, así que **con esa
contraseña no se podía entrar desde internet**. Comprobado: cero
conexiones a Postgres desde fuera, cero usuarios nuevos, 63 usuarios
antes y después, y los 275 accesos SSH del día son todos de la IP del
administrador y todos por clave pública (`passwordauthentication no`).

**Qué se hizo.** Se rotaron las dos credenciales (generadas en el
servidor, la vieja comprobada como rechazada) y se tapó en las dos
capas: `esPublico()` en `server.js` y reglas equivalentes en nginx.

La lección: el filtro es **lista blanca por extensión**, no lista negra
de rutas. Una lista negra se queda corta en cuanto alguien añade un
archivo nuevo al proyecto — que es exactamente cómo se llegó aquí.

Si algún día se cambia esa función, la comprobación rápida es:

```bash
for R in /.env /.git/config /package.json /server.js; do
  curl -s -o /dev/null -w "%{http_code} $R\n" https://macroreborn.com$R
done   # las cuatro deben dar 404
```
