(() => {
  'use strict';

  const canvas=document.getElementById('gameCanvas');
  if(!canvas)return;

  const shell=document.getElementById('gameShell');
  shell?.classList.add('lonecraft-v2','lonecraft-sprite-edition');

  // All shipped runtime sprite sources are explicitly CC0. See README.md.
  const ASSET_URLS={
    hero:'https://opengameart.org/sites/default/files/ninja_3.png',
    boss:'https://opengameart.org/sites/default/files/ninja_3.png',
    zombie:'https://opengameart.org/sites/default/files/zombie7_0.png',
    slime:'https://opengameart.org/sites/default/files/smallSlimesSpriteSheet.png'
  };

  const remap=new Map([
    ['#e3caa4','#f0c9a4'],['#e9ece4','#5bb2a1'],['#4a627a','#35536f'],
    ['#4ba44e','#72d67b'],['#a15745','#e17d6e'],['#d4d5d0','#dce7eb'],['#242a30','#5c5470'],
    ['#5b9f57','#84bd72'],['#9b5a45','#cc8868'],['#d0d1ca','#c8d5d9'],['#2a3032','#697889'],
    ['#315331','#4f8550'],['#385d38','#5f965a']
  ]);

  const images={};
  if(typeof Image==='function'){
    for(const [name,url] of Object.entries(ASSET_URLS)){
      const image=new Image();
      image.decoding='async';
      image.referrerPolicy='no-referrer';
      image.src=url;
      images[name]=image;
    }
  }

  const title=document.querySelector('.title-art');
  if(title){
    title.innerHTML='<div class="sprite-title-stage"><div class="sprite-title-hero"></div><div class="sprite-title-slime"></div><div class="sprite-title-shadow hero-shadow"></div><div class="sprite-title-shadow slime-shadow"></div></div>';
    const hero=title.querySelector('.sprite-title-hero');
    const slime=title.querySelector('.sprite-title-slime');
    if(hero){hero.style.backgroundImage=`url("${ASSET_URLS.hero}")`;hero.style.backgroundSize='96px 160px';hero.style.backgroundPosition='-32px 0'}
    if(slime){slime.style.backgroundImage=`url("${ASSET_URLS.slime}")`;slime.style.backgroundSize='256px 256px';slime.style.backgroundPosition='0 -96px'}
  }

  const proto=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
  if(!proto)return;

  if(!proto.__lonecraftV2Palette){
    const desc=Object.getOwnPropertyDescriptor(proto,'fillStyle');
    if(desc?.get&&desc?.set){
      Object.defineProperty(proto,'fillStyle',{
        configurable:true,
        get:desc.get,
        set(value){
          const mapped=typeof value==='string'?remap.get(value.toLowerCase()):null;
          desc.set.call(this,mapped||value);
        }
      });
    }
    proto.__lonecraftV2Palette=true;
  }

  if(proto.__lonecraftSpriteEdition)return;
  proto.__lonecraftSpriteEdition=true;

  const originalFillRect=proto.fillRect;
  const originalClearRect=proto.clearRect;
  const originalDrawImage=proto.drawImage;
  const originalFill=proto.fill;
  const records=[];
  const trackers={zombie:[],boss:[]};
  const activeDirections=new Set();
  let frameToken=0;
  let overlayDrawn=false;
  let internalDraw=false;
  let playerDir='down';
  let attackUntil=0;

  const normalizeColor=value=>String(value||'').toLowerCase().replace(/\s+/g,'');
  const SLIME_TIERS=new Map([
    ['#4ba44e',1],['#72d67b',1],['#a15745',2],['#e17d6e',2],
    ['#d4d5d0',3],['#dce7eb',3],['#242a30',4],['#5c5470',4]
  ]);
  const ZOMBIE_TIERS=new Map([
    ['#5b9f57',1],['#84bd72',1],['#9b5a45',2],['#cc8868',2],
    ['#d0d1ca',3],['#c8d5d9',3],['#2a3032',4],['#697889',4]
  ]);

  function recordActor(kind,x,y,tier=null){
    const existing=records.find(r=>r.kind===kind&&Math.hypot(r.x-x,r.y-y)<2.4);
    if(existing){if(tier)existing.tier=tier;return}
    records.push({kind,x,y,tier});
  }

  function captureRect(ctx,x,y,w,h){
    if(internalDraw||ctx.canvas!==canvas)return;
    const color=normalizeColor(ctx.fillStyle);
    const centerX=canvas.width/2,centerY=canvas.height/2;

    if(w===10&&h===7&&Math.abs((x+5)-centerX)<3&&Math.abs((y+1)-centerY)<3){recordActor('player',x+5,y+1,1);return}
    if(w===12&&h===10&&SLIME_TIERS.has(color)){recordActor('slime',x+6,y+5,SLIME_TIERS.get(color));return}
    if(w===8&&h===6&&ZOMBIE_TIERS.has(color)){recordActor('zombie',x+4,y+7,ZOMBIE_TIERS.get(color));return}
    if(w===10&&h===7&&color==='#4d5260'){recordActor('zombie',x+5,y+1,null);return}
    if(w===12&&h===10&&color==='#7fa9c0')recordActor('boss',x+6,y+1,4);
  }

  proto.fillRect=function(x,y,w,h){captureRect(this,x,y,w,h);return originalFillRect.call(this,x,y,w,h)};
  proto.clearRect=function(...args){
    if(!internalDraw&&this.canvas===canvas){
      records.length=0;overlayDrawn=false;frameToken++;
      const token=frameToken;
      Promise.resolve().then(()=>{if(token===frameToken&&!overlayDrawn)drawActors()});
    }
    return originalClearRect.apply(this,args);
  };
  proto.drawImage=function(source,...args){
    if(!internalDraw&&this.canvas===canvas&&source&&source!==canvas&&source.width===canvas.width&&source.height===canvas.height&&records.length)drawActors();
    return originalDrawImage.call(this,source,...args);
  };

  function drawActors(){
    if(overlayDrawn||!records.length)return;
    overlayDrawn=true;internalDraw=true;
    const ctx=canvas.getContext('2d');ctx.save();ctx.imageSmoothingEnabled=false;
    const now=performance.now();
    const player=records.find(r=>r.kind==='player');if(player)drawPlayerSprite(ctx,player,now);
    for(const state of trackActors('zombie',records.filter(r=>r.kind==='zombie')))drawZombieSprite(ctx,state,now);
    for(const slime of records.filter(r=>r.kind==='slime'))drawSlimeSprite(ctx,slime,now);
    for(const state of trackActors('boss',records.filter(r=>r.kind==='boss')))drawBossSprite(ctx,state,now);
    ctx.restore();internalDraw=false;
  }

  function trackActors(kind,current){
    const previous=trackers[kind]||[],used=new Set(),next=[],out=[];
    current.forEach((actor,index)=>{
      let best=-1,bestD=999;
      previous.forEach((p,i)=>{if(used.has(i))return;const d=Math.hypot(actor.x-p.x,actor.y-p.y);if(d<bestD&&d<16){bestD=d;best=i}});
      const prev=best>=0?previous[best]:null;if(best>=0)used.add(best);
      let dir=prev?.dir||'down',moving=false;
      if(prev){const dx=actor.x-prev.x,dy=actor.y-prev.y;moving=Math.hypot(dx,dy)>.12;if(moving)dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down')}
      const tier=actor.tier||prev?.tier||1,phase=prev?.phase??(index*97)%700;
      const tracked={...actor,tier,dir,moving,phase};next.push({x:actor.x,y:actor.y,dir,tier,phase});out.push(tracked);
    });
    trackers[kind]=next;return out;
  }

  function ready(image){return !!image&&image.complete&&image.naturalWidth>0}
  function withShadow(ctx,x,y,w=18,alpha=.28){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#07100d';ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y),w/2,3,0,0,Math.PI*2);originalFill.call(ctx);ctx.restore()}
  function drawFrame(ctx,image,sx,sy,sw,sh,dx,dy,dw,dh){if(!ready(image))return false;originalDrawImage.call(ctx,image,sx,sy,sw,sh,Math.round(dx),Math.round(dy),dw,dh);return true}

  // ninja.png: 3 x 5 grid of 32px frames. Rows 0-3 are directional movement; row 4 is attack.
  function ninjaFrame(dir,moving,attacking,now,phase=0){
    const row=attacking?4:({down:0,left:1,right:2,up:3}[dir]??0);
    const col=attacking?Math.floor(now/80)%3:(moving?Math.floor((now+phase)/155)%3:1);
    return{sx:col*32,sy:row*32};
  }

  function drawPlayerSprite(ctx,p,now){
    const image=images.hero;if(!ready(image))return;
    const moving=activeDirections.size>0,attacking=now<attackUntil,frame=ninjaFrame(playerDir,moving,attacking,now);
    withShadow(ctx,p.x,p.y+8,20,.32);drawFrame(ctx,image,frame.sx,frame.sy,32,32,p.x-16,p.y-21,32,32);
    if(attacking){ctx.save();ctx.globalAlpha=.8;ctx.strokeStyle='#fff2ae';ctx.lineWidth=2;const a={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[playerDir]||0;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*10,p.y+Math.sin(a)*10,8,a-.8,a+.8);ctx.stroke();ctx.restore()}
  }

  function drawZombieSprite(ctx,z,now){
    const image=images.zombie;if(!ready(image))return;
    const row={down:0,left:1,up:2,right:3}[z.dir]??0,col=z.moving?Math.floor((now+(z.phase||0))/210)%3:1;
    const aura=['','#83d76f','#ee8b72','#d7eef7','#a49ae8'][z.tier]||'';
    if(z.tier>1){ctx.save();ctx.globalAlpha=.18+.04*z.tier;ctx.fillStyle=aura;ctx.beginPath();ctx.ellipse(z.x,z.y+7,12,5,0,0,Math.PI*2);originalFill.call(ctx);ctx.restore()}
    withShadow(ctx,z.x,z.y+8,18,.3);drawFrame(ctx,image,col*32,row*32,32,32,z.x-16,z.y-23,32,32);
  }

  function drawSlimeSprite(ctx,s,now){
    const image=images.slime;if(!ready(image))return;
    const row={1:3,2:1,3:2,4:5}[s.tier||1]??3,col=Math.floor((now+(s.x+s.y)*17)/120)%8,bob=Math.sin((now+s.x*37)/150)*1.2;
    withShadow(ctx,s.x,s.y+7,18,.24);drawFrame(ctx,image,col*32,row*32,32,32,s.x-15,s.y-20+bob,30,30);
  }

  function drawBossSprite(ctx,b,now){
    const image=images.boss;if(!ready(image))return;
    const burst=Math.floor(now/650)%5===0,frame=ninjaFrame(b.dir,b.moving,burst,now,b.phase||0);
    ctx.save();const pulse=14+Math.sin(now/180)*2;ctx.globalAlpha=.22;ctx.fillStyle='#89e5ff';ctx.beginPath();ctx.arc(b.x,b.y-5,pulse,0,Math.PI*2);originalFill.call(ctx);ctx.globalAlpha=.42;ctx.strokeStyle='#d9f7ff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y-5,pulse+5,0,Math.PI*2);ctx.stroke();ctx.restore();
    withShadow(ctx,b.x,b.y+11,27,.34);
    ctx.save();ctx.filter='hue-rotate(145deg) saturate(1.35) brightness(1.15)';drawFrame(ctx,image,frame.sx,frame.sy,32,32,b.x-24,b.y-32,48,48);ctx.restore();
  }

  function setDirection(dir,on){if(on){activeDirections.add(dir);playerDir=dir}else activeDirections.delete(dir)}
  const keyMap={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'};
  window.addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(keyMap[key])setDirection(keyMap[key],true);if(!event.repeat&&(key==='c'||event.code==='Space'))attackUntil=performance.now()+240},true);
  window.addEventListener('keyup',event=>{const dir=keyMap[event.key.toLowerCase()];if(dir)setDirection(dir,false)},true);
  window.addEventListener('blur',()=>activeDirections.clear());
  document.querySelectorAll('[data-move]').forEach(button=>{const dir=button.dataset.move;button.addEventListener('pointerdown',()=>setDirection(dir,true),true);for(const type of ['pointerup','pointercancel','pointerleave'])button.addEventListener(type,()=>setDirection(dir,false),true)});
  document.getElementById('mobileAction')?.addEventListener('pointerdown',()=>{attackUntil=performance.now()+240},true);
})();
