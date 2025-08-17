const playBtn = document.getElementById("playBtn");
const landing = document.getElementById("landing");
const gameContainer = document.getElementById("gameContainer");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const timerDisplay = document.getElementById("timer");
const winPopup = document.getElementById("winPopup");
const finalTime = document.getElementById("finalTime");
const bgMusic = document.getElementById("bgMusic");

let cellSize, rows, cols, maze, shrimp, start, end, timer, timeElapsed, gameInterval;

playBtn.addEventListener("click", () => {
  landing.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  startGame();
  bgMusic.play().catch(e => console.log("Music blocked until user interaction"));
});

// Maze generator
function generateMaze(level) {
  rows = 6 + level;
  cols = 6 + level;
  cellSize = Math.floor(Math.min(window.innerWidth, window.innerHeight) / Math.max(rows, cols));

  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  maze = Array.from({ length: rows }, () => Array(cols).fill(0));

  // Fill walls randomly based on level
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < level * 0.05) maze[r][c] = 1; // wall
    }
  }

  start = { r: 0, c: 0 };
  end = { r: rows - 1, c: cols - 1 };
  maze[start.r][start.c] = 0;
  maze[end.r][end.c] = 0;

  shrimp = { r: start.r, c: start.c };
}

// Draw maze
function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // walls
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (maze[r][c] === 1) {
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  // shrimp (character)
  ctx.fillStyle = "yellow";
  ctx.shadowColor = "red";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(shrimp.c * cellSize + cellSize / 2, shrimp.r * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
  ctx.fill();

  // end (goal)
  ctx.shadowBlur = 0;
  ctx.fillStyle = "green";
  ctx.fillRect(end.c * cellSize + 5, end.r * cellSize + 5, cellSize - 10, cellSize - 10);
}

// Movement
function move(dir) {
  let nr = shrimp.r;
  let nc = shrimp.c;
  if (dir === "up") nr--;
  if (dir === "down") nr++;
  if (dir === "left") nc--;
  if (dir === "right") nc++;

  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 0) {
    shrimp.r = nr;
    shrimp.c = nc;
  }

  if (shrimp.r === end.r && shrimp.c === end.c) winGame();
}

document.getElementById("up").onclick = () => move("up");
document.getElementById("down").onclick = () => move("down");
document.getElementById("left").onclick = () => move("left");
document.getElementById("right").onclick = () => move("right");

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move("up");
  if (e.key === "ArrowDown") move("down");
  if (e.key === "ArrowLeft") move("left");
  if (e.key === "ArrowRight") move("right");
});

// Timer & Game loop
function startGame() {
  const level = parseInt(document.getElementById("difficulty").value);
  generateMaze(level);

  timeElapsed = 0;
  timerDisplay.textContent = "Time: 0s";

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    timeElapsed++;
    timerDisplay.textContent = `Time: ${timeElapsed}s`;
    drawMaze();
  }, 1000);

  drawMaze();
}

function winGame() {
  clearInterval(gameInterval);
  winPopup.classList.remove("hidden");
  finalTime.textContent = `You finished in ${timeElapsed} seconds!`;
}
