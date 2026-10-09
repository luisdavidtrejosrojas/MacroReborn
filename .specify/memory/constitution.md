<!--
Informe de sincronización
- Versión: 1.0.2 -> 1.0.3 (PATCH): una aclaración, sin quitar ni añadir principios (D3 de
  specs/007-apagar-ci, aprobada por Luis el 2026-10-09).
- Reglas cambiadas: XXII (para unir a main, las pruebas y la prueba de humo en verde con las dos
  versiones de Node; las corre la integración continua si está encendida y, si no, el PC, y la
  especificación lo anota: GitHub Actions se apagó el 2026-10-09) y el paso 9 del flujo de trabajo.
- Secciones añadidas o quitadas: ninguna.
- Plantillas: la propia, .specify/templates/overrides/constitution-template.md, con el mismo cambio;
  plan-template.md, spec-template.md y tasks-template.md, sin cambios.
- Pendiente: nada.
-->
# Constitución de MacroReborn

> MacroReborn es una comunidad de juegos web (macroreborn.com): catálogo de juegos, avatares,
> perfiles, comunidad, chat, moderación y una economía de monedas. Luis (SoyDegurime) es el dev
> principal; el repositorio es del equipo (`valenmgg/MacroReborn`).
>
> Esta constitución está por encima de cualquier otra práctica del proyecto, incluidos `CLAUDE.md` y
> los documentos de `docs/`. Parte de la **constitución base de Luis v1.0.0** (principios generales
> I-XIX, ocho de ellos adaptados a una web de equipo) y se completa con las reglas propias de
> MacroReborn (XX-XXXII).

## Principios generales

### I. Idioma

- Todo DEBE estar en español: conversación, especificaciones, planes, tareas, documentación,
  interfaz, mensajes de error, comentarios del código y mensajes de commit.
- Los nombres nuevos del código (funciones, variables, archivos) también van en español, como el resto
  del proyecto (`cuentaPorNombre`, `api/_sanciones.js`). Los nombres en inglés que ya existen se
  dejan como están.
- Los textos de la web siguen el registro que ya usa el sitio, con voseo ("Elegí", "ingresá").

Por qué: el proyecto entero ya está en español; mezclar idiomas lo haría más difícil de leer para el
equipo.

### II. Discutir antes de construir

- Antes de construir se investiga qué existe (soluciones, herramientas, alternativas), se revisa lo
  que ya hay y se le pregunta a Luis todo lo necesario.
- NUNCA se escribe código del producto sin que Luis haya aprobado la especificación y el plan.
- Las decisiones se presentan con opciones y una recomendación.

### III. Primero que funcione, luego bien, luego rápido

- El orden de prioridades es: que funcione, que funcione bien, que sea rápido.

### IV. Desarrollar primero, pulir al final

- En cada paso solo hay comprobaciones rápidas: que pasen las pruebas automáticas.
- Las pruebas manuales largas y los ajustes finos se agrupan en una fase de pulido acordada con Luis.
- Lo que no se pueda probar en el momento (por ejemplo, porque Luis está en el teléfono) se anota como
  «Pendiente de probar» y no bloquea el avance.

### V. Un commit por cada paso mínimo

- Cada cambio lógico mínimo DEBE tener su propio commit. Nunca se mezclan cambios no relacionados.
- El mensaje sigue el formato del proyecto, `Área: qué cambia`, en español (por ejemplo,
  `Perfiles: se abren con otras mayusculas`), con un cuerpo que explique el porqué cuando haga falta.
- Los commits de Luis y de Claude llevan como autor y committer a Luis David Trejos Rojas, con el
  correo de la configuración de git de su PC (`.git/config`), que no se pega en los documentos (regla
  XXV). Cada otro dev firma con su propia identidad. Nadie añade `Co-Authored-By`, `Claude-Session`,
  enlaces a claude.ai ni firmas automáticas, aunque una herramienta las pida. En una máquina nueva se
  comprueba antes `git var GIT_AUTHOR_IDENT`.
- Cada especificación se trabaja en su propia rama (la que crea Spec Kit, `NNN-nombre`) y se une a
  `main` en local cuando está verificada. Sin pull requests.

