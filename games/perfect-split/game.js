(() => {
  'use strict';

  const WIN_SCORE = 3;
  const CANVAS_SIZE = 560;
  const MIN_PLAYERS = 1;
  const MAX_PLAYERS = 10;
  const STORAGE_KEY = 'perfectSplitV1';
  const SOLO = {
    easy: { label: 'Easy', tolerance: 5 },
    normal: { label: 'Normal', tolerance: 2 },
    hard: { label: 'Hard', tolerance: 0.5 },
  };
  const EMOJIS = {
    easy: ['😀','😎','😺','🐼','🦋','🍎','⚽','🎃','🍉','🌕','❤️','🟣'],
    medium: ['🍕','🐟','🚀','🍦','🌵','🦆','🍓','🥑','🎈','🐝','🛸','🍄'],
    hard: ['🦒','🐙','🦩','🎸','🗝️','🦖','🦀','🦐','🛵','🦚','🪿','🦞'],
  };
  const AVATARS = ['🙂','😎','🤖','👾','🐱','🐶','🦊','🐸','🐵','🦁','🐯','🐼','🐧','🦄','👻','🔥','⚡','🎯','✂️','⚖️'];
  const ALL_EMOJIS = Object.entries(EMOJIS).flatMap(([difficulty, list]) => list.map(emoji => ({ emoji, difficulty })));

  const el = {
    setupScreen: document.getElementById('setupScreen'), gameScreen: document.getElementById('gameScreen'), revealScreen: document.getElementById('revealScreen'),
    newGameButton: document.getElementById('newGameButton'), minusPlayer: document.getElementById('minusPlayer'), plusPlayer: document.getElementById('plusPlayer'), playerCount: document.getElementById('playerCount'),
    soloDifficultyWrap: document.getElementById('soloDifficultyWrap'), soloDifficulty: document.getElementById('soloDifficulty'), emojiMode: document.getElementById('emojiMode'), shapeDifficulty: document.getElementById('shapeDifficulty'), shapeDifficultyRow: document.getElementById('shapeDifficultyRow'), pickRow: document.getElementById('pickRow'), emojiPicker: document.getElementById('emojiPicker'),
    soundToggle: document.getElementById('soundToggle'), vibrationToggle: document.getElementById('vibrationToggle'), playerRows: document.getElementById('playerRows'), beginButton: document.getElementById('beginButton'),
    roundNumber: document.getElementById('roundNumber'), turnStat: document.getElementById('turnStat'), scoreboard: document.getElementById('scoreboard'), turnAvatar: document.getElementById('turnAvatar'), turnName: document.getElementById('turnName'), turnSuffix: document.getElementById('turnSuffix'), shapeBadge: document.getElementById('shapeBadge'), targetEmojiLabel: document.getElementById('targetEmojiLabel'),
    canvasShell: document.getElementById('canvasShell'), sliceCanvas: document.getElementById('sliceCanvas'), sliceHint: document.getElementById('sliceHint'), sliceMessage: document.getElementById('sliceMessage'), nextButton: document.getElementById('nextButton'),
    revealKicker: document.getElementById('revealKicker'), revealTitle: document.getElementById('revealTitle'), revealPlayer: document.getElementById('revealPlayer'), leftPercent: document.getElementById('leftPercent'), rightPercent: document.getElementById('rightPercent'), balanceError: document.getElementById('balanceError'), scale: document.getElementById('scale'), leftPiece: document.getElementById('leftPiece'), rightPiece: document.getElementById('rightPiece'), accuracyLine: document.getElementById('accuracyLine'), ranking: document.getElementById('ranking'), revealButton: document.getElementById('revealButton'),
  };

  const ctx = el.sliceCanvas.getContext('2d', { willReadFrequently: true });
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = sourceCanvas.height = CANVAS_SIZE;
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });

  const draftPlayers = Array.from({ length: MAX_PLAYERS }, (_, index) => ({ name: `Player ${index + 1}`, avatar: AVATARS[index % AVATARS.length] }));
  let setupPlayerCount = 2;
  let soloDifficulty = 'normal';
  let emojiMode = 'random';
  let shapeDifficulty = 'mix';
  let pickedEmoji = '🍉';
  let soundEnabled = true;
  let vibrationEnabled = true;
  let players = [];
  let round = 1;
  let currentEmoji = '🍉';
  let currentShapeDifficulty = 'easy';
  let turnOrder = [];
  let turnPosition = 0;
  let currentPlayerIndex = 0;
  let attempts = [];
  let phase = 'setup';
  let drawing = false;
  let cutPoints = [];
  let revealIndex = 0;
  let roundWinners = [];
  let champions = [];
  let audioContext = null;
  let sliceOscillator = null;
  let sliceGain = null;
  let lastPointer = null;

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function formatPct(value) { return `${value.toFixed(3)}%`; }
  function escapeHtml(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved) return;
      setupPlayerCount = clamp(Number(saved.playerCount) || 2, MIN_PLAYERS, MAX_PLAYERS);
      soloDifficulty = SOLO[saved.soloDifficulty] ? saved.soloDifficulty : 'normal';
      emojiMode = saved.emojiMode === 'pick' ? 'pick' : 'random';
      shapeDifficulty = ['mix','easy','medium','hard'].includes(saved.shapeDifficulty) ? saved.shapeDifficulty : 'mix';
      pickedEmoji = ALL_EMOJIS.some(item => item.emoji === saved.pickedEmoji) ? saved.pickedEmoji : '🍉';
      soundEnabled = saved.soundEnabled !== false;
      vibrationEnabled = saved.vibrationEnabled !== false;
      if (Array.isArray(saved.players)) saved.players.slice(0, MAX_PLAYERS).forEach((player, index) => {
        if (!player) return;
        draftPlayers[index].name = String(player.name || draftPlayers[index].name).slice(0, 18);
        if (AVATARS.includes(player.avatar)) draftPlayers[index].avatar = player.avatar;
      });
    } catch (_) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ playerCount: setupPlayerCount, soloDifficulty, emojiMode, shapeDifficulty, pickedEmoji, soundEnabled, vibrationEnabled, players: draftPlayers }));
    } catch (_) {}
  }

  function ensureAudio() {
    if (!soundEnabled) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }

  function tone(frequency, duration = 0.06, volume = 0.025, delay = 0, type = 'sine') {
    const audio = ensureAudio();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playCue(name) {
    if (name === 'snap') { tone(760,.035,.02,0,'square'); tone(1120,.045,.018,.035,'square'); }
    else if (name === 'scale') { tone(240,.08,.018); tone(210,.08,.016,.11); tone(180,.11,.018,.22); }
    else if (name === 'point') { tone(650,.07,.023); tone(900,.09,.023,.07); }
    else if (name === 'perfect') { tone(760,.06,.025); tone(980,.07,.025,.06); tone(1260,.12,.025,.13); }
    else if (name === 'win') { tone(560,.07,.027); tone(760,.07,.027,.07); tone(980,.08,.027,.14); tone(1280,.16,.027,.22); }
    else if (name === 'bad') { tone(180,.09,.02); tone(125,.11,.02,.07); }
  }

  function vibrate(pattern) { if (vibrationEnabled && navigator.vibrate) navigator.vibrate(pattern); }

  function startSliceSound() {
    const audio = ensureAudio();
    if (!audio || sliceOscillator) return;
    sliceOscillator = audio.createOscillator();
    sliceGain = audio.createGain();
    sliceOscillator.type = 'sawtooth';
    sliceOscillator.frequency.setValueAtTime(95, audio.currentTime);
    sliceGain.gain.setValueAtTime(0.0001, audio.currentTime);
    sliceGain.gain.exponentialRampToValueAtTime(0.012, audio.currentTime + 0.02);
    sliceOscillator.connect(sliceGain);
    sliceGain.connect(audio.destination);
    sliceOscillator.start();
  }

  function updateSliceSound(speed) {
    if (!sliceOscillator || !audioContext) return;
    sliceOscillator.frequency.setTargetAtTime(clamp(85 + speed * 1.4, 85, 240), audioContext.currentTime, 0.025);
  }

  function stopSliceSound() {
    if (!sliceOscillator || !audioContext) return;
    try {
      sliceGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.015);
      sliceOscillator.stop(audioContext.currentTime + 0.06);
    } catch (_) {}
    sliceOscillator = null;
    sliceGain = null;
  }

  function populateEmojiPicker() {
    el.emojiPicker.innerHTML = '';
    ALL_EMOJIS.forEach(item => {
      const option = document.createElement('option');
      option.value = item.emoji;
      option.textContent = `${item.emoji} · ${item.difficulty}`;
      option.selected = item.emoji === pickedEmoji;
      el.emojiPicker.appendChild(option);
    });
  }

  function renderPlayers() {
    el.playerRows.innerHTML = '';
    for (let index = 0; index < setupPlayerCount; index += 1) {
      const row = document.createElement('div');
      row.className = 'player-row';
      const avatar = document.createElement('select');
      avatar.setAttribute('aria-label', `Player ${index + 1} avatar`);
      AVATARS.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        option.selected = draftPlayers[index].avatar === value;
        avatar.appendChild(option);
      });
      avatar.addEventListener('change', () => { draftPlayers[index].avatar = avatar.value; saveSettings(); });
      const name = document.createElement('input');
      name.type = 'text';
      name.maxLength = 18;
      name.value = draftPlayers[index].name;
      name.placeholder = `Player ${index + 1}`;
      name.setAttribute('aria-label', `Player ${index + 1} name`);
      name.addEventListener('input', () => { draftPlayers[index].name = name.value; saveSettings(); });
      row.append(avatar, name);
      el.playerRows.appendChild(row);
    }
  }

  function updateToggle(button, enabled) {
    button.classList.toggle('selected', enabled);
    button.setAttribute('aria-pressed', String(enabled));
    const small = button.querySelector('small');
    if (small) small.textContent = enabled ? 'On' : 'Off';
  }

  function renderSetup() {
    el.playerCount.textContent = String(setupPlayerCount);
    el.minusPlayer.disabled = setupPlayerCount <= MIN_PLAYERS;
    el.plusPlayer.disabled = setupPlayerCount >= MAX_PLAYERS;
    el.soloDifficultyWrap.hidden = setupPlayerCount !== 1;
    el.soloDifficulty.querySelectorAll('[data-solo]').forEach(button => button.classList.toggle('selected', button.dataset.solo === soloDifficulty));
    el.emojiMode.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('selected', button.dataset.mode === emojiMode));
    el.pickRow.hidden = emojiMode !== 'pick';
    el.shapeDifficultyRow.hidden = emojiMode === 'pick';
    el.shapeDifficulty.value = shapeDifficulty;
    el.emojiPicker.value = pickedEmoji;
    updateToggle(el.soundToggle, soundEnabled);
    updateToggle(el.vibrationToggle, vibrationEnabled);
    renderPlayers();
  }

  function normalizedPlayer(index) {
    const source = draftPlayers[index];
    return { name: source.name.trim() || `Player ${index + 1}`, avatar: source.avatar, score: 0 };
  }

  function chooseEmoji() {
    if (emojiMode === 'pick') {
      const found = ALL_EMOJIS.find(item => item.emoji === pickedEmoji) || ALL_EMOJIS[0];
      return found;
    }
    let pool;
    if (shapeDifficulty === 'mix') pool = ALL_EMOJIS;
    else pool = EMOJIS[shapeDifficulty].map(emoji => ({ emoji, difficulty: shapeDifficulty }));
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (round > 1 && pool.length > 1 && pick.emoji === currentEmoji) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    return pick;
  }

  function buildTurnOrder() {
    if (players.length === 1) { turnOrder = [0]; return; }
    const start = (round - 1) % players.length;
    turnOrder = Array.from({ length: players.length }, (_, offset) => (start + offset) % players.length);
  }

  function syncTurn() {
    currentPlayerIndex = turnOrder[turnPosition] ?? 0;
    el.turnStat.textContent = `TURN ${turnPosition + 1}/${players.length}`;
    const player = players[currentPlayerIndex];
    el.turnAvatar.textContent = player.avatar;
    el.turnName.textContent = player.name;
    el.turnSuffix.textContent = 'is slicing';
  }

  function renderScoreboard() {
    el.scoreboard.innerHTML = players.map((player, index) => {
      const active = phase !== 'game-over' && index === currentPlayerIndex ? ' active' : '';
      const pips = Array.from({ length: WIN_SCORE }, (_, pip) => `<i class="score-pip${pip < player.score ? ' on' : ''}"></i>`).join('');
      return `<div class="score-chip${active}"><span class="score-avatar">${escapeHtml(player.avatar)}</span><span class="score-name">${escapeHtml(player.name)}</span><span class="score-pips">${pips}</span></div>`;
    }).join('');
    const active = el.scoreboard.querySelector('.score-chip.active');
    if (active && typeof active.scrollIntoView === 'function') active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function prepareSourceEmoji(emoji) {
    sourceCtx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
    sourceCtx.textAlign = 'center';
    sourceCtx.textBaseline = 'middle';
    sourceCtx.font = '360px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    sourceCtx.fillText(emoji, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 8);
  }

  function drawStage() {
    ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
    ctx.drawImage(sourceCanvas,0,0);
    if (cutPoints.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(141,240,210,.95)';
      ctx.shadowColor = 'rgba(141,240,210,.7)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(cutPoints[0].x, cutPoints[0].y);
      for (let i = 1; i < cutPoints.length; i += 1) ctx.lineTo(cutPoints[i].x, cutPoints[i].y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function resetSliceState() {
    drawing = false;
    cutPoints = [];
    lastPointer = null;
    stopSliceSound();
    prepareSourceEmoji(currentEmoji);
    drawStage();
    el.sliceHint.hidden = false;
    el.sliceMessage.className = 'slice-message';
    el.sliceMessage.textContent = 'Start outside one side and drag all the way through.';
    el.nextButton.hidden = true;
    const oldOverlay = el.canvasShell.querySelector('.locked-overlay');
    if (oldOverlay) oldOverlay.remove();
  }

  function pointerPoint(event) {
    const rect = el.sliceCanvas.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) * CANVAS_SIZE / rect.width, 0, CANVAS_SIZE), y: clamp((event.clientY - rect.top) * CANVAS_SIZE / rect.height, 0, CANVAS_SIZE) };
  }

  function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }

  function simplifyPath(points) {
    if (points.length <= 2) return points.slice();
    const output = [points[0]];
    let last = points[0];
    const spacing = 10;
    for (let i = 1; i < points.length - 1; i += 1) {
      if (distance(last, points[i]) >= spacing) { output.push(points[i]); last = points[i]; }
    }
    output.push(points[points.length - 1]);
    if (output.length <= 48) return output;
    const reduced = [];
    const step = (output.length - 1) / 47;
    for (let i = 0; i < 48; i += 1) reduced.push(output[Math.min(output.length - 1, Math.round(i * step))]);
    return reduced;
  }

  function sideOfPath(x,y,path) {
    let bestDist = Infinity;
    let bestCross = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i], b = path[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx*dx + dy*dy || 1;
      const t = clamp(((x-a.x)*dx + (y-a.y)*dy) / len2, 0, 1);
      const px = a.x + t*dx, py = a.y + t*dy;
      const dist2 = (x-px)*(x-px) + (y-py)*(y-py);
      if (dist2 < bestDist) {
        bestDist = dist2;
        bestCross = dx * (y - a.y) - dy * (x - a.x);
      }
    }
    return bestCross >= 0 ? 1 : -1;
  }

  function pathLength(path) {
    let total = 0;
    for (let i = 1; i < path.length; i += 1) total += distance(path[i-1],path[i]);
    return total;
  }

  function pathTouchesEmoji(path, imageData) {
    let hits = 0;
    for (let i = 1; i < path.length; i += 1) {
      const a = path[i-1], b = path[i];
      const segmentLength = distance(a,b);
      const steps = Math.max(2, Math.ceil(segmentLength / 4));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = clamp(Math.round(a.x + (b.x-a.x)*t),0,CANVAS_SIZE-1);
        const y = clamp(Math.round(a.y + (b.y-a.y)*t),0,CANVAS_SIZE-1);
        if (imageData.data[(y*CANVAS_SIZE+x)*4+3] > 30) hits += 1;
        if (hits >= 10) return true;
      }
    }
    return false;
  }

  function analyzeCut(points, makePieces = false) {
    const path = simplifyPath(points);
    const source = sourceCtx.getImageData(0,0,CANVAS_SIZE,CANVAS_SIZE);
    if (path.length < 2 || pathLength(path) < 150 || !pathTouchesEmoji(path, source)) return { valid:false, message:'Your slice must travel through the emoji from one side to the other.' };

    const leftData = makePieces ? sourceCtx.createImageData(CANVAS_SIZE,CANVAS_SIZE) : null;
    const rightData = makePieces ? sourceCtx.createImageData(CANVAS_SIZE,CANVAS_SIZE) : null;
    let left = 0, right = 0, total = 0;

    for (let y = 0; y < CANVAS_SIZE; y += 1) {
      for (let x = 0; x < CANVAS_SIZE; x += 1) {
        const offset = (y*CANVAS_SIZE+x)*4;
        const alpha = source.data[offset+3];
        if (alpha <= 3) continue;
        const weight = alpha / 255;
        total += weight;
        const side = sideOfPath(x+.5,y+.5,path);
        if (side > 0) left += weight; else right += weight;
        if (makePieces) {
          const target = side > 0 ? leftData.data : rightData.data;
          target[offset] = source.data[offset];
          target[offset+1] = source.data[offset+1];
          target[offset+2] = source.data[offset+2];
          target[offset+3] = alpha;
        }
      }
    }

    if (!total || left / total < 0.04 || right / total < 0.04) return { valid:false, message:'That cut only clipped the emoji. Slice fully across it.' };
    const leftPct = left / total * 100;
    const rightPct = right / total * 100;
    const error = Math.abs(leftPct - 50);
    return { valid:true, path, leftPct, rightPct, error, scoreError: Number(error.toFixed(3)), leftData, rightData };
  }

  function lockCut(result) {
    const player = players[currentPlayerIndex];
    attempts.push({ playerIndex: currentPlayerIndex, name: player.name, avatar: player.avatar, emoji: currentEmoji, difficulty: currentShapeDifficulty, points: result.path, leftPct: result.leftPct, rightPct: result.rightPct, error: result.error, scoreError: result.scoreError });
    phase = 'locked';
    el.sliceHint.hidden = true;
    el.sliceMessage.className = 'slice-message good';
    el.sliceMessage.textContent = players.length === 1 ? 'Slice locked. Time for the weigh-in.' : 'Slice locked. The balance stays secret until everyone has played.';
    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';
    overlay.innerHTML = `<div><strong>✂️ CUT LOCKED</strong><span>${players.length === 1 ? 'Ready to weigh it' : 'No result shown yet'}</span></div>`;
    el.canvasShell.appendChild(overlay);
    playCue('snap');
    vibrate([18,20,34]);
    el.nextButton.hidden = false;
    el.nextButton.textContent = players.length === 1 ? 'WEIGH MY SPLIT' : (turnPosition < players.length - 1 ? 'PASS TO NEXT PLAYER' : 'WEIGH THE ROUND');
  }

  function onPointerDown(event) {
    if (phase !== 'slice-ready') return;
    event.preventDefault();
    drawing = true;
    cutPoints = [pointerPoint(event)];
    lastPointer = { point: cutPoints[0], time: performance.now() };
    if (el.sliceCanvas.setPointerCapture) el.sliceCanvas.setPointerCapture(event.pointerId);
    el.sliceHint.hidden = true;
    startSliceSound();
    vibrate(8);
    drawStage();
  }

  function onPointerMove(event) {
    if (!drawing || phase !== 'slice-ready') return;
    event.preventDefault();
    const point = pointerPoint(event);
    if (distance(cutPoints[cutPoints.length-1], point) < 2.5) return;
    cutPoints.push(point);
    const now = performance.now();
    if (lastPointer) updateSliceSound(distance(lastPointer.point,point) / Math.max(1,now-lastPointer.time) * 20);
    lastPointer = { point, time: now };
    drawStage();
  }

  function onPointerUp(event) {
    if (!drawing || phase !== 'slice-ready') return;
    event.preventDefault();
    drawing = false;
    stopSliceSound();
    const point = pointerPoint(event);
    if (!cutPoints.length || distance(cutPoints[cutPoints.length-1],point) > 1) cutPoints.push(point);
    drawStage();
    const result = analyzeCut(cutPoints,false);
    if (!result.valid) {
      playCue('bad');
      vibrate([25,35,25]);
      el.sliceMessage.className = 'slice-message bad';
      el.sliceMessage.textContent = result.message;
      window.setTimeout(() => { if (phase === 'slice-ready') resetSliceState(); }, 800);
      return;
    }
    lockCut(result);
  }

  function startRound() {
    const selected = chooseEmoji();
    currentEmoji = selected.emoji;
    currentShapeDifficulty = selected.difficulty;
    attempts = [];
    turnPosition = 0;
    roundWinners = [];
    champions = [];
    buildTurnOrder();
    el.roundNumber.textContent = String(round);
    el.shapeBadge.textContent = currentShapeDifficulty.toUpperCase();
    el.targetEmojiLabel.textContent = currentEmoji;
    showTurn();
  }

  function showTurn() {
    phase = 'slice-ready';
    syncTurn();
    renderScoreboard();
    resetSliceState();
    el.gameScreen.hidden = false;
    el.revealScreen.hidden = true;
  }

  function startGame() {
    players = Array.from({ length: setupPlayerCount }, (_, index) => normalizedPlayer(index));
    round = 1;
    el.setupScreen.hidden = true;
    el.gameScreen.hidden = false;
    el.revealScreen.hidden = true;
    el.newGameButton.hidden = false;
    saveSettings();
    startRound();
  }

  function passOrReveal() {
    if (phase !== 'locked') return;
    if (players.length === 1) { beginReveal(); return; }
    if (turnPosition < players.length - 1) {
      turnPosition += 1;
      showTurn();
      return;
    }
    beginReveal();
  }

  function splitForReveal(attempt) {
    prepareSourceEmoji(attempt.emoji);
    return analyzeCut(attempt.points,true);
  }

  function drawPiece(canvas, imageData) {
    const temp = document.createElement('canvas');
    temp.width = temp.height = CANVAS_SIZE;
    temp.getContext('2d').putImageData(imageData,0,0);
    const pieceCtx = canvas.getContext('2d');
    pieceCtx.clearRect(0,0,canvas.width,canvas.height);
    const scale = Math.min(canvas.width / CANVAS_SIZE, canvas.height / CANVAS_SIZE) * 1.05;
    const w = CANVAS_SIZE * scale, h = CANVAS_SIZE * scale;
    pieceCtx.drawImage(temp,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
  }

  function renderRevealAttempt(index) {
    const attempt = attempts[index];
    const split = splitForReveal(attempt);
    el.ranking.hidden = true;
    el.revealKicker.textContent = players.length === 1 ? `ROUND ${round} · SOLO` : `ROUND ${round} · RESULT ${index+1}/${attempts.length}`;
    el.revealTitle.textContent = 'The weigh-in';
    el.revealPlayer.textContent = `${attempt.avatar} ${attempt.name}`;
    el.leftPercent.textContent = formatPct(attempt.leftPct);
    el.rightPercent.textContent = formatPct(attempt.rightPct);
    el.balanceError.textContent = `${formatPct(attempt.error)} off`;
    el.accuracyLine.textContent = `Actual rendered emoji area · ${attempt.difficulty.toUpperCase()} shape`;
    const difference = attempt.rightPct - attempt.leftPct;
    el.scale.style.setProperty('--tilt', `${clamp(difference * 0.28,-8,8).toFixed(2)}deg`);
    drawPiece(el.leftPiece, split.leftData);
    drawPiece(el.rightPiece, split.rightData);
    el.revealButton.textContent = players.length === 1 ? 'ROUND RESULT' : (index < attempts.length - 1 ? 'NEXT RESULT' : 'ROUND RESULT');
    playCue(attempt.error <= 0.1 ? 'perfect' : 'scale');
    vibrate(attempt.error <= 0.1 ? [25,20,25,20,60] : [15,50,20]);
    if (attempt.error <= 0.1) {
      const card = el.scale.closest('.scale-card');
      card.classList.remove('perfect-flash');
      void card.offsetWidth;
      card.classList.add('perfect-flash');
    }
  }

  function resolveRound() {
    const best = Math.min(...attempts.map(attempt => attempt.scoreError));
    roundWinners = attempts.filter(attempt => attempt.scoreError === best).map(attempt => attempt.playerIndex);
    if (players.length === 1) {
      const threshold = SOLO[soloDifficulty].tolerance;
      roundWinners = attempts[0].error <= threshold ? [0] : [];
    }
    roundWinners.forEach(index => { players[index].score += 1; });
    champions = players.map((player,index) => player.score >= WIN_SCORE ? index : -1).filter(index => index >= 0);
  }

  function renderRoundResult() {
    resolveRound();
    el.ranking.hidden = false;
    const sorted = attempts.slice().sort((a,b) => a.scoreError - b.scoreError || a.playerIndex - b.playerIndex);
    const winnerSet = new Set(roundWinners);
    el.ranking.innerHTML = sorted.map((attempt,index) => {
      const winner = winnerSet.has(attempt.playerIndex);
      return `<div class="rank-row${winner?' winner':''}"><span class="rank-position">${winner?'★':index+1}</span><div><strong>${escapeHtml(attempt.avatar)} ${escapeHtml(attempt.name)}</strong><small>${formatPct(attempt.leftPct)} / ${formatPct(attempt.rightPct)}</small></div><span>${formatPct(attempt.error)} off</span></div>`;
    }).join('');
    el.revealKicker.textContent = `ROUND ${round} · FINAL`;
    if (players.length === 1) {
      const success = roundWinners.length === 1;
      el.revealTitle.textContent = success ? 'Point earned' : 'No point';
      el.revealPlayer.textContent = success ? `Within ±${SOLO[soloDifficulty].tolerance.toFixed(3)}%` : `Needed within ±${SOLO[soloDifficulty].tolerance.toFixed(3)}%`;
    } else if (roundWinners.length > 1) {
      el.revealTitle.textContent = 'Exact tie';
      el.revealPlayer.textContent = `${roundWinners.length} players share the point`;
    } else {
      const winner = players[roundWinners[0]];
      el.revealTitle.textContent = 'Round winner';
      el.revealPlayer.textContent = `${winner.avatar} ${winner.name} earns the point`;
    }
    renderScoreboard();
    if (roundWinners.length) playCue('point');
    if (champions.length) {
      phase = 'game-over';
      if (champions.length > 1) {
        el.revealTitle.textContent = 'Game tied';
        el.revealPlayer.textContent = champions.map(index => `${players[index].avatar} ${players[index].name}`).join(' · ');
      } else {
        const champion = players[champions[0]];
        el.revealTitle.textContent = 'Perfect Split champion';
        el.revealPlayer.textContent = `${champion.avatar} ${champion.name} reached ${WIN_SCORE} points`;
      }
      el.revealButton.textContent = 'PLAY AGAIN';
      playCue('win');
      vibrate([35,30,35,30,80]);
    } else {
      phase = 'round-result';
      el.revealButton.textContent = 'NEXT ROUND';
    }
  }

  function beginReveal() {
    phase = 'reveal';
    revealIndex = 0;
    el.gameScreen.hidden = true;
    el.revealScreen.hidden = false;
    renderRevealAttempt(revealIndex);
  }

  function handleRevealButton() {
    if (phase === 'reveal') {
      if (players.length > 1 && revealIndex < attempts.length - 1) {
        revealIndex += 1;
        renderRevealAttempt(revealIndex);
      } else {
        renderRoundResult();
      }
    } else if (phase === 'round-result') {
      round += 1;
      startRound();
    } else if (phase === 'game-over') {
      players.forEach(player => { player.score = 0; });
      round = 1;
      startRound();
    }
  }

  function resetToSetup() {
    stopSliceSound();
    phase = 'setup';
    el.setupScreen.hidden = false;
    el.gameScreen.hidden = true;
    el.revealScreen.hidden = true;
    el.newGameButton.hidden = true;
    renderSetup();
  }

  el.minusPlayer.addEventListener('click', () => { setupPlayerCount = clamp(setupPlayerCount-1,MIN_PLAYERS,MAX_PLAYERS); saveSettings(); renderSetup(); });
  el.plusPlayer.addEventListener('click', () => { setupPlayerCount = clamp(setupPlayerCount+1,MIN_PLAYERS,MAX_PLAYERS); saveSettings(); renderSetup(); });
  el.soloDifficulty.addEventListener('click', event => { const button = event.target.closest('[data-solo]'); if (!button) return; soloDifficulty = button.dataset.solo; saveSettings(); renderSetup(); });
  el.emojiMode.addEventListener('click', event => { const button = event.target.closest('[data-mode]'); if (!button) return; emojiMode = button.dataset.mode; saveSettings(); renderSetup(); });
  el.shapeDifficulty.addEventListener('change', () => { shapeDifficulty = el.shapeDifficulty.value; saveSettings(); });
  el.emojiPicker.addEventListener('change', () => { pickedEmoji = el.emojiPicker.value; saveSettings(); });
  el.soundToggle.addEventListener('click', () => { soundEnabled = !soundEnabled; saveSettings(); updateToggle(el.soundToggle,soundEnabled); if (soundEnabled) tone(720,.05,.02); });
  el.vibrationToggle.addEventListener('click', () => { vibrationEnabled = !vibrationEnabled; saveSettings(); updateToggle(el.vibrationToggle,vibrationEnabled); if (vibrationEnabled) vibrate(22); });
  el.beginButton.addEventListener('click', startGame);
  el.nextButton.addEventListener('click', passOrReveal);
  el.revealButton.addEventListener('click', handleRevealButton);
  el.newGameButton.addEventListener('click', resetToSetup);
  el.sliceCanvas.addEventListener('pointerdown', onPointerDown);
  el.sliceCanvas.addEventListener('pointermove', onPointerMove);
  el.sliceCanvas.addEventListener('pointerup', onPointerUp);
  el.sliceCanvas.addEventListener('pointercancel', onPointerUp);

  loadSettings();
  populateEmojiPicker();
  renderSetup();
})();