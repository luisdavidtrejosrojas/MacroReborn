# Plan de implementación: reordenar la documentación

**Rama**: `001-reordenar-documentacion` | **Fecha**: 2026-10-05 | **Especificación**: [spec.md](spec.md)

**Entrada**: la especificación de `specs/001-reordenar-documentacion/spec.md`, con sus ocho
aclaraciones.

## Resumen

La documentación se reparte en cuatro carpetas por tipo (`docs/referencia/`, `docs/guias/`,
`docs/listas/` y `docs/historia/`). Lo que cuenta cómo se llegó a algo (investigaciones, incidentes,
planes ya ejecutados) sale de la referencia y queda entero en historia, con un resumen de dos líneas en
su sitio. Cada documento se lee entero y se compara con el código y, si habla del servidor, con el VPS,
solo con órdenes de lectura. Nacen cinco documentos: la visión de conjunto (`ARQUITECTURA.md`), los
avisos en vivo (`AVISOS.md`), la guía para sumarse (`SUMARSE.md`), la del despliegue (`DESPLEGAR.md`)
y el historial de cambios desde el 23/07/2026 (`HISTORIAL.md`). El `README.md` pasa a ser la entrada,
con enlaces de verdad. Una prueba permanente en `npm test` vigila que ningún enlace, mención, ruta ni
comando citado apunte a algo que no existe. La memoria de Claude, el `CLAUDE.md` y la constitución
(enmienda v1.0.1) se ponen al día con las rutas nuevas.

El porqué de cada decisión está en [research.md](research.md); el reparto sección por sección, en
[mapa-de-contenido.md](mapa-de-contenido.md).

## Contexto técnico

**Lenguaje y versión**: Markdown, tal como lo pinta GitHub, para la documentación. JavaScript sobre
Node 20.19 o más nuevo (CommonJS), para la prueba.

**Dependencias**: ninguna nueva. La prueba usa `node:test`, `node:assert`, `fs` y `path`.

**Almacenamiento**: archivos del repositorio. No se toca ninguna base de datos.

**Pruebas**: `npm test` (`node --test`), que recoge sola `tests/documentacion.test.js`. La integración
continua la corre en Node 20 y 22.

**Plataforma**: el repositorio en GitHub, que es donde se lee la documentación. La prueba corre en
Windows (el PC de Luis) y en Ubuntu (la integración continua).

**Tipo de proyecto**: la documentación de una web sin frameworks (HTML, CSS y JS en la raíz y en
`js/`; el servidor en `api/` y `server.js`).

**Objetivos de rendimiento**: la prueba nueva tarda menos de un segundo; la suite entera sigue en cerca
de un minuto.

**Restricciones**:

- El comportamiento del sitio no cambia: en el código solo cambian comentarios.
- Nada en el servidor cambia: el VPS solo se lee. Si `infra/` no coincide con él, se corrige la copia.
- Las listas vivas conservan sus filas y sus números (regla XXXI).
- Sin IP enteras ni datos personales en lo que se escriba (regla XXV, research D8).
- Sin subagentes (regla VIII): la investigación y las tareas, una tras otra.
- La integración continua está en rojo por la prueba de humo de monedas (spec 002): la rama no se une a
  `main` hasta que esté en verde o Luis decida otra cosa.
- La terminal de Windows: comandos de Bash por debajo de 6 KB, archivos enteros con Write y cambios
  puntuales con Edit (el `CLAUDE.md` cuenta por qué).

**Alcance**: 15 documentos de `docs/` (5.700 líneas), más el `README.md`, el `CLAUDE.md`,
`infra/LEEME.md` y `memoria-claude/LEEME.md`. Unas 220 menciones a documentos desde el código, las
pruebas, `infra/`, el `.gitignore`, la constitución y la memoria de Claude. Para el historial, 829
commits en diez semanas. Al final quedan 31 documentos: 10 de referencia, 6 guías, 2 listas y 13 de
historia.

## Comprobación de la constitución

*Puerta: se pasa antes de investigar y se vuelve a pasar después del diseño.*

