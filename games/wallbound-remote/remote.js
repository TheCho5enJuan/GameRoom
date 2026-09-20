(function(){
  'use strict';
  if (!window.WallboundGame || !window.GameRoomMultiplayer) return;

  const game = window.WallboundGame;
  const net = window.GameRoomMultiplayer;
  const DEFAULT_TURN_SECONDS = 60;
  const DECISION_TIMEOUT_MS = 15000;

  let session = null;
  let role = 'local';
  let seat = null;
  let connected = false;

  let turnSeconds = DEFAULT_TURN_SECONDS;
  let hostDeadline = 0;
  let guestDeadline = 0;
  let pausedRemainingMs = 0;
  let lastTurnKey = '';
  let lastTimerSyncSecond = -1;
  let timerLoop = null;

  let pendingDecision = null;
  let decisionTimer = null;

  const style = document.createElement('style');
  style.textContent = `
    .remote-panel{display:grid;gap:14px}
    .remote-status{padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.045);font-size:.92rem}
    .remote-status strong{display:block;font-size:1.05rem;margin-bottom:3px}
    .remote-code{font-size:clamp(2rem,10vw,3.4rem);font-weight:900;letter-spacing:.16em;text-align:center;padding:16px;border-radius:16px;background:#07101b;border:1px solid rgba(255,255,255,.13)}
    .remote-field{display:grid;gap:6px}
    .remote-field label{font-size:.78rem;font-weight:800;opacity:.72;text-transform:uppercase;letter-spacing:.08em}
    .remote-field input,.remote-field select{width:100%;min-width:0;padding:12px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#08131f;color:#fff;font:inherit}
    .remote-field input.code{text-transform:uppercase;letter-spacing:.16em;font-weight:900;text-align:center}
    .remote-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .remote-actions button,.remote-copy{min-height:48px;border-radius:12px;border:1px solid rgba(255,255,255,.14);font:inherit;font-weight:850;cursor:pointer}
    .remote-primary{background:#276ef1;color:#fff}
    .remote-secondary{background:#142235;color:#fff}
    .remote-danger{background:#4a1d27;color:#fff}
    .remote-note{font-size:.8rem;line-height:1.45;opacity:.68}
    .remote-menu-badge{display:inline-flex;align-items:center;justify-content:center;min-width:72px;padding:4px 8px;border-radius:999px;background:rgba(70,220,170,.1);color:#72e5bd;border:1px solid rgba(114,229,189,.25);font-size:.68rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase}

    .remote-turnbar{margin:8px 0 4px;min-height:44px;padding:8px 11px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center}
    .remote-turnbar[hidden]{display:none}
    .remote-live{font-size:7px;font-weight:950;letter-spacing:.10em;border:1px solid rgba(111,240,197,.30);color:#6ff0c5;background:rgba(111,240,197,.08);border-radius:999px;padding:5px 7px}
    .remote-turn-copy{min-width:0}
    .remote-turn-copy strong{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .remote-turn-copy span{display:block;font-size:7px;color:#94a5bc;margin-top:1px}
    .remote-clock{font-variant-numeric:tabular-nums;font-size:19px;font-weight:950;letter-spacing:.02em;color:#eef5ff;min-width:52px;text-align:right}
    .remote-turnbar.warning .remote-clock{color:#ffd166}
    .remote-turnbar.critical{border-color:rgba(255,103,122,.45);box-shadow:0 0 18px rgba(255,103,122,.10)}
    .remote-turnbar.critical .remote-clock{color:#ff7184}
    .remote-turnbar.paused .remote-clock{font-size:10px;color:#aeb9c9}
    .remote-waiting-turn #board .cell.legal,.remote-waiting-turn #board .slot{pointer-events:none!important}
    .remote-waiting-turn #board .cell.legal:before{filter:saturate(.55);opacity:.72}

    .decision-kind{display:inline-flex;padding:5px 8px;border-radius:999px;background:rgba(255,209,102,.10);border:1px solid rgba(255,209,102,.24);color:#ffd166;font-size:8px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
    .decision-copy{font-size:12px!important;color:#d8e1ed!important}
    .decision-time{font-size:9px!important;margin-top:8px!important;color:#92a4bc!important}

    @media(max-width:560px){
      .remote-actions{grid-template-columns:1fr}
      .remote-turnbar{margin-top:6px}
    }
  `;
  document.head.appendChild(style);

  const menuGrid = document.querySelector('#menuModal .menu-grid');
  if (menuGrid) {
    const b = document.createElement('button');
    b.id = 'remoteBtn';
    b.type = 'button';
    b.innerHTML = '<span class="menu-icon" aria-hidden="true">🌐</span><span><b>Remote room</b><small id="remoteMenuStatus">Create or join with a code</small></span>';
    menuGrid.prepend(b);
  }

  const desktopTools = document.querySelector('.desktop-tools');
  if (desktopTools) {
    const b = document.createElement('button');
    b.id = 'remoteRailBtn';
    b.type = 'button';
    b.innerHTML = '<span aria-hidden="true">🌐</span><span>Remote room</span><b id="remoteRailBadge">LOCAL</b>';
    desktopTools.prepend(b);
  }

  const playersRow = document.querySelector('.players-row');
  if (playersRow) {
    playersRow.insertAdjacentHTML('afterend', `
      <div class="remote-turnbar" id="remoteTurnbar" hidden>
        <span class="remote-live">REMOTE</span>
        <div class="remote-turn-copy"><strong id="remoteTurnPlayer">Player turn</strong><span id="remoteTurnDetail">60 second turn limit</span></div>
        <span class="remote-clock" id="remoteClock">1:00</span>
      </div>
    `);
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay" id="remoteModal" role="dialog" aria-modal="true" aria-labelledby="remoteTitle">
      <section class="sheet sheet-wide">
        <header class="sheet-header">
          <div><h2 id="remoteTitle">Remote Wallbound</h2><p>Play on two devices using a six-character room code.</p></div>
          <button class="close-button" id="remoteClose" type="button" aria-label="Close remote room">×</button>
        </header>
        <div class="remote-panel">
          <div class="remote-status" id="remoteStatus"><strong>Local play</strong><span>Both players use this device.</span></div>
          <div class="remote-field">
            <label for="remoteName">Your name</label>
            <input id="remoteName" maxlength="18" autocomplete="off" value="Player">
          </div>
          <div id="remoteLobby">
            <div class="remote-field" id="remoteTimerOption">
              <label for="remoteTimerSelect">Host turn timer</label>
              <select id="remoteTimerSelect">
                <option value="30">30 seconds</option>
                <option value="45">45 seconds</option>
                <option value="60" selected>60 seconds</option>
                <option value="90">90 seconds</option>
              </select>
            </div>
            <div style="height:10px"></div>
            <div class="remote-actions">
              <button class="remote-primary" id="remoteCreate" type="button">Create Remote Room</button>
              <button class="remote-secondary" id="remoteLocal" type="button">Keep Local Play</button>
            </div>
            <div style="height:10px"></div>
            <div class="remote-field">
              <label for="remoteCodeInput">Join room code</label>
              <input class="code" id="remoteCodeInput" maxlength="6" inputmode="text" autocomplete="off" placeholder="ABC123">
            </div>
            <div style="height:10px"></div>
            <button class="remote-copy remote-secondary" id="remoteJoin" type="button" style="width:100%">Join Remote Room</button>
          </div>
          <div id="remoteRoom" hidden>
            <div class="remote-code" id="remoteCodeDisplay">------</div>
            <button class="remote-copy remote-primary" id="remoteShare" type="button">Share invite</button>
            <div class="remote-note" id="remoteRoomNote">Share the invite link with Player 2.</div>
            <button class="remote-copy remote-danger" id="remoteLeave" type="button">Leave remote room</button>
          </div>
          <div class="remote-note">The host owns the official board, timer, undo, and restart state. Remote undo and restart requests require the other player to approve them.</div>
        </div>
      </section>
    </div>

    <div class="overlay" id="remoteDecisionModal" role="dialog" aria-modal="true" aria-labelledby="remoteDecisionTitle">
      <section class="sheet compact-sheet">
        <span class="decision-kind" id="remoteDecisionKind">REQUEST</span>
        <h2 id="remoteDecisionTitle" style="margin:0 0 7px">Opponent request</h2>
        <p class="decision-copy" id="remoteDecisionText">Your opponent sent a request.</p>
        <p class="decision-time">The turn clock is paused while you decide. Unanswered requests are declined after 15 seconds.</p>
        <div class="sheet-actions" style="margin-top:16px">
          <button id="remoteDecisionDeny" type="button">Keep current game</button>
          <button class="primary" id="remoteDecisionApprove" type="button">Approve</button>
        </div>
      </section>
    </div>
  `);

  const $ = id => document.getElementById(id);
  const modal = $('remoteModal');
  const status = $('remoteStatus');
  const roomBox = $('remoteRoom');
  const lobby = $('remoteLobby');
  const codeInput = $('remoteCodeInput');
  const nameInput = $('remoteName');
  const inviteCode = net.cleanCode(new URLSearchParams(window.location.search).get('room'));
  const turnbar = $('remoteTurnbar');

  function escapeHtml(v){
    return String(v ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function currentDefaultName(){
    const s = game.getState();
    return s?.players?.[0]?.name || 'Player';
  }

  const savedDefaultName = currentDefaultName();
  nameInput.value = inviteCode.length === 6 && savedDefaultName === 'Player 1' ? 'Player 2' : savedDefaultName;

  function setStatus(title,detail,state=''){
    status.innerHTML = '<strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(detail)+'</span>';
    const menu = $('remoteMenuStatus');
    if (menu) menu.textContent = detail;
    const badge = $('remoteRailBadge');
    if (badge) badge.textContent = state || (role === 'local' ? 'LOCAL' : role.toUpperCase());
  }

  function openRemote(){
    document.querySelectorAll('.overlay.show').forEach(n=>n.classList.remove('show'));
    modal.classList.add('show');
  }

  function closeRemote(){
    modal.classList.remove('show');
  }

  function decisionOverlay(show){
    $('remoteDecisionModal').classList.toggle('show',!!show);
  }

  function showDecision(kind,requesterName){
    const isUndo = kind === 'undo';
    $('remoteDecisionKind').textContent = isUndo ? 'UNDO REQUEST' : 'RESTART REQUEST';
    $('remoteDecisionTitle').textContent = isUndo ? 'Undo the last action?' : 'Restart the match?';
    $('remoteDecisionText').textContent = requesterName + (isUndo
      ? ' wants to undo the most recent move or wall placement.'
      : ' wants to reset the board and start a new match.');
    $('remoteDecisionApprove').textContent = isUndo ? 'Approve undo' : 'Approve restart';
    $('remoteDecisionDeny').textContent = isUndo ? 'Keep move' : 'Keep current game';
    decisionOverlay(true);
  }

  function safeName(fallback){
    return String(nameInput.value || fallback).trim().slice(0,18) || fallback;
  }

  function inviteUrl(code){
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('room',net.cleanCode(code));
    return url.toString();
  }

  async function shareInvite(){
    const code = net.cleanCode($('remoteCodeDisplay').textContent);
    if (code.length !== 6) return;
    const url = inviteUrl(code);
    const shareData = {title:'Wallbound Remote',text:'Join my Wallbound room '+code,url};
    try{
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url);
        game.toast('Invite link copied.');
      }
    }catch(error){
      if (error?.name === 'AbortError') return;
      try{
        await navigator.clipboard.writeText(url);
        game.toast('Invite link copied.');
      }catch(_){
        prompt('Share this invite link:',url);
      }
    }
  }

  function currentTurnKey(){
    const state = game.getState();
    return state.moves.length + ':' + state.current + ':' + String(state.winner);
  }

  function remainingMs(){
    if (role === 'host') {
      if (hostDeadline > 0) return Math.max(0,hostDeadline-Date.now());
      return Math.max(0,pausedRemainingMs);
    }
    if (role === 'guest') {
      if (guestDeadline > 0) return Math.max(0,guestDeadline-Date.now());
      return Math.max(0,pausedRemainingMs);
    }
    return 0;
  }

  function timerPayload(forcePaused=false,reason=''){
    return {
      turnSeconds,
      remainingMs: Math.max(0,Math.round(remainingMs())),
      paused: !!forcePaused || !!pendingDecision || !connected,
      reason,
      current: game.getCurrent()
    };
  }

  function applyGuestTimer(payload){
    if (!payload) return;
    turnSeconds = Math.max(10,Number(payload.turnSeconds)||DEFAULT_TURN_SECONDS);
    pausedRemainingMs = Math.max(0,Number(payload.remainingMs)||0);
    if (payload.paused) {
      guestDeadline = 0;
    } else {
      guestDeadline = Date.now()+pausedRemainingMs;
      pausedRemainingMs = 0;
    }
    renderTimer();
  }

  function sendTimerSync(paused=false,reason=''){
    if (role !== 'host' || !session) return;
    session.broadcast({type:'wallbound:timer',timer:timerPayload(paused,reason)});
  }

  function beginHostTimer(force=false){
    if (role !== 'host' || !connected || pendingDecision) return;
    const state = game.getState();
    if (state.winner !== null) {
      hostDeadline = 0;
      pausedRemainingMs = 0;
      return;
    }
    const key = currentTurnKey();
    if (force || key !== lastTurnKey || (!hostDeadline && !pausedRemainingMs)) {
      lastTurnKey = key;
      pausedRemainingMs = 0;
      hostDeadline = Date.now()+turnSeconds*1000;
      lastTimerSyncSecond = -1;
    } else if (!hostDeadline && pausedRemainingMs > 0) {
      hostDeadline = Date.now()+pausedRemainingMs;
      pausedRemainingMs = 0;
    }
  }

  function pauseHostTimer(reason='paused'){
    if (role !== 'host') return;
    if (hostDeadline > 0) pausedRemainingMs = Math.max(0,hostDeadline-Date.now());
    if (!pausedRemainingMs) pausedRemainingMs = turnSeconds*1000;
    hostDeadline = 0;
    sendTimerSync(true,reason);
    renderTimer();
  }

  function resumeHostTimer(reset=false){
    if (role !== 'host' || !connected || pendingDecision) return;
    if (reset) {
      pausedRemainingMs = turnSeconds*1000;
      lastTurnKey = currentTurnKey();
    }
    if (!pausedRemainingMs) pausedRemainingMs = turnSeconds*1000;
    hostDeadline = Date.now()+pausedRemainingMs;
    pausedRemainingMs = 0;
    lastTimerSyncSecond = -1;
    sendTimerSync(false);
    renderTimer();
  }

  function broadcastState(){
    if (role !== 'host' || !session) return;
    if (connected && !pendingDecision) beginHostTimer(false);
    session.broadcast({
      type:'wallbound:state',
      state:game.getState(),
      timer:timerPayload(!!pendingDecision,pendingDecision ? 'approval' : '')
    });
    setRemoteLocks();
  }

  function renderTimer(){
    if (!turnbar) return;
    const remote = role !== 'local';
    turnbar.hidden = !remote || !connected;
    if (turnbar.hidden) return;

    const state = game.getState();
    const player = state.players[state.current];
    const rem = remainingMs();
    const sec = Math.max(0,Math.ceil(rem/1000));
    const paused = !!pendingDecision || ((role==='host' ? hostDeadline : guestDeadline)===0 && pausedRemainingMs>0);

    $('remoteTurnPlayer').textContent = player.emoji+' '+player.name+"'s turn";
    $('remoteTurnDetail').textContent = paused
      ? (pendingDecision ? 'Clock paused for opponent approval' : 'Clock paused')
      : (seat === state.current ? 'Your turn · make a move' : 'Opponent is thinking');

    turnbar.classList.toggle('paused',paused);
    turnbar.classList.toggle('warning',!paused && sec <= 15 && sec > 5);
    turnbar.classList.toggle('critical',!paused && sec <= 5);
    $('remoteClock').textContent = paused ? 'PAUSED' : '0:'+String(sec).padStart(2,'0');

    setRemoteLocks();
  }

  function tickTimer(){
    renderTimer();
    if (role !== 'host' || !connected || pendingDecision || !hostDeadline) return;

    const rem = Math.max(0,hostDeadline-Date.now());
    const sec = Math.max(0,Math.ceil(rem/1000));

    if (rem <= 0) {
      const state = game.getState();
      const timedOut = state.players[state.current];
      hostDeadline = 0;
      pausedRemainingMs = 0;
      lastTurnKey = currentTurnKey();
      if (game.timeoutTurn()) {
        session?.broadcast({type:'wallbound:notice',message:timedOut.name+' ran out of time. Turn passed.'});
        setTimeout(()=>game.toast(timedOut.name+' ran out of time. Turn passed.'),20);
      }
      return;
    }

    if (sec !== lastTimerSyncSecond && sec % 5 === 0) {
      lastTimerSyncSecond = sec;
      sendTimerSync(false);
    }
  }

  function startTimerLoop(){
    if (timerLoop) clearInterval(timerLoop);
    timerLoop = setInterval(tickTimer,250);
  }

  function stopDecisionTimer(){
    if (decisionTimer) clearTimeout(decisionTimer);
    decisionTimer = null;
  }

  function decisionId(){
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  }

  function playerName(index){
    return game.getState().players[Number(index)]?.name || ('Player '+(Number(index)+1));
  }

  function clearPendingDecision(){
    stopDecisionTimer();
    pendingDecision = null;
    decisionOverlay(false);
    setRemoteLocks();
  }

  function scheduleDecisionTimeout(id){
    stopDecisionTimer();
    decisionTimer = setTimeout(()=>{
      if (!pendingDecision || pendingDecision.id !== id || role !== 'host') return;
      finalizeHostDecision(false,true);
    },DECISION_TIMEOUT_MS);
  }

  function requestDecision(kind){
    if (role === 'local') return true;
    if (!connected || !session) {
      game.toast('The remote player is not connected.');
      return false;
    }
    if (pendingDecision) {
      game.toast('An opponent request is already pending.');
      return false;
    }
    if (kind === 'undo' && game.getState().moves.length === 0) {
      game.toast('There is nothing to undo yet.');
      return false;
    }

    const id = decisionId();
    pendingDecision = {
      id,
      kind,
      requesterSeat:seat,
      approverSeat:seat === 0 ? 1 : 0,
      requesterName:playerName(seat),
      waiting:true
    };

    if (role === 'host') {
      pauseHostTimer('approval');
      session.sendTo(1,{
        type:'wallbound:decision-request',
        id,kind,requesterSeat:0,
        requesterName:playerName(0)
      });
      scheduleDecisionTimeout(id);
    } else {
      session.send({
        type:'wallbound:decision-request',
        id,kind,requesterSeat:1,
        requesterName:playerName(1)
      });
    }

    game.toast((kind === 'undo' ? 'Undo' : 'Restart')+' request sent.');
    setRemoteLocks();
    return false;
  }

  function receiveGuestDecisionRequest(message,meta){
    if (role !== 'host' || meta.seat !== 1) return;
    const kind = message.kind === 'restart' ? 'restart' : 'undo';

    if (pendingDecision) {
      session.sendTo(1,{type:'wallbound:decision-result',id:message.id,kind,approved:false,reason:'Another request is already pending.'});
      return;
    }
    if (kind === 'undo' && !game.canUndo()) {
      session.sendTo(1,{type:'wallbound:decision-result',id:message.id,kind,approved:false,reason:'There is nothing to undo.'});
      return;
    }

    pendingDecision = {
      id:String(message.id||decisionId()),
      kind,
      requesterSeat:1,
      approverSeat:0,
      requesterName:playerName(1),
      waiting:false
    };

    pauseHostTimer('approval');
    session.sendTo(1,{type:'wallbound:decision-ack',id:pendingDecision.id,kind});
    showDecision(kind,pendingDecision.requesterName);
    scheduleDecisionTimeout(pendingDecision.id);
    setRemoteLocks();
  }

  function receiveHostDecisionRequest(message){
    if (role !== 'guest') return;
    if (pendingDecision) return;

    const kind = message.kind === 'restart' ? 'restart' : 'undo';
    pendingDecision = {
      id:String(message.id),
      kind,
      requesterSeat:0,
      approverSeat:1,
      requesterName:message.requesterName || playerName(0),
      waiting:false
    };

    showDecision(kind,pendingDecision.requesterName);
    setRemoteLocks();
  }

  function finalizeHostDecision(approved,timedOut=false){
    if (role !== 'host' || !pendingDecision) return;
    const d = pendingDecision;
    clearPendingDecision();

    session?.sendTo(1,{
      type:'wallbound:decision-result',
      id:d.id,
      kind:d.kind,
      approved:!!approved,
      reason:timedOut ? 'Request expired.' : ''
    });

    if (!approved) {
      resumeHostTimer(false);
      game.toast(timedOut ? 'Request expired.' : 'Request declined.');
      return;
    }

    if (d.kind === 'undo') {
      if (!game.canUndo()) {
        resumeHostTimer(false);
        game.toast('There is nothing to undo.');
        return;
      }
      lastTurnKey = '';
      game.undoLast();
      game.toast('Undo approved.');
    } else {
      lastTurnKey = '';
      game.restart();
      game.toast('Restart approved.');
    }
  }

  function approveDecision(){
    if (!pendingDecision) return;
    const d = pendingDecision;

    if (role === 'host' && d.approverSeat === 0) {
      finalizeHostDecision(true,false);
      return;
    }

    if (role === 'guest' && d.approverSeat === 1) {
      decisionOverlay(false);
      pendingDecision.waiting = true;
      session?.send({type:'wallbound:decision-response',id:d.id,kind:d.kind,approved:true});
      game.toast('Approval sent.');
      setRemoteLocks();
    }
  }

  function denyDecision(){
    if (!pendingDecision) return;
    const d = pendingDecision;

    if (role === 'host' && d.approverSeat === 0) {
      finalizeHostDecision(false,false);
      return;
    }

    if (role === 'guest' && d.approverSeat === 1) {
      decisionOverlay(false);
      pendingDecision.waiting = true;
      session?.send({type:'wallbound:decision-response',id:d.id,kind:d.kind,approved:false});
      game.toast('Request declined.');
      setRemoteLocks();
    }
  }

  function receiveDecisionResponse(message,meta){
    if (role !== 'host' || meta.seat !== 1 || !pendingDecision) return;
    if (String(message.id) !== pendingDecision.id || pendingDecision.approverSeat !== 1) return;
    finalizeHostDecision(!!message.approved,false);
  }

  function receiveDecisionResult(message){
    if (role !== 'guest' || !pendingDecision) return;
    if (String(message.id) !== pendingDecision.id) return;
    const approved = !!message.approved;
    const kind = pendingDecision.kind;
    clearPendingDecision();
    if (!approved) game.toast(message.reason || (kind === 'undo' ? 'Undo declined.' : 'Restart declined.'));
    else game.toast(kind === 'undo' ? 'Undo approved.' : 'Restart approved.');
  }

  function installInterceptors(){
    game.setActionInterceptor(action=>{
      if (role === 'local') return true;
      if (!connected || seat === null) {
        game.toast(role === 'host' ? 'Waiting for Player 2.' : 'Still connecting to the room.');
        return false;
      }
      if (pendingDecision) {
        game.toast('Finish the opponent request first.');
        return false;
      }
      if (game.getCurrent() !== seat) {
        game.toast('Wait for your turn.');
        return false;
      }
      if (role === 'host') return true;
      session?.send({type:'wallbound:action',action});
      return false;
    });

    game.setUndoInterceptor(()=>requestDecision('undo'));
    game.setRestartInterceptor(()=>requestDecision('restart'));
  }

  function setRemoteLocks(){
    const remote = role !== 'local';
    const state = game.getState();
    const myTurn = !remote || (connected && seat === state.current && !pendingDecision && state.winner === null);

    document.body.classList.toggle('remote-waiting-turn',remote && connected && !myTurn);

    ['playersBtn','playersRailBtn','savePlayers'].forEach(id=>{
      const node=$(id);
      if (node && remote) node.disabled=true;
    });

    if (remote) {
      const undo=$('undoBtn');
      if (undo) undo.disabled=!connected || state.moves.length===0 || !!pendingDecision;

      ['restartBtn','restartRailBtn','playAgain'].forEach(id=>{
        const node=$(id);
        if (node) node.disabled=!connected || !!pendingDecision;
      });

      const move=$('moveMode');
      const wall=$('wallMode');
      if (move) move.disabled=!myTurn;
      if (wall) wall.disabled=!myTurn || state.players[state.current].walls<=0;
      const horizontal=$('horizontal');
      const vertical=$('vertical');
      if (horizontal) horizontal.disabled=!myTurn;
      if (vertical) vertical.disabled=!myTurn;
    }
  }

  function clearSession(reload=false){
    try{session?.close();}catch(_){}
    session=null;
    role='local';
    seat=null;
    connected=false;
    hostDeadline=0;
    guestDeadline=0;
    pausedRemainingMs=0;
    lastTurnKey='';
    clearPendingDecision();

    game.setActionInterceptor(null);
    game.setUndoInterceptor(null);
    game.setRestartInterceptor(null);
    game.onStateChange(null);

    document.body.classList.remove('remote-waiting-turn');
    if (turnbar) turnbar.hidden=true;

    setStatus('Local play','Both players use this device.','LOCAL');
    lobby.hidden=false;
    roomBox.hidden=true;

    if (reload) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      history.replaceState({},'',url.pathname+(url.search?url.search:'')+url.hash);
      location.reload();
    }
  }

  function showRoom(code,note){
    lobby.hidden=true;
    roomBox.hidden=false;
    $('remoteCodeDisplay').textContent=code;
    $('remoteRoomNote').textContent=note;
  }

  function createRoom(){
    clearSession(false);
    role='host';
    seat=0;
    connected=false;
    turnSeconds=Math.max(10,Number($('remoteTimerSelect').value)||DEFAULT_TURN_SECONDS);

    const hostName=safeName('Player 1');
    game.setPlayerProfile(0,hostName);
    installInterceptors();
    game.onStateChange(broadcastState);
    setRemoteLocks();

    try{
      session=net.host({
        gameKey:'wallbound',
        maxPlayers:2,
        onStatus(info){
          if(info.state==='retrying'){
            connected=false;
            setStatus('Reconnecting','Signaling retry '+info.attempt+' of '+info.maxRetries+'…','RETRY');
          }else if(info.state==='waiting'){
            if (!connected) {
              const url=inviteUrl(session.code);
              history.replaceState({},'',url);
              showRoom(session.code,'Share the invite link with Player 2.');
              setStatus('Room '+session.code,'Ready — waiting for Player 2 to join…','WAITING');
            }
          }else if(info.state==='connected'){
            connected=true;
            setStatus('Connected','You are Player 1 · Host','HOST');
          }
        },
        onPlayerJoin(info){
          const reconnecting=pausedRemainingMs>0 || hostDeadline>0;
          connected=true;
          game.setPlayerProfile(info.seat,info.name||'Player 2');

          if (reconnecting && !hostDeadline) resumeHostTimer(false);
          else beginHostTimer(false);

          session.sendTo(info.seat,{
            type:'wallbound:state',
            state:game.getState(),
            timer:timerPayload(false)
          });

          setStatus('Connected',(info.name||'Player 2')+' joined as Player 2','HOST');
          closeRemote();
          game.toast((info.name||'Player 2')+' joined. You are Player 1.');
          setRemoteLocks();
        },
        onPlayerLeave(){
          connected=false;
          pauseHostTimer('disconnect');
          setStatus('Player disconnected','Turn clock paused — waiting for Player 2 to reconnect…','WAITING');
          game.toast('Player 2 disconnected. Timer paused.');
          setRemoteLocks();
        },
        onMessage(message,meta){
          if (!message?.type) return;

          if (message.type==='wallbound:action') {
            const action=message.action||{};
            const state=game.getState();
            if(meta.seat!==1 || state.current!==meta.seat || pendingDecision){
              session.sendTo(meta.seat,{type:'wallbound:error',message:pendingDecision?'An opponent request is pending.':'It is not your turn.'});
              return;
            }
            if(action.type==='move') game.actMove(action.row,action.col);
            else if(action.type==='wall') game.actWall(action.row,action.col,action.orientation);
            return;
          }

          if (message.type==='wallbound:decision-request') {
            receiveGuestDecisionRequest(message,meta);
            return;
          }

          if (message.type==='wallbound:decision-response') {
            receiveDecisionResponse(message,meta);
          }
        },
        onError(error){
          connected=false;
          lobby.hidden=false;
          roomBox.hidden=true;
          const detail=error?.type==='network'
            ? 'Could not reach the signaling service after automatic retries. Try again or switch between Wi-Fi and cellular.'
            : (error?.type||error?.message||'Could not create room.');
          setStatus('Could not create room',detail,'ERROR');
        }
      });

      lobby.hidden=false;
      roomBox.hidden=true;
      setStatus('Creating room','Connecting to the signaling service…','CONNECTING');
    }catch(error){
      clearSession(false);
      setStatus('Could not create room',error.message||String(error),'ERROR');
    }
  }

  function joinRoom(){
    clearSession(false);
    const code=net.cleanCode(codeInput.value);
    if(code.length!==6){
      setStatus('Enter a room code','The code should be six characters.','ERROR');
      return;
    }

    role='guest';
    seat=null;
    connected=false;
    const guestName=safeName('Player 2');
    installInterceptors();
    game.onStateChange(null);
    setRemoteLocks();

    try{
      session=net.join({
        gameKey:'wallbound',
        code,
        name:guestName,
        maxPlayers:2,
        onStatus(info){
          if(info.state==='connecting') {
            setStatus('Connecting','Looking for room '+code+'…','JOINING');
          } else if(info.state==='retrying') {
            setStatus('Reconnecting','Signaling retry '+(info.attempt||1)+' of '+(info.maxRetries||4)+'…','RETRY');
          } else if(info.state==='connected') {
            seat=Number(info.seat);
            connected=true;
            setStatus('Connected','You are Player 2 · Guest','GUEST');
            closeRemote();
            game.toast('Connected. You are Player 2.');
            setRemoteLocks();
          } else if(info.state==='disconnected') {
            connected=false;
            guestDeadline=0;
            setStatus('Disconnected','The host connection closed.','OFFLINE');
            game.toast('Host disconnected.');
            setRemoteLocks();
          } else if(info.state==='full') {
            setStatus('Room is full','This Wallbound room already has two players.','FULL');
          }
        },
        onWelcome(message){
          seat=Number(message.seat);
          connected=true;
          setRemoteLocks();
        },
        onMessage(message){
          if (!message?.type) return;

          if(message.type==='wallbound:state'){
            game.setState(message.state);
            applyGuestTimer(message.timer);
            setRemoteLocks();
          } else if(message.type==='wallbound:timer'){
            applyGuestTimer(message.timer);
          } else if(message.type==='wallbound:notice'){
            if(message.message) game.toast(message.message);
          } else if(message.type==='wallbound:decision-request'){
            receiveHostDecisionRequest(message);
          } else if(message.type==='wallbound:decision-ack'){
            if(pendingDecision && String(message.id)===pendingDecision.id) {
              pendingDecision.waiting=true;
              setRemoteLocks();
            }
          } else if(message.type==='wallbound:decision-result'){
            receiveDecisionResult(message);
          } else if(message.type==='wallbound:error'){
            game.toast(message.message||'Action rejected by host.');
          }
        },
        onError(error){
          connected=false;
          lobby.hidden=false;
          roomBox.hidden=true;
          const detail=error?.type==='network'
            ? 'Could not reach the signaling service after automatic retries. Try again or switch between Wi-Fi and cellular.'
            : (error?.type||error?.message||'Could not join room.');
          setStatus('Could not join room',detail,'ERROR');
        }
      });

      lobby.hidden=false;
      roomBox.hidden=true;
      setStatus('Connecting','Looking for room '+code+'…','JOINING');
    }catch(error){
      clearSession(false);
      setStatus('Could not join room',error.message||String(error),'ERROR');
    }
  }

  $('remoteBtn')?.addEventListener('click',openRemote);
  $('remoteRailBtn')?.addEventListener('click',openRemote);
  $('remoteClose').addEventListener('click',closeRemote);
  $('remoteCreate').addEventListener('click',createRoom);
  $('remoteJoin').addEventListener('click',joinRoom);
  $('remoteLocal').addEventListener('click',()=>{clearSession(false);closeRemote();});
  $('remoteLeave').addEventListener('click',()=>clearSession(true));
  $('remoteShare').addEventListener('click',shareInvite);
  $('remoteDecisionApprove').addEventListener('click',approveDecision);
  $('remoteDecisionDeny').addEventListener('click',denyDecision);

  codeInput.addEventListener('input',()=>{codeInput.value=net.cleanCode(codeInput.value);});
  modal.addEventListener('click',event=>{if(event.target===modal) closeRemote();});
  window.addEventListener('beforeunload',()=>{try{session?.close();}catch(_){}});

  const rulesGrid=document.querySelector('#rulesModal .rules-grid');
  if(rulesGrid){
    const wallRule=rulesGrid.querySelector('article:nth-child(4) p');
    if(wallRule) wallRule.textContent='Walls span two spaces and can never fully block a route. Tap a gold wall guide once to preview its exact position, then tap the bright preview again to place it.';
    rulesGrid.insertAdjacentHTML('beforeend','<article><span>6</span><div><b>Remote match rules</b><p>The host selects the turn clock. A timeout passes the turn. Undo and restart requests pause the clock and require the opponent to approve.</p></div></article>');
  }

  startTimerLoop();
  setRemoteLocks();

  if(inviteCode.length===6){
    codeInput.value=inviteCode;
    $('remoteTimerOption').hidden=true;
    setStatus('Remote invite','Room '+inviteCode+' is ready to join.','INVITE');
    setTimeout(()=>{
      openRemote();
      nameInput.focus();
    },250);
  }else{
    setStatus('Local play','Create a room or join with a code.','LOCAL');
    setTimeout(openRemote,250);
  }
})();