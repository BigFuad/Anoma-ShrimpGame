const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const landing = document.getElementById('landing');
const game = document.getElementById('game');
const winModal = document.getElementById('winModal');
const bgMusic = document.getElementById('bgMusic');
const playButton = document.getElementById('play');
const playAgainButton = document.getElementById('playAgain');
const difficultySelect = document.getElementById('difficulty');
const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');

let maze, player, cellSize, timerInterval, startTime;

function generateMaze(width, height) {
    const grid = Array.from({length: height}, () => Array(width).fill(0).map(() => ({
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false
    })));

    function removeWalls(a, b) {
        const xDiff = a.x - b.x;
        if (xDiff === 1) {
            grid[a.y][a.x].walls.left = false;
            grid[b.y][b.x].walls.right = false;
        } else if (xDiff === -1) {
            grid[a.y][a.x].walls.right = false;
            grid[b.y][b.x].walls.left = false;
        }
        const yDiff = a.y - b.y;
        if (yDiff === 1) {
            grid[a.y][a.x].walls.top = false;
            grid[b.y][b.x].walls.bottom = false;
        } else if (yDiff === -1) {
            grid[a.y][a.x].walls.bottom = false;
            grid[b.y][b.x].walls.top = false;
        }
    }

    const stack = [];
    const start = { x: 0, y: 0 };
    grid[0][0].visited = true;
    stack.push(start);

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const unvisitedNeighbors = [];

        const { x, y } = current;
        if (x > 0 && !grid[y][x - 1].visited) unvisitedNeighbors.push({ x: x - 1, y });
        if (y > 0 && !grid[y - 1][x].visited) unvisitedNeighbors.push({ x, y: y - 1 });
        if (x < width - 1 && !grid[y][x + 1].visited) unvisitedNeighbors.push({ x: x + 1, y });
        if (y < height - 1 && !grid[y + 1][x].visited) unvisitedNeighbors.push({ x, y: y + 1 });

        if (unvisitedNeighbors.length > 0) {
            const next = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
            removeWalls(current, next);
            grid[next.y][next.x].visited = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }

    return grid;
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1; // Thin red lines
    ctx.strokeStyle = 'red';

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            const cell = maze[y][x];
            const px = x * cellSize;
            const py = y * cellSize;

            if (cell.walls.top) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + cellSize, py);
                ctx.stroke();
            }
            if (cell.walls.left) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, py + cellSize);
                ctx.stroke();
            }
            if (cell.walls.bottom) {
                ctx.beginPath();
                ctx.moveTo(px, py + cellSize);
                ctx.lineTo(px + cellSize, py + cellSize);
                ctx.stroke();
            }
            if (cell.walls.right) {
                ctx.beginPath();
                ctx.moveTo(px + cellSize, py);
                ctx.lineTo(px + cellSize, py + cellSize);
                ctx.stroke();
            }
        }
    }

    // Draw shrimp with glow
    ctx.font = `${cellSize * 0.8}px serif`;
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 5;
    ctx.fillStyle = 'white';
    ctx.fillText('🦐', player.x * cellSize + cellSize * 0.1, player.y * cellSize + cellSize * 0.8);
    ctx.shadowBlur = 0;
}

function updateTimer() {
    const time = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = `Time: ${time}s`;
}

function move(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (nx < 0 || ny < 0 || nx >= maze[0].length || ny >= maze.length) return;

    if (dx === 1 && maze[player.y][player.x].walls.right) return;
    if (dx === -1 && maze[player.y][player.x].walls.left) return;
    if (dy === 1 && maze[player.y][player.x].walls.bottom) return;
    if (dy === -1 && maze[player.y][player.x].walls.top) return;

    player.x = nx;
    player.y = ny;
    drawMaze();

    if (player.x === maze[0].length - 1 && player.y === maze.length - 1) {
        win();
    }
}

function win() {
    clearInterval(timerInterval);
    const time = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('winTime').textContent = `Time taken: ${time} seconds`;
    winModal.classList.remove('hidden');
    bgMusic.pause();
}

function startGame() {
    const level = parseInt(difficultySelect.value);
    const size = 4 + level; // Level 1: 5x5, Level 20: 24x24
    maze = generateMaze(size, size);
    player = { x: 0, y: 0 };

    resizeCanvas();
    drawMaze();

    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('timer').textContent = 'Time: 0s';

    bgMusic.play();

    landing.classList.add('hidden');
    game.classList.remove('hidden');
    winModal.classList.add('hidden');
}

function resizeCanvas() {
    const minDim = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.6);
    canvas.width = minDim;
    canvas.height = minDim;
    cellSize = minDim / maze[0].length;
}

playButton.addEventListener('click', startGame);

playAgainButton.addEventListener('click', () => {
    game.classList.add('hidden');
    landing.classList.remove('hidden');
    bgMusic.pause();
    bgMusic.currentTime = 0;
});

upButton.addEventListener('click', () => move(0, -1));
downButton.addEventListener('click', () => move(0, 1));
leftButton.addEventListener('click', () => move(-1, 0));
rightButton.addEventListener('click', () => move(1, 0));

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') move(0, -1);
    if (e.key === 'ArrowDown') move(0, 1);
    if (e.key === 'ArrowLeft') move(-1, 0);
    if (e.key === 'ArrowRight') move(1, 0);
});

window.addEventListener('resize', () => {
    if (!game.classList.contains('hidden')) {
        resizeCanvas();
        drawMaze();
    }
});
