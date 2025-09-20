#!/usr/bin/env python3
"""
Unified Destress to Impress Application
Combines breathing Flappy Bird game with stress monitoring and AI coaching

Features:
1. Breathing-controlled Flappy Bird game
2. Real-time stress level monitoring from EmotiBit
3. AI-powered coaching messages based on stress levels
4. YouTube video recommendations for stress relief
5. 3D Fashion game integration

Routes:
- /: Main stress monitoring dashboard
- /flappy: Breathing Flappy Bird game
- /fashion: 3D Fashion game
- /api/data: Real-time stress data API
- WebSocket endpoints for real-time game communication
"""

import argparse
import sys
import signal
import time
import threading
import os
from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_socketio import SocketIO, emit

# Try to import the destress modules (may not exist yet)
try:
    from destress_modules.read_emotibit import get_stress_level
    from destress_modules.youtube_recommender import recommend_videos
    from destress_modules.llm_coach import get_coaching_message
    STRESS_MODULES_AVAILABLE = True
except ImportError:
    print("⚠️  Stress monitoring modules not found. Using mock data.")
    STRESS_MODULES_AVAILABLE = False

# Try to import breathing game modules
try:
    from breathing_detector import BreathingDetector
    from flappy_bird_game import FlappyBirdGame
    BREATHING_GAME_AVAILABLE = True
except ImportError:
    print("⚠️  Breathing game modules not found. Breathing features disabled.")
    BREATHING_GAME_AVAILABLE = False

