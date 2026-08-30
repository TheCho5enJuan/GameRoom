'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const canvas=$('#game'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,TAU=Math.PI*2,waterY=150;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt=n=>{n=Math.floor(Number(n)||0);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(n>=1e4?0:1)+'K':String(n)};
const now=()=>Date.now();
function setupCanvasResolution(){let dpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));if(canvasDpr===dpr&&canvas.width===Math.round(W*dpr)&&canvas.height===Math.round(H*dpr))return;canvasDpr=dpr;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
const PREF_DEFAULTS=Object.freeze({sound:true,music:true,haptics:true,motion:true,volume:.55});
let audioCtx=null,audioMaster=null,audioFx=null,audioAmbient=null,audioMusic=null,audioRain=null,audioWind=null,audioReady=false,musicTimer=0,toastTimer=null,saveMode='export',canvasDpr=1;
function currentPrefs(){try{return state&&state.preferences?state.preferences:PREF_DEFAULTS}catch(_){return PREF_DEFAULTS}}
function haptic(kind='tap'){
 const p=currentPrefs();if(!p.haptics||!navigator.vibrate)return;
 const patterns={tap:8,select:12,cast:16,bite:[18,18,28],catch:[18,22,34],success:[14,18,14],treasure:[16,18,16,18,42],error:[40,28,45],sonar:[10,18,10,18,24]};
 try{navigator.vibrate(patterns[kind]||patterns.tap)}catch(_){}
}
function createNoiseBuffer(ctx,seconds=2,brown=false){let length=Math.max(1,Math.floor(ctx.sampleRate*seconds)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0),last=0;for(let i=0;i<length;i++){let white=Math.random()*2-1;if(brown){last=(last+.02*white)/1.02;data[i]=last*3.2}else data[i]=white}return buffer}
function smoothGain(node,value,seconds=.35){if(!node||!audioCtx)return;let t=audioCtx.currentTime;node.gain.cancelScheduledValues(t);node.gain.setTargetAtTime(Math.max(0,value),t,Math.max(.01,seconds/3))}
function ensureAudio(){
 try{
  if(!audioCtx){
   const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return false;audioCtx=new Ctx();
   audioMaster=audioCtx.createGain();audioFx=audioCtx.createGain();audioAmbient=audioCtx.createGain();audioMusic=audioCtx.createGain();audioRain=audioCtx.createGain();audioWind=audioCtx.createGain();
   audioFx.connect(audioMaster);audioAmbient.connect(audioMaster);audioMusic.connect(audioMaster);audioRain.connect(audioMaster);audioWind.connect(audioMaster);audioMaster.connect(audioCtx.destination);
   let ocean=audioCtx.createBufferSource(),oceanFilter=audioCtx.createBiquadFilter();ocean.buffer=createNoiseBuffer(audioCtx,3,true);ocean.loop=true;oceanFilter.type='lowpass';oceanFilter.frequency.value=720;oceanFilter.Q.value=.25;ocean.connect(oceanFilter);oceanFilter.connect(audioAmbient);ocean.start();
   let waveLfo=audioCtx.createOscillator(),waveDepth=audioCtx.createGain();waveLfo.frequency.value=.085;waveDepth.gain.value=.018;waveLfo.connect(waveDepth);waveDepth.connect(audioAmbient.gain);waveLfo.start();
   let rain=audioCtx.createBufferSource(),rainFilter=audioCtx.createBiquadFilter();rain.buffer=createNoiseBuffer(audioCtx,2,false);rain.loop=true;rainFilter.type='highpass';rainFilter.frequency.value=2100;rain.connect(rainFilter);rainFilter.connect(audioRain);rain.start();
   let wind=audioCtx.createBufferSource(),windFilter=audioCtx.createBiquadFilter();wind.buffer=createNoiseBuffer(audioCtx,3,true);wind.loop=true;windFilter.type='bandpass';windFilter.frequency.value=430;windFilter.Q.value=.65;wind.connect(windFilter);windFilter.connect(audioWind);wind.start();
   audioFx.gain.value=.42;audioAmbient.gain.value=0;audioMusic.gain.value=0;audioRain.gain.value=0;audioWind.gain.value=0;audioMaster.gain.value=0;audioReady=true;
  }
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  updateSoundscape(true);return true;
 }catch(error){console.warn('[Tide & Tranquility] Audio unavailable.',error);return false}
}
function playAmbientNote(){
 if(!audioReady||!audioCtx)return;let p=currentPrefs();if(!p.sound||!p.music||document.hidden)return;
 const scale=[220,246.94,293.66,329.63,392,440],base=pick(scale),t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();
 o.type=Math.random()<.6?'sine':'triangle';o.frequency.setValueAtTime(base,t);if(Math.random()<.28)o.frequency.exponentialRampToValueAtTime(base*1.003,t+3.5);filter.type='lowpass';filter.frequency.value=1200;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.035,t+.8);g.gain.exponentialRampToValueAtTime(.0001,t+4.8);o.connect(filter);filter.connect(g);g.connect(audioMusic);o.start(t);o.stop(t+5);
}
function scheduleMusic(){clearTimeout(musicTimer);let p=currentPrefs();if(!p.sound||!p.music||document.hidden)return;musicTimer=setTimeout(()=>{playAmbientNote();scheduleMusic()},4200+Math.random()*4200)}
function updateSoundscape(immediate=false){
 if(!audioReady||!audioCtx)return;let p=currentPrefs(),weather=typeof state!=='undefined'&&state.weather?state.weather.type:'clear',sea=$('#screen-sea')?.classList.contains('active'),tank=$('#screen-aquarium')?.classList.contains('active');
 smoothGain(audioMaster,p.sound?clamp(p.volume,0,1):0,immediate?.03:.35);smoothGain(audioAmbient,p.sound?(sea?.12:tank?.055:.035):0);smoothGain(audioRain,p.sound?(weather==='storm'?.075:weather==='rain'?.045:0):0);smoothGain(audioWind,p.sound?(weather==='storm'?.055:weather==='wind'?.035:0):0);smoothGain(audioMusic,p.sound&&p.music?.16:0);scheduleMusic();
}
function tone(f=440,d=.06,type='sine',level=.05){
 let p=currentPrefs();if(!p.sound||!ensureAudio()||!audioCtx||!audioFx)return;try{let t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(30,f),t);g.gain.setValueAtTime(Math.max(.0001,level),t);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.02,d));o.connect(g);g.connect(audioFx);o.start(t);o.stop(t+Math.max(.03,d)+.03)}catch(_){}
}
function noiseBurst(duration=.08,level=.04,highpass=250){if(!currentPrefs().sound||!ensureAudio()||!audioCtx||!audioFx)return;try{let t=audioCtx.currentTime,s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=createNoiseBuffer(audioCtx,Math.max(.12,duration),false);f.type='highpass';f.frequency.value=highpass;g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);g.connect(audioFx);s.start(t);s.stop(t+duration+.02)}catch(_){}
}
function splashSound(){noiseBurst(.12,.035,450);tone(240,.12,'sine',.025)}
function applyPreferences(){let p=currentPrefs();document.documentElement.classList.toggle('reduced-motion',!p.motion);let vol=$('#audioVolume');if(vol)vol.value=String(p.volume);updateSoundscape()}
function toast(s){let e=$('#toast');if(!e)return;e.textContent=s;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),1700)}

