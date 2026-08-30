/* Blockforge pet experience and feeding */
'use strict';
function petXpNeeded(level){return Math.floor(18*Math.pow(level,1.28));}
function addPetXp(amount){const d=petData();d.xp+=amount;let need=petXpNeeded(d.level);while(d.xp>=need){d.xp-=need;d.level++;d.mood='Proud';toast(`${pet().name} reached level ${d.level}!`);petSay('happy');need=petXpNeeded(d.level);}checkAchievements();}
function feedPet(){if(state.treats<=0){toast('Find pet treats in treasure chests');return;}state.treats--;const d=petData();d.affection=clamp(d.affection+8,0,100);d.fed++;d.mood=d.affection>70?'Adoring':'Happy';addPetXp(3);petSay('happy');sfx('coin');saveState(true);renderPets();updateUI();}
