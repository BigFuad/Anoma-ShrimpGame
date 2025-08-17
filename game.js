// Anoma Shrimp Game
// Features: landing with difficulty (1..20), thin red-line maze, shrimp character, timer, on-screen arrows,
// background music hook, win popup with cheering mages.
// Maze generator: recursive backtracker. Drawing uses thin red walls with glow.

const landing = document.getElementById('landing');
const gameScreen = document.getElementById('game-screen');
const levelSelect = document.getElementById('level-select');
const btnPlay = document.getElementById('btn-play');
const mazeCanvas = document.getElementById('maze');
const ctx = mazeCanvas.getContext('2d');
const hudTime = document.getElementById('hud-time');
const hudLevel = document.getElementById('hud-level');
const hudSize = document.getElementById('hud-size');
const btnRestart = document.getElementById('btn-restart');
const btnExit = document.getElementById('btn-exit');
const bgm = document.getElementById('bgm');

const winModal = document.getElementById('win-modal');
const finalTimeEl = document.getElementById('final-time');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnCloseModal = document.getElementById('btn-close-modal');

// Populate level selector 1..20
for (let i=1;i<=20;i++){
  const o = document.createElement('option');
  o.value = String(i);
  o.textContent = String(i);
  levelSelect.appendChild(o);
}
levelSelect.value = '1';

// Optionally set background music source (drop a file named assets/music.mp3)
fetch('assets/music.mp3', {method: 'HEAD'}).then(r=>{
  if (r.ok) bgm.src = 'assets/music.mp3';
}).catch(()=>{});

// Game state
const state = {
  cols: 0, rows: 0, cell: 0,
  grid: [], // cells, each has walls: N E S W booleans
  start: {c:0,r:0}, end: {c:0,r:0},
  player: {c:0,r:0, px:0, py:0},
  startedAt: 0, finished: false,
  animId: 0,
  level: 1,
};

