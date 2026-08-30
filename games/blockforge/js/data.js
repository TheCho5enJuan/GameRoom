/* Blockforge zones, pets, upgrades, modifiers, achievements, and defaults */
'use strict';
const ZONES=[
{name:'Dirtworks',baseHp:12,coin:2,c1:'#9b6c43',c2:'#6f492f',glow:'#d9a56f'},
{name:'Stonefall',baseHp:46,coin:5,c1:'#7f8895',c2:'#505966',glow:'#bbc4d1'},
{name:'Coal Vein',baseHp:145,coin:11,c1:'#454b55',c2:'#242831',glow:'#7b8595'},
{name:'Iron Depths',baseHp:410,coin:24,c1:'#965f4b',c2:'#5a3b32',glow:'#d28a6f'},
{name:'Gold Rift',baseHp:1150,coin:54,c1:'#c89b2c',c2:'#7c5c16',glow:'#ffe179'},
{name:'Crystal Cavern',baseHp:3200,coin:125,c1:'#8365d8',c2:'#4e3b87',glow:'#bba4ff'},
{name:'Obsidian Vault',baseHp:9000,coin:280,c1:'#40324e',c2:'#21192a',glow:'#a470df'},
{name:'Magma Core',baseHp:26000,coin:650,c1:'#a33e2e',c2:'#5c211b',glow:'#ff8a62'},
{name:'Void Quarry',baseHp:76000,coin:1500,c1:'#20356f',c2:'#111c42',glow:'#5f8cff'},
{name:'Starstone',baseHp:220000,coin:3500,c1:'#2e7e7e',c2:'#164344',glow:'#7cf2e8'}
];
const PETS=[
{id:'mole',name:'Pebble Mole',emoji:'🐹',cost:0,passive:'+10% mining damage',effect:'damage',value:.10,active:'Tunnel Fever',cooldown:24,desc:'Quiet, stubborn, and deeply judgmental about inefficient digging.',lines:{hello:['Back to work.','That wall looks suspicious.','I smelled ore.'],happy:['Good hit.','Acceptable mining.','Now do it again.'],ability:['Try to keep up.','Tunnel fever!'],chest:['I knew that was there.','Treasure. Mine. Obviously.'],hurt:['Rude wall.','I dislike that boss.']}},
{id:'bot',name:'Coin Bot',emoji:'🤖',cost:18,passive:'+25% coin income',effect:'coins',value:.25,active:'Profit Protocol',cooldown:28,desc:'A cheerful accountant with absolutely no concept of enough money.',lines:{hello:['PROFIT MODE: ONLINE.','Coins detected.'],happy:['Revenue increased!','Excellent quarterly mining.'],ability:['PROFIT PROTOCOL!','Compounding enthusiasm!'],chest:['ASSET ACQUIRED.','Treasure converted to joy.'],hurt:['Unexpected expense!']}},
{id:'wisp',name:'Ember Wisp',emoji:'🔥',cost:45,passive:'Auto-burn every 4 seconds',effect:'blast',value:4,active:'Inferno',cooldown:30,desc:'Tiny, dramatic, and convinced every problem can be solved with more fire.',lines:{hello:['Can I burn it?','I vote fire.'],happy:['MORE FIRE.','That exploded nicely.'],ability:['INFERNO!','Finally!'],chest:['Shiny. Flammable?'],hurt:['I will remember this.']}},
{id:'fox',name:'Crystal Fox',emoji:'🦊',cost:85,passive:'+12% critical chance',effect:'crit',value:.12,active:'Weakpoint Hunt',cooldown:26,desc:'Clever, competitive, and always trying to find the exact weakest spot.',lines:{hello:['Watch the seams.','There is always a weak point.'],happy:['Precisely.','Clean strike.'],ability:['I see everything.','Weak points marked.'],chest:['Told you to look closer.'],hurt:['Cheap shot.']}},
{id:'slime',name:'Lucky Slime',emoji:'🟢',cost:130,passive:'Combo decays 35% slower',effect:'combo',value:.35,active:'Sticky Streak',cooldown:32,desc:'An optimistic blob that celebrates literally every block you break.',lines:{hello:['Bloop!','Best mine ever!'],happy:['BLOOP BLOOP!','We are amazing!'],ability:['STICKY TIME!'],chest:['SHINY BLOOP!'],hurt:['...sad bloop.']}},
{id:'golem',name:'Pocket Golem',emoji:'🗿',cost:190,passive:'+8% damage and boss damage',effect:'golem',value:.08,active:'Ground Pound',cooldown:34,desc:'Mostly silent. Occasionally says one word. Usually that word is “smash.”',lines:{hello:['Mine.','Smash.'],happy:['Good.','Again.'],ability:['SMASH.'],chest:['Keep.'],hurt:['Angry.']}}
];
const UPGRADE_DEFS=[
{id:'damage',name:'Pickaxe Power',desc:'Raises damage on every orbit hit and power swing.',base:20,scale:1.52,max:999},
{id:'count',name:'Extra Pickaxe',desc:'Adds another orbiting pickaxe. More steel, more chaos.',base:160,scale:2.18,max:12},
{id:'speed',name:'Orbit Speed',desc:'Makes every pickaxe rotate faster around you.',base:75,scale:1.68,max:30},
{id:'radius',name:'Mining Reach',desc:'Increases orbit radius so you can carve wider paths.',base:95,scale:1.72,max:18},
{id:'crit',name:'Critical Edge',desc:'Raises the chance for a 3× critical hit.',base:130,scale:1.78,max:25},
{id:'coins',name:'Lucky Pockets',desc:'Raises coins earned from every block you destroy.',base:110,scale:1.66,max:40}
];
const DEV_UPGRADE_MAX={damage:999999,count:9999998,speed:999999,radius:999999,crit:999999,coins:999999};
const DEV_MASTERY_MAX=999999;
const MAX_PICKAXES=9999999;
const PICKAXE_SIM_BUDGET=120;
const PICKAXE_DRAW_BUDGET=96;
const MASTERY_DEFS=[
{id:'mobility',name:'Trailblazer',desc:'+5% movement speed per rank.',max:10},
{id:'fortune',name:'Deep Fortune',desc:'+3% all coin income per rank.',max:10},
{id:'frenzy',name:'Hot Steel',desc:'+4% Frenzy damage and duration per rank.',max:10},
{id:'companion',name:'Pack Bond',desc:'+5% pet active power per rank.',max:10},
{id:'critical',name:'Fault Finder',desc:'+1% critical chance per rank.',max:10},
{id:'offline',name:'Night Shift',desc:'+12% offline earnings per rank.',max:10}
];
const MODIFIERS=[
{id:'normal',name:'Normal Mine',weight:55,hp:1,coins:1},
{id:'gold',name:'Gold Rush',weight:12,hp:1.05,coins:1.25,goldBoost:.16},
{id:'crystal',name:'Crystal Bloom',weight:8,hp:1.12,coins:1.1,gemBoost:.08},
{id:'fragile',name:'Fractured Strata',weight:10,hp:.62,coins:.82},
{id:'reinforced',name:'Reinforced Layer',weight:8,hp:1.65,coins:1.7,armorBoost:.14},
{id:'volatile',name:'Volatile Pocket',weight:7,hp:.9,coins:1.15,explosiveBoost:.18}
];
const RARITIES=[
{name:'Common',color:'#aab3c4',power:1},
{name:'Uncommon',color:'#6ff0a0',power:1.55},
{name:'Rare',color:'#6fa8ff',power:2.3},
{name:'Epic',color:'#bd8cff',power:3.4},
{name:'Legendary',color:'#ffd665',power:5.2}
];
const ACHIEVEMENTS=[
{id:'b100',name:'Rock Collector',desc:'Destroy 100 blocks.',reward:2,test:s=>s.totalBlocks>=100},
{id:'b1000',name:'Industrial Miner',desc:'Destroy 1,000 blocks.',reward:5,test:s=>s.totalBlocks>=1000},
{id:'crit100',name:'Fault Line',desc:'Land 100 critical hits.',reward:4,test:s=>s.totalCrits>=100},
{id:'chest10',name:'Treasure Nose',desc:'Open 10 treasure chests.',reward:5,test:s=>s.chestsOpened>=10},
{id:'boss5',name:'Wall Breaker',desc:'Defeat 5 bosses.',reward:7,test:s=>s.bossesDefeated>=5},
{id:'combo4',name:'On a Roll',desc:'Reach a 4.0× combo.',reward:3,test:s=>s.bestCombo>=4},
{id:'pet10',name:'Best Friends',desc:'Raise any pet to level 10.',reward:6,test:s=>Object.values(s.petData||{}).some(p=>p.level>=10)},
{id:'zone10',name:'Star Miner',desc:'Reach Zone 10.',reward:10,test:s=>s.zone>=9}
];

