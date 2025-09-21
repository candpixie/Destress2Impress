import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import MascotWalkArounds from '@/components/MascotWalkArounds';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import heroBackground from '@/assets/hero-bg.jpg';

const Index = () => {
  const games = [
    {
      name: "Crappy Bird",
      description: "Navigate through pipes in this stress-busting bird game",
      url: "https://crappybird.example.com",
      preview: "🐦",
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "FitCheck",
      description: "Mirror workout game for physical wellness",
      url: "https://fitcheck.example.com", 
      preview: "💪",
      color: "from-green-500 to-emerald-500"
    },
    {
      name: "MeMeMeMer",
      description: "Create and share memes to boost your mood",
      url: "https://mememer.example.com",
      preview: "😂", 
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "MuMo",
      description: "Musical mood matching rhythm game",
      url: "https://mumo.example.com",
      preview: "🎵",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Beautiful Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
      <div 
        className="fixed inset-0 opacity-10 bg-cover bg-center bg-no-repeat mix-blend-overlay"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        
        {/* Header with Mascots */}
        <header className="text-center mb-8 space-y-4 relative">
          <MascotWalkArounds />
          <div className="space-y-2 relative z-10">
            <h1 className="text-5xl font-bold text-primary">
              Destress to Impress
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your wellness adventure. Play games that help you destress and feel amazing.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Badge variant="vibe" className="animate-pulse">
              🎮 Wellness Games
            </Badge>
            <Badge variant="outline">
              ⚡ Biometric Powered
            </Badge>
            <Badge variant="gaming">
              🧘 Stress Relief
            </Badge>
          </div>
        </header>

        {/* Biometric Feedback */}
        <div className="mb-8 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/15 via-accent/10 to-secondary/15 border-primary/30 shadow-glow backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Emotibit Biometric Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center gap-8">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                  <div className="text-3xl mb-2 animate-pulse">💓</div>
                  <div className="text-sm text-muted-foreground font-medium">Heart Rate</div>
                  <div className="font-bold text-primary">72 BPM</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-success/10 to-success/5 backdrop-blur-sm">
                  <div className="text-3xl mb-2">🧘</div>
                  <div className="text-sm text-muted-foreground font-medium">Stress Level</div>
                  <div className="font-bold text-success">Relaxed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm">
                  <div className="text-3xl mb-2">😊</div>
                  <div className="text-sm text-muted-foreground font-medium">Mood</div>
                  <div className="font-bold text-accent">Positive</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {games.map((game, index) => (
            <Card key={game.name} className="group hover:shadow-glow transition-all duration-500 hover:scale-105 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-primary/20">
              <CardHeader className="pb-4">
                <div className={`w-full h-40 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 relative overflow-hidden shadow-lg`}>
                  <div className="text-7xl filter drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300">{game.preview}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/10 transition-all duration-300"></div>
                  <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                  {game.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base leading-relaxed">
                  {game.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground border-0 shadow-lg hover:shadow-glow transition-all duration-300" 
                  onClick={() => window.open(game.url, '_blank')}
                >
                  Play Game <ExternalLink className="w-5 h-5 ml-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 space-y-4">
          <div className="text-muted-foreground text-sm">
            Wellness through play. Biometric feedback. Real results. 🎯
          </div>
          <div className="flex justify-center gap-2 text-xs text-muted-foreground">
            <span>🎮 4 Games Available</span>
            <span>•</span>
            <span>💓 Biometric Tracking</span>
            <span>•</span>
            <span>🏆 Progress Monitoring</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
