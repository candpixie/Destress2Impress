/**
 * Breathing Flappy Bird - Main Application
 * Entry point that initializes and coordinates all components
 */

class BreathingFlappyBirdApp {
    constructor() {
        this.wsClient = null;
        this.gameRenderer = null;
        this.gameUI = null;
        this.animationId = null;
        this.isInitialized = false;
        
        // Performance monitoring
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsUpdateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = 0;
        
        console.log('🐦 Breathing Flappy Bird - Initializing...');
    }
    
    async initialize() {
        try {
            console.log('Initializing application components...');
            
            // Initialize WebSocket client
            this.wsClient = new WebSocketClient();
            
            // Initialize game renderer
            this.gameRenderer = new GameRenderer('game-canvas');
            
            // Initialize game UI
            this.gameUI = new GameUI(this.wsClient, this.gameRenderer);
            
            // Start render loop
            this.startRenderLoop();
            
            // Connect to server
            this.wsClient.connect();
            
            this.isInitialized = true;
            console.log('✅ Application initialized successfully');
            
            // Set up error handlers
            this.setupErrorHandlers();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }
    
    startRenderLoop() {
        const render = (currentTime) => {
            try {
                // Calculate frame timing
                const deltaTime = currentTime - this.lastFrameTime;
                this.lastFrameTime = currentTime;
                this.frameCount++;
                
                // Update FPS display periodically
                if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
                    this.updateFPSDisplay();
                    this.lastFpsUpdate = currentTime;
                    this.frameCount = 0;
                }
                
                // Render frame
                this.gameRenderer.render(currentTime);
                
            } catch (error) {
                console.error('Render loop error:', error);
            }
            
            // Continue animation loop
            this.animationId = requestAnimationFrame(render);
        };
        
        // Start the loop
        this.animationId = requestAnimationFrame(render);
        console.log('🎬 Render loop started');
    }
    
    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log('⏹️ Render loop stopped');
        }
    }
    
    updateFPSDisplay() {
        const fps = Math.round(this.frameCount * 1000 / this.fpsUpdateInterval);
        
        // Update debug display if available
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement) {
            fpsElement.textContent = fps;
            
            // Color code FPS for performance indication
            if (fps >= 55) {
                fpsElement.style.color = '#27ae60'; // Green
            } else if (fps >= 30) {
                fpsElement.style.color = '#f39c12'; // Orange
            } else {
                fpsElement.style.color = '#e74c3c'; // Red
            }
        }
        
        // Log performance warnings
        if (fps < 30) {
            console.warn(`⚠️ Low FPS detected: ${fps}`);
        }
    }
    
    setupErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
            event.preventDefault();
        });
        
        // Canvas context lost handler
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('webglcontextlost', (event) => {
                console.warn('Canvas context lost');
                event.preventDefault();
            });
            
            canvas.addEventListener('webglcontextrestored', () => {
                console.log('Canvas context restored, reinitializing renderer...');
                this.gameRenderer.setupCanvas();
            });
        }
    }
    
    setupPerformanceMonitoring() {
        // Monitor memory usage if available
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
                const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
                
                // Log memory warnings
                if (usedMB > 100) {
                    console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
                }
            }, 30000); // Check every 30 seconds
        }
        
        // Monitor connection quality
        if (this.wsClient) {
            setInterval(() => {
                const connectionInfo = this.wsClient.getConnectionInfo();
                if (connectionInfo.reconnectAttempts > 0) {
                    console.warn(`⚠️ Connection instability: ${connectionInfo.reconnectAttempts} reconnect attempts`);
                }
            }, 10000); // Check every 10 seconds
        }
    }
    
    handleError(error) {
        // Display user-friendly error message
        const errorMessage = error?.message || 'An unexpected error occurred';
        
        // Show error notification
        if (this.gameUI) {
            this.gameUI.showError(errorMessage);
        }
        
        // Try to recover from certain types of errors
        if (errorMessage.includes('WebSocket') || errorMessage.includes('connection')) {
            console.log('Attempting to reconnect...');
            setTimeout(() => {
                if (this.wsClient && !this.wsClient.isConnected) {
                    this.wsClient.connect();
                }
            }, 2000);
        }
    }
    
    handleInitializationError(error) {
        console.error('Initialization failed:', error);
        
        // Show fallback error UI
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            const loadingContent = loadingOverlay.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div style="color: #e74c3c;">
                        <h2>❌ Initialization Failed</h2>
                        <p>Could not start the Breathing Flappy Bird game.</p>
                        <p style="font-size: 12px; margin-top: 20px;">
                            Error: ${error.message || 'Unknown error'}
                        </p>
                        <button onclick="location.reload()" style="
                            margin-top: 20px;
                            padding: 10px 20px;
                            background: #3498db;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-family: inherit;
                        ">
                            Reload Page
                        </button>
                    </div>
                `;
            }
        }
    }
    
    // Public API methods
    getGameState() {
        return this.wsClient ? this.wsClient.getLastGameState() : null;
    }
    
    getBreathingState() {
        return this.wsClient ? this.wsClient.getLastBreathingData() : null;
    }
    
    getConnectionInfo() {
        return this.wsClient ? this.wsClient.getConnectionInfo() : null;
    }
    
    getDebugInfo() {
        return {
            initialized: this.isInitialized,
            renderLoop: !!this.animationId,
            connection: this.getConnectionInfo(),
            gameState: this.getGameState(),
            breathingState: this.getBreathingState(),
            performance: {
                fps: this.gameRenderer ? this.gameRenderer.getFPS() : 0,
                frameCount: this.frameCount,
                lastFrameTime: this.lastFrameTime
            },
            wsClient: this.wsClient ? this.wsClient.getDebugInfo() : null
        };
    }
    
    // Cleanup method
    destroy() {
        console.log('🧹 Cleaning up application...');
        
        // Stop render loop
        this.stopRenderLoop();
        
        // Disconnect WebSocket
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
        
        // Clear references
        this.wsClient = null;
        this.gameRenderer = null;
        this.gameUI = null;
        this.isInitialized = false;
        
        console.log('✅ Application cleanup complete');
    }
}

// Global application instance
let breathingFlappyBirdApp = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 DOM ready, initializing Breathing Flappy Bird...');
        
        breathingFlappyBirdApp = new BreathingFlappyBirdApp();
        await breathingFlappyBirdApp.initialize();
        
        // Make app instance globally available for debugging
        window.breathingFlappyBirdApp = breathingFlappyBirdApp;
        
        console.log('🎉 Breathing Flappy Bird is ready to play!');
        
    } catch (error) {
        console.error('❌ Failed to start application:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (breathingFlappyBirdApp) {
        breathingFlappyBirdApp.destroy();
    }
});

// Handle visibility changes (pause when tab is not active)
document.addEventListener('visibilitychange', () => {
    if (breathingFlappyBirdApp && breathingFlappyBirdApp.wsClient) {
        if (document.hidden) {
            // Tab is hidden - could pause game or reduce performance
            console.log('Tab hidden - game continues running');
        } else {
            // Tab is visible again
            console.log('Tab visible - game resumed');
        }
    }
});

// Export for use in debugging or testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BreathingFlappyBirdApp;
}