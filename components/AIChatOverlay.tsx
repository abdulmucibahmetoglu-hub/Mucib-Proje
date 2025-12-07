import React, { useState, useRef, useEffect } from 'react';
import { chatWithSiteAssistant } from '../services/geminiService';
import { ChatMessage } from '../types';
import { MessageSquare, X, Send, Bot, User, Minimize2 } from 'lucide-react';

export const AIChatOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Convert chat history for Gemini
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithSiteAssistant(userMsg.text, history);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-105 z-50 flex items-center gap-2 group"
      >
        <Bot size={28} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-medium px-0 group-hover:px-2">
          SiteMaster'a Sor
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white rounded-t-2xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-500 rounded-lg">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm">SiteMaster Asistan</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Çevrimiçi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <Minimize2 size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10 space-y-2">
            <Bot size={48} className="mx-auto opacity-20" />
            <p className="text-sm font-medium">Şantiye yönetiminde size nasıl yardımcı olabilirim?</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <button onClick={() => setInput("Kazı güvenliği yönetmeliği nedir?")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors">İSG Mevzuatı</button>
              <button onClick={() => setInput("Yağmurlu hava için erteleme e-postası hazırla.")} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors">E-posta Taslağı</button>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-orange-100'}`}>
              {msg.role === 'user' ? <User size={14} className="text-slate-600" /> : <Bot size={14} className="text-orange-600" />}
            </div>
            <div className={`p-3.5 rounded-2xl text-sm max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-white rounded-tr-sm' 
                : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
               <Bot size={14} className="text-orange-600" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-300 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Bir şeyler sorun..."
            className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};