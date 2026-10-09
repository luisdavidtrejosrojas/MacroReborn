# Especificación: apagar la integración continua de GitHub (spec corta)

**Rama**: `007-apagar-ci`
**Creada**: 2026-10-09
**Estado**: Aprobada por Luis el 09/10/2026
**Tipo**: spec corta (regla XIX): especificación, plan y tareas en esta página, aprobados una vez.
**Pedido**: Luis, 09/10/2026: «Desactivemos GitHub Actions por ahora, ¿sí? No queremos gastar dinero en
esto, la verdad», y el «Sí, ahora» para preparar esta spec.

## Contexto

- La integración continua (`.github/workflows/ci.yml`) corre `npm test` y la prueba de humo en GitHub
  Actions en cada subida, con Node 24 y 22. El repositorio es privado y de la cuenta valenmgg: Actions da
  2.000 minutos gratis al mes, y lo que pasa de ahí se cobra a esa cuenta.
- Octubre ya gastó 2.459 minutos, 1.950 de ellos el 05/10. Cada subida gasta unos 19: las pruebas tardan
  8,5 minutos en las máquinas de GitHub, y uno en el PC.
- Desde la tarde del 08/10, GitHub no arranca los trabajos: «The job was not started because recent
  account payments have failed or your spending limit needs to be increased». Hasta hoy son 38
  ejecuciones, todas en fallo sin haber corrido ni un paso.
- Mientras tanto, las specs 003, 004 y 005 se unieron con las mismas pruebas en el PC, con los Node
  oficiales.
- La regla XXII pide la CI en verde para unir a `main`. Con la CI apagada no se podría unir nada sin
  cambiar esa regla.
- Apagar Actions entera, desde la configuración del repositorio, solo lo puede hacer su dueño. La cuenta
  de Luis tiene permiso de escritura, y con eso puede apagar el flujo. Como el repositorio solo tiene uno,
  «CI», es lo mismo.

## Aclaraciones

Ninguna: Luis decidió apagarla. El cómo, y qué pide la regla XXII mientras tanto, van en el plan para
aprobarlos con la spec.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - GitHub deja de correr la CI (Prioridad: P1)

Ninguna subida gasta minutos de Actions, la haga quien la haga y vaya a la rama que vaya.

**Por qué esta prioridad**: es lo que pidió Luis, para no gastar dinero.

**Prueba independiente**: subir un commit y mirar que no aparece ninguna ejecución.

**Escenarios de aceptación**:

1. **Dado** el flujo apagado, **cuando** alguien sube a cualquier rama, **entonces** no se crea ninguna
   ejecución.
2. **Dado** que un día se quiera volver a tener, **cuando** se enciende con una orden, **entonces** corre
   como antes, porque el archivo sigue ahí.

---

### Historia 2 - No se une nada sin probar (Prioridad: P1)

Antes de unir a `main`, las pruebas y la prueba de humo pasan en el PC con Node 24 y 22, y la spec lo
anota.

**Por qué esta prioridad**: lo que vigilaba la CI no puede quedarse sin vigilar.

**Prueba independiente**: leer la regla XXII y cómo se prueba, y unir esta misma spec así.

**Escenarios de aceptación**:

1. **Dada** una rama lista, **cuando** se va a unir, **entonces** la regla XXII pide las pruebas en verde
   con las dos versiones, en el PC, y anotadas en su spec.
2. **Dado** el PC de Luis, **cuando** hay que probar con la 22 o la 24, **entonces** las tiene a mano, sin
   bajarlas otra vez.

---

### Historia 3 - La documentación dice que está apagada (Prioridad: P2)

CLAUDE.md, SUMARSE, ARQUITECTURA y el propio `ci.yml` dicen que está apagada, desde cuándo, por qué y
cómo se enciende. La spec 003 anota que sus dos criterios de GitHub ya no se confirmarán allí.

**Por qué esta prioridad**: para que nadie espere una CI que no corre, ni la vuelva a encender sin
saberlo.

**Prueba independiente**: buscar en la documentación viva que la CI «corre en cada subida».

**Escenarios de aceptación**:

1. **Dada** la documentación, **cuando** se lee, **entonces** dice que está apagada y cómo se prueba
   mientras tanto.

---

### Casos límite

- Lo que otros suban directo a `main`, como el 06/10, ya no lo prueba GitHub: lo prueba quien lo funde,
  como dice [CAMBIOS-DE-OTROS-DEVS](../../docs/guias/CAMBIOS-DE-OTROS-DEVS.md).
- Si alguien añade otro flujo de Actions, ese sí correría: apagar este no apaga los demás.
- Cuando el cupo vuelva el 01/11, o si valenmgg arregla el pago, el flujo sigue apagado: no se enciende
  solo.
- Las ramas viejas tienen el archivo con `on: push`. Apagar el flujo en GitHub vale también para ellas;
  borrar o cambiar el archivo, no.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: El flujo «CI» DEBE quedar apagado en GitHub, para todas las ramas.
- **RF-002**: `.github/workflows/ci.yml` DEBE quedarse, con una nota arriba: desde cuándo está apagado,
  por qué y cómo se enciende.
- **RF-003**: Para unir a `main`, la regla XXII DEBE pedir `npm test` y la prueba de humo en verde con la
  versión de Node del servidor y la mínima que se admite. Las corre la CI si está encendida, y si no, el
  PC, y la spec lo anota. El paso 9 del flujo de trabajo de la constitución, igual.
