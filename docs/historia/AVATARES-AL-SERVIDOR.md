# AVATARES AL SERVIDOR — el plan, sus cinco fases y lo medido (21 al 28/09/2026)

> **De qué trata:** el plan de pasar la composición de los avatares al servidor: por qué se decidió el
> 21/09/2026, lo que se midió sobre el VPS, el razonamiento de guardarlos en disco, las cinco fases
> con lo que se validó al cerrar cada una, lo que se aprendió de macrojuegos para la dirección y las
> previsualizaciones, y cómo se decidió la foto de perfil.
>
> **Para quién:** quien quiera saber por qué los avatares funcionan como funcionan, o vaya a tocar el
> compositor, sus direcciones o la puerta de `/prendas/`.
>
> **Revisado:** 05/10/2026

Salió el 05/10/2026, entero, de lo que era `AVATARES-SERVIDOR.md`, que se quedó como la referencia de
[AVATARES](../referencia/AVATARES.md). Su entrada decía:

Decidido el 21 de septiembre de 2026. El navegador deja de recibir las
prendas sueltas y recibe **una sola imagen ya compuesta**, una por
avatar, hecha por el servidor y regenerada cuando esa persona cambia de
ropa. Más una previsualización por prenda, para poder verla antes de
comprarla.

Es lo que hacía macrojuegos durante una década. Está reconstruido en la
memoria del proyecto y resumido en `docs/referencia/ARTE.md#6-lo-que-se-decidió-no-hacer-y-por-qué`.

Este archivo es la lista de trabajo. Se marca aquí lo que se va
haciendo, con la fecha, y no se borran filas: una fila resuelta explica
por qué el código está como está.

---

## Por qué, y por qué ahora

`docs/referencia/ARTE.md#6-lo-que-se-decidió-no-hacer-y-por-qué` descartó esto en septiembre con un argumento que era
correcto entonces: *"media implementación no deja a mitad de camino:
deja en cero, con el trabajo hecho"*. Componer el avatar y seguir
sirviendo las prendas sueltas al vestidor no compra nada, porque la
puerta sigue abierta.

Lo que ha cambiado es un dato que entonces no teníamos: **el editor de
todos los días es un selector, no un lienzo.**

El que deja mover, escalar y espejar prendas es `js/arte-vestidor.js`, y
vive en `taller.html`, que es la herramienta del equipo de arte. El de la
gente está en `perfil.html` y solo elige una prenda por capa. Lo confirma
la base: de 117 avatares, **cero** llevan transformaciones.

Eso es lo que hace viable el plan. Si la gente pudiera arrastrar prendas,
cada movimiento necesitaría un viaje al servidor y no habría discusión
posible.

---

## Lo medido el 21/09/2026

Todo sobre el VPS real, un ARM de dos núcleos con 950 MB, no estimado.

**Qué hay que componer**

| | |
|---|---|
| Avatares puestos | 117 de 181 cuentas |
| Avatares guardados en ranuras | 98, de 65 personas |
| Capas por avatar | 11,5 de media, 15 como máximo |
| Avatares con capa de fondo | 111 de 117, y 89 de 98 en ranuras |
| Prendas en el catálogo | 768, cada una de un solo modelo |

**Cuánto cuesta componer uno**

| Fase | Tiempo |
|---|---|
| Descomprimir los PNG de las capas | 88 ms |
| Mezclar las capas | 23 ms |
| Comprimir a JPG | 45 ms |
| **Total** | **156 ms de media, sobre diez avatares reales** |

Irrelevante, porque se compone **al guardar** y no al mirar. Rehacer los
215 que existen hoy son 34 segundos de CPU, una vez.

**Cuánto pesa la salida**, medido sobre diez avatares reales:

| Tamaño | PNG | JPG calidad 80 |
|---|---|---|
| 327×504 | 91 kB | 36 kB de media |
| 62×96 | 13 kB | 4 kB |


