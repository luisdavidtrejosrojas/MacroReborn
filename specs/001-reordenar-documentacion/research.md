# Investigación: reordenar la documentación

**Especificación**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Fecha**: 2026-10-05

Lo que se miró antes de planificar y lo que se decidió con ello. Cada decisión lleva su porqué y las
alternativas descartadas. La investigación la hizo Claude sin subagentes (regla VIII), leyendo los
documentos por secciones, el código que citan y el historial de git.

## Lo que hay hoy

- **15 documentos en `docs/`**, 5.700 líneas. Los más largos: `AVATARES-SERVIDOR.md` (1.094),
  `DESARROLLO.md` (812), `SUGERENCIAS.md` (605), `AUDITORIA.md` (460) y `VPS.md` (458). Fuera de
  `docs/` hay documentación en `README.md`, `CLAUDE.md`, `infra/LEEME.md` y la constitución.
- **Ningún enlace de verdad.** Los documentos se citan entre sí con la ruta entre comillas invertidas
  (`docs/ECONOMIA.md`): 55 menciones en `docs/` y el `README.md`, ninguna clicable. El índice del
  `README.md` tampoco enlaza: hoy no se llega a nada «en dos clics».
- **Unas 220 menciones a documentos** desde fuera de `docs/`: 119 líneas de código, pruebas,
  migraciones y scripts; 5 en `infra/nginx/macroreborn.conf`; 3 en el `.gitignore`; las del
  `CLAUDE.md`, el `README.md`, la constitución y su plantilla propia; y 12 en seis archivos de la
  memoria de Claude. El documento más citado es `AVATARES-SERVIDOR.md` (61 menciones, 45 desde código
  y pruebas). Ningún código lee un documento: todas son comentarios.
- **El servidor no sirve la documentación**, ni hoy ni después: `server.js` cierra la carpeta `docs/`
  entera (`CARPETAS_PRIVADAS`) y nginx cierra `docs/` y cualquier `.md`. Las subcarpetas nuevas
  quedan igual de cerradas.
- **El historial de git**: 829 commits de tres personas (Luis 463, SamuMacro 316, valenmgg 50), del
  23/07/2026 al 05/10/2026, en diez semanas con commits (no hubo en la del 24/08 ni en la del 07/09).
  245 se llaman «Add files via upload» (241 de SamuMacro), así que de esos solo dicen algo los
  archivos que tocan.
- **Las pruebas**: `npm test` es `node --test` y recoge solo cualquier `*.test.js`; 93 archivos en
  `tests/`, en CommonJS, con `node:test` y `node:assert`. La integración continua las corre en Node 20
  y 22, más la prueba de humo (hoy en rojo por la comprobación de monedas, ajena a esta spec).

## Decisiones

### D1. Cuatro carpetas y un criterio para cada tipo

**Decisión**: `docs/referencia/`, `docs/guias/`, `docs/listas/` y `docs/historia/`, con este
criterio para decidir dónde va cada sección:

| Tipo | Qué va | Qué no va |
|---|---|---|
| Referencia | Cómo es hoy una parte del sistema y por qué, en corto: las decisiones vigentes con su motivo y las alternativas descartadas en una tabla o un párrafo | Cómo se llegó: investigaciones, incidentes, planes ya ejecutados, mediciones de un día |
| Guías | Cómo hacer algo, paso a paso, con los comandos | La explicación larga de por qué funciona así (va a la referencia) |
| Listas vivas | Lo pendiente, con número fijo (regla XXXI) | Nada cambia de formato |
| Historia y decisiones | Investigaciones, incidentes, planes ya ejecutados, casos, mediciones de un día y los documentos que razonan una decisión larga; más el historial de cambios | Lo que hay que saber para trabajar hoy (se resume en la referencia en dos líneas, con el enlace) |

**Por qué**: la spec pide separar la referencia de la historia (RF-010) y la constitución pide que la
referencia diga «qué hay y por qué» (regla XIX). El porqué corto se queda; la historia larga se va.

**Alternativas descartadas**: dejar el porqué entero en la referencia (es lo que la hizo crecer hasta
1.094 líneas); mover también las decisiones vigentes a historia (la referencia quedaría sin su porqué,
contra la regla XIX).

### D2. Qué documentos nacen, cuáles cambian de nombre y cuáles se quedan

**Decisión**: la estructura final es esta (el reparto sección por sección está en
[mapa-de-contenido.md](mapa-de-contenido.md)):