// Helpers
function levelToSize(level){
  // Level 1 -> 11x11, Level 20 -> 45x45 (odd sizes for maze consistency)
  const min = 11, max = 45;
  const size = Math.round(min + (max-min) * ((level-1)/19));
  return size % 2 === 0 ? size+1 : size;
}
function setCanvasSize(cols, rows){
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  const maxPx = Math.min(900, Math.min(window.innerWidth*0.9, 900));
  const size = Math.min(maxPx, Math.min(window.innerHeight*0.6, maxPx));
  const cell = Math.floor(size / Math.max(cols, rows));
  state.cell = Math.max(8, cell);
  mazeCanvas.style.width = (state.cell*cols) + 'px';
  mazeCanvas.style.height = (state.cell*rows) + 'px';
  mazeCanvas.width = Math.floor(state.cell*cols*dpr);
  mazeCanvas.height = Math.floor(state.cell*rows*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

// Maze generation (recursive backtracker)
function genMaze(cols, rows){
  // grid cells with walls true
  const grid = [];
  for (let r=0;r<rows;r++){
    const row = [];
    for (let c=0;c<cols;c++){
      row.push({c,r, v:false, N:true,E:true,S:true,W:true});
    }
    grid.push(row);
  }
  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
  const stack = [];
  const startR = 1, startC = 1; // start near top-left
  let current = grid[startR][startC];
  current.v = true;
  let visited = 1, total = cols*rows;

  function neighbors(cell){
    const res = [];
    const {c,r} = cell;
    if (r>1) res.push(['N', grid[r-1][c]]);
    if (c<cols-2) res.push(['E', grid[r][c+1]]);
    if (r<rows-2) res.push(['S', grid[r+1][c]]);
    if (c>1) res.push(['W', grid[r][c-1]]);
    return shuffle(res);
  }
  while (visited < total){
    const nbs = neighbors(current).filter(([,n])=>!n.v);
    if (nbs.length>0){
      const [dir, nxt] = nbs[0];
      stack.push(current);
      // knock down wall
      if (dir==='N'){ current.N=false; nxt.S=false; }
      if (dir==='E'){ current.E=false; nxt.W=false; }
      if (dir==='S'){ current.S=false; nxt.N=false; }
      if (dir==='W'){ current.W=false; nxt.E=false; }
      current = nxt; current.v = true; visited++;
    } else if (stack.length>0){
      current = stack.pop();
    } else break;
  }

  // Define start/end farther apart
  const start = grid[1][1];
  const end = grid[rows-2][cols-2];
  return {grid, start:{c:start.c,r:start.r}, end:{c:end.c,r:end.r}};
}

function startLevel(level){
  state.level = level;
  const size = levelToSize(level);
  state.cols = size; state.rows = size;
  const {grid, start, end} = genMaze(size, size);
  state.grid = grid;
  state.start = start; state.end = end;
  state.player.c = start.c; state.player.r = start.r;
  setCanvasSize(size, size);
  hudLevel.textContent = String(level);
  hudSize.textContent = `${size}×${size}`;
  state.startedAt = performance.now();
  state.finished = false;
  draw();
  cancelAnimationFrame(state.animId);
  updateTimer();
  // attempt autoplay music on user gesture has already occurred (Play)
  if (bgm.src) { bgm.volume = 0.5; bgm.play().catch(()=>{}); }
}

function updateTimer(){
  if (state.finished) return;
  const t = (performance.now() - state.startedAt)/1000;
  hudTime.textContent = t.toFixed(1);
  state.animId = requestAnimationFrame(updateTimer);
}

// Drawing thin red walls and shrimp
function draw(){
  const {cols, rows, cell} = state;
  // background
  ctx.fillStyle = '#0c0d19';
  ctx.fillRect(0,0,mazeCanvas.width, mazeCanvas.height);

  // walls as thin red lines with glow
  ctx.lineWidth = Math.max(1, Math.floor(cell * 0.12));
  ctx.strokeStyle = '#ff3040';
  ctx.shadowColor = 'rgba(255,48,64,0.35)';
  ctx.shadowBlur = Math.floor(cell*0.35);

  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const cellObj = state.grid[r][c];
      const x = c*cell, y = r*cell;
      if (cellObj.N) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+cell, y); ctx.stroke(); }
      if (cellObj.W) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y+cell); ctx.stroke(); }
      // Only draw south/east borders on last row/col to avoid duplicates
      if (r===rows-1 && cellObj.S){ ctx.beginPath(); ctx.moveTo(x, y+cell); ctx.lineTo(x+cell, y+cell); ctx.stroke(); }
      if (c===cols-1 && cellObj.E){ ctx.beginPath(); ctx.moveTo(x+cell, y); ctx.lineTo(x+cell, y+cell); ctx.stroke(); }
    }
  }

  // Shrimp (emoji + glow)
  const px = state.player.c*cell + cell/2;
  const py = state.player.r*cell + cell/2;
  ctx.shadowBlur = Math.floor(cell*0.6);
  ctx.shadowColor = 'rgba(255,48,64,0.35)';
  ctx.font = `${Math.floor(cell*0.7)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🦐', px, py);

  // Goal highlight (green glow square)
  const gx = state.end.c*cell, gy = state.end.r*cell;
  ctx.shadowBlur = Math.floor(cell*0.8);
  ctx.shadowColor = 'rgba(60,255,140,0.35)';
  ctx.fillStyle = 'rgba(60,255,140,0.2)';
  ctx.fillRect(gx+cell*0.2, gy+cell*0.2, cell*0.6, cell*0.6);
}

// Movement
function canMove(c,r,dir){
  const cell = state.grid[r][c];
  if (dir==='up')   return !cell.N;
  if (dir==='down') return !cell.S;
  if (dir==='left') return !cell.W;
  if (dir==='right')return !cell.E;
  return false;
}
function move(dir){
  if (state.finished) return;
  let {c,r} = state.player;
  if (!canMove(c,r,dir)) return;
  if (dir==='up') r--;
  if (dir==='down') r++;
  if (dir==='left') c--;
  if (dir==='right') c++;
  state.player.c = c; state.player.r = r;
  draw();
  // win?
  if (c===state.end.c && r===state.end.r){
    state.finished = true;
    const t = (performance.now() - state.startedAt)/1000;
    finalTimeEl.textContent = t.toFixed(2);
    if (typeof winModal.showModal === 'function') winModal.showModal();
    try{ bgm.pause(); }catch{}
  }
}

// Controls: keyboard + buttons
const KEYMAP = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',
                w:'up',a:'left',s:'down',d:'right', W:'up',A:'left',S:'down',D:'right'};
window.addEventListener('keydown', (e)=>{
  const d = KEYMAP[e.key]; if (d){ e.preventDefault(); move(d); }
});
document.querySelectorAll('.arrow').forEach(btn=>{
  btn.addEventListener('click', ()=> move(btn.dataset.dir));
  btn.addEventListener('pointerdown', ()=> btn.classList.add('press'));
  btn.addEventListener('pointerup', ()=> btn.classList.remove('press'));
  btn.addEventListener('pointerleave', ()=> btn.classList.remove('press'));
});

// Landing actions
btnPlay.addEventListener('click', ()=>{
  landing.hidden = true;
  gameScreen.hidden = false;
  const lvl = Number(levelSelect.value)||1;
  startLevel(lvl);
  // Try to play bgm after user gesture
  if (bgm.src){ bgm.volume = 0.5; bgm.play().catch(()=>{}); }
});
btnRestart.addEventListener('click', ()=> startLevel(state.level));
btnExit.addEventListener('click', ()=>{
  gameScreen.hidden = true;
  landing.hidden = false;
  try{ bgm.pause(); }catch{}
});

btnPlayAgain.addEventListener('click', ()=>{
  winModal.close();
  startLevel(state.level);
});
btnCloseModal.addEventListener('click', ()=> winModal.close());

// Responsive
window.addEventListener('resize', ()=>{
  if (!gameScreen.hidden) {
    setCanvasSize(state.cols, state.rows);
    draw();
  }
});
