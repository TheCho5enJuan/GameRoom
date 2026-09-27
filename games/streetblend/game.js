'use strict';

(() => {
const $ = id => document.getElementById(id);
const net = window.GameRoomMultiplayer;
const flow = window.StreetblendFlow;
const PHASES = flow.PHASES;
const PAINT_W = 96;
const PAINT_H = 180;

const settingsApi=window.StreetblendSettings;
const sanitizeSettings=settingsApi.sanitize;
const penaltyText=settingsApi.penaltyText;
const artCategoryText=settingsApi.artCategoryText;
const rulesText=settingsApi.rulesText;
let appSettings=settingsApi.load();

let artLibrary = [];
let artLoadPromise = null;
let artLoadCategory = null;
let sceneDeck = [];
let lastSceneId = null;
let session = null;
let role = 'local';
let seat = 0;
let connected = false;
let solo = false;
let hostState = null;
let remoteState = null;
let scene = null;
let sceneImage = null;
let sceneBuffer = document.createElement('canvas');
let sceneBufferCtx = sceneBuffer.getContext('2d', {willReadFrequently:true});
let sceneToken = 0;
let sceneSamplingAvailable = false;
let dirty = true;
let raf = 0;
let timerLoop = null;
let lastTickSent = -1;
let toastTimer = null;
let localReadyToken = '';
let localAvatar = null;

const stage = $('stage');
const ctx = stage.getContext('2d');
const paintCanvas = document.createElement('canvas');
paintCanvas.width = PAINT_W;
paintCanvas.height = PAINT_H;
const paintCtx = paintCanvas.getContext('2d');
const figureCanvas = document.createElement('canvas');
figureCanvas.width = PAINT_W;
figureCanvas.height = PAINT_H;
const figureCtx = figureCanvas.getContext('2d');
const sampleLoupeCanvas = $('sampleLoupeCanvas');
const sampleLoupeCtx = sampleLoupeCanvas.getContext('2d');

let figure = defaultFigure();
let paintColor = '#ffffff';
let activeTool = 'place';
let camera = {cx:.5, cy:.5, zoom:1};
let guessMarks = [];
let reveal = false;
let pointers = new Map();
let pointerStart = null;
let pinchStart = null;
let paintingPointer = null;
let draggingFigure = null;
let figureHandleDrag = null;
let figureTransform = null;
let sampleHold = null;
let sampleHoldTimer = null;
let lastUiPhaseKey = '';
let syncSeq=0;
let guestAckSeq=0;
let hostAppliedSeq=0;
let guestAppliedSeq=0;
let phaseSerial=0;
let uiEpoch=0;
let lastResyncAt=0;
let lastPulseAt=0;
let pendingRemoteState=null;
let remoteRenderRunning=false;
let reconnectResumeSeq=0;

function defaultFigure(){
  return {x:.5,y:.58,scale:.14,rotation:0,pose:'stand',build:'regular',paintData:null};
}

function resetPaint(){
  paintCtx.save();
  paintCtx.globalCompositeOperation = 'source-over';
  paintCtx.fillStyle = '#ffffff';
  paintCtx.fillRect(0,0,PAINT_W,PAINT_H);
  paintCtx.restore();
  figure.paintData = null;
  markDirty();
}
resetPaint();

function toast(message){
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('show');
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2200);
}

function setNetStatus(title,detail){
  $('netStatus').innerHTML = '<strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(detail)+'</span>';
}

function escapeHtml(v){
  return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function updateSettingsSummary(){
  if($('settingsSummary')) $('settingsSummary').textContent=artCategoryText(appSettings)+' · '+appSettings.players+' players · '+appSettings.rounds+' rounds · '+penaltyText(appSettings);
  if($('roomRules') && (!hostState || hostState.phase==='lobby')) $('roomRules').textContent=rulesText(appSettings);
}

function syncSettingsForm(){
  $('settingMode').value=appSettings.mode;
  $('settingPlayers').value=String(appSettings.players);
  $('settingRounds').value=String(appSettings.rounds);
  $('settingArtCategory').value=appSettings.artCategory;
  $('settingHideSeconds').value=String(appSettings.hideSeconds);
  $('settingSeekSeconds').value=String(appSettings.seekSeconds);
  $('settingPenaltyMode').value=appSettings.wrongPenaltyMode;
  $('settingPenaltySeconds').value=String(appSettings.wrongPenaltySeconds);
  $('penaltySecondsField').hidden=appSettings.wrongPenaltyMode==='none';
}

function readSettingsForm(){
  return sanitizeSettings({
    mode:$('settingMode').value,
    players:Number($('settingPlayers').value),
    rounds:Number($('settingRounds').value),
    artCategory:$('settingArtCategory').value,
    hideSeconds:Number($('settingHideSeconds').value),
    seekSeconds:Number($('settingSeekSeconds').value),
    wrongPenaltyMode:$('settingPenaltyMode').value,
    wrongPenaltySeconds:Number($('settingPenaltySeconds').value)
  });
}

function openSettings(){
  syncSettingsForm();
  $('settingsOverlay').hidden=false;
}

function closeSettings(){
  $('settingsOverlay').hidden=true;
}

function saveSettings(){
  appSettings=settingsApi.save(readSettingsForm());
  updateSettingsSummary();
  closeSettings();
  toast('Settings saved.');
}

function restoreDefaultSettings(){
  appSettings=settingsApi.defaults();
  syncSettingsForm();
}

function showStartMenu(){
  $('startMenu').hidden=false;
  $('joinPane').hidden=true;
  $('roomBox').hidden=true;
  $('connectedBox').hidden=true;
  setNetStatus('Ready','Choose how you want to play.');
  updateSettingsSummary();
}

function showJoinPane(){
  $('startMenu').hidden=true;
  $('joinPane').hidden=false;
  $('roomBox').hidden=true;
  $('connectedBox').hidden=true;
  setNetStatus('Join a game','Enter a room code or open an invite link.');
  setTimeout(()=>$('roomCode').focus(),50);
}

async function loadArtLibrary(category=appSettings.artCategory){
  category=category||'mixed';
  if(artLoadPromise && artLoadCategory===category) return artLoadPromise;
  if(!window.StreetblendArt?.load) throw new Error('Streetblend artwork module is unavailable.');
  artLoadCategory=category;
  artLoadPromise=window.StreetblendArt.load(category,(title,detail)=>setNetStatus(title,detail))
    .then(items=>{
      artLibrary=Array.isArray(items)?items:[];
      sceneDeck=[];
      return artLibrary;
    });
  return artLoadPromise;
}

function playerName(){
  return String($('playerName').value || 'Player').trim().slice(0,18) || 'Player';
}

function cleanCode(){
  $('roomCode').value = net.cleanCode($('roomCode').value);
}

function inviteUrl(code){
  const u = new URL(location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('room',net.cleanCode(code));
  return u.toString();
}

async function shareInvite(){
  if(!session?.code) return;
  const url = inviteUrl(session.code);
  try{
    if(navigator.share){
      await navigator.share({title:'Streetblend',text:'Join my Streetblend room '+session.code,url});
    }else{
      await navigator.clipboard.writeText(url);
      toast('Invite link copied.');
    }
  }catch(error){
    if(error?.name === 'AbortError') return;
    try{
      await navigator.clipboard.writeText(url);
      toast('Invite link copied.');
    }catch(_){
      prompt('Share this invite link:',url);
    }
  }
}

function leaveRoom(reload=true){
  try{session?.close();}catch(_){}
  session = null;
  role = 'local';
  seat = 0;
  connected = false;
  solo = false;
  hostState = null;
  remoteState = null;
  const u = new URL(location.href);
  u.searchParams.delete('room');
  history.replaceState({},'',u.pathname+(u.search||'')+u.hash);
  if(reload) location.reload();
}

function refreshAvatarUi(state=getState()){
  if(!window.StreetblendAvatar) return;
  if(state?.players) StreetblendAvatar.setMatchAvatars(state.players);
  const waiting = state && (
    (state.phase==='hide' && state.hiderSeat!==seat) ||
    (state.phase==='seek' && state.seekerSeat!==seat && !solo)
  );
  StreetblendAvatar.setStudioVisible(!!waiting);
  if(waiting && state.phase==='seek'){
    const opponent=state.players?.[state.seekerSeat];
    StreetblendAvatar.setOpponent(opponent?.avatar,opponent?.name||'Seeker');
  }else{
    StreetblendAvatar.setOpponent(null);
  }
}

function onAvatarChanged(data){
  if(typeof data!=='string' || data.length>160000) return;
  localAvatar=data;
  const state=getState();
  if(state?.players?.[seat]){
    state.players[seat].avatar=data;
    refreshAvatarUi(state);
  }
  if(role==='host' && hostState){
    hostState.players[0].avatar=data;
    if(connected && !solo) session?.sendTo(1,{type:'sb:avatar',seat:0,data});
  }else if(role==='guest' && connected){
    session?.send({type:'sb:avatar',seat:1,data});
  }
}

function createRoom(){
  loadArtLibrary(appSettings.artCategory).catch(()=>{});
  leaveRoom(false);
  role = 'host';
  seat = 0;
  connected = false;
  solo = false;
  const name = playerName();
  $('startMenu').hidden=true;
  $('joinPane').hidden=true;
  $('roomBox').hidden=true;
  $('connectedBox').hidden=true;
  setNetStatus('Creating room','Connecting to the signaling service…');

  session = net.host({
    gameKey:'streetblend',
    maxPlayers:appSettings.players,
    onStatus(info){
      if(info.state === 'retrying'){
        setNetStatus('Reconnecting','Signaling retry '+info.attempt+' of '+info.maxRetries+'…');
      }else if(info.state === 'waiting' && !connected){
        history.replaceState({},'',inviteUrl(session.code));
        $('roomCodeDisplay').textContent = session.code;
        $('roomBox').hidden=false;
        $('startMenu').hidden=true;
        $('joinPane').hidden=true;
        setNetStatus('Room '+session.code,'Share the invite and wait for Player 2.');
      }
    },
    onPlayerJoin(info){
      connected = true;
      $('roomBox').hidden = true;
      $('connectedBox').hidden = false;
      $('p0Lobby').textContent = name;
      $('p1Lobby').textContent = info.name || 'Player 2';
      $('startMatch').hidden = false;
      $('guestWait').hidden = true;
      setNetStatus('Connected',(info.name||'Player 2')+' joined the room.');
      if(!hostState || hostState.phase==='lobby'){
        hostState=makeHostState(name,info.name||'Player 2');
        syncSeq=0;
        guestAckSeq=0;
        $('roomRules').textContent=rulesText(hostState.config);
        session.sendTo(1,{type:'sb:lobby-config',config:hostState.config,players:hostState.players});
      }else{
        hostState.players[1].name=info.name||hostState.players[1].name||'Player 2';
        if(hostState.paused) resumeMatch();
        sendGuestPhase(true);
      }
    },
    onPlayerLeave(){
      connected = false;
      if(hostState && hostState.phase !== 'lobby') pauseMatch('Player 2 disconnected.');
      $('connectedBox').hidden=false;
      $('roomBox').hidden=true;
      $('startMenu').hidden=true;
      $('joinPane').hidden=true;
      $('guestWait').hidden=false;
      $('guestWait').textContent='Player 2 disconnected. Waiting for them to reconnect…';
      setNetStatus('Player disconnected','Waiting for Player 2 to reconnect…');
    },
    onMessage(message,meta){
      handleHostMessage(message,meta);
    },
    onError(error){
      setNetStatus('Connection error',error?.type || error?.message || 'Could not create room.');
    }
  });
}

function joinRoom(){
  leaveRoom(false);
  const code = net.cleanCode($('roomCode').value);
  if(code.length !== 6){
    setNetStatus('Enter a room code','Room codes contain six characters.');
    return;
  }
  role='guest';
  seat=1;
  connected=false;
  solo=false;
  $('startMenu').hidden=true;
  $('joinPane').hidden=true;
  $('roomBox').hidden=true;
  $('connectedBox').hidden=true;
  setNetStatus('Connecting','Looking for room '+code+'…');

  session = net.join({
    gameKey:'streetblend',
    code,
    name:playerName(),
    maxPlayers:2,
    onStatus(info){
      if(info.state === 'retrying') setNetStatus('Reconnecting','Signaling retry '+(info.attempt||1)+'…');
      else if(info.state === 'connected'){
        connected = true;
        $('connectedBox').hidden=false;
        $('startMenu').hidden=true;
        $('joinPane').hidden=true;
        $('startMatch').hidden=true;
        $('guestWait').hidden=false;
        $('guestWait').textContent='Waiting for the host to start the match…';
        $('p0Lobby').textContent='Host';
        $('p1Lobby').textContent=playerName();
        $('roomRules').textContent='Host settings apply';
        setNetStatus('Connected','Waiting for the host to start.');
      }else if(info.state === 'disconnected'){
        connected=false;
        $('connectedBox').hidden=true;
        $('joinPane').hidden=false;
        setNetStatus('Disconnected','The host connection closed.');
        if(!document.hidden) toast('Host disconnected.');
      }else if(info.state === 'full'){
        $('connectedBox').hidden=true;
        $('joinPane').hidden=false;
        setNetStatus('Room full','This Streetblend room already has two players.');
      }
    },
    onMessage(message){
      handleGuestMessage(message);
    },
    onError(error){
      setNetStatus('Connection error',error?.type || error?.message || 'Could not join room.');
    }
  });
}

function makeHostState(name0,name1){
  return {
    players:[{name:name0,score:0,avatar:localAvatar},{name:name1,score:0,avatar:null}],
    config:{...appSettings},
    round:0,
    phase:'lobby',
    scene:null,
    hiderSeat:0,
    seekerSeat:1,
    wrong:0,
    figure:null,
    lastDraft:null,
    guessMarks:[],
    deadline:0,
    result:null,
    paused:false
  };
}

async function startMatch(){
  try{
    await loadArtLibrary(hostState?.config?.artCategory || appSettings.artCategory);
  }catch(error){
    toast(error.message);
    return;
  }
  if(role === 'host'){
    if(!connected || !hostState) return;
    hostState.players[0].name = playerName();
    resetSceneDeck();
    beginRound(0);
  }else if(solo){
    if(!hostState) hostState = makeHostState(playerName(),'Practice Seeker');
    beginRound(0);
  }
}

async function startSolo(){
  try{await loadArtLibrary(appSettings.artCategory);}catch(error){toast(error.message);return;}
  leaveRoom(false);
  solo = true;
  role = 'host';
  seat = 0;
  connected = true;
  hostState=makeHostState(playerName(),'Practice');
  resetSceneDeck();
  beginRound(0);
}

function randomUnit(){
  if(window.crypto?.getRandomValues){
    const data=new Uint32Array(1);
    window.crypto.getRandomValues(data);
    return data[0]/4294967296;
  }
  return Math.random();
}

function secureShuffle(items){
  const list=items.slice();
  for(let i=list.length-1;i>0;i--){
    const j=Math.floor(randomUnit()*(i+1));
    [list[i],list[j]]=[list[j],list[i]];
  }
  return list;
}

function resetSceneDeck(){
  sceneDeck=secureShuffle(artLibrary);
  if(sceneDeck.length>1 && lastSceneId!=null && String(sceneDeck[0].id)===String(lastSceneId)){
    [sceneDeck[0],sceneDeck[1]]=[sceneDeck[1],sceneDeck[0]];
  }
}

function shuffledScene(){
  if(!artLibrary.length) return null;
  if(!sceneDeck.length) resetSceneDeck();
  const selected=sceneDeck.shift()||artLibrary[0];
  lastSceneId=selected?.id??null;
  return selected;
}

function phaseToken(phase){
  return String(hostState?.round??0)+':'+phase+':'+(++phaseSerial);
}

function setHostPhase(phase){
  hostState.phase=phase;
  hostState.phaseToken=phaseToken(phase);
  hostState.readyBySeat={};
  hostState.timerStarted=false;
  hostState.deadline=0;
  hostState.pauseRemaining=0;
  hostState.paused=false;
  localReadyToken='';
  lastTickSent=-1;
}

function beginRound(roundIndex){
  if(!hostState) return;
  hostState.round=roundIndex;
  hostState.hiderSeat=roundIndex%2;
  hostState.seekerSeat=1-hostState.hiderSeat;
  hostState.scene=shuffledScene();
  hostState.wrong=0;
  hostState.figure=null;
  hostState.lastDraft=null;
  hostState.guessMarks=[];
  hostState.result=null;
  if(solo && hostState.hiderSeat===1){
    hostState.hiderSeat=0;
    hostState.seekerSeat=1;
  }
  setHostPhase(PHASES.HIDE_PREPARE);
  publishHostState();
}

function publicState(){
  if(!hostState) return null;
  const remaining=hostState.paused
    ? Math.max(0,hostState.pauseRemaining||0)
    : hostState.timerStarted
      ? Math.max(0,hostState.deadline-Date.now())
      : null;
  const state={
    players:hostState.players,
    activeSeats:hostState.activeSeats,
    config:hostState.config,
    round:hostState.round,
    phase:hostState.phase,
    phaseToken:hostState.phaseToken,
    syncSeq:hostState.syncSeq||syncSeq,
    scene:hostState.scene,
    hiderSeat:hostState.hiderSeat,
    seekerSeat:hostState.seekerSeat,
    wrong:hostState.wrong,
    guessMarks:hostState.guessMarks,
    result:hostState.result,
    paused:!!hostState.paused,
    timerStarted:!!hostState.timerStarted,
    remaining
  };
  if([PHASES.SEEK_PREPARE,PHASES.SEEK,PHASES.REVEAL,PHASES.FINAL].includes(hostState.phase)){
    state.figure=hostState.figure;
  }
  return state;
}

function sendGuestPhase(repeat=false){
  if(!hostState) return null;
  if(!repeat) syncSeq++;
  hostState.syncSeq=syncSeq;
  const state=publicState();
  if(role==='host'&&!solo&&session&&connected) session.sendTo(1,{type:'sb:state',state});
  return state;
}

function publishHostState(){
  const snapshot=sendGuestPhase(false)||publicState();
  if(!snapshot) return;
  applyStateToUI(snapshot,true).then(()=>{
    if(Number(snapshot.syncSeq)===syncSeq){
      hostAppliedSeq=Math.max(hostAppliedSeq,Number(snapshot.syncSeq)||0);
      maybeStartTimedPhase();
    }
  });
}

function resendHostState(){
  const snapshot=sendGuestPhase(true);
  if(snapshot && role==='host') markDirty();
}

function requestResync(){
  if(role!=='guest'||!connected||!session||Date.now()-lastResyncAt<1000) return;
  lastResyncAt=Date.now();
  session.send({type:'sb:resync',haveSeq:Number(remoteState?.syncSeq)||0});
}

function actionMessage(type,payload={}){
  const state=getState();
  if(role!=='guest'||!session||!connected||!state) return;
  session.send({
    type,
    round:state.round,
    phaseToken:state.phaseToken,
    syncSeq:state.syncSeq,
    ...payload
  });
}

function markPhaseReady(readySeat,token){
  if(role!=='host'||!hostState||token!==hostState.phaseToken) return;
  hostState.readyBySeat[readySeat]=token;
  if(!flow.allReady(hostState,hostState.readyBySeat)) return;
  if(hostState.phase===PHASES.HIDE_PREPARE){
    setHostPhase(PHASES.HIDE);
    publishHostState();
  }else if(hostState.phase===PHASES.SEEK_PREPARE){
    setHostPhase(PHASES.SEEK);
    publishHostState();
  }
}

function reportPhaseReady(state){
  if(!state||![PHASES.HIDE_PREPARE,PHASES.SEEK_PREPARE].includes(state.phase)) return;
  if(!flow.requiredReadySeats(state).includes(seat)) return;
  if(localReadyToken===state.phaseToken) return;
  localReadyToken=state.phaseToken;
  if(role==='host') markPhaseReady(0,state.phaseToken);
  else actionMessage('sb:phase-ready');
}

function maybeStartTimedPhase(){
  if(role!=='host'||!hostState||hostState.timerStarted||hostState.paused) return;
  if(![PHASES.HIDE,PHASES.SEEK].includes(hostState.phase)) return;
  const actor=flow.timedActorSeat(hostState);
  const actorApplied=solo || (actor===0 ? hostAppliedSeq>=syncSeq : guestAckSeq>=syncSeq);
  if(!actorApplied) return;
  hostState.timerStarted=true;
  const seconds=hostState.phase===PHASES.HIDE?hostState.config.hideSeconds:hostState.config.seekSeconds;
  hostState.deadline=Date.now()+seconds*1000;
  lastTickSent=-1;
  publishHostState();
}

function refreshNextRoundGate(){
  if(role!=='host'||hostState?.phase!==PHASES.REVEAL) return;
  const ready=solo||guestAckSeq>=syncSeq;
  $('nextRound').disabled=!ready;
  $('nextRoundWait').hidden=ready;
  if(!ready) $('nextRoundWait').textContent='Waiting for opponent to receive the round result…';
}

function handleHostMessage(message,meta){
  if(!message?.type||!hostState) return;
  const sender=Number(meta?.seat);
  if(message.type==='sb:state-ack'){
    guestAckSeq=Math.max(guestAckSeq,Number(message.seq)||0);
    refreshNextRoundGate();
    maybeStartTimedPhase();
    if(reconnectResumeSeq && guestAckSeq>=reconnectResumeSeq){
      reconnectResumeSeq=0;
      resumeMatch();
    }
    return;
  }
  if(message.type==='sb:resync'){
    resendHostState();
    return;
  }
  if(message.type==='sb:avatar'){
    if(hostState.players[sender] && typeof message.data==='string' && message.data.length<=160000){
      hostState.players[sender].avatar=message.data;
      refreshAvatarUi(hostState);
    }
    return;
  }
  const action=message.type==='sb:phase-ready'?'phase-ready':
    message.type==='sb:draft'?'draft':
    message.type==='sb:lock'?'lock':
    message.type==='sb:guess'?'guess':null;
  if(!action) return;
  if(!flow.actionAllowed(hostState,sender,action,message)){
    resendHostState();
    return;
  }
  if(action==='phase-ready'){
    markPhaseReady(sender,message.phaseToken);
  }else if(action==='draft'){
    hostState.lastDraft=sanitizeFigure(message.figure);
  }else if(action==='lock'){
    lockFigure(sanitizeFigure(message.figure));
  }else if(action==='guess'){
    processGuess(message.x,message.y);
  }
}

function queueRemoteState(state){
  const seq=Number(state?.syncSeq)||0;
  if(!seq||seq<guestAppliedSeq) return;
  if(pendingRemoteState && Number(pendingRemoteState.syncSeq||0)>seq) return;
  pendingRemoteState=state;
  if(remoteRenderRunning) uiEpoch++;
  drainRemoteStates();
}

async function drainRemoteStates(){
  if(remoteRenderRunning) return;
  remoteRenderRunning=true;
  try{
    while(pendingRemoteState){
      const state=pendingRemoteState;
      pendingRemoteState=null;
      const seq=Number(state.syncSeq)||0;
      remoteState=state;
      await applyStateToUI(state,false);
      if(pendingRemoteState && Number(pendingRemoteState.syncSeq||0)>seq) continue;
      if(Number(remoteState?.syncSeq||0)!==seq) continue;
      guestAppliedSeq=Math.max(guestAppliedSeq,seq);
      session?.send({type:'sb:state-ack',seq,phaseToken:state.phaseToken});
    }
  }finally{
    remoteRenderRunning=false;
    if(pendingRemoteState) drainRemoteStates();
  }
}

async function handleGuestMessage(message){
  if(!message?.type) return;
  if(message.type==='sb:lobby-config'){
    if(message.config) $('roomRules').textContent=rulesText(sanitizeSettings(message.config));
    if(Array.isArray(message.players)&&message.players.length>=2){
      $('p0Lobby').textContent=message.players[0]?.name||'Host';
      $('p1Lobby').textContent=message.players[1]?.name||playerName();
    }
    if(localAvatar) session?.send({type:'sb:avatar',seat,data:localAvatar});
    return;
  }
  if(message.type==='sb:avatar'){
    const remoteSeat=Number(message.seat);
    if(remoteState?.players?.[remoteSeat]&&typeof message.data==='string'&&message.data.length<=160000){
      remoteState.players[remoteSeat].avatar=message.data;
      refreshAvatarUi(remoteState);
    }
    return;
  }
  if(message.type==='sb:state'){
    queueRemoteState(message.state);
    return;
  }
  if(message.type==='sb:pulse'||message.type==='sb:tick'){
    if(!remoteState ||
       Number(message.syncSeq)!==Number(remoteState.syncSeq) ||
       Number(message.round)!==Number(remoteState.round) ||
       String(message.phase)!==String(remoteState.phase) ||
       (message.phaseToken&&String(message.phaseToken)!==String(remoteState.phaseToken))){
      requestResync();
      return;
    }
    remoteState.remaining=message.remaining;
    remoteState.paused=!!message.paused;
    if(remoteState.timerStarted&&!remoteState.paused) updateClock(message.remaining);
    return;
  }
  if(message.type==='sb:toast') toast(message.message);
}

function sanitizeFigure(f){
  if(!f) return defaultFigure();
  return {
    x:clamp(Number(f.x)||.5,.02,.98),
    y:clamp(Number(f.y)||.5,.02,.98),
    scale:clamp(Number(f.scale)||.14,.10,.24),
    rotation:clamp(Number(f.rotation)||0,-70,70),
    pose:['stand','lean','crouch','wide'].includes(f.pose)?f.pose:'stand',
    build:['slim','regular','bold'].includes(f.build)?f.build:'regular',
    paintData:typeof f.paintData === 'string' && f.paintData.length < 150000 ? f.paintData : null
  };
}

function exportFigure(){
  return {
    x:figure.x,y:figure.y,scale:figure.scale,rotation:figure.rotation,pose:figure.pose,build:figure.build,
    paintData:paintCanvas.toDataURL('image/png')
  };
}

function sendDraft(){
  if(role==='guest'&&connected&&remoteState?.phase===PHASES.HIDE&&remoteState.hiderSeat===seat){
    actionMessage('sb:draft',{figure:exportFigure()});
  }else if(role==='host'&&hostState?.phase===PHASES.HIDE&&hostState.hiderSeat===seat){
    hostState.lastDraft=exportFigure();
  }
}

function lockCurrentHide(){
  const state=getState();
  if(!state||state.phase!==PHASES.HIDE||state.hiderSeat!==seat) return;
  if(!state.timerStarted||state.paused){
    toast('Your hiding turn is not active yet.');
    return;
  }
  const f=exportFigure();
  if(role==='host') lockFigure(f);
  else actionMessage('sb:lock',{figure:f});
  showStageMessage('Hiding spot locked','Preparing the Seeker’s view…');
  $('hiderControls').hidden=true;
}

function lockFigure(f){
  if(!hostState||hostState.phase!==PHASES.HIDE) return;
  hostState.figure=sanitizeFigure(f||hostState.lastDraft||defaultFigure());
  hostState.wrong=0;
  hostState.guessMarks=[];
  setHostPhase(PHASES.SEEK_PREPARE);
  publishHostState();
}

function processGuess(x,y){
  if(!hostState || hostState.phase !== 'seek' || !hostState.figure) return;
  x=clamp(Number(x)||0,0,1); y=clamp(Number(y)||0,0,1);
  const f=hostState.figure;
  const ratio = sceneImage?.naturalWidth && sceneImage?.naturalHeight ? sceneImage.naturalHeight/sceneImage.naturalWidth : .75;
  const buildWidth=f.build==='bold'?1.28:(f.build==='slim'?.90:1.08);
  const rx = Math.max(.022,f.scale*ratio*.42*buildWidth);
  const ry = Math.max(.03,f.scale*.52);
  const dx=(x-f.x)/rx, dy=(y-f.y)/ry;
  const hit=dx*dx+dy*dy <= 1.15;

  hostState.guessMarks.push({x,y,hit});
  if(hit){
    finishRound(true);
  }else{
    hostState.wrong += 1;
    const penaltySeconds=hostState.config.wrongPenaltyMode==='time'
      ? Math.max(0,Number(hostState.config.wrongPenaltySeconds)||0)
      : 0;
    if(penaltySeconds>0){
      hostState.deadline=Math.max(Date.now(),hostState.deadline-penaltySeconds*1000);
    }
    const missText=penaltySeconds>0 ? 'MISS · −'+penaltySeconds+' sec' : 'MISS';
    if(role === 'host') {
      guessMarks = hostState.guessMarks.slice();
      flashGuess(missText.toUpperCase(),false);
      updateScoreboard(hostState);
      markDirty();
    }
    if(!solo&&session) session.sendTo(1,{type:'sb:toast',message:missText});
    publishHostState();
  }
}

function finishRound(found){
  if(!hostState||hostState.phase!==PHASES.SEEK) return;
  const remaining=Math.max(0,Math.ceil((hostState.deadline-Date.now())/1000));
  const elapsed=hostState.config.seekSeconds-remaining;
  const seeker=hostState.seekerSeat;
  const hider=hostState.hiderSeat;
  const seekerPoints=found ? 500 + remaining*10 : 0;
  const hiderPoints=(found ? elapsed*10 : 1000);
  hostState.players[seeker].score += seekerPoints;
  hostState.players[hider].score += hiderPoints;
  hostState.result={found,remaining,seekerPoints,hiderPoints,wrong:hostState.wrong};
  setHostPhase(PHASES.REVEAL);
  publishHostState();
}

function nextRound(){
  if(role!=='host'||!hostState||hostState.phase!==PHASES.REVEAL) return;
  if(!solo && guestAckSeq<syncSeq){
    toast('Waiting for the other player to receive the round result.');
    return;
  }
  const next=hostState.round+1;
  if(next >= hostState.config.rounds){
    setHostPhase(PHASES.FINAL);
    publishHostState();
  }else beginRound(next);
}

function rematch(){
  if(role !== 'host') return;
  if(solo){
    hostState.players.forEach(p=>p.score=0);
    beginRound(0);
    return;
  }
  if(!connected) return;
  hostState.players.forEach(p=>p.score=0);
  beginRound(0);
}

function pauseMatch(message){
  if(!hostState||![PHASES.HIDE,PHASES.SEEK].includes(hostState.phase)||!hostState.timerStarted) return;
  hostState.paused=true;
  hostState.pauseRemaining=Math.max(0,hostState.deadline-Date.now());
  hostState.deadline=0;
  toast(message);
}

function resumeMatch(){
  if(!hostState?.paused) return;
  hostState.paused=false;
  hostState.deadline=Date.now()+Math.max(1000,hostState.pauseRemaining||30000);
  hostState.pauseRemaining=0;
  publishHostState();
}

function getState(){
  return role === 'host' ? hostState : remoteState;
}

async function applyHostView(){
  if(!hostState) return;
  await applyStateToUI(hostState,true);
}

async function applyRemoteView(){
  if(!remoteState) return;
  await applyStateToUI(remoteState,false);
}

async function applyStateToUI(state,isHost){
  const epoch=++uiEpoch;
  const phaseKey=String(state.round)+':'+String(state.phase)+':'+String(state.scene?.id||'');
  const enteringPhase=phaseKey!==lastUiPhaseKey;
  $('lobbyPanel').hidden=true;
  $('gameShell').hidden=false;
  updateScoreboard(state);
  if(state.timerStarted) updateClock(state.remaining ?? Math.max(0,(state.deadline||0)-Date.now()));
  else {
    $('clock').textContent='--:--';
    $('clock').style.color='';
  }

  if(state.phase === 'final'){
    showFinal(state,isHost);
    return;
  }

  let sceneLoaded = !!sceneImage && scene?.id === state.scene?.id;
  if(scene?.id !== state.scene?.id || !sceneImage) sceneLoaded=await loadScene(state.scene);
  if(epoch!==uiEpoch) return;
  if(sceneLoaded && state.phase==='hide' && !state.timerStarted){
    reportPhaseReady(state);
  }

  reveal = state.phase === 'reveal';
  guessMarks = (state.guessMarks||[]).slice();

  if((state.phase === 'seek' || state.phase === 'reveal') && state.figure){
    figure=sanitizeFigure(state.figure);
    clampFigureToArtwork();
    await importPaintData(figure.paintData);
    if(epoch!==uiEpoch) return;
  }

  $('roundLabel').textContent='ROUND '+(state.round+1)+' / '+state.config.rounds;
  $('phaseLabel').textContent=(state.phase==='hide' && !state.timerStarted) ? 'LOADING' : state.phase.toUpperCase();
  $('hiderControls').hidden=true;
  $('seekerControls').hidden=true;
  $('waitingControls').hidden=true;
  $('revealControls').hidden=true;
  $('finalControls').hidden=true;
  $('viewControls').hidden=true;
  window.StreetblendAvatar?.setStudioVisible(false);
  window.StreetblendAvatar?.setOpponent(null);
  hideStageMessage();

  if(state.phase === 'hide'){
    if(state.hiderSeat === seat){
      if(enteringPhase){
        resetFigureForHide();
        camera={cx:.5,cy:.5,zoom:2.1};
        activeTool='place';
        setToolButtons();
      }
      $('hiderControls').hidden=false;
      $('viewControls').hidden=false;
      $('lockHide').disabled=!state.timerStarted;
      $('hiderHint').textContent=state.timerStarted
        ? 'Drag the figure. Pinch the figure to resize or rotate. Drag the background to pan; pinch the background to zoom.'
        : 'Painting loaded. Your figure is ready; waiting for the round timer to start…';
    }else{
      if(enteringPhase) camera={cx:.5,cy:.5,zoom:1};
      $('waitingControls').hidden=false;
      $('waitingRole').textContent='SEEKER';
      $('waitingTitle').textContent='The Hider is blending in…';
      $('waitingText').textContent='Customize your icon while the Hider prepares the scene.';
      refreshAvatarUi(state);
      showStageMessage('No peeking','The Hider is painting camouflage.');
    }
  }else if(state.phase === 'seek'){
    if(state.seekerSeat === seat || solo){
      if(enteringPhase) camera={cx:.5,cy:.5,zoom:1};
      $('wrongCount').textContent=String(state.wrong||0);
      const penaltySeconds=state.config?.wrongPenaltyMode==='time' ? Number(state.config.wrongPenaltySeconds)||0 : 0;
      $('penaltyValue').textContent=penaltySeconds>0 ? '−'+penaltySeconds+' sec' : 'None';
      $('penaltyLabel').textContent=penaltySeconds>0 ? 'per wrong tap' : 'wrong-tap penalty';
      $('seekHint').textContent=penaltySeconds>0
        ? 'Quick tap = guess · drag = pan · pinch = zoom · wrong tap = −'+penaltySeconds+' sec.'
        : 'Quick tap = guess · drag = pan · pinch = zoom.';
      $('seekerControls').hidden=false;
    }else{
      if(enteringPhase) camera={cx:.5,cy:.5,zoom:1};
      $('waitingControls').hidden=false;
      $('waitingRole').textContent='HIDER';
      $('waitingTitle').textContent='Stay hidden…';
      $('waitingText').textContent='The Seeker is searching. Their icon is below, and you can keep customizing yours while you wait.';
      refreshAvatarUi(state);
    }
  }else if(state.phase === 'reveal'){
    if(enteringPhase) camera={cx:.5,cy:.5,zoom:1};
    showReveal(state,isHost);
  }
  lastUiPhaseKey=phaseKey;
  markDirty();
}

function resetFigureForHide(){
  figure=defaultFigure();
  resetPaint();
  paintColor='#ffffff';
  $('paintSwatch').style.background=paintColor;
  $('poseSelect').value='stand';
  $('buildSelect').value='regular';
  if(role==='host') hostState.lastDraft=exportFigure();
}

function updateScoreboard(state){
  const players=state.players||[{name:'Player 1',score:0},{name:'Player 2',score:0}];
  $('p0Match').querySelector('span').textContent=players[0].name;
  $('p0Match').querySelector('b').textContent=players[0].score;
  $('p1Match').querySelector('span').textContent=players[1].name;
  $('p1Match').querySelector('b').textContent=players[1].score;
  window.StreetblendAvatar?.setMatchAvatars(players);
  $('p0Match').classList.toggle('active',state.hiderSeat===0 && state.phase==='hide' || state.seekerSeat===0 && state.phase==='seek');
  $('p1Match').classList.toggle('active',state.hiderSeat===1 && state.phase==='hide' || state.seekerSeat===1 && state.phase==='seek');
}

function updateClock(ms){
  let sec=Math.max(0,Math.ceil((Number(ms)||0)/1000));
  $('clock').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
  $('clock').style.color=sec<=10 && sec>0 ? 'var(--danger)' : '';
}

function showReveal(state,isHost){
  $('revealControls').hidden=false;
  const r=state.result||{};
  $('revealTitle').textContent=r.found?'Found!':'Time ran out!';
  $('revealText').textContent=r.found
    ? 'The hidden figure is outlined. The Seeker found it with '+r.remaining+' seconds left.'
    : 'The Hider survived the entire search.';
  const h=state.players[state.hiderSeat], s=state.players[state.seekerSeat];
  $('roundScore').innerHTML=
    '<div><b>+'+(r.hiderPoints||0)+'</b><span>'+escapeHtml(h.name)+' · Hider</span></div>'+
    '<div><b>+'+(r.seekerPoints||0)+'</b><span>'+escapeHtml(s.name)+' · Seeker</span></div>';
  $('nextRound').hidden=!isHost;
  if(isHost){
    refreshNextRoundGate();
  }else{
    $('nextRoundWait').hidden=false;
    $('nextRoundWait').textContent='Waiting for the host…';
  }
  markDirty();
}

function showFinal(state,isHost){
  $('hiderControls').hidden=true;
  $('seekerControls').hidden=true;
  $('waitingControls').hidden=true;
  $('revealControls').hidden=true;
  $('finalControls').hidden=false;
  $('viewControls').hidden=true;
  const [a,b]=state.players;
  const winner=a.score===b.score?'Tie game':(a.score>b.score?a.name:b.name)+' wins!';
  $('finalTitle').textContent=winner;
  $('finalScore').innerHTML=
    '<div><b>'+a.score+'</b><span>'+escapeHtml(a.name)+'</span></div>'+
    '<div><b>'+b.score+'</b><span>'+escapeHtml(b.name)+'</span></div>';
  $('rematch').hidden=!isHost;
  $('phaseLabel').textContent='FINAL';
  updateClock(0);
  reveal=true;
  markDirty();
}

function showStageMessage(title,text){
  $('stageMessageTitle').textContent=title;
  $('stageMessageText').textContent=text;
  $('stageMessage').hidden=false;
  $('stageMessage').style.display='grid';
}
function hideStageMessage(){
  $('stageMessage').hidden=true;
  $('stageMessage').style.display='none';
}

function flashGuess(text,good){
  $('guessFlash').textContent=text;
  $('guessFlash').style.color=good?'var(--accent)':'var(--danger)';
  $('guessFlash').hidden=false;
  setTimeout(()=>$('guessFlash').hidden=true,1000);
}

function loadImageDirect(url,useCors){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    if(useCors) img.crossOrigin='anonymous';
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('Image request failed.'));
    img.src=url;
  });
}

