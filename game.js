/* Robust Anoma Shrimp Maze Game - emoji shrimp 🦐 (no shrimp.png required)
   Files: index.html, style.css, game.js (all in same folder)
*/

(() => {
  // DOM helpers
  const el = id => document.getElementById(id)
  const qs = sel => document.querySelector(sel)

  // Elements
  const landing = el('landing')
  const playBtn = el('playBtn')
  const levelSelect = el('level')
  const gameScreen = el('gameScreen')
  const mazeCanvas = el('mazeCanvas')
  const timerEl = el('timer')
  const levelLabel = el('levelLabel')
  const restartBtn = el('restartBtn')
  const backBtn = el('backBtn')
  const onScreenControls = el('onScreenControls')
  const arrows = document.querySelectorAll('.arrow')
  const winPopup = el('winPopup')
  const playAgain = el('playAgain')
  const closePopup = el('closePopup')
  const finalTimeValue = el('finalTimeValue')
  const cheerline = el('cheerline')
  const bgMusic = el('bgMusic')

  // Fill level 1..20
  levelSelect.innerHTML = ''
  for (let i=1;i<=20;i++){
    const opt = document.createElement('option')
    opt.value = i; opt.textContent = 'Level ' + i
    levelSelect.appendChild(opt)
  }

  // Canvas and context (high-DPI friendly)
  const ctx = mazeCanvas.getContext('2d', { alpha: false })

  function fitCanvasToContainer(){
    // choose the smaller of available width/height in gameArea to make square canvas
    const container = mazeCanvas.parentElement
    const rect = container.getBoundingClientRect()
    const padding = 24
    const maxW = Math.min(rect.width, rect.height) - padding
    const cssSize = Math.max(160, Math.floor(maxW)) // at least 160px
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    mazeCanvas.style.width = cssSize + 'px'
    mazeCanvas.style.height = cssSize + 'px'
    mazeCanvas.width = Math.floor(cssSize * dpr)
    mazeCanvas.height = Math.floor(cssSize * dpr)
    ctx.setTransform(dpr,0,0,dpr,0,0)
  }
  window.addEventListener('resize', fitCanvasToContainer)

  // Timer utilities
  let startTime = null, timerRAF = null
  function formatTime(ms){
    const minutes = Math.floor(ms/60000).toString().padStart(2,'0')
    const seconds = Math.floor((ms%60000)/1000).toString().padStart(2,'0')
    const ms3 = (ms%1000).toString().padStart(3,'0')
    return `${minutes}:${seconds}.${ms3}`
  }
  function startTimer(){
    startTime = performance.now()
    cancelAnimationFrame(timerRAF)
    function tick(){
      const now = performance.now()
      timerEl.textContent = 'Time: ' + formatTime(now - startTime)
      timerRAF = requestAnimationFrame(tick)
    }
    timerRAF = requestAnimationFrame(tick)
  }
  function stopTimer(){
    cancelAnimationFrame(timerRAF)
    if (startTime === null) return 0
    const final = performance.now() - startTime
    startTime = null
    return final
  }

  // Maze generator - recursive backtracker (standard)
  class Cell {
    constructor(x,y,cols,rows){
      this.x = x; this.y = y; this.cols = cols; this.rows = rows
      this.walls = {top:true,right:true,bottom:true,left:true}
      this.visited = false
    }
  }
  class Maze {
    constructor(cols,rows){
      this.cols = cols; this.rows = rows
      this.grid = []
      for (let y=0;y<rows;y++){
        for (let x=0;x<cols;x++){
          this.grid.push(new Cell(x,y,cols,rows))
        }
      }
      this.stack = []
      this.current = this.grid[0]
      this.current.visited = true
      this.visitedCount = 1
      this.total = cols * rows
      this.generate()
    }
    index(x,y){ if (x<0||y<0||x>=this.cols||y>=this.rows) return -1; return x + y * this.cols }
    neighborCells(cell){
      const {x,y} = cell; const neighbors = []
      const dirs = [{dx:0,dy:-1,dir:'top'},{dx:1,dy:0,dir:'right'},{dx:0,dy:1,dir:'bottom'},{dx:-1,dy:0,dir:'left'}]
      for (const d of dirs){
        const idx = this.index(x + d.dx, y + d.dy)
        if (idx >= 0){
          const c = this.grid[idx]
          if (!c.visited) neighbors.push({cell:c,dir:d.dir})
        }
      }
      return neighbors
    }
    removeWalls(a,b){
      const dx = a.x - b.x, dy = a.y - b.y
      if (dx === 1){ a.walls.left = false; b.walls.right = false }
      else if (dx === -1){ a.walls.right = false; b.walls.left = false }
      if (dy === 1){ a.walls.top = false; b.walls.bottom = false }
      else if (dy === -1){ a.walls.bottom = false; b.walls.top = false }
    }
    generate(){
      while (this.visitedCount < this.total){
        const neighbors = this.neighborCells(this.current)
        if (neighbors.length > 0){
          const n = neighbors[Math.floor(Math.random()*neighbors.length)]
          this.stack.push(this.current)
          this.removeWalls(this.current, n.cell)
          this.current = n.cell
          this.current.visited = true
          this.visitedCount++
        } else if (this.stack.length > 0){
          this.current = this.stack.pop()
        } else {
          // should rarely happen, but find next unvisited
          const unvisited = this.grid.find(c=>!c.visited)
          if (!unvisited) break
          this.current = unvisited
          this.current.visited = true
          this.visitedCount++
        }
      }
    }
  }

  // Player
  class Player {
    constructor(cellX, cellY){ this.cellX = cellX; this.cellY = cellY }
    move(dx,dy,maze){
      const nx = this.cellX + dx, ny = this.cellY + dy
      if (nx < 0 || ny < 0 || nx >= maze.cols || ny >= maze.rows) return
      const current = maze.grid[maze.index(this.cellX,this.cellY)]
      if (dx === -1 && current.walls.left) return
      if (dx === 1 && current.walls.right) return
      if (dy === -1 && current.walls.top) return
      if (dy === 1 && current.walls.bottom) return
      this.cellX = nx; this.cellY = ny
    }
  }

  // Game state
  let maze = null, player = null, exitCell = null, animationLoop = null, playing = false

  // Drawing
  function drawMazeAndPlayer(){
    // clear (use CSS pixels)
    const cssSize = parseFloat(getComputedStyle(mazeCanvas).width)
    ctx.clearRect(0,0,mazeCanvas.width, mazeCanvas.height)
    const cols = maze.cols, rows = maze.rows
    const cellW = cssSize / cols, cellH = cssSize / rows

    // background
    ctx.fillStyle = '#0f0f10'
    ctx.fillRect(0,0,cssSize,cssSize)

    // exit glow
    const ex = exitCell.x * cellW + cellW*0.5, ey = exitCell.y * cellH + cellH*0.5
    const exitRadius = Math.min(cellW,cellH) * 0.32
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = 'rgba(255,43,43,0.12)'
    ctx.arc(ex, ey, exitRadius*1.6, 0, Math.PI*2)
    ctx.fill()
    ctx.restore()

    // walls
    ctx.lineCap = 'square'
    ctx.strokeStyle = 'rgba(255,43,43,0.95)'
    ctx.lineWidth = Math.max(1, (window.devicePixelRatio||1) * 1.5)
    ctx.shadowColor = 'rgba(255,43,43,0.18)'
    ctx.shadowBlur = 8

    for (const c of maze.grid){
      const x = c.x * cellW, y = c.y * cellH
      if (c.walls.top){ ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+cellW,y); ctx.stroke() }
      if (c.walls.right){ ctx.beginPath(); ctx.moveTo(x+cellW,y); ctx.lineTo(x+cellW,y+cellH); ctx.stroke() }
      if (c.walls.bottom){ ctx.beginPath(); ctx.moveTo(x+cellW,y+cellH); ctx.lineTo(x,y+cellH); ctx.stroke() }
      if (c.walls.left){ ctx.beginPath(); ctx.moveTo(x,y+cellH); ctx.lineTo(x,y); ctx.stroke() }
    }

    // draw shrimp emoji
    const px = (player.cellX + 0.5) * cellW, py = (player.cellY + 0.5) * cellH
    const fontSize = Math.min(cellW, cellH) * 0.95
    ctx.save()
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6
    ctx.fillText('🦐', px, py)
    ctx.restore()
  }

  function gameLoop(){
    drawMazeAndPlayer()
    animationLoop = requestAnimationFrame(gameLoop)
    // win detection (player reaches exit)
    if (player.cellX === exitCell.x && player.cellY === exitCell.y){
      finishGame()
    }
  }

  // Start game with level mapping
  function startGame(level){
    // map level to maze size (odd numbers for good connectivity)
    const minSize = 7, maxSize = 31
    const t = (level - 1) / 19
    const raw = Math.round(minSize + Math.pow(t, 1.25) * (maxSize - minSize))
    const cells = (raw % 2 === 0) ? raw + 1 : raw
    fitCanvasToContainer()
    maze = new Maze(cells, cells)

    // optionally add complexity (randomly close some connections) for higher levels -- small amount
    const extraWallPct = t * 0.08
    if (extraWallPct > 0.01){
      const attempts = Math.floor(cells * cells * extraWallPct)
      for (let i=0;i<attempts;i++){
        const cx = Math.floor(Math.random()*cells), cy = Math.floor(Math.random()*cells)
        const c = maze.grid[maze.index(cx,cy)]
        const dirs = ['top','right','bottom','left']
        const d = dirs[Math.floor(Math.random()*4)]
        const nx = cx + (d === 'right' ? 1 : d === 'left' ? -1 : 0)
        const ny = cy + (d === 'bottom' ? 1 : d === 'top' ? -1 : 0)
        if (nx < 0 || ny < 0 || nx >= cells || ny >= cells) continue
        const other = maze.grid[maze.index(nx,ny)]
        c.walls[d] = true
        if (d === 'top') other.walls.bottom = true
        if (d === 'bottom') other.walls.top = true
        if (d === 'left') other.walls.right = true
        if (d === 'right') other.walls.left = true
      }
    }

    // player start and exit
    player = new Player(0,0)
    exitCell = maze.grid[maze.index(cells-1, cells-1)]

    levelLabel.textContent = 'Level ' + level

    // ensure winPopup hidden
    winPopup.classList.add('hidden')

    // start timer & music
    startTimer()
    try{ bgMusic.currentTime = 0; bgMusic.play().catch(()=>{}); }catch(e){}

    playing = true
    cancelAnimationFrame(animationLoop)
    animationLoop = requestAnimationFrame(gameLoop)
  }

  function finishGame(){
    if (!playing) return
    playing = false
    const finalMs = stopTimer()
    cancelAnimationFrame(animationLoop)
    finalTimeValue.textContent = formatTime(finalMs)
    // celebrate: show some mage emoji and mage.png if present
    cheerline.innerHTML = '🧙‍♂️ &nbsp; 🧙‍♀️ &nbsp; 🧙‍♂️'
    winPopup.classList.remove('hidden')
    try{ bgMusic.pause(); }catch(e){}
  }

  // Movement helpers
  function movePlayerDirection(dir){
    if (!maze || !player) return
    const dirMap = {left:[-1,0], right:[1,0], up:[0,-1], down:[0,1]}
    const d = dirMap[dir]
    if (!d) return
    player.move(d[0], d[1], maze)
  }

  // Input: keyboard
  window.addEventListener('keydown', (e)=>{
    if (!playing) return
    const k = e.key
    if (['ArrowLeft','a','A'].includes(k)) movePlayerDirection('left')
    if (['ArrowRight','d','D'].includes(k)) movePlayerDirection('right')
    if (['ArrowUp','w','W'].includes(k)) movePlayerDirection('up')
    if (['ArrowDown','s','S'].includes(k)) movePlayerDirection('down')
  })

  // On-screen arrows - press & hold
  arrows.forEach(btn=>{
    const dir = btn.dataset.dir
    let holdInterval = null
    function doMove(){ movePlayerDirection(dir) }
    btn.addEventListener('pointerdown', (ev)=>{
      ev.preventDefault()
      doMove()
      holdInterval = setInterval(doMove, 140)
      btn.classList.add('active')
    })
    const clear = ()=>{ clearInterval(holdInterval); holdInterval = null; btn.classList.remove('active') }
    window.addEventListener('pointerup', clear)
    btn.addEventListener('pointercancel', clear)
  })

  // Buttons
  playBtn.addEventListener('click', ()=>{
    const level = parseInt(levelSelect.value||'1',10)
    landing.classList.add('hidden')
    gameScreen.classList.remove('hidden')
    startGame(level)
  })

  restartBtn.addEventListener('click', ()=>{
    const level = parseInt(levelSelect.value||'1',10)
    startGame(level)
    winPopup.classList.add('hidden')
  })

  backBtn.addEventListener('click', ()=>{
    gameScreen.classList.add('hidden')
    landing.classList.remove('hidden')
    winPopup.classList.add('hidden')
    try{ bgMusic.pause(); bgMusic.currentTime = 0 }catch(e){}
    cancelAnimationFrame(animationLoop)
  })

  playAgain.addEventListener('click', ()=>{
    winPopup.classList.add('hidden')
    const level = parseInt(levelSelect.value||'1',10)
    startGame(level)
  })

  closePopup.addEventListener('click', ()=>{
    winPopup.classList.add('hidden')
    gameScreen.classList.add('hidden')
    landing.classList.remove('hidden')
  })

  // Prevent double-tap zoom
  document.addEventListener('dblclick', (e)=>{ e.preventDefault() })

  // Start layout
  fitCanvasToContainer()
})();
