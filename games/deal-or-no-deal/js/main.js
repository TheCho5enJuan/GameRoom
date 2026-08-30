/* Deal or No Deal input bindings */
'use strict';
canvas.addEventListener('touchstart', e => { handleInput(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, {passive: false});
    canvas.addEventListener('mousedown', e => handleInput(e.clientX, e.clientY));
    window.addEventListener('resize', resize);
