# ARTE — proteger el trabajo del equipo de dibujo

> **De qué trata:** cómo se protege el arte de las prendas: lo que se hizo el 16/09/2026 (el catálogo
> cerrado, la autoría dentro de cada dibujo, el lienzo, los términos y el aviso por ráfaga), lo que
> cambió el avatar compuesto del 21 al 24/09, qué compra cada medida y qué no.
>
> **Para quién:** el equipo de desarrollo, y el de arte en lo que le toca decidir.
>
> **Revisado:** 05/10/2026

---

## 0. El punto de partida, sin adornos

Impedir la descarga es imposible. En el momento en que publicas una
imagen, quien sepa usar una terminal llega al PNG. No existen candados
para esto, ni aquí ni en Netflix.

Lo que sí existe es la diferencia entre **cómodo** y **caro**, y entre
**anónimo** y **demostrable**. Todo lo de abajo trabaja en esos dos ejes.

El caso real que lo disparó: alguien se descargó prácticamente el
catálogo entero y publicó las prendas en otra web. El equipo de dibujo se
enteró meses después, al ver su trabajo en otro sitio.

---

## 1. El índice del catálogo ya no se entrega a cualquiera

**Antes del 16/09/2026**, `GET /api/content?action=avatar-catalogo`, sin
sesión, devolvía las 655 prendas con su nombre, su ranura, su precio y su
URL. Una petición daba el mapa completo; 655 descargas daban el arte. El
catálogo entero pesaba 4,4 MB.

