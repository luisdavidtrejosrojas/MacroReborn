// =========================
// MACROREBORN - HISTORIAL USUARIO
// =========================



const parametrosHistorialUsuario = new URLSearchParams(
window.location.search
);



const idUsuarioHistorial = parametrosHistorialUsuario.get("usuario");



const seccionUltimos = document.querySelector("#ultimos");








if(seccionUltimos && idUsuarioHistorial){



const claveHistorial = 
"historial_" + idUsuarioHistorial;




const historial = leerJSON(

localStorage.getItem(claveHistorial)

) || [];






if(historial.length === 0){



seccionUltimos.innerHTML = `


<h2>
🎮 Últimos jugados
</h2>


<p>
Este usuario todavía no jugó ningún juego.
</p>


`;



}else{



seccionUltimos.innerHTML = `


<h2>
🎮 Últimos jugados
</h2>


`;






historial.forEach(id=>{



const juego = juegos.find(

j => String(j.id) === String(id)

);



if(juego){



seccionUltimos.innerHTML += `


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