```text
README.md                          entrada e índice (RF-001, RF-002, RF-004, RF-013)
CLAUDE.md                          sigue en la raíz: Claude Code solo lo lee ahí
docs/
├── referencia/
│   ├── ARQUITECTURA.md            NUEVO: la visión de conjunto y qué documento lleva cada área (RF-005, RF-014)
│   ├── ARTE.md
│   ├── AVATARES.md                antes AVATARES-SERVIDOR.md, sin el plan y sus fases
│   ├── AVISOS.md                  NUEVO: los avisos en vivo, sacados de DESARROLLO.md §9
│   ├── CUENTAS.md                 antes SEGURIDAD.md: contraseñas, y los nombres de usuario
│   ├── ECONOMIA.md
│   ├── MODERACION.md
│   ├── SEO.md
│   ├── TIENDA.md
│   └── VPS.md                     sin la mudanza ni la fuga del .env
├── guias/
│   ├── SUMARSE.md                 NUEVO: la guía para sumarse (RF-006, RF-017)
│   ├── DESARROLLO.md              queda la guía del trabajo en local y de los datos reales
│   ├── DESPLEGAR.md               NUEVO: el único sitio que explica el despliegue entero
│   ├── JUEGOS.md
│   ├── CAMBIOS-DE-OTROS-DEVS.md   el método, más la tabla «ruta vieja → ruta nueva»
│   └── RETOMAR.md                 solo lo de Luis tras formatear: llaves, secretos y copias
├── listas/
│   ├── AUDITORIA.md
│   └── SUGERENCIAS.md             sin emojis
└── historia/
    ├── HISTORIAL.md               NUEVO: el historial de cambios (RF-007)
    ├── FRONTEND.md                el documento de decisión del 22/09, entero
    ├── AVATARES-AL-SERVIDOR.md    el plan del 21/09, sus cinco fases y lo medido
    ├── LIENZO-DEL-CATALOGO.md
    ├── IMAGEN-NO-ENCONTRADA.md
    ├── AVISOS-ROTOS.md            por qué los avisos llevaban dos semanas rotos, y el cambio a SSE
    ├── MUDANZA-AL-VPS.md          lo que cambió del código y la migración de los datos
    ├── FUGA-DEL-ENV.md
    ├── CONTRASENAS-EN-CLARO.md    el problema, la activación y el relleno de las contraseñas
    ├── LLAVE-SSH.md               las dos veces que se perdió y lo que se hizo el 19/09
    ├── SALDOS-REHECHOS.md         el recálculo del 04/10, que no se repite
    ├── ACTIVAR-LA-MODERACION.md   lo que se hizo el 28/09 al activarla
    └── CASOS-DE-OTROS-DEVS.md     los casos del 28/09 y del 03/10
```

Los nombres siguen la costumbre del proyecto: mayúsculas, guiones, sin tildes ni eñes. Dos cambian
de nombre, que la spec permite «si hay un buen motivo», y otro cambia de papel:

- `AVATARES-SERVIDOR.md` → `AVATARES.md`: ya no es el plan de pasar los avatares al servidor (eso
  está hecho y va a historia), sino la referencia del sistema de avatares.
- `SEGURIDAD.md` → `CUENTAS.md`: solo habla de contraseñas, y con «seguridad» se busca otra cosa (la
  del servidor está en `VPS.md`). Como `CUENTAS.md` le da casa al área «cuentas», que hoy no tiene
  documento, recibe además una sección corta sobre los nombres de usuario (la regla de
  `api/_nombre-usuario.js` y el cambio del punto 31, que hoy solo cuenta la auditoría).
- `DESARROLLO.md` conserva el nombre, pero pasa a ser solo una guía: lo demás se reparte.

Las mudanzas no cuestan menciones de más: cada mención cambia igual, porque cambia la carpeta.

**Por qué**: cada documento nuevo responde a un requisito (visión de conjunto, guía para sumarse,
historial) o a un tema que hoy se repite en varios sitios. El despliegue, por ejemplo, está en
`VPS.md` §5 (que dice `git pull`, ya caducado), en `RETOMAR.md` §4, en `DESARROLLO.md` §4 y en el
`CLAUDE.md`; `DESPLEGAR.md` lo explica una vez (RF-009) y es la respuesta a la primera pregunta
típica de la historia 1.

