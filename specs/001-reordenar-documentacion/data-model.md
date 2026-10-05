# Modelo de datos: reordenar la documentación

**Especificación**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Aquí no hay tablas ni base de datos: lo que se modela son las piezas de la documentación, qué tiene
cada una, cómo se relacionan y qué reglas cumplen. Cada regla dice de qué requisito sale y cómo se
comprueba: con la prueba permanente (`tests/documentacion.test.js`, research D5) o a mano, en la
validación de [quickstart.md](quickstart.md).

## Documento

Un archivo de documentación dentro de `docs/`.

| Campo | Qué es | Ejemplo |
|---|---|---|
| Ruta | `docs/<carpeta>/<NOMBRE>.md` | `docs/referencia/ECONOMIA.md` |
| Tipo | La carpeta: `referencia`, `guias`, `listas` o `historia` (research D1) | `referencia` |
| Título | La primera línea, `# NOMBRE — subtítulo` | `# ECONOMÍA — las monedas` |
| De qué trata | Una o dos frases, en la cabecera | |
| Para quién | Quién lo lee: el equipo de desarrollo, Luis, Claude, el equipo de arte... | |
| Revisado | DD/MM/AAAA de la última lectura entera contra el sistema | `05/10/2026` |
| Áreas | Solo en la referencia: las áreas del sistema que explica | economía |

**Reglas**:

| Regla | De dónde sale | Cómo se comprueba |
|---|---|---|
| Vive en una de las cuatro carpetas; el nombre va en mayúsculas, con guiones y sin tildes ni eñes | RF-011, research D2 | A mano |
| Empieza por el título y las tres líneas de cabecera ([contracts/documento.md](contracts/documento.md)) | RF-003 | Prueba, comprobación 6 |
| Está enlazado desde el `README.md` con una frase | RF-002, CE-002 | Prueba, comprobación 5 |
| Sus enlaces y menciones a otros documentos llevan a algo que existe, ancla incluida | RF-011, CE-003 | Prueba, comprobaciones 1 y 2 |
| Si no es de historia, las rutas y comandos que cita existen | RF-008, CE-004 | Prueba, comprobaciones 3 y 4 |
| Sin IP enteras, correos ni datos personales, salvo las dos excepciones de research D8 | RF-012, regla XXV | A mano, con una búsqueda |
| Si es nuevo o reescrito, sin emojis | RF-012, CE-007 | A mano, con una búsqueda |
| Las cifras que cambian solas llevan su fecha | RF-008, research D7 | A mano, al revisarlo |

**Estados** de cada documento de hoy:

```text
en docs/ → movido a su carpeta → separada su historia → revisado → enlazado en el índice
```

Cada paso es al menos un commit. Un documento nuevo nace ya en su carpeta, revisado y con cabecera.

## Índice

El `README.md`. Su forma está en [contracts/indice.md](contracts/indice.md).

| Campo | Qué es |
|---|---|
| Qué es MacroReborn | Dos o tres líneas |
| Por dónde empezar | Enlaces a `SUMARSE.md`, `ARQUITECTURA.md` y `DESPLEGAR.md` |
| Las reglas | La constitución, el `CLAUDE.md` y `specs/`, cada uno con una línea (RF-013) |
| Una sección por tipo | Referencia, guías, listas vivas, historia y especificaciones, en ese orden (RF-004) |
| Una fila por documento | Enlace, para quién y qué contiene (RF-001, RF-002) |

**Reglas**: todo documento de `docs/` está en él (CE-002, prueba); cualquier documento está a un clic
y cualquier sección a dos como mucho (CE-001, a mano); las diez preguntas típicas se responden desde
él (CE-008, a mano, con la lista de [quickstart.md](quickstart.md)).

## Área del sistema

Una parte del sitio y el documento que la explica. La tabla vive en `docs/referencia/ARQUITECTURA.md`
y es la que consulta cada spec futura para saber qué documento actualizar (RF-014).

| Campo | Qué es | Ejemplo |
|---|---|---|
| Nombre | La parte del sitio | Economía |
| Documento | El que la explica entera | `docs/referencia/ECONOMIA.md` |
| Código principal | Dónde vive | `api/_monedas.js`, `api/_precios.js` |

**Reglas**: cada área tiene un solo documento (RF-009). Las que hoy no tienen ninguno (perfiles,
amigos, chat, comunidad y rankings, misiones y logros, notificaciones, noticias) apuntan a su párrafo
de `ARQUITECTURA.md`, y la primera spec que las cambie les crea su documento.

## Entrada del historial

Un cambio en `docs/historia/HISTORIAL.md`. Su forma está en
[contracts/historial.md](contracts/historial.md).

| Campo | Qué es |
|---|---|
| Semana | De lunes a domingo; cada semana es una sección, la más reciente arriba |
| Día | DD/MM del commit (fecha de autor) o, desde ahora, de la unión a `main` |
| Área | La del sistema, con el mismo nombre que en `ARQUITECTURA.md` |
| Qué cambió | Una o dos frases técnicas |
| Quién | Luis, SamuMacro o valenmgg |
| Enlaces | Donde se explica: documento, especificación o, si no hay otro, sus commits |

**Reglas**: cubre todas las semanas con commits desde el 23/07/2026 (CE-009, a mano con el script de
[quickstart.md](quickstart.md)); los cuatro cambios de la prueba de la historia 5 se encuentran con su
fecha; cada spec añade la suya antes de unirse a `main` (RF-017).

## Mención

Una cita a un documento desde otro sitio.

| Campo | Qué es |
|---|---|
| Origen | El archivo que cita |
| Destino | La ruta del documento y, si hace falta, el ancla de la sección |
| Forma | Enlace de Markdown relativo (entre documentos) o ruta desde la raíz (en el código) |

**Reglas**: el destino existe, ancla incluida (CE-003, prueba); los puntos de las listas se citan por
número (regla XXXI); las secciones, por ancla y nunca por número (research D3). Las menciones de texto
dentro de `specs/` no se tocan ni se comprueban: son el registro de cómo estaba todo al escribir cada
especificación.

## Sección del mapa de contenido

Una fila de [mapa-de-contenido.md](mapa-de-contenido.md).

| Campo | Qué es |
|---|---|
| Origen | Documento y sección de hoy, con sus líneas |
| Destino | Documento y sección donde acaba |
| Nota | Qué se resume, qué se corrige o qué se parte |
| Hecho | La fecha en que quedó en su destino |

**Reglas**: ninguna sección de hoy queda sin fila y ninguna fila queda sin fecha (RF-015, CE-006).

## Fila de la lista de revisión

Una fila de [checklists/revision.md](checklists/revision.md).

| Campo | Qué es |
|---|---|
| Documento | Su ruta nueva |
| Leído entero | La fecha |
| Comparado con | Código, `infra/`, el VPS (solo lectura) |
| Caducado y corregido | Cada afirmación que no era verdad y cómo quedó |
| Pendiente de probar | Lo que no se pudo comprobar, con el motivo |

**Reglas**: cada documento de `docs/`, más el `README.md`, el `CLAUDE.md`, `infra/LEEME.md` y
`memoria-claude/LEEME.md`, tiene su fila; ninguna afirmación marcada como caducada queda sin corregir
(RF-008, CE-004).