**Cuánto cambia el dibujo al pasar por JPG de calidad 80.** Medido
comparando el compuesto exacto contra el JPG decodificado, canal por
canal, sobre seis avatares reales:

| | |
|---|---|
| Desviación media | de 0,31 a 3,96 sobre 255 |
| Desviación máxima | de 27 a 75 |
| Píxeles que se desvían más de 16 | del 0,01 % al 2,54 % |

La media es imperceptible. El máximo no lo es, y está donde se espera:
en los bordes duros del trazo, que es el punto flojo de JPG y abunda en
un dibujo de línea. Ese 0,5 % a 2,5 % de píxeles es lo que hay que mirar
de cerca antes de dar la calidad por buena. Subir a 92 lo reduce y pesa
un 60 % más; `npm run revision:avatares -- --calidad 92` deja verlo.
**Lo que gana la página de comunidad**, que hoy pinta 181 tarjetas:

| | Bytes |
|---|---|
| Hoy: 339 archivos de capa distintos | 5.562 kB |
| 117 compuestos a 62×96 en JPG | **468 kB** |
| 117 compuestos a 327×504 en JPG | 4.212 kB |

Un 92 % menos. Y esto vale por sí solo, aunque no hubiera nada que
proteger: hoy se mandan 5,5 MB de capas a tamaño completo para pintar
avatares de 35 a 46 píxeles.

A tamaño completo también gana, aunque por mucho menos, y ese margen es
frágil: las capas se repiten entre personas y se cachean una sola vez,
mientras que un compuesto es único por avatar. Cuantas más cuentas haya,
peor sale la comparación a tamaño completo y mejor sale la de miniatura.
Por eso importa servir cada tamaño en su sitio.

---

## Por qué en disco y no en Postgres

Postgres reserva un trozo de memoria para tener a mano las páginas de la
base que ha leído hace poco. Aquí son **128 MB** (`shared_buffers`), y la
base entera mide **127 MB**. O sea que cabe justa: hoy el 100 % de las
lecturas salen de memoria y ninguna del disco, y por eso el sitio va
rápido en una máquina tan pequeña.

El día que la base pase de 128 MB eso no se degrada poco a poco: se cae
de golpe. Una consulta que tardaba microsegundos empieza a tardar
milisegundos porque tiene que ir al disco.

Los compuestos de hoy son 8 MB medidos, y crecerían a unos 45 MB con
mil cuentas. Metidos en Postgres, esa línea se cruza. En disco no se
roza: hay 56 GB libres.

Y hay una razón mejor que el tamaño. El arte **es la fuente** y vive en
la base, que se respalda cada noche. Un compuesto es **derivado**: se
puede rehacer desde la fuente en 150 ms. Lo derivado no necesita
respaldo, y encima nginx sirviendo un archivo del disco es mucho más
barato que Node leyendo una fila.

De paso, para cuando haga falta: de esos 127 MB, 91 son
`originales_scores` (50 MB) y `activity_log` (41 MB), dos tablas que casi
nadie lee. Es el punto 68 de la auditoría, y limpiarlo devolvería la base
a unos 36 MB.

---

## Las fases

Cada una se despliega sola y se puede deshacer sola. El orden importa:
la protección no existe hasta la fase 5, y las cuatro anteriores no
rompen nada mientras tanto.

| # | Estado | Fase | Qué entra | Rompe algo |
|---|---|---|---|---|
| 1 | 2026-09-21 | El compositor | `api/_compositor.js`, `jpeg-js`, tests. No se enchufa a nada | No |
| 2 | 2026-09-21 | Guardar y servir | Migración, `/avatares/<huella>/<tam>.jpg`, gancho al guardar, relleno de los 215 que ya existen | No |
| 3 | 2026-09-24 | Las listas | Página por página, cada una pasa a una sola imagen por persona. Todas hechas: medido en producción, cero prendas sueltas fuera del editor. El editor es la fase 5 | No |
| 4 | 2026-09-24 | Las previsualizaciones | 768 recortes automáticos sobre maniquí. Publicadas: el editor y la tienda las enseñan. Ver el punto 12 | No |
| 5 | 2026-09-24 | Cerrar la puerta | `/prendas/` solo contesta con una firma que reparte el panel de arte. El editor pide su vista previa al servidor; fuera el índice público | Sí, a propósito |