class UnifiedDestressApp:
    def __init__(self, host='localhost', port=5000):
        # Flask app setup
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'destress_to_impress_unified_secret'
        self.socketio = SocketIO(self.app, cors_allowed_origins="*", 
                               async_mode='threading')
        
        # Server state
        self.host = host
        self.port = port
        self.is_running = False
        
        # Stress monitoring state
        self.current_stress = 5.0
        self.current_videos = []
        self.current_message = "Welcome to Destress to Impress! Calibrating..."
        
        # Breathing game state
        self.breathing_game = None
        self.breathing_detector = None
        self.connected_clients = set()
        
        # Setup routes and socket events
        self._setup_routes()
        self._setup_socket_events()
        
        # Start background stress monitoring
        if STRESS_MODULES_AVAILABLE:
            self._start_stress_monitoring()
        
    def _setup_routes(self):
        """Setup Flask routes"""
        
        # Main stress monitoring dashboard
        @self.app.route('/')
        def index():
            """Serve the main stress monitoring dashboard."""
            return render_template('dashboard.html',
                stress=self.current_stress,
                videos=self.current_videos,
                message=self.current_message
            )
        
        # Breathing Flappy Bird game
        @self.app.route('/flappy')
        def flappy_bird():
            """Serve the breathing Flappy Bird game."""
            if not BREATHING_GAME_AVAILABLE:
                return render_template('error.html', 
                    message="Breathing game modules not available")
            return render_template('index.html')
        
        # 3D Fashion game
        @self.app.route('/fashion')
        def fashion_game():
            """Serve the 3D Fashion game."""
            return send_from_directory('.', 'fashion_store_3d.html')
        
        # Original 2D Fashion game
        @self.app.route('/fashion-2d')
        def fashion_game_2d():
            """Serve the 2D Fashion game."""
            return send_from_directory('.', 'dress_to_impress.html')
        
        # API endpoints
        @self.app.route('/api/data')
        def api_data():
            """API endpoint for real-time stress data updates."""
            return jsonify({
                'stress_level': round(self.current_stress, 1),
                'videos': self.current_videos,
                'message': self.current_message,
                'timestamp': time.time()
            })
        
        @self.app.route('/api/status')
        def api_status():
            """Get comprehensive system status."""
            return jsonify({
                'server_running': self.is_running,
                'stress_monitoring': STRESS_MODULES_AVAILABLE,
                'breathing_game_available': BREATHING_GAME_AVAILABLE,
                'breathing_game_active': (self.breathing_game is not None and 
                                        hasattr(self.breathing_game, 'is_running') and 
                                        self.breathing_game.is_running),
                'breathing_detector_active': (self.breathing_detector is not None and 
                                           hasattr(self.breathing_detector, 'is_running') and
                                           self.breathing_detector.is_running),
                'connected_clients': len(self.connected_clients),
                'current_stress': self.current_stress,
                'game_state': (self.breathing_game.get_game_state() 
                              if self.breathing_game and hasattr(self.breathing_game, 'get_game_state') 
                              else None)
            })
        
        # Game control endpoints
        @self.app.route('/api/start_flappy_game', methods=['POST'])
        def start_flappy_game():
            """Start the breathing Flappy Bird game."""
            if not BREATHING_GAME_AVAILABLE:
                return jsonify({'error': 'Breathing game not available'}), 400
            
            self._start_breathing_game()
            return jsonify({'status': 'breathing_game_started'})
        
        @self.app.route('/api/stop_flappy_game', methods=['POST'])
        def stop_flappy_game():
            """Stop the breathing Flappy Bird game."""
            if self.breathing_game and hasattr(self.breathing_game, 'stop_game'):
                self.breathing_game.stop_game()
                return jsonify({'status': 'breathing_game_stopped'})
            return jsonify({'error': 'no_active_breathing_game'}, 400)
        
        @self.app.route('/api/calibrate_breathing', methods=['POST'])
        def calibrate_breathing():
            """Calibrate breathing detection."""
            if self.breathing_detector and hasattr(self.breathing_detector, 'recalibrate'):
                self.breathing_detector.recalibrate()
                return jsonify({'status': 'calibration_started'})
            return jsonify({'error': 'breathing_detector_not_active'}, 400)
        
        # Serve static files
        @self.app.route('/static/<path:filename>')
        def serve_static(filename):
            """Serve static files."""
            return send_from_directory('static', filename)
    
    def _setup_socket_events(self):
        """Setup SocketIO event handlers for real-time communication"""
        
        @self.socketio.on('connect')
        def handle_connect():
            client_id = request.sid
            self.connected_clients.add(client_id)
            print(f"Client {client_id} connected")
            
            # Send current status to new client
            emit('server_status', {
                'connected': True,
                'stress_level': self.current_stress,
                'message': self.current_message,
                'breathing_game_active': (self.breathing_game is not None and 
                                        hasattr(self.breathing_game, 'is_running') and
                                        self.breathing_game.is_running),
                'breathing_detector_active': (self.breathing_detector is not None and 
                                           hasattr(self.breathing_detector, 'is_running') and
                                           self.breathing_detector.is_running)
            })
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            client_id = request.sid
            self.connected_clients.discard(client_id)
            print(f"Client {client_id} disconnected")
        
        # Breathing game events
        @self.socketio.on('start_breathing_game')
        def handle_start_breathing_game(data=None):
            if BREATHING_GAME_AVAILABLE:
                self._start_breathing_game()
                emit('breathing_game_started', {'status': 'success'})
            else:
                emit('error', {'message': 'Breathing game not available'})
        
        @self.socketio.on('stop_breathing_game')
        def handle_stop_breathing_game(data=None):
            if self.breathing_game and hasattr(self.breathing_game, 'stop_game'):
                self.breathing_game.stop_game()
                emit('breathing_game_stopped', {})
        
        @self.socketio.on('calibrate_breathing')
        def handle_calibrate_breathing(data=None):
            if self.breathing_detector and hasattr(self.breathing_detector, 'recalibrate'):
                self.breathing_detector.recalibrate()
                emit('calibration_started', {})
        
        @self.socketio.on('request_stress_data')
        def handle_request_stress_data(data=None):
            emit('stress_data', {
                'stress_level': self.current_stress,
                'videos': self.current_videos,
                'message': self.current_message,
                'timestamp': time.time()
            })
    
    def _start_stress_monitoring(self):
        """Start background stress monitoring thread."""
        def stress_updater():
            while self.is_running:
                try:
                    if STRESS_MODULES_AVAILABLE:
                        self.current_stress = get_stress_level()
                        self.current_videos = recommend_videos(self.current_stress)
                        self.current_message = get_coaching_message(self.current_stress)
                    else:
                        # Mock data for demo
                        import random
                        self.current_stress = round(random.uniform(1.0, 10.0), 1)
                        self.current_message = f"Mock stress level: {self.current_stress}/10"
                        self.current_videos = [
                            {'title': 'Demo Relaxation Video', 'url': '#'},
                            {'title': 'Sample Calming Music', 'url': '#'}
                        ]
                    
                    # Broadcast to connected clients
                    self.socketio.emit('stress_update', {
                        'stress_level': self.current_stress,
                        'videos': self.current_videos,
                        'message': self.current_message,
                        'timestamp': time.time()
                    })
                    
                except Exception as e:
                    print(f"Error in stress updater: {e}")
                    self.current_message = "Error reading stress data..."
                
                time.sleep(8)  # Update every 8 seconds
        
        # Start background thread
        threading.Thread(target=stress_updater, daemon=True).start()
        print("✅ Stress monitoring started")
    
    def _start_breathing_game(self):
        """Start a new breathing game session"""
        if not BREATHING_GAME_AVAILABLE:
            print("❌ Breathing game modules not available")
            return
        
        # Stop existing game if running
        if self.breathing_game and hasattr(self.breathing_game, 'stop_game'):
            self.breathing_game.stop_game()
        
        # Create new game instance
        self.breathing_game = FlappyBirdGame(breathing_callback=self._on_breathing_game_update)
        
        # Start breathing detection if not already running
        if not self.breathing_detector or not hasattr(self.breathing_detector, 'is_running') or not self.breathing_detector.is_running:
            self._start_breathing_detection()
        
        # Start the game
        if hasattr(self.breathing_game, 'start_game'):
            self.breathing_game.start_game()
            print("✅ Breathing game started")
    
    def _start_breathing_detection(self):
        """Start the breathing detection system"""
        if not BREATHING_GAME_AVAILABLE:
            return
        
        if self.breathing_detector and hasattr(self.breathing_detector, 'stop_audio_stream'):
            self.breathing_detector.stop_audio_stream()
        
        try:
            self.breathing_detector = BreathingDetector(
                callback=self._on_breathing_detected
            )
            
            if hasattr(self.breathing_detector, 'start_audio_stream'):
                self.breathing_detector.start_audio_stream()
                print("✅ Breathing detection started")
        except Exception as e:
            print(f"❌ Error starting breathing detection: {e}")
            self.breathing_detector = None
    
    def _on_breathing_detected(self, breath_type, volume):
        """Handle breathing detection events"""
        # Pass breathing input to game
        if self.breathing_game and hasattr(self.breathing_game, 'is_running') and self.breathing_game.is_running:
            if hasattr(self.breathing_game, 'on_breathing_input'):
                self.breathing_game.on_breathing_input(breath_type, volume)
        
        # Broadcast breathing state to clients
        breathing_data = {
            'type': breath_type,
            'volume': volume,
            'timestamp': time.time()
        }
        
        if self.breathing_detector and hasattr(self.breathing_detector, 'get_current_state'):
            breathing_state = self.breathing_detector.get_current_state()
            breathing_data.update({
                'is_calibrated': breathing_state.get('is_calibrated', False),
                'baseline': breathing_state.get('baseline', 0)
            })
        
        self.socketio.emit('breathing_detected', breathing_data)
    
    def _on_breathing_game_update(self, game_state):
        """Handle breathing game state updates"""
        # Broadcast game state to all connected clients
        self.socketio.emit('game_state', game_state)
        
        # Handle game over
        if game_state.get('game_over'):
            self.socketio.emit('game_over', {
                'score': game_state.get('score', 0),
                'high_score': game_state.get('high_score', 0),
                'elapsed_time': game_state.get('elapsed_time', 0)
            })
    
    def start_server(self, debug=False):
        """Start the unified server"""
        self.is_running = True
        
        print("🚀 Starting Unified Destress to Impress Application")
        print(f"📡 Server: http://{self.host}:{self.port}")
        print("🎮 Available features:")
        print("   • Stress monitoring dashboard: /")
        print("   • Breathing Flappy Bird: /flappy")
        print("   • 3D Fashion game: /fashion")
        print("   • 2D Fashion game: /fashion-2d")
        print("   • API endpoints: /api/*")
        print(f"✅ Stress monitoring: {'Available' if STRESS_MODULES_AVAILABLE else 'Mock data'}")
        print(f"✅ Breathing games: {'Available' if BREATHING_GAME_AVAILABLE else 'Disabled'}")
        print()
        
        # Start the server
        self.socketio.run(
            self.app,
            host=self.host,
            port=self.port,
            debug=debug,
            use_reloader=False
        )
    
    def stop_server(self):
        """Stop the server and cleanup resources"""
        self.is_running = False
        
        # Stop breathing game
        if self.breathing_game and hasattr(self.breathing_game, 'stop_game'):
            self.breathing_game.stop_game()
        
        # Stop breathing detection
        if self.breathing_detector and hasattr(self.breathing_detector, 'stop_audio_stream'):
            self.breathing_detector.stop_audio_stream()
        
        print("🛑 Server stopped")

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n🛑 Received interrupt signal. Shutting down gracefully...')
    sys.exit(0)