**Alternativas descartadas**: dejar el despliegue dentro de `VPS.md` (mezcla la máquina con el
procedimiento, y es lo que ya se quedó viejo una vez); fundir `SUMARSE.md` con `DESARROLLO.md` (la
historia 4 pide una guía corta y suficiente para el primer día, y el detalle de cada herramienta la
alargaría); crear documentos nuevos para las áreas que no tienen ninguno (perfiles, chat, misiones...),
porque la spec no lo pide: `ARQUITECTURA.md` las describe en un párrafo y la primera spec que las
cambie crea su documento.

### D3. Cómo se cita un documento

**Decisión**:

- **Entre documentos**, enlaces de Markdown relativos y clicables:
  `[ECONOMIA.md](../referencia/ECONOMIA.md)`, con ancla si apunta a una sección
  (`#4-solo-con-alguien-delante`).
- **Desde el código y sus comentarios**, la ruta desde la raíz del repositorio, como hoy, con ancla si
  hace falta: `docs/guias/DESARROLLO.md#probar-contra-los-datos-de-verdad`. Desaparecen los «§8», que
  se rompen en cuanto una sección cambia de número.
- **Los puntos de las listas vivas** se siguen citando por número («punto 31 de
  `docs/listas/AUDITORIA.md`»): sus números no cambian nunca (regla XXXI).
- **Un archivo que ya no existe** se nombra sin carpeta («el antiguo `_pusher.js`») o se cuenta en
  historia. Así la prueba puede exigir que toda ruta citada en la referencia exista.

**Por qué**: la historia 1 necesita enlaces clicables; las anclas son verificables y los números de
sección no.

**Alternativas descartadas**: seguir con rutas entre comillas (no se pueden pulsar); citar secciones
por número (se rompen en silencio, que es justo lo que pasaría al sacar §6 y §7 de `DESARROLLO.md`).

### D4. La cabecera de cada documento (RF-003)

**Decisión**: cada documento de `docs/` empieza por su título y tres líneas fijas:

```markdown
# ECONOMÍA — las monedas: cuánto valen las cosas y cómo se ganan

> **De qué trata:** los precios por rareza, de dónde salen las monedas y los límites que las protegen.
> **Para quién:** el equipo de desarrollo y quien decida precios.
> **Revisado:** 05/10/2026
```

La fecha va como en el resto de la documentación (DD/MM/AAAA). Se cambia cada vez que alguien lee el
documento entero y lo compara con el sistema. El formato exacto está en
[contracts/documento.md](contracts/documento.md).

**Por qué**: tres campos cortos y siempre en el mismo sitio se pueden comprobar de forma automática.

**Alternativas descartadas**: un bloque de metadatos YAML (GitHub lo pinta como una tabla rara y nadie
lo lee); una fecha por sección (demasiado trabajo para mantener).

### D5. La prueba permanente (RF-016)

**Decisión**: `tests/documentacion.test.js`, con el estilo de las demás pruebas (CommonJS,
`node:test`, `node:assert` y solo módulos de Node). Recorre el repositorio saltando lo que el
`.gitignore` deja fuera, para no depender de git ni de la red, y las carpetas de herramientas que
empiezan por punto (`.claude/`, `.specify/`...), cuyas plantillas llevan enlaces de ejemplo; de ellas
solo mira la constitución. Comprueba:

1. **Enlaces** de Markdown relativos en todo `.md` del repositorio (incluido `specs/`): el destino
   existe y, si lleva ancla, el título también, calculado como lo hace GitHub.
2. **Menciones** a `docs/...md` en cualquier archivo de texto fuera de `specs/` (código, pruebas,
   migraciones, `infra/`, `.gitignore`, `CLAUDE.md`, la constitución): el documento existe, y su ancla
   también.
3. **Rutas citadas** entre comillas invertidas en la documentación, salvo en `docs/historia/` y
   `specs/`: existen, desde la raíz o desde la carpeta del documento.
4. **Comandos** `npm test` y `npm run X` citados en esa misma documentación: el script existe en
   `package.json`.
5. **El índice** (se activa al final): cada `.md` de `docs/` está enlazado desde el `README.md`
   (CE-002).
6. **La cabecera** (se activa al final): cada `.md` de `docs/` tiene sus tres líneas (RF-003, CE-004).

