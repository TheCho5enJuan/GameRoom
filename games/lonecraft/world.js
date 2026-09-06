(() => {
  'use strict';

  const D=window.LonecraftData;
  const SIZE=128;
  const TILE_NAMES=Object.keys(D.TILES);
  const TILE_ID=Object.fromEntries(TILE_NAMES.map((name,index)=>[name,index]));

  function hashSeed(value){
    const text=String(value||Date.now()); let h=2166136261>>>0;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return h>>>0;
  }
  function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  function hash2(x,y,seed){let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(seed|0,69069);h=(h^(h>>>13))*1274126177;return((h^(h>>>16))>>>0)/4294967295}
  function smooth(t){return t*t*(3-2*t)}
  function noise(x,y,scale,seed){
    const fx=x/scale,fy=y/scale,x0=Math.floor(fx),y0=Math.floor(fy),tx=smooth(fx-x0),ty=smooth(fy-y0);
    const a=hash2(x0,y0,seed),b=hash2(x0+1,y0,seed),c=hash2(x0,y0+1,seed),d=hash2(x0+1,y0+1,seed);
    const ab=a+(b-a)*tx,cd=c+(d-c)*tx; return (ab+(cd-ab)*ty)*2-1;
  }
  function fractal(x,y,seed){return noise(x,y,38,seed)*.58+noise(x,y,19,seed+17)*.28+noise(x,y,8,seed+43)*.14}
  function idx(x,y){return x+y*SIZE}
  function inBounds(x,y){return x>=1&&y>=1&&x<SIZE-1&&y<SIZE-1}
  function newLevel(index){return{index,tiles:new Uint8Array(SIZE*SIZE),data:new Uint8Array(SIZE*SIZE),furniture:[],stairsDown:[],spawn:null}}
  function set(level,x,y,name,data=0){if(x<0||y<0||x>=SIZE||y>=SIZE)return;level.tiles[idx(x,y)]=TILE_ID[name];level.data[idx(x,y)]=data}
  function get(level,x,y){if(x<0||y<0||x>=SIZE||y>=SIZE)return'rock';return TILE_NAMES[level.tiles[idx(x,y)]]}
  function clearPatch(level,cx,cy,tile='grass',radius=2){for(let y=cy-radius;y<=cy+radius;y++)for(let x=cx-radius;x<=cx+radius;x++)if(inBounds(x,y))set(level,x,y,tile)}
  function isFloorName(name){return !!D.TILES[name]?.pass && !['water','lava','void'].includes(name)}
  function findFloor(level,rng,avoid=[],preferred=null){
    for(let n=0;n<8000;n++){
      const x=5+Math.floor(rng()*(SIZE-10)),y=5+Math.floor(rng()*(SIZE-10)),name=get(level,x,y);
      if(preferred&&name!==preferred)continue;if(!isFloorName(name))continue;
      if(avoid.some(p=>(p.x-x)**2+(p.y-y)**2<18*18))continue;
      return{x,y};
    }
    return{x:SIZE>>1,y:SIZE>>1};
  }
  function addStair(level,point,down=true,floor='dirt'){
    clearPatch(level,point.x,point.y,floor,1);set(level,point.x,point.y,down?'stairsDown':'stairsUp');
    if(down)level.stairsDown.push({x:point.x,y:point.y});
  }

  function generateSky(seed){
    const level=newLevel(4),rng=mulberry32(seed+4004),cx=SIZE/2,cy=SIZE/2;
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      const d=Math.hypot((x-cx)/(SIZE*.72),(y-cy)/(SIZE*.72));
      const n=fractal(x,y,seed+911)-d*.35;
      set(level,x,y,n>-.08?'cloud':'void');
    }
    const stair={x:64,y:64};clearPatch(level,stair.x,stair.y,'cloud',5);addStair(level,stair,true,'cloud');level.spawn={x:stair.x,y:stair.y+2};
    for(let i=0;i<90;i++){
      const p=findFloor(level,rng,[stair],'cloud'); if(rng()<.5&&get(level,p.x,p.y)==='cloud')set(level,p.x,p.y,'cactus');
    }
    level.bossSpawn={x:64,y:50};clearPatch(level,64,50,'cloud',4);
    return level;
  }

  function generateSurface(seed,skyStair){
    const level=newLevel(3),rng=mulberry32(seed+3003),cx=SIZE/2,cy=SIZE/2;
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      const edge=Math.max(Math.abs(x-cx),Math.abs(y-cy))/(SIZE/2);
      const elev=fractal(x,y,seed+101)-Math.max(0,edge-.72)*2.8;
      const moist=fractal(x+230,y-170,seed+202);
      let tile='grass';
      if(edge>.94||elev<-.30)tile='water';
      else if(elev>.43)tile='rock';
      else if(moist<-.34)tile='sand';
      set(level,x,y,tile);
    }
    clearPatch(level,64,72,'grass',5);level.spawn={x:64,y:72};
    for(let y=2;y<SIZE-2;y++)for(let x=2;x<SIZE-2;x++){
      const t=get(level,x,y),r=rng();
      if(t==='grass'){
        const forest=fractal(x+91,y+77,seed+303);
        if(forest>.05&&r<.34)set(level,x,y,'tree'); else if(r<.37)set(level,x,y,'flower');
      } else if(t==='sand'&&r<.10)set(level,x,y,'cactus');
    }
    clearPatch(level,64,72,'grass',4);
    const gate={x:skyStair.x,y:skyStair.y};clearPatch(level,gate.x,gate.y,'grass',2);set(level,gate.x,gate.y,'stairsUp');
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)set(level,gate.x+dx,gate.y+dy,'hardRock');
    const avoid=[gate,{x:64,y:72}];
    for(let i=0;i<4;i++){const p=findFloor(level,rng,avoid);addStair(level,p,true,get(level,p.x,p.y)==='sand'?'sand':'grass');avoid.push(p)}
    return level;
  }

  function generateCave(index,depth,seed,upStairs){
    const level=newLevel(index),rng=mulberry32(seed+index*1009),liquid=depth===2?'water':depth===3?'lava':null;
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      const edge=Math.max(Math.abs(x-64),Math.abs(y-64))/64;
      const n=fractal(x,y,seed+depth*701);
      let tile=(n>-.08&&edge<.96)?'dirt':'rock';
      if(liquid&&tile==='dirt'){
        const l=fractal(x+420,y-310,seed+depth*919);
        if(l>.42)tile=liquid;
      }
      set(level,x,y,tile);
    }
    upStairs.forEach(p=>addStair(level,p,false,'dirt'));
    const protectedPoints=upStairs.slice();
    const downCount=depth<3?4:0;
    for(let i=0;i<downCount;i++){const p=findFloor(level,rng,protectedPoints,'dirt');addStair(level,p,true,'dirt');protectedPoints.push(p)}
    const oreName=depth===1?'ironOre':depth===2?'goldOre':'gemOre';
    for(let i=0;i<110;i++){
      const x=3+Math.floor(rng()*(SIZE-6)),y=3+Math.floor(rng()*(SIZE-6));
      if(get(level,x,y)!=='rock')continue;
      const vein=1+Math.floor(rng()*4);
      for(let j=0;j<vein;j++){
        const ox=x+Math.floor(rng()*3)-1,oy=y+Math.floor(rng()*3)-1;if(get(level,ox,oy)==='rock')set(level,ox,oy,oreName);
      }
    }
    upStairs.forEach(p=>clearPatchAroundStair(level,p,false));level.stairsDown.forEach(p=>clearPatchAroundStair(level,p,true));
    level.spawn=upStairs[0]?{x:upStairs[0].x,y:upStairs[0].y+2}:{x:64,y:64};
    return level;
  }
  function clearPatchAroundStair(level,p,down){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;set(level,p.x+dx,p.y+dy,'dirt')}set(level,p.x,p.y,down?'stairsDown':'stairsUp')}

  function createWorld(seedValue){
    const seed=hashSeed(seedValue),sky=generateSky(seed),surface=generateSurface(seed,sky.stairsDown[0]);
    const cave1=generateCave(2,1,seed,surface.stairsDown),cave2=generateCave(1,2,seed,cave1.stairsDown),cave3=generateCave(0,3,seed,cave2.stairsDown);
    return{seed,size:SIZE,levels:[cave3,cave2,cave1,surface,sky],createdAt:Date.now()};
  }

  function bytesToBase64(bytes){let out='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(out)}
  function base64ToBytes(text){const bin=atob(text),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}
  function serializeWorld(world){
    return{seed:world.seed,size:world.size,createdAt:world.createdAt,levels:world.levels.map(l=>({index:l.index,tiles:bytesToBase64(l.tiles),data:bytesToBase64(l.data),furniture:l.furniture,stairsDown:l.stairsDown,spawn:l.spawn,bossSpawn:l.bossSpawn||null}))};
  }
  function deserializeWorld(raw){
    return{seed:raw.seed,size:raw.size||SIZE,createdAt:raw.createdAt,levels:raw.levels.map(l=>({index:l.index,tiles:base64ToBytes(l.tiles),data:base64ToBytes(l.data),furniture:Array.isArray(l.furniture)?l.furniture:[],stairsDown:l.stairsDown||[],spawn:l.spawn||null,bossSpawn:l.bossSpawn||null}))};
  }

  window.LonecraftWorld={SIZE,TILE_NAMES,TILE_ID,createWorld,serializeWorld,deserializeWorld,get,set,idx,findFloor,hashSeed};
})();
