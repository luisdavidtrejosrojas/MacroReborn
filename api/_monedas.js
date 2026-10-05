// ==============================
// MONEDAS — api/_monedas.js
// ==============================
// El "banco" del sitio: el único lugar que sabe cómo se GANAN y cómo
// se GASTAN las monedas (users.monedas).
//
// Por qué: al principio las monedas solo se restaban. La migración 012
// le dio a todos un saldo inicial de 500 y la tienda de avatares lo
// gastaba con un UPDATE suelto dentro de api/content.js, pero no existía
// ninguna forma de ganar monedas. Acá vive la otra mitad (ganarlas) y
// también se centraliza el gasto, para que la resta del saldo no quede
// escrita a mano en un handler HTTP.
//
// Estilo (el mismo que api/_password.js, a propósito):
//   - Funciones puras, fáciles de testear.
//   - Una clase fina MonedasService que las usa y que consumen los
//     handlers de la API (api/users.js, api/content.js, api/social.js).
//
// ==============================
// CÓMO SE GANAN (decidido el 04/10/2026, docs/referencia/ECONOMIA.md)
// ==============================
// Los números salen de una simulación: con ellos, quien juega media
// hora al día gana unas 200 monedas, y junta una épica (1.400) en una
// semana y una legendaria (6.000) en un mes (api/_precios.js).
//
//   - JUGAR. Cada 10 minutos jugados del día, un premio al azar de 10 a
//     30. "Jugados" quiere decir contados por el servidor, uno por
//     minuto (api/users.js), y con alguien delante: el navegador deja de
//     mandar el pulso a los 3 minutos sin teclado, ratón ni toques
//     (js/motor/actividad-jugador.js). Los primeros 120 minutos del día
//     pagan entero; de 120 a 240, la mitad; después, nada.
//   - RACHA. El primer minuto de cada día, 5 monedas por cada día
//     seguido jugando, hasta 35 desde el séptimo (api/_racha.js la
//     cuenta).
//   - SUBIR DE NIVEL. 15 × el nivel al que se sube.
//   - LOGROS. Tantas monedas como puntos, una vez (api/_logros.js).
//   - MISIONES. Las cobra api/progreso.js; sus premios están en
//     api/_misiones.js.
//
// Hasta ese día, el premio por jugar caía cada 10 minutos de reloj,
// estuviera quien estuviera delante, con un tope de 500 al día; y la
// racha, los niveles y los logros no daban nada.
//
// El día es el de Argentina, como el de los minutos y la racha: el
// premio del minuto 120 lo decide el contador de actividad_diaria.

// ==============================
// CONSTANTES DE LA REGLA
// ==============================
// Exportadas para que los tests y el recálculo de saldos
// (scripts/recalcular-saldos.js) las usen en vez de repetir números.

const MINUTOS_POR_PREMIO = 10;
const PREMIO_MINIMO = 10;
const PREMIO_MAXIMO = 30;

// Del día: hasta aquí, entero; hasta la siguiente, la mitad; después, nada.
const MINUTOS_ENTEROS = 120;
const MINUTOS_A_MITAD = 240;

const MONEDAS_POR_DIA_DE_RACHA = 5;
const DIAS_DE_RACHA_CON_PREMIO = 7;

const MONEDAS_POR_NIVEL = 15;

// ==============================
// FUNCIONES PURAS
// ==============================

// Un entero al azar de PREMIO_MINIMO a PREMIO_MAXIMO, los dos incluidos.
function premioAlAzar(azar = Math.random) {
  const rango = PREMIO_MAXIMO - PREMIO_MINIMO + 1;
  return PREMIO_MINIMO + Math.floor(azar() * rango);
}

// Cuánto vale el premio que toca en el minuto "minuto" del día.
function factorDelMinuto(minuto) {
  if (minuto <= MINUTOS_ENTEROS) return 1;
  if (minuto <= MINUTOS_A_MITAD) return 0.5;
  return 0;
}

