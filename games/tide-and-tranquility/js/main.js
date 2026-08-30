/* Tide initialization and runtime startup */
'use strict';
ensureV10State();

ensureAquaStudioState();
ensureDockBuilderState();
bindExperienceSettings();applyPreferences();syncViewportVars();
window.addEventListener('error',event=>{console.error(event.error||event.message);showSystemNotice('Recovered from an unexpected display issue.')});
window.addEventListener('unhandledrejection',event=>{console.error(event.reason);showSystemNotice('Recovered from an unexpected display issue.')});
if(window.visualViewport){visualViewport.addEventListener('resize',scheduleLayout);visualViewport.addEventListener('scroll',scheduleLayout)}
if(window.ResizeObserver){new ResizeObserver(scheduleLayout).observe($('#app'))}

initWorldMap();
initDockBuilder();
initCaptainLog();
setupCanvasResolution();
window.addEventListener('resize',()=>{scheduleLayout();setupCanvasResolution()});window.addEventListener('orientationchange',()=>{scheduleLayout();setupCanvasResolution()});
updateWeather(true);oceanCondition();for(let i=0;i<14;i++)spawnFish();resetHook();renderAll();renderCaptainLog();renderOceanHud(true);requestAnimationFrame(frame);
setInterval(()=>{renderTop();renderStatus();renderHatchery()},1200);
