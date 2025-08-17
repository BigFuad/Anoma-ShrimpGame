let canvas = document.getElementById("mazeCanvas");
let ctx = canvas.getContext("2d");

let shrimp = { x: 20, y: 20, size: 30 }; // shrimp position
let startTime, timerInterval;

const urlParams = new URLSearchParams(window.location.search);
const currentLevel = parseInt(urlParams.get("level")) || 1;

// Maze definitions (walls as [x1,y1,x2,y2])
const mazes = [
  [[0,100,600,100],[100,200,600,200]], // Level 1
  [[0,100,500,100],[100,200,500,200],[200,300,600,300]], // Level 2
  [[50,50,550,50],[50,150,550,150],[50,250,550,250],[50,350,550,350]], // Level 3
  [[0,80,600,80],[100,160,600,160],[0,240,500,240],[150,320,600,320]], // Level 4
  [[0,60,600,60],[0,120,500,120],[100,180,600,180],[0,240,500,240],[150,300,600,300]], // Level 5
  [[50,50,550,50],[50,100,550,100],[50,150,550,150],[50,200,550,200],[50,250,550,250]], // Level 6
  [[0,70,600,70],[100,140,600,140],[0,210,600,210],[150,280,600,280],[0,350,600,350]], // Level 7
  [[50,60,550,60],[0,120,500,120],[50,180,550,180],[0,240,500,240],[50,300,550,300]], // Level 8
  [[0,50,600,50],[50,100,550,100],[0,150,600,150],[50,200,550,200],[0,250,600,250],[50,300,550,300]], // Level 9
  [[0,40,600,40],[100,100,600,100],[0,160,600,160],[100,220,600,220],[0,280,600,280],[100,340,600,340]], // Level 10
  [[0,50,600,50],[600,50,600,350],[0,350,600,350],[0,50,0,350]], // Level 11
  [[0,60,600,60],[300,60,300,340],[0,340,600,340]], // Level 12
  [[0,80,600,80],[150,80,150,320],[450,80,450,320],[0,320,600,320]], // Level 13
  [[0,100,600,100],[200,100,200,300],[400,100,400,300],[0,300,600,300]], // Level 14
  [[0,50,600,50],[100,150,500,150],[200,250,600,250],[0,350,600,350]], // Level 15
  [[50,50,550,50],[50,350,550,350],[300,50,300,350]], // Level 16
  [[0,60,600,60],[0,180,600,180],[0,300,600,300],[200,60,200,300],[400,60,400,300]], // Level 17
  [[0,40,600,40],[100,120,500,120],[200,200,600,200],[0,280,600,280],[300,360,600,360]], // Level 18
  [[0,50,600,50],[0,150,600,150],[0,250,600,250],[0,350,600,350],[300,50,300,350]], // Level 19
  [[0,40,600,40],[0,120,600,120],[0,200,600,200],[0,280,600,280],[0,360,600,360]] // Level 20
];

// Draw maze walls
function drawMaze() {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let walls = mazes[currentLevel - 1] || mazes[0];
  walls.forEach(w => {
    ctx.moveTo(w[0], w[1]);
    ctx.lineTo(w[2], w[3]);
  });
  ctx.stroke();
}

// Draw shrimp emoji
function drawShrimp() {
  ctx.font = `${shrimp.size}px Arial`;
  ctx.fillText("🦐", shrimp.x, shrimp.y + shrimp.size);
}

// Collision detection (shrimp against walls)
function collides(x, y) {
  let walls = mazes[currentLevel - 1] || [];
  for (let w of walls) {
    let [x1, y1, x2, y2] = w;
    if (y1 === y2) { // horizontal wall
      if (y >= y1 - 5 && y <= y1 + 5 && x + shrimp.size > Math.min(x1, x2) && x < Math.max(x1, x2)) {
        return true;
      }
    }
    if (x1 === x2) { // vertical wall
      if (x >= x1 - 5 && x <= x1 + 5 && y + shrimp.size > Math.min(y1, y2) && y < Math.max(y1, y2)) {
        return true;
      }
    }
  }
  return false;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMaze();
  drawShrimp();
}

// Movement with boundaries + collision check
function move(direction) {
  let oldX = shrimp.x;
  let oldY = shrimp.y;

  switch (direction) {
    case "up": shrimp.y -= 10; break;
    case "down": shrimp.y += 10; break;
    case "left": shrimp.x -= 10; break;
    case "right": shrimp.x += 10; break;
  }

  // Keep shrimp inside canvas boundaries
  if (shrimp.x < 0) shrimp.x = 0;
  if (shrimp.y < 0) shrimp.y = 0;
  if (shrimp.x > canvas.width - shrimp.size) shrimp.x = canvas.width - shrimp.size;
  if (shrimp.y > canvas.height - shrimp.size) shrimp.y = canvas.height - shrimp.size;

  // Cancel move if colliding with wall
  if (collides(shrimp.x, shrimp.y)) {
    shrimp.x = oldX;
    shrimp.y = oldY;
  }

  checkWin();
  render();
}

function checkWin() {
  if (shrimp.x > canvas.width - shrimp.size && shrimp.y > canvas.height - shrimp.size) {
    clearInterval(timerInterval);
    let timeTaken = Math.floor((Date.now() - startTime) / 1000);
    setTimeout(() => {
      alert(`🎉 Congratulations! You finished Level ${currentLevel} in ${timeTaken} seconds 🎉`);
      if (currentLevel < 20) {
        window.location.href = `game.html?level=${currentLevel + 1}`;
      } else {
        window.location.href = "index.html";
      }
    }, 200);
  }
}

// Timer
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    let time = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").innerText = "Time: " + time + "s";
  }, 1000);
}

// Music
function toggleMusic() {
  let music = document.getElementById("bgMusic");
  if (music.paused) music.play();
  else music.pause();
}

// Keyboard controls
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") move("up");
  if (e.key === "ArrowDown") move("down");
  if (e.key === "ArrowLeft") move("left");
  if (e.key === "ArrowRight") move("right");
});

// Prevent double-tap zoom on mobile
document.addEventListener("touchstart", function preventZoom(e) {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener("touchend", function preventDoubleTapZoom(e) {
  let now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

window.onload = () => {
  render();
  startTimer();
};
