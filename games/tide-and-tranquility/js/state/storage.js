/* Tide state, migration, save data, and offline progress */
'use strict';
function defaultState(){return{
 version:2,gold:700,pearls:5,wood:12,shells:10,coral:3,
 equipment:{rod:{level:1,rarity:0},line:{level:1,rarity:0},reel:{level:1,rarity:0},sonar:{level:1,rarity:0}},
 boat:{level:1,hull:'skiff',paint:0,engine:1,storage:1},region:0,unlockedRegion:0,story:0,
 lures:{worm:6,minnow:2,spinner:2,jig:1,squid:0,magnet:1},selectedLure:'worm',bait:{1:0,2:0,3:0,4:0,5:0},selectedBait:0,selectedHook:'standard',
 net:[],aquarium:[],aqua:{slots:8,level:1,theme:'reef',decor:'coral',clean:100,feedUntil:0,lastClaim:now()},
 hatchery:{parents:[],egg:null},book:{},catches:0,bestValue:0,bestWeight:0,totalGold:0,
 materialsFound:0,relics:[],secrets:{},hunts:{active:null,completed:{}},missions:{catch10:false,aqua5:false,raregear:false,relic2:false},
 weather:{type:'clear',until:0,lightningAt:0},world:{cycleStart:now()-216000,eventsSeen:0,messagesFound:0,debrisFound:0,chartLuckUntil:0},preferences:{...PREF_DEFAULTS},sonarAt:0,lastSeen:now(),finalBonus:false
}}
function migrate(raw){let s=defaultState();if(!raw)return s;
 if(raw.version===2){s=Object.assign(s,raw);s.equipment=Object.assign(defaultState().equipment,raw.equipment||{});Object.keys(s.equipment).forEach(k=>s.equipment[k]=Object.assign({level:1,rarity:0},s.equipment[k]||{}));s.boat=Object.assign(defaultState().boat,raw.boat||{});s.lures=Object.assign(defaultState().lures,raw.lures||{});s.bait=Object.assign(defaultState().bait,raw.bait||{});s.aqua=Object.assign(defaultState().aqua,raw.aqua||{});s.hatchery=Object.assign(defaultState().hatchery,raw.hatchery||{});s.hunts={active:raw.hunts&&raw.hunts.active||null,completed:Object.assign({},raw.hunts&&raw.hunts.completed||{})};s.weather=Object.assign(defaultState().weather,raw.weather||{});s.secrets=Object.assign({},raw.secrets||{});s.relics=Array.isArray(raw.relics)?raw.relics:[];s.aquarium=Array.isArray(raw.aquarium)?raw.aquarium:[];return s}
 // V1 compatibility
 s.gold=raw.gold??s.gold;s.pearls=raw.pearls??s.pearls;s.wood=raw.wood??s.wood;s.shells=raw.shells??s.shells;
 s.equipment.rod.level=raw.rod||1;s.equipment.line.level=raw.line||1;s.equipment.reel.level=raw.reel||1;s.boat.level=raw.boat||1;s.unlockedRegion=raw.unlockedRegion||0;s.region=Math.min(raw.region||0,s.unlockedRegion);s.bait=Object.assign(s.bait,raw.bait||{});s.net=raw.net||[];s.book=raw.book||{};s.catches=raw.catches||0;s.bestValue=raw.bestValue||0;
 s.aquarium=(raw.aquarium||[]).map((x,i)=>({uid:'v1_'+i+'_'+now(),id:x.id,gene:{value:1,size:1,hue:0},nickname:'',added:x.added||now()}));s.aqua.slots=raw.aquaSlots||8;s.aqua.lastClaim=raw.lastAquaClaim||now();s.aqua.feedUntil=raw.feedUntil||0;return s
}
const SAVE_KEY='tideTranquilitySaveV2',BACKUP_KEY='tideTranquilitySaveV2Backup';let storageEnabled=true,memorySave='';
function finiteNumber(value,fallback=0,min=-Infinity,max=Infinity){value=Number(value);return Number.isFinite(value)?clamp(value,min,max):fallback}
function sanitizeState(input){
 let s=migrate(input),d=defaultState();
 s.gold=finiteNumber(s.gold,d.gold,0,1e12);s.pearls=finiteNumber(s.pearls,d.pearls,0,1e9);s.wood=finiteNumber(s.wood,d.wood,0,1e9);s.shells=finiteNumber(s.shells,d.shells,0,1e9);s.coral=finiteNumber(s.coral,d.coral,0,1e9);
 s.region=Math.round(finiteNumber(s.region,0,0,regions.length-1));s.unlockedRegion=Math.round(finiteNumber(s.unlockedRegion,0,0,regions.length-1));s.region=Math.min(s.region,s.unlockedRegion);s.story=Math.round(finiteNumber(s.story,0,0,storyDefs.length));
 s.boat=Object.assign({},d.boat,s.boat||{});s.boat.level=Math.round(finiteNumber(s.boat.level,1,1,99));s.boat.engine=Math.round(finiteNumber(s.boat.engine,1,1,99));s.boat.storage=Math.round(finiteNumber(s.boat.storage,1,1,99));s.boat.paint=Math.round(finiteNumber(s.boat.paint,0,0,paints.length-1));if(!hulls.some(h=>h.id===s.boat.hull))s.boat.hull='skiff';
 s.equipment=Object.assign({},d.equipment,s.equipment||{});Object.keys(d.equipment).forEach(k=>{s.equipment[k]=Object.assign({},d.equipment[k],s.equipment[k]||{});s.equipment[k].level=Math.round(finiteNumber(s.equipment[k].level,1,1,999));s.equipment[k].rarity=Math.round(finiteNumber(s.equipment[k].rarity,0,0,rarity.length-1))});
 s.lures=Object.assign({},d.lures,s.lures||{});Object.keys(d.lures).forEach(k=>s.lures[k]=Math.round(finiteNumber(s.lures[k],d.lures[k],0,1e9)));if(!lureDefs[s.selectedLure])s.selectedLure='worm';
 s.bait=Object.assign({},d.bait,s.bait||{});[1,2,3,4,5].forEach(k=>s.bait[k]=Math.round(finiteNumber(s.bait[k],0,0,1e9)));s.selectedBait=Math.round(finiteNumber(s.selectedBait,0,0,5));if(!hookDefs[s.selectedHook])s.selectedHook='standard';
 s.net=Array.isArray(s.net)?s.net.slice(-100):[];s.aquarium=Array.isArray(s.aquarium)?s.aquarium.filter(x=>x&&allDefs()[x.id]).slice(0,100):[];s.relics=Array.isArray(s.relics)?[...new Set(s.relics.filter(id=>relicDefs.some(r=>r.id===id)))]:[];
 s.aqua=Object.assign({},d.aqua,s.aqua||{});s.aqua.slots=Math.round(finiteNumber(s.aqua.slots,8,2,100));s.aqua.level=Math.round(finiteNumber(s.aqua.level,1,1,99));s.aqua.clean=finiteNumber(s.aqua.clean,100,0,100);s.aqua.lastClaim=finiteNumber(s.aqua.lastClaim,now(),0,now()+86400000);if(!themes[s.aqua.theme])s.aqua.theme='reef';
 s.book=s.book&&typeof s.book==='object'?s.book:{};s.secrets=s.secrets&&typeof s.secrets==='object'?s.secrets:{};s.missions=Object.assign({},d.missions,s.missions||{});s.hunts={active:s.hunts&&legendaryDefs[s.hunts.active]?s.hunts.active:null,completed:Object.assign({},s.hunts&&s.hunts.completed||{})};
 s.weather=Object.assign({},d.weather,s.weather||{});if(!['clear','mist','rain','wind','storm'].includes(s.weather.type))s.weather.type='clear';s.weather.until=finiteNumber(s.weather.until,0,0,now()+86400000);s.weather.lightningAt=finiteNumber(s.weather.lightningAt,0,0,now()+86400000);
 s.world=Object.assign({},d.world,s.world||{});s.world.cycleStart=finiteNumber(s.world.cycleStart,d.world.cycleStart,0,now()+86400000);s.world.eventsSeen=Math.round(finiteNumber(s.world.eventsSeen,0,0,1e9));s.world.messagesFound=Math.round(finiteNumber(s.world.messagesFound,0,0,1e9));s.world.debrisFound=Math.round(finiteNumber(s.world.debrisFound,0,0,1e9));s.world.chartLuckUntil=finiteNumber(s.world.chartLuckUntil,0,0,now()+86400000);
 s.preferences=Object.assign({},PREF_DEFAULTS,s.preferences||{});['sound','music','haptics','motion'].forEach(k=>s.preferences[k]=s.preferences[k]!==false);s.preferences.volume=finiteNumber(s.preferences.volume,PREF_DEFAULTS.volume,0,1);
 s.hatchery=Object.assign({},d.hatchery,s.hatchery||{});s.hatchery.parents=Array.isArray(s.hatchery.parents)?s.hatchery.parents.filter(uid=>s.aquarium.some(x=>x.uid===uid)).slice(0,2):[];if(s.aqua.slots<s.aquarium.length)s.aqua.slots=s.aquarium.length;
 s.lastSeen=finiteNumber(s.lastSeen,now(),0,now()+86400000);
 return s;
}
function parseStored(raw){if(!raw)return null;try{return JSON.parse(raw)}catch(error){console.warn('[Tide & Tranquility] Ignored invalid save data.',error);return null}}
function load(){
 try{
  const primary=parseStored(localStorage.getItem(SAVE_KEY)||localStorage.getItem('tideTranquilitySave'));
  if(primary)return sanitizeState(primary);
  const backup=parseStored(localStorage.getItem(BACKUP_KEY));
  if(backup)return sanitizeState(backup);
 }catch(error){storageEnabled=false;console.info('[Tide & Tranquility] Persistent storage is unavailable in this viewer. Export remains available.');}
 return defaultState();
}
let state=load();
function save(){
 state.lastSeen=now();state=sanitizeState(state);let payload='';try{payload=JSON.stringify(state);memorySave=payload}catch(error){console.error('[Tide & Tranquility] Save serialization failed.',error);return false}
 if(!storageEnabled)return false;
 try{const previous=localStorage.getItem(SAVE_KEY);if(previous&&parseStored(previous))localStorage.setItem(BACKUP_KEY,previous);localStorage.setItem(SAVE_KEY,payload);return true}catch(error){storageEnabled=false;console.info('[Tide & Tranquility] Progress is in memory for this session.');return false}
}

