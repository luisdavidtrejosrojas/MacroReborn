---

description: "Tareas para reordenar la documentación"
---

# Tareas: reordenar la documentación

**Entrada**: los documentos de diseño de `specs/001-reordenar-documentacion/`

**Requisitos previos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md) y
[mapa-de-contenido.md](mapa-de-contenido.md)

**Pruebas**: la spec pide una prueba permanente (RF-016). Se escribe en la fase 2, antes de mover nada,
y se activa por partes (T003, T023 y T056). No hay más pruebas automáticas que escribir: lo demás se
valida con [quickstart.md](quickstart.md), todo junto al final (regla IV).

**Organización**: por las historias de uso de la spec. Como todas pasan por los mismos documentos, no
son del todo independientes: la fase 2 (la prueba y las mudanzas) bloquea todas, y algunas tareas
esperan a otras historias de uso; cada una lo dice.

## Formato: `[ID] [Historia de uso] Descripción`

- **[US1] a [US5]**: las historias de uso de la spec. Las fases 1, 2 y 8 no llevan. «Historia», a
  secas, es la carpeta `docs/historia/`.
- **Sin [P]**: casi todas las tareas tocan el índice del `README.md`, el mapa de contenido o la lista de
  revisión, y la regla VIII pone las tareas en fila.
- **Una tarea, un commit, un push** (regla XII). Lo que se hace fuera del repositorio (la memoria de
  Claude, los scripts de un solo uso) deja constancia en la lista de revisión o va con la tarea vecina.

## Rutas

- Documentación: `docs/referencia/`, `docs/guias/`, `docs/listas/` y `docs/historia/`.
- **El mapa**: `specs/001-reordenar-documentacion/mapa-de-contenido.md`.
- **La lista de revisión**: `specs/001-reordenar-documentacion/checklists/revision.md`.
- **Los contratos**: `specs/001-reordenar-documentacion/contracts/`.
- **La carpeta temporal**: la de la sesión de Claude (scratchpad), fuera del repositorio. Ahí van los
  scripts de un solo uso.

---

## Fase 1: Preparación

**Propósito**: partir de un estado conocido, con las herramientas de un solo uso a mano.

- [X] T001 Comprobar el punto de partida y preparar las herramientas. La rama `001-reordenar-documentacion` está limpia y al día con `origin`; `npm test` en verde; `npm run test:smoke` falla solo en la comprobación de monedas (la causa conocida, la de la spec 002, que también pone en rojo `.github/workflows/ci.yml`). Si falla algo más, parar y avisar a Luis. En la carpeta temporal, preparar los scripts de un solo uso: `sustituir-rutas.js` (cambia una ruta de documento por otra en todos los archivos de texto que sigue git, salvo `specs/`, respetando el final de línea de cada archivo), `sensibles.js` (IP y correos, siempre tapados), `emojis.js`, `enlaces.js` y `semanas.js` (semanas con commits frente a las secciones de `docs/historia/HISTORIAL.md`). El punto de partida (pruebas, archivos de prueba, cuánto tarda `npm test` y la prueba de humo) se anota en la lista de revisión, y eso va en el commit.

---

## Fase 2: Base (bloquea todo lo demás)

**Propósito**: la prueba que vigila las mudanzas, y cada documento en su carpeta con todas sus
menciones al día.

**Importante**: ninguna historia de uso empieza hasta que esta fase acabe.

- [X] T002 Corregir las seis citas a rutas que no existen que encontró el ensayo (research D5): `js/tienda.js` y `css/tienda.css` en `docs/TIENDA.md` (buscar dónde vive la tienda de verdad y citar eso); `api/_pusher.js` en `docs/DESARROLLO.md` y en `docs/SEGURIDAD.md` (como «el antiguo `_pusher.js`»); `tests/catalogo-en-core.test.js` en `docs/DESARROLLO.md` (con su nombre de hoy, si lo tiene; si no, sin carpeta); y `js/mock-backend.js` en `docs/CAMBIOS-DE-OTROS-DEVS.md` (sin carpeta).
- [X] T003 Crear `tests/documentacion.test.js` con las comprobaciones 1 a 4 de `specs/001-reordenar-documentacion/contracts/prueba-documentacion.md`: enlaces relativos con su ancla, menciones a `docs/...md`, rutas citadas y comandos `npm`. Con el estilo de las demás pruebas (CommonJS, `node:test`, `node:assert`, cabecera de comentario) y mensajes en español que dicen archivo, línea y qué corregir. Antes del commit, comprobar que falla con un enlace roto a propósito (y deshacerlo), que `node --test tests/documentacion.test.js` tarda menos de un segundo y que `npm test` queda en verde.
- [X] T004 Pedir a Luis el OK a la enmienda v1.0.1 de `.specify/memory/constitution.md` (research D12): las rutas de las reglas XIII, XVII, XXI, XXVII, XXIX y XXXI cambian en el commit de cada mudanza, y la enmienda se cierra en T072. Su OK se apunta, con su fecha, en `specs/001-reordenar-documentacion/research.md`, D12, y eso va en el commit. Sin su OK no empieza T005.

