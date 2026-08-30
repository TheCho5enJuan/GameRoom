/* Space Sabotage audio and haptics */
'use strict';
const AudioSys = {
        ctx: null,
        init: function() {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
        },
        beep: function(freq, type, duration, vol = 0.1) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        },
        playThud: (vol=0.5) => AudioSys.beep(90, 'sine', 0.4, vol),
        playConfirm: () => AudioSys.beep(800, 'square', 0.1, 0.05),
        playAlarm: () => AudioSys.beep(300, 'sawtooth', 0.3, 0.2),
        playSuccess: () => { AudioSys.beep(400, 'square', 0.1, 0.05); setTimeout(() => AudioSys.beep(600, 'square', 0.2, 0.05), 100); }
    };

    const Haptics = {
        tap: () => { if(navigator.vibrate) navigator.vibrate(15); },
        thud: () => { if(navigator.vibrate) navigator.vibrate(40); },
        alarm: () => { if(navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]); }
    };