async function loadScene(nextScene){
  if(!nextScene) return false;
  scene=nextScene;
  const token=++sceneToken;
  sceneImage=null;
  sceneSamplingAvailable=false;
  $('artTitle').textContent=scene.title || 'Loading artwork…';
  $('artArtist').textContent=[scene.artist,scene.date].filter(Boolean).join(' · ');
  $('artSource').href=scene.sourceUrl || 'https://www.artic.edu/';
  showStageMessage('Loading painting','Loading artwork…');

  const urls=Array.from(new Set([scene.imageUrl,scene.imageLarge].filter(Boolean)));
  let img=null;
  let corsLoaded=false;

  for(const url of urls){
    try{
      img=await loadImageDirect(url,true);
      corsLoaded=true;
      break;
    }catch(_){}
  }

  if(!img){
    for(const url of urls){
      try{
        img=await loadImageDirect(url,false);
        corsLoaded=false;
        break;
      }catch(_){}
    }
  }

  if(token!==sceneToken) return false;

  if(!img){
    showStageMessage('Painting unavailable','This direct museum image could not be loaded. Try another round or reload.');
    toast('Could not load painting image.');
    return false;
  }

  sceneImage=img;
  sceneSamplingAvailable=corsLoaded;

  sceneBuffer.width=img.naturalWidth;
  sceneBuffer.height=img.naturalHeight;
  sceneBufferCtx.clearRect(0,0,sceneBuffer.width,sceneBuffer.height);
  try{
    sceneBufferCtx.drawImage(img,0,0);
    if(corsLoaded){
      sceneBufferCtx.getImageData(0,0,1,1);
    }
  }catch(_){
    sceneSamplingAvailable=false;
  }

  $('hiderHint').textContent=sceneSamplingAvailable
    ? 'Tap the painting to position your figure. Use Sample, then Paint to camouflage it.'
    : 'Tap to position your figure. Direct image loaded; choose paint colors manually if sampling is blocked.';
  hideStageMessage();
  markDirty();
  return true;
}

