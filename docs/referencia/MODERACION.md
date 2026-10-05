# LA MODERACIÓN: ADVERTIR, SUSPENDER Y BANEAR

Decidido el 28/09/2026 con el administrador, pregunta por pregunta.
Hasta ese día "suspender" solo ponía una marca en la cuenta
(`users.suspendido`) que el servidor no miraba en ningún sitio: la única
cuenta suspendida siguió entrando y escribiendo. Y las advertencias del
panel no llegaban a nadie: el panel mandaba una notificación que el
servidor rechazaba, no miraba la respuesta y decía "enviada" (puntos 16 y
17 de `docs/listas/AUDITORIA.md`).

Se hace en cuatro partes. **Hechas la 1** (el servidor aplica
suspensiones y baneos, y las advertencias llegan) **y la 2** (lo escrito
por un baneado se tapa, su perfil lo dice y sale de las listas, ver 4);
faltan la 3 (IP) y la 4 (la marca en el navegador). Ver 7.

---

## 1. Los escalones

| Sanción | Quién | Qué hace |
|---|---|---|
| Advertir | moderadores y administradores | Le llega una notificación con el motivo y dónde reclamar. Queda en su historial |
| Suspender 1, 3, 7 o 30 días | moderadores y administradores | Puede entrar, jugar y mirar, pero no escribir. Se levanta sola al acabar |
| Banear | solo administradores | No puede entrar, y su sesión deja de valer en el acto. Lo que escribió se tapa y la cuenta sale de las listas (ver 4) |
| Levantar | la suspensión, moderadores y administradores; el baneo, solo administradores | Vuelve a la normalidad |

- **A un administrador no se le sanciona**, ni otro administrador. Nadie
  se sanciona a sí mismo.
- **El motivo es obligatorio**: es lo que lee la persona sancionada.
- **Todo queda en el historial de moderación**, apuntado por el servidor
  (antes lo apuntaba el panel, aunque la acción hubiera fallado).
- **Dónde se reclama**: en Discord, `https://discord.gg/tKjfsQ7GdG`. Sale
  en la notificación, en la franja y al intentar entrar.

**"No escribir"** es no poder: mandar mensajes al chat, comentar,
reseñar, mandar notificaciones a otros, mandar solicitudes de amistad ni
cambiar la biografía. Sí puede borrar lo suyo, aceptar o rechazar
solicitudes, jugar (el minuto de juego y "Jugar" siguen contando),
comprar en el Bazar y cobrar misiones. Lo que puede hacer se eligió así:
suspender es "no molestes a otros", no "no uses el sitio".

---

## 2. Dónde vive cada cosa

- **`migrations/026_sanciones.sql`**: la tabla `sanciones`. Una fila por
  sanción, con quién la puso, por qué, desde y hasta cuándo. Levantarla no
  la borra: se apunta cuándo y quién (`levantada_en`, `levantada_por`).
- **`api/_sanciones.js`**: la regla entera. Quién puede, a quién, el
  historial, el aviso a la cuenta, y lo que se mira en cada petición.
- **`api/_auth.js`**: `requerirAuth` contesta 403 con
  `codigo: "cuenta-baneada"`, el motivo y dónde reclamar; `obtenerAuth`
  trata a la cuenta baneada como si no trajera sesión.
- **`api/auth.js`**: el login de una cuenta baneada no da pase y dice por
  qué.
- **Las escrituras** (`api/content.js`, `api/social.js`,
  `api/users.js`): contestan 403 con `codigo: "cuenta-suspendida"`, hasta
  cuándo y el motivo.
- **`api/users.js`**: las acciones `warn`, `suspend` (con `dias`), `ban` y
  `reactivate`, y el estado de cada cuenta en sus listas (`suspendido`,
  `suspendido_hasta`, `motivo_suspension`, `baneado`). El motivo de un
  baneo no sale en ninguna lista, y el de una suspensión solo lo ven la
  propia cuenta y la moderación (hasta la parte 2 lo veía cualquiera).
- **En el navegador**: `js/core.js` cierra la sesión de una cuenta
  baneada y lo dice; `js/login.js` enseña el motivo al intentar entrar;
  `js/motor/permisos.js` pinta la franja de la cuenta suspendida y habla
  con el servidor; `js/admin.js` son los botones del panel.
- **Lo que ven los demás de una cuenta baneada**: ver 4.

**Lo que se mira en cada petición.** `requerirAuth` es síncrono y lo usa
todo el servidor, así que las sanciones en pie se tienen en memoria: son
muy pocas. Se cargan al arrancar (`server.js`, y también el servidor
local), cada 30 segundos por si acaso, y en el momento en que cambia una:
quien sanciona recarga en su proceso y avisa a los demás por la línea de
avisos (`api/_avisos.js`), que en producción cruza los procesos del
cluster con LISTEN/NOTIFY. El login no se fía de la memoria: mira la base.

---

## 3. El panel

