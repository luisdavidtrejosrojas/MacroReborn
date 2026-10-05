# DESARROLLO — backend e infraestructura local

Guía técnica del backend del proyecto y de la infraestructura local
para desarrollar y probar: la conexión a la base de datos, el sistema
de contraseñas, y las herramientas locales (PGlite, servidor local,
backfill y tests).

---

## 1. Qué cubre esta guía

- Los módulos compartidos del backend (`api/_db.js`, `api/_password.js`,
  `api/_avisos.js`, `api/_monedas.js`) y los cambios en `api/auth.js`,
  `api/users.js` y `api/content.js`.
- La infraestructura local: `scripts/pglite.js`,
  `scripts/servidor-local.js`, `scripts/migrar-passwords.js` y
  `scripts/smoke-local.js`, junto con los tests de `tests/`.
- Cómo correr, probar y desplegar, y las convenciones del proyecto.

## 2. Módulos nuevos del backend

### 2.1 `api/_db.js` — conector único de base

Antes cada archivo de la API creaba su conexión con
`neon(process.env.DATABASE_URL)`. Ahora la conexión pasa por acá:

- `obtenerSql()` → devuelve la función `sql` lista (Neon en
  producción).
- `usarSqlLocal(sqlLocal)` → reemplaza la conexión por una base local
  (PGlite) en desarrollo/tests.

Los handlers de esta rama (`api/auth.js`, `api/users.js` y
`api/content.js`) usan `obtenerSql()` en vez de crear la conexión a mano.

Cuando se escribió esto, `social.js` y `system.js` no pasaban por acá:
llamaban a `neon()` directo en su primera línea. La mudanza al VPS lo
arregló —contra un Postgres normal habrían seguido intentando hablar con
Neon— y hoy **los siete handlers** pasan por `obtenerSql()`. Ver
`docs/referencia/VPS.md#33-apisocialjs-y-apisystemjs`.

## 3. Infraestructura local

### 3.1 `scripts/pglite.js` — base de práctica

- `crearBaseLocal()` → crea un Postgres real embebido (PGlite, WASM),
  arma la tabla `users` base y aplica todas las migraciones de
  `migrations/` en orden (incluidas la 013, 014 y 015).
- `crearSqlPGlite(db)` → adaptador que imita la interfaz del driver de
  Neon (`sql\`...\``), para que los mismos handlers corran contra la
  base local. Soporta **fragmentos SQL anidados**: pedazos `sql\`...\``
  incrustados dentro de otros (como hace `api/users.js` con
  `semanaActualSQL`); un fragmento solo se ejecuta cuando se espera
  con `await`, y al incrustarse se pega su SQL con los parámetros
  renumerados.

### 3.2 `scripts/servidor-local.js` — probar en el navegador

```bash
npm run db:local
```

Abre `http://localhost:3001`:

- Sirve los archivos estáticos del sitio.
- Rutea `/api/auth`, `/api/users` y `/api/content` con los handlers
  reales contra la base de práctica.
- Crea un usuario de prueba `demo` / `demo1234` con contraseña en
  texto plano, para ver la migración perezosa en vivo: la consola
  avisa `"demo" entró: su contraseña en texto plano fue migrada a
  hash` solo cuando hubo una migración real (los usuarios nuevos no
  imprimen nada).
- Siembra un catálogo de arte de mentira (`scripts/sembrar-arte.js`):
  dos personajes y quince prendas de colores planos, dibujadas con
  `zlib`, para poder probar el panel de arte y el vestidor. Las medidas
  NO son todas 327x504 a propósito: trae los mismos casos raros que el
  catálogo real (ver la sección 6).
- `demo` recibe los roles de `artista` y `administrador`, o el panel de
  arte lo echaría a la portada.
- Limitación a propósito: `/api/social` y `/api/system` no están
  activados en el modo local; las secciones que los usan se ven vacías
  (esperado).
- Y para probar contra los datos DE VERDAD, ver la sección 8.

### 3.4 `tests/password.test.js` — tests

