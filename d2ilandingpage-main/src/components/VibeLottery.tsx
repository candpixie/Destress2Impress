import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Image, Video, Dice6 } from 'lucide-react';
import diceIcon from '@/assets/dice-icon.png';

interface VibeLotteryProps {
  onVibeSelected: (vibe: 'music' | 'meme' | 'movie') => void;
  stressLevel: 'low' | 'medium' | 'high';
}

export const VibeLottery: React.FC<VibeLotteryProps> = ({ onVibeSelected, stressLevel }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<'music' | 'meme' | 'movie' | null>(null);

  const vibes = [
    { 
      id: 'music', 
      icon: Music, 
      label: 'Music', 
      description: 'AI-curated vibes',
      color: 'text-primary'
    },
    { 
      id: 'meme', 
      icon: Image, 
      label: 'Meme', 
      description: 'Instant dopamine hit',
      color: 'text-accent'
    },
    { 
      id: 'movie', 
      icon: Video, 
      label: 'Movie Clip', 
      description: 'Quick escape',
      color: 'text-secondary'
    }
  ] as const;

  const rollDice = () => {
    setIsRolling(true);
    
    // Random selection with slight bias based on stress level
    let weights = [1, 1, 1]; // music, meme, movie
    
    if (stressLevel === 'high') {
      weights = [2, 3, 1]; // Favor music and memes for high stress
    } else if (stressLevel === 'medium') {
      weights = [1, 2, 1]; // Slight meme preference
    }
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    let selectedIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        selectedIndex = i;
        break;
      }
    }
    
    const selectedVibe = vibes[selectedIndex].id;
    
    setTimeout(() => {
      setIsRolling(false);
      setLastRoll(selectedVibe);
      onVibeSelected(selectedVibe);
    }, 1500);
  };

  const getStressMessage = () => {
    switch (stressLevel) {
      case 'high': return "🚨 High stress detected! Let's roll for instant relief";
      case 'medium': return "⚡ Feeling tense? Roll the dice for a quick vibe check";
      case 'low': return "😌 All good! Roll for some bonus vibes";
      default: return "🎲 Ready to roll?";
    }
  };

  return (
    <Card className="p-6 bg-gradient-glass backdrop-blur-sm border-border/50">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Vibe Lottery</h2>
          <p className="text-muted-foreground">{getStressMessage()}</p>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <Button
              onClick={rollDice}
              disabled={isRolling}
              variant="dice"
              size="lg"
              className={`w-24 h-24 rounded-xl ${isRolling ? 'animate-dice-roll' : ''}`}
            >
              {isRolling ? (
                <Dice6 className="w-8 h-8" />
              ) : (
                <img src={diceIcon} alt="Dice" className="w-8 h-8" />
              )}
            </Button>
            {isRolling && (
              <div className="absolute -inset-2 bg-gradient-primary rounded-xl animate-pulse opacity-20"></div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {vibes.map((vibe) => {
            const Icon = vibe.icon;
            const isSelected = lastRoll === vibe.id;
            
            return (
              <Button
                key={vibe.id}
                onClick={() => onVibeSelected(vibe.id)}
                variant={isSelected ? "vibe" : "outline"}
                className={`h-20 flex-col gap-2 ${isSelected ? 'ring-2 ring-accent' : ''}`}
              >
                <Icon className={`w-5 h-5 ${vibe.color}`} />
                <div className="text-center">
                  <div className="text-sm font-medium">{vibe.label}</div>
                  <div className="text-xs text-muted-foreground">{vibe.description}</div>
                </div>
              </Button>
            );
          })}
        </div>

        {lastRoll && (
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🎲 Last roll: <span className="font-medium capitalize text-foreground">{lastRoll}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};