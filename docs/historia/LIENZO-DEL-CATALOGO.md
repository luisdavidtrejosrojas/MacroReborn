# EL LIENZO DEL CATÁLOGO — los dibujos que no miden 327x504 (16/09/2026)

> **De qué trata:** la investigación del 16/09/2026 sobre los dibujos del catálogo que no miden el
> lienzo de 327x504: cuántos son, qué dice la base, qué destapó del panel de arte, cuánto importa y el
> trabajo que quedó pendiente.
>
> **Para quién:** quien toque el arte de los avatares, el panel de arte o el vestidor.
>
> **Revisado:** 05/10/2026

Salió de la guía de desarrollo el 05/10/2026, entera. Cómo es hoy el lienzo canónico, y cómo se
encajan los dibujos que ya estaban dentro, lo cuenta [ARTE](../referencia/ARTE.md).

El arte de los avatares se dibuja sobre un lienzo de 327x504 y se apila
con `object-fit: contain`. Esa es la norma, y es la que comprueba el
panel de arte (`LIENZO` en `js/arte.js`). Pero el catálogo heredado no la
cumple entero.

## Lo que hay, medido

Leyendo el bloque IHDR de los 641 PNG de `imagenes/`, de los que 636 son
prendas:

| Medida | Archivos | Dibujos distintos por sha256 |
|---|---|---|
| 327x504 | 504 | 353 |
| 327x505 | 86 | 25 |
| 326x503 | 42 | 36 |
| 326x504 | 1 | 1 |
| 654x1010 | 1 | 1 (`cereza/espalda2`, el doble exacto de 327x505) |
| 332x512 | 1 | 1 (`cereza/espalda3`) |
| 415x640 | 1 | 1 (`cereza/remera2`) |

Son 636 archivos pero solo 418 dibujos distintos: 297 archivos comparten
bytes con algún otro, porque los fondos, los bordes y las mascotas se
repiten entre personajes. `tora/fondo24`, `cereza/fondo24` y los
`fondo1` de fengchao, fenglei, fiora y max son el mismo sha256: seis
archivos, una fila de `avatar_archivos`.

## Y lo que dice la base, que es lo que manda

`imagenes/` es la carpeta heredada de la que se importó el catálogo. La
comprobación autoritativa es sobre `avatar_archivos`, y ya está hecha
(sobre la copia local de producción del 16/09/2026):

```sql
SELECT ancho, alto, count(*) FROM avatar_archivos GROUP BY 1, 2;
```

| Medida | Archivos | |
|---|---|---|
| 327x504 | 353 | |
| 326x503 | 36 | |
| 327x505 | 25 | |
| 654x1010 | 1 | `cereza/espalda2` |
| 415x640 | 1 | `cereza/remera2` |
| 332x512 | 1 | `cereza/espalda3` |
| 326x504 | 1 | `tora/pelo10` |
| **718x509** | 1 | subida por el panel |
| **569x570** | 1 | subida por el panel |
| **1338x2066** | 1 | subida por el panel |
| **500x500** | 1 | subida por el panel |

Los siete primeros coinciden **exactamente** con lo medido en `imagenes/`.
Los cuatro últimos no están en la carpeta: son arte subido desde
`arte.html` después de la importación.

## Lo que eso destapa sobre el panel

Todas las prendas que se han subido por el panel hasta hoy —cinco— están
**retiradas**, y ninguna medía el lienzo:

| Prenda | Nombre | Medida |
|---|---|---|
| `cereza_piel4` | teto | 500x500 |
| `cereza_fondo40` | pearto | 569x570 |
| `tora_fondo40` | Pearto | 569x570 |
| `tora_cara9` | Mascara MR. | 1338x2066 |
| `tora_fondo41` | Captura de pantalla 2026 09 15 113043 | 718x509 |

Cinco de cinco subidas fueron descuadradas y hubo que retirarlas. La
última es, literalmente, una captura de pantalla. Y retirar no recupera
el identificador: `siguienteValor()` se lo salta para siempre.

