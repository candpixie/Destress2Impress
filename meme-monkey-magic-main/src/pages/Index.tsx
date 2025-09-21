import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Smile, Zap, Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-pastel-blue/20 to-pastel-lavender/20">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-7xl font-black mb-6 title-rainbow font-mono">
            Destress to Impress
          </h1>
          <p className="text-2xl text-muted-foreground mb-12 font-medium font-mono">
            Transform your mood with AI-powered wellness experiences
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-8 meme-card hover:shadow-glow transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full pastel-gradient flex items-center justify-center">
                  <Smile className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono">Mood Boosters</h3>
                <p className="text-muted-foreground font-mono">
                  Quick dopamine hits to brighten your day instantly
                </p>
              </div>
            </Card>

            <Card className="p-8 meme-card hover:shadow-glow transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full pastel-sunshine-gradient flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono">Energy Spark</h3>
                <p className="text-muted-foreground font-mono">
                  Gamified experiences that motivate and energize
                </p>
              </div>
            </Card>

            <Card className="p-8 meme-card hover:shadow-glow transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full pastel-ocean-gradient flex items-center justify-center">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono">Self Care</h3>
                <p className="text-muted-foreground font-mono">
                  Gentle wellness tools for mental health support
                </p>
              </div>
            </Card>
          </div>

          {/* CTA Button */}
          <Link to="/memememer">
            <Button 
              size="lg"
              className="pastel-lavender-gradient text-white font-bold text-2xl py-8 px-12 shadow-fun hover:shadow-glow transition-all duration-300 transform hover:scale-105 font-mono"
            >
              <span className="mr-3">🐒</span>
              Try MeMemeMer Now!
              <span className="ml-3">✨</span>
            </Button>
          </Link>
          
          <p className="text-muted-foreground mt-6 text-lg font-mono">
            Your first dopamine-powered meme quest awaits!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
