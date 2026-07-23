// =========================
// MACROREBORN - SISTEMA XP
// =========================


let intervaloXP;



function iniciarXP(){

    clearInterval(intervaloXP);



    intervaloXP = setInterval(()=>{


        ganarXP(10);


    },60000); // 1 minuto



}





function detenerXP(){


    clearInterval(intervaloXP);

}





function ganarXP(cantidad){


    const usuario = leerJSON(
        localStorage.getItem("usuarioActivo")
    );



    if(!usuario) return;




    usuario.xp = usuario.xp || 0;

    usuario.nivel = usuario.nivel || 1;



    usuario.xp += cantidad;




    let necesario = xpNecesaria(usuario.nivel);




    if(usuario.xp >= necesario){



        usuario.nivel++;



        usuario.xp = 0;



        mostrarToastNivel(
            "⭐ ¡Subiste al nivel " + usuario.nivel + "!"
        );

        // ==============================
// NOTIFICACION DE NIVEL
// ==============================

if(typeof crearNotificacion === "function"){

    crearNotificacion(

        usuario.nombre,

        "⭐ Nuevo nivel",

        "Subiste al nivel " + usuario.nivel + "."

    );
    

}

        // ==============================
        // ACTIVIDAD RECIENTE - NIVEL
        // ==============================

        if(typeof registrarActividad === "function"){

            registrarActividad(usuario.nombre, "nivel", usuario.nivel);

        }


        // ==============================
        // LOGROS DE NIVEL
        // ==============================

        if(typeof desbloquearLogro === "function"){

            const hitosNivel = {
                2:"nivel2",
                5:"nivel5",
                10:"nivel10",
                25:"nivel25",
                50:"nivel50",
                100:"nivel100",
                200:"nivel200",
                300:"nivel300",
                400:"nivel400",
                500:"nivel500",
                1000:"nivel1000"
            };

            if(hitosNivel[usuario.nivel]){
                desbloquearLogro(usuario.nombre, hitosNivel[usuario.nivel]);
            }

        }



    }




    guardarUsuario(usuario);



}





function mostrarToastNivel(mensaje){

    let contenedor = document.getElementById("toastNivelContenedor");

    if(!contenedor){

        contenedor = document.createElement("div");
        contenedor.id = "toastNivelContenedor";
        contenedor.style.position = "fixed";
        contenedor.style.top = "20px";
        contenedor.style.left = "50%";
        contenedor.style.transform = "translateX(-50%)";
        contenedor.style.zIndex = "999999";
        contenedor.style.display = "flex";
        contenedor.style.flexDirection = "column";
        contenedor.style.gap = "8px";
        contenedor.style.pointerEvents = "none";

        document.body.appendChild(contenedor);

    }

    const toast = document.createElement("div");
    toast.textContent = mensaje;
    toast.style.background = "#1e1e2f";
    toast.style.color = "#ffd54a";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "10px";
    toast.style.fontWeight = "bold";
    toast.style.fontSize = "15px";
    toast.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)";
    toast.style.border = "1px solid #ffd54a";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.transform = "translateY(-10px)";

    contenedor.appendChild(toast);

    requestAnimationFrame(()=>{
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(()=>{

        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";

        setTimeout(()=>{
            toast.remove();
        }, 300);

    }, 3500);

}


function xpNecesaria(nivel){



    if(nivel === 1){

        return 50;

    }



    if(nivel === 2){

        return 100;

    }



    return 100 + ((nivel - 2) * 200);



}





function guardarUsuario(usuario){



    localStorage.setItem(

        "usuarioActivo",

        JSON.stringify(usuario)

    );



    let usuarios =
    leerJSON(
        localStorage.getItem("usuariosMacro")
    ) || [];



    usuarios = usuarios.map(u=>{


        if(u.nombre === usuario.nombre){

            return usuario;

        }


        return u;


    });



    localStorage.setItem(

        "usuariosMacro",

        JSON.stringify(usuarios)

    );



}