const rarity=[
 {n:'Common',m:1,c:'r0'},{n:'Uncommon',m:1.12,c:'r1'},{n:'Rare',m:1.28,c:'r2'},{n:'Epic',m:1.5,c:'r3'},{n:'Legendary',m:1.8,c:'r4'},{n:'Mythic',m:2.15,c:'r5'}
];
const regions=[
 {name:'Quiet Cove',sub:'Sheltered shallows',depth:230,story:0,boat:1,sky:['#f2bd7f','#7fa5b9'],water:['#4b91a2','#184b68'],weather:['clear','clear','mist','rain'],ruin:false,icon:'⌂'},
 {name:'Amber Shelf',sub:'Warm coastal shelf',depth:360,story:1,boat:2,sky:['#efae6b','#6f91aa'],water:['#477e97','#153f61'],weather:['clear','rain','wind','storm'],ruin:true,icon:'◒'},
 {name:'Bluewater Reach',sub:'Open ocean',depth:510,story:2,boat:3,sky:['#9bc5df','#5c79a8'],water:['#32779a','#123a68'],weather:['clear','wind','rain','storm'],ruin:false,icon:'≈'},
 {name:'Coral Labyrinth',sub:'Reefs and stone arches',depth:470,story:3,boat:3,sky:['#d39c8d','#688fa0'],water:['#3c8d93','#175562'],weather:['clear','clear','rain','mist'],ruin:true,icon:'✣'},
 {name:'Twilight Trench',sub:'Deep pelagic water',depth:700,story:4,boat:4,sky:['#6d6e92','#293b68'],water:['#285675','#0a294c'],weather:['mist','rain','storm','storm'],ruin:true,icon:'▽'},
 {name:'Moonfall Abyss',sub:'The far dark sea',depth:900,story:5,boat:5,sky:['#534c72','#151d3a'],water:['#203e61','#07192e'],weather:['mist','storm','storm','clear'],ruin:true,icon:'☾'},
 {name:'Sunken Crown',sub:'Ruins beyond the charts',depth:1100,story:7,boat:6,sky:['#463e66','#11172d'],water:['#1b3857','#041321'],weather:['storm','mist','storm','clear'],ruin:true,icon:'♜'}
];
const hulls=[
 {id:'skiff',name:'Cove Skiff',need:1,icon:'Skiff',speed:1,desc:'Light, quiet, responsive.'},
 {id:'cutter',name:'Amber Cutter',need:2,icon:'Cutter',speed:1.08,desc:'A wider hull for coastal water.'},
 {id:'sloop',name:'Bluewater Sloop',need:3,icon:'Sloop',speed:1.16,desc:'Tall sail and deep-water stability.'},
 {id:'research',name:'Reef Researcher',need:4,icon:'Research',speed:1.22,desc:'Sonar mast and larger working deck.'},
 {id:'trawler',name:'Abyss Trawler',need:5,icon:'Trawler',speed:1.3,desc:'Heavy hull built for storms.'},
 {id:'crown',name:'Crown Voyager',need:6,icon:'Voyager',speed:1.38,desc:'Endgame expedition vessel.'}
];
const paints=['#b76c44','#3f708a','#607348','#6e577d','#b6a06b','#a34d55','#d8d2c4'];
const lureDefs={
 none:{name:'No Lure',icon:'○',cost:0,attract:.9,tier:0,chest:0,depth:0,tag:'bare',target:'Anything nearby',prefer:[]},
 worm:{name:'Feather Fly',icon:'⌁',cost:35,attract:1.28,tier:1,chest:0,depth:0,tag:'surface',target:'Schooling fish',prefer:['school','curious']},
 minnow:{name:'Silver Minnow',icon:'›',cost:80,attract:1.48,tier:2,chest:0,depth:20,tag:'predator',target:'Predators',prefer:['hunter']},
 spinner:{name:'Sun Spinner',icon:'✦',cost:130,attract:1.62,tier:2,chest:.02,depth:0,tag:'flash',target:'Curious fish',prefer:['curious','school']},
 jig:{name:'Glow Jig',icon:'●',cost:210,attract:1.82,tier:3,chest:.03,depth:80,tag:'deep',target:'Deep-water fish',prefer:['deep']},
 squid:{name:'Abyss Squid',icon:'〰',cost:320,attract:2.05,tier:4,chest:.02,depth:40,tag:'scent',target:'Large predators',prefer:['hunter','deep']},
 magnet:{name:'Treasure Magnet',icon:'∪',cost:450,attract:.58,tier:1,chest:.20,depth:20,tag:'treasure',target:'Treasure',prefer:['treasure']}
};
const baitDefs={
 0:{name:'No Bait',icon:'—',bite:1,access:0,rare:1,target:'No bait bonus',desc:'Free casts. Fish rely on the lure alone.'},
 1:{name:'Shrimp',icon:'🦐',bite:1.35,access:0,rare:1.02,target:'Schooling & curious',desc:'Fast bites from common coastal fish.',prefer:['school','curious']},
 2:{name:'Cut Fish',icon:'🐟',bite:1.28,access:1,rare:1.04,target:'Predators',desc:'Scent draws hunters and aggressive fish.',prefer:['hunter']},
 3:{name:'Crab',icon:'🦀',bite:1.32,access:1,rare:1.08,target:'Bottom & heavy fish',desc:'Best for divers, tanks, and deeper bottom fish.',prefer:['bottom','diver','tank']},
 4:{name:'Squid',icon:'◆',bite:1.45,access:2,rare:1.12,target:'Deep predators',desc:'Strong scent for large fish in deep water.',prefer:['hunter','deep']},
 5:{name:'Rare Roe',icon:'◈',bite:1.25,access:3,rare:1.55,target:'Rare & trophy fish',desc:'Lower quantity, much better rare-fish odds.',prefer:['rare']}
};
const hookDefs={
 fine:{name:'Fine Hook',icon:'⌒',unlock:1,bite:1.28,maxTier:2,fight:1.08,sizeBias:.88,rare:1,target:'Small fish',desc:'More bites, best for Tier 1–2 fish.'},
 standard:{name:'Standard Hook',icon:'J',unlock:1,bite:1,maxTier:4,fight:1,sizeBias:1,rare:1,target:'Balanced',desc:'Reliable all-purpose hook.'},
 large:{name:'Trophy Hook',icon:'J+',unlock:2,bite:.9,maxTier:5,fight:.93,sizeBias:1.10,rare:1.16,target:'Large fish',desc:'Fewer taps, better odds on large and rare fish.'},
 heavy:{name:'Heavy Hook',icon:'⚓',unlock:4,bite:.78,maxTier:6,fight:.84,sizeBias:1.18,rare:1.3,target:'Legendary fish',desc:'Built for trophy and legendary catches.'}
};
function F(name,tier,value,size,speed,c,accent,min,max,temper,fight,regs){return{name,tier,value,size,speed,c,accent,min,max,temper,fight,regs}}
const fishDefs={
 silverfin:F('Silverfin',1,22,13,31,'#d7e8ee','#8ba8b8',35,125,'school','steady',[0,1]),
 sunperch:F('Sun Perch',1,28,14,25,'#f1b765','#d76d45',45,155,'curious','steady',[0,1,3]),
 bluegill:F('Blue Gill',1,34,15,27,'#7ec4d5','#326d87',60,180,'school','thrash',[0,1]),
 glassmackerel:F('Glass Mackerel',1,40,16,39,'#b4dad6','#497f84',80,230,'school','sprinter',[0,1,2]),
 sanddart:F('Sand Dart',1,45,15,42,'#d9c293','#866c4c',50,160,'shy','sprinter',[0,1,3]),
 lanternminnow:F('Lantern Minnow',1,52,12,28,'#b9e3c1','#4f8b6b',120,300,'curious','trickster',[1,3,4]),
 rockbass:F('Rock Bass',2,82,20,23,'#7e9e82','#394f41',110,290,'territorial','tank',[0,1,3]),
 reefsnapper:F('Reef Snapper',2,94,21,29,'#dc765f','#7a3135',100,300,'territorial','thrash',[1,3]),
 mooncarp:F('Moon Carp',2,105,22,21,'#b8acd2','#685c8e',140,340,'calm','steady',[1,3,4]),
 needlefish:F('Needlefish',2,112,21,45,'#a7d7cb','#3f7b72',70,250,'shy','sprinter',[1,2,3]),
 kelpcod:F('Kelp Cod',2,120,24,19,'#789477','#334c39',130,360,'calm','tank',[1,3]),
 coralwrasse:F('Coral Wrasse',2,128,19,34,'#ef8f9f','#7754a0',90,260,'curious','trickster',[3]),
 amberjack:F('Amber Jack',3,185,29,36,'#d8b55e','#6b6437',180,390,'hunter','surger',[1,2,3]),
 mahi:F('Emerald Mahi',3,205,30,42,'#59c5a6','#d8b34f',140,370,'hunter','sprinter',[2,3]),
 tuna:F('Bluefin Tuna',3,235,34,48,'#547c9d','#263e5e',220,500,'school','surger',[2,4]),
 barracuda:F('Pale Barracuda',3,245,33,52,'#a9c1b9','#566d68',160,420,'hunter','sprinter',[2,3,4]),
 seatrout:F('Storm Trout',3,215,27,40,'#7a9eae','#3a5667',160,380,'curious','thrash',[2,4]),
 fanray:F('Fan Ray',3,250,38,24,'#807aa0','#4d476e',190,430,'calm','diver',[3,4]),
 swordfish:F('Duskspear',4,390,44,54,'#7796b4','#334c69',260,610,'hunter','sprinter',[2,4,5]),
 reefshark:F('Reef Shark',4,430,48,39,'#6f8490','#394b55',200,520,'hunter','surger',[2,3]),
 manta:F('Velvet Manta',4,455,52,25,'#505c7d','#282f4e',280,650,'calm','diver',[4,5]),
 oarfish:F('Ribbon Oarfish',4,470,55,31,'#c7c4d9','#a55d6e',350,760,'shy','trickster',[4,5]),
 wolfeel:F('Wolf Eel',4,405,42,29,'#6f6b74','#36313a',300,680,'territorial','thrash',[4,5]),
 crystalray:F('Crystal Ray',4,500,50,26,'#9fd7d8','#6c79a6',320,690,'curious','diver',[3,5]),
 giantsquid:F('Giant Squid',5,760,62,32,'#9a536d','#4a2439',420,850,'hunter','thrash',[4,5,6]),
 glasswhale:F('Glass Whale',5,900,74,18,'#7798ac','#becfd6',380,820,'calm','tank',[5]),
 abyssshark:F('Abyss Shark',5,840,64,42,'#3f4c5a','#202a35',440,900,'hunter','surger',[5,6]),
 crownray:F('Crown Ray',5,930,68,23,'#735f9a','#d0b75f',500,980,'calm','diver',[6]),
 voidgrouper:F('Void Grouper',5,790,58,17,'#4b3d62','#1f1b2c',460,920,'territorial','tank',[5,6]),
 starangler:F('Star Angler',5,880,49,26,'#3f6076','#f0d979',560,1050,'curious','trickster',[6]),
 redgoby:F('Red Goby',1,38,13,33,'#d8675f','#74302f',55,160,'shy','thrash',[3]),
 tealrunner:F('Teal Runner',2,135,22,43,'#5eb8ac','#286a66',120,310,'school','sprinter',[2,3]),
 duskflounder:F('Dusk Flounder',2,145,24,17,'#7f7163','#433b36',160,360,'calm','tank',[1,3]),
 sailfin:F('Sailfin',3,230,31,38,'#6b9cc0','#d68d51',150,390,'curious','surger',[2,3]),
 blackdrum:F('Black Drum',3,255,36,20,'#5d6870','#2c3339',190,470,'territorial','tank',[1,3]),
 icebelly:F('Icebelly',3,270,29,31,'#d0e8ef','#7696a5',240,520,'shy','diver',[4]),
 cometfish:F('Cometfish',4,510,39,55,'#a5a7df','#f0ca66',300,640,'school','sprinter',[4,5]),
 ruinray:F('Ruin Ray',4,525,50,22,'#697b73','#d4ad68',330,720,'calm','diver',[3,6]),
 ghostcod:F('Ghost Cod',4,545,43,19,'#bcc7c8','#6b7a7e',410,820,'shy','trickster',[4,5]),
 trenchling:F('Trenchling',5,980,57,36,'#493a55','#d98182',620,1080,'hunter','surger',[6]),
 crownsnapper:F('Crown Snapper',5,1040,55,30,'#b38758','#6c3d42',580,1060,'territorial','thrash',[6]),
 moonjellyfish:F('Moon Jellyfish',2,150,25,16,'#a8c8e4','#9a7db6',130,360,'calm','steady',[1,3,4]),
 sapphirekoi:F('Sapphire Koi',3,290,28,24,'#4f93bd','#e7bf75',100,320,'curious','trickster',[0,3]),
 copperray:F('Copper Ray',3,300,37,22,'#b1795f','#5a4143',160,410,'calm','diver',[1,3]),
 nightmarlin:F('Night Marlin',5,1150,68,58,'#314c79','#d1cb9b',430,930,'hunter','sprinter',[5,6]),
 pearlmaw:F('Pearl Maw',5,1200,61,25,'#818a9e','#e3d7bc',550,1070,'territorial','tank',[6]),
 aurorafish:F('Aurora Fish',4,610,41,37,'#7fc7c4','#d784b4',270,680,'curious','trickster',[3,5]),
 ironbelly:F('Ironbelly',4,590,49,18,'#737c7e','#30383b',350,760,'territorial','tank',[4,6])
};
const legendaryDefs={
 stormmarlin:{...F('Storm Marlin',5,2200,78,64,'#4d6d9f','#f0d071',300,760,'hunter','sprinter',[2]),legend:true,region:2,desc:'Appears when open water turns violent.'},
 amberking:{...F('Amber King',5,2400,72,32,'#ca9a4f','#713d2e',220,520,'territorial','tank',[1]),legend:true,region:1,desc:'An ancient reef monarch hidden beneath storms.'},
 mirrorwhale:{...F('Mirror Whale',5,3000,90,19,'#9db8c4','#e5e3d0',450,900,'calm','diver',[5]),legend:true,region:5,desc:'A silent giant visible only in dark water.'},
 crownserpent:{...F('Crown Serpent',5,3600,84,41,'#594a74','#d8b867',620,1080,'hunter','trickster',[6]),legend:true,region:6,desc:'Guardian of the Sunken Crown.'},
 coralphoenix:{...F('Coral Phoenix',5,2800,70,48,'#e48574','#5fc0ad',250,620,'curious','surger',[3]),legend:true,region:3,desc:'A radiant fish said to regenerate broken reefs.'}
};
const allDefs=()=>Object.assign({},fishDefs,legendaryDefs);
const relicDefs=[
 {id:'bell',name:'Tide Bell',region:1,icon:'◖',desc:'A bronze bell from a drowned harbor.'},
 {id:'compass',name:'Broken Star Compass',region:3,icon:'✧',desc:'Its needle points below the sea floor.'},
 {id:'mask',name:'Abyss Mask',region:4,icon:'◉',desc:'Stone eyes polished by centuries of current.'},
 {id:'crown',name:'Pearl Crown Fragment',region:6,icon:'♜',desc:'Part of a ceremonial crown from the final ruins.'},
 {id:'tablet',name:'Moon Tablet',region:5,icon:'▤',desc:'Carved with a map of vanished islands.'}
];
const storyDefs=[
 {title:'A Quiet Beginning',text:'The old dockmaster asks you to prove that the cove still has life.',goal:'Catch your first fish.',reward:'150 G',ok:s=>s.catches>=1,gold:150},
 {title:'The Amber Chart',text:'A weathered chart marks a shelf beyond the harbor.',goal:'Catch 6 fish and upgrade the boat to Lv. 2.',reward:'Unlock Amber Shelf + 300 G',ok:s=>s.catches>=6&&s.boat.level>=2,gold:300,unlock:1},
 {title:'Signals Offshore',text:'Your sonar records a repeating pulse from open blue water.',goal:'Discover 10 species.',reward:'Unlock Bluewater Reach + 1 Pearl',ok:s=>Object.keys(s.book).length>=10,gold:400,pearls:1,unlock:2},
 {title:'The Coral Gate',text:'A reef path appears on the chart after the tide turns.',goal:'Recover any relic.',reward:'Unlock Coral Labyrinth + 500 G',ok:s=>s.relics.length>=1,gold:500,unlock:3},
 {title:'Storm Signature',text:'A giant silhouette moves beneath every thunderhead.',goal:'Complete any legendary hunt.',reward:'Unlock Twilight Trench + 2 Pearls',ok:s=>Object.keys(s.hunts.completed).length>=1,pearls:2,unlock:4},
 {title:'Moon Below',text:'The recovered relics describe a city under the abyss.',goal:'Discover 25 species and reach Boat Lv. 5.',reward:'Unlock Moonfall Abyss + 800 G',ok:s=>Object.keys(s.book).length>=25&&s.boat.level>=5,gold:800,unlock:5},
 {title:'The Lost Dynasty',text:'Three relics together reveal the coordinates of the final ruin.',goal:'Recover 3 unique relics.',reward:'3 Pearls + Mythic reforge material',ok:s=>s.relics.length>=3,pearls:3,coral:8},
 {title:'The Sunken Crown',text:'Only a true expedition vessel can reach the last kingdom.',goal:'Boat Lv. 6 and at least 2 legendary catches.',reward:'Unlock Sunken Crown',ok:s=>s.boat.level>=6&&Object.keys(s.hunts.completed).length>=2,unlock:6,gold:1200},
 {title:'Keeper of the Deep',text:'The sea chart is complete. What remains is yours to discover.',goal:'Catch the Crown Serpent.',reward:'5 Pearls + permanent 10% aquarium bonus',ok:s=>!!s.hunts.completed.crownserpent,pearls:5,final:true}
];
const themes={reef:{name:'Sunlit Reef',cls:'theme-reef'},moon:{name:'Moonlight Tank',cls:'theme-moon'},kelp:{name:'Kelp Garden',cls:'theme-kelp'},ruins:{name:'Ancient Ruins',cls:'theme-ruins'}};

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

