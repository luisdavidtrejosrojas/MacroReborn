# LA ECONOMÍA

Rehecha el 4 de octubre de 2026, porque la gente se quejaba de que todo
estaba muy caro. Y lo estaba: las prendas del equipo de arte iban de
1.500 a 50.000 monedas, y se ganaban como mucho 500 al día. Los números
de abajo salen de simular jugadores de distintos tipos, día a día,
probando 1.152 combinaciones de precios y premios hasta dar con la que
cumplía lo que se pidió (sección 1).

Desde entonces:

- las prendas tienen **rareza**, y la rareza el precio (sección 2);
- se gana por **jugar, misiones, racha, logros y niveles** (sección 3);
- el tiempo de juego solo cuenta **con alguien delante** (sección 4);
- y el saldo de cada cuenta se **rehízo** con las reglas nuevas, sin
  que nadie perdiera (sección 5).

---

## 1. Lo que se decidió

| Decisión | Por qué |
|---|---|
| El jugador de referencia juega 30 minutos al día | Es el que se usa para medir todo lo demás |
| Con eso, una épica en una semana y una legendaria en un mes | Las del equipo de arte, que son lo que la gente quiere, tienen que estar a la vista, no a un año |
| Precios por rareza, fijos | Cuatro precios se entienden de un vistazo. El equipo de arte elige la rareza, no el número |
| Ninguna prenda sube de precio | Se pedía que bajaran |
| Monedas también por misiones, racha, logros y niveles | Jugar sigue siendo lo principal, pero volver cada día y avanzar también tiene premio |
| Solo cuenta el tiempo con alguien delante | Con dinero de por medio, dejar la pestaña abierta toda la noche no puede valer |
| Los saldos se rehacen, y a nadie le baja | Lo justo es lo que cada uno habría ganado con las reglas nuevas; quitarle a alguien lo que ya tenía, no |
| Lo pagado de más se devuelve, solo a jugadores | Quien compró caro antes de la bajada no sale perdiendo |
| El equipo: el catálogo entero y un saldo normal | Las cinco cuentas del equipo tenían unos mil millones cada una. Necesitan probarlo todo, no monedas |

---

## 2. Los precios

| Rareza | Precio | El jugador de referencia | Cuáles eran el 04/10/2026 |
|---|---|---|---|
| Común | 50 | el primer día | las 629 del catálogo original, y una del equipo de arte |
| Rara | 500 | en 2 a 4 días | las del equipo de arte de 500 a 3.000 (52) |
| Épica | 1.400 | en 7 a 9 días | de 3.001 a 14.999 (60) |
| Legendaria | 6.000 | en 29 a 32 días | de 15.000 en adelante (17) |

Todo el catálogo junto costaba 1.049.547 monedas; ahora, 243.500.

Una cuenta nueva empieza con 500: le alcanza para una rara, o para
vestirse entera de comunes.

**Dónde vive.** `api/_precios.js` tiene las rarezas y sus precios. La
migración 027 (`migrations/027_rareza_de_las_prendas.sql`) añade
`avatar_shop_items.rareza`, se la pone a cada prenda según el precio que
tenía y le pone el precio de su rareza. Lleva su propia copia de la
tabla, porque no puede leer el módulo; `tests/precios.test.js` vigila
que digan lo mismo. Se puede aplicar más de una vez.

**El equipo de arte** elige la rareza al subir una prenda (`arte.html`,
`taller.html`) y la puede cambiar después con "Editar"; el precio sale
solo. La API sigue aceptando un `precio` en vez de una `rareza`, y lo
convierte con los mismos cortes que la migración. Lo ya pagado no se
toca: cada compra guarda lo que costó (`precio_pagado`, `docs/TIENDA.md`).

**El Bazar** enseña la rareza en cada tarjeta, con su color, y deja
filtrar por ella.

---

## 3. Cómo se ganan

| De dónde | Cuánto | Dónde vive |
|---|---|---|
| Jugar | De 10 a 30, al azar, cada 10 minutos de juego (en el minuto 10, 20, 30… del día). Enteros hasta los 120 minutos, la mitad hasta los 240, y después nada | `api/_monedas.js` |
| Racha | 5 por cada día seguido, hasta 35 al día desde el séptimo | `api/_monedas.js` |
| Subir de nivel | 15 por el nivel nuevo: 30 al llegar al 2, 150 al llegar al 10 | `api/_monedas.js` |
| Misiones | Las diarias, de 31 a 75; las semanales, de 175 a 375. Un 25 % más que antes | `api/_misiones.js` |
| Logros | Tantas monedas como puntos. Popular y Leyenda Social (50 y 100 amigos) no dan monedas: premiaban crear cuentas falsas | `api/_logros.js` |

