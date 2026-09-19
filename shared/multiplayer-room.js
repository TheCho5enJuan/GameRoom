(function(){
  'use strict';
  const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const sessions=new Set();
  const MAX_RETRIES=4;
  const RETRY_DELAYS=[1000,1800,3000,5000];
  const CLOUD={host:'0.peerjs.com',port:443,path:'/',secure:true};

  function cleanGameKey(v){return String(v||'game').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'game';}
  function cleanCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);}
  function generateCode(){let out='';for(let i=0;i<6;i++)out+=ALPHABET[Math.floor(Math.random()*ALPHABET.length)];return out;}
  function peerId(gameKey,code){return 'gameroom-'+cleanGameKey(gameKey)+'-'+cleanCode(code).toLowerCase();}
  function retryable(error){return ['network','server-error','socket-error','socket-closed','peer-unavailable'].includes(error?.type);}
  function destroyPeer(peer){try{peer?.destroy();}catch(_){}}

  function makeSession(opts,role,code){
    const session={
      role, code, gameKey:cleanGameKey(opts.gameKey), maxPlayers:Math.max(2,Number(opts.maxPlayers)||2),
      peer:null, connection:null, connections:new Map(), seat:role==='host'?0:null, closed:false,
      retryTimer:null, retryPending:false,
      send(message){
        if(role==='host') throw new Error('Host sessions use sendTo() or broadcast().');
        if(session.connection?.open) session.connection.send(message);
      },
      sendTo(seat,message){const c=session.connections.get(Number(seat));if(c?.open)c.send(message);},
      broadcast(message){session.connections.forEach(c=>{if(c.open)c.send(message);});},
      close(){
        session.closed=true;
        if(session.retryTimer) clearTimeout(session.retryTimer);
        session.retryTimer=null;session.retryPending=false;
        try{session.connection?.close();}catch(_){}
        session.connections.forEach(c=>{try{c.close();}catch(_){}});
        destroyPeer(session.peer);
        sessions.delete(session);
      }
    };
    sessions.add(session);
    return session;
  }

  function scheduleRetry(session,opts,attempt,start,error){
    if(session.closed || session.retryPending) return false;
    if(attempt>=MAX_RETRIES){
      opts.onError?.(error);
      return false;
    }
    session.retryPending=true;
    const delay=RETRY_DELAYS[Math.min(attempt,RETRY_DELAYS.length-1)];
    opts.onStatus?.({
      state:'retrying',
      role:session.role,
      code:session.code,
      attempt:attempt+1,
      maxRetries:MAX_RETRIES,
      delay,
      errorType:error?.type||'network'
    });
    session.retryTimer=setTimeout(()=>{
      session.retryTimer=null;
      session.retryPending=false;
      if(!session.closed) start(attempt+1);
    },delay);
    return true;
  }

  function host(opts={}){
    if(typeof window.Peer!=='function') throw new Error('PeerJS is not loaded.');
    const code=cleanCode(opts.code)||generateCode();
    const session=makeSession(opts,'host',code);
    const usedSeats=new Set([0]);

    function bindIncoming(conn){
      let assignedSeat=null;
      conn.on('data',message=>{
        if(message?.type==='gameroom:hello'){
          if(assignedSeat===null){
            for(let i=1;i<session.maxPlayers;i++){if(!usedSeats.has(i)){assignedSeat=i;break;}}
            if(assignedSeat===null){conn.send({type:'gameroom:full'});setTimeout(()=>conn.close(),50);return;}
            usedSeats.add(assignedSeat);
            session.connections.set(assignedSeat,conn);
            conn.send({type:'gameroom:welcome',seat:assignedSeat,code,maxPlayers:session.maxPlayers});
            opts.onPlayerJoin?.({seat:assignedSeat,name:String(message.name||('Player '+(assignedSeat+1))).slice(0,24),connection:conn});
            opts.onStatus?.({state:'connected',role:'host',code,seat:0,remoteSeat:assignedSeat});
          }
          return;
        }
        if(assignedSeat!==null) opts.onMessage?.(message,{seat:assignedSeat,connection:conn});
      });
      conn.on('close',()=>{
        if(assignedSeat!==null){
          session.connections.delete(assignedSeat);
          usedSeats.delete(assignedSeat);
          opts.onPlayerLeave?.({seat:assignedSeat});
          opts.onStatus?.({state:'waiting',role:'host',code,seat:0});
        }
      });
      conn.on('error',error=>opts.onError?.(error));
    }

    function start(attempt=0){
      if(session.closed) return;
      destroyPeer(session.peer);
      const peer=new Peer(peerId(session.gameKey,code),CLOUD);
      session.peer=peer;

      peer.on('open',()=>{
        session.retryPending=false;
        opts.onStatus?.({state:'waiting',role:'host',code,seat:0});
      });
      peer.on('connection',bindIncoming);
      peer.on('disconnected',()=>{
        if(session.closed || session.connections.size>0) return;
        scheduleRetry(session,opts,attempt,start,{type:'network',message:'Signaling server disconnected.'});
      });
      peer.on('error',error=>{
        if(retryable(error) && session.connections.size===0 && scheduleRetry(session,opts,attempt,start,error)) return;
        opts.onError?.(error);
      });
    }

    start(0);
    return session;
  }

  function join(opts={}){
    if(typeof window.Peer!=='function') throw new Error('PeerJS is not loaded.');
    const code=cleanCode(opts.code);
    if(code.length!==6) throw new Error('Room codes are six characters.');
    const session=makeSession(opts,'guest',code);

    function start(attempt=0){
      if(session.closed) return;
      try{session.connection?.close();}catch(_){}
      session.connection=null;
      destroyPeer(session.peer);
      opts.onStatus?.({state:attempt?'retrying':'connecting',role:'guest',code,attempt,maxRetries:MAX_RETRIES});

      const peer=new Peer(undefined,CLOUD);
      session.peer=peer;

      peer.on('open',()=>{
        const conn=peer.connect(peerId(session.gameKey,code),{reliable:true});
        session.connection=conn;

        conn.on('open',()=>conn.send({type:'gameroom:hello',name:String(opts.name||'Guest').slice(0,24)}));
        conn.on('data',message=>{
          if(message?.type==='gameroom:welcome'){
            session.seat=Number(message.seat);
            opts.onStatus?.({state:'connected',role:'guest',code,seat:session.seat});
            opts.onWelcome?.(message);
            return;
          }
          if(message?.type==='gameroom:full'){
            opts.onStatus?.({state:'full',role:'guest',code});
            return;
          }
          opts.onMessage?.(message,{seat:session.seat,connection:conn});
        });
        conn.on('close',()=>{
          if(!session.closed) opts.onStatus?.({state:'disconnected',role:'guest',code,seat:session.seat});
        });
        conn.on('error',error=>opts.onError?.(error));
      });

      peer.on('disconnected',()=>{
        if(session.closed || session.connection?.open) return;
        scheduleRetry(session,opts,attempt,start,{type:'network',message:'Signaling server disconnected.'});
      });
      peer.on('error',error=>{
        if(retryable(error) && !session.connection?.open && scheduleRetry(session,opts,attempt,start,error)) return;
        opts.onError?.(error);
      });
    }

    start(0);
    return session;
  }

  window.GameRoomMultiplayer={
    host,join,generateCode,cleanCode,
    cloud:CLOUD,
    closeAll(){[...sessions].forEach(s=>s.close());}
  };
})();