### Fase 1 — El compositor

Un módulo que recibe una receta y devuelve bytes. No sabe de HTTP, no
sabe de la base, y por eso se puede probar sin levantar nada. Mismo
criterio que `api/_avisos.js`.

- `api/_compositor.js`: mezcla alfa de las capas en orden, aplanado
  sobre un color cuando toca, reducción por área y salida en JPG o PNG.
- El orden de capas sale de un solo sitio. Hoy `ORDEN_CAPAS_AVATAR` está
  en `js/core.js` y copiado en varios más, y ya hubo una vez en que dos
  copias diferían y el mismo avatar se dibujaba distinto según la página.
- `jpeg-js` entra en `dependencies`.
- `tests/compositor.test.js`: el orden, el alfa, el aplanado, los
  tamaños, y que la misma receta dé siempre los mismos bytes.


### Lo que se validó al cerrar la fase 1

Contra el arte de verdad, en el VPS, el 21/09/2026:

- Los **549 archivos** del catálogo pasan por el decodificador. Cero
  fallos, y los 549 acaban en 327×504.
- Diez avatares reales compuestos de punta a punta: **156 ms de media**,
  36 kB a tamaño completo y 4 kB en miniatura.
- **Determinista**: la misma receta da la misma huella dos veces, que es
  de lo que depende poder cachear la URL un año.
- Dos de esos diez salieron en PNG por no llevar fondo, que es
  exactamente lo previsto.

### Fase 2 — Guardar y servir

- Migración: una columna con la huella del compuesto en `users` y en
  `saved_avatars`. Nada de imágenes en la base.
- Los archivos van a `datos-locales/avatares-compuestos/<hu>/<huella>/`,
  la misma ruta en el servidor y en local. `datos-locales/` ya está en
  `.gitignore`, y git no borra lo ignorado ni con `reset --hard`, así
  que un despliegue no los toca. Se reparten en subcarpetas por los dos
  primeros caracteres de la huella: con una sola carpeta, decenas de
  miles de archivos hacen lento cualquier listado.
- **La misma ruta por defecto en los dos sitios, y sin variable de
  entorno en producción.** `MR_AVATARES_DIR` existe solo para los tests.
  Si el servidor web y el script de relleno pudieran discrepar sobre
  dónde están los archivos, el fallo sería invisible hasta que alguien
  viera un avatar roto.
- La huella es el `sha256` de la receta: la lista ordenada de capas con
  la huella del archivo de cada prenda. Cambia exactamente cuando
  cambiaría el dibujo, ni antes ni después. Dos personas con el mismo
  avatar comparten archivo sin que nadie lo programe.
- Ruta `/avatares/<huella>/<tam>.jpg` en `server.js` y en
  `scripts/servidor-local.js`, del mismo módulo y no copiada.
- nginx la sirve del disco, un año, `immutable`.
- Gancho al guardar el avatar y al guardar una ranura.
- Un script de relleno para los 215 que ya existen, y que se pueda
  volver a correr sin duplicar nada.


### Lo que se hizo y se midió al cerrar la fase 2

Desplegado el 21/09/2026, en este orden, que importa: **la migración va
antes que el código**, porque el código nuevo escribe en una columna que
hasta entonces no existe.

| | |
|---|---|
| Avatares compuestos en el relleno | 215, cero fallos, 28 segundos |
| Huellas distintas para esas 215 filas | 164 |
| En disco | 8,9 MB en 328 archivos |
| Temporales sin renombrar | 0 |

Las 164 huellas para 215 filas son 51 avatares idénticos a otro, que
comparten archivo sin que nadie lo programara. Sale del diseño de la
huella.

