// ==============================
// LOS PRECIOS — api/_precios.js
// ==============================
// Desde el 04/10/2026, lo que cuesta una prenda lo dice su RAREZA, no un
// número que pone cada uno (docs/ECONOMIA.md). La gente se quejaba de que
// todo era muy caro, y lo era: el equipo de arte ponía a mano entre 1.500
// y 50.000, y a quien juega media hora al día una de esas le costaba de
// uno a catorce meses.
//
// Los cuatro precios salen de lo que gana en un día quien juega 30
// minutos, unas 200 monedas (api/_monedas.js):
//
//   comun          50   un cuarto de día
//   rara          500   dos días y medio; las 500 de bienvenida la pagan
//   epica       1.400   una semana
//   legendaria  6.000   un mes
//
// Quien sube una prenda elige su rareza en el panel de arte. Las que ya
// existían la tomaron por el precio que tenían (migración 027, que lleva
// rarezaPorPrecio copiada en SQL: tests/precios.test.js vigila que digan
// lo mismo), y con esos cortes ninguna subió de precio.

const RAREZAS = Object.freeze(["comun", "rara", "epica", "legendaria"]);

const PRECIO_POR_RAREZA = Object.freeze({
  comun: 50,
  rara: 500,
  epica: 1400,
  legendaria: 6000
});

const NOMBRE_DE_RAREZA = Object.freeze({
  comun: "Común",
  rara: "Rara",
  epica: "Épica",
  legendaria: "Legendaria"
});

// La de una prenda que se publica sin que nadie haya dicho otra cosa.
const RAREZA_POR_DEFECTO = "comun";

function rarezaValida(rareza) {
  return typeof rareza === "string" && RAREZAS.includes(rareza);
}

function precioDeRareza(rareza) {
  return PRECIO_POR_RAREZA[rarezaValida(rareza) ? rareza : RAREZA_POR_DEFECTO];
}

// La rareza que toca a un precio de los de antes. La usa la migración 027
// con cada prenda que ya estaba a la venta, y la API cuando le llega un
// precio en vez de una rareza: un panel de arte abierto desde antes del
// cambio sigue mandando números.
function rarezaPorPrecio(precio) {
  const n = Number(precio) || 0;
  if (n >= 15000) return "legendaria";
  if (n >= 3001) return "epica";
  if (n >= 500) return "rara";
  return "comun";
}

// Lo que diga el cuerpo de una petición: la rareza si viene y es buena; si
// no, la del precio; si tampoco hay precio, null.
function rarezaDelPedido(cuerpo) {
  if (!cuerpo) return null;
  if (rarezaValida(cuerpo.rareza)) return cuerpo.rareza;
  if (cuerpo.precio !== undefined && cuerpo.precio !== null && cuerpo.precio !== "") {
    const n = Number(cuerpo.precio);
    if (Number.isFinite(n) && n > 0) return rarezaPorPrecio(n);
  }
  return null;
}

module.exports = {
  RAREZAS,
  PRECIO_POR_RAREZA,
  NOMBRE_DE_RAREZA,
  RAREZA_POR_DEFECTO,
  rarezaValida,
  precioDeRareza,
  rarezaPorPrecio,
  rarezaDelPedido
};
