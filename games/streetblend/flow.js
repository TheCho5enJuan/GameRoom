'use strict';

(() => {
  const PHASES=Object.freeze({
    LOBBY:'lobby',
    HIDE_PREPARE:'hide_prepare',
    HIDE:'hide',
    SEEK_PREPARE:'seek_prepare',
    SEEK:'seek',
    REVEAL:'reveal',
    FINAL:'final'
  });

  const TRANSITIONS={
    [PHASES.LOBBY]:[PHASES.HIDE_PREPARE],
    [PHASES.HIDE_PREPARE]:[PHASES.HIDE],
    [PHASES.HIDE]:[PHASES.SEEK_PREPARE],
    [PHASES.SEEK_PREPARE]:[PHASES.SEEK],
    [PHASES.SEEK]:[PHASES.REVEAL],
    [PHASES.REVEAL]:[PHASES.HIDE_PREPARE,PHASES.FINAL],
    [PHASES.FINAL]:[PHASES.HIDE_PREPARE]
  };

  function canTransition(from,to){
    return !!TRANSITIONS[from]?.includes(to);
  }

  function activeSeats(state){
    if(Array.isArray(state?.activeSeats) && state.activeSeats.length) return state.activeSeats.slice();
    return (state?.players||[]).map((_,i)=>i);
  }

  function roleSeats(state,role){
    const plural=state?.[role+'Seats'];
    if(Array.isArray(plural)&&plural.length) return plural.map(Number);
    const single=state?.[role+'Seat'];
    return Number.isFinite(Number(single))?[Number(single)]:[];
  }

  function requiredReadySeats(state){
    if(!state) return [];
    if(state.phase===PHASES.HIDE_PREPARE) return activeSeats(state);
    if(state.phase===PHASES.SEEK_PREPARE){
      const active=activeSeats(state);
      const seekers=roleSeats(state,'seeker').filter(seat=>active.includes(seat));
      return seekers.length?seekers:[active[0]];
    }
    return [];
  }

  function timedActorSeats(state){
    if(!state) return [];
    const active=activeSeats(state);
    if(state.phase===PHASES.HIDE){
      const seats=roleSeats(state,'hider').filter(seat=>active.includes(seat));
      return seats.length?seats:[active[0]];
    }
    if(state.phase===PHASES.SEEK){
      const seats=roleSeats(state,'seeker').filter(seat=>active.includes(seat));
      return seats.length?seats:[active[0]];
    }
    return [];
  }

  function timedActorSeat(state){
    return timedActorSeats(state)[0]??null;
  }

  function matchesContext(state,message){
    if(!state||!message) return false;
    return Number(message.round)===Number(state.round) &&
      String(message.phaseToken||'')===String(state.phaseToken||'');
  }

  function actionAllowed(state,seat,action,message){
    if(!state||!matchesContext(state,message)) return false;
    if(action==='phase-ready'){
      return requiredReadySeats(state).includes(Number(seat));
    }
    if(action==='draft'||action==='lock'){
      return state.phase===PHASES.HIDE && roleSeats(state,'hider').includes(Number(seat));
    }
    if(action==='guess'){
      return state.phase===PHASES.SEEK && state.timerStarted && roleSeats(state,'seeker').includes(Number(seat));
    }
    return false;
  }

  function allReady(state,readyBySeat){
    return requiredReadySeats(state).every(seat=>readyBySeat?.[seat]===state.phaseToken);
  }

  function phaseText(state){
    if(!state) return '';
    if(state.phase===PHASES.HIDE_PREPARE) return 'LOADING';
    if(state.phase===PHASES.SEEK_PREPARE) return 'PREPARING';
    return String(state.phase||'').toUpperCase();
  }

  window.StreetblendFlow={
    PHASES,
    canTransition,
    activeSeats,
    roleSeats,
    requiredReadySeats,
    timedActorSeats,
    timedActorSeat,
    matchesContext,
    actionAllowed,
    allReady,
    phaseText
  };
})();