function resizeStage(){
  const rect=$('stageWrap').getBoundingClientRect();
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(2,Math.round(rect.width*dpr));
  const h=Math.max(2,Math.round(rect.height*dpr));
  if(stage.width!==w || stage.height!==h){
    stage.width=w;stage.height=h;
    markDirty();
  }
}

function getTransform(){
  if(!sceneImage) return null;
  const iw=sceneImage.naturalWidth, ih=sceneImage.naturalHeight;
  const fit=Math.min(stage.width/iw,stage.height/ih);
  const scale=fit*camera.zoom;
  const dx=stage.width/2-camera.cx*iw*scale;
  const dy=stage.height/2-camera.cy*ih*scale;
  return {iw,ih,fit,scale,dx,dy};
}

function screenToImage(px,py){
  const t=getTransform();
  if(!t) return null;
  return {
    x:clamp((px-t.dx)/(t.iw*t.scale),0,1),
    y:clamp((py-t.dy)/(t.ih*t.scale),0,1)
  };
}

function imageToScreen(x,y){
  const t=getTransform();
  if(!t) return null;
  return {x:t.dx+x*t.iw*t.scale,y:t.dy+y*t.ih*t.scale};
}

function clampCamera(){
  const z=Math.max(1,camera.zoom);
  const margin=.5/z;
  camera.cx=clamp(camera.cx,margin,1-margin);
  camera.cy=clamp(camera.cy,margin,1-margin);
}

