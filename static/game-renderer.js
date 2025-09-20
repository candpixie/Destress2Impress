/**
 * Breathing Flappy Bird - Game Renderer
 * Handles HTML5 Canvas rendering of game elements
 */

class GameRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Colors and styling
        this.colors = {
            sky: '#87CEEB',
            ground: '#DEB887',
            bird: {
                body: '#FFD700',
                wing: '#FFA500',
                beak: '#FF8C00',
                eye: '#FFFFFF',
                pupil: '#000000'
            },
            pipe: {
                body: '#228B22',
                highlight: '#32CD32',
                shadow: '#006400'
            },
            breathing: {
                inhale: '#3498db',
                exhale: '#e74c3c',
                neutral: '#95a5a6'
            }
        };
        
        // Animation properties
        this.animationTime = 0;
        this.lastFrameTime = 0;
        this.fps = 0;
        
        // Game state
        this.gameState = null;
        this.breathingState = 'neutral';
        this.breathingIntensity = 0;
        
        // Particle system for effects
        this.particles = [];
        
        // Initialize canvas
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Set up high DPI rendering
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Set canvas display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Update dimensions
        this.width = rect.width;
        this.height = rect.height;
        
        // Enable smooth rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    updateGameState(gameState) {
        this.gameState = gameState;
    }
    
    updateBreathingState(breathingState, intensity = 0) {
        this.breathingState = breathingState;
        this.breathingIntensity = Math.max(0, Math.min(1, intensity / 100));
        
        // Add breathing particles
        if (breathingState === 'inhale' || breathingState === 'exhale') {
            this.addBreathingParticles(breathingState);
        }
    }
    
    render(currentTime) {
        // Calculate FPS
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.fps = 1000 / deltaTime;
        this.animationTime = currentTime;
        
        // Clear canvas
        this.clearCanvas();
        
        if (!this.gameState) {
            this.renderWaitingScreen();
            return;
        }
        
        // Render game elements
        this.renderBackground();
        this.renderPipes();
        this.renderBird();
        this.renderUI();
        this.renderParticles();
        
        // Render breathing effects
        this.renderBreathingEffects();
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    renderBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#B0E0E6');
        gradient.addColorStop(1, '#F0F8FF');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add moving clouds
        this.renderClouds();
        
        // Ground
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(0, this.height - 50, this.width, 50);
        
        // Ground texture
        this.ctx.fillStyle = '#CD853F';
        for (let x = 0; x < this.width; x += 20) {
            this.ctx.fillRect(x, this.height - 45, 10, 5);
        }
    }
    
    renderClouds() {
        const cloudOffset = (this.animationTime * 0.01) % (this.width + 100);
        
        // Simple cloud shapes
        const clouds = [
            { x: -cloudOffset, y: 80, size: 40 },
            { x: 200 - cloudOffset, y: 120, size: 30 },
            { x: 450 - cloudOffset, y: 60, size: 35 },
            { x: 700 - cloudOffset, y: 100, size: 25 }
        ];
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        clouds.forEach(cloud => {
            if (cloud.x > -100 && cloud.x < this.width + 100) {
                this.drawCloud(cloud.x, cloud.y, cloud.size);
            }
        });
    }
    
    drawCloud(x, y, size) {
        this.ctx.save();
        this.ctx.beginPath();
        
        // Multiple circles to form cloud shape
        const circles = [
            { offsetX: 0, offsetY: 0, radius: size * 0.6 },
            { offsetX: size * 0.4, offsetY: -size * 0.2, radius: size * 0.4 },
            { offsetX: -size * 0.4, offsetY: -size * 0.2, radius: size * 0.4 },
            { offsetX: size * 0.6, offsetY: size * 0.2, radius: size * 0.3 },
            { offsetX: -size * 0.6, offsetY: size * 0.2, radius: size * 0.3 }
        ];
        
        circles.forEach(circle => {
            this.ctx.beginPath();
            this.ctx.arc(x + circle.offsetX, y + circle.offsetY, circle.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    renderBird() {
        if (!this.gameState.bird) return;
        
        const bird = this.gameState.bird;
        const x = (bird.x / this.gameState.game_width) * this.width;
        const y = (bird.y / this.gameState.game_height) * this.height;
        
        // Bird animation based on velocity and breathing
        const wingFlap = Math.sin(this.animationTime * 0.01) * 0.3;
        const breathingScale = 1 + (this.breathingIntensity * 0.2);
        const tilt = Math.max(-0.5, Math.min(0.5, bird.velocity_y * 0.05));
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(tilt);
        this.ctx.scale(breathingScale, breathingScale);
        
        // Breathing glow effect
        if (this.breathingState !== 'neutral') {
            const glowColor = this.colors.breathing[this.breathingState];
            const glowRadius = 30 + (this.breathingIntensity * 20);
            
            const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            glowGradient.addColorStop(0, glowColor + '40');
            glowGradient.addColorStop(1, glowColor + '00');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
        }
        
        // Bird body
        this.ctx.fillStyle = this.colors.bird.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird wing
        this.ctx.fillStyle = this.colors.bird.wing;
        this.ctx.beginPath();
        this.ctx.ellipse(-3, wingFlap, 12, 8, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird beak
        this.ctx.fillStyle = this.colors.bird.beak;
        this.ctx.beginPath();
        this.ctx.moveTo(12, -2);
        this.ctx.lineTo(18, 0);
        this.ctx.lineTo(12, 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Bird eye
        this.ctx.fillStyle = this.colors.bird.eye;
        this.ctx.beginPath();
        this.ctx.arc(3, -3, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye pupil
        this.ctx.fillStyle = this.colors.bird.pupil;
        this.ctx.beginPath();
        this.ctx.arc(4, -3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderPipes() {
        if (!this.gameState.pipes) return;
        
        this.gameState.pipes.forEach(pipe => {
            const x = (pipe.x / this.gameState.game_width) * this.width;
            const gapY = (pipe.gap_y / this.gameState.game_height) * this.height;
            const gapHeight = (pipe.gap_height / this.gameState.game_height) * this.height;
            const pipeWidth = (pipe.width / this.gameState.game_width) * this.width;
            
            // Only render pipes that are visible
            if (x + pipeWidth < 0 || x > this.width) return;
            
            // Top pipe
            this.drawPipe(x, 0, pipeWidth, gapY, false);
            
            // Bottom pipe
            this.drawPipe(x, gapY + gapHeight, pipeWidth, this.height - (gapY + gapHeight), true);
            
            // Gap highlight for breathing guidance
            if (this.breathingState !== 'neutral') {
                const highlightColor = this.colors.breathing[this.breathingState];
                this.ctx.fillStyle = highlightColor + '20';
                this.ctx.fillRect(x - 5, gapY, pipeWidth + 10, gapHeight);
            }
        });
    }
    
    drawPipe(x, y, width, height, isBottom) {
        // Pipe body
        const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
        gradient.addColorStop(0, this.colors.pipe.highlight);
        gradient.addColorStop(0.3, this.colors.pipe.body);
        gradient.addColorStop(0.7, this.colors.pipe.body);
        gradient.addColorStop(1, this.colors.pipe.shadow);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
        
        // Pipe cap
        const capHeight = 20;
        const capWidth = width + 4;
        const capX = x - 2;
        
        if (isBottom) {
            // Bottom pipe cap
            this.ctx.fillRect(capX, y, capWidth, capHeight);
        } else {
            // Top pipe cap
            this.ctx.fillRect(capX, y + height - capHeight, capWidth, capHeight);
        }
        
        // Pipe highlights
        this.ctx.fillStyle = this.colors.pipe.highlight;
        this.ctx.fillRect(x + 2, y, 2, height);
        
        // Pipe shadows
        this.ctx.fillStyle = this.colors.pipe.shadow;
        this.ctx.fillRect(x + width - 2, y, 2, height);
    }
    
    renderUI() {
        if (!this.gameState) return;
        
        // Score display on canvas
        this.ctx.save();
        this.ctx.font = 'bold 36px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // Score shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText(this.gameState.score.toString(), this.width / 2 + 2, 32);
        
        // Score text
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(this.gameState.score.toString(), this.width / 2, 30);
        
        this.ctx.restore();
    }
    
    renderBreathingEffects() {
        if (this.breathingState === 'neutral') return;
        
        // Breathing overlay effect
        const intensity = this.breathingIntensity;
        const color = this.colors.breathing[this.breathingState];
        
        // Vignette effect
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2
        );
        gradient.addColorStop(0, color + '00');
        gradient.addColorStop(1, color + Math.floor(intensity * 30).toString(16).padStart(2, '0'));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Breathing indicator arrows
        this.renderBreathingArrows();
    }
    
    renderBreathingArrows() {
        if (!this.gameState.bird) return;
        
        const bird = this.gameState.bird;
        const birdX = (bird.x / this.gameState.game_width) * this.width;
        const birdY = (bird.y / this.gameState.game_height) * this.height;
        
        const arrowSize = 20 + (this.breathingIntensity * 10);
        const arrowColor = this.colors.breathing[this.breathingState];
        
        this.ctx.save();
        this.ctx.fillStyle = arrowColor;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        
        // Multiple arrows based on intensity
        const arrowCount = Math.floor(this.breathingIntensity * 3) + 1;
        const direction = this.breathingState === 'inhale' ? -1 : 1;
        
        for (let i = 0; i < arrowCount; i++) {
            const offset = (i * 30 + 40) * direction;
            const alpha = 1 - (i * 0.3);
            
            this.ctx.globalAlpha = alpha;
            this.drawArrow(birdX, birdY + offset, arrowSize, direction > 0);
        }
        
        this.ctx.restore();
    }
    
    drawArrow(x, y, size, pointDown) {
        this.ctx.beginPath();
        
        if (pointDown) {
            // Down arrow
            this.ctx.moveTo(x, y + size);
            this.ctx.lineTo(x - size / 2, y);
            this.ctx.lineTo(x + size / 2, y);
        } else {
            // Up arrow  
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x - size / 2, y);
            this.ctx.lineTo(x + size / 2, y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    addBreathingParticles(breathingType) {
        if (!this.gameState.bird) return;
        
        const bird = this.gameState.bird;
        const birdX = (bird.x / this.gameState.game_width) * this.width;
        const birdY = (bird.y / this.gameState.game_height) * this.height;
        
        // Add particles around the bird
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: birdX + (Math.random() - 0.5) * 40,
                y: birdY + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 4,
                vy: breathingType === 'inhale' ? -Math.random() * 3 - 1 : Math.random() * 3 + 1,
                life: 1.0,
                decay: 0.02,
                size: Math.random() * 4 + 2,
                color: this.colors.breathing[breathingType]
            });
        }
    }
    
    renderParticles() {
        this.particles = this.particles.filter(particle => {
            // Update particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            if (particle.life <= 0) return false;
            
            // Render particle
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            
            return true;
        });
    }
    
    renderWaitingScreen() {
        // Waiting for connection screen
        this.ctx.save();
        
        // Background
        this.renderBackground();
        
        // Waiting message
        this.ctx.font = 'bold 24px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Connecting to server...', this.width / 2, this.height / 2);
        
        // Animated dots
        const dots = '.'.repeat(Math.floor(this.animationTime / 500) % 4);
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.fillText(dots, this.width / 2, this.height / 2 + 40);
        
        this.ctx.restore();
    }
    
    getFPS() {
        return Math.round(this.fps);
    }
    
    resize() {
        this.setupCanvas();
    }
}

// Export for use in other modules
window.GameRenderer = GameRenderer;