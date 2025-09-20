from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO, emit
import json
import time
import threading
from breathing_detector import BreathingDetector
from flappy_bird_game import FlappyBirdGame

class BreathingFlappyBirdServer:
    def __init__(self, host='localhost', port=5000):
        # Flask app setup
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'breathing_flappy_bird_secret'
        self.socketio = SocketIO(self.app, cors_allowed_origins="*", 
                               async_mode='threading')
        
        # Game components
        self.game = None
        self.breathing_detector = None
        self.connected_clients = set()
        
        # Server state
        self.host = host
        self.port = port
        self.is_running = False
        
        # Setup routes and socket events
        self._setup_routes()
        self._setup_socket_events()
        
    def _setup_routes(self):
        """Setup Flask routes"""
        @self.app.route('/')
        def index():
            return render_template('index.html')
            
        @self.app.route('/mic-test')
        def mic_test():
            return send_from_directory('.', 'mic_test.html')
            
        @self.app.route('/api')
        def api_info():
            return """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Breathing Flappy Bird API</title>
                <meta charset="utf-8">
                    <style>
                        body {{ font-family: monospace; margin: 40px; background: #f5f5f5; }}
                        .container {{ max-width: 800px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                        h1 {{ color: #2c3e50; }}
                        h2 {{ color: #3498db; margin-top: 30px; }}
                        .endpoint {{ background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 4px; }}
                        .method {{ color: #27ae60; font-weight: bold; }}
                        .url {{ color: #e74c3c; }}
                        .description {{ margin-top: 5px; color: #7f8c8d; }}
                        code {{ background: #34495e; color: white; padding: 2px 6px; border-radius: 3px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🐦 Breathing Flappy Bird API</h1>
                        <p>Server is running on <strong>{0}:{1}</strong></p>
                        
                        <h2>🌐 Web Interface</h2>
                        <div class="endpoint">
                            <div><span class="method">GET</span> <span class="url">/</span></div>
                            <div class="description">Main game interface - play the breathing-controlled Flappy Bird!</div>
                        </div>
                        
                        <h2>📡 WebSocket API</h2>
                        <div class="endpoint">
                            <div><strong>Endpoint:</strong> <code>ws://{2}:{3}/</code></div>
                            <div class="description">Real-time game communication</div>
                        </div>                    <h3>Client → Server Events:</h3>
                    <ul>
                        <li><code>start_game</code> - Start new game</li>
                        <li><code>pause_game</code> - Pause/unpause game</li>
                        <li><code>stop_game</code> - Stop current game</li>
                        <li><code>calibrate_breathing</code> - Start breathing calibration</li>
                        <li><code>set_sensitivity</code> - Adjust breathing sensitivity</li>
                        <li><code>request_game_state</code> - Request current game state</li>
                    </ul>
                    
                    <h3>Server → Client Events:</h3>
                    <ul>
                        <li><code>game_state</code> - Real-time game state updates (60 FPS)</li>
                        <li><code>breathing_detected</code> - Breathing pattern events</li>
                        <li><code>game_over</code> - Game over notification</li>
                        <li><code>game_started</code> - Game started confirmation</li>
                        <li><code>calibration_started</code> - Calibration process started</li>
                    </ul>

                    <h2>🔧 REST API</h2>
                    <div class="endpoint">
                        <div><span class="method">GET</span> <span class="url">/status</span></div>
                        <div class="description">Get server status and current game state</div>
                    </div>
                    <div class="endpoint">
                        <div><span class="method">POST</span> <span class="url">/start_game</span></div>
                        <div class="description">Start a new game session</div>
                    </div>
                    <div class="endpoint">
                        <div><span class="method">POST</span> <span class="url">/pause_game</span></div>
                        <div class="description">Pause or resume the current game</div>
                    </div>
                    <div class="endpoint">
                        <div><span class="method">POST</span> <span class="url">/stop_game</span></div>
                        <div class="description">Stop the current game</div>
                    </div>
                    <div class="endpoint">
                        <div><span class="method">POST</span> <span class="url">/calibrate</span></div>
                        <div class="description">Start breathing detection calibration</div>
                    </div>
                    
                    <h2>🎮 Game Controls</h2>
                    <ul>
                        <li>🫁⬆️ <strong>Inhale</strong> - Bird flies UP</li>
                        <li>🫁⬇️ <strong>Exhale</strong> - Bird goes DOWN</li>
                        <li>🫁➡️ <strong>Hold breath</strong> - Bird falls with gravity</li>
                    </ul>
                    
                    <h2>📊 Example Game State</h2>
                    <pre style="background: #34495e; color: white; padding: 15px; border-radius: 4px; overflow-x: auto;">{{
  "bird": {{
    "x": 100,
    "y": 250,
    "velocity_y": -2.5,
    "radius": 20
  }},
  "pipes": [
    {{
      "x": 400,
      "gap_y": 200,
      "gap_height": 120,
      "width": 50,
      "passed": false
    }}
  ],
  "score": 5,
  "high_score": 12,
  "game_over": false,
  "breathing_state": "inhale",
  "game_width": 800,
  "game_height": 600
}}</pre>
                    
                    <p style="margin-top: 30px; text-align: center; color: #7f8c8d;">
                        <a href="/" style="color: #3498db;">← Back to Game</a>
                    </p>
                </div>
            </body>
            </html>
            """.format(self.host, self.port, self.host, self.port)
            
        @self.app.route('/status')
        def status():
            return {
                'server_running': self.is_running,
                'game_active': self.game is not None and self.game.is_running,
                'breathing_detector_active': (self.breathing_detector is not None and 
                                           self.breathing_detector.is_running),
                'connected_clients': len(self.connected_clients),
                'game_state': self.game.get_game_state() if self.game else None,
                'breathing_state': (self.breathing_detector.get_current_state() 
                                  if self.breathing_detector else None)
            }
            
        @self.app.route('/calibrate', methods=['POST'])
        def calibrate():
            if self.breathing_detector:
                self.breathing_detector.recalibrate()
                return {'status': 'calibration_started'}
            return {'error': 'breathing_detector_not_active'}, 400
            
        @self.app.route('/start_game', methods=['POST'])
        def start_game():
            self._start_new_game()
            return {'status': 'game_started'}
            
        @self.app.route('/pause_game', methods=['POST'])
        def pause_game():
            if self.game:
                self.game.pause_game()
                return {'status': 'game_paused', 'is_paused': self.game.is_paused}
            return {'error': 'no_active_game'}, 400
            
        @self.app.route('/stop_game', methods=['POST'])
        def stop_game():
            if self.game:
                self.game.stop_game()
                return {'status': 'game_stopped'}
            return {'error': 'no_active_game'}, 400
            
    def _setup_socket_events(self):
        """Setup SocketIO event handlers"""
        @self.socketio.on('connect')
        def handle_connect():
            client_id = request.sid
            self.connected_clients.add(client_id)
            print(f"Client {client_id} connected")
            
            # Send current status to new client
            emit('server_status', {
                'connected': True,
                'game_active': self.game is not None and self.game.is_running,
                'breathing_active': (self.breathing_detector is not None and 
                                   self.breathing_detector.is_running)
            })
            
        @self.socketio.on('disconnect')
        def handle_disconnect():
            client_id = request.sid
            self.connected_clients.discard(client_id)
            print(f"Client {client_id} disconnected")
            
        @self.socketio.on('start_game')
        def handle_start_game(data=None):
            self._start_new_game()
            emit('game_started', {'status': 'success'})
            
        @self.socketio.on('pause_game')
        def handle_pause_game(data=None):
            if self.game:
                self.game.pause_game()
                emit('game_paused', {'is_paused': self.game.is_paused})
                
        @self.socketio.on('stop_game')
        def handle_stop_game(data=None):
            if self.game:
                self.game.stop_game()
                emit('game_stopped', {})
                
        @self.socketio.on('calibrate_breathing')
        def handle_calibrate_breathing(data=None):
            if self.breathing_detector:
                self.breathing_detector.recalibrate()
                emit('calibration_started', {})
                
        @self.socketio.on('set_sensitivity')
        def handle_set_sensitivity(data):
            sensitivity = data.get('sensitivity', 1.0)
            if self.breathing_detector:
                self.breathing_detector.set_sensitivity(sensitivity)
                emit('sensitivity_updated', {'sensitivity': sensitivity})
                
        @self.socketio.on('request_game_state')
        def handle_request_game_state(data=None):
            if self.game:
                emit('game_state', self.game.get_game_state())
                
    def _start_new_game(self):
        """Start a new game session"""
        # Stop existing game if running
        if self.game:
            self.game.stop_game()
            
        # Create new game instance
        self.game = FlappyBirdGame(breathing_callback=self._on_game_update)
        
        # Start breathing detection if not already running
        if not self.breathing_detector or not self.breathing_detector.is_running:
            self._start_breathing_detection()
            
        # Start the game
        self.game.start_game()
        print("New game started")
        
    def _start_breathing_detection(self):
        """Start the breathing detection system"""
        if self.breathing_detector:
            self.breathing_detector.stop_audio_stream()
            
        self.breathing_detector = BreathingDetector(
            callback=self._on_breathing_detected
        )
        
        try:
            self.breathing_detector.start_audio_stream()
            print("Breathing detection started")
        except Exception as e:
            print(f"Error starting breathing detection: {e}")
            self.breathing_detector = None
            
    def _on_breathing_detected(self, breath_type, volume):
        """Handle breathing detection events"""
        # Pass breathing input to game
        if self.game and self.game.is_running:
            self.game.on_breathing_input(breath_type, volume)
            
        # Broadcast breathing state to clients
        self._broadcast_breathing_state(breath_type, volume)
        
    def _broadcast_breathing_state(self, breath_type, volume):
        """Broadcast breathing state to all connected clients"""
        breathing_data = {
            'type': breath_type,
            'volume': volume,
            'timestamp': time.time()
        }
        
        if self.breathing_detector:
            breathing_state = self.breathing_detector.get_current_state()
            breathing_data.update({
                'is_calibrated': breathing_state['is_calibrated'],
                'baseline': breathing_state['baseline']
            })
            
        self.socketio.emit('breathing_detected', breathing_data)
        
    def _on_game_update(self, game_state):
        """Handle game state updates"""
        # Broadcast game state to all connected clients
        self.socketio.emit('game_state', game_state)
        
        # Handle game over
        if game_state['game_over']:
            self.socketio.emit('game_over', {
                'score': game_state['score'],
                'high_score': game_state['high_score'],
                'elapsed_time': game_state['elapsed_time']
            })
            
    def start_server(self, debug=False):
        """Start the Flask-SocketIO server"""
        self.is_running = True
        print(f"Starting Breathing Flappy Bird server on {self.host}:{self.port}")
        
        # Start the server
        self.socketio.run(
            self.app,
            host=self.host,
            port=self.port,
            debug=debug,
            use_reloader=False  # Disable reloader to prevent threading issues
        )
        
    def stop_server(self):
        """Stop the server and cleanup resources"""
        self.is_running = False
        
        # Stop game
        if self.game:
            self.game.stop_game()
            
        # Stop breathing detection
        if self.breathing_detector:
            self.breathing_detector.stop_audio_stream()
            
        print("Server stopped")
        
    def get_server_stats(self):
        """Get server statistics"""
        stats = {
            'uptime': time.time() - getattr(self, '_start_time', time.time()),
            'connected_clients': len(self.connected_clients),
            'game_active': self.game is not None and self.game.is_running,
            'breathing_active': (self.breathing_detector is not None and 
                               self.breathing_detector.is_running)
        }
        
        if self.game:
            stats['game_stats'] = self.game.get_stats()
            
        if self.breathing_detector:
            stats['breathing_stats'] = self.breathing_detector.get_current_state()
            
        return stats

# Main entry point
if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Breathing Flappy Bird Server')
    parser.add_argument('--host', default='localhost', help='Server host')
    parser.add_argument('--port', type=int, default=5000, help='Server port')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Create and start server
    server = BreathingFlappyBirdServer(host=args.host, port=args.port)
    
    try:
        server.start_server(debug=args.debug)
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.stop_server()