# Plan de implementación: que los juegos no puedan leer la sesión

**Rama**: `008-aislar-juegos` | **Fecha**: 2026-10-09 | **Especificación**: [spec.md](spec.md)

**Entrada**: la especificación de `specs/008-aislar-juegos/spec.md`, con sus dos aclaraciones del
09/10/2026: las partidas pasan solas, y Luis puede entrar en IONOS.

## Resumen

Los 107 juegos de terceros pasan a abrirse desde una dirección propia, `juegos.macroreborn.com`, con la
misma ruta de hoy. Es otro origen para el navegador: su código ya no puede leer la sesión ni lo que
guarda la web, ni tocar la página. Además, el marco lleva un `sandbox` que no lo deja llevarse la página
a otra dirección. Macro Snake, del equipo, se queda en la web; los cuatro de otras webs, donde están.

Lo sirve el mismo Node, por el nombre de la dirección, con un módulo compartido por los dos servidores
(`api/_juegos-aparte.js`). En la dirección de los juegos solo salen los envoltorios; en la web, la
dirección vieja de un juego redirige a la nueva. nginx suma un bloque para el nombre nuevo, sin
`X-Frame-Options`, y el certificado se amplía. Luis añade el registro del DNS en IONOS.

Para que el XP y las monedas cuenten igual, el servidor mete en cada envoltorio un puente que avisa a la
página, con `postMessage`, de que alguien está tocando el juego. Para que nadie pierda sus partidas, la
primera vez que se abre un juego después del cambio, la página pasa lo que guardaron los juegos a la
dirección nueva, sin las cachés, sin lo del sitio y sin pisar nada. En el PC, la dirección de los juegos
es el puerto siguiente.

El porqué de cada decisión, con lo descartado, está en [research.md](research.md); las piezas, en
[data-model.md](data-model.md); lo que se promete, en [contracts/](contracts/); y cómo se comprueba, en
[quickstart.md](quickstart.md).

## Contexto técnico

**Lenguaje y versión**: JavaScript sin frameworks. En el servidor, Node 24 (la del servidor; se admite
desde la 22.13), CommonJS. En el navegador, scripts clásicos, como el resto del sitio.

**Dependencias**: ninguna nueva en producción. Para las pruebas, `fake-indexeddb` 6.2.5 (de noviembre de
2025, Apache-2.0, sin dependencias propias), porque jsdom no tiene IndexedDB (research D11).

**Almacenamiento**: `localStorage` e IndexedDB del navegador de quien juega. La base de datos no cambia:
ni tablas ni migraciones.

**Pruebas**: `npm test` (`node --test`, con jsdom y PGlite, como hoy) y la prueba de humo, con Node 24 y
22 en el PC (regla XXII, CI apagada). Para mirar los juegos uno a uno, una herramienta nueva,
`scripts/revision-juegos.js`, que maneja Edge sin ventana por el protocolo de depuración. No la corre
`npm test`.

**Plataforma**: el VPS (Ubuntu 24.04 arm64, nginx 1.24, certbot 2.9) y los navegadores de la comunidad,
en PC y en móvil. La mudanza de IndexedDB necesita `indexedDB.databases()`, que tienen Chrome, Edge,
Safari 14 o más y Firefox 126 o más. Sin él, pasa solo el `localStorage`.

**Tipo de proyecto**: una web con su servidor en el mismo repositorio (HTML, CSS y JS en la raíz y en
`js/`; la API en `api/`; `server.js` y `scripts/servidor-local.js`).

**Objetivos de rendimiento**: abrir un juego no tarda más que hoy. La única espera es la mudanza, una vez
por navegador y solo si hay partidas: unos segundos, con un tope de 60. El puente manda un mensaje como
mucho cada 5 segundos.

**Restricciones**:

- HSTS con `includeSubDomains`: la dirección nueva tiene que tener HTTPS antes de que nada la use.
- `X-Frame-Options: SAMEORIGIN` en la web: el bloque de nginx de los juegos no puede llevarlo.
- La caché de cinco minutos de los `.js`: hay que subir las versiones `?v=` (research D13).
- 15 envoltorios llevan `<base href>` a jsDelivr: el puente va en línea, no con `src`.
- El servidor tiene 950 MB de memoria: el módulo sirve envoltorios de pocos kB, y no cambia nada.
- El DNS se toca a mano en IONOS: lo hace Luis, un paso cada vez (regla VI).

