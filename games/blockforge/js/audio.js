/* Blockforge sound, haptics, and pet speech */
'use strict';
function vibrate(ms=18){if(state.settings.haptics&&navigator.vibrate)navigator.vibrate(ms);}
function unlockAudio(){if(audioCtx)return;try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function sfx(type){if(!state.settings.sound)return;unlockAudio();if(!audioCtx)return;const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);const map={hit:[180,.025,.016],break:[310,.05,.03],coin:[620,.06,.024],boss:[95,.12,.045],buy:[480,.06,.028],crit:[820,.05,.034],dash:[240,.08,.025],frenzy:[520,.18,.04],pet:[700,.09,.03],chest:[900,.13,.035]};const m=map[type]||map.hit;o.type=type==='boss'?'sawtooth':'triangle';o.frequency.setValueAtTime(m[0],now);o.frequency.exponentialRampToValueAtTime(Math.max(60,m[0]*.62),now+m[1]);g.gain.setValueAtTime(m[2],now);g.gain.exponentialRampToValueAtTime(.001,now+m[1]);o.start(now);o.stop(now+m[1]+.01);}

function petSay(kind='happy'){const p=pet(),localized=state.settings.language==='es'?LOC_ES.petLines[p.id]:null,lines=localized?.[kind]||p.lines[kind]||localized?.happy||p.lines.happy||['...'];world.petSpeech={text:lines[Math.floor(Math.random()*lines.length)],life:2.3,max:2.3};}