```bash
npm test
```

Usa `node:test` (incluido en Node). Los tests crean su propia base de
práctica, inyectan la conexión con `usarSqlLocal()` y ejercitan los
handlers reales. Cubren: registro con hash, login correcto/incorrecto,
migración legacy, cambio de contraseña, borrado de cuenta y usuario
duplicado.

### 3.5 `tests/monedas.test.js` — reglas de monedas

Se ejecuta junto con `npm test` y usa una base PGlite nueva por suite. Cubre
el primer otorgamiento, la ventana de diez minutos, el tope diario, el
overshoot permitido, el reseteo perezoso UTC, llamadas concurrentes,
`gastar()`/`consultarSaldo()` y el enganche real de monedas en el handler de
XP y en la tienda.

### 3.6 `tests/migrations.test.js` — contrato de la migración 015

Comprueba que las tres columnas nuevas existen con tipo, default y nulabilidad
correctos, que la columna `users.monedas` conserva su saldo y que volver a
aplicar la migración es seguro. La base es efímera: al terminar el proceso no
queda ningún archivo ni conexión con Neon.

### 3.7 `scripts/smoke-local.js` — prueba HTTP de extremo a extremo

```bash
npm run test:smoke
```

El script busca un puerto libre, arranca `scripts/servidor-local.js` con una
PGlite efímera, comprueba que el sitio responde, hace login con `demo` /
`demo1234`, envía dos pulsos de XP y verifica que el primero otorga entre 10 y
30 monedas y el segundo devuelve el no-op de diez minutos. Después abre una
conexión de avisos en vivo, dispara un latido y comprueba que el aviso llega
por esa línea (sección 9): es lo único que ejercita la cadena entera, porque
las suites de `tests/` prueban cada pieza por separado. Siempre termina el
proceso hijo, también cuando falla una aserción. No necesita una base externa;
el servidor local usa un secreto efímero por defecto solo cuando no se
proporciona `SESSION_SECRET` en el entorno.

### 3.8 Verificación manual en navegador

La automatización no sustituye la comprobación visual del flujo del sitio.
Para hacerla sin tocar la base real:

1. Ejecutar `npm run db:local` y abrir `http://localhost:3001/login.html`.
2. Entrar como `demo` / `demo1234`; la consola del servidor debe mostrar la
   migración perezosa de la contraseña solo en el primer login.
3. Abrir `http://localhost:3001/jugar.html?id=112`, dejar la pestaña activa y
   abrir DevTools → Network. Cada minuto debe aparecer
   `POST /api/users?action=xp` con `success: true` y un objeto `monedas`.
4. En el primer pulso de un usuario nuevo se verá `otorgado: true` y un monto
   entre 10 y 30. Los pulsos siguientes durante los diez minutos siguientes
   deben mostrar `otorgado: false`, `monto: 0` y
   `razon: "aun-no-pasaron-10-minutos"`. El frontend todavía no muestra un
   toast de monedas, por decisión de alcance de esta rama.
5. Para observar un nuevo premio hay que dejar transcurrir diez minutos
   reales (el smoke test y los tests unitarios simulan el tiempo; no hace
   falta esperar para validar la regla automáticamente).

La compra de un avatar se valida automáticamente contra el handler real en
`tests/monedas.test.js`. Desde que el servidor local enruta `/api/content`, la
pantalla de tienda y el panel de arte también se pueden mirar en el navegador
sin tocar producción: con datos de mentira (`npm run db:local`) o con una copia
de los de verdad (`npm run db:real`, sección 8).

## 5. Convenciones del proyecto

- **Idioma**: comentarios y mensajes en español, explicando el "por
  qué".
- **Sin emojis**: en código, consola, commits y documentación nueva.
  Lo preexistente no se toca.
- **Commits**: un cambio lógico por commit, sin firmas ni pies de
  autoría automáticos.
- **Reutilizar**: la lógica compartida va en `api/_*.js`; no duplicar
  lo que ya existe.
