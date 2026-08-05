// =========================
// MACROREBORN - FAVORITOS PERFIL (Fase 2: Neon)
// =========================

const usuarioActivoFavoritos = leerJSON(
    localStorage.getItem("usuarioActivo")
);

const contenedorFavoritos = document.querySelector(".juegos-favoritos");

async function renderFavoritosPerfil(){

    if (!contenedorFavoritos) return;

    if (!usuarioActivoFavoritos) {

        contenedorFavoritos.innerHTML = `
            <p>Iniciá sesión para ver tus juegos favoritos.</p>
        `;

        return;

    }

    let favoritos = [];

    try{
        const resp = await fetch("/api/content?action=favorites&username=" + encodeURIComponent(usuarioActivoFavoritos.nombre));
        const datos = await resp.json();
        favoritos = (datos && datos.success) ? datos.favoritos : [];
    }catch(error){
        console.warn("MacroReborn: no se pudieron cargar los favoritos.", error);
    }

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

renderFavoritosPerfil();
