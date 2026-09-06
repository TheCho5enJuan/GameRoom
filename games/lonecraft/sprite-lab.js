(() => {
  'use strict';

  const PRESETS={
    player:{title:'Player',url:'https://opengameart.org/sites/default/files/ninja_3.png',source:'https://opengameart.org/content/ninja-npc-sprite-sheet',cellW:32,cellH:32,offsetX:0,offsetY:0,gapX:0,gapY:0,col:1,row:0,trimL:0,trimT:0,trimR:0,trimB:0,renderW:32,renderH:32,anchorX:16,anchorY:21,collisionR:4.3,rows:{down:0,left:1,right:2,up:3},sequence:'0,1,2',fps:6},
    zombie:{title:'Zombie',url:'https://opengameart.org/sites/default/files/zombie7_0.png',source:'https://opengameart.org/content/zombie-rpg-sprites',cellW:32,cellH:32,offsetX:0,offsetY:0,gapX:0,gapY:0,col:1,row:0,trimL:0,trimT:0,trimR:0,trimB:0,renderW:32,renderH:32,anchorX:16,anchorY:23,collisionR:4.3,rows:{down:0,left:1,right:3,up:2},sequence:'0,1,2',fps:5},
    slime:{title:'Slime',url:'https://opengameart.org/sites/default/files/smallSlimesSpriteSheet.png',source:'https://opengameart.org/content/slimes-32x32',cellW:32,cellH:32,offsetX:0,offsetY:0,gapX:0,gapY:0,col:0,row:3,trimL:0,trimT:0,trimR:0,trimB:0,renderW:30,renderH:30,anchorX:15,anchorY:20,collisionR:4.3,rows:{down:3,left:3,right:3,up:3},sequence:'0,1,2,3,4,5,6,7',fps:8},
    boss:{title:'Air Wizard',url:'https://opengameart.org/sites/default/files/ninja_3.png',source:'https://opengameart.org/content/ninja-npc-sprite-sheet',cellW:32,cellH:32,offsetX:0,offsetY:0,gapX:0,gapY:0,col:1,row:0,trimL:0,trimT:0,trimR:0,trimB:0,renderW:48,renderH:48,anchorX:24,anchorY:32,collisionR:5.2,rows:{down:0,left:1,right:2,up:3},sequence:'0,1,2',fps:6}
  };

  const ids=['imageUrl','cellW','cellH','offsetX','offsetY','gapX','gapY','frameCol','frameRow','trimL','trimT','trimR','trimB','renderW','renderH','anchorX','anchorY','collisionR','rowDown','rowLeft','rowRight','rowUp','frameSequence','fps','zoom'];
  const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  Object.assign(el,{
    presetTitle:document.getElementById('presetTitle'),presetRow:document.getElementById('presetRow'),loadStatus:document.getElementById('loadStatus'),sheetMeta:document.getElementById('sheetMeta'),selectedLabel:document.getElementById('selectedLabel'),zoomValue:document.getElementById('zoomValue'),sourceLink:document.getElementById('sourceLink'),reloadImage:document.getElementById('reloadImage'),sheetCanvas:document.getElementById('sheetCanvas'),previewCanvas:document.getElementById('previewCanvas'),animationCanvas:document.getElementById('animationCanvas'),rectReadout:document.getElementById('rectReadout'),checks:document.getElementById('checks'),configOutput:document.getElementById('configOutput'),copyConfig:document.getElementById('copyConfig'),toggleAnimation:document.getElementById('toggleAnimation')
  });

  const sheetCtx=el.sheetCanvas.getContext('2d'),previewCtx=el.previewCanvas.getContext('2d'),animCtx=el.animationCanvas.getContext('2d');
  sheetCtx.imageSmoothingEnabled=false;previewCtx.imageSmoothingEnabled=false;animCtx.imageSmoothingEnabled=false;

  let currentPreset='player',image=new Image(),imageReady=false,animating=true,lastAnim=0,animFrame=0;
  image.decoding='async';image.referrerPolicy='no-referrer';

  function n(id,fallback=0){const v=Number(el[id].value);return Number.isFinite(v)?v:fallback}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function sequence(){const maxCols=grid().cols;const values=String(el.frameSequence.value||'0').split(',').map(v=>Math.floor(Number(v.trim()))).filter(v=>Number.isFinite(v)&&v>=0&&v<Math.max(1,maxCols));return values.length?values:[0]}
  function grid(){
    const cw=Math.max(1,n('cellW',32)),ch=Math.max(1,n('cellH',32)),ox=Math.max(0,n('offsetX')),oy=Math.max(0,n('offsetY')),gx=Math.max(0,n('gapX')),gy=Math.max(0,n('gapY'));
    const cols=imageReady?Math.max(0,Math.floor((image.naturalWidth-ox+gx)/(cw+gx))):0;
    const rows=imageReady?Math.max(0,Math.floor((image.naturalHeight-oy+gy)/(ch+gy))):0;
    return{cw,ch,ox,oy,gx,gy,cols,rows};
  }
  function frameRect(col=n('frameCol'),row=n('frameRow')){
    const g=grid(),l=Math.max(0,n('trimL')),t=Math.max(0,n('trimT')),r=Math.max(0,n('trimR')),b=Math.max(0,n('trimB'));
    const x=g.ox+col*(g.cw+g.gx)+l,y=g.oy+row*(g.ch+g.gy)+t,w=Math.max(1,g.cw-l-r),h=Math.max(1,g.ch-t-b);
    return{x,y,w,h,col,row,l,t,r,b};
  }

  function setStatus(text,kind='neutral'){el.loadStatus.textContent=text;el.loadStatus.className=`status ${kind}`}
  function applyPreset(name){
    const p=PRESETS[name]||PRESETS.player;currentPreset=name;el.presetTitle.textContent=p.title;el.imageUrl.value=p.url;el.sourceLink.href=p.source;
    for(const [id,key] of [['cellW','cellW'],['cellH','cellH'],['offsetX','offsetX'],['offsetY','offsetY'],['gapX','gapX'],['gapY','gapY'],['frameCol','col'],['frameRow','row'],['trimL','trimL'],['trimT','trimT'],['trimR','trimR'],['trimB','trimB'],['renderW','renderW'],['renderH','renderH'],['anchorX','anchorX'],['anchorY','anchorY'],['collisionR','collisionR'],['frameSequence','sequence'],['fps','fps']])el[id].value=p[key];
    el.rowDown.value=p.rows.down;el.rowLeft.value=p.rows.left;el.rowRight.value=p.rows.right;el.rowUp.value=p.rows.up;
    [...el.presetRow.querySelectorAll('button')].forEach(b=>b.classList.toggle('active',b.dataset.preset===name));
    loadImage();
  }

  function loadImage(){
    imageReady=false;setStatus('Loading…');image=new Image();image.decoding='async';image.referrerPolicy='no-referrer';
    image.onload=()=>{imageReady=true;setStatus('Loaded','ok');el.sheetMeta.textContent=`${image.naturalWidth} × ${image.naturalHeight}px`;fitSelection();renderAll()};
    image.onerror=()=>{imageReady=false;setStatus('Image failed to load','bad');el.sheetMeta.textContent='';renderAll()};
    image.src=el.imageUrl.value.trim();
  }

  function fitSelection(){const g=grid();el.frameCol.value=clamp(Math.floor(n('frameCol')),0,Math.max(0,g.cols-1));el.frameRow.value=clamp(Math.floor(n('frameRow')),0,Math.max(0,g.rows-1))}

  function renderSheet(){
    const zoom=clamp(Math.round(n('zoom',4)),1,6);el.zoomValue.textContent=`${zoom}×`;
    const width=imageReady?image.naturalWidth*zoom:384,height=imageReady?image.naturalHeight*zoom:260;
    el.sheetCanvas.width=Math.max(1,width);el.sheetCanvas.height=Math.max(1,height);sheetCtx.imageSmoothingEnabled=false;sheetCtx.clearRect(0,0,width,height);
    if(!imageReady){sheetCtx.fillStyle='#9aa89b';sheetCtx.font='14px sans-serif';sheetCtx.fillText('Image unavailable',18,28);return}
    sheetCtx.drawImage(image,0,0,width,height);
    const g=grid(),selectedCol=Math.floor(n('frameCol')),selectedRow=Math.floor(n('frameRow'));
    sheetCtx.lineWidth=1;sheetCtx.font=`${Math.max(8,8*zoom/2)}px monospace`;sheetCtx.textBaseline='top';
    for(let row=0;row<g.rows;row++)for(let col=0;col<g.cols;col++){
      const x=(g.ox+col*(g.cw+g.gx))*zoom,y=(g.oy+row*(g.ch+g.gy))*zoom,w=g.cw*zoom,h=g.ch*zoom;
      const selected=col===selectedCol&&row===selectedRow;sheetCtx.strokeStyle=selected?'#ffdd66':'rgba(255,255,255,.55)';sheetCtx.lineWidth=selected?3:1;sheetCtx.strokeRect(x+.5,y+.5,w-1,h-1);
      sheetCtx.fillStyle=selected?'#ffdd66':'rgba(255,255,255,.8)';sheetCtx.fillText(`${col},${row}`,x+3,y+3);
    }
    el.selectedLabel.textContent=`Selected row ${selectedRow} · col ${selectedCol}`;
  }

  function checker(ctx,w,h){ctx.fillStyle='#0a100d';ctx.fillRect(0,0,w,h);for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=16){if(((x+y)/16)%2===0){ctx.fillStyle='#111a16';ctx.fillRect(x,y,16,16)}}}
  function drawCrosshair(ctx,x,y){ctx.save();ctx.strokeStyle='#f1ca67';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+12,y);ctx.moveTo(x,y-12);ctx.lineTo(x,y+12);ctx.stroke();ctx.fillStyle='#f1ca67';ctx.fillRect(x-2,y-2,4,4);ctx.restore()}

  function renderPreview(){
    const c=el.previewCanvas,w=c.width,h=c.height;checker(previewCtx,w,h);if(!imageReady)return;
    const r=frameRect(),rw=Math.max(1,n('renderW',32)),rh=Math.max(1,n('renderH',32)),ax=n('anchorX',rw/2),ay=n('anchorY',rh*.7),originX=w/2,originY=h/2+40,dx=originX-ax,dy=originY-ay;
    previewCtx.imageSmoothingEnabled=false;previewCtx.drawImage(image,r.x,r.y,r.w,r.h,dx,dy,rw,rh);
    drawCrosshair(previewCtx,originX,originY);
    const cr=Math.max(0,n('collisionR',4.3))*2.2;previewCtx.save();previewCtx.strokeStyle='#ef7f72';previewCtx.lineWidth=2;previewCtx.strokeRect(originX-cr,originY-cr,cr*2,cr*2);previewCtx.restore();
    previewCtx.fillStyle='#d6e3d9';previewCtx.font='11px monospace';previewCtx.fillText('entity origin',originX+15,originY-6);previewCtx.fillStyle='#9eb0a1';previewCtx.fillText(`draw: ${Math.round(dx)},${Math.round(dy)}  ${rw}×${rh}`,12,h-16);
    el.rectReadout.textContent=`source x:${r.x} y:${r.y} w:${r.w} h:${r.h}  →  draw ${rw}×${rh}  anchor ${ax},${ay}`;
  }

  function rowFor(dir){return Math.floor(n({down:'rowDown',left:'rowLeft',right:'rowRight',up:'rowUp'}[dir]))}
  function renderAnimation(now=performance.now()){
    const c=el.animationCanvas,w=c.width,h=c.height;checker(animCtx,w,h);
    const dirs=['down','left','right','up'],seq=sequence(),fps=clamp(n('fps',6),1,30);
    if(animating&&now-lastAnim>=1000/fps){animFrame=(animFrame+1)%seq.length;lastAnim=now}
    if(imageReady){
      dirs.forEach((dir,i)=>{
        const col=seq[animFrame%seq.length],row=rowFor(dir),r=frameRect(col,row),rw=Math.max(1,n('renderW',32)),rh=Math.max(1,n('renderH',32)),ax=n('anchorX',rw/2),ay=n('anchorY',rh*.7);
        const cx=(i%2?315:105),cy=(i<2?100:235),dx=cx-ax,dy=cy-ay;
        animCtx.drawImage(image,r.x,r.y,r.w,r.h,dx,dy,rw,rh);drawCrosshair(animCtx,cx,cy);
        animCtx.fillStyle='#c8d7cc';animCtx.font='12px monospace';animCtx.textAlign='center';animCtx.fillText(`${dir}  r${row} c${col}`,cx,cy+36);animCtx.textAlign='left';
      });
    }
  }

  function diagnostics(){
    const g=grid(),r=frameRect(),items=[];
    if(!imageReady)items.push(['bad','Image','The source image is not currently available.']);
    else items.push(['ok','Image',`${image.naturalWidth}×${image.naturalHeight}px loaded.`]);
    if(imageReady&&g.cols>0&&g.rows>0)items.push(['ok','Grid',`${g.cols} columns × ${g.rows} rows fit the image.`]);else items.push(['bad','Grid','No complete cells fit these dimensions/offsets.']);
    if(imageReady){const usedW=g.ox+g.cols*g.cw+Math.max(0,g.cols-1)*g.gx,usedH=g.oy+g.rows*g.ch+Math.max(0,g.rows-1)*g.gy,leftW=image.naturalWidth-usedW,leftH=image.naturalHeight-usedH;if(leftW||leftH)items.push(['warn','Remainder',`${leftW}px horizontal / ${leftH}px vertical remain outside the calculated grid.`]);else items.push(['ok','Remainder','Grid lands exactly on the image bounds.'])}
    if(r.l+r.r>=g.cw||r.t+r.b>=g.ch)items.push(['bad','Trim','Trim removes the entire source cell.']);else items.push(['ok','Trim',`Visible source is ${r.w}×${r.h}px.`]);
    const rw=n('renderW'),rh=n('renderH'),ax=n('anchorX'),ay=n('anchorY');if(ax<0||ay<0||ax>rw||ay>rh)items.push(['warn','Anchor',`Anchor ${ax},${ay} lies outside ${rw}×${rh} render bounds.`]);else items.push(['ok','Anchor',`Anchor ${ax},${ay} is inside the rendered sprite.`]);
    const maxRow=Math.max(n('rowDown'),n('rowLeft'),n('rowRight'),n('rowUp')),maxCol=Math.max(...sequence());if(imageReady&&(maxRow>=g.rows||maxCol>=g.cols))items.push(['bad','Animation map','A row or frame index exceeds the detected grid.']);else items.push(['ok','Animation map',`Rows fit; frame sequence is [${sequence().join(', ')}].`]);
    el.checks.innerHTML=items.map(([kind,title,text])=>`<div class="check ${kind}"><b>${kind==='ok'?'✓':kind==='warn'?'!':'×'}</b><div><strong>${title}</strong><br>${text}</div></div>`).join('');
  }

  function buildConfig(){
    const g=grid(),r=frameRect();return{
      preset:currentPreset,title:el.presetTitle.textContent,imageUrl:el.imageUrl.value.trim(),naturalSize:imageReady?{width:image.naturalWidth,height:image.naturalHeight}:null,
      grid:{cellW:g.cw,cellH:g.ch,offsetX:g.ox,offsetY:g.oy,gapX:g.gx,gapY:g.gy,cols:g.cols,rows:g.rows},
      selected:{col:Math.floor(n('frameCol')),row:Math.floor(n('frameRow')),sourceRect:{x:r.x,y:r.y,w:r.w,h:r.h},trim:{left:r.l,top:r.t,right:r.r,bottom:r.b}},
      render:{width:n('renderW'),height:n('renderH'),anchorX:n('anchorX'),anchorY:n('anchorY'),collisionRadius:n('collisionR')},
      animation:{downRow:Math.floor(n('rowDown')),leftRow:Math.floor(n('rowLeft')),rightRow:Math.floor(n('rowRight')),upRow:Math.floor(n('rowUp')),frames:sequence(),fps:n('fps')}
    };
  }

  function renderAll(){fitSelection();renderSheet();renderPreview();renderAnimation();diagnostics();el.configOutput.value=JSON.stringify(buildConfig(),null,2)}

  el.presetRow.addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(b)applyPreset(b.dataset.preset)});
  el.reloadImage.addEventListener('click',loadImage);
  ids.forEach(id=>el[id].addEventListener(id==='frameSequence'||id==='imageUrl'?'input':'change',()=>{if(id==='imageUrl')return;renderAll()}));
  el.zoom.addEventListener('input',renderSheet);
  el.sheetCanvas.addEventListener('click',e=>{if(!imageReady)return;const rect=el.sheetCanvas.getBoundingClientRect(),zoom=clamp(Math.round(n('zoom',4)),1,6),px=(e.clientX-rect.left)*(el.sheetCanvas.width/rect.width)/zoom,py=(e.clientY-rect.top)*(el.sheetCanvas.height/rect.height)/zoom,g=grid(),col=Math.floor((px-g.ox)/(g.cw+g.gx)),row=Math.floor((py-g.oy)/(g.ch+g.gy));if(col>=0&&col<g.cols&&row>=0&&row<g.rows){el.frameCol.value=col;el.frameRow.value=row;renderAll()}});
  el.toggleAnimation.addEventListener('click',()=>{animating=!animating;el.toggleAnimation.textContent=animating?'Pause':'Play'});
  el.copyConfig.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(el.configOutput.value);el.copyConfig.textContent='Copied';setTimeout(()=>el.copyConfig.textContent='Copy JSON',1000)}catch(_){el.configOutput.focus();el.configOutput.select()}});

  function tick(now){renderAnimation(now);requestAnimationFrame(tick)}
  applyPreset('player');requestAnimationFrame(tick);
})();
