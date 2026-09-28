// ==============================
// LAS SANCIONES — api/_sanciones.js
// ==============================
// Advertir, suspender y banear, decidido el 28/09/2026 (docs/MODERACION.md,
// migración 026). Hasta ese día "suspender" solo ponía una marca que el
// servidor no miraba en ningún sitio, y las advertencias no llegaban.
//
//   advertencia  le llega como notificación y queda apuntada;
//   suspension   1, 3, 7 o 30 días: puede entrar, jugar y mirar, pero no
//                escribir (chat, comentarios, reseñas, biografía,
//                solicitudes de amistad ni notificaciones a otros);
//   baneo        sin fin: no puede entrar, y su sesión deja de valer en
//                el acto. Lo que escribió se tapa y la cuenta sale de las
//                listas (abajo, "LO QUE VEN LOS DEMÁS").
//
// Advierten y suspenden los moderadores y los administradores; banean y
// levantan baneos solo los administradores. A un administrador no se le
// puede sancionar. Todo queda en el historial de moderación.
//
// LO QUE SE MIRA EN CADA PETICIÓN. requerirAuth (api/_auth.js) es
// síncrono y lo usa todo el servidor, así que las sanciones en pie se
// tienen en memoria: son muy pocas. Se recargan al arrancar, cada
// RECARGAR_CADA_MS por si acaso, y en el momento en que cambia una: quien
// sanciona recarga en su proceso y avisa a los demás por la línea de
// avisos (api/_avisos.js), que en producción cruza los procesos del
// cluster con LISTEN/NOTIFY.

const DISCORD = "https://discord.gg/tKjfsQ7GdG";
const DIAS_DE_SUSPENSION = [1, 3, 7, 30];
const RECARGAR_CADA_MS = 30 * 1000;
const CANAL = "mr-sanciones";
const MOTIVO_MAXIMO = 500;

// id de la cuenta -> { baneo: { motivo }, suspension: { motivo, hasta } }
let enPie = new Map();

async function recargar(sql) {
  const filas = await sql`
    SELECT user_id, tipo, motivo, (EXTRACT(EPOCH FROM hasta) * 1000)::bigint AS hasta_ms
    FROM sanciones
    WHERE levantada_en IS NULL
      AND (tipo = 'baneo' OR (tipo = 'suspension' AND hasta > now()));
  `;
  const nuevo = new Map();
  for (const f of filas) {
    const id = Number(f.user_id);
    const estado = nuevo.get(id) || {};
    if (f.tipo === "baneo") {
      estado.baneo = { motivo: f.motivo };
    } else {
      const hasta = Number(f.hasta_ms);
      if (!estado.suspension || hasta > estado.suspension.hasta) estado.suspension = { motivo: f.motivo, hasta };
    }
    nuevo.set(id, estado);
  }
  enPie = nuevo;
}

let reloj = null;
function arrancar(sql) {
  if (reloj) return;
  const intento = () => recargar(sql).catch((error) => {
    console.warn("Sanciones: no se pudieron cargar.", error.message);
  });
  intento();
  reloj = setInterval(intento, RECARGAR_CADA_MS);
  if (reloj.unref) reloj.unref();
  // Aquí y no arriba: api/_avisos.js no abre nada al cargarse, pero así
  // este módulo se puede cargar sin él (las pruebas de api/_auth.js).
  require("./_avisos").suscribir(CANAL, intento);
}

function avisarCambio() {
  try {
    require("./_avisos").avisar(CANAL, "cambio", null);
  } catch (error) {
    console.warn("Sanciones: no se pudo avisar a los otros procesos.", error.message);
  }
}

function baneoDe(userId) {
  const estado = enPie.get(Number(userId));
  return (estado && estado.baneo) || null;
}

function suspensionDe(userId) {
  const estado = enPie.get(Number(userId));
  const s = estado && estado.suspension;
  return s && s.hasta > Date.now() ? s : null;
}