function fitArtwork(){
  camera={cx:.5,cy:.5,zoom:1};
  markDirty();
}

function focusPlayer(){
  if(!sceneImage || !figure) return;
  resizeStage();
  const t=getTransform();
  if(!t) return;
  const targetHeight=stage.height*.72;
  const baseFigureHeight=Math.max(1,figure.scale*t.ih*t.fit);
  camera.zoom=clamp(targetHeight/baseFigureHeight,1,5);
  camera.cx=figure.x;
  camera.cy=figure.y;
  clampCamera();
  markDirty();
  toast('Player focused.');
}

function draw(){
  raf=0;
  if(!dirty) return;
  dirty=false;
  resizeStage();
  ctx.clearRect(0,0,stage.width,stage.height);
  if(!sceneImage) return;
  const t=getTransform();
  ctx.drawImage(sceneImage,t.dx,t.dy,t.iw*t.scale,t.ih*t.scale);

  const state=getState();
  const shouldDrawFigure = !!figure && (
    state?.phase==='seek' || state?.phase==='reveal' ||
    (state?.phase==='hide' && state?.hiderSeat===seat)
  );
  if(shouldDrawFigure) drawFigure(
    t,
    state?.phase==='reveal',
    state?.phase==='hide' && state?.hiderSeat===seat && activeTool==='place'
  );

  if(state?.phase==='seek' || state?.phase==='reveal'){
    drawGuessMarks(t, state?.guessMarks || guessMarks);
  }
}

