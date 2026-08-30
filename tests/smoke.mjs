import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');

function noop(){}
const gradient={addColorStop:noop};
const ctxTarget={
  createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,createPattern:()=>null,
  measureText:()=>({width:20}),getImageData:()=>({data:new Uint8ClampedArray(4)}),
  createImageData:()=>({data:new Uint8ClampedArray(4)}),canvas:{width:900,height:900},
};
const ctx=new Proxy(ctxTarget,{get(t,p){if(p in t)return t[p];return noop},set(t,p,v){t[p]=v;return true}});
const classList={add:noop,remove:noop,toggle:()=>false,contains:()=>false,replace:noop};
let element;
const elementTarget={
  style:new Proxy({setProperty:noop,removeProperty:noop,getPropertyValue:()=>''}, {get:(t,p)=>p in t?t[p]:'',set:(t,p,v)=>(t[p]=v,true)}),classList,dataset:{},value:'',checked:false,disabled:false,textContent:'',innerHTML:'',
  width:900,height:900,clientWidth:900,clientHeight:900,offsetWidth:900,offsetHeight:900,scrollWidth:900,scrollHeight:900,
  addEventListener:noop,removeEventListener:noop,dispatchEvent:()=>true,appendChild:x=>x,append:noop,prepend:noop,remove:noop,focus:noop,select:noop,click:noop,
  getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,right:900,bottom:900,width:900,height:900}),
  querySelector:()=>element,querySelectorAll:()=>childList,closest:()=>null,setAttribute:noop,getAttribute:()=>null,removeAttribute:noop,
  setPointerCapture:noop,releasePointerCapture:noop,cloneNode:()=>element,replaceWith:noop,insertAdjacentHTML:noop,
};
element=new Proxy(elementTarget,{get(t,p){if(p===Symbol.iterator)return function*(){};if(p in t)return t[p];return element},set(t,p,v){t[p]=v;return true}});
const childList=new Proxy([],{get(t,p){if(typeof p==='string'&&/^\d+$/.test(p))return element;if(p==='length')return 64;if(p===Symbol.iterator)return function*(){for(let i=0;i<64;i++)yield element};return t[p]}});
elementTarget.children=childList; elementTarget.childNodes=childList; elementTarget.firstElementChild=element; elementTarget.lastElementChild=element;
const document={
  body:element,documentElement:element,hidden:false,readyState:'complete',
  querySelector:()=>element,querySelectorAll:()=>[],getElementById:()=>element,
  createElement:(tag)=>tag==='canvas'?element:element,createElementNS:()=>element,
  addEventListener:noop,removeEventListener:noop,
};
const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()};
class AudioContextStub{constructor(){this.currentTime=0;this.state='running';this.destination={};this.sampleRate=44100}createGain(){return {gain:{value:0,setValueAtTime:noop,linearRampToValueAtTime:noop,exponentialRampToValueAtTime:noop,setTargetAtTime:noop,cancelScheduledValues:noop},connect:noop}}createOscillator(){return {type:'sine',frequency:{value:0,setValueAtTime:noop,linearRampToValueAtTime:noop,exponentialRampToValueAtTime:noop},connect:noop,start:noop,stop:noop}}createBuffer(){return {getChannelData:()=>new Float32Array(8)}}createBufferSource(){return {buffer:null,loop:false,connect:noop,start:noop,stop:noop}}createBiquadFilter(){return {type:'',frequency:{value:0},Q:{value:0},connect:noop}}resume(){return Promise.resolve()}}
const windowObj={
  document,localStorage,innerWidth:900,innerHeight:900,devicePixelRatio:1,visualViewport:null,
  addEventListener:noop,removeEventListener:noop,dispatchEvent:noop,requestAnimationFrame:()=>1,cancelAnimationFrame:noop,
  setTimeout:()=>1,clearTimeout:noop,setInterval:()=>1,clearInterval:noop,
  AudioContext:AudioContextStub,webkitAudioContext:AudioContextStub,
  navigator:{vibrate:noop,language:'en-US',clipboard:{writeText:()=>Promise.resolve()}},
  location:{reload:noop,href:''},performance:{now:()=>0},
  matchMedia:()=>({matches:false,addEventListener:noop,removeEventListener:noop}),
};
windowObj.window=windowObj;windowObj.self=windowObj;windowObj.globalThis=windowObj;
const sandbox={...windowObj,window:windowObj,self:windowObj,globalThis:windowObj,document,localStorage,navigator:windowObj.navigator,
  console,Math,Date,JSON,Object,Array,Map,Set,WeakMap,WeakSet,Promise,Number,String,Boolean,RegExp,Error,TypeError,Uint8Array,Uint8ClampedArray,Float32Array,
  parseInt,parseFloat,isFinite,structuredClone:globalThis.structuredClone,crypto:globalThis.crypto,
  requestAnimationFrame:windowObj.requestAnimationFrame,cancelAnimationFrame:noop,setTimeout:windowObj.setTimeout,clearTimeout:noop,setInterval:windowObj.setInterval,clearInterval:noop,
  confirm:()=>false,prompt:()=>null,alert:noop,btoa:s=>Buffer.from(String(s),'binary').toString('base64'),atob:s=>Buffer.from(String(s),'base64').toString('binary'),
  Blob:class{},URL:{createObjectURL:()=>'',revokeObjectURL:noop},FileReader:class{readAsText(){this.result='';this.onload?.()}},
  AudioContext:AudioContextStub,webkitAudioContext:AudioContextStub,
};
const games=['rogue-quest','tide-and-tranquility','blockforge','space-sabotage','deal-or-no-deal'];
for(const game of games){
  const html=await readFile(join(site,'games',game,'index.html'),'utf8');
  const srcs=[...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]).filter(x=>!/^https?:/.test(x));
  const context=vm.createContext({...sandbox});
  try{
    for(const src of srcs){
      const path=resolve(site,'games',game,src);
      const code=await readFile(path,'utf8');
      new vm.Script(code,{filename:path}).runInContext(context,{timeout:5000});
    }
    console.log('PASS',game,srcs.length);
  }catch(error){
    console.error('FAIL',game,error.stack);process.exitCode=1;
  }
}
