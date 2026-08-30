/* Deal or No Deal game state, layout, and cases */
'use strict';
// --- Core Renderer ---
    const audio = new AudioSystem();
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const VALUES = [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000];
    const ROUNDS = [6, 5, 4, 3, 2, 1, 1, 1, 1];

    let state = {
        phase: 'LOBBY', cases: [], board: [], playerCase: null,
        round: 0, openedInRound: 0, activeOffer: 0, dpr: 1, shake: 0
    };

    function resize() {
        state.dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * state.dpr;
        canvas.height = window.innerHeight * state.dpr;
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        const w = window.innerWidth; const h = window.innerHeight;
        
        // Pushing everything down to clear the 60px header
        const boardY = 100; // Increased to clear header and instruction text
        const boardH = h * 0.20;
        const gridY = boardY + boardH + 20; 
        const gridH = h * 0.44;
        const podiumY = gridY + gridH + 12;

        const cols = 4; const rows = 7;
        const cellW = (w * 0.94) / cols; const cellH = gridH / rows;
        
        state.cases.forEach((c, i) => {
            c.w = cellW * 0.88; c.h = cellH * 0.84;
            c.x = (w * 0.03) + (i % cols * cellW) + (cellW / 2);
            c.y = gridY + (Math.floor(i / cols) * cellH) + (cellH / 2);
        });
        
        state.layout = { boardY, boardH, gridY, gridH, podiumY };
    }

    class Case {
        constructor(id, val) { this.id = id; this.val = val; this.open = false; this.isPlayer = false; }
        draw() {
            ctx.save(); ctx.beginPath(); ctx.translate(this.x, this.y);
            if (this.open) {
                ctx.globalAlpha = 0.12; ctx.strokeStyle = 'white'; ctx.setLineDash([4, 4]);
                ctx.strokeRect(-this.w/2, -this.h/2, this.w, this.h);
                ctx.restore(); return;
            }
            const g = ctx.createLinearGradient(-this.w/2, -this.h/2, this.w/2, this.h/2);
            g.addColorStop(0, this.isPlayer ? '#fbbf24' : '#cbd5e1');
            g.addColorStop(1, this.isPlayer ? '#b45309' : '#334155');
            ctx.fillStyle = g; ctx.shadowBlur = this.isPlayer ? 15 : 6; ctx.shadowColor = 'black';
            ctx.roundRect(-this.w/2, -this.h/2, this.w, this.h, 12); ctx.fill();
            ctx.fillStyle = this.isPlayer ? '#451a03' : '#0f172a';
            ctx.font = `bold ${this.h * 0.5}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(this.id, 0, 0); ctx.restore();
        }
        contains(mx, my) {
            return mx > this.x - this.w/2 && mx < this.x + this.w/2 && my > this.y - this.h/2 && my < this.y + this.h/2;
        }
    }
