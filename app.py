#!/usr/bin/env python3
"""
Unified Destress to Impress - Backend Server
A comprehensive wellness application featuring:
1. Breathing-controlled Flappy Bird game
2. Real-time stress monitoring from EmotiBit sensors
3. AI-powered coaching based on stress levels
4. Fashion games for stress relief

Controls:
- Inhale: Bird goes up
- Exhale: Bird goes down
- Hold breath: Bird falls with gravity

The server provides:
- Real-time audio processing for breathing detection
- EmotiBit data processing for stress monitoring
- Game physics simulation
- WebSocket API for real-time communication with frontend
- REST API for game control and stress data
"""

import argparse
import sys
import signal
import time
import threading
import numpy as np
import pandas as pd
import json
import os
from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_socketio import SocketIO, emit

# Try to import ML components (may not be available)
try:
    from sklearn.preprocessing import StandardScaler
    from tensorflow.keras.models import Sequential, load_model
    from tensorflow.keras.layers import Dense, Dropout
    import joblib
    ML_AVAILABLE = True
except ImportError:
    print("⚠️  ML libraries not found. Using heuristic stress calculation.")
    ML_AVAILABLE = False

# Try to import the breathing game server
try:
    from server import BreathingFlappyBirdServer
    BREATHING_GAME_AVAILABLE = True
except ImportError:
    print("⚠️  Breathing game server not found. Breathing features disabled.")
    BREATHING_GAME_AVAILABLE = False

# Try to import API components
try:
    import requests
    import openai
    API_AVAILABLE = True
except ImportError:
    print("⚠️  API libraries not found. Using mock responses.")
    API_AVAILABLE = False

