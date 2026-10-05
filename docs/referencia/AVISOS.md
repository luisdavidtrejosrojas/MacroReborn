# AVISOS EN VIVO — lo que aparece sin recargar

> **De qué trata:** cómo llega al navegador, sin recargar, lo que pasa en el sitio (una mención, una
> solicitud de amistad, un comentario): Server-Sent Events servidos por la propia máquina, sus piezas,
> los dos procesos, los límites y quién puede oír qué.
>
> **Para quién:** el equipo de desarrollo.
>
> **Revisado:** 05/10/2026

Cuando alguien te menciona, te manda una solicitud de amistad o comenta
en tu perfil, eso aparece sin que recargues. Este documento cuenta cómo, y
por qué la respuesta cambió en septiembre de 2026.

## El problema de fondo

La web funciona a preguntas: el navegador pide, el servidor contesta,
siempre en ese orden. El servidor no puede hablar primero. Para que algo
aparezca solo hace falta una conexión que quede **abierta**, por la que
el servidor pueda escribir cuando tenga algo que contar.

Eso lo hacía **Pusher**, un servicio que alquila esas conexiones. Y no
era un capricho: en Vercel el código del servidor corría en funciones que
viven unos segundos y se apagan, y una función así no puede sostener nada
abierto. Era la única salida posible.

## Las dos semanas sin avisos

Tras la mudanza al VPS los avisos pasaron dos semanas sin funcionar sin que nadie lo notara, porque el
módulo de Pusher callaba si le faltaban sus variables. Lo cuenta [AVISOS-ROTOS](../historia/AVISOS-ROTOS.md).

## Lo que hay ahora

Server-Sent Events, servidos por la propia máquina. Cero dependencias
nuevas y dos menos: el paquete `pusher` y el `<script>` de
`js.pusher.com` que cargaban entonces las 22 páginas.

Un SSE es una respuesta HTTP que no se cierra. El navegador pide una vez
y el servidor le va escribiendo líneas:

```
event: nueva-notificacion
data: {"canal":"notificaciones-luis","datos":{"titulo":"Te mencionaron"}}
```

Una línea en blanco cierra cada aviso y una que empieza por `:` es un
comentario que el navegador ignora. Ese es todo el protocolo.

**Se eligió SSE y no WebSocket** porque los avisos del sitio van todos en
una sola dirección, del servidor al navegador. Ninguno va al revés: un
mensaje de chat se manda por una petición normal. Un WebSocket es una
línea de dos direcciones y aquí sobraría la mitad — además de necesitar
una librería en el servidor, que SSE no necesita.

## Las piezas

| Fichero | Qué hace |
|---|---|
| `api/_avisos.js` | El reparto. `avisar(canal, evento, datos)` y el registro de quién escucha qué. No sabe nada de HTTP, que es lo que deja probarlo sin levantar un servidor. |
| `api/_avisos-sse.js` | La cara HTTP: `/api/avisos`, donde el navegador deja la línea abierta. |
| `js/avisos.js` | La mitad del navegador. `MRAvisos.escuchar(canal, evento, fn)`. |
| `api/_auth.js` | El pase de un minuto con el que la línea demuestra de quién es. |
| `js/realtime.js`, `js/perfil-realtime.js`, `js/usuario.js` | Los tres que escuchan. |

`/api/avisos` **no pasa por el despacho de `/api/` de `server.js`**: ese
despacho junta el cuerpo entero de la petición y contesta de una sola vez
con un `res` simulado. Aquí hace falta lo contrario, el `res` de verdad y
no cerrarlo, así que se intercepta antes.

## El detalle que lo complica: dos procesos

`cluster.js` arranca dos copias de `server.js`. La conexión abierta de
una persona la sostiene **una sola** de ellas, y el aviso puede generarse
en la otra, que no la tiene y no puede alcanzarla. El propio `cluster.js`
lo dejó advertido: *"si algún día se guarda algo en memoria y se espera
que persista, dejará de serlo"*.

Se resuelve sin añadir nada: Postgres trae `LISTEN`/`NOTIFY`. Quien
genera el aviso hace `NOTIFY`, los dos procesos escuchan, y el que
sostiene la conexión la atiende. Hace falta una conexión `pg` **propia**
y no una del pool: un `LISTEN` vive en la conexión que lo declara, y una
del pool vuelve al pool en cuanto termina la consulta.

Sin puente —en los tests, o con un solo proceso— la entrega dentro del
proceso es la entrega completa, y es correcta. Por eso `npm run db:local`
funciona igual sin configurar nada.

## Los límites, y por qué están

Antes este riesgo lo absorbía Pusher; ahora lo absorbe una máquina de
950 MB.

- **400 conexiones por proceso.** Pasado eso, un 503 con `Retry-After`.
- **4 canales por conexión.** `js/usuario.js` necesita dos; sin tope, una
  URL escrita a mano apunta una conexión a mil canales.
- **1 MB pendiente por conexión.** Si el navegador deja de leer —pestaña
  congelada, red muerta— Node acumula en memoria lo que no puede
  entregar. Pasado ese tamaño se corta esa conexión; el navegador
  reconecta solo.
- **7000 bytes por aviso**, con margen bajo el tope de 8000 de `NOTIFY`
  (`TOPE_CARGA` en `api/_avisos.js`). Si uno se pasa, viaja sin contenido: casi todas las escuchas del navegador lo ignoran y
  vuelven a pedir lo que necesitan.

