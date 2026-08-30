/* Deal or No Deal game start and rendering */
'use strict';
function startGame() {
        document.getElementById('start-overlay').style.display = 'none';
        audio.init(); loadCareer();
        state.board = VALUES.map(v => ({ v, out: false }));
        let shuffled = [...VALUES].sort(() => Math.random() - 0.5);
        for(let i=0; i<26; i++) state.cases.push(new Case(i+1, shuffled[i]));
        state.phase = 'SELECT';
        resize();
        window.requestAnimationFrame(loop);
    }

    function loop() {
        if(state.phase === 'LOBBY') return;
        const w = window.innerWidth; const h = window.innerHeight;
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        
        if (state.shake > 0) {
            ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake);
            state.shake *= 0.92; if(state.shake < 0.1) state.shake = 0;
        }

        const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, h);
        bg.addColorStop(0, '#1e293b'); bg.addColorStop(1, '#020617');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        drawValueBoard(w, h);
        state.cases.forEach(c => c.draw());
        if(state.playerCase) drawPodium(w, h);
        
        // DRAW INSTRUCTIONS - Pushed down to clear the 60px header
        ctx.save(); ctx.beginPath();
        ctx.textAlign = 'center'; ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 20px sans-serif';
        let txt = "";
        if(state.phase === 'SELECT') txt = "CHOOSE YOUR LUCKY CASE";
        else if(state.phase === 'PLAY') {
            const rem = ROUNDS[state.round] - state.openedInRound;
            txt = `OPEN ${rem} MORE ${rem === 1 ? 'CASE' : 'CASES'}`;
        } else if(state.phase === 'BANKER') txt = "INCOMING BANKER CALL...";
        ctx.fillText(txt, w/2, 90); ctx.restore();

        window.requestAnimationFrame(loop);
    }

    function drawValueBoard(w, h) {
        const { boardY, boardH } = state.layout;
        const itemH = boardH / 13; const colW = (w/2) - 15;
        for(let i=0; i<26; i++) {
            const it = state.board[i]; const isR = i >= 13;
            const x = isR ? w/2 + 5 : 10; const y = boardY + (i % 13) * itemH;
            ctx.save(); ctx.beginPath();
            ctx.globalAlpha = it.out ? 0.08 : 1;
            ctx.fillStyle = isR ? '#7f1d1d' : '#1e3a8a';
            ctx.roundRect(x, y, colW, itemH-3, 6); ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = `bold ${itemH*0.75}px monospace`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(format(it.v), x + colW/2, y + itemH/2);
            ctx.restore();
        }
    }

    function drawPodium(w, h) {
        const y = state.layout.podiumY;
        ctx.save(); ctx.beginPath();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.roundRect(w/2 - 75, y, 150, 75, 18); ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
        ctx.roundRect(w/2 - 75, y, 150, 75, 18); ctx.stroke();
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText("PODIUM CASE", w/2, y + 22);
        ctx.font = 'bold 40px sans-serif'; ctx.fillText(state.playerCase.id, w/2, y + 58);
        ctx.restore();
    }

    function format(v) { return v < 1 ? '$' + v.toFixed(2) : '$' + v.toLocaleString(); }