const defaultPetData=()=>Object.fromEntries(PETS.map(p=>[p.id,{level:1,xp:0,affection:0,mood:'Curious',fed:0}]));
const defaultState=()=>({
version:VERSION,coins:0,gems:0,treats:0,zone:0,row:0,totalBlocks:0,lifetimeCoins:0,totalCrits:0,chestsOpened:0,bossesDefeated:0,bestCombo:1,dashes:0,petAbilities:0,reforges:0,ancientCores:0,masteryPoints:0,mastery:{mobility:0,fortune:0,frenzy:0,companion:0,critical:0,offline:0},upgrades:{damage:0,count:0,speed:0,radius:0,crit:0,coins:0},petsOwned:['mole'],equippedPet:'mole',petData:defaultPetData(),relics:[],equippedRelic:null,contracts:[],contractDay:'',achievements:[],settings:{sound:true,haptics:true,reducedMotion:false,damageNumbers:true,developerMode:false,language:'en',blockTexture:'detailed',displayMode:'2d',infiniteMode:false},lastDaily:0,lastDailyDay:-1,dailyStreak:0,lastSaved:Date.now(),tutorialSeen:false,worldSave:null,character:{body:'classic',style:'miner',head:'hardhat',face:'smile',skin:'#ffd1a4',outfit:'#7fa4ff',accent:'#ffd665'}
});
