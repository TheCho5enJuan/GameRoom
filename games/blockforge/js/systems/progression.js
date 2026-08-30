/* Blockforge progression math and world geometry */
'use strict';
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function fmt(n){if(!Number.isFinite(n))return'0';const a=Math.abs(n);if(a<1000)return Math.floor(n).toLocaleString();const u=['K','M','B','T','Qa','Qi','Sx','Sp','Oc'];let i=-1,v=a;while(v>=1000&&i<u.length-1){v/=1000;i++;}return(n<0?'-':'')+(v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2))+u[i];}
function zoneDef(){return ZONES[state.zone%ZONES.length];}
function difficultyCycle(){return Math.floor(state.zone/ZONES.length);}
function pet(){return PETS.find(p=>p.id===state.equippedPet)||PETS[0];}
function petData(id=state.equippedPet){return state.petData[id]||{level:1,xp:0,affection:0,mood:'Curious',fed:0};}
function petScale(){const d=petData();return 1+(d.level-1)*.025+Math.min(.20,d.affection*.002);}
function equippedRelic(){return state.relics.find(r=>r.id===state.equippedRelic)||null;}
function relicDamageMult(){const r=equippedRelic();return 1+(r?.damage||0);}
function relicCoinMult(){const r=equippedRelic();return 1+(r?.coins||0);}
function relicSpeedMult(){const r=equippedRelic();return 1+(r?.speed||0);}
function passiveValue(effect){const p=pet();if(p.effect!==effect)return 0;return p.value*petScale();}
function baseDamage(){let d=4*safePow(1.42,state.upgrades.damage)*(1+state.ancientCores*.15)*relicDamageMult();if(pet().effect==='damage')d*=1+passiveValue('damage');if(pet().effect==='golem')d*=1+passiveValue('golem');return d;}
function miningDamage(){let d=baseDamage();if(world.frenzyTimer>0)d*=1.8*(1+state.mastery.frenzy*.04);if(world.petBoostTimer>0)d*=1.35;return d;}
function pickaxeCount(){return clamp(Math.floor(1+(+state.upgrades.count||0)),1,MAX_PICKAXES);}
function simulatedPickaxeCount(){return Math.min(pickaxeCount(),PICKAXE_SIM_BUDGET);}
function drawnPickaxeCount(){return Math.min(pickaxeCount(),PICKAXE_DRAW_BUDGET);}
function orbitSpeed(){let s=(1.8+state.upgrades.speed*.12)*relicSpeedMult();if(world.frenzyTimer>0)s*=1.55;if(world.petBoostTimer>0)s*=1.25;return s;}
function orbitRadius(){return 48+state.upgrades.radius*3.1;}
function critChance(){return clamp(.05+state.upgrades.crit*.012+state.mastery.critical*.01+(pet().effect==='crit'?passiveValue('crit'):0)+(world.petCritTimer>0?.25:0),.05,.78);}
function coinMult(){return(1+state.upgrades.coins*.10)*(1+state.ancientCores*.12)*(1+state.mastery.fortune*.03)*relicCoinMult()*(pet().effect==='coins'?(1+passiveValue('coins')):1)*(world.modifier?.coins||1);}
function moveSpeed(){let s=150*(1+state.mastery.mobility*.05);if(world.frenzyTimer>0)s*=1.22;return s;}
function safePow(base,exp,cap=1e280){const x=exp*Math.log(base),mx=Math.log(cap);return x>=mx?cap:Math.exp(x);}
function infiniteMode(){return!!state.settings.infiniteMode;}
function upgradeMax(def){return infiniteMode()?999999:def.max;}
function masteryMax(def){return infiniteMode()?999999:def.max;}
function upgradeCost(def){if(infiniteMode())return 0;return Math.floor(Math.min(1e280,def.base*safePow(def.scale,state.upgrades[def.id])));}
function canReforge(){return state.zone>=5;}
function projectedCores(){return Math.max(1,Math.floor(Math.pow((state.zone+1)*8+state.totalBlocks/120,.72)/3));}
function masteryCost(id){const lv=state.mastery[id]||0;return 1+Math.floor(lv/3);}
function dayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}

function gridGeom(){const width=Math.min(W-8,760),left=(W-width)/2,cellW=width/10,cellH=clamp(cellW*1.05,36,56),top=clamp(H*.19,122,168);return{left,top,width,cellW,cellH,bottom:top+cellH*5};}
function blockRect(r,c){const g=gridGeom(),gap=3;return{x:g.left+c*g.cellW+gap,y:g.top+r*g.cellH+gap,w:g.cellW-gap*2,h:g.cellH-gap*2};}
function blockCenter(r,c){const q=blockRect(r,c);return{x:q.x+q.w/2,y:q.y+q.h/2};}
function playerBounds(){const g=gridGeom();return{left:g.left+13,right:g.left+g.width-13,top:g.top-8,bottom:H-126};}
function spawnPlayer(){const g=gridGeom();world.player.x=g.left+g.width*.5;world.player.y=Math.min(H-142,g.bottom+46);world.petPos.x=world.player.x-35;world.petPos.y=world.player.y+12;}
function bossRect(){const g=gridGeom(),w=g.width*.82,h=Math.min(g.cellH*3.4,190);return{x:g.left+g.width*.09,y:g.top+g.cellH*.4,w,h};}

function rollModifier(){let total=MODIFIERS.reduce((a,m)=>a+m.weight,0),r=Math.random()*total;for(const m of MODIFIERS){r-=m.weight;if(r<=0)return m;}return MODIFIERS[0];}
function hpFor(r,c){const z=zoneDef(),cycle=Math.pow(13,difficultyCycle()),layerScale=Math.pow(1.24,state.row),depth=1+r*.055,texture=.84+((c*31+r*17+state.zone*13+state.row*19)%23)/70;return Math.max(1,Math.round(z.baseHp*cycle*layerScale*depth*texture*(world.modifier?.hp||1)));}
