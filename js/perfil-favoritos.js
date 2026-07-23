// =========================
// MACROREBORN - FAVORITOS PERFIL (CORREGIDO)
// =========================

const usuarioActivoFavoritos = leerJSON(
    localStorage.getItem("usuarioActivo")
);

const contenedorFavoritos = document.querySelector(".juegos-favoritos");

if (contenedorFavoritos) {

    if (!usuarioActivoFavoritos) {

        contenedorFavoritos.innerHTML = `
            <p>Iniciá sesión para ver tus juegos favoritos.</p>
        `;

    } else {

        const claveFavoritos = "favoritos_" + usuarioActivoFavoritos.nombre;

        let favoritos = leerJSON(localStorage.getItem(claveFavoritos)) || [];

        if (favoritos.length === 0) {

            contenedorFavoritos.innerHTML = `
                <p>Todavía no agregaste juegos favoritos.</p>
            `;

        } else {

            contenedorFavoritos.innerHTML = "";

            favoritos.forEach(id => {

                const juego = juegos.find(j => String(j.id) === String(id));

                if (juego) {

                    contenedorFavoritos.innerHTML += `
                        <div class="juego-card">
                            <div class="juego-imagen">
                                ${crearImagenJuego(juego)}
                            </div>
                            <h3>${juego.nombre}</h3>
                        </div>
                    `;

                }

            });

        }

    }

}