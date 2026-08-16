// ==============================
// CONTRASEÑAS — api/_password.js
// ==============================
// La "oficina de contraseñas" del backend: el único lugar que sabe
// hashear (picar) contraseñas, verificarlas y migrarlas.
//
// Por qué: antes el proyecto guardaba las contraseñas en TEXTO PLANO
// en la columna users.password (comparaba `password = ${password}`
// directo en SQL). Si alguien accedía a la base, leía la contraseña
// de todos. Ahora se guarda SOLO el hash bcrypt en users.password_hash:
// un código que no se puede revertir, pero que permite verificar:
// "si picás lo que escribiste y coincide con el código guardado, la
// contraseña es correcta".
//
// Estilo híbrido (acordado con el dueño del fork):
//   - Funciones puras (fáciles de testear, sin estado).
//   - Una clase fina PasswordService que las usa y que consumen los
//     handlers de la API (api/auth.js, api/users.js).
//
// Migración de usuarios existentes ("perezosa"):
//   - Los usuarios viejos todavía tienen su contraseña en texto plano
//     en users.password.
//   - Cuando un usuario viejo entra con su contraseña correcta, se
//     aprovecha ese momento: se pica la contraseña, se guarda en
//     password_hash y se borra el texto plano (password = NULL).
//   - La columna password se elimina del todo en la migración 014,
//     cuando se confirme (con el backfill de scripts/migrar-passwords.js)
//     que no queda ningún password en claro.

const bcrypt = require("bcryptjs");

// Costo de trabajo de bcrypt: 10 es el estándar recomendado hoy.
// Más alto = más difícil de romper, pero más lento (imperceptible
// para el usuario, costoso para un atacante).
const COSTO_HASH = 10;

// ==============================
// FUNCIONES PURAS
// ==============================

// Pica una contraseña y devuelve su hash listo para guardar.
async function hashContrasena(contrasenaPlana) {
  return bcrypt.hash(contrasenaPlana, COSTO_HASH);
}

// Compara una contraseña en claro contra un hash guardado.
// Devuelve true si es la misma contraseña (sin revelar cuál era).
async function verificarHash(contrasenaPlana, hash) {
  return bcrypt.compare(contrasenaPlana, hash);
}

// Verifica las credenciales de un usuario y devuelve el usuario (sin
// campos de contraseña) si son correctas, o null si no.
//
// Doble vía a propósito (migración perezosa):
//   1) Si el usuario ya tiene password_hash -> se verifica con bcrypt.
//   2) Si todavía tiene password en texto plano (usuario viejo) ->
//      se compara el texto directamente; si coincide, se pica al
//      instante, se guarda el hash y se borra el texto plano.
async function verificarContrasenaYMigrar(sql, username, contrasenaPlana) {
  if (!username || !contrasenaPlana) return null;

  const filas = await sql`
    SELECT id, username, level, xp, created_at, bio, avatar, status,
           password, password_hash
    FROM users
    WHERE username = ${username};
  `;

  if (filas.length === 0) return null;

  const usuario = filas[0];

  if (usuario.password_hash) {
    const coincide = await verificarHash(contrasenaPlana, usuario.password_hash);
    if (!coincide) return null;
    const { password, password_hash, ...limpio } = usuario;
    return limpio;
  }

  // Usuario legacy (texto plano). Si la contraseña no coincide, nada
  // que hacer; si coincide, se migra en este mismo momento.
  if (usuario.password !== contrasenaPlana) return null;

  const hash = await hashContrasena(contrasenaPlana);

  await sql`
    UPDATE users
    SET password_hash = ${hash}, password = NULL
    WHERE id = ${usuario.id};
  `;

  const { password, password_hash, ...limpio } = usuario;
  return limpio;
}

// ==============================
// CLASE PasswordService
// ==============================
// Capa fina de "servicio" que los handlers usan. Recibe la función
// sql por constructor (inyección de dependencia, misma convención que
// api/_utils.js) para que sea testeable con una base local o simulada.

class PasswordService {

  constructor(sql) {
    this._sql = sql;
  }

  // Registro: guarda SOLO el hash. La contraseña en claro no se
  // toca la base de datos.
  async registrar(username, contrasenaPlana) {
    const hash = await hashContrasena(contrasenaPlana);

    // FIX histórico (se conserva): last_login arranca en NULL y recién
    // el primer login real lo actualiza a now(), para que un usuario
    // recién registrado no aparezca "En línea" en Comunidad.
    const filas = await this._sql`
      INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
      VALUES (${username}, ${hash}, 1, 0, 'active', now(), NULL)
      RETURNING id, username, level, xp, bio, avatar, status, created_at, last_login;
    `;

    return filas[0];
  }

  // Login / verificación (con migración perezosa incluida).
  async verificar(username, contrasenaPlana) {
    return verificarContrasenaYMigrar(this._sql, username, contrasenaPlana);
  }

  // Cambio de contraseña: verifica la actual (migrando si hace falta)
  // y guarda el hash de la nueva. Nunca guarda texto plano.
  async cambiarContrasena(username, contrasenaActual, contrasenaNueva) {
    const usuario = await verificarContrasenaYMigrar(this._sql, username, contrasenaActual);

    if (!usuario) {
      return { ok: false, error: "La contraseña actual no es correcta" };
    }

    const hash = await hashContrasena(contrasenaNueva);

    await this._sql`
      UPDATE users
      SET password_hash = ${hash}, password = NULL
      WHERE id = ${usuario.id};
    `;

    return { ok: true };
  }

  // Borrado de cuenta: verifica la contraseña y borra al usuario.
  // Gracias a las FK "ON DELETE CASCADE" de las migraciones 001-006,
  // borrar el usuario limpia en cascada sus logros, amistades,
  // comentarios, mensajes, notificaciones, historial, reseñas, etc.
  // "likes" no tiene FK (guarda el username tal cual), así que se
  // limpia a mano. "moderation_log" queda intacto a propósito: es un
  // historial de auditoría.
  async eliminarCuenta(username, contrasenaPlana) {
    const usuario = await verificarContrasenaYMigrar(this._sql, username, contrasenaPlana);

    if (!usuario) return { ok: false };

    await this._sql`DELETE FROM likes WHERE username = ${username};`;
    await this._sql`DELETE FROM users WHERE id = ${usuario.id};`;

    return { ok: true };
  }
}

module.exports = {
  COSTO_HASH,
  hashContrasena,
  verificarHash,
  verificarContrasenaYMigrar,
  PasswordService
};
