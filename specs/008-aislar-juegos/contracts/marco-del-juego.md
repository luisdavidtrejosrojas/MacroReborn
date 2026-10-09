# Contrato: el marco de cada juego

Lo arma `js/jugar.js` con la ayuda de `js/motor/juegos-aparte.js` (research D6). Los tipos de juego son
los del [modelo de datos](../data-model.md#juego).

| | De terceros (107) | De otra web (4) | Propio (Macro Snake) |
|---|---|---|---|
| `src` | `<dirección de los juegos>/html/juegos/<nombre>.html` | su dirección, como hoy | `./html/juegos/macro-snake.html`, como hoy |
| `sandbox` | sí (abajo) | sí (abajo) | no |
| `allow` | `fullscreen; gamepad; autoplay` | `fullscreen; gamepad; autoplay` | no |
| `allowfullscreen`, `loading="lazy"`, ancho y alto | como hoy | como hoy | como hoy |
| Antes de abrirlo | la mudanza, si toca | nada | nada |
| La actividad | por el puente (`mr-actividad`) | la regla de los diez minutos | escuchando dentro, como hoy |

## El `sandbox`

```text
allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups
allow-popups-to-escape-sandbox allow-modals allow-downloads allow-orientation-lock allow-presentation
```

| Permiso | Por qué |
|---|---|
| `allow-scripts` | los juegos son JavaScript |
| `allow-same-origin` | el juego conserva su origen (la dirección de los juegos) y puede guardar partidas. Es seguro porque ese origen no es el de la página |
| `allow-forms` | algunos envoltorios tienen formularios (nombres, opciones) |
| `allow-pointer-lock` | los juegos que capturan el ratón |
| `allow-popups` y `allow-popups-to-escape-sandbox` | los enlaces que abre un juego salen en una pestaña normal |
| `allow-modals` | los `alert()` y `confirm()` de algunos juegos |
| `allow-downloads` | exportar partidas desde el menú de los emuladores |
| `allow-orientation-lock` y `allow-presentation` | pantalla completa girada en el móvil |

**Lo que no lleva, a propósito**: `allow-top-navigation` ni sus variantes. Un juego no puede llevarse
la página a otra dirección (RF-002).