### Las mudanzas

**Cómo es cada una**:

1. `git mv` del documento a su carpeta.
2. `sustituir-rutas.js` cambia la ruta vieja por la nueva en todo lo que sigue git salvo `specs/`: el
   código, las pruebas, las migraciones, `infra/`, el `.gitignore`, el `README.md`, el `CLAUDE.md`, los
   demás documentos y, si lo cita, la constitución con su plantilla
   `.specify/templates/overrides/constitution-template.md`.
3. Donde una mención citaba una sección por número («§8», «sección 14», «AVATARES-SERVIDOR.md 4»), pasa
   a su ancla (research D3).
4. El contenido del documento movido no se toca, salvo sus rutas, para que git siga viendo la mudanza.
5. `node --test tests/documentacion.test.js` y `npm test`, en verde.
6. Commit `Docs: <NOMBRE> pasa a docs/<carpeta>/` y push.

- [X] T005 Mover `docs/AUDITORIA.md` a `docs/listas/AUDITORIA.md`; la constitución lo cita en las reglas XIII y XXXI.
- [X] T006 Mover `docs/SUGERENCIAS.md` a `docs/listas/SUGERENCIAS.md`; la constitución lo cita en la regla XXXI.
- [X] T007 Mover `docs/DESARROLLO.md` a `docs/guias/DESARROLLO.md`; las menciones «§8» y «§9» (el código, el `README.md` y el `CLAUDE.md`) pasan a `#8-probar-contra-los-datos-de-verdad` y `#9-los-avisos-en-vivo`.
- [X] T008 Mover `docs/JUEGOS.md` a `docs/guias/JUEGOS.md`.
- [X] T009 Mover `docs/CAMBIOS-DE-OTROS-DEVS.md` a `docs/guias/CAMBIOS-DE-OTROS-DEVS.md`; la constitución lo cita en la regla XXVII.
- [X] T010 Mover `docs/RETOMAR.md` a `docs/guias/RETOMAR.md`.
- [X] T011 Mover `docs/ARTE.md` a `docs/referencia/ARTE.md`; la constitución lo cita en la regla XXIX.
- [X] T012 Mover y renombrar `docs/AVATARES-SERVIDOR.md` a `docs/referencia/AVATARES.md` (research D2). Tiene 61 menciones: las que citan una sección por número pasan a su ancla, y las que citan una fase («fase 5 de ...») se quedan apuntando al documento hasta T029.
- [X] T013 Mover y renombrar `docs/SEGURIDAD.md` a `docs/referencia/CUENTAS.md` (research D2); la mención «§5» pasa a su ancla.
- [X] T014 Mover `docs/ECONOMIA.md` a `docs/referencia/ECONOMIA.md`.
- [X] T015 Mover `docs/MODERACION.md` a `docs/referencia/MODERACION.md`.
- [X] T016 Mover `docs/SEO.md` a `docs/referencia/SEO.md`.
- [X] T017 Mover `docs/TIENDA.md` a `docs/referencia/TIENDA.md`.
- [X] T018 Mover `docs/VPS.md` a `docs/referencia/VPS.md`; la constitución lo cita en las reglas XVII y XXI; las menciones «§3» y «§10» pasan a su ancla.
- [X] T019 Mover `docs/FRONTEND.md` a `docs/historia/FRONTEND.md`: es el documento de decisión del 22/09 (research D2).

### Lo que sigue a las mudanzas

- [X] T020 Añadir a `docs/guias/CAMBIOS-DE-OTROS-DEVS.md` la tabla «ruta vieja → ruta nueva» con los 15 documentos de antes (RF-011), para traducir lo que llegue de otros devs con las rutas viejas.
- [X] T021 Poner al día la memoria de Claude, que está fuera de git (research D11). En los seis archivos de `~/.claude/projects/D--Macroreborn/memory/` que citan documentos (12 menciones), las rutas nuevas. Después, copiar `memory/` sobre `memoria-claude/memory/` sin borrar nada antes, y comprobar con `grep -rn "docs/[A-Z]"` que no queda ninguna ruta vieja en ninguna de las dos. Corregir `memoria-claude/LEEME.md`: el repositorio es privado («comprobado el 05/10/2026; pasó a privado hace poco, sin fecha exacta»), cuántos archivos tiene hoy `memory/`, qué carpeta de Claude corresponde a cada ruta del proyecto, y una receta de refresco que no borra el `LEEME.md` ni el zip. Las filas de la memoria y de `memoria-claude/LEEME.md` en la lista de revisión van en el commit.

