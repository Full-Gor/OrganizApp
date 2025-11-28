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
  angle: number;
  distance: number;
}

export default function DissolveTimer({ theme, className }: DissolveTimerProps) {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isChanging, setIsChanging] = useState(false);
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      angle: Math.random() * Math.PI * 2,
      distance: 40 + Math.random() * 60,
    }))
  );
  const prevTimeRef = useRef({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const newTime = {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      };

      const prev = prevTimeRef.current;
      if (prev.hours !== newTime.hours || prev.minutes !== newTime.minutes || prev.seconds !== newTime.seconds) {
        setIsChanging(true);
        setTimeout(() => setIsChanging(false), theme === 'dissolve' ? 700 : 600);
      }

      prevTimeRef.current = newTime;
      setTime(newTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [theme]);

  const formatTime = (h: number, m: number, s: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (theme === 'dissolve') {
    return (
      <div
        className={cn(
          'relative rounded-[20px] overflow-hidden border',
          className
        )}
        style={{
          background: 'linear-gradient(145deg, #1a1510, #0f0d0a)',
          borderColor: 'rgba(255, 215, 0, 0.2)',
          padding: '40px',
        }}
      >
        {/* Top border glow */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
          }}
        />

        {/* Display */}
        <div className="relative flex justify-center items-center" style={{ padding: '40px 20px', minHeight: '120px' }}>
          {/* Time Display */}
          <div
            className="relative text-center transition-all"
            style={{
              fontFamily: 'var(--font-orbitron), Orbitron, monospace',
              fontSize: '4.5rem',
              fontWeight: 900,
              color: '#ffd700',
              opacity: isChanging ? 0 : 1,
              transform: isChanging ? 'scale(0.85)' : 'scale(1)',
              transitionDuration: '0.35s',
              letterSpacing: '0.1em',
            }}
          >
            {formatTime(time.hours, time.minutes, time.seconds)}
          </div>

          {/* Particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '5px',
                height: '5px',
                background: '#ffd700',
                boxShadow: '0 0 8px #ffd700, 0 0 12px #ffd700',
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: isChanging ? 1 : 0,
                transform: isChanging
                  ? `translate(${Math.cos(particle.angle) * particle.distance}px, ${Math.sin(particle.angle) * particle.distance}px) scale(1.2)`
                  : 'translate(0, 0) scale(0.5)',
                transition: isChanging
                  ? 'all 0.5s ease-out'
                  : 'all 0.35s ease-in 0.35s',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fluid theme
  return (
    <div
      className={cn(
        'relative rounded-[20px] overflow-hidden border',
        className
      )}
      style={{
        background: 'linear-gradient(145deg, #0a1520, #051015)',
        borderColor: 'rgba(0, 245, 255, 0.2)',
        padding: '40px',
      }}
    >
      {/* Top border glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.3), transparent)',
        }}
      />

      {/* Animated glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.25), transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'fluidGlow 4s ease-in-out infinite',
        }}
      />

      {/* Display */}
      <div className="relative z-10 flex justify-center items-center overflow-hidden" style={{ padding: '40px 20px', minHeight: '120px' }}>
        <div
          className="relative text-center"
          style={{
            fontFamily: 'var(--font-bebas-neue), Bebas Neue, sans-serif',
            fontSize: '5rem',
            color: '#00f5ff',
            textShadow: '0 0 15px #00f5ff, 0 0 35px #00f5ff, 0 0 55px rgba(0, 245, 255, 0.6)',
            letterSpacing: '0.08em',
            transform: isChanging ? 'translateY(-120%) scale(0.85)' : 'translateY(0) scale(1)',
            opacity: isChanging ? 0 : 1,
            filter: isChanging ? 'blur(8px)' : 'blur(0)',
            transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {formatTime(time.hours, time.minutes, time.seconds)}
        </div>
      </div>
    </div>
  );
}