**Escala y alcance**: 112 juegos; 107 se mueven. En las cuatro semanas hasta el 09/10, 84 personas los
jugaron, y 27 pasaron una hora o más en alguno.

## Comprobación de la constitución

*Antes de investigar, y otra vez con el diseño hecho.*

| Regla | Cómo se cumple | Antes | Después |
|---|---|---|---|
| I. Idioma | Todo en español: `juegos-aparte`, `mudanza`, `puente`, los mensajes `mr-actividad` y `mr-mudanza`, los textos («Pasando tus partidas guardadas…») | Sí | Sí |
| II. Discutir antes de construir | Investigado el código, el servidor y los motores; cada decisión con lo descartado. Luis aprueba el plan antes de las tareas | Sí | Sí |
| III-IV. Que funcione; pulir al final | Las pruebas rápidas en cada tarea. La revisión de los 107 juegos y lo de producción, agrupados al final | Sí | Sí |
| V. Un commit por paso | Un commit por tarea, con su prueba | Sí | Sí |
| VI. Pasos manuales de uno en uno | El registro del DNS: un paso cada vez, con el texto exacto de IONOS, comprobado con `dig` | Sí | Sí |
| VII. Sin gastos | Un subdominio del dominio que ya se tiene, Let's Encrypt y una librería libre | Sí | Sí |
| VIII. Sin subagentes | Todo en orden, sin subagentes | Sí | Sí |
| XI. Simplicidad | Lo extra (el puente y la mudanza) lo piden la spec y Luis, y se justifica abajo | Sí | Sí |
| XII. Terminado es comprobado | Cada tarea, con su prueba y `npm test` en verde | Sí | Sí |
| XIII. Nunca fallar en silencio | La mudanza, el puente y el módulo dicen lo que falla (research D16) | Sí | Sí |
| XIV. La web no molesta | La mudanza no pregunta nada: un aviso en la propia página, unos segundos, una vez | Sí | Sí |
| XV. Seguro | Todo por HTTPS. Ningún secreto nuevo | Sí | Sí |
| XVI. Privado | No entra ningún tercero nuevo. La analítica de los envoltorios es el punto 62, fuera | Sí | Sí |
| XVII. Todo reversible | Sin migraciones. Se deshace volviendo al commit anterior, y las partidas siguen también en la web | Sí | Sí |
| XVIII. Medir antes de optimizar | Los 107 juegos medidos antes y después, en el PC y en la web real | Sí | Sí |
| XIX. Documentación | VPS, ECONOMIA, ARQUITECTURA, DESARROLLO, JUEGOS, CLAUDE.md, `infra/`, la auditoría y el historial (research D15) | Sí | Sí |
| XX. La base es sagrada | Solo recuentos en modo lectura; ningún cambio de datos | Sí | Sí |
| XXI. Desplegar con el OK de Luis | DNS, certificado, nginx y código, cada uno con su OK en ese momento (research D14) | Sí | Sí |
| XXII. Pruebas sin tocar lo real | Cada cambio del servidor con su prueba; `npm test` y la prueba de humo con Node 24 y 22, anotados en la spec | Sí | Sí |
| XXIII. El servidor decide | El XP y las monedas siguen en el servidor; el puente solo dice «hay alguien», como hoy los eventos | Sí | Sí |
| XXIV. Lo que no se rompe | La dirección de los juegos sirve solo envoltorios, con la misma resolución de rutas; `infra/` se pone al día; ninguna IP nueva | Sí | Sí |
| XXV. Los datos no salen | Solo recuentos, sin nombres; ninguna IP en documentos ni commits | Sí | Sí |
| XXVI. Sin terceros que desaparezcan | La dirección nueva es nuestra. `fake-indexeddb` solo corre en las pruebas | Sí | Sí |
| XXVIII. Móvil y PC | La página de jugar, mirada en los dos (quickstart 5) | Sí | Sí |
| XXIX. El arte no se publica | La dirección de los juegos no sirve nada del arte | Sí | Sí |
| XXX. Sin emojis | Ni en el código ni en los documentos nuevos | Sí | Sí |
| XXXI. Las listas vivas no se borran | El punto 1 se marca cerrado, con su fecha y su nota | Sí | Sí |

