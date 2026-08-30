/* Space Sabotage center console and health rendering */
'use strict';
Object.assign(Game, {
renderHealth: function() {
            let html = '<div class="flex mt-3 mb-4">';
            for(let i=0; i<this.maxHull; i++) {
                html += `<div class="health-pip ${i >= this.hull ? 'lost' : ''}"></div>`;
            }
            html += '</div>';
            return html;
        },
updateCenterUI: function() {
            // Manage Corner visibility to prevent accidental taps during Pass mode
            document.querySelectorAll('.quadrant').forEach(q => {
                if (this.gameMode === 'PASS' && !['RESULT', 'GAMEOVER', 'INIT'].includes(this.state)) {
                    q.style.display = 'none';
                } else {
                    q.style.display = 'flex';
                }
            });

            // Toggle Pass & Play persistent UI elements outside the center console
            let passUI = document.getElementById('pass-play-ui');
            if (this.gameMode === 'PASS' && ['ROLES', 'ACTION'].includes(this.state)) {
                passUI.style.display = 'block';
                document.getElementById('pass-anchor').dataset.q = this.currentPlayerIndex;
                document.getElementById('pass-player-label').innerText = `P${this.currentPlayerIndex + 1}`;
                
                // Reset pass anchor visual state
                document.getElementById('pass-anchor').classList.remove('active', 'locked', 'benched');
                document.getElementById('pass-menu').classList.remove('visible');
            } else {
                passUI.style.display = 'none';
            }

            const ui = document.getElementById('ui-content');
            ui.innerHTML = '';

            let silenceBanner = this.silenceEnforced ? `<div class="text-xs font-bold bg-red-600 text-white px-2 py-1 mb-2 animate-pulse rounded">STRICT SILENCE ENFORCED</div>` : '';

            switch(this.state) {
                case 'INIT':
                    ui.innerHTML = `
                        <h1 class="text-3xl neon-text mb-2 tracking-widest">SPACE<br>SABOTAGE</h1>
                        <p class="text-[10px] text-gray-400 mb-5 px-2 leading-relaxed">ALIEN: Destroy ship.<br>ENGINEER: Blocks Sabotage.<br>SECURITY: Scans Benched.<br>MEDIC: Restores Hull.</p>
                        <div class="flex flex-col gap-3 w-full px-4">
                            <button id="btn-start-table" class="btn-main text-[11px] py-3">TABLETOP MODE (FLAT)</button>
                            <button id="btn-start-pass" class="btn-main text-[11px] py-3">PASS & PLAY (1 PHONE)</button>
                        </div>
                    `;
                    break;
                case 'ROLES':
                    if (this.gameMode === 'TABLETOP') {
                        ui.innerHTML = `
                            <div class="text-lg neon-text mb-3 tracking-widest">SYSTEM BOOT</div>
                            <p class="text-sm text-gray-400 mb-4 px-4 leading-relaxed">Cup hand over corner.<br>Hold fingerprint to view your Role and Ability.</p>
                            <div class="text-xs text-gray-500 mt-6">(Waiting for 4 players...)</div>
                        `;
                    } else {
                        ui.innerHTML = `
                            <div class="text-2xl neon-text-blue mb-4 tracking-widest animate-pulse-fast">PASS TO P${this.currentPlayerIndex + 1}</div>
                            <p class="text-[11px] text-gray-400 px-4 leading-relaxed">P${this.currentPlayerIndex + 1}: Hold the thumb scanner at the bottom of the screen to view role.</p>
                        `;
                    }
                    break;
                case 'CAPTAIN':
                    ui.innerHTML = `
                        ${silenceBanner}
                        <div class="text-sm text-gray-400 tracking-widest">ROUND ${this.round} / ${this.maxRounds}</div>
                        ${this.renderHealth()}
                        <div class="text-xs text-orange-400 mb-2">CRISIS: ${this.currentCrisis.name} (DMG: ${this.currentCrisis.dmg})</div>
                        <div class="text-sm neon-text-blue mt-2 mb-3 tracking-widest">> P${this.captainId + 1} IS CAPTAIN <</div>
                        <div class="grid grid-cols-2 gap-3 w-full px-2">
                            <button class="btn-bench-target btn-main text-[10px]" data-target="0">BENCH P1</button>
                            <button class="btn-bench-target btn-main text-[10px]" data-target="1">BENCH P2</button>
                            <button class="btn-bench-target btn-main text-[10px]" data-target="2">BENCH P3</button>
                            <button class="btn-bench-target btn-main text-[10px]" data-target="3">BENCH P4</button>
                        </div>
                    `;
                    break;
                case 'ACTION':
                    if (this.gameMode === 'TABLETOP') {
                        ui.innerHTML = `
                            ${silenceBanner}
                            <div class="text-sm neon-text mb-3 tracking-widest">CRISIS: ${this.currentCrisis.name}</div>
                            <div id="timer-text" class="text-5xl neon-text mb-4 min-h-[60px] flex items-center justify-center">45</div>
                            <p class="text-[10px] text-gray-400 px-4 leading-relaxed">Active players: Input actions.<br>Hold scanner to pause timer.</p>
                        `;
                    } else {
                        ui.innerHTML = `
                            ${silenceBanner}
                            <div class="text-xs text-gray-400 mb-2 tracking-widest">CRISIS: ${this.currentCrisis.name}</div>
                            <div class="text-2xl neon-text-blue mb-4 tracking-widest animate-pulse-fast">PASS TO P${this.currentPlayerIndex + 1}</div>
                            <p class="text-[11px] text-gray-400 px-4 leading-relaxed">P${this.currentPlayerIndex + 1}: Hold scanner at bottom of screen. Tap menu at top to input.</p>
                        `;
                    }
                    break;
                case 'PROCESSING':
                    ui.innerHTML = `
                        <div class="text-xl neon-text mb-3 glitch-anim tracking-widest">PROCESSING...</div>
                        <p class="text-sm text-gray-400">Compiling multi-touch inputs</p>
                    `;
                    break;
                case 'RESULT':
                    let resHtml = `<div class="text-xs text-gray-400 mb-3 tracking-widest">CRISIS: ${this.currentCrisis.name}</div>`;
                    
                    if (this.roundSabs > 0) {
                        resHtml += `<div class="text-xl neon-text-red glitch-anim tracking-widest">SABOTAGE DETECTED</div>`;
                        if (this.roundOverrides > 0) {
                             resHtml += `<div class="text-xs text-orange-400 my-2 bg-orange-900/30 px-2 py-1 rounded">ENGINEER DEPLOYED OVERRIDE:<br>1 SABOTAGE BLOCKED</div>`;
                        }
                    } else {
                        resHtml += `<div class="text-xl text-green-400 tracking-widest">SYSTEMS SECURE</div>`;
                    }
                    
                    let netSabs = Math.max(0, this.roundSabs - this.roundOverrides);
                    if (netSabs > 0) {
                        resHtml += `<div class="text-sm font-bold text-red-500 my-2">HULL TOOK ${this.currentCrisis.dmg} DAMAGE</div>`;
                        Haptics.alarm(); AudioSys.playAlarm();
                    } else {
                        AudioSys.playSuccess();
                    }

                    if (this.roundHeals > 0) {
                        resHtml += `<div class="text-xs text-green-300 my-2 bg-green-900/30 px-2 py-1 rounded">MEDIC DEPLOYED HEAL:<br>RESTORED 1 HULL</div>`;
                    }
                    
                    resHtml += this.renderHealth();

                    if (this.hull <= 0 || this.round >= this.maxRounds) {
                        resHtml += `<button id="btn-continue" class="btn-main mt-4 px-6 py-3">VIEW FATE</button>`;
                    } else {
                        resHtml += `
                            <p class="text-[10px] text-gray-500 mb-2">Security: Hold scanner to view scan results.</p>
                            <div class="flex flex-col gap-3 w-full px-4 mt-1">
                                <button id="btn-continue" class="btn-main text-xs">NEXT ROUND</button>
                                <button id="btn-vote" class="btn-main btn-danger text-xs">EMERGENCY VOTE</button>
                            </div>
                        `;
                    }
                    ui.innerHTML = resHtml;
                    break;
                case 'VOTE':
                    ui.innerHTML = `
                        <div class="text-base neon-text-red mb-3 tracking-widest">EMERGENCY EJECTION</div>
                        <p class="text-[10px] text-gray-400 px-2 mb-4 leading-relaxed">Discuss. Tap to permanently eject a player. Ejecting an innocent gives the Alien an instant win.</p>
                        <div class="grid grid-cols-2 gap-3 w-full px-2">
                            <button class="btn-vote-target btn-main text-xs" data-target="0">EJECT P1</button>
                            <button class="btn-vote-target btn-main text-xs" data-target="1">EJECT P2</button>
                            <button class="btn-vote-target btn-main text-xs" data-target="2">EJECT P3</button>
                            <button class="btn-vote-target btn-main text-xs" data-target="3">EJECT P4</button>
                        </div>
                        <button id="btn-cancel-vote" class="btn-main text-xs mt-3 border-gray-500 text-gray-500 w-1/2">CANCEL</button>
                    `;
                    break;
                case 'GAMEOVER':
                    let won = false;
                    let msg = "";
                    let subMsg = "";

                    if (this.hull <= 0) {
                        msg = "SHIP DESTROYED"; subMsg = "Hull reached 0%. ALIEN WINS.";
                    } else if (this.stateData && this.stateData.ejected !== undefined) {
                        let targetId = this.stateData.ejected;
                        if (this.players[targetId].role === 'ALIEN') {
                            msg = "ALIEN EJECTED"; subMsg = "Threat neutralized. CREW SURVIVES."; won = true;
                        } else {
                            msg = "INNOCENT EJECTED"; subMsg = "The Crew turns on itself. ALIEN WINS.";
                        }
                    } else if (this.round >= this.maxRounds) {
                        msg = "DESTINATION REACHED"; subMsg = "The ship survived 5 rounds. CREW SURVIVES."; won = true;
                    }

                    let alienIndex = this.players.find(p=>p.role === 'ALIEN').id;
                    
                    if (!won) {
                        document.getElementById('center-console').style.borderColor = 'var(--neon-red)';
                        document.getElementById('center-console').style.boxShadow = '0 0 40px rgba(255,0,60,0.4), inset 0 0 30px rgba(255,0,60,0.4)';
                        let alienQuad = document.querySelector(`.anchor-wrapper:not(.pass-mode-anchor)[data-q="${alienIndex}"]`);
                        if(alienQuad) alienQuad.classList.add('alien-origin');
                        
                        let glitchInt = setInterval(() => { Haptics.tap(); }, 150);
                        setTimeout(() => clearInterval(glitchInt), 1500);
                        AudioSys.playAlarm(); setTimeout(() => AudioSys.playAlarm(), 300);

                        ui.innerHTML = `
                            <div class="text-4xl severe-glitch mb-3 tracking-widest font-bold">SYSTEM<br>CORRUPTED</div>
                            <div class="text-sm text-white mb-3 tracking-widest bg-red-600 px-3 py-1 font-bold rounded">${msg}</div>
                            <p class="text-xs text-gray-300 mb-6 text-center leading-relaxed severe-glitch">${subMsg}</p>
                            <p class="text-sm text-red-400 mb-6 font-bold tracking-widest bg-black px-2 animate-pulse-fast">INFECTION ORIGIN: P${alienIndex + 1}</p>
                            <button id="btn-main-menu" class="btn-main btn-danger px-6 py-3 border-red-500 text-red-500 bg-red-900/20">MAIN MENU</button>
                        `;
                    } else {
                        document.getElementById('center-console').style.borderColor = 'var(--neon-green)';
                        document.getElementById('center-console').style.boxShadow = '0 0 40px rgba(0,255,102,0.3), inset 0 0 30px rgba(0,255,102,0.3)';
                        AudioSys.playSuccess(); setTimeout(() => AudioSys.playSuccess(), 400); setTimeout(() => AudioSys.playConfirm(), 800);

                        ui.innerHTML = `
                            <div class="text-3xl celebrate mb-3 tracking-widest font-bold">THREAT<br>ELIMINATED</div>
                            <div class="text-sm text-black mb-3 tracking-widest bg-green-400 px-3 py-1 font-bold rounded">${msg}</div>
                            <p class="text-xs text-gray-300 mb-5 text-center leading-relaxed">${subMsg}</p>
                            <p class="text-xs text-green-400/70 mb-6 tracking-widest">Alien was Player ${alienIndex + 1}</p>
                            <button id="btn-main-menu" class="btn-main px-6 py-3" style="border-color: var(--neon-green); color: var(--neon-green);">MAIN MENU</button>
                        `;
                    }

                    // Reveal everyone's true role automatically at the end of the game
                    this.players.forEach(p => {
                        p.state = 'LOCKED';
                        let menu = document.getElementById(`menu-${p.id}`);
                        if(!menu) return;

                        let roleColor = 'var(--neon-blue)';
                        if (p.role === 'ALIEN') roleColor = 'var(--neon-red)';
                        if (p.role === 'ENGINEER') roleColor = 'var(--neon-orange)';
                        if (p.role === 'MEDIC') roleColor = 'var(--neon-green)';
                        if (p.role === 'SECURITY') roleColor = 'var(--neon-purple)';

                        menu.innerHTML = `<div class="role-text text-sm" style="color: ${roleColor};">ROLE:<br>${p.role}</div>`;
                        menu.classList.add('visible');
                        let quad = document.querySelector(`.anchor-wrapper:not(.pass-mode-anchor)[data-q="${p.id}"]`);
                        if(quad) quad.classList.add('locked');
                    });

                    break;
            }
        }
});
