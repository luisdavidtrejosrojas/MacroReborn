# DESARROLLO — trabajar en local

> **De qué trata:** cómo se trabaja en la máquina propia sin tocar producción: la base de práctica, el
> servidor local, las pruebas y la prueba de humo, cómo probar con una copia de los datos de verdad, y
> cómo mirar a ojo los avatares y las previsualizaciones.
>
> **Para quién:** el equipo de desarrollo.
>
> **Revisado:** 05/10/2026

---

## Qué cubre esta guía

- El conector de la base (`api/_db.js`), que es lo que deja correr los handlers reales contra una
  base de práctica.
- La base de práctica (`scripts/pglite.js`), el servidor local (`scripts/servidor-local.js`), las
  pruebas de `tests/` y la prueba de humo (`scripts/smoke-local.js`).
- Probar con una copia de los datos de verdad (`npm run db:traer` y `npm run db:real`).
- Mirar a ojo los avatares compuestos y las previsualizaciones, y la herramienta de los recortes.

Cómo es cada parte del sistema lo cuenta su documento de referencia, y cómo se despliega,
[DESPLEGAR](DESPLEGAR.md).

## El conector de la base: `api/_db.js`

Los handlers piden la conexión a `api/_db.js` (`obtenerSql()`), y `usarSqlLocal(sqlLocal)` la cambia
por una base de práctica: así las pruebas y el servidor local corren los handlers de verdad sin tocar
producción. Cómo elige la conexión en producción lo cuenta
[ARQUITECTURA](../referencia/ARQUITECTURA.md#cómo-se-conectan).

## Infraestructura local

### `scripts/pglite.js` — base de práctica

- `crearBaseLocal()` → crea un Postgres real embebido (PGlite, WASM),
  arma la tabla `users` base y aplica todas las migraciones de
  `migrations/` en orden (incluidas la 013, 014 y 015).
- `crearSqlPGlite(db)` → adaptador que imita la interfaz de `sql` que usan
  los handlers, la del driver de Neon de antes de la mudanza (`sql\`...\``), para que los mismos handlers corran contra la
  base local. Soporta **fragmentos SQL anidados**: pedazos `sql\`...\``
  incrustados dentro de otros (como hace `api/users.js` con
  `semanaActualSQL`); un fragmento solo se ejecuta cuando se espera
  con `await`, y al incrustarse se pega su SQL con los parámetros
  renumerados.

### `scripts/servidor-local.js` — probar en el navegador

```bash
npm run db:local
```

Abre `http://localhost:3001`:

- Sirve los archivos estáticos del sitio.
- Rutea `/api/auth`, `/api/users` y `/api/content` con los handlers
  reales contra la base de práctica, y `/api/avisos`, la línea de los
  avisos en vivo.
- Crea un usuario de prueba `demo` / `demo1234` con contraseña en
  texto plano, para ver la migración perezosa en vivo: la consola
  avisa `"demo" entró: su contraseña en texto plano fue migrada a
  hash` solo cuando hubo una migración real (los usuarios nuevos no
  imprimen nada).
- Siembra un catálogo de arte de mentira (`scripts/sembrar-arte.js`):
  dos personajes y quince prendas de colores planos, dibujadas con
  `zlib`, para poder probar el panel de arte y el vestidor. Las medidas
  NO son todas 327x504 a propósito: trae los casos raros que tenía el
  catálogo real antes de llevarlo al lienzo
  ([el lienzo](../referencia/ARTE.md#3-el-lienzo-canónico-al-subir)).
- `demo` recibe los roles de `artista` y `administrador`, o el panel de
  arte lo echaría a la portada.
- Limitación a propósito: `/api/social`, `/api/system`, `/api/progreso`
  y `/api/originales-ranking` no están en el modo local y contestan 404;
  las secciones que los usan se ven vacías (esperado).
- Y para probar contra los datos DE VERDAD, [más abajo](#probar-contra-los-datos-de-verdad).

### Las pruebas (`npm test`)

```bash
npm test
```

Usa `node:test` (incluido en Node). Las pruebas que necesitan base crean la suya, de práctica,
inyectan la conexión con `usarSqlLocal()` y ejercitan los handlers reales; ninguna toca producción.
Son unas 1.300 al 05/10/2026, y tardan cerca de un minuto.
Qué sujeta cada archivo lo dice el documento de su área: por ejemplo, las contraseñas en
[CUENTAS](../referencia/CUENTAS.md#pruebas) y las monedas en
[ECONOMIA](../referencia/ECONOMIA.md#6-las-pruebas).

### `scripts/smoke-local.js` — prueba HTTP de extremo a extremo

```bash
npm run test:smoke
```

El script busca un puerto libre, arranca `scripts/servidor-local.js` con una
PGlite efímera, comprueba que el sitio responde y hace login con `demo` /
`demo1234`. Después manda dos pulsos de XP seguidos. El primero se cuenta y
paga lo que dice la regla de las monedas: la racha del primer día, nada por
jugar en el primer minuto y el premio del nivel solo si se sube. La prueba lo
calcula con las funciones de `api/_monedas.js`, sin copiar sus números, y
comprueba que el saldo (`/api/content?action=mis-monedas`) sube eso,
exactamente. El segundo no se cuenta, porque un minuto solo cuenta si pasaron
55 segundos desde el anterior, y el saldo no cambia. Después abre una
conexión de avisos en vivo, dispara un latido y comprueba que el aviso llega
por esa línea ([AVISOS](../referencia/AVISOS.md)): es lo único que ejercita la cadena entera, porque
las suites de `tests/` prueban cada pieza por separado. Siempre termina el
proceso hijo, también cuando falla una aserción. No necesita una base externa;
el servidor local usa un secreto efímero por defecto solo cuando no se
proporciona `SESSION_SECRET` en el entorno.

### Verificación manual en navegador

La automatización no sustituye la comprobación visual del flujo del sitio.
Para hacerla sin tocar la base real:

1. Ejecutar `npm run db:local` y abrir `http://localhost:3001/login.html`.
2. Entrar como `demo` / `demo1234`; la consola del servidor debe mostrar la
   migración perezosa de la contraseña solo en el primer login.
3. Abrir `http://localhost:3001/jugar.html?id=112` y DevTools → Network. Con la pestaña a la vista
   y tocando el teclado o el ratón (a los 3 minutos sin nada el navegador deja de mandar el pulso),
   cada minuto debe aparecer `POST /api/users?action=xp` con `success: true` y un objeto `monedas`.
4. El primer pulso del día trae la racha. Los siguientes, hasta el minuto 10 de juego del día,
   muestran `otorgado: false`, `monto: 0` y `razon: "aun-no-pasaron-10-minutos"`; en el 10, el 20,
   el 30…, entre 10 y 30 monedas. Las reglas enteras, en
   [ECONOMIA](../referencia/ECONOMIA.md#3-cómo-se-ganan).
5. Para ver un premio de juego hay que jugar diez minutos reales (las pruebas de
   `tests/monedas.test.js` simulan los minutos; no hace falta esperar para validar la regla
   automáticamente).

La compra de un avatar se valida automáticamente contra el handler real en
`tests/monedas.test.js`. Desde que el servidor local enruta `/api/content`, el
Bazar y el panel de arte también se pueden mirar en el navegador
sin tocar producción: con datos de mentira (`npm run db:local`) o con una copia
de los de verdad (`npm run db:real`, [más abajo](#probar-contra-los-datos-de-verdad)).

## Convenciones del proyecto

Las manda la constitución (`.specify/memory/constitution.md`): español, sin emojis, un commit por
cambio, reutilizar lo que ya existe en `api/_*.js` y qué dependencias se aceptan (reglas I, XXX, V,
XI y XXVI). Por qué `api/_png.js` y `api/_lienzo.js` están escritos a mano lo cuenta
[ARTE](../referencia/ARTE.md).

---

## Probar contra los datos de verdad

El modo local de siempre (`npm run db:local`) arma una base vacía desde
las migraciones y la rellena con un puñado de cosas de mentira. Sirve
para el camino feliz, y es lo que hay que usar todos los días porque
arranca en segundos y no tiene datos de nadie.

Pero no sirve para lo que de verdad rompe: el usuario con doscientas
prendas guardadas, la prenda descuadrada que alguien lleva puesta desde
hace un año, el avatar PNG de casi un mega, las 271.000 puntuaciones del
ranking (16/09/2026). Para eso está la copia de producción.

```bash
npm run db:traer     # baja el ultimo respaldo del VPS y arma la copia
npm run db:real      # arranca el servidor local contra ella
```

La primera vez tarda lo que tarde el `scp`; armar la base son unos 4
segundos para 557.535 filas (16/09/2026). Después queda guardada en
`datos-locales/pgdata` y `npm run db:real` arranca enseguida.

### Lo que hay que saber antes de usarlo

**Baja datos de personas.** El respaldo trae las cuentas, las biografías,
los comentarios de perfil y los mensajes de chat de 141 personas el 16/09/2026. No hay
correos —`users` no tiene esa columna— pero sí contraseñas, hoy todas
picadas con bcrypt en `password_hash`.

Hasta el 16/09/2026 el respaldo traía además `password` **en texto
plano** para quien no hubiera entrado desde la migración perezosa. El
backfill cerró ese hueco en la base
([la activación](../historia/CONTRASENAS-EN-CLARO.md#plan-de-activación-en-producción)), pero no en
los respaldos ya sacados: **un `.sql.gz` anterior a esa fecha sigue
llevando 17 contraseñas en claro**. Los diarios del VPS de antes de esa
fecha ya se borraron solos, porque se guardan 14 días; el que esté en
`datos-locales/` de un portátil, no. Si hay uno
viejo ahí, lo que corresponde es borrarlo y volver a bajar.

Por eso, por defecto, **la copia local se queda sin credenciales**: todas
las cuentas pasan a tener la misma clave conocida, `local1234`. No se
pierde nada para probar y se gana algo —se puede entrar como cualquier
usuario del sitio para reproducir lo que le pasa— y deja de haber
contraseñas reales de terceros en un portátil.

`datos-locales/` está en `.gitignore`. Que siga estando.

### Las opciones

```bash
npm run db:traer -- --ultimo          # no pide un respaldo nuevo: usa el ultimo
npm run db:traer -- --archivo=X.sql.gz  # uno que ya este bajado
npm run db:traer -- --sin-registros   # sin activity_log ni originales_scores
npm run db:traer -- --clave=otra      # otra clave para las cuentas locales
npm run db:traer -- --tal-cual        # NO toca las credenciales
```

`--sin-registros` deja fuera las dos tablas de histórico, que eran 90 de
los 108 MB de la base el 16/09/2026, y no hacen falta para probar nada del sitio. Las
tablas se crean igual, solo se quedan vacías.

`--tal-cual` existe para cuando haya que depurar la propia migración de
contraseñas. Si se usa, que sea a sabiendas.

El acceso al VPS sale de [VPS](../referencia/VPS.md); se puede apuntar a otra máquina
con `MR_VPS_HOST` y `MR_VPS_KEY`.

### Por qué hace falta traducir el volcado

`pg_dump` escribe un archivo pensado para `psql`, y PGlite no es `psql`:
lleva metacomandos (`\restrict`) que no son SQL, y vuelca los datos con
`COPY ... FROM stdin` seguido de las filas en el mismo archivo, que
funciona porque `psql` las va mandando por el protocolo. PGlite recibe el
texto de golpe y contesta `syntax error at or near "1"`.

`scripts/base-real.js` parte el volcado en trozos de SQL y bloques de
datos, ejecuta el SQL tal cual y le pasa cada bloque por la vía propia de
PGlite: `COPY ... FROM '/dev/blob'`. Es además mucho más rápido que
convertirlo todo a `INSERT`.

Un detalle que cuesta media hora si no se sabe: el volcado empieza con
`set_config('search_path', '', false)` para que todo vaya calificado con
su esquema, y eso deja la sesión sin `search_path`. Después de cargar hay
que devolverlo a `public` o un `SELECT ... FROM users` a secas contesta
`relation "users" does not exist`.

### De paso, el respaldo que faltaba

[La parte de respaldos de VPS](../referencia/VPS.md#respaldos) dice que conviene bajar una copia a otro
lado, porque un respaldo que solo existe en el servidor que respalda no
protege de perder el servidor. `npm run db:traer` deja el `.sql.gz` en
`datos-locales/`, así que cada vez que se usa para probar, de paso
cumple eso.

---

## Los avatares compuestos, a ojo

Las pruebas dicen que el orden y el alfa están bien, pero no dicen si el
avatar se ve como se veía. Eso lo dice el ojo, y para eso está
`npm run revision:avatares`.

Arma una página donde cada avatar sale dos veces: a la izquierda las
capas apiladas, como las apilaba el navegador hasta el 24/09/2026, a la
derecha la sola imagen del servidor. Si las dos columnas se ven iguales, el cambio no
altera el producto.

```
npm run revision:avatares                     doce, de datos-locales
npm run revision:avatares -- --cuantos 40
npm run revision:avatares -- --calidad 92
```

Escribe en `revision-avatares/`, fuera de git porque lleva arte dentro.
La copia de `datos-locales` envejece rápido: si algo no cuadra, correr
antes `npm run db:traer`.

---

## Probar los avatares en tu máquina

El sitio entero, con los datos de verdad, en `localhost:3001`. Nada de
lo que se haga ahí toca producción.

```powershell
# desde la carpeta del repositorio
npm test                  # unas 1.300 pruebas, ~1 min, no tocan nada
npm run db:traer          # baja una copia de la base de produccion
node scripts/rellenar-avatares.js --aplicar    # compone los de la copia
npm run db:real           # el sitio en http://localhost:3001
```

Ese tercer paso es el que suele olvidarse: `db:traer` baja las recetas
pero no las imágenes, porque son derivadas y viven en el disco del
servidor. Sin él, las direcciones de avatar dan 404 en local.

Dentro del sitio local se puede entrar **como cualquier persona del
sitio**, con la contraseña `local1234` que `db:traer` le pone a todas en
la copia. Así se reproduce lo que le pasa a alguien concreto.

Qué mirar:

| Dirección | Qué debe pasar |
|---|---|
| `/avatares/<id>/327x504.jpg` | La imagen, con un minuto de caché |
| `/avatares/<id>/327x504.jpg?v=loquesea` | La MISMA imagen, con un año |
| `/avatares/<id>/ranura1/327x504.jpg` | Su primer diseño guardado |
| `/avatares/999999/62x96.jpg` | 404 |

Y la prueba que de verdad importa: **cambiarse el avatar y recargar la
misma dirección.** Tiene que salir la ropa nueva sin que la dirección
haya cambiado.

Para mirar los compuestos a ojo, uno al lado del otro con las capas
apiladas, está `npm run revision:avatares`.

---

## La herramienta de los recortes de previsualización

Ya no hace falta usarla. Sirve para revisar el automático prenda por
prenda y, si una capa entera saliera mal, forzarle un cuadro.

Solo existe en el sitio local, y solo responde a peticiones de la
propia máquina, porque tiene un botón que escribe un archivo del
repositorio. `server.js` no la conoce, y una prueba lo vigila.

```
npm run db:real
```

Y en el navegador, `http://localhost:3001/herramientas/recortes/`.

| | |
|---|---|
| Arrastrar el cuadro | lo mueve |
| Arrastrar una esquina | lo agranda o lo encoge, siempre cuadrado, con la esquina opuesta quieta |
| Flechas | un píxel; con Mayús, diez |
| `+` y `-`, o la rueda | el tamaño, sin mover el centro |
| Usar para toda la capa | fija el cuadro que se ve para todas las prendas de esa capa en ese modelo |
| Volver al automático | quita lo forzado |
| Copiar a los demás modelos | pone el mismo cuadro en esa capa de los otros; hay que revisarlos, las poses no son iguales |
| La más grande, la más pequeña | salta a las prendas extremas, que es donde se ve si el cuadro les sirve a todas |

Lo que sale como **"la de verdad"** lo hace el mismo código que
genera las del sitio (`api/_previsualizacion.js`). Si difiere de la de en
vivo, manda ella.

**Junto a ella, al mismo tamaño, salen las de macrojuegos** de esa capa,
para comparar sin tener que bajar. En las capas de las que no quedó
ninguna sale una de cada tipo, con su nombre, para ver al menos el
estilo; y en la capa modelo, las cabezas de sus modelos, con la del
abierto primero. Las lee de `datos-locales/macrojuegos-referencia/`: si
esa carpeta no está, la herramienta funciona igual y lo dice.

El cuadro automático se ve con borde amarillo discontinuo, cambia con
cada prenda y **no se guarda**; uno forzado, verde y continuo, vale para
toda la capa. Lo que no está en el archivo es automático.

---

## Revisar todas las previsualizaciones de una vez

```
npm run revision:previsualizaciones
```

Las dibuja todas con el mismo código que las genera para el sitio y
las pone en `revision-previsualizaciones/index.html`, por capa y por
modelo. La primera vez, el 24/09/2026: 768 en 10 segundos, 2 MB,
ninguna fallida. 252 no caben enteras y se ven desde arriba; 236 de
ellas son fondos, bordes, pieles y modelos, que ocupan el lienzo
entero. No correrla con el servidor local abierto: las dos abren la
misma copia de la base.
