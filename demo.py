#!/usr/bin/env python3
"""
Quick Start Demo - Breathing Flappy Bird
Demonstrates how to quickly start the server and play the game
"""

import time
import webbrowser
import threading
from server import BreathingFlappyBirdServer

def demo_start():
    """Start server and open browser for demo"""
    print("🐦 Starting Breathing Flappy Bird Demo...")
    print("=" * 50)
    
    # Create server instance
    server = BreathingFlappyBirdServer(host='localhost', port=5000)
    
    # Start server in background thread
    def run_server():
        try:
            server.start_server(debug=False)
        except KeyboardInterrupt:
            print("\nShutting down demo server...")
            server.stop_server()
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Wait a moment for server to start
    print("🚀 Server starting...")
    time.sleep(2)
    
    # Open browser
    game_url = "http://localhost:5000"
    api_url = "http://localhost:5000/api"
    
    print(f"🌐 Game Interface: {game_url}")
    print(f"📡 API Documentation: {api_url}")
    print()
    print("🎮 How to play:")
    print("1. Click 'Start Game' or press SPACE")
    print("2. Breathe normally for calibration")
    print("3. Inhale to make bird go UP")
    print("4. Exhale to make bird go DOWN")
    print("5. Hold breath to let bird fall")
    print()
    print("⚙️ Controls:")
    print("- SPACE: Start/Pause game")
    print("- ESC: Stop game")
    print("- C: Calibrate breathing")
    print()
    print("Press Ctrl+C to stop the demo")
    print("=" * 50)
    
    # Open browser after a short delay
    def open_browser():
        time.sleep(1)
        try:
            webbrowser.open(game_url)
            print(f"🌐 Opened {game_url} in your default browser")
        except Exception as e:
            print(f"Could not open browser automatically: {e}")
            print(f"Please manually open: {game_url}")
    
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Demo stopped by user")
        server.stop_server()

if __name__ == '__main__':
    demo_start()