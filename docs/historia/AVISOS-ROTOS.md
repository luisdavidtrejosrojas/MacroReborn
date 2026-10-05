# LOS AVISOS ROTOS — dos semanas sin avisos en vivo, y el adiós a Pusher (16/09/2026)

> **De qué trata:** por qué los avisos en vivo pasaron dos semanas sin funcionar tras la mudanza al
> VPS, sin que nadie lo notara, y cómo eso llevó a dejar Pusher el 16/09/2026.
>
> **Para quién:** quien toque los avisos en vivo, o escriba un módulo que pueda fallar en silencio.
>
> **Revisado:** 05/10/2026

Salió de la guía de desarrollo el 05/10/2026, entera. El 16/09/2026 `api/_avisos.js` sustituyó al
antiguo `_pusher.js`, que hablaba con un servicio de pago. Cómo funcionan hoy los avisos lo cuenta
[AVISOS](../referencia/AVISOS.md).

La mudanza al VPS quitó esa limitación: hay un proceso de Node encendido
de forma permanente. Pero nadie lo notó, porque las variables `PUSHER_*`
**nunca se pusieron** en el `.env` del servidor.

El antiguo `_pusher.js` estaba escrito para no romperse si faltaban: devolvía
una instancia muda que aceptaba la orden y no hacía nada. Era una buena
decisión para desarrollo local y resultó ser una trampa en producción.
El sitio pasó dos semanas emitiendo diez avisos al vacío mientras cada
navegador mantenía abierto un WebSocket contra Pusher esperando algo que
no iba a llegar nunca. Ni un error en los logs, ni un síntoma en
pantalla: todo seguía apareciendo, sólo que al recargar.

El comentario del propio módulo decía *"en producción estas variables
SIEMPRE están definidas"*. Una afirmación así, cuando deja de ser cierta,
es exactamente lo que impide encontrar el fallo.