Sin excepciones que justificar.

## Estructura

### Documentación de esta spec

```text
specs/008-aislar-juegos/
├── spec.md               # qué y por qué (aclarada el 09/10)
├── plan.md               # este archivo
├── research.md           # lo que hay hoy y las decisiones, D1 a D16
├── data-model.md         # las piezas: juego, dirección, aviso, partidas, claves del sitio, mudanza
├── quickstart.md         # cómo se comprueba, en el PC y en la web real
├── contracts/
│   ├── rutas-http.md     # qué responde cada dirección
│   ├── mensajes.md       # el puente y la mudanza
│   └── marco-del-juego.md
├── checklists/requirements.md
└── tasks.md              # lo hace /speckit-tasks, con el OK de Luis
```

### El repositorio

```text
api/_juegos-aparte.js              NUEVO   la dirección de los juegos: qué sirve, la redirección, el puente
server.js                          CAMBIA  lo usa, por el nombre de la petición
scripts/servidor-local.js          CAMBIA  escucha también en el puerto siguiente, que hace de dirección de los juegos
scripts/smoke-local.js             CAMBIA  dos puertos, y pide un juego a las dos direcciones
scripts/revision-juegos.js         NUEVO   mirar los juegos uno a uno en Edge, con capturas y la sonda

js/motor/juegos-aparte.js          NUEVO   la dirección de los juegos, el marco, la mudanza y las claves del sitio
js/motor/actividad-jugador.js      CAMBIA  acepta el aviso del puente; ese marco cuenta como de la web
js/jugar.js                        CAMBIA  el marco de cada tipo de juego, y la mudanza antes de abrirlo
jugar.html                         CAMBIA  carga juegos-aparte.js; versiones nuevas de jugar.js y actividad-jugador.js
html/juegos/_puente.js             NUEVO   el puente, que el servidor mete en cada envoltorio
html/juegos/_mudanza.html          NUEVO   la mudanza, en la dirección de los juegos
html/juegos/_mudanza.js            NUEVO
html/juegos/<algún envoltorio>     QUIZÁ   si alguno se rompe al estar aparte (research D12)

tests/juegos-aparte-servidor.test.js    NUEVA
tests/juegos-aparte-navegador.test.js   NUEVA   la dirección, el marco y las claves del sitio
tests/puente-actividad.test.js          NUEVA
tests/mudanza-partidas.test.js          NUEVA   con fake-indexeddb
tests/actividad-jugador.test.js         CAMBIA
package.json, package-lock.json         CAMBIAN fake-indexeddb, solo para las pruebas

infra/nginx/macroreborn.conf       CAMBIA  el bloque de juegos.macroreborn.com y el nombre en el puerto 80
infra/LEEME.md                     CAMBIA
docs/referencia/VPS.md, ECONOMIA.md, ARQUITECTURA.md, CUENTAS.md; docs/guias/DESARROLLO.md, JUEGOS.md; CLAUDE.md
docs/historia/CONTRASENAS-EN-CLARO.md, HISTORIAL.md; docs/listas/AUDITORIA.md; specs/006-.../spec.md
```

**Decisión de estructura**: se sigue lo que ya hay. Lo que necesitan los dos servidores va en un módulo
de `api/` (como `api/_prendas-ruta.js`); lo del navegador, en `js/motor/`; y lo que solo vive en la
dirección de los juegos, junto a los envoltorios, en `html/juegos/`, con `_` delante para que no se
confunda con un juego.

## Cómo se hará

En este orden, que `/speckit-tasks` convertirá en tareas, cada una con su commit:

1. **El DNS**, al principio, para que tenga tiempo de propagarse: Luis añade el registro en IONOS, con
   la guía paso a paso, y se comprueba con `dig`. No cambia nada visible.
