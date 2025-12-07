
import React, { useState, useRef, useEffect } from 'react';
import { chatWithSeniorSiteManager } from '../services/geminiService';
import { ChatMessage, Project, UserRole } from '../types';
import { Send, Bot, User, HardHat, FileText, AlertTriangle, Calculator, Sparkles, StopCircle, BarChart3, MessageCircle, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AISiteManagerProps {
  projects: Project[];
  userRole: UserRole;
}

export const AISiteManager: React.FC<AISiteManagerProps> = ({ projects, userRole }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'stats'>('chat');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Merhaba! Ben Baret Ali. TS 500, TBDY 2018, İSG Kanunu ve Kamu İhale Mevzuatı konularında 25 yıllık tecrübemle yanındayım. İster teknik detay sor, ister hakediş hesaplat. Ne lazım?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Analytics State (Mock Data + Real-time Update)
  const [questionStats, setQuestionStats] = useState([
    { name: 'Pzt', count: 12 },
    { name: 'Sal', count: 19 },
    { name: 'Çar', count: 15 },
    { name: 'Per', count: 22 },
    { name: 'Cum', count: 18 },
    { name: 'Cmt', count: 8 },
    { name: 'Paz', count: 5 },
  ]);
  const [totalQuestions, setTotalQuestions] = useState(99);

  const topicData = [
    { name: 'Mevzuat & Hukuk', value: 45, color: '#f97316' }, // Orange
    { name: 'Teknik Detay', value: 30, color: '#3b82f6' }, // Blue
    { name: 'İSG & Risk', value: 15, color: '#ef4444' }, // Red
    { name: 'Maliyet & Hakediş', value: 10, color: '#22c55e' }, // Green
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeTab]);

  const updateStats = () => {
    // Increment today's count (assuming today is the last day in mock data for demo)
    setQuestionStats(prev => {
        const newData = [...prev];
        newData[newData.length - 1].count += 1;
        return newData;
    });
    setTotalQuestions(prev => prev + 1);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
    
    // Update stats
    updateStats();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Convert history
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    // Find Project Context
    const projectContext = projects.find(p => p.id === selectedProjectId);

    const responseText = await chatWithSeniorSiteManager(userMsg.text, history, projectContext);

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

  const quickActions = [
    { label: 'İş Kazası Tutanağı', icon: AlertTriangle, prompt: 'Şantiyede hafif yaralanmalı bir iş kazası oldu. 6331 sayılı kanuna uygun resmi bir İş Kazası Tutanağı taslağı hazırlar mısın?' },
    { label: 'Hava Muhalefeti', icon: FileText, prompt: 'Aşırı yağış nedeniyle beton dökümünü durdurduk. İdareye sunulmak üzere süre uzatımı için "Hava Muhalefeti Tutanağı" örneği yazar mısın?' },
    { label: 'Beton Priz Süresi', icon: Calculator, prompt: 'TS 500\'e göre C35 beton döküldü, hava sıcaklığı 5 derece. Kalıbı en erken ne zaman sökebilirim?' },
    { label: 'Taşeron İhtarı', icon: StopCircle, prompt: 'Elektrik taşeronu iş programının gerisinde. 4735 sayılı kanuna atıfta bulunarak resmi bir ihtar yazısı örneği hazırla.' },
  ];

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
         <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-200">
                <Bot size={28} className="text-orange-600" />
                </div>
                <div>
                <h2 className="font-bold text-slate-800">Baret Ali</h2>
                <p className="text-xs text-slate-500 font-medium">Mevzuat & Saha Uzmanı</p>
                </div>
            </div>

            {/* Project Selector */}
            <div className="mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Proje Bağlamı</label>
                <select 
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-300"
                >
                    <option value="">Genel (Proje Seçilmedi)</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
         </div>

         {/* Navigation */}
         <div className="p-4 space-y-2">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'chat' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <MessageCircle size={18} />
                Sohbet & Danışman
            </button>
            <button 
                onClick={() => setActiveTab('stats')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'stats' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <BarChart3 size={18} />
                Soru İstatistikleri
            </button>
         </div>

         {/* Quick Actions Area (Only visible in Chat tab) */}
         {activeTab === 'chat' && (
            <div className="flex-1 overflow-y-auto p-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">Hızlı İşlemler</h3>
                <div className="space-y-2">
                {quickActions.map((action, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSend(action.prompt)}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all group flex items-start gap-3"
                    >
                        <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-white text-slate-500 group-hover:text-orange-600 transition-colors">
                            <action.icon size={18} />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-700 text-xs">{action.label}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Mevzuata uygun taslak</div>
                        </div>
                    </button>
                ))}
                </div>
            </div>
         )}

         {/* Footer */}
         <div className="mt-auto bg-slate-900 text-slate-300 p-4 m-4 rounded-xl text-xs leading-relaxed">
            <div className="flex items-center gap-2 mb-2 text-white font-bold">
               <HardHat size={14} />
               <span>Mevzuat Kütüphanesi</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 opacity-80">
               <li>TS 500 & TBDY 2018</li>
               <li>6331 İSG Kanunu</li>
               <li>4734 Kamu İhale</li>
               <li>3194 İmar Kanunu</li>
            </ul>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative bg-slate-50">
         
         {/* Mobile Header */}
         <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center lg:hidden">
            <div className="flex items-center gap-2">
               <Bot className="text-orange-600" />
               <span className="font-bold text-slate-800">AI Şantiye Şefi</span>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('chat')} className={`p-2 rounded ${activeTab === 'chat' ? 'bg-orange-100' : ''}`}><MessageCircle size={20}/></button>
                <button onClick={() => setActiveTab('stats')} className={`p-2 rounded ${activeTab === 'stats' ? 'bg-orange-100' : ''}`}><BarChart3 size={20}/></button>
            </div>
         </div>

         {/* TAB: CHAT */}
         {activeTab === 'chat' && (
            <>
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6" ref={scrollRef}>
                    {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} max-w-4xl mx-auto`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-200' : 'bg-orange-100 border border-orange-200'}`}>
                            {msg.role === 'user' ? <User size={20} className="text-slate-600" /> : <HardHat size={20} className="text-orange-600" />}
                        </div>
                        <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-5 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap text-sm lg:text-base ${
                                msg.role === 'user' 
                                ? 'bg-slate-800 text-white rounded-tr-sm' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-400 px-1">
                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                    ))}
                    
                    {isTyping && (
                    <div className="flex gap-4 max-w-4xl mx-auto">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                            <HardHat size={20} className="text-orange-600" />
                        </div>
                        <div className="bg-white p-5 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                    )}
                </div>

                <div className="p-4 lg:p-6 bg-white border-t border-slate-200">
                    <div className="max-w-4xl mx-auto relative">
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-300 transition-all shadow-sm">
                        <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm">
                            <Sparkles size={20} />
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Örn: 4734 sayılı kanuna göre aşırı düşük sorgulaması nasıl yapılır?"
                            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 text-sm lg:text-base"
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    </div>
                </div>
            </>
         )}

         {/* TAB: STATS */}
         {activeTab === 'stats' && (
            <div className="flex-1 overflow-y-auto p-8 animate-in fade-in slide-in-from-right-4">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Soru & Etkileşim Analizi</h2>
                            <p className="text-slate-500">Ekibinizin yapay zeka ile etkileşim istatistikleri.</p>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase">Toplam Soru</div>
                            <div className="text-2xl font-bold text-slate-800">{totalQuestions}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Daily Trend */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <BarChart3 className="text-orange-500" />
                                Günlük Soru Sayısı (Son 7 Gün)
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={questionStats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                                        <Bar dataKey="count" name="Soru Sayısı" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Topic Distribution */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <PieIcon className="text-blue-500" />
                                Konu Dağılımı
                            </h3>
                            <div className="h-64 flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={topicData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {topicData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-lg mb-1">Verimlilik İpucu</h4>
                            <p className="text-slate-400 text-sm">En çok "Mevzuat" konusunda soru soruluyor. Şantiye ekibine mevzuat eğitimi planlanabilir.</p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-full">
                            <Sparkles size={24} className="text-yellow-400" />
                        </div>
                    </div>
                </div>
            </div>
         )}

      </div>
    </div>
  );
};