**Punto de control**: cada documento en su carpeta, ninguna mención rota y la prueba en verde.

---

## Fase 3: Historia de uso 1, encontrar rápido lo que se busca (P1). El MVP

**Objetivo**: el `README.md` es la entrada y lleva a cualquier documento en un clic.

**Prueba independiente**: desde el `README.md` en GitHub se abre cualquier documento de `docs/` en un
clic, y la comprobación 5 está en verde. Las diez preguntas típicas se validan enteras en T073, cuando
existan todos los documentos.

- [X] T022 [US1] Rehacer `README.md` como entrada, según `specs/001-reordenar-documentacion/contracts/indice.md`. Qué es MacroReborn, en dos o tres líneas. «Las reglas»: la constitución, el `CLAUDE.md` y `specs/`, con una línea cada uno (RF-013). Una sección por tipo, en el orden de RF-004 (referencia, guías, listas vivas, historia y especificaciones), con cada documento enlazado, para quién es y qué contiene (RF-001, RF-002). «Por dónde empezar» se estrena con lo que ya existe y gana un enlace con cada documento nuevo (T036, T057 y T060). «Convenciones» se cambia por el enlace a la constitución, después de comprobar que sus cuatro puntos están en ella. «Qué es el proyecto», «Stack», «Sistemas documentados» y «Cómo probar localmente» se quedan bajo el índice hasta que T058 y T061 los muden.
- [X] T023 [US1] Activar la comprobación 5 en `tests/documentacion.test.js`: cada `.md` de `docs/` está enlazado desde el `README.md`. Desde aquí, cada documento nuevo entra en el índice en su mismo commit.

**Punto de control**: la historia de uso 1 funciona con los documentos de hoy.

---

## Fase 4: Historia de uso 2, confiar en lo que dice la documentación (P1)

**Objetivo**: la referencia cuenta cómo es hoy el sistema, la historia está aparte y entera, cada tema
tiene un solo documento y nada dice algo que ya no es verdad.

**Prueba independiente**: la lista de revisión tiene una fila por documento, sin afirmaciones caducadas
pendientes; fail2ban queda contado en un solo sitio y coincide con el servidor; el despliegue solo lo
explica `docs/guias/DESPLEGAR.md`; y la comprobación 6 está en verde.

### Separar la historia (RF-010)

**Cómo es cada una**:

1. El documento de historia nace con su cabecera, según
   `specs/001-reordenar-documentacion/contracts/documento.md`: el título y las líneas
   «> **De qué trata:**», «> **Para quién:**» y «> **Revisado:** DD/MM/AAAA». La fecha del suceso va en
   el título o en la primera línea.
2. El contenido pasa entero, sin reescribirlo.
3. En la referencia queda un resumen de dos líneas, con el enlace.
4. El documento nuevo entra en el índice del `README.md` en el mismo commit.
5. Las menciones a lo que se fue se reapuntan.
6. Las filas del mapa llevan su fecha en «Hecho», y la fila del documento nuevo se anota en la lista de
   revisión. Si al leer una sección resulta que va mejor en otro sitio, se cambia en el mapa en el mismo
   commit.

