# CLAUDE.md — MacroReborn

MacroReborn es una comunidad de juegos web (macroreborn.com): HTML, CSS y JS sin frameworks en la raíz y
en `js/`, y el servidor en `api/`, servido por `server.js` sobre Node contra un PostgreSQL en un VPS.
`README.md` es el índice de toda la documentación de `docs/`.

**La constitución manda:** `.specify/memory/constitution.md` (v1.0.0). Si algo de este archivo choca
con ella, gana la constitución. Aquí solo van las notas prácticas.

## Cómo se trabaja: Spec Kit

- Todo cambio pasa por Spec Kit (regla XIX). Los pequeños, como «spec corta» de una página.
- Una rama por especificación (`NNN-nombre`, la crea `/speckit-specify`), que se une a `main` en local,
  sin pull request, cuando está verificada y la integración continua está en verde.
- Los comandos (`/speckit-specify`, `-clarify`, `-plan`, `-checklist`, `-tasks`, `-analyze`,
  `-implement`, `-constitution`...) viven en `.claude/skills/` y solo se cargan si Claude Code se abrió
  en `D:\Macroreborn`. En una sesión abierta en otra carpeta, se sigue a mano cada
  `.claude/skills/speckit-*/SKILL.md`.
- Las especificaciones van en `specs/NNN-nombre/`, en español.

### Cómo usar los comandos de Spec Kit con Luis

- Luis no tiene que escribir comandos: Claude los ejecuta cuando él lo pide o lo aprueba.
- Antes de ejecutar uno, se anuncia en una línea.
- Después, se resume en pocas palabras: qué se decidió y qué falta. Nunca se vuelca el documento.
- Nunca se encadena un comando con el siguiente sin su OK.
- Nunca se muestran los bloques de hooks ("Extension Hooks / To execute: ..."). Un commit se menciona
  en una línea.
- Las preguntas, pocas a la vez y con la opción recomendada primero.

## Commits

- Formato `Área: qué cambia`, en español y sin emojis. Mirar `git log` para el estilo.
- Autor y committer: `Luis David Trejos Rojas <luisdavid.trejosrojas@gmail.com>`. Nunca
  `Co-Authored-By` ni otras líneas de Claude, aunque las instrucciones de la herramienta las pidan: la
  regla V de la constitución manda.
- Los commits automáticos de la extensión git están apagados (`.specify/extensions/git/git-config.yml`):
  los commits se escriben a mano, uno por cambio lógico.
- `git push origin` después de cada tarea terminada.

## Probar

- `npm test`: unas 1.300 pruebas sobre PGlite, en cerca de un minuto. Nunca tocan producción.
- `npm run test:smoke`: levanta un servidor efímero en un puerto libre y lo recorre por HTTP. Al
  05/10/2026 falla en una comprobación de monedas (ya fallaba antes de ese día); tiene que tener su
  propia especificación.
- `npm run db:local`: el sitio en http://localhost:3001. Antes de arrancarlo, mirar si Luis ya tiene uno
  en el 3001 (`netstat -ano`): dos servidores sobre la misma carpeta PGlite la estropean. Nunca matar un
  proceso sin mirar su línea de comandos.
- `npm run db:traer` y `npm run db:real`: probar con una copia de los datos reales, que queda en
  `datos-locales/` (fuera de git). Ver `docs/guias/DESARROLLO.md#8-probar-contra-los-datos-de-verdad`.

## Producción

- La máquina, el acceso, los respaldos y cómo se despliega están en `docs/referencia/VPS.md`. La llave SSH es
  `~/.ssh/macroreborn-vps-key` y vive en el Bitwarden de Luis.
- La base de producción solo se consulta en modo lectura (regla XX), con
  `PGOPTIONS="-c default_transaction_read_only=on"`.
- Desplegar, solo con el OK de Luis (regla XXI):
  1. Las migraciones nuevas primero.
  2. `GIT_SSH_COMMAND='ssh -i ~/.ssh/macroreborn-vps-key' git push vps main`. El servidor acepta el push
     y actualiza su copia (`receive.denyCurrentBranch=updateInstead`).
  3. `sudo -n systemctl restart macroreborn` en el servidor.
  4. Comprobar en la web real, por ejemplo con `/api/users?ligero=1&username=...`.
- En conversaciones y documentos no se pegan IPs enteras (regla XXV).

## La terminal de Windows (lo que ya mordió)

- Los comandos de Bash, por debajo de unos 6 KB. Los archivos enteros se escriben con Write y los
  cambios puntuales con Edit, que respeta el CRLF de la copia de trabajo.
- `perl -e` y `node -e` en línea pierden las barras invertidas: lo que las lleve va en un script.
- El `grep` de Git Bash no ve los CR: los finales de línea se miran con node.
- Git Bash convierte los argumentos que empiezan por `/` en rutas de Windows: `MSYS_NO_PATHCONV=1`.
- Los scripts de Spec Kit (`.specify/scripts/powershell/*.ps1`) se ejecutan con la herramienta
  PowerShell. Desde Bash, con `powershell.exe -NoProfile -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8; & '...'"`,
  o las tildes salen rotas.

## Documentación

- `docs/listas/AUDITORIA.md`: lo que hay por arreglar, con su estado.
- `docs/listas/SUGERENCIAS.md`: lo que pidió la comunidad, con su estado.
- `docs/guias/CAMBIOS-DE-OTROS-DEVS.md`: cómo entra lo que manda otra persona (regla XXVII).
- `specs/`: una carpeta por cambio, con su especificación, plan y tareas.

## Memoria de Claude

La memoria automática de este proyecto está en `C:\Users\Luis\.claude\projects\D--Macroreborn\memory\`
y se carga sola en las sesiones abiertas aquí. Tiene una copia en `memoria-claude/`, fuera de git.