- **Dependencias**: una librería que se ejecuta **dentro del VPS**
  está permitida, y se elige por lo que cuesta mantenerla: mejor sin
  binario nativo que con él, y mejor sin dependencias propias que con
  ellas. Lo que no se acepta es depender de un **servicio de terceros**
  que se pueda acabar o cambiar de precio: de ahí salieron Vercel, Neon
  y Pusher. `api/_png.js` y `api/_lienzo.js` están escritos a mano por
  la primera regla y no por la segunda, y siguen así porque funcionan y
  están probados, no porque traer una librería esté prohibido.

---

## 8. Probar contra los datos de verdad

El modo local de siempre (`npm run db:local`) arma una base vacía desde
las migraciones y la rellena con un puñado de cosas de mentira. Sirve
para el camino feliz, y es lo que hay que usar todos los días porque
arranca en segundos y no tiene datos de nadie.

Pero no sirve para lo que de verdad rompe: el usuario con doscientas
prendas guardadas, la prenda descuadrada que alguien lleva puesta desde
hace un año, el avatar PNG de casi un mega, las 271.000 puntuaciones del
ranking. Para eso está la copia de producción.

```bash
npm run db:traer     # baja el ultimo respaldo del VPS y arma la copia
npm run db:real      # arranca el servidor local contra ella
```

La primera vez tarda lo que tarde el `scp`; armar la base son unos 4
segundos para 557.535 filas. Después queda guardada en
`datos-locales/pgdata` y `npm run db:real` arranca enseguida.

### Lo que hay que saber antes de usarlo

**Baja datos de personas.** El respaldo trae las cuentas, las biografías,
los comentarios de perfil y los mensajes de chat de 141 personas. No hay
correos —`users` no tiene esa columna— pero sí contraseñas, hoy todas
picadas con bcrypt en `password_hash`.

Hasta el 16/09/2026 el respaldo traía además `password` **en texto
plano** para quien no hubiera entrado desde la migración perezosa. El
backfill cerró ese hueco en la base (`docs/historia/CONTRASENAS-EN-CLARO.md#plan-de-activación-en-producción`), pero no en
los respaldos ya sacados: **un `.sql.gz` anterior a esa fecha sigue
llevando 17 contraseñas en claro**. Los del VPS se borran solos a los 14
días; el que esté en `datos-locales/` de un portátil, no. Si hay uno
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

`--sin-registros` deja fuera las dos tablas de histórico, que son 90 de
los 108 MB de la base y no hacen falta para probar nada del sitio. Las
tablas se crean igual, solo se quedan vacías.

`--tal-cual` existe para cuando haya que depurar la propia migración de
contraseñas. Si se usa, que sea a sabiendas.

El acceso al VPS sale de `docs/referencia/VPS.md`; se puede apuntar a otra máquina
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

La parte de respaldos de `docs/referencia/VPS.md#respaldos` dice que conviene bajar una copia a otro
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
capas apiladas como las apila hoy el navegador, a la derecha la sola
imagen del servidor. Si las dos columnas se ven iguales, el cambio no
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
cd D:\Macroreborn
npm test                  # 756 pruebas, ~1 min, no tocan nada
npm run db:traer          # baja una copia de la base de produccion
node scripts/rellenar-avatares.js --aplicar    # compone los 215
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

Para mirar los compuestos a ojo, uno al lado del otro con lo que hace
hoy el navegador, está `npm run revision:avatares`.

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
generará las 768 (`api/_previsualizacion.js`). Si difiere de la de en
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

Las dibuja todas con el mismo código que las generará para el sitio y
las pone en `revision-previsualizaciones/index.html`, por capa y por
modelo. La primera vez, el 24/09/2026: 768 en 10 segundos, 2 MB,
ninguna fallida. 252 no caben enteras y se ven desde arriba; 236 de
ellas son fondos, bordes, pieles y modelos, que ocupan el lienzo
entero. No correrla con el servidor local abierto: las dos abren la
misma copia de la base.
