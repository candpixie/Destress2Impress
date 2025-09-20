#!/usr/bin/env python3
"""
Simple test client for Breathing Flappy Bird Server
Connects via WebSocket and displays game state in console
"""

import socketio
import time
import json
from threading import Event

class BreathingFlappyBirdClient:
    def __init__(self, server_url='http://localhost:5000'):
        self.sio = socketio.Client()
        self.server_url = server_url
        self.connected = Event()
        self.game_active = False
        self.setup_events()
        
    def setup_events(self):
        """Setup WebSocket event handlers"""
        
        @self.sio.event
        def connect():
            print("✅ Connected to Breathing Flappy Bird server!")
            self.connected.set()
            
        @self.sio.event
        def disconnect():
            print("❌ Disconnected from server")
            self.connected.clear()
            
        @self.sio.event
        def server_status(data):
            print(f"📡 Server Status: {json.dumps(data, indent=2)}")
            
        @self.sio.event
        def game_state(data):
            """Handle real-time game state updates"""
            if self.game_active:
                self._display_game_state(data)
                
        @self.sio.event
        def breathing_detected(data):
            """Handle breathing detection events"""
            breath_type = data.get('type', 'unknown')
            volume = data.get('volume', 0)
            calibrated = data.get('is_calibrated', False)
            
            # Visual breathing indicator
            if breath_type == 'inhale':
                indicator = "🫁⬆️ INHALE"
            elif breath_type == 'exhale':
                indicator = "🫁⬇️ EXHALE"
            else:
                indicator = "🫁➡️ NEUTRAL"
                
            status = "📶" if calibrated else "⚠️"
            print(f"{status} {indicator} (Volume: {volume:.1f})")
            
        @self.sio.event
        def game_over(data):
            """Handle game over events"""
            score = data.get('score', 0)
            high_score = data.get('high_score', 0)
            elapsed_time = data.get('elapsed_time', 0)
            
            print("\n" + "=" * 50)
            print("💀 GAME OVER!")
            print(f"Final Score: {score}")
            print(f"High Score: {high_score}")
            print(f"Time Played: {elapsed_time:.1f}s")
            print("=" * 50)
            
        @self.sio.event
        def calibration_started(data):
            print("🎯 Breathing calibration started!")
            print("   Please breathe normally for a few seconds...")
            
        @self.sio.event
        def game_started(data):
            print("🎮 Game started! Start breathing to control the bird!")
            self.game_active = True
            
        @self.sio.event
        def game_stopped(data):
            print("⏹️ Game stopped")
            self.game_active = False
            
    def connect(self):
        """Connect to the server"""
        try:
            print(f"🔌 Connecting to {self.server_url}...")
            self.sio.connect(self.server_url)
            
            # Wait for connection
            if self.connected.wait(timeout=5):
                return True
            else:
                print("❌ Connection timeout")
                return False
                
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
            
    def disconnect(self):
        """Disconnect from server"""
        if self.sio.connected:
            self.sio.disconnect()
            
    def start_game(self):
        """Start a new game"""
        print("🎮 Starting new game...")
        self.sio.emit('start_game')
        
    def pause_game(self):
        """Pause/unpause the game"""
        print("⏸️ Pausing/unpausing game...")
        self.sio.emit('pause_game')
        
    def stop_game(self):
        """Stop the current game"""
        print("⏹️ Stopping game...")
        self.sio.emit('stop_game')
        self.game_active = False
        
    def calibrate_breathing(self):
        """Start breathing calibration"""
        print("🎯 Starting breathing calibration...")
        self.sio.emit('calibrate_breathing')
        
    def set_sensitivity(self, sensitivity):
        """Set breathing sensitivity"""
        print(f"🎛️ Setting breathing sensitivity to {sensitivity}")
        self.sio.emit('set_sensitivity', {'sensitivity': sensitivity})
        
    def _display_game_state(self, state):
        """Display game state in a nice format"""
        bird = state.get('bird', {})
        pipes = state.get('pipes', [])
        score = state.get('score', 0)
        breathing = state.get('breathing_state', 'neutral')
        
        # Clear screen (works on most terminals)
        print('\033[2J\033[H', end='')
        
        print("🐦 BREATHING FLAPPY BIRD - Live Game State")
        print("=" * 60)
        
        # Bird info
        print(f"🐦 Bird Position: ({bird.get('x', 0):.1f}, {bird.get('y', 0):.1f})")
        print(f"🚀 Bird Velocity: {bird.get('velocity_y', 0):.1f}")
        
        # Breathing state
        breathing_emoji = {
            'inhale': '🫁⬆️',
            'exhale': '🫁⬇️', 
            'neutral': '🫁➡️'
        }
        print(f"{breathing_emoji.get(breathing, '🫁')} Breathing: {breathing.upper()}")
        
        # Score
        print(f"🏆 Score: {score}")
        print(f"🥇 High Score: {state.get('high_score', 0)}")
        
        # Pipes
        print(f"🔧 Active Pipes: {len(pipes)}")
        
        # Game status
        if state.get('game_over'):
            print("💀 GAME OVER!")
        elif state.get('is_paused'):
            print("⏸️ PAUSED")
        else:
            print("▶️ PLAYING")
            
        print("=" * 60)
        
    def run_interactive(self):
        """Run interactive test client"""
        if not self.connect():
            return
            
        print("\n🎮 Breathing Flappy Bird Test Client")
        print("Commands:")
        print("  's' - Start game")
        print("  'p' - Pause/unpause game") 
        print("  'x' - Stop game")
        print("  'c' - Calibrate breathing")
        print("  '1-9' - Set sensitivity (1=low, 9=high)")
        print("  'q' - Quit")
        print("\nPress Enter after each command...")
        
        try:
            while True:
                cmd = input("\n> ").strip().lower()
                
                if cmd == 'q':
                    break
                elif cmd == 's':
                    self.start_game()
                elif cmd == 'p':
                    self.pause_game()
                elif cmd == 'x':
                    self.stop_game()
                elif cmd == 'c':
                    self.calibrate_breathing()
                elif cmd.isdigit() and '1' <= cmd <= '9':
                    sensitivity = float(cmd) / 3.0  # Scale to 0.33-3.0
                    self.set_sensitivity(sensitivity)
                else:
                    print("Unknown command. Try 's', 'p', 'x', 'c', '1-9', or 'q'")
                    
        except KeyboardInterrupt:
            print("\nExiting...")
            
        finally:
            self.disconnect()

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Breathing Flappy Bird Test Client')
    parser.add_argument('--server', default='http://localhost:5000', 
                       help='Server URL (default: http://localhost:5000)')
    parser.add_argument('--auto-start', action='store_true',
                       help='Automatically start a game')
    
    args = parser.parse_args()
    
    client = BreathingFlappyBirdClient(args.server)
    
    if args.auto_start:
        if client.connect():
            print("Auto-starting game in 3 seconds...")
            time.sleep(3)
            client.start_game()
            
            try:
                # Run for a while
                time.sleep(30)
            except KeyboardInterrupt:
                pass
            finally:
                client.disconnect()
    else:
        client.run_interactive()

if __name__ == '__main__':
    main()