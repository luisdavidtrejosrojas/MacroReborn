/* MacroReborn — capa adicional de crecimiento.
 * No reemplaza funciones existentes. Solo añade descubrimiento, ligas,
 * señales sociales y resumen de economía/progresión usando APIs ya existentes.
 */
(function(){
  "use strict";

  const esc = (v) => String(v ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");

  const activo = (() => {
    try { return JSON.parse(localStorage.getItem("usuarioActivo") || "null"); }
    catch (_) { return null; }
  })();

  async function json(url, options){
    const r = await fetch(url, options);
    if(!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  function ligaPorPosicion(pos, total){
    if(!pos || !total) return {nombre:"Bronce", icono:"🥉", clase:"bronce"};
    const pct = pos / total;
    if(pct <= 0.03) return {nombre:"Leyenda", icono:"👑", clase:"leyenda"};
    if(pct <= 0.10) return {nombre:"Maestro", icono:"💎", clase:"maestro"};
    if(pct <= 0.20) return {nombre:"Diamante", icono:"💠", clase:"diamante"};
    if(pct <= 0.40) return {nombre:"Platino", icono:"🏆", clase:"platino"};
    if(pct <= 0.65) return {nombre:"Oro", icono:"🥇", clase:"oro"};
    if(pct <= 0.85) return {nombre:"Plata", icono:"🥈", clase:"plata"};
    return {nombre:"Bronce", icono:"🥉", clase:"bronce"};
  }

  function montarFiltrosCatalogo(){
    const main = document.querySelector(".contenido-principal");
    if(!main || document.getElementById("mrCatalogoGrowth")) return;
    const host = document.createElement("section");
    host.id = "mrCatalogoGrowth";
    host.className = "mr-growth-toolbar";
    host.innerHTML = `
      <div class="mr-growth-toolbar-head">
        <div><span class="mr-growth-kicker">DESCUBRIMIENTO</span><h2>Encontrá tu próximo juego</h2></div>
        <span class="mr-growth-count" id="mrGrowthResultados"></span>
      </div>
      <div class="mr-growth-controls">
        <label class="mr-growth-search">🔎 <input id="filtroBusquedaJuegos" type="search" placeholder="Buscar por nombre, género o descripción…" autocomplete="off"></label>
        <label><span>📂</span><select id="filtroCategoria"><option value="">Todas las categorías</option></select></label>
        <label><span>↕️</span><select id="filtroOrden"><option value="destacados">Destacados</option><option value="jugados">Más jugados</option><option value="trending">Tendencias</option><option value="valorados">Mejor valorados</option><option value="favoritos">Más favoritos</option><option value="nuevos">Nuevos</option><option value="az">A–Z</option></select></label>
      </div>
      <div class="mr-growth-shortcuts">
        <a href="juegos.html?orden=trending">🔥 Tendencias</a><a href="juegos.html?orden=jugados">👑 Más jugados</a><a href="juegos.html?orden=nuevos">🆕 Nuevos</a><a href="juegos.html?orden=valorados">⭐ Mejor valorados</a>
      </div>`;
    main.prepend(host);

    const q = document.getElementById("filtroBusquedaJuegos");
    const c = document.getElementById("filtroCategoria");
    const o = document.getElementById("filtroOrden");
    const out = document.getElementById("mrGrowthResultados");
    const p = new URLSearchParams(location.search);
    if(q) q.value = p.get("q") || "";
    if(c) c.value = p.get("categoria") || "";
    if(o) o.value = p.get("orden") || "destacados";

    function poblar(){
      if(!c || typeof juegos === "undefined") return;
      const cats=[...new Set(juegos.map(x=>x.categoria).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
      c.innerHTML='<option value="">Todas las categorías</option>'+cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
      c.value=p.get("categoria") || "";
    }
    function apply(){
      const params=new URLSearchParams(location.search);
      const term=(q?.value || params.get("q") || "").trim();
      const cat=c?.value || params.get("categoria") || "";
      const ord=o?.value || params.get("orden") || "destacados";
      const url=new URL(location.href); url.searchParams.delete("q"); url.searchParams.delete("categoria"); url.searchParams.delete("orden");
      if(term) url.searchParams.set("q",term); if(cat) url.searchParams.set("categoria",cat); if(ord && ord!=="destacados") url.searchParams.set("orden",ord);
      history.replaceState(null,"",url.pathname+(url.search?url.search:""));
      if(typeof window.aplicarFiltrosMacroCatalogo === "function") window.aplicarFiltrosMacroCatalogo();
      if(out) out.textContent=term || cat || ord!=="destacados" ? "Filtros activos" : "Descubrí por categoría, tendencia o popularidad";
    }
    q?.addEventListener("input",apply); c?.addEventListener("change",apply); o?.addEventListener("change",apply);
    document.addEventListener("macroreborn:catalogo-listo",poblar,{once:false});
    poblar();
  }

  async function montarLigas(){
    const host=document.getElementById("mrLigasPanel");
    if(!host) return;
    try{
      const data=await json("/api/users?limit=500");
      const users=(data?.users||[]).slice().sort((a,b)=>(Number(a.rank_actual)||999999)-(Number(b.rank_actual)||999999));
      const total=users.length;
      const activoNombre=activo?.username || activo?.nombre || "";
      const mio=users.findIndex(u=>String(u.username||"").toLowerCase()===String(activoNombre).toLowerCase())+1;
      const liga=mio?ligaPorPosicion(mio,total):null;
      const grupos={}; users.forEach((u,i)=>{const l=ligaPorPosicion(i+1,total); (grupos[l.nombre] ||= []).push({...u,rank:i+1,liga:l});});
      host.innerHTML=`
        <div class="mr-league-head"><div><span class="mr-growth-kicker">COMPETICIÓN</span><h2>🏆 Ligas MacroReborn</h2><p>Tu liga se calcula sobre la posición actual del ranking. La competición sigue usando el ranking real del servidor.</p></div>${liga?`<div class="mr-my-league ${liga.clase}">${liga.icono}<strong>${liga.nombre}</strong><span>#${mio}</span></div>`:"<a href=\"login.html\" class=\"mr-league-login\">Iniciá sesión para ver tu liga</a>"}</div>
        <div class="mr-league-grid">${Object.entries(grupos).map(([nombre,arr])=>{const l=arr[0]?.liga||ligaPorPosicion(999,1000); return `<div class="mr-league-card ${l.clase}"><div class="mr-league-card-title"><span>${l.icono}</span><b>${nombre}</b><em>${arr.length}</em></div><div class="mr-league-mini">${arr.slice(0,5).map(u=>`<a href="usuario.html?usuario=${encodeURIComponent(u.username)}"><span>#${u.rank}</span> @${esc(u.username)}</a>`).join("")}</div></div>`;}).join("")}</div>`;
    }catch(err){ host.innerHTML=""; }
  }

  async function montarAmigosEnFicha(){
    const host=document.getElementById("mrJuegoAmigos");
    const juego=window.macroRebornJuegoActual;
    if(!host || !activo || !juego) return;
    try{
      const amigos=await json("/api/social?action=friends&username="+encodeURIComponent(activo.username||activo.nombre));
      const lista=Array.isArray(amigos?.amigos)?amigos.amigos:[];
      if(!lista.length){ host.innerHTML='<p class="mr-social-empty">Agregá amigos para ver quién juega lo mismo que vos.</p>'; return; }
      const comprobaciones=await Promise.all(lista.slice(0,12).map(async a=>{
        try{
          const h=await json("/api/content?action=game-history&username="+encodeURIComponent(a.username)+"&viewer="+encodeURIComponent(activo.username||activo.nombre));
          return h?.historial?.map(String).includes(String(juego.id))?a:null;
        }catch(_){return null;}
      }));
      const jugado=comprobaciones.filter(Boolean);
      host.innerHTML=jugado.length
        ? `<div class="mr-social-title">👥 Tus amigos jugaron este juego</div><div class="mr-social-friends">${jugado.map(a=>`<a href="usuario.html?usuario=${encodeURIComponent(a.username)}" class="mr-social-friend"><span class="mr-social-avatar">${String(a.username).slice(0,1).toUpperCase()}</span><span>@${esc(a.username)}</span><small>Nivel ${Number(a.level)||1}</small></a>`).join("")}</div>`
        : '<p class="mr-social-empty">Ninguno de tus amigos aparece entre los últimos jugadores de este título.</p>';
    }catch(_){ host.innerHTML=""; }
  }

  async function montarEconomiaPerfil(){
    const host=document.getElementById("mrEconomiaPerfil");
    if(!host || !activo) return;
    try{
      const datos=await json("/api/content?action=avatar-shop&username="+encodeURIComponent(activo.username||activo.nombre));
      host.innerHTML=`<div class="mr-economy-line"><span>🪙</span><div><b>${Number(datos.monedas||0).toLocaleString("es-AR")}</b><small>Monedas disponibles</small></div><a href="comunidad-ranking.html#tienda">Abrir tienda</a></div>`;
    }catch(_){ host.innerHTML=""; }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    montarFiltrosCatalogo(); montarLigas(); montarAmigosEnFicha(); montarEconomiaPerfil();
  });
  document.addEventListener("macroreborn:catalogo-listo",()=>montarFiltrosCatalogo());
})();
