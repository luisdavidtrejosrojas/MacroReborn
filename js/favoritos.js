// =========================
// MACROREBORN - FAVORITOS POR USUARIO (Fase 2: Neon)
// =========================


const botonFavorito = document.querySelector(".boton-favorito");


const parametrosJuego = new URLSearchParams(window.location.search);


const idJuegoFavorito = String(parametrosJuego.get("id"));



const usuarioActivoFavoritos = leerJSON(
localStorage.getItem("usuarioActivo")
);



if(usuarioActivoFavoritos && botonFavorito){



const nombreUsuario = usuarioActivoFavoritos.nombre;



let esFavoritoActual = false;



function actualizarBoton(){

    botonFavorito.textContent = esFavoritoActual
        ? "⭐ En favoritos"
        : "☆ Agregar favorito";

}



async function cargarEstadoFavorito(){

    try{
        const resp = await fetch("/api/content?action=favorites&username=" + encodeURIComponent(nombreUsuario));
        const datos = await resp.json();
        esFavoritoActual = (datos && datos.success)
            ? datos.favoritos.includes(idJuegoFavorito)
            : false;
    }catch(error){
        console.warn("MacroReborn: no se pudo cargar el estado de favorito.", error);
    }

    actualizarBoton();

}

cargarEstadoFavorito();



botonFavorito.addEventListener("click", async ()=>{

    if(botonFavorito.disabled) return;
    botonFavorito.disabled = true;

    try{
        const resp = await fetch("/api/content?action=favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: nombreUsuario, gameId: idJuegoFavorito })
        });
        const datos = await resp.json();

        if(datos && datos.success){
            esFavoritoActual = datos.favorito;

            // ==============================
            // ACTIVIDAD RECIENTE - FAVORITO
            // ==============================
            if(esFavoritoActual && typeof registrarActividad === "function" && typeof juegos !== "undefined"){
                const juegoFav = juegos.find(j => String(j.id) === idJuegoFavorito);
                registrarActividad(
                    nombreUsuario,
                    "favorito",
                    juegoFav ? juegoFav.nombre : ("el juego #" + idJuegoFavorito)
                );
            }

            actualizarBoton();
        }
    }catch(error){
        console.warn("MacroReborn: no se pudo actualizar el favorito.", error);
    }finally{
        botonFavorito.disabled = false;
    }

});



}
