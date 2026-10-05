# LOS SALDOS REHECHOS — el recálculo de la economía nueva (04/10/2026)

> **De qué trata:** el recálculo de una sola vez del 04/10/2026: qué le calculó a cada cuenta, cómo
> se corrió sin perder lo que se ganaba mientras tanto, lo que salió y dónde quedó la base de justo
> antes.
>
> **Para quién:** quien tenga que explicar un saldo, o deshacer el recálculo.
>
> **Revisado:** 05/10/2026

Salió el 05/10/2026, entera, de la referencia de la economía. **El recálculo ya se aplicó y no se
repite.** Cómo funciona hoy la economía lo cuenta [ECONOMIA](../referencia/ECONOMIA.md).

`scripts/recalcular-saldos.js`, una vez, después de la migración 027. A
cada cuenta le calcula lo que habría juntado si las reglas nuevas
hubieran estado siempre:

- **500** de bienvenida;
- **60 por cada día que jugó antes del 25/09**, lo que gana el jugador
  de referencia en un día. Los minutos de antes de esa fecha no valen:
  contaban cada pestaña (migración 024), y había cuentas con más
  minutos que la semana;
- **sus minutos desde el 25/09**, que ya eran uno por minuto, con 120 al
  día como mucho (no se sabe si había alguien delante: eso llegó el
  04/10), a 20 cada 10 minutos, la media del premio;
- la **racha** de esos días seguidos;
- las **misiones** que cobró, con los premios de ahora;
- sus **logros**, salvo los de ranking: en agosto, con menos de diez
  cuentas, cualquiera era Top 3;
- sus **niveles**, hasta el que da ese tiempo de juego, no el que tiene:
  el XP de antes del 25/09 está inflado como los minutos;
- **menos lo que compró**, a los precios nuevos.

Si eso es menos que lo que tiene más lo que pagó de más, se queda con
eso: a nadie le baja. Las cinco cuentas del equipo se quedan con lo que
les dé el cálculo, sin restar lo comprado, y con todo el catálogo
regalado (a 0).

```bash
node scripts/recalcular-saldos.js --produccion             # simulacro
node scripts/recalcular-saldos.js --produccion --aplicar   # de verdad
```

Suma la diferencia al saldo, en vez de escribirlo, y todo en una
transacción: lo que alguien gane mientras corre no se pierde. Deja lo
que hizo, cuenta por cuenta, en `datos-locales/recalculo-saldos-produccion.json`,
y si encuentra ese archivo no vuelve a aplicar (devolvería dos veces lo
pagado de más).

Calculado sobre la base de producción del 04/10/2026, antes de
aplicarlo: de 204 jugadores, a 165 les sube y 39 se quedan igual. La
mediana pasa de 500 a 630, y el 10 % más rico, de 907 a 1.395. 16
jugadores recuperan lo pagado de más: 11.020 monedas entre todos, 3.570
el que más. El equipo queda entre 1.020 y 5.723.

Aplicado el 04/10/2026 a las 22:57 (hora del servidor, UTC), con ese
mismo resultado: las 209 cuentas quedaron con el saldo calculado, y las
cinco del equipo con las 759 prendas. La base de justo antes, por si
hubiera que deshacerlo, está en el servidor:
`~/respaldos/antes-de-la-economia-2026-10-04-2256.sql.gz` (fuera de la
rotación de 14 días).
