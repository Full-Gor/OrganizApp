'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DissolveTimerProps {
  theme: 'dissolve' | 'fluid';
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

export default function DissolveTimer({ theme, className }: DissolveTimerProps) {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [particles, setParticles] = useState<{ [key: string]: Particle[] }>({});
  const prevTimeRef = useRef({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const newTime = {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      };

      // Detect digit changes for dissolve effect
      if (theme === 'dissolve') {
        const prev = prevTimeRef.current;
        const changed: string[] = [];

        if (prev.hours !== newTime.hours) changed.push('hours');
        if (prev.minutes !== newTime.minutes) changed.push('minutes');
        if (prev.seconds !== newTime.seconds) changed.push('seconds');

        if (changed.length > 0) {
          const newParticles: { [key: string]: Particle[] } = {};
          changed.forEach(key => {
            newParticles[key] = Array.from({ length: 20 }, (_, i) => ({
              id: Date.now() + i,
              x: (Math.random() - 0.5) * 100,
              y: (Math.random() - 0.5) * 100,
              opacity: 1,
            }));
          });
          setParticles(newParticles);

          // Clear particles after animation
          setTimeout(() => setParticles({}), 600);
        }
      }

      prevTimeRef.current = newTime;
      setTime(newTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [theme]);

  const formatDigit = (num: number, digits: number = 2) => {
    return num.toString().padStart(digits, '0');
  };

  const renderDissolveDigit = (value: string, key: string) => {
    const hasParticles = particles[key] && particles[key].length > 0;

    return (
      <div className="relative inline-block">
        <span
          className={cn(
            'transition-opacity duration-300',
            hasParticles ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)',
          }}
        >
          {value}
        </span>
        {hasParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {particles[key].map((particle) => (
              <span
                key={particle.id}
                className="absolute top-1/2 left-1/2 text-[#ffd700] animate-dissolve-particle"
                style={{
                  transform: `translate(-50%, -50%) translate(${particle.x}px, ${particle.y}px)`,
                  opacity: 0,
                  animation: 'dissolve-particle 0.6s ease-out forwards',
                }}
              >
                •
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFluidDigit = (value: string, prevValue: string) => {
    return (
      <div className="relative inline-block overflow-hidden h-full">
        <span
          className="block transition-all duration-500 ease-out"
          style={{
            textShadow:
              '0 0 10px rgba(0, 245, 255, 0.8), 0 0 20px rgba(0, 245, 255, 0.6), 0 0 30px rgba(255, 0, 255, 0.4)',
            transform: value !== prevValue ? 'translateY(-100%)' : 'translateY(0)',
            opacity: value !== prevValue ? 0 : 1,
          }}
        >
          {value}
        </span>
      </div>
    );
  };

  if (theme === 'dissolve') {
    return (
      <div
        className={cn(
          'relative px-8 py-6 rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-[#2a1810] via-[#1a0f08] to-black',
          'border-2 border-[#ffd700]/30',
          className
        )}
      >
        {/* Animated glow orb */}
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #ffd700 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        <div className="relative z-10 font-mono text-5xl font-bold tracking-wider text-[#ffd700] flex items-center justify-center gap-1">
          {renderDissolveDigit(formatDigit(time.hours), 'hours')}
          <span className="animate-pulse">:</span>
          {renderDissolveDigit(formatDigit(time.minutes), 'minutes')}
          <span className="animate-pulse">:</span>
          {renderDissolveDigit(formatDigit(time.seconds), 'seconds')}
        </div>

        <style jsx>{`
          @keyframes dissolve-particle {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) translate(0, 0) scale(1);
            }
            50% {
              opacity: 0.5;
              transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0.5);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) translate(0, 0) scale(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Fluid theme
  return (
    <div
      className={cn(
        'relative px-8 py-6 rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-[#0a192f] via-[#0f2942] to-[#1a3a52]',
        'border-2 border-[#00f5ff]/40',
        className
      )}
    >
      {/* Animated glow orb */}
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, #00f5ff 0%, #ff00ff 50%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 font-mono text-5xl font-bold tracking-wider text-[#00f5ff] flex items-center justify-center gap-1">
        {renderFluidDigit(
          formatDigit(time.hours),
          formatDigit(prevTimeRef.current.hours)
        )}
        <span className="animate-pulse text-[#ff00ff]">:</span>
        {renderFluidDigit(
          formatDigit(time.minutes),
          formatDigit(prevTimeRef.current.minutes)
        )}
        <span className="animate-pulse text-[#ff00ff]">:</span>
        {renderFluidDigit(
          formatDigit(time.seconds),
          formatDigit(prevTimeRef.current.seconds)
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
