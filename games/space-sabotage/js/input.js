/* Space Sabotage fingerprint UI and touch controls */
'use strict';
// Inject Fingerprint Icons
    document.querySelectorAll('.anchor-icon').forEach(icon => {
        icon.innerHTML = document.getElementById('fingerprint-template').innerHTML;
    });

    /**
     * MULTI-TOUCH INPUT MANAGER
     */
    document.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        for (let touch of e.changedTouches) {
            let target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!target) continue;

            if (target.closest('#btn-start-table')) {
                AudioSys.playConfirm(); Haptics.tap(); Game.gameMode = 'TABLETOP'; Game.init();
            }
            else if (target.closest('#btn-start-pass')) {
                AudioSys.playConfirm(); Haptics.tap(); Game.gameMode = 'PASS'; Game.init();
            }
            else if (target.closest('#btn-main-menu')) {
                AudioSys.playConfirm(); Haptics.tap(); 
                Game.setState('INIT');
            }
            else if (target.closest('.btn-bench-target') && Game.state === 'CAPTAIN') {
                let btn = target.closest('.btn-bench-target');
                AudioSys.playThud(); Haptics.tap();
                Game.benchedId = parseInt(btn.dataset.target);
                let quad = document.querySelector(`.anchor-wrapper:not(.pass-mode-anchor)[data-q="${Game.benchedId}"]`);
                if(quad) quad.classList.add('benched');
                Game.captainId = (Game.captainId + 1) % 4;
                Game.setState('ACTION');
            }
            else if (target.closest('#btn-continue')) {
                AudioSys.playConfirm(); Haptics.tap();
                if (Game.hull <= 0 || Game.round >= Game.maxRounds) {
                    Game.setState('GAMEOVER');
                } else {
                    Game.round++;
                    Game.setState('CAPTAIN');
                }
            }
            else if (target.closest('#btn-vote')) {
                AudioSys.playConfirm(); Haptics.tap(); Game.setState('VOTE');
            }
            else if (target.closest('#btn-cancel-vote')) {
                AudioSys.playConfirm(); Haptics.tap(); Game.setState('RESULT');
            }
            else if (target.closest('.btn-vote-target')) {
                let btn = target.closest('.btn-vote-target');
                let pId = parseInt(btn.dataset.target);
                AudioSys.playThud(); Haptics.thud();
                Game.stateData = { ejected: pId };
                Game.setState('GAMEOVER');
            }

            let aw = target.closest('.anchor-wrapper');
            if (aw) handleAnchorStart(aw, touch.identifier);
            
            let actBtn = target.closest('.action-btn');
            if (actBtn) handleActionTap(parseInt(actBtn.dataset.q), actBtn.dataset.act);
        }
    }, {passive: false});

    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            Game.players.forEach(p => { if (p.anchorTouch === touch.identifier) handleAnchorRelease(p.id); });
        }
    }, {passive: false});
    
    document.addEventListener('touchcancel', (e) => {
        for (let touch of e.changedTouches) {
            Game.players.forEach(p => { if (p.anchorTouch === touch.identifier) handleAnchorRelease(p.id); });
        }
    }, {passive: false});

    function handleAnchorStart(aw, touchId) {
        let qId = parseInt(aw.dataset.q);
        if (Game.state === 'ACTION' && qId === Game.benchedId) return; 
        if (Game.gameMode === 'PASS' && qId !== Game.currentPlayerIndex && Game.state !== 'RESULT') return;

        let p = Game.players[qId];
        if (p.state === 'LOCKED' && Game.state !== 'RESULT') return; 
        
        p.anchorTouch = touchId;
        p.state = 'ANCHORED';
        Haptics.tap(); AudioSys.playConfirm();
        
        aw.classList.add('active');

        let isPassMode = aw.classList.contains('pass-mode-anchor');
        let menuId = isPassMode ? 'pass-menu' : `menu-${qId}`;
        let menu = document.getElementById(menuId);
        
        if (Game.state === 'ROLES') {
            p.seenRole = true;
            let roleColor = 'var(--neon-blue)';
            if (p.role === 'ALIEN') roleColor = 'var(--neon-red)';
            if (p.role === 'ENGINEER') roleColor = 'var(--neon-orange)';
            if (p.role === 'MEDIC') roleColor = 'var(--neon-green)';
            if (p.role === 'SECURITY') roleColor = 'var(--neon-purple)';

            let roleDesc = "";
            if (p.role === 'ENGINEER') roleDesc = "OVERRIDE: Blocks 1 Sabotage (1 Use)";
            if (p.role === 'SECURITY') roleDesc = "SCAN: Check if benched is Alien";
            if (p.role === 'MEDIC') roleDesc = "HEAL: Restore 1 Hull (1 Use)";
            if (p.role === 'ALIEN') roleDesc = "SABOTAGE: Destroy the ship";

            menu.innerHTML = `
                <div class="role-text" style="color: ${roleColor};">${p.role}</div>
                <div class="text-[12px] text-gray-300 text-center px-4 leading-tight bg-black py-2 rounded">${roleDesc}</div>
            `;
            menu.classList.add('visible');
        } 
        else if (Game.state === 'ACTION') {
            let actionHtml = `<div class="action-btn" data-q="${qId}" data-act="REPAIR">REPAIR</div>`;
            
            if (p.role === 'ALIEN') {
                actionHtml += `<div class="action-btn text-red-400" data-q="${qId}" data-act="SABOTAGE">SABOTAGE</div>`;
            } else if (p.role === 'ENGINEER') {
                actionHtml += `<div class="action-btn text-orange-400" data-q="${qId}" data-act="${p.abilityUsed ? 'MAINTAIN' : 'OVERRIDE'}">${p.abilityUsed ? 'MAINTAIN' : 'OVERRIDE'}</div>`;
            } else if (p.role === 'MEDIC') {
                actionHtml += `<div class="action-btn text-green-400" data-q="${qId}" data-act="${p.abilityUsed ? 'MAINTAIN' : 'HEAL'}">${p.abilityUsed ? 'MAINTAIN' : 'HEAL'}</div>`;
            } else if (p.role === 'SECURITY') {
                actionHtml += `<div class="action-btn text-purple-400" data-q="${qId}" data-act="SCAN">SCAN BENCHED</div>`;
            }
            menu.innerHTML = actionHtml;
            menu.classList.add('visible');
        }
        else if (Game.state === 'RESULT') {
            if (p.role === 'SECURITY' && p.scanResult) {
                let isAlien = p.scanResult.includes('ALIEN');
                menu.innerHTML = `
                    <div class="text-[10px] text-gray-400 text-center mb-1 bg-black px-2 py-1 rounded">SCAN RESULT</div>
                    <div class="role-text ${isAlien ? 'text-red-500' : 'text-blue-400'} text-sm">${p.scanResult}</div>
                `;
            } else {
                let roleColor = 'var(--neon-blue)';
                if (p.role === 'ALIEN') roleColor = 'var(--neon-red)';
                menu.innerHTML = `<div class="role-text text-sm" style="color: ${roleColor};">ROLE: ${p.role}</div>`;
            }
            menu.classList.add('visible');
        }
    }

    function handleAnchorRelease(qId) {
        let p = Game.players[qId];
        p.anchorTouch = null;
        
        if (p.state !== 'LOCKED' || Game.state === 'RESULT') {
            p.state = 'IDLE';
            let aws = document.querySelectorAll(`.anchor-wrapper[data-q="${qId}"]`);
            aws.forEach(aw => aw.classList.remove('active'));
            
            let menu = document.getElementById(`menu-${qId}`);
            if (menu) menu.classList.remove('visible');
            let passMenu = document.getElementById('pass-menu');
            if (passMenu) passMenu.classList.remove('visible');
        }

        if (Game.state === 'ROLES') {
            if (Game.gameMode === 'PASS' && qId === Game.currentPlayerIndex && p.seenRole) {
                Game.advancePassTurn();
            } else if (Game.gameMode === 'TABLETOP') {
                Game.checkAllLocked();
            }
        }
    }

    function handleActionTap(qId, action) {
        if (Game.state !== 'ACTION') return;
        
        let p = Game.players[qId];
        if (p.state !== 'ANCHORED') return; 

        p.action = action;
        p.state = 'LOCKED';
        Haptics.thud(); AudioSys.playThud(0.5);

        let aw = document.querySelector(`.anchor-wrapper.active[data-q="${qId}"]`);
        if(aw) { aw.classList.remove('active'); aw.classList.add('locked'); }
        
        let isPassMode = aw && aw.classList.contains('pass-mode-anchor');
        let menuId = isPassMode ? 'pass-menu' : `menu-${qId}`;
        let menu = document.getElementById(menuId);
        if(menu) menu.classList.remove('visible');

        if (Game.gameMode === 'PASS') {
            Game.advancePassTurn();
        } else {
            Game.checkAllLocked();
        }
    }
