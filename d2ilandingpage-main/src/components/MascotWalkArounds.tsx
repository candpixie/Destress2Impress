import React, { useState } from 'react';

const MascotWalkArounds = () => {
  const [monkeyVersion, setMonkeyVersion] = useState(0);
  const [dragonVersion, setDragonVersion] = useState(0);
  const [koalaVersion, setKoalaVersion] = useState(0);
  const [elephantVersion, setElephantVersion] = useState(0);

  const monkeyVersions = ['🐒', '🙈', '🙉', '🙊', '🦍'];
  const dragonVersions = ['🐉', '🐲', '🦕', '🔥', '✨'];
  const koalaVersions = ['🐨', '🐻', '🧸', '🍃', '💤'];
  const elephantVersions = ['🐘', '🦣', '🎪', '💎', '🌊'];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Monkey - walks left to right at top */}
      <div className="absolute top-8 left-0 animate-[walk-right_8s_linear_infinite]">
        <div 
          className="text-4xl transform hover:scale-110 transition-transform animate-bounce cursor-pointer pointer-events-auto"
          onClick={() => setMonkeyVersion((prev) => (prev + 1) % monkeyVersions.length)}
        >
          {monkeyVersions[monkeyVersion]}
        </div>
      </div>
      
      {/* Dragon - flies right to left at middle */}
      <div className="absolute top-1/3 right-0 animate-[walk-left_12s_linear_infinite]">
        <div 
          className="text-4xl transform hover:scale-110 transition-transform animate-pulse cursor-pointer pointer-events-auto"
          onClick={() => setDragonVersion((prev) => (prev + 1) % dragonVersions.length)}
        >
          {dragonVersions[dragonVersion]}
        </div>
      </div>
      
      {/* Koala - walks left to right at bottom */}
      <div className="absolute bottom-40 left-0 animate-[walk-right_10s_linear_infinite] animation-delay-[2s]">
        <div 
          className="text-4xl transform hover:scale-110 transition-transform animate-[gentle-sway_3s_ease-in-out_infinite] cursor-pointer pointer-events-auto"
          onClick={() => setKoalaVersion((prev) => (prev + 1) % koalaVersions.length)}
        >
          {koalaVersions[koalaVersion]}
        </div>
      </div>
      
      {/* Elephant - walks right to left at middle-bottom */}
      <div className="absolute bottom-56 right-0 animate-[walk-left_14s_linear_infinite] animation-delay-[4s]">
        <div 
          className="text-4xl transform hover:scale-110 transition-transform animate-[trunk-wave_4s_ease-in-out_infinite] cursor-pointer pointer-events-auto"
          onClick={() => setElephantVersion((prev) => (prev + 1) % elephantVersions.length)}
        >
          {elephantVersions[elephantVersion]}
        </div>
      </div>
      
      {/* Extra floating mascots for more life */}
      <div className="absolute top-1/2 left-1/4 animate-[float_6s_ease-in-out_infinite] animation-delay-[1s]">
        <div className="text-2xl opacity-60 animate-spin-slow">
          🎮
        </div>
      </div>
      
      <div className="absolute top-1/4 right-1/4 animate-[float_8s_ease-in-out_infinite] animation-delay-[3s]">
        <div className="text-2xl opacity-60 animate-[gentle-sway_5s_ease-in-out_infinite]">
          ⚡
        </div>
      </div>
    </div>
  );
};

export default MascotWalkArounds;