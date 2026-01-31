import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { CloudRain, MapPin, Wind, Droplets, Sun, Cloud, CloudSnow, CloudLightning } from 'lucide-react';

interface WeatherState {
  temp: number;
  condition: string;
  location: string;
  min: number;
  max: number;
  wind: number;
  humidity: number;
  code: number;
  isDay: number;
}

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
          );
          
          if (!response.ok) throw new Error("Failed to fetch weather");
          
          const data = await response.json();
          const current = data.current;
          const daily = data.daily;
          const city = data.timezone.split('/').pop()?.replace('_', ' ') || "Local Area";

          setWeather({
            temp: Math.round(current.temperature_2m),
            condition: getWeatherDescription(current.weather_code),
            location: city,
            min: Math.round(daily.temperature_2m_min[0]),
            max: Math.round(daily.temperature_2m_max[0]),
            wind: Math.round(current.wind_speed_10m),
            humidity: current.relative_humidity_2m,
            code: current.weather_code,
            isDay: current.is_day
          });
        } catch (err) {
          setError("Weather unavailable");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setWeather({
          temp: 24,
          condition: "Clear Sky",
          location: "Demo City",
          min: 18,
          max: 28,
          wind: 12,
          humidity: 45,
          code: 0,
          isDay: 1
        });
        setLoading(false);
      }
    );
  }, []);

  const getWeatherIcon = (code: number, isDay: number) => {
    if (code === 0) return isDay ? <Sun className="text-yellow-100" size={32} /> : <Sun className="text-blue-100" size={32} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-white/80" size={32} />;
    if (code >= 45 && code <= 48) return <Cloud className="text-gray-200" size={32} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-200" size={32} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-white" size={32} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-200" size={32} />;
    if (code >= 95) return <CloudLightning className="text-yellow-200" size={32} />;
    return <Sun className="text-yellow-100" size={32} />;
  };

  const getWeatherDescription = (code: number) => {
    const codes: Record<number, string> = {
      0: "Clear Sky",
      1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
      45: "Foggy", 48: "Depositing Rime Fog",
      51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
      61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
      71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
      95: "Thunderstorm"
    };
    return codes[code] || "Unknown";
  };

  // Dynamic Background based on weather code and day/night
  const getDynamicBackground = (code: number, isDay: number) => {
      // Clear
      if (code === 0 || code === 1) {
          return isDay 
            ? 'bg-gradient-to-br from-orange-400/80 to-yellow-300/80 border-t-yellow-200/50' 
            : 'bg-gradient-to-br from-indigo-900/80 to-purple-800/80 border-t-indigo-400/30';
      }
      // Cloudy
      if (code === 2 || code === 3 || (code >= 45 && code <= 48)) {
          return isDay 
            ? 'bg-gradient-to-br from-blue-300/60 to-gray-300/60 border-t-white/40' 
            : 'bg-gradient-to-br from-slate-800/80 to-gray-800/80 border-t-slate-500/30';
      }
      // Rain / Storm
      if (code >= 51) {
          return 'bg-gradient-to-br from-blue-900/80 to-slate-800/80 border-t-blue-400/30';
      }
      return 'bg-gradient-to-br from-white/10 to-white/5'; // Default Glass
  };

  if (loading) {
    return (
      <GlassCard className="flex flex-col justify-between h-full min-h-[220px]">
         <div className="flex justify-between items-start">
             <div className="space-y-2">
                 <div className="h-4 w-24 bg-white/10 rounded animate-shimmer"></div>
                 <div className="h-8 w-32 bg-white/10 rounded animate-shimmer"></div>
             </div>
             <div className="h-12 w-12 bg-white/10 rounded-full animate-shimmer"></div>
         </div>
         <div className="space-y-2">
             <div className="h-16 w-24 bg-white/10 rounded animate-shimmer"></div>
             <div className="h-4 w-full bg-white/10 rounded animate-shimmer"></div>
         </div>
      </GlassCard>
    );
  }

  if (error || !weather) {
     return (
      <GlassCard className="flex items-center justify-center h-full min-h-[220px]">
        <p className="text-white/50 text-sm">Weather unavailable</p>
      </GlassCard>
     )
  }

  const bgClass = getDynamicBackground(weather.code, weather.isDay);

  return (
    <GlassCard className={`flex flex-col justify-between h-full min-h-[220px] transition-all duration-1000 ${bgClass}`}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center space-x-2 text-white/90 text-sm mb-1 font-medium">
            <MapPin size={14} />
            <span className="truncate max-w-[120px]">{weather.location}</span>
          </div>
          <h3 className="text-white text-2xl font-bold tracking-tighter truncate w-full drop-shadow-md">{weather.condition}</h3>
        </div>
        <div className="bg-white/20 p-3 rounded-full border border-white/30 shadow-lg backdrop-blur-md">
          {getWeatherIcon(weather.code, weather.isDay)}
        </div>
      </div>

      <div className="flex items-end justify-between mt-4 relative z-10">
        <div>
           <span className="text-6xl font-light text-white tracking-tighter drop-shadow-lg">{weather.temp}°</span>
           <span className="text-white/80 text-lg ml-2 font-medium">{weather.min}° / {weather.max}°</span>
        </div>
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-white/20 relative z-10">
        <div className="flex items-center gap-2">
            <Wind size={14} className="text-white/80" />
            <span className="text-xs text-white font-semibold">{weather.wind} km/h</span>
        </div>
        <div className="flex items-center gap-2">
            <Droplets size={14} className="text-white/80" />
            <span className="text-xs text-white font-semibold">{weather.humidity}%</span>
        </div>
      </div>
    </GlassCard>
  );
};