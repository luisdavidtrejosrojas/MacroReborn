// =========================
// MACROREBORN - FAVORITOS POR USUARIO
// =========================


const botonFavorito = document.querySelector(".boton-favorito");


const parametrosJuego = new URLSearchParams(window.location.search);


const idJuegoFavorito = String(parametrosJuego.get("id"));



const usuarioActivoFavoritos = leerJSON(
localStorage.getItem("usuarioActivo")
);





if(usuarioActivoFavoritos && botonFavorito){



const nombreUsuario = usuarioActivoFavoritos.nombre;



const claveFavoritos = "favoritos_" + nombreUsuario;



let favoritos = leerJSON(
localStorage.getItem(claveFavoritos)
) || [];







function actualizarBoton(){



if(favoritos.includes(idJuegoFavorito)){


botonFavorito.textContent = "⭐ En favoritos";


}else{


botonFavorito.textContent = "☆ Agregar favorito";


}



}





actualizarBoton();








botonFavorito.addEventListener("click",()=>{





if(favoritos.includes(idJuegoFavorito)){



favoritos = favoritos.filter(id => id !== idJuegoFavorito);



}else{



favoritos.push(idJuegoFavorito);



// ==============================
// ACTIVIDAD RECIENTE - FAVORITO
// ==============================

if(typeof registrarActividad === "function" && typeof juegos !== "undefined"){

const juegoFav = juegos.find(j => String(j.id) === idJuegoFavorito);

registrarActividad(
nombreUsuario,
"favorito",
juegoFav ? juegoFav.nombre : ("el juego #" + idJuegoFavorito)
);

}



}





localStorage.setItem(
claveFavoritos,
JSON.stringify(favoritos)
);





actualizarBoton();





});




}