| Regla | Cómo la cumple este plan | Estado |
|---|---|---|
| I. Idioma | Todo en español, también la prueba y sus mensajes | Cumple |
| II. Discutir antes de construir | Especificación aclarada; nada se implementa hasta que Luis apruebe este plan y las tareas | Cumple |
| IV. Desarrollar primero, pulir al final | En cada paso, solo `npm test`. Las validaciones largas van juntas al final ([quickstart.md](quickstart.md)); lo que no se pueda hacer queda «Pendiente de probar» | Cumple |
| V. Un commit por paso mínimo | Una mudanza, una separación o una revisión por commit, firmados por Luis y sin líneas de Claude (research D13) | Cumple |
| VI. Pasos manuales de uno en uno | Lo único que hace Luis es aprobar: el plan, las tareas y la enmienda v1.0.1 | Cumple |
| VII. Sin gastos | Nada de pago | Cumple |
| VIII. Sin subagentes | La investigación se hizo sin ellos y las tareas irán una tras otra | Cumple |
| IX. Conversación breve, documentos completos | Los documentos son completos; a Luis se le resume en pocas líneas | Cumple |
| X. Respaldo en GitHub | `git push origin` al acabar cada tarea | Cumple |
| XI. Simplicidad | Sin dependencias nuevas, sin scripts que se queden en el repositorio para el historial. Lo que va más allá de lo mínimo está justificado abajo | Cumple, con justificación |
| XII. Terminado significa comprobado | La prueba entra primero y se activa por partes para que `npm test` esté en verde tras cada tarea (research D5) | Cumple |
| XIII. Nunca fallar en silencio | La prueba junta todos los fallos y cada mensaje dice qué corregir | Cumple |
| XV. Seguro | Ningún secreto en la documentación: el `.env` de ejemplo lleva marcadores | Cumple |
| XVII. Todo reversible | Cada mudanza y cada separación es un commit; se deshacen por piezas. Sin migraciones | Cumple |
| XIX. Documentación guiada por especificaciones | Es la spec que deja la documentación como pide esta regla; sus artefactos están en `specs/001-reordenar-documentacion/` | Cumple |
| XX. La base de producción es sagrada | No se consulta la base. En el VPS, solo órdenes de lectura | Cumple |
| XXI. Desplegar solo con el OK de Luis | No hace falta desplegar: en el código solo cambian comentarios. La copia del VPS se pone al día en el próximo despliegue | Cumple |
| XXII. Pruebas sin tocar lo real | La prueba solo lee archivos del repositorio. La unión a `main` espera a que la integración continua esté en verde | Cumple |
| XXIV. Lo que no se rompe | No cambia ninguna lista blanca: `server.js` y nginx ya cierran `docs/` entera y cualquier `.md`, subcarpetas incluidas. El marcador de la IP del administrador no se toca | Cumple |
| XXV. Los datos de la comunidad no salen | La IP del servidor y las de fuera salen de la documentación; las excepciones están en research D8 | Cumple |
| XXVII. Los cambios de otros devs se funden | La guía gana la tabla «ruta vieja → ruta nueva» | Cumple |
| XXIX. El arte no se publica | La documentación no incluye arte | Cumple |
| XXX. Sin emojis | Se quitan los de `SUGERENCIAS.md`; los antiguos se quedan (research D16) | Cumple |
| XXXI. Las listas vivas no se borran | Filas y números intactos; solo se añaden notas fechadas y una sección de enlaces | Cumple |
| XXXII. El equipo | `SUMARSE.md` explica cómo se suma otro dev, con Spec Kit incluido | Cumple |

Las reglas III, XIV, XVI, XVIII, XXIII, XXVI y XXVIII no aplican: no se cambia el comportamiento, la
interfaz ni el rendimiento del sitio.

**Después del diseño**: se repasó la tabla con el diseño terminado y sigue igual. También se respeta
la sección de gobierno de la constitución: la enmienda v1.0.1 se hace con `/speckit-constitution` y el
OK expreso de Luis (research D12).

## Estructura

### Documentación de esta spec

```text
specs/001-reordenar-documentacion/
├── spec.md                 la especificación, con sus aclaraciones
├── plan.md                 este archivo
├── research.md             las decisiones, con su porqué y lo descartado
├── data-model.md           las piezas de la documentación y sus reglas
├── mapa-de-contenido.md    de dónde sale cada sección y adónde va
├── quickstart.md           cómo se valida al final
├── contracts/
│   ├── documento.md        cómo es un documento de docs/
│   ├── indice.md           el README.md
│   ├── historial.md        el historial de cambios
│   └── prueba-documentacion.md
├── checklists/
│   ├── requirements.md     la calidad de la especificación
│   └── revision.md         cada documento, revisado (se rellena al implementar)
└── tasks.md                lo crea /speckit-tasks
```

### El repositorio

```text
README.md                    la entrada y el índice
CLAUDE.md                    rutas nuevas, resúmenes con enlace y la regla del historial
.gitignore                   rutas nuevas; deja de decir que el repositorio es público
.specify/memory/constitution.md                       enmienda v1.0.1
.specify/templates/overrides/constitution-template.md las mismas rutas
docs/
├── referencia/   ARQUITECTURA, ARTE, AVATARES, AVISOS, CUENTAS, ECONOMIA, MODERACION, SEO, TIENDA, VPS
├── guias/        SUMARSE, DESARROLLO, DESPLEGAR, JUEGOS, CAMBIOS-DE-OTROS-DEVS, RETOMAR
├── listas/       AUDITORIA, SUGERENCIAS
└── historia/     HISTORIAL, FRONTEND, AVATARES-AL-SERVIDOR, LIENZO-DEL-CATALOGO,
                  IMAGEN-NO-ENCONTRADA, AVISOS-ROTOS, MUDANZA-AL-VPS, FUGA-DEL-ENV,
                  CONTRASENAS-EN-CLARO, LLAVE-SSH, SALDOS-REHECHOS, ACTIVAR-LA-MODERACION,
                  CASOS-DE-OTROS-DEVS
tests/documentacion.test.js  NUEVA: la prueba permanente (RF-016)
api/, js/, tests/, migrations/, scripts/, infra/nginx/   solo cambian las rutas de sus comentarios
infra/LEEME.md               se revisa como un documento más
```