function markDirty(){
  dirty=true;
  if(!raf) raf=requestAnimationFrame(draw);
}

function rebuildFigureCanvas(){
  figureCtx.clearRect(0,0,PAINT_W,PAINT_H);

  figureCtx.globalCompositeOperation='source-over';
  figureCtx.fillStyle='#fff';
  figureCtx.strokeStyle='#fff';
  drawSilhouette(figureCtx,figure.pose,PAINT_W,PAINT_H,figure.build);

  figureCtx.globalCompositeOperation='source-in';
  figureCtx.drawImage(paintCanvas,0,0);

  figureCtx.globalCompositeOperation='source-over';
}

function drawSilhouette(c,pose,w,h,build='regular'){
  c.save();
  c.lineCap='round';
  c.lineJoin='round';
  c.strokeStyle='#fff';
  c.fillStyle='#fff';
  const thickness=build==='bold'?1.55:(build==='slim'?.82:1.15);
  const headY=pose==='crouch'?38:24;
  c.beginPath();c.arc(w*.5,headY,w*.12*Math.sqrt(thickness),0,Math.PI*2);c.fill();

  c.lineWidth=w*.17*thickness;
  c.beginPath();
  if(pose==='lean'){c.moveTo(w*.48,headY+w*.13);c.lineTo(w*.61,h*.55);}
  else if(pose==='crouch'){c.moveTo(w*.5,headY+w*.12);c.lineTo(w*.47,h*.48);}
  else {c.moveTo(w*.5,headY+w*.12);c.lineTo(w*.5,h*.58);}
  c.stroke();

  c.lineWidth=w*.10*thickness;
  c.beginPath();
  if(pose==='wide'){
    c.moveTo(w*.48,h*.25);c.lineTo(w*.18,h*.43);
    c.moveTo(w*.52,h*.25);c.lineTo(w*.82,h*.43);
    c.moveTo(w*.47,h*.57);c.lineTo(w*.25,h*.94);
    c.moveTo(w*.53,h*.57);c.lineTo(w*.75,h*.94);
  }else if(pose==='lean'){
    c.moveTo(w*.52,h*.28);c.lineTo(w*.25,h*.43);
    c.moveTo(w*.58,h*.31);c.lineTo(w*.83,h*.24);
    c.moveTo(w*.58,h*.56);c.lineTo(w*.45,h*.94);
    c.moveTo(w*.62,h*.56);c.lineTo(w*.78,h*.90);
  }else if(pose==='crouch'){
    c.moveTo(w*.48,h*.27);c.lineTo(w*.26,h*.45);
    c.moveTo(w*.52,h*.28);c.lineTo(w*.74,h*.44);
    c.moveTo(w*.47,h*.48);c.lineTo(w*.25,h*.68);c.lineTo(w*.18,h*.88);
    c.moveTo(w*.50,h*.48);c.lineTo(w*.72,h*.67);c.lineTo(w*.83,h*.84);
  }else{
    c.moveTo(w*.48,h*.28);c.lineTo(w*.28,h*.50);
    c.moveTo(w*.52,h*.28);c.lineTo(w*.72,h*.50);
    c.moveTo(w*.48,h*.57);c.lineTo(w*.35,h*.96);
    c.moveTo(w*.52,h*.57);c.lineTo(w*.65,h*.96);
  }
  c.stroke();
  c.restore();
}