Por qué: el historial granular sirve para revisar y deshacer por piezas. Dos veces hubo que reescribir
commits que salieron firmados por el servidor o con Claude como colaborador.

### VI. Pasos manuales de uno en uno

- Si Luis debe hacer algo a mano (clics, instalaciones, pruebas), se le da UNA sola acción por
  pregunta, con el texto exacto de botones y menús.
- Excepción: los campos de un mismo formulario se dan en una sola lista corta, con una comprobación al
  final.
- Cada paso se verifica con herramientas propias antes de pedir el siguiente; nunca se asume que algo
  ocurrió.

### VII. Sin gastos

- Solo se usan herramientas, servicios y librerías gratuitas.
- Cualquier cosa que cueste dinero se le pregunta antes a Luis, junto con alternativas gratuitas.

### VIII. Sin subagentes salvo autorización

- No se lanzan subagentes (revisiones, investigaciones, trabajo en paralelo) salvo que Luis lo
  autorice para esa tarea concreta. Las tareas que Spec Kit marca como paralelas se ejecutan una tras
  otra.

Por qué: consumen muchos tokens y memoria del PC.

### IX. Conversación breve, documentos completos

- En la conversación, cada documento o resultado se le resume a Luis en pocas líneas, sin listas
  largas.
- Los documentos en sí son completos y detallados (principio XIX).

### X. Respaldo en GitHub

- El repositorio es privado y del equipo: `valenmgg/MacroReborn` (remoto `origin`).
- Se sube (`git push origin`) después de cada tarea terminada y siempre al cerrar la sesión. Las ramas
  de especificación también se suben.
- Subir a GitHub no es desplegar: desplegar sigue la regla XXI.

Por qué: el disco D: es un archivo dentro del mismo SSD que C:; sin una copia fuera del PC, un fallo
del disco lo borraría todo.

### XI. Simplicidad

- Se elige la solución más simple que cumpla la especificación; no se construye nada que no se haya
  pedido.
- La lógica compartida del servidor va en `api/_*.js`. Antes de escribir algo se busca si ya existe.
- Toda complejidad extra se justifica por escrito en el plan.

### XII. Terminado significa comprobado

- Una tarea solo está terminada cuando funciona, se comprobó (prueba automática, o prueba manual
  registrada como hecha o «Pendiente de probar»), `npm test` está en verde, su documentación está al
  día y tiene su commit.

### XIII. Nunca fallar en silencio

- El servidor deja constancia de lo que falla (`journalctl -u macroreborn`) y la web enseña errores
  claros en español que dicen qué hacer.
- Ningún error se traga, ni en el servidor ni en el navegador: un `catch` vacío es un error escondido
  (el punto 32 de `docs/listas/AUDITORIA.md` fue exactamente eso).

### XIV. La web no molesta

- Sin ventanas emergentes, sonidos, avisos ni permisos del navegador innecesarios.
- Si algo tiene que avisar, se usa el canal menos intrusivo: la campanita o un aviso dentro de la
  página.

### XV. Seguro

- NUNCA se suben a git contraseñas, tokens ni claves: van en archivos locales que git ignora.
- Todo lo que viaje por la red DEBE ir cifrado y autenticado.

### XVI. Privado

- Sin telemetría ni rastreadores de terceros en la web: ningún dato de la comunidad sale del servidor
  sin que el equipo lo decida.
- Los datos de la comunidad se tratan según la regla XXV.

### XVII. Todo reversible

- Todo cambio de la base va en una migración numerada de `migrations/` (la siguiente libre), probada en
  local, y se aplica antes que el código que la usa.
- Antes de cambiar datos reales hay respaldo completo y ensayo con ROLLBACK (regla XX).
- Un despliegue se deshace volviendo al commit anterior y reiniciando el servicio
  (`docs/guias/DESPLEGAR.md`).
- Las acciones irreversibles o de riesgo se le preguntan antes a Luis.

### XVIII. Medir antes de optimizar

- Toda optimización parte de mediciones reales, tomadas antes y después y anotadas en la
  documentación.

