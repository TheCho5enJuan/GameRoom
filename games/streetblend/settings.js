'use strict';

(() => {
  const KEY='streetblend.settings.v3';
  const LEGACY_KEY='streetblend.settings.v2';
  const DEFAULTS=Object.freeze({
    mode:'classic',
    players:2,
    rounds:4,
    hideSeconds:180,
    seekSeconds:240,
    wrongPenaltyMode:'time',
    wrongPenaltySeconds:5,
    artCategory:'mixed'
  });
  const ART_CATEGORIES=['mixed','impressionism','landscapes','city','interiors','people','water','gardens'];
  const ROUNDS=[2,4,6];
  const HIDE=[60,90,120,180,240,300,450,600];
  const SEEK=[90,120,180,240,300,450,600];
  const PENALTIES=[3,5,10,15];

  function sanitize(raw={}){
    return {
      mode:'classic',
      players:2,
      rounds:ROUNDS.includes(Number(raw.rounds))?Number(raw.rounds):DEFAULTS.rounds,
      hideSeconds:HIDE.includes(Number(raw.hideSeconds))?Number(raw.hideSeconds):DEFAULTS.hideSeconds,
      seekSeconds:SEEK.includes(Number(raw.seekSeconds))?Number(raw.seekSeconds):DEFAULTS.seekSeconds,
      wrongPenaltyMode:raw.wrongPenaltyMode==='none'?'none':'time',
      wrongPenaltySeconds:PENALTIES.includes(Number(raw.wrongPenaltySeconds))?Number(raw.wrongPenaltySeconds):DEFAULTS.wrongPenaltySeconds,
      artCategory:ART_CATEGORIES.includes(raw.artCategory)?raw.artCategory:DEFAULTS.artCategory
    };
  }

  function load(){
    try{
      const current=JSON.parse(localStorage.getItem(KEY)||'null');
      if(current) return sanitize(current);
      const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');
      if(legacy) return sanitize({...legacy,hideSeconds:DEFAULTS.hideSeconds,seekSeconds:DEFAULTS.seekSeconds});
    }catch(_){}
    return {...DEFAULTS};
  }

  function save(settings){
    const safe=sanitize(settings);
    try{localStorage.setItem(KEY,JSON.stringify(safe));}catch(_){}
    return safe;
  }

  function defaults(){return {...DEFAULTS};}
  function penaltyText(config){
    return config.wrongPenaltyMode==='none'?'No miss penalty':'−'+Number(config.wrongPenaltySeconds||0)+'s miss';
  }
  function artCategoryText(config){
    return window.StreetblendArt?.categories?.[config.artCategory]||'Mixed Collection';
  }
  function rulesText(config){
    return 'Classic · '+artCategoryText(config)+' · '+config.players+' players · '+config.rounds+' rounds · '+config.hideSeconds+'s hide · '+config.seekSeconds+'s seek · '+penaltyText(config);
  }

  window.StreetblendSettings={sanitize,load,save,defaults,penaltyText,artCategoryText,rulesText};
})();