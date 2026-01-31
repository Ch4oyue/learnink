import React, { useState, useEffect } from 'react';
import { Background } from './components/Background';
import { WeatherWidget } from './components/WeatherWidget';
import { MusicPlayer } from './components/MusicPlayer';
import { GeminiAssistant } from './components/GeminiAssistant';
import { SystemStatus } from './components/SystemStatus';
import { Dock } from './components/Dock';
import { GlassCard } from './components/GlassCard';
import { 
    Calendar, Search, Sliders, Wifi, Bluetooth, Moon, Package, Bell, User, 
    Check, Trash2, Edit2, X, Terminal, Image as ImageIcon, Globe, Mail, 
    Map, FileText, ShoppingBag, Calculator, Folder, Camera, Mic, Play, Share2
} from 'lucide-react';
import { SystemState, Notification, UserProfile } from './types';

// --- Sub-Views ---

const HomeView: React.FC<{ 
  system: SystemState, 
  toggleSystem: (key: keyof SystemState) => void,
  onFileDrop: (file: File) => void,
  droppedFile: File | null,
  clearDroppedFile: () => void
}> = ({ system, toggleSystem, onFileDrop, droppedFile, clearDroppedFile }) => {
    
    // Handle Drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileDrop(e.dataTransfer.files[0]);
        }
    };

    return (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-[fadeIn_0.5s_ease-out]">
    {/* Left Column (Weather & Music) */}
    <div className="md:col-span-4 space-y-6 flex flex-col">
      <div className="flex-1">
          <WeatherWidget />
      </div>
      <div className="flex-1">
          <MusicPlayer />
      </div>
    </div>

    {/* Middle Column (Main Assistant) */}
    <div className="md:col-span-5 h-full">
      <GeminiAssistant initialFile={droppedFile} onClearInitialFile={clearDroppedFile} />
    </div>

    {/* Right Column (Status & Quick Actions) */}
    <div className="md:col-span-3 space-y-6">
        <div className="h-[250px]">
          <SystemStatus />
        </div>
        
        {/* Toggle Widgets (Functional) */}
        <GlassCard className="p-4 space-y-4">
          <div className="flex items-center justify-between group cursor-pointer glass-button rounded-xl p-3 hover:bg-white/10" onClick={() => toggleSystem('dnd')}>
              <span className="text-sm font-medium">Do Not Disturb</span>
              <div className={`w-10 h-6 rounded-full p-1 border transition-colors relative ${system.dnd ? 'bg-purple-500/20 border-purple-500/30' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-4 h-4 rounded-full shadow-md absolute transition-transform ${system.dnd ? 'bg-purple-400 translate-x-4' : 'bg-white/20 translate-x-0'}`}></div>
              </div>
          </div>
          <div className="flex items-center justify-between group cursor-pointer glass-button rounded-xl p-3 hover:bg-white/10" onClick={() => toggleSystem('bluetooth')}>
              <span className="text-sm font-medium">Bluetooth</span>
              <div className={`w-10 h-6 rounded-full p-1 border transition-colors relative ${system.bluetooth ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-4 h-4 rounded-full shadow-md absolute transition-transform ${system.bluetooth ? 'bg-blue-400 translate-x-4' : 'bg-white/20 translate-x-0'}`}></div>
              </div>
          </div>
          <div className="flex items-center justify-between group cursor-pointer glass-button rounded-xl p-3 hover:bg-white/10" onClick={() => toggleSystem('wifi')}>
              <span className="text-sm font-medium">Wi-Fi</span>
              <div className={`w-10 h-6 rounded-full p-1 border transition-colors relative ${system.wifi ? 'bg-green-500/20 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-4 h-4 rounded-full shadow-md absolute transition-transform ${system.wifi ? 'bg-green-400 translate-x-4' : 'bg-white/20 translate-x-0'}`}></div>
              </div>
          </div>
        </GlassCard>

        {/* File Upload / Drop Zone (Functional) */}
        <GlassCard 
            className="flex flex-col items-center justify-center border-dashed border-2 border-white/20 hover:border-white/40 transition-colors min-h-[150px] cursor-pointer group hover:bg-white/5"
        >
             <div 
                className="absolute inset-0 z-10" 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
             ></div>
             <input type="file" id="file-upload" className="hidden" onChange={(e) => e.target.files && onFileDrop(e.target.files[0])} />
             
             <div className="w-12 h-12 rounded-full glass-button flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="text-2xl">+</span>
             </div>
             <p className="text-xs text-white/60">Drop files to Analyze</p>
        </GlassCard>
    </div>
  </div>
)};

