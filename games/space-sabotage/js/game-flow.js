/* Space Sabotage round flow and action resolution */
'use strict';
Object.assign(Game, {
init: function() {
            AudioSys.init();
            this.stateData = null; 
            
            document.getElementById('center-console').style.removeProperty('border-color');
            document.getElementById('center-console').style.removeProperty('box-shadow');
            document.querySelectorAll('.anchor-wrapper').forEach(aw => {
                aw.classList.remove('alien-origin', 'locked', 'active', 'benched');
            });

            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen ignored"));
            }

            let roles = ['ENGINEER', 'SECURITY', 'MEDIC', 'ALIEN'];
            roles.sort(() => Math.random() - 0.5);

            this.players = [
                { id: 0, role: roles[0], state: 'IDLE', action: null, anchorTouch: null, seenRole: false, abilityUsed: false, scanResult: null },
                { id: 1, role: roles[1], state: 'IDLE', action: null, anchorTouch: null, seenRole: false, abilityUsed: false, scanResult: null },
                { id: 2, role: roles[2], state: 'IDLE', action: null, anchorTouch: null, seenRole: false, abilityUsed: false, scanResult: null },
                { id: 3, role: roles[3], state: 'IDLE', action: null, anchorTouch: null, seenRole: false, abilityUsed: false, scanResult: null }
            ];
            
            this.crisesDeck.sort(() => Math.random() - 0.5);

            this.hull = 3;
            this.round = 1;
            this.captainId = Math.floor(Math.random() * 4);
            this.benchedId = null;
            this.silenceEnforced = false;
            
            this.setState('ROLES');
        },
advancePassTurn: function() {
            this.currentPlayerIndex++;
            if (this.state === 'ROLES') {
                if (this.currentPlayerIndex >= 4) {
                    this.checkAllLocked();
                } else {
                    this.updateCenterUI();
                }
            } else if (this.state === 'ACTION') {
                while(this.currentPlayerIndex === this.benchedId && this.currentPlayerIndex < 4) {
                    this.currentPlayerIndex++;
                }
                if (this.currentPlayerIndex >= 4) {
                    this.checkAllLocked();
                } else {
                    this.updateCenterUI();
                }
            }
        },
setState: function(newState) {
            this.state = newState;
            
            if (newState === 'ROLES' || newState === 'CAPTAIN' || newState === 'ACTION' || newState === 'RESULT') {
                this.players.forEach(p => {
                    p.state = 'IDLE';
                    p.action = null;
                    const aw = document.querySelector(`.anchor-wrapper[data-q="${p.id}"]`);
                    if(aw) {
                        aw.classList.remove('locked', 'active');
                        if (newState !== 'ACTION') aw.classList.remove('benched');
                    }
                    let m = document.getElementById(`menu-${p.id}`);
                    if(m) m.classList.remove('visible');
                });
            } else {
                this.players.forEach(p => {
                    const aw = document.querySelector(`.anchor-wrapper[data-q="${p.id}"]`);
                    if(aw) aw.classList.remove('active');
                    let m = document.getElementById(`menu-${p.id}`);
                    if(m) m.classList.remove('visible');
                });
            }

            if (newState === 'CAPTAIN') this.currentCrisis = this.crisesDeck[this.round - 1];
            if (newState === 'ROLES') this.currentPlayerIndex = 0;

            this.updateCenterUI();

            if (newState === 'ACTION') {
                if (this.gameMode === 'TABLETOP') {
                    this.timeLeft = 45;
                    this.startTimer(() => this.setState('PROCESSING'));
                    this.playHeartbeat();
                } else {
                    this.currentPlayerIndex = 0;
                    if (this.benchedId === 0) this.currentPlayerIndex = 1;
                    this.updateCenterUI();
                }
            } else if (newState === 'PROCESSING') {
                this.processActions();
                setTimeout(() => this.setState('RESULT'), 3000);
            }
        },
startTimer: function(callback) {
            document.getElementById('timer-text').innerHTML = this.timeLeft;
            clearInterval(this.timerInt);
            this.timerInt = setInterval(() => {
                this.timerPaused = this.players.some(p => p.state === 'ANCHORED');
                
                if (this.timerPaused) {
                    const tEl = document.getElementById('timer-text');
                    if(tEl) tEl.innerHTML = `<span class="text-xl text-gray-500 animate-pulse-fast">// PAUSED</span>`;
                    return; 
                }

                this.timeLeft--;
                const tEl = document.getElementById('timer-text');
                if(tEl) tEl.innerHTML = this.timeLeft;
                if(this.timeLeft <= 3 && this.timeLeft > 0) { AudioSys.playConfirm(); Haptics.tap(); }
                if (this.timeLeft <= 0) {
                    clearInterval(this.timerInt);
                    callback();
                }
            }, 1000);
        },
playHeartbeat: function() {
            if (this.state !== 'ACTION' || this.timeLeft <= 0) return;
            
            if (!this.timerPaused) {
                Haptics.tap();
                AudioSys.playThud(0.08);
            }
            
            let delay = 1000;
            if (this.timeLeft <= 15) delay = 500;
            if (this.timeLeft <= 5) delay = 250;
            
            clearTimeout(this.hbTimeout);
            this.hbTimeout = setTimeout(() => this.playHeartbeat(), delay);
        },
checkAllLocked: function() {
            if (this.state === 'ROLES') {
                if (this.players.every(p => p.seenRole && p.state === 'IDLE')) {
                    this.setState('CAPTAIN');
                }
            } else if (this.state === 'ACTION') {
                let activePlayers = this.players.filter(p => p.id !== this.benchedId);
                if (activePlayers.every(p => p.state === 'LOCKED')) {
                    clearInterval(this.timerInt);
                    this.setState('PROCESSING');
                }
            }
        },
processActions: function() {
            let sabs = this.players.filter(p => p.action === 'SABOTAGE').length;
            let overrides = this.players.filter(p => p.action === 'OVERRIDE').length;
            let heals = this.players.filter(p => p.action === 'HEAL').length;
            let scans = this.players.filter(p => p.action === 'SCAN').length;

            this.players.forEach(p => {
                if(p.action === 'OVERRIDE' || p.action === 'HEAL') p.abilityUsed = true;
            });

            this.roundSabs = sabs;
            this.roundOverrides = overrides;
            this.roundHeals = heals;

            if (scans > 0) {
                let sec = this.players.find(p => p.role === 'SECURITY');
                sec.scanResult = `BENCHED P${this.benchedId + 1} IS ${this.players[this.benchedId].role}`;
            }

            let netSabs = Math.max(0, sabs - overrides);
            this.silenceEnforced = false;
            
            let dmg = 0;
            if (netSabs > 0) {
                dmg = this.currentCrisis.dmg;
                if (this.currentCrisis.effect === 'Silence Enforced') this.silenceEnforced = true;
            }

            this.hull = Math.min(this.maxHull, this.hull - dmg + heals);
        }
});
