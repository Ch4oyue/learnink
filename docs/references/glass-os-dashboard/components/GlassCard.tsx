import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`
        glass-panel glass-noise p-6 relative group
        ${hoverEffect ? 'hover:bg-white/5 hover:border-t-white/50 transition-all duration-500' : ''}
        ${className}
      `}
    >
      {/* Specular Highlight (Liquid sheen) - Top Right Corner */}
      <div className="absolute top-0 right-0 w-2/3 h-1/2 bg-gradient-to-b from-white/10 to-transparent blur-xl pointer-events-none opacity-50 rounded-tr-[24px]" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};