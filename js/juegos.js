// =========================
// MACROREBORN - SISTEMA JUEGOS
// =========================












function crearJuego(juego){


return `


<div class="juego-card">


<div class="juego-card-top">
<span class="badge-categoria">${juego.categoria}</span>
<span class="badge-estado">${juego.estado}</span>
</div>


<div class="juego-imagen">

${crearImagenJuego(juego)}

</div>





<h3>

${juego.nombre}

</h3>





<p class="juego-descripcion-corta">

${juego.descripcion}

</p>







<a href="juego.html?id=${juego.id}">


<button>

🎮 Ver juego

</button>


</a>





</div>


`;


}









const destacados = document.querySelector("#juegosDestacados");

const nuevos = document.querySelector("#juegosNuevos");

const todos = document.querySelector("#listaJuegos");









juegos.forEach(juego => {



if(todos){


todos.innerHTML += crearJuego(juego);


}







if(juego.tipo === "destacado" && destacados){


destacados.innerHTML += crearJuego(juego);


}








if(juego.tipo === "nuevo" && nuevos){


nuevos.innerHTML += crearJuego(juego);


}



});



// SEO: datos estructurados ItemList del catálogo completo, para que
// los buscadores entiendan que esta página lista un conjunto de
// juegos (ayuda a mostrar resultados enriquecidos / sitelinks).
// Se arma con los mismos datos ya usados arriba, sin pedir nada nuevo.
if (typeof seoInyectarJSONLD === "function") {

    seoInyectarJSONLD("ldJsonCatalogo", {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Catálogo de juegos de MacroReborn",
        "itemListElement": juegos.map((juego, indice) => ({
            "@type": "ListItem",
            "position": indice + 1,
            "url": SEO_SITE + "/juego.html?id=" + juego.id,
            "name": juego.nombre
        }))
    });

}