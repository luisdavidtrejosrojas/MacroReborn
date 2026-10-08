// ==============================
// LA DOCUMENTACIÓN NO CITA NADA QUE NO EXISTA — tests/documentacion.test.js
// ==============================
// La documentación se cita desde muchos sitios: los documentos entre sí,
// los comentarios del código, la constitución, el CLAUDE.md. Cuando un
// documento se muda o un título cambia, esas citas se rompen sin que nadie
// lo vea, y quien las sigue acaba buscando algo que ya no está. Esto lo
// vigila en cada cambio (RF-016 de specs/001-reordenar-documentacion/spec.md;
// el detalle, en su contracts/prueba-documentacion.md):
//
//   1. Los enlaces de Markdown relativos llevan a algo que existe y, si
//      apuntan a un título, el título también.
//   2. Las menciones a un documento de docs/ desde cualquier archivo de
//      texto, igual.
//   3. Las rutas del repositorio que cita la documentación existen.
//   4. Los comandos de npm que cita la documentación existen.
//   5. Cada documento de docs/ está en el índice del README.md, que es la
//      entrada: lo que no está ahí no lo encuentra nadie.
//   6. Cada documento de docs/ empieza por su cabecera: el título, de qué
//      trata, para quién es y cuándo se revisó.
//
// specs/ y docs/historia/ se libran de la 3 y la 4, y specs/ también de las
// menciones de texto de la 2: cuentan el pasado, y es normal que nombren lo
// que ya no está. Las carpetas de herramientas que empiezan por punto
// (.claude/, .specify/...) no se recorren, salvo la constitución. Lo que el
// .gitignore deja fuera a propósito no cuenta como roto.
//
// Correr:  npm test

const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
const CONSTITUCION = ".specify/memory/constitution.md";

const leer = (ruta) => fs.readFileSync(path.join(RAIZ, ruta), "utf8");
const existe = (ruta) => fs.existsSync(path.join(RAIZ, ruta));

// Lo que el .gitignore deja fuera. Sin barra en medio, git busca el patrón a
// cualquier profundidad; con ella, desde la raíz.
const IGNORADOS = leer(".gitignore")
  .split(/\r?\n/)
  .map((linea) => linea.trim())
  .filter((linea) => linea && !linea.startsWith("#") && !linea.startsWith("!"))
  .map((patron) => {
    const limpio = patron.replace(/^\//, "").replace(/\/$/, "");
    const cuerpo = limpio.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
    const desdeLaRaiz = patron.startsWith("/") || limpio.includes("/");
    return new RegExp((desdeLaRaiz ? "^" : "(^|/)") + cuerpo + "(/|$)");
  });
const ignorado = (ruta) => IGNORADOS.some((patron) => patron.test(ruta));

function recorrer(carpeta, relativa) {
  const archivos = [];
  for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = relativa ? `${relativa}/${entrada.name}` : entrada.name;
    if (ignorado(ruta)) continue;
    if (entrada.isDirectory()) {
      if (entrada.name.startsWith(".") || entrada.name === "node_modules") continue;
      archivos.push(...recorrer(path.join(carpeta, entrada.name), ruta));
    } else {
      archivos.push(ruta);
    }
  }
  return archivos;
}

const EXTENSIONES_DE_TEXTO = new Set([
  ".md", ".js", ".json", ".html", ".css", ".sql", ".sh",
  ".conf", ".service", ".txt", ".yml", ".yaml", ".local", ".ps1"
]);
// package-lock.json lo escribe npm: ni cita documentos ni lo toca nadie.
const TEXTOS = [...recorrer(RAIZ, ""), CONSTITUCION].filter((ruta) =>
  ruta !== "package-lock.json" &&
  (ruta === ".gitignore" || EXTENSIONES_DE_TEXTO.has(path.extname(ruta))));
const DOCUMENTACION = TEXTOS.filter((ruta) => ruta.endsWith(".md"));
const cuentaElPasado = (ruta) => ruta.startsWith("specs/") || ruta.startsWith("docs/historia/");