function figureMetrics(){
  const t=getTransform();
  const p=imageToScreen(figure.x,figure.y);
  if(!t || !p) return null;
  const h=figure.scale*t.ih*t.scale;
  const widthFactor=figure.build==='bold'?1.28:(figure.build==='slim'?.90:1.08);
  const w=h*(PAINT_W/PAINT_H)*widthFactor;
  return {t,p,w,h};
}

function clampFigureToArtwork(){
  if(!figure) return;
  const imageRatio=sceneImage?.naturalWidth && sceneImage?.naturalHeight
    ? sceneImage.naturalHeight/sceneImage.naturalWidth
    : .75;
  const widthFactor=figure.build==='bold'?1.28:(figure.build==='slim'?.90:1.08);
  const normalizedWidth=figure.scale*imageRatio*(PAINT_W/PAINT_H)*widthFactor;
  const halfX=clamp(normalizedWidth/2,.015,.45);
  const halfY=clamp(figure.scale/2,.02,.45);
  figure.x=clamp(figure.x,halfX,1-halfX);
  figure.y=clamp(figure.y,halfY,1-halfY);
}

function figureLocalPoint(px,py){
  const m=figureMetrics();
  if(!m) return null;
  const dx=px-m.p.x;
  const dy=py-m.p.y;
  const a=-figure.rotation*Math.PI/180;
  return {
    m,
    x:dx*Math.cos(a)-dy*Math.sin(a),
    y:dx*Math.sin(a)+dy*Math.cos(a)
  };
}

function pointHitsFigure(px,py){
  const p=figureLocalPoint(px,py);
  if(!p) return false;
  return Math.abs(p.x)<=p.m.w*.72 && Math.abs(p.y)<=p.m.h*.60;
}

function figureHandleAt(px,py){
  const p=figureLocalPoint(px,py);
  if(!p) return null;
  const dpr=window.devicePixelRatio||1;
  const radius=18*dpr;
  const rotate={x:0,y:-p.m.h*.76};
  const resize={x:p.m.w*.70,y:p.m.h*.64};
  if(Math.hypot(p.x-rotate.x,p.y-rotate.y)<=radius) return 'rotate';
  if(Math.hypot(p.x-resize.x,p.y-resize.y)<=radius) return 'resize';
  return null;
}

function drawFigure(t,revealOutline,selected){
  rebuildFigureCanvas();
  const p=imageToScreen(figure.x,figure.y);
  if(!p) return;
  const h=figure.scale*t.ih*t.scale;
  const widthFactor=figure.build==='bold'?1.28:(figure.build==='slim'?.90:1.08);
  const w=h*(PAINT_W/PAINT_H)*widthFactor;
  const dpr=window.devicePixelRatio||1;

  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.rotate(figure.rotation*Math.PI/180);

  if(selected){
    ctx.save();
    ctx.strokeStyle='rgba(255,255,255,.98)';
    ctx.lineWidth=2*dpr;
    ctx.setLineDash([6*dpr,4*dpr]);
    ctx.strokeRect(-w*.62,-h*.56,w*1.24,h*1.12);
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(0,-h*.56);
    ctx.lineTo(0,-h*.70);
    ctx.stroke();
    const handleR=14*dpr;
    ctx.fillStyle='rgba(8,13,20,.96)';
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=2*dpr;
    ctx.beginPath();ctx.arc(0,-h*.76,handleR,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='900 '+(14*dpr)+'px sans-serif';
    ctx.fillText('↻',0,-h*.76);
    ctx.font='800 '+(6*dpr)+'px sans-serif';
    ctx.fillText('ROTATE',0,-h*.76-handleR-7*dpr);

    ctx.fillStyle='rgba(8,13,20,.96)';
    ctx.strokeStyle='#ffffff';
    ctx.beginPath();ctx.arc(w*.70,h*.64,handleR,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffffff';
    ctx.font='900 '+(12*dpr)+'px sans-serif';
    ctx.fillText('⤢',w*.70,h*.64);
    ctx.font='800 '+(6*dpr)+'px sans-serif';
    ctx.fillText('SIZE',w*.70,h*.64+handleR+7*dpr);

    ctx.restore();
  }

  if(revealOutline){
    ctx.shadowColor='rgba(255,80,105,.95)';
    ctx.shadowBlur=18*dpr;
    ctx.strokeStyle='#ff5d73';
    ctx.lineWidth=4*dpr;
    ctx.strokeRect(-w*.58,-h*.55,w*1.16,h*1.10);
  }

  ctx.drawImage(figureCanvas,-w/2,-h/2,w,h);
  ctx.restore();
}

function drawGuessMarks(t,marks){
  if(!marks?.length) return;
  for(const m of marks){
    const p=imageToScreen(m.x,m.y);
    if(!p) continue;
    ctx.save();
    ctx.strokeStyle=m.hit?'#7fd6c2':'#ff7184';
    ctx.lineWidth=2*(window.devicePixelRatio||1);
    const r=10*(window.devicePixelRatio||1);
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(p.x-r*.6,p.y);ctx.lineTo(p.x+r*.6,p.y);ctx.moveTo(p.x,p.y-r*.6);ctx.lineTo(p.x,p.y+r*.6);ctx.stroke();
    ctx.restore();
  }
}

function importPaintData(data){
  if(!data){
    resetPaint();
    return Promise.resolve();
  }
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      paintCtx.clearRect(0,0,PAINT_W,PAINT_H);
      paintCtx.drawImage(img,0,0,PAINT_W,PAINT_H);
      markDirty();resolve();
    };
    img.onerror=()=>{resetPaint();resolve();};
    img.src=data;
  });
}

function hideSampleLoupe(){
  $('sampleLoupe').hidden=true;
}

function currentSampleDiameter(){
  return Math.max(1,Math.round(Number($('brushSize').value)||1));
}