- [X] T024 [US2] Crear `docs/historia/LIENZO-DEL-CATALOGO.md` con §6 de `docs/guias/DESARROLLO.md`; resumen en §3 de `docs/referencia/ARTE.md` y enlace a sus pendientes desde su §7.
- [X] T025 [US2] Crear `docs/historia/IMAGEN-NO-ENCONTRADA.md` con §7 de `docs/guias/DESARROLLO.md`; resumen en `docs/referencia/AVATARES.md`.
- [X] T026 [US2] Crear `docs/referencia/AVISOS.md` con §2.3 y §9 de `docs/guias/DESARROLLO.md`, con su cabecera y revisado al escribirlo contra `api/_avisos.js`, `api/_avisos-sse.js` y el navegador. Crear también `docs/historia/AVISOS-ROTOS.md`, con «Por qué llevaba dos semanas roto» y la sustitución del antiguo `_pusher.js`. Las menciones a `#9-los-avisos-en-vivo` pasan a `docs/referencia/AVISOS.md`.
- [X] T027 [US2] Crear `docs/historia/CONTRASENAS-EN-CLARO.md` con §1, §3 y §5 de `docs/referencia/CUENTAS.md` y §2.4, §3.3 y §4 de `docs/guias/DESARROLLO.md`; §2.2 de `DESARROLLO.md` pasa a `CUENTAS.md`; reapuntar las menciones a esas secciones (por ejemplo, desde las migraciones).
- [X] T028 [US2] Crear `docs/historia/AVATARES-AL-SERVIDOR.md` con lo que el mapa manda a historia desde `docs/referencia/AVATARES.md`: el título y la entrada, §1, §2, el razonamiento largo de §4, las fases 1 a 5 con lo validado y medido, lo de macrojuegos de §8 y §12, la publicación del 24/09 y, de §13, cómo se decidió y el relleno al desplegarla. En `AVATARES.md` quedan las decisiones vigentes y lo que dejaron las fases. «Cómo mirarlo con los ojos», §11 y la herramienta de §12 pasan a `docs/guias/DESARROLLO.md`.
- [X] T029 [US2] Reapuntar las 55 menciones a `docs/referencia/AVATARES.md` que hay en el código, las pruebas, las migraciones, los scripts e `infra/nginx/macroreborn.conf`, según lo que cite cada una: si es una fase, a su ancla en `docs/historia/AVATARES-AL-SERVIDOR.md`; si es una sección vigente, a la suya en `AVATARES.md` (research D3).
- [X] T030 [US2] Crear `docs/historia/MUDANZA-AL-VPS.md` con lo que cambió del código en §3.1, §3.2, §3.3 y §3.5 de `docs/referencia/VPS.md`, su §7 y el «antes» de §2.1 de `docs/guias/DESARROLLO.md`. §3.4 pasa a «Configuración y secretos» de `VPS.md`. Lo vigente de §3.1 y §3.2 se queda donde está hasta T057.
- [X] T031 [US2] Crear `docs/historia/FUGA-DEL-ENV.md` con «La fuga del `.env`» de §9 de `docs/referencia/VPS.md`, con las IP de fuera tapadas (`130.x.x.x`, research D8); en `VPS.md` quedan el resumen y lo que dejó (la lista blanca de `server.js`).
- [X] T032 [US2] Crear `docs/historia/LLAVE-SSH.md` con §1.1 y §1.2 de `docs/guias/RETOMAR.md`; en la guía queda la advertencia en dos líneas.
- [X] T033 [US2] Crear `docs/historia/SALDOS-REHECHOS.md` con §5 de `docs/referencia/ECONOMIA.md`; en la referencia quedan el resumen y el aviso de que el recálculo ya se aplicó y no se repite.
- [X] T034 [US2] Crear `docs/historia/ACTIVAR-LA-MODERACION.md` con §5 de `docs/referencia/MODERACION.md`.
- [X] T035 [US2] Crear `docs/historia/CASOS-DE-OTROS-DEVS.md` con §1 y §2 de `docs/guias/CAMBIOS-DE-OTROS-DEVS.md`; la guía se queda con el método (lo que se repite en los dos casos, más §3) y con la tabla de rutas.

### Un tema, un documento (RF-009)

- [X] T036 [US2] Crear `docs/guias/DESPLEGAR.md`, con su cabecera, como el único sitio que explica el despliegue entero: las migraciones primero; `GIT_SSH_COMMAND='ssh -i ~/.ssh/macroreborn-vps-key' git push vps main` (el servidor se actualiza solo, con `receive.denyCurrentBranch=updateInstead`); `sudo -n systemctl restart macroreborn`; la comprobación en la web real; y cómo deshacer. Junta «Desplegar un cambio» de §5 de `docs/referencia/VPS.md` (que dice `git pull`: se corrige), §4 de `docs/guias/RETOMAR.md` y lo del `CLAUDE.md`; esos tres sitios pasan a enlazarla. Se revisa al escribirla, contra el `CLAUDE.md` y el VPS (solo lectura). Entra en el índice y en «Por dónde empezar»; mapa y lista de revisión.
- [X] T037 [US2] Dejar `docs/guias/DESARROLLO.md` como la guía del trabajo en local: §3.5 y §3.6 pasan a «Las pruebas» de `docs/referencia/ECONOMIA.md`; lo que §3.4 dice que sujeta `tests/password.test.js`, a `docs/referencia/CUENTAS.md`; §5 se cambia por el enlace a la constitución, después de comprobar sus puntos uno a uno (lo que no esté en ella se apunta para `docs/guias/SUMARSE.md`, en T060); mapa.

### Revisar cada documento (RF-008)

**Cómo es cada una**:

1. Se lee el documento entero y se compara con el código, con `infra/` y, si habla del servidor, con el
   VPS por SSH, solo con órdenes de lectura (research D7).
2. Se corrige cada afirmación caducada. Las cifras que cambian solas llevan su fecha.
3. Ni IP enteras ni correos: se tapan o se nombran sin pegarlos (research D8).
4. Las citas a otros documentos pasan a enlaces relativos (research D3).
5. Lleva la cabecera de `specs/001-reordenar-documentacion/contracts/documento.md`, con «Revisado» del
   día.