No cuentan como rotas: las URL, las rutas del servidor (empiezan por `/`), las que caen en algo que el
`.gitignore` deja fuera a propósito (`datos-locales/`, `memoria-claude/`...), los patrones
(`api/_*.js`, `<id>`) y las plantillas (`specs/NNN-nombre/`). A una ruta se le quitan antes el número
de línea (`js/amigos.js:212`) y la consulta (`js/core.js?v=20260918`).

`docs/historia/` y `specs/` se libran de las comprobaciones 3 y 4 porque cuentan el pasado: es normal
que nombren archivos que ya no están. Los enlaces entre documentos (1 y 2) sí se comprueban en todas
partes, salvo las menciones de texto en `specs/`, que son el registro de cómo estaba todo al escribir
cada especificación (la 001 describe a propósito las rutas de antes).

**Ensayo sobre la documentación de hoy**: de unas 640 rutas citadas, 11 no existen. Cinco son falsos
positivos que el diseño de arriba ya resuelve (las plantillas `specs/NNN-nombre/`, las rutas relativas
de `infra/LEEME.md`, el `?v=` de `js/core.js`). Las otras seis son de verdad, con cinco rutas
distintas:
`js/tienda.js` y `css/tienda.css` en `TIENDA.md`, que no existen; `api/_pusher.js` en `DESARROLLO.md`
y `SEGURIDAD.md`, borrado hace tiempo; `tests/catalogo-en-core.test.js` en `DESARROLLO.md`; y
`js/mock-backend.js` en `CAMBIOS-DE-OTROS-DEVS.md`, que nunca entró. La prueba es, por tanto, de poco
ruido y ya encuentra errores.

**Cuándo entra**: pronto, antes de mover nada, con las comprobaciones 1 a 4 y los arreglos que pide el
ensayo, para que vigile cada mudanza. La 5 y la 6 se activan al final, cuando el índice y las
cabeceras estén hechos. Así `npm test` está en verde después de cada tarea (regla XII).

**Alternativas descartadas**: usar `git ls-files` (la prueba fallaría en una copia sin `.git`);
comprobar también los emojis (la regla XXX deja los antiguos en su sitio y haría falta una lista de
excepciones; se comprueba a mano, CE-007); comprobar que existen los «punto N» de la auditoría (sus
números no cambian nunca, y la spec no lo pide).

### D6. El historial de cambios (RF-007, RF-017)

**Decisión**:

- **Dónde**: `docs/historia/HISTORIAL.md`. Es historia: qué cambió y cuándo.
- **Orden**: la semana más reciente arriba, que es donde se añade cada entrada nueva. Semanas de lunes
  a domingo, desde la del 20/07/2026 (primera subida, el 23/07) hasta la actual.
- **Cada cambio**: el día, el área, qué cambió en lenguaje técnico, quién lo hizo (Luis, SamuMacro o
  valenmgg) y los enlaces a donde se explica: un documento, una especificación o, si no hay otro, sus
  commits en GitHub (el repositorio es privado y el equipo entra con su cuenta). El formato está en
  [contracts/historial.md](contracts/historial.md).
- **Cómo se reconstruye**: un script de una sola vez, fuera del repositorio (en la carpeta temporal de
  la sesión), saca por semana cada commit con su fecha de autor, su autor, su asunto y, si el asunto no
  dice nada («Add files via upload», «Update X»), los archivos que tocó. Con eso se escribe cada semana
  a mano, agrupando por área: veinte subidas sobre la barra de navegación son un cambio, no veinte.
- **La fecha**: la de autor del commit, que es la que se conserva cuando un commit se reescribe (pasó
  dos veces, al arreglar la firma). Desde ahora, la de la unión a `main` (RF-017).
- **Cómo sigue vivo**: la última tarea de cada spec, antes de unirse a `main`, añade su entrada. Queda
  escrito en `SUMARSE.md` y en el `CLAUDE.md` (RF-017). La 001 es la primera.

**Por qué**: Luis eligió un historial técnico, completo y para el equipo. Con la fecha de autor y el
orden de más nuevo a más viejo, lo de cada semana se encuentra sin leer los 829 commits.

**Alternativas descartadas**: generar el historial solo con un script (los 245 «Add files via upload»
saldrían vacíos); guardar el script en el repositorio (desde ahora el historial se escribe a mano, spec
por spec, y el script no se volvería a usar); una entrada por commit (829 líneas que no se leen).

### D7. Cómo se revisa cada documento (RF-008)