def main():
    """Main entry point"""
    # Setup signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description='Unified Destress to Impress Application',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Features:
  • Real-time stress monitoring with AI coaching
  • Breathing-controlled Flappy Bird game
  • 3D Fashion collection game
  • YouTube video recommendations
  • WebSocket API for real-time updates

Available Routes:
  /          - Main stress monitoring dashboard
  /flappy    - Breathing Flappy Bird game
  /fashion   - 3D Fashion game
  /api/data  - Real-time stress data API
  /api/status- System status

Example usage:
  python unified_app.py --host 0.0.0.0 --port 5000
  python unified_app.py --debug
        """
    )
    
    parser.add_argument(
        '--host', 
        default='localhost',
        help='Server host address (default: localhost)'
    )
    
    parser.add_argument(
        '--port', 
        type=int, 
        default=5000,
        help='Server port (default: 5000)'
    )
    
    parser.add_argument(
        '--debug', 
        action='store_true',
        help='Enable debug mode with verbose logging'
    )
    
    args = parser.parse_args()
    
    # Create and start the unified application
    app = UnifiedDestressApp(host=args.host, port=args.port)
    
    try:
        app.start_server(debug=args.debug)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
    finally:
        app.stop_server()
        print("👋 Goodbye!")

if __name__ == '__main__':
    main()