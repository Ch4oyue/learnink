import React, { useEffect, useState } from 'react';

export const Background: React.FC = () => {
  const [colors, setColors] = useState({
    orb1: 'bg-purple-600',
    orb2: 'bg-blue-600',
    orb3: 'bg-pink-500',
    orb4: 'bg-teal-500',
    bg: 'bg-[#050505]'
  });

  // Mouse position state for parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // 1. Time-of-day color logic
    const updateColors = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        // Morning: High saturation for liquid effect (Warm)
        setColors({
          orb1: 'bg-orange-500',
          orb2: 'bg-yellow-500',
          orb3: 'bg-rose-500',
          orb4: 'bg-amber-500',
          bg: 'bg-[#1a1010]'
        });
      } else if (hour >= 12 && hour < 18) {
        // Afternoon (Cool/Bright)
        setColors({
          orb1: 'bg-sky-500',
          orb2: 'bg-blue-500',
          orb3: 'bg-cyan-400',
          orb4: 'bg-indigo-400',
          bg: 'bg-[#0f1115]'
        });
      } else {
        // Night: Deep neon
        setColors({
          orb1: 'bg-violet-600',
          orb2: 'bg-indigo-600',
          orb3: 'bg-fuchsia-600',
          orb4: 'bg-cyan-600',
          bg: 'bg-[#020202]'
        });
      }
    };

    updateColors();
    const colorInterval = setInterval(updateColors, 60000);

    // 2. Mouse Interaction logic
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize coordinates to -1 to 1 range
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(colorInterval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[-1] overflow-hidden ${colors.bg} transition-colors duration-[5000ms]`}>
      {/* 
         Liquid Gradients Background 
         We apply a translation based on mousePos to create a parallax effect.
         Each orb moves at a slightly different "speed" (multiplier) to create depth.
      */}
      
      {/* Orb 1: Top Left - Moves opposite to mouse */}
      <div 
        className={`absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen opacity-40 blur-[120px] animate-float transition-colors duration-[5000ms] ${colors.orb1}`}
        style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }} 
      />
      
      {/* Orb 2: Bottom Right - Moves with mouse */}
      <div 
        className={`absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen opacity-30 blur-[100px] animate-float-delayed transition-colors duration-[5000ms] ${colors.orb2}`}
        style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }}
      />
      
      {/* Orb 3: Top Right - Moves drastically (Foreground feel) */}
      <div 
        className={`absolute top-[30%] right-[10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen opacity-30 blur-[80px] animate-float transition-colors duration-[5000ms] ${colors.orb3}`}
        style={{ transform: `translate(${mousePos.x * -40}px, ${mousePos.y * 20}px)` }}
      />
      
      {/* Orb 4: Bottom Left - Subtle movement */}
      <div 
        className={`absolute bottom-[20%] left-[10%] w-[35vw] h-[35vw] rounded-full mix-blend-screen opacity-30 blur-[90px] animate-float-delayed transition-colors duration-[5000ms] ${colors.orb4}`}
        style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * -15}px)` }}
      />
    </div>
  );
};