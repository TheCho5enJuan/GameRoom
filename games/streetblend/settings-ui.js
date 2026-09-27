'use strict';

(() => {
  const $=id=>document.getElementById(id);
  const api=window.StreetblendSettings;

  function updateSummary(settings,hostState){
    const summary=$('settingsSummary');
    if(summary) summary.textContent=api.artCategoryText(settings)+' · '+settings.players+' players · '+settings.rounds+' rounds · '+api.penaltyText(settings);
    const rules=$('roomRules');
    if(rules&&(!hostState||hostState.phase==='lobby')) rules.textContent=api.rulesText(settings);
  }

  function sync(settings){
    $('settingMode').value=settings.mode;
    $('settingPlayers').value=String(settings.players);
    $('settingRounds').value=String(settings.rounds);
    $('settingArtCategory').value=settings.artCategory;
    $('settingHideSeconds').value=String(settings.hideSeconds);
    $('settingSeekSeconds').value=String(settings.seekSeconds);
    $('settingPenaltyMode').value=settings.wrongPenaltyMode;
    $('settingPenaltySeconds').value=String(settings.wrongPenaltySeconds);
    $('penaltySecondsField').hidden=settings.wrongPenaltyMode==='none';
  }

  function read(){
    return api.sanitize({
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

  function open(settings){
    sync(settings);
    $('settingsOverlay').hidden=false;
  }

  function close(){
    $('settingsOverlay').hidden=true;
  }

  function save(){
    return api.save(read());
  }

  function restore(){
    const settings=api.defaults();
    sync(settings);
    return settings;
  }

  function showStart(settings,hostState,setNetStatus){
    $('startMenu').hidden=false;
    $('joinPane').hidden=true;
    $('roomBox').hidden=true;
    $('connectedBox').hidden=true;
    setNetStatus('Ready','Choose how you want to play.');
    updateSummary(settings,hostState);
  }

  function showJoin(setNetStatus){
    $('startMenu').hidden=true;
    $('joinPane').hidden=false;
    $('roomBox').hidden=true;
    $('connectedBox').hidden=true;
    setNetStatus('Join a game','Enter a room code or open an invite link.');
    setTimeout(()=>$('roomCode').focus(),50);
  }

  window.StreetblendSettingsPanel={updateSummary,sync,read,open,close,save,restore,showStart,showJoin};
})();