function encodeSaveData(value){let json=JSON.stringify({format:'TideAndTranquility',formatVersion:1,savedAt:now(),state:value});if(window.TextEncoder){let bytes=new TextEncoder().encode(json),binary='',chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(binary)}return btoa(unescape(encodeURIComponent(json)))}
function decodeSaveData(text){let raw=String(text||'').trim();if(!raw)throw new Error('Empty save');let parsed;if(raw.startsWith('{'))parsed=JSON.parse(raw);else{let binary=atob(raw),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));let json=window.TextDecoder?new TextDecoder().decode(bytes):decodeURIComponent(escape(binary));parsed=JSON.parse(json)}return parsed&&parsed.format==='TideAndTranquility'&&parsed.state?parsed.state:parsed}

function gearStat(slot){let g=state.equipment[slot],r=rarity[g.rarity].m;return g.level*r}
function rodTier(){return clamp(1+Math.floor((gearStat('rod')-1)/2.2),1,6)}
function lineDepth(){return Math.round(230+(gearStat('line')-1)*62+lureDefs[state.selectedLure].depth)}
function reelPower(){return 1+(gearStat('reel')-1)*.12}
function sonarCooldown(){return Math.max(10000,32000-(gearStat('sonar')-1)*2200)}
function currentRegion(){return regions[state.region]}
function aquariumHappiness(){let feed=now()<state.aqua.feedUntil?12:0;return clamp(Math.round(state.aqua.clean+feed),20,110)}
function aquariumRate(){let defs=allDefs(),base=state.aquarium.reduce((a,x)=>{let f=defs[x.id]||fishDefs.silverfin;return a+f.value*.16*(x.gene&&x.gene.value||1)},0);let multi=(.55+aquariumHappiness()/200)*(1+(state.aqua.level-1)*.12)*(state.finalBonus?1.1:1);return base*multi}
function aquariumStored(){let hrs=Math.min(18,(now()-state.aqua.lastClaim)/3600000);return Math.floor(aquariumRate()*hrs)}
function updateOffline(){let hrs=Math.min(18,(now()-(state.lastSeen||now()))/3600000);if(hrs>.08){state.aqua.clean=clamp(state.aqua.clean-Math.floor(hrs*2.5),20,100)}}
updateOffline();