// Cada línea de un .md, marcada si va dentro de un bloque de código: ahí los
// enlaces y los títulos son ejemplos, no de verdad.
function lineasDeMarkdown(texto) {
  let valla = null;
  return texto.split(/\r?\n/).map((linea, i) => {
    const marca = /^\s*(`{3,}|~{3,})/.exec(linea);
    if (marca && (!valla || marca[1][0] === valla)) {
      valla = valla ? null : marca[1][0];
      return { numero: i + 1, linea, enCodigo: true };
    }
    return { numero: i + 1, linea, enCodigo: valla !== null };
  });
}

// Las anclas de los títulos, como las calcula GitHub: en minúsculas, sin
// signos (las tildes y las eñes se quedan), un guion por cada espacio, y -1,
// -2... cuando un título se repite.
const anclasYaVistas = new Map();
function anclasDe(ruta) {
  if (anclasYaVistas.has(ruta)) return anclasYaVistas.get(ruta);
  const repetidas = new Map();
  const anclas = new Set();
  for (const { linea, enCodigo } of lineasDeMarkdown(leer(ruta))) {
    const titulo = !enCodigo && /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(linea);
    if (!titulo) continue;
    const base = titulo[1]
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
      .replace(/\s/g, "-");
    const veces = repetidas.get(base) || 0;
    repetidas.set(base, veces + 1);
    anclas.add(veces ? `${base}-${veces}` : base);
  }
  anclasYaVistas.set(ruta, anclas);
  return anclas;
}

const ENLACE = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

function enlacesRotos() {
  const fallos = [];
  for (const documento of DOCUMENTACION) {
    for (const { numero, linea, enCodigo } of lineasDeMarkdown(leer(documento))) {
      if (enCodigo) continue;
      for (const [, destino] of linea.replace(/`[^`]*`/g, "").matchAll(ENLACE)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(destino)) continue;
        const [ruta, ancla] = destino.split("#");
        const objetivo = ruta
          ? path.posix.normalize(path.posix.join(path.posix.dirname(documento), decodeURI(ruta)))
          : documento;
        if (ignorado(objetivo.replace(/\/$/, ""))) continue;
        if (!existe(objetivo)) {
          fallos.push(`${documento}:${numero} enlaza ${destino}, que no existe: corregir la ruta.`);
        } else if (ancla && objetivo.endsWith(".md") && !anclasDe(objetivo).has(decodeURIComponent(ancla))) {
          fallos.push(`${documento}:${numero} enlaza ${destino}, pero ${objetivo} no tiene ese título: corregir el ancla o el título.`);
        }
      }
    }
  }
  return fallos;
}

const MENCION = /(?<![\w./-])docs\/[\w/-]+\.md(?:#[\p{L}\p{N}\p{M}_-]+)?/gu;

function mencionesRotas() {
  const fallos = [];
  for (const archivo of TEXTOS) {
    if (archivo.startsWith("specs/")) continue;
    leer(archivo).split(/\r?\n/).forEach((linea, i) => {
      for (const [mencion] of linea.matchAll(MENCION)) {
        const [ruta, ancla] = mencion.split("#");
        if (!existe(ruta)) {
          fallos.push(`${archivo}:${i + 1} cita ${ruta}, que no existe: poner la ruta de ahora.`);
        } else if (ancla && !anclasDe(ruta).has(ancla)) {
          fallos.push(`${archivo}:${i + 1} cita ${mencion}, pero ${ruta} no tiene ese título: corregir el ancla.`);
        }
      }
    });
  }
  return fallos;
}

const RAICES = new Set(fs.readdirSync(RAIZ));

// Si lo que va entre comillas invertidas es una ruta del repositorio, la
// devuelve limpia; si es otra cosa (código, una URL, un patrón), null.
function rutaCitada(cita) {
  let ruta = cita.trim();
  if (/[\s*<>{}]/.test(ruta) || /^[/~]/.test(ruta) || /^[a-z]+:/i.test(ruta)) return null;
  if (/\bNNN\b/.test(ruta)) return null;
  ruta = ruta.replace(/[?#].*$/, "").replace(/:\d+(-\d+)?$/, "").replace(/[),.;:]+$/, "");
  const esRuta = ruta.includes("/")
    ? RAICES.has(ruta.split("/")[0])
    : RAICES.has(ruta) && /\.\w+$/.test(ruta);
  if (!esRuta || ignorado(ruta.replace(/\/$/, ""))) return null;
  return ruta;
}

function rutasRotas() {
  const fallos = [];
  for (const documento of DOCUMENTACION) {
    if (cuentaElPasado(documento)) continue;
    for (const { numero, linea, enCodigo } of lineasDeMarkdown(leer(documento))) {
      if (enCodigo) continue;
      for (const [, cita] of linea.matchAll(/`([^`]+)`/g)) {
        const ruta = rutaCitada(cita);
        if (ruta && !existe(ruta) && !existe(path.posix.join(path.posix.dirname(documento), ruta))) {
          fallos.push(`${documento}:${numero} cita \`${cita}\`, que no existe: corregir la ruta o, si el archivo ya no está, nombrarlo sin carpeta.`);
        }
      }
    }
  }
  return fallos;
}

