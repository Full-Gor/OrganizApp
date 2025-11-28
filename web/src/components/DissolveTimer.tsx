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
        className={cn('relative rounded-lg overflow-hidden border', className)}
        style={{
          background: 'linear-gradient(145deg, #1a1510, #0f0d0a)',
          borderColor: 'rgba(255, 215, 0, 0.2)',
          padding: '12px 16px',
        }}
      >
        {/* Display */}
        <div className="flex justify-center items-center gap-1">
          {(['h0', 'h1'] as const).map((key) => (
            <DissolveDigit key={key} value={time[key]} isChanging={changingDigits.has(key)} />
          ))}
          <DissolveColon />
          {(['m0', 'm1'] as const).map((key) => (
            <DissolveDigit key={key} value={time[key]} isChanging={changingDigits.has(key)} />
          ))}
          <DissolveColon />
          {(['s0', 's1'] as const).map((key) => (
            <DissolveDigit key={key} value={time[key]} isChanging={changingDigits.has(key)} />
          ))}
        </div>
      </div>
    );
  }

  // Fluid theme
  return (
    <div
      className={cn('relative rounded-lg overflow-hidden border', className)}
      style={{
        background: 'linear-gradient(145deg, #0a1520, #051015)',
        borderColor: 'rgba(0, 245, 255, 0.2)',
        padding: '12px 16px',
      }}
    >
      {/* Animated glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.2), transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'fluidGlow 4s ease-in-out infinite',
        }}
      />

      {/* Display */}
      <div className="relative z-10 flex justify-center items-center gap-1">
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
      </div>
    </div>
  );
}

// Dissolve Digit Component
function DissolveDigit({ value, isChanging }: { value: string; isChanging: boolean }) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 35,
      y: Math.random() * 50,
      angle: Math.random() * Math.PI * 2,
      distance: 30 + Math.random() * 40,
    }))
  );

  return (
    <div className="relative" style={{ width: '35px', height: '50px' }}>
      {/* Digit */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-all"
        style={{
          fontFamily: 'var(--font-orbitron), Orbitron, monospace',
          fontSize: '2rem',
          fontWeight: 900,
          color: '#ffd700',
          opacity: isChanging ? 0 : 1,
          transform: isChanging ? 'scale(0.8)' : 'scale(1)',
          transitionDuration: '0.3s',
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
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
function DissolveColon() {
  return (
    <div className="flex flex-col justify-center" style={{ gap: '8px', height: '50px' }}>
      <div
        className="rounded-full"
        style={{
          width: '4px',
          height: '4px',
          background: '#ffd700',
          boxShadow: '0 0 6px #ffd700',
        }}
      />
      <div
        className="rounded-full"
        style={{
          width: '4px',
          height: '4px',
          background: '#ffd700',
          boxShadow: '0 0 6px #ffd700',
        }}
      />
    </div>
  );
}

// Fluid Digit Component
function FluidDigit({ value, prevValue, isChanging }: { value: string; prevValue: string; isChanging: boolean }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (isChanging) {
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
  }, [value, isChanging]);

  return (
    <div
      className="relative overflow-hidden rounded border"
      style={{
        width: '38px',
        height: '50px',
        background: 'rgba(0, 245, 255, 0.05)',
        borderColor: 'rgba(0, 245, 255, 0.1)',
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-bebas-neue), Bebas Neue, sans-serif',
          fontSize: '2.5rem',
          color: '#00f5ff',
          textShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff',
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
function FluidColon() {
  return (
    <span
      style={{
        fontFamily: 'var(--font-bebas-neue), Bebas Neue, sans-serif',
        fontSize: '2rem',
        color: '#00f5ff',
        textShadow: '0 0 10px #00f5ff',
        lineHeight: '50px',
      }}
    >
      :
    </span>
  );
}