function showSampleLoupe(norm,pointer,sample){
  if(!sceneSamplingAvailable || !norm || !pointer || !sample) return;
  try{
    StreetblendSampler.drawLoupe(sampleLoupeCtx,sampleLoupeCanvas,sceneBuffer,sample);
    $('sampleHex').textContent=sample.hex+' · '+sample.diameter+'px';
    const wrap=$('stageWrap').getBoundingClientRect();
    const x=clamp(pointer.cx,52,wrap.width-52);
    const y=clamp(pointer.cy,104,wrap.height-8);
    $('sampleLoupe').style.left=x+'px';
    $('sampleLoupe').style.top=y+'px';
    $('sampleLoupe').hidden=false;
  }catch(_){}
}

function sampleColor(norm,pointer=null,quiet=false){
  if(!sceneImage || !norm || !window.StreetblendSampler) return false;
  try{
    const sample=StreetblendSampler.aggregateColor(
      sceneBufferCtx,
      sceneBuffer,
      norm,
      currentSampleDiameter()
    );
    paintColor=sample.hex;
    $('paintSwatch').style.background=paintColor;
    $('hiderHint').textContent='Sampling '+paintColor+' from '+sample.diameter+'px area · hold and slide for precise control.';
    if(pointer) showSampleLoupe(norm,pointer,sample);
    if(!quiet) toast('Sampled '+paintColor+' from '+sample.diameter+'px area');
    return true;
  }catch(_){
    sceneSamplingAvailable=false;
    hideSampleLoupe();
    if(!quiet) toast('Color sampling is blocked for this image. Tap the color swatch to choose a paint color.');
    return false;
  }
}

function enterPaintAfterSample(){
  activeTool='paint';
  setToolButtons();
  $('hiderHint').textContent='Paint with '+paintColor+' · drag over your player to apply the sampled color.';
}

function paintAt(px,py){
  const t=getTransform();
  const p=imageToScreen(figure.x,figure.y);
  if(!t || !p) return;
  const h=figure.scale*t.ih*t.scale;
  const widthFactor=figure.build==='bold'?1.28:(figure.build==='slim'?.90:1.08);
  const w=h*(PAINT_W/PAINT_H)*widthFactor;
  const dx=px-p.x,dy=py-p.y;
  const a=-figure.rotation*Math.PI/180;
  const lx=dx*Math.cos(a)-dy*Math.sin(a);
  const ly=dx*Math.sin(a)+dy*Math.cos(a);
  const fx=(lx/w+.5)*PAINT_W;
  const fy=(ly/h+.5)*PAINT_H;
  if(fx<0||fy<0||fx>PAINT_W||fy>PAINT_H) return;
  paintCtx.save();
  paintCtx.globalAlpha=clamp((Number($('paintOpacity').value)||100)/100,.1,1);
  paintCtx.fillStyle=paintColor;
  paintCtx.beginPath();
  paintCtx.arc(fx,fy,Number($('brushSize').value)||14,0,Math.PI*2);
  paintCtx.fill();
  paintCtx.restore();
  markDirty();
}

function setToolButtons(){
  document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===activeTool));
}

function sendGuess(norm){
  const state=getState();
  if(!state||state.phase!==PHASES.SEEK||!state.timerStarted||state.paused||(state.seekerSeat!==seat&&!solo)) return;
  if(role==='host') processGuess(norm.x,norm.y);
  else actionMessage('sb:guess',{x:norm.x,y:norm.y});
}

function pointerXY(event){
  const rect=stage.getBoundingClientRect();
  const sx=stage.width/rect.width, sy=stage.height/rect.height;
  const cx=event.clientX-rect.left, cy=event.clientY-rect.top;
  return {x:cx*sx,y:cy*sy,cx,cy};
}

function cancelSampleHold(hide=true){
  clearTimeout(sampleHoldTimer);
  sampleHoldTimer=null;
  sampleHold=null;
  if(hide) hideSampleLoupe();
}

function onPointerDown(e){
  stage.setPointerCapture?.(e.pointerId);
  const p=pointerXY(e);
  pointers.set(e.pointerId,p);

  if(pointers.size===1){
    pointerStart={id:e.pointerId,x:p.x,y:p.y,cx:p.cx,cy:p.cy,lastX:p.x,lastY:p.y,moved:false};
  }

  const state=getState();

  if(pointers.size===2){
    cancelSampleHold();
    const pts=[...pointers.values()];
    const midpoint={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
    const d=distance(pts[0],pts[1]);
    const a=angleBetween(pts[0],pts[1]);

    if(
      state?.phase==='hide' &&
      state.hiderSeat===seat &&
      activeTool==='place' &&
      (draggingFigure || figureHandleDrag || pointHitsFigure(midpoint.x,midpoint.y))
    ){
      figureTransform={distance:d,angle:a,scale:figure.scale,rotation:figure.rotation};
      draggingFigure=null;
      figureHandleDrag=null;
      pinchStart=null;
    }else{
      pinchStart={distance:d,zoom:camera.zoom};
      figureTransform=null;
      figureHandleDrag=null;
    }
    pointerStart=null;
    return;
  }

  if(state?.phase==='hide' && state.hiderSeat===seat){
    if(activeTool==='place'){
      const handle=figureHandleAt(p.x,p.y);
      if(handle){
        const m=figureMetrics();
        const center=m?.p;
        if(center){
          figureHandleDrag={
            type:handle,
            pointerId:e.pointerId,
            scale:figure.scale,
            rotation:figure.rotation,
            center:{x:center.x,y:center.y},
            startDistance:Math.max(1,Math.hypot(p.x-center.x,p.y-center.y)),
            startAngle:Math.atan2(p.y-center.y,p.x-center.x)
          };
          if(pointerStart) pointerStart.moved=true;
        }
      }else if(pointHitsFigure(p.x,p.y)){
        draggingFigure={pointerId:e.pointerId};
      }
    }else if(activeTool==='paint' && pointHitsFigure(p.x,p.y)){
      paintingPointer=e.pointerId;
      paintAt(p.x,p.y);
    }else if(activeTool==='sample'){
      sampleHold={pointerId:e.pointerId,latest:p,active:false};
      clearTimeout(sampleHoldTimer);
      sampleHoldTimer=setTimeout(()=>{
        if(!sampleHold || sampleHold.pointerId!==e.pointerId || !pointers.has(e.pointerId)) return;
        sampleHold.active=true;
        if(pointerStart?.id===e.pointerId) pointerStart.moved=true;
        const latest=sampleHold.latest;
        sampleColor(screenToImage(latest.x,latest.y),latest,true);
      },180);
    }
  }
}

function onPointerMove(e){
  if(!pointers.has(e.pointerId)) return;
  const p=pointerXY(e);
  pointers.set(e.pointerId,p);

  if(pointers.size>=2){
    const pts=[...pointers.values()];
    if(figureTransform){
      const ratio=distance(pts[0],pts[1])/Math.max(1,figureTransform.distance);
      const angleDelta=(angleBetween(pts[0],pts[1])-figureTransform.angle)*180/Math.PI;
      figure.scale=clamp(figureTransform.scale*ratio,.10,.24);
      figure.rotation=clamp(figureTransform.rotation+normalizeAngle(angleDelta),-70,70);
      clampFigureToArtwork();
      markDirty();
    }else if(pinchStart){
      const ratio=distance(pts[0],pts[1])/Math.max(1,pinchStart.distance);
      camera.zoom=clamp(pinchStart.zoom*ratio,1,5);
      clampCamera();
      markDirty();
    }
    return;
  }

  const state=getState();

  if(sampleHold?.pointerId===e.pointerId){
    sampleHold.latest=p;
    if(sampleHold.active){
      sampleColor(screenToImage(p.x,p.y),p,true);
      if(pointerStart) pointerStart.moved=true;
      return;
    }
    if(pointerStart && Math.hypot(p.cx-pointerStart.cx,p.cy-pointerStart.cy)>8){
      clearTimeout(sampleHoldTimer);
      sampleHoldTimer=null;
      sampleHold=null;
      hideSampleLoupe();
    }
  }

  if(state?.phase==='hide' && state.hiderSeat===seat && figureHandleDrag?.pointerId===e.pointerId){
    const h=figureHandleDrag;
    if(h.type==='resize'){
      const dist=Math.max(1,Math.hypot(p.x-h.center.x,p.y-h.center.y));
      figure.scale=clamp(h.scale*(dist/h.startDistance),.10,.24);
      clampFigureToArtwork();
    }else if(h.type==='rotate'){
      const angle=Math.atan2(p.y-h.center.y,p.x-h.center.x);
      const delta=normalizeAngle((angle-h.startAngle)*180/Math.PI);
      figure.rotation=clamp(h.rotation+delta,-70,70);
    }
    if(pointerStart) pointerStart.moved=true;
    markDirty();
    return;
  }

  if(state?.phase==='hide' && state.hiderSeat===seat && draggingFigure?.pointerId===e.pointerId){
    const n=screenToImage(p.x,p.y);
    if(n){
      figure.x=n.x;
      figure.y=n.y;
      clampFigureToArtwork();
      markDirty();
    }
    if(pointerStart) pointerStart.moved=true;
    return;
  }

  if(state?.phase==='hide' && state.hiderSeat===seat && activeTool==='paint' && paintingPointer===e.pointerId){
    paintAt(p.x,p.y);
    if(pointerStart) pointerStart.moved=true;
    return;
  }

  const canPan =
    (state?.phase==='hide' && state.hiderSeat===seat) ||
    (state?.phase==='seek' && (state.seekerSeat===seat || solo)) ||
    state?.phase==='reveal';

  if(canPan && pointerStart){
    const dx=p.x-pointerStart.lastX,dy=p.y-pointerStart.lastY;
    if(Math.hypot(p.cx-pointerStart.cx,p.cy-pointerStart.cy)>8) pointerStart.moved=true;
    if(pointerStart.moved){
      const t=getTransform();
      if(t){
        camera.cx-=dx/(t.iw*t.scale);
        camera.cy-=dy/(t.ih*t.scale);
        clampCamera();
        markDirty();
      }
    }
    pointerStart.lastX=p.x;
    pointerStart.lastY=p.y;
  }
}

function onPointerUp(e){
  const p=pointerXY(e);
  const state=getState();
  const wasTap=!!(pointerStart && pointerStart.id===e.pointerId && !pointerStart.moved);
  const activeSample=sampleHold?.pointerId===e.pointerId && sampleHold.active;

  if(sampleHold?.pointerId===e.pointerId){
    clearTimeout(sampleHoldTimer);
    sampleHoldTimer=null;
    if(activeSample){
      const sampled=sampleColor(screenToImage(p.x,p.y),p,true);
      hideSampleLoupe();
      if(sampled) enterPaintAfterSample();
    }
    sampleHold=null;
  }

  if(figureTransform){
    figureTransform=null;
    sendDraft();
  }else if(state?.phase==='hide' && state.hiderSeat===seat){
    if(figureHandleDrag?.pointerId===e.pointerId){
      figureHandleDrag=null;
      sendDraft();
    }else if(draggingFigure?.pointerId===e.pointerId){
      draggingFigure=null;
      sendDraft();
    }else if(activeTool==='paint' && paintingPointer===e.pointerId){
      paintingPointer=null;
      sendDraft();
    }else if(wasTap && activeTool==='place'){
      if(!pointHitsFigure(p.x,p.y) && !figureHandleAt(p.x,p.y)){
        const n=screenToImage(p.x,p.y);
        if(n){
          figure.x=n.x;
          figure.y=n.y;
          clampFigureToArtwork();
          sendDraft();
          markDirty();
        }
      }
    }else if(wasTap && activeTool==='sample' && !activeSample){
      const sampled=sampleColor(screenToImage(p.x,p.y),p,false);
      hideSampleLoupe();
      if(sampled) enterPaintAfterSample();
    }
  }else if(state?.phase==='seek' && (state.seekerSeat===seat || solo) && wasTap){
    const n=screenToImage(p.x,p.y);
    if(n) sendGuess(n);
  }

  if(figureHandleDrag?.pointerId===e.pointerId) figureHandleDrag=null;
  if(draggingFigure?.pointerId===e.pointerId) draggingFigure=null;
  if(paintingPointer===e.pointerId) paintingPointer=null;
  pointers.delete(e.pointerId);
  if(pointers.size<2){
    pinchStart=null;
    figureTransform=null;
  }
  if(!pointers.size) pointerStart=null;
}

function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function angleBetween(a,b){return Math.atan2(b.y-a.y,b.x-a.x)}
function normalizeAngle(deg){
  let d=deg%360;
  if(d>180)d-=360;
  if(d<-180)d+=360;
  return d;
}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}

