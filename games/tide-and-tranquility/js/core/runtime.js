/* Tide runtime helpers, sound, haptics, and preferences */
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const canvas=$('#game'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,TAU=Math.PI*2,waterY=150;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt=n=>{n=Math.floor(Number(n)||0);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(n>=1e4?0:1)+'K':String(n)};
const now=()=>Date.now();
function setupCanvasResolution(){let dpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));if(canvasDpr===dpr&&canvas.width===Math.round(W*dpr)&&canvas.height===Math.round(H*dpr))return;canvasDpr=dpr;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
const PREF_DEFAULTS=Object.freeze({sound:true,music:true,haptics:true,motion:true,volume:.55});
let audioCtx=null,audioMaster=null,audioFx=null,audioAmbient=null,audioMusic=null,audioRain=null,audioWind=null,audioReady=false,musicTimer=0,toastTimer=null,saveMode='export',canvasDpr=1;
function currentPrefs(){try{return state&&state.preferences?state.preferences:PREF_DEFAULTS}catch(_){return PREF_DEFAULTS}}
function haptic(kind='tap'){
 const p=currentPrefs();if(!p.haptics||!navigator.vibrate)return;
 const patterns={tap:8,select:12,cast:16,bite:[18,18,28],catch:[18,22,34],success:[14,18,14],treasure:[16,18,16,18,42],error:[40,28,45],sonar:[10,18,10,18,24]};
 try{navigator.vibrate(patterns[kind]||patterns.tap)}catch(_){}
}
function createNoiseBuffer(ctx,seconds=2,brown=false){let length=Math.max(1,Math.floor(ctx.sampleRate*seconds)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0),last=0;for(let i=0;i<length;i++){let white=Math.random()*2-1;if(brown){last=(last+.02*white)/1.02;data[i]=last*3.2}else data[i]=white}return buffer}
function smoothGain(node,value,seconds=.35){if(!node||!audioCtx)return;let t=audioCtx.currentTime;node.gain.cancelScheduledValues(t);node.gain.setTargetAtTime(Math.max(0,value),t,Math.max(.01,seconds/3))}
function ensureAudio(){
 try{
  if(!audioCtx){
   const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return false;audioCtx=new Ctx();
   audioMaster=audioCtx.createGain();audioFx=audioCtx.createGain();audioAmbient=audioCtx.createGain();audioMusic=audioCtx.createGain();audioRain=audioCtx.createGain();audioWind=audioCtx.createGain();
   audioFx.connect(audioMaster);audioAmbient.connect(audioMaster);audioMusic.connect(audioMaster);audioRain.connect(audioMaster);audioWind.connect(audioMaster);audioMaster.connect(audioCtx.destination);
   let ocean=audioCtx.createBufferSource(),oceanFilter=audioCtx.createBiquadFilter();ocean.buffer=createNoiseBuffer(audioCtx,3,true);ocean.loop=true;oceanFilter.type='lowpass';oceanFilter.frequency.value=720;oceanFilter.Q.value=.25;ocean.connect(oceanFilter);oceanFilter.connect(audioAmbient);ocean.start();
   let waveLfo=audioCtx.createOscillator(),waveDepth=audioCtx.createGain();waveLfo.frequency.value=.085;waveDepth.gain.value=.018;waveLfo.connect(waveDepth);waveDepth.connect(audioAmbient.gain);waveLfo.start();
   let rain=audioCtx.createBufferSource(),rainFilter=audioCtx.createBiquadFilter();rain.buffer=createNoiseBuffer(audioCtx,2,false);rain.loop=true;rainFilter.type='highpass';rainFilter.frequency.value=2100;rain.connect(rainFilter);rainFilter.connect(audioRain);rain.start();
   let wind=audioCtx.createBufferSource(),windFilter=audioCtx.createBiquadFilter();wind.buffer=createNoiseBuffer(audioCtx,3,true);wind.loop=true;windFilter.type='bandpass';windFilter.frequency.value=430;windFilter.Q.value=.65;wind.connect(windFilter);windFilter.connect(audioWind);wind.start();
   audioFx.gain.value=.42;audioAmbient.gain.value=0;audioMusic.gain.value=0;audioRain.gain.value=0;audioWind.gain.value=0;audioMaster.gain.value=0;audioReady=true;
  }
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  updateSoundscape(true);return true;
 }catch(error){console.warn('[Tide & Tranquility] Audio unavailable.',error);return false}
}
function playAmbientNote(){
 if(!audioReady||!audioCtx)return;let p=currentPrefs();if(!p.sound||!p.music||document.hidden)return;
 const scale=[220,246.94,293.66,329.63,392,440],base=pick(scale),t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();
 o.type=Math.random()<.6?'sine':'triangle';o.frequency.setValueAtTime(base,t);if(Math.random()<.28)o.frequency.exponentialRampToValueAtTime(base*1.003,t+3.5);filter.type='lowpass';filter.frequency.value=1200;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.035,t+.8);g.gain.exponentialRampToValueAtTime(.0001,t+4.8);o.connect(filter);filter.connect(g);g.connect(audioMusic);o.start(t);o.stop(t+5);
}
function scheduleMusic(){clearTimeout(musicTimer);let p=currentPrefs();if(!p.sound||!p.music||document.hidden)return;musicTimer=setTimeout(()=>{playAmbientNote();scheduleMusic()},4200+Math.random()*4200)}
function updateSoundscape(immediate=false){
 if(!audioReady||!audioCtx)return;let p=currentPrefs(),weather=typeof state!=='undefined'&&state.weather?state.weather.type:'clear',sea=$('#screen-sea')?.classList.contains('active'),tank=$('#screen-aquarium')?.classList.contains('active');
 smoothGain(audioMaster,p.sound?clamp(p.volume,0,1):0,immediate?.03:.35);smoothGain(audioAmbient,p.sound?(sea?.12:tank?.055:.035):0);smoothGain(audioRain,p.sound?(weather==='storm'?.075:weather==='rain'?.045:0):0);smoothGain(audioWind,p.sound?(weather==='storm'?.055:weather==='wind'?.035:0):0);smoothGain(audioMusic,p.sound&&p.music?.16:0);scheduleMusic();
}
function tone(f=440,d=.06,type='sine',level=.05){
 let p=currentPrefs();if(!p.sound||!ensureAudio()||!audioCtx||!audioFx)return;try{let t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(30,f),t);g.gain.setValueAtTime(Math.max(.0001,level),t);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.02,d));o.connect(g);g.connect(audioFx);o.start(t);o.stop(t+Math.max(.03,d)+.03)}catch(_){}
}
function noiseBurst(duration=.08,level=.04,highpass=250){if(!currentPrefs().sound||!ensureAudio()||!audioCtx||!audioFx)return;try{let t=audioCtx.currentTime,s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=createNoiseBuffer(audioCtx,Math.max(.12,duration),false);f.type='highpass';f.frequency.value=highpass;g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);g.connect(audioFx);s.start(t);s.stop(t+duration+.02)}catch(_){}
}
function splashSound(){noiseBurst(.12,.035,450);tone(240,.12,'sine',.025)}
function applyPreferences(){let p=currentPrefs();document.documentElement.classList.toggle('reduced-motion',!p.motion);let vol=$('#audioVolume');if(vol)vol.value=String(p.volume);updateSoundscape()}
function toast(s){let e=$('#toast');if(!e)return;e.textContent=s;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),1700)}
