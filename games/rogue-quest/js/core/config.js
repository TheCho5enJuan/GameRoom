/* Rogue Quest core data and rules */
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const canvas=$('#gameCanvas'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,TAU=Math.PI*2;
const RUN_COST=3,ENERGY_MS=120000,ENERGY_WELL_MS=1200000,MAX_INV=80; // V3: core play is free; energy powers bonus systems
const chapters={
 1:{name:'Whisperwood',kicker:'CHAPTER 1',sky:['#152d4e','#315b6a','#112337'],ground:'#173c32',accent:'#78e7a0',weather:'leaf',boss:'thornwyrm'},
 2:{name:'Embervault',kicker:'CHAPTER 2',sky:['#3a1823','#7a3623','#1d1420'],ground:'#42241e',accent:'#ff9d58',weather:'ember',boss:'cinderTitan'},
 3:{name:'Frostspire',kicker:'CHAPTER 3',sky:['#19324d','#5b7893','#16253a'],ground:'#23495a',accent:'#9aeaff',weather:'snow',boss:'moonfang'},
 4:{name:'Void Citadel',kicker:'CHAPTER 4',sky:['#180f35','#3d2364','#0b0a1c'],ground:'#241b3a',accent:'#c58cff',weather:'void',boss:'voidRegent'}
};
const classDefs={
 knight:{name:'Storm Knight',desc:'Balanced bruiser. +18% HP, +12% DEF, Guard lasts longer.',hp:1.18,atk:1,def:1.12,crit:0,rate:1,icon:'🛡️'},
 ranger:{name:'Gale Ranger',desc:'Fast striker. +18% attack speed, +7% crit, slightly lower HP.',hp:.92,atk:1.05,def:.94,crit:.07,rate:.82,icon:'🏹'},
 mystic:{name:'Aether Mystic',desc:'Spell fighter. +12% attack, +20% ultimate gain and stronger Arc Burst.',hp:1,atk:1.12,def:.98,crit:.03,rate:.95,icon:'🔮'}
};
const petDefs=[
 {id:'fox',name:'Emberfox',icon:'🦊',trait:'Aggressive',role:'Deals extra damage to wounded enemies.',unlock:0,atk:9},
 {id:'owl',name:'Moonwing',icon:'🦉',trait:'Curious',role:'Improves treasure and gear drop luck.',unlock:500,atk:7},
 {id:'golem',name:'Pebble',icon:'🪨',trait:'Protective',role:'Reduces incoming damage and adds shield.',unlock:1100,atk:6},
 {id:'wisp',name:'Nimbus',icon:'✨',trait:'Chaotic',role:'Random elemental bursts can stun enemies.',unlock:1800,atk:11},
 {id:'wolf',name:'Ashfang',icon:'🐺',trait:'Loyal',role:'Builds combo faster and attacks with you.',unlock:2800,atk:13},
 {id:'sprite',name:'Luma',icon:'🧚',trait:'Gentle',role:'Periodically heals you during combat.',unlock:4200,atk:8}
];
const gearSlots=['Weapon','Armor','Helm','Charm','Boots','Ring'];
const gearIcons={Weapon:'⚔️',Armor:'🛡️',Helm:'⛑️',Charm:'🔮',Boots:'🥾',Ring:'💍'};
const rarities=[
 {n:'Common',c:'common',m:1},{n:'Uncommon',c:'uncommon',m:1.3},{n:'Rare',c:'rare',m:1.7},{n:'Epic',c:'epic',m:2.25},{n:'Legendary',c:'legendary',m:3},{n:'Mythic',c:'mythic',m:4.1}
];
const talentDefs=[
 {id:'might',ico:'⚔️',name:'Might',desc:'+4% base attack per rank.',max:10},
 {id:'vitality',ico:'❤️',name:'Vitality',desc:'+5% base HP per rank.',max:10},
 {id:'guard',ico:'🛡️',name:'Fortitude',desc:'+3% defense per rank.',max:10},
 {id:'swift',ico:'💨',name:'Swiftness',desc:'+2.5% attack speed per rank.',max:10},
 {id:'luck',ico:'🍀',name:'Fortune',desc:'+3% loot luck per rank.',max:10},
 {id:'energy',ico:'⚡',name:'Endurance',desc:'+4 maximum energy per rank.',max:10}
];
const artifactDefs=[
 {id:'sunstone',ico:'☀️',name:'Sunstone',desc:'Attack +3% per level.'},
 {id:'heartroot',ico:'🌿',name:'Heartroot Idol',desc:'HP +4% per level.'},
 {id:'aegis',ico:'🛡️',name:'Aegis Fragment',desc:'Defense +3% per level.'},
 {id:'coin',ico:'🪙',name:'Fortune Coin',desc:'Loot luck +4% per level.'},
 {id:'hourglass',ico:'⌛',name:'Chronoglass',desc:'Attack speed +2% per level.'},
 {id:'lantern',ico:'🏮',name:'Everlight Lantern',desc:'Maximum energy +2 per level.'}
];
const enemyDefs=[
 {id:'mossSlime',chapter:1,name:'Moss Slime',kind:'slime',icon:'🟢',hp:100,atk:13,rate:1.35},
 {id:'nightBat',chapter:1,name:'Night Bat',kind:'bat',icon:'🦇',hp:82,atk:17,rate:1.05},
 {id:'briarWraith',chapter:1,name:'Briar Wraith',kind:'wraith',icon:'👻',hp:125,atk:19,rate:1.3},
 {id:'stonekin',chapter:1,name:'Stonekin',kind:'golem',icon:'🗿',hp:168,atk:22,rate:1.65},
 {id:'thornwyrm',chapter:1,name:'Thornwyrm',kind:'dragon',icon:'🐉',hp:460,atk:31,rate:1.2,boss:true},
 {id:'cinderImp',chapter:2,name:'Cinder Imp',kind:'imp',icon:'👹',hp:128,atk:25,rate:1.05},
 {id:'lavaCrawler',chapter:2,name:'Lava Crawler',kind:'spider',icon:'🕷️',hp:165,atk:23,rate:1.3},
 {id:'ashMage',chapter:2,name:'Ash Mage',kind:'mage',icon:'🧙',hp:145,atk:31,rate:1.45},
 {id:'magmaGolem',chapter:2,name:'Magma Golem',kind:'golem',icon:'🗿',hp:220,atk:30,rate:1.75},
 {id:'cinderTitan',chapter:2,name:'Cinder Titan',kind:'titan',icon:'🔥',hp:650,atk:43,rate:1.35,boss:true},
 {id:'frostWolf',chapter:3,name:'Frost Wolf',kind:'wolf',icon:'🐺',hp:205,atk:37,rate:1.05},
 {id:'iceWisp',chapter:3,name:'Ice Wisp',kind:'wraith',icon:'❄️',hp:172,atk:39,rate:1.25},
 {id:'glacierGuard',chapter:3,name:'Glacier Guard',kind:'golem',icon:'🧊',hp:270,atk:36,rate:1.65},
 {id:'snowStalker',chapter:3,name:'Snow Stalker',kind:'spider',icon:'🕷️',hp:190,atk:42,rate:1.15},
 {id:'moonfang',chapter:3,name:'Moonfang',kind:'wolfBoss',icon:'🐺',hp:860,atk:56,rate:1.05,boss:true},
 {id:'voidling',chapter:4,name:'Voidling',kind:'slime',icon:'🟣',hp:245,atk:52,rate:1.15},
 {id:'riftKnight',chapter:4,name:'Rift Knight',kind:'golem',icon:'♞',hp:330,atk:49,rate:1.5},
 {id:'nullMage',chapter:4,name:'Null Mage',kind:'mage',icon:'🧙',hp:260,atk:62,rate:1.35},
 {id:'abyssEye',chapter:4,name:'Abyss Eye',kind:'wraith',icon:'👁️',hp:285,atk:58,rate:1.2},
 {id:'voidRegent',chapter:4,name:'Void Regent',kind:'regent',icon:'♛',hp:1150,atk:74,rate:1.22,boss:true}
];
const upgradeDefs=[
 {id:'power',ico:'⚔️',name:'Brutal Edge',desc:'Attack damage increases.',tag:'OFFENSE'},
 {id:'speed',ico:'💨',name:'Quick Hands',desc:'Attack much faster.',tag:'OFFENSE'},
 {id:'crit',ico:'🎯',name:'Deadeye',desc:'Critical chance increases.',tag:'OFFENSE'},
 {id:'critDmg',ico:'💥',name:'Savage Criticals',desc:'Critical hits deal more damage.',tag:'OFFENSE'},
 {id:'multi',ico:'🗡️',name:'Echo Strike',desc:'Chance for a second basic attack.',tag:'OFFENSE'},
 {id:'execute',ico:'☠️',name:'Executioner',desc:'More damage to enemies below 30% HP.',tag:'OFFENSE'},
 {id:'combo',ico:'🔥',name:'Momentum',desc:'Combo builds faster and hits harder.',tag:'OFFENSE'},
 {id:'berserk',ico:'😈',name:'Last Stand',desc:'Low HP greatly increases damage.',tag:'OFFENSE'},
 {id:'vital',ico:'❤️',name:'Vitality',desc:'Increase max HP and heal immediately.',tag:'DEFENSE'},
 {id:'armor',ico:'🛡️',name:'Iron Skin',desc:'Increase defense.',tag:'DEFENSE'},
 {id:'dodge',ico:'🪽',name:'Phantom Step',desc:'Chance to completely dodge attacks.',tag:'DEFENSE'},
 {id:'thorns',ico:'🌵',name:'Thornmail',desc:'Reflect damage when struck.',tag:'DEFENSE'},
 {id:'shield',ico:'🔷',name:'Arcane Barrier',desc:'Begin each battle with a shield.',tag:'DEFENSE'},
 {id:'regen',ico:'🌿',name:'Renewal',desc:'Regenerate HP during combat.',tag:'RECOVERY'},
 {id:'lifesteal',ico:'🩸',name:'Blood Pact',desc:'Heal from damage dealt.',tag:'RECOVERY'},
 {id:'heal',ico:'🍀',name:'Second Wind',desc:'Heal a large amount now.',tag:'RECOVERY'},
 {id:'fire',ico:'🔥',name:'Flamebrand',desc:'Attacks inflict burning damage.',tag:'ELEMENT'},
 {id:'frost',ico:'❄️',name:'Frostbite',desc:'Slow enemy attack speed.',tag:'ELEMENT'},
 {id:'storm',ico:'⚡',name:'Chain Spark',desc:'Pet attacks gain lightning damage.',tag:'ELEMENT'},
 {id:'poison',ico:'☣️',name:'Venom Edge',desc:'Build poison damage over time.',tag:'ELEMENT'},
 {id:'shock',ico:'🌩️',name:'Static Field',desc:'Attacks can briefly stun.',tag:'ELEMENT'},
 {id:'bleed',ico:'🩸',name:'Serrated Edge',desc:'Critical hits cause bleeding.',tag:'ELEMENT'},
 {id:'petPower',ico:'🐾',name:'Pack Tactics',desc:'Pet damage increases sharply.',tag:'COMPANION'},
 {id:'petSpeed',ico:'🐾',name:'Feral Rhythm',desc:'Pet attacks more frequently.',tag:'COMPANION'},
 {id:'treasure',ico:'💰',name:'Treasure Sense',desc:'Gain more gold and better loot.',tag:'UTILITY'},
 {id:'elite',ico:'💀',name:'Giant Slayer',desc:'Deal more damage to elites and bosses.',tag:'UTILITY'},
 {id:'focus',ico:'🎲',name:'Fate Weaver',desc:'Gain one Fate Dice charge.',tag:'UTILITY'},
 {id:'skill',ico:'✨',name:'Battle Mage',desc:'Active skills cool down faster.',tag:'UTILITY'}
];
const rarityRolls=[{n:'Common',c:'common',mult:1,w:62},{n:'Rare',c:'rare',mult:1.45,w:28},{n:'Epic',c:'epic',mult:2.05,w:10}];
