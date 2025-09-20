import time
import random
import threading
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class Bird:
    x: float = 100.0
    y: float = 250.0
    velocity_y: float = 0.0
    radius: int = 20
    
@dataclass 
class Pipe:
    x: float
    gap_y: float
    gap_height: int = 120
    width: int = 50
    passed: bool = False

class FlappyBirdGame:
    def __init__(self, breathing_callback=None):
        # Game dimensions
        self.GAME_WIDTH = 800
        self.GAME_HEIGHT = 600
        
        # Game objects
        self.bird = Bird()
        self.pipes: List[Pipe] = []
        
        # Physics constants
        self.GRAVITY = 0.5
        self.BREATHING_FORCE = -8.0  # Inhale force (negative = up)
        self.EXHALE_FORCE = 4.0     # Exhale force (positive = down)
        self.MAX_VELOCITY = 10.0
        self.PIPE_SPEED = 3.0
        self.PIPE_SPAWN_DISTANCE = 300
        
        # Game state
        self.is_running = False
        self.is_paused = False
        self.score = 0
        self.high_score = 0
        self.game_over = False
        self.start_time = 0
        
        # Breathing control
        self.breathing_callback = breathing_callback
        self.current_breathing = "neutral"
        self.breathing_force_active = False
        self.breathing_force_timer = 0
        self.BREATHING_FORCE_DURATION = 0.3  # How long breathing force is applied
        
        # Game loop
        self.game_thread = None
        self.lock = threading.Lock()
        
    def start_game(self):
        """Start the game loop"""
        if self.is_running:
            return
            
        self.reset_game()
        self.is_running = True
        self.game_thread = threading.Thread(target=self._game_loop, daemon=True)
        self.game_thread.start()
        
    def stop_game(self):
        """Stop the game loop"""
        self.is_running = False
        if self.game_thread:
            self.game_thread.join(timeout=1.0)
            
    def pause_game(self):
        """Pause/unpause the game"""
        with self.lock:
            self.is_paused = not self.is_paused
            
    def reset_game(self):
        """Reset game to initial state"""
        with self.lock:
            self.bird = Bird()
            self.pipes = []
            self.score = 0
            self.game_over = False
            self.start_time = time.time()
            self.breathing_force_active = False
            self.breathing_force_timer = 0
            self._generate_initial_pipes()
            
    def on_breathing_input(self, breath_type, volume=0):
        """Handle breathing input from the detector"""
        with self.lock:
            if self.game_over or self.is_paused:
                return
                
            self.current_breathing = breath_type
            
            if breath_type == "inhale":
                # Apply upward force
                self.bird.velocity_y = max(self.BREATHING_FORCE, 
                                         self.bird.velocity_y + self.BREATHING_FORCE)
                self.breathing_force_active = True
                self.breathing_force_timer = time.time()
                
            elif breath_type == "exhale":
                # Apply downward force
                self.bird.velocity_y = min(self.EXHALE_FORCE, 
                                         self.bird.velocity_y + self.EXHALE_FORCE)
                self.breathing_force_active = True
                self.breathing_force_timer = time.time()
                
    def _game_loop(self):
        """Main game loop running at ~60 FPS"""
        last_time = time.time()
        target_fps = 60
        frame_time = 1.0 / target_fps
        
        while self.is_running:
            current_time = time.time()
            delta_time = current_time - last_time
            
            if delta_time >= frame_time:
                if not self.is_paused and not self.game_over:
                    self._update_game(delta_time)
                    
                # Notify callback about game state
                if self.breathing_callback:
                    self.breathing_callback(self.get_game_state())
                    
                last_time = current_time
                
            time.sleep(0.001)  # Small sleep to prevent busy waiting
            
    def _update_game(self, delta_time):
        """Update game state for one frame"""
        with self.lock:
            # Update bird physics
            self._update_bird_physics(delta_time)
            
            # Update pipes
            self._update_pipes(delta_time)
            
            # Check collisions
            self._check_collisions()
            
            # Update score
            self._update_score()
            
    def _update_bird_physics(self, delta_time):
        """Update bird position and velocity"""
        # Apply gravity
        self.bird.velocity_y += self.GRAVITY
        
        # Check if breathing force should still be applied
        if (self.breathing_force_active and 
            time.time() - self.breathing_force_timer > self.BREATHING_FORCE_DURATION):
            self.breathing_force_active = False
            self.current_breathing = "neutral"
            
        # Limit velocity
        self.bird.velocity_y = max(-self.MAX_VELOCITY, 
                                 min(self.MAX_VELOCITY, self.bird.velocity_y))
        
        # Update position
        self.bird.y += self.bird.velocity_y
        
        # Keep bird on screen
        if self.bird.y < self.bird.radius:
            self.bird.y = self.bird.radius
            self.bird.velocity_y = 0
        elif self.bird.y > self.GAME_HEIGHT - self.bird.radius:
            self.bird.y = self.GAME_HEIGHT - self.bird.radius
            self.bird.velocity_y = 0
            self._game_over()
            
    def _update_pipes(self, delta_time):
        """Update pipe positions and generate new ones"""
        # Move existing pipes
        for pipe in self.pipes[:]:
            pipe.x -= self.PIPE_SPEED
            
            # Remove pipes that are off screen
            if pipe.x + pipe.width < 0:
                self.pipes.remove(pipe)
                
        # Generate new pipes
        if not self.pipes or self.pipes[-1].x < self.GAME_WIDTH - self.PIPE_SPAWN_DISTANCE:
            self._generate_pipe()
            
    def _generate_initial_pipes(self):
        """Generate initial set of pipes"""
        for i in range(3):
            pipe_x = self.GAME_WIDTH + (i * self.PIPE_SPAWN_DISTANCE)
            self._generate_pipe_at_position(pipe_x)
            
    def _generate_pipe(self):
        """Generate a new pipe at the right edge"""
        self._generate_pipe_at_position(self.GAME_WIDTH)
        
    def _generate_pipe_at_position(self, x):
        """Generate a pipe at specific x position"""
        # Random gap position
        min_gap_y = 100
        max_gap_y = self.GAME_HEIGHT - 200
        gap_y = random.randint(min_gap_y, max_gap_y)
        
        pipe = Pipe(x=x, gap_y=gap_y)
        self.pipes.append(pipe)
        
    def _check_collisions(self):
        """Check for collisions between bird and pipes"""
        bird_left = self.bird.x - self.bird.radius
        bird_right = self.bird.x + self.bird.radius
        bird_top = self.bird.y - self.bird.radius
        bird_bottom = self.bird.y + self.bird.radius
        
        for pipe in self.pipes:
            pipe_left = pipe.x
            pipe_right = pipe.x + pipe.width
            
            # Check if bird is horizontally aligned with pipe
            if bird_right > pipe_left and bird_left < pipe_right:
                # Check if bird hits top or bottom pipe
                gap_top = pipe.gap_y
                gap_bottom = pipe.gap_y + pipe.gap_height
                
                if bird_top < gap_top or bird_bottom > gap_bottom:
                    self._game_over()
                    return
                    
    def _update_score(self):
        """Update score when bird passes pipes"""
        for pipe in self.pipes:
            if not pipe.passed and pipe.x + pipe.width < self.bird.x:
                pipe.passed = True
                self.score += 1
                
    def _game_over(self):
        """Handle game over"""
        self.game_over = True
        if self.score > self.high_score:
            self.high_score = self.score
            
    def get_game_state(self) -> Dict[str, Any]:
        """Get current game state for frontend"""
        with self.lock:
            return {
                'bird': {
                    'x': self.bird.x,
                    'y': self.bird.y,
                    'velocity_y': self.bird.velocity_y,
                    'radius': self.bird.radius
                },
                'pipes': [
                    {
                        'x': pipe.x,
                        'gap_y': pipe.gap_y,
                        'gap_height': pipe.gap_height,
                        'width': pipe.width,
                        'passed': pipe.passed
                    }
                    for pipe in self.pipes
                ],
                'score': self.score,
                'high_score': self.high_score,
                'game_over': self.game_over,
                'is_paused': self.is_paused,
                'game_width': self.GAME_WIDTH,
                'game_height': self.GAME_HEIGHT,
                'breathing_state': self.current_breathing,
                'breathing_force_active': self.breathing_force_active,
                'elapsed_time': time.time() - self.start_time if self.start_time else 0
            }
            
    def get_stats(self) -> Dict[str, Any]:
        """Get game statistics"""
        return {
            'current_score': self.score,
            'high_score': self.high_score,
            'elapsed_time': time.time() - self.start_time if self.start_time else 0,
            'pipes_passed': self.score,
            'game_over': self.game_over
        }
        
    def adjust_difficulty(self, difficulty_level: float):
        """Adjust game difficulty (0.5 = easy, 1.0 = normal, 2.0 = hard)"""
        base_pipe_speed = 3.0
        base_gravity = 0.5
        
        self.PIPE_SPEED = base_pipe_speed * difficulty_level
        self.GRAVITY = base_gravity * difficulty_level