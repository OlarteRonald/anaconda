const Game = {
    canvas: null,
    ctx: null,
    gridSize: 24, 
    width: 0,
    height: 0,
    snake: [],
    direction: 'right',
    nextDirection: 'right',
    food: null,
    obstacles: [],
    score: 0,
    level: 1,
    gameOver: false,
    speed: 3000, // Locked: 3 seconds per tile
    startTime: 0,
    gameTime: 0,
    timer: null,
    gameInterval: null,
    isPaused: false,

    // Audio assets
    sounds: {
        eat: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
        success: new Audio('https://assets.mixkit.co/active_storage/sfx/1939/1939-preview.mp3'),
        collision: new Audio('https://assets.mixkit.co/active_storage/sfx/218/218-preview.mp3'),
        bg: new Audio('https://www.flanigan.co/sounds/forest_loop.mp3') 
    },

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        const container = canvas.parentElement;
        this.width = canvas.width = container.clientWidth * 1.5; 
        this.height = canvas.height = container.clientHeight * 1.5;
        
        this.width = Math.floor(this.width / this.gridSize) * this.gridSize;
        this.height = Math.floor(this.height / this.gridSize) * this.gridSize;
        canvas.width = this.width;
        canvas.height = this.height;

        this.sounds.bg.loop = true;
        this.sounds.bg.volume = 0.3;

        this.reset();
    },

    reset() {
        const leftX = this.gridSize * 3;
        const centerY = Math.floor(this.height / 2 / this.gridSize) * this.gridSize;
        
        this.snake = [
            { x: leftX, y: centerY },
            { x: leftX - this.gridSize, y: centerY },
            { x: leftX - (this.gridSize * 2), y: centerY }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.level = 1;
        this.speed = 3000; // Mantener los 3 segundos constantes al reiniciar
        this.gameOver = false;
        this.gameTime = 0;
        this.obstacles = [];
        this.spawnFood();
        this.updateHUD();
    },

    start() {
        this.reset();
        this.startTime = Date.now();
        this.sounds.bg.play().catch(e => console.log("Music play blocked", e));
        this.gameInterval = setTimeout(() => this.tick(), this.speed);
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.gameOver) {
                this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
            }
        }, 1000);
    },

    stop() {
        if (this.gameInterval) clearTimeout(this.gameInterval);
        if (this.timer) clearInterval(this.timer);
        this.sounds.bg.pause();
    },

    pause() {
      this.isPaused = !this.isPaused;
      if (this.isPaused) this.sounds.bg.pause();
      else this.sounds.bg.play();
    },

    tick() {
        if (this.gameOver || this.isPaused) {
          this.gameInterval = setTimeout(() => this.tick(), this.speed);
          return;
        }

        this.move();
        this.checkCollision();
        this.draw();
        
        this.gameInterval = setTimeout(() => this.tick(), this.speed);
    },

    move() {
        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        if (this.direction === 'up') head.y -= this.gridSize;
        if (this.direction === 'down') head.y += this.gridSize;
        if (this.direction === 'left') head.x -= this.gridSize;
        if (this.direction === 'right') head.x += this.gridSize;

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.handleEat();
        } else {
            this.snake.pop();
        }
    },

    handleEat() {
        this.score += 1;
        this.sounds.eat.currentTime = 0;
        this.sounds.eat.play().catch(e => {});
        this.spawnFood();

        if (this.score % 5 === 0) { 
            this.levelUp();
        }
        
        this.updateHUD();
    },

    levelUp() {
        this.level += 1;
        this.sounds.success.play().catch(e => {});
        this.speed = 3000; // Se mantiene constante sin importar el nivel
        this.spawnObstacle();
    },

    spawnFood() {
        const x = Math.floor(Math.random() * (this.width / this.gridSize)) * this.gridSize;
        const y = Math.floor(Math.random() * (this.height / this.gridSize)) * this.gridSize;
        
        const onSnake = this.snake.some(segment => segment.x === x && segment.y === y);
        const onObstacle = this.obstacles.some(o => o.x === x && o.y === y);

        if (onSnake || onObstacle) {
            this.spawnFood();
        } else {
            const foodTypes = ['🐸', '🍎', '🦗', '🐛'];
            this.food = { x, y, type: foodTypes[Math.floor(Math.random() * foodTypes.length)] };
        }
    },

    spawnObstacle() {
        const x = Math.floor(Math.random() * (this.width / this.gridSize)) * this.gridSize;
        const y = Math.floor(Math.random() * (this.height / this.gridSize)) * this.gridSize;
        
        const onSnake = this.snake.some(segment => segment.x === x && segment.y === y);
        const onFood = this.food.x === x && this.food.y === y;

        if (onSnake || onFood) {
          this.spawnObstacle();
        } else {
            const obstacleTypes = ['🌳', '🪨', '🍄'];
            this.obstacles.push({ x, y, type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] });
        }
    },

    checkCollision() {
        const head = this.snake[0];

        if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
            this.endGame();
        }

        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
            }
        }

        this.obstacles.forEach(o => {
            if (head.x === o.x && head.y === o.y) {
                this.endGame();
            }
        });
    },

    endGame() {
        this.gameOver = true;
        this.sounds.collision.play().catch(e => {});
        this.stop();
        if (this.onGameOver) this.onGameOver(this.score, this.gameTime);
    },

    setDirection(dir) {
        if (dir === 'up' && this.direction !== 'down') this.nextDirection = 'up';
        if (dir === 'down' && this.direction !== 'up') this.nextDirection = 'down';
        if (dir === 'left' && this.direction !== 'right') this.nextDirection = 'left';
        if (dir === 'right' && this.direction !== 'left') this.nextDirection = 'right';
    },

    updateHUD() {
        document.getElementById('current-score').innerText = this.score;
        document.getElementById('current-level').innerText = this.level;
    },

    draw() {
        this.ctx.fillStyle = "#010804"; 
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.font = `${this.gridSize - 2}px Inter`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(this.food.type, this.food.x, this.food.y);

        this.obstacles.forEach(o => {
          this.ctx.fillText(o.type, o.x, o.y);
        });

        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const size = this.gridSize - 2;

            this.ctx.save();
            this.ctx.translate(segment.x + this.gridSize/2, segment.y + this.gridSize/2);

            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.gridSize/2);
            grad.addColorStop(0, isHead ? "#39ff14" : "#1db954");
            grad.addColorStop(1, "#0a2a0a");
            
            this.ctx.fillStyle = grad;
            this.ctx.shadowBlur = isHead ? 15 : 8;
            this.ctx.shadowColor = "rgba(57, 255, 20, 0.4)";
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (isHead) {
                this.ctx.fillStyle = "white";
                this.ctx.beginPath();
                this.ctx.arc(-size/4, -size/4, 2, 0, Math.PI * 2);
                this.ctx.arc(size/4, -size/4, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }
};
