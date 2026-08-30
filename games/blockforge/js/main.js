/* Blockforge startup */
'use strict';
resize();ensureContracts();restoreWorldFromSave();applyOfflineEarnings(offlinePendingMs);checkAchievements();document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});updateUI(true);if(state.tutorialSeen)els.hint.style.opacity='.32';requestAnimationFrame(loop);
