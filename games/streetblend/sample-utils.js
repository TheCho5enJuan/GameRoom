'use strict';

(() => {
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function aggregateColor(bufferCtx,buffer,norm,diameter){
    if(!bufferCtx || !buffer || !norm) throw new Error('Sampling unavailable.');
    const cx=clamp(Math.floor(norm.x*buffer.width),0,buffer.width-1);
    const cy=clamp(Math.floor(norm.y*buffer.height),0,buffer.height-1);
    const size=Math.max(1,Math.round(Number(diameter)||1));

    if(size===1){
      const d=bufferCtx.getImageData(cx,cy,1,1).data;
      return {r:d[0],g:d[1],b:d[2],hex:toHex(d[0],d[1],d[2]),cx,cy,diameter:1,count:1};
    }

    const radius=size/2;
    const left=clamp(Math.floor(cx-radius),0,buffer.width-1);
    const top=clamp(Math.floor(cy-radius),0,buffer.height-1);
    const right=clamp(Math.ceil(cx+radius),0,buffer.width-1);
    const bottom=clamp(Math.ceil(cy+radius),0,buffer.height-1);
    const width=Math.max(1,right-left+1);
    const height=Math.max(1,bottom-top+1);
    const pixels=bufferCtx.getImageData(left,top,width,height).data;

    let r=0,g=0,b=0,count=0;
    const rr=radius*radius;
    for(let y=0;y<height;y++){
      const py=top+y;
      for(let x=0;x<width;x++){
        const px=left+x;
        const dx=(px+.5)-(cx+.5);
        const dy=(py+.5)-(cy+.5);
        if(dx*dx+dy*dy>rr) continue;
        const i=(y*width+x)*4;
        if(pixels[i+3]===0) continue;
        r+=pixels[i];
        g+=pixels[i+1];
        b+=pixels[i+2];
        count++;
      }
    }

    if(!count){
      const d=bufferCtx.getImageData(cx,cy,1,1).data;
      return {r:d[0],g:d[1],b:d[2],hex:toHex(d[0],d[1],d[2]),cx,cy,diameter:1,count:1};
    }

    r=Math.round(r/count);
    g=Math.round(g/count);
    b=Math.round(b/count);
    return {r,g,b,hex:toHex(r,g,b),cx,cy,diameter:size,count};
  }

  function drawLoupe(ctx,canvas,buffer,sample){
    if(!ctx || !canvas || !buffer || !sample) return;
    const diameter=Math.max(1,sample.diameter||1);
    const contextSize=Math.max(17,Math.min(81,diameter*3));
    const half=Math.floor(contextSize/2);
    const srcX=clamp(sample.cx-half,0,Math.max(0,buffer.width-contextSize));
    const srcY=clamp(sample.cy-half,0,Math.max(0,buffer.height-contextSize));
    const srcW=Math.min(contextSize,buffer.width-srcX);
    const srcH=Math.min(contextSize,buffer.height-srcY);

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(buffer,srcX,srcY,srcW,srcH,0,0,canvas.width,canvas.height);

    const scale=canvas.width/contextSize;
    const localX=(sample.cx-srcX+.5)*scale;
    const localY=(sample.cy-srcY+.5)*scale;
    const radius=Math.max(1,(diameter/2)*scale);

    ctx.save();
    ctx.fillStyle='rgba('+sample.r+','+sample.g+','+sample.b+',.28)';
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(localX,localY,radius,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(localX-8,localY);
    ctx.lineTo(localX+8,localY);
    ctx.moveTo(localX,localY-8);
    ctx.lineTo(localX,localY+8);
    ctx.stroke();
    ctx.restore();
  }

  function toHex(r,g,b){
    return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
  }

  window.StreetblendSampler={aggregateColor,drawLoupe};
})();