Fuera de git: la memoria de Claude (`~/.claude/projects/D--Macroreborn/memory/`), su copia en
`memoria-claude/` y `memoria-claude/LEEME.md`.

**Decisión de estructura**: cuatro carpetas por tipo dentro de `docs/`, con los nombres de siempre
salvo dos cambios de nombre con motivo (research D2). El `README.md` y el `CLAUDE.md` siguen en la raíz: GitHub
enseña el primero y Claude Code solo lee el segundo ahí.

## Cómo se hará

El orden, que `/speckit-tasks` convertirá en tareas de un commit cada una (research D13):

1. **La prueba primero**: `tests/documentacion.test.js` con las comprobaciones 1 a 4, más los arreglos
   que pide el ensayo (research D5). Desde aquí, cada mudanza está vigilada.
2. **Las mudanzas**: antes de la primera, el OK de Luis a la enmienda v1.0.1, porque la constitución
   cita cinco documentos y sus rutas cambian con ellos (research D12). Después, un `git mv` por
   documento a su carpeta (y los dos cambios de nombre), con todas sus menciones al día, sin tocar el
   contenido. Al final, la tabla «ruta vieja → ruta nueva» en `CAMBIOS-DE-OTROS-DEVS.md`.
3. **Separar la historia**: documento por documento, siguiendo el mapa de contenido, con su resumen de
   dos líneas en la referencia.
4. **Revisar cada documento** (RF-008): leído entero, comparado con el código y, si toca, con el VPS
   (solo lectura); cifras con fecha, IP fuera y la cabecera nueva. Una fila por documento en la lista
   de revisión.
5. **Los documentos nuevos**: `ARQUITECTURA.md`, `AVISOS.md`, `SUMARSE.md`, `DESPLEGAR.md`, y la
   sección de nombres de usuario de `CUENTAS.md`.
6. **El historial**: reconstruido semana a semana (research D6).
7. **La entrada**: el `README.md` nuevo, la sección de pendientes de `AUDITORIA.md`, el `CLAUDE.md`, y
   las comprobaciones 5 y 6 de la prueba activadas.
8. **Fuera del repositorio y gobierno**: la memoria de Claude y su copia, `memoria-claude/LEEME.md`, y
   el cierre de la enmienda v1.0.1 con `/speckit-constitution`.
9. **Validación**: los escenarios de [quickstart.md](quickstart.md).
10. **Cierre**: la entrada de esta spec en el historial y la unión a `main`, cuando la integración
    continua esté en verde o Luis decida otra cosa.

## Riesgos

| Riesgo | Qué lo evita |
|---|---|
| Una mención rota en el código o en un documento | La prueba entra antes de mover nada y falla con el archivo y la línea |
| Git deja de ver una mudanza como tal y se pierde el hilo de `git log --follow` | Mudanza y edición en commits distintos |
| Algo se pierde al partir un documento | El mapa de contenido, fila a fila, con fecha |
| Lo que manden otros devs llega con rutas viejas | La tabla de rutas en la guía de cambios de otros devs, y la prueba al fundirlo |
| Entrar al VPS por el dominio no funciona como se espera | Se comprueba con una orden de lectura antes de escribirlo en la documentación; si falla, se usa el remoto `vps` |
| Chocar con el servidor local de Luis en el 3001 | La validación usa el puerto 3101 y una copia aparte |
| La rama espera mucho a la integración continua | La spec 002 la pone en verde; mientras, la rama se sube a GitHub tras cada tarea |

## Seguimiento de la complejidad

Lo que va más allá de lo mínimo, con su motivo (regla XI):

| Qué | Por qué hace falta | Lo más simple, y por qué no basta |
|---|---|---|
| El `CLAUDE.md` repite resúmenes cortos, una excepción a RF-009 | Claude Code solo carga el `CLAUDE.md` al empezar cada sesión, no los documentos que enlaza | Solo enlaces: cada sesión leería varios documentos antes de poder probar o desplegar |
| La prueba vigila también el índice y las cabeceras (comprobaciones 5 y 6) | CE-002 y CE-004 piden que estén siempre, y a mano se olvida en la primera spec que añada un documento | Comprobarlo a mano en cada spec |
| `CUENTAS.md` estrena una sección sobre los nombres de usuario | El área de cuentas no tiene documento, y el cambio del punto 31 solo lo cuenta la auditoría | Dejarlo en un párrafo de `ARQUITECTURA.md`: sería el único cambio de hoy sin referencia |
| `AUDITORIA.md` estrena una sección de enlaces a los pendientes de otros documentos | «¿Qué queda por arreglar?» se responde desde un solo sitio (historia 1) | Dejar los pendientes repartidos en seis documentos |
