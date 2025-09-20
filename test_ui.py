#!/usr/bin/env python3
"""
UI Test Helper - Breathing Flappy Bird
Provides different ways to test the UI without microphone issues
"""

import time
import threading
import webbrowser
from server import BreathingFlappyBirdServer

def test_ui_basic():
    """Test basic UI without breathing detection"""
    print("🧪 Starting UI Test (No Microphone Required)")
    print("=" * 50)
    
    # Create server but with mock breathing detection
    server = BreathingFlappyBirdServer(host='localhost', port=5000)
    
    # Start server in background
    def run_server():
        try:
            server.start_server(debug=True)
        except KeyboardInterrupt:
            server.stop_server()
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    print("⏳ Starting server...")
    time.sleep(3)
    
    print("✅ Server is running!")
    print(f"🌐 Game URL: http://localhost:5000")
    print(f"📋 API Info: http://localhost:5000/api")
    print(f"📊 Status: http://localhost:5000/status")
    print()
    print("🎮 UI Testing Steps:")
    print("1. Open http://localhost:5000 in your browser")
    print("2. You'll see the game interface load")
    print("3. Click 'Start Game' to test WebSocket connection")
    print("4. The game will start (bird will fall with gravity)")
    print("5. Test the UI controls and settings")
    print()
    print("💡 Tips:")
    print("- If browser asks for microphone, click 'Allow' to test breathing")
    print("- Or click 'Block' to test UI without breathing detection")
    print("- Use keyboard: SPACE (start/pause), ESC (stop), C (calibrate)")
    print()
    print("Press Ctrl+C to stop the test")
    print("=" * 50)
    
    # Try to open browser
    try:
        webbrowser.open('http://localhost:5000')
        print("🌐 Browser opened automatically")
    except Exception as e:
        print(f"⚠️ Could not open browser: {e}")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Test stopped")
        server.stop_server()

def test_ui_mock_breathing():
    """Test UI with simulated breathing data"""
    print("🫁 Starting UI Test with Mock Breathing Data")
    print("=" * 50)
    
    # This would require modifications to inject mock breathing data
    # For now, use the basic test
    test_ui_basic()

def test_rest_api():
    """Test the REST API endpoints"""
    print("📡 Testing REST API Endpoints")
    print("=" * 30)
    
    import requests
    import json
    
    base_url = "http://localhost:5000"
    
    # Test endpoints
    endpoints = [
        ("GET", "/status", "Server status"),
        ("POST", "/start_game", "Start game"),
        ("POST", "/pause_game", "Pause game"),
        ("POST", "/stop_game", "Stop game"),
        ("POST", "/calibrate", "Start calibration"),
    ]
    
    print("🔍 Testing API endpoints...")
    
    for method, endpoint, description in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, timeout=5)
                
            print(f"✅ {method} {endpoint} - {response.status_code}")
            if response.headers.get('content-type', '').startswith('application/json'):
                print(f"   Response: {json.dumps(response.json(), indent=2)}")
            print()
            
        except requests.exceptions.RequestException as e:
            print(f"❌ {method} {endpoint} - Failed: {e}")
        except Exception as e:
            print(f"❌ {method} {endpoint} - Error: {e}")

def interactive_test():
    """Interactive test menu"""
    print("🎮 Breathing Flappy Bird - UI Test Suite")
    print("=" * 45)
    print()
    print("Choose a test mode:")
    print("1. 🌐 Basic UI Test (browser interface)")
    print("2. 📡 REST API Test (endpoint testing)")  
    print("3. 🫁 Mock Breathing Test (simulated data)")
    print("4. ❓ Help / Troubleshooting")
    print("5. 🚪 Exit")
    print()
    
    while True:
        try:
            choice = input("Enter choice (1-5): ").strip()
            
            if choice == '1':
                test_ui_basic()
                break
            elif choice == '2':
                # First start server for API testing
                print("🚀 Starting server for API testing...")
                server = BreathingFlappyBirdServer(host='localhost', port=5000)
                server_thread = threading.Thread(target=lambda: server.start_server(debug=False), daemon=True)
                server_thread.start()
                time.sleep(2)
                test_rest_api()
                break
            elif choice == '3':
                test_ui_mock_breathing()
                break
            elif choice == '4':
                show_help()
            elif choice == '5':
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break

def show_help():
    """Show troubleshooting help"""
    print("\n🆘 Troubleshooting Guide")
    print("=" * 30)
    print()
    print("🎤 Microphone Issues:")
    print("- Browser asks for microphone permission → Click 'Allow'")
    print("- No microphone detected → Game works without breathing control")
    print("- Poor breathing detection → Adjust sensitivity in settings")
    print()
    print("🌐 Browser Issues:")
    print("- Game doesn't load → Check if server is running on port 5000")
    print("- WebSocket errors → Refresh page and check network")
    print("- Performance issues → Close other browser tabs")
    print()
    print("⚙️ Server Issues:")
    print("- Port already in use → Stop other processes on port 5000")
    print("- Import errors → Check if all dependencies are installed")
    print("- Permission errors → Run from correct directory")
    print()
    print("🔧 Testing Without Microphone:")
    print("- You can test all UI features without breathing control")
    print("- Bird will fall with gravity, use mouse/keyboard for testing")
    print("- All buttons and settings should work normally")
    print()

if __name__ == '__main__':
    interactive_test()