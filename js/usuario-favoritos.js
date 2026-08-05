// =========================
// MACROREBORN - FAVORITOS USUARIO (Fase 2: Neon)
// =========================


const parametrosUsuario = new URLSearchParams(
window.location.search
);


const idUsuario = parametrosUsuario.get("usuario");


const seccionFavoritos = document.querySelector("#favoritos");


async function renderFavoritosUsuario(){

    if(!seccionFavoritos || !idUsuario) return;

    let favoritos = [];

    try{
        const resp = await fetch("/api/content?action=favorites&username=" + encodeURIComponent(idUsuario));
        const datos = await resp.json();
        favoritos = (datos && datos.success) ? datos.favoritos : [];
    }catch(error){
        console.warn("MacroReborn: no se pudieron cargar los favoritos.", error);
    }

    const texto = seccionFavoritos.querySelector("p");

    if(favoritos.length === 0){

        if(texto) texto.textContent = "Este usuario no tiene juegos favoritos.";

    }else{

        if(texto) texto.remove();

        favoritos.forEach(id=>{

            const juego = juegos.find(
                j => String(j.id) === String(id)
            );

            if(juego){

                seccionFavoritos.innerHTML += `
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

renderFavoritosUsuario();