// El premio por jugar al llegar al minuto "minuto" del día: solo en el
// 10, el 20, el 30…, y redondeado si va a mitad.
function premioDelMinuto(minuto, azar = Math.random) {
  const m = Math.trunc(Number(minuto) || 0);
  if (m <= 0 || m % MINUTOS_POR_PREMIO !== 0) return 0;
  const factor = factorDelMinuto(m);
  if (factor === 0) return 0;
  return Math.round(premioAlAzar(azar) * factor);
}

// El premio del primer minuto de un día que hace "dias" de racha.
function monedasPorRacha(dias) {
  const d = Math.trunc(Number(dias) || 0);
  return d <= 0 ? 0 : MONEDAS_POR_DIA_DE_RACHA * Math.min(d, DIAS_DE_RACHA_CON_PREMIO);
}

// El premio por llegar a "nivel". El nivel 1 es con el que se empieza.
function monedasPorNivel(nivel) {
  const n = Math.trunc(Number(nivel) || 0);
  return n <= 1 ? 0 : MONEDAS_POR_NIVEL * n;
}

// Por qué un minuto no dio nada, para quien lea la respuesta.
function razonSinPremio(minuto) {
  const m = Math.trunc(Number(minuto) || 0);
  if (m > MINUTOS_A_MITAD) return "pasadas-las-4-horas";
  return "aun-no-pasaron-10-minutos";
}

// ==============================
// SERVICIO
// ==============================

class MonedasService {

  constructor(sql) {
    this._sql = sql;
  }

  // Suma "monto" al saldo, en una sola instrucción. Devuelve el saldo
  // nuevo, o null si la cuenta no existe. Un monto de 0 o menos no toca
  // nada: este método solo da.
  async otorgar(userId, monto) {
    const n = Math.trunc(Number(monto) || 0);
    if (n <= 0) return this.consultarSaldo(userId);
    const filas = await this._sql`
      UPDATE users SET monedas = monedas + ${n}
      WHERE id = ${userId}
      RETURNING monedas;
    `;
    return filas.length ? Number(filas[0].monedas) || 0 : null;
  }

  // Lo que da un pulso: el premio del minuto si toca, la racha si es el
  // primer minuto del día y el nivel si con él se subió. Todo en una
  // sola suma.
  //
  //   datos: { minutoDelDia, rachaDeHoy, nivelNuevo }
  //     minutoDelDia  los minutos de hoy contando este (0 si el pulso no
  //                   era un minuto de juego)
  //     rachaDeHoy    los días de racha, si este minuto la contó; si no, 0
  //     nivelNuevo    el nivel al que se acaba de subir; si no, 0
  //
  // Devuelve { otorgado, monto, saldoNuevo, razon, desglose }, con
  // desglose = { jugar, racha, nivel }.
  async otorgarPorMinuto(userId, datos = {}, azar = Math.random) {
    const desglose = {
      jugar: premioDelMinuto(datos.minutoDelDia, azar),
      racha: monedasPorRacha(datos.rachaDeHoy),
      nivel: monedasPorNivel(datos.nivelNuevo)
    };
    const monto = desglose.jugar + desglose.racha + desglose.nivel;
    const saldoNuevo = await this.otorgar(userId, monto);
    if (saldoNuevo === null) {
      return { otorgado: false, monto: 0, saldoNuevo: 0, razon: "usuario-no-encontrado", desglose };
    }
    return {
      otorgado: monto > 0,
      monto,
      saldoNuevo,
      razon: monto > 0 ? null : razonSinPremio(datos.minutoDelDia),
      desglose
    };
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
  MINUTOS_POR_PREMIO,
  PREMIO_MINIMO,
  PREMIO_MAXIMO,
  MINUTOS_ENTEROS,
  MINUTOS_A_MITAD,
  MONEDAS_POR_DIA_DE_RACHA,
  DIAS_DE_RACHA_CON_PREMIO,
  MONEDAS_POR_NIVEL,
  premioAlAzar,
  factorDelMinuto,
  premioDelMinuto,
  monedasPorRacha,
  monedasPorNivel,
  MonedasService
};