Esto no es una anécdota: es el motivo por el que el equipo de arte pidió
un sitio donde probar las prendas ANTES de publicarlas. Cada una de esas
cinco se habría visto mal en el vestidor antes de gastar un
identificador.

(Las dos "pearto" comparten un solo `avatar_archivos`: son el mismo
dibujo subido para dos personajes, y la deduplicación por sha256 hizo su
trabajo.)

## Cuánto importa

Poco, a la vista. Dentro del marco del avatar, la diferencia de encuadre
entre un 327x504 y un 327x505 es de 0,46 px a 300 px de ancho; entre un
326x503 y un 327x505, de 0,21 px. Es subpixel: no es la causa de ningún
descuadre visible. El descuadre que se ve viene de dónde está dibujada la
prenda dentro de su lienzo, no de la medida del lienzo.

Importa por otra cosa: cualquier operación que reencuadre una prenda
tiene que decidir qué hacer con esas 64 piezas, y si lo hace por encaje
las remuestrea. Es la razón de que el vestidor use base pegada 1:1 con
anclaje entero en vez de `contain` (ver `js/arte-vestidor.js`).

## Que no es un desorden vivo

La numeración de las prendas es cronológica, porque `siguienteValor()`
(`api/content.js`) nunca reutiliza un número. Mirando los fondos:

```
tora/fondo      1-2:503   3-23:504   24-35:505   36-39:504
cereza/fondo    1-2:503   3-23:504   24-35:505   36-39:504
fengchao/fondo  1-12:505  13-19:504
max/fondo       1-12:505  13-19:504
```

Los doce fondos de 327x505 son un lote comprado una vez y replicado en
los seis personajes. Y de las 70 capas del catálogo (personaje x ranura),
66 terminan en 327x504: las cuatro excepciones son de cereza
(`boca9`, `guantes2`, `ojos12`, `pelo20`). O sea que el episodio está
cerrado: lo último dibujado ya respeta la norma.

## Trabajo pendiente que esto destapa

Ninguno es urgente y ninguno se arregla desde el vestidor.

1. **Normalizar las 64 filas descuadradas.** Sería un script, no una
   pantalla: rehornear a 327x504 con el mismo recorte o relleno entero
   que usa el vestidor, en una transacción, apuntando los `archivo_id`
   en bloque y **sin tocar los `valor`**, que es lo que las cuentas
   llevan puesto. Tres cosas a resolver antes: la URL `/prendas/<sha>.png`
   cambia y está cacheada un año con `immutable`; hay que decidir qué
   pasa con `avatar_catalogo_version` y los dos procesos de `cluster.js`;
   y el servidor no tiene librería de imagen, así que el horno tendría
   que correr en un navegador.

2. **`componerAvatarPNG` compone al tamaño de la primera capa que
   cargue** (`js/core.js`): `const ancho = imagenes[0].naturalWidth`. La
   primera es `fondo`, o `espalda` si no hay fondo, y ahí vive
   `cereza/espalda2`, de 654x1010. Un avatar sin fondo con esa espalda
   compone un PNG con cuatro veces los píxeles y estira las otras catorce
   capas. Como todas las proporciones reales caen dentro del 0,3 %, la
   deformación es subpixel; el peso no. Clavar el lienzo de composición
   es una línea, pero toca camino caliente (perfil, chat, ranking,
   comentarios, amigos) y va con su propia prueba.

3. **El CSS se contradice.** `css/arte.css` usa 327x504 y `css/perfil.css`
   usa `aspect-ratio: 327 / 505` en cuatro sitios, más
   `css/perfil-macrojuegos-light.css`. Son los dos previos que ve un
   artista y discrepan un 0,2 %. Con la medición en la mano el número
   correcto es el del panel de arte.

4. **El aviso del panel se enciende para el 21 % del arte histórico.**
   `js/arte.js` resalta cualquier medida distinta de 327x504. Es correcto
   como norma de futuro, pero si alguien vuelve a subir uno de los doce
   fondos del lote verá un aviso sobre un dibujo que ya está publicado
   veinticuatro veces tal cual. No es un fallo: conviene tenerlo escrito
   antes de que alguien "arregle" el aviso quitándolo.