### XIX. Documentación exhaustiva guiada por especificaciones (SDD)

- La especificación es la fuente de verdad: ningún cambio se implementa sin su `spec.md`, `plan.md` y
  `tasks.md` aprobados, en `specs/NNN-nombre/`.
- Todo cambio pasa por Spec Kit. Los pequeños usan una «spec corta»: especificación, plan y tareas en
  una sola página, aprobados una vez.
- Única excepción: si la web está caída o perdiendo datos, se arregla primero y su spec corta se escribe
  justo después.
- Si el código cambia, la especificación y la documentación se actualizan en el mismo commit. Si el
  código y la especificación no coinciden, primero se corrige la especificación.
- `docs/` es la documentación del sistema (referencia, guías, listas e historia), y `specs/` guarda
  cada cambio con su especificación. Lo que una especificación cambia del sistema se lleva a su
  documento de `docs/`.
- Todo queda documentado en español: qué es (README), arquitectura, decisiones con su porqué y las
  alternativas descartadas, cómo instalar, cómo probar, cómo desplegar, cómo deshacer y qué cambió.
- Los comentarios del código explican el porqué, no el qué.

## Reglas específicas de MacroReborn

### XX. La base de producción es sagrada

- La base de producción solo se consulta en modo lectura
  (`PGOPTIONS="-c default_transaction_read_only=on"`).
- Cambiar datos reales (borrar, corregir o aplicar una migración) pide tres cosas: un respaldo completo
  antes, un ensayo dentro de una transacción con ROLLBACK y el OK explícito de Luis. Dónde quedó el
  respaldo se apunta en la documentación.

Por qué: es la única copia de las cuentas, el progreso y las monedas de la comunidad.

### XXI. Desplegar solo con el OK de Luis

- Se despliega desde `main` verificado, nunca desde una rama.
- El orden es: migraciones primero, después el código, reiniciar el servicio y comprobar en la web real
  (por ejemplo, con la API pública) que el cambio está y que nada se rompió.
- Cómo se hace está en `docs/guias/DESPLEGAR.md`, con su resumen en `CLAUDE.md`.

### XXII. Pruebas sin tocar lo real

- `npm test` corre contra la base de práctica PGlite, nunca contra la de producción ni contra la copia
  de `datos-locales/`.
- Todo cambio del servidor lleva su prueba. Las pruebas que cargan la API aíslan antes sus carpetas de
  datos con `tests/_aislar-datos.js`.
- Para unir una rama a `main`, `npm test` y la prueba HTTP de humo DEBEN estar en verde con la versión
  de Node del servidor y con la mínima que se admite. Las corre la integración continua
  (`.github/workflows/ci.yml`) cuando está encendida; mientras esté apagada, se corren en el PC con esas
  dos versiones, y la especificación lo anota en su comprobación. Si ya estaban en rojo por otra causa,
  se dice y esa causa tiene su propia especificación.

### XXIII. El servidor decide

- Monedas, XP, niveles, misiones, logros, permisos y sanciones los decide el servidor, nunca el
  navegador. Todo lo que llega del navegador se valida.
- El modelo es `api/_monedas.js`: una sola sentencia condicionada contra el `now()` de Postgres, en vez
  de contar peticiones.

### XXIV. Lo que no se rompe

- SQL siempre con parámetros (`api/_pg.js`). Nunca un `ORDER BY` ni un fragmento armado con lo que
  escribe el usuario.
- Todo lo que se pinta en la página pasa por su escape, y los nombres de usuario cumplen
  `api/_nombre-usuario.js`.
- Contraseñas solo con bcrypt (`api/_password.js`).
- La lista blanca de archivos estáticos se respeta: ninguna ruta sensible (`/.env`, `/.git/`,
  `/api/_*.js`) se sirve.
- La IP del administrador nunca se publica: `infra/` lleva el marcador `TU.IP.AQUI`.
- `infra/` refleja la configuración real del servidor; si algo cambia allí, se copia aquí.

### XXV. Los datos de la comunidad no salen