function fishSvg(id,gene){let f=allDefs()[id]||fishDefs.silverfin,g=gene||{hue:0},extra='';if(id.includes('squid')||id==='giantsquid')extra='<path d="M40 49q-12 16-4 24M52 50q-4 17 4 25M64 50q6 14 12 21" fill="none" stroke="'+f.accent+'" stroke-width="4" stroke-linecap="round"/>';if(id.includes('ray')||id==='manta')extra+='<path d="M38 40Q72 5 108 40Q75 70 38 40Z" fill="'+f.c+'" opacity=".75"/>';if(id.includes('shark'))extra+='<path d="M73 18L87 0L91 22Z" fill="'+f.accent+'"/>';if(id.includes('marlin')||id==='swordfish')extra+='<path d="M108 39L139 34L108 43Z" fill="#dce6eb"/>';let hue=g.hue||0;return `<svg viewBox="0 0 140 80" aria-label="${f.name}" style="filter:hue-rotate(${hue}deg)"><ellipse cx="72" cy="40" rx="${Math.min(46,34+f.size*.12)}" ry="${Math.min(24,15+f.size*.1)}" fill="${f.c}"/><path d="M39 40L9 15L15 40L9 65Z" fill="${f.accent}"/><path d="M77 20L95 7L91 26Z" fill="${f.accent}"/><circle cx="99" cy="34" r="3.6" fill="#101720"/><circle cx="100" cy="33" r="1" fill="white"/>${extra}</svg>`}
function boatMiniSvg(hull,color){let scale={skiff:0,cutter:4,sloop:7,research:9,trawler:12,crown:15}[hull]||0;return `<svg viewBox="0 0 120 65"><path d="M10 40h${78+scale}l-${15+scale*.2} 15H27z" fill="${color}"/><path d="M49 10v31" stroke="#d8c9aa" stroke-width="4"/>${hull==='research'||hull==='trawler'||hull==='crown'?'<rect x="55" y="23" width="24" height="17" rx="3" fill="#d9e6e8"/><rect x="60" y="27" width="7" height="6" fill="#5a8195"/>':'<path d="M52 12l30 18H52z" fill="#eee4cf"/>'}</svg>`}
function gearIcon(slot){if(slot==='rod')return '╱';if(slot==='line')return '◌';if(slot==='reel')return '⊙';return '⌁'}

