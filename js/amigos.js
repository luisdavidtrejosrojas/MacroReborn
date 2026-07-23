// ==============================
// AMIGOS - MacroReborn
// ==============================


// ---------- CLAVES ----------

const CLAVE_SOLICITUDES = "solicitudesAmigos";



// ---------- HELPERS ----------

function obtenerActivo(){

return leerJSON(
localStorage.getItem("usuarioActivo") || "null"
);

}



function obtenerSolicitudes(){

return leerJSON(
localStorage.getItem(CLAVE_SOLICITUDES) || "[]"
);

}



function guardarSolicitudes(lista){

localStorage.setItem(
CLAVE_SOLICITUDES,
JSON.stringify(lista)
);

}



function obtenerAmigos(nombre){

return leerJSON(
localStorage.getItem("amigos_" + nombre) || "[]"
);

}



function guardarAmigos(nombre,lista){

localStorage.setItem(
"amigos_" + nombre,
JSON.stringify(lista)
);

}



function obtenerAvatar(nombre){

return leerJSON(
localStorage.getItem("avatar_" + nombre) || "null"
);

}




// ---------- AVATAR ----------


const ORDEN_CAPAS = [

"fondo",
"espalda",
"modelo",
"piel",
"ojos",
"boca",
"botas",
"pantalon",
"remera",
"guantes",
"accesorio",
"cara",
"pelo",
"mascota",
"borde"

];




function rutaImagenCapa(valor){

if(!valor || valor==="ninguno")
return null;


if(!valor.includes("_")){

return "imagenes/"+valor+".png";

}


let partes = valor.split("_");


return "imagenes/"+partes[0]+"/"+partes.slice(1).join("_")+".png";

}




function htmlAvatarMini(nombre){


const avatar = obtenerAvatar(nombre);


const div=document.createElement("div");

div.className="amigo-avatar";



if(!avatar){

let img=document.createElement("img");

img.src="imagenes/avatar.png";

div.appendChild(img);

return div;

}



ORDEN_CAPAS.forEach(tipo=>{


const ruta=rutaImagenCapa(
avatar[tipo]
);



if(ruta){


let img=document.createElement("img");

img.src=ruta;

img.className="capa-amigo";


div.appendChild(img);


}



});



return div;

}




// ---------- RENDER AMIGOS ----------


function renderAmigos(activo){


const contenedor =
document.getElementById("listaAmigos");

if(!contenedor)return;



const lista =
obtenerAmigos(activo.nombre);



if(lista.length===0){

contenedor.innerHTML=
`
<p class="lista-vacia">
Todavía no tenés amigos.
</p>
`;

return;

}



contenedor.innerHTML="";



lista.forEach(nombre=>{


let card=document.createElement("div");

card.className="amigo-card";



card.appendChild(
htmlAvatarMini(nombre)
);



card.innerHTML += `

<div class="amigo-info">

<div class="amigo-nombre">
${nombre}
</div>

${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(nombre, true) : ""}

<a class="btn-ver-perfil"
href="usuario.html?usuario=${encodeURIComponent(nombre)}">

👤 Ver perfil

</a>


</div>

`;



contenedor.appendChild(card);



});


}




// ---------- SOLICITUDES ----------


function renderSolicitudes(activo){


const contenedor =
document.getElementById("listaSolicitudes");


if(!contenedor)return;



const solicitudes =
obtenerSolicitudes();



const recibidas =
solicitudes.filter(s=>

s.para===activo.nombre &&
s.estado==="pendiente"

);



if(recibidas.length===0){


contenedor.innerHTML=
`
<p class="lista-vacia">
No tenés solicitudes.
</p>
`;

return;

}



contenedor.innerHTML="";



recibidas.forEach(sol=>{


let div=document.createElement("div");


div.className="solicitud-card";



div.innerHTML=`

<div>
👤 ${sol.de}
</div>


<button class="btn-aceptar"
data-de="${sol.de}">

✅ Aceptar

</button>


`;



contenedor.appendChild(div);



});




document.querySelectorAll(".btn-aceptar")
.forEach(btn=>{


btn.onclick=()=>{


aceptarSolicitud(

btn.dataset.de,

activo.nombre

);


renderTodo(activo);


};



});



}




// ---------- ACEPTAR SOLICITUD ----------


