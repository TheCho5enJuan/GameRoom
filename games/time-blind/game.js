(() => {
  'use strict';

  const WIN_SCORE = 3;
  const MIN_PLAYERS = 1;
  const MAX_PLAYERS = 10;
  const MIN_TARGET_MS = 2000;
  const MAX_TARGET_MS = 10000;
  const STORAGE_KEY = 'timeBlindV2Settings';
  const DIFFICULTIES = {
    easy: { label: 'Easy', toleranceMs: 500 },
    normal: { label: 'Normal', toleranceMs: 250 },
    hard: { label: 'Hard', toleranceMs: 100 },
  };
  const AVATARS = ['🙂','😎','🤖','👾','🐱','🐶','🦊','🐸','🐵','🦁','🐯','🐼','🐧','🦄','👻','🔥','⚡','🎯','⏱️','🚀'];
  const SEGMENTS = {
    '0':['a','b','c','d','e','f'],'1':['b','c'],'2':['a','b','d','e','g'],'3':['a','b','c','d','g'],'4':['b','c','f','g'],
    '5':['a','c','d','f','g'],'6':['a','c','d','e','f','g'],'7':['a','b','c'],'8':['a','b','c','d','e','f','g'],'9':['a','b','c','d','f','g'],
  };

  const el = {
    setupScreen: document.getElementById('setupScreen'), gameScreen: document.getElementById('gameScreen'), newGameButton: document.getElementById('newGameButton'),
    minusPlayer: document.getElementById('minusPlayer'), plusPlayer: document.getElementById('plusPlayer'), playerCount: document.getElementById('playerCount'),
    difficultyWrap: document.getElementById('difficultyWrap'), difficultyControl: document.getElementById('difficultyControl'), soundToggle: document.getElementById('soundToggle'),
    vibrationToggle: document.getElementById('vibrationToggle'), playerRows: document.getElementById('playerRows'), beginButton: document.getElementById('beginButton'),
    roundNumber: document.getElementById('roundNumber'), turnStat: document.getElementById('turnStat'), scoreboard: document.getElementById('scoreboard'),
    turnAvatar: document.getElementById('turnAvatar'), turnName: document.getElementById('turnName'), turnSuffix: document.getElementById('turnSuffix'),
    clockLabel: document.getElementById('clockLabel'), sevenDisplay: document.getElementById('sevenDisplay'), displayText: document.getElementById('displayText'),
    calibrationProgress: document.getElementById('calibrationProgress'), calibrationFill: document.getElementById('calibrationFill'), blindBadge: document.getElementById('blindBadge'),
    targetNote: document.getElementById('targetNote'), actionButton: document.getElementById('actionButton'), roundAttempts: document.getElementById('roundAttempts'),
  };

  const draftPlayers = Array.from({length:MAX_PLAYERS},(_,i)=>({name:`Player ${i+1}`,avatar:AVATARS[i%AVATARS.length]}));
  let setupPlayerCount=2, selectedDifficulty='normal', soundEnabled=true, vibrationEnabled=true, audioContext=null;
  let players=[], round=1, targetMs=4000, turnOrder=[], turnPosition=0, currentPlayerIndex=0, attempts=[], phase='setup', startTime=0;
  let hideTimer=0, revealFrame=0, calibrationVisible=false, calibrationDurationMs=2000, lastTickSecond=null, winnerIndex=-1;

  function clamp(v,min,max){return Math.min(max,Math.max(min,v));}
  function formatMs(ms){return (ms/1000).toFixed(3);}
  function randomTargetMs(){return Math.floor(Math.random()*(MAX_TARGET_MS-MIN_TARGET_MS+1))+MIN_TARGET_MS;}
  function escapeHtml(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}

  function loadSettings(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(!saved)return;
      setupPlayerCount=clamp(Number(saved.playerCount)||2,MIN_PLAYERS,MAX_PLAYERS);
      selectedDifficulty=DIFFICULTIES[saved.difficulty]?saved.difficulty:'normal'; soundEnabled=saved.soundEnabled!==false; vibrationEnabled=saved.vibrationEnabled!==false;
      if(Array.isArray(saved.players)) saved.players.slice(0,MAX_PLAYERS).forEach((p,i)=>{if(p&&typeof p==='object'){draftPlayers[i].name=String(p.name||draftPlayers[i].name).slice(0,18);if(AVATARS.includes(p.avatar))draftPlayers[i].avatar=p.avatar;}});
    }catch(_){ }
  }
  function saveSettings(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({playerCount:setupPlayerCount,difficulty:selectedDifficulty,soundEnabled,vibrationEnabled,players:draftPlayers}));}catch(_){ }
  }

  function renderDisplay(value,hidden=false,announce=true){
    const text=String(value), parts=[];
    for(const char of text){
      if(char==='.') {parts.push('<span class="decimal" aria-hidden="true"></span>');continue;}
      if(!(char in SEGMENTS))continue;
      const active=new Set(SEGMENTS[char]);
      const segments=['a','b','c','d','e','f','g'].map(name=>`<span class="segment ${name}${active.has(name)?' on':''}"></span>`).join('');
      parts.push(`<span class="digit">${segments}</span>`);
    }
    el.sevenDisplay.innerHTML=parts.join(''); el.sevenDisplay.classList.toggle('hidden-clock',hidden); if(announce)el.displayText.textContent=`${text} seconds`;
  }

  function ensureAudioContext(){
    if(!soundEnabled)return null; const C=window.AudioContext||window.webkitAudioContext; if(!C)return null;
    if(!audioContext)audioContext=new C(); if(audioContext.state==='suspended')audioContext.resume().catch(()=>{}); return audioContext;
  }
  function tone(freq,duration=.055,volume=.025,delay=0,type='square'){
    const ctx=ensureAudioContext(); if(!ctx)return; const start=ctx.currentTime+delay, osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type; osc.frequency.setValueAtTime(freq,start); gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(volume,start+.005); gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+duration+.015);
  }
  function playCue(name){
    if(!soundEnabled)return;
    if(name==='start')tone(880,.055,.027); else if(name==='tick')tone(520,.025,.012); else if(name==='hide')tone(330,.05,.02);
    else if(name==='stop')tone(660,.045,.026); else if(name==='bust'){tone(190,.10,.026);tone(135,.12,.024,.085);}
    else if(name==='point'){tone(760,.07,.026);tone(1040,.10,.024,.075);} else if(name==='win'){tone(660,.07,.028);tone(880,.08,.028,.075);tone(1100,.14,.028,.16);}
  }
  function vibrate(pattern){if(vibrationEnabled&&navigator.vibrate)navigator.vibrate(pattern);}
  function updateFeedbackToggles(){
    [[el.soundToggle,soundEnabled],[el.vibrationToggle,vibrationEnabled]].forEach(([button,on])=>{button.classList.toggle('selected',on);button.setAttribute('aria-pressed',String(on));const s=button.querySelector('small');if(s)s.textContent=on?'On':'Off';});
  }
  function clearActiveTiming(){clearTimeout(hideTimer);cancelAnimationFrame(revealFrame);hideTimer=0;revealFrame=0;calibrationVisible=false;lastTickSecond=null;}

  function renderPlayerRows(){
    el.playerRows.innerHTML='';
    for(let i=0;i<setupPlayerCount;i++){
      const row=document.createElement('div');row.className='player-row';
      const avatar=document.createElement('select');avatar.setAttribute('aria-label',`Player ${i+1} avatar`);
      AVATARS.forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;o.selected=draftPlayers[i].avatar===a;avatar.appendChild(o);});
      avatar.addEventListener('change',()=>{draftPlayers[i].avatar=avatar.value;saveSettings();});
      const name=document.createElement('input');name.type='text';name.maxLength=18;name.value=draftPlayers[i].name;name.placeholder=`Player ${i+1}`;name.setAttribute('aria-label',`Player ${i+1} name`);
      name.addEventListener('input',()=>{draftPlayers[i].name=name.value;saveSettings();}); row.append(avatar,name);el.playerRows.appendChild(row);
    }
  }
  function renderSetupState(){
    el.playerCount.textContent=String(setupPlayerCount);el.minusPlayer.disabled=setupPlayerCount<=MIN_PLAYERS;el.plusPlayer.disabled=setupPlayerCount>=MAX_PLAYERS;el.difficultyWrap.hidden=setupPlayerCount!==1;updateFeedbackToggles();renderPlayerRows();
  }
  function setPlayerCount(n){setupPlayerCount=clamp(n,MIN_PLAYERS,MAX_PLAYERS);saveSettings();renderSetupState();}
  function setDifficulty(v){if(!DIFFICULTIES[v])return;selectedDifficulty=v;el.difficultyControl.querySelectorAll('[data-difficulty]').forEach(b=>b.classList.toggle('selected',b.dataset.difficulty===v));saveSettings();}
  function normalizedPlayer(i){const p=draftPlayers[i],name=p.name.trim();return{name:name||`Player ${i+1}`,avatar:p.avatar||AVATARS[i%AVATARS.length],score:0};}

  function buildTurnOrder(){
    if(players.length<=1){turnOrder=[0];return;}
    const start=(round-1)%players.length;turnOrder=Array.from({length:players.length},(_,offset)=>(start+offset)%players.length);
  }
  function syncTurn(){currentPlayerIndex=turnOrder[turnPosition]??0;el.turnStat.textContent=`TURN ${turnPosition+1}/${players.length}`;}

  function startGame(){
    clearActiveTiming();players=Array.from({length:setupPlayerCount},(_,i)=>normalizedPlayer(i));round=1;targetMs=randomTargetMs();attempts=[];winnerIndex=-1;turnPosition=0;buildTurnOrder();syncTurn();phase='ready';
    el.setupScreen.hidden=true;el.gameScreen.hidden=false;el.newGameButton.hidden=false;saveSettings();renderGame();
  }
  function resetToSetup(){clearActiveTiming();phase='setup';el.gameScreen.hidden=true;el.setupScreen.hidden=false;el.newGameButton.hidden=true;renderSetupState();}

  function renderScoreboard(){
    el.scoreboard.innerHTML=players.map((p,i)=>{
      const active=phase!=='game-over'&&i===currentPlayerIndex?' active':'', winner=i===winnerIndex?' winner':'';
      const pips=Array.from({length:WIN_SCORE},(_,x)=>`<i class="score-pip${x<p.score?' on':''}"></i>`).join('');
      return `<div class="score-chip${active}${winner}" data-player-index="${i}"><span class="score-avatar">${escapeHtml(p.avatar)}</span><span class="score-name">${escapeHtml(p.name)}</span><span class="score-pips" aria-label="${p.score} of ${WIN_SCORE} points">${pips}</span></div>`;
    }).join('');
    const active=el.scoreboard.querySelector('.score-chip.active'); if(active&&typeof active.scrollIntoView==='function')active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  }
  function renderAttempts(revealAll=false){
    if(!attempts.length){el.roundAttempts.innerHTML='';return;}
    if(players.length>1&&!revealAll&&phase!=='round-result'&&phase!=='game-over'){
      const mine=attempts.find(a=>a.playerIndex===currentPlayerIndex);
      el.roundAttempts.innerHTML=mine?`<span class="attempt-chip${mine.bust?' bust':''}">${escapeHtml(mine.avatar)} ${escapeHtml(mine.name)} <strong>${formatMs(mine.elapsedMs)}</strong>${mine.bust?' BUST':''}</span>`:`<div class="attempt-placeholder">Previous attempts stay hidden until the round ends.</div>`;
      return;
    }
    const legal=attempts.filter(a=>!a.bust),best=legal.length?Math.max(...legal.map(a=>a.elapsedMs)):null;
    el.roundAttempts.innerHTML=attempts.map(a=>`<span class="attempt-chip${a.bust?' bust':''}${!a.bust&&a.elapsedMs===best?' best':''}">${escapeHtml(a.avatar)} ${escapeHtml(a.name)} <strong>${formatMs(a.elapsedMs)}</strong>${a.bust?' BUST':''}</span>`).join('');
  }
  function renderTurnHeader(){const p=players[currentPlayerIndex];if(!p)return;el.turnAvatar.textContent=p.avatar;el.turnName.textContent=p.name;el.turnSuffix.textContent=phase==='game-over'?'wins!':'is up';}
  function setNote(msg,type=''){el.targetNote.className=`target-note${type?` ${type}`:''}`;el.targetNote.textContent=msg;}
  function configureAction(label,style){el.actionButton.textContent=label;el.actionButton.className=`action-button ${style}`;}

  function showReadyState(){
    clearActiveTiming();syncTurn();renderTurnHeader();renderScoreboard();renderAttempts(false);el.clockLabel.textContent='TARGET';renderDisplay(formatMs(targetMs),false);el.calibrationFill.style.width='0%';el.blindBadge.hidden=true;
    setNote(`Press START. Watch the first ${formatMs(targetMs/2)}s, then finish blind.`);configureAction('START','start');
  }
  function renderGame(){el.roundNumber.textContent=String(round);renderScoreboard();renderAttempts(false);showReadyState();}

  function hideCalibration(){
    if(phase!=='running'||!calibrationVisible)return;calibrationVisible=false;clearTimeout(hideTimer);cancelAnimationFrame(revealFrame);hideTimer=0;revealFrame=0;
    el.sevenDisplay.classList.add('hidden-clock');el.clockLabel.textContent='HIDDEN';el.displayText.textContent='Timer hidden';el.calibrationFill.style.width='100%';el.blindBadge.hidden=false;setNote('Now finish the remaining half by feel.');playCue('hide');vibrate(12);
  }
  function updateVisibleCountdown(now){
    if(phase!=='running'||!calibrationVisible)return;const elapsed=Math.max(0,now-startTime);
    if(elapsed>=calibrationDurationMs){hideCalibration();return;}
    const remaining=Math.max(0,Math.round(targetMs-elapsed));renderDisplay(formatMs(remaining),false,false);el.calibrationFill.style.width=`${Math.min(100,(elapsed/calibrationDurationMs)*100)}%`;
    const second=Math.floor(elapsed/1000);if(second!==lastTickSecond){lastTickSecond=second;if(second>0){playCue('tick');vibrate(8);}}
    revealFrame=requestAnimationFrame(updateVisibleCountdown);
  }
  function beginAttempt(){
    if(phase!=='ready')return;clearActiveTiming();phase='running';startTime=performance.now();calibrationDurationMs=targetMs/2;calibrationVisible=true;lastTickSecond=0;
    el.clockLabel.textContent='VISIBLE HALF';renderDisplay(formatMs(targetMs),false,false);el.displayText.textContent='Countdown started';el.calibrationFill.style.width='0%';el.blindBadge.hidden=true;
    setNote(`Calibrating for ${formatMs(calibrationDurationMs)}s…`);configureAction('STOP','stop');playCue('start');vibrate(20);revealFrame=requestAnimationFrame(updateVisibleCountdown);hideTimer=window.setTimeout(hideCalibration,calibrationDurationMs);
  }
  function finishAttempt(){
    if(phase!=='running')return;const elapsedMs=Math.max(0,Math.round(performance.now()-startTime));clearActiveTiming();playCue('stop');vibrate(28);el.blindBadge.hidden=true;
    const p=players[currentPlayerIndex],bust=elapsedMs>targetMs,deltaMs=Math.abs(targetMs-elapsedMs);attempts.push({playerIndex:currentPlayerIndex,name:p.name,avatar:p.avatar,elapsedMs,bust,deltaMs});phase='result';
    el.clockLabel.textContent='YOUR TIME';renderDisplay(formatMs(elapsedMs),false);el.calibrationFill.style.width='0%';
    if(bust){setNote(`BUST · ${formatMs(elapsedMs-targetMs)}s over target`,'bust');playCue('bust');vibrate([60,35,80]);}else setNote(`${formatMs(deltaMs)}s under target`,'good');
    renderAttempts(false);
    if(players.length===1){resolveSoloRound(attempts[attempts.length-1]);return;}
    configureAction(turnPosition<players.length-1?'PASS TO NEXT PLAYER':'REVEAL ROUND','next');
  }

  function resolveSoloRound(attempt){
    const d=DIFFICULTIES[selectedDifficulty],success=!attempt.bust&&attempt.deltaMs<=d.toleranceMs;
    if(success){players[0].score++;setNote(`POINT · ${formatMs(attempt.deltaMs)}s under target`,'round-win');playCue('point');vibrate([30,25,30]);}else if(!attempt.bust)setNote(`No point · needed within ${formatMs(d.toleranceMs)}s`,'');
    renderScoreboard();if(players[0].score>=WIN_SCORE){winnerIndex=0;phase='game-over';renderWinner();}else{phase='solo-result';configureAction('NEXT ROUND','next');}
  }
  function advanceAfterResult(){
    if(players.length===1){startNextRound();return;}
    if(turnPosition<players.length-1){turnPosition++;phase='ready';showReadyState();return;}resolveMultiplayerRound();
  }
  function resolveMultiplayerRound(){
    phase='round-result';renderAttempts(true);const legal=attempts.filter(a=>!a.bust);
    if(!legal.length){el.clockLabel.textContent='NO POINT';renderDisplay(formatMs(targetMs),false);setNote('Everyone went over. No point this round.','bust');configureAction('NEXT ROUND','next');return;}
    const best=Math.max(...legal.map(a=>a.elapsedMs)),leaders=legal.filter(a=>a.elapsedMs===best);
    if(leaders.length>1){el.clockLabel.textContent='TIE';renderDisplay(formatMs(best),false);setNote(`Tie at ${formatMs(best)}s. No point this round.`,'round-win');configureAction('NEXT ROUND','next');return;}
    const win=leaders[0];players[win.playerIndex].score++;currentPlayerIndex=win.playerIndex;winnerIndex=-1;renderScoreboard();el.turnAvatar.textContent=win.avatar;el.turnName.textContent=win.name;el.turnSuffix.textContent='wins the round';el.clockLabel.textContent='ROUND WINNER';renderDisplay(formatMs(win.elapsedMs),false);
    setNote(`${win.name} was ${formatMs(targetMs-win.elapsedMs)}s under target`,'round-win');playCue('point');vibrate([30,25,30]);
    if(players[win.playerIndex].score>=WIN_SCORE){winnerIndex=win.playerIndex;phase='game-over';renderWinner();}else configureAction('NEXT ROUND','next');
  }
  function renderWinner(){
    const w=players[winnerIndex];renderScoreboard();renderAttempts(true);el.turnAvatar.textContent=w.avatar;el.turnName.textContent=w.name;el.turnSuffix.textContent='wins!';el.clockLabel.textContent='CHAMPION';renderDisplay(formatMs(targetMs),false);setNote(`${w.name} reached ${WIN_SCORE} points.`,'good');configureAction('PLAY AGAIN','win');playCue('win');vibrate([40,30,40,30,80]);
  }
  function startNextRound(){
    clearActiveTiming();round++;targetMs=randomTargetMs();attempts=[];turnPosition=0;winnerIndex=-1;buildTurnOrder();syncTurn();phase='ready';el.roundNumber.textContent=String(round);showReadyState();
  }
  function handleAction(){if(phase==='ready')beginAttempt();else if(phase==='running')finishAttempt();else if(phase==='result'||phase==='solo-result')advanceAfterResult();else if(phase==='round-result')startNextRound();else if(phase==='game-over')startGame();}

  el.minusPlayer.addEventListener('click',()=>setPlayerCount(setupPlayerCount-1));el.plusPlayer.addEventListener('click',()=>setPlayerCount(setupPlayerCount+1));
  el.difficultyControl.addEventListener('click',e=>{const b=e.target.closest('[data-difficulty]');if(b)setDifficulty(b.dataset.difficulty);});
  el.soundToggle.addEventListener('click',()=>{soundEnabled=!soundEnabled;saveSettings();updateFeedbackToggles();if(soundEnabled)playCue('start');});
  el.vibrationToggle.addEventListener('click',()=>{vibrationEnabled=!vibrationEnabled;saveSettings();updateFeedbackToggles();if(vibrationEnabled)vibrate(20);});
  el.beginButton.addEventListener('click',startGame);el.actionButton.addEventListener('click',handleAction);el.newGameButton.addEventListener('click',resetToSetup);

  loadSettings();setDifficulty(selectedDifficulty);renderSetupState();renderDisplay('4.000',false);
})();