2. **La herramienta de revisión** (`scripts/revision-juegos.js`), y con ella **el «antes»**, en el PC,
   con el código sin cambiar (quickstart 2).
3. **El servidor**: `api/_juegos-aparte.js` con su prueba; `server.js`; el servidor local con su segundo
   puerto; la prueba de humo.
4. **El marco y el puente**: `js/motor/juegos-aparte.js` (la dirección y el marco), `js/jugar.js`,
   `html/juegos/_puente.js` y `js/motor/actividad-jugador.js`, con sus pruebas.
5. **La mudanza**: las claves del sitio y su prueba de recorrido; `fake-indexeddb`;
   `html/juegos/_mudanza.html` y `.js`; la parte de la página; el aviso de carga; las pruebas.
6. **`jugar.html`**: el script nuevo y las versiones.
7. **Comprobar en el PC**: las pruebas con Node 24 y 22; las dos direcciones; la revisión de «después»
   y la comparación; la sonda; el XP; la mudanza con partidas de prueba; PC y móvil (quickstart 1 a 7).
   Si algún juego se rompe, se arregla su envoltorio aquí.
8. **nginx en `infra/`**: el bloque nuevo, preparado y revisado en la rama.
9. **La documentación**, lo de Neon, la auditoría con el punto 1 cerrado, el historial, y la unión a
   `main`, con las pruebas en verde con las dos versiones.
10. **Desplegar**, con el OK de Luis en cada paso: el «antes» de la web real, el certificado, nginx, el
    código y las comprobaciones (quickstart 8). Lo que falte, como el récord de Macro Snake con la cuenta
    de Luis, queda «Pendiente de probar».

## Riesgos

| Riesgo | Qué se hace |
|---|---|
| Un juego no funciona al estar aparte (lee la dirección de la página, llama a la página, necesita un permiso) | La revisión de los 107, antes y después, lo encuentra. Se arregla su envoltorio en esta spec. `grindcraft.html` es el primer sospechoso |
| La mudanza pierde o estropea partidas | No pisa nada; lo de la web no se borra; la marca solo se pone con la confirmación; si falla, se reintenta. Probada con `fake-indexeddb` y en Edge con partidas de prueba |
| Una clave del sitio se cuela en la mudanza | La lista del sitio, la comprobación aparte de la sesión en los dos lados, y la prueba que recorre el código del sitio |
| Alguien abre un juego por la ruta vieja antes de mudar, y empieza con las partidas vacías | Las versiones `?v=` nuevas. Y como no se pisa nada, la mudanza de después solo añade lo que falte |
| El certificado no se amplía | Primero `--dry-run`. El certificado de hoy sigue valiendo mientras tanto, y nada usa todavía la dirección nueva |
| El DNS tarda en propagarse | Se hace al principio, y se comprueba antes de desplegar |
| La mudanza tarda en un móvil con muchas partidas | Sin las cachés, con los topes de 64 y 128 MB, y con 60 segundos como máximo; después abre el juego igual |
| Fingir actividad desde un juego | Igual que hoy: el servidor cuenta un minuto por minuto y para las monedas a las cuatro horas |

## Seguimiento de la complejidad

No hay infracciones de la constitución que justificar. Lo que añade complejidad, y por qué se queda
(regla XI):

| Pieza | Por qué hace falta | La alternativa más simple, y por qué no |
|---|---|---|
| El puente de actividad | Sin él, en la dirección nueva no se ve si alguien juega, y el XP cambiaría de regla (RF-005) | Dejar la regla de los diez minutos para todos: cuenta minutos sin nadie delante |
| La mudanza de partidas | Luis eligió que nadie pierda sus partidas (aclaración del 09/10) | Avisar y que se pierdan: lo descartó Luis |
| `fake-indexeddb`, solo en las pruebas | Probar la mudanza de IndexedDB en `npm test` | Un IndexedDB de mentira escrito aquí: más código propio y menos fiel |
| `scripts/revision-juegos.js` | Medir 107 juegos antes y después (CE-004), y que se pueda repetir con cada juego nuevo | Mirarlos a mano: horas, sin informe que comparar |
