# Especificación: que la integración continua vuelva a vigilar (spec corta)

**Rama**: `003-integracion-continua`
**Creada**: 2026-10-08
**Estado**: Aprobada por Luis el 08/10/2026
**Tipo**: spec corta (regla XIX): especificación, plan y tareas en esta página, aprobados una vez.
**Pedido**: Luis, 08/10/2026, al elegir cómo seguir: «la spec 003 ahora, y después la 004 y la 005».

## Contexto

La integración continua (`.github/workflows/ci.yml`) corre en cada subida `npm test` con Node 20 y 22,
y la prueba de humo (`scripts/smoke-local.js`) solo con Node 22. La prueba de humo es la única que
recorre el sitio por HTTP de punta a punta: entrar, el pulso de un minuto de juego con sus monedas y
los avisos en vivo.

**Está en rojo desde el 25/09/2026, no desde el 04/10.** Medido el 08/10 en la historia de GitHub: la
última ejecución en verde en `main` fue `a8a3805`, y desde la subida que trajo `b7afa63` («Pulso: un
minuto por minuto, lo cuenta el servidor», el punto 18 de la auditoría) las 24 han fallado en la prueba
de humo. CLAUDE.md, SUMARSE y DESARROLLO dicen que falla por la economía del 04/10: esa solo movió el
fallo una comprobación antes.

**Lo que falla son dos expectativas viejas, no el sitio.** Medido el 08/10 ejecutando una copia de la
prueba en memoria, sin esas dos comprobaciones: todo lo demás pasa, los avisos en vivo incluidos.

| Comprobación | Qué espera la prueba | Qué hace el servidor hoy, y desde cuándo |
|---|---|---|
| El primer pulso | Entre 10 y 30 monedas | Paga la racha del día (5 por cada día seguido) y el premio del nivel si se sube; el de jugar llega en el minuto 10, el 20, el 30… del día (economía del 04/10). En la prueba, 5 |
| Un segundo pulso enseguida | Éxito, sin monedas, con la razón «aún no pasaron 10 minutos» | No lo cuenta: un minuto solo cuenta si pasaron 55 segundos desde el anterior (25/09). Contesta sin éxito: «Este minuto ya se contó» |

**Lo que tapa el rojo:**

- 15 de las 23 comprobaciones de la prueba de humo no se ejecutan, entre ellas las de los avisos en
  vivo.
- La matriz cancela el trabajo de una versión en cuanto el de la otra falla (`fail-fast`, que viene
  encendido). `npm test` con Node 20, la versión del servidor, terminó por última vez el 06/10
  (`a254f21`): lo unido y desplegado después solo se ha probado con Node 22 en la CI y con Node 24 en el
  PC de Luis.
- Con todo en rojo, un fallo nuevo no se distingue del de siempre. Las specs 001 y 002 se unieron por
  la excepción de la regla XXII.

## Aclaraciones

Ninguna. Lo que había que decidir con Luis era qué hacer si detrás salía un fallo de verdad, y no
salió.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - La CI en verde quiere decir que nada se rompió (Prioridad: P1)

Quien sube un cambio ve la integración continua en verde si nada se rompió, y en rojo solo cuando algo
se rompe de verdad.

**Por qué esta prioridad**: con el rojo de siempre, un fallo nuevo pasa sin que nadie lo vea.

**Prueba independiente**: subir la rama y mirar la CI.

**Escenarios de aceptación**:

1. **Dado** `main` como hoy, **cuando** se sube la rama con esta spec, **entonces** la CI sale en verde
   con las dos versiones de Node.
2. **Dado** un cambio que rompe el pulso (por ejemplo, que vuelva a contar dos pulsos seguidos),
   **cuando** corre la prueba de humo, **entonces** falla y dice qué comprobación.

---

### Historia 2 - La prueba de humo comprueba las reglas de hoy (Prioridad: P1)

La prueba de humo recorre otra vez la cadena entera con las reglas actuales: el primer pulso paga lo
que dice la economía, un segundo pulso enseguida no se cuenta ni da monedas, y los avisos en vivo
llegan.

**Por qué esta prioridad**: es la única prueba que junta las piezas, y lleva dos semanas sin llegar al
final.

