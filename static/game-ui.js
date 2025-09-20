/**
 * Breathing Flappy Bird - Game UI Controller
 * Handles UI interactions, game state management, and breathing visualization
 */

class GameUI {
    constructor(wsClient, gameRenderer) {
        this.wsClient = wsClient;
        this.gameRenderer = gameRenderer;
        
        // UI state
        this.currentScreen = 'start';
        this.gameActive = false;
        this.gamePaused = false;
        this.breathingCalibrated = false;
        this.soundEnabled = true;
        this.breathingFeedbackEnabled = true;
        
        // Breathing visualization
        this.breathingState = 'neutral';
        this.breathingVolume = 0;
        this.breathingIntensity = 0;
        
        // Settings
        this.sensitivity = 1.0;
        
        // Elements cache
        this.elements = {};
        this.cacheElements();
        
        // Initialize UI
        this.setupEventListeners();
        this.setupWebSocketCallbacks();
        this.updateUIState();
        
        // Hide loading overlay once everything is ready
        this.hideLoadingOverlay();
    }
    
    cacheElements() {
        // Screens
        this.elements.startScreen = document.getElementById('start-screen');
        this.elements.gameOverScreen = document.getElementById('game-over-screen');
        this.elements.pauseScreen = document.getElementById('pause-screen');
        this.elements.gameOverlay = document.getElementById('game-overlay');
        
        // Buttons
        this.elements.startBtn = document.getElementById('start-btn');
        this.elements.restartBtn = document.getElementById('restart-btn');
        this.elements.menuBtn = document.getElementById('menu-btn');
        this.elements.resumeBtn = document.getElementById('resume-btn');
        this.elements.pauseBtn = document.getElementById('pause-btn');
        this.elements.stopBtn = document.getElementById('stop-btn');
        this.elements.calibrateBtn = document.getElementById('calibrate-btn');
        
        // Score displays
        this.elements.currentScore = document.getElementById('current-score');
        this.elements.highScore = document.getElementById('high-score');
        this.elements.finalScoreValue = document.getElementById('final-score-value');
        this.elements.finalHighScore = document.getElementById('final-high-score');
        this.elements.finalTime = document.getElementById('final-time');
        
        // Breathing indicators
        this.elements.breathingIndicator = document.getElementById('breathing-indicator');
        this.elements.breathingCircle = document.getElementById('breathing-circle');
        this.elements.breathingState = document.getElementById('breathing-state');
        this.elements.volumeFill = document.getElementById('volume-fill');
        this.elements.calibrationStatus = document.getElementById('calibration-status');
        this.elements.calibrationIcon = document.getElementById('calibration-icon');
        this.elements.calibrationText = document.getElementById('calibration-text');
        
        // Settings
        this.elements.sensitivitySlider = document.getElementById('sensitivity-slider');
        this.elements.sensitivityValue = document.getElementById('sensitivity-value');
        this.elements.soundToggle = document.getElementById('sound-toggle');
        this.elements.breathingFeedback = document.getElementById('breathing-feedback');
        
        // Debug
        this.elements.debugPanel = document.getElementById('debug-panel');
        this.elements.showDebugBtn = document.getElementById('show-debug');
        this.elements.toggleDebugBtn = document.getElementById('toggle-debug');
        this.elements.fullscreenBtn = document.getElementById('fullscreen-btn');
        
        // Debug info
        this.elements.fpsCounter = document.getElementById('fps-counter');
        this.elements.birdPosition = document.getElementById('bird-position');
        this.elements.birdVelocity = document.getElementById('bird-velocity');
        this.elements.activePipes = document.getElementById('active-pipes');
        this.elements.debugVolume = document.getElementById('debug-volume');
        
        // Loading
        this.elements.loadingOverlay = document.getElementById('loading-overlay');
        this.elements.loadingText = document.getElementById('loading-text');
    }
    
