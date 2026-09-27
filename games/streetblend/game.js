'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const net = window.GameRoomMultiplayer;
  const ART_LIBRARY = [
    {
      id:20684,
      title:'Paris Street; Rainy Day',
      artist:'Gustave Caillebotte',
      date:'1877',
      imageId:'f8fd76e9-c396-5678-36ed-6a348c904d27',
      imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg/1280px-Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg',
      imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg/1280px-Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:Gustave_Caillebotte_-_Paris_Street;_Rainy_Day_-_Google_Art_Project.jpg',
      publicDomain:true
    },
    {
      id:27992,
      title:'A Sunday on La Grande Jatte — 1884',
      artist:'Georges Seurat',
      date:'1884–86, border added 1888–89',
      imageId:'2d484387-2509-5e8e-2c43-22f9981972eb',
      imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg/1280px-A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg',
      imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg/1280px-A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg',
      publicDomain:true
    },
    {
      id:16568,
      title:'Water Lilies',
      artist:'Claude Monet',
      date:'1906',
      imageId:'3c27b499-af56-f0d5-93b5-a7f2f1ad5813',
      imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
      imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg',
      publicDomain:true
    },
    {
      id:14655,
      title:'Two Sisters (On the Terrace)',
      artist:'Pierre-Auguste Renoir',
      date:'1881',
      imageId:'3a608f55-d76e-fa96-d0b1-0789fbc48f1e',
      imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Two_Sisters_%28On_the_Terrace%29.jpg/1920px-Two_Sisters_%28On_the_Terrace%29.jpg',
      imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Two_Sisters_%28On_the_Terrace%29.jpg/1920px-Two_Sisters_%28On_the_Terrace%29.jpg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:Two_Sisters_(On_the_Terrace).jpg',
      publicDomain:true
    },
    {
      id:111442,
      title:"The Child's Bath",
      artist:'Mary Cassatt',
      date:'1893',
      imageId:'3b885ae0-4d46-5fe4-d70a-00474827f02c',
      imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg/960px-Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg',
      imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg/960px-Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg',
      publicDomain:true
    },
    {
      id:16571,
      title:'Arrival of the Normandy Train, Gare Saint-Lazare',
      artist:'Claude Monet',
      date:'1877',
      imageId:'0f1cc0e0-e42e-be16-3f71-2022da38cb93',
      imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg',
      imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Arrival_of_the_Normandy_Train,_Gare_Saint-Lazare_-_Google_Art_Project.jpg',
      publicDomain:true
    },
    {
      id:28560,
      title:'The Bedroom',
      artist:'Vincent van Gogh',
      date:'1889',
      imageId:'6644829f-f292-c5c4-a73c-0356a6fdbf0d',
      imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg/1280px-Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg',
      imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg/1280px-Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg',
      sourceUrl:'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg',
      publicDomain:true
    }
  ];
  const PAINT_W = 96;
  const PAINT_H = 180;
  let artLibrary = [];
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
  let localReadyKey = '';

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

  let figure = defaultFigure();
  let paintColor = '#ffffff';
  let activeTool = 'place';
  let guessArmed = false;
  let camera = {cx:.5, cy:.5, zoom:1};
  let guessMarks = [];
  let reveal = false;
  let pointers = new Map();
  let pointerStart = null;
  let pinchStart = null;
  let paintingPointer = null;

  function defaultFigure(){
    return {x:.5,y:.58,scale:.075,rotation:0,pose:'stand',paintData:null};
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

  function normalizeTitle(s){
    return String(s||'').toLowerCase().replace(/[—–]/g,'-').replace(/[^a-z0-9]+/g,' ').trim();
  }

  async function loadArtLibrary(){
    artLibrary = ART_LIBRARY.slice();
    setNetStatus('Ready',artLibrary.length+' public-domain paintings ready.');
    return artLibrary;
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

  function createRoom(){
    loadArtLibrary().catch(()=>{});
    leaveRoom(false);
    role = 'host';
    seat = 0;
    connected = false;
    solo = false;
    const name = playerName();
    $('roomBox').hidden = true;
    $('connectedBox').hidden = true;
    setNetStatus('Creating room','Connecting to the signaling service…');

    session = net.host({
      gameKey:'streetblend',
      maxPlayers:2,
      onStatus(info){
        if(info.state === 'retrying'){
          setNetStatus('Reconnecting','Signaling retry '+info.attempt+' of '+info.maxRetries+'…');
        }else if(info.state === 'waiting' && !connected){
          history.replaceState({},'',inviteUrl(session.code));
          $('roomCodeDisplay').textContent = session.code;
          $('roomBox').hidden = false;
          $('joinBox').hidden = true;
          $('lobbyActions').hidden = true;
          $('hostOptions').hidden = false;
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
        hostState = makeHostState(name,info.name||'Player 2');
      },
      onPlayerLeave(){
        connected = false;
        if(hostState && hostState.phase !== 'lobby') pauseMatch('Player 2 disconnected.');
        $('connectedBox').hidden = true;
        $('roomBox').hidden = false;
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
    loadArtLibrary().catch(()=>{});
    leaveRoom(false);
    const code = net.cleanCode($('roomCode').value);
    if(code.length !== 6){
      setNetStatus('Enter a room code','Room codes contain six characters.');
      return;
    }
    role = 'guest';
    seat = 1;
    connected = false;
    solo = false;
    $('hostOptions').hidden = true;
    $('lobbyActions').hidden = true;
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
          $('connectedBox').hidden = false;
          $('joinBox').hidden = true;
          $('startMatch').hidden = true;
          $('guestWait').hidden = false;
          $('p0Lobby').textContent = 'Host';
          $('p1Lobby').textContent = playerName();
          setNetStatus('Connected','Waiting for the host to start.');
        }else if(info.state === 'disconnected'){
          connected = false;
          setNetStatus('Disconnected','The host connection closed.');
          if(!document.hidden) toast('Host disconnected.');
        }else if(info.state === 'full'){
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
      players:[{name:name0,score:0},{name:name1,score:0}],
      config:{
        rounds:Number($('roundCount').value)||4,
        hideSeconds:Number($('hideSeconds').value)||60,
        seekSeconds:Number($('seekSeconds').value)||90
      },
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
      await loadArtLibrary();
    }catch(error){
      toast(error.message);
      return;
    }
    if(role === 'host'){
      if(!connected || !hostState) return;
      hostState.players[0].name = playerName();
      beginRound(0);
    }else if(solo){
      if(!hostState) hostState = makeHostState(playerName(),'Practice Seeker');
      beginRound(0);
    }
  }

  async function startSolo(){
    try{await loadArtLibrary();}catch(error){toast(error.message);return;}
    leaveRoom(false);
    solo = true;
    role = 'host';
    seat = 0;
    connected = true;
    hostState = makeHostState(playerName(),'Practice');
    hostState.config.rounds = 2;
    hostState.config.hideSeconds = Number($('hideSeconds').value)||60;
    hostState.config.seekSeconds = Number($('seekSeconds').value)||90;
    beginRound(0);
  }

  function shuffledScene(round){
    if(!artLibrary.length) return null;
    const index = (round * 3 + Math.floor(Math.random()*artLibrary.length)) % artLibrary.length;
    return artLibrary[index];
  }

  function beginRound(roundIndex){
    if(!hostState) return;
    hostState.round = roundIndex;
    hostState.phase = 'hide';
    hostState.hiderSeat = roundIndex % 2;
    hostState.seekerSeat = 1 - hostState.hiderSeat;
    hostState.scene = shuffledScene(roundIndex);
    hostState.wrong = 0;
    hostState.figure = null;
    hostState.lastDraft = null;
    hostState.guessMarks = [];
    hostState.result = null;
    hostState.paused = false;
    hostState.deadline = 0;
    hostState.timerStarted = false;
    hostState.sceneReady = [false,false];
    localReadyKey = '';
    lastTickSent = -1;

    if(solo && hostState.hiderSeat === 1){
      hostState.hiderSeat = 0;
      hostState.seekerSeat = 1;
    }

    applyHostView();
    sendGuestPhase();
  }

  function publicState(){
    if(!hostState) return null;
    return {
      players:hostState.players,
      config:hostState.config,
      round:hostState.round,
      phase:hostState.phase,
      scene:hostState.scene,
      hiderSeat:hostState.hiderSeat,
      seekerSeat:hostState.seekerSeat,
      wrong:hostState.wrong,
      guessMarks:hostState.guessMarks,
      result:hostState.result,
      timerStarted:!!hostState.timerStarted,
      remaining:hostState.timerStarted ? Math.max(0,hostState.deadline-Date.now()) : null
    };
  }

  function sendGuestPhase(){
    if(role !== 'host' || solo || !session || !connected || !hostState) return;
    const state = publicState();
    if(hostState.phase === 'seek' || hostState.phase === 'reveal' || hostState.phase === 'final'){
      state.figure = hostState.figure;
    }
    session.sendTo(1,{type:'sb:state',state});
  }

  function handleHostMessage(message,meta){
    if(!message?.type || meta.seat !== 1 || !hostState) return;
    if(message.type === 'sb:scene-ready'){
      const key=String(hostState.round)+':'+String(hostState.scene?.id||'');
      if(message.key===key && hostState.phase==='hide' && !hostState.timerStarted){
        hostState.sceneReady[1]=true;
        startHideTimerIfReady();
      }
      return;
    }
    if(message.type === 'sb:draft'){
      if(hostState.phase === 'hide' && hostState.hiderSeat === 1){
        hostState.lastDraft = sanitizeFigure(message.figure);
      }
      return;
    }
    if(message.type === 'sb:lock'){
      if(hostState.phase === 'hide' && hostState.hiderSeat === 1){
        lockFigure(sanitizeFigure(message.figure));
      }
      return;
    }
    if(message.type === 'sb:guess'){
      if(hostState.phase === 'seek' && hostState.seekerSeat === 1){
        processGuess(message.x,message.y);
      }
      return;
    }
  }

  async function handleGuestMessage(message){
    if(!message?.type) return;
    if(message.type === 'sb:state'){
      remoteState = message.state;
      await applyRemoteView();
    }else if(message.type === 'sb:tick'){
      if(remoteState){
        remoteState.remaining = message.remaining;
        updateClock(message.remaining);
      }
    }else if(message.type === 'sb:toast'){
      toast(message.message);
    }
  }

  function sceneReadyKey(state){
    return String(state?.round ?? '')+':'+String(state?.scene?.id ?? '');
  }

  function reportSceneReady(state){
    if(!state || state.phase!=='hide' || state.timerStarted) return;
    const key=sceneReadyKey(state);
    if(!key || localReadyKey===key) return;
    localReadyKey=key;

    if(role==='host'){
      if(hostState && sceneReadyKey(hostState)===key){
        hostState.sceneReady[0]=true;
        startHideTimerIfReady();
      }
    }else if(role==='guest' && session && connected){
      session.send({type:'sb:scene-ready',key});
    }
  }

  function startHideTimerIfReady(){
    if(role!=='host' || !hostState || hostState.phase!=='hide' || hostState.timerStarted) return;
    const ready = solo ? hostState.sceneReady[0] : (hostState.sceneReady[0] && hostState.sceneReady[1]);
    if(!ready) return;
    hostState.timerStarted=true;
    hostState.deadline=Date.now()+hostState.config.hideSeconds*1000;
    lastTickSent=-1;
    updateClock(hostState.config.hideSeconds*1000);
    sendGuestPhase();
    toast('Painting ready. Hide timer started.');
  }

  function sanitizeFigure(f){
    if(!f) return defaultFigure();
    return {
      x:clamp(Number(f.x)||.5,.02,.98),
      y:clamp(Number(f.y)||.5,.02,.98),
      scale:clamp(Number(f.scale)||.075,.035,.14),
      rotation:clamp(Number(f.rotation)||0,-45,45),
      pose:['stand','lean','crouch','wide'].includes(f.pose)?f.pose:'stand',
      paintData:typeof f.paintData === 'string' && f.paintData.length < 150000 ? f.paintData : null
    };
  }

  function exportFigure(){
    return {
      x:figure.x,y:figure.y,scale:figure.scale,rotation:figure.rotation,pose:figure.pose,
      paintData:paintCanvas.toDataURL('image/png')
    };
  }

  function sendDraft(){
    if(role === 'guest' && connected && remoteState?.phase === 'hide' && remoteState.hiderSeat === 1){
      session.send({type:'sb:draft',figure:exportFigure()});
    }else if(role === 'host' && hostState?.phase === 'hide' && hostState.hiderSeat === 0){
      hostState.lastDraft = exportFigure();
    }
  }

  function lockCurrentHide(){
    const state = getState();
    if(!state || state.phase !== 'hide' || state.hiderSeat !== seat) return;
    if(!state.timerStarted){
      toast('Waiting for the painting to finish loading.');
      return;
    }
    const f = exportFigure();
    if(role === 'host') lockFigure(f);
    else session.send({type:'sb:lock',figure:f});
    showStageMessage('Hiding spot locked','Waiting for the search to begin…');
    $('hiderControls').hidden = true;
    $('waitingControls').hidden = false;
    $('waitingRole').textContent = 'HIDER';
    $('waitingTitle').textContent = 'Hiding spot locked';
    $('waitingText').textContent = 'The Seeker is receiving the painting.';
  }

  function lockFigure(f){
    if(!hostState || hostState.phase !== 'hide') return;
    hostState.figure = sanitizeFigure(f || hostState.lastDraft || defaultFigure());
    hostState.phase = 'seek';
    hostState.timerStarted = true;
    hostState.deadline = Date.now()+hostState.config.seekSeconds*1000;
    hostState.wrong = 0;
    hostState.guessMarks = [];
    lastTickSent = -1;
    applyHostView();
    sendGuestPhase();
  }

  function processGuess(x,y){
    if(!hostState || hostState.phase !== 'seek' || !hostState.figure) return;
    x=clamp(Number(x)||0,0,1); y=clamp(Number(y)||0,0,1);
    const f=hostState.figure;
    const ratio = sceneImage?.naturalWidth && sceneImage?.naturalHeight ? sceneImage.naturalHeight/sceneImage.naturalWidth : .75;
    const rx = Math.max(.018,f.scale*ratio*.42);
    const ry = Math.max(.025,f.scale*.52);
    const dx=(x-f.x)/rx, dy=(y-f.y)/ry;
    const hit=dx*dx+dy*dy <= 1.15;

    hostState.guessMarks.push({x,y,hit});
    if(hit){
      finishRound(true);
    }else{
      hostState.wrong += 1;
      hostState.deadline = Math.max(Date.now(),hostState.deadline-5000);
      if(role === 'host') {
        guessMarks = hostState.guessMarks.slice();
        flashGuess('MISS · −5 SECONDS',false);
        updateScoreboard(hostState);
        markDirty();
      }
      if(!solo && session) session.sendTo(1,{type:'sb:toast',message:'Miss · 5 seconds lost'});
      sendGuestPhase();
    }
  }

  function finishRound(found){
    if(!hostState || hostState.phase !== 'seek') return;
    const remaining=Math.max(0,Math.ceil((hostState.deadline-Date.now())/1000));
    const elapsed=hostState.config.seekSeconds-remaining;
    const seeker=hostState.seekerSeat;
    const hider=hostState.hiderSeat;
    const seekerPoints=found ? 500 + remaining*10 : 0;
    const hiderPoints=(found ? elapsed*10 : 1000) + hostState.wrong*75;
    hostState.players[seeker].score += seekerPoints;
    hostState.players[hider].score += hiderPoints;
    hostState.phase='reveal';
    hostState.deadline=0;
    hostState.result={found,remaining,seekerPoints,hiderPoints,wrong:hostState.wrong};
    applyHostView();
    sendGuestPhase();
  }

  function nextRound(){
    if(role !== 'host' || !hostState || hostState.phase !== 'reveal') return;
    const next=hostState.round+1;
    if(next >= hostState.config.rounds){
      hostState.phase='final';
      hostState.deadline=0;
      applyHostView();
      sendGuestPhase();
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
    if(!hostState || !['hide','seek'].includes(hostState.phase)) return;
    hostState.paused=true;
    hostState.pauseRemaining=Math.max(0,hostState.deadline-Date.now());
    hostState.deadline=0;
    toast(message);
  }

  function resumeMatch(){
    if(!hostState?.paused) return;
    hostState.paused=false;
    hostState.deadline=Date.now()+(hostState.pauseRemaining||30000);
    hostState.pauseRemaining=0;
    sendGuestPhase();
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
    if(scene?.id !== state.scene?.id || !sceneImage){
      sceneLoaded = await loadScene(state.scene);
    }
    if(sceneLoaded && state.phase==='hide' && !state.timerStarted){
      reportSceneReady(state);
    }

    reveal = state.phase === 'reveal';
    guessMarks = (state.guessMarks||[]).slice();

    if((state.phase === 'seek' || state.phase === 'reveal') && state.figure){
      figure=sanitizeFigure(state.figure);
      await importPaintData(figure.paintData);
    }

    $('roundLabel').textContent='ROUND '+(state.round+1)+' / '+state.config.rounds;
    $('phaseLabel').textContent=state.phase.toUpperCase();
    $('hiderControls').hidden=true;
    $('seekerControls').hidden=true;
    $('waitingControls').hidden=true;
    $('revealControls').hidden=true;
    $('finalControls').hidden=true;
    hideStageMessage();

    if(state.phase === 'hide'){
      if(state.hiderSeat === seat){
        resetFigureForHide();
        camera={cx:.5,cy:.5,zoom:2.35};
        $('zoom').value=String(camera.zoom);
        activeTool='place';
        setToolButtons();
        $('hiderControls').hidden=false;
        $('lockHide').disabled=!state.timerStarted;
        $('hiderHint').textContent=state.timerStarted
          ? 'Tap the painting to position your figure. Use Sample, then Paint to camouflage it.'
          : 'Painting loaded. Waiting for the round timer to start…';
      }else{
        camera={cx:.5,cy:.5,zoom:1};
        $('zoom').value='1';
        $('waitingControls').hidden=false;
        $('waitingRole').textContent='SEEKER';
        $('waitingTitle').textContent='The Hider is blending in…';
        $('waitingText').textContent='You’ll receive the full painting after the hiding spot is locked.';
        showStageMessage('No peeking','The Hider is painting camouflage.');
      }
    }else if(state.phase === 'seek'){
      if(state.seekerSeat === seat || solo){
        camera={cx:.5,cy:.5,zoom:1};
        $('zoom').value='1';
        guessArmed=false;
        $('guessMode').classList.remove('armed');
        $('guessMode').textContent='Make a Guess';
        $('wrongCount').textContent=String(state.wrong||0);
        $('seekerControls').hidden=false;
      }else{
        camera={cx:.5,cy:.5,zoom:1};
        $('zoom').value='1';
        $('waitingControls').hidden=false;
        $('waitingRole').textContent='HIDER';
        $('waitingTitle').textContent='Stay hidden…';
        $('waitingText').textContent='The Seeker is searching the painting.';
      }
    }else if(state.phase === 'reveal'){
      camera={cx:.5,cy:.5,zoom:1};
      $('zoom').value='1';
      showReveal(state,isHost);
    }
    markDirty();
  }

  function resetFigureForHide(){
    figure=defaultFigure();
    resetPaint();
    $('figureScale').value=String(figure.scale);
    $('figureRotation').value='0';
    paintColor='#ffffff';
    $('paintSwatch').style.background=paintColor;
    document.querySelectorAll('.pose').forEach(b=>b.classList.toggle('active',b.dataset.pose==='stand'));
    if(role==='host') hostState.lastDraft=exportFigure();
  }

  function updateScoreboard(state){
    const players=state.players||[{name:'Player 1',score:0},{name:'Player 2',score:0}];
    $('p0Match').querySelector('span').textContent=players[0].name;
    $('p0Match').querySelector('b').textContent=players[0].score;
    $('p1Match').querySelector('span').textContent=players[1].name;
    $('p1Match').querySelector('b').textContent=players[1].score;
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
    $('nextRoundWait').hidden=isHost;
    markDirty();
  }

  function showFinal(state,isHost){
    $('hiderControls').hidden=true;
    $('seekerControls').hidden=true;
    $('waitingControls').hidden=true;
    $('revealControls').hidden=true;
    $('finalControls').hidden=false;
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

    // Preferred path: CORS-enabled direct IIIF image. This keeps the eyedropper working.
    for(const url of urls){
      try{
        img=await loadImageDirect(url,true);
        corsLoaded=true;
        break;
      }catch(_){}
    }

    // Fallback: load the exact same direct IIIF URL as a normal browser image.
    // This always favors displaying the painting over failing the round.
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
        // Verify that pixel access is actually allowed before advertising sampling.
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
    if(shouldDrawFigure) drawFigure(t,state?.phase==='reveal');

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
    figureCtx.drawImage(paintCanvas,0,0);
    figureCtx.globalCompositeOperation='destination-in';
    figureCtx.fillStyle='#fff';
    figureCtx.strokeStyle='#fff';
    drawSilhouette(figureCtx,figure.pose,PAINT_W,PAINT_H);
    figureCtx.globalCompositeOperation='source-over';
  }

  function drawSilhouette(c,pose,w,h){
    c.save();
    c.lineCap='round';
    c.lineJoin='round';
    c.strokeStyle='#fff';
    c.fillStyle='#fff';
    const headY=pose==='crouch'?38:24;
    c.beginPath();c.arc(w*.5,headY,w*.12,0,Math.PI*2);c.fill();

    c.lineWidth=w*.17;
    c.beginPath();
    if(pose==='lean'){c.moveTo(w*.48,headY+w*.13);c.lineTo(w*.61,h*.55);}
    else if(pose==='crouch'){c.moveTo(w*.5,headY+w*.12);c.lineTo(w*.47,h*.48);}
    else {c.moveTo(w*.5,headY+w*.12);c.lineTo(w*.5,h*.58);}
    c.stroke();

    c.lineWidth=w*.10;
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

  function drawFigure(t,outline){
    rebuildFigureCanvas();
    const p=imageToScreen(figure.x,figure.y);
    if(!p) return;
    const h=figure.scale*t.ih*t.scale;
    const w=h*(PAINT_W/PAINT_H);
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(figure.rotation*Math.PI/180);
    if(outline){
      ctx.shadowColor='rgba(255,80,105,.95)';
      ctx.shadowBlur=18*(window.devicePixelRatio||1);
      ctx.strokeStyle='#ff5d73';
      ctx.lineWidth=4*(window.devicePixelRatio||1);
      ctx.strokeRect(-w*.52,-h*.52,w*1.04,h*1.04);
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

  function sampleColor(norm){
    if(!sceneImage || !norm) return;
    try{
      const x=clamp(Math.floor(norm.x*sceneBuffer.width),0,sceneBuffer.width-1);
      const y=clamp(Math.floor(norm.y*sceneBuffer.height),0,sceneBuffer.height-1);
      const d=sceneBufferCtx.getImageData(x,y,1,1).data;
      paintColor='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
      $('paintSwatch').style.background=paintColor;
      activeTool='paint';
      setToolButtons();
      $('hiderHint').textContent='Color sampled. Paint directly over your figure.';
      toast('Color sampled.');
    }catch(_){
      sceneSamplingAvailable=false;
      toast('Color sampling is blocked for this image. Tap the color swatch to choose a paint color.');
    }
  }

  function paintAt(px,py){
    const t=getTransform();
    const p=imageToScreen(figure.x,figure.y);
    if(!t || !p) return;
    const h=figure.scale*t.ih*t.scale;
    const w=h*(PAINT_W/PAINT_H);
    const dx=px-p.x,dy=py-p.y;
    const a=-figure.rotation*Math.PI/180;
    const lx=dx*Math.cos(a)-dy*Math.sin(a);
    const ly=dx*Math.sin(a)+dy*Math.cos(a);
    const fx=(lx/w+.5)*PAINT_W;
    const fy=(ly/h+.5)*PAINT_H;
    if(fx<0||fy<0||fx>PAINT_W||fy>PAINT_H) return;
    paintCtx.fillStyle=paintColor;
    paintCtx.beginPath();
    paintCtx.arc(fx,fy,Number($('brushSize').value)||14,0,Math.PI*2);
    paintCtx.fill();
    markDirty();
  }

  function setToolButtons(){
    document.querySelectorAll('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===activeTool));
  }

  function armGuess(){
    if(guessArmed){
      guessArmed=false;
      $('guessMode').classList.remove('armed');
      $('guessMode').textContent='Make a Guess';
      $('seekHint').textContent='Drag to explore. Pinch or use the zoom slider for detail.';
    }else{
      guessArmed=true;
      $('guessMode').classList.add('armed');
      $('guessMode').textContent='Tap the painting';
      $('seekHint').textContent='Guess armed — tap the exact spot where you see the hidden figure.';
    }
  }

  function sendGuess(norm){
    const state=getState();
    if(!state || state.phase!=='seek' || (state.seekerSeat!==seat && !solo)) return;
    guessArmed=false;
    $('guessMode').classList.remove('armed');
    $('guessMode').textContent='Make a Guess';
    if(role==='host') processGuess(norm.x,norm.y);
    else session.send({type:'sb:guess',x:norm.x,y:norm.y});
  }

  function pointerXY(event){
    const rect=stage.getBoundingClientRect();
    const sx=stage.width/rect.width, sy=stage.height/rect.height;
    return {x:(event.clientX-rect.left)*sx,y:(event.clientY-rect.top)*sy};
  }

  function onPointerDown(e){
    stage.setPointerCapture?.(e.pointerId);
    const p=pointerXY(e);
    pointers.set(e.pointerId,p);
    if(pointers.size===1) pointerStart={id:e.pointerId,x:p.x,y:p.y,lastX:p.x,lastY:p.y,moved:false};
    if(pointers.size===2){
      const pts=[...pointers.values()];
      pinchStart={distance:distance(pts[0],pts[1]),zoom:camera.zoom};
      pointerStart=null;
    }
    const state=getState();
    if(state?.phase==='hide' && state.hiderSeat===seat && activeTool==='paint'){
      paintingPointer=e.pointerId;paintAt(p.x,p.y);
    }
  }

  function onPointerMove(e){
    if(!pointers.has(e.pointerId)) return;
    const p=pointerXY(e);
    pointers.set(e.pointerId,p);

    if(pointers.size>=2){
      const pts=[...pointers.values()];
      if(pinchStart){
        const ratio=distance(pts[0],pts[1])/Math.max(1,pinchStart.distance);
        camera.zoom=clamp(pinchStart.zoom*ratio,1,5);
        $('zoom').value=String(camera.zoom);
        clampCamera();markDirty();
      }
      return;
    }

    const state=getState();
    if(state?.phase==='hide' && state.hiderSeat===seat && activeTool==='paint' && paintingPointer===e.pointerId){
      paintAt(p.x,p.y);
      return;
    }

    const canPan = (state?.phase==='hide' && state.hiderSeat===seat && activeTool==='pan') ||
      (state?.phase==='seek' && state.seekerSeat===seat && !guessArmed) ||
      state?.phase==='reveal';
    if(canPan && pointerStart){
      const dx=p.x-pointerStart.lastX,dy=p.y-pointerStart.lastY;
      if(Math.abs(p.x-pointerStart.x)+Math.abs(p.y-pointerStart.y)>8) pointerStart.moved=true;
      const t=getTransform();
      if(t){
        camera.cx-=dx/(t.iw*t.scale);
        camera.cy-=dy/(t.ih*t.scale);
        clampCamera();markDirty();
      }
      pointerStart.lastX=p.x;pointerStart.lastY=p.y;
    }
  }

  function onPointerUp(e){
    const p=pointerXY(e);
    const state=getState();
    const wasStart=pointerStart && pointerStart.id===e.pointerId && !pointerStart.moved;

    if(state?.phase==='hide' && state.hiderSeat===seat){
      if(activeTool==='paint' && paintingPointer===e.pointerId){
        paintingPointer=null;
        sendDraft();
      }else if(wasStart && activeTool==='place'){
        const n=screenToImage(p.x,p.y);
        if(n){figure.x=n.x;figure.y=n.y;sendDraft();markDirty();}
      }else if(wasStart && activeTool==='sample'){
        sampleColor(screenToImage(p.x,p.y));
      }
    }else if(state?.phase==='seek' && state.seekerSeat===seat && wasStart && guessArmed){
      const n=screenToImage(p.x,p.y);if(n) sendGuess(n);
    }

    pointers.delete(e.pointerId);
    if(pointers.size<2) pinchStart=null;
    if(!pointers.size) pointerStart=null;
  }

  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}

  function updateFromControls(){
    figure.scale=Number($('figureScale').value)||.075;
    figure.rotation=Number($('figureRotation').value)||0;
    markDirty();sendDraft();
  }

  function tick(){
    const state=getState();
    if(!state) return;
    if(role==='host' && hostState && ['hide','seek'].includes(hostState.phase) && !hostState.paused && hostState.timerStarted){
      const remaining=Math.max(0,hostState.deadline-Date.now());
      updateClock(remaining);
      const sec=Math.ceil(remaining/1000);
      if(!solo && session && connected && sec!==lastTickSent){
        lastTickSent=sec;
        session.sendTo(1,{type:'sb:tick',remaining});
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
    }
  }

  function bind(){
    $('roomCode').addEventListener('input',cleanCode);
    $('createRoom').addEventListener('click',createRoom);
    $('joinRoom').addEventListener('click',joinRoom);
    $('localDemo').addEventListener('click',startSolo);
    $('shareInvite').addEventListener('click',shareInvite);
    $('leaveRoom').addEventListener('click',()=>leaveRoom(true));
    $('startMatch').addEventListener('click',startMatch);
    $('lockHide').addEventListener('click',lockCurrentHide);
    $('guessMode').addEventListener('click',armGuess);
    $('nextRound').addEventListener('click',nextRound);
    $('rematch').addEventListener('click',rematch);

    document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>{
      activeTool=b.dataset.tool;setToolButtons();
      const copy={place:'Tap the painting to move your figure.',pan:'Drag the painting to inspect another area.',sample:'Tap any color in the artwork to pick it up.',paint:'Drag directly over your figure to paint.'};
      $('hiderHint').textContent=copy[activeTool]||'';
    }));
    document.querySelectorAll('.pose').forEach(b=>b.addEventListener('click',()=>{
      figure.pose=b.dataset.pose;
      document.querySelectorAll('.pose').forEach(x=>x.classList.toggle('active',x===b));
      markDirty();sendDraft();
    }));

    $('figureScale').addEventListener('input',updateFromControls);
    $('figureRotation').addEventListener('input',updateFromControls);
    $('resetPaint').addEventListener('click',()=>{resetPaint();sendDraft();toast('Figure reset to white.');});
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
      paintColor=colorPicker.value;
      $('paintSwatch').style.background=paintColor;
      activeTool='paint';
      setToolButtons();
    });

    $('zoom').addEventListener('input',()=>{camera.zoom=Number($('zoom').value)||1;clampCamera();markDirty();});
    $('zoomOut').addEventListener('click',()=>{camera.zoom=clamp(camera.zoom-.35,1,5);$('zoom').value=String(camera.zoom);clampCamera();markDirty();});
    $('zoomIn').addEventListener('click',()=>{camera.zoom=clamp(camera.zoom+.35,1,5);$('zoom').value=String(camera.zoom);clampCamera();markDirty();});
    $('resetView').addEventListener('click',()=>{camera={cx:.5,cy:.5,zoom:1};$('zoom').value='1';markDirty();});

    stage.addEventListener('pointerdown',onPointerDown);
    stage.addEventListener('pointermove',onPointerMove);
    stage.addEventListener('pointerup',onPointerUp);
    stage.addEventListener('pointercancel',onPointerUp);
    window.addEventListener('resize',()=>{resizeStage();markDirty();});
    window.addEventListener('beforeunload',()=>{try{session?.close();}catch(_){}});

    const invite=net.cleanCode(new URLSearchParams(location.search).get('room'));
    if(invite.length===6){
      $('roomCode').value=invite;
      $('hostOptions').hidden=true;
      $('lobbyActions').hidden=true;
      setNetStatus('Remote invite','Room '+invite+' is ready to join.');
      setTimeout(()=>$('playerName').focus(),150);
    }

    timerLoop=setInterval(tick,250);
    resizeStage();
    markDirty();
    loadArtLibrary().catch(()=>{});
  }

  bind();
})();