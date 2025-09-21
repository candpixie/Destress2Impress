import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipForward, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';

interface VibeContentProps {
  selectedVibe: 'music' | 'meme' | 'movie' | null;
  stressLevel: 'low' | 'medium' | 'high';
  onComplete: () => void;
}

interface MusicContent {
  title: string;
  artist: string;
  playlist: string;
  mood: string;
}

interface MemeContent {
  caption: string;
  imageUrl: string;
  trend: string;
}

interface MovieContent {
  title: string;
  description: string;
  genre: string;
  duration: string;
}

export const VibeContent: React.FC<VibeContentProps> = ({ selectedVibe, stressLevel, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [liked, setLiked] = useState<boolean | null>(null);

  // Mock content generation based on stress level and vibe type
  const generateContent = () => {
    if (!selectedVibe) return null;

    switch (selectedVibe) {
      case 'music':
        const musicMoods = {
          low: ['chill', 'ambient', 'coffee shop'],
          medium: ['upbeat', 'motivational', 'focus'],
          high: ['calming', 'meditation', 'rain sounds']
        };
        return {
          title: "Stress Relief Mix",
          artist: "AI Curator",
          playlist: `${musicMoods[stressLevel][Math.floor(Math.random() * 3)]} vibes`,
          mood: stressLevel === 'high' ? 'Calming' : stressLevel === 'medium' ? 'Energizing' : 'Chill'
        } as MusicContent;

      case 'meme':
        const memeTypes = {
          low: ['wholesome', 'cats', 'success kid'],
          medium: ['relatable work', 'Monday mood', 'coffee memes'],
          high: ['this is fine', 'stress eating', 'breathing exercises but funny']
        };
        return {
          caption: `When you're feeling ${stressLevel} stress but the meme hits different`,
          imageUrl: '/placeholder-meme.jpg',
          trend: memeTypes[stressLevel][Math.floor(Math.random() * 3)]
        } as MemeContent;

      case 'movie':
        const movieGenres = {
          low: ['comedy', 'feel-good', 'adventure'],
          medium: ['inspirational', 'action', 'comedy'],
          high: ['calming nature', 'mindfulness', 'comedy']
        };
        return {
          title: "Quick Escape",
          description: "A perfectly curated 60-second clip to reset your mood",
          genre: movieGenres[stressLevel][Math.floor(Math.random() * 3)],
          duration: "60s"
        } as MovieContent;

      default:
        return null;
    }
  };

  useEffect(() => {
    if (selectedVibe) {
      setCurrentContent(generateContent());
      setProgress(0);
      setLiked(null);
    }
  }, [selectedVibe, stressLevel]);

  useEffect(() => {
    if (isPlaying && progress < 100) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            setIsPlaying(false);
            onComplete();
            return 100;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying, progress, onComplete]);

  if (!selectedVibe || !currentContent) {
    return (
      <Card className="p-8 text-center bg-gradient-glass backdrop-blur-sm border-border/50">
        <div className="space-y-4">
          <div className="text-4xl">🎲</div>
          <h3 className="text-xl font-semibold">Ready for your vibe?</h3>
          <p className="text-muted-foreground">Roll the dice or choose your escape method above!</p>
        </div>
      </Card>
    );
  }

  const renderMusicContent = (content: MusicContent) => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="bg-gradient-secondary">
          🎵 {content.mood} Music
        </Badge>
        <h3 className="text-xl font-bold">{content.title}</h3>
        <p className="text-muted-foreground">by {content.artist}</p>
        <Badge variant="outline">{content.playlist}</Badge>
      </div>

      <div className="space-y-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-primary h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentContent(generateContent())}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderMemeContent = (content: MemeContent) => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="vibe" className="bg-gradient-accent">
          🖼️ Fresh Meme
        </Badge>
        <Badge variant="outline">{content.trend}</Badge>
      </div>

      <div className="bg-muted rounded-lg p-8 text-center space-y-4">
        <div className="text-6xl">😂</div>
        <p className="text-lg font-medium">{content.caption}</p>
        <p className="text-sm text-muted-foreground">*AI-generated meme based on current trends*</p>
      </div>

      <div className="flex justify-center gap-4">
        <Button 
          variant={liked === true ? "default" : "outline"}
          onClick={() => setLiked(true)}
        >
          <ThumbsUp className="w-4 h-4" />
          Dopamine hit!
        </Button>
        <Button 
          variant={liked === false ? "destructive" : "outline"}
          onClick={() => setLiked(false)}
        >
          <ThumbsDown className="w-4 h-4" />
          Roll again
        </Button>
      </div>
    </div>
  );

  const renderMovieContent = (content: MovieContent) => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="gaming" className="bg-gradient-gaming">
          🎬 Movie Magic
        </Badge>
        <h3 className="text-xl font-bold">{content.title}</h3>
        <p className="text-muted-foreground">{content.description}</p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline">{content.genre}</Badge>
          <Badge variant="outline">{content.duration}</Badge>
        </div>
      </div>

      <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🎥</div>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'} Clip
          </Button>
          {isPlaying && (
            <div className="w-full bg-background rounded-full h-1 mt-4">
              <div 
                className="bg-gradient-primary h-1 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-6 bg-gradient-glass backdrop-blur-sm border-border/50">
      {selectedVibe === 'music' && renderMusicContent(currentContent)}
      {selectedVibe === 'meme' && renderMemeContent(currentContent)}
      {selectedVibe === 'movie' && renderMovieContent(currentContent)}
      
      {progress === 100 && (
        <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
          <p className="text-success font-medium">+25 Vibe Points earned! 🎉</p>
        </div>
      )}
    </Card>
  );
};