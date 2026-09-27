'use strict';

(() => {
  const $=id=>document.getElementById(id);
  let canvas,ctx,colorInput,brushInput,eraserBtn,clearBtn;
  let drawing=false;
  let erasing=false;
  let last=null;
  let onChange=()=>{};
  let initialized=false;

  function drawBase(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.fillStyle='#0f1724';
    ctx.beginPath();
    ctx.arc(64,64,60,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.24)';
    ctx.lineWidth=4;
    ctx.stroke();

    ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.arc(64,43,20,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(34,66,60,42,18);
    ctx.fill();
    ctx.restore();
  }

  function emit(){
    try{onChange(canvas.toDataURL('image/png'));}catch(_){}
  }

  function point(e){
    const r=canvas.getBoundingClientRect();
    return {
      x:(e.clientX-r.left)*(canvas.width/r.width),
      y:(e.clientY-r.top)*(canvas.height/r.height)
    };
  }

  function strokeTo(p){
    if(!last){last=p;return;}
    ctx.save();
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.lineWidth=Number(brushInput.value)||10;
    if(erasing){
      ctx.globalCompositeOperation='destination-out';
      ctx.strokeStyle='rgba(0,0,0,1)';
    }else{
      ctx.globalCompositeOperation='source-over';
      ctx.strokeStyle=colorInput.value;
    }
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
    ctx.restore();
    last=p;
  }

  function pointerDown(e){
    drawing=true;
    last=point(e);
    canvas.setPointerCapture?.(e.pointerId);
    strokeTo(last);
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
    if(!initialized) return;
    if(!data){
      drawBase();
      return;
    }
    const img=new Image();
    img.onload=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
    };
    img.onerror=drawBase;
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

    onChange=typeof options.onChange==='function'?options.onChange:()=>{};
    initialized=true;
    drawBase();

    canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointermove',pointerMove);
    canvas.addEventListener('pointerup',pointerUp);
    canvas.addEventListener('pointercancel',pointerUp);

    eraserBtn.addEventListener('click',()=>{
      erasing=!erasing;
      eraserBtn.classList.toggle('active',erasing);
      eraserBtn.textContent=erasing?'Drawing':'Eraser';
    });

    clearBtn.addEventListener('click',()=>{
      drawBase();
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