6. Su fila en la lista de revisión: qué se comparó, qué estaba caducado y cómo quedó, y qué queda
   «Pendiente de probar». Las filas del mapa llevan su fecha.
7. Commit `Docs: <NOMBRE> revisado contra el sistema` y push.

Si una revisión encuentra algo que pide cambiar el código o el servidor, no se arregla aquí: se apunta
en la lista de revisión y se le cuenta a Luis, que decide si entra en `docs/listas/AUDITORIA.md`.

- [X] T038 [US2] Revisar `docs/referencia/VPS.md` contra `infra/` y contra el VPS. Antes, comprobar que `ssh -i ~/.ssh/macroreborn-vps-key azureuser@macroreborn.com true` entra (si no, usar el remoto `vps`). Mirar servicios, fail2ban, cron, respaldos y versiones con las órdenes de research D7. Quitar la IP de §1 y §8. Contar fail2ban según lo que diga el servidor, en una sola versión para toda la documentación. Si `infra/` no coincide con el servidor, corregir la copia (regla XXIV).
- [X] T039 [US2] Revisar `docs/referencia/AVATARES.md`.
- [X] T040 [US2] Revisar `docs/referencia/CUENTAS.md`, con su título nuevo (las cuentas).
- [X] T041 [US2] Revisar `docs/referencia/ARTE.md`: su §6 dice que el avatar compuesto en el servidor se adoptó el 21/09, con el enlace a `docs/referencia/AVATARES.md`; el buzón del proyecto se nombra sin pegarlo («el que publica `terminos.html`»).
- [X] T042 [US2] Revisar `docs/referencia/ECONOMIA.md`.
- [X] T043 [US2] Revisar `docs/referencia/MODERACION.md`.
- [X] T044 [US2] Revisar `docs/referencia/SEO.md`; las cifras de páginas, con su fecha.
- [X] T045 [US2] Revisar `docs/referencia/TIENDA.md`.
- [X] T046 [US2] Revisar `docs/guias/DESARROLLO.md`.
- [X] T047 [US2] Revisar `docs/guias/JUEGOS.md`; su §6 se cambia por el enlace a la constitución, después de comprobar que no dice nada más.
- [X] T048 [US2] Revisar `docs/guias/CAMBIOS-DE-OTROS-DEVS.md`.
- [X] T049 [US2] Revisar `docs/guias/RETOMAR.md`: sin la IP de §2 y §4 ni el correo de autor (se nombra «el de la regla V de la constitución»); el repositorio es privado; las trampas de §6 van a su documento (fail2ban y la IP de `ignoreip`, a `docs/referencia/VPS.md`) y se quedan las de formatear. Su §5 no se corrige: pasa al historial en T063.
- [X] T050 [US2] Revisar `docs/listas/AUDITORIA.md` sin tocar filas ni números (regla XXXI): cabecera, y notas fechadas a los puntos 14 y 75 (el repositorio ya es privado; comprobado el 05/10/2026, sin fecha exacta del cambio).
- [X] T051 [US2] Revisar `docs/listas/SUGERENCIAS.md` sin tocar estados, filas ni números: cabecera y fuera sus 12 emojis (research D16); comprobar con `emojis.js` que no queda ninguno. Anotar también la fila de `sugerencias-discord/`: solo guarda la exportación (mensajes y capturas), sin documentación que pueda caducar.
- [X] T052 [US2] Revisar `docs/historia/FRONTEND.md`: entero y con su cabecera; como es historia, lo que ya no es así lleva una nota fechada en vez de corregirse.
- [X] T053 [US2] Revisar `infra/LEEME.md`.
- [X] T054 [US2] Revisar los comentarios del `.gitignore`: dejan de decir que el repositorio es público («privado; comprobado el 05/10/2026, sin fecha exacta del cambio»; lo del 21/09 se cuenta en pasado) y siguen explicando por qué cada carpeta está fuera de git (regla XXV); su fila en la lista de revisión.
- [ ] T055 [US2] Comprobar los once documentos de historia de T024 a T035: completos frente al mapa, con cabecera, con enlaces que funcionan y sin datos sensibles (`sensibles.js`); sus filas, en la lista de revisión.
- [ ] T056 [US2] Activar la comprobación 6 en `tests/documentacion.test.js`: cada `.md` de `docs/` empieza por un título `# ` y las líneas «> **De qué trata:**», «> **Para quién:**» y «> **Revisado:** DD/MM/AAAA».

**Punto de control**: la historia de uso 2 se cumple con los documentos que hay.

---

## Fase 5: Historia de uso 3, entender el sistema de un vistazo (P2)

**Objetivo**: `docs/referencia/ARQUITECTURA.md`, la visión de conjunto, con la tabla de qué documento
lleva cada área.