let fish=[],specials=[],particles=[],floaters=[],animT=0,lastFrame=performance.now(),spawnTimer=0,weatherFx=[],catchPending=null,specialPending=null;
let hook={mode:'idle',x:125,y:waterY-12,vx:0,vy:0,targetX:220,power:0,fish:null,tension:0,stamina:0,maxStamina:0,reeling:false,lure:'none',carry:null,fightTimer:0,burstTimer:0,burstText:'',pullX:0,pullY:0};
let powering=false,powerDir=1,sonar=false,screenShake=0;
function hookUnlocked(id){let h=hookDefs[id];return !!h&&rodTier()>=h.unlock}
function activeHookDef(){let id=hookDefs[state.selectedHook]?state.selectedHook:'standard';return hookDefs[id]}
function activeBaitDef(){return baitDefs[state.selectedBait||0]||baitDefs[0]}
function fishDepthProfile(f){if(f.min>=180||f.max>=500)return'deep';if(f.fight==='diver'||f.fight==='tank')return'bottom';return'shallow'}
function lureAffinity(l,f){if(!l||l.tag==='bare')return 1;if(l.tag==='treasure')return .42;let score=1;if((l.prefer||[]).includes(f.temper))score*=1.55;if((l.prefer||[]).includes('deep')&&fishDepthProfile(f)==='deep')score*=1.48;if(l.tag==='surface'&&fishDepthProfile(f)==='deep')score*=.72;if(l.tag==='predator'&&f.temper!=='hunter')score*=.78;return score}
function baitAffinity(b,f){if(!b||!b.prefer||!b.prefer.length)return 1;let score=1;if(b.prefer.includes(f.temper))score*=1.6;if(b.prefer.includes(f.fight))score*=1.45;if(b.prefer.includes('deep')&&fishDepthProfile(f)==='deep')score*=1.45;if(b.prefer.includes('bottom')&&fishDepthProfile(f)==='bottom')score*=1.4;if(b.prefer.includes('rare')&&f.tier>=3)score*=1.55;return score}
function hookAffinity(h,f,hookId=state.selectedHook){if(!h)return 1;if(hookId==='fine')return f.tier<=2?1.35:.35;if(hookId==='large')return f.tier>=3?1.38:.78;if(hookId==='heavy')return f.tier>=4?1.55:.62;return 1}
function tackleAccessTier(){let l=lureDefs[state.selectedLure]||lureDefs.none,b=activeBaitDef(),h=activeHookDef();let presentation=Math.max(2,l.tier+2+(b.access||0),(state.selectedBait||0)+(b.access||0));return Math.max(1,Math.min(6,rodTier()+1,h.maxTier,presentation))}
function tackleMetrics(){let l=lureDefs[state.selectedLure]||lureDefs.none,b=activeBaitDef(),h=activeHookDef(),weather=state.weather.type==='rain'?1.18:state.weather.type==='storm'?1.08:1,c=oceanCycle(),ev=activeOceanEvent(),moment=c.twilight?1.12:c.night?.96:1,eventBite=ev?ev.bite:1;let bite=l.attract*b.bite*h.bite*weather*moment*eventBite;let biteLabel=bite>=2.3?'Excellent':bite>=1.65?'High':bite>=1.1?'Good':'Low';let target=l.target;if(state.selectedBait&&b.target!=='No bait bonus')target=l.tag==='bare'?b.target:(l.target+' + '+b.target);if(state.selectedHook==='heavy')target='Trophy / legendary';let treasure=Math.round((l.chest||0)*100),rareMulti=(b.rare||1)*(h.rare||1)*(ev?ev.rare:1)*chartLuckMultiplier(),rare=Math.max(0,Math.round((rareMulti-1)*100));return{l,b,h,bite,biteLabel,target,maxTier:tackleAccessTier(),treasure,rare}}
function depthToY(d){return waterY+(d/currentRegion().depth)*(H-waterY-22)}
function yToDepth(y){return clamp((y-waterY)/(H-waterY-22)*currentRegion().depth,0,currentRegion().depth)}

