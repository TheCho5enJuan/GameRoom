'use strict';

(() => {
  const SIZE = 9;
  const START_WALLS = 10;
  const PREF_KEY = 'wallbound.v2.players';
  const TOKENS = ['🧭','🚀','😎','🤖','👑','🐉','🦊','🐸','🦄','👻','🐱','🐶','🦁','🥷','🧙','🏎️'];
  const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
  const el = id => document.getElementById(id);

  const board = el('board');
  const boardStage = el('boardStage');
  const boardFrame = el('boardFrame');
  const cellsEl = el('cells');
  const wallsLayer = el('wallsLayer');
  const slotsLayer = el('slotsLayer');
  const toast = el('toast');

  let game;
  let mode = 'move';
  let orientation = 'H';
  let undoStack = [];
  let toastTimer = null;
  let draftTokens = ['🧭','🚀'];

  function loadPlayers() {
    try {
      const value = JSON.parse(localStorage.getItem(PREF_KEY));
      if (!Array.isArray(value) || value.length !== 2) return null;
      return value.map((p, i) => ({
        name: typeof p?.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 18) : `Player ${i + 1}`,
        emoji: typeof p?.emoji === 'string' && p.emoji ? p.emoji : (i === 0 ? '🧭' : '🚀')
      }));
    } catch {
      return null;
    }
  }

  function savePlayerPrefs() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(game.players.map(p => ({name:p.name, emoji:p.emoji}))));
    } catch {
      // Storage is optional; gameplay does not depend on it.
    }
  }

  function freshGame(players = loadPlayers()) {
    return {
      players: [
        {name:players?.[0]?.name || 'Player 1', emoji:players?.[0]?.emoji || '🧭', row:8, col:4, goalRow:0, walls:START_WALLS},
        {name:players?.[1]?.name || 'Player 2', emoji:players?.[1]?.emoji || '🚀', row:0, col:4, goalRow:8, walls:START_WALLS}
      ],
      current: 0,
      walls: [],
      moves: [],
      winner: null
    };
  }

  const inside = (r,c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const snapshot = () => JSON.stringify(game);

  function edgeBlocked(r1,c1,r2,c2,walls = game.walls) {
    if (Math.abs(r1-r2) + Math.abs(c1-c2) !== 1) return true;
    if (r1 === r2) {
      const c = Math.min(c1,c2);
      return walls.some(w => w.o === 'V' && w.c === c && (r1 === w.r || r1 === w.r + 1));
    }
    const r = Math.min(r1,r2);
    return walls.some(w => w.o === 'H' && w.r === r && (c1 === w.c || c1 === w.c + 1));
  }

  function legalMoves(playerIndex = game.current) {
    const me = game.players[playerIndex];
    const other = game.players[1-playerIndex];
    const out = [];
    const add = (row,col) => {
      if (!out.some(p => p.row === row && p.col === col)) out.push({row,col});
    };

    for (const [dr,dc] of DIRS) {
      const nr = me.row + dr;
      const nc = me.col + dc;
      if (!inside(nr,nc) || edgeBlocked(me.row,me.col,nr,nc)) continue;

      if (nr !== other.row || nc !== other.col) {
        add(nr,nc);
        continue;
      }

      const jumpRow = other.row + dr;
      const jumpCol = other.col + dc;
      if (inside(jumpRow,jumpCol) && !edgeBlocked(other.row,other.col,jumpRow,jumpCol)) {
        add(jumpRow,jumpCol);
        continue;
      }

      const sideDirections = dr !== 0 ? [[0,-1],[0,1]] : [[-1,0],[1,0]];
      for (const [sr,sc] of sideDirections) {
        const sideRow = other.row + sr;
        const sideCol = other.col + sc;
        if (inside(sideRow,sideCol) && !edgeBlocked(other.row,other.col,sideRow,sideCol)) {
          add(sideRow,sideCol);
        }
      }
    }
    return out;
  }

  function wallCollision(candidate) {
    for (const wall of game.walls) {
      if (candidate.o === wall.o) {
        if (candidate.o === 'H' && candidate.r === wall.r && Math.abs(candidate.c-wall.c) < 2) {
          return 'That wall would overlap another wall.';
        }
        if (candidate.o === 'V' && candidate.c === wall.c && Math.abs(candidate.r-wall.r) < 2) {
          return 'That wall would overlap another wall.';
        }
      } else if (candidate.r === wall.r && candidate.c === wall.c) {
        return 'Walls cannot cross through each other.';
      }
    }
    return null;
  }

  function hasPath(playerIndex, walls) {
    const player = game.players[playerIndex];
    const seen = Array.from({length:SIZE}, () => Array(SIZE).fill(false));
    const queue = [[player.row,player.col]];
    seen[player.row][player.col] = true;

    for (let i = 0; i < queue.length; i++) {
      const [r,c] = queue[i];
      if (r === player.goalRow) return true;

      for (const [dr,dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inside(nr,nc) || seen[nr][nc] || edgeBlocked(r,c,nr,nc,walls)) continue;
        seen[nr][nc] = true;
        queue.push([nr,nc]);
      }
    }
    return false;
  }

  function validateWall(candidate) {
    const player = game.players[game.current];
    if (game.winner !== null) return {ok:false, reason:'The game is already over.'};
    if (player.walls <= 0) return {ok:false, reason:'You have no walls remaining.'};
    if (candidate.r < 0 || candidate.r > 7 || candidate.c < 0 || candidate.c > 7) {
      return {ok:false, reason:'That wall is outside the board.'};
    }

    const collision = wallCollision(candidate);
    if (collision) return {ok:false, reason:collision};

    const testWalls = [...game.walls,candidate];
    if (!hasPath(0,testWalls) || !hasPath(1,testWalls)) {
      return {ok:false, reason:'A wall must leave both players a path to their goal.'};
    }
    return {ok:true, reason:''};
  }

  const coord = (r,c) => String.fromCharCode(65+c) + (SIZE-r);
  const wallCoord = wall => String.fromCharCode(65+wall.c) + (SIZE-wall.r-1) + ' ' + (wall.o === 'H' ? 'horizontal' : 'vertical');

  function softHaptic() {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(12);
  }

  function commitAction(action) {
    game.moves.push(action);
    if (game.winner === null) game.current = 1 - game.current;
    mode = 'move';
    render();
    softHaptic();

    if (game.winner === null) {
      const next = game.players[game.current];
      showToast(`${next.emoji} ${next.name}'s turn`);
    }
  }

  function moveTo(row,col) {
    if (game.winner !== null || mode !== 'move') return;
    if (!legalMoves().some(p => p.row === row && p.col === col)) return;

    undoStack.push(snapshot());
    const playerIndex = game.current;
    const player = game.players[playerIndex];
    player.row = row;
    player.col = col;

    if (row === player.goalRow) game.winner = playerIndex;

    commitAction({
      player:playerIndex,
      type:'move',
      row,
      col,
      text:`Moved to ${coord(row,col)}`
    });

    if (game.winner !== null) showWinner();
  }

  function placeWall(row,col,wallOrientation) {
    if (game.winner !== null || mode !== 'wall') return;
    const candidate = {r:row,c:col,o:wallOrientation};
    const check = validateWall(candidate);

    if (!check.ok) {
      showToast(check.reason);
      return;
    }

    undoStack.push(snapshot());
    const playerIndex = game.current;
    game.walls.push(candidate);
    game.players[playerIndex].walls--;

    commitAction({
      player:playerIndex,
      type:'wall',
      r:row,
      c:col,
      o:wallOrientation,
      text:`Wall at ${wallCoord(candidate)}`
    });
  }

  function undo() {
    if (!undoStack.length) return;
    game = JSON.parse(undoStack.pop());
    mode = 'move';
    closeOverlay('winnerModal');
    render();
    showToast('Last action undone.');
  }

  function setMode(nextMode) {
    if (game.winner !== null) return;
    if (nextMode === 'wall' && game.players[game.current].walls <= 0) {
      showToast('No walls remaining.');
      return;
    }
    mode = nextMode;
    render();
  }

  function setOrientation(nextOrientation) {
    orientation = nextOrientation;
    renderCommandState();
    renderSlots();
  }

  function renderCells() {
    cellsEl.innerHTML = '';
    const moves = game.winner === null && mode === 'move' ? legalMoves() : [];
    const last = game.moves.at(-1);

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';

        if (r === 0) cell.classList.add('goal-p1');
        if (r === 8) cell.classList.add('goal-p2');
        if (last?.type === 'move' && last.row === r && last.col === c) cell.classList.add('last-move');

        const legal = moves.some(p => p.row === r && p.col === c);
        if (legal) {
          cell.classList.add('legal');
          cell.addEventListener('click', () => moveTo(r,c));
          cell.setAttribute('aria-label', `Move to ${coord(r,c)}`);
        } else {
          cell.setAttribute('aria-label', `Square ${coord(r,c)}`);
        }

        game.players.forEach((player,index) => {
          if (player.row === r && player.col === c) {
            const piece = document.createElement('span');
            piece.className = `piece p${index+1}`;
            if (index === game.current && game.winner === null) piece.classList.add('current');
            piece.textContent = player.emoji;
            piece.setAttribute('aria-hidden','true');
            cell.appendChild(piece);
          }
        });

        cellsEl.appendChild(cell);
      }
    }
  }

  function styleWallPiece(node,wall) {
    if (wall.o === 'H') {
      node.classList.add('h');
      node.style.left = `${wall.c/9*100}%`;
      node.style.top = `${(wall.r+1)/9*100}%`;
      node.style.width = `${2/9*100}%`;
    } else {
      node.classList.add('v');
      node.style.left = `${(wall.c+1)/9*100}%`;
      node.style.top = `${wall.r/9*100}%`;
      node.style.height = `${2/9*100}%`;
    }
  }

  function styleWallSlot(node,wall) {
    const centerX = (wall.c + 1) / 9 * 100;
    const centerY = (wall.r + 1) / 9 * 100;

    node.style.left = `${centerX}%`;
    node.style.top = `${centerY}%`;

    if (wall.o === 'H') {
      node.classList.add('h');
      node.style.width = `${100/9}%`;
      node.style.height = '28px';
    } else {
      node.classList.add('v');
      node.style.width = '28px';
      node.style.height = `${100/9}%`;
    }
    node.style.transform = 'translate(-50%,-50%)';
  }

  function renderWalls() {
    wallsLayer.innerHTML = '';
    const last = game.moves.at(-1);

    game.walls.forEach(wall => {
      const node = document.createElement('div');
      node.className = 'wall-piece';
      if (last?.type === 'wall' && last.r === wall.r && last.c === wall.c && last.o === wall.o) {
        node.classList.add('last-wall');
      }
      styleWallPiece(node,wall);
      wallsLayer.appendChild(node);
    });
  }

  function renderSlots() {
    slotsLayer.innerHTML = '';
    board.classList.toggle('wall-mode', mode === 'wall');
    if (mode !== 'wall' || game.winner !== null) return;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const candidate = {r,c,o:orientation};
        const check = validateWall(candidate);
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = `slot ${check.ok ? 'valid' : 'invalid'}`;
        styleWallSlot(slot,candidate);
        slot.setAttribute('aria-label', `${check.ok ? 'Place' : 'Invalid'} ${orientation === 'H' ? 'horizontal' : 'vertical'} wall at ${wallCoord(candidate)}`);
        slot.title = check.ok ? `Place wall at ${wallCoord(candidate)}` : check.reason;
        slot.addEventListener('click', () => {
          if (check.ok) placeWall(r,c,orientation);
          else showToast(check.reason);
        });
        slotsLayer.appendChild(slot);
      }
    }
  }

  function renderPlayers() {
    game.players.forEach((player,index) => {
      const n = index + 1;
      el(`p${n}NameTop`).textContent = player.name;
      el(`p${n}TokenTop`).textContent = player.emoji;
      el(`p${n}Count`).textContent = player.walls;

      const card = el(`p${n}Card`);
      const active = index === game.current && game.winner === null;
      card.classList.toggle('active',active);
      if (active) card.setAttribute('aria-current','true');
      else card.removeAttribute('aria-current');
    });
  }

  function renderCommandState() {
    const current = game.players[game.current];
    const moveButton = el('moveMode');
    const wallButton = el('wallMode');

    moveButton.classList.toggle('active',mode === 'move');
    wallButton.classList.toggle('active',mode === 'wall');
    moveButton.setAttribute('aria-pressed',String(mode === 'move'));
    wallButton.setAttribute('aria-pressed',String(mode === 'wall'));
    moveButton.disabled = game.winner !== null;
    wallButton.disabled = game.winner !== null || current.walls <= 0;

    el('wallModeCount').textContent = current.walls;
    el('moveHint').hidden = mode !== 'move';
    el('moveHint').textContent = `${current.emoji} ${current.name}: tap a highlighted square.`;
    el('wallTools').hidden = mode !== 'wall';

    el('horizontal').classList.toggle('active',orientation === 'H');
    el('vertical').classList.toggle('active',orientation === 'V');
    el('horizontal').setAttribute('aria-pressed',String(orientation === 'H'));
    el('vertical').setAttribute('aria-pressed',String(orientation === 'V'));
    el('undoBtn').disabled = !undoStack.length;
  }

  function renderHistory() {
    const list = el('historyList');
    list.innerHTML = '';

    const count = game.moves.length;
    el('historyRailCount').textContent = count;
    el('historyMenuCount').textContent = count ? `${count} action${count === 1 ? '' : 's'}` : 'No moves yet';

    if (!count) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No moves yet.';
      list.appendChild(empty);
      return;
    }

    game.moves.forEach((move,index) => {
      const item = document.createElement('div');
      item.className = 'history-item';

      const number = document.createElement('span');
      number.className = 'history-number';
      number.textContent = String(index + 1).padStart(2,'0');

      const who = document.createElement('span');
      who.className = 'history-who';
      const player = game.players[move.player];
      who.textContent = `${player.emoji} ${player.name}`;

      const desc = document.createElement('span');
      desc.className = 'history-desc';
      desc.textContent = move.text;

      item.append(number,who,desc);
      list.appendChild(item);
    });

    list.scrollTop = list.scrollHeight;
  }

  function render() {
    renderPlayers();
    renderCommandState();
    renderCells();
    renderWalls();
    renderSlots();
    renderHistory();
    requestAnimationFrame(fitBoard);
  }

  function fitBoard() {
    if (!boardStage || !boardFrame) return;
    const rect = boardStage.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width,rect.height));
    if (size <= 0) return;
    boardFrame.style.width = `${size}px`;
    boardFrame.style.height = `${size}px`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
  }

  function openOverlay(id) {
    document.querySelectorAll('.overlay.show').forEach(node => node.classList.remove('show'));
    const overlay = el(id);
    overlay.classList.add('show');
    requestAnimationFrame(() => {
      const focusable = overlay.querySelector('button:not(:disabled),input,a');
      focusable?.focus({preventScroll:true});
    });
  }

  function closeOverlay(id) {
    el(id)?.classList.remove('show');
  }

  function openPlayers() {
    closeOverlay('menuModal');
    el('p1Input').value = game.players[0].name;
    el('p2Input').value = game.players[1].name;
    draftTokens = [game.players[0].emoji,game.players[1].emoji];
    renderTokenGrid(0);
    renderTokenGrid(1);
    openOverlay('playersModal');
  }

  function renderTokenGrid(playerIndex) {
    const grid = el(`p${playerIndex+1}EmojiGrid`);
    const preview = el(`p${playerIndex+1}TokenPreview`);
    grid.innerHTML = '';
    preview.textContent = draftTokens[playerIndex];

    TOKENS.forEach(token => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji-option';
      button.textContent = token;
      button.setAttribute('aria-label',`Use ${token} for Player ${playerIndex+1}`);
      button.setAttribute('aria-pressed',String(token === draftTokens[playerIndex]));
      if (token === draftTokens[playerIndex]) button.classList.add('selected');
      button.addEventListener('click',() => {
        draftTokens[playerIndex] = token;
        renderTokenGrid(playerIndex);
      });
      grid.appendChild(button);
    });
  }

  function savePlayers() {
    const names = [
      el('p1Input').value.trim().slice(0,18) || 'Player 1',
      el('p2Input').value.trim().slice(0,18) || 'Player 2'
    ];

    game.players.forEach((player,index) => {
      player.name = names[index];
      player.emoji = draftTokens[index] || (index === 0 ? '🧭' : '🚀');
    });

    undoStack = undoStack.map(saved => {
      const state = JSON.parse(saved);
      state.players.forEach((player,index) => {
        player.name = game.players[index].name;
        player.emoji = game.players[index].emoji;
      });
      return JSON.stringify(state);
    });

    savePlayerPrefs();
    closeOverlay('playersModal');
    render();
    showToast('Players updated.');
  }

  function openRules() {
    closeOverlay('menuModal');
    openOverlay('rulesModal');
  }

  function openHistory() {
    closeOverlay('menuModal');
    renderHistory();
    openOverlay('historyModal');
  }

  function openRestart() {
    closeOverlay('menuModal');
    openOverlay('restartModal');
  }

  function restartGame() {
    const players = game.players.map(p => ({name:p.name,emoji:p.emoji}));
    game = freshGame(players);
    undoStack = [];
    mode = 'move';
    orientation = 'H';
    document.querySelectorAll('.overlay.show').forEach(node => node.classList.remove('show'));
    render();
    showToast('New game started.');
  }

  function showWinner() {
    const player = game.players[game.winner];
    el('winnerIcon').textContent = player.emoji;
    el('winnerTitle').textContent = `${player.name} wins!`;
    el('winnerText').textContent = `${player.name} reached the opposite edge after ${game.moves.length} action${game.moves.length === 1 ? '' : 's'}.`;
    openOverlay('winnerModal');
  }

  function bindEvents() {
    el('moveMode').addEventListener('click',() => setMode('move'));
    el('wallMode').addEventListener('click',() => setMode('wall'));
    el('horizontal').addEventListener('click',() => setOrientation('H'));
    el('vertical').addEventListener('click',() => setOrientation('V'));
    el('undoBtn').addEventListener('click',undo);
    el('menuBtn').addEventListener('click',() => openOverlay('menuModal'));

    [
      ['playersBtn',openPlayers],['playersRailBtn',openPlayers],
      ['rulesBtn',openRules],['rulesRailBtn',openRules],
      ['historyBtn',openHistory],['historyRailBtn',openHistory],
      ['restartBtn',openRestart],['restartRailBtn',openRestart]
    ].forEach(([id,handler]) => el(id).addEventListener('click',handler));

    el('savePlayers').addEventListener('click',savePlayers);
    el('confirmRestart').addEventListener('click',restartGame);
    el('playAgain').addEventListener('click',restartGame);

    document.querySelectorAll('[data-close]').forEach(button => {
      button.addEventListener('click',() => closeOverlay(button.dataset.close));
    });

    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.addEventListener('click',event => {
        if (event.target === overlay) closeOverlay(overlay.id);
      });
    });

    document.addEventListener('keydown',event => {
      if (event.key === 'Escape') {
        document.querySelectorAll('.overlay.show').forEach(node => node.classList.remove('show'));
      }
    });

    window.addEventListener('resize',fitBoard);
    window.visualViewport?.addEventListener('resize',fitBoard);
    if ('ResizeObserver' in window) {
      new ResizeObserver(fitBoard).observe(boardStage);
    }
  }

  game = freshGame();
  bindEvents();
  render();
})();