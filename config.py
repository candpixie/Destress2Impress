import json
import os
from dataclasses import dataclass, asdict
from typing import Dict, Any

@dataclass
class AudioConfig:
    """Audio processing configuration"""
    sample_rate: int = 44100
    chunk_size: int = 1024
    channels: int = 1
    format: str = "paInt16"
    
@dataclass
class BreathingConfig:
    """Breathing detection configuration"""
    sensitivity: float = 1.0
    min_state_duration: float = 0.3
    calibration_samples: int = 100
    smoothing_window: int = 3
    
@dataclass
class GameConfig:
    """Game physics configuration"""
    game_width: int = 800
    game_height: int = 600
    gravity: float = 0.5
    breathing_force: float = 8.0
    exhale_force: float = 4.0
    max_velocity: float = 10.0
    pipe_speed: float = 3.0
    pipe_spawn_distance: int = 300
    pipe_gap_height: int = 120
    bird_radius: int = 20
    target_fps: int = 60
    
@dataclass
class ServerConfig:
    """Server configuration"""
    host: str = "localhost"
    port: int = 5000
    debug: bool = False
    cors_origins: str = "*"
    secret_key: str = "breathing_flappy_bird_secret"

@dataclass
class AppConfig:
    """Main application configuration"""
    audio: AudioConfig
    breathing: BreathingConfig
    game: GameConfig  
    server: ServerConfig
    
    def __init__(self):
        self.audio = AudioConfig()
        self.breathing = BreathingConfig()
        self.game = GameConfig()
        self.server = ServerConfig()

class ConfigManager:
    """Manages application configuration with file persistence"""
    
    def __init__(self, config_file="config.json"):
        self.config_file = config_file
        self.config = AppConfig()
        self.load_config()
        
    def load_config(self):
        """Load configuration from file"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    data = json.load(f)
                    
                # Update configuration with loaded data
                if 'audio' in data:
                    for key, value in data['audio'].items():
                        if hasattr(self.config.audio, key):
                            setattr(self.config.audio, key, value)
                            
                if 'breathing' in data:
                    for key, value in data['breathing'].items():
                        if hasattr(self.config.breathing, key):
                            setattr(self.config.breathing, key, value)
                            
                if 'game' in data:
                    for key, value in data['game'].items():
                        if hasattr(self.config.game, key):
                            setattr(self.config.game, key, value)
                            
                if 'server' in data:
                    for key, value in data['server'].items():
                        if hasattr(self.config.server, key):
                            setattr(self.config.server, key, value)
                            
                print(f"Configuration loaded from {self.config_file}")
                
            except Exception as e:
                print(f"Error loading config: {e}")
                print("Using default configuration")
        else:
            print("No config file found, using defaults")
            self.save_config()  # Create default config file
            
    def save_config(self):
        """Save current configuration to file"""
        try:
            config_dict = {
                'audio': asdict(self.config.audio),
                'breathing': asdict(self.config.breathing),
                'game': asdict(self.config.game),
                'server': asdict(self.config.server)
            }
            
            with open(self.config_file, 'w') as f:
                json.dump(config_dict, f, indent=2)
                
            print(f"Configuration saved to {self.config_file}")
            
        except Exception as e:
            print(f"Error saving config: {e}")
            
    def update_config(self, section: str, updates: Dict[str, Any]):
        """Update a configuration section"""
        if section == 'audio' and hasattr(self.config, 'audio'):
            for key, value in updates.items():
                if hasattr(self.config.audio, key):
                    setattr(self.config.audio, key, value)
                    
        elif section == 'breathing' and hasattr(self.config, 'breathing'):
            for key, value in updates.items():
                if hasattr(self.config.breathing, key):
                    setattr(self.config.breathing, key, value)
                    
        elif section == 'game' and hasattr(self.config, 'game'):
            for key, value in updates.items():
                if hasattr(self.config.game, key):
                    setattr(self.config.game, key, value)
                    
        elif section == 'server' and hasattr(self.config, 'server'):
            for key, value in updates.items():
                if hasattr(self.config.server, key):
                    setattr(self.config.server, key, value)
                    
        self.save_config()
        
    def get_config_dict(self) -> Dict[str, Any]:
        """Get configuration as dictionary"""
        return {
            'audio': asdict(self.config.audio),
            'breathing': asdict(self.config.breathing),
            'game': asdict(self.config.game),
            'server': asdict(self.config.server)
        }
        
    def reset_to_defaults(self):
        """Reset configuration to default values"""
        self.config = AppConfig()
        self.save_config()
        print("Configuration reset to defaults")

# Calibration utilities
class CalibrationManager:
    """Manages breathing detection calibration"""
    
    def __init__(self, breathing_detector=None):
        self.breathing_detector = breathing_detector
        self.calibration_data = {
            'baseline_volume': 0,
            'inhale_threshold': 0,
            'exhale_threshold': 0,
            'noise_floor': 0,
            'calibration_time': None,
            'sample_count': 0
        }
        
    def start_calibration(self, duration=10):
        """Start breathing calibration process"""
        if not self.breathing_detector:
            return False
            
        print(f"Starting {duration}s calibration...")
        print("Please breathe normally during calibration")
        
        self.breathing_detector.recalibrate()
        return True
        
    def get_calibration_status(self):
        """Get current calibration status"""
        if self.breathing_detector:
            state = self.breathing_detector.get_current_state()
            return {
                'is_calibrated': state['is_calibrated'],
                'baseline': state['baseline'],
                'sample_count': len(self.breathing_detector.calibration_samples) if hasattr(self.breathing_detector, 'calibration_samples') else 0
            }
        return {'is_calibrated': False, 'baseline': 0, 'sample_count': 0}
        
    def save_calibration(self, filename="breathing_calibration.json"):
        """Save calibration data to file"""
        if not self.breathing_detector or not self.breathing_detector.is_calibrated:
            return False
            
        try:
            calibration_data = {
                'baseline_volume': self.breathing_detector.baseline_volume,
                'inhale_threshold': self.breathing_detector.inhale_threshold,
                'exhale_threshold': self.breathing_detector.exhale_threshold,
                'sensitivity': self.breathing_detector.sensitivity,
                'calibration_time': time.time(),
                'sample_count': len(self.breathing_detector.calibration_samples)
            }
            
            with open(filename, 'w') as f:
                json.dump(calibration_data, f, indent=2)
                
            print(f"Calibration saved to {filename}")
            return True
            
        except Exception as e:
            print(f"Error saving calibration: {e}")
            return False
            
    def load_calibration(self, filename="breathing_calibration.json"):
        """Load calibration data from file"""
        if not os.path.exists(filename):
            return False
            
        try:
            with open(filename, 'r') as f:
                calibration_data = json.load(f)
                
            if self.breathing_detector:
                self.breathing_detector.baseline_volume = calibration_data.get('baseline_volume', 0)
                self.breathing_detector.inhale_threshold = calibration_data.get('inhale_threshold', 0)
                self.breathing_detector.exhale_threshold = calibration_data.get('exhale_threshold', 0)
                self.breathing_detector.sensitivity = calibration_data.get('sensitivity', 1.0)
                self.breathing_detector.is_calibrated = True
                
            print(f"Calibration loaded from {filename}")
            return True
            
        except Exception as e:
            print(f"Error loading calibration: {e}")
            return False

# Global config instance
config_manager = ConfigManager()