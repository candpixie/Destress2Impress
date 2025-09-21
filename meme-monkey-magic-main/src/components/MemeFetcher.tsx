import { useEffect, useState } from "react";

// Comprehensive content filtering for teen-friendly, educational content
const BLOCKED_KEYWORDS = [
  // Political content
  'trump', 'biden', 'election', 'democrat', 'republican', 'politics', 'political',
  'congress', 'senate', 'president', 'vote', 'voting', 'campaign', 'liberal', 
  'conservative', 'left wing', 'right wing', 'antifa', 'maga', 'gop',
  'ukraine', 'russia', 'putin', 'war', 'israel', 'palestine', 'gaza',
  
  // Inappropriate/negative content
  'nsfw', 'adult', 'mature', 'explicit', 'inappropriate', 'offensive',
  'violence', 'violent', 'kill', 'death', 'dead', 'murder', 'suicide',
  'hate', 'racist', 'racism', 'sexist', 'discrimination', 'bullying',
  'drugs', 'alcohol', 'smoking', 'drunk', 'high', 'weed', 'marijuana',
  'sex', 'sexual', 'porn', 'nude', 'naked', 'xxx', 'adult content',
  'depression', 'anxiety', 'mental health crisis', 'self harm',
  'curse', 'swear', 'profanity', 'f*ck', 'sh*t', 'damn', 'hell',
  'toxic', 'cringe', 'stupid', 'idiot', 'loser', 'failure',
  'covid', 'pandemic', 'disease', 'illness', 'sick', 'hospital'
];

const BLOCKED_SUBREDDITS = [
  'politicalhumor', 'politicalmemes', 'conservativememes', 'libertarianmeme',
  'therightcantmeme', 'theleftcantmeme', 'politicalcompass',
  'dankmemes', 'edgymemes', 'offensivememes', 'darkhumor', 'imgoingtohellforthis',
  'teenagers', 'relationshipmemes', 'adulthumor', 'nsfw', 'nsfw_memes'
];

// Positive keywords to prioritize educational and uplifting content
const POSITIVE_KEYWORDS = [
  'education', 'learning', 'study', 'school', 'science', 'math', 'history',
  'reading', 'books', 'knowledge', 'discovery', 'facts', 'interesting',
  'motivational', 'inspiring', 'positive', 'wholesome', 'uplifting',
  'achievement', 'success', 'progress', 'growth', 'improvement',
  'friendship', 'kindness', 'helping', 'support', 'encouraging',
  'creative', 'art', 'music', 'coding', 'programming', 'technology',
  'innovation', 'future', 'dream', 'goal', 'aspiration'
];

const EDUCATIONAL_SUBREDDITS = [
  'wholesomememes', 'educationalmemes', 'sciencememes', 'mathmemes',
  'historymemes', 'programminghumor', 'chemistrymemes', 'physicsmemes',
  'biologymemes', 'getmotivated', 'learningmemes', 'booksmemes'
];

const isContentAppropriate = (title: string, subreddit?: string): boolean => {
  const titleLower = title.toLowerCase();
  const subredditLower = subreddit?.toLowerCase() || '';
  
  // Check for blocked subreddits
  if (BLOCKED_SUBREDDITS.some(blocked => subredditLower.includes(blocked))) {
    return false;
  }
  
  // Check for blocked keywords in title
  if (BLOCKED_KEYWORDS.some(keyword => titleLower.includes(keyword))) {
    return false;
  }
  
  // Prioritize content with positive keywords (educational/wholesome)
  const hasPositiveContent = POSITIVE_KEYWORDS.some(keyword => 
    titleLower.includes(keyword) || subredditLower.includes(keyword)
  );
  
  // Accept educational subreddits even without positive keywords
  const isEducationalSubreddit = EDUCATIONAL_SUBREDDITS.some(educational => 
    subredditLower.includes(educational.toLowerCase())
  );
  
  return hasPositiveContent || isEducationalSubreddit || titleLower.includes('wholesome');
};

interface Meme {
  title: string;
  url: string;
  source?: string;
}

export default function MemeFetcher() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [currentMeme, setCurrentMeme] = useState<Meme | null>(null);

  useEffect(() => {
    // Use CORS-enabled meme API instead of Reddit
    fetch("https://meme-api.com/gimme/20")
      .then((res) => res.json())
      .then((data) => {
        const memeArray = Array.isArray(data.memes) ? data.memes : [data];
        const posts = memeArray
          .filter((meme: any) => 
            meme && 
            meme.url && 
            !meme.nsfw &&
            !meme.spoiler &&
            isContentAppropriate(meme.title, meme.subreddit) &&
            meme.url.match(/\.(jpeg|jpg|png|gif)$/i)
          )
          .map((meme: any) => ({
            title: meme.title || 'Meme',
            url: meme.url,
            source: meme.postLink,
          }));
        setMemes(posts);
        if (posts.length > 0) {
          setCurrentMeme(posts[0]);
        }
      })
      .catch((err) => console.error("Error fetching memes:", err));
  }, []);

  const getNextMeme = () => {
    if (memes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * memes.length);
    setCurrentMeme(memes[randomIndex]);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold">MeMemeMer 🐒</h2>
      {currentMeme && (
        <div className="p-4 bg-white rounded-lg shadow-md max-w-md">
          <div className="w-full bg-muted rounded overflow-hidden">
            <img
              src={currentMeme.url}
              alt={currentMeme.title}
              className="w-full h-auto object-contain"
            />
          </div>
          <p className="mt-2 text-center text-sm">{currentMeme.title}</p>
          {currentMeme.source && (
            <div className="mt-2 text-center">
              <a 
                href={currentMeme.source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View Reddit Post
              </a>
            </div>
          )}
        </div>
      )}
      <button
        onClick={getNextMeme}
        className="px-4 py-2 mt-4 text-white bg-pink-500 rounded hover:bg-pink-600"
      >
        Generate Meme
      </button>
    </div>
  );
}