    setupEventListeners() {
        // Game control buttons
        this.elements.startBtn?.addEventListener('click', () => this.startGame());
        this.elements.restartBtn?.addEventListener('click', () => this.startGame());
        this.elements.menuBtn?.addEventListener('click', () => this.showMainMenu());
        this.elements.resumeBtn?.addEventListener('click', () => this.resumeGame());
        this.elements.pauseBtn?.addEventListener('click', () => this.pauseGame());
        this.elements.stopBtn?.addEventListener('click', () => this.stopGame());
        this.elements.calibrateBtn?.addEventListener('click', () => this.startCalibration());
        
        // Settings
        this.elements.sensitivitySlider?.addEventListener('input', (e) => {
            this.sensitivity = parseFloat(e.target.value);
            this.elements.sensitivityValue.textContent = this.sensitivity.toFixed(1);
            this.wsClient.setSensitivity(this.sensitivity);
        });
        
        this.elements.soundToggle?.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
        
        this.elements.breathingFeedback?.addEventListener('change', (e) => {
            this.breathingFeedbackEnabled = e.target.checked;
            this.updateBreathingVisualization();
        });
        
        // Debug controls
        this.elements.showDebugBtn?.addEventListener('click', () => {
            this.elements.debugPanel.style.display = 'block';
            this.elements.showDebugBtn.style.display = 'none';
        });
        
        this.elements.toggleDebugBtn?.addEventListener('click', () => {
            this.elements.debugPanel.style.display = 'none';
            this.elements.showDebugBtn.style.display = 'inline-block';
        });
        
        this.elements.fullscreenBtn?.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.currentScreen === 'start') {
                        this.startGame();
                    } else if (this.gameActive && !this.gamePaused) {
                        this.pauseGame();
                    } else if (this.gamePaused) {
                        this.resumeGame();
                    }
                    break;
                case 'Escape':
                    if (this.gameActive) {
                        this.stopGame();
                    }
                    break;
                case 'KeyC':
                    this.startCalibration();
                    break;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.gameRenderer.resize();
        });
    }
    
    setupWebSocketCallbacks() {
        // Connection events
        this.wsClient.on('connected', () => {
            this.updateLoadingText('Connected to server!');
            setTimeout(() => this.hideLoadingOverlay(), 500);
        });
        
        this.wsClient.on('disconnected', (data) => {
            this.showError('Disconnected from server');
            this.updateGameControls(false);
        });
        
        this.wsClient.on('error', (error) => {
            this.showError(`Connection error: ${error.error}`);
        });
        
        // Game events
        this.wsClient.on('gameStateUpdate', (gameState) => {
            this.updateGameState(gameState);
            this.updateDebugInfo(gameState);
        });
        
        this.wsClient.on('breathingDetected', (breathingData) => {
            this.updateBreathingState(breathingData);
        });
        
        this.wsClient.on('gameStarted', () => {
            this.showGameScreen();
            this.gameActive = true;
            this.gamePaused = false;
            this.updateGameControls(true);
        });
        
        this.wsClient.on('gamePaused', (data) => {
            this.gamePaused = data.is_paused;
            if (this.gamePaused) {
                this.showPauseScreen();
            } else {
                this.showGameScreen();
            }
        });
        
        this.wsClient.on('gameStopped', () => {
            this.gameActive = false;
            this.gamePaused = false;
            this.showMainMenu();
            this.updateGameControls(false);
        });
        
        this.wsClient.on('gameOver', (data) => {
            this.gameActive = false;
            this.showGameOverScreen(data);
            this.updateGameControls(false);
            
            if (this.soundEnabled) {
                this.playGameOverSound();
            }
        });
        
        this.wsClient.on('calibrationStarted', () => {
            this.showCalibrationFeedback();
        });
        
        this.wsClient.on('serverStatus', (status) => {
            console.log('Server status:', status);
        });
    }
    
    // Screen management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId.replace('-screen', '');
        }
    }
    
    showMainMenu() {
        this.showScreen('start-screen');
        this.elements.gameOverlay.style.display = 'flex';
    }
    
    showGameScreen() {
        this.elements.gameOverlay.style.display = 'none';
    }
    
    showPauseScreen() {
        this.showScreen('pause-screen');
        this.elements.gameOverlay.style.display = 'flex';
    }
    
    showGameOverScreen(data) {
        this.elements.finalScoreValue.textContent = data.score || 0;
        this.elements.finalHighScore.textContent = data.high_score || 0;
        this.elements.finalTime.textContent = `${(data.elapsed_time || 0).toFixed(1)}s`;
        
        this.showScreen('game-over-screen');
        this.elements.gameOverlay.style.display = 'flex';
    }
    
    // Game control actions
    startGame() {
        if (this.wsClient.startGame()) {
            this.updateLoadingText('Starting game...');
        } else {
            this.showError('Cannot start game: not connected to server');
        }
    }
    
    pauseGame() {
        this.wsClient.pauseGame();
    }
    
    resumeGame() {
        this.wsClient.pauseGame(); // Toggle pause
    }
    
    stopGame() {
        this.wsClient.stopGame();
    }
    
    startCalibration() {
        if (this.wsClient.calibrateBreathing()) {
            this.showCalibrationFeedback();
        } else {
            this.showError('Cannot calibrate: not connected to server');
        }
    }
    
    // Game state updates
    updateGameState(gameState) {
        // Update renderer
        this.gameRenderer.updateGameState(gameState);
        
        // Update score displays
        this.elements.currentScore.textContent = gameState.score || 0;
        this.elements.highScore.textContent = gameState.high_score || 0;
        
        // Update game status
        if (gameState.game_over && this.gameActive) {
            this.gameActive = false;
        }
        
        this.gamePaused = gameState.is_paused || false;
    }
    
    updateBreathingState(breathingData) {
        this.breathingState = breathingData.type;
        this.breathingVolume = breathingData.volume || 0;
        this.breathingIntensity = Math.min(100, this.breathingVolume);
        this.breathingCalibrated = breathingData.is_calibrated || false;
        
        // Update renderer
        this.gameRenderer.updateBreathingState(this.breathingState, this.breathingIntensity);
        
        // Update UI
        this.updateBreathingVisualization();
        this.updateCalibrationStatus();
    }
    
    updateBreathingVisualization() {
        if (!this.breathingFeedbackEnabled) return;
        
        // Update breathing indicator classes
        this.elements.breathingIndicator.className = `breathing-indicator ${this.breathingState}`;
        
        // Update breathing state text
        const stateText = {
            'inhale': '🫁⬆️ Inhaling',
            'exhale': '🫁⬇️ Exhaling',
            'neutral': '🫁➡️ Ready'
        };
        this.elements.breathingState.textContent = stateText[this.breathingState] || 'Ready';
        
        // Update volume bar
        const volumePercent = Math.min(100, (this.breathingVolume / 50) * 100);
        this.elements.volumeFill.style.width = `${volumePercent}%`;
        
        // Update debug volume
        if (this.elements.debugVolume) {
            this.elements.debugVolume.textContent = this.breathingVolume.toFixed(1);
        }
    }
    
    updateCalibrationStatus() {
        if (this.breathingCalibrated) {
            this.elements.calibrationStatus.classList.add('calibrated');
            this.elements.calibrationIcon.textContent = '✅';
            this.elements.calibrationText.textContent = 'Calibrated';
        } else {
            this.elements.calibrationStatus.classList.remove('calibrated');
            this.elements.calibrationIcon.textContent = '⚠️';
            this.elements.calibrationText.textContent = 'Not calibrated';
        }
    }
    
    updateGameControls(gameActive) {
        // Enable/disable control buttons based on game state
        this.elements.pauseBtn.disabled = !gameActive;
        this.elements.stopBtn.disabled = !gameActive;
        
        // Update button states
        if (gameActive) {
            this.elements.pauseBtn.querySelector('.icon').textContent = this.gamePaused ? '▶️' : '⏸️';
            this.elements.pauseBtn.querySelector('span:last-child').textContent = this.gamePaused ? 'Resume' : 'Pause';
        }
    }
    
    updateDebugInfo(gameState) {
        if (!gameState || !this.elements.fpsCounter) return;
        
        // Update FPS
        this.elements.fpsCounter.textContent = this.gameRenderer.getFPS();
        
        // Update bird info
        if (gameState.bird) {
            this.elements.birdPosition.textContent = `${gameState.bird.x.toFixed(1)}, ${gameState.bird.y.toFixed(1)}`;
            this.elements.birdVelocity.textContent = gameState.bird.velocity_y.toFixed(1);
        }
        
        // Update pipe count
        this.elements.activePipes.textContent = gameState.pipes ? gameState.pipes.length : 0;
    }
    
    // Utility methods
    showCalibrationFeedback() {
        // Visual feedback during calibration
        this.elements.calibrateBtn.textContent = '🎯 Calibrating...';
        this.elements.calibrateBtn.disabled = true;
        
        setTimeout(() => {
            this.elements.calibrateBtn.textContent = '🎯 Calibrate';
            this.elements.calibrateBtn.disabled = false;
        }, 3000);
        
        // Show instruction overlay
        this.showNotification('Breathe normally for a few seconds...', 3000);
    }
    
    showNotification(message, duration = 2000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(44, 62, 80, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1001;
            font-family: inherit;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            notification.style.transition = 'all 0.3s ease';
            notification.style.opacity = '1';
            notification.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    showError(message) {
        this.showNotification(`❌ ${message}`, 4000);
    }
    
    updateLoadingText(text) {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
    }
    
    hideLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    playGameOverSound() {
        // Simple audio feedback using Web Audio API
        if (!this.soundEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play sound:', error);
        }
    }
    
    updateUIState() {
        // Initialize UI state
        this.updateGameControls(false);
        this.updateCalibrationStatus();
        this.updateBreathingVisualization();
        
        // Set initial sensitivity
        if (this.elements.sensitivitySlider) {
            this.elements.sensitivitySlider.value = this.sensitivity;
            this.elements.sensitivityValue.textContent = this.sensitivity.toFixed(1);
        }
        
        // Set initial checkbox states
        if (this.elements.soundToggle) {
            this.elements.soundToggle.checked = this.soundEnabled;
        }
        if (this.elements.breathingFeedback) {
            this.elements.breathingFeedback.checked = this.breathingFeedbackEnabled;
        }
    }
}

// Export for use in other modules
window.GameUI = GameUI;