**Dos cosas que muerden y que costaron un susto:**

- **Un respaldo de la configuración de nginx NO puede vivir dentro de
  `sites-enabled/`.** nginx lee ese directorio entero, así que el
  respaldo se carga como un segundo servidor en el mismo puerto y
  `nginx -t` falla con `duplicate listen options`. Peor: la vuelta atrás
  también falla, y el sitio se queda funcionando con la configuración
  vieja en memoria mientras cualquier recarga futura, incluida la de la
  renovación del certificado, reventaría. Los respaldos van a
  `/etc/nginx/respaldos/`.
- **`add_header` dentro de un `location` cancela todos los del
  `server`.** Medido antes de tocar nada: la portada devolvía las cuatro
  cabeceras de seguridad y `/prendas/`, `/imagenes/` y los `.css`/`.js`
  devolvían cero. Arreglado de paso.
### Fase 3 — Las listas

Aquí es donde se gana el 92 %. Cada página que pinta avatares de otras
personas deja de pedir quince prendas sueltas y pide una sola imagen.

**La regla, decidida el 24/09/2026.** El dibujo lo hace el servidor,
siempre. El navegador elige una de tres cosas, en este orden, con
`imagenDeAvatar()` de `js/core.js`:

1. el PNG de administrador, si lo tiene;
2. su avatar compuesto: `/avatares/<id>/62x96.jpg`, con `?v=` si trae
   la huella (un año de caché) o sin ella (un minuto);
3. la silueta del sitio, `imagenes/avatar.png`, si no lleva ninguna
   prenda. Sin preguntar al servidor.

Si el compuesto falta, el servidor lo compone en el momento de pedirlo
y lo guarda. **Solo entonces**: lo que ya está en el disco se sirve tal
cual, sin recalcular nada. Si no puede (sin prendas, freno agotado,
fallo del dibujo) manda la silueta, con caché corta para que se vuelva
a intentar. Nunca una prenda suelta. Ver `leerOComponer()` en
`api/_avatar-compuesto.js`.

Para que eso no enseñe ropa vieja, **el archivo del disco siempre es el
del avatar que se lleva puesto**: quitarse todas las prendas, ponerse
un PNG de administrador o agotar el freno borran el compuesto anterior.

**Cómo se migra una página.** Su API manda el id de la persona y su
huella (`avatar_compuesto`); si la fila no es una persona, el id va
como `usuario_id`. La página pasa la persona a su función de avatar y
deja de saber dibujar por capas. Se publica y se mide en producción con
Network: cero peticiones a `/prendas/`.

| Página | Qué pinta | Archivos | Estado |
|---|---|---|---|
| Comunidad | Cuadrícula, podio, recién llegados, moderación, conectados, actividad | `comunidad-ranking.js` | Hecha el 24/09: 64 prendas sueltas a 0 |
| Perfil público | Avatar grande, amigos, comentarios, actividad, actividad de amigos, galería | `usuario.js`, `usuario-actividad.js`, `usuario-avatares-galeria.js` | Hecha el 24/09 |
| Perfil propio | Avatar grande, amigos, comentarios, actividad, galería | `perfil.js`, `perfil-actividad.js`, `perfil-avatares-galeria.js` | Hecha el 24/09, menos el editor |
| Amigos | La lista | `amigos.js` | Hecha el 24/09 |
| Chat | Los mensajes | `chat.js` | Hecha el 24/09 |
| Buscador | Los resultados, en la barra de casi todas las páginas | `buscador.js` | Hecha el 24/09 |
| Explorar | Amigos | `explorar.js` | Hecha el 24/09 |
| Portada con sesión | Avatar propio, bienvenida, amigos | `home-portal.js`, `index.html` | Hecha el 24/09 |
| Actividad de la comunidad | El feed | `actividad-comunidad.js` | Hecha el 24/09 |
| Juego | Reseñas | `resenas.js` | Hecha el 24/09 |

