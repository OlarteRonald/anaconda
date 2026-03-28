const App = {
    user: null,
    currentScreen: 'loading-screen',
    isSignUp: false,

    async init() {
        // Mostrar botón de entrar después de la animación de carga
        setTimeout(() => {
            const loader = document.getElementById('initial-loader');
            const enterBtn = document.getElementById('enter-btn');
            if (loader) loader.style.display = 'none';
            if (enterBtn) enterBtn.style.display = 'block';
        }, 2500);

        this.setupEventListeners();
    },

    async checkSession() {
        const user = await SupabaseManager.getUser();
        if (user) {
            this.user = user;
            await this.visitDashboard();
        } else {
            this.showScreen('auth-screen');
        }
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        this.currentScreen = screenId;
    },

    async visitDashboard() {
        try {
            this.showScreen('dashboard-screen');
            await this.loadRankings();
        } catch (error) {
            console.error("Dashboard error:", error);
        }
    },

    async loadRankings() {
        const globalRank = await SupabaseManager.getGlobalTop5();
        const personalRank = this.user ? await SupabaseManager.getPersonalTop5(this.user.id) : [];

        this.populateRanking('global-rankings', globalRank);
        this.populateRanking('personal-rankings', personalRank);
    },

    populateRanking(elementId, items) {
        const list = document.getElementById(elementId);
        if (!list) return;
        list.innerHTML = '';
        items.forEach((item, index) => {
            const li = document.createElement('li');
            const username = item.username || `Tú (${index + 1})`;
            li.innerHTML = `<span><strong>#${index + 1}</strong> ${username}</span> <span>${item.score} pts (${item.time}s)</span>`;
            list.appendChild(li);
        });
        if (items.length === 0) list.innerHTML = "<li>Aún no hay puntuaciones registradas</li>";
    },

    setupEventListeners() {
        // Botón entrar inicial
        document.getElementById('enter-btn')?.addEventListener('click', () => {
          this.checkSession();
        });

        // Alternar Login/Registro
        document.body.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'toggle-btn') {
                this.isSignUp = !this.isSignUp;
                this.updateAuthUI();
            }
        });

        // Formulario de Autenticación
        document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('login-username').value;
            const password = document.getElementById('password').value;
            const email = document.getElementById('reg-email')?.value;

            try {
                if (this.isSignUp) {
                    await SupabaseManager.signUp(email, password, identifier);
                    alert("¡Cuenta registrada! Revisa tu email para confirmar o intenta entrar.");
                    this.isSignUp = false;
                    this.updateAuthUI();
                } else {
                    const data = await SupabaseManager.signIn(identifier, password);
                    this.user = data.user;
                    await this.visitDashboard();
                }
            } catch (error) {
                alert("Error: " + error.message);
            }
        });

        // Cerrar Sesión
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await SupabaseManager.signOut();
            this.user = null;
            this.showScreen('auth-screen');
        });

        // Botón Jugar
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            this.showScreen('instructions-screen');
        });

        // Cámara
        document.getElementById('grant-camera-btn')?.addEventListener('click', async () => {
            this.showScreen('game-screen');
            await AIManager.init();
            this.startGame();
        });

        // Retenedor
        document.getElementById('retry-btn')?.addEventListener('click', () => {
            this.showScreen('game-screen');
            this.startGame();
        });

        document.getElementById('home-btn')?.addEventListener('click', () => {
            this.visitDashboard();
        });

        // Pausa
        window.addEventListener('keydown', (e) => {
          if (e.key === 'p' || e.key === 'P') {
            Game.pause();
          }
        });
    },

    updateAuthUI() {
        const title = document.getElementById('auth-title');
        const btn = document.getElementById('auth-btn');
        const label = document.getElementById('auth-label-user');
        const emailGroup = document.getElementById('reg-email-group');
        const toggleContainer = document.querySelector('.toggle-auth');
        
        if (this.isSignUp) {
          title.innerText = 'Registro';
          btn.innerText = 'Registrarse';
          label.innerText = 'Nombre de Usuario';
          emailGroup.style.display = 'block';
          toggleContainer.innerHTML = '¿Ya tienes cuenta? <span id="toggle-btn" style="color: var(--accent); cursor: pointer;">Inicia Sesión</span>';
        } else {
          title.innerText = 'Iniciar Sesión';
          btn.innerText = 'Entrar';
          label.innerText = 'Usuario';
          emailGroup.style.display = 'none';
          toggleContainer.innerHTML = '¿No tienes cuenta? <span id="toggle-btn" style="color: var(--accent); cursor: pointer;">Regístrate</span>';
        }
    },

    startGame() {
        const canvas = document.getElementById('game-canvas');
        Game.init(canvas);
        
        AIManager.onGestureDetected = (label) => {
          const mapping = {
            'spoon_up': 'up',
            'spoon_right': 'right',
            'fork_down': 'down',
            'fork_left': 'left'
          };
          if (mapping[label]) {
            Game.setDirection(mapping[label]);
          }
        };

        Game.onGameOver = async (score, time) => {
            this.showScreen('game-over-screen');
            document.getElementById('final-score-val').innerText = score;
            document.getElementById('final-time-val').innerText = time;
            
            if (this.user) {
              const username = this.user.user_metadata.username || this.user.email.split('@')[0];
              await SupabaseManager.saveScore(this.user.id, username, score, time);
            }
        };

        Game.start();
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
