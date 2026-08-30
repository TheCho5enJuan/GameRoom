/* Blockforge runtime state, input state, canvas, and DOM references */
'use strict';
let state=loadState();
const offlinePendingMs=Math.max(0,Date.now()-(state.lastSaved||Date.now()));
let world={grid:[],boss:null,modifier:MODIFIERS[0],particles:[],texts:[],shockwaves:[],player:{x:0,y:0},petPos:{x:0,y:0},combo:1,comboTimer:0,heat:0,frenzyTimer:0,dashCooldown:0,dashTimer:0,dashDir:{x:0,y:-1},petCooldown:0,petBlastTimer:0,petBoostTimer:0,petCritTimer:0,comboLockTimer:0,stun:0,rowFlash:0,zoneIntro:1.6,layerTransition:0,cameraPulse:0,petSpeech:null,petSpeechTimer:1.5,bossAttackTimer:3.5,hazard:null,pendingLayerClear:false};
let lastTime=performance.now(),hitAccumulator=0,audioCtx=null,W=0,H=0,DPR=1;
let pointer={down:false,startX:0,startY:0,x:0,y:0,moved:false,dx:0,dy:0};
let keys={left:false,right:false,up:false,down:false};
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const els=Object.fromEntries(['coinsText','gemsText','zoneText','powerText','eventText','frenzyLabel','frenzyFill','progressLabel','progressFill','comboText','bossBarWrap','bossFill','bossText','upgradeGrid','relicGrid','relicSummary','petHero','petGrid','forgeBody','dailyContainer','contractGrid','statsGrid','achievementList','dailyBadge','saveStatus','soundBtn','hapticBtn','motionBtn','numbersBtn','petText','forgeText','nextUpgradeText','hint','toastStack','dashBtn','dashCd','frenzyBtn','frenzyCd','petAbilityBtn','petAbilityIcon','petAbilityCd','devModeBtn','openDevBtn','devGate','devConsole','devQuickBtn','modPanel','langEnBtn','langEsBtn','openCharacterBtn','textureBtn','characterPreview','characterSummary','characterControls','viewModeBtn'].map(id=>[id,document.getElementById(id)]));
