// Get the canvas and context
const canvas = document.getElementById('maze-canvas');
const ctx = canvas.getContext('2d');

// Set the maze size and complexity based on the difficulty level
let mazeSize = 10;
let mazeComplexity = 0.5;
let difficultyLevel = 1;

// Get the difficulty level selector
const difficultySelector = document.getElementById('difficulty-level');

// Add event listener to the difficulty level selector
difficultySelector.addEventListener('change', (e) => {
    difficultyLevel = parseInt(e.target.value);
    updateMazeSizeAndComplexity();
});

// Update the maze size and complexity based on the difficulty level
function updateMazeSizeAndComplexity() {
    mazeSize = 10 + (difficultyLevel - 1) * 2;
    mazeComplexity = 0.5 + (difficultyLevel - 1) * 0.05;
    generateMaze();
}

// Generate the maze
function generateMaze() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the maze walls
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            if (Math.random() < mazeComplexity) {
                ctx.fillStyle = 'red';
                ctx.fillRect(i * 40, j * 40, 40, 40);
            }
        }
    }
}

// Get the controls and add event listeners
const controls = document.querySelectorAll('.arrow-button');
controls.forEach((control) => {
    control.addEventListener('click', (e) => {
        // Move the shrimp based on the control clicked
        const shrimp = document.getElementById('shrimp');
        const direction = e.target.classList[1];
        switch (direction) {
            case 'up':
                shrimp.style.top = `${parseInt(shrimp.style.top) - 40}px`;
                break;
            case 'down':
                shrimp.style.top = `${parseInt(shrimp.style.top) + 40}px`;
                break;
            case 'left':
                shrimp.style.left = `${parseInt(shrimp.style.left) - 40}px`;
                break;
            case 'right':
                shrimp.style.left = `${parseInt(shrimp.style.left) + 40}px`;
                break;
        }
    });
});

// Get the winning popup and time taken display
const winningPopup = document.getElementById('winning-popup');
const timeTakenDisplay = document.getElementById('time-taken');

// Set the time taken and display it on the winning popup
let startTime;
let timeTaken;
function startGame() {
    startTime = new Date().getTime();
}
function endGame() {
    timeTaken = (new Date().getTime() - startTime) / 1000;
    timeTakenDisplay.textContent = timeTaken;
    winningPopup.style.display = 'block';
}

// Start the game
startGame();

// Generate the maze
generateMaze();
