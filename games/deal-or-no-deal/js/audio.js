/* Deal or No Deal audio engine */
'use strict';
// --- Audio Engine ---
    class AudioSystem {
        constructor() { this.ctx = null; this.master = null; }
        init() {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
                this.master.gain.value = 0.35;
                this.playDrone();
                this.heartbeat();
            } catch(e) {}
        }
        playDrone() {
            const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
            o.type = 'triangle'; o.frequency.value = 55; g.gain.value = 0.05;
            o.connect(g); g.connect(this.master); o.start();
        }
        heartbeat() {
            if (!this.ctx) return;
            const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
            o.frequency.setValueAtTime(60, this.ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);
            g.gain.setValueAtTime(0.12, this.ctx.currentTime);
            g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.12);
            o.connect(g); g.connect(this.master); o.start(); o.stop(this.ctx.currentTime + 0.12);
            
            const tempo = state ? 1200 - (state.round * 110) : 1200;
            setTimeout(() => this.heartbeat(), Math.max(tempo, 400));
        }
        playFX(f, t='sine') {
            if(!this.ctx) return;
            const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
            o.type = t; o.frequency.setValueAtTime(f, this.ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(f/2, this.ctx.currentTime + 0.5);
            g.gain.setValueAtTime(0.2, this.ctx.currentTime);
            g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
            o.connect(g); g.connect(this.master); o.start(); o.stop(this.ctx.currentTime + 0.5);
        }
    }
