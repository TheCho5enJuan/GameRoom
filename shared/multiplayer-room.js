(function(){
  'use strict';
  const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const sessions=new Set();

  function cleanGameKey(v){return String(v||'game').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'game';}
  function cleanCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);}
  function generateCode(){let out='';for(let i=0;i<6;i++)out+=ALPHABET[Math.floor(Math.random()*ALPHABET.length)];return out;}
  function peerId(gameKey,code){return 'gameroom-'+cleanGameKey(gameKey)+'-'+cleanCode(code).toLowerCase();}

  function makeSession(opts,role,code){
    const session={
      role, code, gameKey:cleanGameKey(opts.gameKey), maxPlayers:Math.max(2,Number(opts.maxPlayers)||2),
      peer:null, connection:null, connections:new Map(), seat:role==='host'?0:null, closed:false,
      send(message){
        if(role==='host') throw new Error('Host sessions use sendTo() or broadcast().');
        if(session.connection?.open) session.connection.send(message);
      },
      sendTo(seat,message){const c=session.connections.get(Number(seat));if(c?.open)c.send(message);},
      broadcast(message){session.connections.forEach(c=>{if(c.open)c.send(message);});},
      close(){
        session.closed=true;
        try{session.connection?.close();}catch(_){}
        session.connections.forEach(c=>{try{c.close();}catch(_){}});
        try{session.peer?.destroy();}catch(_){}
        sessions.delete(session);
      }
    };
    sessions.add(session);
    return session;
  }

  function host(opts={}){
    if(typeof window.Peer!=='function') throw new Error('PeerJS is not loaded.');
    const code=cleanCode(opts.code)||generateCode();
    const session=makeSession(opts,'host',code);
    const peer=new Peer(peerId(session.gameKey,code));
    session.peer=peer;
    const usedSeats=new Set([0]);

    peer.on('open',()=>opts.onStatus?.({state:'waiting',role:'host',code,seat:0}));
    peer.on('connection',conn=>{
      let assignedSeat=null;
      conn.on('data',message=>{
        if(message?.type==='gameroom:hello'){
          if(assignedSeat===null){
            for(let i=1;i<session.maxPlayers;i++){if(!usedSeats.has(i)){assignedSeat=i;break;}}
            if(assignedSeat===null){conn.send({type:'gameroom:full'});setTimeout(()=>conn.close(),50);return;}
            usedSeats.add(assignedSeat); session.connections.set(assignedSeat,conn);
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
          session.connections.delete(assignedSeat);usedSeats.delete(assignedSeat);
          opts.onPlayerLeave?.({seat:assignedSeat});
          opts.onStatus?.({state:'waiting',role:'host',code,seat:0});
        }
      });
      conn.on('error',error=>opts.onError?.(error));
    });
    peer.on('error',error=>opts.onError?.(error));
    return session;
  }

  function join(opts={}){
    if(typeof window.Peer!=='function') throw new Error('PeerJS is not loaded.');
    const code=cleanCode(opts.code);
    if(code.length!==6) throw new Error('Room codes are six characters.');
    const session=makeSession(opts,'guest',code);
    const peer=new Peer();
    session.peer=peer;
    opts.onStatus?.({state:'connecting',role:'guest',code});

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
        if(message?.type==='gameroom:full'){opts.onStatus?.({state:'full',role:'guest',code});return;}
        opts.onMessage?.(message,{seat:session.seat,connection:conn});
      });
      conn.on('close',()=>opts.onStatus?.({state:'disconnected',role:'guest',code,seat:session.seat}));
      conn.on('error',error=>opts.onError?.(error));
    });
    peer.on('error',error=>opts.onError?.(error));
    return session;
  }

  window.GameRoomMultiplayer={host,join,generateCode,cleanCode,closeAll(){[...sessions].forEach(s=>s.close());}};
})();