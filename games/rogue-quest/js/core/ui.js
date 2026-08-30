/* Rogue Quest interface rendering and controls */
'use strict';
const LANG={
 en:{nav:['Adventure','Hero','Pets','Gear','Kingdom'],ready:'Ready for adventure.',start:'START ADVENTURE',roll:'🎲 ROLL DICE',battle:'BATTLE IN PROGRESS',fate:'🎲 FATE DICE',camp:'🍖 FIELD CAMP'},
 es:{nav:['Aventura','Héroe','Mascotas','Equipo','Reino'],ready:'Listo para la aventura.',start:'INICIAR AVENTURA',roll:'🎲 TIRAR DADOS',battle:'BATALLA EN CURSO',fate:'🎲 DADOS DEL DESTINO',camp:'🍖 CAMPAMENTO'}
};
function applyLanguageUI(){let l=LANG[state.lang]||LANG.en;$$('.navbtn').forEach((b,i)=>{let s=b.querySelector('span:last-child');if(s)s.textContent=l.nav[i]});if(!state.run)$('#runStatus').textContent=l.ready;renderRun()}
function cycleSpeed(){let vals=[1,1.25,1.5,2,3],i=vals.indexOf(state.battleSpeed);state.battleSpeed=vals[(i+1)%vals.length];saveState();renderAll();toast('Battle speed '+state.battleSpeed+'×')}
function bindToggle(id,key){$(id).addEventListener('click',()=>{state[key]=!state[key];applySettings();saveState()})}
$$('.navbtn').forEach(b=>b.addEventListener('click',()=>{$$('.navbtn').forEach(x=>x.classList.toggle('active',x===b));$$('.screen').forEach(s=>s.classList.toggle('active',s.id==='screen-'+b.dataset.screen));renderAll()}));
$('#energyPill').addEventListener('click',()=>{renderEnergy();openModal('energyModal')});
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>{let map={energy:'energyModal',talents:'talentsModal',artifacts:'artifactsModal',quests:'questsModal',achievements:'achievementsModal',codex:'codexModal',stats:'statsModal',settings:'settingsModal'};let id=map[b.dataset.open];if(id){renderAll();openModal(id)}}));
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$('#choiceClose').addEventListener('click',()=>closeModal('choiceModal'));$('#upgradeClose').addEventListener('click',()=>closeModal('upgradeModal'));
$('#chapterPrev').addEventListener('click',()=>selectChapter(-1));$('#chapterNext').addEventListener('click',()=>selectChapter(1));
$('#primaryBtn').addEventListener('click',()=>state.run?rollDice():startRun());$('#fateBtn').addEventListener('click',fateDice);$('#campBtn').addEventListener('click',fieldCamp);$('#speedBtn').addEventListener('click',cycleSpeed);
$$('.skill').forEach(b=>b.addEventListener('click',()=>castSkill(b.dataset.skill)));
$('#hueSlider').addEventListener('input',e=>{state.heroHue=+e.target.value;$('#app').style.setProperty('--heroHue',state.heroHue)});$('#hueSlider').addEventListener('change',()=>{saveState();renderAll()});
$$('#classChoices .chip').forEach(b=>b.addEventListener('click',()=>{if(state.run)return toast('Change class between expeditions.');state.heroClass=b.dataset.class;saveState();renderAll();tone(420,.06)}));
$('#autoEquipBtn').addEventListener('click',autoEquip);$('#mergeBtn').addEventListener('click',mergeGear);$('#salvageBtn').addEventListener('click',salvageCommon);
$('#rerollUpgradeBtn').addEventListener('click',()=>{if(!state.run||state.run.rerolls<=0)return;state.run.rerolls--;chooseUpgrade();saveState()});
$('#wellBtn').addEventListener('click',claimWell);$('#gemEnergyBtn').addEventListener('click',buyEnergy);$('#energyUpgradeBtn').addEventListener('click',upgradeEnergyTalent);$('#dailyEnergyBtn').addEventListener('click',claimDaily);$('#dailyBtn').addEventListener('click',claimDaily);$('#claimPatrolBtn').addEventListener('click',claimPatrol);
$('#languageSelect').addEventListener('change',e=>{state.lang=e.target.value;applyLanguageUI();saveState();renderAll()});bindToggle('#soundToggle','sound');bindToggle('#motionToggle','motion');bindToggle('#depthToggle','depth');bindToggle('#autoSkillToggle','autoSkills');
$('#saveBtn').addEventListener('click',()=>{saveState();toast('Game saved.')});
$('#factoryResetBtn').addEventListener('click',()=>{
 if(!confirm('FACTORY RESET: Erase ALL Rogue Quest progress, unlocks, inventory, currencies, settings, statistics and saves?'))return;
 if(!confirm('This cannot be undone unless you exported a save first. Factory reset now?'))return;
 try{for(let i=localStorage.length-1;i>=0;i--){let key=localStorage.key(i);if(key&&key.toLowerCase().startsWith('roguequest'))localStorage.removeItem(key)}}catch(e){}
 state=defaultState();combat=null;sceneMode='board';particles=[];floatTexts=[];projectiles=[];rolling=false;
 try{$$('.modal-wrap').forEach(m=>m.classList.remove('show'))}catch(e){}
 saveState();hydrate();toast('Factory reset complete. New game started.');
});
$('#exportBtn').addEventListener('click',()=>{saveMode='export';$('#saveModalTitle').textContent='Export Save';$('#saveText').value=btoa(unescape(encodeURIComponent(JSON.stringify(state))));$('#saveTextAction').textContent='SELECT ALL';openModal('saveModal')});
$('#importBtn').addEventListener('click',()=>{saveMode='import';$('#saveModalTitle').textContent='Import Save';$('#saveText').value='';$('#saveTextAction').textContent='IMPORT';openModal('saveModal')});
$('#saveTextAction').addEventListener('click',()=>{if(saveMode==='export'){let e=$('#saveText');e.focus();e.select();toast('Save text selected. Use Android Copy.')}else{try{let raw=$('#saveText').value.trim(),obj=JSON.parse(decodeURIComponent(escape(atob(raw))));state=migrate(obj);if(state.run&&!Array.isArray(state.run.board))state.run=null;hydrate();saveState();closeModal('saveModal');toast('Save imported.')}catch(e){toast('Invalid save data.')}}});
$$('[data-dev]').forEach(b=>b.addEventListener('click',()=>{let k=b.dataset.dev;if(k==='gold')gainGold(50000);if(k==='gems')state.gems+=5000;if(k==='energy')state.energy=maxEnergy();if(k==='materials'){state.materials={ore:9999,essence:999,treats:999,dust:999}}if(k==='talents')state.talentPoints+=25;if(k==='chapters')state.unlockedChapter=4;if(k==='gear')gearSlots.forEach(slot=>dropGear(5,slot,true));if(k==='artifacts')artifactDefs.forEach(a=>state.artifacts[a.id]=Math.max(5,state.artifacts[a.id]||0));if(k==='offline')state.patrolLast=Date.now()-8*3600000;if(k==='level'){state.level=99;state.xp=0;state.talentPoints+=50}if(k==='win'){state.energy=maxEnergy();if(!state.run)startRun();if(state.run)completeRun()}if(k==='reset'){if(!confirm('Reset ALL Rogue Quest progress?'))return;try{localStorage.removeItem('rogueQuestSaveV2');localStorage.removeItem('rogueQuestSave')}catch(e){}state=defaultState();combat=null;sceneMode='board'}saveState();buildBoard();renderAll();toast('Developer action applied.')}));