`tests/paginas-sin-capas.test.js` lleva la lista de las páginas
migradas y falla si alguna vuelve a dibujar prenda por prenda.

Medido en producción el 24/09, sin sesión: la portada, la comunidad,
la actividad, un juego con reseñas, el catálogo, un perfil público
con todas sus pestañas y el buscador piden cero prendas sueltas. Las
páginas con sesión se comprobaron con pruebas y en local.

**Lo que queda dibujando por capas**, y por qué:

- El editor de `perfil.js` (la vista previa y las miniaturas sin
  previsualización): enseña ropa que todavía no se ha guardado, y eso
  no tiene compuesto. Resuelto en la fase 5: la vista previa la dibuja
  el servidor.
- `js/ranking.js`: su código de dibujo no se ejecutaba nunca, porque
  sus contenedores no existen en ningún HTML. Quitado en la fase 5.
- El taller y el panel de arte, que son del equipo de arte, y siguen
  así: con direcciones firmadas desde la fase 5.

Ya no quedaba ninguna fuera del editor, así que sobraba lo que dibujaba
por capas en `js/core.js`: la rama de capas de `avatarMiniaturaHTML` y
`componerAvatarPNG`, que volvía a bajar las capas en un canvas. Se
quitó en la fase 5, junto al índice público.

**Lo que hay que arreglar por el camino**, visto en el inventario del
24/09/2026:

- La caché de avatares de `js/core.js` (`cargarAvatarUsuario`) guardaba
  solo el avatar y tiraba el id y la huella. Arreglado el 24/09.
- `js/perfil.js` guardaba en la sesión solo `{avatar}` al cambiarse de
  ropa: la portada habría pedido la huella de antes, cacheada un año.
  Arreglado el 24/09.
- La galería (`avatar-gallery`, GET) no mandaba la huella de cada
  ranura. Arreglado el 24/09. El POST sigue sin devolverla, pero la
  página vuelve a pedir la galería después de guardar.
- `js/ranking.js` es código muerto (sus contenedores no existen en
  ningún HTML), y `home-portal.js` de la raíz no lo carga ninguna
  página. `portal-growth.js`, `liga-global.js` y `navbar.js` no
  pintan avatares: usan la inicial o un emoji.

**Las pruebas no escriben en `datos-locales/`.** Pasó el 24/09: una
tanda reescribió el compuesto de siete cuentas de la copia local con
los cuadrados de colores de las pruebas, y parecía un fallo del
compositor. `tests/_aislar-datos.js` lo impide, y
`tests/aislar-datos.test.js` vigila que ninguna prueba lo olvide.

### Fase 4 — Las previsualizaciones

768 imágenes, una por prenda, con la prenda puesta sobre su modelo y
recortada a un cuadro.

**El cuadro es automático, uno por prenda**, alrededor de su propio
dibujo. Decidido el 24/09/2026, después de probar a que lo eligiera una
persona para cada capa; más adelante se podrán corregir una a una.
Cómo es la regla, y cómo se publicaron, en el punto 12.

Esta fase arregla de paso el punto 23 de la auditoría: las cajas vacías
de la tienda dejan de estarlo. Son el mismo trabajo.

### Fase 5 — Cerrar la puerta

Hecha el 24/09/2026. `/prendas/<huella>.png`, el dibujo suelto de una
prenda, solo lo ven el equipo de arte y los administradores. El resto
del sitio enseña avatares compuestos y previsualizaciones.

**Lo que se hizo, en orden, y cada paso sin romper el siguiente:**

1. **La vista previa del editor la dibuja el servidor**
   (`POST /api/users?action=avatar-vista-previa`, `api/_vista-previa.js`).
   Era lo último que apilaba prendas sueltas. Pide sesión y solo dibuja
   lo que esa persona podría ponerse: prendas publicadas en su ranura, o
   lo retirado que ya lleva; las de la tienda se pueden probar sin
   comprarlas. Lo ya dibujado se guarda en memoria por la huella de la
   receta, y hay un tope de 60 dibujos nuevos por minuto y persona. El
   editor espera 250 ms entre clics, no vuelve a pedir lo ya visto y
   descarta las respuestas que llegan tarde.