## Tres cosas que no son adorno

**`X-Accel-Buffering: no`.** Sin esa cabecera nginx acumula la respuesta
en su buffer y no suelta un byte hasta que termine — y ésta no termina.
El bloque `location = /api/avisos` de `infra/nginx/macroreborn.conf`
repite lo mismo con `proxy_buffering off`: van las dos porque una es la
intención del programa y la otra la del sitio, y el día que ese bloque se
pierda en una reinstalación la cabecera lo salva.

**Un latido cada 25 segundos.** Es la única forma de enterarse de que el
navegador se fue sin avisar, y mantiene viva la línea ante cualquier
proxy que la corte a los 60 segundos sin datos, que es lo que hace nginx
por defecto (el bloque de `/api/avisos` sube su `proxy_read_timeout` a una
hora).

**El `retry` se reparte al azar entre 5 y 10 segundos.** Al reiniciar el
servicio se caen todas las conexiones a la vez; con un valor fijo
volverían todas al mismo segundo.

## Lo que el navegador tiene que hacer y no es evidente

`EventSource` reconecta solo cuando se corta la red, pero **se rinde para
siempre** si el servidor contesta algo que no sea un 200 — por ejemplo el
503 de "este proceso está lleno". Sin un reintento a mano, esa pestaña se
queda muda hasta que alguien recargue, y nada en pantalla lo diría.
`js/avisos.js` distingue los dos casos por `readyState`: `CONNECTING` es
el navegador ya ocupándose, `CLOSED` es que se rindió.

Y como esto **no es un bus con historia** —lo que no se entregó no se
guarda en ningún sitio— quien vuelve de una caída tiene que volver a
pedir. De ahí `MRAvisos.alReconectar()`, que los tres ficheros usan para
repescar la campanita, los comentarios, la actividad y los logros.

## Quién puede oír qué

Por el canal de una persona viajan siete avisos, y no todos son de la
misma naturaleza. Dos son suyos y de nadie más: `nueva-notificacion`
lleva dentro el título y el texto de lo que acaba de llegar al buzón, y
`estado-bloqueo` dice quién la bloqueó o desbloqueó. Los otros cinco son
lo que su perfil ya enseña a cualquiera que lo abra, con cuenta o sin ella.

Hasta el 21 de septiembre de 2026 los siete salían por cualquier línea:
bastaba pedir `notificaciones-fulano` sin cuenta para leer el buzón de
fulano en vivo. El nombre del canal era público a propósito desde los
tiempos de Pusher, cuando el aviso era un toque sin contenido; al
sustituirlo, la notificación entera empezó a viajar dentro y nadie volvió
a mirar quién escuchaba.

Ahora la línea sigue sin pedir sesión para abrirse, porque un visitante
anónimo mirando un perfil tiene que seguir viendo los comentarios al
vuelo. Lo que cambia es que los dos avisos privados **solo salen por la
línea que demostró ser de su dueño**.

Demostrarlo tiene truco: `EventSource` no puede mandar cabeceras, así que
la línea no puede llevar la sesión como el resto de la API, y meter el
token de siete días en la URL lo dejaría en el registro de nginx durante
dos semanas. En su lugar, `js/avisos.js` pide primero un **pase de un
minuto** por `/api/content?action=avisos-pase`, con la cabecera de
siempre, y abre la línea con `&pase=...` en la URL. El pase lleva la
misma firma que la sesión pero un `uso` que la sesión rechaza y el pase
exige: ninguno vale por el otro (`api/_auth.js`, "EL PASE").

Pase malo o caducado: 401. Es 401 y no 403 a propósito: `EventSource` se
rinde ante cualquier código que no sea 200, y el reintento a mano de
`js/avisos.js` entiende esa rendición como "pide otro pase y vuelve".

## Cómo probarlo

Automático, con `npm run test:smoke`: abre la conexión como un navegador,
dispara un latido y comprueba que el aviso llega por la línea. Es lo
único que ejercita la cadena entera; las suites prueban cada pieza por
separado.

A mano:

1. `npm run db:local` y entrar como `demo` / `demo1234`.
2. Abrir DevTools → Network, filtrar por `avisos`. Debe aparecer **una**
   petición a `/api/avisos?canales=notificaciones-demo&pase=...` en estado
   pendiente, que no termina. Una sola, aunque la página cargue varios
   ficheros que escuchan.
3. En la pestaña Response se ve llegar `: latido` cada 25 segundos.
4. Sin haber entrado, en la portada esa petición **no** debe existir:
   quien no tiene sesión no abre conexión allí. En un perfil sí se abre,
   sin `pase`, para repintar comentarios y actividad al vuelo.
5. Justo antes de la línea tiene que verse una petición a
   `/api/content?action=avisos-pase` que devuelve el pase. Sin sesión,
   esa petición contesta 401.
6. Desde una terminal, `curl -N "http://localhost:3001/api/avisos?canales=notificaciones-demo"`
   deja una línea anónima abierta sobre el canal de demo. Mandarle una
   notificación a demo desde otra cuenta: por esa línea no debe llegar
   nada, y en la pestaña de demo sí. Un comentario en el perfil de demo,
   en cambio, llega por las dos.
