'use strict';

(() => {
  const $=id=>document.getElementById(id);
  let canvas,ctx,colorInput,brushInput,eraserBtn,clearBtn;
  let paintLayer,paintCtx,maskCanvas,maskCtx;
  let drawing=false;
  let erasing=false;
  let last=null;
  let onChange=()=>{};
  let initialized=false;

  function personShape(target){
    target.save();
    target.fillStyle='#fff';
    target.beginPath();
    target.arc(96,62,29,0,Math.PI*2);
    target.fill();
    target.beginPath();
    target.roundRect(48,92,96,66,28);
    target.fill();
    target.restore();
  }

  function buildMask(){
    maskCtx.clearRect(0,0,192,192);
    personShape(maskCtx);
  }

  function render(){
    ctx.clearRect(0,0,192,192);
    ctx.save();
    ctx.fillStyle='#0f1724';
    ctx.beginPath();
    ctx.arc(96,96,89,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.24)';
    ctx.lineWidth=5;
    ctx.stroke();

    personShape(ctx);
    ctx.drawImage(paintLayer,0,0);
    ctx.restore();
  }

  function resetIcon(){
    paintCtx.clearRect(0,0,192,192);
    render();
  }

  function emit(){
    try{onChange(canvas.toDataURL('image/png'));}catch(_){}
  }

  function point(e){
    const r=canvas.getBoundingClientRect();
    return {
      x:(e.clientX-r.left)*(192/r.width),
      y:(e.clientY-r.top)*(192/r.height)
    };
  }

  function insidePerson(p){
    try{
      return maskCtx.getImageData(
        Math.max(0,Math.min(191,Math.round(p.x))),
        Math.max(0,Math.min(191,Math.round(p.y))),
        1,1
      ).data[3]>0;
    }catch(_){
      return false;
    }
  }

  function applyMask(){
    paintCtx.save();
    paintCtx.globalCompositeOperation='destination-in';
    paintCtx.drawImage(maskCanvas,0,0);
    paintCtx.restore();
  }

  function dot(p){
    if(!insidePerson(p)) return;
    paintCtx.save();
    paintCtx.lineCap='round';
    paintCtx.lineJoin='round';
    paintCtx.lineWidth=Number(brushInput.value)||12;
    if(erasing){
      paintCtx.globalCompositeOperation='destination-out';
      paintCtx.strokeStyle='rgba(0,0,0,1)';
    }else{
      paintCtx.globalCompositeOperation='source-over';
      paintCtx.strokeStyle=colorInput.value;
    }
    paintCtx.beginPath();
    paintCtx.moveTo(p.x,p.y);
    paintCtx.lineTo(p.x+.01,p.y+.01);
    paintCtx.stroke();
    paintCtx.restore();
    if(!erasing) applyMask();
    render();
  }

  function strokeTo(p){
    if(!last){last=p;dot(p);return;}
    paintCtx.save();
    paintCtx.lineCap='round';
    paintCtx.lineJoin='round';
    paintCtx.lineWidth=Number(brushInput.value)||12;
    if(erasing){
      paintCtx.globalCompositeOperation='destination-out';
      paintCtx.strokeStyle='rgba(0,0,0,1)';
    }else{
      paintCtx.globalCompositeOperation='source-over';
      paintCtx.strokeStyle=colorInput.value;
    }
    paintCtx.beginPath();
    paintCtx.moveTo(last.x,last.y);
    paintCtx.lineTo(p.x,p.y);
    paintCtx.stroke();
    paintCtx.restore();
    if(!erasing) applyMask();
    render();
    last=p;
  }

  function pointerDown(e){
    const p=point(e);
    if(!insidePerson(p)) return;
    drawing=true;
    last=p;
    canvas.setPointerCapture?.(e.pointerId);
    dot(p);
  }

  function pointerMove(e){
    if(!drawing) return;
    strokeTo(point(e));
  }

  function pointerUp(e){
    if(!drawing) return;
    strokeTo(point(e));
    drawing=false;
    last=null;
    emit();
  }

  function setAvatar(data){
    if(!initialized || !data) return;
    const img=new Image();
    img.onload=()=>{
      paintCtx.clearRect(0,0,192,192);
      paintCtx.drawImage(img,0,0,192,192);
      applyMask();
      render();
    };
    img.src=data;
  }

  function getAvatar(){
    if(!initialized) return null;
    try{return canvas.toDataURL('image/png');}catch(_){return null;}
  }

  function setOpponent(data,name='Opponent'){
    const box=$('waitingOpponent');
    const img=$('waitingOpponentAvatar');
    const label=$('waitingOpponentLabel');
    if(!box||!img||!label) return;
    if(data){
      img.src=data;
      label.textContent=name+' icon';
      box.hidden=false;
    }else{
      box.hidden=true;
      img.removeAttribute('src');
    }
  }

  function setStudioVisible(visible){
    const studio=$('avatarStudio');
    if(studio) studio.hidden=!visible;
  }

  function setMatchAvatars(players=[]){
    for(let i=0;i<2;i++){
      const img=$('p'+i+'AvatarMatch');
      if(!img) continue;
      const data=players[i]?.avatar;
      if(data){
        img.src=data;
        img.hidden=false;
      }else{
        img.hidden=true;
        img.removeAttribute('src');
      }
    }
  }

  function init(options={}){
    if(initialized) return;
    canvas=$('avatarCanvas');
    ctx=canvas?.getContext('2d');
    colorInput=$('avatarColor');
    brushInput=$('avatarBrush');
    eraserBtn=$('avatarEraser');
    clearBtn=$('avatarClear');
    if(!canvas||!ctx||!colorInput||!brushInput||!eraserBtn||!clearBtn) return;

    paintLayer=document.createElement('canvas');
    paintLayer.width=192;paintLayer.height=192;
    paintCtx=paintLayer.getContext('2d');

    maskCanvas=document.createElement('canvas');
    maskCanvas.width=192;maskCanvas.height=192;
    maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true});

    onChange=typeof options.onChange==='function'?options.onChange:()=>{};
    initialized=true;
    buildMask();
    resetIcon();

    canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointermove',pointerMove);
    canvas.addEventListener('pointerup',pointerUp);
    canvas.addEventListener('pointercancel',pointerUp);

    eraserBtn.addEventListener('click',()=>{
      erasing=!erasing;
      eraserBtn.classList.toggle('active',erasing);
      eraserBtn.textContent=erasing?'Painting':'Eraser';
    });

    clearBtn.addEventListener('click',()=>{
      resetIcon();
      emit();
    });
  }

  window.StreetblendAvatar={
    init,
    setAvatar,
    getAvatar,
    setOpponent,
    setStudioVisible,
    setMatchAvatars
  };
})();