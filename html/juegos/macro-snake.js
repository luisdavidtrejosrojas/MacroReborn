(function(){
  "use strict";
  const canvas=document.getElementById("board"),ctx=canvas.getContext("2d");
  const scoreEl=document.getElementById("score"),bestEl=document.getElementById("best"),streakEl=document.getElementById("streak"),status=document.getElementById("status");
  const size=26, cell=canvas.width/size;
  let snake,food,dir,nextDir,running=false,score=0,timer=null,roundStartedAt=0;
  let best=Number(localStorage.getItem("mr_macro_snake_best")||0),streak=Number(localStorage.getItem("mr_macro_snake_streak")||0);
  bestEl.textContent=best; streakEl.textContent=streak;
  function user(){try{return JSON.parse(localStorage.getItem("usuarioActivo")||"null")}catch(_){return null}}
  function setStatus(t){status.textContent=t}
  function reset(){snake=[{x:12,y:13},{x:11,y:13},{x:10,y:13}];dir={x:1,y:0};nextDir={x:1,y:0};score=0;placeFood();draw();scoreEl.textContent="0";setStatus("Pulsa Empezar. Usa las flechas o WASD.")}
  function placeFood(){do{food={x:Math.floor(Math.random()*size),y:Math.floor(Math.random()*size)}}while(snake.some(p=>p.x===food.x&&p.y===food.y))}
  function change(x,y){if(x===-dir.x&&y===-dir.y)return;nextDir={x,y}}
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#0b120d";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle="rgba(255,255,255,.025)";for(let i=1;i<size;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(canvas.width,i*cell);ctx.stroke()}ctx.fillStyle="#ffd65a";ctx.beginPath();ctx.arc(food.x*cell+cell/2,food.y*cell+cell/2,cell*.3,0,Math.PI*2);ctx.fill();snake.forEach((p,i)=>{ctx.fillStyle=i===0?"#b7ff9f":"#74e36e";ctx.beginPath();ctx.roundRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4,6);ctx.fill()})}
  function tick(){dir=nextDir;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=size||head.y<0||head.y>=size||snake.some((p,i)=>i>0&&p.x===head.x&&p.y===head.y))return end();snake.unshift(head);if(head.x===food.x&&head.y===food.y){score+=10;scoreEl.textContent=score;placeFood()}else snake.pop();draw()}
  async function registerPlay(){const u=user();if(!u?.nombre)return;try{await fetch("../../api/content?action=game-history",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u.nombre,gameId:"macro-snake"})})}catch(_){} localStorage.setItem("mr_originals_played","1");try{if(typeof iniciarXP==="function")iniciarXP("macro-snake")}catch(_){} }
  async function reward(){const u=user();if(!u?.nombre)return;try{if(typeof ganarXP==="function")await ganarXP(Math.min(40,10+Math.floor(score/10)*5))}catch(_){} try{if(typeof registrarActividad==="function")registrarActividad(u.nombre,"macro-original","Macro Snake: "+score+" puntos")}catch(_){} }
  async function submitScore(){
    const u=user();
    const token=localStorage.getItem("macroSessionToken");
    if(!u?.nombre || !token) return null;
    try{
      const response=await fetch("../../api/originales-ranking?action=score",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({gameId:"113",score})
      });
      const data=await response.json();
      if(!response.ok || !data?.success) return null;
      const serverBest=Number(data.mejorPuntuacion||score);
      if(serverBest>best){
        best=serverBest;
        localStorage.setItem("mr_macro_snake_best",String(best));
        bestEl.textContent=best;
      }
      return data;
    }catch(_){
      return null;
    }
  }
  function start(){if(running)return;running=true;roundStartedAt=Date.now();streak+=1;localStorage.setItem("mr_macro_snake_streak",String(streak));streakEl.textContent=streak;registerPlay();setStatus("¡En marcha! Come la fruta amarilla.");clearInterval(timer);timer=setInterval(tick,105);}
  async function end(){if(!running)return;running=false;clearInterval(timer);timer=null;const localRecord=score>best;if(localRecord){best=score;localStorage.setItem("mr_macro_snake_best",String(best));bestEl.textContent=best;setStatus("🏆 Nuevo récord: "+score+" puntos. Guardando clasificación…")}else setStatus("Fin de partida: "+score+" puntos. Guardando clasificación…");await reward();const result=await submitScore();if(result){const esMejorServidor=Number(result.mejorPuntuacion||0)===score;setStatus(esMejorServidor?"🏆 Récord registrado en la clasificación: "+score+" puntos.":"✅ Puntuación registrada: "+score+" puntos. Récord: "+Number(result.mejorPuntuacion||best)+".")}else if(score>0){setStatus(localRecord?"🏆 Nuevo récord local: "+score+" puntos. Inicia sesión para competir en la clasificación.":"Fin de partida: "+score+" puntos. Inicia sesión para enviar tu puntuación.")}}
  document.getElementById("start").addEventListener("click",start);document.getElementById("restart").addEventListener("click",()=>{clearInterval(timer);running=false;reset()});
  document.addEventListener("keydown",e=>{const m={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};if(m[e.key]){e.preventDefault();change(...m[e.key])}if(e.key==="Enter"&&!running)start()});
  canvas.addEventListener("pointerdown",e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,dx=x-r.width/2,dy=y-r.height/2;if(Math.abs(dx)>Math.abs(dy))change(dx>0?1:-1,0);else change(0,dy>0?1:-1);if(!running)start()});
  reset();
})();
