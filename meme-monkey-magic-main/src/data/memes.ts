import meme1 from "@/assets/meme1.jpg";
import meme2 from "@/assets/meme2.jpg";
import meme3 from "@/assets/meme3.jpg";
import meme4 from "@/assets/meme4.jpg";
import meme5 from "@/assets/meme5.jpg";

export interface Meme {
  id: string;
  imageUrl: string;
  caption: string;
  altText: string;
}

export interface PuzzleMeme extends Meme {
  options: string[];
  correctAnswer: string;
}

export const staticMemes: Meme[] = [
  {
    id: "1",
    imageUrl: meme1,
    caption: "When you realize it's Friday and you survived another week! 🎉",
    altText: "Cat wearing sunglasses meme"
  },
  {
    id: "2", 
    imageUrl: meme2,
    caption: "Me trying to adult vs. me wanting to nap all day 😴",
    altText: "Success kid meme"
  },
  {
    id: "3",
    imageUrl: meme3,
    caption: "That feeling when your code works on the first try ✨",
    altText: "Drake pointing meme"
  },
  {
    id: "4",
    imageUrl: meme4,
    caption: "Monday motivation: You got this! Even if 'this' is just getting out of bed 💪",
    altText: "Distracted boyfriend meme"
  },
  {
    id: "5",
    imageUrl: meme5,
    caption: "POV: You're procrastinating but making it look productive 📚",
    altText: "Surprised Pikachu meme"
  }
];

export const puzzleMemes: PuzzleMeme[] = [
  {
    id: "p1",
    imageUrl: meme1,
    caption: "When you realize it's Friday and you survived another week! 🎉",
    altText: "Cat wearing sunglasses meme",
    options: [
      "When you realize it's Friday and you survived another week! 🎉",
      "Me pretending to listen in meetings 😎",
      "That face when you find money in old pants 💰",
      "When someone says pineapple belongs on pizza 🍕"
    ],
    correctAnswer: "When you realize it's Friday and you survived another week! 🎉"
  },
  {
    id: "p2",
    imageUrl: meme2,
    caption: "Me trying to adult vs. me wanting to nap all day 😴",
    altText: "Success kid meme",
    options: [
      "When I finally fix that bug on the first try! 🎯",
      "Me trying to adult vs. me wanting to nap all day 😴", 
      "That moment when you remember you have snacks 🍪",
      "Successfully avoiding Monday morning meetings ☕"
    ],
    correctAnswer: "Me trying to adult vs. me wanting to nap all day 😴"
  },
  {
    id: "p3",
    imageUrl: meme3,
    caption: "That feeling when your code works on the first try ✨",
    altText: "Drake pointing meme",
    options: [
      "Staying up late scrolling social media 📱",
      "That feeling when your code works on the first try ✨",
      "Me choosing Netflix over productivity 📺",
      "When someone explains crypto to me 🤔"
    ],
    correctAnswer: "That feeling when your code works on the first try ✨"
  },
  {
    id: "p4",
    imageUrl: meme4,
    caption: "Monday motivation: You got this! Even if 'this' is just getting out of bed 💪",
    altText: "Distracted boyfriend meme",
    options: [
      "Me looking at weekend plans vs. responsibilities 📅",
      "When I see a new meme format trending 📈",
      "Monday motivation: You got this! Even if 'this' is just getting out of bed 💪",
      "Trying to focus but distracted by everything 🎯"
    ],
    correctAnswer: "Monday motivation: You got this! Even if 'this' is just getting out of bed 💪"
  },
  {
    id: "p5",
    imageUrl: meme5,
    caption: "POV: You're procrastinating but making it look productive 📚",
    altText: "Surprised Pikachu meme",
    options: [
      "When someone spoils the ending of my show 😱",
      "POV: You're procrastinating but making it look productive 📚",
      "That face when you check your bank account 💸",
      "Me realizing I have to wake up early tomorrow ⏰"
    ],
    correctAnswer: "POV: You're procrastinating but making it look productive 📚"
  }
];

let usedStaticMemeIds = new Set<string>();

export const getRandomMeme = (): Meme => {
  // Filter out used memes
  const availableMemes = staticMemes.filter(meme => !usedStaticMemeIds.has(meme.id));
  
  // If all memes have been used, reset the tracker
  if (availableMemes.length === 0) {
    usedStaticMemeIds.clear();
    usedStaticMemeIds.add(staticMemes[0].id);
    return staticMemes[0];
  }
  
  const randomIndex = Math.floor(Math.random() * availableMemes.length);
  const selectedMeme = availableMemes[randomIndex];
  
  // Mark as used
  usedStaticMemeIds.add(selectedMeme.id);
  
  return selectedMeme;
};

export const resetUsedStaticMemes = () => {
  usedStaticMemeIds.clear();
};