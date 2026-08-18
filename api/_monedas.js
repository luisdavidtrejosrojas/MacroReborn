// ==============================
// MONEDAS — api/_monedas.js
// ==============================
// El "banco" del sitio: el único lugar que sabe cómo se GANAN y cómo
// se GASTAN las monedas (users.monedas).
//
// Por qué: hasta ahora las monedas solo se restaban. La migración 012
// le dio a todos un saldo inicial de 500 y la tienda de avatares lo
// gastaba con un UPDATE suelto dentro de api/content.js, pero no
// existía ninguna forma de ganar monedas: el saldo solo podía bajar.
// Acá vive la otra mitad (ganarlas jugando) y también se centraliza el
// gasto, para que la resta del saldo no quede escrita a mano en un
// handler HTTP.
//
// Estilo (el mismo que api/_password.js, a propósito):
//   - Funciones puras / de lectura, fáciles de testear.
//   - Una clase fina MonedasService que las usa y que consumen los
//     handlers de la API (api/users.js, api/content.js).
//
// ==============================
// CÓMO SE GANAN (regla de negocio)
// ==============================
// Mientras el usuario juega, js/motor/xp.js ya manda un pulso por
// minuto a POST /api/users?action=xp. Ese pulso es el reloj que usamos
// (no se agrega ningún pedido nuevo al servidor, ni un cron), pero las
// monedas NO se entregan cada minuto:
//
//   - Cada 10 minutos reales de juego se otorga una cantidad ALEATORIA
//     entre 10 y 30 monedas. Los pulsos intermedios no otorgan nada:
//     eso no es un error, es lo normal (9 de cada 10 pulsos).
//   - Hay un tope de 500 monedas ganadas por día (UTC) por esta vía.
//     El saldo inicial de bienvenida y lo gastado en la tienda no
//     cuentan para el tope: solo lo ganado jugando.
//   - Si un otorgamiento cruza el tope, se entrega COMPLETO (no se
//     recorta al monto que faltaba). Se permite ese único "pasarse":
//     recortar el premio a la mitad se siente peor que darlo entero, y
//     el exceso máximo posible es de 29 monedas. Desde ahí y hasta la
//     medianoche UTC, los otorgamientos siguientes dan 0.
//
// ==============================
// RESETEO DIARIO PEREZOSO (sin cron)
// ==============================
// El contador diario NO se resetea con una tarea programada: se
// resetea solo, en el momento en que se lo consulta. Es el mismo truco
// que la migración perezosa de contraseñas (ver api/_password.js): si
// la fecha guardada en monedas_ganadas_fecha es de otro día UTC que
// hoy, el acumulado guardado se ignora y se trata como 0.
//
// Por qué así: un cron que corra a medianoche es una pieza más que
// puede fallar, y Vercel (plan Hobby) tiene los crons contados. Si
// nadie juega, tampoco hace falta resetear nada.

// ==============================
// CONSTANTES DE LA REGLA
// ==============================
// Exportadas para que los tests las usen en vez de repetir números
// sueltos (misma idea que COSTO_HASH en api/_password.js).

// Cada cuántos minutos reales se otorga (el pulso del cliente es de 1).
const MINUTOS_ENTRE_OTORGAMIENTOS = 10;

// Rango del premio, ambos extremos incluidos.
const MONEDAS_MINIMAS = 10;
const MONEDAS_MAXIMAS = 30;

// Tope de monedas GANADAS JUGANDO por día UTC.
const TOPE_DIARIO = 500;

// ==============================
// FUNCIONES PURAS
// ==============================

// Devuelve un entero al azar entre MONEDAS_MINIMAS y MONEDAS_MAXIMAS,
// incluyendo los dos extremos.
function montoAleatorio() {
  const rango = MONEDAS_MAXIMAS - MONEDAS_MINIMAS + 1;
  return MONEDAS_MINIMAS + Math.floor(Math.random() * rango);
}

// Aplica el tope diario a un premio ya sorteado.
//
// Devuelve el premio COMPLETO mientras el acumulado del día todavía no
// llegó al tope (aunque este premio lo cruce: el "pasarse" está
// permitido una vez, ver el encabezado), y 0 cuando el tope ya está
// alcanzado.
function montoSegunTope(ganadasHoy, montoSorteado) {
  if (ganadasHoy >= TOPE_DIARIO) return 0;
  return montoSorteado;
}

