(() => {
  'use strict';

  const WIN_SCORE = 3;
  const MIN_PLAYERS = 1;
  const MAX_PLAYERS = 10;
  const MIN_TARGET_MS = 2000;
  const MAX_TARGET_MS = 10000;
  const HIDE_DELAY_MS = 1000;
  const DIFFICULTIES = {
    easy: { label: 'Easy', toleranceMs: 500 },
    normal: { label: 'Normal', toleranceMs: 250 },
    hard: { label: 'Hard', toleranceMs: 100 },
  };
  const AVATARS = ['🙂','😎','🤖','👾','🐱','🐶','🦊','🐸','🐵','🦁','🐯','🐼','🐧','🦄','👻','🔥','⚡','🎯','⏱️','🚀'];
  const SEGMENTS = {
    '0': ['a','b','c','d','e','f'],
    '1': ['b','c'],
    '2': ['a','b','d','e','g'],
    '3': ['a','b','c','d','g'],
    '4': ['b','c','f','g'],
    '5': ['a','c','d','f','g'],
    '6': ['a','c','d','e','f','g'],
    '7': ['a','b','c'],
    '8': ['a','b','c','d','e','f','g'],
    '9': ['a','b','c','d','f','g'],
  };

  const el = {
    setupScreen: document.getElementById('setupScreen'),
    gameScreen: document.getElementById('gameScreen'),
    newGameButton: document.getElementById('newGameButton'),
    minusPlayer: document.getElementById('minusPlayer'),
    plusPlayer: document.getElementById('plusPlayer'),
    playerCount: document.getElementById('playerCount'),
    difficultyWrap: document.getElementById('difficultyWrap'),
    difficultyControl: document.getElementById('difficultyControl'),
    playerRows: document.getElementById('playerRows'),
    beginButton: document.getElementById('beginButton'),
    roundNumber: document.getElementById('roundNumber'),
    difficultyBadge: document.getElementById('difficultyBadge'),
    scoreboard: document.getElementById('scoreboard'),
    turnAvatar: document.getElementById('turnAvatar'),
    turnName: document.getElementById('turnName'),
    turnSuffix: document.getElementById('turnSuffix'),
    clockLabel: document.getElementById('clockLabel'),
    sevenDisplay: document.getElementById('sevenDisplay'),
    displayText: document.getElementById('displayText'),
    targetNote: document.getElementById('targetNote'),
    actionButton: document.getElementById('actionButton'),
    roundAttempts: document.getElementById('roundAttempts'),
  };

  const draftPlayers = Array.from({ length: MAX_PLAYERS }, (_, index) => ({
    name: `Player ${index + 1}`,
    avatar: AVATARS[index % AVATARS.length],
  }));

  let setupPlayerCount = 2;
  let selectedDifficulty = 'normal';
  let players = [];
  let round = 1;
  let targetMs = 4000;
  let currentPlayerIndex = 0;
  let attempts = [];
  let phase = 'setup';
  let startTime = 0;
  let hideTimer = 0;
  let winnerIndex = -1;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatMs(ms) {
    return (ms / 1000).toFixed(3);
  }

  function randomTargetMs() {
    return Math.floor(Math.random() * (MAX_TARGET_MS - MIN_TARGET_MS + 1)) + MIN_TARGET_MS;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderDisplay(value, hidden = false) {
    const text = String(value);
    const parts = [];
    for (const char of text) {
      if (char === '.') {
        parts.push('<span class="decimal" aria-hidden="true"></span>');
        continue;
      }
      if (!(char in SEGMENTS)) continue;
      const active = new Set(SEGMENTS[char]);
      const segments = ['a','b','c','d','e','f','g']
        .map(name => `<span class="segment ${name}${active.has(name) ? ' on' : ''}"></span>`)
        .join('');
      parts.push(`<span class="digit">${segments}</span>`);
    }
    el.sevenDisplay.innerHTML = parts.join('');
    el.sevenDisplay.classList.toggle('hidden-clock', hidden);
    el.displayText.textContent = `${text} seconds`;
  }

  function renderPlayerRows() {
    el.playerRows.innerHTML = '';
    for (let index = 0; index < setupPlayerCount; index += 1) {
      const row = document.createElement('div');
      row.className = 'player-row';

      const avatar = document.createElement('select');
      avatar.setAttribute('aria-label', `Player ${index + 1} avatar`);
      for (const optionAvatar of AVATARS) {
        const option = document.createElement('option');
        option.value = optionAvatar;
        option.textContent = optionAvatar;
        option.selected = draftPlayers[index].avatar === optionAvatar;
        avatar.appendChild(option);
      }
      avatar.addEventListener('change', () => {
        draftPlayers[index].avatar = avatar.value;
      });

      const name = document.createElement('input');
      name.type = 'text';
      name.maxLength = 18;
      name.value = draftPlayers[index].name;
      name.placeholder = `Player ${index + 1}`;
      name.setAttribute('aria-label', `Player ${index + 1} name`);
      name.addEventListener('input', () => {
        draftPlayers[index].name = name.value;
      });

      row.append(avatar, name);
      el.playerRows.appendChild(row);
    }
  }

  function renderSetupState() {
    el.playerCount.textContent = String(setupPlayerCount);
    el.minusPlayer.disabled = setupPlayerCount <= MIN_PLAYERS;
    el.plusPlayer.disabled = setupPlayerCount >= MAX_PLAYERS;
    el.difficultyWrap.hidden = setupPlayerCount !== 1;
    renderPlayerRows();
  }

  function setPlayerCount(nextCount) {
    setupPlayerCount = clamp(nextCount, MIN_PLAYERS, MAX_PLAYERS);
    renderSetupState();
  }

  function setDifficulty(value) {
    if (!DIFFICULTIES[value]) return;
    selectedDifficulty = value;
    el.difficultyControl.querySelectorAll('[data-difficulty]').forEach(button => {
      button.classList.toggle('selected', button.dataset.difficulty === selectedDifficulty);
    });
  }

  function normalizedPlayer(index) {
    const source = draftPlayers[index];
    const trimmed = source.name.trim();
    return {
      name: trimmed || `Player ${index + 1}`,
      avatar: source.avatar || AVATARS[index % AVATARS.length],
      score: 0,
    };
  }

  function startGame() {
    players = Array.from({ length: setupPlayerCount }, (_, index) => normalizedPlayer(index));
    round = 1;
    targetMs = randomTargetMs();
    currentPlayerIndex = 0;
    attempts = [];
    winnerIndex = -1;
    phase = 'ready';
    el.setupScreen.hidden = true;
    el.gameScreen.hidden = false;
    el.newGameButton.hidden = false;
    el.difficultyBadge.hidden = players.length !== 1;
    el.difficultyBadge.textContent = DIFFICULTIES[selectedDifficulty].label.toUpperCase();
    renderGame();
  }

  function resetToSetup() {
    clearTimeout(hideTimer);
    phase = 'setup';
    el.gameScreen.hidden = true;
    el.setupScreen.hidden = false;
    el.newGameButton.hidden = true;
    renderSetupState();
  }

  function renderScoreboard() {
    el.scoreboard.innerHTML = players.map((player, index) => {
      const active = phase !== 'game-over' && index === currentPlayerIndex ? ' active' : '';
      const winner = index === winnerIndex ? ' winner' : '';
      return `<div class="score-chip${active}${winner}">
        <span class="score-avatar">${escapeHtml(player.avatar)}</span>
        <span class="score-name">${escapeHtml(player.name)}</span>
        <span class="score-points">${player.score}</span>
      </div>`;
    }).join('');
  }

  function renderAttempts() {
    if (!attempts.length) {
      el.roundAttempts.innerHTML = '';
      return;
    }
    const legalAttempts = attempts.filter(attempt => !attempt.bust);
    const bestMs = legalAttempts.length ? Math.max(...legalAttempts.map(attempt => attempt.elapsedMs)) : null;
    el.roundAttempts.innerHTML = attempts.map(attempt => {
      const classes = ['attempt-chip'];
      if (attempt.bust) classes.push('bust');
      if (!attempt.bust && attempt.elapsedMs === bestMs) classes.push('best');
      return `<span class="${classes.join(' ')}">${escapeHtml(attempt.avatar)} ${escapeHtml(attempt.name)} <strong>${formatMs(attempt.elapsedMs)}</strong>${attempt.bust ? ' BUST' : ''}</span>`;
    }).join('');
  }

  function renderTurnHeader() {
    const player = players[currentPlayerIndex];
    if (!player) return;
    el.turnAvatar.textContent = player.avatar;
    el.turnName.textContent = player.name;
    el.turnSuffix.textContent = phase === 'game-over' ? 'wins!' : 'is up';
  }

  function setNote(message, type = '') {
    el.targetNote.className = `target-note${type ? ` ${type}` : ''}`;
    el.targetNote.textContent = message;
  }

  function configureAction(label, style) {
    el.actionButton.textContent = label;
    el.actionButton.className = `action-button ${style}`;
  }

  function showReadyState() {
    renderTurnHeader();
    el.clockLabel.textContent = 'TARGET';
    renderDisplay(formatMs(targetMs), false);
    setNote('Press START. The target disappears after 1 second.');
    configureAction('START', 'start');
  }

  function renderGame() {
    el.roundNumber.textContent = String(round);
    renderScoreboard();
    renderAttempts();
    showReadyState();
  }

  function beginAttempt() {
    if (phase !== 'ready') return;
    phase = 'running';
    startTime = performance.now();
    el.clockLabel.textContent = 'TARGET';
    renderDisplay(formatMs(targetMs), false);
    setNote('Clock is running…');
    configureAction('STOP', 'stop');
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (phase !== 'running') return;
      el.sevenDisplay.classList.add('hidden-clock');
      el.clockLabel.textContent = 'HIDDEN';
      el.displayText.textContent = 'Timer hidden';
      setNote('Trust your sense of time.');
    }, HIDE_DELAY_MS);
  }

  function finishAttempt() {
    if (phase !== 'running') return;
    const elapsedMs = Math.max(0, Math.round(performance.now() - startTime));
    clearTimeout(hideTimer);
    const player = players[currentPlayerIndex];
    const bust = elapsedMs > targetMs;
    const deltaMs = Math.abs(targetMs - elapsedMs);
    const attempt = {
      playerIndex: currentPlayerIndex,
      name: player.name,
      avatar: player.avatar,
      elapsedMs,
      bust,
      deltaMs,
    };
    attempts.push(attempt);
    phase = 'result';
    el.clockLabel.textContent = 'YOUR TIME';
    renderDisplay(formatMs(elapsedMs), false);

    if (bust) {
      setNote(`BUST · ${formatMs(elapsedMs - targetMs)}s over the ${formatMs(targetMs)}s target`, 'bust');
    } else {
      setNote(`${formatMs(deltaMs)}s under the ${formatMs(targetMs)}s target`, 'good');
    }

    renderAttempts();
    if (players.length === 1) {
      resolveSoloRound(attempt);
      return;
    }

    if (currentPlayerIndex < players.length - 1) {
      configureAction('NEXT PLAYER', 'next');
    } else {
      configureAction('ROUND RESULTS', 'next');
    }
  }

  function resolveSoloRound(attempt) {
    const difficulty = DIFFICULTIES[selectedDifficulty];
    const success = !attempt.bust && attempt.deltaMs <= difficulty.toleranceMs;
    if (success) {
      players[0].score += 1;
      setNote(`POINT · ${formatMs(attempt.deltaMs)}s under target`, 'round-win');
    } else if (!attempt.bust) {
      setNote(`No point · needed within ${formatMs(difficulty.toleranceMs)}s`, '');
    }
    renderScoreboard();
    if (players[0].score >= WIN_SCORE) {
      winnerIndex = 0;
      phase = 'game-over';
      renderWinner();
    } else {
      phase = 'solo-result';
      configureAction('NEXT ROUND', 'next');
    }
  }

  function advanceAfterResult() {
    if (players.length === 1) {
      startNextRound();
      return;
    }
    if (currentPlayerIndex < players.length - 1) {
      currentPlayerIndex += 1;
      phase = 'ready';
      renderScoreboard();
      showReadyState();
      return;
    }
    resolveMultiplayerRound();
  }

  function resolveMultiplayerRound() {
    const legal = attempts.filter(attempt => !attempt.bust);
    phase = 'round-result';

    if (!legal.length) {
      el.clockLabel.textContent = 'NO POINT';
      renderDisplay(formatMs(targetMs), false);
      setNote('Everyone went over. No point this round.', 'bust');
      configureAction('NEXT ROUND', 'next');
      return;
    }

    const bestElapsed = Math.max(...legal.map(attempt => attempt.elapsedMs));
    const leaders = legal.filter(attempt => attempt.elapsedMs === bestElapsed);
    if (leaders.length > 1) {
      el.clockLabel.textContent = 'TIE';
      renderDisplay(formatMs(bestElapsed), false);
      setNote(`Tie at ${formatMs(bestElapsed)}s. No point this round.`, 'round-win');
      configureAction('NEXT ROUND', 'next');
      return;
    }

    const winningAttempt = leaders[0];
    players[winningAttempt.playerIndex].score += 1;
    currentPlayerIndex = winningAttempt.playerIndex;
    renderScoreboard();
    el.turnAvatar.textContent = winningAttempt.avatar;
    el.turnName.textContent = winningAttempt.name;
    el.turnSuffix.textContent = 'wins the round';
    el.clockLabel.textContent = 'ROUND WINNER';
    renderDisplay(formatMs(winningAttempt.elapsedMs), false);
    setNote(`${winningAttempt.name} was ${formatMs(targetMs - winningAttempt.elapsedMs)}s under target`, 'round-win');

    if (players[winningAttempt.playerIndex].score >= WIN_SCORE) {
      winnerIndex = winningAttempt.playerIndex;
      phase = 'game-over';
      renderWinner();
    } else {
      configureAction('NEXT ROUND', 'next');
    }
  }

  function renderWinner() {
    const winner = players[winnerIndex];
    renderScoreboard();
    el.turnAvatar.textContent = winner.avatar;
    el.turnName.textContent = winner.name;
    el.turnSuffix.textContent = 'wins!';
    el.clockLabel.textContent = 'WINNER';
    renderDisplay('3.000', false);
    setNote(`${winner.name} reached 3 points.`, 'good');
    configureAction('PLAY AGAIN', 'win');
  }

  function startNextRound() {
    round += 1;
    targetMs = randomTargetMs();
    currentPlayerIndex = 0;
    attempts = [];
    phase = 'ready';
    renderGame();
  }

  function handleAction() {
    if (phase === 'ready') {
      beginAttempt();
    } else if (phase === 'running') {
      finishAttempt();
    } else if (phase === 'result' || phase === 'solo-result') {
      advanceAfterResult();
    } else if (phase === 'round-result') {
      startNextRound();
    } else if (phase === 'game-over') {
      startGame();
    }
  }

  el.minusPlayer.addEventListener('click', () => setPlayerCount(setupPlayerCount - 1));
  el.plusPlayer.addEventListener('click', () => setPlayerCount(setupPlayerCount + 1));
  el.difficultyControl.addEventListener('click', event => {
    const button = event.target.closest('[data-difficulty]');
    if (button) setDifficulty(button.dataset.difficulty);
  });
  el.beginButton.addEventListener('click', startGame);
  el.actionButton.addEventListener('click', handleAction);
  el.newGameButton.addEventListener('click', resetToSetup);

  setDifficulty(selectedDifficulty);
  renderSetupState();
  renderDisplay('4.000', false);
})();