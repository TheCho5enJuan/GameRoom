/* Rogue Quest V3 modes, heroes, weapons, modifiers, and state */
'use strict';
/* ====================== V3 SYSTEMS ====================== */
const V3_VERSION=3;
const v3Modes={
 campaign:{name:'Adventure',ico:'🗺️',desc:'Branching campaign. Energy-free core play.'},
 survival:{name:'Survival',ico:'🧟',desc:'Survive escalating swarms and hazards.'},
 endless:{name:'Endless Arena',ico:'∞',desc:'Infinite waves. Bank rewards when you retreat.'},
 tower:{name:'Trial Tower',ico:'🗼',desc:'Climb increasingly dangerous floors.'},
 bossrush:{name:'Boss Rush',ico:'♛',desc:'Fight bosses back-to-back with limited healing.'},
 maze:{name:'Rogue Maze',ico:'🧩',desc:'Room-by-room maze with keys and hidden treasure.'}
};
const difficultyDefs={normal:{name:'Normal',hp:1,atk:1,reward:1},veteran:{name:'Veteran',hp:1.35,atk:1.22,reward:1.35},nightmare:{name:'Nightmare',hp:1.8,atk:1.48,reward:1.8},infernal:{name:'Infernal',hp:2.5,atk:1.85,reward:2.55}};
const worldModifiers=[
 {id:'doubleElite',name:'Double Elites',desc:'Elite chance and elite rewards are doubled.'},
 {id:'poisonWorld',name:'Poison World',desc:'Hazards persist longer; poison damage is amplified.'},
 {id:'giants',name:'Giant Enemies',desc:'Enemies are larger, slower and hit harder.'},
 {id:'noHealing',name:'No Healing',desc:'Healing is disabled; shields are 30% stronger.'},
 {id:'treasure',name:'Treasure Frenzy',desc:'More treasure rooms and +45% loot.'}
];
const weaponDefsV3={
 sword:{name:'Sword',ico:'⚔️',range:215,atk:1.05,rate:1,break:11,tags:['Melee','Critical'],set:'Vanguard',desc:'Balanced reach, damage and stagger.'},
 greatsword:{name:'Greatsword',ico:'🗡️',range:205,atk:1.55,rate:1.45,break:24,tags:['Melee','Heavy'],set:'Titan',desc:'Slow crushing attacks with huge break.'},
 bow:{name:'Bow',ico:'🏹',range:620,atk:.98,rate:.92,break:7,tags:['Projectile','Critical'],set:'Gale',desc:'Long range and high critical synergy.'},
 staff:{name:'Staff',ico:'🪄',range:590,atk:1.12,rate:1.08,break:10,tags:['Spell','Element'],set:'Astral',desc:'Elemental projectiles with splash damage.'},
 daggers:{name:'Daggers',ico:'🗡️',range:165,atk:.69,rate:.58,break:5,tags:['Melee','Critical'],set:'Shade',desc:'Two rapid strikes and extreme combo generation.'},
 spear:{name:'Spear',ico:'🔱',range:300,atk:1.18,rate:1.05,break:13,tags:['Melee','Pierce'],set:'Sentinel',desc:'Extended reach and armor penetration.'},
 crossbow:{name:'Crossbow',ico:'🎯',range:650,atk:1.42,rate:1.38,break:15,tags:['Projectile','Heavy'],set:'Hunter',desc:'Slow, powerful bolts from maximum range.'},
 gauntlets:{name:'Gauntlets',ico:'🥊',range:150,atk:.78,rate:.62,break:9,tags:['Melee','Combo'],set:'Tempest',desc:'Close-range flurries that snowball combo.'}
};
const heroRosterV3=[
 {id:'stormKnight',name:'Storm Knight',ico:'🛡️',cls:'knight',sig:'Aegis Crash',desc:'Shield-first bruiser. Signature slams and staggers.',passive:'HP +5%',unlock:0},
 {id:'galeRanger',name:'Gale Ranger',ico:'🏹',cls:'ranger',sig:'Arrow Tempest',desc:'Fast ranged striker. Signature fires a five-shot volley.',passive:'Crit +2%',unlock:0},
 {id:'aetherMystic',name:'Aether Mystic',ico:'🔮',cls:'mystic',sig:'Time Fracture',desc:'Elemental caster. Signature freezes time and detonates arcane energy.',passive:'Skill haste +4%',unlock:0},
 {id:'emberDuelist',name:'Ember Duelist',ico:'🔥',cls:'ranger',sig:'Phoenix Lunge',desc:'Aggressive melee hero that converts combo into fire damage.',passive:'Fire +5%',unlock:1800},
 {id:'frostWarden',name:'Frost Warden',ico:'❄️',cls:'knight',sig:'Glacial Dome',desc:'Defensive controller with strong shields and freeze.',passive:'Shield +7%',unlock:2600},
 {id:'voidSeer',name:'Void Seer',ico:'👁️',cls:'mystic',sig:'Null Collapse',desc:'High-risk caster with execute and teleport effects.',passive:'Execute +4%',unlock:3600},
 {id:'sunPaladin',name:'Sun Paladin',ico:'☀️',cls:'knight',sig:'Solar Judgment',desc:'Healing warrior that punishes bosses.',passive:'Boss dmg +4%',unlock:4800},
 {id:'plagueDoctor',name:'Plague Doctor',ico:'🧪',cls:'mystic',sig:'Black Bloom',desc:'Poison specialist whose damage grows over time.',passive:'Poison +6%',unlock:6200},
 {id:'tempestMonk',name:'Tempest Monk',ico:'🌩️',cls:'ranger',sig:'Hundred Fists',desc:'Close-range combo hero built for gauntlets.',passive:'Combo +5%',unlock:7600},
 {id:'shadowBlade',name:'Shadow Blade',ico:'🌑',cls:'ranger',sig:'Nightstep',desc:'Dash-focused assassin with extreme critical bursts.',passive:'Dash dmg +10%',unlock:9000},
 {id:'beastTamer',name:'Beast Tamer',ico:'🐾',cls:'knight',sig:'Pack Assault',desc:'Pet commander who amplifies both active companions.',passive:'Pet dmg +8%',unlock:11000},
 {id:'runeSmith',name:'Rune Smith',ico:'🔨',cls:'mystic',sig:'Runic Overload',desc:'Weapon master who gains extra mastery and break.',passive:'Mastery +10%',unlock:13500}
];
const eliteAffixesV3=[
 {id:'vampiric',name:'Vampiric',ico:'🩸'},{id:'shielded',name:'Shielded',ico:'🔷'},{id:'frenzied',name:'Frenzied',ico:'😈'},
 {id:'explosive',name:'Explosive',ico:'💣'},{id:'teleporter',name:'Teleporter',ico:'🌀'},{id:'summoner',name:'Summoner',ico:'👥'}
];
const v3UpgradeDefs=[
 {id:'v3Meteor',ico:'☄️',name:'Meteor Seed',desc:'Fire attacks occasionally call down a meteor.',tag:'Fire',weapons:['staff','bow','crossbow']},
 {id:'v3Fan',ico:'➶',name:'Fan Shot',desc:'+1 projectile for projectile weapons.',tag:'Projectile',weapons:['bow','crossbow','staff']},
 {id:'v3Whirl',ico:'🌀',name:'Whirlwind Edge',desc:'Melee attacks splash around you.',tag:'Melee',weapons:['sword','greatsword','daggers','spear','gauntlets']},
 {id:'v3Break',ico:'🔨',name:'Sunder',desc:'Break damage increases by 45%.',tag:'Heavy'},
 {id:'v3Dash',ico:'💨',name:'Afterimage',desc:'Dash damages enemies and recharges faster.',tag:'Mobility'},
 {id:'v3Pet',ico:'🐾',name:'Pack Tactics',desc:'Both active pets attack faster.',tag:'Summon'},
 {id:'v3FrostNova',ico:'❄️',name:'Winter Pulse',desc:'Taking heavy damage releases a frost nova.',tag:'Frost'},
 {id:'v3Chain',ico:'⚡',name:'Overcharge',desc:'Lightning chains gain an extra strike.',tag:'Storm'},
 {id:'v3Venom',ico:'☣️',name:'Virulent Strain',desc:'Poison stacks deal more damage below 50% HP.',tag:'Poison'},
 {id:'v3Blood',ico:'🩸',name:'Hemorrhage',desc:'Critical hits create stronger bleed.',tag:'Bleed'},
 {id:'v3Glass',ico:'💎',name:'Glass Heart',desc:'+80% damage, but maximum HP is reduced by 35%.',tag:'CORRUPTED',corrupted:true},
 {id:'v3Engine',ico:'⚙️',name:'Blood Engine',desc:'+45% attack speed, but lose 0.7% HP each second.',tag:'CORRUPTED',corrupted:true},
 {id:'v3Greed',ico:'👑',name:'Crown of Greed',desc:'+70% loot, but enemies deal +30% damage.',tag:'CORRUPTED',corrupted:true}
];
const npcDefsV3=[
 {id:'smith',name:'Brakka the Smith',ico:'🧔',perk:'Gear upgrade cost -2% per reputation.'},
 {id:'alchemist',name:'Mira the Alchemist',ico:'🧙‍♀️',perk:'Potion strength +3% per reputation.'},
 {id:'trainer',name:'Captain Orin',ico:'🧑‍✈️',perk:'Weapon mastery gain +3% per reputation.'},
 {id:'merchant',name:'Pip the Merchant',ico:'🧝',perk:'Treasure gold +2% per reputation.'},
 {id:'traveler',name:'The Veiled Traveler',ico:'🥷',perk:'Rare event chance +2% per reputation.'}
];

