// game.js
// Thin red-line recursive maze, shrimp emoji player, difficulty 1..20,
// restart button, prevent double-tap zoom, controls glow, responsive canvas.

document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const levelSelect = document.getElementById('levelSelect');
  const btnPlay = document.getElementById('btn-play');
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
  const dpad = document.getElementById('dpad');
  const winModal = document.getElementById('winModal');
  const finalTimeEl = document.getElementById('final-time');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnCloseWin = document.getElementById('btn-close-win');

  // fill level selector 1..20
  for (let i = 1; i <= 20; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Level ${i}`;
    levelSelect.appendChild(opt);
  }
  levelSelect.value = '1';

  // state
  const state = {
    level: 1,
    cols: 11,
    rows: 11,
    cell: 24,
    grid: [], // grid[r][c] = {c,r,v,N,E,S,W}
    player: { c: 1, r: 1 },
    start: { c: 1, r: 1 },
    end: { c: 1, r: 1 },
    startedAt: 0,
    animId: 0,
    finished: false,
    canvasW: 0,
    canvasH: 0
  };

  // map level to odd size (11..45)
  function levelToSize(level) {
    const min = 11, max = 45;
    let size = Math.round(min + (max - min) * ((level - 1) / 19));
    if (size % 2 === 0) size++;
    return size;
  }

  // responsive canvas sizing
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

  // recursive backtracker generator (cell walls)
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

    // start & end inside border
    const start = grid[1][1];
    const end = grid[rows - 2][cols - 2];
    return { grid, start: { c: start.c, r: start.r }, end: { c: end.c, r: end.r } };
  }

  // draw thin straight red lines for walls and the shrimp emoji
  function draw() {
    const cols = state.cols, rows = state.rows, cell = state.cell;
    // fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, state.canvasW, state.canvasH);

    // thin red lines (no heavy glow)
    ctx.lineWidth = Math.max(1, Math.floor(cell * 0.06));
    ctx.strokeStyle = '#ff3040';
    ctx.shadowBlur = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellObj = state.grid[r][c];
        const x = c * cell, y = r * cell;
        // draw top & left walls for each cell, draw bottom/right on edges
        if (cellObj.N) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
        if (cellObj.W) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
        if (r === rows - 1 && cellObj.S) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
        if (c === cols - 1 && cellObj.E) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
      }
    }

    // draw goal (green square)
    const gx = state.end.c * cell, gy = state.end.r * cell;
    ctx.fillStyle = '#39d353';
    ctx.fillRect(gx + cell * 0.18, gy + cell * 0.18, cell * 0.64, cell * 0.64);

    // draw shrimp emoji
    const px = state.player.c * cell + cell / 2;
    const py = state.player.r * cell + cell / 2;
    ctx.font = `${Math.floor(cell * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('🦐', px, py);
  }

  // movement check using cell wall flags
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
    if (r < 0 || c < 0 || r >= state.rows || c >= state.cols) return;
    state.player.c = c; state.player.r = r;
    draw();
    checkWin();
  }

  // timer with RAF for accurate display
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
  function startLevel(levelVal) {
    state.level = levelVal;
    const size = levelToSize(levelVal);
    state.cols = size; state.rows = size;
    const { grid, start, end } = genMaze(size, size);
    state.grid = grid;
    state.start = start; state.end = end;
    state.player = { c: start.c, r: start.r };
    setCanvasSize(size, size);
    hudLevel.textContent = String(levelVal);
    hudSize.textContent = `${size}×${size}`;
    state.finished = false;
    draw();
    startTimer();
  }

  // UI wiring
  btnPlay.addEventListener('click', () => {
    try { bgm.volume = 0.45; bgm.play().catch(()=>{}); } catch (e) {}
    landing.style.display = 'none';
    gameScreen.hidden = false;
    dpad.setAttribute('aria-hidden', 'false');
    dpad.style.display = 'grid';
    const lvl = parseInt(levelSelect.value) || 1;
    startLevel(lvl);
  });

  // D-pad handlers
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => move(btn.dataset.dir));
    // visual press (glow handled by CSS active)
  });

  // keyboard
  window.addEventListener('keydown', (e) => {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' };
    const dir = map[e.key];
    if (dir) { e.preventDefault(); move(dir); }
  });

  // restart & exit
  btnRestart.addEventListener('click', () => {
    startLevel(state.level);
    try { bgm.currentTime = 0; bgm.play().catch(()=>{}); } catch {}
    winModal.style.display = 'none';
  });
  btnExit.addEventListener('click', () => {
    try { bgm.pause(); } catch (e) {}
    gameScreen.hidden = true;
    landing.style.display = '';
    dpad.setAttribute('aria-hidden', 'true');
    dpad.style.display = 'none';
    winModal.style.display = 'none';
  });

  btnPlayAgain.addEventListener('click', () => {
    winModal.style.display = 'none';
    startLevel(state.level);
    try { bgm.currentTime = 0; bgm.play().catch(()=>{}); } catch {}
  });
  btnCloseWin.addEventListener('click', () => { winModal.style.display = 'none'; });

  // responsive: resize canvas on window resize
  window.addEventListener('resize', () => {
    if (!gameScreen.hidden) {
      setCanvasSize(state.cols, state.rows);
      draw();
    }
  });

  // prevent double-tap zoom on mobile (touch)
  let lastTouch = 0;
  document.addEventListener('touchstart', function (e) {
    const now = Date.now();
    if (now - lastTouch <= 300) {
      e.preventDefault();
    }
    lastTouch = now;
  }, { passive: false });

  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // initialize: hide dpad initially
  dpad.style.display = 'none';
});