const SCRIPTS = new Set(Object.keys(JSON.parse(leer("package.json")).scripts));

function comandosRotos() {
  const fallos = [];
  for (const documento of DOCUMENTACION) {
    if (cuentaElPasado(documento)) continue;
    for (const { numero, linea, enCodigo } of lineasDeMarkdown(leer(documento))) {
      const codigo = enCodigo ? [linea] : [...linea.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      for (const trozo of codigo) {
        for (const m of trozo.matchAll(/\bnpm\s+(?:run(?:-script)?\s+([\w:.-]+)|(test)\b)/g)) {
          const script = m[1] || m[2];
          if (!SCRIPTS.has(script)) {
            fallos.push(`${documento}:${numero} cita npm ${m[1] ? "run " : ""}${script}, que no está en package.json: corregir el comando.`);
          }
        }
      }
    }
  }
  return fallos;
}

function documentosFueraDelIndice() {
  const enlazados = new Set();
  for (const { linea, enCodigo } of lineasDeMarkdown(leer("README.md"))) {
    if (enCodigo) continue;
    for (const [, destino] of linea.replace(/`[^`]*`/g, "").matchAll(ENLACE)) {
      enlazados.add(path.posix.normalize(decodeURI(destino.split("#")[0])));
    }
  }
  return DOCUMENTACION
    .filter((ruta) => ruta.startsWith("docs/") && !enlazados.has(ruta))
    .map((ruta) => `${ruta} no está en el índice del README.md: añadirle una fila con para quién es y qué cuenta.`);
}

// La cabecera de cada documento de docs/: el título y, debajo, los tres campos
// en este orden, separados por una línea ">" vacía, que sin ella GitHub junta
// los tres en un párrafo. Así se sabe de un vistazo de qué trata, para quién
// es y si está al día.
const CAMPOS = ["> **De qué trata:**", "> **Para quién:**", "> **Revisado:**"];
const REVISADO = /^> \*\*Revisado:\*\* (0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/20\d\d$/;

function cabecerasMal() {
  const fallos = [];
  for (const documento of DOCUMENTACION.filter((ruta) => ruta.startsWith("docs/"))) {
    const lineas = leer(documento).split(/\r?\n/);
    const avisar = (que) => fallos.push(`${documento}: ${que}. La cabecera, en specs/001-reordenar-documentacion/contracts/documento.md.`);
    if (!/^# \S/.test(lineas[0])) {
      avisar("no empieza por un título «# »");
      continue;
    }
    let i = 1;
    while (i < lineas.length && lineas[i].trim() === "") i++;
    const bloque = [];
    while (i < lineas.length && lineas[i].startsWith(">")) bloque.push(lineas[i++]);
    const donde = CAMPOS.map((campo) => bloque.findIndex((linea) => linea.startsWith(campo)));
    const falta = CAMPOS.filter((_, n) => donde[n] === -1);
    if (falta.length) {
      avisar(`le falta, justo debajo del título, ${falta.map((campo) => `«${campo}»`).join(", ")}`);
      continue;
    }
    if (!(donde[0] === 0 && donde[0] < donde[1] && donde[1] < donde[2])) {
      avisar("sus campos no van en el orden «De qué trata», «Para quién», «Revisado»");
    } else if (bloque[donde[1] - 1] !== ">" || bloque[donde[2] - 1] !== ">") {
      avisar("entre sus campos falta la línea «>» vacía");
    }
    if (!REVISADO.test(bloque[donde[2]])) {
      avisar(`su «Revisado» no lleva una fecha DD/MM/AAAA: ${bloque[donde[2]]}`);
    }
  }
  return fallos;
}

const sinFallos = (fallos) => assert.strictEqual(fallos.length, 0, "\n" + fallos.join("\n"));

describe("la documentación no cita nada que no exista", () => {
  test("los enlaces de Markdown llevan a algo que existe, ancla incluida", () => {
    sinFallos(enlacesRotos());
  });

  test("las menciones a docs/ desde cualquier archivo llevan a un documento que existe", () => {
    sinFallos(mencionesRotas());
  });

  test("las rutas del repositorio que cita la documentación existen", () => {
    sinFallos(rutasRotas());
  });

  test("los comandos de npm que cita la documentación existen", () => {
    sinFallos(comandosRotos());
  });

  test("cada documento de docs/ está en el índice del README.md", () => {
    sinFallos(documentosFueraDelIndice());
  });

  test("cada documento de docs/ empieza por su cabecera", () => {
    sinFallos(cabecerasMal());
  });
});
