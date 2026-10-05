# Contrato: la prueba de la documentación

`tests/documentacion.test.js`: la prueba permanente de RF-016. Corre con `npm test` y, por tanto, en
la integración continua (Node 20 y 22). Las decisiones que hay detrás están en
[research.md](../research.md), D5.

## Cómo está hecha

- Estilo de las demás pruebas: CommonJS, `node:test`, `node:assert`, una cabecera de comentario con
  el título, el porqué y «Correr: npm test».
- Solo módulos de Node (`fs`, `path`). No usa git ni la red.
- Recorre el repositorio desde la raíz y se salta `node_modules/`, todo lo que el `.gitignore` deja
  fuera (se leen sus líneas: carpetas, archivos y patrones con `*`) y las carpetas que empiezan por
  punto (`.git/`, `.claude/`, `.specify/`, `.github/`): son herramientas, y sus plantillas llevan
  enlaces de ejemplo. De ellas solo mira la constitución (`.specify/memory/constitution.md`). Los
  archivos de la raíz que empiezan por punto, como el `.gitignore`, sí se miran.
- **Documentación**: todo `.md`. **Texto**: los `.md`, `.js`, `.json`, `.html`, `.css`, `.sql`,
  `.sh`, `.conf`, `.service`, `.txt`, `.yml`, `.local`, `.ps1` y el `.gitignore`.
- Tarda menos de un segundo.

## Qué comprueba

| # | Qué | Dónde mira | Qué exige |
|---|---|---|---|
| 1 | Enlaces de Markdown relativos `[texto](destino)` | Todo `.md`, incluido `specs/`, fuera de bloques de código y de texto entre comillas invertidas | El destino existe (archivo o carpeta), resuelto desde la carpeta del documento; si lleva `#ancla`, el título existe en el destino |
| 2 | Menciones `docs/...md`, con ancla o sin ella | Todo archivo de texto, salvo `specs/` | El documento existe, desde la raíz; si lleva `#ancla`, el título también |
| 3 | Rutas del repositorio entre comillas invertidas | Documentación fuera de `docs/historia/` y `specs/` | Existe, desde la raíz o desde la carpeta del documento |
| 4 | Comandos `npm test` y `npm run X` entre comillas invertidas | La misma que la 3 | El script está en `package.json` |
| 5 | El índice | `README.md` y `docs/` | Cada `.md` de `docs/` está enlazado desde el `README.md` |
| 6 | La cabecera | `docs/` | Cada `.md` empieza por un título `# ` y las líneas `> **De qué trata:**`, `> **Para quién:**` y `> **Revisado:** DD/MM/AAAA` |

Las comprobaciones 1 a 4 entran al principio, antes de mover nada. La 5 y la 6 se activan al final,
cuando el índice y las cabeceras estén hechos ([research.md](../research.md), D5).

## Qué es una ruta (comprobación 3)

Un texto entre comillas invertidas cuya primera parte es una carpeta de la raíz del repositorio
(`api/`, `js/`, `docs/`...) o un archivo de la raíz con extensión (`server.js`, `package.json`).
Antes de comprobarla se le quitan el número de línea (`js/amigos.js:212`), la consulta
(`js/core.js?v=20260918`) y la puntuación final.

**No cuentan**, y no fallan:

- las URL y las rutas del servidor (empiezan por `/` o por `~`);
- los patrones y marcadores: con `*`, `<`, `>`, `{`, `}` o espacios, y las plantillas como
  `specs/NNN-nombre/`;
- lo que el `.gitignore` deja fuera a propósito (`datos-locales/...`, `memoria-claude/...`).

## Las anclas

Se calculan como GitHub: el título en minúsculas, sin los signos que no son letras, números, espacios,
guiones ni guiones bajos (tildes y eñes se quedan), con los espacios cambiados por guiones; si dos
títulos dan la misma, la segunda lleva `-1`, la tercera `-2`... Así,
`## 8. Probar contra los datos de verdad` da `#8-probar-contra-los-datos-de-verdad`.

## Cómo falla

Cada fallo dice qué archivo, qué línea, qué falta y qué hacer, en español (regla XIII). Por ejemplo:

```text
docs/guias/SUMARSE.md:40 enlaza ../referencia/VPS.md#respaldos, pero VPS.md no tiene ese título.
Corrige el ancla o el título.
```

La prueba junta todos los fallos de una comprobación y los enseña de una vez, en vez de parar en el
primero.

## Lo que no hace

- No sigue enlaces de fuera (no hay red en las pruebas).
- No comprueba los «punto N» de las listas: sus números no cambian nunca (regla XXXI).
- No busca emojis ni datos sensibles: se miran a mano al terminar ([quickstart.md](../quickstart.md)).
- No tiene una lista de excepciones. Si algo legítimo falla, se cambia el texto (por ejemplo, se nombra
  el archivo sin carpeta) o se mueve a historia, en vez de abrirle un hueco a la prueba.
