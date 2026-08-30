/* Tide aquarium and ocean gesture bindings */
'use strict';
let oceanGesture=null;
canvas.addEventListener('pointerdown',e=>{if(hook.mode!=='sinking')return;let r=canvas.getBoundingClientRect();oceanGesture={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),cx:(e.clientX-r.left)/r.width*W,cy:(e.clientY-r.top)/r.height*H}},{passive:true});
canvas.addEventListener('pointermove',e=>{if(!oceanGesture||oceanGesture.id!==e.pointerId||hook.mode!=='sinking')return;let dx=e.clientX-oceanGesture.x,dy=e.clientY-oceanGesture.y,dist=Math.hypot(dx,dy);if(dist<5)return;let dt=Math.max(16,performance.now()-oceanGesture.t),speed=dist/dt*16,action=Math.abs(dy)>Math.abs(dx)*1.15?'JIG':Math.abs(dx)>12?'SWEEP':'TWITCH';hook.action=action;hook.actionEnergy=clamp((hook.actionEnergy||0)+speed*.16+.18,0,1);if(action==='JIG')hook.jigImpulse=clamp((hook.jigImpulse||0)+(-dy/22),-1.4,1.4);oceanGesture.x=e.clientX;oceanGesture.y=e.clientY;oceanGesture.t=performance.now();renderOceanHud(true)},{passive:true});
function clearOceanGesture(){oceanGesture=null}canvas.addEventListener('pointerup',clearOceanGesture,{passive:true});canvas.addEventListener('pointercancel',clearOceanGesture,{passive:true});
ensureWorldState();

// Aquarium UI bindings
$('#aquaEditBtn').addEventListener('click',()=>{closeAquaSheet();setAquaEditMode(!aquaEditMode)});
$('#aquaInventoryBtn').addEventListener('click',()=>openAquaSheet('inventory','decor'));
$('#aquaHatchOpen').addEventListener('click',()=>openAquaSheet('hatch'));
$('#aquaFishOpen').addEventListener('click',()=>openAquaSheet('fish'));
$('#aquaCareOpen').addEventListener('click',()=>openAquaSheet('care'));
$('#aquaHappyChip').addEventListener('click',()=>openAquaSheet('care'));
$('#aquaSheetClose').addEventListener('click',closeAquaSheet);
$('#aquaSizeRange').addEventListener('input',()=>{});
$('#aquaSizeRange').addEventListener('change',()=>save());
$('#deleteDecorBtn').addEventListener('click',deleteSelectedDecor);
