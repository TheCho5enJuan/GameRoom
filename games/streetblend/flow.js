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

  function activeSeats(state){
    if(Array.isArray(state?.activeSeats) && state.activeSeats.length) return state.activeSeats.slice();
    return (state?.players||[]).map((_,i)=>i);
  }

  function requiredReadySeats(state){
    if(!state) return [];
    if(state.phase===PHASES.HIDE_PREPARE) return activeSeats(state);
    if(state.phase===PHASES.SEEK_PREPARE) return [state.seekerSeat];
    return [];
  }

  function timedActorSeat(state){
    if(!state) return null;
    if(state.phase===PHASES.HIDE) return state.hiderSeat;
    if(state.phase===PHASES.SEEK) return state.seekerSeat;
    return null;
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
      return state.phase===PHASES.HIDE && Number(seat)===Number(state.hiderSeat);
    }
    if(action==='guess'){
      return state.phase===PHASES.SEEK && state.timerStarted && Number(seat)===Number(state.seekerSeat);
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
    activeSeats,
    requiredReadySeats,
    timedActorSeat,
    matchesContext,
    actionAllowed,
    allReady,
    phaseText
  };
})();