#!/usr/bin/env python3
"""
Breathing Calibration Guide and Tool
Helps users calibrate their breathing detection properly
"""

import time
import threading
from server import BreathingFlappyBirdServer

class CalibrationGuide:
    def __init__(self):
        self.server = None
        self.calibration_data = []
        
    def interactive_calibration(self):
        """Interactive calibration with step-by-step guidance"""
        print("🎯 BREATHING CALIBRATION GUIDE")
        print("=" * 40)
        print()
        print("This will help you calibrate your breathing detection")
        print("for the best gaming experience!")
        print()
        
        # Start server
        self.server = BreathingFlappyBirdServer(host='localhost', port=5000)
        server_thread = threading.Thread(target=lambda: self.server.start_server(debug=False), daemon=True)
        server_thread.start()
        
        print("🚀 Starting calibration server...")
        time.sleep(2)
        
        print("✅ Server ready!")
        print()
        
        self.show_calibration_steps()
        
    def show_calibration_steps(self):
        """Show step-by-step calibration process"""
        print("📋 CALIBRATION STEPS:")
        print()
        
        print("1️⃣ MICROPHONE SETUP")
        print("   • Make sure your microphone is connected")
        print("   • Position it about 6-12 inches from your mouth") 
        print("   • Reduce background noise if possible")
        print("   • Test: Say 'hello' - you should see volume in apps")
        print()
        
        print("2️⃣ ENVIRONMENT PREPARATION")
        print("   • Sit comfortably with good posture")
        print("   • Take a few deep breaths to relax")
        print("   • Make sure room is reasonably quiet")
        print("   • Close other audio applications")
        print()
        
        print("3️⃣ CALIBRATION PROCESS")
        print("   • Open: http://localhost:5000")
        print("   • Click 'Start Game' or '🎯 Calibrate' button")
        print("   • When prompted, ALLOW microphone access")
        print("   • Breathe NORMALLY (not deep or forced)")
        print("   • Continue normal breathing for 10 seconds")
        print("   • Watch for calibration status: ⚠️ → ✅")
        print()
        
        print("4️⃣ TESTING BREATHING DETECTION")
        print("   • After calibration, try these patterns:")
        print("     - Normal inhale: Bird should go UP")
        print("     - Normal exhale: Bird should go DOWN") 
        print("     - Hold breath: Bird should fall")
        print("   • If not working well, recalibrate with different breathing")
        print()
        
        print("5️⃣ SENSITIVITY ADJUSTMENT")
        print("   • If bird is too sensitive: Lower sensitivity (0.5-0.8)")
        print("   • If bird doesn't respond enough: Raise sensitivity (1.5-2.5)")
        print("   • Use the slider in the Settings panel")
        print()
        
        self.show_troubleshooting()
        
    def show_troubleshooting(self):
        """Show common calibration issues and solutions"""
        print("🔧 TROUBLESHOOTING:")
        print()
        
        print("❌ Problem: Calibration shows NaN or invalid values")
        print("✅ Solution:")
        print("   • Check microphone is working in other apps")
        print("   • Try a different browser (Chrome works best)")
        print("   • Restart the calibration process")
        print("   • Speak or make sound during calibration")
        print()
        
        print("❌ Problem: Bird doesn't respond to breathing")
        print("✅ Solution:")
        print("   • Breathe closer to microphone")
        print("   • Increase sensitivity in settings")
        print("   • Recalibrate with more pronounced breathing")
        print("   • Check volume levels in debug panel")
        print()
        
        print("❌ Problem: Bird moves erratically")
        print("✅ Solution:")
        print("   • Reduce sensitivity in settings") 
        print("   • Minimize background noise")
        print("   • Breathe more steadily during calibration")
        print("   • Recalibrate in quieter environment")
        print()
        
        print("❌ Problem: Calibration never completes")
        print("✅ Solution:")
        print("   • Make sure microphone permission is granted")
        print("   • Try breathing more audibly (not silent)")
        print("   • Check Windows microphone privacy settings")
        print("   • Refresh browser page and try again")
        print()
        
        print("💡 CALIBRATION TIPS:")
        print("   • Best results: Breathe through nose naturally")
        print("   • Avoid: Forced, deep, or exaggerated breathing") 
        print("   • Good timing: When you're relaxed, not rushed")
        print("   • Environment: Quiet room, comfortable seating")
        print("   • Testing: Play a few rounds to fine-tune sensitivity")
        print()
        
        self.show_advanced_options()
        
    def show_advanced_options(self):
        """Show advanced calibration options"""
        print("⚙️ ADVANCED CALIBRATION:")
        print()
        
        print("🎛️ Manual Threshold Setting:")
        print("   If auto-calibration doesn't work, you can manually set:")
        print("   • Baseline: Your normal breathing volume")
        print("   • Inhale threshold: Volume that triggers 'up' movement")
        print("   • Exhale threshold: Volume that triggers 'down' movement")
        print()
        
        print("📊 Monitoring Calibration:")
        print("   • Enable Debug Panel to see real-time values")
        print("   • Watch breathing volume levels during calibration")
        print("   • Baseline should be your average breathing volume")
        print("   • Thresholds should be ±50% of baseline typically")
        print()
        
        print("🔄 Different Calibration Modes:")
        print("   1. Automatic (default): Breathe normally for 10 seconds")
        print("   2. Manual: Use API calls to trigger calibration")
        print("   3. Saved settings: Calibrate once, save for later")
        print()
        
        print("📁 Saving Calibration:")
        print("   • Calibration is automatically saved to config.json")
        print("   • You can backup your calibration settings")
        print("   • Restore settings by copying config.json")
        print()
        
        self.interactive_menu()
        
    def interactive_menu(self):
        """Interactive calibration menu"""
        print("🎮 CALIBRATION ACTIONS:")
        print()
        print("Choose what you'd like to do:")
        print("1. 🌐 Open game for calibration")
        print("2. 📊 View current calibration status") 
        print("3. 🔄 Trigger recalibration via API")
        print("4. ❓ Show detailed help")
        print("5. 🚪 Exit")
        print()
        
        while True:
            try:
                choice = input("Enter choice (1-5): ").strip()
                
                if choice == '1':
                    print("🌐 Opening http://localhost:5000")
                    print("Follow the calibration steps shown above!")
                    import webbrowser
                    webbrowser.open('http://localhost:5000')
                    break
                    
                elif choice == '2':
                    self.show_current_status()
                    
                elif choice == '3':
                    self.trigger_recalibration()
                    
                elif choice == '4':
                    self.show_detailed_help()
                    
                elif choice == '5':
                    print("👋 Good luck with your breathing-controlled gaming!")
                    if self.server:
                        self.server.stop_server()
                    break
                    
                else:
                    print("❌ Invalid choice. Please enter 1-5.")
                    
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                if self.server:
                    self.server.stop_server()
                break
                
    def show_current_status(self):
        """Show current calibration status"""
        print("\n📊 CURRENT CALIBRATION STATUS:")
        print("-" * 30)
        
        try:
            import requests
            response = requests.get('http://localhost:5000/status', timeout=5)
            if response.status_code == 200:
                status = response.json()
                
                print(f"Server Running: {status.get('server_running', False)}")
                print(f"Breathing Active: {status.get('breathing_detector_active', False)}")
                
                breathing_state = status.get('breathing_state')
                if breathing_state:
                    print(f"Calibrated: {breathing_state.get('is_calibrated', False)}")
                    print(f"Baseline Volume: {breathing_state.get('baseline', 'N/A')}")
                else:
                    print("Breathing State: Not available")
            else:
                print(f"❌ Server error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Could not get status: {e}")
            print("Make sure the server is running!")
        
        print()
        
    def trigger_recalibration(self):
        """Trigger recalibration via API"""
        print("\n🔄 TRIGGERING RECALIBRATION...")
        print("Make sure to breathe normally for the next 10 seconds!")
        print()
        
        try:
            import requests
            response = requests.post('http://localhost:5000/calibrate', timeout=5)
            if response.status_code == 200:
                print("✅ Calibration started successfully!")
                print("Breathe normally now...")
                
                # Monitor for 10 seconds
                for i in range(10, 0, -1):
                    print(f"⏱️ Calibrating... {i} seconds remaining", end='\r')
                    time.sleep(1)
                    
                print("\n✅ Calibration should be complete!")
                
            else:
                print(f"❌ Failed to start calibration: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Calibration failed: {e}")
        
        print()
        
    def show_detailed_help(self):
        """Show detailed help information"""
        print("\n❓ DETAILED HELP:")
        print("-" * 20)
        print()
        
        print("🎯 What is calibration?")
        print("Calibration teaches the system your normal breathing pattern.")
        print("It measures your baseline breathing volume and sets thresholds")
        print("for detecting when you inhale (go up) or exhale (go down).")
        print()
        
        print("🕐 How long does it take?")
        print("Automatic calibration takes about 3-10 seconds of normal breathing.")
        print("The system collects 100+ audio samples to learn your pattern.")
        print()
        
        print("🔢 What do the numbers mean?")
        print("• Baseline: Your average breathing volume")
        print("• Inhale threshold: Volume above baseline that triggers UP")
        print("• Exhale threshold: Volume below baseline that triggers DOWN")
        print("• Sensitivity: Multiplier that adjusts threshold distances")
        print()
        
        print("🎮 How does it affect gameplay?")
        print("Good calibration = responsive, smooth bird control")
        print("Bad calibration = erratic movement or no response")
        print("You can recalibrate anytime during gameplay!")
        print()

def main():
    """Main entry point"""
    print("🎯 Welcome to the Breathing Calibration Guide!")
    print()
    
    guide = CalibrationGuide()
    guide.interactive_calibration()

if __name__ == '__main__':
    main()