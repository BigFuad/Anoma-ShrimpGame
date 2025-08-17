const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

let maze = [];
let cellSize = 30;
let rows, cols;
let player = { x: 0, y: 0 };
let goal = {};
let timer = 0;
let timerInterval;
let level = 1;

const bgMusic = document.getElementById("bgMusic");

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.6;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Generate maze with DFS backtracking
function generateMaze(r, c) {
  rows = r;
  cols = c;
  maze = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(1));

  function carve(x, y) {
    maze[y][x] = 0;
    const dirs = [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ];
    dirs.sort(() => Math.random() - 0.5);
    for (let [dx, dy] of dirs) {
      let nx = x + dx,
        ny = y + dy;
      if (nx > 0 && nx < cols && ny > 0 && ny < rows && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  // Define start and goal
  player = { x: 1, y: 1 };
  goal = { x: cols - 2, y: rows - 2 };
  maze[player.y][player.x] = 0;
  maze[goal.y][goal.x] = 0;
}

// Draw maze (just thin red lines for walls)
function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "red"; // Thin red lines
  ctx.lineWidth = 1;

  const w = canvas.width / cols;
  const h = canvas.height / rows;
  cellSize = Math.min(w, h);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y][x] === 1) {
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Draw goal
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(
    goal.x * cellSize + cellSize / 2,
    goal.y * cellSize + cellSize / 2,
    cellSize / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw shrimp player
  ctx.font = `${cellSize * 0.8}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🦐", player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2);
}

// Timer
function startTimer() {
  timer = 0;
  document.getElementById("timer").innerText = `Time: 0s`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    document.getElementById("timer").innerText = `Time: ${timer}s`;
  }, 1000);
}

// Controls
function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 0) {
    player.x = nx;
    player.y = ny;
    drawMaze();
    checkWin();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") movePlayer(0, -1);
  if (e.key === "ArrowDown") movePlayer(0, 1);
  if (e.key === "ArrowLeft") movePlayer(-1, 0);
  if (e.key === "ArrowRight") movePlayer(1, 0);
});

document.querySelectorAll(".ctrl").forEach((btn) => {
  btn.addEventListener("click", () => {
    const dir = btn.dataset.dir;
    if (dir === "up") movePlayer(0, -1);
    if (dir === "down") movePlayer(0, 1);
    if (dir === "left") movePlayer(-1, 0);
    if (dir === "right") movePlayer(1, 0);
  });
});

// Win check
function checkWin() {
  if (player.x === goal.x && player.y === goal.y) {
    clearInterval(timerInterval);
    alert(`🎉 Congratulations! You escaped in ${timer}s 🎉`);
  }
}

// Start Game
document.getElementById("playBtn").addEventListener("click", () => {
  level = parseInt(document.getElementById("difficulty").value);
  let size = 10 + level; // Maze size grows with difficulty
  generateMaze(size, size);
  document.getElementById("landing").style.display = "none";
  document.getElementById("game").style.display = "block";
  bgMusic.play();
  startTimer();
  drawMaze();
});
