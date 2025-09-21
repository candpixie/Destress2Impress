import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Target } from 'lucide-react';

interface UserStats {
  vibePoints: number;
  level: number;
  rank: string;
  totalSessions: number;
  streak: number;
  badges: string[];
}

interface GamificationPanelProps {
  onVibeComplete: () => void;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ onVibeComplete }) => {
  const [stats, setStats] = useState<UserStats>({
    vibePoints: 1250,
    level: 7,
    rank: "Stress Ninja",
    totalSessions: 43,
    streak: 5,
    badges: ["First Roll", "Music Lover", "Meme Lord", "Streak Master"]
  });

  const [showNewBadge, setShowNewBadge] = useState(false);

  const ranks = [
    { name: "Stress Rookie", minPoints: 0, color: "text-gaming-bronze" },
    { name: "Calm Cadet", minPoints: 500, color: "text-gaming-silver" },
    { name: "Vibe Warrior", minPoints: 1000, color: "text-primary" },
    { name: "Stress Ninja", minPoints: 2000, color: "text-accent" },
    { name: "Zen Master", minPoints: 5000, color: "text-gaming-gold" }
  ];

  const getCurrentRank = () => {
    return ranks.reverse().find(rank => stats.vibePoints >= rank.minPoints) || ranks[0];
  };

  const getNextRank = () => {
    const current = getCurrentRank();
    const currentIndex = ranks.findIndex(r => r.name === current.name);
    return ranks[currentIndex - 1] || null;
  };

  const getProgressToNextLevel = () => {
    const pointsToNextLevel = (stats.level * 200) - (stats.vibePoints % 200);
    const totalPointsNeeded = stats.level * 200;
    return ((totalPointsNeeded - pointsToNextLevel) / totalPointsNeeded) * 100;
  };

  const addVibePoints = (points: number) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        vibePoints: prev.vibePoints + points,
        totalSessions: prev.totalSessions + 1
      };

      // Check for level up
      const newLevel = Math.floor(newStats.vibePoints / 200) + 1;
      if (newLevel > prev.level) {
        newStats.level = newLevel;
        setShowNewBadge(true);
        setTimeout(() => setShowNewBadge(false), 3000);
      }

      return newStats;
    });
  };

  // Listen for vibe completions
  useEffect(() => {
    onVibeComplete();
    addVibePoints(25);
  }, []);

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();

  return (
    <Card className="p-6 bg-gradient-glass backdrop-blur-sm border-border/50">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Progress</h3>
          <Badge variant="gaming" className="animate-pulse">
            Level {stats.level}
          </Badge>
        </div>

        {/* Rank & Points */}
        <div className="text-center space-y-2">
          <div className={`text-2xl font-bold ${currentRank.color}`}>
            {currentRank.name}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xl font-semibold">{stats.vibePoints.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">Vibe Points</span>
          </div>
        </div>

        {/* Progress to Next Rank */}
        {nextRank && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Next Rank</span>
              <span className={`text-sm font-medium ${nextRank.color}`}>
                {nextRank.name}
              </span>
            </div>
            <Progress value={getProgressToNextLevel()} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {nextRank.minPoints - stats.vibePoints} points to go
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-secondary">{stats.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-success">{stats.streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {/* Recent Badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gaming-gold" />
            <span className="text-sm font-medium">Recent Badges</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.badges.slice(-3).map((badge, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        {/* Level Up Animation */}
        {showNewBadge && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <Card className="p-8 text-center bg-gradient-primary">
              <div className="space-y-4">
                <Star className="w-12 h-12 text-gaming-gold mx-auto animate-pulse" />
                <div className="text-2xl font-bold">Level Up!</div>
                <div className="text-lg">You're now Level {stats.level}!</div>
                <div className="text-sm text-muted-foreground">+50 Bonus Vibe Points</div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};