const fishDefsV3=[['Minnow','🐟',1],['Silver Koi','🐠',2],['Moon Eel','🪱',3],['Emberfin','🐡',4],['Void Carp','🐟',5],['Ancient Crownfish','👑',8]];
let arena=null,joy={x:0,y:0,active:false},fishLoop=null,fishPos=0,fishDir=1,fishTargetStart=.42,fishTargetWidth=.18;
function weekSeed(){let d=new Date(),onejan=new Date(d.getFullYear(),0,1),week=Math.floor(((d-onejan)/86400000+onejan.getDay()+1)/7);return d.getFullYear()*100+week}
function seeded(seed){let x=Math.sin(seed++)*10000;return x-Math.floor(x)}
function currentModifier(){return worldModifiers[weekSeed()%worldModifiers.length]}
function ensureV3State(){
 state.version=V3_VERSION;state.selectedMode=state.selectedMode||'campaign';state.difficulty=state.difficulty||'normal';state.heroId=state.heroId||({knight:'stormKnight',ranger:'galeRanger',mystic:'aetherMystic'}[state.heroClass]||'stormKnight');state.supportHero=state.supportHero||'galeRanger';
 state.heroUnlocked=state.heroUnlocked||{};heroRosterV3.forEach((h,i)=>{if(h.unlock===0)state.heroUnlocked[h.id]=true;else if(state.heroUnlocked[h.id]===undefined)state.heroUnlocked[h.id]=false});state.heroAwaken=state.heroAwaken||{};state.heroAwakenPath=state.heroAwakenPath||{};state.heroSouls=state.heroSouls||0;
 state.weaponFamily=state.weaponFamily||'sword';state.weaponMastery=state.weaponMastery||{};state.weaponMasteryXp=state.weaponMasteryXp||{};state.blueprints=state.blueprints||{};Object.keys(weaponDefsV3).forEach(k=>{state.weaponMastery[k]=state.weaponMastery[k]||1;state.weaponMasteryXp[k]=state.weaponMasteryXp[k]||0;state.blueprints[k]=state.blueprints[k]||0});
 state.petSlots=state.petSlots||{active1:state.activePet||'fox',active2:'owl',support:'golem'};state.petCommand=state.petCommand||'attack';state.bredPets=state.bredPets||[];state.activeBredPet=state.activeBredPet||null;state.petExpeditions=state.petExpeditions||{};
 state.base=Object.assign({forge:1,alchemy:1,garden:1,fishing:1},state.base||{});state.potions=Object.assign({power:0,ward:0,haste:0},state.potions||{});state.seeds=state.seeds||5;state.gardenPlots=state.gardenPlots||[{crop:null,end:0},{crop:null,end:0},{crop:null,end:0}];state.fishCollection=state.fishCollection||{};state.npcRep=state.npcRep||{};npcDefsV3.forEach(n=>state.npcRep[n.id]=state.npcRep[n.id]||0);
 state.collectionClaims=state.collectionClaims||{};state.title=state.title||'Rookie';state.bounties=state.bounties||{};state.modeRecords=Object.assign({survival:0,endless:0,tower:0,bossrush:0,maze:0,weekly:0},state.modeRecords||{});state.lastRunRecap=state.lastRunRecap||null;state.weeklyBest=state.weeklyBest||{};state.rapidClears=state.rapidClears||0;
 state.activePet=state.petSlots.active1||state.activePet;return state
}
ensureV3State();
const v2HeroBase=heroBase,v2RenderAll=renderAll,v2RenderRun=renderRun,v2RenderHero=renderHero,v2StartCombat=startCombat,v2EnemyFor=enemyFor,v2CombatWin=combatWin,v2CompleteRun=completeRun,v2CombatLose=combatLose,v2ChooseUpgrade=chooseUpgrade,v2PetAttack=petAttack,v2CastSkill=castSkill,v2ApplyLanguageUI=applyLanguageUI,v2Hydrate=hydrate;
function selectedHero(){return heroRosterV3.find(h=>h.id===state.heroId)||heroRosterV3[0]}
function supportHero(){return heroRosterV3.find(h=>h.id===state.supportHero)||heroRosterV3[1]}