const OCEAN_DAY_MS=12*60*1000;
let oceanRuntime={phase:.32,tide:0,current:0,event:null,eventUntil:0,nextEvent:performance.now()+rand(9000,16000),eventX:W*.65,eventDepth:120,cinema:0,lastHud:0,gestureX:0,gestureY:0,gestureAt:0,ambientUntil:0,ambientKind:null,schoolSerial:1};
function ensureWorldState(){if(!state.world)state.world={cycleStart:now()-OCEAN_DAY_MS*.3,eventsSeen:0,messagesFound:0,debrisFound:0,chartLuckUntil:0};if(!Number.isFinite(state.world.cycleStart))state.world.cycleStart=now()-OCEAN_DAY_MS*.3;return state.world}
function oceanCycle(){let w=ensureWorldState(),phase=(((now()-w.cycleStart)%OCEAN_DAY_MS)+OCEAN_DAY_MS)%OCEAN_DAY_MS/OCEAN_DAY_MS;let label='DAY',short='DAY',light=1;if(phase<.16){label='Night';short='NIGHT';light=.18}else if(phase<.25){label='Dawn';short='DAWN';light=.55+(phase-.16)/.09*.45}else if(phase<.62){label='Day';short='DAY';light=1}else if(phase<.73){label='Golden Hour';short='GOLDEN';light=.94}else if(phase<.82){label='Dusk';short='DUSK';light=.5}else{label='Night';short='NIGHT';light=.18}return{phase,label,short,light,night:phase<.16||phase>=.82,twilight:(phase>=.16&&phase<.25)||(phase>=.73&&phase<.82)}}
function oceanCondition(){let c=oceanCycle(),tide=Math.sin(c.phase*TAU*2+state.region*.73),weather=state.weather.type,weatherPush=weather==='storm'?1.8:weather==='wind'?1.45:weather==='rain'?1.15:1,base=2.1+state.region*.85,current=Math.sin(c.phase*TAU*2.6+state.region*1.12)*base*weatherPush;oceanRuntime.phase=c.phase;oceanRuntime.tide=tide;oceanRuntime.current=current;return{...c,tide,current}}
function currentLabel(v){let a=Math.abs(v);if(a<1.4)return'CALM';return(a<4?'GENTLE ':a<7?'STEADY ':'STRONG ')+(v>0?'→':'←')}
function eventDefinition(type){return{
 frenzy:{name:'FEEDING FRENZY',bite:1.55,rare:1.15,desc:'Birds mark a bait ball. Work your lure through it.'},
 migration:{name:'MIGRATION',bite:1.28,rare:1.28,desc:'A large school is crossing this water.'},
 bloom:{name:'NIGHT BLOOM',bite:1.22,rare:1.38,desc:'Bioluminescent plankton draws deep-water fish.'},
 glass:{name:'GLASS WATER',bite:1.16,rare:1.08,desc:'A quiet window makes subtle bites easier to read.'}
}[type]||{name:'OPEN WATER',bite:1,rare:1,desc:'The ocean is settled.'}}
function activeOceanEvent(){if(!oceanRuntime.event||performance.now()>oceanRuntime.eventUntil)return null;return eventDefinition(oceanRuntime.event)}
function startOceanEvent(type){oceanRuntime.event=type;oceanRuntime.eventUntil=performance.now()+rand(26000,42000);oceanRuntime.eventX=rand(W*.34,W*.82);oceanRuntime.eventDepth=type==='bloom'?rand(currentRegion().depth*.48,currentRegion().depth*.8):rand(55,Math.min(currentRegion().depth*.55,260));oceanRuntime.nextEvent=oceanRuntime.eventUntil+rand(35000,65000);ensureWorldState().eventsSeen++;if(type==='frenzy'){for(let i=0;i<5;i++)spawnFish(false,{x:oceanRuntime.eventX+rand(-55,55),depth:oceanRuntime.eventDepth+rand(-24,24),school:'frenzy'})}else if(type==='migration'){for(let i=0;i<4;i++)spawnFish(i===3,{x:rand(-30,40),depth:oceanRuntime.eventDepth+rand(-45,45),school:'migration'})}else if(type==='bloom'){for(let i=0;i<3;i++)spawnFish(true,{depth:oceanRuntime.eventDepth+rand(-60,60),school:'bloom'})}let e=eventDefinition(type);toast(e.name+': '+e.desc);tone(type==='bloom'?520:640,.06,'sine',.018);renderOceanHud(true)}
function updateOceanEvents(dt){let c=oceanCondition(),t=performance.now();if(oceanRuntime.event&&t>oceanRuntime.eventUntil)oceanRuntime.event=null;if(!oceanRuntime.event&&t>oceanRuntime.nextEvent){let type=c.night&&state.region>=3?'bloom':state.weather.type==='clear'&&Math.random()<.22?'glass':Math.random()<.55?'frenzy':'migration';startOceanEvent(type)}if(!oceanRuntime.ambientKind&&Math.random()<dt*.014){oceanRuntime.ambientKind=c.night?'glow':'dolphin';oceanRuntime.ambientUntil=t+rand(3500,6500)}if(oceanRuntime.ambientKind&&t>oceanRuntime.ambientUntil)oceanRuntime.ambientKind=null;if(oceanRuntime.cinema>0)oceanRuntime.cinema=Math.max(0,oceanRuntime.cinema-dt*.11);if(hook.actionEnergy)hook.actionEnergy=Math.max(0,hook.actionEnergy-dt*.34);renderOceanHud()}
function renderOceanHud(force=false){let t=performance.now();if(!force&&t-oceanRuntime.lastHud<220)return;oceanRuntime.lastHud=t;let c=oceanCondition(),ev=activeOceanEvent(),time=$('#oceanTime'),cur=$('#oceanCurrent'),event=$('#oceanEvent'),act=$('#lureActionChip');if(time)time.textContent=c.short;if(cur)cur.textContent=currentLabel(c.current);if(event){event.textContent=ev?ev.name:(state.weather.type==='storm'?'STORM FEEDING':c.twilight?'TWILIGHT BITE':'OPEN WATER');event.classList.toggle('live',!!ev||state.weather.type==='storm')}if(act){let sinking=hook.mode==='sinking';let energy=hook.actionEnergy||0;act.classList.toggle('show',sinking);act.classList.toggle('hot',sinking&&energy>.45);act.textContent=sinking?((hook.action||'STILL')+(energy>.45?' · ACTIVE':' · GENTLE')):'LURE STILL'}}
function fishActivityMultiplier(id,f){let c=oceanCycle(),deep=fishDepthProfile(f)==='deep',nightNamed=/moon|night|ghost|star|abyss|lantern/i.test(id+f.name);let m=1;if(c.twilight)m*=1.24;if(c.night){m*=deep?1.38:.78;if(nightNamed)m*=1.48}else if(nightNamed)m*=.82;return m}
function eventFishMultiplier(f){let ev=activeOceanEvent();if(!ev)return 1;if(oceanRuntime.event==='frenzy')return f.temper==='school'||f.temper==='hunter'?1.48:1.06;if(oceanRuntime.event==='migration')return f.temper==='school'?1.55:f.tier>=3?1.16:1;if(oceanRuntime.event==='bloom')return fishDepthProfile(f)==='deep'?1.62:1;if(oceanRuntime.event==='glass')return f.temper==='shy'||f.temper==='calm'?1.32:1.08;return 1}
function lureActionMultiplier(l){let e=hook.actionEnergy||0,a=hook.action||'STILL';if(!e)return(l.tag==='scent'||l.tag==='treasure')?1.1:.92;if(l.tag==='deep')return a==='JIG'?1+e*.55:1+e*.12;if(l.tag==='predator')return a==='SWEEP'?1+e*.48:1+e*.2;if(l.tag==='flash')return(a==='SWEEP'||a==='TWITCH')?1+e*.5:1+e*.12;if(l.tag==='surface')return a==='TWITCH'?1+e*.55:1+e*.18;if(l.tag==='scent')return 1+Math.min(.18,e*.12);return 1+e*.08}
function chartLuckMultiplier(){return now()<(ensureWorldState().chartLuckUntil||0)?1.28:1}
function castBaitDef(){return baitDefs[hook.bait||0]||baitDefs[0]}
function castHookId(){return hook.hookType&&hookDefs[hook.hookType]?hook.hookType:state.selectedHook}
function castHookDef(){return hookDefs[castHookId()]||hookDefs.standard}
function castLineDepth(){let l=lureDefs[hook.lure]||lureDefs[state.selectedLure]||lureDefs.none;return Math.round(230+(gearStat('line')-1)*62+(l.depth||0))}

