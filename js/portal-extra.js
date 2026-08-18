/* MacroReborn - bloques de descubrimiento en la Home */
document.addEventListener("DOMContentLoaded", function(){
  if(typeof juegos === "undefined" || !Array.isArray(juegos)) return;
  const footer=document.querySelector("footer.pie-footer");
  if(!footer) return;
  const wrap=document.createElement("div");
  wrap.className="mr-portal-extra";
  const base = typeof MRDescubrimiento !== "undefined" ? MRDescubrimiento : null;
  const categorias=base ? base.obtenerCategorias().slice(0,8) : [];
  const recomendados=base ? base.obtenerRecomendados(6) : juegos.slice(0,6);
  const populares=juegos.slice().sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,6);
  const catCards=categorias.map(([c,n])=>`<a class="mr-category-card" href="categoria.html?categoria=${encodeURIComponent(c)}"><strong>🎮 ${c}</strong><span>${n} juegos</span></a>`).join("");
  const cards=lista=>base ? lista.map(base.tarjeta).join("") : "";
  wrap.innerHTML=`
    <section class="mr-daily-shell" data-reto-diario></section>
    <section class="mr-discovery mr-home-discovery">
      <section class="mr-section"><div class="mr-section-head"><h2>✨ Recomendados para ti</h2><a href="juegos.html">Explorar catálogo →</a></div><div class="mr-game-grid">${cards(recomendados)}</div></section>
      <section class="mr-section"><div class="mr-section-head"><h2>🎯 Colecciones</h2><a href="coleccion.html">Ver colecciones →</a></div><div class="mr-category-cloud"><a class="mr-category-card" href="coleccion.html?coleccion=pokemon"><strong>⚡ Pokémon</strong><span>RPG y aventuras</span></a><a class="mr-category-card" href="coleccion.html?coleccion=mario"><strong>🍄 Mario</strong><span>Plataformas y clásicos</span></a><a class="mr-category-card" href="coleccion.html?coleccion=retro"><strong>👾 Retro</strong><span>Clásicos de consola</span></a><a class="mr-category-card" href="coleccion.html?coleccion=terror"><strong>👻 Terror</strong><span>Para jugar con las luces apagadas</span></a></div></section>
      <section class="mr-section"><div class="mr-section-head"><h2>🧭 Explorar por categoría</h2><a href="categoria.html">Todas →</a></div><div class="mr-category-cloud">${catCards}</div></section>
    </section>`;
  footer.parentNode.insertBefore(wrap, footer);

  if(base && typeof base.obtenerRecomendadosPersonalizados === "function"){
    base.obtenerRecomendadosPersonalizados(6).then(lista=>{
      if(!Array.isArray(lista) || !lista.length) return;
      const destino=document.querySelector("#personalizacionHome");
      if(!destino) return;
      destino.innerHTML=`<section class="mr-personal-home"><div class="mr-section-head"><div><span class="mr-kicker">PARA VOS</span><h2>✨ Recomendado según tu actividad</h2></div><a href="juegos.html">Ver catálogo →</a></div><div class="mr-game-grid">${lista.map(base.tarjeta).join("")}</div></section>`;
    }).catch(()=>{});
  }
});