// Lee el estado de monedas de un usuario CON el reseteo diario
// perezoso ya aplicado.
//
// Devuelve null si el usuario no existe, o:
//   { id, saldo, ganadasHoy, tocaOtorgar }
//
// Las dos cuentas delicadas las hace Postgres, no Node, a propósito:
//   - "¿pasaron los 10 minutos?" se mide contra el now() del servidor
//     de base, así que no depende del reloj de la máquina que corre el
//     código (ni del huso horario en que esté configurada).
//   - "¿la fecha guardada es de hoy?" se compara contra la fecha UTC
//     de la base. Si monedas_ganadas_fecha es de ayer -o NULL, para
//     los usuarios que ya existían antes de la migración 015, la
//     comparación no da verdadero y el acumulado arranca en 0: ese es
//     el reseteo perezoso.
async function leerEstadoMonedas(sql, userId) {
  const filas = await sql`
    SELECT
      id,
      monedas AS saldo,
      COALESCE(monedas_ganadas_hoy, 0) AS ganadas_hoy_guardado,
      (monedas_ganadas_fecha = (now() AT TIME ZONE 'UTC')::date) AS fecha_es_hoy,
      (monedas_ultimo_otorgamiento IS NULL
       OR monedas_ultimo_otorgamiento <= now() - (${MINUTOS_ENTRE_OTORGAMIENTOS}::int * INTERVAL '1 minute')) AS toca_otorgar
    FROM users
    WHERE id = ${userId};
  `;

  if (filas.length === 0) return null;

  const fila = filas[0];

  return {
    id: fila.id,
    saldo: Number(fila.saldo) || 0,
    ganadasHoy: fila.fecha_es_hoy ? (Number(fila.ganadas_hoy_guardado) || 0) : 0,
    tocaOtorgar: !!fila.toca_otorgar
  };
}

// ==============================
// CLASE MonedasService
// ==============================
// Capa fina de "servicio" que los handlers usan. Recibe la función sql
// por constructor (inyección de dependencia, misma convención que
// api/_password.js y api/_utils.js) para poder testearla contra la
// base local PGlite.

class MonedasService {

  constructor(sql) {
    this._sql = sql;
  }

  // Otorga monedas por tiempo jugado, si corresponde.
  //
  // Se la llama en CADA pulso de XP (1 por minuto), así que el caso
  // más frecuente por lejos es no otorgar nada. Eso no es un error:
  // devuelve otorgado:false con una razon para poder loguear/debuggear
  // sin adivinar.
  //
  //   { otorgado: boolean, monto: number, saldoNuevo: number, razon: string|null }
  //
  // razon se llena SOLO cuando otorgado es false:
  //   "usuario-no-encontrado"      -> no existe ese id
  //   "aun-no-pasaron-10-minutos"  -> el caso normal, todavía no toca
  //   "tope-diario-alcanzado"      -> ya ganó 500 o más hoy (UTC)
  async otorgarPorTiempoJugado(userId) {

    const estado = await leerEstadoMonedas(this._sql, userId);

    if (!estado) {
      return { otorgado: false, monto: 0, saldoNuevo: 0, razon: "usuario-no-encontrado" };
    }

    if (!estado.tocaOtorgar) {
      return {
        otorgado: false,
        monto: 0,
        saldoNuevo: estado.saldo,
        razon: "aun-no-pasaron-10-minutos"
      };
    }

    const montoSorteado = montoAleatorio();

    // El UPDATE se hace incluso cuando el monto es 0 (tope alcanzado):
    // es un otorgamiento que entrega 0, y mover
    // monedas_ultimo_otorgamiento evita volver a sortear en cada uno de
    // los 10 pulsos siguientes. También deja monedas_ganadas_fecha
    // anclada en el día de hoy, que es lo que hace que el reseteo
    // perezoso funcione mañana.
    //
    // La condición de los 10 minutos se repite acá en el WHERE (ya la
    // evaluó leerEstadoMonedas) para que dos pulsos simultáneos -dos
    // pestañas del juego abiertas- no puedan cobrar dos premios: el
    // primero mueve la marca de tiempo y el segundo no encuentra fila
    // que actualizar.
    // La fecha UTC, el contador vigente y el tope se resuelven dentro
    // de esta misma sentencia. Así, incluso si la llamada cae justo en
    // el cambio de día, el premio se contabiliza en un único día y con
    // una sola fotografía coherente de la fila.
    const actualizado = await this._sql`
      WITH elegible AS (
        SELECT
          id,
          CASE
            WHEN monedas_ganadas_fecha = (now() AT TIME ZONE 'UTC')::date
              THEN COALESCE(monedas_ganadas_hoy, 0)
            ELSE 0
          END AS ganadas_hoy,
          CASE
            WHEN monedas_ganadas_fecha = (now() AT TIME ZONE 'UTC')::date
                 AND COALESCE(monedas_ganadas_hoy, 0) >= ${TOPE_DIARIO}
              THEN 0
            ELSE ${montoSorteado}
          END AS monto_otorgado
        FROM users
        WHERE id = ${userId}
          AND (monedas_ultimo_otorgamiento IS NULL
               OR monedas_ultimo_otorgamiento <= now() - (${MINUTOS_ENTRE_OTORGAMIENTOS}::int * INTERVAL '1 minute'))
      ), actualizado AS (
        UPDATE users AS u
        SET monedas = u.monedas + e.monto_otorgado,
            monedas_ganadas_hoy = e.ganadas_hoy + e.monto_otorgado,
            monedas_ganadas_fecha = (now() AT TIME ZONE 'UTC')::date,
            monedas_ultimo_otorgamiento = now()
        FROM elegible AS e
        WHERE u.id = e.id
          AND (u.monedas_ultimo_otorgamiento IS NULL
               OR u.monedas_ultimo_otorgamiento <= now() - (${MINUTOS_ENTRE_OTORGAMIENTOS}::int * INTERVAL '1 minute'))
        RETURNING u.monedas AS saldo_nuevo, e.monto_otorgado
      )
      SELECT saldo_nuevo, monto_otorgado FROM actualizado;
    `;

    // Sin filas: otro pulso simultáneo se quedó con este otorgamiento.
    if (actualizado.length === 0) {
      const saldoActual = await this.consultarSaldo(userId);

      if (saldoActual === null) {
        return { otorgado: false, monto: 0, saldoNuevo: 0, razon: "usuario-no-encontrado" };
      }

      return {
        otorgado: false,
        monto: 0,
        saldoNuevo: saldoActual,
        razon: "aun-no-pasaron-10-minutos"
      };
    }

    const saldoNuevo = Number(actualizado[0].saldo_nuevo) || 0;
    const montoOtorgado = Number(actualizado[0].monto_otorgado) || 0;

    if (montoOtorgado === 0) {
      return { otorgado: false, monto: 0, saldoNuevo, razon: "tope-diario-alcanzado" };
    }

    return { otorgado: true, monto: montoOtorgado, saldoNuevo, razon: null };
  }

