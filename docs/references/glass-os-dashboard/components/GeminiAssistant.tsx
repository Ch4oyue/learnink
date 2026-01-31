import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Sparkles, Send, Bot, User, Mic, Paperclip, X, Trash2, ArrowDown } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';

interface GeminiAssistantProps {
  initialFile?: File | null;
  onClearInitialFile?: () => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ initialFile, onClearInitialFile }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm Aether. I'm connected to Google Search and ready to analyze images or transcribe audio. How can I help?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Handle file drop from parent (App.tsx)
  useEffect(() => {
    if (initialFile) {
      processFile(initialFile);
      if(onClearInitialFile) onClearInitialFile();
    }
  }, [initialFile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Scroll detection to show "Scroll to bottom" button
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const clearChat = () => {
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: "Conversation cleared. Ready for a new topic.",
        timestamp: new Date()
      }]);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setAttachment({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleAudioTranscription(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'audio/webm', data: base64data } },
                        { text: "Transcribe this audio exactly as spoken." }
                    ]
                }
            });
            
            const text = response.text;
            if (text) {
                setInput(text);
            }
            setIsLoading(false);
        };
    } catch (e) {
        console.error("Transcription failed", e);
        setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    const currentInput = input;
    const currentAttachment = attachment;
    
    setInput('');
    setAttachment(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: currentInput || (currentAttachment ? "Analyzed attachment" : ""),
      timestamp: new Date(),
      attachment: currentAttachment ? { type: 'image', data: currentAttachment.data, mimeType: currentAttachment.mimeType } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      let model = 'gemini-3-flash-preview';
      let tools: any[] = [{ googleSearch: {} }]; 
      
      if (currentAttachment) {
        model = 'gemini-3-pro-preview';
      } else {
        if (currentInput.toLowerCase().includes('think') || currentInput.toLowerCase().includes('reason')) {
             model = 'gemini-3-pro-preview';
        }
      }

      const parts: any[] = [];
      if (currentAttachment) {
          parts.push({
              inlineData: {
                  data: currentAttachment.data,
                  mimeType: currentAttachment.mimeType
              }
          });
      }
      if (currentInput) {
          parts.push({ text: currentInput });
      }

      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      const responseStream = await ai.models.generateContentStream({
          model: model,
          contents: { parts },
          config: {
              tools: tools,
              systemInstruction: 'You are Aether, a futuristic OS assistant. Use Google Search for current events. Be concise, friendly, and helpful. Use bolding for key points.',
          }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === modelMsgId ? { ...msg, text: fullText } : msg
            )
          );
        }
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown-like parser for Bold and Line Breaks
  const formatText = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, i) => {
          // Replace **text** with bold elements
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
              <div key={i} className={`min-h-[1.2em] ${line.trim() === '' ? 'h-2' : ''}`}>
                  {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={j}>{part}</span>;
                  })}
              </div>
          );
      });
  };

  return (
    <GlassCard className="h-full flex flex-col min-h-[600px] max-h-[600px] md:max-h-[calc(100vh-140px)] relative overflow-hidden !p-0">
      {/* --- Fixed Header --- */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-purple-500 to-blue-500 p-2 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
              <h3 className="text-white font-semibold tracking-wide text-sm">Aether Assistant</h3>
              <p className="text-[10px] text-white/50">Gemini 3 Pro • Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                title="Clear Chat"
            >
                <Trash2 size={16} />
            </button>
             <span className="flex h-2 w-2 relative mx-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLoading ? 'bg-green-400' : 'bg-purple-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoading ? 'bg-green-500' : 'bg-purple-500'}`}></span>
            </span>
        </div>
      </div>

      {/* --- Scrollable Messages Area --- */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-20 pb-32 px-4 space-y-6 custom-scrollbar scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-[fadeIn_0.3s_ease-out]`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-lg
              ${msg.role === 'user' ? 'bg-white/10 border border-white/20' : 'bg-indigo-500/20 border border-indigo-400/30'}`}>
              {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-200" />}
            </div>

            {/* Message Bubble */}
            <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]`}>
                {/* Render Attachment if exists */}
                {msg.attachment && msg.role === 'user' && (
                    <div className="rounded-xl overflow-hidden border border-white/20 w-48 h-32 relative shadow-lg">
                        <img 
                            src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} 
                            alt="attachment" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md
                ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-white/10 to-white/5 text-white rounded-tr-sm border border-white/10' 
                    : 'bg-black/40 text-indigo-100 rounded-tl-sm border border-white/5 shadow-inner'}`}>
                  {formatText(msg.text)}
                </div>
                <span className={`text-[10px] text-white/30 ${msg.role === 'user' ? 'text-right' : 'text-left'} px-1`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
            <div className="flex gap-3 animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-indigo-200" />
                 </div>
                 <div className="bg-black/20 rounded-tl-sm rounded-2xl p-4 border border-white/5 flex items-center gap-1.5 h-12">
                    <div className="w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce"></div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll Down Button (Floating) */}
      {showScrollButton && (
        <button 
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full p-2 shadow-lg hover:bg-white/20 transition-all animate-bounce z-10"
        >
            <ArrowDown size={16} />
        </button>
      )}

      {/* --- Fixed Input Area --- */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-xl border-t border-white/10 z-20">
        
        {/* Attachment Preview Badge */}
        {attachment && (
            <div className="absolute -top-10 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg animate-[slideIn_0.2s_ease-out]">
                <Paperclip size={12} className="text-blue-400" />
                <span className="text-xs text-white/80 font-medium">Image attached</span>
                <button onClick={() => setAttachment(null)} className="ml-2 p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white"><X size={12} /></button>
            </div>
        )}
        
        <div className="relative group flex items-center gap-2">
            {/* File Upload Button */}
            <label className="p-3 rounded-full glass-button text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/20">
                <Paperclip size={20} />
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
                    }}
                />
            </label>

            {/* Input Field */}
            <div className="relative flex-1">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "Listening..." : "Ask Aether anything..."}
                    disabled={isRecording}
                    className="w-full glass-input rounded-2xl py-3.5 pl-5 pr-12 text-sm placeholder-white/30 shadow-[inset_0_2px_5px_rgba(0,0,0,0.2)] focus:bg-white/5 transition-colors bg-white/5 border-white/10"
                />
                
                <div className="absolute right-2 top-1.5 flex gap-1 items-center h-full pb-3">
                    {input.trim() || attachment ? (
                        <button 
                            onClick={handleSend}
                            disabled={isLoading}
                            className="p-2 bg-blue-500 rounded-xl text-white shadow-lg hover:bg-blue-400 transition-all active:scale-95"
                        >
                            <Send size={16} fill="currentColor" />
                        </button>
                    ) : (
                        <button 
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            disabled={isLoading}
                            className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-white/40 hover:text-white'}`}
                        >
                            <Mic size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    </GlassCard>
  );
};