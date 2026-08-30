/* Tide regions, boats, tackle, fish, relics, and stories */
'use strict';
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
