# RETOMAR — cómo volver a trabajar tras formatear el PC

> **De qué trata:** lo que no está en el repositorio y dónde se guarda (la llave SSH, la memoria de
> Claude, el `.env`, los dibujos originales), qué hacer si se pierde la llave, dónde vive cada cosa,
> cómo levantar el entorno en un PC nuevo y lo que muerde si no se sabe.
>
> **Para quién:** Luis, tras formatear el PC o al cambiar de máquina.
>
> **Revisado:** 05/10/2026

Esto ya pasó una vez. En septiembre de 2026 se formateó la máquina y se
perdió todo rastro de cómo entrar al servidor: no había nada en local y
hubo que reconstruirlo desde Google Drive a ciegas. Este archivo existe
para que la segunda vez cueste quince minutos.

---

## 1. Lo que NO está en este repositorio

Guardar la carpeta del proyecto **no basta**. Estas cuatro cosas viven
fuera y hay que copiarlas aparte.

| Qué | Dónde está en el PC | ¿Dónde hay copia? |
|---|---|---|
| **La llave SSH del servidor** | `~/.ssh/macroreborn-vps-key` | En **Bitwarden**, elemento de tipo Clave SSH. [Ver abajo](#11-si-se-pierde-la-llave) |
| **La memoria y las conversaciones de Claude Code** | `~/.claude/projects/<carpeta>/` | Sí: copiado entero en `memoria-claude/` de esta misma carpeta (fuera de git a propósito) |
| **El `.env` del proyecto** | Solo en el servidor, en `~/MacroReborn/.env` | No hace falta copiarlo: se lee desde allí |
| **Los dibujos originales de las prendas** | `imagenes/<modelo>/` y `imagenes/<modelo>.png`, fuera de git desde el 21/09/2026 | Cuatro copias: la base de datos del servidor (`avatar_archivos`, que es lo que sirve el sitio) con su respaldo diario, esta misma carpeta, la copia de Drive, y el `~/respaldos/arte-originales-imagenes-2026-09-21.tar.gz` del servidor |

### 1.1 Si se pierde la llave

Se perdió dos veces en septiembre de 2026, y las dos porque vivía fuera de la carpeta que se copia:
lo que viaja bien es lo que está dentro. Lo cuenta [LA LLAVE SSH](../historia/LLAVE-SSH.md).

**Cómo recuperar el acceso.** El sitio sigue funcionando solo; lo que se
pierde es administrarlo y desplegar. Se recupera por Azure:

1. Generar un par nuevo:
   `ssh-keygen -t ed25519 -f ~/.ssh/macroreborn-vps-key`
2. Portal de Azure → la máquina virtual (`macroreborn-vps`) → **Ayuda** →
   **Restablecer contraseña** → modo **Restablecer clave pública SSH**,
   usuario `azureuser`, y pegar el contenido del `.pub`.
3. O por línea de comandos:
   `az vm user update -u azureuser --ssh-key-value <ruta a la .pub> -g <grupo> -n <vm>`

**Ojo: Azure AÑADE la clave, no reemplaza.** Después hay que quitar a
mano la vieja de `~/.ssh/authorized_keys`, o el servidor sigue aceptando
una llave cuyo paradero se desconoce.

### 1.2 Dónde vive ahora la llave, y por qué ahí

En **Bitwarden**, como elemento de tipo Clave SSH. No en una carpeta de
Drive, que es lo que falló las dos veces.

El razonamiento, por si hay que rehacerlo:

- **La cuenta de Azure es el respaldo de verdad.** Mientras se controle
  esa cuenta, siempre se puede recuperar el acceso, se pierda la llave
  que se pierda. Lo crítico que hay que custodiar es esa cuenta con su
  segundo factor; la llave SSH es una comodidad.
- **La llave en Bitwarden** es la comodidad. Si el PC arde, se saca
  desde el móvil. Bitwarden puede además hacer de agente SSH, y entonces
  la clave privada ni siquiera necesita estar en el disco.
- **Una segunda llave autorizada** en otro equipo hace que perder una
  deje de ser un problema. Es gratis.

Lo que **no** hay que volver a hacer es dejarla suelta en una carpeta de
Drive. Falló dos veces por el mismo motivo: la carpeta se movió y la
ruta anotada envejeció antes que el olvido.

### 1.3 La memoria de Claude Code

Vive en `~/.claude/projects/<carpeta>/`, y tiene copia en `memoria-claude/`, en la carpeta del
proyecto y fuera de git. Ahí dentro hay dos cosas distintas, y las dos viven fuera del proyecto:

- **`memory/`**: lo aprendido del proyecto (cómo entrar al servidor, por
  qué `fail2ban` está apagado, qué protege de verdad el plan del arte,
  cómo firmar los commits): 16 memorias y 80 kB el 05/10/2026. Es lo
  más barato de salvar y lo más caro de perder: es lo que hace que una
  sesión nueva sepa de qué va esto sin contárselo todo otra vez.
- **Las conversaciones**: las sesiones completas en `.jsonl` (once y
  153 MB en la copia del 21/09/2026). Útiles para consultar qué se
  decidió y por qué, aunque no se cargan solas.

`memoria-claude/LEEME.md` explica cuál es cuál, cómo devolverlas a su
sitio y cómo refrescar la copia. **No se actualiza sola**, así que
conviene rehacerla antes de volver a formatear, y con la sesión cerrada
para que la conversación en curso esté completa.

### 1.4 Lo que no conviene subir a Drive

En la carpeta del proyecto hay dos cosas que **no** conviene subir a
Drive tal cual:

- `datos-locales/` — la copia de la base de producción. Lleva las
  cuentas, los comentarios y los mensajes de las personas del sitio.
  Decide a conciencia si eso va a Drive. Se puede volver a bajar en
  cualquier momento con `npm run db:traer`.
- `node_modules/` — 50 MB el 05/10/2026, regenerables con `npm install`. Copiarlo solo
  hace la sincronización más lenta.

## 2. Dónde vive cada cosa

Lo general (el sitio, el servidor, la ruta del proyecto en él, el repositorio, la base y los
respaldos) está en [ARQUITECTURA](../referencia/ARQUITECTURA.md#dónde-vive-cada-cosa), y la máquina
entera, en [VPS](../referencia/VPS.md). Aquí, lo que hace falta para volver a montar el PC:

| | |
|---|---|
| La IP del servidor | En Bitwarden, y en el remoto `vps` (`git remote -v`) |
| Entrar | `ssh -i ~/.ssh/macroreborn-vps-key azureuser@macroreborn.com` |
| Ruta del proyecto en el PC | `D:\Macroreborn`, desde el 19/09/2026 |
| Copia en Drive | `G:\Mi unidad\01_Proyectos_Software\Proyectos de código\Macroreborn\` (desde el 19/09/2026; antes `02_Proyectos_Software\...`) |

## 3. Levantar el entorno en un PC nuevo

```bash
git clone git@github.com:valenmgg/MacroReborn.git
cd MacroReborn
npm install
npm test            # unas 1.300 pruebas, ~1 min, no tocan nada real
npm run db:traer    # baja una copia de la base de produccion
npm run db:local    # sitio local en http://localhost:3001
```

Y sacar la llave SSH de Bitwarden a `~/.ssh/macroreborn-vps-key`, que es lo
que da acceso al servidor.

Un clon de GitHub viene sin las prendas: `imagenes/<modelo>/` y
`imagenes/<modelo>.png` están fuera de git desde el 21/09/2026. El sitio
no las echa en falta, porque las sirve desde la base y `npm run db:traer`
trae esa base entera. Si hacen falta los originales, están en la copia
de Drive.

**Ojo con dos cosas al configurar git:**

- La identidad tiene que ser la de la regla V de la constitución, autor
  y committer. El 15/09/2026
  aparecieron 17 commits firmados como `Ubuntu <azureuser@...>` porque
  el servidor no tenía identidad configurada, y el 18/09 otros 8 salieron
  con un correo distinto. Las dos veces hubo que reescribir el historial.
- El remoto `vps` **no lleva la llave configurada**. Hay que pasársela:

```bash
GIT_SSH_COMMAND='ssh -i "<ruta de la llave>"' git push vps main
```

Y para empujar a GitHub por HTTPS: la primera vez salta el inicio de
sesión en el navegador, y el gestor de credenciales de git guarda el
token en Windows. Tiene que ser una cuenta con permiso de escritura en
`valenmgg/MacroReborn`; como el repositorio es privado, sin acceso
tampoco se puede clonar.

## 4. Desplegar un cambio

Lo explica entero [DESPLEGAR](DESPLEGAR.md).

---

## 5. En qué punto está el trabajo

El 18 de septiembre de 2026 se hizo una auditoría completa del proyecto:
catorce revisiones en paralelo más una del servidor en vivo. Salieron 74
cosas por arreglar, y están todas en **`docs/listas/AUDITORIA.md`**, ordenadas
por importancia y con una columna de estado para ir marcándolas.

De las catorce urgentes del bloque 1, **once están hechas** (2, 3, 4, 5,
7, 8, 9, 10, 11, 13 y 14): tres XSS almacenados, tres agujeros de
autorización, el proceso que se podía tumbar con una URL, la barra de
más que sacaba el arte, los commits publicados en GitHub, las prendas
fuera del árbol del repositorio, y el buzón que cualquiera leía en vivo
por `/api/avisos`.

**Quedan tres, y este es el orden que tenía sentido:**

| # | Qué falta | Notas |
|---|---|---|
| 6 | Poner una `Content-Security-Policy` en nginx | Empezar en `Report-Only` para ver qué rompe |
| 1 | `sandbox` en el iframe de los juegos | Hay que probar juego por juego; algunos perderán su guardado local |
| 12 | Versión de sesión en el token | Decidido: **hay que cerrar todas las sesiones**. Migración nueva |
| 75 | Sacar las prendas del historial de GitHub | **Descartado** el 21/09/2026: se acepta que el arte anterior a esa fecha siga en el historial |

**Aparte de la auditoría, hay un trabajo a medias:** que el servidor
componga los avatares y deje de repartir las prendas sueltas. Está en
`docs/referencia/AVATARES.md`, y su tabla de fases (punto 5) dice cuáles
están hechas y cuál toca.

## 6. Lo que muerde si no se sabe

- **`migrations/` no puede reconstruir el sitio**: ninguna migración crea
  la tabla `users` (punto 67 de [AUDITORIA](../listas/AUDITORIA.md)). Hoy la única forma de rehacer la base es
  un volcado de `pg_dump`.
- **Los respaldos viven en la misma máquina que protegen.** Conviene
  bajarse uno a otro sitio de vez en cuando.

Las del servidor, `fail2ban` apagado con la IP del administrador en `ignoreip` y la base que ya no
cabe en `shared_buffers`, están en [VPS](../referencia/VPS.md#8-seguridad-y-rendimiento).