2. **Las miniaturas del editor** son siempre la previsualización. Si
   faltara, la caja se queda con su nombre, sin imagen.
3. **`js/core.js` dejó de pedir el índice público** al abrir cualquier
   página, y perdió `rutaCapaAvatar`, la rama de capas de
   `avatarMiniaturaHTML` y el compositor en canvas. De paso se quitó el
   dibujo muerto de `js/ranking.js`.
4. **En el servidor, fuera el índice público** (`avatar-catalogo`). El
   catálogo del editor ya no manda la dirección de ninguna prenda, ni la
   lista de retiradas, que llevaba la dirección de todas las prendas sin
   publicar, borradores incluidos, a cualquiera con sesión.
5. **El equipo de arte recibe direcciones firmadas**
   (`api/_prendas-firma.js`). Sus herramientas pintan con `<img src>`,
   y una etiqueta `<img>` no manda la sesión; así que la sesión y el
   rol se comprueban al pedir `avatar-panel`, que devuelve
   `/prendas/<huella>.png?hasta=…&firma=…`. La firma es un HMAC de la
   huella y la caducidad, con una clave sacada del secreto de las
   sesiones. Caduca entre seis y siete horas después, redondeada a la
   hora: todo lo firmado en la misma hora sale con la misma dirección y
   el navegador la reutiliza.
6. **El cierre.** `/prendas/` contesta 403 sin firma válida, antes de
   mirar la base. nginx dejó de cachear `/prendas/` (`proxy_cache off`:
   su caché guardaba un año con la dirección sin firma como clave, y la
   habría servido a cualquiera), y se vaciaron sus 581 entradas de
   `/var/cache/nginx/prendas`, sin tocar las 184 de `/avatares/` ni las
   356 de `/previsualizaciones/`, que comparten la zona. Copia de la
   configuración anterior en
   `/etc/nginx/respaldos/macroreborn.antes-cerrar-prendas-2026-09-24`.

**Medido en producción al cerrar:** una prenda que estaba en la caché,
pedida sin firma, 403; con una firma inventada, 403; la ruta vieja
`imagenes/tora/pelo3.png`, 404; una dirección firmada por el servidor,
200 con caché privada de unas siete horas. Los avatares compuestos y
las previsualizaciones, 200. La comunidad: cero prendas sueltas, cero
índice público.

Para vaciar otra vez solo las prendas de la caché de nginx, si hiciera
falta:

```sh
sudo grep -r -a -l -Z "^KEY: /prendas/" /var/cache/nginx/prendas | sudo xargs -0 rm -f
```

**Lo que no se pudo invalidar** son las copias que ya tenía cada
navegador: se servían con un año de caché e `immutable`. Decidido que
no importa. Y el repositorio: las prendas siguen en el historial de
GitHub (punto 75 de la auditoría, descartado).

---

## Lo que hacia macrojuegos, leido del archivo el 21/09/2026

Consultado el indice CDX de la Wayback Machine sobre
`av1.na.macrojuegos.com`, 600 URL reales:

```
/users/<id redondeado a miles>/<id>/little.jpg    540 de 600
/users/1021000/1021181/little.jpg?r=154487401
/users/1021000/1021181/little.jpg?r=955152952
```

| | |
|---|---|
| Tamanos | `little` 540, `normal` 43, `full` 17 |
| URL con `?r=` | 39 de 600 |
| Reparto | av0 a av9, diez hosts |

**El dato que decide**: el MISMO usuario aparece con dos `?r=`
distintos. O sea que la ruta era estable y la version viajaba en la
cadena de consulta. No tenian una URL fija a secas: tenian una ruta fija
mas un invalidador, porque sin el una imagen cacheada no se renueva
nunca.

