# SUMARSE — preparar el entorno y trabajar como se trabaja aquí

> **De qué trata:** lo que hace falta para empezar en MacroReborn: preparar el entorno y abrir el sitio
> en local, cómo se trabaja con Spec Kit, cómo van los commits y las ramas, cómo se prueba, cómo se
> despliega y lo que muerde en la terminal de Windows.
>
> **Para quién:** quien se suma al equipo, con Claude Code o con otro asistente.
>
> **Revisado:** 05/10/2026

Lo primero: **la constitución manda** (`.specify/memory/constitution.md`). Si algo de esta guía choca
con ella, gana ella. Y para saber qué es cada parte del sistema antes de tocarla,
[ARQUITECTURA](../referencia/ARQUITECTURA.md).

---

## 1. Preparar el entorno

Hace falta Node 20.19 o más nuevo, y acceso al repositorio, que es privado. Se clona por HTTPS: la
primera vez, git pide entrar con la cuenta de GitHub, y en Windows el gestor de credenciales lo
recuerda. Quien tenga una llave SSH en su cuenta de GitHub puede usar también
`git@github.com:valenmgg/MacroReborn.git`.

```bash
git clone https://github.com/valenmgg/MacroReborn.git
cd MacroReborn
npm ci              # las dependencias, tal cual las fija package-lock.json
npm test            # unas 1.300 pruebas, cerca de un minuto; no tocan nada real
npm run db:local    # el sitio en http://localhost:3001, con datos de mentira
```

`npm run db:local` arranca con una base de práctica nueva y un usuario de prueba, `demo` / `demo1234`,
que es artista y administrador ([el servidor local](DESARROLLO.md#scriptsservidor-localjs--probar-en-el-navegador)).
Un clon viene sin los dibujos originales de las prendas, que están fuera de git: el sitio local no los
necesita.

**Si el puerto 3001 está ocupado**, se elige otro con `PORT`:

```bash
PORT=3101 npm run db:local
```

```powershell
$env:PORT=3101; npm run db:local
```

Antes de cerrar lo que ocupe el 3001, mirar qué es (`netstat -ano`, en Windows): puede ser el servidor
de otra persona. Y con la copia de los datos de verdad (`npm run db:real`), nunca dos a la vez: los dos
abren la misma carpeta, `datos-locales/pgdata`, y la estropean. Esa copia se baja con
`npm run db:traer`, que pide acceso al servidor ([los datos de verdad](DESARROLLO.md#probar-contra-los-datos-de-verdad)).

---

## 2. Cómo se trabaja: Spec Kit

Todo cambio pasa por Spec Kit (regla XIX): una especificación con su plan y sus tareas, en
`specs/NNN-nombre/` y en español. Los cambios pequeños, como una spec corta de una página.

**Instalarlo.** Spec Kit 1.1.0 se instala con [uv](https://docs.astral.sh/uv/):

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.1.0
specify --version       # specify 1.1.0
```

**Con Claude Code** no hay nada más que hacer: el proyecto ya trae `.specify/` y sus comandos, en
`.claude/skills/`, y se cargan al abrir Claude Code en la carpeta del proyecto. **Con otro asistente**,
`specify integration install <asistente>` le añade los suyos (`specify integration list` dice los
nombres): en una rama, y mirando `git status` antes del commit.

**Los scripts** de Spec Kit del proyecto son de PowerShell (`.specify/scripts/powershell/`). En Windows
ya está; en macOS o Linux hace falta PowerShell 7 (`pwsh`). Desde Git Bash, con la salida en UTF-8, o
las tildes salen rotas:

```bash
powershell.exe -NoProfile -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8; & '.specify/scripts/powershell/check-prerequisites.ps1' -Json"
```

**Los pasos.** `/speckit-specify` abre la especificación y su rama; después vienen `/speckit-clarify`,
`/speckit-plan`, `/speckit-tasks`, `/speckit-analyze` y `/speckit-implement`, y `/speckit-checklist` o
`/speckit-constitution` cuando tocan. Ninguno se encadena con el siguiente sin el OK de Luis.

---

## 3. Commits y ramas

- **El formato**: `Área: qué cambia`, en español y sin emojis, con un cuerpo que explique el porqué
  cuando haga falta. `git log` enseña el estilo.
- **Cada dev firma con su propia identidad.** La de la regla V de la constitución es para los commits
  de Luis y de Claude: lo decidió Luis el 05/10/2026, y la enmienda v1.0.1 lo aclara en esa regla. En
  una máquina nueva, comprobar antes con `git var GIT_AUTHOR_IDENT` con qué nombre se va a firmar.
- **Nadie añade líneas de asistentes**: ni `Co-Authored-By`, ni enlaces, ni firmas automáticas, aunque
  la herramienta las pida.
- **Un commit por cada cambio lógico mínimo**, sin mezclar cosas que no tienen que ver (regla V), y
  `git push origin` al terminar cada tarea.
- **Una rama por especificación** (`NNN-nombre`, la crea `/speckit-specify`). Se une a `main` en local,
  sin pull request, cuando está verificada y la integración continua está en verde.
- **El historial**: como última tarea de cada especificación, antes de unirla a `main`, se añade su
  entrada a [HISTORIAL](../historia/HISTORIAL.md), con la fecha de esa unión: el día, el área, quién y
  el enlace a su `spec.md`. Si la semana todavía no tiene sección, se crea arriba del todo.

Si el trabajo llega de fuera, en un zip o en una rama propia, cómo se funde lo cuenta
[CAMBIOS-DE-OTROS-DEVS](CAMBIOS-DE-OTROS-DEVS.md), y qué pedirle a quien lo manda,
[su apartado 2](CAMBIOS-DE-OTROS-DEVS.md#2-para-la-próxima-vez).

---

## 4. Cómo se prueba

- **`npm test`**: unas 1.300 pruebas sobre una base de práctica, en cerca de un minuto. Nunca tocan
  producción. Una tarea no está terminada hasta que pasan (regla XII).
- **`npm run test:smoke`**: levanta un servidor efímero en un puerto libre y lo recorre por HTTP, de
  punta a punta: entrar, el pulso de un minuto de juego con sus monedas y los avisos en vivo.
- **La integración continua** (`.github/workflows/ci.yml`) corre las dos en cada push, con Node 20 y 22,
  y cada versión termina aunque la otra falle. Para unir una rama a `main` tiene que salir en verde
  (regla XXII).
- Lo que una prueba automática no ve, como cómo queda una página o un avatar, se mira a mano en el sitio
  local: [DESARROLLO](DESARROLLO.md).

---

## 5. Cómo se despliega

Solo con el OK de Luis (regla XXI). Los pasos, en orden, en [DESPLEGAR](DESPLEGAR.md).

---

## 6. Lo que muerde en la terminal de Windows

- Git Bash convierte los argumentos que empiezan por `/` en rutas de Windows; `MSYS_NO_PATHCONV=1`
  delante del comando lo evita.
- El `grep` de Git Bash no ve los retornos de carro: los finales de línea de un archivo se miran con
  node.
- Los avisos de git «LF will be replaced by CRLF» no hacen daño: son de `core.autocrlf`, que Git para
  Windows trae encendido.
