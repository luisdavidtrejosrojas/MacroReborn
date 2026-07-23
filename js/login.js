// ==============================
// LOGIN - MacroReborn
// ==============================


const formulario = document.getElementById("formLogin");
const mensajeLogin = document.getElementById("mensajeLogin");
const cardLogin = document.getElementById("cardLogin");

function mostrarMensajeLogin(texto, tipo){
    if(!mensajeLogin){
        alert(texto);
        return;
    }
    mensajeLogin.textContent = texto;
    mensajeLogin.classList.remove("error", "exito", "visible");
    void mensajeLogin.offsetWidth;
    mensajeLogin.classList.add(tipo, "visible");

    if(tipo === "error" && cardLogin){
        cardLogin.classList.remove("auth-shake");
        void cardLogin.offsetWidth;
        cardLogin.classList.add("auth-shake");
    }
}


formulario.addEventListener("submit", function(e){

e.preventDefault();



let usuario = document.getElementById("usuario").value.trim();

let password = document.getElementById("password").value;



let usuarios = leerJSON(
localStorage.getItem("usuariosMacro") || "[]"
);



let encontrado = usuarios.find(u =>

u.nombre === usuario &&
u.password === password

);



if(encontrado){


encontrado.ultimaConexion = new Date().toLocaleString("es-AR");
encontrado.ultimaConexionTS = Date.now();



// actualizar usuario dentro de la lista

let usuariosActualizados = usuarios.map(u =>

u.nombre === encontrado.nombre ? encontrado : u

);



localStorage.setItem(
"usuariosMacro",
JSON.stringify(usuariosActualizados)
);



localStorage.setItem(
"usuarioActivo",
JSON.stringify(encontrado)
);



mostrarMensajeLogin("Bienvenido " + encontrado.nombre, "exito");

setTimeout(function(){
window.location.href="perfil.html";
}, 700);



}else{


mostrarMensajeLogin("Usuario o contraseña incorrectos", "error");


}



});