Y el reparto de tamanos confirma lo medido aqui: el 90 % de lo que
servian era la miniatura.

---

## La sintesis que propongo, cuando se decida

`/avatares/<id de usuario>/<tam>.jpg?v=<12 primeros de la huella>`

- La ruta base es legible y se deriva del usuario: quien quiera mirar su
  avatar escribe la ruta sin `?v=` y ve el actual.
- El `?v=` conserva el cacheado de un ano con `immutable`, porque cambia
  cuando cambia el dibujo. Es el mismo patron que el sitio ya usa en
  `js/core.js?v=20260918`, y el que usaba macrojuegos.
- **Se acaban los huerfanos**: el archivo se sobrescribe.
- Se pierde la deduplicacion, que hoy ahorra 51 archivos de 215. Son 2,7
  MB. No importa.

**El id y no el nombre de usuario**, aunque el nombre seria mas legible.
Medido sobre las 181 cuentas: 14 llevan caracteres que no caben en una
URL sin escapar (espacios, `ñ`, unicode matematico, emoji), y hay dos
pares que solo se distinguen por mayusculas (`yotter`/`Yotter`,
`jader`/`Jader`), asi que una ruta insensible a mayusculas los pisaria.
macrojuegos uso el id por lo mismo.

**Lo que hay que tocar si se hace**: `api/_avatar-compuesto.js` (nombre y
ruta), el bloque de nginx, y nada mas, porque todavia no hay ninguna
pagina que consuma estas URL. **Hacerlo antes de la fase 3 cuesta una
tarde; hacerlo despues cuesta tocar los diez archivos otra vez.**

---

## Las previsualizaciones: lo que se aprendió de macrojuegos

Leído de la Wayback Machine el 23/09/2026, en dos búsquedas: la primera
encontró 19 previsualizaciones, y la segunda, más a fondo, 25 más.

- **Quedan 44 previsualizaciones**, todas de 70x70, en dos formatos de
  dirección:

  | Formato | Cuántas | De dónde |
  |---|---|---|
  | `av…/items/ref/<modelo>/<prenda>.jpg` | 23 | 19 de macrojuegos, 4 de microjogos |
  | `avatar1.na…/items/<miles>/<id>/thumb.jpg` | 21 | 16 de macrojuegos, 5 de microjeux |

- **Macrojuegos era una red de sitios** de la misma empresa, con el
  mismo catálogo de prendas: microjeux (francés), microjogos (portugués),
  microgiochi (italiano), microspiele (alemán), microgry (polaco),
  macrogames.ru y macrogamers.com. La misma prenda sale con el mismo
  número en varios, y las dos que se compararon eran idénticas byte a
  byte.
- **Dónde se buscó**: en macrojuegos, servidor por servidor, `av`, `av0`
  a `av9`, `avatar` y `avatar0` a `avatar30`, con y sin `.na`, y los de
  imágenes (`img`, `static`, `mcdn`); en los siete sitios hermanos, que
  son pequeños, todo el dominio de una vez; 127 de los 128 rastreos de
  Common Crawl, que no guardan ninguna imagen de prenda (uno no
  respondió); y las dos wikis de fans
  en Fandom, que solo tienen las miniaturas de los modelos. No hay más.
- **No queda ni una de espalda**, ni de fondo, ojos, guantes, accesorio,
  mascota o borde. Solo se archivaron las que alguien tenía a la vista
  cuando se guardó su página, y la tienda cargaba las prendas por su
  cuenta, así que el archivo casi nunca las vio. Las cuatro nuevas que
  parecían capas o alas son piezas del pecho, puestas por delante.
- **Fuera de los archivos quedan vídeos.** Tres vídeos de YouTube enseñan
  el editor y la tienda por dentro. En la portada del de 2016, *Como
  personalizar Tu avatar en macrojuegos*, de Rey Tutoriales
  (`youtube.com/watch?v=-00Q20_WLzU`), se ve la tienda abierta en camisas
  y un avatar con alas. Son para mirarlos, no se bajaron. Las capturas
  de las wikis de fans son de otras cosas: verificar la cuenta, avisos de
  moderación.
