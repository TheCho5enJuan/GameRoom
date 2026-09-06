(() => {
  'use strict';

  const PAL={
    surface:{grass:'#4d8a50',grass2:'#62a65d',grass3:'#327341',dirt:'#73543a',dirt2:'#8d6846',sand:'#c5a866',sand2:'#e0c47f',water:'#3d86a6',water2:'#65b7cb'},
    cave1:{dirt:'#675342',dirt2:'#7f6650',rock:'#4b4d50',rock2:'#686b70',glow:'#9ac1b2'},
    cave2:{dirt:'#4d4a45',dirt2:'#6a6259',rock:'#363d42',rock2:'#535c62',glow:'#6fb0c8'},
    cave3:{dirt:'#493c36',dirt2:'#684a3d',rock:'#302f32',rock2:'#4c4749',glow:'#e46c44'},
    sky:{cloud:'#dcebef',cloud2:'#f6fbf8',cloud3:'#aecbd1',void:'#0a1729',glow:'#a8e9ff'},
  };
  const MOB={
    slime:['#64c96e','#d76b61','#cad1d5','#493f59'],
    slimeDark:['#2f7b44','#914840','#7c878e','#282332'],
    zombie:['#79b866','#c98762','#bdc6cc','#697382'],
    zombieDark:['#3f7440','#83503c','#6f787e','#3a4048'],
  };

  const px=(ctx,x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
  const shadow=(ctx,x,y,w=12,a=.28)=>{ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y),w/2,3,0,0,Math.PI*2);ctx.fill();ctx.restore()};
  const hash=(x,y)=>((x*73856093)^(y*19349663))>>>0;
  const blink=t=>Math.floor(t*2.2)%11===0;
  const levelPalette=index){return index===4?PAL.sky:index===3?PAL.surface:index===2?PAL.cave1:index===1?PAL.cave2:PAL.cave3}