// "5/10 a las 14:00", en la hora de Argentina.
function fechaAR(ms) {
  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(ms));
  const p = (tipo) => (partes.find(x => x.type === tipo) || {}).value || "";
  return `${p("day")}/${p("month")} a las ${p("hour")}:${p("minute")}`;
}

// ---------- LAS RESPUESTAS ----------

function respuestaBaneo(res, baneo) {
  return res.status(403).json({
    success: false,
    codigo: "cuenta-baneada",
    error: "Esta cuenta está baneada.",
    motivo: baneo.motivo,
    reclamar: DISCORD
  });
}

// Antes de escribir: si la cuenta está suspendida, contesta y devuelve
// true. Uso: if (bloquearSiSuspendida(auth, res)) return;
function bloquearSiSuspendida(auth, res) {
  const s = auth && suspensionDe(auth.sub);
  if (!s) return false;
  res.status(403).json({
    success: false,
    codigo: "cuenta-suspendida",
    error: `Tu cuenta está suspendida hasta el ${fechaAR(s.hasta)} (hora de Argentina): mientras tanto no podés escribir.`,
    motivo: s.motivo,
    hasta: new Date(s.hasta).toISOString(),
    reclamar: DISCORD
  });
  return true;
}

// ---------- SANCIONAR Y LEVANTAR ----------

class Rechazo extends Error {
  constructor(codigo, mensaje) { super(mensaje); this.codigo = codigo; }
}

async function rolesDe(sql, userId) {
  const filas = await sql`
    SELECT badge_id FROM badges
    WHERE user_id = ${userId} AND badge_id IN ('administrador', 'moderador');
  `;
  const roles = new Set(filas.map(f => f.badge_id));
  return { admin: roles.has("administrador"), moderador: roles.has("administrador") || roles.has("moderador") };
}

async function baneadaEnBase(sql, userId) {
  const filas = await sql`
    SELECT 1 FROM sanciones
    WHERE user_id = ${userId} AND tipo = 'baneo' AND levantada_en IS NULL
    LIMIT 1;
  `;
  return filas.length > 0;
}

async function cuentaPorNombre(sql, username) {
  const filas = await sql`SELECT id, username FROM users WHERE username = ${String(username || "")} LIMIT 1;`;
  return filas[0] ? { id: Number(filas[0].id), username: filas[0].username } : null;
}

async function apuntarEnHistorial(sql, autor, rolAutor, accion, objetivo, motivo) {
  await sql`
    INSERT INTO moderation_log (moderator_username, moderator_role, accion, usuario_afectado, motivo)
    VALUES (${autor.username}, ${rolAutor}, ${accion}, ${objetivo}, ${motivo});
  `;
}

// Quién sanciona, a quién y por qué. Lanza Rechazo con el código HTTP.
async function comprobar(sql, auth, username, motivo, { soloAdmin }) {
  const roles = await rolesDe(sql, auth.sub);
  if (!roles.moderador) throw new Rechazo(403, "Solo la moderación puede sancionar");
  if (soloAdmin && !roles.admin) throw new Rechazo(403, "Solo un administrador puede hacer esto");

  const objetivo = await cuentaPorNombre(sql, username);
  if (!objetivo) throw new Rechazo(404, "Usuario no encontrado");
  if (objetivo.id === Number(auth.sub)) throw new Rechazo(400, "No podés sancionarte a vos mismo");
  if ((await rolesDe(sql, objetivo.id)).admin) throw new Rechazo(403, "A un administrador no se le puede sancionar");

  const texto = String(motivo || "").trim();
  if (!texto) throw new Rechazo(400, "Falta el motivo");
  if (texto.length > MOTIVO_MAXIMO) throw new Rechazo(400, `El motivo no puede pasar de ${MOTIVO_MAXIMO} caracteres`);

  return { roles, objetivo, texto, rolAutor: roles.admin ? "administrador" : "moderador" };
}