class StressMonitor:
    """Handles EmotiBit data processing and stress level calculation"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.baseline_eda = None
        self.baseline_temp = None
        self.calibrated = False
        
        # Try to load pre-trained model
        self._load_model()
        
        # Initialize sample data file if it doesn't exist
        self.data_file = "emotibit_live.csv"
        self._initialize_sample_data()
    
    def _load_model(self):
        """Load pre-trained stress model and scaler if available"""
        try:
            if ML_AVAILABLE and os.path.exists('stress_model.h5') and os.path.exists('scaler.pkl'):
                self.model = load_model('stress_model.h5')
                self.scaler = joblib.load('scaler.pkl')
                print("✅ Loaded pre-trained stress model")
            else:
                print("⚠️  No pre-trained model found. Using heuristic calculation.")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
    
    def _initialize_sample_data(self):
        """Create sample EmotiBit data if file doesn't exist"""
        if not os.path.exists(self.data_file):
            print("📊 Creating sample EmotiBit data...")
            
            # Generate realistic sample data based on actual EDA ranges
            np.random.seed(42)
            n_samples = 100
            
            # Simulate realistic physiological ranges
            timestamps = [time.time() - (n_samples - i) for i in range(n_samples)]
            
            # Use your actual EDA ranges: 3.0-3.2 = calm, 3.2-5.8 = still calm
            eda_values = np.random.normal(4.0, 1.0, n_samples)  # Center around calm range
            eda_values = np.clip(eda_values, 2.5, 8.0)  # Realistic EDA range
            
            hr_values = np.random.normal(75, 10, n_samples)  # BPM
            hr_values = np.clip(hr_values, 60, 100)
            
            hrv_values = np.random.normal(50, 15, n_samples)  # ms
            hrv_values = np.clip(hrv_values, 20, 80)
            
            temp_values = np.random.normal(36.5, 0.5, n_samples)  # Celsius
            temp_values = np.clip(temp_values, 35.5, 37.5)
            
            # Create DataFrame
            df = pd.DataFrame({
                'timestamp': timestamps,
                'EDA': eda_values,
                'HR': hr_values,
                'HRV': hrv_values,
                'TEMP': temp_values
            })
            
            # Save to CSV
            df.to_csv(self.data_file, index=False)
            print(f"✅ Created sample data: {self.data_file}")
    
    def calibrate(self, duration_seconds=30):
        """Calibrate baseline values from recent data"""
        try:
            df = pd.read_csv(self.data_file)
            if len(df) < 10:
                print("❌ Not enough data for calibration")
                return False
            
            # Use last 'duration_seconds' of data for baseline
            recent_data = df.tail(min(duration_seconds, len(df)))
            
            self.baseline_eda = recent_data['EDA'].mean()
            self.baseline_temp = recent_data['TEMP'].mean()
            self.calibrated = True
            
            print(f"✅ Calibrated - Baseline EDA: {self.baseline_eda:.2f}μS, Temp: {self.baseline_temp:.2f}°C")
            return True
            
        except Exception as e:
            print(f"❌ Calibration error: {e}")
            return False
    
    def get_stress_level(self):
        """Calculate stress level from latest EmotiBit data (1-10 scale)"""
        try:
            # Read latest data
            df = pd.read_csv(self.data_file)
            if len(df) == 0:
                return 5.0  # Default middle stress
            
            latest = df.iloc[-1]
            
            if self.model and self.scaler and ML_AVAILABLE:
                # Use trained ML model
                features = np.array([[latest['EDA'], latest['HR'], latest['HRV'], latest['TEMP']]])
                features_scaled = self.scaler.transform(features)
                stress_level = self.model.predict(features_scaled)[0][0]
                return np.clip(float(stress_level), 1.0, 10.0)
            
            else:
                # Use heuristic calculation based on EDA and temperature
                return self._calculate_heuristic_stress(latest)
                
        except Exception as e:
            print(f"❌ Error calculating stress: {e}")
            return 5.0  # Default middle stress
    
    def _calculate_heuristic_stress(self, data_row):
        """Calculate stress using heuristic rules based on EDA and temperature"""
        eda = data_row['EDA']
        temp = data_row['TEMP']
        hr = data_row.get('HR', 75)  # Default heart rate
        
        # Initialize stress score
        stress_score = 5.0  # Baseline neutral stress
        
        # EDA contribution based on your actual EmotiBit readings:
        # 3.0-3.2 = calm, 3.2-5.8 = still calm
        if self.calibrated and self.baseline_eda:
            eda_change = (eda - self.baseline_eda) / self.baseline_eda
            stress_score += eda_change * 3.0  # Scale factor
        else:
            # Without calibration, use your actual EDA ranges
            if eda < 3.0:
                # Below calm range - very relaxed
                stress_score = 2.0
            elif 3.0 <= eda <= 3.2:
                # Calm range
                stress_score = 3.0
            elif 3.2 < eda <= 5.8:
                # Still calm range  
                stress_score = 4.0
            elif 5.8 < eda <= 7.0:
                # Moderate stress
                stress_score = 6.0
            elif 7.0 < eda <= 9.0:
                # High stress
                stress_score = 8.0
            else:
                # Very high stress (>9.0)
                stress_score = 9.5
        
        # Temperature contribution (slight increase indicates stress)
        if self.calibrated and self.baseline_temp:
            temp_change = temp - self.baseline_temp
            if temp_change > 0.3:
                stress_score += 1.5
            elif temp_change > 0.1:
                stress_score += 0.5
        else:
            # Without calibration, use absolute temperature
            if temp > 37.0:
                stress_score += 1.0
            elif temp < 36.0:
                stress_score -= 0.5
        
        # Heart rate contribution
        if hr > 85:
            stress_score += 1.5
        elif hr > 80:
            stress_score += 0.5
        elif hr < 65:
            stress_score -= 0.5
        
        # Clip to 1-10 range
        return round(np.clip(stress_score, 1.0, 10.0), 1)
    
    def add_data_point(self, eda, hr, hrv, temp):
        """Add a new data point to the CSV file"""
        try:
            new_row = pd.DataFrame({
                'timestamp': [time.time()],
                'EDA': [eda],
                'HR': [hr],
                'HRV': [hrv],
                'TEMP': [temp]
            })
            
            # Append to existing file or create new
            if os.path.exists(self.data_file):
                new_row.to_csv(self.data_file, mode='a', header=False, index=False)
            else:
                new_row.to_csv(self.data_file, index=False)
                
            return True
        except Exception as e:
            print(f"❌ Error adding data point: {e}")
            return False
    
    def simulate_realtime_data(self):
        """Simulate adding realtime EmotiBit data for demo purposes"""
        # Use your actual EDA ranges: 3.0-3.2 = calm, 3.2-5.8 = still calm
        base_eda = 4.0 + np.random.normal(0, 0.8)  # Center around calm range
        base_hr = 75 + np.random.normal(0, 5)
        base_hrv = 50 + np.random.normal(0, 8)
        base_temp = 36.5 + np.random.normal(0, 0.2)
        
        # Add stress-inducing variations occasionally
        if np.random.random() < 0.3:  # 30% chance of elevated stress
            base_eda += np.random.uniform(1.5, 3.0)  # Push into higher stress EDA ranges
            base_hr += np.random.uniform(5, 15)
            base_temp += np.random.uniform(0.1, 0.4)
        
        return self.add_data_point(
            np.clip(base_eda, 2.5, 10.0),  # Realistic EDA range for your device
            np.clip(base_hr, 60, 120),
            np.clip(base_hrv, 20, 100),
            np.clip(base_temp, 35.0, 38.0)
        )

