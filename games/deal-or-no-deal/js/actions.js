/* Deal or No Deal case selection, banker actions, and results */
'use strict';
function handleInput(clientX, clientY) {
        if (state.phase === 'BANKER') return;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left; const y = clientY - rect.top;
        state.cases.forEach(c => {
            if (c.contains(x, y)) {
                if (c.open) return;
                if (state.phase === 'SELECT') {
                    c.isPlayer = true; state.playerCase = c; state.phase = 'PLAY';
                    audio.playFX(440);
                } else if (state.phase === 'PLAY' && !c.isPlayer) {
                    c.open = true; const b = state.board.find(it => it.v === c.val); b.out = true;
                    state.openedInRound++; audio.playFX(c.val >= 10000 ? 110 : 880, c.val >= 10000 ? 'sawtooth' : 'sine');
                    if(c.val >= 100000) state.shake = 15;
                    if (state.openedInRound >= ROUNDS[state.round]) {
                        state.phase = 'BANKER'; setTimeout(() => {
                            const rem = state.board.filter(b => !b.out);
                            const ev = rem.reduce((a,b)=>a+b.v,0)/rem.length;
                            state.activeOffer = Math.floor(ev * (0.2 + (state.round*0.12)));
                            document.getElementById('offer-display').innerText = format(state.activeOffer);
                            document.getElementById('banker-quote').innerText = "Take the money. Don't be a fool.";
                            document.getElementById('banker-modal').style.display = 'block';
                        }, 1100);
                    }
                }
            }
        });
    }

    function handleAction(type) {
        document.getElementById('banker-modal').style.display = 'none';
        if (type === 'DEAL') endGame(state.activeOffer, `Deal accepted for <b>${format(state.activeOffer)}</b>!`);
        else {
            state.round++; state.openedInRound = 0; state.phase = 'PLAY';
            const remCount = state.board.filter(b => !b.out).length;
            if (remCount === 2) {
                const win = state.playerCase.val;
                endGame(win, `Final Case win: <b>${format(win)}</b>!`);
            }
        }
    }

    function endGame(win, msg) {
        const xp = saveCareer(win);
        document.getElementById('res-body').innerHTML = `${msg}<br><br>Your podium case #${state.playerCase.id} had ${format(state.playerCase.val)}`;
        document.getElementById('xp-gain-text').innerText = `+${xp.toLocaleString()} XP EARNED`;
        document.getElementById('results-overlay').style.display = 'flex';
        updateProgUI();
    }

    function triggerCounter() {
        const val = parseInt(prompt("Name your price:")?.replace(/[^0-9]/g, ''));
        if (val && val < state.activeOffer * 1.1) handleAction('DEAL');
        else { alert("THE BANKER REJECTS!"); handleAction('NO_DEAL'); }
    }
