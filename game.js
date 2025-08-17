const playBtn = document.getElementById("playBtn");
const landing = document.getElementById("landing");
const game = document.getElementById("game");
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const bgMusic = document.getElementById("bgMusic");

let cellSize = 25;
let rows, cols;
let maze = [];
let player = {x:0, y:0};
let goal = {x:0, y:0};
let timer = 0;
let interval;

playBtn.addEventListener("click", () => {
  landing.style.display = "none";
  game.style.display = "block";
  bgMusic.play();

  const level = parseInt(document.getElementById("difficulty").value);
  setupMaze(level);
  startTimer();
});

function setupMaze(level) {
  rows = 10 + level; 
  cols = 10 + level;
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  maze = Array.from({length: rows}, () => Array(cols).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.25 && !(r===0 && c===0)) {
        maze[r][c] = 1; // wall
      }
    }
  }

  player = {x:0, y:0};
  goal = {x: cols-1, y: rows-1};

  drawMaze();
}

function drawMaze() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (maze[r][c] === 1) {
        ctx.strokeRect(c*cellSize, r*cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.fillText("🦐", player.x*cellSize + cellSize/4, player.y*cellSize + cellSize*0.75);
  ctx.fillText("🏁", goal.x*cellSize + cellSize/4, goal.y*cellSize + cellSize*0.75);
}

function movePlayer(dx,dy) {
  let nx = player.x+dx;
  let ny = player.y+dy;
  if (nx>=0 && ny>=0 && nx<cols && ny<rows && maze[ny][nx]===0) {
    player.x = nx;
    player.y = ny;
    drawMaze();
    if (player.x===goal.x && player.y===goal.y) {
      clearInterval(interval);
      setTimeout(()=>alert("🎉 Congratulations!"),200);
    }
  }
}

function startTimer() {
  timer = 0;
  interval = setInterval(()=>{
    timer++;
    timerEl.textContent = "Time: " + timer + "s";
  },1000);
}

document.querySelectorAll(".ctrl").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    let dir = btn.getAttribute("data-dir");
    if (dir==="up") movePlayer(0,-1);
    if (dir==="down") movePlayer(0,1);
    if (dir==="left") movePlayer(-1,0);
    if (dir==="right") movePlayer(1,0);
  });
});

document.addEventListener("keydown", (e)=>{
  if (e.key==="ArrowUp") movePlayer(0,-1);
  if (e.key==="ArrowDown") movePlayer(0,1);
  if (e.key==="ArrowLeft") movePlayer(-1,0);
  if (e.key==="ArrowRight") movePlayer(1,0);
});
