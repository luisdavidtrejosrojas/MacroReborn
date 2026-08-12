// =========================
// MACROREBORN - HISTORIAL PERFIL (Fase 2: Neon)
// =========================


const usuarioActivoHistorial = leerJSON(
localStorage.getItem("usuarioActivo")
);


const contenedorHistorial = document.querySelector("#ultimos");


async function renderHistorialPerfil(){

    if(!contenedorHistorial || !usuarioActivoHistorial) return;

    let historial = [];

    try{
        const resp = await fetch("/api/content?action=game-history&username=" + encodeURIComponent(usuarioActivoHistorial.nombre));
        const datos = await resp.json();
        historial = (datos && datos.success) ? datos.historial : [];
    }catch(error){
        console.warn("MacroReborn: no se pudo cargar el historial.", error);
    }

    if(historial.length === 0){

        contenedorHistorial.innerHTML = `
            <h2>🎮 Últimos jugados</h2>
            <p>Todavía no jugaste ningún juego.</p>
        `;

    }else{

        contenedorHistorial.innerHTML = `<h2>🎮 Últimos jugados</h2>`;

        historial.forEach(id=>{

            const juego = juegos.find(
                j => String(j.id) === String(id)
            );

            if(juego){

                contenedorHistorial.innerHTML += `
                    <a href="juego.html?id=${encodeURIComponent(juego.id)}" class="juego-card">
                        <div class="juego-imagen">
                            ${crearImagenJuego(juego)}
                        </div>
                        <h3>${juego.nombre}</h3>
                    </a>
                `;

            }

        });

    }

}

renderHistorialPerfil();