**Decisión**: cada documento se lee entero y se compara con el código. Lo comprobable se deja a la
prueba de D5. Lo que depende del servidor se mira en el VPS por SSH, solo con órdenes que leen y nunca
cambian nada, por ejemplo:

```bash
systemctl is-active macroreborn fail2ban nginx postgresql
crontab -l
ls -la ~/respaldos/diarios | tail -3
node --version && psql --version && nginx -v
sudo -n fail2ban-client status        # solo si sudo no pide contraseña; si la pide, queda pendiente
```

Cada documento revisado queda en una lista de revisión,
[checklists/revision.md](checklists/revision.md), con la fecha, lo que se comparó y cada afirmación
caducada que se corrigió. Si algo de `infra/` no coincide con el servidor, se corrige la copia
(regla XXIV); en el servidor no se cambia nada.

**Lo caducado que ya se sabe** (la revisión encontrará más):

| Dónde | Qué dice | Qué es verdad |
|---|---|---|
| `.gitignore`, `memoria-claude/LEEME.md`, `RETOMAR.md` §2, nota al 14 de `AUDITORIA.md` | El repositorio es público | Es privado (comprobado en GitHub el 05/10/2026; no consta desde cuándo) |
| `VPS.md` §9 | fail2ban activo, con seis cárceles | `RETOMAR.md` §6 y la memoria: apagado desde el 17/09. Se comprueba en el VPS |
| `VPS.md` §5 | Se despliega con `git pull` en el servidor | Se despliega con `git push vps main` y el servidor se actualiza solo (`updateInstead`) |
| `RETOMAR.md` §3, `FRONTEND.md` §6 | 655 pruebas en 45 s; 767 pruebas en 42 archivos | Unas 1.300 pruebas en 93 archivos, en cerca de un minuto (CLAUDE.md, 05/10/2026) |
| `SEO.md` §1 | 15 páginas HTML | 30 en la raíz |
| `TIENDA.md` | `js/tienda.js` y `css/tienda.css` | No existen; hay que ver dónde vive la tienda |
| `ARTE.md` §6 | Se descartó el avatar compuesto en el servidor | Se adoptó el 21/09 (`AVATARES-SERVIDOR.md` §1 lo cuenta) |
| `README.md` | El índice tiene 11 documentos | Hay 15; faltan cuatro |
| `memoria-claude/LEEME.md` | «Nueve archivos» de memoria; si el proyecto vuelve a `C:\Users\luisd\Documents\...` la carpeta es `D--Macroreborn` | Hoy son 16; esa carpeta sería otra. Además, su receta para refrescar la copia empieza con `rm -rf memoria-claude` y borraría el propio `LEEME.md` y el zip |

**Las cifras que cambian solas** (pruebas, cuentas, páginas, prendas) se escriben con su fecha («unas
1.300 pruebas al 05/10/2026») o no se escriben en la referencia.

**Alternativas descartadas**: comparar el servidor solo con `infra/` (Luis eligió mirar el VPS);
revisar solo lo automático (no encuentra contradicciones como la de fail2ban).

### D8. Datos sensibles (regla XXV)

**Decisión**:

- **La IP del servidor**, entera hoy en `VPS.md` (§1 y §8) y en `RETOMAR.md` (§2 y §4), se quita. Donde
  hace falta para entrar, se usa el dominio (`azureuser@macroreborn.com`, que apunta a la máquina por un
  registro A) o el remoto `vps` (`git remote -v` la enseña). Dónde está apuntada la IP se dice sin
  escribirla: en Bitwarden y en la memoria de Claude.
- **Las IP de fuera** que bajaron el `.env` (`VPS.md` §9) se tapan: `130.x.x.x`.
- **Los correos** tampoco se pegan: el de autor de los commits (en `RETOMAR.md` y en el `CLAUDE.md`) se
  nombra como «el de la regla V de la constitución», y el buzón del proyecto (en `ARTE.md`), como «el
  que publica `terminos.html`». La constitución, que escribe el de autor en su regla V, no se toca aquí
  (ver D12).
- **Se queda** el `server_name` con la IP en `infra/nginx/macroreborn.conf`: es configuración en uso, no
  un documento, y `infra/` tiene que reflejarla (regla XXIV).

**Por qué**: la regla XXV prohíbe pegar en documentos IP enteras, correos y datos personales, sin
excepciones.

**Alternativas descartadas**: tapar también la IP del `server_name` (`infra/` dejaría de reflejar el
servidor); dejar los dos correos porque son públicos o porque la regla V lo escribe (era una excepción
que la regla XXV no da; lo encontró `/speckit-analyze`).