const SettingsView: React.FC<{ system: SystemState, toggleSystem: (key: keyof SystemState) => void }> = ({ system, toggleSystem }) => (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.3s_ease-out]">
        <GlassCard className="p-8">
            <h2 className="text-2xl font-light mb-8 flex items-center gap-3">
                <Sliders size={24} /> System Settings
            </h2>
            <div className="space-y-6">
                {/* Connectivity */}
                <div className="space-y-4">
                    <h3 className="text-sm text-white/50 uppercase tracking-wider font-semibold">Connectivity</h3>
                    <div 
                        onClick={() => toggleSystem('wifi')}
                        className={`glass-button rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer w-full border ${system.wifi ? 'border-green-500/30' : 'border-transparent'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${system.wifi ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}><Wifi size={20}/></div>
                            <div>
                                <div className="font-medium">Wi-Fi Network</div>
                                <div className="text-sm text-white/50">{system.wifi ? 'Glass_OS_5G_Secure' : 'Disconnected'}</div>
                            </div>
                        </div>
                        <div className={`text-sm ${system.wifi ? 'text-green-400' : 'text-white/30'}`}>{system.wifi ? 'Connected' : 'Off'}</div>
                    </div>
                    <div 
                        onClick={() => toggleSystem('bluetooth')}
                        className={`glass-button rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer w-full border ${system.bluetooth ? 'border-blue-500/30' : 'border-transparent'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${system.bluetooth ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'}`}><Bluetooth size={20}/></div>
                            <div>
                                <div className="font-medium">Bluetooth</div>
                                <div className="text-sm text-white/50">{system.bluetooth ? '3 Devices Connected' : 'Disabled'}</div>
                            </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 relative transition-colors ${system.bluetooth ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full absolute transition-transform ${system.bluetooth ? 'bg-blue-400 translate-x-4' : 'bg-white/40 translate-x-0'}`}></div>
                        </div>
                    </div>
                </div>

                {/* Display */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm text-white/50 uppercase tracking-wider font-semibold">Display & Sound</h3>
                    <div className="glass-button rounded-2xl p-4 space-y-4 w-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-400"><Moon size={20}/></div>
                            <div className="flex-1">
                                <div className="font-medium mb-2">Brightness</div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
                                    <div className="h-full w-[70%] bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    </div>
);

const AppsView: React.FC<{ filter: string }> = ({ filter }) => {
    interface AppItem {
        id: string;
        name: string;
        icon: React.ReactNode;
        description: string;
        version: string;
    }

    const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);

    const apps: AppItem[] = [
        { 
            id: 'terminal', 
            name: "Terminal", 
            icon: <div className="bg-black border border-white/20 w-full h-full flex items-center justify-center text-green-500"><Terminal size={32}/></div>,
            description: "Command line interface for advanced system control and scripting.",
            version: "2.4.0"
        },
        { 
            id: 'photos', 
            name: "Photos", 
            icon: <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-full h-full flex items-center justify-center text-white"><ImageIcon size={32}/></div>,
            description: "View, edit, and organize your memories with AI-powered tagging.",
            version: "1.2.1"
        },
        { 
            id: 'browser', 
            name: "Browser", 
            icon: <div className="bg-gradient-to-tr from-blue-400 to-cyan-300 w-full h-full flex items-center justify-center text-white"><Globe size={32}/></div>,
            description: "Fast, secure, and private web browsing experience.",
            version: "108.0.2"
        },
        { 
            id: 'mail', 
            name: "Mail", 
            icon: <div className="bg-gradient-to-br from-red-400 to-orange-400 w-full h-full flex items-center justify-center text-white"><Mail size={32}/></div>,
            description: "Unified inbox for all your email accounts.",
            version: "3.5.0"
        },
        { 
            id: 'maps', 
            name: "Maps", 
            icon: <div className="bg-gradient-to-tl from-green-400 to-emerald-600 w-full h-full flex items-center justify-center text-white"><Map size={32}/></div>,
            description: "Navigate the world with real-time traffic and 3D terrain.",
            version: "5.1.0"
        },
        { 
            id: 'notes', 
            name: "Notes", 
            icon: <div className="bg-gradient-to-bl from-yellow-300 to-orange-300 w-full h-full flex items-center justify-center text-white"><FileText size={32}/></div>,
            description: "Capture thoughts, ideas, and lists instantly.",
            version: "2.0.1"
        },
        { 
            id: 'store', 
            name: "Store", 
            icon: <div className="bg-gradient-to-r from-pink-500 to-rose-500 w-full h-full flex items-center justify-center text-white"><ShoppingBag size={32}/></div>,
            description: "Discover and download the latest apps and games.",
            version: "4.2.0"
        },
        { 
            id: 'calc', 
            name: "Calculator", 
            icon: <div className="bg-gray-800 w-full h-full flex items-center justify-center text-white"><Calculator size={32}/></div>,
            description: "Solve complex mathematical problems with ease.",
            version: "1.0.0"
        },
        { 
            id: 'files', 
            name: "Files", 
            icon: <div className="bg-blue-500 w-full h-full flex items-center justify-center text-white"><Folder size={32}/></div>,
            description: "Manage your local and cloud documents.",
            version: "1.1.5"
        },
        { 
            id: 'camera', 
            name: "Camera", 
            icon: <div className="bg-gray-900 w-full h-full flex items-center justify-center text-white"><Camera size={32}/></div>,
            description: "Capture stunning photos and videos.",
            version: "3.0.2"
        },
        { 
            id: 'settings', 
            name: "Settings", 
            icon: <div className="bg-gray-700 w-full h-full flex items-center justify-center text-white"><Sliders size={32}/></div>,
            description: "Customize your Glass OS experience.",
            version: "System"
        },
        { 
            id: 'voice', 
            name: "Voice", 
            icon: <div className="bg-gradient-to-tr from-purple-500 to-blue-500 w-full h-full flex items-center justify-center text-white"><Mic size={32}/></div>,
            description: "Record voice memos and audio notes.",
            version: "1.4.0"
        },
    ];

    const filteredApps = apps.filter(app => app.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto">
            <GlassCard className="p-8 min-h-[60vh] relative z-10">
                 <h2 className="text-2xl font-light mb-8 flex items-center gap-3">
                    <Package size={24} /> Applications {filter && <span className="text-sm opacity-50 ml-2">(Searching: "{filter}")</span>}
                </h2>
                {filteredApps.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                        {filteredApps.map((app, i) => (
                            <div 
                                key={app.id} 
                                className="flex flex-col items-center gap-3 group cursor-pointer opacity-0 animate-[zoomIn_0.4s_ease-out_forwards]"
                                style={{ animationDelay: `${i * 0.05}s` }}
                                onClick={() => setSelectedApp(app)}
                            >
                                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-white/5 flex items-center justify-center glass-button relative">
                                    {/* Icon Container */}
                                    {app.icon}
                                    {/* Shine overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                                </div>
                                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{app.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-50">
                        <p>No apps found.</p>
                        <p className="text-sm mt-2">Try asking the Assistant.</p>
                    </div>
                )}
            </GlassCard>

            {/* App Details Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]" 
                        onClick={() => setSelectedApp(null)}
                    ></div>
                    
                    {/* Modal Content */}
                    <GlassCard className="w-full max-w-sm relative z-10 animate-[scaleUp_0.3s_ease-out] border border-white/20 shadow-2xl overflow-hidden">
                        {/* Header Image/Icon Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent z-0"></div>
                        
                        <button 
                            onClick={() => setSelectedApp(null)}
                            className="absolute top-4 right-4 p-2 rounded-full glass-button hover:bg-white/20 z-20"
                        >
                            <X size={20} className="text-white/80" />
                        </button>

                        <div className="relative z-10 flex flex-col items-center pt-8 text-center">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl mb-6 ring-4 ring-white/10">
                                {selectedApp.icon}
                            </div>
                            
                            <h3 className="text-3xl font-bold tracking-tight mb-1">{selectedApp.name}</h3>
                            <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded-md mb-4 border border-white/5">
                                v{selectedApp.version}
                            </span>
                            
                            <p className="text-white/70 text-sm mb-8 px-4 leading-relaxed">
                                {selectedApp.description}
                            </p>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button className="glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 border border-blue-500/30">
                                    <Play size={18} fill="currentColor" /> Open
                                </button>
                                <button className="glass-button bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95">
                                    <Share2 size={18} /> Share
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    )
};

const NotificationsView: React.FC<{ notifications: Notification[], markRead: (id: string) => void, clearAll: () => void }> = ({ notifications, markRead, clearAll }) => (
    <div className="max-w-2xl mx-auto animate-[slideIn_0.3s_ease-out]">
        <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-light flex items-center gap-3">
                    <Bell size={24} /> Notifications
                </h2>
                {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-xs text-white/60 hover:text-red-400 transition-colors flex items-center gap-1 glass-button px-3 py-1 rounded-full">
                        <Trash2 size={12} /> Clear All
                    </button>
                )}
            </div>
            
            <div className="space-y-3">
                {notifications.length === 0 ? (
                     <div className="text-center py-12 text-white/30">
                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                        <p>All caught up!</p>
                     </div>
                ) : (
                    notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            className={`p-4 rounded-xl border transition-all relative group glass-button ${notif.read ? 'bg-white/5 border-white/5 opacity-60' : 'bg-white/10 border-white/20'}`}
                            onClick={() => markRead(notif.id)}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium">{notif.title}</h4>
                                <span className="text-xs text-white/40">{notif.time}</span>
                            </div>
                            <p className="text-sm text-white/70 mt-1">{notif.message}</p>
                            {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>}
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    </div>
);

const ProfileView: React.FC<{ profile: UserProfile, updateProfile: (p: UserProfile) => void }> = ({ profile, updateProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(profile.name);
    const [editRole, setEditRole] = useState(profile.role);

    const handleSave = () => {
        updateProfile({ ...profile, name: editName, role: editRole });
        setIsEditing(false);
    };

    return (
        <div className="flex items-center justify-center h-[50vh] animate-[fadeIn_0.5s]">
            <GlassCard className="p-12 text-center w-full max-w-md relative">
                {isEditing ? (
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={handleSave} className="p-2 rounded-full glass-button bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30"><Check size={16}/></button>
                        <button onClick={() => setIsEditing(false)} className="p-2 rounded-full glass-button bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"><X size={16}/></button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 p-2 rounded-full glass-button text-white/50 hover:text-white transition-colors">
                        <Edit2 size={16} />
                    </button>
                )}

                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 mx-auto mb-6 p-1">
                        <div className="w-full h-full rounded-full bg-black/50 overflow-hidden relative group cursor-pointer">
                            <img src={profile.avatar} alt="User" className="w-full h-full object-cover opacity-90" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs">Change</span>
                            </div>
                        </div>
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="glass-input w-full text-center py-2 rounded-lg" />
                        <input value={editRole} onChange={e => setEditRole(e.target.value)} className="glass-input w-full text-center py-2 rounded-lg text-sm" />
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold">{profile.name}</h2>
                        <p className="text-white/50 mt-2">{profile.role}</p>
                    </>
                )}
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="glass-button rounded-lg p-3">
                        <div className="text-2xl font-light">12</div>
                        <div className="text-[10px] uppercase text-white/40">Projects</div>
                    </div>
                    <div className="glass-button rounded-lg p-3">
                        <div className="text-2xl font-light">84%</div>
                        <div className="text-[10px] uppercase text-white/40">Productivity</div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};


// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [date, setDate] = useState(new Date());
  
  // System State
  const [system, setSystem] = useState<SystemState>({
    wifi: true,
    bluetooth: true,
    dnd: false,
    brightness: 80
  });

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Doe",
    role: "Administrator • Glass OS Pro",
    avatar: "https://picsum.photos/200/200?random=user"
  });

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'System Update', message: 'Glass OS 2.0 is ready to install.', time: '2m ago', read: false },
    { id: '2', title: 'New Message', message: 'Aether: "I analyzed the image you sent."', time: '1h ago', read: false },
    { id: '3', title: 'Calendar', message: 'Meeting with Team in 30 mins.', time: '2h ago', read: true },
  ]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drag and Drop global handler
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleSystem = (key: keyof SystemState) => {
    setSystem(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dateString = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const getGreeting = () => {
    const hours = date.getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      if (e.target.value && activeTab !== 'apps') {
          setActiveTab('apps');
      } else if (!e.target.value && activeTab === 'apps') {
          setActiveTab('home');
      }
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'home': return <HomeView 
                                system={system} 
                                toggleSystem={toggleSystem} 
                                onFileDrop={setDroppedFile}
                                droppedFile={droppedFile}
                                clearDroppedFile={() => setDroppedFile(null)}
                              />;
          case 'settings': return <SettingsView system={system} toggleSystem={toggleSystem} />;
          case 'apps': return <AppsView filter={searchQuery} />;
          case 'notifications': return <NotificationsView 
                                          notifications={notifications} 
                                          markRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n))} 
                                          clearAll={() => setNotifications([])}
                                        />;
          case 'profile': return <ProfileView profile={profile} updateProfile={setProfile} />;
          default: return <HomeView 
                            system={system} 
                            toggleSystem={toggleSystem} 
                            onFileDrop={setDroppedFile}
                            droppedFile={droppedFile}
                            clearDroppedFile={() => setDroppedFile(null)}
                          />;
      }
  }

  // Update Notification Badge count dynamically
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen w-full relative text-white pb-32">
      <Background />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="animate-[slideIn_0.5s_ease-out] cursor-default">
            <h1 className="text-4xl font-light tracking-tight">{getGreeting()}, <span className="font-bold">{profile.name.split(' ')[0]}</span></h1>
            <p className="text-white/50 mt-1 flex items-center gap-2">
              <Calendar size={14} />
              {dateString}
            </p>
          </div>
          
          <div className="relative group w-full sm:w-auto z-50">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/40 group-focus-within:text-white/80 transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleGlobalSearch}
              placeholder="Search Apps..." 
              className="glass-input w-full sm:w-64 rounded-full pl-10 pr-4 py-2 text-sm shadow-lg focus:w-80 transition-all duration-300"
            />
            {searchQuery && (
                <button 
                    onClick={() => {setSearchQuery(''); setActiveTab('home');}} 
                    className="absolute right-3 top-2.5 text-white/40 hover:text-white glass-button p-0.5 rounded-full"
                >
                    <X size={14} />
                </button>
            )}
          </div>
        </header>

        {/* Dynamic Content Area */}
        {renderContent()}

      </div>
      
      {/* Dock needs to know about unread notifications now */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.5s_ease-out]">
        <div className="glass-panel rounded-full px-6 py-4 flex items-center gap-2 sm:gap-4 shadow-2xl border border-white/20">
            {[
                { id: 'home', icon: 'Home', label: 'Home' },
                { id: 'apps', icon: 'Grid', label: 'Apps' },
                { id: 'notifications', icon: 'Bell', label: 'Notifications', badge: unreadCount },
                { id: 'profile', icon: 'User', label: 'Profile' },
                { id: 'settings', icon: 'Settings', label: 'Settings' },
            ].map((item: any) => (
            <div key={item.id} className="group relative">
                <button 
                onClick={() => { setActiveTab(item.id); if(item.id === 'apps' && searchQuery) setSearchQuery(''); }}
                className={`
                    p-3 sm:p-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center glass-button
                    ${activeTab === item.id 
                    ? 'bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110 border-white/40' 
                    : 'text-white/60 hover:text-white hover:bg-white/10 hover:-translate-y-2 hover:scale-110'}
                `}
                >
                  {/* Dynamic Icon Rendering */}
                  {item.icon === 'Home' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                  {item.icon === 'Grid' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>}
                  {item.icon === 'Bell' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>}
                  {item.icon === 'User' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  {item.icon === 'Settings' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
                {item.badge > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border border-black/20">
                    {item.badge}
                </span>
                )}
                {/* Tooltip */}
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-[10px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10 pointer-events-none">
                    {item.label}
                </span>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default App;