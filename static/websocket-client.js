/**
 * Breathing Flappy Bird - WebSocket Client
 * Handles real-time communication with the backend server
 */

class WebSocketClient {
    constructor(serverUrl = window.location.origin) {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // Event callbacks
        this.callbacks = {
            connected: [],
            disconnected: [],
            gameStateUpdate: [],
            breathingDetected: [],
            gameOver: [],
            gameStarted: [],
            gamePaused: [],
            gameStopped: [],
            calibrationStarted: [],
            sensitivityUpdated: [],
            serverStatus: [],
            error: []
        };
        
        // Connection state
        this.connectionStatus = 'disconnected';
        this.lastGameState = null;
        this.lastBreathingData = null;
    }
    
    connect() {
        try {
            console.log(`Attempting to connect to ${this.serverUrl}`);
            this.updateConnectionStatus('connecting');
            
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 5000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });
            
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('Connection error:', error);
            this.triggerCallback('error', { type: 'connection', error: error.message });
            this.scheduleReconnect();
        }
    }
    
    setupEventHandlers() {
        if (!this.socket) return;
        
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('connected');
            this.triggerCallback('connected');
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            this.triggerCallback('disconnected', { reason });
            
            if (reason === 'io server disconnect') {
                // Server initiated disconnect - don't reconnect automatically
                return;
            }
            
            this.scheduleReconnect();
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus('error');
            this.triggerCallback('error', { type: 'connection', error: error.message });
            this.scheduleReconnect();
        });
        
        // Game events
        this.socket.on('server_status', (data) => {
            console.log('Server status:', data);
            this.triggerCallback('serverStatus', data);
        });
        
        this.socket.on('game_state', (gameState) => {
            this.lastGameState = gameState;
            this.triggerCallback('gameStateUpdate', gameState);
        });
        
        this.socket.on('breathing_detected', (breathingData) => {
            this.lastBreathingData = breathingData;
            this.triggerCallback('breathingDetected', breathingData);
        });
        
        this.socket.on('game_over', (data) => {
            console.log('Game over:', data);
            this.triggerCallback('gameOver', data);
        });
        
        this.socket.on('game_started', (data) => {
            console.log('Game started:', data);
            this.triggerCallback('gameStarted', data);
        });
        
        this.socket.on('game_paused', (data) => {
            console.log('Game paused:', data);
            this.triggerCallback('gamePaused', data);
        });
        
        this.socket.on('game_stopped', (data) => {
            console.log('Game stopped:', data);
            this.triggerCallback('gameStopped', data);
        });
        
        this.socket.on('calibration_started', (data) => {
            console.log('Calibration started:', data);
            this.triggerCallback('calibrationStarted', data);
        });
        
        this.socket.on('sensitivity_updated', (data) => {
            console.log('Sensitivity updated:', data);
            this.triggerCallback('sensitivityUpdated', data);
        });
        
        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.triggerCallback('error', { type: 'socket', error: error.message || error });
        });
    }
    
    updateConnectionStatus(status) {
        this.connectionStatus = status;
        
        // Update UI status indicator
        const statusElement = document.getElementById('connection-status');
        const iconElement = document.getElementById('status-icon');
        const textElement = document.getElementById('status-text');
        
        if (statusElement && iconElement && textElement) {
            statusElement.className = `status-bar ${status}`;
            
            switch (status) {
                case 'connected':
                    iconElement.textContent = '🟢';
                    textElement.textContent = 'Connected to server';
                    break;
                case 'connecting':
                    iconElement.textContent = '🟡';
                    textElement.textContent = 'Connecting to server...';
                    break;
                case 'disconnected':
                    iconElement.textContent = '🔴';
                    textElement.textContent = 'Disconnected from server';
                    break;
                case 'error':
                    iconElement.textContent = '❌';
                    textElement.textContent = 'Connection error';
                    break;
                case 'reconnecting':
                    iconElement.textContent = '🔄';
                    textElement.textContent = `Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`;
                    break;
            }
        }
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            this.updateConnectionStatus('error');
            return;
        }
        
        this.reconnectAttempts++;
        this.updateConnectionStatus('reconnecting');
        
        console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, this.reconnectDelay);
        
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
    }
    
    // Game control methods
    startGame() {
        if (this.isConnected && this.socket) {
            console.log('Starting game...');
            this.socket.emit('start_game');
            return true;
        } else {
            console.warn('Cannot start game: not connected to server');
            this.triggerCallback('error', { type: 'action', error: 'Not connected to server' });
            return false;
        }
    }
    
    pauseGame() {
        if (this.isConnected && this.socket) {
            console.log('Pausing game...');
            this.socket.emit('pause_game');
            return true;
        } else {
            console.warn('Cannot pause game: not connected to server');
            return false;
        }
    }
    
    stopGame() {
        if (this.isConnected && this.socket) {
            console.log('Stopping game...');
            this.socket.emit('stop_game');
            return true;
        } else {
            console.warn('Cannot stop game: not connected to server');
            return false;
        }
    }
    
    calibrateBreathing() {
        if (this.isConnected && this.socket) {
            console.log('Starting breathing calibration...');
            this.socket.emit('calibrate_breathing');
            return true;
        } else {
            console.warn('Cannot calibrate: not connected to server');
            this.triggerCallback('error', { type: 'action', error: 'Not connected to server' });
            return false;
        }
    }
    
    setSensitivity(sensitivity) {
        if (this.isConnected && this.socket) {
            console.log(`Setting sensitivity to ${sensitivity}`);
            this.socket.emit('set_sensitivity', { sensitivity: parseFloat(sensitivity) });
            return true;
        } else {
            console.warn('Cannot set sensitivity: not connected to server');
            return false;
        }
    }
    
    requestGameState() {
        if (this.isConnected && this.socket) {
            this.socket.emit('request_game_state');
            return true;
        }
        return false;
    }
    
    // Event callback management
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        } else {
            console.warn(`Unknown event type: ${event}`);
        }
    }
    
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    triggerCallback(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }
    
    // Utility methods
    isGameActive() {
        return this.lastGameState && !this.lastGameState.game_over && this.lastGameState.score !== undefined;
    }
    
    getLastGameState() {
        return this.lastGameState;
    }
    
    getLastBreathingData() {
        return this.lastBreathingData;
    }
    
    getConnectionInfo() {
        return {
            status: this.connectionStatus,
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            serverUrl: this.serverUrl
        };
    }
    
    disconnect() {
        if (this.socket) {
            console.log('Disconnecting from server...');
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            connection: this.getConnectionInfo(),
            lastGameState: this.lastGameState,
            lastBreathingData: this.lastBreathingData,
            callbackCounts: Object.keys(this.callbacks).reduce((acc, key) => {
                acc[key] = this.callbacks[key].length;
                return acc;
            }, {})
        };
    }
}

// Export for use in other modules
window.WebSocketClient = WebSocketClient;