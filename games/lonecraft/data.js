(() => {
  'use strict';

  const TILES = {
    grass:{name:'Grass',pass:true,color:'#4f7b43',edge:'#76a15b'},
    tree:{name:'Tree',pass:false,color:'#285337',edge:'#4f8b48',hp:20,tool:'axe'},
    rock:{name:'Rock',pass:false,color:'#5a5c5a',edge:'#7d817c',hp:50,tool:'pickaxe'},
    water:{name:'Water',pass:true,liquid:'water',color:'#2f6680',edge:'#5a91a8'},
    flower:{name:'Flower',pass:true,color:'#4f7b43',edge:'#fff0c4'},
    dirt:{name:'Dirt',pass:true,color:'#604a31',edge:'#7e6444'},
    sand:{name:'Sand',pass:true,color:'#a38a4e',edge:'#c3ad6d'},
    cactus:{name:'Cactus',pass:false,color:'#34733f',edge:'#6caf62',hp:10,tool:'axe'},
    hole:{name:'Hole',pass:false,color:'#211b17',edge:'#42372e'},
    farmland:{name:'Farmland',pass:true,color:'#594128',edge:'#765938'},
    wheat:{name:'Wheat',pass:true,color:'#66562f',edge:'#c7aa52'},
    lava:{name:'Lava',pass:true,liquid:'lava',color:'#b83f27',edge:'#f49a3f',light:4},
    stairsDown:{name:'Stairs Down',pass:true,color:'#47413b',edge:'#c2b9aa'},
    stairsUp:{name:'Stairs Up',pass:true,color:'#47413b',edge:'#d7d0c5'},
    void:{name:'Infinite Fall',pass:false,color:'#07131e',edge:'#142b3f'},
    cloud:{name:'Cloud',pass:true,color:'#c9d7d9',edge:'#f1f7f3'},
    hardRock:{name:'Hard Rock',pass:false,color:'#303436',edge:'#565e61',hp:200,tool:'gem_pickaxe'},
    ironOre:{name:'Iron Ore',pass:false,color:'#575b5a',edge:'#bdc3bc',ore:'ironOre'},
    goldOre:{name:'Gold Ore',pass:false,color:'#56534b',edge:'#e0ba45',ore:'goldOre'},
    gemOre:{name:'Gem Ore',pass:false,color:'#4a5250',edge:'#57e6bf',ore:'gem'},
  };

  const RESOURCES = {
    wood:{name:'Wood',icon:'▥'},stone:{name:'Stone',icon:'⬟'},flower:{name:'Flower',icon:'✿'},acorn:{name:'Acorn',icon:'●'},
    dirt:{name:'Dirt',icon:'■'},sand:{name:'Sand',icon:'░'},cactus:{name:'Cactus',icon:'♣'},seeds:{name:'Seeds',icon:'⁙'},wheat:{name:'Wheat',icon:'≋'},
    bread:{name:'Bread',icon:'▰',food:2},apple:{name:'Apple',icon:'●',food:1},coal:{name:'Coal',icon:'◆'},ironOre:{name:'Iron Ore',icon:'◈'},goldOre:{name:'Gold Ore',icon:'◈'},
    iron:{name:'Iron',icon:'▣'},gold:{name:'Gold',icon:'▣'},slime:{name:'Slime',icon:'◉'},glass:{name:'Glass',icon:'◇'},cloth:{name:'Cloth',icon:'▧'},cloud:{name:'Cloud',icon:'☁'},gem:{name:'Gem',icon:'♦'},
    workbench:{name:'Workbench',icon:'▦',furniture:true},furnace:{name:'Furnace',icon:'▤',furniture:true},oven:{name:'Oven',icon:'▥',furniture:true},anvil:{name:'Anvil',icon:'⌂',furniture:true},chest:{name:'Chest',icon:'▣',furniture:true},lantern:{name:'Lantern',icon:'✦',furniture:true,light:6},
    power_glove:{name:'Power Glove',icon:'✋',special:true},
  };

  const TOOL_TYPES = ['sword','axe','hoe','pickaxe','shovel'];
  const TIERS = [
    {id:'wood',name:'Wood',resource:'wood',cost:5,power:0,color:'#a77748'},
    {id:'rock',name:'Rock',resource:'stone',cost:5,power:1,color:'#9aa09c'},
    {id:'iron',name:'Iron',resource:'iron',cost:5,power:2,color:'#d2d8d2'},
    {id:'gold',name:'Gold',resource:'gold',cost:5,power:3,color:'#e9c64f'},
    {id:'gem',name:'Gem',resource:'gem',cost:50,power:4,color:'#55d8b5'},
  ];
  const TOOL_ICONS = {sword:'†',axe:'⌐',hoe:'⌟',pickaxe:'⛏',shovel:'♠'};

  const ITEMS = {...RESOURCES};
  TIERS.forEach(tier => TOOL_TYPES.forEach(type => {
    const id = `${tier.id}_${type}`;
    ITEMS[id] = {name:`${tier.name} ${type[0].toUpperCase()}${type.slice(1)}`,icon:TOOL_ICONS[type],tool:true,type,tier:tier.power,tierId:tier.id,color:tier.color};
  }));

  function toolRecipe(type,tierIndex,station){
    const tier=TIERS[tierIndex];
    const costs={wood:5};
    if(tierIndex===1) costs.stone=5;
    if(tierIndex>=2) costs[tier.resource]=tier.cost;
    if(tierIndex===0) costs.wood=5;
    return {id:`${tier.id}_${type}`,amount:1,station,costs};
  }

  const RECIPES = {
    workbench:[
      {id:'lantern',amount:1,costs:{wood:5,slime:10,glass:4}},
      {id:'oven',amount:1,costs:{stone:15}},
      {id:'furnace',amount:1,costs:{stone:20}},
      {id:'workbench',amount:1,costs:{wood:20}},
      {id:'chest',amount:1,costs:{wood:20}},
      {id:'anvil',amount:1,costs:{iron:5}},
      ...TOOL_TYPES.map(type=>toolRecipe(type,0,'workbench')),
      ...TOOL_TYPES.map(type=>toolRecipe(type,1,'workbench')),
    ],
    anvil:[
      ...TOOL_TYPES.map(type=>toolRecipe(type,2,'anvil')),
      ...TOOL_TYPES.map(type=>toolRecipe(type,3,'anvil')),
      ...TOOL_TYPES.map(type=>toolRecipe(type,4,'anvil')),
    ],
    furnace:[
      {id:'iron',amount:1,costs:{ironOre:4,coal:1}},
      {id:'gold',amount:1,costs:{goldOre:4,coal:1}},
      {id:'glass',amount:1,costs:{sand:4,coal:1}},
    ],
    oven:[{id:'bread',amount:1,costs:{wheat:4}}],
    chest:[],lantern:[],
  };

  const LEVELS = [
    {index:0,depth:-3,name:'Lava Caves',dark:true,mobMin:1,mobMax:4,ore:'gemOre'},
    {index:1,depth:-2,name:'Water Caves',dark:true,mobMin:1,mobMax:3,ore:'goldOre'},
    {index:2,depth:-1,name:'Dry Caves',dark:true,mobMin:1,mobMax:2,ore:'ironOre'},
    {index:3,depth:0,name:'Surface',dark:false,mobMin:1,mobMax:1},
    {index:4,depth:1,name:'Sky',dark:false,mobMin:4,mobMax:4,boss:true},
  ];

  const MOB_STATS = {
    slime:{baseHp:5,score:25,drop:'slime'},
    zombie:{baseHp:10,score:50,drop:'cloth'},
  };

  const OBJECTIVES = [
    {test:s=>!s.flags.placedWorkbench,text:'Place your Workbench and gather wood.'},
    {test:s=>!s.flags.hasWoodPick,text:'Craft a Wood Pickaxe at the Workbench.'},
    {test:s=>s.levelIndex===3&&!s.flags.visitedCave1,text:'Find stairs down and enter the Dry Caves.'},
    {test:s=>!s.flags.hasIron,text:'Mine iron ore and smelt Iron at a Furnace.'},
    {test:s=>!s.flags.visitedCave2,text:'Descend to the Water Caves for gold.'},
    {test:s=>!s.flags.hasGold,text:'Smelt Gold and push deeper.'},
    {test:s=>!s.flags.visitedCave3,text:'Reach the Lava Caves and mine gems.'},
    {test:s=>!s.flags.hasGemPick,text:'Craft a Gem Pickaxe at an Anvil.'},
    {test:s=>s.levelIndex!==4,text:'Return to the Surface and break the hard-rock sky gate.'},
    {test:s=>!s.flags.won,text:'Reach the Sky. Defeat the Air Wizard.'},
    {test:()=>true,text:'The world is yours.'},
  ];

  window.LonecraftData={TILES,RESOURCES,ITEMS,RECIPES,LEVELS,MOB_STATS,TOOL_TYPES,TIERS,OBJECTIVES};
})();
