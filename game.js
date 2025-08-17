// game.js
// Maze: recursive backtracker with thin red glowing walls.
// Player: shrimp emoji 🦐
// Difficulty: 1..20 -> size 11..45
// Place mage.png and music.mp3 in the same folder as these files.

document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const levelSelect = document.getElementById('levelSelect');
  const playBtn = document.getElementById('btn-play');
  const landing = document.getElementById('landing');
  const gameScreen = document.getElementById('game-screen');
  const canvas = document.getElementById('maze');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hudTime = document.getElementById('hud-time');
  const hudLevel = document.getElementById('hud-level');
  const hudSize = document.getElementById('hud-size');
  const btnRestart = document.getElementById('btn-restart');
  const btnExit = document.getElementById('btn-exit');
  const bgm = document.getElementById('bgm');

  const winModal = document.getElementById('winModal');
  const finalTimeEl = document.getElementById('final-time');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnCloseWin = document.getElementById('btn-close-win');

  // populate difficulty 1..20
  for (let i = 1; i <= 20; i++) {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `Level ${i}`;
    levelSelect.appendChild(o);
  }
  levelSelect.value = '1';

  // state
  let state = {
    level: 1,
    cols: 11,
    rows: 11,
    cell: 32,
    grid: [], // grid[r][c] = {c,r, v, N,E,S,W}
    player: { c: 1, r: 1 },
    start: { c: 1, r: 1 },
    end: { c: 1, r: 1 },
    startedAt: 0,
    animId: 0,
    finished: false,
    canvasW: 0,
    canvasH: 0
  };

  // helpers
  function levelToSize(level) {
    const min = 11, max = 45;
    let size = Math.round(min + (max - min) * ((level - 1) / 19));
    if (size % 2 === 0) size++;
    return size;
  }

  function setCanvasSize(cols, rows) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxPx = Math.min(window.innerWidth * 0.94, window.innerHeight * 0.72);
    const cell = Math.max(6, Math.floor(maxPx / Math.max(cols, rows)));
    state.cell = cell;
    const w = cell * cols, h = cell * rows;
    state.canvasW = w; state.canvasH = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // recursive backtracker
  function genMaze(cols, rows) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({ c, r, v: false, N: true, E: true, S: true, W: true });
      }
      grid.push(row);
    }

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    const stack = [];
    let current = grid[1][1];
    current.v = true;
    let visited = 1, total = cols * rows;

    function neighbors(cell) {
      const res = [];
      const { c, r } = cell;
      if (r > 1) res.push(['N', grid[r - 1][c]]);
      if (c < cols - 2) res.push(['E', grid[r][c + 1]]);
      if (r < rows - 2) res.push(['S', grid[r + 1][c]]);
      if (c > 1) res.push(['W', grid[r][c - 1]]);
      return shuffle(res);
    }

    while (visited < total) {
      const nbs = neighbors(current).filter(([, n]) => !n.v);
      if (nbs.length > 0) {
        const [dir, nxt] = nbs[0];
        stack.push(current);
        if (dir === 'N') { current.N = false; nxt.S = false; }
        if (dir === 'E') { current.E = false; nxt.W = false; }
        if (dir === 'S') { current.S = false; nxt.N = false; }
        if (dir === 'W') { current.W = false; nxt.E = false; }
        current = nxt;
        current.v = true;
        visited++;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else break;
    }

    const start = grid[1][1];
    const end = grid[rows - 2][cols - 2];
    return { grid, start: { c: start.c, r: start.r }, end: { c: end.c, r: end.r } };
  }

  // draw maze with thin red glowing lines and shrimp emoji
  function draw() {
    const cols = state.cols, rows = state.rows, cell = state.cell;
    // background (use logical canvas size)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, state.canvasW, state.canvasH);

    // walls - thin red lines with glow
    ctx.lineWidth = Math.max(1, Math.floor(cell * 0.10));
    ctx.strokeStyle = '#ff3040';
    ctx.shadowColor = 'rgba(255,48,64,0.35)';
    ctx.shadowBlur = Math.max(1, Math.floor(cell * 0.35));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellObj = state.grid[r][c];
        const x = c * cell, y = r * cell;
        if (cellObj.N) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
        if (cellObj.W) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
        // draw south/east borders only on last row/col
        if (r === rows - 1 && cellObj.S) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
        if (c === cols - 1 && cellObj.E) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
      }
    }

    // goal highlight (green)
    const gx = state.end.c * cell, gy = state.end.r * cell;
    ctx.shadowBlur = Math.floor(cell * 0.9);
    ctx.shadowColor = 'rgba(60,255,140,0.35)';
    ctx.fillStyle = 'rgba(60,255,140,0.18)';
    ctx.fillRect(gx + cell * 0.18, gy + cell * 0.18, cell * 0.64, cell * 0.64);

    // shrimp emoji with glow
    const px = state.player.c * cell + cell / 2;
    const py = state.player.r * cell + cell / 2;
    ctx.shadowBlur = Math.floor(cell * 0.7);
    ctx.shadowColor = 'rgba(255,48,64,0.35)';
    ctx.font = `${Math.floor(cell * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🦐', px, py);
    ctx.shadowBlur = 0;
  }

  // movement rules based on walls
  function canMove(dir) {
    const { c, r } = state.player;
    const cellObj = state.grid[r][c];
    if (!cellObj) return false;
    if (dir === 'up') return !cellObj.N;
    if (dir === 'down') return !cellObj.S;
    if (dir === 'left') return !cellObj.W;
    if (dir === 'right') return !cellObj.E;
    return false;
  }

  function move(dir) {
    if (state.finished) return;
    let { c, r } = state.player;
    if (!canMove(dir)) return;
    if (dir === 'up') r--;
    if (dir === 'down') r++;
    if (dir === 'left') c--;
    if (dir === 'right') c++;
    // bounds safety
    if (r < 0 || c < 0 || r >= state.rows || c >= state.cols) return;
    state.player.c = c; state.player.r = r;
    draw();
    checkWin();
  }

  // timer / HUD
  function startTimer() {
    state.startedAt = performance.now();
    hudTime.textContent = '0.0';
    cancelAnimationFrame(state.animId);
    function tick() {
      if (state.finished) return;
      const t = (performance.now() - state.startedAt) / 1000;
      hudTime.textContent = t.toFixed(1);
      state.animId = requestAnimationFrame(tick);
    }
    tick();
  }

  function checkWin() {
    if (state.player.c === state.end.c && state.player.r === state.end.r) {
      state.finished = true;
      const t = (performance.now() - state.startedAt) / 1000;
      finalTimeEl.textContent = t.toFixed(2);
      winModal.style.display = 'flex';
      winModal.setAttribute('aria-hidden', 'false');
      try { bgm.pause(); } catch (e) {}
    }
  }

  // start a level
  function startLevel(level) {
    state.level = level;
    const size = levelToSize(level);
    state.cols = size; state.rows = size;
    const { grid, start, end } = genMaze(size, size);
    state.grid = grid;
    state.start = start; state.end = end;
    state.player = { c: start.c, r: start.r };
    setCanvasSize(size, size);
    hudLevel.textContent = String(level);
    hudSize.textContent = `${size}×${size}`;
    state.finished = false;
    draw();
    startTimer();
  }

  // UI wiring
  playBtn.addEventListener('click', () => {
    // user gesture -> attempt to play bgm
    try { bgm.volume = 0.45; bgm.play().catch(()=>{}); } catch (e) {}
    landing.style.display = 'none';
    gameScreen.hidden = false;
    const lvl = parseInt(levelSelect.value) || 1;
    startLevel(lvl);
  });

  // D-pad
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => move(btn.dataset.dir));
    btn.addEventListener('pointerdown', () => btn.classList.add('active'));
    btn.addEventListener('pointerup', () => btn.classList.remove('active'));
    btn.addEventListener('pointerleave', () => btn.classList.remove('active'));
  });

  // keyboard
  window.addEventListener('keydown', (e) => {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' };
    const dir = map[e.key];
    if (dir) { e.preventDefault(); move(dir); }
  });

  // restart/exit/win actions
  btnRestart.addEventListener('click', () => startLevel(state.level));
  btnExit.addEventListener('click', () => {
    try { bgm.pause(); } catch (e) {}
    gameScreen.hidden = true;
    landing.style.display = '';
    winModal.style.display = 'none';
  });

  btnPlayAgain.addEventListener('click', () => {
    winModal.style.display = 'none';
    try { bgm.currentTime = 0; bgm.play().catch(()=>{}); } catch (e) {}
    startLevel(state.level);
  });
  btnCloseWin.addEventListener('click', () => { winModal.style.display = 'none'; });

  // responsive resize
  window.addEventListener('resize', () => {
    if (!gameScreen.hidden) {
      setCanvasSize(state.cols, state.rows);
      draw();
    }
  });

}); // DOMContentLoaded end
