const Game = {
    canvas: null,
    ctx: null,
    gridSize: 24, 
    width: 0,
    height: 0,
    snake: [],
    direction: 'up',
    nextDirection: 'up',
    food: null,
    obstacles: [],
    score: 0,
    level: 1,
    gameOver: false,
    speed: 2500, // Empieza a 2.5 seg
    startTime: 0,
    gameTime: 0,
    timer: null,
    gameInterval: null,
    isPaused: false,

    sounds: {
        eat: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
        success: new Audio('https://assets.mixkit.co/active_storage/sfx/1939/1939-preview.mp3'),
        collision: new Audio('https://assets.mixkit.co/active_storage/sfx/218/218-preview.mp3'),
        bg: new Audio('https://www.flanigan.co/sounds/forest_loop.mp3') 
    },

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Ajustamos el tamaño al contenedor para que las paredes coincidan con lo que el usuario ve
        const container = canvas.parentElement;
        this.width = canvas.width = Math.floor(container.clientWidth / this.gridSize) * this.gridSize;
        this.height = canvas.height = Math.floor(container.clientHeight / this.gridSize) * this.gridSize;

        this.sounds.bg.loop = true;
        this.sounds.bg.volume = 0.3;

        this.reset();
    },

    reset() {
        // Iniciar desde la parte inferior central
        const centerX = Math.floor(this.width / 2 / this.gridSize) * this.gridSize;
        const bottomY = this.height - this.gridSize;
        
        this.snake = [
            { x: centerX, y: bottomY },
            { x: centerX, y: bottomY + this.gridSize },
            { x: centerX, y: bottomY + (this.gridSize * 2) }
        ];
        this.direction = 'up';
        this.nextDirection = 'up';
        this.score = 0;
        this.level = 1;
        this.speed = 2500; // Reset a 2.5 seg
        this.gameOver = false;
        this.gameTime = 0;
        this.obstacles = [];
        this.spawnFood();
        this.updateHUD();
    },

    start() {
        this.reset();
        this.startTime = Date.now();
        this.sounds.bg.play().catch(e => {});
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
        if (this.gameOver || this.isPaused) return;

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

        if (this.food && head.x === this.food.x && head.y === this.food.y) {
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
        this.speed = 3000; // Fijo a 3 seg después del nivel 1
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
        const onFood = this.food && this.food.x === x && this.food.y === y;

        if (onSnake || onFood) {
          this.spawnObstacle();
        } else {
            const obstacleTypes = ['🌳', '🪨', '🍄'];
            this.obstacles.push({ x, y, type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] });
        }
    },

    checkCollision() {
        const head = this.snake[0];

        // PAREDES: Colisión MUY estricta
        if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
            console.log("Collision with wall at:", head.x, head.y);
            this.endGame();
            return;
        }

        // CUERPO
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }

        // OBSTÁCULOS
        this.obstacles.forEach(o => {
            if (head.x === o.x && head.y === o.y) {
                this.endGame();
                return;
            }
        });
    },

    endGame() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.stop();
        this.sounds.collision.play().catch(e => {});
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

        // Paredes visuales neón
        this.ctx.strokeStyle = "#39ff14";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);

        if (this.food) {
          this.ctx.font = `${this.gridSize - 2}px Inter`;
          this.ctx.textAlign = 'left';
          this.ctx.textBaseline = 'top';
          this.ctx.fillText(this.food.type, this.food.x, this.food.y);
        }

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
            this.ctx.shadowBlur = isHead ? 20 : 10;
            this.ctx.shadowColor = "#39ff14";
            
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