class AICoach:
    """Provides AI-powered coaching messages based on stress levels"""
    
    def __init__(self):
        # OpenAI API key (replace with your actual key)
        self.api_key = "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"
        if API_AVAILABLE:
            openai.api_key = self.api_key
    
    def get_coaching_message(self, stress_level):
        """Generate coaching message based on stress level"""
        if not API_AVAILABLE:
            return self._get_fallback_message(stress_level)
        
        # Determine prompt based on stress level
        if stress_level >= 8:
            prompt = "You're very stressed. Give me a short, kind, calming message to help someone breathe and relax, like a mindfulness coach."
        elif stress_level >= 6:
            prompt = "You're feeling tense. Give a gentle suggestion to stretch or take a mindful pause."
        elif stress_level >= 4:
            prompt = "You're okay, but could use a boost. Give a cheerful, encouraging message."
        else:
            prompt = "You're calm and focused! Give a positive reinforcement message."
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=60
            )
            return response.choices[0].message['content'].strip()
        except Exception as e:
            print(f"❌ OpenAI API error: {e}")
            return self._get_fallback_message(stress_level)
    
    def _get_fallback_message(self, stress_level):
        """Fallback messages when API is unavailable"""
        if stress_level >= 8:
            messages = [
                "Take a deep breath and count to 5. You've got this.",
                "Breathe in calm, breathe out tension. One moment at a time.",
                "Ground yourself: feel your feet, breathe slowly, relax your shoulders."
            ]
        elif stress_level >= 6:
            messages = [
                "Take a moment to stretch your neck and shoulders.",
                "Try taking three deep breaths to reset your energy.",
                "Step away from your screen for a quick mindful pause."
            ]
        elif stress_level >= 4:
            messages = [
                "You're doing well! Keep up the steady pace.",
                "Stay focused and remember to take breaks when needed.",
                "You're in a good rhythm - trust yourself!"
            ]
        else:
            messages = [
                "Excellent! You're in a calm and focused state.",
                "Your stress levels look great - keep doing what you're doing!",
                "You're radiating calm energy today. Well done!"
            ]
        
        return np.random.choice(messages)

