import pyaudio
import numpy as np
import threading
from scipy.signal import butter, lfilter
import time
from collections import deque

class BreathingDetector:
    def __init__(self, callback=None, sensitivity=1.0):
        # Audio configuration
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 44100
        
        # Breathing detection parameters
        self.sensitivity = sensitivity
        self.callback = callback
        self.is_running = False
        
        # Audio processing
        self.audio = pyaudio.PyAudio()
        self.stream = None
        
        # Detection state
        self.volume_history = deque(maxlen=20)  # Keep last 20 volume readings
        self.breathing_state = "neutral"  # "inhale", "exhale", "neutral"
        self.last_state_change = time.time()
        self.min_state_duration = 0.3  # Minimum duration for a breathing state
        
        # Calibration values
        self.baseline_volume = 0
        self.inhale_threshold = 0
        self.exhale_threshold = 0
        self.calibration_samples = []
        self.is_calibrated = False
        
    def start_audio_stream(self):
        """Start the audio input stream"""
        try:
            self.stream = self.audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK,
                stream_callback=self._audio_callback
            )
            self.stream.start_stream()
            self.is_running = True
            print("Audio stream started")
        except Exception as e:
            print(f"Error starting audio stream: {e}")
            
    def stop_audio_stream(self):
        """Stop the audio input stream"""
        self.is_running = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.audio.terminate()
        print("Audio stream stopped")
        
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """Process audio data in real-time"""
        if not self.is_running:
            return (in_data, pyaudio.paContinue)
            
        # Convert audio data to numpy array
        audio_data = np.frombuffer(in_data, dtype=np.int16)
        
        # Calculate volume (RMS) with safety check
        if len(audio_data) > 0:
            volume = np.sqrt(np.mean(audio_data.astype(np.float64)**2))
            # Handle NaN or infinite values
            if not np.isfinite(volume):
                volume = 0.0
        else:
            volume = 0.0
        
        # Apply low-pass filter to smooth the signal
        if len(self.volume_history) > 0:
            filtered_volume = self._apply_smoothing(volume)
        else:
            filtered_volume = volume
            
        self.volume_history.append(filtered_volume)
        
        # Detect breathing pattern
        if self.is_calibrated:
            self._detect_breathing(filtered_volume)
        else:
            self._collect_calibration_data(filtered_volume)
            
        return (in_data, pyaudio.paContinue)
        
    def _apply_smoothing(self, current_volume):
        """Apply smoothing filter to reduce noise"""
        if len(self.volume_history) < 3:
            return current_volume
            
        # Simple moving average
        recent_volumes = list(self.volume_history)[-3:] + [current_volume]
        return np.mean(recent_volumes)
        
    def _collect_calibration_data(self, volume):
        """Collect calibration data for baseline breathing"""
        self.calibration_samples.append(volume)
        
        # Auto-calibrate after collecting enough samples
        if len(self.calibration_samples) >= 100:  # About 2-3 seconds of data
            self._auto_calibrate()
            
    def _auto_calibrate(self):
        """Automatically calibrate breathing thresholds"""
        if len(self.calibration_samples) < 50:
            return
            
        volumes = np.array(self.calibration_samples)
        
        # Filter out invalid values
        valid_volumes = volumes[np.isfinite(volumes) & (volumes >= 0)]
        
        if len(valid_volumes) < 10:
            print("Not enough valid calibration samples, using defaults")
            self.baseline_volume = 100.0
            self.inhale_threshold = 150.0
            self.exhale_threshold = 50.0
            self.is_calibrated = True
            return
        
        # Calculate baseline and thresholds
        self.baseline_volume = np.median(valid_volumes)
        volume_std = np.std(valid_volumes)
        
        # Ensure we have reasonable values
        if self.baseline_volume == 0 or volume_std == 0:
            self.baseline_volume = max(100.0, np.mean(valid_volumes))
            volume_std = max(50.0, self.baseline_volume * 0.5)
        
        # Set thresholds with better logic for low-volume breathing
        threshold_multiplier = self.sensitivity
        
        # Inhale threshold: above baseline
        self.inhale_threshold = self.baseline_volume + (volume_std * threshold_multiplier * 1.2)
        
        # Exhale threshold: below baseline, but ensure it's meaningful and not 0
        exhale_reduction = volume_std * threshold_multiplier * 0.8
        self.exhale_threshold = max(
            self.baseline_volume * 0.3,  # At least 30% of baseline
            self.baseline_volume - exhale_reduction
        )
        
        # Additional safety: ensure thresholds are well separated
        threshold_separation = abs(self.inhale_threshold - self.exhale_threshold)
        min_separation = max(20.0, self.baseline_volume * 0.4)
        
        if threshold_separation < min_separation:
            # Expand thresholds around baseline
            mid_point = self.baseline_volume
            half_separation = min_separation / 2
            self.inhale_threshold = mid_point + half_separation
            self.exhale_threshold = max(1.0, mid_point - half_separation)
        
        self.is_calibrated = True
        print(f"Calibrated - Baseline: {self.baseline_volume:.2f}, "
              f"Inhale threshold: {self.inhale_threshold:.2f}, "
              f"Exhale threshold: {self.exhale_threshold:.2f}")
        
    def _detect_breathing(self, volume):
        """Detect inhale/exhale based on volume changes"""
        current_time = time.time()
        new_state = self.breathing_state
        
        # Determine breathing state based on volume
        if volume > self.inhale_threshold:
            new_state = "inhale"
        elif volume < self.exhale_threshold:
            new_state = "exhale"
        else:
            # In neutral zone - maintain current state briefly, then go to neutral
            if current_time - self.last_state_change > self.min_state_duration:
                new_state = "neutral"
        
        # Only change state if enough time has passed (debouncing)
        if (new_state != self.breathing_state and 
            current_time - self.last_state_change > self.min_state_duration):
            
            self.breathing_state = new_state
            self.last_state_change = current_time
            
            # Trigger callback if provided
            if self.callback and new_state in ["inhale", "exhale"]:
                self.callback(new_state, volume)
                
    def get_current_state(self):
        """Get current breathing state"""
        return {
            'state': self.breathing_state,
            'volume': self.volume_history[-1] if self.volume_history else 0,
            'is_calibrated': self.is_calibrated,
            'baseline': self.baseline_volume
        }
        
    def recalibrate(self):
        """Reset calibration and start over"""
        self.calibration_samples = []
        self.is_calibrated = False
        self.baseline_volume = 0
        self.inhale_threshold = 0
        self.exhale_threshold = 0
        print("Recalibrating...")
        
    def set_sensitivity(self, sensitivity):
        """Adjust breathing detection sensitivity"""
        self.sensitivity = max(0.1, min(3.0, sensitivity))
        if self.is_calibrated:
            # Recalculate thresholds with new sensitivity
            self._auto_calibrate()