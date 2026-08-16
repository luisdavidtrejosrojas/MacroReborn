// ==============================
// CONEXIÓN A LA BASE DE DATOS — api/_db.js
// ==============================
// Único lugar del backend que decide CON QUÉ base hablamos:
//
//   - En producción: usa Neon (Postgres remoto) leyendo DATABASE_URL,
//     exactamente igual que antes. Cero cambios de comportamiento.
//
//   - En desarrollo local (tests y scripts de esta computadora):
//     se puede reemplazar con una base de práctica local (PGlite,
//     Postgres embebido) llamando a usarSqlLocal(). Así podemos
//     probar TODO el flujo (registro, login, migración de contraseñas)
//     sin tocar la base real del proyecto original.
//
// Por qué existe: antes cada archivo de la API creaba su propia
// conexión con `neon(process.env.DATABASE_URL)` en la primera línea.
// Con esto queda centralizado y, además, se vuelve posible probar los
// mismos handlers de verdad contra una base local.

const { neon } = require("@neondatabase/serverless");

let _sql = null;
let _sqlLocal = null;

// Cambia la conexión a una base local (solo para desarrollo/tests).
// Recibe una función "sql" con la misma interfaz que la de Neon
// (sql`...`), por ejemplo el adaptador de scripts/pglite.js.
function usarSqlLocal(sqlLocal) {
  _sqlLocal = sqlLocal;
  _sql = null; // la próxima llamada vuelve a resolver la conexión
}

// Devuelve la función sql lista para usar (la de Neon o la local).
function obtenerSql() {
  if (_sql) return _sql;
  if (_sqlLocal) {
    _sql = _sqlLocal;
    return _sql;
  }
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

module.exports = { obtenerSql, usarSqlLocal };