- La copia de producción (`datos-locales/`), la exportación de Discord (`sugerencias-discord/`) y la
  copia de la memoria de Claude (`memoria-claude/`) no entran en git.
- En conversaciones, documentos y commits no se pegan IPs enteras, correos, contraseñas ni datos
  personales: se cuentan o se tapan.

### XXVI. Sin servicios de terceros que puedan desaparecer

- No se depende de servicios externos que puedan cerrar o cambiar de precio; por eso se fueron Vercel,
  Neon y Pusher.
- Las librerías que corren dentro del VPS sí se permiten, elegidas por lo que cuesta mantenerlas: mejor
  sin binario nativo que con él, y mejor sin dependencias propias que con ellas.

### XXVII. Los cambios de otros devs se funden, no se copian

- Lo que manda otra persona (un zip, una rama) nunca se copia encima: se busca su base, se saca su diff y
  se funde a tres bandas, como cuenta `docs/guias/CAMBIOS-DE-OTROS-DEVS.md`.
- Entra como su propia especificación (una spec corta si es pequeño), diciendo qué no entró y por qué.

### XXVIII. Móvil y PC

- Gran parte de la comunidad entra desde el móvil: todo cambio de interfaz se mira en móvil y en PC
  antes de darlo por terminado, o queda «Pendiente de probar».

### XXIX. El arte no se publica

- Los dibujos de las prendas son del equipo de arte: los originales viven fuera de git y el sitio los
  sirve desde la base, con firma (`docs/referencia/ARTE.md`). Ningún cambio puede volver a dejarlos al alcance de
  cualquiera.

### XXX. Sin emojis

- Ni en el código, ni en la consola, ni en los commits, ni en la documentación nueva. Lo que ya existe
  no se toca.

### XXXI. Las listas vivas no se borran

- En `docs/listas/AUDITORIA.md`, `docs/listas/SUGERENCIAS.md` y cualquier otra lista numerada, las filas nunca se
  borran ni sus números se reutilizan. Lo resuelto se marca con su fecha y lo descartado, con su motivo.

### XXXII. El equipo

- Hoy Spec Kit lo usan Luis y Claude. Cómo se sumaría otro dev (instalar `specify`, abrir su asistente
  en la carpeta del proyecto y seguir esta constitución) lo explica `docs/guias/SUMARSE.md`, para que el
  resto del equipo pueda adoptarlo.
- El trabajo de otros que no pase por Spec Kit entra por la regla XXVII.

## Flujo de trabajo (Spec Kit)

Cada paso se anuncia antes, se resume después y ninguno se encadena con el siguiente sin el OK de Luis.

1. `/speckit-constitution`: las reglas del proyecto (este documento).
2. `/speckit-specify`: qué se quiere y por qué, sin hablar de tecnología. Crea la rama `NNN-nombre`.
3. `/speckit-clarify`: preguntas a Luis hasta que no queden dudas.
4. `/speckit-plan`: cómo se hará (tecnología, arquitectura, decisiones).
5. `/speckit-checklist` (opcional): comprobar que los requisitos estén completos.
6. `/speckit-tasks`: tareas pequeñas, cada una con su commit.
7. `/speckit-analyze`: comprobar que especificación, plan y tareas sean coherentes.
8. `/speckit-implement`: solo con la aprobación de Luis. Una tarea, un commit, un push.
9. Unir la rama a `main` cuando todo está verificado y las pruebas están en verde (regla XXII).
10. Desplegar solo si Luis lo pide (regla XXI).

## Gobierno

- Esta constitución está por encima de cualquier otra práctica del proyecto; toda especificación, plan
  y tarea DEBE cumplirla.
- Solo cambia con la aprobación explícita de Luis. Cada cambio sube la versión (MAJOR: se quita o
  redefine un principio; MINOR: un principio o una sección nueva; PATCH: aclaraciones) y anota la
  fecha.
- Las excepciones se justifican por escrito en el plan y Luis las aprueba.
- Las reglas propias del proyecto se pueden añadir o cambiar en cualquier momento con
  `/speckit-constitution`.

**Versión**: 1.0.3 | **Ratificada**: 2026-10-05 | **Última enmienda**: 2026-10-09