**Prueba independiente**: leyendo solo `ARQUITECTURA.md` se nombran las partes del sistema y el
documento de cada una (quickstart, escenario 4).

- [ ] T057 [US3] Escribir `docs/referencia/ARQUITECTURA.md` (RF-005, RF-014), con su cabecera y leyendo el código. Debe contar:
  - **Las partes**: el navegador (las páginas de la raíz y `js/`); el servidor (`server.js`, `cluster.js`, `api/` y sus módulos `api/_*.js`); la base de datos y `migrations/`; producción (el VPS, nginx, systemd y los respaldos); las pruebas y la integración continua; las herramientas de `scripts/`; `infra/`; y los datos fuera de git.
  - **Cómo se conectan y dónde vive cada cosa.**
  - **La tabla «área → documento → código principal»**, con un párrafo para cada área sin documento propio: perfiles, amigos, chat, comunidad y rankings, misiones y logros, notificaciones y noticias.
  - **Lo vigente que llega de otros documentos**: «Qué es el proyecto», «Stack» y «Sistemas documentados» del `README.md`; §2 de `docs/guias/DESARROLLO.md`; §3.1 y §3.2 de `docs/referencia/VPS.md`; §2 de `docs/guias/RETOMAR.md`; y el resumen de `docs/historia/FRONTEND.md`.

  Entra en el índice y en «Por dónde empezar»; lista de revisión.
- [ ] T058 [US3] Quitar del `README.md`, de `docs/guias/DESARROLLO.md`, de `docs/referencia/VPS.md` y de `docs/guias/RETOMAR.md` lo que ya cuenta `docs/referencia/ARQUITECTURA.md`, dejando el enlace (RF-009); mapa.
- [ ] T059 [US3] Añadir a `docs/referencia/CUENTAS.md` la sección «Los nombres de usuario», leída del código: la regla de `api/_nombre-usuario.js` y lo que cambió el 05/10/2026 con el punto 31 de `docs/listas/AUDITORIA.md` (los nombres no distinguen mayúsculas); mapa.

**Punto de control**: la historia de uso 3 funciona sola.

---

## Fase 6: Historia de uso 4, sumarse al equipo y a la forma de trabajar (P2)

**Objetivo**: `docs/guias/SUMARSE.md`, una sola guía para preparar el entorno y trabajar como se
trabaja aquí.

**Prueba independiente**: siguiendo solo la guía, sobre una copia limpia, se pasan las pruebas y se
abre el sitio en local en menos de 30 minutos (quickstart, escenario 5). Es una prueba manual larga:
se hace en la validación final (T073), como pide la regla IV.

- [ ] T060 [US4] Escribir `docs/guias/SUMARSE.md` (RF-006, research D14), con su cabecera. Debe contar:
  - **Preparar el entorno**: Node 20.19 o más nuevo, `git clone`, `npm ci`, `npm test`, `npm run db:local` y qué hacer si el puerto 3001 está ocupado.
  - **Cómo se trabaja con Spec Kit**: instalar uv y `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.1.0`; con Claude Code basta abrir la carpeta del proyecto; con otro asistente, `specify integration install <asistente>` en una rama, mirando `git status` antes del commit; en macOS y Linux hace falta PowerShell 7; y los pasos `/speckit-*`, ninguno encadenado sin el OK de Luis.
  - **Commits y ramas**: el formato `Área: qué cambia`; cada dev firma con su propia identidad (la regla V, que aclara la enmienda v1.0.1, es para los commits de Luis y de Claude); nadie añade líneas de asistentes; un commit por cambio, una rama por spec y la unión a `main` sin pull request, con la integración continua en verde.
  - **Cómo se prueba**: `npm test`, `npm run test:smoke` y la integración continua.
  - **Cómo se despliega**: el enlace a `docs/guias/DESPLEGAR.md`, siempre con el OK de Luis.
  - **Que la constitución manda.**

  Recoge lo común de §3 de `docs/guias/RETOMAR.md`, el «Cómo probar localmente» del `README.md` y lo que apuntó T037. Entra en el índice y en «Por dónde empezar»; lista de revisión.
- [ ] T061 [US4] Quitar de §3 de `docs/guias/RETOMAR.md` lo que ya cuenta `docs/guias/SUMARSE.md` (queda lo que solo restaura Luis: llaves, `.env`, `datos-locales/` y la memoria), y del `README.md` el «Cómo probar localmente», dejando sus enlaces; mapa. Con eso el `README.md` queda completo: revisarlo entero y anotar su fila en la lista de revisión.

**Punto de control**: la historia de uso 4 funciona sola.

---

## Fase 7: Historia de uso 5, saber qué cambió y cuándo (P3)

