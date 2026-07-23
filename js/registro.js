// ==============================
// REGISTRO - MacroReborn
// ==============================


const formulario = document.getElementById("formRegistro");
const mensajeRegistro = document.getElementById("mensajeRegistro");
const cardRegistro = document.getElementById("cardRegistro");

function mostrarMensajeRegistro(texto, tipo){
    if(!mensajeRegistro){
        alert(texto);
        return;
    }
    mensajeRegistro.textContent = texto;
    mensajeRegistro.classList.remove("error", "exito", "visible");
    void mensajeRegistro.offsetWidth;
    mensajeRegistro.classList.add(tipo, "visible");

    if(tipo === "error" && cardRegistro){
        cardRegistro.classList.remove("auth-shake");
        void cardRegistro.offsetWidth;
        cardRegistro.classList.add("auth-shake");
    }
}


formulario.addEventListener("submit", function(e){

e.preventDefault();


let nombre = document.getElementById("usuario").value.trim();

let password = document.getElementById("password").value;

let confirmar = document.getElementById("confirmar").value;



if(!nombre || !password || !confirmar){

mostrarMensajeRegistro("Completá usuario y contraseña para registrarte", "error");
return;

}



if(password !== confirmar){

mostrarMensajeRegistro("Las contraseñas no coinciden", "error");
return;

}



let usuarios = leerJSON(
localStorage.getItem("usuariosMacro") || "[]"
);



let existe = usuarios.find(u => u.nombre === nombre);



if(existe){

mostrarMensajeRegistro("Ese usuario ya existe", "error");
return;

}



// FECHA DE REGISTRO

let fechaRegistro = new Date().toLocaleDateString("es-AR");



let nuevo = {

nombre:nombre,

password:password,

nivel:1,

xp:0,

logros:0,

fechaRegistro: fechaRegistro,

biografia:"Todavía no escribió una biografía.",

insignias:[],

suspendido:false

};



usuarios.push(nuevo);



localStorage.setItem(
"usuariosMacro",
JSON.stringify(usuarios)
);



mostrarMensajeRegistro("Cuenta creada 🎮", "exito");

setTimeout(function(){
window.location.href="login.html";
}, 700);


});