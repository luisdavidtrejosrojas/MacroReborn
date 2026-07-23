// =========================
// MACROREBORN - PAGINA JUEGO
// =========================











// =========================
// CARGAR INFORMACION DEL JUEGO
// =========================



const parametros = new URLSearchParams(
window.location.search
);


const idJuego = Number(
parametros.get("id")
);



const juego = juegos.find(
j => j.id === idJuego
);





if(juego){



const imagen = document.querySelector(".juego-grande");

const nombre = document.querySelector(".nombre-juego");

const categoria = document.querySelector(".categoria-juego");

const estado = document.querySelector(".estado-juego");

const jugadores = document.querySelector(".jugadores-juego");

const descripcion = document.querySelector(".descripcion-juego");





if(imagen){

imagen.innerHTML = crearImagenJuego(juego, { lazy: false });

}



if(nombre){

nombre.textContent = juego.nombre;

}



if(categoria){

categoria.textContent =
"📂 Categoría: " + juego.categoria;

}



if(estado){

estado.textContent =
juego.estado;

}



// Nota: el campo "jugadores" no existe en los datos de los juegos,
// así que no se asigna texto acá (se evita mostrar "undefined").
// El elemento .jugadores-juego queda vacío y se oculta por CSS.



if(descripcion){

descripcion.textContent =
juego.descripcion;

}



// =========================
// SEO DINÁMICO (título, meta description, canonical, OG/Twitter
// y datos estructurados) según el juego cargado. juego.html es un
// único archivo que sirve a todos los juegos vía ?id=, así que sin
// esto todas las fichas compartirían el mismo <title> genérico.
// =========================

if (typeof seoActualizar === "function") {

    const urlFicha = SEO_SITE + "/juego.html?id=" + juego.id;
    const imagenAbsoluta = seoUrlAbsoluta(juego.imagen);
    const descripcionSEO = seoRecortarDescripcion(
        juego.descripcion ||
        ("Jugá a " + juego.nombre + " gratis online, sin instalar nada, en MacroReborn.")
    );

    seoActualizar({
        titulo: juego.nombre + " - Jugá gratis online | MacroReborn",
        descripcion: descripcionSEO,
        url: urlFicha,
        imagen: imagenAbsoluta
    });

    seoInyectarJSONLD("ldJsonJuego", {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": juego.nombre,
        "description": juego.descripcion || descripcionSEO,
        "image": imagenAbsoluta,
        "genre": juego.categoria,
        "url": urlFicha,
        "applicationCategory": "Game",
        "gamePlatform": "Web browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    });

    seoInyectarJSONLD("ldJsonBreadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Juegos", "item": SEO_SITE + "/juegos.html" },
            { "@type": "ListItem", "position": 2, "name": juego.nombre, "item": urlFicha }
        ]
    });

}



}









// =========================
// HISTORIAL AL JUGAR
// =========================



const botonJugar = document.querySelector(".boton-jugar");



const usuario = leerJSON(

localStorage.getItem("usuarioActivo")

);






if(botonJugar){



botonJugar.addEventListener("click",()=>{



if(!usuario){


alert("Iniciá sesión para jugar");


return;


}







const claveHistorial =

"historial_" + usuario.nombre;






let historial = leerJSON(

localStorage.getItem(claveHistorial)

) || [];







historial = historial.filter(

id => id !== String(idJuego)

);





historial.unshift(

String(idJuego)

);





historial = historial.slice(0,5);






localStorage.setItem(

claveHistorial,

JSON.stringify(historial)

);






// ==============================
// ACTIVIDAD RECIENTE - JUGAR
// ==============================

if(typeof registrarActividad === "function"){

registrarActividad(usuario.nombre, "juego", juego.nombre);

}





// ==============================
// JUEGOS DISTINTOS JUGADOS (para Explorador / Coleccionista)
// ==============================
// Se guarda por separado del historial (que solo conserva los últimos 5)
// para poder contar la cantidad total de juegos diferentes jugados alguna vez.

const claveJuegosUnicos =
"juegosJugados_" + usuario.nombre;

let juegosUnicos = leerJSON(
localStorage.getItem(claveJuegosUnicos)
) || [];

if(!juegosUnicos.includes(String(idJuego))){

juegosUnicos.push(String(idJuego));

localStorage.setItem(
claveJuegosUnicos,
JSON.stringify(juegosUnicos)
);

}


// ==============================
// LOGROS DE JUEGOS
// ==============================

if(typeof desbloquearLogro === "function"){

desbloquearLogro(usuario.nombre,"primerJuego");

if(juegosUnicos.length >= 5){

desbloquearLogro(usuario.nombre,"explorador");

}

if(juegosUnicos.length >= 30){

desbloquearLogro(usuario.nombre,"coleccionista");

}

}



// entrar al juego real

window.location.href =

"jugar.html?id=" + idJuego;





});



}