- **RF-004**: Las dos versiones de Node DEBEN quedar a mano en el PC de Luis, oficiales y comprobadas.
- **RF-005**: La documentación DEBE decir que la CI está apagada, desde cuándo, por qué y cómo se prueba
  mientras tanto.
- **RF-006**: Al unirse a `main`, el historial DEBE tener su entrada.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Una subida hecha después de apagarla crea 0 ejecuciones. Hoy crea una por subida.
- **CE-002**: La constitución pasa a la v1.0.3, con la regla XXII y el paso 9 nuevos, y su plantilla
  igual.
- **CE-003**: `npm test` y la prueba de humo pasan en verde en el PC con Node 24 y 22, para unir esta
  misma spec.
- **CE-004**: Nada en la documentación viva dice que la CI corre en cada subida. El historial y las specs
  ya unidas cuentan lo que pasó, y se quedan como están.

## Supuestos

- Luis se lo cuenta a valenmgg y a SamuMacro, para que nadie la vuelva a encender sin hablarlo.
- Lo que ya se gastó en octubre es cosa de la facturación de la cuenta valenmgg.

## Fuera de alcance

- La facturación de valenmgg: lo ya gastado y el método de pago.
- Volver a encenderla, o encenderla solo a mano o solo para `main`, para que quepa en el cupo gratis. Si
  algún día se quiere, va en otra spec.
- Hacer público el repositorio, que en GitHub no paga Actions: es una decisión del equipo.

## Plan

**Qué cambia**:

- **En GitHub**, el estado del flujo.
- **En el repositorio**: el comentario de `ci.yml`, la constitución y su plantilla, CLAUDE.md, SUMARSE,
  ARQUITECTURA, una nota en la spec 003 y el historial.
- **En el PC de Luis**: `D:\node-oficial\`.

No cambia nada del sitio ni del servidor.

**Decisiones**:

- **D1. Se apaga el flujo con `gh workflow disable`**, con la cuenta de Luis. Vale para todas las ramas,
  y se enciende con `gh workflow enable`. Descartado: borrar `ci.yml` o quitarle `on: push`, que no para
  las ramas viejas que aún lo tienen; y apagar Actions entera en la configuración, que solo puede hacer el
  dueño y no hace falta con un solo flujo.
- **D2. `ci.yml` se queda tal cual, con la nota arriba.**
- **D3. La regla XXII, en la v1.0.3 (PATCH)**: pide lo mismo, las pruebas y la prueba de humo en verde
  con las dos versiones, y solo cambia dónde se corren. El texto nuevo:
  - Su tercer punto: «Para unir una rama a `main`, `npm test` y la prueba HTTP de humo DEBEN estar en
    verde con la versión de Node del servidor y con la mínima que se admite. Las corre la integración
    continua (`.github/workflows/ci.yml`) cuando está encendida; mientras esté apagada, se corren en el
    PC con esas dos versiones, y la especificación lo anota en su comprobación. Si ya estaban en rojo por
    otra causa, se dice y esa causa tiene su propia especificación.»
  - El paso 9: «Unir la rama a `main` cuando todo está verificado y las pruebas están en verde (regla
    XXII).»
- **D4. Las dos versiones, en el PC.** Pasan a `D:\node-oficial\`, fuera del proyecto, las copias de la
  24.21.0 y la 22.23.3 que se bajaron de nodejs.org el 08/10, comprobadas con su `SHASUMS256.txt`. Se
  prueba con su `node.exe`: `--test` es `npm test`, y `scripts/smoke-local.js`, la prueba de humo.
  SUMARSE lo cuenta para cualquiera, con los zip oficiales, y CLAUDE.md dice dónde están en el PC de Luis.
- **D5. La documentación viva se pone al día**: CLAUDE.md, SUMARSE, ARQUITECTURA y la nota de `ci.yml`.
  En la spec 003, una nota: sus dos criterios de GitHub no se confirmarán allí. El historial y las specs
  ya unidas se quedan como están.

**Cómo se comprueba**:

- Subir un commit después de apagarla, y mirar con `gh run list` que no aparece ninguna ejecución.
- `npm test` y la prueba de humo con las dos versiones de `D:\node-oficial\`, para unir esta misma spec.
- Y la prueba de la documentación.

## Tareas

Un commit por tarea, subido a `origin` al cerrarla.

- [X] T001 Apagar el flujo «CI» en GitHub con la cuenta de Luis (D1) y poner la nota de `ci.yml` (D2).
  Su subida sirve de prueba de que ya no corre (RF-001, RF-002, CE-001).
- [X] T002 Los Node oficiales 24 y 22, a `D:\node-oficial\`, comprobados otra vez con su `SHASUMS256.txt`
  (RF-004, D4).
- [X] T003 La constitución v1.0.3: la regla XXII y el paso 9, también en su plantilla (RF-003, CE-002).
- [ ] T004 La documentación: CLAUDE.md, SUMARSE, ARQUITECTURA y la nota de la spec 003 (RF-005, CE-004).
- [ ] T005 La entrada del historial y la unión a `main`, con `npm test` y la prueba de humo en verde en el
  PC con Node 24 y 22 (RF-006, CE-003).
