const Game = {
    canvas: null,
    ctx: null,
    gridSize: 20,
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
    speed: 150, // lower is faster
    startTime: 0,
    gameTime: 0,
    timer: null,
    gameInterval: null,
    isPaused: false,

    // Audio assets
    sounds: {
        eat: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
        gameOver: new Audio('https://assets.mixkit.co/active_storage/sfx/218/218-preview.mp3'),
        levelUp: new Audio('https://assets.mixkit.co/active_storage/sfx/1939/1939-preview.mp3'),
        move: new Audio('https://assets.mixkit.co/active_storage/sfx/2026/2026-preview.mp3')
    },

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = canvas.parentElement.clientWidth;
        this.height = canvas.height = canvas.parentElement.clientHeight;
        
        // Ensure dimensions are divisible by gridSize
        this.width = Math.floor(this.width / this.gridSize) * this.gridSize;
        this.height = Math.floor(this.height / this.gridSize) * this.gridSize;
        canvas.width = this.width;
        canvas.height = this.height;

        this.reset();
    },

    reset() {
        this.snake = [
            { x: 100, y: 100 },
            { x: 80, y: 100 },
            { x: 60, y: 100 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.level = 1;
        this.speed = 150;
        this.gameOver = false;
        this.gameTime = 0;
        this.obstacles = [];
        this.spawnFood();
        this.updateHUD();
    },

    start() {
        this.reset();
        this.startTime = Date.now();
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
    },

    pause() {
      this.isPaused = !this.isPaused;
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

        // Level up every 10 points
        if (this.score % 10 === 0) {
            this.levelUp();
        }
        
        this.updateHUD();
    },

    levelUp() {
        this.level += 1;
        this.sounds.levelUp.play().catch(e => {});
        this.speed = Math.max(50, this.speed - 20); // Faster speed
        
        // Add obstacles in the jungle
        this.spawnObstacle();
    },

    spawnFood() {
        const x = Math.floor(Math.random() * (this.width / this.gridSize)) * this.gridSize;
        const y = Math.floor(Math.random() * (this.height / this.gridSize)) * this.gridSize;
        
        // Ensure food is not on snake or obstacle
        const onSnake = this.snake.some(segment => segment.x === x && segment.y === y);
        const onObstacle = this.obstacles.some(o => o.x === x && o.y === y);

        if (onSnake || onObstacle) {
            this.spawnFood();
        } else {
            const foodTypes = ['🐸', '🐛', '🍎', '🦗'];
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

        // Wall collision
        if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
            this.endGame();
        }

        // Self collision
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
            }
        }

        // Obstacle collision
        this.obstacles.forEach(o => {
            if (head.x === o.x && head.y === o.y) {
                this.endGame();
            }
        });
    },

    endGame() {
        this.gameOver = true;
        this.sounds.gameOver.play().catch(e => {});
        this.stop();
        if (this.onGameOver) this.onGameOver(this.score, this.gameTime);
    },

    setDirection(dir) {
        // Prevent 180 degree turns
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
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid (subtle)
        this.ctx.strokeStyle = "rgba(255,255,255,0.05)";
        for (let x = 0; x < this.width; x += this.gridSize) {
          this.ctx.strokeRect(x, 0, x, this.height);
        }
        for (let y = 0; y < this.height; y += this.gridSize) {
          this.ctx.strokeRect(0, y, this.width, y);
        }

        // Draw food
        this.ctx.font = `${this.gridSize - 2}px Inter`;
        this.ctx.fillText(this.food.type, this.food.x, this.food.y + this.gridSize - 2);

        // Draw obstacles
        this.obstacles.forEach(o => {
          this.ctx.fillText(o.type, o.x, o.y + this.gridSize - 2);
        });

        // Draw snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            this.ctx.fillStyle = isHead ? "#39ff14" : `rgba(57, 255, 20, ${1 - index / this.snake.length})`;
            
            // Premium rounded segments
            const size = this.gridSize - 2;
            this.drawRoundedRect(segment.x + 1, segment.y + 1, size, size, 5);
            
            // Glow effect for head
            if (isHead) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = "#39ff14";
            } else {
                this.ctx.shadowBlur = 0;
            }
        });
        
        this.ctx.shadowBlur = 0; // Reset shadow
    },

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
};