function resetHook(){hook={mode:'idle',x:125,y:waterY-16,vx:0,vy:0,targetX:240,power:0,fish:null,tension:0,stamina:0,maxStamina:0,reeling:false,lure:'none',bait:0,hookType:state.selectedHook,carry:null,fightTimer:0,burstTimer:0,burstText:'',pullX:0,pullY:0,action:'STILL',actionEnergy:0,jigImpulse:0};powering=false;$('#oceanHud')?.classList.remove('fighting');$('#tension').classList.remove('show');$('#castBtn').textContent='CAST';$('#castBtn').classList.remove('warn');$('#seaHint').textContent='Tap water to aim. Hold CAST, release to throw.';renderOceanHud(true)}
function chooseFishId(forceRare=false){let pool=Object.entries(fishDefs).filter(([id,f])=>f.regs.includes(state.region)&&f.min<currentRegion().depth);let w=state.weather.type,active=state.hunts.active,leg=null,ev=activeOceanEvent(),rareBoost=(activeBaitDef().rare||1)*(activeHookDef().rare||1)*chartLuckMultiplier()*(ev?ev.rare:1)*captainRareBonus()*rodBuildBonuses().rare*boatFishingBonuses().rare;if(active&&legendaryDefs[active]&&legendaryDefs[active].region===state.region){let chance=(w==='storm'?.075:.032)*(state.selectedHook==='heavy'?1.55:state.selectedHook==='large'?1.25:.5)*rareBoost;if(Math.random()<chance)leg=active}if(leg)return leg;let total=0,arr=pool.map(([id,f])=>{let weight=Math.max(.08,7-f.tier*1.2)*fishActivityMultiplier(id,f)*eventFishMultiplier(f);if(forceRare)weight*=f.tier>=3?3.2:.32;if(f.tier>=4)weight*=rareBoost;if(w==='storm'&&f.tier>=4)weight*=1.75;if(w==='rain'&&f.temper==='curious')weight*=1.4;total+=weight;return{id,f,weight}});let r=Math.random()*Math.max(.01,total);for(const q of arr){r-=q.weight;if(r<=0)return q.id}return arr[0]?arr[0].id:'silverfin'}
function spawnFish(forceRare=false,opts={}){if(fish.length>30)return;let id=opts.id||chooseFishId(forceRare),f=allDefs()[id];if(!f)return;let maxD=Math.max(Math.max(35,f.min+8),Math.min(currentRegion().depth-20,f.max)),d=opts.depth!=null?clamp(opts.depth,28,currentRegion().depth-20):rand(Math.max(25,f.min),maxD),fromLeft=opts.x==null?Math.random()<.5:opts.x<W*.5,school=opts.school||((f.temper==='school')?'s'+(oceanRuntime.schoolSerial++%5):'solo'+Math.random());let q={id,x:opts.x!=null?opts.x:(fromLeft?-55:W+55),y:depthToY(d),vx:(fromLeft?1:-1)*f.speed*rand(.72,1.12),vy:rand(-4,4),dir:fromLeft?1:-1,state:'cruise',think:rand(.8,2.6),appetite:rand(.45,1),sonarUntil:0,school,hooked:false,burst:0,turn:0};fish.push(q);if(!opts.noGroup&&f.temper==='school'&&fish.length<27&&Math.random()<.16){let n=1+Math.floor(Math.random()*2);for(let i=0;i<n;i++)spawnFish(false,{id,x:q.x+rand(-45,45),depth:d+rand(-18,18),school,noGroup:true})}}
function maybeSpawnSpecial(){if(specials.length>4)return;let lure=lureDefs[state.selectedLure]||lureDefs.none,ch=.009+(lure.chest||0),luck=chartLuckMultiplier()*captainExplorerBonus()*boatFishingBonuses().special;if(Math.random()<ch*luck)specials.push({type:'chest',x:rand(70,W-50),y:depthToY(rand(90,Math.min(currentRegion().depth-30,lineDepth()))),bob:rand(0,TAU)});if(Math.random()<.0045&&!specials.some(s=>s.type==='bottle'))specials.push({type:'bottle',x:rand(70,W-50),y:depthToY(rand(30,Math.min(170,currentRegion().depth*.55))),bob:rand(0,TAU)});if(Math.random()<.006&&!specials.some(s=>s.type==='debris'))specials.push({type:'debris',x:rand(65,W-45),y:depthToY(rand(35,Math.min(210,currentRegion().depth*.65))),bob:rand(0,TAU)});if(currentRegion().ruin&&sonar&&Math.random()<.12){let relic=relicDefs.find(r=>r.region===state.region&&!state.relics.includes(r.id));if(relic&&!specials.some(s=>s.type==='relic'))specials.push({type:'relic',id:relic.id,x:rand(100,W-70),y:depthToY(rand(currentRegion().depth*.58,currentRegion().depth*.88)),bob:rand(0,TAU)})}}
