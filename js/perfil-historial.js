// =========================
// MACROREBORN - HISTORIAL PERFIL
// =========================


const usuarioActivoHistorial = leerJSON(
localStorage.getItem("usuarioActivo")
);



const contenedorHistorial = document.querySelector("#ultimos");





if(contenedorHistorial && usuarioActivoHistorial){



const claveHistorial = 
"historial_" + usuarioActivoHistorial.nombre;



const historial = leerJSON(
localStorage.getItem(claveHistorial)
) || [];





if(historial.length === 0){



contenedorHistorial.innerHTML = `

<h2>
🎮 Últimos jugados
</h2>

<p>
Todavía no jugaste ningún juego.
</p>

`;



}else{



contenedorHistorial.innerHTML = `

<h2>
🎮 Últimos jugados
</h2>

`;





historial.forEach(id=>{



const juego = juegos.find(
j => String(j.id) === String(id)
);




if(juego){



contenedorHistorial.innerHTML += `


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