**Prueba independiente**: `npm run test:smoke` en local.

**Escenarios de aceptación**:

1. **Dado** un servidor local recién arrancado, **cuando** `demo` manda su primer pulso, **entonces**
   se cuenta, y le paga la racha de su primer día, nada por jugar (es su primer minuto) y el premio del
   nivel solo si lo sube; el saldo sube eso, exactamente.
2. **Dado** ese primer pulso, **cuando** manda otro enseguida, **entonces** no se cuenta y el saldo no
   cambia.
3. **Dado** lo anterior, **cuando** se abre la conexión de avisos y llega un latido, **entonces** el
   aviso llega por ella, como hasta ahora.

---

### Historia 3 - Las dos versiones de Node se prueban hasta el final (Prioridad: P1)

Un fallo con una versión de Node no cancela las pruebas con la otra, y la versión del servidor se
prueba entera, prueba de humo incluida.

**Por qué esta prioridad**: el servidor usa Node 20, y es la que menos se prueba.

**Prueba independiente**: leer los dos trabajos de la CI de la rama.

**Escenarios de aceptación**:

1. **Dado** un fallo solo con una versión, **cuando** corre la CI, **entonces** el trabajo de la otra
   termina igual y dice su resultado.
2. **Dada** cualquier subida, **cuando** corre la CI, **entonces** la prueba de humo corre con Node 20
   y con Node 22.

---

### Casos límite

- La racha depende de los días seguidos jugando. En una base recién creada, `demo` no ha jugado nunca:
  es su primer día. La prueba compara con la regla, no con un número, así que también lo diría si el
  servidor local sembrara actividad para `demo`.
- Si el pulso le sube de nivel, el premio del nivel entra en la suma, calculado con la misma regla.
  Hoy no le sube: empieza en el nivel 3 con 120 puntos de experiencia, y el pulso suma 10.
- Si la economía vuelve a cambiar, la prueba usa la regla del módulo de monedas, no una copia de sus
  números: solo falla si el servidor deja de cumplir su propia regla.
- Los dos pulsos van seguidos, a menos de un segundo. Para que el segundo se contara, la máquina de la
  CI tendría que tardar 55 segundos entre uno y otro.
- Lo que hace un minuto contado sin premio (del 2 al 9) no lo mira la prueba de humo: obligaría a
  esperar 55 segundos, y ya lo sujeta `tests/monedas.test.js`.
- Si la CI va lenta, la prueba ya espera hasta 30 segundos a que arranque el servidor.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: La prueba de humo DEBE comprobar que el primer pulso se cuenta y paga lo que dice la regla
  de las monedas de hoy: la racha del día, el premio de jugar si toca y el del nivel si se sube.
- **RF-002**: DEBE comprobar esa regla con los números del módulo de monedas, sin copiarlos.
- **RF-003**: DEBE comprobar que el saldo sube exactamente lo pagado.
- **RF-004**: DEBE comprobar que un segundo pulso enseguida no se cuenta y no cambia el saldo.
- **RF-005**: Las comprobaciones de los avisos en vivo DEBEN seguir como están.
- **RF-006**: Un fallo con una versión de Node NO DEBE cancelar las pruebas con la otra.
- **RF-007**: La prueba de humo DEBE correr con cada versión de Node que prueba la CI.
- **RF-008**: Lo que hace el servidor y lo que sirve el sitio NO cambian: esta spec solo toca la prueba
  de humo, la CI y la documentación.
- **RF-009**: La documentación DEBE dejar de decir que la prueba de humo falla, y la que cuenta por qué
  fallaba DEBE decir la causa de verdad (CLAUDE.md, SUMARSE, DESARROLLO y ARQUITECTURA).
- **RF-010**: Al unirse a `main`, el historial DEBE tener su entrada, con la fecha de la unión y el
  enlace a esta especificación.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: La CI de la rama sale en verde con Node 20 y con Node 22, prueba de humo incluida (en
  `main`, 24 de 24 en rojo desde el 25/09).
- **CE-002**: La prueba de humo ejecuta todas sus comprobaciones: 0 sin ejecutar (hoy, 15 de 23).
- **CE-003**: Con la regla del minuto apagada a mano en local, sin commit, la prueba de humo falla y
  señala el segundo pulso.
