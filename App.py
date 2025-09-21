# app.py
import threading
import time
import random
from collections import deque
import numpy as np
from flask import Flask, jsonify, Response, request
import os
import requests

# -----------------------------
# CONFIG
# -----------------------------
HISTORY_LEN = 10        # smoothing window
UPDATE_INTERVAL = 1     # seconds
FLASK_PORT = 5000       # dashboard port

# -----------------------------
# GLOBALS
# -----------------------------
latest_data = None
history = deque(maxlen=HISTORY_LEN)

# -----------------------------
# SIMULATED EMOTIBIT DATA
# -----------------------------
def simulate_data():
    global latest_data
    while True:
        # Randomized but realistic sensor values
        eda = random.uniform(1.0, 8.0)       # Electrodermal activity
        hr = random.uniform(60, 100)         # Heart rate
        hrv = random.uniform(20, 80)         # Heart rate variability
        temp = random.uniform(36.0, 37.5)    # Skin temperature
        latest_data = {'EDA': eda, 'HR': hr, 'HRV': hrv, 'TEMP': temp}
        time.sleep(UPDATE_INTERVAL)

def get_stress_level():
    global latest_data, history

    if latest_data is None:
        return {"level": 5.0}

    eda = latest_data['EDA']
    hr = latest_data['HR']
    hrv = latest_data['HRV']
    temp = latest_data['TEMP']

    # Stress calculation formula
    stress = 5.0
    stress += (eda - 4.0) * 0.5
    stress += (hr - 70) * 0.05
    stress -= (hrv - 50) * 0.02
    stress += (temp - 36.5) * 0.3

    stress = float(np.clip(stress, 1.0, 10.0))
    history.append(stress)
    smoothed = round(sum(history) / len(history), 1)
    return {"level": smoothed}

# Start the simulation in a background thread
threading.Thread(target=simulate_data, daemon=True).start()

# -----------------------------
# FLASK APP
# -----------------------------
app = Flask(__name__)

# Optional: background print to console
def stress_updater():
    while True:
        stress = get_stress_level()["level"]
        print(f"📊 Simulated Stress Level: {stress}")
        time.sleep(1)

threading.Thread(target=stress_updater, daemon=True).start()

# Routes
@app.route("/")
def index():
    return "<h1>Simulated EmotiBit Stress Dashboard</h1><p>Use /stress for JSON or /stream for live updates.</p>"

@app.route("/stress")
def stress():
    return jsonify(get_stress_level())

@app.route("/stream")
def stream():
    def event_stream():
        while True:
            yield f"data: {get_stress_level()['level']}\n\n"
            time.sleep(1)
    return Response(event_stream(), mimetype="text/event-stream")

@app.route("/cooldown-video", methods=["POST"])
def cooldown_video():
    data = request.get_json()
    player_id = data.get("player_id")
    game = data.get("game")
    
    # Get API keys from environment
    cerebras_api_key = os.environ.get("CEREBRAS_API_KEY")
    youtube_api_key = os.environ.get("YOUTUBE_API_KEY")
    if not cerebras_api_key or not youtube_api_key:
        return jsonify({"error": "Missing API keys"}), 500

    # 1. Use Cerebras API to get a video suggestion
    cerebras_url = "https://api.cerebras.net/suggest"
    cerebras_payload = {
        "player_id": player_id,
        "game": game,
        "type": "relaxing_or_funny_video"
    }
    cerebras_headers = {"Authorization": f"Bearer {cerebras_api_key}"}
    try:
        cerebras_resp = requests.post(cerebras_url, json=cerebras_payload, headers=cerebras_headers, timeout=10)
        cerebras_resp.raise_for_status()
        suggestion = cerebras_resp.json().get("suggestion", "relaxing video")
    except Exception as e:
        print("Cerebras API error:", e)
        suggestion = "relaxing video"

    # 2. Use YouTube Data API to search for the video
    yt_url = "https://www.googleapis.com/youtube/v3/search"
    yt_params = {
        "part": "snippet",
        "q": suggestion,
        "type": "video",
        "maxResults": 1,
        "key": youtube_api_key
    }
    try:
        yt_resp = requests.get(yt_url, params=yt_params, timeout=10)
        yt_resp.raise_for_status()
        items = yt_resp.json().get("items", [])
        if items:
            video_title = items[0]["snippet"]["title"]
            video_id = items[0]["id"]["videoId"]
            video_url = f"https://www.youtube.com/watch?v={video_id}"
        else:
            video_title = suggestion
            video_url = ""
    except Exception as e:
        print("YouTube API error:", e)
        video_title = suggestion
        video_url = ""

    return jsonify({"video_title": video_title, "video_url": video_url})

# Run Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=False)
