export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'audio';
    data: string; // base64
    mimeType: string;
  };
}

export interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  high: number;
  low: number;
}

export interface Song {
  title: string;
  artist: string;
  cover: string;
  duration: number; // in seconds
  genre: string[];
  url: string; // Audio source URL
}

export interface SystemState {
  wifi: boolean;
  bluetooth: boolean;
  dnd: boolean;
  brightness: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
}