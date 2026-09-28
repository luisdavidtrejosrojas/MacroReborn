# LA MODERACIÓN: ADVERTIR, SUSPENDER Y BANEAR

Decidido el 28/09/2026 con el administrador, pregunta por pregunta.
Hasta ese día "suspender" solo ponía una marca en la cuenta
(`users.suspendido`) que el servidor no miraba en ningún sitio: la única
cuenta suspendida siguió entrando y escribiendo. Y las advertencias del
panel no llegaban a nadie: el panel mandaba una notificación que el
servidor rechazaba, no miraba la respuesta y decía "enviada" (puntos 16 y
17 de `docs/AUDITORIA.md`).

Se hace en cuatro partes. **Hecha la 1** (el servidor aplica suspensiones
y baneos, y las advertencias llegan); faltan la 2 (lo escrito por un
baneado se tapa y su perfil lo dice), la 3 (IP) y la 4 (la marca en el
navegador). Ver 6.

---

## 1. Los escalones

| Sanción | Quién | Qué hace |
|---|---|---|
| Advertir | moderadores y administradores | Le llega una notificación con el motivo y dónde reclamar. Queda en su historial |
| Suspender 1, 3, 7 o 30 días | moderadores y administradores | Puede entrar, jugar y mirar, pero no escribir. Se levanta sola al acabar |
| Banear | solo administradores | No puede entrar, y su sesión deja de valer en el acto |
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
  baneo no sale en ninguna lista.
- **En el navegador**: `js/core.js` cierra la sesión de una cuenta
  baneada y lo dice; `js/login.js` enseña el motivo al intentar entrar;
  `js/motor/permisos.js` pinta la franja de la cuenta suspendida y habla
  con el servidor; `js/admin.js` son los botones del panel.

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

---

## 4. Lo que se hizo al activarlo

- **"Pene grande"**, la cuenta suspendida el 15/09 por nombre
  inapropiado (que siguió entrando: el 20/09 lo hizo), quedó baneada,
  también decidido ese día.
- Las columnas viejas (`users.suspendido`, `fecha_suspension`,
  `motivo_suspension`) ya no se usan. Se quedan, sin tocar, hasta
  quitarlas en una migración aparte.

---

## 5. Las pruebas

| Archivo | Qué sujeta |
|---|---|
| `tests/sanciones.test.js` | Quién puede qué, lo que bloquea cada sanción, el login, el plazo, el historial y las listas |
| `tests/moderacion-navegador.test.js` | El login de una baneada, la franja de una suspendida, lo que manda el panel y sus botones |
| `tests/sesion-navegador.test.js` | Que el navegador cierre la sesión de una baneada, y no la de una suspendida |

---

## 6. Lo que falta, ya decidido

2. **Lo escrito por un baneado se tapa** en rojo: "[Este usuario fue
   baneado y no es posible leer este mensaje]", en comentarios, reseñas,
   chat y biografía. Su perfil dice "Cuenta baneada" (sin biografía,
   avatar ni actividad) y sale de los rankings, de Comunidad, del buscador
   y de las listas de amigos de otros. Si se le quita el baneo, vuelve
   todo.
3. **Las IP**: se guardan las de cada cuenta 90 días (y se dice en los
   términos). Solo los administradores las ven y banean una IP, siempre
   aparte del baneo de la cuenta. Una IP baneada no entra, no se registra
   ni escribe, pero sí mira, y el baneo caduca a los 30 días. Se toma la
   IP que pone nginx, no la que puede falsear el visitante.
4. **La marca del navegador**: al banear una cuenta, su navegador queda
   marcado y no puede entrar con otra ni crear una nueva. Un baneo "por
   hardware" no se puede hacer desde una web: los navegadores no dejan
   leer nada del equipo.
