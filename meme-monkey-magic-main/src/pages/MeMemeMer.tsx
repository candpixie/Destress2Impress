import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRandomMeme, type Meme } from "@/data/memes";
import { getUniqueRedditMeme } from "@/services/redditApi";
import { Shuffle, Trophy, Zap, Puzzle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MemePuzzle from "@/components/MemePuzzle";
import MemeImagePuzzle from "@/components/MemeImagePuzzle";

const MeMemeMer = () => {
  const [currentMeme, setCurrentMeme] = useState<Meme>(getRandomMeme());
  const [isGenerating, setIsGenerating] = useState(false);
  const [points, setPoints] = useState(0);
  const [monkeyAnimation, setMonkeyAnimation] = useState(false);
  const [isUsingReddit, setIsUsingReddit] = useState(true);

  const generateNewMeme = async () => {
    setIsGenerating(true);
    
    try {
      if (isUsingReddit) {
        const redditMeme = await getUniqueRedditMeme();
        
        if (redditMeme) {
          setCurrentMeme(redditMeme);
          toast({
            title: "Fresh Reddit meme! 🔥",
            description: `Trending with ${redditMeme.score} upvotes!`,
          });
        } else {
          // Fallback to static memes
          const staticMeme = getRandomMeme();
          setCurrentMeme(staticMeme);
          toast({
            title: "Backup meme loaded! 📚",
            description: "Reddit unavailable, serving premium static content!",
          });
        }
      } else {
        const staticMeme = getRandomMeme();
        setCurrentMeme(staticMeme);
        toast({
          title: "Classic meme loaded! ✨",
          description: "Hand-picked premium content!",
        });
      }
    } catch (error) {
      // Fallback to static memes on error
      const staticMeme = getRandomMeme();
      setCurrentMeme(staticMeme);
      toast({
        title: "Meme loaded! 🎯",
        description: "Serving reliable backup content!",
      });
    }
    
    setIsGenerating(false);
    
    // Trigger monkey animation
    setMonkeyAnimation(true);
    setTimeout(() => setMonkeyAnimation(false), 800);
  };

  const completeLaughQuest = () => {
    setPoints(prev => prev + 10);
    toast({
      title: "Laugh Quest Complete! ✅",
      description: "+10 dopamine points earned!",
    });
  };

  const handlePuzzlePoints = (earnedPoints: number) => {
    setPoints(prev => prev + earnedPoints);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-dopamine-yellow/10 to-dopamine-pink/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-typescript font-black mb-4 title-rainbow flex items-center justify-center gap-4">
            MeMemeMer(); 
            <span className={`text-7xl ${monkeyAnimation ? 'monkey-bounce' : ''}`}>
              🐒
            </span>
          </h1>
          <p className="text-xl font-code text-muted-foreground font-medium mb-6">
            // AI-powered meme quests to shift your vibe
          </p>
          
          {/* Points Display */}
          <div className="flex justify-center gap-4 mb-8">
            <Badge variant="secondary" className="text-lg py-2 px-4 sunshine-gradient text-white font-bold">
              <Trophy className="mr-2 h-5 w-5" />
              {points} Points
            </Badge>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="generator" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="generator" className="text-lg py-3">
              <Shuffle className="mr-2 h-5 w-5" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="puzzle" className="text-lg py-3">
              <Puzzle className="mr-2 h-5 w-5" />
              Caption Quiz
            </TabsTrigger>
            <TabsTrigger value="jigsaw" className="text-lg py-3">
              <Puzzle className="mr-2 h-5 w-5" />
              Jigsaw Puzzle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-8">
            {/* Main Meme Card */}
            <div className="flex justify-center">
              <div className={`window-container ${isGenerating ? '' : 'breaking'} max-w-2xl w-full relative`}>
                <div className="glass-crack"></div>
                <Card className={`meme-card w-full ${isGenerating ? 'loading' : 'fade-in-meme'}`}>
                  <div className="w-full bg-muted overflow-hidden">
                    <img
                      src={currentMeme.imageUrl}
                      alt={currentMeme.altText}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-lg font-code font-medium text-card-foreground text-center leading-relaxed">
                      /* {currentMeme.caption} */
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Source Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm p-2 rounded-lg border">
              <Button
                variant={isUsingReddit ? "blob" : "organic"}
                size="sm"
                onClick={() => setIsUsingReddit(true)}
                className="font-code transition-all"
              >
                fetch('reddit/hot')
              </Button>
              <Button
                variant={!isUsingReddit ? "blob" : "organic"}
                size="sm"
                onClick={() => setIsUsingReddit(false)}
                className="font-code transition-all"
              >
                const staticMemes[]
              </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                variant="wavy"
                onClick={generateNewMeme}
                disabled={isGenerating}
                className="ocean-gradient text-white font-code font-bold text-lg py-6 px-8 shadow-fun hover:shadow-glow transition-all duration-300"
              >
                {isGenerating ? (
                  <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Shuffle className="mr-2 h-6 w-6" />
                )}
                {isGenerating ? "await fetch()..." : `generateMeme(${isUsingReddit ? "'reddit'" : "'static'"})`}
              </Button>
              
              <Button
                size="lg"
                variant="splat"
                onClick={completeLaughQuest}
                className="dopamine-gradient text-white font-code font-bold text-lg py-6 px-8 shadow-fun hover:shadow-glow transition-all duration-300"
              >
                <Zap className="mr-2 h-6 w-6" />
                questComplete() ✅
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="puzzle">
            <MemePuzzle onPointsEarned={handlePuzzlePoints} />
          </TabsContent>

          <TabsContent value="jigsaw">
            <MemeImagePuzzle onPointsEarned={handlePuzzlePoints} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center">
          <p className="text-muted-foreground text-lg font-code font-medium">
            // Powered by MeMemeMer.tsx 🤖✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeMemeMer;