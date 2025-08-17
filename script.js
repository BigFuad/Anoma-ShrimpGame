// Canvas and maze setup

const canvas = document.getElementById('maze-canvas');
const ctx = canvas.getContext('2d');

// Starting cell size and maze parameters
const baseCellSize = 50;
const minRows = 8;
const minCols = 18;

// Maze data
let maze = [];
let rows, cols, cellSize;

let playerPos = { x: 1, y: 1 };
let exitPos;

// Elements
const landing = document.getElementById('landing');
const playBtn = document.getElementById('play-btn');
const difficultyInput = document.getElementById('difficulty');
const game = document.getElementById('game');
const timerDisplay = document.getElementById('timer');
const muteBtn = document.getElementById('mute-btn');
const winPopup = document.getElementById('win-popup');
const restartBtn = document.getElementById('restart-btn');
const winMessage = document.getElementById('win-message');

// Images
const shrimpImg = new Image();
shrimpImg.src = 'assets/shrimp.png';

const bgMusic = new Audio('assets/game-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

let timer = 0;
let timerInterval;
let gameStarted = false;
let audioPlaying = true;

// Utility function to generate a maze using recursive division or a simpler algorithm for demo
function generateMaze(level) {
  // Adjust rows and cols based on level (scale from min size to bigger)
  rows = minRows + Math.floor((level - 1) * 0.5); // increase slowly up to ~18 rows
  cols = minCols + Math.floor((level - 1));       // columns increase faster up to ~38 cols
  cellSize = Math.min(canvas.width / cols, canvas.height / rows);

  // Create maze grid full of paths (0)
  maze = Array(rows).fill().map(() => Array(cols).fill(0));

  // Add walls (1) randomly with increasing density via level
  const wallDensity = 0.15 + (level * 0.025); // 15% to ~65%

  for(let y=0; y<rows; y++) {
    for(let x=0; x<cols; x++) {
      // Border walls
      if(y === 0 || y === rows-1 || x === 0 || x === cols-1) {
        maze[y][x] = 1;
        continue;
      }

      // Random walls probabilistically
      if(Math.random() < wallDensity) {
        maze[y][x] = 1;
      }
    }
  }

  // Clear start and exit positions
  playerPos = { x: 1, y: 1 };
  exitPos = { x: cols-2, y: rows-2 };
  maze[playerPos.y][playerPos.x] = 0;
  maze[exitPos.y][exitPos.x] = 0;
}

function resizeCanvas() {
  // Match canvas size to container for responsive design
  const container = document.getElementById('maze-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientWidth / (cols / rows);

  // Recalculate cell size for canvas
  cellSize = canvas.width / cols;
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'red';

  for(let y=0; y<rows; y++) {
    for(let x=0; x<cols; x++) {
      if(maze[y][x] === 1){
        ctx.fillStyle = '#111';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Exit indicator
  ctx.fillStyle = 'white';
  ctx.font = `${cellSize / 3}px Arial Black`;
  ctx.fillText('LEG!', exitPos.x * cellSize + cellSize/10, exitPos.y * cellSize + cellSize / 1.5);

  // Draw shrimp with faint glow
  ctx.shadowColor = 'red';
  ctx.shadowBlur = 10;
  ctx.drawImage(shrimpImg, playerPos.x * cellSize + cellSize*0.1, playerPos.y * cellSize + cellSize*0.1, cellSize*0.8, cellSize*0.8);
  ctx.shadowBlur = 0;
}

function isWalkable(x, y){
  return (y >= 0 && y < rows && x >=0 && x < cols && maze[y][x] === 0);
}

function movePlayer(dx, dy){
  if(!gameStarted) return;
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;
  if(isWalkable(newX, newY)){
    playerPos.x = newX;
    playerPos.y = newY;
    drawMaze();
    checkWin();
  }
}

function checkWin(){
  if(playerPos.x === exitPos.x && playerPos.y === exitPos.y){
    stopGame();
    showWinPopup();
  }
}

function startTimer(){
  timer = 0;
  timerDisplay.textContent = `Time: 0.00 s`;
  timerInterval = setInterval(() => {
    timer += 0.1;
    timerDisplay.textContent = `Time: ${timer.toFixed(2)} s`;
  }, 100);
}

function stopTimer(){
  clearInterval(timerInterval);
}

function startGame(){
  const level = Number(difficultyInput.value);
  if(level < 1 || level > 20 || isNaN(level)) {
    alert("Difficulty level must be between 1 and 20");
    return;
  }
  generateMaze(level);
  resizeCanvas();
  playerPos = { x: 1, y: 1 };
  drawMaze();
  startTimer();
  gameStarted = true;
  winPopup.classList.add('hidden');
  landing.classList.add('hidden');
  game.classList.remove('hidden');
  bgMusic.play();
}

function stopGame(){
  gameStarted = false;
  stopTimer();
  bgMusic.pause();
}

function showWinPopup(){
  winMessage.textContent = `🎉 Congratulations! You escaped the maze in ${timer.toFixed(2)} seconds! 🎉`;
  winPopup.classList.remove('hidden');
  game.classList.add('hidden');
}

function onResize(){
  if(gameStarted) {
    resizeCanvas();
    drawMaze();
  }
}

// Event handlers
playBtn.onclick = () => { startGame(); };
restartBtn.onclick = () => { startGame(); };

muteBtn.onclick = () => {
  if(audioPlaying){
    bgMusic.pause();
    muteBtn.textContent = 'Unmute';
    muteBtn.setAttribute('aria-pressed', 'true');
  } else {
    bgMusic.play();
    muteBtn.textContent = 'Mute';
    muteBtn.setAttribute('aria-pressed', 'false');
  }
  audioPlaying = !audioPlaying;
};

// Keyboard controls
window.addEventListener('keydown', e => {
  if(!gameStarted) return;
  switch(e.key){
    case 'ArrowUp': movePlayer(0, -1); break;
    case 'ArrowDown': movePlayer(0, 1); break;
    case 'ArrowLeft': movePlayer(-1, 0); break;
    case 'ArrowRight': movePlayer(1, 0); break;
  }
});

// Onscreen buttons
document.getElementById('up').onclick = () => movePlayer(0, -1);
document.getElementById('down').onclick = () => movePlayer(0, 1);
document.getElementById('left').onclick = () => movePlayer(-1, 0);
document.getElementById('right').onclick = () => movePlayer(1, 0);

// Handle resizing for responsiveness
window.addEventListener('resize', onResize);

shrimpImg.onload = () => {
  // Set initial canvas size
  resizeCanvas();
};