class YouTubeRecommender:
    """Recommends YouTube videos based on stress levels"""
    
    def __init__(self):
        # YouTube API key (replace with your actual key)
        self.api_key = "AIzaSyCb0DQcnV6XZKo67lh7GAB1IuawPnELpLU"
        self.base_url = "https://www.googleapis.com/youtube/v3/search"
    
    def recommend_videos(self, stress_level):
        """Get video recommendations based on stress level"""
        # Determine search query based on stress level
        if stress_level >= 8:
            query = "deep calming music meditation sleep"
        elif stress_level >= 6:
            query = "relaxing piano nature sounds"
        elif stress_level >= 4:
            query = "chill lofi study beats"
        elif stress_level >= 2:
            query = "upbeat happy pop music"
        else:
            query = "energetic workout music dance"
        
        if not API_AVAILABLE:
            return self._get_fallback_videos(stress_level)
        
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': 3,
            'key': self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            results = response.json()
            videos = []
            for item in results['items']:
                videos.append({
                    'title': item['snippet']['title'],
                    'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                })
            return videos
        except Exception as e:
            print(f"❌ YouTube API error: {e}")
            return self._get_fallback_videos(stress_level)
    
    def _get_fallback_videos(self, stress_level):
        """Fallback video recommendations when API is unavailable"""
        if stress_level >= 8:
            return [
                {'title': 'Deep Ocean Sounds for Sleep', 'url': '#'},
                {'title': '10 Minute Meditation Guide', 'url': '#'},
                {'title': 'Calming Rain Sounds', 'url': '#'}
            ]
        elif stress_level >= 6:
            return [
                {'title': 'Peaceful Piano Music', 'url': '#'},
                {'title': 'Forest Nature Sounds', 'url': '#'},
                {'title': 'Gentle Yoga Flow', 'url': '#'}
            ]
        elif stress_level >= 4:
            return [
                {'title': 'Chill Study Beats', 'url': '#'},
                {'title': 'Coffee Shop Ambiance', 'url': '#'},
                {'title': 'Relaxing Instrumental', 'url': '#'}
            ]
        else:
            return [
                {'title': 'Feel Good Pop Hits', 'url': '#'},
                {'title': 'Upbeat Workout Music', 'url': '#'},
                {'title': 'Happy Dance Songs', 'url': '#'}
            ]

class UnifiedDestressServer(BreathingFlappyBirdServer if BREATHING_GAME_AVAILABLE else object):
    """Unified server combining breathing game and stress monitoring"""
    
    def __init__(self, host='localhost', port=5000):
        # Initialize Flask app
        if BREATHING_GAME_AVAILABLE:
            super().__init__(host, port)
        else:
            # Initialize Flask app directly if breathing server unavailable
            self.app = Flask(__name__)
            self.app.config['SECRET_KEY'] = 'destress_unified_secret'
            self.socketio = SocketIO(self.app, cors_allowed_origins="*", async_mode='threading')
            self.host = host
            self.port = port
            self.is_running = False
            self.connected_clients = set()
        
        # Initialize stress monitoring components
        self.stress_monitor = StressMonitor()
        self.ai_coach = AICoach()
        self.youtube_recommender = YouTubeRecommender()
        
        # Stress monitoring state
        self.current_stress = 5.0
        self.current_videos = []
        self.current_message = "Welcome to Destress to Impress! Calibrating..."
        
        # Setup additional routes for stress monitoring
        self._setup_stress_routes()
        
        # Start background stress monitoring
        self._start_stress_monitoring()
    
    def _setup_stress_routes(self):
        """Setup additional routes for stress monitoring"""
        
        @self.app.route('/dashboard')
        def stress_dashboard():
            """Main stress monitoring dashboard"""
            return render_template('dashboard.html',
                stress=self.current_stress,
                videos=self.current_videos,
                message=self.current_message,
                calibrated=self.stress_monitor.calibrated
            )
        
        @self.app.route('/api/stress')
        def api_stress():
            """API endpoint for current stress data"""
            return jsonify({
                'stress_level': self.current_stress,
                'videos': self.current_videos,
                'message': self.current_message,
                'calibrated': self.stress_monitor.calibrated,
                'timestamp': time.time()
            })
        
        @self.app.route('/api/calibrate', methods=['POST'])
        def api_calibrate():
            """Calibrate stress monitoring baseline"""
            success = self.stress_monitor.calibrate()
            return jsonify({
                'success': success,
                'message': 'Calibration completed' if success else 'Calibration failed'
            })
        
        @self.app.route('/api/add_emotibit_data', methods=['POST'])
        def api_add_emotibit_data():
            """Add new EmotiBit data point"""
            try:
                data = request.get_json()
                success = self.stress_monitor.add_data_point(
                    data['eda'], data['hr'], data['hrv'], data['temp']
                )
                return jsonify({'success': success})
            except Exception as e:
                return jsonify({'error': str(e)}), 400
        
        @self.app.route('/fashion')
        def fashion_game():
            """Serve 3D Fashion game"""
            return send_from_directory('.', 'fashion_store_3d.html')
        
        @self.app.route('/fashion-2d')  
        def fashion_game_2d():
            """Serve 2D Fashion game"""
            return send_from_directory('.', 'dress_to_impress.html')
    
    def _start_stress_monitoring(self):
        """Start background stress monitoring thread"""
        def stress_updater():
            while self.is_running:
                try:
                    # Simulate new EmotiBit data (in real app, this would come from hardware)
                    self.stress_monitor.simulate_realtime_data()
                    
                    # Update stress level
                    self.current_stress = self.stress_monitor.get_stress_level()
                    
                    # Get AI coaching message
                    self.current_message = self.ai_coach.get_coaching_message(self.current_stress)
                    
                    # Get video recommendations
                    self.current_videos = self.youtube_recommender.recommend_videos(self.current_stress)
                    
                    # Broadcast to connected clients
                    if hasattr(self, 'socketio'):
                        self.socketio.emit('stress_update', {
                            'stress_level': self.current_stress,
                            'message': self.current_message,
                            'videos': self.current_videos,
                            'calibrated': self.stress_monitor.calibrated,
                            'timestamp': time.time()
                        })
                    
                    print(f"📊 Stress Level: {self.current_stress}/10 | Message: {self.current_message[:50]}...")
                    
                except Exception as e:
                    print(f"❌ Error in stress monitoring: {e}")
                    self.current_message = "Error monitoring stress levels..."
                
                time.sleep(10)  # Update every 10 seconds
        
        # Start background thread
        self.is_running = True
        threading.Thread(target=stress_updater, daemon=True).start()
        print("✅ Stress monitoring started")
    
    def start_server(self, debug=False):
        """Start the unified server"""
        print("🚀 Starting Unified Destress to Impress Server")
        print(f"📡 Server: http://{self.host}:{self.port}")
        print("🎮 Available features:")
        if BREATHING_GAME_AVAILABLE:
            print("   • Breathing Flappy Bird: /")
        print("   • Stress Dashboard: /dashboard")
        print("   • 3D Fashion game: /fashion")
        print("   • 2D Fashion game: /fashion-2d")
        print("   • API endpoints: /api/*")
        print()
        
        if BREATHING_GAME_AVAILABLE:
            super().start_server(debug=debug)
        else:
            # Start Flask-SocketIO server directly
            self.socketio.run(
                self.app,
                host=self.host,
                port=self.port,
                debug=debug,
                use_reloader=False
            )

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
        description='Unified Destress to Impress - Backend Server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Features:
  • Real-time stress monitoring with EmotiBit sensors
  • AI-powered coaching messages based on stress levels
  • YouTube video recommendations for stress relief
  • Breathing-controlled Flappy Bird game (if available)
  • 3D Fashion collection game
  • WebSocket API for real-time updates

Available Routes:
  /          - Breathing Flappy Bird (if available)
  /dashboard - Stress monitoring dashboard
  /fashion   - 3D Fashion game
  /api/stress- Real-time stress data API

Example usage:
  python app.py --host 0.0.0.0 --port 5000
  python app.py --debug
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
    
    parser.add_argument(
        '--sensitivity',
        type=float,
        default=1.0,
        help='Breathing detection sensitivity (0.1-3.0, default: 1.0)'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.sensitivity < 0.1 or args.sensitivity > 3.0:
        print("Error: Sensitivity must be between 0.1 and 3.0")
        sys.exit(1)
        
    # Print startup information
    print("=" * 80)
    print("🌟 UNIFIED DESTRESS TO IMPRESS - Backend Server")
    print("=" * 80)
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    print(f"Debug mode: {'ON' if args.debug else 'OFF'}")
    print(f"Breathing sensitivity: {args.sensitivity}")
    print()
    print("🎮 Game Controls:")
    print("  💨 Inhale  → Bird goes UP (Breathing Game)")
    print("  💨 Exhale  → Bird goes DOWN (Breathing Game)")
    print("  🫁 Hold    → Bird falls with gravity")
    print()
    print("📊 Stress Monitoring:")
    print("  📈 EDA (Electrodermal Activity) - measures arousal")
    print("  🌡️  Temperature - body temperature changes")
    print("  ❤️  Heart Rate & HRV - cardiovascular stress indicators")
    print("  🧠 AI Coaching - personalized stress management tips")
    print()
    print("🌐 Server endpoints:")
    if BREATHING_GAME_AVAILABLE:
        print(f"  � Breathing Game: http://{args.host}:{args.port}/")
    print(f"  📊 Stress Dashboard: http://{args.host}:{args.port}/dashboard")
    print(f"  🎨 3D Fashion Game: http://{args.host}:{args.port}/fashion")
    print(f"  📡 Stress API: http://{args.host}:{args.port}/api/stress")
    print(f"  � Status API: http://{args.host}:{args.port}/api/status")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 80)
    
    # Create and configure unified server
    server = UnifiedDestressServer(host=args.host, port=args.port)
    
    try:
        # Start the server (this will block)
        server.start_server(debug=args.debug)
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
        
    finally:
        # Cleanup
        if hasattr(server, 'stop_server'):
            server.stop_server()
        print("👋 Server stopped. Goodbye!")

if __name__ == '__main__':
    main()