- **En macrojuegos, preguntar por todo el dominio no basta.** La primera
  búsqueda pidió `macrojuegos.com` entero filtrado por `/items/` y se dejó
  las 16 de `avatar1.na`: en un dominio tan grande la consulta no llega
  al final. Por eso la segunda fue servidor por servidor.
- **Sus modelos se llaman como los nuestros**: cereza, fengchao,
  fenglei, fiora, max y tora, más otros seis que aquí no están, como
  Nadia, la sirena, que parece la dueña de muchas de las prendas nuevas:
  conchas, algas, escamas. O sea que esas previsualizaciones son de
  nuestro mismo arte base.
- **En el primer formato, el número lleva el tipo dentro**, en los dos
  dígitos que siguen al modelo: `05` camisas, `06` pantalones, `08`
  pelos, `09` una barba y `12` zapatos. Se comprobó mirando las 23 una
  por una. En el segundo el número no dice nada, y las 21 se clasificaron
  a ojo: 15 camisas, 3 pantalones y 3 de piel.
- **No ponían la prenda sobre el modelo a color, sino sobre una silueta
  plana** de un solo tono gris azulado, medido de sus imágenes en
  `rgb(172,180,204)`. Por eso la prenda resaltaba tanto. Aquí es la
  opción por defecto, y la silueta se saca del propio modelo
  conservando su forma. **La excepción es la única barba**, que sale
  sobre piel morena y sin nada de gris: o ese tipo se enseñaba a color,
  o la prenda traía la piel dentro. Con una sola no se puede saber.
- **La piel se enseñaba como el torso desnudo, a color**, con el mismo
  encuadre que las camisas. Son 3, y es la única referencia que hay para
  nuestra capa piel.
- **Cada tipo tenía siempre el mismo encuadre, y muy cerrado**: las
  camisas del cuello a la cintura, los pantalones de la cadera al muslo,
  los zapatos un solo pie.
- **De sus 12 modelos queda la miniatura**, `models/<nombre>/thumb.jpg`,
  de 73x73: solo la cabeza, y a color. Es lo más parecido que hay a una
  previsualización de la capa modelo.

Todo se bajó solo como referencia, a
`datos-locales/macrojuegos-referencia/`, fuera de git:

| | |
|---|---|
| `prendas/` | Las del primer formato, con su nombre original |
| `prendas-por-id/` | Las del segundo, con la capa delante del número |
| `modelos/` | Las 12 miniaturas |
| `fuentes.tsv` | De dónde salió cada archivo y cuándo se capturó |
| `galeria.html` | Todas juntas, agrupadas por tipo |

**Se borró todo el 24/09/2026**, en cuanto los cuadros quedaron
decididos, como se había acordado: por coherencia con el motivo de todo
este proyecto, y con ello las copias que se hicieron al buscarlas. Si
algún día hicieran falta otra vez, siguen en la Wayback Machine: la
tabla de arriba dice en qué servidores y con qué forma de dirección.

---

## La foto de perfil: cómo se decidió

El administrador eligió sobre páginas de prueba con avatares reales de
la copia local. Primero entre cuatro encuadres (cara, cabeza, cabeza y
hombros, medio cuerpo), con fondo o sin él, en cuadrado o en círculo:
**la cara, con su fondo y en cuadrado**. Después pidió que cada modelo
tuviera su propio cuadro, porque el primero le quedaba bien a cereza
pero no a max.

---

## La foto de perfil: al desplegarla

La primera vez cambian todas las huellas (el cuadro entró en la receta),
así que hay que correr el relleno justo después de reiniciar: compone
el compuesto y la foto de cada cuenta. Mientras tanto, la foto que falte
se compone al pedirla, dos a la vez, y las demás esperan con la silueta
un minuto.
