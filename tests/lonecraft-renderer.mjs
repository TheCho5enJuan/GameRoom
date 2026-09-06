import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const configCode=fs.readFileSync('games/lonecraft/sprite-config.js','utf8');
const artCode=fs.readFileSync('games/lonecraft/art-v3.js','utf8');
const html=fs.readFileSync('games/lonecraft/index.html','utf8');

class MockImage{
  constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this._src='';}
  set src(value){
    this._src=value;this.complete=true;
    if(value.includes('ninja_3'))[this.naturalWidth,this.naturalHeight]=[64,112];
    else if(value.includes('zombie7_0'))[this.naturalWidth,this.naturalHeight]=[192,256];
    else if(value.includes('smallSlimes'))[this.naturalWidth,this.naturalHeight]=[256,256];
    else if(value.includes('black_mage'))[this.naturalWidth,this.naturalHeight]=[160,128];
    else if(value.includes('tree-'))[this.naturalWidth,this.naturalHeight]=[32,40];
    else [this.naturalWidth,this.naturalHeight]=[32,32];
  }
  get src(){return this._src;}
}

class MockContext{
  constructor(canvas){this.canvas=canvas;this.fillStyle='#000';this.strokeStyle='#000';this.globalAlpha=1;this.lineWidth=1;this.draws=[];this.rects=[];}
  fillRect(...args){this.rects.push({style:this.fillStyle,args});}
  clearRect(){}
  drawImage(image,...args){this.draws.push({image,args});}
  fill(){}
  save(){}
  restore(){}
  beginPath(){}
  ellipse(){}
  arc(){}
  stroke(){}
}

const canvas={width:480,height:270};
const ctx=new MockContext(canvas);
canvas.getContext=()=>ctx;

const noopNode={addEventListener(){},classList:{add(){},remove(){}},style:{}};
const document={
  getElementById(id){if(id==='gameCanvas')return canvas;if(id==='mobileAction')return noopNode;return null;},
  querySelector(){return null;}
};

const listeners=new Map();
const sandbox={
  console,Math,Image:MockImage,CanvasRenderingContext2D:MockContext,document,
  performance:{now:()=>1000},
  KeyboardEvent:class{constructor(type,init={}){this.type=type;Object.assign(this,init);}},
  window:null
};
sandbox.window=sandbox;
sandbox.addEventListener=(name,fn)=>{const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list);};
sandbox.dispatchEvent=event=>{for(const fn of listeners.get(event.type)||[])fn(event);};

vm.createContext(sandbox);
vm.runInContext(configCode,sandbox,{filename:'sprite-config.js'});
vm.runInContext(artCode,sandbox,{filename:'art-v3.js'});

function reset(){ctx.draws.length=0;ctx.rects.length=0;ctx.clearRect(0,0,480,270);}
function drawFor(fragment){return ctx.draws.filter(d=>d.image.src.includes(fragment));}
function assertSprite(fragment,sourceW,sourceH,renderW,renderH){
  const draws=drawFor(fragment);
  assert.equal(draws.length,1,`${fragment}: expected exactly one replacement sprite draw`);
  const a=draws[0].args;
  assert.equal(a[2],sourceW,`${fragment}: source width`);
  assert.equal(a[3],sourceH,`${fragment}: source height`);
  assert.equal(a[6],renderW,`${fragment}: render width`);
  assert.equal(a[7],renderH,`${fragment}: render height`);
  assert.equal(ctx.rects.length,0,`${fragment}: legacy fillRect actor pieces should be suppressed`);
}

reset();
ctx.fillStyle='#e3caa4';ctx.fillRect(236,128,8,6);
ctx.fillStyle='#e9ece4';ctx.fillRect(235,134,10,7);
ctx.fillStyle='#4a627a';ctx.fillRect(236,141,3,4);ctx.fillRect(241,141,3,4);
ctx.fillStyle='#26231f';ctx.fillRect(238,130,1,1);ctx.fillRect(242,130,1,1);
assertSprite('ninja_3',16,16,20,20);

reset();
ctx.fillStyle='#5b9f57';ctx.fillRect(100,100,8,6);
ctx.fillStyle='#4d5260';ctx.fillRect(99,106,10,7);
ctx.fillStyle='#1a1c1b';ctx.fillRect(101,102,1,1);ctx.fillRect(106,102,1,1);
assertSprite('zombie7_0',64,64,24,24);

reset();
ctx.fillStyle='#4ba44e';ctx.fillRect(200,100,12,10);
ctx.fillStyle='#101510';ctx.fillRect(203,103,2,2);ctx.fillRect(207,103,2,2);
assertSprite('smallSlimes',32,32,20,20);

reset();
ctx.fillStyle='#bfe7f2';ctx.fillRect(200,100,10,7);
ctx.fillStyle='#7fa9c0';ctx.fillRect(199,107,12,10);
ctx.fillStyle='#effcff';ctx.fillRect(202,103,2,2);ctx.fillRect(206,103,2,2);
ctx.fillStyle='#78cce8';ctx.fillRect(197,110,3,5);ctx.fillRect(210,110,3,5);
assertSprite('black_mage',32,32,32,32);

reset();
ctx.fillStyle='#4c3320';ctx.fillRect(100,100,4,8);
ctx.fillStyle='#2b653a';ctx.fillRect(96,94,12,10);
ctx.fillStyle='#4c8c48';ctx.fillRect(98,93,8,3);ctx.fillRect(95,97,4,4);
const treeDraws=drawFor('tree-light-green');
assert.equal(treeDraws.length,1,'tree: expected exactly one replacement sprite draw');
assert.equal(treeDraws[0].args[6],30,'tree: render width');
assert.equal(treeDraws[0].args[7],34,'tree: render height');
assert.equal(ctx.rects.length,0,'tree: legacy trunk/canopy rectangles should be suppressed');

assert.match(html,/id="joystick"/,'mobile joystick must be present');
assert.doesNotMatch(html,/data-move=/,'legacy D-pad buttons must not be present');
assert.ok(html.indexOf('art-v3.js')>0&&html.indexOf('art-v3.js')<html.indexOf('game.js'),'art-v3 must load before game.js');
assert.match(html,/v2\.3 · Renderer Rebuild/,'visible Lonecraft version must be 2.3');

console.log('Lonecraft renderer regression checks passed.');
