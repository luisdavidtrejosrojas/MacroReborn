/* MacroReborn - reto diario visual.
 * El progreso se basa en juegos distintos iniciados hoy en este navegador.
 * No concede premios por sí mismo: los premios reales siguen dependiendo
 * del sistema de XP/logros del servidor.
 */
(function(){
  "use strict";
  const KEY="macroRebornRetoDiario";
  function hoy(){return new Date().toISOString().slice(0,10);}
  function leer(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||"null");
      if(!x || x.fecha!==hoy()) return {fecha:hoy(),juegos:[]};
      return {fecha:x.fecha,juegos:Array.isArray(x.juegos)?x.juegos:[]};
    }catch(e){return {fecha:hoy(),juegos:[]};}
  }
  function guardar(data){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}}
  function registrar(id){
    if(id==null) return;
    const data=leer();
    const sid=String(id);
    if(!data.juegos.includes(sid)){
      data.juegos.push(sid);
      guardar(data);
    }
  }
  function progreso(){return Math.min(3,leer().juegos.length);}
  function render(){
    document.querySelectorAll("[data-reto-diario]").forEach(el=>{
      const n=progreso(), pct=(n/3)*100;
      el.innerHTML=`<div class="mr-daily-card">
        <div class="mr-daily-main"><div class="mr-daily-kicker">🎯 Reto diario</div><h2>Probá 3 juegos diferentes hoy</h2><p>Descubrí títulos nuevos y completá tu objetivo diario de exploración.</p>
          <div class="mr-daily-progress"><div class="mr-daily-track"><div class="mr-daily-fill" style="width:${pct}%"></div></div><div class="mr-daily-count">${n}/3</div></div>
          <div class="mr-daily-actions"><a href="juegos.html">🎮 Explorar juegos</a><a href="ranking.html">🏆 Ver ranking</a></div>
        </div>
        <div class="mr-daily-side"><div class="mr-daily-reward">+25 XP</div><div class="mr-daily-status">${n>=3 ? "✅ Reto completado. El premio queda sujeto al sistema de XP del servidor." : `Te faltan ${3-n} juego${3-n===1?"":"s"}.`}</div></div>
      </div>`;
    });
  }
  window.registrarJuegoRetoDiario=registrar;
  window.actualizarRetoDiario=render;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",render); else render();
})();