### D9. El CLAUDE.md y el README repiten un poco, a propósito

**Decisión**: el `CLAUDE.md` mantiene resúmenes cortos (cómo probar, los cuatro pasos del despliegue,
las trampas de la terminal) y cada uno enlaza su documento. El `README.md` solo enlaza.

**Por qué**: Claude Code carga el `CLAUDE.md` solo al empezar cada sesión; los documentos enlazados no.
Si solo enlazara, cada sesión tendría que leer varios documentos antes de poder probar o desplegar. La
historia 2 se cumple igual: un solo documento explica cada tema entero (escenario 1) y el resto
resume o enlaza. Es una excepción a RF-009, justificada en el plan.

**Alternativas descartadas**: un `CLAUDE.md` que solo enlaza (más lento y más caro en cada sesión); uno
que lo explica todo (vuelve a duplicar y a caducar).

### D10. Lo pendiente que vive fuera de las listas

**Decisión**: `AUDITORIA.md` gana una sección corta, «Pendientes que viven en otros documentos», que
enlaza las secciones «Lo que queda» o «Lo que falta» de cada referencia (`ARTE.md`, `TIENDA.md`,
`MODERACION.md`, `VPS.md`, `AVATARES.md`). Sus filas y números no se tocan.

**Por qué**: «¿qué queda por arreglar?» es una de las preguntas típicas de la historia 1, y hoy la
respuesta está repartida en seis documentos.

**Alternativas descartadas**: pasar esos pendientes a filas nuevas de la auditoría (la auditoría es lo
que salió el 18/09; cambiaría su sentido); dejarlos como están (no se encuentran desde el índice).

### D11. La memoria de Claude y su copia (RF-011)

**Decisión**: se cambian las rutas en los seis archivos de la memoria viva
(`~/.claude/projects/D--Macroreborn/memory/`). Después se copia `memory/` sobre
`memoria-claude/memory/` sin borrar nada antes, y se corrige `memoria-claude/LEEME.md`: dice que el
repositorio es privado, cuenta bien los archivos y refresca la copia sin borrar el `LEEME.md` ni el
zip.

**Por qué**: la memoria se carga en cada sesión; con rutas viejas, Claude buscaría documentos que ya
no están. La receta actual de refresco borraría dos archivos que no están en el origen.

**Alternativas descartadas**: rehacer la copia con `rm -rf` como dice hoy el `LEEME.md` (borra el
`LEEME.md` y el zip).

### D12. La enmienda v1.0.1 de la constitución

**Decisión**: con `/speckit-constitution` y el OK expreso de Luis, como tarea aparte y con su informe
de sincronización. Cambia:

- las rutas que cita: reglas XIII, XVII, XXI, XXVII, XXIX y XXXI, más la XXXII, que pasa a señalar
  `docs/guias/SUMARSE.md`;
- la frase de la regla XIX que hoy dice «`docs/` es la documentación de referencia del sistema» y
  «`specs/` es el historial de cada cambio». Con `docs/historia/HISTORIAL.md` se confundirían, así que
  queda así: `docs/` es la documentación del sistema (referencia, guías, listas e historia), y
  `specs/` guarda cada cambio con su especificación;
- la regla V: «autor y committer» es para los commits de Luis y de Claude; cada dev firma con su propia
  identidad, y nadie añade líneas de asistentes (lo decidió Luis el 05/10/2026). Al aprobarla, Luis
  decide también si su correo sigue escrito en esa regla o se nombra sin pegarlo, como pide la regla
  XXV;
- la plantilla propia (`.specify/templates/overrides/constitution-template.md`), que repite esas
  rutas.

Es una aclaración: no quita ni añade principios. La regla de RF-017 no entra en la constitución:
queda en `SUMARSE.md` y en el `CLAUDE.md`, que es donde se explica el día a día con Spec Kit.

**Cuándo**: la constitución cita cinco documentos (`AUDITORIA`, `SUGERENCIAS`, `VPS`,
`CAMBIOS-DE-OTROS-DEVS` y `ARTE`). Si sus rutas esperaran a la enmienda, la prueba fallaría desde la
primera mudanza. Por eso el OK de Luis se pide antes de mover nada, sus rutas cambian en el mismo commit
que mueve cada documento, y la enmienda se cierra al final con `/speckit-constitution`: las frases de
las reglas V, XIX y XXXII, la versión, la fecha y el informe de sincronización. El OK se apunta aquí,
con su fecha, en cuanto Luis lo dé. Mientras tanto la rama no se une a
`main`, así que `main` nunca ve una constitución a medias.

