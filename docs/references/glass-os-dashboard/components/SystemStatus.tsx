import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Cpu, HardDrive, Wifi, Battery, Activity } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  const [stats, setStats] = useState({
    cpu: 34,
    memory: 62,
    network: "5G Ultra",
    battery: 92
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: Math.max(5, Math.min(100, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.max(20, Math.min(95, prev.memory + (Math.random() * 4 - 2))),
        battery: Math.max(0, prev.battery - 0.01) // Slowly drain
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getBarColor = (value: number) => {
    if (value > 90) return "from-red-400 to-orange-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]";
    if (value > 70) return "from-yellow-400 to-orange-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]";
    return "from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]";
  };

  return (
    <GlassCard className="h-full flex flex-col justify-center gap-6">
      <div className="space-y-4">
        {/* CPU */}
        <div className="group">
          <div className="flex justify-between items-center mb-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Cpu size={16} className={stats.cpu > 80 ? "text-red-400 animate-pulse" : ""} />
              <span>Processor</span>
            </div>
            <span className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded transition-all">{Math.round(stats.cpu)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
                className={`h-full bg-gradient-to-r ${getBarColor(stats.cpu)} transition-all duration-1000 ease-in-out`} 
                style={{ width: `${stats.cpu}%` }}
            ></div>
          </div>
        </div>

        {/* Memory */}
        <div className="group">
          <div className="flex justify-between items-center mb-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <HardDrive size={16} />
              <span>Memory</span>
            </div>
            <span className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded transition-all">{Math.round(stats.memory)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
                className="h-full w-[62%] bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-[0_0_10px_rgba(167,139,250,0.5)] transition-all duration-1000 ease-in-out"
                style={{ width: `${stats.memory}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group cursor-default">
            <Wifi size={20} className="text-white mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Network</span>
            <span className="text-xs text-white font-medium">{stats.network}</span>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group cursor-default">
            <Battery size={20} className={`mb-2 group-hover:scale-110 transition-transform ${stats.battery < 20 ? 'text-red-400' : 'text-white'}`} />
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Battery</span>
            <span className="text-xs text-white font-medium">{Math.floor(stats.battery)}%</span>
        </div>
      </div>
    </GlassCard>
  );
};