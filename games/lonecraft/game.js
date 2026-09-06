(() => {
  'use strict';

  const D=window.LonecraftData,W=window.LonecraftWorld;
  if(!D||!W)return;
  const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
  const lightCanvas=document.createElement('canvas');lightCanvas.width=canvas.width;lightCanvas.height=canvas.height;const lctx=lightCanvas.getContext('2d');
  const SAVE_KEY='lonecraftSaveV1',TILE=16,VIEW_W=canvas.width,VIEW_H=canvas.height;
  const el={
    hud:document.getElementById('hud'),healthFill:document.getElementById('healthFill'),healthText:document.getElementById('healthText'),staminaFill:document.getElementById('staminaFill'),staminaText:document.getElementById('staminaText'),levelName:document.getElementById('levelName'),objectiveText:document.getElementById('objectiveText'),scoreText:document.getElementById('scoreText'),
    titleScreen:document.getElementById('titleScreen'),newWorldButton:document.getElementById('newWorldButton'),continueButton:document.getElementById('continueButton'),howButton:document.getElementById('howButton'),helpScreen:document.getElementById('helpScreen'),closeHelp:document.getElementById('closeHelp'),
    pauseButton:document.getElementById('pauseButton'),pauseScreen:document.getElementById('pauseScreen'),pauseLevel:document.getElementById('pauseLevel'),pauseTime:document.getElementById('pauseTime'),pauseScore:document.getElementById('pauseScore'),resumeButton:document.getElementById('resumeButton'),saveButton:document.getElementById('saveButton'),restartButton:document.getElementById('restartButton'),
    deadScreen:document.getElementById('deadScreen'),deadStats:document.getElementById('deadStats'),deadRestartButton:document.getElementById('deadRestartButton'),winScreen:document.getElementById('winScreen'),winStats:document.getElementById('winStats'),winRestartButton:document.getElementById('winRestartButton'),
    quickbar:document.getElementById('quickbar'),prevItem:document.getElementById('prevItem'),nextItem:document.getElementById('nextItem'),activeItemButton:document.getElementById('activeItemButton'),activeIcon:document.getElementById('activeIcon'),activeName:document.getElementById('activeName'),bagButton:document.getElementById('bagButton'),mobileControls:document.getElementById('mobileControls'),mobileAction:document.getElementById('mobileAction'),mobileUse:document.getElementById('mobileUse'),
    toast:document.getElementById('toast'),bossBar:document.getElementById('bossBar'),bossFill:document.getElementById('bossFill'),bossText:document.getElementById('bossText'),
    inventoryDialog:document.getElementById('inventoryDialog'),menuKicker:document.getElementById('menuKicker'),menuTitle:document.getElementById('menuTitle'),menuTabs:document.getElementById('menuTabs'),menuList:document.getElementById('menuList'),menuFooter:document.getElementById('menuFooter'),
  };

  const keys=new Set(),mobileMove={up:false,down:false,left:false,right:false};
  let state=null,last=performance.now(),running=false,paused=true,menuMode='items',menuStation=null,menuFurniture=null,toastTimer=0,audio=null,autosaveClock=0,transitionCooldown=0,contactClock=0,liquidClock=0;

  const rand=(a=1,b=0)=>Math.random()*(a-b)+b;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  function level(){return state?.world?.levels[state.levelIndex]||null}
  function levelMeta(){return D.LEVELS[state.levelIndex]}
  function itemInfo(id){return id==='hands'?{name:'Hands',icon:'✊'}:D.ITEMS[id]||{name:id,icon:'?'}}
  function invCount(id){return state?.player?.inventory?.[id]||0}
  function addItem(id,count=1){if(!state||count<=0)return;state.player.inventory[id]=(state.player.inventory[id]||0)+count;showToast(`+${count} ${itemInfo(id).name}`);playSound('pickup')}
  function removeItem(id,count=1){if(invCount(id)<count)return false;state.player.inventory[id]-=count;if(state.player.inventory[id]<=0){delete state.player.inventory[id];if(state.player.active===id)state.player.active='hands'}return true}
  function showToast(text,time=1.35){el.toast.textContent=text;el.toast.hidden=false;toastTimer=time}

  function ensureAudio(){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!audio)audio=new C();if(audio.state==='suspended')audio.resume().catch(()=>{});return audio}
  function tone(freq,dur=.05,vol=.025,delay=0,type='square'){const a=ensureAudio();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.02)}
  function playSound(name){if(name==='hit'){tone(130,.035,.018)}else if(name==='pickup'){tone(720,.035,.013)}else if(name==='craft'){tone(520,.05,.02);tone(780,.07,.018,.05)}else if(name==='hurt'){tone(95,.09,.025)}else if(name==='stairs'){tone(300,.06,.02);tone(430,.08,.018,.06)}else if(name==='break'){tone(180,.05,.02);tone(110,.07,.017,.04)}else if(name==='boss'){tone(260,.08,.025);tone(390,.08,.023,.08);tone(590,.14,.024,.16)}else if(name==='win'){[440,660,880,1100].forEach((f,i)=>tone(f,.12,.025,i*.09,'sine'))}}
  function vibrate(pattern){if(navigator.vibrate)navigator.vibrate(pattern)}

  function newState(seed=Date.now()){
    const world=W.createWorld(seed),p={x:world.levels[3].spawn.x+.5,y:world.levels[3].spawn.y+.5,dir:'down',hp:10,maxHp:10,stamina:10,maxStamina:10,staminaDelay:0,score:0,active:'hands',inventory:{workbench:1,power_glove:1},invuln:0,attackFlash:0};
    const s={version:1,world,levelIndex:3,player:p,mobs:[[],[],[],[],[]],drops:[[],[],[],[],[]],projectiles:[[],[],[],[],[]],particles:[],flags:{placedWorkbench:false,hasWoodPick:false,visitedCave1:false,hasIron:false,visitedCave2:false,hasGold:false,visitedCave3:false,hasGemPick:false,won:false},gameTime:0};
    populateMobs(s);return s;
  }
  function populateMobs(s){
    for(let li=0;li<5;li++){
      const meta=D.LEVELS[li],count=li===3?45:li===4?30:65+((2-li)*10),rng=seeded(s.world.seed+li*739);
      for(let i=0;i<count;i++){const pos=randomMobPos(s.world.levels[li],rng);if(!pos)continue;const lvl=meta.mobMin+Math.floor(rng()*(meta.mobMax-meta.mobMin+1));s.mobs[li].push(makeMob(rng()<.5?'slime':'zombie',lvl,pos.x+.5,pos.y+.5))}
      if(meta.boss){const b=s.world.levels[li].bossSpawn||{x:64,y:50};s.mobs[li].push({id:`boss-${Date.now()}`,kind:'boss',lvl:4,x:b.x+.5,y:b.y+.5,hp:2000,maxHp:2000,dir:'down',cool:1.5,invuln:0,moveTimer:0,attackTimer:0})}
    }
  }
  function seeded(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  function randomMobPos(lvl,rng){for(let i=0;i<1200;i++){const x=3+Math.floor(rng()*122),y=3+Math.floor(rng()*122),t=W.get(lvl,x,y);if(D.TILES[t]?.pass&&!['water','lava','void','stairsUp','stairsDown'].includes(t)&&!lvl.furniture.some(f=>f.x===x&&f.y===y))return{x,y}}return null}
  function makeMob(kind,lvl,x,y){const base=kind==='slime'?5:10;return{id:`${kind}-${Math.random().toString(36).slice(2)}`,kind,lvl,x,y,hp:base*lvl*lvl,maxHp:base*lvl*lvl,dir:'down',moveTimer:rand(2,.3),vx:0,vy:0,invuln:0,jump:0}}

  function startNew(){state=newState();enterGame();saveGame(true);showToast('A new world forms around you.',2)}
  function enterGame(){running=true;paused=false;el.titleScreen.hidden=true;el.pauseScreen.hidden=true;el.deadScreen.hidden=true;el.winScreen.hidden=true;el.helpScreen.hidden=true;el.hud.hidden=false;el.quickbar.hidden=false;el.mobileControls.hidden=false;el.pauseButton.hidden=false;updateHud();last=performance.now();requestAnimationFrame(loop)}
  function pauseGame(){if(!state||paused)return;paused=true;el.pauseLevel.textContent=levelMeta().name;el.pauseTime.textContent=fmtTime(state.gameTime);el.pauseScore.textContent=`${state.player.score} pts`;el.pauseScreen.hidden=false;saveGame(true)}
  function resumeGame(){if(!state)return;el.pauseScreen.hidden=true;paused=false;last=performance.now();requestAnimationFrame(loop)}
  function die(){paused=true;running=false;saveDelete();el.deadStats.textContent=`Score ${state.player.score} · survived ${fmtTime(state.gameTime)} · reached ${levelMeta().name}.`;el.deadScreen.hidden=false;el.hud.hidden=true;el.quickbar.hidden=true;el.mobileControls.hidden=true;el.pauseButton.hidden=true;playSound('hurt');vibrate([60,40,100])}
  function winGame(){if(state.flags.won)return;state.flags.won=true;state.player.score+=1000;paused=true;running=false;saveGame(true);el.winStats.textContent=`The Air Wizard is gone. Score ${state.player.score} · ${fmtTime(state.gameTime)}.`;el.winScreen.hidden=false;el.hud.hidden=true;el.quickbar.hidden=true;el.mobileControls.hidden=true;el.pauseButton.hidden=true;playSound('win');vibrate([30,30,30,30,100])}

  function saveGame(silent=false){if(!state)return;try{const raw={version:1,world:W.serializeWorld(state.world),levelIndex:state.levelIndex,player:state.player,mobs:state.mobs,drops:state.drops,flags:state.flags,gameTime:state.gameTime};localStorage.setItem(SAVE_KEY,JSON.stringify(raw));el.continueButton.hidden=false;if(!silent)showToast('World saved.') }catch(e){if(!silent)showToast('Could not save this world.')}}
  function loadGame(){try{const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!raw?.world)return false;state={version:1,world:W.deserializeWorld(raw.world),levelIndex:raw.levelIndex??3,player:raw.player,mobs:raw.mobs||[[],[],[],[],[]],drops:raw.drops||[[],[],[],[],[]],projectiles:[[],[],[],[],[]],particles:[],flags:raw.flags||{},gameTime:raw.gameTime||0};enterGame();showToast('World restored.',1.4);return true}catch(e){localStorage.removeItem(SAVE_KEY);return false}}
  function saveDelete(){try{localStorage.removeItem(SAVE_KEY);el.continueButton.hidden=true}catch(_){}}
  function hasSave(){try{return !!localStorage.getItem(SAVE_KEY)}catch(_){return false}}

  function loop(now){if(!running||paused)return;const dt=clamp((now-last)/1000,0,.05);last=now;update(dt);render();requestAnimationFrame(loop)}
  function update(dt){
    state.gameTime+=dt;autosaveClock+=dt;transitionCooldown=Math.max(0,transitionCooldown-dt);contactClock=Math.max(0,contactClock-dt);liquidClock=Math.max(0,liquidClock-dt);toastTimer-=dt;if(toastTimer<=0)el.toast.hidden=true;
    const p=state.player;p.invuln=Math.max(0,p.invuln-dt);p.attackFlash=Math.max(0,p.attackFlash-dt);p.staminaDelay=Math.max(0,p.staminaDelay-dt);
    updatePlayerMovement(dt);updateLiquids(dt);updateMobs(dt);updateProjectiles(dt);updateDrops(dt);updateParticles(dt);updateTiles(dt);checkStairs();updateHud();
    if(autosaveClock>15){autosaveClock=0;saveGame(true)}
  }
  function movePressed(name){return keys.has(name)||mobileMove[name]}
  function updatePlayerMovement(dt){
    const p=state.player;let dx=(movePressed('right')?1:0)-(movePressed('left')?1:0),dy=(movePressed('down')?1:0)-(movePressed('up')?1:0);
    if(dx||dy){const m=Math.hypot(dx,dy);dx/=m;dy/=m;if(Math.abs(dx)>Math.abs(dy))p.dir=dx<0?'left':'right';else p.dir=dy<0?'up':'down'}
    const tile=W.get(level(),Math.floor(p.x),Math.floor(p.y)),water=tile==='water';let speed=3;if(water)speed=1.55;if(p.stamina<=0)speed*=.55;
    moveEntity(p,dx*speed*dt,dy*speed*dt,true);
    if(p.staminaDelay<=0&&!water&&p.stamina<p.maxStamina){p.stamina=Math.min(p.maxStamina,p.stamina+dt*2.8)}
  }
  function canOccupy(x,y,isPlayer=false){
    const r=.27,pts=[[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]],lvl=level();
    for(const [px,py] of pts){const t=W.get(lvl,Math.floor(px),Math.floor(py)),info=D.TILES[t];if(!info?.pass)return false;if(!isPlayer&&['water','lava','void'].includes(t))return false}
    for(const f of lvl.furniture){if(Math.abs((f.x+.5)-x)<.58&&Math.abs((f.y+.5)-y)<.58)return false}return true
  }
  function moveEntity(e,dx,dy,isPlayer=false){if(dx&&canOccupy(e.x+dx,e.y,isPlayer))e.x+=dx;if(dy&&canOccupy(e.x,e.y+dy,isPlayer))e.y+=dy}
  function updateLiquids(dt){
    const p=state.player,t=W.get(level(),Math.floor(p.x),Math.floor(p.y));
    if(t==='water'){p.stamina=Math.max(0,p.stamina-dt);if(p.stamina<=0&&liquidClock<=0){liquidClock=1;hurtPlayer(1)}}
    if(t==='lava'&&liquidClock<=0){liquidClock=.45;hurtPlayer(2)}
  }

  function updateMobs(dt){
    const mobs=state.mobs[state.levelIndex],p=state.player;
    for(let i=mobs.length-1;i>=0;i--){const m=mobs[i];m.invuln=Math.max(0,(m.invuln||0)-dt);if(m.kind==='boss'){updateBoss(m,dt);if(m.hp<=0){mobs.splice(i,1);winGame()}continue}
      m.moveTimer-=dt;const dist=Math.hypot(p.x-m.x,p.y-m.y);let vx=0,vy=0;
      if(dist<6){vx=(p.x-m.x)/Math.max(.01,dist);vy=(p.y-m.y)/Math.max(.01,dist)}else if(m.moveTimer<=0){m.moveTimer=rand(2.5,.7);m.vx=Math.floor(rand(2.99,-1));m.vy=Math.floor(rand(2.99,-1))}
      if(dist>=6){vx=m.vx||0;vy=m.vy||0;const mm=Math.hypot(vx,vy)||1;vx/=mm;vy/=mm}
      let speed=m.kind==='zombie'?1.05:1.35;if(m.kind==='slime'){m.jump=(m.jump||0)+dt*4;speed*=Math.sin(m.jump)>0?.95:.25}
      moveEntity(m,vx*speed*dt,vy*speed*dt,false);if(Math.abs(vx)>Math.abs(vy))m.dir=vx<0?'left':'right';else if(vy)m.dir=vy<0?'up':'down';
      if(dist<.62&&contactClock<=0){contactClock=.55;hurtPlayer(m.kind==='zombie'?m.lvl+1:m.lvl)}
      if(m.hp<=0){killMob(m);mobs.splice(i,1)}
    }
    const target=levelMeta().boss?35:65;if(mobs.length<target&&Math.random()<dt*.18){const pos=randomMobPos(level(),Math.random);if(pos&&Math.hypot(pos.x-p.x,pos.y-p.y)>9){const meta=levelMeta(),lvl=meta.mobMin+Math.floor(Math.random()*(meta.mobMax-meta.mobMin+1));mobs.push(makeMob(Math.random()<.5?'slime':'zombie',lvl,pos.x+.5,pos.y+.5))}}
  }
  function updateBoss(b,dt){
    const p=state.player,dist=Math.max(.01,Math.hypot(p.x-b.x,p.y-b.y)),dx=p.x-b.x,dy=p.y-b.y;b.cool-=dt;b.attackTimer=Math.max(0,b.attackTimer-dt);
    let vx=0,vy=0;if(dist<2.2){vx=-dx/dist;vy=-dy/dist}else if(dist>5.2){vx=dx/dist;vy=dy/dist}else{vx=-dy/dist*.5;vy=dx/dist*.5}
    moveEntity(b,vx*1.8*dt,vy*1.8*dt,false);
    if(b.cool<=0){b.cool=b.hp<200?1.3:b.hp<1000?1.8:2.4;b.attackTimer=.65;const shots=b.hp<200?18:b.hp<1000?12:8;for(let i=0;i<shots;i++){const a=(Math.PI*2*i/shots)+state.gameTime*.45,speed=b.hp<200?4:b.hp<1000?3.4:2.8;state.projectiles[state.levelIndex].push({x:b.x,y:b.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4})}playSound('boss')}
    if(dist<.7&&contactClock<=0){contactClock=.55;hurtPlayer(3)}
    el.bossBar.hidden=false;el.bossFill.style.width=`${clamp(b.hp/b.maxHp*100,0,100)}%`;el.bossText.textContent=String(Math.max(0,Math.ceil(b.hp)));
  }
  function updateProjectiles(dt){const list=state.projectiles[state.levelIndex];for(let i=list.length-1;i>=0;i--){const s=list[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.life<=0||!D.TILES[W.get(level(),Math.floor(s.x),Math.floor(s.y))]?.pass){list.splice(i,1);continue}if(Math.hypot(s.x-state.player.x,s.y-state.player.y)<.38){hurtPlayer(1);list.splice(i,1)}}}
  function updateDrops(dt){const list=state.drops[state.levelIndex],p=state.player;for(let i=list.length-1;i>=0;i--){const d=list[i];d.life=(d.life??60)-dt;if(Math.hypot(d.x-p.x,d.y-p.y)<.55){state.player.inventory[d.id]=(state.player.inventory[d.id]||0)+d.count;playSound('pickup');list.splice(i,1);continue}if(d.life<=0)list.splice(i,1)}}
  function updateParticles(dt){for(let i=state.particles.length-1;i>=0;i--){const p=state.particles[i];p.life-=dt;p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;if(p.life<=0)state.particles.splice(i,1)}}
  function updateTiles(dt){if(Math.random()>dt*5)return;const lvl=level();for(let i=0;i<8;i++){const x=Math.floor(rand(128)),y=Math.floor(rand(128)),t=W.get(lvl,x,y);if(t==='wheat'&&lvl.data[W.idx(x,y)]<5&&Math.random()<.12)lvl.data[W.idx(x,y)]++;}}

  function hurtPlayer(amount){const p=state.player;if(p.invuln>0||state.flags.won)return;p.hp-=amount;p.invuln=.75;playSound('hurt');vibrate(25);state.particles.push({kind:'text',text:`-${amount}`,x:p.x,y:p.y-.5,life:.7,vy:-.5,color:'#ff877a'});if(p.hp<=0)die()}
  function killMob(m){const stat=D.MOB_STATS[m.kind];if(!stat)return;const count=1+Math.floor(Math.random()*2);dropItem(stat.drop,count,m.x,m.y);state.player.score+=stat.score*m.lvl;playSound('break')}
  function dropItem(id,count,x,y){state.drops[state.levelIndex].push({id,count,x:x+rand(.25,-.25),y:y+rand(.25,-.25),life:60})}

  function facingTile(){const p=state.player,off={up:[0,-.75],down:[0,.75],left:[-.75,0],right:[.75,0]}[p.dir]||[0,.75];return{x:Math.floor(p.x+off[0]),y:Math.floor(p.y+off[1])}}
  function action(){if(!state||paused)return;const p=state.player;if(p.stamina<1){showToast('Too exhausted.');return}p.stamina=Math.max(0,p.stamina-1);p.staminaDelay=.7;p.attackFlash=.16;const target=facingTile();
    if(tryAttackMob(target))return;const active=p.active,info=itemInfo(active);if(info.furniture&&invCount(active)>0){placeFurniture(active,target);return}if(active==='power_glove'){pickFurniture(target);return}if(tryResourceUse(active,target))return;interactTile(active,target)}
  function tryAttackMob(target){const p=state.player,mobs=state.mobs[state.levelIndex];let best=null,bestD=999;for(const m of mobs){const d=Math.hypot(m.x-(target.x+.5),m.y-(target.y+.5));if(d<1&&d<bestD){best=m;bestD=d}}if(!best)return false;let dmg=1+Math.floor(Math.random()*3),info=itemInfo(p.active);if(info.tool){if(info.type==='axe')dmg+=(info.tier+1)*2+Math.floor(Math.random()*4);if(info.type==='sword')dmg+=(info.tier+1)*3+Math.floor(Math.random()*(2+info.tier*info.tier*2));else if(info.type!=='axe')dmg+=1}if(best.invuln<=0){best.hp-=dmg;best.invuln=.18;state.particles.push({kind:'text',text:String(dmg),x:best.x,y:best.y-.5,life:.55,vy:-.45,color:'#fff5ca'});playSound('hit');vibrate(8)}return true}
  function placeFurniture(id,t){const lvl=level(),tile=W.get(lvl,t.x,t.y);if(!D.TILES[tile]?.pass||['water','lava','void','stairsUp','stairsDown'].includes(tile)||lvl.furniture.some(f=>f.x===t.x&&f.y===t.y)){showToast('Cannot place that here.');return}removeItem(id,1);lvl.furniture.push({kind:id,x:t.x,y:t.y,items:id==='chest'?{}:undefined});if(id==='workbench')state.flags.placedWorkbench=true;playSound('craft');showToast(`${itemInfo(id).name} placed.`)}
  function pickFurniture(t){const lvl=level(),i=lvl.furniture.findIndex(f=>f.x===t.x&&f.y===t.y);if(i<0){showToast('Face furniture to pick it up.');return}const f=lvl.furniture[i];if(f.kind==='chest'&&f.items)for(const [id,count] of Object.entries(f.items))if(count)addItem(id,count);lvl.furniture.splice(i,1);addItem(f.kind,1);showToast(`${itemInfo(f.kind).name} picked up.`)}
  function tryResourceUse(id,t){const tile=W.get(level(),t.x,t.y);if(!invCount(id))return false;if(id==='acorn'&&tile==='grass'){removeItem(id);W.set(level(),t.x,t.y,'tree');showToast('Planted an acorn.');return true}if(id==='cactus'&&tile==='sand'){removeItem(id);W.set(level(),t.x,t.y,'cactus');return true}if(id==='flower'&&tile==='grass'){removeItem(id);W.set(level(),t.x,t.y,'flower');return true}if(id==='seeds'&&tile==='farmland'){removeItem(id);W.set(level(),t.x,t.y,'wheat',0);return true}if(id==='dirt'&&['hole','water','lava'].includes(tile)){removeItem(id);W.set(level(),t.x,t.y,state.levelIndex<3?'dirt':'grass');return true}if(id==='sand'&&['grass','dirt'].includes(tile)){removeItem(id);W.set(level(),t.x,t.y,'sand');return true}if(id==='cloud'&&tile==='void'){removeItem(id);W.set(level(),t.x,t.y,'cloud');return true}return false}
  function interactTile(active,t){const lvl=level(),tile=W.get(lvl,t.x,t.y),info=itemInfo(active),dataIndex=W.idx(t.x,t.y);if(tile==='flower'){W.set(lvl,t.x,t.y,'grass');dropItem('flower',1,t.x+.5,t.y+.5);return}
    if(info.tool&&info.type==='hoe'&&['grass','dirt'].includes(tile)){if(payExtra(Math.max(0,4-info.tier))){W.set(lvl,t.x,t.y,'farmland');if(tile==='grass'&&Math.random()<.2)dropItem('seeds',1,t.x+.5,t.y+.5)}return}
    if(info.tool&&info.type==='shovel'&&['grass','dirt','sand','farmland'].includes(tile)){if(payExtra(Math.max(0,4-info.tier))){if(tile==='grass'){W.set(lvl,t.x,t.y,'dirt');if(Math.random()<.2)dropItem('seeds',1,t.x+.5,t.y+.5)}else if(tile==='sand'){dropItem('sand',1,t.x+.5,t.y+.5);W.set(lvl,t.x,t.y,'dirt')}else if(tile==='farmland'){W.set(lvl,t.x,t.y,'dirt')}else{dropItem('dirt',1,t.x+.5,t.y+.5);W.set(lvl,t.x,t.y,'hole')}}return}
    if(tile==='wheat'){const growth=lvl.data[dataIndex];if(growth>=3){dropItem('seeds',1+Math.floor(Math.random()*2),t.x+.5,t.y+.5);if(growth>=5)dropItem('wheat',1+Math.floor(Math.random()*2),t.x+.5,t.y+.5)}W.set(lvl,t.x,t.y,'farmland');return}
    if(tile==='tree'){let dmg=1+Math.floor(Math.random()*3);if(info.tool&&info.type==='axe'&&payExtra(Math.max(0,4-info.tier)))dmg=10+info.tier*5+Math.floor(Math.random()*10);hurtTile(t,dmg,20,'grass',()=>{dropItem('wood',1+Math.floor(Math.random()*2),t.x+.5,t.y+.5);const cap=1+Math.floor(Math.random()*4),a=Math.floor(Math.random()*cap);if(a)dropItem('acorn',a,t.x+.5,t.y+.5)});if(Math.random()<.1)dropItem('apple',1,t.x+.5,t.y+.5);return}
    if(tile==='cactus'){let dmg=1+Math.floor(Math.random()*3);if(info.tool&&info.type==='axe'&&payExtra(Math.max(0,4-info.tier)))dmg=8+info.tier*4+Math.floor(Math.random()*6);hurtTile(t,dmg,10,state.levelIndex===4?'cloud':'sand',()=>dropItem('cactus',1,t.x+.5,t.y+.5));return}
    if(tile==='rock'){let dmg=1+Math.floor(Math.random()*3);if(info.tool&&info.type==='pickaxe'&&payExtra(Math.max(0,4-info.tier)))dmg=10+info.tier*5+Math.floor(Math.random()*10);hurtTile(t,dmg,50,'dirt',()=>{dropItem('stone',1+Math.floor(Math.random()*4),t.x+.5,t.y+.5);if(Math.random()<.5)dropItem('coal',1,t.x+.5,t.y+.5)});return}
    if(['ironOre','goldOre','gemOre'].includes(tile)){if(!(info.tool&&info.type==='pickaxe')){showToast('You need a pickaxe.');return}if(!payExtra(Math.max(0,6-info.tier)))return;const dmg=(lvl.data[dataIndex]||0)+1;lvl.data[dataIndex]=dmg;if(Math.random()<.5)dropItem(D.TILES[tile].ore,1,t.x+.5,t.y+.5);if(dmg>=3+Math.floor(Math.random()*10)){W.set(lvl,t.x,t.y,'dirt');dropItem(D.TILES[tile].ore,2,t.x+.5,t.y+.5);playSound('break')}else playSound('hit');return}
    if(tile==='hardRock'){if(!(info.tool&&info.type==='pickaxe'&&info.tier===4)){showToast('Only a Gem Pickaxe can break this.');return}if(!payExtra(Math.max(0,4-info.tier)))return;hurtTile(t,30+Math.floor(Math.random()*10),200,'grass',()=>{dropItem('stone',1+Math.floor(Math.random()*4),t.x+.5,t.y+.5);if(Math.random()<.5)dropItem('coal',1,t.x+.5,t.y+.5)});return}
    playSound('hit')}
  function payExtra(cost){if(cost<=0)return true;const p=state.player;if(p.stamina<cost){showToast('Not enough energy.');return false}p.stamina-=cost;p.staminaDelay=.7;return true}
  function hurtTile(t,dmg,hp,replacement,onBreak){const lvl=level(),i=W.idx(t.x,t.y),sum=(lvl.data[i]||0)+dmg;lvl.data[i]=clamp(sum,0,255);state.particles.push({kind:'text',text:String(dmg),x:t.x+.5,y:t.y+.2,life:.5,vy:-.4,color:'#e7eadf'});playSound('hit');if(sum>=hp){W.set(lvl,t.x,t.y,replacement);onBreak?.();playSound('break')}}

  function use(){if(!state||paused)return;const t=facingTile(),f=level().furniture.find(x=>x.x===t.x&&x.y===t.y);if(f){if(f.kind==='lantern'){showToast('The lantern burns steadily.');return}if(f.kind==='chest'){openMenu('chest',f);return}openMenu('station',f);return}openMenu('items',null)}
  function useFood(id){const info=itemInfo(id);if(!info.food||invCount(id)<=0)return false;if(state.player.hp>=state.player.maxHp){showToast('Already at full health.');return true}if(state.player.stamina<6){showToast('Too exhausted to eat.');return true}removeItem(id,1);state.player.stamina-=6;state.player.staminaDelay=.8;state.player.hp=Math.min(state.player.maxHp,state.player.hp+info.food);playSound('pickup');showToast(`${info.name}: +${info.food} HP`);return true}

  function openMenu(mode,furniture){if(!state)return;paused=true;menuFurniture=furniture;menuMode=mode==='station'?'craft':mode==='chest'?'items':'items';menuStation=mode==='station'?furniture.kind:null;el.menuKicker.textContent=mode==='station'?'CRAFTING':mode==='chest'?'STORAGE':'INVENTORY';el.menuTitle.textContent=mode==='station'?itemInfo(furniture.kind).name:mode==='chest'?'Chest':'Your pack';const tabs=el.menuTabs.querySelectorAll('[data-tab]');if(tabs[0])tabs[0].textContent='ITEMS';if(tabs[1]){tabs[1].textContent=mode==='chest'?'CHEST':'CRAFT';tabs[1].hidden=mode==='items'}tabs.forEach(b=>b.classList.toggle('selected',b.dataset.tab===menuMode));renderMenu();if(typeof el.inventoryDialog.showModal==='function'&&!el.inventoryDialog.open)el.inventoryDialog.showModal();else el.inventoryDialog.setAttribute('open','')}
  function closeMenu(){if(typeof el.inventoryDialog.close==='function'&&el.inventoryDialog.open){el.inventoryDialog.close();return}el.inventoryDialog.removeAttribute('open');if(state&&running){paused=false;last=performance.now();requestAnimationFrame(loop)}}
  function renderMenu(){el.menuList.innerHTML='';if(menuMode==='items')renderInventoryList();else if(menuStation)renderCraftList(menuStation);else if(menuFurniture?.kind==='chest')renderChestList(menuFurniture)}
  function renderInventoryList(){const entries=Object.entries(state.player.inventory).filter(([,c])=>c>0).sort((a,b)=>itemInfo(a[0]).name.localeCompare(itemInfo(b[0]).name));if(!entries.length){el.menuList.innerHTML='<div class="menu-item disabled"><span class="icon">∅</span><div><strong>Empty</strong><small>Your pack has nothing in it.</small></div></div>';return}for(const [id,count] of entries){const info=itemInfo(id),button=document.createElement('button');button.type='button';button.className=`menu-item${state.player.active===id?' selected':''}`;button.innerHTML=`<span class="icon">${info.icon||'•'}</span><div><strong>${escapeHtml(info.name)}</strong><small>${info.food?'Use to restore health':info.furniture?'Equip, then place with ACTION':'Equip this item'}</small></div><span class="count">×${count}</span>`;button.addEventListener('click',()=>{if(menuFurniture?.kind==='chest'&&menuStation===null){removeItem(id,1);menuFurniture.items[id]=(menuFurniture.items[id]||0)+1;renderMenu();return}if(useFood(id)){renderMenu();return}state.player.active=id;updateHud();closeMenu()});el.menuList.appendChild(button)}}
  function renderChestList(chest){const entries=Object.entries(chest.items||{}).filter(([,c])=>c>0);if(!entries.length){el.menuList.innerHTML='<div class="menu-item disabled"><span class="icon">▣</span><div><strong>Chest is empty</strong><small>Choose ITEMS and tap something to store one.</small></div></div>';return}for(const [id,count] of entries){const info=itemInfo(id),b=document.createElement('button');b.type='button';b.className='menu-item';b.innerHTML=`<span class="icon">${info.icon}</span><div><strong>${escapeHtml(info.name)}</strong><small>Take one</small></div><span class="count">×${count}</span>`;b.addEventListener('click',()=>{chest.items[id]--;addItem(id,1);renderMenu()});el.menuList.appendChild(b)}}
  function renderCraftList(station){const recipes=D.RECIPES[station]||[];if(!recipes.length){el.menuList.innerHTML='<div class="menu-item disabled"><span class="icon">•</span><div><strong>No recipes</strong><small>This object has no crafting menu.</small></div></div>';return}for(const recipe of recipes){const info=itemInfo(recipe.id),ok=canCraft(recipe),b=document.createElement('button');b.type='button';b.className=`menu-item${ok?'':' disabled'}`;const costs=Object.entries(recipe.costs).map(([id,n])=>`<i class="${invCount(id)<n?'missing':''}">${escapeHtml(itemInfo(id).name)} ${invCount(id)}/${n}</i>`).join('');b.innerHTML=`<span class="icon">${info.icon}</span><div><strong>${escapeHtml(info.name)}</strong><small class="recipe-costs">${costs}</small></div><span class="count">${ok?'CRAFT':'—'}</span>`;b.addEventListener('click',()=>{if(!canCraft(recipe)){showToast('Missing materials.');return}for(const [id,n] of Object.entries(recipe.costs))removeItem(id,n);state.player.inventory[recipe.id]=(state.player.inventory[recipe.id]||0)+(recipe.amount||1);afterCraft(recipe.id);playSound('craft');renderMenu();updateHud()});el.menuList.appendChild(b)}}
  function canCraft(r){return Object.entries(r.costs).every(([id,n])=>invCount(id)>=n)}
  function afterCraft(id){if(id==='wood_pickaxe')state.flags.hasWoodPick=true;if(id==='iron')state.flags.hasIron=true;if(id==='gold')state.flags.hasGold=true;if(id==='gem_pickaxe')state.flags.hasGemPick=true;showToast(`Crafted ${itemInfo(id).name}.`)}

  function cycleItem(dir){if(!state)return;const ids=['hands',...Object.keys(state.player.inventory).filter(id=>invCount(id)>0&&!itemInfo(id).food)];let i=ids.indexOf(state.player.active);if(i<0)i=0;i=(i+dir+ids.length)%ids.length;state.player.active=ids[i];updateHud()}
  function checkStairs(){if(transitionCooldown>0)return;const p=state.player,t=W.get(level(),Math.floor(p.x),Math.floor(p.y));if(t==='stairsDown'&&state.levelIndex>0)changeLevel(-1);else if(t==='stairsUp'&&state.levelIndex<4)changeLevel(1)}
  function changeLevel(dir){state.levelIndex+=dir;transitionCooldown=.7;const p=state.player;p.x=Math.floor(p.x)+.5;p.y=Math.floor(p.y)+.5;playSound('stairs');vibrate(20);if(state.levelIndex===2)state.flags.visitedCave1=true;if(state.levelIndex===1)state.flags.visitedCave2=true;if(state.levelIndex===0)state.flags.visitedCave3=true;showToast(levelMeta().name,1.4);el.bossBar.hidden=true;saveGame(true)}

  function updateHud(){if(!state)return;const p=state.player;el.healthFill.style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`;el.healthText.textContent=`${Math.max(0,Math.ceil(p.hp))}/${p.maxHp}`;el.staminaFill.style.width=`${clamp(p.stamina/p.maxStamina*100,0,100)}%`;el.staminaText.textContent=`${Math.floor(p.stamina)}/${p.maxStamina}`;el.levelName.textContent=levelMeta().name;el.scoreText.textContent=String(p.score);const obj=D.OBJECTIVES.find(o=>o.test(state));el.objectiveText.textContent=obj?.text||'';const info=itemInfo(p.active);el.activeIcon.textContent=info.icon||'•';el.activeName.textContent=info.name;const boss=state.mobs[state.levelIndex]?.find(m=>m.kind==='boss');el.bossBar.hidden=!boss}

  function render(){if(!state)return;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,VIEW_W,VIEW_H);const p=state.player,camX=Math.round(p.x*TILE-VIEW_W/2),camY=Math.round(p.y*TILE-VIEW_H/2),lvl=level();const x0=Math.floor(camX/TILE)-1,y0=Math.floor(camY/TILE)-1,x1=x0+Math.ceil(VIEW_W/TILE)+3,y1=y0+Math.ceil(VIEW_H/TILE)+3;
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)drawTile(W.get(lvl,x,y),x*TILE-camX,y*TILE-camY,x,y,lvl.data[W.idx(clamp(x,0,127),clamp(y,0,127))]||0);
    for(const f of lvl.furniture)drawFurniture(f,f.x*TILE-camX,f.y*TILE-camY);
    for(const d of state.drops[state.levelIndex])drawDrop(d,d.x*TILE-camX,d.y*TILE-camY);
    const sprites=[...state.mobs[state.levelIndex].map(m=>({type:'mob',y:m.y,obj:m})),{type:'player',y:p.y,obj:p}].sort((a,b)=>a.y-b.y);for(const s of sprites)s.type==='player'?drawPlayer(p,p.x*TILE-camX,p.y*TILE-camY):drawMob(s.obj,s.obj.x*TILE-camX,s.obj.y*TILE-camY);
    for(const s of state.projectiles[state.levelIndex])drawSpark(s,s.x*TILE-camX,s.y*TILE-camY);for(const part of state.particles)drawParticle(part,part.x*TILE-camX,part.y*TILE-camY);
    if(levelMeta().dark)drawDarkness(camX,camY);drawVignette();
  }
  function drawTile(name,sx,sy,x,y,data){const t=D.TILES[name]||D.TILES.rock;ctx.fillStyle=t.color;ctx.fillRect(sx,sy,TILE,TILE);const seed=((x*31+y*17)&15);ctx.fillStyle=t.edge;
    if(name==='grass'){for(let i=0;i<4;i++)ctx.fillRect(sx+((seed+i*5)%14)+1,sy+((seed*3+i*7)%14)+1,1,2)}
    else if(name==='dirt'){for(let i=0;i<5;i++)ctx.fillRect(sx+((seed+i*3)%14)+1,sy+((seed*5+i*4)%14)+1,2,1)}
    else if(name==='sand'){for(let i=0;i<5;i++)ctx.fillRect(sx+((seed+i*4)%14)+1,sy+((seed*7+i*3)%14)+1,1,1)}
    else if(name==='water'){ctx.globalAlpha=.45;for(let i=0;i<3;i++){const yy=sy+3+i*5;ctx.fillRect(sx+((state?.gameTime*12+i*5+x)%8),yy,7,1)}ctx.globalAlpha=1}
    else if(name==='lava'){ctx.fillStyle='#f6b148';for(let i=0;i<3;i++)ctx.fillRect(sx+((state?.gameTime*9+i*6+y)%9),sy+3+i*5,6,2)}
    else if(name==='tree'){ctx.fillStyle='#4c3320';ctx.fillRect(sx+6,sy+8,4,8);ctx.fillStyle='#2b653a';ctx.fillRect(sx+2,sy+2,12,10);ctx.fillStyle='#4c8c48';ctx.fillRect(sx+4,sy+1,8,3);ctx.fillRect(sx+1,sy+5,4,4)}
    else if(name==='rock'||name==='hardRock'){ctx.fillStyle=t.edge;ctx.fillRect(sx+2,sy+4,12,9);ctx.fillStyle=name==='hardRock'?'#1c2224':'#3f4240';ctx.fillRect(sx+4,sy+2,7,3);ctx.fillRect(sx+6,sy+8,6,4)}
    else if(name.endsWith('Ore')){ctx.fillStyle='#434746';ctx.fillRect(sx+1,sy+2,14,12);const c=name==='ironOre'?'#c2c8c2':name==='goldOre'?'#e7c44d':'#5ce1bd';ctx.fillStyle=c;ctx.fillRect(sx+4,sy+4,3,3);ctx.fillRect(sx+10,sy+7,3,2);ctx.fillRect(sx+6,sy+11,2,2)}
    else if(name==='flower'){ctx.fillStyle='#f0e6d1';ctx.fillRect(sx+7,sy+5,2,2);ctx.fillStyle='#d6ae61';ctx.fillRect(sx+8,sy+6,2,2)}
    else if(name==='cactus'){ctx.fillStyle='#2f7a42';ctx.fillRect(sx+6,sy+2,5,13);ctx.fillRect(sx+3,sy+6,4,3);ctx.fillRect(sx+10,sy+8,3,3);ctx.fillStyle='#73b166';ctx.fillRect(sx+8,sy+3,1,10)}
    else if(name==='hole'){ctx.fillStyle='#080807';ctx.fillRect(sx+2,sy+3,12,10);ctx.fillStyle='#443a2f';ctx.fillRect(sx+3,sy+3,10,2)}
    else if(name==='farmland'){ctx.fillStyle='#84613c';for(let i=2;i<15;i+=4)ctx.fillRect(sx+i,sy+1,1,14)}
    else if(name==='wheat'){ctx.fillStyle='#84613c';for(let i=2;i<15;i+=4)ctx.fillRect(sx+i,sy+1,1,14);const h=3+data*2;ctx.fillStyle='#d5b957';ctx.fillRect(sx+5,sy+14-h,2,h);ctx.fillRect(sx+10,sy+13-h,2,h+1)}
    else if(name==='stairsDown'||name==='stairsUp'){ctx.fillStyle='#25221e';ctx.fillRect(sx+2,sy+2,12,12);ctx.fillStyle='#aca496';for(let i=0;i<4;i++)ctx.fillRect(sx+3+i*2,sy+(name==='stairsDown'?4+i*2:10-i*2),8-i*2,2)}
    else if(name==='cloud'){ctx.fillStyle='#edf4ef';ctx.fillRect(sx+2,sy+4,12,8);ctx.fillRect(sx+5,sy+2,7,11);ctx.fillStyle='#aebec1';ctx.fillRect(sx+2,sy+11,12,2)}
    else if(name==='void'){ctx.fillStyle='#0e2030';ctx.fillRect(sx+(seed%5),sy+((seed*3)%11),1,1)}
  }
  function drawFurniture(f,sx,sy){ctx.fillStyle='#392b1b';if(f.kind==='workbench'){ctx.fillRect(sx+2,sy+5,12,9);ctx.fillStyle='#b4834d';ctx.fillRect(sx+2,sy+3,12,4);ctx.fillStyle='#6d4d2d';ctx.fillRect(sx+5,sy+7,2,7);ctx.fillRect(sx+10,sy+7,2,7)}else if(f.kind==='furnace'||f.kind==='oven'){ctx.fillStyle=f.kind==='furnace'?'#686b68':'#80694f';ctx.fillRect(sx+2,sy+3,12,12);ctx.fillStyle='#171717';ctx.fillRect(sx+5,sy+8,6,4);ctx.fillStyle='#e4853e';ctx.fillRect(sx+7,sy+9,2,2)}else if(f.kind==='anvil'){ctx.fillStyle='#8e9694';ctx.fillRect(sx+3,sy+5,10,4);ctx.fillRect(sx+6,sy+9,5,5);ctx.fillRect(sx+4,sy+13,9,2)}else if(f.kind==='chest'){ctx.fillStyle='#8b5b2f';ctx.fillRect(sx+2,sy+5,12,9);ctx.fillStyle='#d0a356';ctx.fillRect(sx+2,sy+7,12,2);ctx.fillRect(sx+7,sy+8,2,3)}else if(f.kind==='lantern'){ctx.fillStyle='#795f2c';ctx.fillRect(sx+5,sy+4,6,10);ctx.fillStyle='#ffe58a';ctx.fillRect(sx+6,sy+6,4,5);ctx.fillStyle='#fff2ad';ctx.fillRect(sx+7,sy+7,2,3)}}
  function drawDrop(d,sx,sy){const info=itemInfo(d.id);ctx.fillStyle=info.color||'#f1e5b6';ctx.fillRect(Math.round(sx)-3,Math.round(sy)-3,6,6);ctx.fillStyle='#fff';ctx.fillRect(Math.round(sx)-1,Math.round(sy)-2,2,2)}
  function drawPlayer(p,sx,sy){const x=Math.round(sx),y=Math.round(sy),flash=p.invuln>0&&Math.floor(state.gameTime*14)%2===0;ctx.fillStyle=flash?'#fff':'#e3caa4';ctx.fillRect(x-4,y-7,8,6);ctx.fillStyle='#e9ece4';ctx.fillRect(x-5,y-1,10,7);ctx.fillStyle='#4a627a';ctx.fillRect(x-4,y+6,3,4);ctx.fillRect(x+1,y+6,3,4);ctx.fillStyle='#26231f';if(p.dir==='left'||p.dir==='right')ctx.fillRect(x+(p.dir==='left'?-4:2),y-5,2,1);else{ctx.fillRect(x-2,y-5,1,1);ctx.fillRect(x+2,y-5,1,1)}if(p.attackFlash>0){const o={up:[0,-12],down:[0,12],left:[-12,0],right:[12,0]}[p.dir];ctx.strokeStyle='#fff1b7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+o[0],y+o[1],7,0,Math.PI);ctx.stroke()}}
  function drawMob(m,sx,sy){const x=Math.round(sx),y=Math.round(sy),hurt=m.invuln>0;if(m.kind==='slime'){const cols=['#4ba44e','#a15745','#d4d5d0','#242a30'];ctx.fillStyle=hurt?'#fff':cols[m.lvl-1]||cols[0];const jump=Math.sin(m.jump||0)>0?2:0;ctx.fillRect(x-6,y-5-jump,12,10);ctx.fillStyle='#101510';ctx.fillRect(x-3,y-2-jump,2,2);ctx.fillRect(x+2,y-2-jump,2,2)}else if(m.kind==='zombie'){const cols=['#5b9f57','#9b5a45','#d0d1ca','#2a3032'];ctx.fillStyle=hurt?'#fff':cols[m.lvl-1]||cols[0];ctx.fillRect(x-4,y-7,8,6);ctx.fillStyle='#4d5260';ctx.fillRect(x-5,y-1,10,7);ctx.fillStyle='#1a1c1b';ctx.fillRect(x-3,y-5,1,1);ctx.fillRect(x+2,y-5,1,1)}else{const pulse=m.hp<200&&Math.floor(state.gameTime*8)%2===0;ctx.fillStyle=hurt||pulse?'#fff':'#bfe7f2';ctx.fillRect(x-5,y-8,10,7);ctx.fillStyle='#7fa9c0';ctx.fillRect(x-6,y-1,12,10);ctx.fillStyle='#effcff';ctx.fillRect(x-3,y-5,2,2);ctx.fillRect(x+1,y-5,2,2);ctx.fillStyle='#78cce8';ctx.fillRect(x-8,y+2,3,5);ctx.fillRect(x+5,y+2,3,5)}}
  function drawSpark(s,sx,sy){ctx.fillStyle='#dff8ff';ctx.fillRect(Math.round(sx)-1,Math.round(sy)-1,3,3);ctx.fillStyle='#72cfea';ctx.fillRect(Math.round(sx),Math.round(sy),1,1)}
  function drawParticle(p,sx,sy){if(p.kind==='text'){ctx.fillStyle=p.color||'#fff';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText(p.text,Math.round(sx),Math.round(sy));ctx.textAlign='left'}}
  function drawDarkness(camX,camY){lctx.clearRect(0,0,VIEW_W,VIEW_H);lctx.fillStyle='rgba(0,0,0,.83)';lctx.fillRect(0,0,VIEW_W,VIEW_H);lctx.globalCompositeOperation='destination-out';punchLight(state.player.x*TILE-camX,state.player.y*TILE-camY,68);for(const f of level().furniture)if(f.kind==='lantern')punchLight((f.x+.5)*TILE-camX,(f.y+.5)*TILE-camY,92);lctx.globalCompositeOperation='source-over';ctx.drawImage(lightCanvas,0,0)}
  function punchLight(x,y,r){const g=lctx.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.55,'rgba(0,0,0,.86)');g.addColorStop(1,'rgba(0,0,0,0)');lctx.fillStyle=g;lctx.beginPath();lctx.arc(x,y,r,0,Math.PI*2);lctx.fill()}
  function drawVignette(){const g=ctx.createRadialGradient(VIEW_W/2,VIEW_H/2,70,VIEW_W/2,VIEW_H/2,200);g.addColorStop(.45,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.28)');ctx.fillStyle=g;ctx.fillRect(0,0,VIEW_W,VIEW_H)}

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function mapKey(key,down){const k=key.toLowerCase(),map={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'};if(map[k]){down?keys.add(map[k]):keys.delete(map[k]);return true}return false}
  window.addEventListener('keydown',e=>{if(mapKey(e.key,true)){e.preventDefault();return}if(e.repeat)return;const k=e.key.toLowerCase();if(k==='c'||e.code==='Space'){e.preventDefault();action()}else if(k==='x'||e.key==='Enter'){e.preventDefault();use()}else if(k==='q'){e.preventDefault();cycleItem(1)}else if(k==='escape'){if(el.inventoryDialog.open)closeMenu();else if(state&&!paused)pauseGame();else if(state&&paused&&!el.pauseScreen.hidden)resumeGame()}});
  window.addEventListener('keyup',e=>mapKey(e.key,false));window.addEventListener('blur',()=>{keys.clear();Object.keys(mobileMove).forEach(k=>mobileMove[k]=false)});
  document.querySelectorAll('[data-move]').forEach(b=>{const dir=b.dataset.move;const on=e=>{e.preventDefault();mobileMove[dir]=true},off=e=>{e.preventDefault();mobileMove[dir]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
  el.mobileAction.addEventListener('pointerdown',e=>{e.preventDefault();action()});el.mobileUse.addEventListener('pointerdown',e=>{e.preventDefault();use()});
  el.prevItem.addEventListener('click',()=>cycleItem(-1));el.nextItem.addEventListener('click',()=>cycleItem(1));el.activeItemButton.addEventListener('click',()=>openMenu('items',null));el.bagButton.addEventListener('click',()=>openMenu('items',null));
  el.newWorldButton.addEventListener('click',startNew);el.continueButton.addEventListener('click',()=>loadGame()||startNew());el.howButton.addEventListener('click',()=>{el.helpScreen.hidden=false});el.closeHelp.addEventListener('click',()=>{el.helpScreen.hidden=true});el.pauseButton.addEventListener('click',()=>paused?resumeGame():pauseGame());el.resumeButton.addEventListener('click',resumeGame);el.saveButton.addEventListener('click',()=>saveGame(false));el.restartButton.addEventListener('click',()=>{saveDelete();startNew()});el.deadRestartButton.addEventListener('click',startNew);el.winRestartButton.addEventListener('click',()=>{saveDelete();startNew()});
  el.menuTabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const tab=b.dataset.tab;if(menuFurniture?.kind==='chest'){menuMode=tab==='craft'?'chest':'items'}else menuMode=tab==='craft'?'craft':'items';el.menuTabs.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===b));renderMenu()});
  el.inventoryDialog.addEventListener('close',()=>{if(state&&running){paused=false;last=performance.now();requestAnimationFrame(loop)}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state&&!paused)pauseGame()});

  el.continueButton.hidden=!hasSave();el.pauseButton.hidden=true;renderTitleBackdrop();
  function renderTitleBackdrop(){ctx.fillStyle='#0b1b10';ctx.fillRect(0,0,VIEW_W,VIEW_H);for(let y=0;y<VIEW_H;y+=16)for(let x=0;x<VIEW_W;x+=16){ctx.fillStyle=((x+y)/16)%3===0?'#385d38':'#315331';ctx.fillRect(x,y,16,16);ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(x+3,y+4,2,2)}}
})();
