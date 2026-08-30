function initDockBuilder(){ensureDockBuilderState();document.querySelectorAll('#dockModeTabs button').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=()=>{dockMode=b.dataset.mode;dockPart=dockMode==='boat'?'hull':dockMode==='rod'?'blank':'materials';dockTrayPage=0;renderDockBuilder()}})}
function showSystemNotice(message){let el=$('#systemNotice');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(showSystemNotice.timer);showSystemNotice.timer=setTimeout(()=>el.classList.remove('show'),2600)}
function safeRender(name,fn){try{fn()}catch(error){console.error('[Tide & Tranquility] '+name,error);showSystemNotice('A display section recovered automatically.')}}
function renderAll(){
 syncViewportVars();
 [
  ['top',renderTop],['bait',renderBait],['lures',renderLures],['status',renderStatus],
  ['chart',renderWorldMap],['dock',renderDockBuilder],['aquarium',renderAquarium],
  ['hunts',renderHunts],['relics',renderRelics],['atlas',renderBook],['log',renderCaptainLog]
 ].forEach(([name,fn])=>safeRender(name,fn));
 requestAnimationFrame(()=>{fitWorldMap();});
}

let captainLogTab='missions';
const logPageState={missions:0,hunts:0,relics:0,atlas:0,data:0};
function logSource(tab){if(tab==='missions')return missionDefs();if(tab==='hunts')return huntEntries();if(tab==='relics')return relicDefs;if(tab==='atlas')return Object.entries(allDefs());return[]}
function logPageSize(tab){let compact=window.innerHeight<650||(window.innerWidth>window.innerHeight&&window.innerHeight<560);if(tab==='atlas')return compact?4:6;return compact?2:3}
function pagedLogItems(tab,items,size=logPageSize(tab)){let pages=Math.max(1,Math.ceil(items.length/size));logPageState[tab]=clamp(logPageState[tab]||0,0,pages-1);return{items:items.slice(logPageState[tab]*size,logPageState[tab]*size+size),pages}}
function renderLogPager(){let p=$('#logPager');if(!p)return;p.innerHTML='';let items=logSource(captainLogTab),size=logPageSize(captainLogTab),pages=Math.max(1,Math.ceil(items.length/size)),page=clamp(logPageState[captainLogTab]||0,0,pages-1);logPageState[captainLogTab]=page;if(pages<=1||captainLogTab==='data')return;let prev=document.createElement('button'),next=document.createElement('button'),label=document.createElement('span');prev.textContent='‹';next.textContent='›';label.textContent=(page+1)+' / '+pages;prev.disabled=page===0;next.disabled=page===pages-1;const redraw=()=>{if(captainLogTab==='missions')renderMissions();else if(captainLogTab==='hunts')renderHunts();else if(captainLogTab==='relics')renderRelics();else if(captainLogTab==='atlas')renderBook()};prev.onclick=()=>{logPageState[captainLogTab]--;redraw()};next.onclick=()=>{logPageState[captainLogTab]++;redraw()};p.append(prev,label,next)}
function setCaptainLogTab(tab){captainLogTab=tab||captainLogTab;document.querySelectorAll('#logTabs button').forEach(b=>{let active=b.dataset.logtab===captainLogTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false')});document.querySelectorAll('[data-logpanel]').forEach(p=>p.classList.toggle('active',p.dataset.logpanel===captainLogTab));renderLogPager()}
function initCaptainLog(){document.querySelectorAll('#logTabs button').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.setAttribute('role','tab');b.addEventListener('click',()=>setCaptainLogTab(b.dataset.logtab))});setCaptainLogTab(captainLogTab)}
function renderCaptainLog(){initCaptainLog();$('#missionHeroCopy')&&($('#missionHeroCopy').textContent='Story '+Math.min(state.story+1,storyDefs.length)+' of '+storyDefs.length+' · '+state.catches+' catches · '+state.relics.length+' relics.');renderExperienceSettings();renderLogPager()}

function renderExperienceSettings(){let p=currentPrefs();[['soundToggle','soundState','sound'],['musicToggle','musicState','music'],['hapticToggle','hapticState','haptics'],['motionToggle','motionState','motion']].forEach(([bid,sid,key])=>{let b=$('#'+bid),s=$('#'+sid);if(b){b.setAttribute('aria-pressed',p[key]?'true':'false');b.classList.toggle('active',!!p[key])}if(s)s.textContent=p[key]?'ON':'OFF'});let v=$('#audioVolume');if(v&&document.activeElement!==v)v.value=String(p.volume)}
function togglePreference(key){state.preferences[key]=!state.preferences[key];if(key==='sound'&&state.preferences.sound)ensureAudio();if(key==='haptics'&&state.preferences.haptics)haptic('success');save();applyPreferences();renderExperienceSettings()}
function bindExperienceSettings(){[['soundToggle','sound'],['musicToggle','music'],['hapticToggle','haptics'],['motionToggle','motion']].forEach(([id,key])=>$('#'+id)?.addEventListener('click',()=>togglePreference(key)));let v=$('#audioVolume');if(v){v.addEventListener('input',e=>{state.preferences.volume=clamp(Number(e.target.value)||0,0,1);ensureAudio();applyPreferences()});v.addEventListener('change',()=>save())}}


let oceanGesture=null;
canvas.addEventListener('pointerdown',e=>{if(hook.mode!=='sinking')return;let r=canvas.getBoundingClientRect();oceanGesture={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),cx:(e.clientX-r.left)/r.width*W,cy:(e.clientY-r.top)/r.height*H}},{passive:true});
canvas.addEventListener('pointermove',e=>{if(!oceanGesture||oceanGesture.id!==e.pointerId||hook.mode!=='sinking')return;let dx=e.clientX-oceanGesture.x,dy=e.clientY-oceanGesture.y,dist=Math.hypot(dx,dy);if(dist<5)return;let dt=Math.max(16,performance.now()-oceanGesture.t),speed=dist/dt*16,action=Math.abs(dy)>Math.abs(dx)*1.15?'JIG':Math.abs(dx)>12?'SWEEP':'TWITCH';hook.action=action;hook.actionEnergy=clamp((hook.actionEnergy||0)+speed*.16+.18,0,1);if(action==='JIG')hook.jigImpulse=clamp((hook.jigImpulse||0)+(-dy/22),-1.4,1.4);oceanGesture.x=e.clientX;oceanGesture.y=e.clientY;oceanGesture.t=performance.now();renderOceanHud(true)},{passive:true});
function clearOceanGesture(){oceanGesture=null}canvas.addEventListener('pointerup',clearOceanGesture,{passive:true});canvas.addEventListener('pointercancel',clearOceanGesture,{passive:true});
ensureWorldState();