**Aprobada**: Luis aprobó los cuatro cambios (las rutas, la regla XIX, la regla XXXII y la regla V) el
05/10/2026, antes de la primera mudanza (T004).

**Alternativas descartadas**: subir a v1.1.0 metiendo la regla del historial en el flujo de trabajo
(sería un cambio MINOR que la spec no pide; Luis puede pedirlo después).

### D13. El orden del trabajo y los commits

**Decisión**:

1. Primero la prueba, con lo que el ensayo de D5 pide arreglar.
2. Después las mudanzas: un `git mv` por documento, sin tocar su contenido salvo las rutas, en su propio
   commit. Si el contenido cambiara en el mismo commit, git podría no verlo como mudanza y se
   perdería el hilo de `git log --follow`.
3. Luego se separa la historia, documento por documento, y se revisa cada uno (D7).
4. Al final los documentos nuevos, el índice, la memoria, la constitución y la validación.

Un commit por cambio lógico (regla V) y `git push origin` al acabar cada tarea. La rama no se une a
`main` hasta que la integración continua esté en verde (la spec 002 arregla la prueba de humo) o Luis
decida otra cosa. La última tarea, la entrada de la 001 en el historial (RF-017), se hace justo antes
de unirla.

**Alternativas descartadas**: mover todo en un commit (un diff enorme e imposible de revisar o
deshacer por piezas); revisar el contenido antes de mover (las rutas cambiarían dos veces).

### D14. Spec Kit para otro dev (RF-006, regla XXXII)

**Decisión**: `SUMARSE.md` explica lo que se comprobó en esta máquina:

- `specify` 1.1.0 se instala con uv:
  `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.1.0`.
- El proyecto ya trae `.specify/` y los comandos de Claude (`.claude/skills/`). Con Claude Code basta
  abrirlo en la carpeta del proyecto. Con otro asistente,
  `specify integration install <asistente>` añade sus comandos, en una rama y mirando `git status`
  antes del commit.
- Los scripts de Spec Kit del proyecto son de PowerShell (`--script ps`): en Windows ya está; en macOS
  o Linux hace falta PowerShell 7 (`pwsh`).
- Cada dev firma sus commits con su propia identidad; la regla V (Luis como autor) es para los commits
  de Luis y de Claude, como aclara la enmienda v1.0.1 (D12). Nadie añade líneas de asistentes.
- Lo que no se puede probar en esta máquina (otro asistente, macOS) queda «Pendiente de probar».

### D15. Cómo se valida la guía en menos de 30 minutos (CE-005)

**Decisión**: Claude la sigue al pie de la letra sobre una copia limpia (`git clone` en la carpeta
temporal de la sesión), cronometrando, con el servidor local en otro puerto
(`PORT=3101 npm run db:local`) para no chocar con el que Luis pueda tener en el 3001. La prueba con
una persona de verdad (SamuMacro o valenmgg) queda «Pendiente de probar» (regla IV) hasta que alguien
la haga.

### D16. Emojis (regla XXX, CE-007)

**Decisión**: se quitan los 12 de `SUGERENCIAS.md`. El nombre del canal de Discord se escribe sin ellos
(«el canal de sugerencias»); en las citas, el emoji se quita, o se describe entre corchetes si cambia
el sentido. Los emojis antiguos de `AUDITORIA.md`, `JUEGOS.md`, `SEO.md` y `TIENDA.md` se quedan,
aunque se revisen esos documentos: CE-007 cuenta lo nuevo y los pasajes reescritos, no los documentos
que solo se revisan. La comprobación es a mano, con una búsqueda al final.

## Fuera de alcance

- Cambiar el comportamiento del sitio o la configuración del servidor.
- Escribir especificaciones de lo que ya existe, o editar las de `specs/` (salvo los artefactos de
  esta).
- Documentos nuevos para áreas que hoy no tienen ninguno, más allá de su párrafo en
  `ARQUITECTURA.md` y de la sección de nombres en `CUENTAS.md`.
- Contar los cambios a la comunidad (Luis eligió un historial solo para el equipo).
- Cambiar el estado de las sugerencias (siguen como Luis las dejó).
