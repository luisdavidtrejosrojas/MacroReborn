// =========================
// MACROREBORN - HISTORIAL USUARIO (Fase 2: Neon)
// =========================


const parametrosHistorialUsuario = new URLSearchParams(
window.location.search
);


const idUsuarioHistorial = parametrosHistorialUsuario.get("usuario");


const seccionUltimos = document.querySelector("#ultimos");


async function renderHistorialUsuario(){

    if(!seccionUltimos || !idUsuarioHistorial) return;

    let historial = [];

    try{
        const resp = await fetch("/api/content?action=game-history&username=" + encodeURIComponent(idUsuarioHistorial));
        const datos = await resp.json();
        historial = (datos && datos.success) ? datos.historial : [];
    }catch(error){
        console.warn("MacroReborn: no se pudo cargar el historial.", error);
    }

    if(historial.length === 0){

        seccionUltimos.innerHTML = `
            <h2>🎮 Últimos jugados</h2>
            <p>Este usuario todavía no jugó ningún juego.</p>
        `;

    }else{

        seccionUltimos.innerHTML = `<h2>🎮 Últimos jugados</h2>`;

        historial.forEach(id=>{

            const juego = juegos.find(
                j => String(j.id) === String(id)
            );

            if(juego){

                seccionUltimos.innerHTML += `
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

renderHistorialUsuario();
