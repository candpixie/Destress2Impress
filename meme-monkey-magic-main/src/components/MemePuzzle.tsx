import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUniqueRedditMeme } from "@/services/redditApi";
import { Puzzle, CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MemeForPuzzle {
  id: string;
  imageUrl: string;
  caption: string;
  altText: string;
  options: string[];
  correctAnswer: string;
}

interface MemePuzzleProps {
  onPointsEarned: (points: number) => void;
}

const MemePuzzle = ({ onPointsEarned }: MemePuzzleProps) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<MemeForPuzzle | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial puzzle
  useEffect(() => {
    loadNewPuzzle();
  }, []);

  const generateQuizOptions = (correctCaption: string): string[] => {
    const decoyOptions = [
      "When you realize it's Monday morning ☕",
      "Me trying to adult vs. me wanting to nap 😴",
      "That feeling when your code works on first try ✨",
      "POV: You're procrastinating but making it productive 📚",
      "When someone explains crypto to me 🤔",
      "Me choosing Netflix over responsibilities 📺",
      "That face when you check your bank account 💸",
      "Successfully avoiding Monday meetings ☕",
      "When someone spoils your favorite show 😱",
      "Me pretending to listen in meetings 😎"
    ];
    
    // Pick 3 random decoy options that don't match the correct answer
    const availableDecoys = decoyOptions.filter(option => 
      option.toLowerCase() !== correctCaption.toLowerCase()
    );
    
    const selectedDecoys = [];
    for (let i = 0; i < 3 && i < availableDecoys.length; i++) {
      const randomIndex = Math.floor(Math.random() * availableDecoys.length);
      selectedDecoys.push(availableDecoys.splice(randomIndex, 1)[0]);
    }
    
    // Add the correct answer and shuffle
    const allOptions = [...selectedDecoys, correctCaption];
    return allOptions.sort(() => Math.random() - 0.5);
  };

  const loadNewPuzzle = async () => {
    setIsLoading(true);
    try {
      const meme = await getUniqueRedditMeme();
      if (meme) {
        const puzzleMeme: MemeForPuzzle = {
          id: meme.id,
          imageUrl: meme.imageUrl,
          caption: meme.caption,
          altText: meme.altText,
          options: generateQuizOptions(meme.caption),
          correctAnswer: meme.caption
        };
        setCurrentPuzzle(puzzleMeme);
      }
    } catch (error) {
      console.error('Failed to load meme:', error);
      toast({
        title: "Failed to load meme",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const correct = answer === currentPuzzle.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      const points = 15 + (streak * 5); // Bonus points for streaks
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      onPointsEarned(points);
      
      toast({
        title: "Correct! 🎉",
        description: `+${points} points! ${streak > 0 ? `${streak + 1}x streak!` : ''}`,
      });
    } else {
      setStreak(0);
      toast({
        title: "Wrong answer! 😅",
        description: "Better luck next time!",
        variant: "destructive",
      });
    }
  };

  const nextPuzzle = async () => {
    setSelectedAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    await loadNewPuzzle();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-4xl font-black mb-2 title-rainbow flex items-center justify-center gap-3">
          <Puzzle className="h-10 w-10" />
          Meme Puzzle Challenge
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          Match the meme with the perfect caption!
        </p>
        
        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="text-lg py-2 px-4 sunshine-gradient text-white font-bold">
            Score: {score}
          </Badge>
          {streak > 0 && (
            <Badge variant="secondary" className="text-lg py-2 px-4 dopamine-gradient text-white font-bold">
              🔥 {streak} Streak!
            </Badge>
          )}
        </div>
      </div>

      {/* Puzzle Card */}
      <Card className="meme-card mb-6">
        <div className="p-6">
          {isLoading || !currentPuzzle ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg text-muted-foreground">Loading meme puzzle...</p>
            </div>
          ) : (
            <>
              {/* Meme Image */}
              <div className="w-full max-w-md mx-auto mb-6 overflow-hidden rounded-2xl bg-muted">
                <img
                  src={currentPuzzle.imageUrl}
                  alt={currentPuzzle.altText}
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Question */}
              <h3 className="text-2xl font-bold text-center mb-6">
                What's the perfect caption for this meme?
              </h3>

              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentPuzzle.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  !isAnswered 
                    ? "outline" 
                    : option === currentPuzzle.correctAnswer
                    ? "default"
                    : selectedAnswer === option
                    ? "destructive"
                    : "outline"
                }
                size="lg"
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered}
                className={`
                  text-left h-auto py-4 px-6 whitespace-normal text-wrap
                  ${!isAnswered ? 'hover:shadow-glow transition-all duration-300' : ''}
                  ${option === currentPuzzle.correctAnswer && isAnswered ? 'sunshine-gradient text-white' : ''}
                  ${selectedAnswer === option && !isCorrect && isAnswered ? 'bg-destructive text-destructive-foreground' : ''}
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex-1">{option}</span>
                  {isAnswered && (
                    <div className="ml-2">
                      {option === currentPuzzle.correctAnswer ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : selectedAnswer === option ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </Button>
                ))}
              </div>

              {/* Next Button */}
              {isAnswered && (
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={nextPuzzle}
                    disabled={isLoading}
                    className="ocean-gradient text-white font-bold text-lg py-6 px-8 shadow-fun hover:shadow-glow transition-all duration-300"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-6 w-6" />
                    )}
                    Next Puzzle
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MemePuzzle;