Los moderadores solo tienen la pestaña de Reportes, y ahí, junto a cada
reporte con autor, salen sus botones. Los administradores, además, en la
pestaña de Usuarios. Qué botones salen depende de quién mira y del estado
de la cuenta: un moderador no ve "Banear", y a una cuenta de
administrador no le sale ninguno.

Suspender pregunta la duración (1, 3, 7 o 30 días) y el motivo; banear
pide confirmación y el motivo. Si el servidor dice que no, el panel lo
cuenta en vez de darlo por hecho.

El panel pide la lista de usuarios con `?moderacion=1`: es la única que
trae a las cuentas baneadas (ver 4), y el servidor solo se la da a la
moderación.

---

## 4. Lo que ven los demás de una cuenta baneada

La parte 2, hecha el 28/09/2026. Se decide **al leer**: no se borra ni se
cambia nada de lo guardado, así que **si se le levanta el baneo, vuelve
todo tal cual**. La regla vive en `api/_sanciones.js` ("LO QUE VEN LOS
DEMÁS"): el aviso, y dos trozos de SQL, "baneada" y "no baneada", que
usan todas las consultas.

**Lo que escribió se tapa.** En su lugar sale, en rojo,
"[Este usuario fue baneado y no es posible leer este mensaje]":

- en el **chat**, los **comentarios** de los perfiles y las **reseñas**:
  el servidor manda el aviso en vez del texto, con `autor_baneado`, y
  el navegador lo pinta en rojo (`MRTexto.escrito()` en `js/core.js`,
  la clase `.texto-baneado` en `css/inicio.css`). Se ve su nombre, con la
  silueta en vez de su avatar, y sin botones de responder, reportar ni
  "me gusta". La reseña sale además sin estrellas. El dueño de un perfil
  puede eliminar un comentario tapado que le dejaron;
- en su **biografía**, en su perfil.

**Su perfil dice "Cuenta baneada"** (`usuario.html`, `js/usuario.js`):
su nombre, la silueta, el aviso en lugar de la biografía y solo la
pestaña de inicio. Sin nivel, estadísticas, insignias, amigos,
actividad, comentarios, logros ni avatares guardados, y sin los botones
de amistad o bloqueo. El servidor tampoco da su actividad, su lista de
amigos ni su galería de avatares.

**Sale de las listas**:

| Dónde | Qué |
|---|---|
| Rankings | La lista de usuarios, de la que salen el ranking de Comunidad y las ligas; el ranking de los juegos originales. En el semanal se queda sin puesto y los demás corren uno, en el cálculo del lunes (hasta entonces, los números de "tu puesto" no cambian) |
| Comunidad | Los recién llegados, el equipo de moderación y la actividad |
| Buscador | No sale al buscar su nombre |
| Amigos de los demás | Las listas de amigos y de favoritos, y las solicitudes que mandó o recibió |
| Actividad | La de amigos y las menciones |

**Lo que no se toca**: los reportes (la moderación tiene que ver qué se
reportó); las notificaciones que ya llegaron; las estrellas y los "me
gusta" que dio a los juegos, que siguen contando; y lo que alguien tenga
ya abierto en pantalla, hasta que recargue.

---

## 5. Al activarla

La moderación se activó el 28/09/2026, y lo que se hizo ese día lo cuenta
[ACTIVAR LA MODERACIÓN](../historia/ACTIVAR-LA-MODERACION.md). De entonces queda una cosa: las columnas
viejas (`users.suspendido`, `fecha_suspension` y `motivo_suspension`) ya no se usan, y se quedan sin
tocar hasta quitarlas en una migración aparte.

---

## 6. Las pruebas

| Archivo | Qué sujeta |
|---|---|
| `tests/sanciones.test.js` | Quién puede qué, lo que bloquea cada sanción, el login, el plazo, el historial y las listas |
| `tests/moderacion-navegador.test.js` | El login de una baneada, la franja de una suspendida, lo que manda el panel y sus botones |
| `tests/sesion-navegador.test.js` | Que el navegador cierre la sesión de una baneada, y no la de una suspendida |
| `tests/baneadas.test.js` | Lo que el servidor tapa de una baneada, cada lista de la que sale, que el panel la siga viendo y que al levantar el baneo vuelva todo |
| `tests/baneadas-navegador.test.js` | El rojo, el chat y las reseñas tapadas, los comentarios de los perfiles y la página de una cuenta baneada |

---

## 7. Lo que falta, ya decidido

3. **Las IP**: se guardan las de cada cuenta 90 días (y se dice en los
   términos). Solo los administradores las ven y banean una IP, siempre
   aparte del baneo de la cuenta. Una IP baneada no entra, no se registra
   ni escribe, pero sí mira, y el baneo caduca a los 30 días. Se toma la
   IP que pone nginx, no la que puede falsear el visitante.
4. **La marca del navegador**: al banear una cuenta, su navegador queda
   marcado y no puede entrar con otra ni crear una nueva. Un baneo "por
   hardware" no se puede hacer desde una web: los navegadores no dejan
   leer nada del equipo.