async function avisarALaCuenta(objetivo, titulo, mensaje) {
  // Aquí y no arriba: api/_notifications.js abre la conexión al cargarse.
  const { crearNotificacionServidor } = require("./_notifications");
  await crearNotificacionServidor(objetivo.username, titulo, mensaje, null, { userId: objetivo.id });
}

async function advertir(sql, auth, { username, motivo }) {
  const { objetivo, texto, rolAutor } = await comprobar(sql, auth, username, motivo, { soloAdmin: false });
  await sql`
    INSERT INTO sanciones (user_id, tipo, motivo, impuesta_por)
    VALUES (${objetivo.id}, 'advertencia', ${texto}, ${Number(auth.sub)});
  `;
  await apuntarEnHistorial(sql, auth, rolAutor, "advertir_usuario", objetivo.username, texto);
  await avisarALaCuenta(objetivo, "⚠️ Advertencia de la moderación",
    `${texto} Si creés que es un error, escribinos en Discord: ${DISCORD}`);
  return { username: objetivo.username };
}

async function suspender(sql, auth, { username, motivo, dias }) {
  const n = Number(dias);
  if (!DIAS_DE_SUSPENSION.includes(n)) throw new Rechazo(400, "La suspensión es de 1, 3, 7 o 30 días");
  const { objetivo, texto, rolAutor } = await comprobar(sql, auth, username, motivo, { soloAdmin: false });
  if (await baneadaEnBase(sql, objetivo.id)) throw new Rechazo(409, "Esa cuenta ya está baneada");

  const fila = await sql.transaccion(async (tx) => {
    // Una suspensión nueva sustituye a la que hubiera.
    await tx`
      UPDATE sanciones SET levantada_en = now(), levantada_por = ${Number(auth.sub)}
      WHERE user_id = ${objetivo.id} AND tipo = 'suspension' AND levantada_en IS NULL;
    `;
    const creada = await tx`
      INSERT INTO sanciones (user_id, tipo, motivo, hasta, impuesta_por)
      VALUES (${objetivo.id}, 'suspension', ${texto}, now() + make_interval(days => ${n}::int), ${Number(auth.sub)})
      RETURNING (EXTRACT(EPOCH FROM hasta) * 1000)::bigint AS hasta_ms;
    `;
    return creada[0];
  });
  const hasta = Number(fila.hasta_ms);

  await recargar(sql);
  avisarCambio();
  await apuntarEnHistorial(sql, auth, rolAutor, "suspender_usuario", objetivo.username,
    `${texto} (${n} ${n === 1 ? "día" : "días"})`);
  await avisarALaCuenta(objetivo, "🚫 Tu cuenta está suspendida",
    `Hasta el ${fechaAR(hasta)} (hora de Argentina) no podés escribir: chat, comentarios, reseñas, tu biografía ni solicitudes de amistad. ` +
    `Motivo: ${texto}. Si creés que es un error, escribinos en Discord: ${DISCORD}`);
  return { username: objetivo.username, hasta: new Date(hasta).toISOString() };
}

async function banear(sql, auth, { username, motivo }) {
  const { objetivo, texto } = await comprobar(sql, auth, username, motivo, { soloAdmin: true });
  if (await baneadaEnBase(sql, objetivo.id)) throw new Rechazo(409, "Esa cuenta ya está baneada");

  await sql.transaccion(async (tx) => {
    // El baneo sustituye a la suspensión que hubiera.
    await tx`
      UPDATE sanciones SET levantada_en = now(), levantada_por = ${Number(auth.sub)}
      WHERE user_id = ${objetivo.id} AND tipo = 'suspension' AND levantada_en IS NULL;
    `;
    await tx`
      INSERT INTO sanciones (user_id, tipo, motivo, impuesta_por)
      VALUES (${objetivo.id}, 'baneo', ${texto}, ${Number(auth.sub)});
    `;
  });

  await recargar(sql);
  avisarCambio();
  await apuntarEnHistorial(sql, auth, "administrador", "banear_usuario", objetivo.username, texto);
  return { username: objetivo.username };
}

