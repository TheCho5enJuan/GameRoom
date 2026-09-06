(() => {
  'use strict';

  const canvas=document.getElementById('gameCanvas');
  if(!canvas)return;

  const remap=new Map([
    ['#e3caa4','#f0c9a4'],['#e9ece4','#5bb2a1'],['#4a627a','#35536f'],
    ['#4ba44e','#72d67b'],['#a15745','#e17d6e'],['#d4d5d0','#dce7eb'],['#242a30','#5c5470'],
    ['#5b9f57','#84bd72'],['#9b5a45','#cc8868'],['#d0d1ca','#c8d5d9'],['#2a3032','#697889'],
    ['#315331','#4f8550'],['#385d38','#5f965a']
  ]);

  const proto=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
  if(proto&&!proto.__lonecraftV2){
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
    proto.__lonecraftV2=true;
  }

  const shell=document.getElementById('gameShell');
  shell?.classList.add('lonecraft-v2');

  const title=document.querySelector('.title-art');
  if(title){
    title.innerHTML='<div class="v2-title-scene"><div class="v2-tree"><i></i><i></i><b></b></div><div class="v2-hero"><i class="hair"></i><i class="face"></i><i class="body"></i><i class="leg a"></i><i class="leg b"></i></div><div class="v2-slime"><i></i><b></b><b></b></div><div class="v2-ground"></div></div>';
  }
})();