- **CE-004**: Los dos trabajos de la CI terminan todos sus pasos: ninguno sale cancelado (hoy, el de
  Node 20 se cancela en 4 de las 5 últimas ejecuciones).
- **CE-005**: `npm test` en verde.
- **CE-006**: La rama no cambia nada de `api/`, `js/`, `css/` ni de las páginas.

## Supuestos

- La CI sigue en GitHub Actions con Node 20 y 22 hasta la spec 004, que sube el servidor a Node 24 y
  cambia la matriz.
- La prueba de humo con Node 20 añade a la CI unos segundos, lo que tarda en arrancar el servidor local.
- No hace falta desplegar: no cambia nada de lo que sirve el sitio, y la copia del servidor se pondrá al
  día con el próximo despliegue.

## Fuera de alcance

- Subir el servidor a Node 24: spec 004.
- Cambiar las reglas del pulso o de las monedas.
- Lo demás que falta alrededor de las pruebas y el despliegue: la comprobación de salud y la vuelta
  atrás del despliegue (punto 72 de la auditoría) y las pruebas de autorización, ranking y moderación
  (punto 74).

## Plan

**Qué cambia**: `scripts/smoke-local.js` (las comprobaciones de los dos pulsos y el saldo),
`.github/workflows/ci.yml` (la matriz) y la documentación.

**Decisiones**:

- **D1. El primer pulso se comprueba con la regla, no con un número.** La prueba pide el saldo antes
  (`/api/content?action=mis-monedas`, con la sesión de `demo`) y comprueba el desglose con las
  funciones de `api/_monedas.js`: nada por jugar en el primer minuto (`premioDelMinuto(1)`), la racha
  de un día (`monedasPorRacha(1)`) y el nivel solo si se subió (`monedasPorNivel`). Después, que el
  monto es la suma y que el saldo nuevo es el de antes más el monto. Descartado: escribir «5», que se
  rompería con el próximo cambio de la economía sin que el sitio fallara.
- **D2. El segundo pulso, sin contar y sin monedas.** Se comprueba `success: false` y `contado: false`,
  y que el saldo, pedido otra vez, no cambió. Descartado: comprobar el texto del error, que es para
  personas y puede cambiar sin que cambie la regla.
- **D3. `fail-fast: false` en la matriz**, para que cada versión termine y diga su resultado.
- **D4. La prueba de humo con cada versión de la matriz**, sin la condición de Node 22. Descartado:
  dejarla solo con Node 22, que no es la del servidor.
- **D5. Si la primera CI de la rama destapa algo con Node 20,** se arregla aquí si es de las pruebas, y
  se cuenta a Luis si es del sitio.

**Cómo se comprueba**: `npm test`; `npm run test:smoke` en local; la misma prueba con la regla del
minuto apagada a mano (`SEGUNDOS_ENTRE_MINUTOS` a 0 en `api/users.js`, sin commit y deshecho al
terminar), que debe fallar en el segundo pulso; y la CI de la rama, en verde con las dos versiones y sin
trabajos cancelados.

**Documentación**: CLAUDE.md, SUMARSE (cómo se prueba), DESARROLLO (la prueba de humo), ARQUITECTURA
(la línea de la integración continua) y el historial, al unir.

## Tareas

Un commit por tarea, subido a `origin` al cerrarla.

- [ ] T001 La prueba de humo con las reglas de hoy: el primer pulso y el saldo, y el segundo pulso sin
  contar (RF-001 a RF-005, D1, D2).
- [ ] T002 La CI: `fail-fast` apagado y la prueba de humo con Node 20 y 22 (RF-006, RF-007, D3, D4).
- [ ] T003 La documentación: CLAUDE.md, SUMARSE, DESARROLLO y ARQUITECTURA (RF-009).
- [ ] T004 Comprobar: `npm test`, la prueba de humo en local, la regla del minuto apagada a mano y la
  CI de la rama (CE-001 a CE-006).
- [ ] T005 La entrada del historial y la unión a `main`, con la CI en verde en `main` (RF-010).