function aceptarSolicitud(de,para){



let lista =
obtenerSolicitudes();



lista.forEach(s=>{


if(
s.de===de &&
s.para===para
){

s.estado="aceptada";

}


});



guardarSolicitudes(lista);




let amigos1 =
obtenerAmigos(de);


if(!amigos1.includes(para))

amigos1.push(para);


guardarAmigos(
de,
amigos1
);




let amigos2 =
obtenerAmigos(para);



if(!amigos2.includes(de))

amigos2.push(de);



guardarAmigos(
para,
amigos2
);




// LOGROS DE AMIGOS

if(typeof desbloquearLogro==="function"){

desbloquearLogro(de,"primerAmigo");
desbloquearLogro(para,"primerAmigo");

if(amigos1.length>=50) desbloquearLogro(de,"popular");
if(amigos2.length>=50) desbloquearLogro(para,"popular");

if(amigos1.length>=100) desbloquearLogro(de,"leyendaSocial");
if(amigos2.length>=100) desbloquearLogro(para,"leyendaSocial");

}


// ACTIVIDAD RECIENTE - AMIGO

if(typeof registrarActividad==="function"){

registrarActividad(de,"amigo",para);
registrarActividad(para,"amigo",de);

}



// NOTIFICACION

if(typeof crearNotificacion==="function"){


crearNotificacion(

de,

"🤝 Solicitud aceptada",

para+" aceptó tu solicitud de amistad."

);


}



}







// ---------- ENVIAR SOLICITUD ----------


function enviarSolicitud(de,para){



let lista =
obtenerSolicitudes();



lista.push({

de:de,

para:para,

estado:"pendiente"

});



guardarSolicitudes(lista);





if(typeof crearNotificacion==="function"){


crearNotificacion(

para,

"📩 Nueva solicitud de amistad",

de+" te envió una solicitud de amistad."

);


}



}





// ---------- PESTAÑAS ----------


function iniciarPestanas(){


const botones =
document.querySelectorAll(".atab");


const contenidos =
document.querySelectorAll(".atab-contenido");



botones.forEach(btn=>{


btn.addEventListener("click",()=>{


botones.forEach(b=>

b.classList.remove("activa-tab")

);



contenidos.forEach(c=>

c.classList.remove("activo-tab")

);



btn.classList.add("activa-tab");



const contenido =
document.getElementById(
btn.dataset.tab
);



if(contenido)

contenido.classList.add("activo-tab");



});


});


}







// ---------- SOLICITUDES ENVIADAS ----------


function renderEnviadas(activo){


const contenedor =
document.getElementById("listaEnviadas");


if(!contenedor)return;



const solicitudes =
obtenerSolicitudes();



const enviadas =
solicitudes.filter(s=>

s.de===activo.nombre &&
s.estado==="pendiente"

);



if(enviadas.length===0){


contenedor.innerHTML=
`
<p class="lista-vacia">
No enviaste solicitudes.
</p>
`;

return;

}



contenedor.innerHTML="";



enviadas.forEach(sol=>{


let div=document.createElement("div");


div.className="solicitud-card";


div.innerHTML=`

<div>
👤 ${sol.para}
</div>

<span class="badge">⏳ Pendiente</span>

`;



contenedor.appendChild(div);


});


}




// ---------- BADGES ----------


function actualizarBadges(activo){

const badgeAmigos = document.getElementById("badgeAmigos");
const badgeSolicitudes = document.getElementById("badgeSolicitudes");
const badgeEnviadas = document.getElementById("badgeEnviadas");

const solicitudes = obtenerSolicitudes();

const cantAmigos = obtenerAmigos(activo.nombre).length;

const cantRecibidas = solicitudes.filter(s=>
s.para===activo.nombre && s.estado==="pendiente"
).length;

const cantEnviadas = solicitudes.filter(s=>
s.de===activo.nombre && s.estado==="pendiente"
).length;

if(badgeAmigos) badgeAmigos.textContent = cantAmigos > 0 ? cantAmigos : "";
if(badgeSolicitudes) badgeSolicitudes.textContent = cantRecibidas > 0 ? cantRecibidas : "";
if(badgeEnviadas) badgeEnviadas.textContent = cantEnviadas > 0 ? cantEnviadas : "";

}




// ---------- RENDER TOTAL ----------


function renderTodo(activo){


renderAmigos(activo);

renderSolicitudes(activo);

renderEnviadas(activo);

actualizarBadges(activo);


}





// ---------- INICIO ----------


(function(){


const activo =
obtenerActivo();



const sinSesion =
document.getElementById("panelSinSesion");


const panel =
document.getElementById("panelAmigos");



if(!activo){


if(sinSesion)
sinSesion.style.display="block";


if(panel)
panel.style.display="none";


return;


}



if(sinSesion)
sinSesion.style.display="none";


if(panel)
panel.style.display="block";



iniciarPestanas();


renderTodo(activo);



})();