  // Gasta monedas (tienda de avatares). Reemplaza al UPDATE que estaba
  // escrito a mano en api/content.js.
  //
  //   { ok: true,  saldoNuevo }
  //   { ok: false, error }
  //
  // El descuento se hace en UNA sola instrucción condicionada
  // (AND monedas >= monto), en vez del SELECT-y-después-UPDATE que
  // había antes: así dos compras disparadas al mismo tiempo no pueden
  // dejar el saldo en negativo. Si la instrucción no encuentra fila,
  // es porque no le alcanzaba: mismo mensaje de error que veía el
  // usuario antes, palabra por palabra.
  async gastar(userId, monto) {

    const aGastar = Math.trunc(Number(monto) || 0);

    // Un monto negativo SUMARÍA monedas. No debería llegar nunca (los
    // precios del catálogo son positivos), pero un precio mal cargado
    // no puede convertirse en una forma de ganar saldo.
    if (aGastar < 0) {
      return { ok: false, error: "Monto inválido" };
    }

    const actualizado = await this._sql`
      UPDATE users
      SET monedas = monedas - ${aGastar}
      WHERE id = ${userId} AND monedas >= ${aGastar}
      RETURNING monedas AS saldo_nuevo;
    `;

    if (actualizado.length === 0) {
      return { ok: false, error: "No te alcanzan las monedas" };
    }

    return { ok: true, saldoNuevo: Number(actualizado[0].saldo_nuevo) || 0 };
  }

  // Saldo actual de un usuario. Devuelve null si el usuario no existe
  // (así el que llama puede distinguir "no existe" de "tiene 0").
  async consultarSaldo(userId) {
    const filas = await this._sql`SELECT monedas FROM users WHERE id = ${userId};`;
    if (filas.length === 0) return null;
    return Number(filas[0].monedas) || 0;
  }
}

module.exports = {
  MINUTOS_ENTRE_OTORGAMIENTOS,
  MONEDAS_MINIMAS,
  MONEDAS_MAXIMAS,
  TOPE_DIARIO,
  montoAleatorio,
  montoSegunTope,
  leerEstadoMonedas,
  MonedasService
};
