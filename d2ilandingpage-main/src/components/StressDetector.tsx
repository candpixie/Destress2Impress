import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Zap, TrendingUp } from 'lucide-react';

interface StressReading {
  heartRate: number;
  gsr: number;
  stressLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
}

interface StressDetectorProps {
  onStressDetected: (level: 'low' | 'medium' | 'high') => void;
}

export const StressDetector: React.FC<StressDetectorProps> = ({ onStressDetected }) => {
  const [currentReading, setCurrentReading] = useState<StressReading>({
    heartRate: 72,
    gsr: 0.5,
    stressLevel: 'low',
    timestamp: new Date()
  });

  const [isConnected, setIsConnected] = useState(false);

  // Mock biometric data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate realistic biometric fluctuations
      const baseHR = 70 + Math.sin(Date.now() / 10000) * 10;
      const noise = (Math.random() - 0.5) * 20;
      const heartRate = Math.round(Math.max(60, Math.min(120, baseHR + noise)));
      
      const gsr = Math.max(0.1, Math.min(2.0, 0.5 + Math.sin(Date.now() / 8000) * 0.3 + (Math.random() - 0.5) * 0.4));
      
      // Determine stress level based on HR and GSR
      let stressLevel: 'low' | 'medium' | 'high' = 'low';
      if (heartRate > 90 || gsr > 1.2) {
        stressLevel = 'high';
      } else if (heartRate > 80 || gsr > 0.8) {
        stressLevel = 'medium';
      }

      const newReading = {
        heartRate,
        gsr,
        stressLevel,
        timestamp: new Date()
      };

      setCurrentReading(newReading);
      onStressDetected(stressLevel);
    }, 2000);

    // Simulate connection after 1 second
    const connectionTimeout = setTimeout(() => setIsConnected(true), 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(connectionTimeout);
    };
  }, [onStressDetected]);

  const getStressColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success';
      case 'medium': return 'bg-stress-medium';
      case 'high': return 'bg-stress-high';
      default: return 'bg-muted';
    }
  };

  const getStressProgress = (level: string) => {
    switch (level) {
      case 'low': return 25;
      case 'medium': return 60;
      case 'high': return 90;
      default: return 0;
    }
  };

  return (
    <Card className="p-6 bg-gradient-glass backdrop-blur-sm border-border/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Biometric Monitor</h3>
          <Badge variant={isConnected ? "default" : "secondary"} className="animate-pulse">
            {isConnected ? "🟢 Connected" : "🔴 Connecting..."}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Heart Rate</span>
            </div>
            <div className="text-2xl font-bold">{currentReading.heartRate} <span className="text-sm font-normal">BPM</span></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">GSR</span>
            </div>
            <div className="text-2xl font-bold">{currentReading.gsr.toFixed(2)} <span className="text-sm font-normal">μS</span></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Stress Level</span>
            </div>
            <Badge className={`${getStressColor(currentReading.stressLevel)} text-white capitalize`}>
              {currentReading.stressLevel}
            </Badge>
          </div>
          <Progress 
            value={getStressProgress(currentReading.stressLevel)} 
            className="h-2"
          />
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Last updated: {currentReading.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};