**Objetivo**: `docs/historia/HISTORIAL.md`, con todo lo que cambió desde el 23/07/2026, semana a semana,
y la regla para que siga vivo.

**Prueba independiente**: los cuatro cambios de la historia de uso 5 se encuentran con su fecha, y cada
semana con commits tiene su sección (quickstart, escenario 6).

**Cómo se escribe cada semana**, según `specs/001-reordenar-documentacion/contracts/historial.md`:

1. Semanas de lunes a domingo, con la más reciente arriba.
2. Cada cambio lleva su día (DD/MM, fecha de autor del commit), su área (con el nombre de
   `ARQUITECTURA.md`), quién lo hizo (Luis, SamuMacro o valenmgg), qué cambió en una o dos frases
   técnicas, y los enlaces a donde se explica: el documento, la spec o, si no hay otro, sus commits en
   GitHub.
3. Lo repetido se agrupa. Ningún commit queda sin contar, tampoco los «Add files via upload».
4. Sin datos sensibles.

- [ ] T062 [US5] Sacar con un script de un solo uso, en la carpeta temporal, la materia prima de cada semana: cada commit con su fecha de autor, su autor y su asunto, más los archivos que tocó cuando el asunto no dice nada (research D6). Con ella, crear `docs/historia/HISTORIAL.md` con su cabecera, la línea de cómo se mantiene y las semanas del 05 al 11/10 y del 28/09 al 04/10/2026; entra en el índice, como primera fila de historia.
- [ ] T063 [US5] Escribir en `docs/historia/HISTORIAL.md` las semanas del 21 al 27/09 y del 14 al 20/09/2026, con lo que contaba §5 de `docs/guias/RETOMAR.md`, que deja de contarlo y enlaza las listas, `specs/` y el historial; mapa.
- [ ] T064 [US5] Escribir en `docs/historia/HISTORIAL.md` las semanas del 31/08 al 06/09 y del 17 al 23/08/2026.
- [ ] T065 [US5] Escribir en `docs/historia/HISTORIAL.md` la semana del 10 al 16/08/2026 (221 commits).
- [ ] T066 [US5] Escribir en `docs/historia/HISTORIAL.md` las semanas del 03 al 09/08, del 27/07 al 02/08 y del 20 al 26/07/2026 (la primera subida, el 23/07).
- [ ] T067 [US5] Escribir la regla de RF-017 en `docs/guias/SUMARSE.md` y en `CLAUDE.md`: cada especificación añade su entrada a `docs/historia/HISTORIAL.md` como última tarea, antes de unirse a `main`, con la fecha de esa unión.
- [ ] T068 [US5] Comprobar CE-009 con `semanas.js`, y la prueba de la historia de uso 5 (la economía nueva, el pelo de atrás, los nombres sin distinguir mayúsculas y la llegada de Spec Kit, cada uno con su fecha); anotarlo en la lista de revisión, como resultado del escenario 6 de `specs/001-reordenar-documentacion/quickstart.md`.

**Punto de control**: la historia de uso 5 funciona sola.

---

## Fase 8: Cierre y lo transversal

**Propósito**: lo que toca a varias historias de uso, la validación completa y la unión a `main`.

- [ ] T069 Añadir a `docs/listas/AUDITORIA.md` la sección «Pendientes que viven en otros documentos», con el enlace al «Lo que queda» de cada referencia (research D10), sin tocar filas ni números.
- [ ] T070 Rehacer `CLAUDE.md` con las rutas definitivas y resúmenes cortos que enlazan su documento (RF-009, research D9): probar (`docs/guias/SUMARSE.md` y `docs/guias/DESARROLLO.md`), desplegar (`docs/guias/DESPLEGAR.md`) y la documentación (el índice del `README.md` y las listas). Conserva la regla del historial que escribió T067, y el correo de autor no se pega: se nombra la regla V (research D8). Revisarlo y anotarlo en la lista de revisión.
- [ ] T071 Completar la tabla «ruta vieja → ruta nueva» de `docs/guias/CAMBIOS-DE-OTROS-DEVS.md` con lo que salió de cada documento a otros sitios, enlazando el mapa.
- [ ] T072 Cerrar la enmienda v1.0.1 de `.specify/memory/constitution.md` con `/speckit-constitution` (research D12), con el OK que Luis dio en T004. Entran: la regla V (autor y committer para los commits de Luis y de Claude; cada dev firma con su propia identidad); la frase de la regla XIX sobre `docs/` y `specs/`; la regla XXXII, apuntando a `docs/guias/SUMARSE.md`; la versión, la fecha y el informe de sincronización. Antes, preguntar a Luis si su correo sigue escrito en la regla V o se nombra sin pegarlo (regla XXV). Lo mismo en `.specify/templates/overrides/constitution-template.md`.
- [ ] T073 Refrescar la copia de la memoria de Claude, si la memoria cambió durante el trabajo: copiar `~/.claude/projects/D--Macroreborn/memory/` sobre `memoria-claude/memory/` sin borrar nada antes. Después, pasar la validación de `specs/001-reordenar-documentacion/quickstart.md`, escenarios 1 a 10: las diez preguntas en dos clics, los emojis y los datos sensibles. Incluye la guía de los 30 minutos sobre una copia limpia (escenario 5): `git clone` en la carpeta temporal, seguir `docs/guias/SUMARSE.md` al pie de la letra cronometrando, con `PORT=3101 npm run db:local`. Lo que falle se arregla en la guía, en un commit aparte. La prueba con una persona del equipo queda «Pendiente de probar», y la copia se borra al terminar. El escenario 6 ya lo comprobó T068. Cada resultado va a la lista de revisión, y en el mapa no puede quedar ninguna fila sin fecha (CE-006).
- [ ] T074 Al unir la rama, con el OK de Luis y solo con la integración continua en verde (tras la spec 002) o si Luis decide otra cosa: añadir la entrada de esta spec a `docs/historia/HISTORIAL.md` con la fecha de la unión (RF-017), hacer el commit, unir a `main` en local sin pull request y subir `main` a `origin`.