Jugar, la racha y el nivel llegan juntos, en el pulso de cada minuto
(`MonedasService.otorgarPorMinuto`, desde `sumarXp` en `api/users.js`).
La racha se cobra con el primer minuto del día; el aviso de nivel nuevo
dice cuánto se lleva.

**Los logros los comprueba el servidor.** Hasta el 04/10/2026 guardaba
el logro que le pidiera el navegador, sin mirar nada. Con monedas,
pedirlos todos de golpe daría miles, así que `api/_logros.js` mira en la
base lo mismo que el navegador: nivel, juegos jugados, avatar,
comentarios, amigos y puesto del ranking. Si no se cumple, no se guarda.

**Lo que da al día**, según la simulación (400 jugadores de cada tipo,
90 días; el día de la épica y la legendaria es la mediana, entre
paréntesis lo que tarda el 10 % más rápido y el 10 % más lento):

| Jugador | Minutos al día | Días por semana | Monedas al día | Primera épica | Primera legendaria |
|---|---|---|---|---|---|
| Ocasional | 10 | 3,2 | 17 | día 83 (60 a 112) | no llega en 90 días |
| Ligero | 20 | 4,6 | 64 | día 21 (14 a 31) | día 93 (77 a 113) |
| Normal | 30 | 6 | 138 | día 11 (8 a 15) | día 44 (36 a 52) |
| **Referencia** | **30** | **7** | **199** | **día 8 (7 a 9)** | **día 30 (29 a 32)** |
| Aplicado | 60 | 6,3 | 249 | día 6 (5 a 8) | día 24 (21 a 28) |
| Intenso | 180 | 6,7 | 532 | día 3 (3 a 4) | día 12 (11 a 13) |
| Extremo | 300 | 7 | 726 | día 2 (2 a 3) | día 9 (8 a 9) |

El tope de 240 minutos es lo que impide que el de 5 horas se lo lleve
todo en una semana: juega diez veces más que el de referencia y gana
3,6 veces más.

**Lo que ya no se usa.** El tope de 500 al día y las columnas que lo
llevaban (`monedas_ganadas_hoy` y compañía, migración 015) se quedan en
la base sin tocar.

---

## 4. Solo con alguien delante

Ya contaba un minuto por minuto, con las pestañas que fueran (migración
024, 25/09/2026), y solo con la pestaña a la vista. Faltaba saber si
había alguien: había días de 24 horas "jugadas".

`js/motor/actividad-jugador.js` escucha el teclado, el ratón y los
toques, en la página y **dentro del juego**: 108 de los 112 juegos son
de la propia web y se puede escuchar dentro. A los **3 minutos** sin
nada, el navegador deja de mandar el pulso (`js/motor/xp.js`): ni
minuto, ni XP, ni racha, ni monedas, hasta que se vuelva a tocar algo.

En los cuatro juegos de otras webs no se ve lo de dentro. Ahí cuenta
entrar en el juego (el foco pasa al juego), y vale 10 minutos; pasados,
hay que volver a entrar.

`jugar.html` carga el vigilante antes del pulso, y `js/jugar.js` lo
engancha al juego cada vez que carga.

---

## 5. Los saldos rehechos

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

---

## 6. Las pruebas

| Archivo | Qué sujeta |
|---|---|
| `tests/precios.test.js` | Las rarezas y sus precios, y la migración 027 contra una base |
| `tests/monedas.test.js` | El premio por jugar, la racha, los niveles, y el enganche en el pulso y en la compra |
| `tests/misiones-avisos.test.js`, `tests/rescatar-misiones.test.js` | Los premios nuevos de las misiones |
| `tests/logros-servidor.test.js` | Que el servidor compruebe cada logro y pague lo que vale |
| `tests/actividad-jugador.test.js`, `tests/xp-pulso.test.js` | Que sin nadie delante no haya pulso |
| `tests/recalcular-saldos.test.js` | El recálculo, regla por regla, y el script contra una base |
| `tests/arte-editar.test.js`, `tests/avatar-panel.test.js`, `tests/arte-pagina.test.js`, `tests/taller.test.js` | La rareza al subir y al editar |
| `tests/bazar-pagina.test.js` | La rareza en el Bazar y su filtro |
| `tests/saldo-privado.test.js` | Que el saldo de cada uno solo lo vea su dueño |
