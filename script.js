const canvas = document.getElementById('maze-canvas');
const ctx = canvas.getContext('2d');

const baseCellSize = 40;
const minRows = 8;
const minCols = 18;

let maze = [];
let rows, cols, cellSize;

let playerPos = { x: 1, y: 1 };
let exitPos;

const landing = document.getElementById('landing');
const playBtn = document.getElementById('play-btn');
const difficultyInput = document.getElementById('difficulty');
const game = document.getElementById('game');
const timerDisplay = document.getElementById('timer');
const muteBtn = document.getElementById('mute-btn');
const winPopup = document.getElementById('win-popup');
const restartBtn = document.getElementById('restart-btn');
const winMessage = document.getElementById('win-message');

const shrimpImg = new Image();
shrimpImg.src = 'shrimp.png';

const bgMusic = new Audio('game-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

let timer = 0;
let timerInterval;
let gameStarted = false;
let audioPlaying = true;

function generateMaze(level) {
  rows = minRows + Math.floor(level / 2);
  cols = minCols + level;
  rows = Math.min(rows, 30);
  cols = Math.min(cols, 50);

  canvas.width = cols * baseCellSize;
  canvas.height = rows * baseCellSize;

  cellSize = baseCellSize;

  maze = Array(rows).fill().map(() => Array(cols).fill(0));

  for(let y = 0; y < rows; y++) {
    maze[y][0] = 1;
    maze[y][cols - 1] = 1;
  }
  for(let x = 0; x < cols; x++) {
    maze[x] = 1;
    maze[rows - 1][x] = 1;
  }

  const wallChance = 0.1 + level * 0.04;

  for(let y = 1; y < rows - 1; y++) {
    for(let x = 1; x < cols - 1; x++) {
      if(!(x === 1 && y === 1) && !(x === cols - 2 && y === rows - 2)) {
        maze[y][x] = (Math.random() < wallChance) ? 1 : 0;
      }
    }
  }

  playerPos = { x: 1, y: 1 };
  exitPos = { x: cols - 2, y: rows - 2 };
  maze[playerPos.y][playerPos.x] = 0;
  maze[exitPos.y][exitPos.x] = 0;
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'red';

  for(let y = 0; y < rows; y++) {
    for(let x = 0; x < cols; x++) {
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

  ctx.fillStyle = 'white';
  ctx.font = `${Math.floor(cellSize / 3)}px Arial Black`;
  ctx.fillText('LEG!', exitPos.x * cellSize + cellSize * 0.1, exitPos.y * cellSize + cellSize * 0.7);

  ctx.shadowColor = 'red';
  ctx.shadowBlur = 12;
  ctx.drawImage(shrimpImg, playerPos.x * cellSize + cellSize*0.1, playerPos.y * cellSize + cellSize*0.1, cellSize*0.8, cellSize*0.8);
  ctx.shadowBlur = 0;
}

function isWalkable(x, y) {
  return y >= 0 && y < rows && x >= 0 && x < cols && maze[y][x] === 0;
}

function movePlayer(dx, dy) {
  if(!gameStarted) return;
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;
  if(isWalkable(newX, newY)) {
    playerPos.x = newX;
    playerPos.y = newY;
    drawMaze();
    checkWin();
  }
}

function checkWin() {
  if(playerPos.x === exitPos.x && playerPos.y === exitPos.y) {
    stopGame();
    showWinPopup();
  }
}

function startTimer() {
  timer = 0;
  timerDisplay.textContent = `Time: 0.00 s`;
  timerInterval = setInterval(() => {
    timer += 0.1;
    timerDisplay.textContent = `Time: ${timer.toFixed(2)} s`;
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function startGame() {
  const level = Number(difficultyInput.value);
  if(level < 1 || level > 20 || isNaN(level)) {
    alert("Difficulty level must be between 1 and 20");
    return;
  }
  generateMaze(level);
  drawMaze();
  startTimer();
  gameStarted = true;
  winPopup.classList.add('hidden');
  landing.classList.add('hidden');
  game.classList.remove('hidden');
  bgMusic.play();
}

function stopGame() {
  gameStarted = false;
  stopTimer();
  bgMusic.pause();
}

function showWinPopup() {
  winMessage.textContent = `🎉 Congratulations! You escaped the maze in ${timer.toFixed(2)} seconds! 🎉`;
  winPopup.classList.remove('hidden');
  game.classList.add('hidden');
}

playBtn.onclick = () => startGame();
restartBtn.onclick = () => startGame();

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

window.addEventListener('keydown', e => {
  if(!gameStarted) return;
  switch(e.key){
    case 'ArrowUp': movePlayer(0, -1); break;
    case 'ArrowDown': movePlayer(0, 1); break;
    case 'ArrowLeft': movePlayer(-1, 0); break;
    case 'ArrowRight': movePlayer(1, 0); break;
  }
});

document.getElementById('up').onclick = () => movePlayer(0, -1);
document.getElementById('down').onclick = () => movePlayer(0, 1);
document.getElementById('left').onclick = () => movePlayer(-1, 0);
document.getElementById('right').onclick = () => movePlayer(1, 0);

shrimpImg.onload = () => drawMaze();