// Levanta lo que la cuenta tenga en pie: la suspensión (moderación) y el
// baneo (solo administradores).
async function levantar(sql, auth, { username }) {
  const roles = await rolesDe(sql, auth.sub);
  if (!roles.moderador) throw new Rechazo(403, "Solo la moderación puede levantar sanciones");
  const objetivo = await cuentaPorNombre(sql, username);
  if (!objetivo) throw new Rechazo(404, "Usuario no encontrado");

  const deAhora = await sql`
    SELECT tipo FROM sanciones
    WHERE user_id = ${objetivo.id} AND levantada_en IS NULL
      AND (tipo = 'baneo' OR (tipo = 'suspension' AND hasta > now()));
  `;
  if (!deAhora.length) throw new Rechazo(409, "Esa cuenta no tiene nada que levantar");
  const baneada = deAhora.some(f => f.tipo === "baneo");
  if (baneada && !roles.admin) throw new Rechazo(403, "Solo un administrador puede levantar un baneo");

  await sql`
    UPDATE sanciones SET levantada_en = now(), levantada_por = ${Number(auth.sub)}
    WHERE user_id = ${objetivo.id} AND levantada_en IS NULL AND tipo IN ('suspension', 'baneo');
  `;

  await recargar(sql);
  avisarCambio();
  const rolAutor = roles.admin ? "administrador" : "moderador";
  await apuntarEnHistorial(sql, auth, rolAutor, baneada ? "levantar_baneo" : "reactivar_usuario", objetivo.username,
    baneada ? "Baneo levantado" : "Suspensión levantada");
  if (!baneada) {
    await avisarALaCuenta(objetivo, "✅ Tu suspensión terminó", "Ya podés volver a escribir en MacroReborn.");
  }
  return { username: objetivo.username };
}

// ---------- LO QUE VEN LOS DEMÁS DE UNA CUENTA BANEADA ----------
// Lo que escribió se tapa con este aviso, que el navegador pinta en rojo
// (chat, comentarios, reseñas y biografía); su perfil dice "Cuenta
// baneada", sin biografía, avatar ni actividad; y la cuenta sale de las
// listas: rankings, Comunidad, el buscador y los amigos de los demás.
// Se decide al leer, sin tocar nada de lo guardado: si se le levanta el
// baneo, vuelve todo tal cual. El panel de moderación la sigue viendo.
//
// Los dos trozos de SQL son para consultas que tienen la cuenta como "u"
// (FROM users u, JOIN users u ...), igual que fragmentoAvatarLigero en
// api/_avatar-ligero.js. Van a la base y no a la memoria de arriba
// porque cambian qué filas salen, y con ellas los LIMIT y los puestos.
const TAPADO = "[Este usuario fue baneado y no es posible leer este mensaje]";

function baneadaSQL(sql) {
  return sql`EXISTS (
    SELECT 1 FROM sanciones sb
    WHERE sb.user_id = u.id AND sb.tipo = 'baneo' AND sb.levantada_en IS NULL)`;
}

function noBaneadaSQL(sql) {
  return sql`NOT ${baneadaSQL(sql)}`;
}

// Una fila que trae "autor_baneado" (sacado con baneadaSQL): si lo es,
// sale con el texto tapado y, si hace falta, algo más cambiado (las
// estrellas de una reseña).
function tapar(fila, ademas) {
  return fila.autor_baneado ? { ...fila, texto: TAPADO, ...ademas } : fila;
}

module.exports = {
  DISCORD,
  DIAS_DE_SUSPENSION,
  CANAL,
  TAPADO,
  Rechazo,
  recargar,
  arrancar,
  baneoDe,
  suspensionDe,
  fechaAR,
  respuestaBaneo,
  bloquearSiSuspendida,
  rolesDe,
  baneadaEnBase,
  baneadaSQL,
  noBaneadaSQL,
  tapar,
  advertir,
  suspender,
  banear,
  levantar
};
