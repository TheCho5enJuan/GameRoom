(() => {
  'use strict';

  const MANIFEST=window.LonecraftSprites||{};
  const ids=['imageUrl','cellW','cellH','offsetX','offsetY','gapX','gapY','frameCol','frameRow','trimL','trimT','trimR','trimB','renderW','renderH','anchorX','anchorY','collisionR','rowDown','rowLeft','rowRight','rowUp','frameSequence','fps','zoom'];
  const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  Object.assign(el,{
    presetTitle:document.getElementById('presetTitle'),presetRow:document.getElementById('presetRow'),loadStatus:document.getElementById('loadStatus'),sheetMeta:document.getElementById('sheetMeta'),selectedLabel:document.getElementById('selectedLabel'),zoomValue:document.getElementById('zoomValue'),sourceLink:document.getElementById('sourceLink'),reloadImage:document.getElementById('reloadImage'),sheetCanvas:document.getElementById('sheetCanvas'),previewCanvas:document.getElementById('previewCanvas'),animationCanvas:document.getElementById('animationCanvas'),rectReadout:document.getElementById('rectReadout'),checks:document.getElementById('checks'),configOutput:document.getElementById('configOutput'),copyConfig:document.getElementById('copyConfig'),toggleAnimation:document.getElementById('toggleAnimation')
  });

  const sctx=el.sheetCanvas.getContext('2d'),pctx=el.previewCanvas.getContext('2d'),actx=el.animationCanvas.getContext('2d');
  [sctx,pctx,actx].forEach(ctx=>ctx.imageSmoothingEnabled=false);
  let preset='player',cfg=null,image=new Image(),imageReady=false,animating=true,animFrame=0,lastAnim=0;
  image.decoding='async';image.referrerPolicy='no-referrer';

  const num=(id,fallback=0)=>{const v=Number(el[id]?.value);return Number.isFinite(v)?v:fallback};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const parseSeq=()=>String(el.frameSequence.value||'0').split(',').map(v=>Math.floor(Number(v.trim()))).filter(v=>Number.isFinite(v)&&v>=0);
  const sequence=()=>parseSeq().length?parseSeq():[0];

  function grid(){
    const cw=Math.max(1,num('cellW',32)),ch=Math.max(1,num('cellH',32)),ox=Math.max(0,num('offsetX')),oy=Math.max(0,num('offsetY')),gx=Math.max(0,num('gapX')),gy=Math.max(0,num('gapY'));
    const cols=imageReady?Math.max(0,Math.floor((image.naturalWidth-ox+gx)/(cw+gx))):0;
    const rows=imageReady?Math.max(0,Math.floor((image.naturalHeight-oy+gy)/(ch+gy))):0;
    return{cw,ch,ox,oy,gx,gy,cols,rows};
  }

  function frameRect(col=Math.floor(num('frameCol')),row=Math.floor(num('frameRow'))){
    const g=grid(),l=Math.max(0,num('trimL')),t=Math.max(0,num('trimT')),r=Math.max(0,num('trimR')),b=Math.max(0,num('trimB'));
    return{x:g.ox+col*(g.cw+g.gx)+l,y:g.oy+row*(g.ch+g.gy)+t,w:Math.max(1,g.cw-l-r),h:Math.max(1,g.ch-t-b),col,row,l,t,r,b};
  }

  function setStatus(text,kind='neutral'){el.loadStatus.textContent=text;el.loadStatus.className=`status ${kind}`}

  function applyPreset(name){
    cfg=MANIFEST[name]||MANIFEST.player;preset=name;
    if(!cfg)return;
    el.presetTitle.textContent=cfg.title;el.imageUrl.value=cfg.url;el.sourceLink.href=cfg.source;
    const c=cfg.cell,r=cfg.render,a=cfg.animation;
    el.cellW.value=c.w;el.cellH.value=c.h;el.offsetX.value=c.offsetX||0;el.offsetY.value=c.offsetY||0;el.gapX.value=c.gapX||0;el.gapY.value=c.gapY||0;
    el.trimL.value=0;el.trimT.value=0;el.trimR.value=0;el.trimB.value=0;
    el.renderW.value=r.w;el.renderH.value=r.h;el.anchorX.value=r.anchorX;el.anchorY.value=r.anchorY;el.collisionR.value=r.collisionR;
    const dirs=a.directions||{};
    el.rowDown.value=dirs.down??0;el.rowLeft.value=dirs.left??0;el.rowRight.value=dirs.right??0;el.rowUp.value=dirs.up??0;
    el.frameSequence.value=(a.walk||a.idle||[0]).join(',');el.fps.value=a.fps||6;
    if(a.axis==='columns'){
      el.frameCol.value=dirs.down??0;el.frameRow.value=(a.idle||[0])[0]||0;
    }else{
      el.frameCol.value=(a.idle||[0])[0]||0;el.frameRow.value=dirs.down??0;
    }
    [...el.presetRow.querySelectorAll('button')].forEach(b=>b.classList.toggle('active',b.dataset.preset===name));
    updateDirectionLegend();loadImage();
  }

  function updateDirectionLegend(){
    const legend=document.querySelector('.controls-panel fieldset:last-of-type legend');
    if(legend)legend.textContent=`Animation map · directions use ${cfg?.animation?.axis==='columns'?'COLUMNS':'ROWS'}`;
    const labels=[['rowDown','Down'],['rowLeft','Left'],['rowRight','Right'],['rowUp','Up']];
    labels.forEach(([id,name])=>{const label=el[id]?.closest('label');if(label)label.childNodes[0].nodeValue=`${name} ${cfg?.animation?.axis==='columns'?'column':'row'}`});
  }

  function loadImage(){
    imageReady=false;setStatus('Loading…');image=new Image();image.decoding='async';image.referrerPolicy='no-referrer';
    image.onload=()=>{imageReady=true;setStatus('Loaded','ok');el.sheetMeta.textContent=`${image.naturalWidth} × ${image.naturalHeight}px`;fitSelection();renderAll()};
    image.onerror=()=>{imageReady=false;setStatus('Image failed','bad');el.sheetMeta.textContent='';renderAll()};
    image.src=el.imageUrl.value.trim();
  }

  function fitSelection(){const g=grid();el.frameCol.value=clamp(Math.floor(num('frameCol')),0,Math.max(0,g.cols-1));el.frameRow.value=clamp(Math.floor(num('frameRow')),0,Math.max(0,g.rows-1))}

  function renderSheet(){
    const z=clamp(Math.round(num('zoom',2)),1,6);el.zoomValue.textContent=`${z}×`;
    const w=imageReady?image.naturalWidth*z:384,h=imageReady?image.naturalHeight*z:260;
    el.sheetCanvas.width=Math.max(1,w);el.sheetCanvas.height=Math.max(1,h);sctx.imageSmoothingEnabled=false;sctx.clearRect(0,0,w,h);
    if(!imageReady){sctx.fillStyle='#9aa89b';sctx.font='14px sans-serif';sctx.fillText('Image unavailable',18,28);return}
    sctx.drawImage(image,0,0,w,h);
    const g=grid(),sc=Math.floor(num('frameCol')),sr=Math.floor(num('frameRow'));
    sctx.textBaseline='top';sctx.font=`${Math.max(9,Math.min(18,z*5))}px monospace`;
    for(let row=0;row<g.rows;row++)for(let col=0;col<g.cols;col++){
      const x=(g.ox+col*(g.cw+g.gx))*z,y=(g.oy+row*(g.ch+g.gy))*z,cw=g.cw*z,ch=g.ch*z,selected=col===sc&&row===sr;
      sctx.strokeStyle=selected?'#ffdd66':'rgba(255,255,255,.58)';sctx.lineWidth=selected?3:1;sctx.strokeRect(x+.5,y+.5,cw-1,ch-1);
      sctx.fillStyle=selected?'#ffdd66':'rgba(255,255,255,.85)';sctx.fillText(`${col},${row}`,x+3,y+3);
    }
    el.selectedLabel.textContent=`Selected row ${sr} · col ${sc}`;
  }

  function checker(ctx,w,h){ctx.fillStyle='#08100d';ctx.fillRect(0,0,w,h);for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=16)if(((x+y)/16)%2===0){ctx.fillStyle='#101915';ctx.fillRect(x,y,16,16)}}
  function cross(ctx,x,y){ctx.save();ctx.strokeStyle='#f1ca67';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+12,y);ctx.moveTo(x,y-12);ctx.lineTo(x,y+12);ctx.stroke();ctx.fillStyle='#f1ca67';ctx.fillRect(x-2,y-2,4,4);ctx.restore()}

  function renderPreview(){
    const c=el.previewCanvas,w=c.width,h=c.height;checker(pctx,w,h);if(!imageReady)return;
    const q=frameRect(),rw=Math.max(1,num('renderW')),rh=Math.max(1,num('renderH')),ax=num('anchorX'),ay=num('anchorY'),ox=w/2,oy=h/2+40,dx=ox-ax,dy=oy-ay;
    pctx.drawImage(image,q.x,q.y,q.w,q.h,dx,dy,rw,rh);cross(pctx,ox,oy);
    const cr=Math.max(0,num('collisionR'))*2.2;pctx.strokeStyle='#ef7f72';pctx.lineWidth=2;pctx.strokeRect(ox-cr,oy-cr,cr*2,cr*2);
    pctx.fillStyle='#d6e3d9';pctx.font='11px monospace';pctx.fillText('entity origin',ox+15,oy-6);
    el.rectReadout.textContent=`source ${q.x},${q.y} ${q.w}×${q.h} → render ${rw}×${rh} · anchor ${ax},${ay}`;
  }

  function dirIndex(dir){return Math.floor(num({down:'rowDown',left:'rowLeft',right:'rowRight',up:'rowUp'}[dir]))}
  function mappedFrame(dir,frame){
    if(cfg?.animation?.axis==='columns')return{col:dirIndex(dir),row:frame};
    return{col:frame,row:dirIndex(dir)};
  }

  function renderAnimation(now=performance.now()){
    const c=el.animationCanvas,w=c.width,h=c.height;checker(actx,w,h);
    const seq=sequence(),fps=clamp(num('fps',6),1,30);
    if(animating&&now-lastAnim>=1000/fps){animFrame=(animFrame+1)%seq.length;lastAnim=now}
    if(!imageReady)return;
    ['down','left','right','up'].forEach((dir,i)=>{
      let frame=seq[animFrame%seq.length];
      if(preset==='slime'&&cfg?.tierRows)el.rowDown.value=el.rowLeft.value=el.rowRight.value=el.rowUp.value=cfg.tierRows[1];
      const m=mappedFrame(dir,frame),q=frameRect(m.col,m.row),rw=Math.max(1,num('renderW')),rh=Math.max(1,num('renderH')),ax=num('anchorX'),ay=num('anchorY'),cx=i%2?315:105,cy=i<2?100:235;
      actx.drawImage(image,q.x,q.y,q.w,q.h,cx-ax,cy-ay,rw,rh);cross(actx,cx,cy);
      actx.fillStyle='#c8d7cc';actx.font='12px monospace';actx.textAlign='center';actx.fillText(`${dir} · c${m.col} r${m.row}`,cx,cy+36);actx.textAlign='left';
    });
  }

  function diagnostics(){
    const g=grid(),items=[];
    if(!imageReady)items.push(['bad','Image','Source image unavailable.']);else items.push(['ok','Image',`${image.naturalWidth}×${image.naturalHeight}px loaded.`]);
    if(imageReady&&g.cols&&g.rows)items.push(['ok','Grid',`${g.cols} columns × ${g.rows} rows detected at ${g.cw}×${g.ch}.`]);else items.push(['bad','Grid','No complete source cells fit.']);
    if(imageReady){const usedW=g.ox+g.cols*g.cw+Math.max(0,g.cols-1)*g.gx,usedH=g.oy+g.rows*g.ch+Math.max(0,g.rows-1)*g.gy,lw=image.naturalWidth-usedW,lh=image.naturalHeight-usedH;items.push([lw||lh?'warn':'ok','Bounds',lw||lh?`${lw}px horizontal / ${lh}px vertical remain.`:'Grid exactly matches image dimensions.'])}
    const axis=cfg?.animation?.axis||'rows',maxDir=Math.max(num('rowDown'),num('rowLeft'),num('rowRight'),num('rowUp')),maxFrame=Math.max(...sequence());
    const valid=imageReady&&(axis==='columns'?(maxDir<g.cols&&maxFrame<g.rows):(maxDir<g.rows&&maxFrame<g.cols));
    items.push([valid?'ok':'bad','Animation',valid?`${axis==='columns'?'Direction columns':'Direction rows'} and frame sequence fit the sheet.`:'Direction or animation frame exceeds the grid.']);
    items.push(['ok','Runtime',`Game and lab both read sprite-config.js for ${preset}.`]);
    el.checks.innerHTML=items.map(([k,t,d])=>`<div class="check ${k}"><b>${k==='ok'?'✓':k==='warn'?'!':'×'}</b><div><strong>${t}</strong><br>${d}</div></div>`).join('');
  }

  function output(){
    const g=grid();el.configOutput.value=JSON.stringify({preset,title:cfg?.title,url:el.imageUrl.value,naturalSize:imageReady?{width:image.naturalWidth,height:image.naturalHeight}:null,axis:cfg?.animation?.axis,grid:g,selected:{col:Math.floor(num('frameCol')),row:Math.floor(num('frameRow'))},render:{width:num('renderW'),height:num('renderH'),anchorX:num('anchorX'),anchorY:num('anchorY'),collisionRadius:num('collisionR')},directions:{down:dirIndex('down'),left:dirIndex('left'),right:dirIndex('right'),up:dirIndex('up')},sequence:sequence(),fps:num('fps')},null,2);
  }

  function renderAll(){renderSheet();renderPreview();renderAnimation();diagnostics();output()}
  el.presetRow.addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(b)applyPreset(b.dataset.preset)});
  el.reloadImage.addEventListener('click',loadImage);
  ids.forEach(id=>el[id]?.addEventListener('input',()=>{fitSelection();renderAll()}));
  el.sheetCanvas.addEventListener('click',e=>{if(!imageReady)return;const rect=el.sheetCanvas.getBoundingClientRect(),z=clamp(Math.round(num('zoom',2)),1,6),px=(e.clientX-rect.left)*(el.sheetCanvas.width/rect.width)/z,py=(e.clientY-rect.top)*(el.sheetCanvas.height/rect.height)/z,g=grid(),col=Math.floor((px-g.ox)/(g.cw+g.gx)),row=Math.floor((py-g.oy)/(g.ch+g.gy));if(col>=0&&row>=0&&col<g.cols&&row<g.rows){el.frameCol.value=col;el.frameRow.value=row;renderAll()}});
  el.toggleAnimation.addEventListener('click',()=>{animating=!animating;el.toggleAnimation.textContent=animating?'Pause':'Play'});
  el.copyConfig.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(el.configOutput.value);el.copyConfig.textContent='Copied';setTimeout(()=>el.copyConfig.textContent='Copy JSON',1000)}catch(_){el.configOutput.select()}});
  function loop(now){if(animating)renderAnimation(now);requestAnimationFrame(loop)}
  applyPreset('player');requestAnimationFrame(loop);
})();
