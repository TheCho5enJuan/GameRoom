/* Rogue Quest state, migration, persistence, and energy */
'use strict';
function emptyPets(){let o={};petDefs.forEach((p,i)=>o[p.id]={unlocked:i===0,level:1,evo:0,affinity:0});return o}
function emptyEquipped(){let o={};gearSlots.forEach(s=>o[s]=null);return o}
function emptyTalents(){let o={};talentDefs.forEach(x=>o[x.id]=0);return o}
function emptyArtifacts(){let o={};artifactDefs.forEach(x=>o[x.id]=0);return o}
function defaultState(){return{
 version:2,lang:'en',sound:true,motion:true,depth:true,autoSkills:false,battleSpeed:1.25,heroHue:210,heroClass:'knight',
 level:1,xp:0,gold:450,gems:60,energy:36,baseMaxEnergy:36,lastEnergy:Date.now(),lastEnergyWell:0,lastDaily:'',dailyStreak:0,
 currentChapter:1,unlockedChapter:1,bestStages:{1:1,2:1,3:1,4:1},chapterWins:{1:0,2:0,3:0,4:0},claimedChapters:{},
 kills:0,elites:0,bosses:0,battles:0,deaths:0,wins:0,rolls:0,chests:0,events:0,skillsUsed:0,maxCombo:0,totalDamage:0,totalGoldEarned:0,gearFound:0,
 activePet:'fox',pets:emptyPets(),gear:[],equipped:emptyEquipped(),materials:{ore:35,essence:8,treats:15,dust:0},talentPoints:3,talents:emptyTalents(),artifacts:emptyArtifacts(),bestiary:{},claimed:{},dailyClaimed:{},
 patrolLast:Date.now(),run:null
}}
function mergeObj(base,val){return Object.assign(base,val||{})}
function migrate(raw){let base=defaultState();if(!raw)return base;let s=Object.assign({},base,raw);s.version=2;let petBase=emptyPets();s.pets={};petDefs.forEach(p=>{s.pets[p.id]=Object.assign({},petBase[p.id],raw.pets&&raw.pets[p.id]||{})});s.equipped=Object.assign({},base.equipped,raw.equipped||{});s.materials=Object.assign({},base.materials,raw.materials||{});s.talents=Object.assign({},base.talents,raw.talents||{});s.artifacts=Object.assign({},base.artifacts,raw.artifacts||{});s.bestStages=Object.assign({},base.bestStages,raw.bestStages||{});s.chapterWins=Object.assign({},base.chapterWins,raw.chapterWins||{});s.claimed=raw.claimed||{};s.dailyClaimed=raw.dailyClaimed||{};s.bestiary=raw.bestiary||{};s.claimedChapters=raw.claimedChapters||{};s.gear=(Array.isArray(raw.gear)?raw.gear:[]).map(g=>Object.assign({level:1,locked:false,subStat:null,subValue:0,power:1},g));if(raw.maxEnergy&&!raw.baseMaxEnergy)s.baseMaxEnergy=Math.max(30,raw.maxEnergy);return s}
function loadState(){try{let raw=localStorage.getItem('rogueQuestSaveV2')||localStorage.getItem('rogueQuestSave');if(raw)return migrate(JSON.parse(raw))}catch(e){}return defaultState()}
let state=loadState();
let particles=[],floatTexts=[],projectiles=[],sceneMode='board',combat=null,boardNodes=[],rolling=false,toastTimer=null,saveMode='export',audioCtx=null,animT=0,lastFrame=performance.now(),shake=0,lastUiTick=0,lootTimer=null;
const fmt=n=>{n=Math.floor(Number(n)||0);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(n>=1e4?0:1)+'K':String(n)};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function dateKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function maxEnergy(){return state.baseMaxEnergy+(state.talents.energy||0)*4+(state.artifacts.lantern||0)*2}
function saveState(){try{localStorage.setItem('rogueQuestSaveV2',JSON.stringify(state))}catch(e){}}
function regenEnergy(){let now=Date.now(),cap=maxEnergy();if(state.energy>=cap){state.energy=cap;state.lastEnergy=now;return}let last=state.lastEnergy||now,steps=Math.floor((now-last)/ENERGY_MS);if(steps>0){state.energy=Math.min(cap,state.energy+steps);state.lastEnergy=state.energy>=cap?now:last+steps*ENERGY_MS}}
function spendEnergy(n){regenEnergy();if(state.energy<n)return false;if(state.energy>=maxEnergy())state.lastEnergy=Date.now();state.energy-=n;saveState();return true}
function tone(freq=440,dur=.06,type='sine',gain=.032){if(!state.sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}}
function buzz(ms=18){try{if(navigator.vibrate)navigator.vibrate(ms)}catch(e){}}
function toast(msg){let e=$('#toast');e.textContent=msg;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),1700)}
function banner(msg){let e=$('#banner');e.textContent=msg;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),760)}
function lootPop(icon,title,desc){clearTimeout(lootTimer);$('#lootIcon').textContent=icon;$('#lootTitle').textContent=title;$('#lootDesc').textContent=desc;$('#lootPop').classList.add('show');lootTimer=setTimeout(()=>$('#lootPop').classList.remove('show'),1800)}
function artifactLuck(){return(state.artifacts.coin||0)*.04+(state.talents.luck||0)*.03+(state.activePet==='owl'?.08:0)}
