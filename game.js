const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const timerDisplay = document.getElementById("timer");
const muteBtn = document.getElementById("muteBtn");

const urlParams = new URLSearchParams(window.location.search);
const level = parseInt(urlParams.get("level")) || 1;

const rows = 10 + level;  // more rows/cols as level increases
const cols = 10 + level;
const cellSize = canvas.width / cols;

let maze = [];
let visited = [];

let player = { x: 0, y: 0 }; // start top-left
const goal = { x: cols - 1, y: rows - 1 }; // finish bottom-right

// Timer
let seconds = 0;
let timer = setInterval(() => {
  seconds++;
  timerDisplay.textContent = "Time: " + seconds + "s";
}, 1000);

// Background music
let audio = new Audio("background.mp3");
audio.loop = true;
audio.play();

muteBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    muteBtn.textContent = "🔊 Mute Music";
  } else {
    audio.pause();
    muteBtn.textContent = "🔈 Play Music";
  }
});

// Recursive Backtracking Maze Generation
function generateMaze() {
  for (let y = 0; y < rows; y++) {
    maze[y] = [];
    visited[y] = [];
    for (let x = 0; x < cols; x++) {
      maze[y][x] = { top: true, right: true, bottom: true, left: true };
      visited[y][x] = false;
    }
  }

  function carve(x, y) {
    visited[y][x] = true;
    const directions = ["top", "right", "bottom", "left"].sort(() => Math.random() - 0.5);

    for (let dir of directions) {
      let nx = x, ny = y;
      if (dir === "top") ny--;
      if (dir === "bottom") ny++;
      if (dir === "left") nx--;
      if (dir === "right") nx++;

      if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && !visited[ny][nx]) {
        // remove walls between cells
        if (dir === "top") {
          maze[y][x].top = false;
          maze[ny][nx].bottom = false;
        }
        if (dir === "bottom") {
          maze[y][x].bottom = false;
          maze[ny][nx].top = false;
        }
        if (dir === "left") {
          maze[y][x].left = false;
          maze[ny][nx].right = false;
        }
        if (dir === "right") {
          maze[y][x].right = false;
          maze[ny][nx].left = false;
        }
        carve(nx, ny);
      }
    }
  }

  carve(0, 0); // start carving from top-left
}

// Draw Maze
function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = maze[y][x];
      const x1 = x * cellSize;
      const y1 = y * cellSize;

      if (cell.top) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + cellSize, y1);
        ctx.stroke();
      }
      if (cell.right) {
        ctx.beginPath();
        ctx.moveTo(x1 + cellSize, y1);
        ctx.lineTo(x1 + cellSize, y1 + cellSize);
        ctx.stroke();
      }
      if (cell.bottom) {
        ctx.beginPath();
        ctx.moveTo(x1, y1 + cellSize);
        ctx.lineTo(x1 + cellSize, y1 + cellSize);
        ctx.stroke();
      }
      if (cell.left) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1, y1 + cellSize);
        ctx.stroke();
      }
    }
  }

  // Draw player (shrimp)
  ctx.font = `${cellSize * 0.8}px Arial`;
  ctx.fillText("🦐", player.x * cellSize + cellSize / 6, player.y * cellSize + cellSize * 0.8);

  // Draw goal
  ctx.fillStyle = "yellow";
  ctx.fillRect(goal.x * cellSize + cellSize * 0.25, goal.y * cellSize + cellSize * 0.25, cellSize / 2, cellSize / 2);
}

// Move player with collision detection
function movePlayer(dx, dy) {
  const cell = maze[player.y][player.x];
  if (dx === -1 && !cell.left) player.x--;
  if (dx === 1 && !cell.right) player.x++;
  if (dy === -1 && !cell.top) player.y--;
  if (dy === 1 && !cell.bottom) player.y++;

  if (player.x === goal.x && player.y === goal.y) {
    clearInterval(timer);
    setTimeout(() => {
      alert(`🎉 Congratulations! You finished Level ${level} in ${seconds} seconds!`);
      window.location.href = "index.html";
    }, 200);
  }

  drawMaze();
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") movePlayer(0, -1);
  if (e.key === "ArrowDown") movePlayer(0, 1);
  if (e.key === "ArrowLeft") movePlayer(-1, 0);
  if (e.key === "ArrowRight") movePlayer(1, 0);
});

// Initialize game
generateMaze();
drawMaze();
