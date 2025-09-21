import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUniqueRedditMeme } from "@/services/redditApi";
import { Shuffle, CheckCircle, RotateCcw, Clock, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MemeForPuzzle {
  id: string;
  imageUrl: string;
  caption: string;
  altText: string;
}

interface MemeImagePuzzleProps {
  onPointsEarned: (points: number) => void;
}

const MemeImagePuzzle = ({ onPointsEarned }: MemeImagePuzzleProps) => {
  const [currentMeme, setCurrentMeme] = useState<MemeForPuzzle | null>(null);
  const [puzzlePieces, setPuzzlePieces] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isShuffled, setIsShuffled] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const gridSize = 3; // 3x3 puzzle
  const totalPieces = gridSize * gridSize;

  // Load initial meme and initialize puzzle
  useEffect(() => {
    loadNewMeme();
  }, []);

  // Initialize puzzle pieces when meme changes
  useEffect(() => {
    if (currentMeme) {
      initializePuzzle();
    }
  }, [currentMeme]);

  const initializePuzzle = () => {
    const pieces = Array.from({ length: totalPieces }, (_, i) => i);
    // Automatically shuffle the pieces
    const shuffled = [...pieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setPuzzlePieces(shuffled);
    setIsComplete(false);
    setMoves(0);
    setStartTime(Date.now());
    setIsShuffled(true); // Start in shuffled state
  };

  const shufflePuzzle = () => {
    const shuffled = [...puzzlePieces];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setPuzzlePieces(shuffled);
    setIsShuffled(true);
    setIsComplete(false);
    setMoves(0);
    setStartTime(Date.now());
    
    toast({
      title: "Puzzle shuffled! 🧩",
      description: "Reassemble the meme pieces!",
    });
  };

  const canSwapPieces = (index1: number, index2: number): boolean => {
    const row1 = Math.floor(index1 / gridSize);
    const col1 = index1 % gridSize;
    const row2 = Math.floor(index2 / gridSize);
    const col2 = index2 % gridSize;
    
    // Adjacent pieces (horizontal or vertical)
    return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
           (Math.abs(col1 - col2) === 1 && row1 === row2);
  };

  const swapPieces = (index1: number, index2: number) => {
    if (!isShuffled) return;
    
    const newPieces = [...puzzlePieces];
    [newPieces[index1], newPieces[index2]] = [newPieces[index2], newPieces[index1]];
    
    setPuzzlePieces(newPieces);
    setMoves(prev => prev + 1);
    
    // Check if solved
    const isSolved = newPieces.every((piece, index) => piece === index);
    if (isSolved) {
      setIsComplete(true);
      const timeBonus = Math.max(0, 60 - Math.floor((Date.now() - startTime) / 1000));
      const moveBonus = Math.max(0, 30 - moves);
      const totalPoints = 50 + timeBonus + moveBonus;
      
      onPointsEarned(totalPoints);
      
      toast({
        title: "Puzzle Complete! 🎉",
        description: `+${totalPoints} points! (${moves + 1} moves, ${Math.floor((Date.now() - startTime) / 1000)}s)`,
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, currentIndex: number) => {
    if (!isShuffled) return;
    setDraggedPiece(currentIndex);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", currentIndex.toString());
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPiece !== null && draggedPiece !== targetIndex) {
      setDraggedOver(targetIndex);
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPiece !== null && draggedPiece !== targetIndex) {
      swapPieces(draggedPiece, targetIndex);
    }
    setDraggedPiece(null);
    setDraggedOver(null);
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setDraggedOver(null);
  };

  const loadNewMeme = async () => {
    setIsLoading(true);
    try {
      const meme = await getUniqueRedditMeme();
      if (meme) {
        const puzzleMeme: MemeForPuzzle = {
          id: meme.id,
          imageUrl: meme.imageUrl,
          caption: meme.caption,
          altText: meme.altText
        };
        setCurrentMeme(puzzleMeme);
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

  const newPuzzle = async () => {
    await loadNewMeme();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-4xl font-black mb-2 title-rainbow flex items-center justify-center gap-3">
          <Shuffle className="h-10 w-10" />
          Meme Jigsaw Puzzle
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          Drag and drop the meme pieces to reassemble the image!
        </p>
        
        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="secondary" className="text-lg py-2 px-4 sunshine-gradient text-white font-bold">
            <Clock className="mr-2 h-4 w-4" />
            Moves: {moves}
          </Badge>
          {isComplete && (
            <Badge variant="secondary" className="text-lg py-2 px-4 dopamine-gradient text-white font-bold">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete!
            </Badge>
          )}
        </div>
      </div>

      {/* Puzzle Container */}
      <Card className="meme-card mb-6">
        <div className="p-6">
          {isLoading || !currentMeme ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg text-muted-foreground">Loading meme puzzle...</p>
            </div>
          ) : (
            <>
              {/* Reference Image */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-center mb-4">Reference:</h3>
                <div className="w-48 mx-auto overflow-hidden rounded-lg border-2 border-muted bg-muted">
                  <img
                    src={currentMeme.imageUrl}
                    alt={currentMeme.altText}
                    className="w-full h-auto object-contain opacity-70"
                  />
                </div>
              </div>

              {/* Puzzle Grid */}
              <div className="w-full max-w-md mx-auto mb-6">
                <div 
                  className="grid gap-1 w-full"
                  style={{ 
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    aspectRatio: '1 / 1'
                  }}
                >
              {puzzlePieces.map((pieceId, currentIndex) => (
                <div
                  key={currentIndex}
                  draggable={isShuffled}
                  onDragStart={(e) => handleDragStart(e, currentIndex)}
                  onDragOver={(e) => handleDragOver(e, currentIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, currentIndex)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative overflow-hidden rounded cursor-move transition-all duration-200 select-none
                    ${isShuffled ? 'hover:scale-105 hover:z-10' : 'cursor-default'}
                    ${isComplete ? 'ring-2 ring-green-500' : ''}
                    ${draggedPiece === currentIndex ? 'opacity-50 scale-95 rotate-2' : ''}
                    ${draggedOver === currentIndex ? 'ring-2 ring-blue-400 scale-105' : ''}
                    ${!isShuffled ? 'pointer-events-none' : ''}
                  `}
                  style={{
                    backgroundImage: `url(${currentMeme.imageUrl})`,
                    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                    backgroundPosition: `${(pieceId % gridSize) * 100 / (gridSize - 1)}% ${Math.floor(pieceId / gridSize) * 100 / (gridSize - 1)}%`,
                  }}
                >
                  {/* Piece number overlay for debugging */}
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-xs rounded px-1 pointer-events-none">
                    {pieceId + 1}
                  </div>
                  
                  {/* Drag indicator */}
                  {isShuffled && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/20 transition-opacity pointer-events-none">
                      <div className="text-white text-xs font-bold">DRAG</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  onClick={shufflePuzzle}
                  disabled={isLoading}
                  className="ocean-gradient text-white font-bold text-lg py-6 px-8 shadow-fun hover:shadow-glow transition-all duration-300"
                >
                  <Shuffle className="mr-2 h-6 w-6" />
                  Shuffle Again
                </Button>
                
                <Button
                  size="lg"
                  onClick={newPuzzle}
                  disabled={isLoading}
                  variant="secondary"
                  className="dopamine-gradient text-white font-bold text-lg py-6 px-8 shadow-fun hover:shadow-glow transition-all duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-6 w-6" />
                  )}
                  New Meme
                </Button>
              </div>

              {/* Meme Caption */}
              <div className="mt-6 text-center">
                <p className="text-lg font-semibold text-muted-foreground">
                  "{currentMeme.caption}"
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MemeImagePuzzle;