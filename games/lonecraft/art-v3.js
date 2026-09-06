(() => {
  'use strict';

  const canvas=document.getElementById('gameCanvas');
  if(!canvas)return;

  const S=window.LonecraftSprites||{};
  const shell=document.getElementById('gameShell');
  shell?.classList.add('lonecraft-v3','lonecraft-sprite-edition');

  const sources={
    player:S.player?.url,
    zombie:S.zombie?.url,
    slime:S.slime?.url,
    boss:S.boss?.url,
    treeLight:S.environment?.treeLight?.url,
    treeDark:S.environment?.treeDark?.url
  };

  const images={};
  if(typeof Image==='function'){
    for(const [name,url] of Object.entries(sources)){
      if(!url)continue;
      const image=new Image();
      image.decoding='async';
      image.referrerPolicy='no-referrer';
      image.src=url;
      images[name]=image;
    }
  }

  const ready=name=>!!images[name]&&images[name].complete&&images[name].naturalWidth>0;
  const norm=value=>String(value||'').toLowerCase().replace(/\s+/g,'');
  const near=(a,b,t=2.5)=>Math.abs(a-b)<=t;

  const SLIME_COLORS=new Map([
    ['#4ba44e',1],['#a15745',2],['#d4d5d0',3],['#242a30',4]
  ]);
  const ZOMBIE_COLORS=new Map([
    ['#5b9f57',1],['#9b5a45',2],['#d0d1ca',3],['#2a3032',4]
  ]);

  const proto=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
  if(!proto||proto.__lonecraftV3)return;
  proto.__lonecraftV3=true;

  const originalFillRect=proto.fillRect;
  const originalClearRect=proto.clearRect;
  const originalDrawImage=proto.drawImage;
  const originalFill=proto.fill;

  let internal=false;
  let suppress=null;
  let previous={zombie:[],boss:[]};
  let current={zombie:[],boss:[]};
  let usedPrevious={zombie:new Set(),boss:new Set()};
  const activeDirections=new Set();
  let playerDir='down';
  let attackUntil=0;

  function beginFrame(){
    previous=current;
    current={zombie:[],boss:[]};
    usedPrevious={zombie:new Set(),boss:new Set()};
    suppress=null;
  }

  function matchesSuppressedPart(kind,w,h){
    if(kind==='player')return (w===10&&h===7)||(w===3&&h===4)||(w===2&&h===1)||(w===1&&h===1);
    if(kind==='zombie')return (w===10&&h===7)||(w===1&&h===1);
    if(kind==='slime')return w===2&&h===2;
    if(kind==='boss')return (w===12&&h===10)||(w===2&&h===2)||(w===3&&h===5);
    if(kind==='tree')return (w===12&&h===10)||(w===8&&h===3)||(w===4&&h===4);
    return false;
  }

  function track(kind,x,y,tier=1){
    const list=previous[kind]||[];
    const used=usedPrevious[kind]||new Set();
    let best=-1,bestD=Infinity;
    for(let i=0;i<list.length;i++){
      if(used.has(i))continue;
      const d=Math.hypot(x-list[i].x,y-list[i].y);
      if(d<bestD&&d<18){bestD=d;best=i}
    }
    const prev=best>=0?list[best]:null;
    if(best>=0)used.add(best);
    let dir=prev?.dir||'down',moving=false;
    if(prev){
      const dx=x-prev.x,dy=y-prev.y;
      moving=Math.hypot(dx,dy)>.04;
      if(moving)dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
      if(tier===1&&prev.tier)tier=prev.tier;
    }
    const phase=prev?.phase??Math.floor(Math.random()*700);
    const state={x,y,tier,dir,moving,phase};
    current[kind].push(state);
    return state;
  }

  function shadow(ctx,x,y,w,alpha=.25){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.fillStyle='#06100d';
    ctx.beginPath();
    ctx.ellipse(Math.round(x),Math.round(y),w/2,2.6,0,0,Math.PI*2);
    originalFill.call(ctx);
    ctx.restore();
  }

  function frameDraw(ctx,image,sx,sy,sw,sh,dx,dy,dw,dh){
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    originalDrawImage.call(ctx,image,sx,sy,sw,sh,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));
    ctx.restore();
  }

  function drawPlayer(ctx,x,y){
    const cfg=S.player;if(!cfg||!ready('player'))return false;
    const now=performance.now(),moving=activeDirections.size>0,attacking=now<attackUntil;
    const col=cfg.animation.directions[playerDir]??0;
    const rows=attacking?(cfg.animation.attack||[4]):moving?(cfg.animation.walk||[0,1,2,3]):(cfg.animation.idle||[0]);
    const fps=cfg.animation.fps||7;
    const row=rows[Math.floor(now/(1000/fps))%rows.length];
    const {w:sw,h:sh}=cfg.cell,{w,h,anchorX,anchorY}=cfg.render;
    shadow(ctx,x,y+3,14,.24);
    frameDraw(ctx,images.player,col*sw,row*sh,sw,sh,x-anchorX,y-anchorY,w,h);
    return true;
  }

  function drawZombie(ctx,x,y,tier){
    const cfg=S.zombie;if(!cfg||!ready('zombie'))return false;
    const z=track('zombie',x,y,tier),now=performance.now();
    const row=cfg.animation.directions[z.dir]??0;
    const frames=z.moving?(cfg.animation.walk||[0,1,2]):(cfg.animation.idle||[1]);
    const fps=cfg.animation.fps||5;
    const col=frames[Math.floor((now+z.phase)/(1000/fps))%frames.length];
    const {w:sw,h:sh}=cfg.cell,{w,h,anchorX,anchorY}=cfg.render;
    if(z.tier>1){
      const aura=['','#83d76f','#ee8b72','#d7eef7','#a49ae8'][z.tier]||'#a49ae8';
      ctx.save();ctx.globalAlpha=.16+.03*z.tier;ctx.fillStyle=aura;ctx.beginPath();ctx.ellipse(x,y+3,11,4,0,0,Math.PI*2);originalFill.call(ctx);ctx.restore();
    }
    shadow(ctx,x,y+3,15,.24);
    frameDraw(ctx,images.zombie,col*sw,row*sh,sw,sh,x-anchorX,y-anchorY,w,h);
    return true;
  }

  function drawSlime(ctx,x,y,tier){
    const cfg=S.slime;if(!cfg||!ready('slime'))return false;
    const now=performance.now(),row=cfg.tierRows?.[tier]??3;
    const frames=cfg.animation.walk||[0,1,2,3,4,5,6,7],fps=cfg.animation.fps||8;
    const col=frames[Math.floor((now+(x+y)*11)/(1000/fps))%frames.length];
    const bob=Math.sin((now+x*17)/145)*.8;
    const {w:sw,h:sh}=cfg.cell,{w,h,anchorX,anchorY}=cfg.render;
    shadow(ctx,x,y+3,13,.2);
    frameDraw(ctx,images.slime,col*sw,row*sh,sw,sh,x-anchorX,y-anchorY+bob,w,h);
    return true;
  }

  function drawBoss(ctx,x,y){
    const cfg=S.boss;if(!cfg||!ready('boss'))return false;
    const b=track('boss',x,y,4),now=performance.now();
    const sw=cfg.cell.w,sh=cfg.cell.h,cols=Math.max(1,Math.floor(images.boss.naturalWidth/sw)),rows=Math.max(1,Math.floor(images.boss.naturalHeight/sh));
    const cycle=Math.floor(now/620)%4,casting=cycle===0&&rows>1;
    const row=casting?Math.min(cfg.animation.attackRow??1,rows-1):0;
    const col=Math.floor((now+b.phase)/(1000/(cfg.animation.fps||6)))%Math.min(cols,5);
    const bob=Math.sin((now+b.phase)/260)*1.6;
    const {w,h,anchorX,anchorY}=cfg.render;

    shadow(ctx,x,y+5,20,.22);
    ctx.save();
    const pulse=12+Math.sin(now/190)*1.5;
    ctx.globalAlpha=casting?.24:.13;ctx.fillStyle='#8fe8ff';ctx.beginPath();ctx.arc(x,y-7+bob,pulse,0,Math.PI*2);originalFill.call(ctx);
    ctx.globalAlpha=.55;ctx.strokeStyle='#d8f8ff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y-7+bob,pulse+4,0,Math.PI*2);ctx.stroke();
    if(casting){
      for(let i=0;i<3;i++){
        const a=now*.004+i*2.094,r=15+i*2;
        ctx.fillStyle='#d9fbff';ctx.globalAlpha=.55;originalFillRect.call(ctx,Math.round(x+Math.cos(a)*r),Math.round(y-7+bob+Math.sin(a)*r),2,2);
      }
    }
    ctx.restore();
    frameDraw(ctx,images.boss,col*sw,row*sh,sw,sh,x-anchorX,y-anchorY+bob,w,h);
    return true;
  }

  function drawTree(ctx,trunkX,trunkY){
    const cfg=S.environment?.treeLight;if(!cfg||!ready('treeLight'))return false;
    const tileX=trunkX-6,tileY=trunkY-8;
    const baseX=tileX+8,baseY=tileY+16;
    const {w,h,anchorX,anchorY}=cfg.render;
    const image=images.treeLight;
    shadow(ctx,baseX,baseY-1,17,.17);
    ctx.save();ctx.imageSmoothingEnabled=false;
    originalDrawImage.call(ctx,image,0,0,image.naturalWidth,image.naturalHeight,Math.round(baseX-anchorX),Math.round(baseY-anchorY),w,h);
    ctx.restore();
    return true;
  }

  proto.clearRect=function(...args){
    if(!internal&&this.canvas===canvas)beginFrame();
    return originalClearRect.apply(this,args);
  };

  proto.fillRect=function(x,y,w,h){
    if(internal||this.canvas!==canvas)return originalFillRect.call(this,x,y,w,h);
    const color=norm(this.fillStyle);

    if(suppress){
      if(matchesSuppressedPart(suppress,w,h))return;
      suppress=null;
    }

    internal=true;
    try{
      if(w===4&&h===8&&color==='#4c3320'&&drawTree(this,x,y)){suppress='tree';return}

      const cx=canvas.width/2,cy=canvas.height/2;
      if(w===8&&h===6&&near(x+4,cx,5)&&near(y+7,cy,5)&&(color==='#e3caa4'||color==='#fff')){
        if(drawPlayer(this,x+4,y+7)){suppress='player';return}
      }

      if(w===8&&h===6&&(ZOMBIE_COLORS.has(color)||color==='#fff')){
        const tier=ZOMBIE_COLORS.get(color)||1;
        if(drawZombie(this,x+4,y+7,tier)){suppress='zombie';return}
      }

      if(w===12&&h===10&&(SLIME_COLORS.has(color)||color==='#fff')){
        const tier=SLIME_COLORS.get(color)||1;
        if(drawSlime(this,x+6,y+5,tier)){suppress='slime';return}
      }

      if(w===10&&h===7&&(color==='#bfe7f2'||color==='#fff')){
        if(drawBoss(this,x+5,y+8)){suppress='boss';return}
      }
    }finally{internal=false}

    return originalFillRect.call(this,x,y,w,h);
  };

  function setDirection(dir,on){
    if(on){activeDirections.add(dir);playerDir=dir}else activeDirections.delete(dir);
  }
  const keyMap={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'};
  window.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    if(keyMap[key])setDirection(keyMap[key],true);
    if(!event.repeat&&(key==='c'||event.code==='Space'))attackUntil=performance.now()+240;
  },true);
  window.addEventListener('keyup',event=>{const dir=keyMap[event.key.toLowerCase()];if(dir)setDirection(dir,false)},true);
  window.addEventListener('blur',()=>activeDirections.clear());
  document.getElementById('mobileAction')?.addEventListener('pointerdown',()=>{attackUntil=performance.now()+240},true);

  const joystick=document.getElementById('joystick');
  const knob=document.getElementById('joystickKnob');
  if(joystick&&knob){
    const held={up:false,down:false,left:false,right:false};
    const keyFor={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
    let pointerId=null;

    const dispatch=(dir,on)=>{
      if(held[dir]===on)return;
      held[dir]=on;
      window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{key:keyFor[dir],bubbles:true}));
    };
    const release=()=>{
      ['up','down','left','right'].forEach(dir=>dispatch(dir,false));
      knob.style.transform='translate3d(0,0,0)';
      joystick.classList.remove('active');
      pointerId=null;
    };
    const update=e=>{
      const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      let dx=e.clientX-cx,dy=e.clientY-cy;
      const max=Math.max(24,Math.min(rect.width,rect.height)*.31),dist=Math.hypot(dx,dy);
      if(dist>max){dx=dx/dist*max;dy=dy/dist*max}
      const nx=dx/max,ny=dy/max,m=Math.hypot(nx,ny);
      knob.style.transform=`translate3d(${dx}px,${dy}px,0)`;
      if(m<.23){['up','down','left','right'].forEach(dir=>dispatch(dir,false));return}
      dispatch('left',nx<-.32);dispatch('right',nx>.32);dispatch('up',ny<-.32);dispatch('down',ny>.32);
    };
    joystick.addEventListener('pointerdown',e=>{e.preventDefault();pointerId=e.pointerId;joystick.setPointerCapture?.(pointerId);joystick.classList.add('active');update(e)});
    joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointerId){e.preventDefault();update(e)}});
    joystick.addEventListener('pointerup',e=>{if(e.pointerId===pointerId)release()});
    joystick.addEventListener('pointercancel',release);
    window.addEventListener('blur',release);
  }

  const title=document.querySelector('.title-art');
  if(title){
    title.innerHTML='<div class="sprite-title-stage"><div class="sprite-title-hero"></div><div class="sprite-title-slime"></div><div class="sprite-title-shadow hero-shadow"></div><div class="sprite-title-shadow slime-shadow"></div></div>';
    const hero=title.querySelector('.sprite-title-hero'),slime=title.querySelector('.sprite-title-slime');
    if(hero&&S.player?.url){hero.style.backgroundImage=`url("${S.player.url}")`;hero.style.backgroundSize='128px 224px';hero.style.backgroundPosition='0 0'}
    if(slime&&S.slime?.url){slime.style.backgroundImage=`url("${S.slime.url}")`;slime.style.backgroundSize='256px 256px';slime.style.backgroundPosition='0 -96px'}
  }
})();