**Hoy** el catálogo solo sale con sesión (`avatar-catalogo-completo`), y
sin la dirección del dibujo suelto de ninguna prenda: las direcciones
firmadas solo las reparte el panel de arte. Del 16 al 24/09/2026 hubo
además un índice público de lo que alguien llevaba puesto, para dibujar
los avatares por capas; se fue con
[la fase 5](../historia/AVATARES-AL-SERVIDOR.md#fase-5--cerrar-la-puerta),
cuando dejaron de dibujarse así.

**El detalle que hace que esto sirva de algo:** cerrar el índice no
valdría nada por sí solo, porque `imagenes/<modelo>/<prenda>.png` servía
el mismo dibujo y **ese nombre se adivina** — `tora_pelo3` es
`imagenes/tora/pelo3.png`, con un nombrado sistemático de modelo, capa y
número. Se enumeraba `pelo1`, `pelo2`, `pelo3`… por capa y por modelo y
salía todo, sin índice ninguno. Esa ruta ahora da 404 para cualquier
prenda de verdad, esté el fichero en el disco o no. El arte solo sale por
`/prendas/<huella sha256>.png`, y desde el 24/09/2026 solo con firma: sin
ella, 403.

El corte se decide consultando `avatar_prendas` y no con una lista a
mano, que se quedaría vieja en cuanto suba un modelo nuevo. El logo, la
portada y las imágenes de los juegos no están en esa tabla y se siguen
sirviendo igual.

---

## 2. La autoría va dentro de cada dibujo

`scripts/hornear-catalogo.js` escribe la autoría de MacroReborn en los
metadatos del propio PNG (bloques `tEXt`/`iTXt`), sin tocar un solo píxel.

```
node scripts/hornear-catalogo.js                  informe, no toca nada
node scripts/hornear-catalogo.js --aplicar        escribe en la copia local
node scripts/hornear-catalogo.js --produccion --aplicar
```

Por defecto no escribe y trabaja contra la copia de producción de
`datos-locales/pgdata`. Hay que pedir `--aplicar` y `--produccion` a
propósito, cada uno por su lado.

Se hace **en una sola pasada** porque cambiar los bytes cambia el
`sha256` de cada prenda, y con él la huella de cada avatar que la use:
después de cada pasada hay que volver a componerlos
([lo que muerde](AVATARES.md#lo-que-muerde-si-no-se-sabe)), y la gente se
los vuelve a bajar todos. Hasta el 24/09/2026 había además que vaciar la
caché de nginx de `/prendas/`; desde entonces esa dirección no se guarda.

Medido contra producción el 16/09/2026: 438 archivos, 655 prendas, 4389 kB → 4490 kB,
**236 bytes de autoría por archivo**. Cero ilegibles, cero choques de
huella. Es idempotente: volver a correrlo no cambia nada.

**Qué compra, sin vender humo:** no impide copiar. Hace que la copia
lleve dentro de quién es. Sobrevive a un copiar-pegar, a subirlo a otra
web y a la mayoría de las tuberías de imágenes. **No** sobrevive a un
reguardado deliberado en un editor — y ahí está la gracia: quien la borró
demostró que sabía lo que hacía, y eso es justo lo que hace falta para
reclamar una retirada.

El PNG se lee y se escribe a mano en `api/_png.js`. No es que las
librerías estén prohibidas: lo que está prohibido es depender de un
servicio de terceros que se pueda acabar (regla XXVI de la constitución,
`.specify/memory/constitution.md`). Aquí
no hacía falta ninguna, y por eso `tests/vestidor-horneado.test.js`
sustituye el canvas por un falso en vez de traerse node-canvas con sus
decenas de MB de binario nativo. Probado el 16/09/2026 contra
las 630 prendas del disco: 630 de 630 dan ida y vuelta byte a byte
exacta.

---

## 3. El lienzo canónico, al subir

Una prenda nueva tiene que venir en **327×504 y sin entrelazar**.

Todas las capas se componen en el mismo encuadre, así que una que venga
con otras medidas descuadra el dibujo, sin que nadie se entere hasta que
alguien se la pone y le queda el pelo torcido. Si aun así llegara una, el
compositor no revienta: `alLienzo`, en `api/_compositor.js`, la lleva al
lienzo con la misma política de abajo.

Que esto no estuviera puesto se notaba: el 16/09/2026, de 438 archivos en
producción, **80 estaban fuera del lienzo**, y entre ellos había un
1919×1079 y un 1338×2066, un pantallazo o un dibujo sin recortar, subido
sin querer. `scripts/encajar-lienzo.js` los llevó al lienzo antes del
21/09/2026, y el 05/10/2026 los 552 archivos miden 327×504.

El `327×505` que abundaba es el lienzo original de macrojuegos: su editor
servía un `<img>` de 327×505 y parte del arte se hizo para ese marco.

Cómo se midió el catálogo heredado, qué dice la base y qué trabajo dejó pendiente lo cuenta la
investigación del 16/09/2026, [EL LIENZO DEL CATÁLOGO](../historia/LIENZO-DEL-CATALOGO.md).

### Y los que ya estaban dentro: `scripts/encajar-lienzo.js`

```
node scripts/encajar-lienzo.js --revision   informe + página para mirarlo
node scripts/encajar-lienzo.js --aplicar    lo escribe en la base
```

La política **no se inventa**: se copia la que `js/arte-vestidor.js` ya
tiene escrita, y que dice que la base es el **pegado 1:1** y no el
encaje, porque mover píxeles enteros es un calco y no toca el dibujo.
El motor de píxeles está en `api/_lienzo.js`, escrito a mano porque no
hacía falta más. Las cifras de abajo son del 16/09/2026, de antes de
aplicarlo.

Tres caminos, y cuál se toma lo decide el propio dibujo:

| método | archivos | qué hace | ¿pierde calidad? |
|---|---|---|---|
| **calco** | 50 | a un píxel del lienzo y con el borde vacío: rellena o recorta una fila | **No.** Los píxeles que quedan son los de origen, y se conserva la paleta |
| **estirado** | 12 | a un píxel pero con dibujo en lo que se recortaría: estira al lienzo exacto | Remuestrea, pero no pierde contenido ni deja franjas |
| **encaje** | 10 | otra proporción de verdad: `k = min(327/w, 504/h)`, centrado | Sí, y es lo correcto ahí |

Los 72 que cambian pesan 1736 kB y pasan a **1658 kB**: además adelgazan.

**Por qué los doce se estiran en vez de encajarse**, que es el detalle que
más cuesta ver: son todos **fondos** de 327×505. Encajarlos preservando
la proporción los dejaría en 326×504 con una franja transparente de un
píxel al lado — o sea una costura visible en el borde de cada avatar que
lleve ese fondo. Estirar un 0,2 % no se ve; una franja transparente sí.

Ocho de esos doce son degradados: al estirarse pasan de 68–256 colores a
2.400–19.600, no caben en paleta y engordan de ~26 kB a ~70 kB. Se
revisaron a ojo con `--revision` y se aceptó el coste.

**Lo que NO se toca:** ocho archivos que miden 327×504 en paleta de 2 y 4
bits. La profundidad de una paleta no cambia el dibujo, solo cuántos
colores caben, y encima pesan menos que en 8 bits.

> **El orden importa.** `encajar-lienzo` va **antes** que el horno de la
> autoría y **en la misma ventana**: los dos cambian el `sha256`, que es
> la URL, y en días distintos la gente redescarga el catálogo dos veces.

---

## 4. Términos de uso y a quién reclamar

`terminos.html`, enlazada desde el pie de las páginas (14 el 05/10/2026)
y en el sitemap.

Dice de quién es el arte, qué se puede hacer con él y qué no, y cómo
pedir una retirada. Incluye a propósito **lo que sí se puede hacer sin
pedir permiso** —vestir tu avatar, compartir su imagen, enseñar
capturas—, porque una lista que solo prohíbe no se lee.

Esto es lo más barato de todo el plan y probablemente lo que más peso
tiene cuando hay que pedirle a otro sitio que retire material: sin un
titular con nombre y un contacto, no hay a quién reclamar.

El contacto es el buzón que publica la propia `terminos.html`. Hay que **leerlo**: una dirección
de retirada que nadie atiende es peor que no ponerla, porque promete un
canal que no existe.

---

## 5. Aviso cuando alguien se pone a descargar

`api/_rafaga.js` cuenta cuántas prendas **distintas** pide cada IP en una
ventana de tiempo, y cuando una se pasa deja constancia en el registro
del servidor y manda una notificación dentro del sitio a las cuentas con
la insignia `administrador`.

No impide nada. Lo que compra es enterarse **el mismo día** en vez de
meses después.

Desde el 24/09/2026 solo cuenta lo que pide quien tiene firma, o sea el
equipo de arte y los administradores: sin firma, `/prendas/` contesta 403
antes de llegar a contarse. Lo que vigila hoy es que una cuenta del equipo,
o una dirección firmada que se haya filtrado, no se lleve el catálogo.

Lo que cuenta es la **variedad**, no el volumen: la misma prenda pedida
veinte veces es una prenda. Alguien recargando su perfil no dispara nada.

**De dónde sale el umbral** (medido el 16/09/2026, cuando cualquiera podía
pedir las prendas puestas):

```
655  prendas en el catálogo
438  archivos distintos
354  valores que alguien lleva puesto
298  huellas distintas EN USO   <- techo de una visita anónima
```

Por eso el umbral va en **320 prendas distintas en 3 minutos**: por
debajo de 298 habría saltado con una página de comunidad cargada entera,
y un aviso que molesta se acaba apagando. Hoy ninguna página pide prendas
sueltas y el umbral queda holgado: el panel de arte enseña como mucho 120
a la vez (`js/arte.js`), y el catálogo entero son 552 archivos el
05/10/2026. Se puede apretar o aflojar sin desplegar con
`MR_RAFAGA_UMBRAL`, `MR_RAFAGA_VENTANA_MS` y `MR_RAFAGA_ESPERA_MS`.

**El agujero que queda, dicho antes de que sorprenda:** `cluster.js`
levanta un proceso por núcleo y cada uno cuenta por su cuenta. Con dos
procesos, una ráfaga repartida tarda el doble en asomar. Por eso el umbral
no va pegado al techo. El otro, que nginx guardaba `/prendas/` en caché y
lo que acertaba en ella no llegaba a contarse, se fue el 24/09/2026 con la
caché.

---

## 6. El avatar compuesto en el servidor

El 16/09/2026 se descartó que el servidor compusiera una imagen por avatar, como hacía macrojuegos:
a medias, con las prendas sueltas todavía a la vista, no compraba nada. El 21/09/2026 se adoptó
entera, porque el editor de todos los días resultó ser un selector y no un lienzo, y del 21 al 24/09
se cerró la puerta: el navegador solo recibe avatares ya compuestos, y las prendas sueltas solo las ve
el equipo de arte, con firma. Cómo es hoy: [AVATARES](AVATARES.md). Por qué se descartó y por qué se
adoptó: [lo que se descartó](../historia/AVATARES-AL-SERVIDOR.md#lo-que-arte-descartó-el-16092026) y
[por qué, y por qué ahora](../historia/AVATARES-AL-SERVIDOR.md#por-qué-y-por-qué-ahora).

---

## 7. Lo que queda

- **El buzón de retiradas**, el que publica `terminos.html`: alguien tiene que leerlo.
- **El CSS del editor de perfil** usa `aspect-ratio: 327 / 505` en cuatro sitios de `css/perfil.css`
  y en uno de `css/perfil-macrojuegos-light.css`, contra el 327×504 del lienzo. Es lo único que queda
  de [lo que destapó la investigación del lienzo](../historia/LIENZO-DEL-CATALOGO.md#trabajo-pendiente-que-esto-destapa):
  el 05/10/2026 todos los archivos miden 327×504 y `componerAvatarPNG` ya no existe.
- Hasta el 16/10/2026, un navegador que ya tuviera guardada una `imagenes/<modelo>/<x>.png` de antes
  del 16/09 la conserva: se guardaban 30 días, con `immutable`. El cierre de esa ruta no vale hacia
  atrás.
- **El historial de GitHub.** Las prendas salieron del repositorio el 21/09/2026 (636 archivos, commit
  `bbe813a`), pero están ahí desde el 23/07/2026 y con `git clone` se bajan igual. Sacarlas requiere
  reescribir el historial y pedir a GitHub que purgue lo que ya sirvió (punto 75 de
  [AUDITORIA](../listas/AUDITORIA.md)). Descartado el 21/09/2026: se acepta que el arte anterior a esa
  fecha siga en el historial. Desde hace poco el repositorio es privado (comprobado el 05/10/2026), así
  que hoy solo lo clona quien tiene acceso.