function tick(){
  const state=getState();
  if(!state) return;
  if(role==='host' && hostState && ['hide','seek'].includes(hostState.phase) && !hostState.paused && hostState.timerStarted){
    const remaining=Math.max(0,hostState.deadline-Date.now());
    updateClock(remaining);
    const sec=Math.ceil(remaining/1000);
    if(!solo && session && connected && sec!==lastTickSent){
      lastTickSent=sec;
      session.sendTo(1,{type:'sb:tick',remaining,round:hostState.round,phase:hostState.phase,syncSeq});
    }
    if(remaining<=0){
      if(hostState.phase==='hide'){
        const candidate=hostState.hiderSeat===0 ? exportFigure() : hostState.lastDraft;
        lockFigure(candidate||defaultFigure());
        toast('Hide time expired. Spot locked.');
      }else if(hostState.phase==='seek'){
        finishRound(false);
      }
    }
  }else if(role==='guest' && remoteState && ['hide','seek'].includes(remoteState.phase) && remoteState.timerStarted){
    if(typeof remoteState.remaining==='number') remoteState.remaining=Math.max(0,remoteState.remaining-250);
    updateClock(remoteState.remaining||0);
    if(remoteState.remaining<=0) requestResync();
  }
}

function bind(){
  window.StreetblendAvatar?.init({onChange:onAvatarChanged});
  localAvatar=window.StreetblendAvatar?.getAvatar()||null;
  $('roomCode').addEventListener('input',cleanCode);
  $('createRoom').addEventListener('click',createRoom);
  $('showJoin').addEventListener('click',showJoinPane);
  $('joinBack').addEventListener('click',showStartMenu);
  $('joinRoom').addEventListener('click',joinRoom);
  $('localDemo').addEventListener('click',startSolo);
  $('openSettings').addEventListener('click',openSettings);
  $('closeSettings').addEventListener('click',closeSettings);
  $('saveSettings').addEventListener('click',saveSettings);
  $('resetSettings').addEventListener('click',restoreDefaultSettings);
  $('settingPenaltyMode').addEventListener('change',()=>{
    $('penaltySecondsField').hidden=$('settingPenaltyMode').value==='none';
  });
  $('settingsOverlay').addEventListener('click',event=>{
    if(event.target===$('settingsOverlay')) closeSettings();
  });
  $('shareInvite').addEventListener('click',shareInvite);
  $('leaveRoom').addEventListener('click',()=>leaveRoom(true));
  $('startMatch').addEventListener('click',startMatch);
  $('lockHide').addEventListener('click',lockCurrentHide);
  $('nextRound').addEventListener('click',nextRound);
  $('rematch').addEventListener('click',rematch);

  document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>{
    cancelSampleHold();
    activeTool=b.dataset.tool;
    setToolButtons();
    const copy={
      place:'Drag the player. Use ↻ to rotate, ⤢ to resize, or pinch/twist the player with two fingers.',
      sample:'Tap once to sample. Hold and slide for a live magnified preview. Brush size controls the sampled area.',
      paint:'Drag over the player to paint. Drag or pinch outside the player to navigate the artwork.'
    };
    $('hiderHint').textContent=copy[activeTool]||'';
  }));
  $('poseSelect').addEventListener('change',()=>{
    figure.pose=$('poseSelect').value;
    markDirty();
    sendDraft();
  });

  $('buildSelect').addEventListener('change',()=>{
    figure.build=$('buildSelect').value;
    markDirty();
    sendDraft();
  });

  $('focusPlayer').addEventListener('click',focusPlayer);
  $('fitArtwork').addEventListener('click',fitArtwork);
  $('brushSize').addEventListener('input',()=>{
    $('brushValue').textContent=String(currentSampleDiameter())+'px';
  });
  $('brushValue').textContent=String(currentSampleDiameter())+'px';
  $('paintOpacity').addEventListener('input',()=>{
    $('opacityValue').textContent=String(Number($('paintOpacity').value)||100)+'%';
  });
  $('opacityValue').textContent=String(Number($('paintOpacity').value)||100)+'%';
  const colorPicker=document.createElement('input');
  colorPicker.type='color';
  colorPicker.value=paintColor;
  colorPicker.style.position='fixed';
  colorPicker.style.left='-9999px';
  colorPicker.setAttribute('aria-label','Choose paint color');
  document.body.appendChild(colorPicker);
  $('paintSwatch').style.cursor='pointer';
  $('paintSwatch').title='Tap to choose a paint color';
  $('paintSwatch').addEventListener('click',()=>colorPicker.click());
  colorPicker.addEventListener('input',()=>{
    paintColor=colorPicker.value.toUpperCase();
    $('paintSwatch').style.background=paintColor;
    enterPaintAfterSample();
  });

  stage.addEventListener('pointerdown',onPointerDown);
  stage.addEventListener('pointermove',onPointerMove);
  stage.addEventListener('pointerup',onPointerUp);
  stage.addEventListener('pointercancel',onPointerUp);
  window.addEventListener('resize',()=>{resizeStage();markDirty();});
  window.addEventListener('beforeunload',()=>{try{session?.close();}catch(_){}});

  const invite=net.cleanCode(new URLSearchParams(location.search).get('room'));
  syncSettingsForm();
  updateSettingsSummary();
  if(invite.length===6){
    $('roomCode').value=invite;
    $('startMenu').hidden=true;
    $('joinPane').hidden=false;
    setNetStatus('Remote invite','Room '+invite+' is ready to join.');
    setTimeout(()=>$('playerName').focus(),150);
  }else{
    showStartMenu();
  }

  timerLoop=setInterval(tick,250);
  resizeStage();
  markDirty();
  loadArtLibrary().catch(()=>{});
}

bind();
})();