// Aquarium UI bindings
$('#aquaEditBtn').addEventListener('click',()=>{closeAquaSheet();setAquaEditMode(!aquaEditMode)});
$('#aquaInventoryBtn').addEventListener('click',()=>openAquaSheet('inventory','decor'));
$('#aquaHatchOpen').addEventListener('click',()=>openAquaSheet('hatch'));
$('#aquaFishOpen').addEventListener('click',()=>openAquaSheet('fish'));
$('#aquaCareOpen').addEventListener('click',()=>openAquaSheet('care'));
$('#aquaHappyChip').addEventListener('click',()=>openAquaSheet('care'));
$('#aquaSheetClose').addEventListener('click',closeAquaSheet);
$('#aquaSizeRange').addEventListener('input',()=>{});
$('#aquaSizeRange').addEventListener('change',()=>save());
$('#deleteDecorBtn').addEventListener('click',deleteSelectedDecor);


// ===== Captain & Harbor 9.1 =====
const CAPTAIN_SKILLS={
 angler:{name:'Angler',icon:'⌁',desc:'Faster bites, stronger reeling, and heavier trophy fish.'},
 explorer:{name:'Explorer',icon:'⌖',desc:'More discoveries, faster sonar, and better harbor prices.'},
 naturalist:{name:'Naturalist',icon:'◌',desc:'Happier aquariums, higher income, and stronger mutations.'}
};
const BOAT_MODULES={
 lights:{name:'Deck Lights',icon:'✦',level:2,gold:700,wood:2,shells:2,coral:0,desc:'Night bite +15% and rare sightings +8%.'},
 stabilizer:{name:'Sea Stabilizer',icon:'≈',level:3,gold:1100,wood:4,shells:1,coral:1,desc:'Reduces storm and trophy-fish pull by 14%.'},
 livewell:{name:'Research Livewell',icon:'▣',level:3,gold:1250,wood:3,shells:3,coral:2,desc:'Aquarium catches start with +10% value genes.'},
 sonarArray:{name:'Sonar Array',icon:'⌁',level:4,gold:1650,wood:4,shells:4,coral:2,desc:'Sonar cooldown -22% and rare scans improve.'},
 salvage:{name:'Salvage Winch',icon:'⚙',level:4,gold:1450,wood:5,shells:2,coral:1,desc:'More wreckage, treasure, and salvage materials.'}
};
const ROD_BUILD_DEFS={
 blank:[
  {name:'Cedar',note:'Balanced natural flex.',bite:1,reel:1,depth:0,rare:1,pull:1,jig:1,value:1},
  {name:'Sport',note:'Fast response · Reel +12%.',bite:1.02,reel:1.12,depth:0,rare:1,pull:1,jig:1.04,value:1},
  {name:'Graphite',note:'Sensitive tip · Bite +10% · Rare +5%.',bite:1.10,reel:1.04,depth:10,rare:1.05,pull:.98,jig:1.06,value:1},
  {name:'Tidal',note:'Deep control · +70m reach · Jig +15%.',bite:1.04,reel:1.02,depth:70,rare:1.03,pull:.96,jig:1.15,value:1}
 ],
 grip:[
  {name:'Cork',note:'Balanced, forgiving grip.',bite:1,reel:1,pull:1,jig:1},
  {name:'Rubber',note:'Storm grip · Fish pull -7%.',bite:1,reel:1.01,pull:.93,jig:1},
  {name:'Leather',note:'Power grip · Reel +8%.',bite:.99,reel:1.08,pull:.97,jig:1},
  {name:'Seafoam',note:'Technique grip · Lure action +10%.',bite:1.04,reel:1,pull:.98,jig:1.10}
 ],
 reel:[
  {name:'Silver',note:'Balanced reel.',reel:1,pull:1,value:1},
  {name:'Gold',note:'Collector reel · Catch value +8%.',reel:1.02,pull:1,value:1.08},
  {name:'Black',note:'High torque · Reel +11%.',reel:1.11,pull:.98,value:1},
  {name:'Blue',note:'Smooth drag · Fish pull -8%.',reel:1.04,pull:.92,value:1}
 ],
 guides:[
  {name:'4 Guides',note:'Long-cast setup · Bite +3%.',bite:1.03,pull:1,rare:1},
  {name:'5 Guides',note:'Balanced line control.',bite:1,pull:.98,rare:1},
  {name:'6 Guides',note:'Stable pressure · Fish pull -6%.',bite:1,pull:.94,rare:1.02},
  {name:'7 Guides',note:'Trophy control · Rare +7%.',bite:.98,pull:.92,rare:1.07}
 ]
};
const AQUA_PERSONALITIES={
 social:{name:'Social',icon:'♡',decor:'nature',speed:1.05},
 curious:{name:'Curious',icon:'?',decor:'treasure',speed:1.12},
 shy:{name:'Shy',icon:'◌',decor:'nature',speed:.86},
 bold:{name:'Bold',icon:'!',decor:'treasure',speed:1.18},
 serene:{name:'Serene',icon:'≈',decor:'nature',speed:.78},
 territorial:{name:'Territorial',icon:'◇',decor:'ruins',speed:.96}
};
function stableHash(s){s=String(s||'');let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function ensureV9State(){
 if(!state.captain||typeof state.captain!=='object')state.captain={level:1,xp:0,skillPoints:0,skills:{angler:0,explorer:0,naturalist:0}};
 state.captain.level=clamp(Math.round(+state.captain.level||1),1,99);state.captain.xp=Math.max(0,+state.captain.xp||0);state.captain.skillPoints=Math.max(0,Math.round(+state.captain.skillPoints||0));state.captain.skills=Object.assign({angler:0,explorer:0,naturalist:0},state.captain.skills||{});Object.keys(CAPTAIN_SKILLS).forEach(k=>state.captain.skills[k]=clamp(Math.round(+state.captain.skills[k]||0),0,5));
 if(!Array.isArray(state.boat.modules))state.boat.modules=[];state.boat.modules=[...new Set(state.boat.modules.filter(id=>BOAT_MODULES[id]))];
 if(!state.harbor||typeof state.harbor!=='object')state.harbor={sales:0,lastBucket:0};state.harbor.sales=Math.max(0,Math.round(+state.harbor.sales||0));
 state.aquarium.forEach(ensureFishIdentity);
 return state;
}
function captainXpNeed(level=state.captain?.level||1){return Math.round(95+level*58+Math.pow(level,1.34)*18)}
function gainCaptainXP(amount,reason=''){ensureV9State();amount=Math.max(0,Math.round(amount||0));if(!amount)return;state.captain.xp+=amount;let leveled=0;while(state.captain.level<99&&state.captain.xp>=captainXpNeed()){state.captain.xp-=captainXpNeed();state.captain.level++;state.captain.skillPoints++;leveled++}if(leveled){haptic('success');tone(920,.10);setTimeout(()=>tone(1160,.12),90);showSystemNotice('Captain Level '+state.captain.level+' · +'+leveled+' skill point'+(leveled>1?'s':''));}renderCaptainProgress()}
function skillRank(k){ensureV9State();return state.captain.skills[k]||0}
function captainBiteBonus(){return 1+skillRank('angler')*.045}
function captainRareBonus(){return 1+skillRank('angler')*.035+skillRank('explorer')*.018}
function captainTrophyBonus(){return 1+skillRank('angler')*.028}
function captainExplorerBonus(){return 1+skillRank('explorer')*.085}
function captainNaturalistBonus(){return 1+skillRank('naturalist')*.08}
function captainMarketBonus(){return 1+skillRank('explorer')*.018}
function spendCaptainPoint(k){ensureV9State();if(!CAPTAIN_SKILLS[k])return;if(state.captain.skills[k]>=5)return toast('That discipline is mastered.');if(state.captain.skillPoints<=0)return toast('Earn another Captain Level for a skill point.');state.captain.skillPoints--;state.captain.skills[k]++;save();renderAll();renderCaptainProgress();haptic('success');tone(720,.06);toast(CAPTAIN_SKILLS[k].name+' Rank '+state.captain.skills[k])}
function renderCaptainProgress(){if(!state||!state.captain)return;ensureV9State();let c=state.captain,need=captainXpNeed();$('#captainLevelTop')&&($('#captainLevelTop').textContent=c.level);$('#captainLevelBig')&&($('#captainLevelBig').textContent=c.level);$('#captainXpText')&&($('#captainXpText').textContent=fmt(c.xp)+' / '+fmt(need)+' XP');$('#captainXpFill')&&($('#captainXpFill').style.width=clamp(c.xp/need*100,0,100)+'%');$('#captainPointsText')&&($('#captainPointsText').textContent=c.skillPoints+' skill point'+(c.skillPoints===1?'':'s')+' available');let grid=$('#captainSkillGrid');if(grid){grid.innerHTML='';Object.entries(CAPTAIN_SKILLS).forEach(([id,d])=>{let rank=skillRank(id),card=document.createElement('div');card.className='captain-skill-card';card.innerHTML=`<div class="captain-skill-icon">${d.icon}</div><div class="captain-skill-copy"><b>${d.name}</b><small>${d.desc}</small></div><div class="captain-skill-rank"><span>RANK ${rank}/5</span><button type="button" ${rank>=5||c.skillPoints<=0?'disabled':''}>${rank>=5?'MASTERED':'UPGRADE'}</button></div>`;card.querySelector('button').onclick=()=>spendCaptainPoint(id);grid.appendChild(card)})}let strip=$('#captainBonusStrip');if(strip)strip.innerHTML=`<span><small>BITE</small><b>+${Math.round((captainBiteBonus()-1)*100)}%</b></span><span><small>DISCOVERY</small><b>+${Math.round((captainExplorerBonus()-1)*100)}%</b></span><span><small>AQUARIUM</small><b>+${Math.round((captainNaturalistBonus()-1)*100)}%</b></span>`}
function boatModuleSlots(){return clamp(1+Math.floor((state.boat.level-1)/2),1,4)}
function hasBoatModule(id){ensureV9State();return state.boat.modules.includes(id)}
function toggleBoatModule(id){ensureV9State();let d=BOAT_MODULES[id];if(!d)return;if(hasBoatModule(id)){state.boat.modules=state.boat.modules.filter(x=>x!==id);save();renderAll();toast(d.name+' removed.');return}if(state.boat.level<d.level)return toast('Requires Boat Lv '+d.level+'.');if(state.boat.modules.length>=boatModuleSlots())return toast('Module slots full · '+boatModuleSlots()+' available.');if(state.gold<d.gold||state.wood<d.wood||state.shells<d.shells||state.coral<d.coral)return toast('Need '+fmt(d.gold)+'G · '+d.wood+' wood · '+d.shells+' shells'+(d.coral?' · '+d.coral+' coral':''));state.gold-=d.gold;state.wood-=d.wood;state.shells-=d.shells;state.coral-=d.coral;state.boat.modules.push(id);save();renderAll();haptic('success');toast(d.name+' installed.')}
function boatFishingBonuses(){let night=oceanCycle().night;return{bite:hasBoatModule('lights')&&night?1.15:1,rare:hasBoatModule('lights')&&night?1.08:(hasBoatModule('sonarArray')?1.035:1),special:hasBoatModule('salvage')?1.38:1,pull:hasBoatModule('stabilizer')?.86:1}}
function salvageYieldMultiplier(){return hasBoatModule('salvage')?1.55:1}
function rodBuildBonuses(){ensureDockBuilderState();let d=state.dockBuilder.rodDesign,b=ROD_BUILD_DEFS.blank[d.blank%4],g=ROD_BUILD_DEFS.grip[d.grip%4],r=ROD_BUILD_DEFS.reel[d.reel%4],q=ROD_BUILD_DEFS.guides[d.guides%4];return{bite:(b.bite||1)*(g.bite||1)*(q.bite||1),reel:(b.reel||1)*(g.reel||1)*(r.reel||1),depth:b.depth||0,rare:(b.rare||1)*(q.rare||1),pull:(b.pull||1)*(g.pull||1)*(r.pull||1)*(q.pull||1),jig:(b.jig||1)*(g.jig||1),value:r.value||1}}
function rodBuildName(){ensureDockBuilderState();let d=state.dockBuilder.rodDesign,b=ROD_BUILD_DEFS.blank[d.blank%4],r=ROD_BUILD_DEFS.reel[d.reel%4];return b.name+' / '+r.name}
const v8LineDepth=lineDepth;lineDepth=function(){return Math.round(v8LineDepth()+rodBuildBonuses().depth)};
const v8ReelPower=reelPower;reelPower=function(){return v8ReelPower()*rodBuildBonuses().reel*(1+skillRank('angler')*.04)};
const v8SonarCooldown=sonarCooldown;sonarCooldown=function(){let m=(1-skillRank('explorer')*.045)*(hasBoatModule('sonarArray')?.78:1);return Math.max(6500,Math.round(v8SonarCooldown()*m))};
const v8FightProfile=fightProfile;fightProfile=function(f,dt){return v8FightProfile(f,dt)*rodBuildBonuses().pull*boatFishingBonuses().pull};
const v8TackleMetrics=tackleMetrics;tackleMetrics=function(){let m=v8TackleMetrics(),rb=rodBuildBonuses(),capt=captainBiteBonus();m.bite*=rb.bite*capt*boatFishingBonuses().bite;m.biteLabel=m.bite>=2.5?'Excellent':m.bite>=1.75?'High':m.bite>=1.15?'Good':'Low';let rareMulti=captainRareBonus()*rb.rare*boatFishingBonuses().rare;m.rare=Math.max(0,Math.round(((1+(m.rare||0)/100)*rareMulti-1)*100));return m};
function marketBucket(){return Math.floor(now()/(8*60*1000))}
function marketMultiplierForFish(id){let f=allDefs()[id]||fishDefs.silverfin,h=stableHash(id+'|'+state.region+'|'+marketBucket()),wave=((h%1000)/999-.5)*.54,tier=(f.tier-3)*.025,local=f.regs&&f.regs.includes(state.region)?.035:-.025;return clamp((1+wave+tier+local)*captainMarketBonus(),.72,1.48)}
function marketMaterialMultiplier(key){let h=stableHash(key+'|'+state.region+'|'+marketBucket());return clamp(.88+(h%1000)/999*.28,.84,1.18)}
function marketPriceFish(id,base){return Math.max(1,Math.round(base*marketMultiplierForFish(id)))}
function marketTrendData(){let ids=Object.keys(fishDefs).filter(id=>fishDefs[id].regs.includes(state.region));return ids.map(id=>({id,name:fishDefs[id].name,m:marketMultiplierForFish(id)})).sort((a,b)=>b.m-a.m).slice(0,3)}
function marketTrendLabel(m){let pct=Math.round((m-1)*100);return (pct>=0?'+':'')+pct+'%'}
function renderHarborPulse(){let t=marketTrendData()[0],el=$('#harborTrend');if(el)el.textContent=t?marketTrendLabel(t.m):'MARKET'}
function renderHarborStage(){let rows=marketTrendData();return `<div class="harbor-market-stage"><h3>Harbor Exchange</h3><small>Local demand changes every 8 minutes.</small>${rows.map(x=>`<div class="harbor-row ${x.m>=1?'up':'down'}"><b>${x.name}</b><span>${marketTrendLabel(x.m)}</span></div>`).join('')}<div class="harbor-refresh">Explorer rank improves every sale.</div></div>`}
function ensureFishIdentity(x){if(!x)return x;let keys=Object.keys(AQUA_PERSONALITIES),h=stableHash(x.uid||x.id||Math.random());if(!x.personality||!AQUA_PERSONALITIES[x.personality])x.personality=keys[h%keys.length];if(!x.favoriteDecor)x.favoriteDecor=AQUA_PERSONALITIES[x.personality].decor;if(!x.gene)x.gene={value:1,size:1,hue:0};if(x.gene.pattern==null)x.gene.pattern=0;return x}
function aquariumDecorCats(){ensureAquaStudioState();return new Set((state.aqua.items||[]).map(it=>(studioDecorDefs[it.def]||{}).cat).filter(Boolean))}
function fishMood(x){ensureFishIdentity(x);let clean=clamp(state.aqua.clean,0,100),fed=now()<state.aqua.feedUntil?10:0,cats=aquariumDecorCats(),decor=cats.has(x.favoriteDecor)?10:-3,crowd=state.aquarium.length>state.aqua.slots*.85?-5:0,compat=0;if(x.personality==='social'&&state.aquarium.length>=3)compat+=5;if(x.personality==='territorial'&&state.aquarium.length>8)compat-=6;if(x.personality==='shy'&&state.aquarium.length>10)compat-=4;return clamp(Math.round(clean*.72+18+fed+decor+crowd+compat),20,110)}
aquariumHappiness=function(){ensureV9State();if(!state.aquarium.length)return clamp(Math.round(state.aqua.clean),20,100);return Math.round(state.aquarium.reduce((a,x)=>a+fishMood(x),0)/state.aquarium.length)};
aquariumRate=function(){ensureV9State();let defs=allDefs(),base=state.aquarium.reduce((a,x)=>{ensureFishIdentity(x);let f=defs[x.id]||fishDefs.silverfin,mood=fishMood(x)/100;return a+f.value*.16*(x.gene?.value||1)*(.7+mood*.35)},0);let multi=(.58+aquariumHappiness()/210)*(1+(state.aqua.level-1)*.12)*(state.finalBonus?1.1:1)*captainNaturalistBonus();return base*multi};
const v8FishSvg=fishSvg;fishSvg=function(id,gene){let svg=v8FishSvg(id,gene),p=gene&&gene.pattern||0;if(!p)return svg;let mark=p===1?'<circle cx="63" cy="35" r="4" fill="rgba(255,255,255,.28)"/><circle cx="78" cy="43" r="3" fill="rgba(255,255,255,.22)"/>':p===2?'<path d="M56 25L61 55M72 22L76 57M87 24L91 53" stroke="rgba(255,255,255,.22)" stroke-width="4"/>':'<path d="M52 40Q70 24 91 40Q70 55 52 40Z" fill="rgba(255,255,255,.18)"/>';return svg.replace('</svg>',mark+'</svg>')};
const v8UpdateAquariumStudio=updateAquariumStudio;updateAquariumStudio=function(dt){ensureV9State();aquaFishActors.forEach(a=>{let x=state.aquarium.find(q=>q.uid===a.uid);if(!x)return;ensureFishIdentity(x);let p=AQUA_PERSONALITIES[x.personality]||AQUA_PERSONALITIES.serene,limit=30*p.speed;a.vx=clamp(a.vx,-limit,limit);if(x.personality==='social'){let mate=aquaFishActors.find(m=>m!==a&&Math.abs(m.y-a.y)<.16);if(mate)a.vy+=clamp((mate.y-a.y)*2,-.25,.25)}if(x.personality==='shy'&&(a.x>.35&&a.x<.65))a.vx+=(a.x<.5?-1:1)*.15});v8UpdateAquariumStudio(dt)};
const v8RenderAquaSheet=renderAquaSheet;renderAquaSheet=function(){v8RenderAquaSheet();if(aquaSheetKind==='fish'||aquaSheetKind==='hatch'){document.querySelectorAll('#aquaSheetBody .aqua-fish-card').forEach((c,i)=>{let page=pageSlice(state.aquarium,4),x=page.items[i];if(!x)return;ensureFishIdentity(x);let sm=c.querySelector('small'),p=AQUA_PERSONALITIES[x.personality],m=fishMood(x);if(sm)sm.innerHTML=(sm.textContent||'')+`<span class="aqua-personality ${m>=85?'aqua-mood-good':m>=65?'aqua-mood-mid':'aqua-mood-low'}">${p.icon} ${p.name} · ${m}% mood</span>`})}if(aquaSheetKind==='care'){let sub=$('#aquaSheetSub');if(sub)sub.textContent='Harmony '+aquariumHappiness()+'% · Naturalist bonus +'+Math.round((captainNaturalistBonus()-1)*100)+'%'}};
const v8RenderAquarium=renderAquarium;renderAquarium=function(){ensureV9State();v8RenderAquarium();if(!aquaEditMode){let m=$('#aquaModeText');if(m)m.textContent='Living ecosystem · '+aquariumHappiness()+'% harmony'}};
breedSelected=function(){ensureV9State();if(state.hatchery.egg)return;if(state.hatchery.parents.length!==2)return toast('Select two aquarium fish.');let a=state.aquarium.find(x=>x.uid===state.hatchery.parents[0]),b=state.aquarium.find(x=>x.uid===state.hatchery.parents[1]);if(!a||!b)return;ensureFishIdentity(a);ensureFishIdentity(b);let cost=500;if(state.gold<cost)return toast('Need 500 gold.');state.gold-=cost;let harmony=(fishMood(a)+fishMood(b))/2,mutantChance=.12+skillRank('naturalist')*.025+(harmony>=90?.03:0),mutant=Math.random()<mutantChance;let gene={value:clamp(((a.gene?.value||1)+(b.gene?.value||1))/2+rand(-.05,.1)+(mutant?.18:0),.85,1.7),size:clamp(((a.gene?.size||1)+(b.gene?.size||1))/2+rand(-.07,.12),.85,1.5),hue:Math.round(((a.gene?.hue||0)+(b.gene?.hue||0))/2+rand(mutant?-45:-22,mutant?45:22)),mutant,pattern:mutant?1+Math.floor(Math.random()*3):(Math.random()<.22?pick([a.gene?.pattern||0,b.gene?.pattern||0]):0)};let child=Math.random()<.5?a.id:b.id,personality=Math.random()<.72?pick([a.personality,b.personality]):pick(Object.keys(AQUA_PERSONALITIES));state.hatchery.egg={id:child,gene,personality,favoriteDecor:AQUA_PERSONALITIES[personality].decor,ready:now()+60000};save();renderAll();tone(560,.09);toast(mutant?'A rare patterned mutation formed!':'Egg placed in the incubator.')};
hatchEgg=function(force=false){let egg=state.hatchery.egg;if(!egg)return toast('No egg is incubating.');if(now()<egg.ready){if(!force){if(state.pearls<1)return toast('Wait or use 1 pearl to hatch early.');state.pearls--;force=true}}if(state.aquarium.length>=state.aqua.slots)return toast('Aquarium is full.');let fish={uid:'h_'+now()+'_'+Math.random().toString(36).slice(2,6),id:egg.id,gene:egg.gene,nickname:'',added:now(),personality:egg.personality,favoriteDecor:egg.favoriteDecor};ensureFishIdentity(fish);state.aquarium.push(fish);state.hatchery={parents:[],egg:null};gainCaptainXP(18,'hatchling');save();renderAll();tone(920,.13);haptic('success');toast('A new '+AQUA_PERSONALITIES[fish.personality].name.toLowerCase()+' hatchling joined the aquarium!')};
const v8CatchAction=catchAction;catchAction=function(type){if(!catchPending)return;if(type==='sell'){haptic('success');let f=allDefs()[catchPending.id],price=marketPriceFish(catchPending.id,Math.round(catchPending.val));state.gold+=price;state.totalGold+=price;ensureV9State();state.harbor.sales++;toast('Harbor sale · '+f.name+' for '+price+' gold ('+marketTrendLabel(marketMultiplierForFish(catchPending.id))+').');catchPending=null;$('#catchModal').classList.remove('show');save();renderAll();return}if(type==='aqua'){let cp=catchPending,f=allDefs()[cp.id];if(state.aquarium.length>=state.aqua.slots)return toast('Aquarium is full.');let gene=Object.assign({value:1,size:1,hue:0,pattern:0},cp.gene||{});if(hasBoatModule('livewell'))gene.value=clamp((gene.value||1)*1.10,.85,1.7);let fish={uid:'c_'+now()+'_'+Math.random().toString(36).slice(2,7),id:cp.id,gene,nickname:'',added:now()};ensureFishIdentity(fish);state.aquarium.push(fish);toast(f.name+' joined the aquarium · '+AQUA_PERSONALITIES[fish.personality].name+'.');catchPending=null;$('#catchModal').classList.remove('show');save();renderAll();return}v8CatchAction(type)};
const v8LandFish=landFish;landFish=function(q){let f=allDefs()[q.id];gainCaptainXP(10+f.tier*7+(q.id in legendaryDefs?70:0),'catch');v8LandFish(q);if(catchPending){catchPending.weight=+(catchPending.weight*captainTrophyBonus()).toFixed(2);catchPending.val=Math.round(catchPending.val*captainTrophyBonus()*rodBuildBonuses().value);state.bestWeight=Math.max(state.bestWeight,catchPending.weight);showCatch(catchPending)}};
const v8ClaimStory=claimStory;claimStory=function(){let before=state.story;v8ClaimStory();if(state.story>before){gainCaptainXP(45+before*12,'story');save()}};
const v8LandSpecial=landSpecial;landSpecial=function(s){let beforeRelics=state.relics.length;v8LandSpecial(s);let xp=s.type==='relic'?55:s.type==='bottle'?24:s.type==='chest'?18:10;if(s.type==='relic'&&state.relics.length===beforeRelics)xp=12;gainCaptainXP(xp,'discovery');save()};
const v8Save=save;save=function(){ensureV9State();return v8Save()};
const v8EnsureDockBuilderState=ensureDockBuilderState;ensureDockBuilderState=function(){v8EnsureDockBuilderState();ensureV9State()};
const v8BoatPartOptions=boatPartOptions;boatPartOptions=function(){ensureV9State();if(dockPart!=='systems')return v8BoatPartOptions();let slots=boatModuleSlots(),mods=Object.entries(BOAT_MODULES).map(([id,d])=>{let active=hasBoatModule(id),locked=state.boat.level<d.level,note=active?'Installed · '+d.desc:locked?'Requires Boat '+d.level:d.desc+' · '+fmt(d.gold)+'G';return{name:d.name,art:d.icon,note,active,disabled:locked,label:active?'REMOVE':'INSTALL',act:()=>toggleBoatModule(id)}});let lvl=Math.floor(1200*Math.pow(1.75,state.boat.level-1));mods.push({name:'Boat Lv '+state.boat.level,art:'⬆',note:'Modules '+state.boat.modules.length+'/'+slots+' · Next '+fmt(lvl)+'G',act:()=>{if(state.gold<lvl)return toast('Need '+fmt(lvl)+' gold');state.gold-=lvl;state.boat.level++;save();renderAll()}});return mods};
rodPartOptions=function(){ensureDockBuilderState();let d=state.dockBuilder.rodDesign;if(['blank','grip','reel','guides'].includes(dockPart)){let defs=ROD_BUILD_DEFS[dockPart];return defs.map((o,i)=>({name:o.name,art:dockPart==='blank'?'╱':dockPart==='grip'?'▰':dockPart==='reel'?'⊙':'○○',note:o.note,active:d[dockPart]===i,act:()=>{d[dockPart]=i;save();renderDockBuilder()}}))}if(dockPart==='accent')return rodAccent.map((c,i)=>({name:'Accent '+(i+1),art:`<span style="width:34px;height:34px;border-radius:50%;background:${c};display:block"></span>`,note:'Cosmetic finish',active:d.accent===i,act:()=>{d.accent=i;save();renderDockBuilder()}}));let ids=[['rod','Rod'],['line','Line'],['reel','Reel'],['sonar','Sonar']];return ids.map(([id,name])=>{let g=state.equipment[id],cost=Math.floor((160+g.level*140)*Math.pow(1.38,g.level-1));return{name:name+' '+g.level,art:gearIcon(id),note:'Core performance · '+fmt(cost)+'G',act:()=>{if(state.gold<cost)return toast('Need '+fmt(cost)+' gold');state.gold-=cost;g.level++;save();renderAll()}}})};
marketOptions=function(){
 ensureV9State();
 let arr=[];
 const matDefs=[['wood','Wood',35,'🪵'],['shells','Shells',22,'🐚'],['coral','Coral',60,'🪸']];
 if(dockPart==='materials'||dockPart==='all'){
  matDefs.forEach(([key,name,base,art])=>{
   let n=state[key]||0;if(!n)return;
   let val=Math.max(1,Math.round(base*marketMaterialMultiplier(key)));
   arr.push({name,art,note:n+' owned · '+val+'G today',sell:true,
    act:()=>{if(!state[key])return;state[key]--;state.gold+=val;state.harbor.sales++;save();renderAll()},
    all:()=>{let qty=state[key]||0;state[key]=0;state.gold+=qty*val;state.harbor.sales+=qty;save();renderAll()}
   });
  });
 }
 if(dockPart==='decor'||dockPart==='all'){
  Object.keys(studioDecorDefs).forEach(id=>{
   let n=decorAvailable(id);if(!n)return;
   let val=Math.round(sellValueForDecor(id)*marketMaterialMultiplier('decor_'+id));
   arr.push({name:studioDecorDefs[id].name,art:studioDecorDefs[id].art,note:n+' unused · '+val+'G',sell:true,
    act:()=>{if(decorAvailable(id)<=0)return;state.aqua.decorInventory[id]--;state.gold+=val;state.harbor.sales++;save();renderAll()},
    all:()=>{let qty=decorAvailable(id);state.aqua.decorInventory[id]-=qty;state.gold+=qty*val;state.harbor.sales+=qty;save();renderAll()}
   });
  });
 }
 if(dockPart==='lures'||dockPart==='all'){
  Object.entries(state.lures).forEach(([id,n])=>{
   if(n<=0||!lureDefs[id])return;
   let val=Math.max(8,Math.round(lureDefs[id].cost*.35*marketMaterialMultiplier('lure_'+id)));
   arr.push({name:lureDefs[id].name,art:lureDefs[id].icon,note:n+' owned · '+val+'G',sell:true,
    act:()=>{state.lures[id]--;state.gold+=val;state.harbor.sales++;save();renderAll()},
    all:()=>{let q=state.lures[id]||0;state.lures[id]=0;state.gold+=q*val;state.harbor.sales+=q;save();renderAll()}
   });
  });
 }
 if(dockPart==='fish'){
  arr=state.aquarium.map(x=>{
   let f=allDefs()[x.id],base=Math.round(f.value*(x.gene?.value||1)),val=marketPriceFish(x.id,base);
   return{name:instanceName(x),art:fishSvg(x.id,x.gene),note:val+'G · '+marketTrendLabel(marketMultiplierForFish(x.id)),sell:true,
    act:()=>{let i=state.aquarium.findIndex(q=>q.uid===x.uid);if(i<0)return;state.aquarium.splice(i,1);state.gold+=val;state.harbor.sales++;save();renderAll()}
   };
  });
 }
 if(dockPart==='help'){
  let top=marketTrendData();
  arr=top.map(x=>({name:x.name,art:'↗',note:'Demand '+marketTrendLabel(x.m)+' · changes in '+Math.max(1,8-(Math.floor(now()/60000)%8))+'m',disabled:true}));
 }
 if(!arr.length)arr.push({name:'Nothing to sell',art:'□',note:'Bring catches, materials, or unused decor.',disabled:true});
 return arr;
};
renderOptionGrid=function(items){let tray=$('#dockTray'),pager=$('#dockPager');if(!tray||!pager)return;tray.innerHTML='';pager.innerHTML='';const perPage=2,pages=Math.max(1,Math.ceil(items.length/perPage));dockTrayPage=clamp(dockTrayPage,0,pages-1);items.slice(dockTrayPage*perPage,dockTrayPage*perPage+perPage).forEach(o=>{let c=document.createElement('div');c.className='builder-option'+(o.active?' active':'');let label=o.label||(o.sell?'SELL 1':o.active?'ACTIVE':'SELECT');c.innerHTML=`<div class="art">${o.art}</div><b>${o.name}</b><small>${o.note||''}</small><div style="width:100%;display:grid;grid-template-columns:${o.sell&&o.all?'1fr 1fr':'1fr'};gap:4px"><button type="button" ${o.disabled?'disabled':''}>${label}</button>${o.sell&&o.all?'<button class="sellbtn" type="button">ALL</button>':''}</div>`;let bs=c.querySelectorAll('button');bs[0].onclick=()=>o.act?.();if(bs[1])bs[1].onclick=()=>o.all?.();tray.appendChild(c)});if(pages>1){let a=document.createElement('button'),b=document.createElement('button'),s=document.createElement('span');a.textContent='‹';b.textContent='›';s.textContent=(dockTrayPage+1)+' / '+pages;a.disabled=dockTrayPage===0;b.disabled=dockTrayPage===pages-1;a.onclick=()=>{dockTrayPage--;renderDockBuilder()};b.onclick=()=>{dockTrayPage++;renderDockBuilder()};pager.append(a,s,b)}};
const v8BoatBuilderSvg=boatBuilderSvg;boatBuilderSvg=function(){let svg=v8BoatBuilderSvg(),extra='';if(hasBoatModule('lights'))extra+='<g opacity=".95"><circle cx="136" cy="144" r="5" fill="#ffe59a"/><circle cx="382" cy="144" r="5" fill="#ffe59a"/></g>';if(hasBoatModule('sonarArray'))extra+='<g><line x1="312" y1="108" x2="312" y2="72" stroke="#dbe7eb" stroke-width="5"/><path d="M298 76Q312 62 326 76" fill="none" stroke="#7ec7ff" stroke-width="4"/></g>';if(hasBoatModule('salvage'))extra+='<g><circle cx="115" cy="145" r="12" fill="#34495a" stroke="#c7d0d7" stroke-width="4"/><line x1="115" y1="157" x2="100" y2="184" stroke="#c7d0d7" stroke-width="3"/></g>';return svg.replace('</svg>',extra+'</svg>')};
const v8DrawBoat=drawBoat;drawBoat=function(){v8DrawBoat();ctx.save();ctx.translate(74,waterY-39);if(hasBoatModule('lights')){ctx.fillStyle='#ffe59a';ctx.shadowColor='#ffe59a';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(20,29,2.5,0,TAU);ctx.arc(92,29,2.5,0,TAU);ctx.fill();ctx.shadowBlur=0}if(hasBoatModule('sonarArray')){ctx.strokeStyle='#dce8ed';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(72,11);ctx.lineTo(72,-7);ctx.stroke();ctx.strokeStyle='#7ec7ff';ctx.beginPath();ctx.arc(72,-4,7,Math.PI,0);ctx.stroke()}ctx.restore()};
const v8RenderDockBuilder=renderDockBuilder;renderDockBuilder=function(){ensureV9State();v8RenderDockBuilder();let v9stage=$('#dockBuildStage');if(v9stage)v9stage.dataset.v9Mode=dockMode;renderHarborPulse();if(dockMode==='market'||dockMode==='sell'){let visual=$('#dockBuildVisual');if(visual)visual.innerHTML=renderHarborStage();$('#dockHint').textContent='Demand changes automatically. Sell when the harbor favors your catch.'}else if(dockMode==='rod'){$('#dockHint').textContent=rodBuildName()+' · '+Math.round((rodBuildBonuses().bite-1)*100)+'% bite · '+Math.round((rodBuildBonuses().reel-1)*100)+'% reel'}else if(dockMode==='boat'&&dockPart==='systems'){$('#dockHint').textContent='Installed modules '+state.boat.modules.length+'/'+boatModuleSlots()+' · each changes gameplay.'}};
const v8RenderTop=renderTop;renderTop=function(){v8RenderTop();renderCaptainProgress()};
const v8RenderStatus=renderStatus;renderStatus=function(){v8RenderStatus();let s=$('#status');if(s)s.textContent+=' · Captain Lv '+state.captain.level+' · '+rodBuildName()};
const v8RenderCaptainLog=renderCaptainLog;renderCaptainLog=function(){v8RenderCaptainLog();renderCaptainProgress()};
$('#captainOpen')?.addEventListener('click',()=>{ensureV9State();renderCaptainProgress();$('#captainModal').classList.add('show');haptic('select')});
$('#harborPulse')?.addEventListener('click',()=>{dockMode='sell';dockPart='help';dockTrayPage=0;renderDockBuilder();haptic('select')});


// ===== Expedition Edition V10 =====
const V10_SPOTS=[
 [
  {id:'harbor-mouth',name:'Harbor Mouth',icon:'⚓',desc:'Calm shallows beside the old pier.',hint:'Always charted',bite:1.06,rare:1.00,depth:0,target:'Coastal fish',art:'harbor'},
  {id:'kelp-garden',name:'Kelp Garden',icon:'🌿',desc:'A green corridor full of small schools.',hint:'Catch 4 fish in Quiet Cove',bite:1.18,rare:1.03,depth:25,target:'Schooling fish',art:'kelp',threshold:4},
  {id:'lighthouse-rocks',name:'Lighthouse Rocks',icon:'◇',desc:'Broken stone where larger fish patrol.',hint:'Catch 9 fish in Quiet Cove',bite:.96,rare:1.25,depth:55,target:'Trophy fish',art:'rocks',threshold:9}
 ],
 [
  {id:'amber-flats',name:'Amber Flats',icon:'◒',desc:'Warm shelf water above golden sand.',hint:'Always charted',bite:1.08,rare:1.02,depth:20,target:'Reef fish',art:'sand'},
  {id:'wreck-channel',name:'Wreck Channel',icon:'⚑',desc:'Current sweeps through an old merchant wreck.',hint:'Catch 4 fish in Amber Shelf',bite:1.04,rare:1.16,depth:65,target:'Salvage & predators',art:'wreck',threshold:4},
  {id:'amber-ruins',name:'Amber Ruins',icon:'⌂',desc:'Submerged walls surround a territorial giant.',hint:'Catch 9 fish or recover a relic',bite:.94,rare:1.30,depth:95,target:'Amber King',art:'ruins',threshold:9,relicReveal:true}
 ],
 [
  {id:'bluewater-lane',name:'Bluewater Lane',icon:'≈',desc:'Open current beneath migrating schools.',hint:'Always charted',bite:1.10,rare:1.06,depth:45,target:'Open-water fish',art:'open'},
  {id:'migration-edge',name:'Migration Edge',icon:'»',desc:'A moving boundary where bait balls gather.',hint:'Catch 5 fish in Bluewater Reach',bite:1.20,rare:1.10,depth:80,target:'Fast predators',art:'school',threshold:5},
  {id:'storm-line',name:'Storm Line',icon:'ϟ',desc:'Violent water where the Storm Marlin feeds.',hint:'Catch 10 fish in Bluewater Reach',bite:.92,rare:1.34,depth:120,target:'Storm Marlin',art:'storm',threshold:10}
 ],
 [
  {id:'coral-gate',name:'Coral Gate',icon:'✣',desc:'Stone arches open into bright reef channels.',hint:'Always charted',bite:1.12,rare:1.04,depth:25,target:'Reef species',art:'reef'},
  {id:'garden-maze',name:'Garden Maze',icon:'❈',desc:'Dense coral hides shy and unusual species.',hint:'Catch 4 fish in Coral Labyrinth',bite:1.14,rare:1.16,depth:55,target:'Rare reef fish',art:'coral',threshold:4},
  {id:'phoenix-garden',name:'Phoenix Garden',icon:'✺',desc:'A radiant clearing revived after every storm.',hint:'Catch 9 fish or recover a relic',bite:.98,rare:1.32,depth:90,target:'Coral Phoenix',art:'phoenix',threshold:9,relicReveal:true}
 ],
 [
  {id:'trench-rim',name:'Trench Rim',icon:'▽',desc:'The shelf drops sharply into violet darkness.',hint:'Always charted',bite:1.06,rare:1.10,depth:100,target:'Deep fish',art:'trench'},
  {id:'stone-eyes',name:'Stone Eyes',icon:'◉',desc:'Ancient statues stare across the descending wall.',hint:'Catch 5 fish in Twilight Trench',bite:1.00,rare:1.20,depth:150,target:'Relics & deep fish',art:'statues',threshold:5},
  {id:'black-vent',name:'Black Vent',icon:'♨',desc:'Warm mineral water draws immense creatures.',hint:'Catch 10 fish in Twilight Trench',bite:.94,rare:1.36,depth:210,target:'Abyss trophies',art:'vents',threshold:10}
 ],
 [
  {id:'moonfall-shelf',name:'Moonfall Shelf',icon:'☾',desc:'Moonlight fades into cold blue water.',hint:'Always charted',bite:1.04,rare:1.14,depth:120,target:'Nocturnal fish',art:'moon'},
  {id:'silent-city',name:'Silent City',icon:'▥',desc:'Collapsed towers emerge when sonar sweeps the dark.',hint:'Catch 5 fish in Moonfall Abyss',bite:1.00,rare:1.24,depth:190,target:'Ruins & relics',art:'city',threshold:5},
  {id:'mirror-deep',name:'Mirror Deep',icon:'◌',desc:'Water so still that even the abyss reflects light.',hint:'Catch 10 fish and recover 2 relics',bite:.90,rare:1.42,depth:260,target:'Mirror Whale',art:'mirror',threshold:10,relicCount:2}
 ],
 [
  {id:'broken-throne',name:'Broken Throne',icon:'♜',desc:'The first plaza of a drowned royal city.',hint:'Always charted once the Crown is reached',bite:1.00,rare:1.20,depth:150,target:'Crown species',art:'crown'},
  {id:'crown-vault',name:'Crown Vault',icon:'◇',desc:'A sealed district opened by recovered relics.',hint:'Recover 3 unique relics',bite:.96,rare:1.38,depth:240,target:'Mythic fish',art:'vault',relicCount:3},
  {id:'serpent-gate',name:'Serpent Gate',icon:'∞',desc:'The final gate. Something enormous circles beyond it.',hint:'Recover 3 relics and catch 2 legendary fish',bite:.88,rare:1.52,depth:320,target:'Crown Serpent',art:'gate',relicCount:3,legendCount:2}
 ]
];
const V10_LEGEND_SPOT={stormmarlin:[2,2],amberking:[1,2],mirrorwhale:[5,2],crownserpent:[6,2],coralphoenix:[3,2]};
const V10_CREW=[
 {id:'dockmaster',name:'Elias, Dockmaster',icon:'⚓',role:'Harbor Master',line:s=>s.story<2?'A captain is measured by the waters they dare to leave behind. Start charting the coves beyond our harbor.':'Your boat is becoming a ship. Hidden water matters as much as open water.'},
 {id:'biologist',name:'Dr. Mira Vale',icon:'◉',role:'Marine Biologist',line:s=>Object.keys(s.book||{}).length<18?'Watch the fish, not just the hook. Schools, weather, and time of day will tell you where the rare ones are.':'Your atlas is starting to describe an ecosystem, not a collection.'},
 {id:'collector',name:'Orin Bell',icon:'◇',role:'Antique Collector',line:s=>s.relics.length<3?'The relics are not random. Three pieces together describe a route the old charts deliberately erased.':'Three relics agree on one impossible coordinate. The Sunken Crown was real.'},
 {id:'shipwright',name:'Mara Flint',icon:'⌁',role:'Shipwright',line:s=>s.boat.level<5?'Deep water punishes weak hulls. Build for the voyage you want to survive.':'That hull can cross the abyss. What happens after you arrive is another question.'},
 {id:'cartographer',name:'The Cartographer',icon:'✧',role:'Unknown',line:s=>s.expedition.chartFragments<3?'Messages are drifting in from waters no modern chart admits exist. Bring me their fragments.':'Your fragments overlap. Follow the gaps in the map, not the lines.'}
];
const V10_VOYAGE_EVENTS=[
 {id:'dolphins',icon:'◡',name:'Dolphins Alongside',desc:'A pod escorts the boat through calm water.',apply:()=>{gainCaptainXP(12,'voyage');}},
 {id:'wreckage',icon:'▤',name:'Drifting Wreckage',desc:'Useful timber floats in the current.',apply:()=>{let n=Math.round(2*salvageYieldMultiplier());state.wood+=n;return '+'+n+' wood';}},
 {id:'message',icon:'✉',name:'Message in a Bottle',desc:'A salt-stained fragment marks unfamiliar water.',apply:()=>{state.expedition.chartFragments++;return '+1 chart fragment';}},
 {id:'migration',icon:'»',name:'Migrating School',desc:'Silver backs flash beneath the hull. Fishing improves briefly.',apply:()=>{state.expedition.bonusUntil=now()+180000;state.expedition.bonusType='migration';return '3 minute bite bonus';}},
 {id:'squall',icon:'ϟ',name:'Passing Squall',desc:'The crew rides out a sharp wall of rain without damage.',apply:()=>{gainCaptainXP(16,'storm voyage');return 'Captain XP gained';}},
 {id:'glow',icon:'✦',name:'Phosphorescent Wake',desc:'The wake glows blue and reveals a hidden current.',apply:()=>{state.expedition.chartFragments++;return '+1 chart fragment';}}
];
function ensureV10State(){
 ensureV9State();
 if(!state.expedition||typeof state.expedition!=='object')state.expedition={};
 let e=state.expedition;
 e.currentSpot=Object.assign({},e.currentSpot||{});e.discoveredSpots=Object.assign({},e.discoveredSpots||{});e.regionCatches=Object.assign({},e.regionCatches||{});e.legendaryClues=Object.assign({},e.legendaryClues||{});e.huntCatches=Object.assign({},e.huntCatches||{});e.crewSeen=Object.assign({},e.crewSeen||{});
 e.voyages=Math.max(0,Math.round(Number(e.voyages)||0));e.discoveries=Math.max(0,Math.round(Number(e.discoveries)||0));e.chartFragments=Math.max(0,Math.round(Number(e.chartFragments)||0));e.bonusUntil=Number(e.bonusUntil)||0;e.bonusType=e.bonusType||'';
 if(!Array.isArray(e.log))e.log=[];e.log=e.log.slice(-18);
 regions.forEach((r,i)=>{let a=Array.isArray(e.discoveredSpots[i])?e.discoveredSpots[i].map(Number).filter(n=>n>=0&&n<V10_SPOTS[i].length):[];if(i<=state.unlockedRegion&&!a.includes(0))a.unshift(0);e.discoveredSpots[i]=[...new Set(a)];let cur=Math.round(Number(e.currentSpot[i])||0);e.currentSpot[i]=a.includes(cur)?cur:0;e.regionCatches[i]=Math.max(0,Math.round(Number(e.regionCatches[i])||0));});
 Object.keys(legendaryDefs).forEach(id=>{e.legendaryClues[id]=clamp(Math.round(Number(e.legendaryClues[id])||0),0,3);e.huntCatches[id]=Math.max(0,Math.round(Number(e.huntCatches[id])||0));});
 return e;
}
function currentSpotIndex(region=state.region){ensureV10State();return state.expedition.currentSpot[region]||0}
function currentSpotDef(){return V10_SPOTS[state.region][currentSpotIndex()]||V10_SPOTS[state.region][0]}
function spotRequirementsMet(region,idx){let s=V10_SPOTS[region][idx],e=state.expedition;if(!s)return false;if(idx===0)return region<=state.unlockedRegion;if(s.threshold&&e.regionCatches[region]<(s.threshold||0))return false;if(s.relicCount&&state.relics.length<s.relicCount)return false;if(s.legendCount&&Object.keys(state.hunts.completed||{}).length<s.legendCount)return false;if(s.relicReveal&&!(e.regionCatches[region]>=s.threshold||state.relics.length>0))return false;return region<=state.unlockedRegion}
function spotDiscovered(region,idx){ensureV10State();return state.expedition.discoveredSpots[region].includes(idx)}
function discoverSpot(region,idx,quiet=false){ensureV10State();if(spotDiscovered(region,idx)||!spotRequirementsMet(region,idx))return false;state.expedition.discoveredSpots[region].push(idx);state.expedition.discoveries++;let s=V10_SPOTS[region][idx];state.expedition.log.push({t:now(),icon:s.icon,text:'Discovered '+s.name});gainCaptainXP(20+region*4,'new fishing ground');if(!quiet){haptic('treasure');tone(840,.08);setTimeout(()=>tone(1040,.1),80);showSystemNotice('New fishing ground · '+s.name)}return true}
function tryDiscoverSpot(region=state.region,fromChart=false){ensureV10State();for(let i=1;i<V10_SPOTS[region].length;i++){if(!spotDiscovered(region,i)&&spotRequirementsMet(region,i)){if(fromChart||Math.random()<.72)return discoverSpot(region,i)}}return false}
