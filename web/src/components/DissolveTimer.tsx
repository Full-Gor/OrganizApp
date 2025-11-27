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
  const [time, setTime] = useState({ h0: '0', h1: '0', m0: '0', m1: '0', s0: '0', s1: '0' });
  const prevTimeRef = useRef({ h0: '0', h1: '0', m0: '0', m1: '0', s0: '0', s1: '0' });
  const [changingDigits, setChangingDigits] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');

      const newTime = {
        h0: h[0], h1: h[1],
        m0: m[0], m1: m[1],
        s0: s[0], s1: s[1],
      };

      // Detect changes
      const changed = new Set<string>();
      Object.keys(newTime).forEach(key => {
        if (prevTimeRef.current[key as keyof typeof newTime] !== newTime[key as keyof typeof newTime]) {
          changed.add(key);
        }
      });

      if (changed.size > 0) {
        setChangingDigits(changed);
        setTimeout(() => setChangingDigits(new Set()), theme === 'dissolve' ? 700 : 600);
      }

      prevTimeRef.current = newTime;
      setTime(newTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [theme]);

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
        <div className="flex justify-center items-center gap-2" style={{ padding: '40px 20px' }}>
          {(['h0', 'h1'] as const).map((key, i) => (
            <DissolveDigit key={key} value={time[key]} isChanging={changingDigits.has(key)} isFirst={i === 0} />
          ))}
          <DissolveColon />
          {(['m0', 'm1'] as const).map((key, i) => (
            <DissolveDigit key={key} value={time[key]} isChanging={changingDigits.has(key)} isFirst={i === 0} />
          ))}
          <DissolveColon />
          {(['s0', 's1'] as const).map((key, i) => (
            <DissolveDigit key={key} value={time[key]} isChanging={changingDigits.has(key)} isFirst={i === 0} />
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
        className="absolute w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.2), transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'fluidGlow 4s ease-in-out infinite',
        }}
      />

      {/* Display */}
      <div className="relative z-10 flex justify-center items-center gap-[10px]" style={{ padding: '40px 20px' }}>
        {(['h0', 'h1'] as const).map((key) => (
          <FluidDigit key={key} value={time[key]} prevValue={prevTimeRef.current[key]} isChanging={changingDigits.has(key)} />
        ))}
        <FluidColon />
        {(['m0', 'm1'] as const).map((key) => (
          <FluidDigit key={key} value={time[key]} prevValue={prevTimeRef.current[key]} isChanging={changingDigits.has(key)} />
        ))}
        <FluidColon />
        {(['s0', 's1'] as const).map((key) => (
          <FluidDigit key={key} value={time[key]} prevValue={prevTimeRef.current[key]} isChanging={changingDigits.has(key)} />
        ))}
        <FluidColon small />
        {(['ms0', 'ms1', 'ms2'] as const).map((key) => (
          <FluidDigit key={key} value={time[key]} prevValue={prevTimeRef.current[key]} isChanging={changingDigits.has(key)} isMs />
        ))}
      </div>

      <style jsx>{`
        @keyframes fluidGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// Dissolve Digit Component
function DissolveDigit({ value, isChanging, isMs, isFirst }: { value: string; isChanging: boolean; isMs?: boolean; isFirst?: boolean }) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: isMs ? 12 : 20 }, (_, i) => ({
      id: i,
      x: Math.random() * (isMs ? 38 : 55),
      y: Math.random() * (isMs ? 60 : 85),
      angle: Math.random() * Math.PI * 2,
      distance: 30 + Math.random() * 40,
    }))
  );

  return (
    <div
      className="relative"
      style={{
        width: isMs ? '38px' : '55px',
        height: isMs ? '60px' : '85px',
      }}
    >
      {/* Digit */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-all"
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: isMs ? '2.2rem' : '3.5rem',
          fontWeight: 900,
          color: '#ffd700',
          opacity: isChanging && !isMs ? 0 : 1,
          transform: isChanging && !isMs ? 'scale(0.8)' : 'scale(1)',
          transitionDuration: isMs ? '0.05s' : '0.3s',
        }}
      >
        {value}
      </div>

      {/* Particles */}
      {!isMs && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: '#ffd700',
            boxShadow: '0 0 6px #ffd700',
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            opacity: isChanging ? 1 : 0,
            transform: isChanging
              ? `translate(${Math.cos(particle.angle) * particle.distance}px, ${Math.sin(particle.angle) * particle.distance}px)`
              : 'translate(0, 0)',
            transition: isChanging
              ? 'all 0.4s ease-out'
              : 'all 0.3s ease-in 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// Dissolve Colon Component
function DissolveColon({ small }: { small?: boolean }) {
  return (
    <div className="flex flex-col" style={{ gap: small ? '0' : '25px' }}>
      <div
        className="rounded-full"
        style={{
          width: small ? '6px' : '8px',
          height: small ? '6px' : '8px',
          background: '#ffd700',
          boxShadow: '0 0 10px #ffd700',
          animation: 'dissolvePulse 1s infinite',
        }}
      />
      {!small && (
        <div
          className="rounded-full"
          style={{
            width: '8px',
            height: '8px',
            background: '#ffd700',
            boxShadow: '0 0 10px #ffd700',
            animation: 'dissolvePulse 1s infinite',
          }}
        />
      )}
      <style jsx>{`
        @keyframes dissolvePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.6); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Fluid Digit Component
function FluidDigit({ value, prevValue, isChanging, isMs }: { value: string; prevValue: string; isChanging: boolean; isMs?: boolean }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (isChanging && !isMs) {
      setIsExiting(true);

      setTimeout(() => {
        setDisplayValue(value);
        setIsExiting(false);
        setIsEntering(true);

        requestAnimationFrame(() => {
          setIsEntering(false);
        });
      }, 300);
    } else {
      setDisplayValue(value);
    }
  }, [value, isChanging, isMs]);

  return (
    <div
      className="relative overflow-hidden rounded-lg border"
      style={{
        width: isMs ? '40px' : '60px',
        height: isMs ? '60px' : '90px',
        background: 'rgba(0, 245, 255, 0.05)',
        borderColor: 'rgba(0, 245, 255, 0.1)',
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: isMs ? '2.5rem' : '4rem',
          color: '#00f5ff',
          textShadow: '0 0 10px #00f5ff, 0 0 30px #00f5ff, 0 0 50px rgba(0, 245, 255, 0.5)',
          transform: isExiting ? 'translateY(-100%) scale(0.8)' : isEntering ? 'translateY(100%) scale(0.8)' : 'translateY(0) scale(1)',
          opacity: isExiting || isEntering ? 0 : 1,
          filter: isExiting || isEntering ? 'blur(5px)' : 'blur(0)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {displayValue}
      </div>
    </div>
  );
}

// Fluid Colon Component
function FluidColon({ small }: { small?: boolean }) {
  return (
    <span
      style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: small ? '2rem' : '4rem',
        color: '#00f5ff',
        textShadow: '0 0 20px #00f5ff',
        animation: 'fluidPulse 2s ease-in-out infinite',
      }}
    >
      {small ? '.' : ':'}
      <style jsx>{`
        @keyframes fluidPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
      `}</style>
    </span>
  );
}