---

## Dependencias y orden

### Entre fases

- **Fase 1, preparación**: sin dependencias.
- **Fase 2, base**: después de la 1. **Bloquea todas las historias de uso**: sin la prueba y las
  mudanzas, nada tiene su ruta definitiva.
- **Historias de uso (fases 3 a 7)**: después de la 2, en orden de prioridad: US1, US2, US3, US4 y US5.
- **Fase 8, cierre**: cuando estén todas.

### Entre historias de uso

- **US1** (el índice) es la base de las demás: desde T023, cada documento nuevo entra en el índice en
  su mismo commit.
- **US2** deja para US3 lo vigente de `VPS.md` §3.1 y §3.2 y de `DESARROLLO.md` §2 (T030, T057), y
  para US4 lo que T037 apunte de las convenciones (T060).
- **US4** enlaza `DESPLEGAR.md`, que nace en US2 (T036).
- **US5** quita §5 de `RETOMAR.md` (T063), que US2 dejó sin corregir (T049), y escribe en `SUMARSE.md`,
  que nace en US4 (T067).
- **La constitución**: el OK de T004 va antes de la primera mudanza (T005), y la enmienda se cierra en
  T072.

### Dentro de cada historia de uso

- En US2, primero se separa la historia (T024 a T035), después se junta el despliegue y se recorta la
  guía de desarrollo (T036 y T037), y al final se revisa cada documento (T038 a T055) y se activa la
  comprobación 6 (T056).
- En US5, la materia prima y las dos primeras semanas (T062) van antes que las demás semanas (T063 a
  T066).

### En paralelo

No hay tareas en paralelo: comparten el índice, el mapa o la lista de revisión, y la regla VIII de la
constitución pone las tareas en fila.

---

## Estrategia

### El MVP: la historia de uso 1

1. Fase 1: preparación.
2. Fase 2: la prueba y las mudanzas. Es la parte que más toca.
3. Fase 3: el índice del `README.md`.
4. **Parar y validar**: cada documento en su carpeta, a un clic desde el `README.md`, y la prueba en
   verde. Luis lo puede mirar en GitHub, en la rama.

### Después, por partes

1. US2: la historia aparte, el despliegue en un solo sitio y cada documento revisado.
2. US3: la visión de conjunto.
3. US4: la guía para sumarse.
4. US5: el historial de cambios.
5. Cierre: la validación completa (con la guía de los 30 minutos) y la unión a `main` cuando se pueda.

No hace falta desplegar: en el código solo cambian comentarios. La copia del VPS se pone al día en el
próximo despliegue.

---

## Notas

- **Commits**: formato `Área: qué cambia`, en español y con el estilo de `git log`. Autor y committer,
  los de la regla V, sin `Co-Authored-By` ni otras líneas de Claude. Después de cada tarea,
  `git push origin 001-reordenar-documentacion`.
- **Lo que pide el OK de Luis**: T004 (la enmienda), T072 (su correo en la regla V, y lo que vuelva a
  pedir `/speckit-constitution`) y T074 (la unión a `main`).
- **La terminal de Windows**: archivos enteros con Write y cambios puntuales con Edit; los scripts, en la
  carpeta temporal; comandos de Bash por debajo de 6 KB; `MSYS_NO_PATHCONV=1` cuando un argumento empieza
  por `/`.
- **Si el mapa cambia**, se cambia en el mismo commit que mueve la sección.
- **Parar en cada punto de control** si Luis quiere mirar algo antes de seguir.
