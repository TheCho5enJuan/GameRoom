'use strict';

(() => {
  const $=id=>document.getElementById(id);

  function updateScoreboard(state,avatarApi){
    const players=state.players||[{name:'Player 1',score:0},{name:'Player 2',score:0}];
    if($('p0Match')){
      $('p0Match').querySelector('span').textContent=players[0]?.name||'Player 1';
      $('p0Match').querySelector('b').textContent=players[0]?.score||0;
    }
    if($('p1Match')){
      $('p1Match').querySelector('span').textContent=players[1]?.name||'Player 2';
      $('p1Match').querySelector('b').textContent=players[1]?.score||0;
    }
    avatarApi?.setMatchAvatars?.(players);
    $('p0Match')?.classList.toggle('active',
      (state.hiderSeat===0&&state.phase==='hide')||(state.seekerSeat===0&&state.phase==='seek'));
    $('p1Match')?.classList.toggle('active',
      (state.hiderSeat===1&&state.phase==='hide')||(state.seekerSeat===1&&state.phase==='seek'));
  }

  function updateClock(ms){
    const sec=Math.max(0,Math.ceil((Number(ms)||0)/1000));
    const clock=$('clock');
    if(!clock) return;
    clock.textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
    clock.style.color=sec<=10&&sec>0?'var(--danger)':'';
  }

  function showReveal(state,isHost,escapeHtml){
    $('revealControls').hidden=false;
    const r=state.result||{};
    $('revealTitle').textContent=r.found?'Found!':'Time ran out!';
    $('revealText').textContent=r.found
      ? 'The hidden figure is outlined. The Seeker found it with '+r.remaining+' seconds left.'
      : 'The Hider survived the entire search.';
    const h=state.players[state.hiderSeat],s=state.players[state.seekerSeat];
    $('roundScore').innerHTML=
      '<div><b>+'+(r.hiderPoints||0)+'</b><span>'+escapeHtml(h.name)+' · Hider</span></div>'+
      '<div><b>+'+(r.seekerPoints||0)+'</b><span>'+escapeHtml(s.name)+' · Seeker</span></div>';
    $('nextRound').hidden=!isHost;
    if(!isHost){
      $('nextRoundWait').hidden=false;
      $('nextRoundWait').textContent='Waiting for the host…';
    }
  }

  function showFinal(state,isHost,escapeHtml){
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

  window.StreetblendView={
    updateScoreboard,updateClock,showReveal,showFinal,showStageMessage,hideStageMessage,flashGuess
  };
})();