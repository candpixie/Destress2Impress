# 🐦 Breathing Flappy Bird - Backend

A revolutionary Flappy Bird game controlled entirely by your breathing! Inhale to make the bird go up, exhale to make it go down. This backend server handles real-time audio processing, breathing detection, and game physics.

## 🎮 How It Works

- **Inhale** 💨 → Bird flies UP
- **Exhale** 💨 → Bird goes DOWN  
- **Hold breath** 🫁 → Bird falls with gravity

The system uses advanced audio processing to detect breathing patterns in real-time and translates them into smooth game controls.

## 🚀 Quick Start

### Prerequisites

- Python 3.7+
- A working microphone
- Windows (PowerShell support)

### Installation

1. **Clone and setup the project:**
   ```powershell
   cd c:\DestressToImpress
   ```

2. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```
   
   **Note:** If you encounter issues with PyAudio installation on Windows, you may need to install it manually:
   ```powershell
   pip install pipwin
   pipwin install pyaudio
   ```

3. **Start the server:**
   ```powershell
   python app.py
   ```

4. **Open your browser:**
   - Go to `http://localhost:5000` to see the server status
   - Connect your frontend client to `ws://localhost:5000` for real-time game data

## 🎯 Game Features

### 🎮 Game Mechanics
- **Physics-based bird movement** with gravity
- **Breathing-controlled flight** (inhale up, exhale down)
- **Procedurally generated pipes** with varying gaps
- **Collision detection** and scoring system
- **High score tracking**

### 🎤 Audio Processing
- **Real-time breathing detection** using PyAudio
- **Automatic calibration** - breathe normally for a few seconds
- **Noise filtering** and signal smoothing
- **Adjustable sensitivity** for different users/microphones

### 🌐 WebSocket API
- **Real-time game state** updates
- **Breathing detection** events
- **Game control** (start, pause, stop)
- **Calibration management**

## 📡 API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/` | GET | Server status page |
| `/status` | GET | Get server and game status |
| `/start_game` | POST | Start a new game |
| `/pause_game` | POST | Pause/unpause current game |
| `/stop_game` | POST | Stop current game |
| `/calibrate` | POST | Start breathing recalibration |

### WebSocket Events

#### Client → Server
- `start_game` - Start new game
- `pause_game` - Pause/unpause game
- `stop_game` - Stop current game
- `calibrate_breathing` - Start calibration
- `set_sensitivity` - Adjust breathing sensitivity
- `request_game_state` - Request current game state

#### Server → Client
- `game_state` - Real-time game state updates
- `breathing_detected` - Breathing detection events
- `game_over` - Game over notification
- `calibration_started` - Calibration process started

## 🔧 Configuration

The server automatically creates a `config.json` file with customizable settings:

```json
{
  "audio": {
    "sample_rate": 44100,
    "chunk_size": 1024,
    "channels": 1
  },
  "breathing": {
    "sensitivity": 1.0,
    "min_state_duration": 0.3,
    "calibration_samples": 100
  },
  "game": {
    "gravity": 0.5,
    "breathing_force": 8.0,
    "pipe_speed": 3.0
  },
  "server": {
    "host": "localhost",
    "port": 5000
  }
}
```

## 🎛️ Command Line Options

```powershell
python app.py --help
```

**Options:**
- `--host` - Server host (default: localhost)
- `--port` - Server port (default: 5000)  
- `--debug` - Enable debug mode
- `--sensitivity` - Breathing sensitivity (0.1-3.0)

**Examples:**
```powershell
# Basic usage
python app.py

# Custom host and port
python app.py --host 0.0.0.0 --port 8080

# Debug mode with high sensitivity
python app.py --debug --sensitivity 2.0
```

## 🧪 Testing the System

1. **Start the server:**
   ```powershell
   python app.py --debug
   ```

2. **Test breathing detection:**
   - The server will automatically calibrate when you start a game
   - Breathe normally for the first few seconds
   - Try inhaling and exhaling to see detection in the console

3. **Check WebSocket connection:**
   - Connect to `ws://localhost:5000`
   - Send `start_game` event
   - Listen for `game_state` and `breathing_detected` events

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Flask-SocketIO │◄──►│  Game Engine    │
│   (WebSocket)   │    │     Server       │    │   (Physics)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Breathing        │
                       │ Detector         │
                       │ (PyAudio)        │
                       └──────────────────┘
```

### Core Components

1. **BreathingDetector** (`breathing_detector.py`)
   - Real-time audio capture
   - Breathing pattern analysis
   - Automatic calibration

2. **FlappyBirdGame** (`flappy_bird_game.py`)
   - Game physics and mechanics
   - Collision detection
   - Score management

3. **BreathingFlappyBirdServer** (`server.py`)
   - WebSocket communication
   - REST API endpoints
   - Real-time event broadcasting

4. **ConfigManager** (`config.py`)
   - Configuration management
   - Calibration persistence

## 🔧 Troubleshooting

### Audio Issues
- **No microphone detected:** Check Windows audio settings
- **Poor breathing detection:** Try adjusting sensitivity or recalibrating
- **Audio driver errors:** Make sure PyAudio is installed correctly

### Performance Issues
- **Lag in game updates:** Reduce `target_fps` in config
- **High CPU usage:** Increase `chunk_size` in audio config
- **Memory leaks:** Enable debug mode to monitor

### Network Issues
- **WebSocket connection fails:** Check firewall settings
- **CORS errors:** Update `cors_origins` in server config

## 🎯 Frontend Integration

To create a frontend client, connect to the WebSocket and handle these events:

```javascript
const socket = io('ws://localhost:5000');

// Start game
socket.emit('start_game');

// Handle game state updates
socket.on('game_state', (gameState) => {
    // Update your game display
    updateBird(gameState.bird);
    updatePipes(gameState.pipes);
    updateScore(gameState.score);
});

// Handle breathing detection
socket.on('breathing_detected', (breathingData) => {
    // Show breathing feedback
    showBreathingState(breathingData.type);
});
```

## 📈 Game State Format

The `game_state` event contains:

```json
{
  "bird": {
    "x": 100,
    "y": 250,
    "velocity_y": -2.5,
    "radius": 20
  },
  "pipes": [
    {
      "x": 400,
      "gap_y": 200,
      "gap_height": 120,
      "width": 50,
      "passed": false
    }
  ],
  "score": 5,
  "high_score": 12,
  "game_over": false,
  "breathing_state": "inhale",
  "game_width": 800,
  "game_height": 600
}
```

## 🤝 Contributing

This is a unique breathing-controlled game system! Potential improvements:

- **Mobile support** with phone microphone
- **Multiplayer modes** with multiple breathing inputs
- **Advanced breathing patterns** (rhythm-based challenges)
- **Biometric integration** (heart rate, stress level)
- **Machine learning** breathing pattern recognition

## 📄 License

MIT License - feel free to breathe life into your own projects!

## 🙏 Acknowledgments

- Built with Flask-SocketIO for real-time communication
- PyAudio for cross-platform audio capture
- NumPy and SciPy for signal processing
- Inspired by the classic Flappy Bird game

---

**Happy Breathing and Gaming! 🐦💨**