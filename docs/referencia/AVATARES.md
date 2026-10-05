# AVATARES — cómo se componen, se guardan y se sirven

> **De qué trata:** el sistema de avatares: la imagen compuesta en el servidor, dónde se guarda y cómo
> se sirve, las previsualizaciones de cada prenda, la foto de perfil, el pelo de atrás, y lo que todo
> esto protege y lo que no.
>
> **Para quién:** el equipo de desarrollo.
>
> **Revisado:** 05/10/2026

Cada avatar es una sola imagen que compone el servidor al guardarlo: el navegador no recibe nunca las
prendas sueltas, salvo el equipo de arte, con direcciones firmadas. Se decidió el 21/09/2026, porque
el editor de todos los días elige una prenda por capa y no las mueve, y eso permite componer al
guardar. El plan, sus cinco fases y lo que se midió están en
[AVATARES-AL-SERVIDOR](../historia/AVATARES-AL-SERVIDOR.md).

---

## Lo que se decidió

| Qué | Decisión |
|---|---|
| Formato | **JPG**. No hace falta transparencia y pesa la mitad |
| Calidad | 80. A 88 pesa un 30 % más sin verse mejor |
| Tamaños | 62×96 para listas, 327×504 para el perfil, y la cara a 96×96 para las miniaturas ([la foto de perfil](#la-foto-de-perfil-la-cara-con-un-cuadro-por-modelo)) |
| Sin capa de fondo | **JPG aplanado sobre blanco**. Eran 6 de 117 y 9 de 98 ranuras el 21/09/2026 |
| Codificador | `jpeg-js`: JavaScript puro, cero dependencias, sin binario nativo |
| Dónde se guardan | **En disco**, no en Postgres. [Ver abajo](#por-qué-en-disco-y-no-en-postgres) |
| Cuándo se componen | Al guardar el avatar |
| Nombre del archivo | `/avatares/<id>/<tam>.jpg`, la dirección de esa persona. No cambia nunca |
| La versión | En la consulta, `?v=<huella>`. [Ver abajo](#la-forma-de-la-url-resuelto-el-21092026) |
| Ranuras por persona | Una columna, `ranuras_avatar`. El código no pone techo. [Ver abajo](#vender-ranuras-pendiente-y-con-motivo) |
| Avatares en ranuras | También se componen |
| Previsualizaciones | La prenda puesta sobre un modelo vacío, recortada a su zona. Afinado el 23 y el 24/09: sobre un maniquí, con un cuadro automático por prenda. [Ver abajo](#las-previsualizaciones-automáticas-y-corregibles-una-a-una-más-adelante) |
| El taller | Sigue recibiendo las prendas sueltas, con sesión y permiso |
| La caché al cerrar | Se invalida entera. Decidido que da igual |

**La previsualización, en las palabras que la definen:** como en un
videojuego. Si es pelo, un recorte de la cabeza con ese pelo puesto. Si
es una camisa, un recorte del torso con la camisa puesta. Nunca la
prenda sola sobre transparente, porque eso es regalar el catálogo otra
vez.

---

## Por qué en disco y no en Postgres

Por dos razones. La base cabía entera en la memoria que Postgres reserva para leer rápido
(`shared_buffers`: 128 MB, contra 127 MB de base el 21/09/2026), y el día que deja de caber las
consultas pasan de golpe a ir al disco; los compuestos, metidos en la base, adelantarían ese día. Y un
compuesto es **derivado**: se rehace desde el arte, que sí vive en la base y se respalda cada noche,
así que no necesita respaldo, y nginx sirviendo un archivo del disco es mucho más barato que Node
leyendo una fila. Las cifras de ese día, en
[el plan](../historia/AVATARES-AL-SERVIDOR.md#por-qué-en-disco-y-no-en-postgres).

---

## Las piezas

Lo que dejaron en pie las cinco fases del plan, hechas del 21 al 24/09/2026 (contadas en
[el plan](../historia/AVATARES-AL-SERVIDOR.md#las-fases)):

- **El compositor**, `api/_compositor.js`: recibe una receta (las capas en orden, con la huella del
  archivo de cada prenda) y devuelve los bytes: el avatar sale siempre en JPG, y lo que no lleva fondo, aplanado sobre blanco. No sabe
  de HTTP ni de la base, y la misma receta da siempre los mismos bytes. Lo vigila
  `tests/compositor.test.js`.
- **Guardar y servir**, `api/_avatar-compuesto.js`: el avatar se compone al guardarlo, también el de
  cada ranura, y se guarda en disco, en `datos-locales/avatares-compuestos/`; la base solo guarda su
  huella, el `sha256` de la receta. Si un compuesto falta, se compone al pedirlo y se guarda
  (`leerOComponer()`); si no se puede, sale la silueta del sitio. Las direcciones, en [la forma de la URL](#la-forma-de-la-url-resuelto-el-21092026).
- **Las páginas** pintan cada avatar como una sola imagen, con `imagenDeAvatar()` de `js/core.js`: el
  PNG de administrador si lo tiene, su compuesto o la silueta. `tests/paginas-sin-capas.test.js` falla
  si alguna vuelve a dibujar prenda por prenda.
- **El editor del perfil** pide su vista previa al servidor (`api/_vista-previa.js`), con sesión y
  solo con lo que esa persona podría ponerse, y sus miniaturas son [las previsualizaciones](#las-previsualizaciones-automáticas-y-corregibles-una-a-una-más-adelante).
- **La puerta cerrada**: el dibujo suelto de una prenda, `/prendas/<huella>.png`, solo lo ven el
  equipo de arte y los administradores, con una dirección firmada que caduca a las seis o siete horas
  (`api/_prendas-firma.js`). Sin firma válida, 403.

---

## Lo que esto NO compra, dicho antes de que sorprenda

**La resta de dos composiciones.** Si pido mi avatar con una prenda y sin
ella y resto las dos imágenes, obtengo la prenda. Con PNG sale exacta.
Con JPG sale sucia, porque la compresión con pérdida mete ruido, y por
eso macrojuegos servía JPG y por eso lo servimos nosotros. Sucia no es
imposible: es recuperable con esfuerzo y con calidad peor.

**El alcance del ataque es lo que de verdad lo limita.** Solo se puede
componer lo que uno posee. Para sacar el catálogo entero por esta vía
habría que comprar todas las prendas (768 el 21/09/2026).

La vista previa del editor (fase 5) no abre otra vía: dibuja solo lo
que esa persona podría guardar, con la misma validación. Se probó a
dejar probarse las de la tienda sin comprarlas, y se quitó el mismo
día por esto: daba la prenda de pago entera sin pagarla.

**Salvo por las previsualizaciones**, que enseñan prendas que no tienes.
Ahí la defensa es el recorte: una previsualización es un trozo pequeño
sobre un modelo, no la capa completa sobre transparente. Restarle el
modelo vacío da el trozo de la prenda que se ve en ese recorte, en JPG y
recortado. Es lo mismo que compraba macrojuegos, y es mucho, pero no es
un candado.

**Lo que sí es un candado** es que el archivo original del artista, a
327×504 y con su alfa intacto, deja de salir del servidor: desde el
24/09/2026 solo lo ve el equipo de arte, con firma. Antes se bajaba
entero con una petición.

---

## Lo que muerde si no se sabe

- **El taller es la excepción a propósito.** `taller.html`, el panel y
  el vestidor siguen recibiendo prendas sueltas, con sesión y el rol de
  artista o administrador, en direcciones firmadas que caducan (fase 5).
  Es el único agujero que queda abierto, y queda abierto porque el
  equipo de arte no puede trabajar de otra forma. Una dirección firmada
  sirve a quien se la pasen mientras no caduque, entre seis y siete horas.
- **Una capa que no carga no deja marca.** Solo el vestidor del equipo de arte apila capas todavía; si
  una no carga, `js/core.js` la esconde en vez de dejar sobre el avatar la marca de imagen rota del
  navegador. Cómo se encontró y se arregló: [IMAGEN-NO-ENCONTRADA](../historia/IMAGEN-NO-ENCONTRADA.md).
- **JPG no tiene alfa.** Un avatar sin capa de fondo sale aplanado sobre
  blanco (eran 6 de 117 el 21/09/2026).
- **El orden de las capas tiene que salir de un solo sitio.** Hoy está
  en dos, `CAPAS` en `api/_avatar-catalogo.js` y `ORDEN_CAPAS_AVATAR` en
  `js/core.js`, más una copia en `scripts/importar-catalogo.js`, y ya hubo
  un caso en que dos copias no coincidían. Juntarlas está en [Lo que queda](#un-solo-orden-de-capas).
- **`avatar_catalogo_version` ya existe** y sirve para saber cuándo el
  catálogo cambió. La huella de la receta lo hace innecesario para
  invalidar, pero sigue siendo el modo barato de detectar un rehorneado.
- **Rehornear la autoría cambia el `sha256` de cada prenda**, y por tanto
  la huella de cada receta que la use. Después de un rehorneado hay que
  volver a componer. Es el mismo aviso que ya daba
  [ARTE](ARTE.md#2-la-autoría-va-dentro-de-cada-dibujo).

---

## La forma de la URL (resuelto el 21/09/2026)

**Hecho el 21/09/2026.** El resultado:

```
/avatares/38/62x96.jpg                 la dirección de esa persona
/avatares/38/62x96.jpg?v=401ddea4553c  la misma, con la versión
/avatares/38/ranura2/327x504.jpg       su segundo diseño guardado
```

Las dos primeras apuntan al MISMO archivo: una cadena de consulta no
toca el disco. La desnuda se sirve con un minuto de caché y es para
escribirla a mano; la otra con un año e `immutable`, y es la que usan
las páginas.

---

El planteamiento original, del mismo día, era
`/avatares/<huella de la receta>/<tam>.jpg`, y se descartó por dos costes
que no se ven hasta que llevas un tiempo:

- **Nadie podría encontrar su propia imagen** sin consultar la base. Para
  responder "por qué el avatar de fulano se ve mal" haría falta una
  consulta, no escribir su nombre.
- **Los archivos viejos se quedarían.** Cada vez que alguien se cambiara
  de ropa nacería una imagen y la anterior quedaría huérfana, unos 45 kB
  por cambio. Con 56 GB libres daba igual, pero habría hecho falta una
  limpieza. Con la dirección de cada persona, el archivo se sobrescribe.

Lo que hacía macrojuegos, leído de su archivo ese día, y la propuesta que salió de ahí están en
[el plan](../historia/AVATARES-AL-SERVIDOR.md#lo-que-hacia-macrojuegos-leido-del-archivo-el-21092026).

---

## El freno, y por qué existe

Componer cuesta **170 ms de CPU** en esta máquina (medido el 21/09/2026), y nginx deja pasar
**30 peticiones por segundo** por IP en `location /`, que es por donde
entra guardar el avatar. Sin freno, una sola persona guardando en bucle
pide cinco segundos de CPU por cada segundo de reloj, en una máquina de
dos núcleos. Eso es tumbar el sitio desde una cuenta normal.

**Lo trajo este mismo trabajo** y conviene decirlo: antes, guardar el
avatar era validar y un `UPDATE`.

Dos frenos, y el primero hace casi todo:

1. **No se recompone lo que no cambió.** Si la huella que la base ya
   tiene es la misma que la de la receta nueva y los dos archivos están,
   el archivo YA es correcto. Guardar veinte veces el mismo avatar
   cuesta una composición.
2. **Doce composiciones por persona y por minuto**, para quien alterne
   entre dos avatares a propósito. Un humano guarda dos o tres veces
   seguidas como mucho. Agotado, el avatar se queda sin compuesto y se
   sirve la silueta del sitio, con caché corta; en cuanto vuelve a haber
   presupuesto, se compone al pedirlo. Nunca se bloquea el guardado.

El presupuesto vive en memoria y no entre procesos, así que con dos
procesos el techo real es el doble. Da igual: no es una cuota que haya
que cuadrar, es un tope para que nadie se lleve la máquina. Mismo
criterio que `api/_rafaga.js`.

---

## Las previsualizaciones: automáticas, y corregibles una a una más adelante

**Decidido el 24/09/2026:** todas automáticas, con un cuadro por prenda.
Más adelante se podrá corregir una prenda sola
([Lo que queda](#corregir-una-prenda-sola)). El 23/09 se había decidido que una persona eligiera 78 cuadros,
uno por capa y modelo, con
[la herramienta](../guias/DESARROLLO.md#la-herramienta-de-los-recortes-de-previsualización); eso queda como la forma de
forzar una capa entera si alguna saliera mal.

### El cuadro automático

Es `cuadroAutomatico`, en `api/_recortes.js`:

- **Uno por prenda**: el menor cuadrado que contiene su dibujo, con 10
  píxeles de margen y centrado en él.
- **Nunca más chico que la previsualización**, 96 píxeles. Lo diminuto,
  un pendiente o una boca, no se amplía por encima de su tamaño real,
  que se vería borroso. Por eso las bocas salen pequeñas en su cuadro.
- **Si la prenda no cabe entera se ve su parte de arriba**, que es la
  que la reconoce: de un pelo largo, la cabeza.
- **La caja de la prenda cuenta solo lo que se ve bien**: alfa por
  encima de 64, y sin el 0,5 % de puntos más alejados por cada lado.
  Algunas prendas traen restos casi invisibles lejos del dibujo, y sin
  esto salían diminutas en medio de un cuadro enorme.

Por qué uno por prenda y no uno compartido por capa, medido sobre las
768 el 24/09/2026:

| | Uno por capa y modelo | Uno por prenda |
|---|---|---|
| Accesorios diminutos | 58 % | 0 % |
| Pelos cortados | 93 % | 6 % |
| Camisas cortadas | 21 % | 4 % |

**Quién manda** lo decide `cuadroParaPrenda`, el único sitio que elige
el cuadro: lo corregido para una prenda sola, cuando exista; lo forzado
para toda su capa en su modelo con la herramienta; y si no, el
automático.

**Siempre cuadrados.** El lienzo mide 327x504, así que el mayor
cuadrado que cabe es de 327: un fondo, un borde o una melena de cuerpo
entero no caben enteros y la previsualización enseña un trozo. Se
aceptó sabiéndolo; macrojuegos tenía la misma limitación.

**El fondo va solo, sin el avatar delante.** Decidido el 23/09/2026: en
la previsualización de un fondo no sale nadie, en los seis modelos y con
cualquier maniquí. Las capas que van solas, hoy fondo y modelo, están en
una lista de `api/_previsualizacion.js`, y la herramienta la recibe de
ahí para que su vista en vivo no discrepe de la de verdad.

### Publicadas el 24/09/2026

| | |
|---|---|
| Dónde viven | `datos-locales/previsualizaciones/<miles>/<id>.jpg`, fuera de git, como los compuestos |
| Su dirección | `/previsualizaciones/<id>.jpg?v=<huella>`, con un año de caché; sin versión, un minuto |
| Su huella | En `avatar_prendas.previsualizacion`, migración 021 |
| Quién las genera | `scripts/generar-previsualizaciones.js`, y cada prenda nueva al subirse desde el panel |
| Quién las enseña | El editor, en sus miniaturas, y el Bazar |

Medido al publicarlas:

- **Las 768 en 43 segundos** en el VPS, 2 MB en total, ninguna fallida.
  Salen idénticas a las de la copia local: la receta es determinista.
- **La tienda: 162 artículos, 162 con previsualización.** Antes, 130 de
  152 no tenían dibujo y los 12 que se enseñaban eran cajas vacías con
  precio: el punto 23 de la auditoría, arreglado de paso.
- nginx sirve con las cuatro cabeceras de seguridad y su caché acierta
  a la segunda petición.

**Cuándo hay que volver a correr el relleno** en producción:

```
cd ~/MacroReborn && set -a && . ./.env && set +a
node scripts/generar-previsualizaciones.js --produccion            # simulacro
node scripts/generar-previsualizaciones.js --produccion --aplicar
```

- si se cambia la regla del cuadro, el maniquí o la calidad; en ese
  caso, además, subir `VERSION` en `api/_previsualizaciones.js`;
- si se fuerza un cuadro con la herramienta y se despliega el archivo;
- si se resube el dibujo de un modelo.

Lo que no cambió no se rehace, así que correrlo de más no cuesta nada.

Las fases 3 y 5 del plan, las que faltaban al publicarlas, se hicieron
el 24/09/2026: ni las listas ni el editor usan ya prendas sueltas.

---

## La foto de perfil: la cara, con un cuadro por modelo

Hecha el 28/09/2026. Las miniaturas (arriba a la derecha, Comunidad, el
buscador, el portal) metían el cuerpo entero en un cuadrado: a 34 px lo
que se veía era el centro del cuerpo, y casi nunca la cara. Ahora cada
avatar puesto tiene además su **foto de perfil**: la cara del personaje
recortada en un cuadrado de 96 px, que el servidor dibuja a la vez que
el compuesto, en la misma carpeta y con la misma huella. Cómo se decidió
el encuadre, y el relleno al desplegarla, en
[el plan](../historia/AVATARES-AL-SERVIDOR.md#la-foto-de-perfil-cómo-se-decidió).

    /avatares/<id>/cara.jpg?v=<huella>

### Un cuadro por modelo, medido mirando

El primer intento fue una cuenta automática, desde los ojos y la boca de
cada modelo, y falló: max no tiene piezas de ojos y el cuadro caía a la
derecha; en tora cortaba la frente y se llevaba el cuello; en fiora y
fenglei dejaba la barbilla pegada al borde. Así que cada modelo tiene su
cuadro en `api/recortes-cara.json`, medido sobre su dibujo con una
cuadrícula: de la coronilla a la barbilla, con la composición del de
cereza, que fue el que gustó (la coronilla casi en el borde de arriba, la
barbilla hacia el 85 %, la cara centrada).

| Modelo | x | y | lado | Cuentas el 28/09/2026 |
|---|---|---|---|---|
| tora | 103 | 59 | 97 | 73 |
| cereza | 87 | 77 | 103 | 39 |
| fiora | 117 | 42 | 73 | 2 |
| max | 122 | 28 | 72 | 2 |
| fenglei | 130 | 80 | 67 | 1 |
| fengchao | 186 | 177 | 67 | 1 |

Lo que se cuida en `api/_avatar-compuesto.js`, "LA FOTO DE PERFIL":

- **Sin la mascota ni el marco.** Hay mascotas, como un zorro de nueve
  colas, que tapan al personaje entero, y el marco es del cuerpo entero.
  Son las dos últimas capas, así que se compone una sola vez: lo de
  debajo da la foto, y con ellas encima, el cuerpo entero. Las pruebas
  comprueban que el cuerpo entero sale con los mismos bytes que antes.
- **El cuadro va en la huella.** Si se cambia el de un modelo, cambia la
  huella de sus avatares, y con ella sus direcciones, que el navegador
  guarda un año. Después hay que correr el relleno
  (`node scripts/rellenar-avatares.js --produccion --aplicar`).
- **Un modelo nuevo usa un cuadro genérico** (x 88, y 24, lado 150), más
  grande, que en los modelos de pie coge la cabeza con aire. Antes de
  publicar un modelo hay que medirle el suyo y añadirlo al archivo.
- **Solo el avatar puesto** tiene foto; los diseños guardados, no. Si
  falta, se compone al pedirla, como el compuesto.

### Dónde se usa

`avatarMiniaturaHTML()` y `fotoDeAvatar()` en `js/core.js`: la barra de
arriba, el portal de inicio, el buscador y Explorar; y en Comunidad
(`js/comunidad-ranking.js`) el podio, el ranking, los recién llegados, la
moderación, los destacados y la actividad, más la página de actividad de
la comunidad. El mismo día, tras una auditoría de la web entera, el
resto de huecos pequeños: el chat, las reseñas, los comentarios y la
actividad de los dos perfiles, y las Ligas, que solo enseñaban la
inicial. En todos esos huecos, cuadrados o redondos de 34 a 55 px, la
foto ocupa el hueco entero (`tests/miniaturas-foto.test.js`).

Se quedan con el cuerpo entero, a propósito: el avatar grande del
perfil, las tarjetas de amigos (verticales, de 104 × 160 y 72 × 110), los
diseños guardados y el Bazar. Y un PNG de administrador sale como
siempre.

---

## El pelo de atrás: dos capas de pelo

Decidido el 04/10/2026, porque la comunidad lo pedía mucho: en
macrojuegos el pelo eran dos piezas, el de delante y el de atrás, y se
podía llevar el flequillo de un peinado con las colas de otro. Aquí era
una sola.

Desde entonces el avatar tiene 16 capas. La nueva, `peloatras` ("Pelo
de atrás" en el editor, el Bazar, el panel de arte y el taller), va
**justo debajo del pelo**:

    … accesorio, cara, peloatras, pelo, mascota, borde

Así lo eligió el administrador. Se dibuja como el pelo de siempre:
encima de la ropa y de la cara, y el de delante la tapa. El equipo de
arte la dibuja igual que dibuja los pelos, pero solo con la melena o
las colas, en el mismo lienzo de su personaje.

Lo que se decidió con ella:

- **Los 68 pelos de entonces se quedan enteros.** Siguen funcionando
  solos, con su melena. Para combinar, el equipo de arte dibuja pelos de
  atrás y, si quiere, pelos de delante sin melena. Partir los de
  entonces habría cambiado prendas que la gente ya tenía.
- **En el editor, su botón solo sale en los personajes que ya tienen
  alguno** (`js/perfil.js`, `filtrarOpcionesPorModelo`). La capa llegó
  sin dibujos; en el panel y el taller se puede subir y probar desde el
  primer día.
- **Se vende por rareza**, como todo ([ECONOMIA](ECONOMIA.md)).

Lo que NO hizo falta:

- **Migración.** `avatar_prendas.capa` es texto libre; quien decide qué
  capas existen es `CAPAS`, en `api/_avatar-catalogo.js`, y su gemela
  del navegador, `ORDEN_CAPAS_AVATAR` en `js/core.js`.
- **Recomponer los avatares.** La huella solo cuenta las capas que se
  llevan puestas (`recetaDe`), así que los que no llevan pelo de atrás
  conservan su huella, su imagen y su dirección.
- **Tocar el compositor, la vista previa, la foto de perfil o las
  miniaturas de la tienda.** Todos siguen el orden de `CAPAS`. La
  miniatura de un pelo de atrás sale como la de un pelo: encima del
  maniquí, con el cuadro automático.

Lo que muerde: el nombre `peloatras` empieza por `pelo`, así que nada
puede buscar las prendas de una capa por cómo empieza su valor
(`tora_peloatras1` empieza por `tora_pelo`). El avatar aleatorio del
editor lo hacía, y se cambió para mirar la capa de cada prenda. El
número de la siguiente prenda (`siguienteValor`, en `api/content.js`) no
tiene el problema: filtra por capa y exige un número justo detrás del
prefijo. Y en el panel de arte, adivinar la ranura por el nombre del
archivo funciona porque `peloatras` va antes que `pelo` en la lista.

Las pruebas: `tests/pelo-de-atras.test.js` (orden, huella, guardado y
tienda) y `tests/editor-pelo-de-atras.test.js` (el botón y el avatar
aleatorio).

---

## Lo que queda

### Un solo orden de capas

El orden de las 16 capas tiene que salir de un solo sitio, y hoy son tres copias: `CAPAS` en
`api/_avatar-catalogo.js`, `ORDEN_CAPAS_AVATAR` en `js/core.js` y otra `CAPAS` en
`scripts/importar-catalogo.js`. El 05/10/2026 coinciden, pero ya hubo un caso en que dos no
coincidían.

### Vender ranuras: pendiente, y con motivo

La idea, del 21/09/2026: que cada persona empiece con una ranura y
pueda comprar más, sin techo, con el precio subiendo en cada compra.

**La mitad técnica está hecha.** Desde la migración 020 el número de
ranuras es una columna de cada persona (`ranuras_avatar`) y el código no
pone techo: el límite es lo que diga esa columna. Subírsela a alguien es
un `UPDATE`. Lo que falta es la tienda.

**Por qué no se hizo ya**, y son dos razones medidas el mismo día, el 21/09/2026:

| | |
|---|---|
| Personas que usan 1 ranura de las 6 | 44 de 65 |
| Personas que usan las 6 | 0 |
| Cuentas con más de 100 millones de monedas | 4 |
| Cuentas con menos de 10 mil | 178 |
| Lo más caro de la tienda | 50.000 monedas |

Nadie ha llegado al tope que ya tiene, así que se vendería algo que
nadie ha gastado. Y la economía está partida en dos poblaciones: cuatro
cuentas pueden comprar la tienda entera veinte mil veces.

Peor: el **punto 18 de la auditoría** decía que las monedas se concedían
por número de peticiones y no por tiempo verificado, o sea que se
fabricaban, y **vender consumo de disco a cambio de una moneda así era
dar un botón para llenar el disco.** El 18 se arregló el 25/09/2026 y la
economía se rehízo el 04/10/2026 ([ECONOMIA](ECONOMIA.md)): antes de
decidir hay que volver a medir las dos razones.

**Cuando llegue el momento**, así lo haría:

- **El precio sube en cada compra, geométrico y no al cuadrado.** Al
  cuadrado es demasiado brusco: la quinta costaría 25 veces la primera.
  Multiplicar por 1,5 cada vez se siente mejor y es lo que usa medio
  género: con una base de 500, las ranuras salen a 500, 750, 1.125,
  1.688, 2.531... La décima cuesta 38 veces la primera y la vigésima
  2.200 veces. Se limita solo, sin un tope que parezca arbitrario.
- **Un tope duro de seguridad de todas formas**, porque un límite que no
  depende de que la economía funcione es el único en el que se puede
  confiar.
- **Una ranura vacía no cuesta disco.** Lo que ocupa 45 kB es la ranura
  LLENA. Comprar no consume nada; llenar sí. No se "asigna" espacio a
  nadie: cada diseño guardado es un archivo y ya está.

### Corregir una prenda sola

Pedido el 24/09/2026, para cuando alguna automática no se vea bien. Dos
formas, las dos para el equipo de arte y los administradores:

1. **Con la herramienta**, moviendo el cuadro de esa prenda. Hoy la
   herramienta solo fuerza capas enteras y solo existe en local; para
   esto tendría que guardar por prenda y vivir en el taller, con sesión
   y permiso.
2. **Subiendo una imagen hecha a mano.** El servidor la recorta a
   cuadrado, la reduce a 96 píxeles, la aplana sobre blanco y la guarda
   en JPG de calidad 80, que es lo que cumple toda previsualización.

Lo que ya está preparado: `cuadroParaPrenda` es el único sitio que
decide el cuadro, y ahí entra lo de una prenda sola antes que lo demás.
Lo que habrá que decidir entonces: dónde se guarda lo corregido, que
debería ser la base para poder cambiarlo sin desplegar, y que regenerar
las automáticas nunca pise una corregida a mano.
