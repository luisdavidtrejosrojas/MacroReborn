# Contrato: los mensajes entre la web y los juegos

Todo va con `postMessage`, que es lo único que el navegador deja cruzar entre la página de jugar (la web)
y un marco de la dirección de los juegos. Quien recibe comprueba siempre `event.origin` y, en la página,
también `event.source`. Un mensaje que no cumple se ignora. Las direcciones son las del [modelo de
datos](../data-model.md#dirección-de-los-juegos).

## Actividad: el puente avisa a la página

| | |
|---|---|
| Quién | el puente, dentro de cada juego de terceros (`html/juegos/_puente.js`, inyectado por el servidor) |
| A quién | `window.parent`, con destino `"*"`: el puente no sabe si la página es `macroreborn.com` o `www`, y el mensaje no lleva nada |
| Cuándo | con `keydown`, `pointerdown`, `pointermove`, `mousedown`, `mousemove`, `wheel` o `touchstart` en la ventana del juego, como mucho uno cada 5 segundos. No manda nada si el juego no está en un marco |
| Mensaje | `{ "tipo": "mr-actividad" }` |
| La página lo cuenta si | `event.origin` es la dirección de los juegos, `event.source` es la ventana del marco del juego, y `event.data.tipo` es `"mr-actividad"` |
| Efecto | el de un evento en la página: la última actividad pasa a «ahora» |

## Mudanza: la web manda las partidas a la dirección de los juegos

El orden, la primera vez que se abre un juego de terceros sin la marca `mrPartidasMudadas` y con algo
que pasar (research D8):

1. **La página** abre, en un marco invisible y sin `sandbox`,
   `<dirección de los juegos>/html/juegos/_mudanza.html`.
2. **La mudanza**, al cargar, avisa a `window.parent` con destino `"*"`:
   `{ "tipo": "mr-mudanza-lista", "version": 1 }`.
3. **La página** lo acepta si `event.origin` es la dirección de los juegos y `event.source` es la ventana
   de ese marco, y manda el paquete **solo a la dirección de los juegos**. Por ejemplo, con la partida de
   un emulador:

   ```text
   {
     "tipo": "mr-mudanza",
     "version": 1,
     "claves": [["ejs-settings", "{...}"], ...],
     "bases": [
       {
         "nombre": "/data/saves",
         "version": 21,
         "almacenes": [
           {
             "nombre": "FILE_DATA",
             "keyPath": null,
             "autoIncrement": false,
             "indices": [{ "nombre": "timestamp", "keyPath": "timestamp", "unique": false, "multiEntry": false }],
             "registros": [["/data/saves/juego.srm", { "timestamp": ..., "mode": ..., "contents": <binario> }]]
           }
         ]
       }
     ],
     "saltadas": [{ "nombre": "EmulatorJS-roms", "motivo": "cache" }]
   }
   ```

   Los valores viajan con la copia estructurada del navegador, binarios incluidos.
4. **La mudanza** solo lo acepta si `event.origin` es una de las direcciones de la web. Descarta además
   cualquier clave del sitio que viniera, aunque no debería venir ninguna. Guarda sin pisar nada y
   contesta a `event.origin`:
   - si fue bien: `{ "tipo": "mr-mudanza-hecha", "version": 1, "claves": { "puestas": n, "yaEstaban": n },
     "registros": { "puestos": n, "yaEstaban": n }, "almacenesSaltados": n }`;
   - si no: `{ "tipo": "mr-mudanza-fallo", "version": 1, "motivo": "<texto>" }`, y lo dice en la consola.
5. **La página**, con `mr-mudanza-hecha`, pone la marca con las claves y los registros puestos (data-model
   «Marca de mudanza hecha»), quita el marco invisible y abre el juego. Con `mr-mudanza-fallo`, o si a
   los 60 segundos no ha llegado nada, quita el marco, abre el juego, lo dice en la consola y no pone la
   marca.

## Lo que no viaja nunca

Nada de las [claves del sitio](../data-model.md#claves-del-sitio): la página no las mete en el paquete, y
la mudanza las tira si llegaran. La sesión (`macroSessionToken`) no sale nunca de la web.
