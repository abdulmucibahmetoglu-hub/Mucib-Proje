import React, { useState, useMemo } from 'react';
import { Tender, TenderAnalysis, UserRole } from '../types';
import { analyzeTender } from '../services/geminiService';
import { Gavel, Search, Plus, Calendar, Clock, MapPin, Building2, Banknote, AlertCircle, X, CheckCircle2, Timer, TrendingUp, PieChart as PieIcon, Award, Activity, Sparkles, Loader2, FileText, AlertTriangle, Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface TendersProps {
  tenders: Tender[];
  onAdd: (tender: Tender) => void;
  onDelete: (id: string) => void;
  userRole: UserRole;
}

export const Tenders: React.FC<TendersProps> = ({ tenders, onAdd, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('Tümü');

  // Analysis State
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<TenderAnalysis | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedTenderForAnalysis, setSelectedTenderForAnalysis] = useState<Tender | null>(null);

  // New Tender State
  const [newTender, setNewTender] = useState<Partial<Tender>>({
    name: '',
    registrationNumber: '',
    authority: '',
    date: '',
    time: '',
    location: '',
    estimatedBudget: 0,
    bondAmount: 0,
    status: 'Hazırlık',
    description: ''
  });

  // --- ANALYTICS DATA PREPARATION ---
  const analyticsData = useMemo(() => {
    const statusCounts = {
      'Hazırlık': 0,
      'Teklif Verildi': 0,
      'Kazanıldı': 0,
      'Kaybedildi': 0,
      'İptal': 0
    };
    
    const budgetByStatus = {
       'Hazırlık': 0,
       'Teklif Verildi': 0,
       'Kazanıldı': 0,
       'Kaybedildi': 0
    };

    let totalBudget = 0;
    let wonCount = 0;
    let lostCount = 0;

    tenders.forEach(t => {
      if (statusCounts.hasOwnProperty(t.status)) {
        statusCounts[t.status as keyof typeof statusCounts]++;
      }
      if (budgetByStatus.hasOwnProperty(t.status)) {
         budgetByStatus[t.status as keyof typeof budgetByStatus] += t.estimatedBudget;
      }

      totalBudget += t.estimatedBudget;

      if (t.status === 'Kazanıldı') wonCount++;
      if (t.status === 'Kaybedildi') lostCount++;
    });

    const pieData = [
      { name: 'Kazanıldı', value: statusCounts['Kazanıldı'], color: '#22c55e' },
      { name: 'Devam Eden', value: statusCounts['Hazırlık'] + statusCounts['Teklif Verildi'], color: '#3b82f6' },
      { name: 'Kaybedildi', value: statusCounts['Kaybedildi'], color: '#ef4444' },
      { name: 'İptal', value: statusCounts['İptal'], color: '#94a3b8' },
    ].filter(d => d.value > 0);

    const barData = [
       { name: 'Hazırlık', amount: budgetByStatus['Hazırlık'] },
       { name: 'Teklifte', amount: budgetByStatus['Teklif Verildi'] },
       { name: 'Kazanılan', amount: budgetByStatus['Kazanıldı'] },
       { name: 'Kaybedilen', amount: budgetByStatus['Kaybedildi'] },
    ];

    const winRate = (wonCount + lostCount) > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

    return { pieData, barData, totalBudget, winRate, totalTenders: tenders.length };
  }, [tenders]);

  const handleAdd = () => {
    if (!newTender.name || !newTender.authority) return;
    
    onAdd({
      id: Date.now().toString(),
      name: newTender.name!,
      registrationNumber: newTender.registrationNumber || '',
      authority: newTender.authority!,
      date: newTender.date!,
      time: newTender.time || '10:00',
      location: newTender.location || '',
      estimatedBudget: Number(newTender.estimatedBudget) || 0,
      bondAmount: Number(newTender.bondAmount) || 0,
      status: newTender.status as any,
      description: newTender.description
    });
    
    setIsModalOpen(false);
    setNewTender({
      name: '',
      registrationNumber: '',
      authority: '',
      date: '',
      time: '',
      location: '',
      estimatedBudget: 0,
      bondAmount: 0,
      status: 'Hazırlık',
      description: ''
    });
  };

  const handleAnalyze = async (tender: Tender) => {
    setAnalyzingId(tender.id);
    setSelectedTenderForAnalysis(tender);
    
    const result = await analyzeTender(tender);
    
    setAnalysisResult(result);
    setAnalyzingId(null);
    setIsAnalysisModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Hazırlık': return 'bg-blue-100 text-blue-700';
      case 'Teklif Verildi': return 'bg-purple-100 text-purple-700';
      case 'Kazanıldı': return 'bg-green-100 text-green-700';
      case 'Kaybedildi': return 'bg-red-100 text-red-700';
      case 'İptal': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredTenders = tenders.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.authority.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.registrationNumber.includes(searchTerm);
    const matchesFilter = filter === 'Tümü' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Calculate days remaining
  const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    const tenderDate = new Date(dateStr);
    const diffTime = tenderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">İhale Yönetimi</h2>
          <p className="text-slate-500 mt-1">Kamu ve özel sektör ihalelerini, teklif süreçlerini takip edin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
        >
          <Plus size={18} />
          Yeni İhale Ekle
        </button>
      </header>

      {/* --- DASHBOARD SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
         {/* Stats Cards Column */}
         <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Activity size={24} />
               </div>
               <div>
                  <div className="text-2xl font-bold text-slate-800">{analyticsData.totalTenders}</div>
                  <div className="text-sm text-slate-500">Takip Edilen İhale</div>
               </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
               <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Banknote size={24} />
               </div>
               <div>
                  <div className="text-2xl font-bold text-slate-800">₺{(analyticsData.totalBudget / 1000000).toFixed(1)}M</div>
                  <div className="text-sm text-slate-500">Toplam İhale Hacmi</div>
               </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
               <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Award size={24} />
               </div>
               <div>
                  <div className="text-2xl font-bold text-slate-800">%{analyticsData.winRate}</div>
                  <div className="text-sm text-slate-500">Kazanma Oranı</div>
               </div>
            </div>
         </div>

         {/* Pie Chart Column */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
               <PieIcon size={16} /> Durum Dağılımı
            </h3>
            <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={analyticsData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {analyticsData.pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Bar Chart Column */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
               <TrendingUp size={16} /> Finansal Analiz (Tahmini Bedel)
            </h3>
            <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.barData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} interval={0} />
                     <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000000}M`} fontSize={10} />
                     <RechartsTooltip formatter={(value: number) => `₺${value.toLocaleString()}`} cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                     <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
         <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 flex-1">
            <Search size={20} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="İhale adı, kurum veya İKN ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
            />
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl">
            {['Tümü', 'Hazırlık', 'Teklif Verildi', 'Kazanıldı', 'Kaybedildi'].map(f => (
               <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  {f}
               </button>
            ))}
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredTenders.map(tender => {
          const daysLeft = getDaysRemaining(tender.date);
          const isUpcoming = daysLeft >= 0 && tender.status === 'Hazırlık';
          const isProcessing = analyzingId === tender.id;
          
          return (
            <div key={tender.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
               {/* Status Badge */}
               <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-xs font-bold ${getStatusColor(tender.status)}`}>
                  {tender.status}
               </div>

               <div className="flex justify-between items-start mb-4 pr-10">
                  <div>
                     <h3 className="text-lg font-bold text-slate-800 mb-1">{tender.name}</h3>
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Building2 size={16} className="text-slate-400" />
                        <span className="font-semibold">{tender.authority}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">İKN: {tender.registrationNumber}</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <div className="text-xs text-slate-500 uppercase font-bold mb-1">Tahmini Bedel</div>
                     <div className="font-bold text-slate-800">₺{tender.estimatedBudget.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <div className="text-xs text-slate-500 uppercase font-bold mb-1">Geçici Teminat</div>
                     <div className="font-bold text-slate-800">₺{tender.bondAmount.toLocaleString()}</div>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                     <Calendar size={16} className="text-slate-400" />
                     <span>{tender.date}</span>
                     <span className="text-slate-300">|</span>
                     <Clock size={16} className="text-slate-400" />
                     <span>{tender.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                     <MapPin size={16} className="text-slate-400" />
                     <span>{tender.location}</span>
                  </div>
               </div>

               {/* Footer / Timer */}
               <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex gap-2">
                    {isUpcoming ? (
                       <div className="flex items-center gap-2 text-orange-600 font-bold text-sm bg-orange-50 px-3 py-1.5 rounded-lg">
                          <Timer size={18} />
                          {daysLeft === 0 ? 'Bugün' : `${daysLeft} gün kaldı`}
                       </div>
                    ) : (
                       <div className="text-sm text-slate-400 italic py-1.5">Tarih geçti veya tamamlandı</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button
                        onClick={() => handleAnalyze(tender)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                     >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isProcessing ? 'Analiz Ediliyor' : 'AI Analiz'}
                     </button>
                     <button 
                        onClick={() => { if(confirm('İhaleyi silmek istediğinize emin misiniz?')) onDelete(tender.id) }}
                        className="text-slate-400 hover:text-red-500 text-sm font-medium px-2 py-1.5 rounded hover:bg-slate-50 transition-colors"
                     >
                        Sil
                     </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Yeni İhale Takibi Oluştur</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İhale Adı / Konusu</label>
                  <input type="text" value={newTender.name} onChange={(e) => setNewTender({...newTender, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="Örn: 24 Derslikli Okul İnşaatı" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kurum / İdare</label>
                    <input type="text" value={newTender.authority} onChange={(e) => setNewTender({...newTender, authority: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="Örn: YİKOB" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">İhale Kayıt No (İKN)</label>
                    <input type="text" value={newTender.registrationNumber} onChange={(e) => setNewTender({...newTender, registrationNumber: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="2024/..." />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Yaklaşık Maliyet (₺)</label>
                    <input type="number" value={newTender.estimatedBudget} onChange={(e) => setNewTender({...newTender, estimatedBudget: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Geçici Teminat (₺)</label>
                    <input type="number" value={newTender.bondAmount} onChange={(e) => setNewTender({...newTender, bondAmount: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">İhale Tarihi</label>
                    <input type="date" value={newTender.date} onChange={(e) => setNewTender({...newTender, date: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Saat</label>
                    <input type="time" value={newTender.time} onChange={(e) => setNewTender({...newTender, time: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İhale Yeri / Adres</label>
                  <input type="text" value={newTender.location} onChange={(e) => setNewTender({...newTender, location: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama / Notlar</label>
                  <textarea value={newTender.description} onChange={(e) => setNewTender({...newTender, description: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 h-24 resize-none" />
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                  <select value={newTender.status} onChange={(e) => setNewTender({...newTender, status: e.target.value as any})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white">
                     <option value="Hazırlık">Hazırlık</option>
                     <option value="Teklif Verildi">Teklif Verildi</option>
                     <option value="Kazanıldı">Kazanıldı</option>
                     <option value="Kaybedildi">Kaybedildi</option>
                     <option value="İptal">İptal</option>
                  </select>
               </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">İptal</button>
               <button onClick={handleAdd} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">İhaleyi Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Result Modal */}
      {isAnalysisModalOpen && analysisResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                       <Sparkles size={24} />
                    </div>
                    <div>
                       <h3 className="font-bold text-lg text-slate-800">Akıllı İhale Analizi</h3>
                       <p className="text-xs text-slate-500">{selectedTenderForAnalysis?.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAnalysisModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Win Probability Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg shadow-indigo-200 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:2rem_2rem] opacity-20"></div>
                       <div className="relative z-10">
                          <h4 className="font-medium text-indigo-100 mb-2 uppercase tracking-wide text-xs">Kazanma Olasılığı</h4>
                          <div className="text-5xl font-bold mb-2">%{analysisResult.winProbability}</div>
                          <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-2">
                             <div className="bg-white h-full rounded-full" style={{ width: `${analysisResult.winProbability}%` }}></div>
                          </div>
                          <p className="text-xs text-indigo-100 opacity-80">Yapay zeka tahmini</p>
                       </div>
                    </div>
                    
                    {/* Strategy Card */}
                    <div className="col-span-2 bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-3 text-indigo-800 font-bold">
                          <Lightbulb size={20} />
                          <span>Strateji Önerisi</span>
                       </div>
                       <p className="text-slate-700 leading-relaxed text-lg italic">
                          "{analysisResult.strategy}"
                       </p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Risks List */}
                    <div>
                       <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                          <AlertTriangle className="text-red-500" />
                          Potansiyel Riskler
                       </h4>
                       <div className="space-y-3">
                          {analysisResult.risks.map((risk, idx) => (
                             <div key={idx} className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100 text-red-800">
                                <div className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0"></div>
                                <span className="text-sm font-medium">{risk}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Documents List */}
                    <div>
                       <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                          <FileText className="text-slate-500" />
                          Gereken Belgeler (Tahmini)
                       </h4>
                       <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200">
                          {analysisResult.requiredDocuments.map((doc, idx) => (
                             <div key={idx} className="flex items-center gap-3 p-3 border-b border-slate-200 last:border-0">
                                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                                <span className="text-sm text-slate-700">{doc}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                 <button 
                  onClick={() => setIsAnalysisModalOpen(false)}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors font-medium"
                 >
                    Kapat
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};