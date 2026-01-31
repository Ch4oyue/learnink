import React, { useState } from 'react';
import { Home, Grid, Settings, Bell, User } from 'lucide-react';

interface DockProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Dock: React.FC<DockProps> = ({ activeTab, onTabChange }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const icons = [
    { id: 'home', icon: <Home size={22} />, label: 'Home' },
    { id: 'apps', icon: <Grid size={22} />, label: 'Apps' },
    { id: 'notifications', icon: <Bell size={22} />, label: 'Notifications', badge: 3 },
    { id: 'profile', icon: <User size={22} />, label: 'Profile' },
    { id: 'settings', icon: <Settings size={22} />, label: 'Settings' },
  ];

  // Magnification Logic using simple index distance
  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(hoveredIndex - index);
    if (distance === 0) return 1.5;
    if (distance === 1) return 1.2;
    return 1;
  };

  const getTranslateY = (index: number) => {
     if (hoveredIndex === null) return 0;
     const distance = Math.abs(hoveredIndex - index);
     if (distance === 0) return -10;
     if (distance === 1) return -5;
     return 0;
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.5s_ease-out]">
      {/* Dock Container - High blur, very rounded */}
      <div 
        className="glass-panel rounded-full px-6 flex items-end justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/20 h-16 sm:h-20"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {icons.map((item, index) => {
          const scale = getScale(index);
          const translateY = getTranslateY(index);
          const isActive = activeTab === item.id;
          
          return (
            <div 
              key={item.id} 
              className="relative flex flex-col items-center justify-end pb-3 sm:pb-4 transition-all duration-200 ease-out origin-bottom"
              style={{
                 transform: `scale(${scale}) translateY(${translateY}px)`,
                 margin: '0 4px'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <button 
                onClick={() => onTabChange(item.id)}
                className={`
                  p-3 rounded-full flex items-center justify-center relative transition-colors duration-300
                  ${isActive 
                    ? 'bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] border border-white/30' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'}
                `}
                style={{
                    width: '44px',
                    height: '44px'
                }}
              >
                {/* Active Dot indicator below icon */}
                {isActive && (
                  <div className="absolute -bottom-2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"></div>
                )}
                
                <div className="relative z-10">
                  {item.icon}
                </div>
              </button>
              
              {item.badge && (
                <span className="absolute top-0 -right-1 h-4 w-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white border border-black/20 shadow-lg pointer-events-none">
                  {item.badge}
                </span>
              )}
              
              {/* Tooltip */}
              <div 
                className={`
                    absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-[10px] rounded-md border border-white/10 pointer-events-none whitespace-nowrap transition-opacity duration-200
                    ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}
                `}
              >
                  {item.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};