(function(){
  'use strict';
  if (!window.WallboundGame || !window.GameRoomMultiplayer) return;

  const game = window.WallboundGame;
  const net = window.GameRoomMultiplayer;
  let session = null;
  let role = 'local';
  let seat = null;
  let connected = false;

  const style = document.createElement('style');
  style.textContent = `
    .remote-panel{display:grid;gap:14px}
    .remote-status{padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.045);font-size:.92rem}
    .remote-status strong{display:block;font-size:1.05rem;margin-bottom:3px}
    .remote-code{font-size:clamp(2rem,10vw,3.4rem);font-weight:900;letter-spacing:.16em;text-align:center;padding:16px;border-radius:16px;background:#07101b;border:1px solid rgba(255,255,255,.13)}
    .remote-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .remote-field{display:grid;gap:6px}
    .remote-field label{font-size:.78rem;font-weight:800;opacity:.72;text-transform:uppercase;letter-spacing:.08em}
    .remote-field input{width:100%;min-width:0;padding:12px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#08131f;color:#fff;font:inherit}
    .remote-field input.code{text-transform:uppercase;letter-spacing:.16em;font-weight:900;text-align:center}
    .remote-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .remote-actions button,.remote-copy{min-height:48px;border-radius:12px;border:1px solid rgba(255,255,255,.14);font:inherit;font-weight:850;cursor:pointer}
    .remote-primary{background:#276ef1;color:#fff}
    .remote-secondary{background:#142235;color:#fff}
    .remote-danger{background:#4a1d27;color:#fff}
    .remote-note{font-size:.8rem;line-height:1.45;opacity:.68}
    .remote-menu-badge{display:inline-flex;align-items:center;justify-content:center;min-width:72px;padding:4px 8px;border-radius:999px;background:rgba(70,220,170,.1);color:#72e5bd;border:1px solid rgba(114,229,189,.25);font-size:.68rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
    @media(max-width:560px){.remote-grid,.remote-actions{grid-template-columns:1fr}}
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
            <button class="remote-copy remote-secondary" id="remoteCopy" type="button">Copy room code</button>
            <div class="remote-note" id="remoteRoomNote">Share this code with Player 2.</div>
            <button class="remote-copy remote-danger" id="remoteLeave" type="button">Leave remote room</button>
          </div>
          <div class="remote-note">The host owns the official game state. The other phone sends moves to the host, and the host broadcasts the validated board back.</div>
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

  function currentDefaultName(){
    const s=game.getState();
    return s?.players?.[0]?.name || 'Player';
  }
  nameInput.value = currentDefaultName();

  function setStatus(title,detail,state=''){
    status.innerHTML = '<strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(detail)+'</span>';
    const menu = $('remoteMenuStatus');
    if (menu) menu.textContent = detail;
    const badge = $('remoteRailBadge');
    if (badge) badge.textContent = state || (role==='local'?'LOCAL':role.toUpperCase());
  }
  function escapeHtml(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function open(){
    document.querySelectorAll('.overlay.show').forEach(n=>n.classList.remove('show'));
    modal.classList.add('show');
  }
  function close(){modal.classList.remove('show');}
  function setRemoteLocks(){
    const guest = role==='guest';
    ['undoBtn','playersBtn','playersRailBtn','restartBtn','restartRailBtn','playAgain'].forEach(id=>{
      const node=$(id); if(node) node.disabled=guest;
    });
    const undo=$('undoBtn'); if(undo && role!=='local') undo.disabled=true;
  }
  function installInterceptor(){
    game.setActionInterceptor(action=>{
      if (role==='local') return true;
      if (!connected || seat===null) {
        game.toast(role==='host'?'Waiting for Player 2.':'Still connecting to the room.');
        return false;
      }
      if (game.getCurrent() !== seat) {
        game.toast('Wait for your turn.');
        return false;
      }
      if (role==='host') return true;
      session?.send({type:'wallbound:action',action});
      return false;
    });
  }
  function broadcastState(){
    if (role==='host' && session) session.broadcast({type:'wallbound:state',state:game.getState()});
  }
  function clearSession(reload=false){
    try{session?.close();}catch(_){}
    session=null;role='local';seat=null;connected=false;
    game.setActionInterceptor(null);
    game.onStateChange(null);
    setRemoteLocks();
    setStatus('Local play','Both players use this device.','LOCAL');
    lobby.hidden=false;roomBox.hidden=true;
    if(reload) location.reload();
  }
  function showRoom(code,note){
    lobby.hidden=true;roomBox.hidden=false;
    $('remoteCodeDisplay').textContent=code;
    $('remoteRoomNote').textContent=note;
  }
  function safeName(fallback){
    return String(nameInput.value||fallback).trim().slice(0,18)||fallback;
  }

  function createRoom(){
    clearSession(false);
    role='host';seat=0;connected=false;
    const hostName=safeName('Player 1');
    game.setPlayerProfile(0,hostName);
    installInterceptor();
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
            connected=false;
            showRoom(session.code,'Share this code with Player 2.');
            setStatus('Room '+session.code,'Ready — waiting for Player 2 to join…','WAITING');
          }else if(info.state==='connected'){
            connected=true;
            setStatus('Connected','You are Player 1 · Host','HOST');
          }
        },
        onPlayerJoin(info){
          connected=true;
          game.setPlayerProfile(info.seat,info.name||'Player 2');
          session.sendTo(info.seat,{type:'wallbound:state',state:game.getState()});
          setStatus('Connected',info.name+' joined as Player 2','HOST');
        },
        onPlayerLeave(){
          connected=false;
          setStatus('Player disconnected','Waiting for Player 2 to reconnect…','WAITING');
        },
        onMessage(message,meta){
          if(message?.type!=='wallbound:action') return;
          const action=message.action||{};
          const state=game.getState();
          if(meta.seat!==1 || state.current!==meta.seat){
            session.sendTo(meta.seat,{type:'wallbound:error',message:'It is not your turn.'});
            return;
          }
          if(action.type==='move') game.actMove(action.row,action.col);
          else if(action.type==='wall') game.actWall(action.row,action.col,action.orientation);
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
    role='guest';seat=null;connected=false;
    installInterceptor();
    game.onStateChange(null);
    setRemoteLocks();
    const guestName=safeName('Player 2');
    try{
      session=net.join({
        gameKey:'wallbound',
        code,
        name:guestName,
        maxPlayers:2,
        onStatus(info){
          if(info.state==='connecting') setStatus('Connecting','Looking for room '+code+'…','JOINING');
          else if(info.state==='retrying') setStatus('Reconnecting','Signaling retry '+(info.attempt||1)+' of '+(info.maxRetries||4)+'…','RETRY');
          else if(info.state==='connected'){
            seat=Number(info.seat);connected=true;
            setRemoteLocks();
            setStatus('Connected','You are Player 2 · Guest','GUEST');
          }else if(info.state==='disconnected'){
            connected=false;
            setStatus('Disconnected','The host connection closed.','OFFLINE');
          }else if(info.state==='full') setStatus('Room is full','This Wallbound room already has two players.','FULL');
        },
        onWelcome(message){
          seat=Number(message.seat);connected=true;
          showRoom(code,'Connected to the host. Your moves are sent to Player 1.');
        },
        onMessage(message){
          if(message?.type==='wallbound:state'){
            game.setState(message.state);
          }else if(message?.type==='wallbound:error'){
            game.toast(message.message||'Move rejected by host.');
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

  $('remoteBtn')?.addEventListener('click',open);
  $('remoteRailBtn')?.addEventListener('click',open);
  $('remoteClose').addEventListener('click',close);
  $('remoteCreate').addEventListener('click',createRoom);
  $('remoteJoin').addEventListener('click',joinRoom);
  $('remoteLocal').addEventListener('click',()=>{clearSession(false);close();});
  $('remoteLeave').addEventListener('click',()=>clearSession(true));
  $('remoteCopy').addEventListener('click',async()=>{
    const code=$('remoteCodeDisplay').textContent.trim();
    try{await navigator.clipboard.writeText(code);$('remoteCopy').textContent='Copied!';setTimeout(()=>$('remoteCopy').textContent='Copy room code',1200);}
    catch(_){prompt('Copy this room code:',code);}
  });
  codeInput.addEventListener('input',()=>{codeInput.value=net.cleanCode(codeInput.value);});
  modal.addEventListener('click',event=>{if(event.target===modal)close();});
  window.addEventListener('beforeunload',()=>{try{session?.close();}catch(_){}});

  setRemoteLocks();
  setStatus('Local play','Create a room or join with a code.','LOCAL');
  setTimeout(open,250);
})();