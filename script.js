// ============================================
// MacroReborn — script.js
// ============================================


// --- Generar partículas decorativas al cargar ---
function crearParticulas() {
  const contenedor = document.getElementById('particulas');
  const cantidad = 40;

  for (let i = 0; i < cantidad; i++) {
    const punto = document.createElement('div');
    punto.classList.add('particula');

    // Posición aleatoria en la pantalla
    punto.style.left = Math.random() * 100 + '%';
    punto.style.top  = Math.random() * 100 + '%';

    // Retraso aleatorio para que no parpadeen todas juntas
    punto.style.animationDelay    = Math.random() * 4 + 's';
    punto.style.animationDuration = (2 + Math.random() * 3) + 's';

    // Algunas partículas son cyan en vez de dorado
    if (Math.random() > 0.7) {
      punto.style.background = '#38bdf8';
    }

    contenedor.appendChild(punto);
  }
}


// --- Manejar si logo.png existe o mostrar el placeholder ---
function manejarLogo() {
  const logo        = document.getElementById('logo');
  const placeholder = document.getElementById('logo-placeholder');

  if (!logo) return;

  // Si la imagen carga bien, ocultamos el placeholder
  logo.addEventListener('load', function () {
    placeholder.style.display = 'none';
    logo.style.position = 'static';
  });

  // Si la imagen falla (no existe aún), ocultamos el <img> y mostramos el placeholder
  logo.addEventListener('error', function () {
    logo.style.display = 'none';
    placeholder.style.zIndex = '1';
  });
}


// --- Transición de la pantalla de inicio a la página principal ---
function entrar() {
  const pantalla  = document.getElementById('pantalla-inicio');
  const principal = document.getElementById('pagina-principal');

  // Efecto de desvanecimiento
  pantalla.style.transition = 'opacity 0.5s ease';
  pantalla.style.opacity    = '0';

  setTimeout(function () {
    pantalla.classList.add('oculto');
    principal.classList.remove('oculto');
    principal.style.opacity = '0';
    principal.style.transition = 'opacity 0.4s ease';

    // Pequeño retardo para que el fade-in se note
    setTimeout(function () {
      principal.style.opacity = '1';
    }, 30);
  }, 500);
}


// --- Mostrar una sección y ocultar las demás ---
function mostrarSeccion(nombre) {
  // Ocultar todas las secciones
  const todasLasSecciones = document.querySelectorAll('.seccion');
  todasLasSecciones.forEach(function (sec) {
    sec.classList.add('oculto');
    sec.classList.remove('activa');
  });

  // Mostrar la sección pedida
  const objetivo = document.getElementById('seccion-' + nombre);
  if (objetivo) {
    objetivo.classList.remove('oculto');
    objetivo.classList.add('activa');
  }
}


// --- Inicialización cuando carga la página ---
document.addEventListener('DOMContentLoaded', function () {
  crearParticulas();
  manejarLogo();
});
