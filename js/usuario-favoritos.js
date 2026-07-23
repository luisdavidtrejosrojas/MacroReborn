// =========================
// MACROREBORN - FAVORITOS USUARIO
// =========================


const parametrosUsuario = new URLSearchParams(
window.location.search
);


const idUsuario = parametrosUsuario.get("usuario");



const seccionFavoritos = document.querySelector("#favoritos");





if(seccionFavoritos && idUsuario){



const clave = "favoritos_" + idUsuario;



const favoritos = leerJSON(
localStorage.getItem(clave)
) || [];





const texto = seccionFavoritos.querySelector("p");



if(favoritos.length === 0){


texto.textContent =
"Este usuario no tiene juegos favoritos.";



}else{



texto.remove();



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



<h3>

${juego.nombre}

</h3>


</div>


`;



}



});



}



}