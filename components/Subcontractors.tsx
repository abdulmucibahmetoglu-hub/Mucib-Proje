import React, { useState, useMemo } from 'react';
import { Subcontractor, Contract, Project, UserRole } from '../types';
import { Users, Plus, X, Trash2, Phone, Mail, FileText, Search, Building2, Star, Award, TrendingUp, DollarSign, LayoutDashboard, List, BarChart3, Medal, Crown, ArrowUpRight, ArrowDownRight, Activity, Printer, Image } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart, Area } from 'recharts';

interface SubcontractorsProps {
  subcontractors: Subcontractor[];
  contracts?: Contract[];
  projects?: Project[];
  onAdd: (sub: Subcontractor) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Subcontractor>) => void;
  userRole: UserRole;
}

export const Subcontractors: React.FC<SubcontractorsProps> = ({ 
  subcontractors, 
  contracts = [], 
  projects = [],
  onAdd, 
  onDelete,
  onUpdate,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'analysis'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnalysisItem, setSelectedAnalysisItem] = useState<string>('');
  
  const [newSub, setNewSub] = useState<Partial<Subcontractor>>({
    name: '',
    taxId: '',
    trade: '',
    phone: '',
    email: '',
    contactPerson: '',
    rating: 8.0,
    avatarUrl: ''
  });

  // --- STATS & AWARDS LOGIC ---
  const stats = useMemo(() => {
    const totalSubs = subcontractors.length;
    const activeContractsCount = contracts.filter(c => c.status === 'Aktif').length;
    const avgRating = totalSubs > 0 
      ? (subcontractors.reduce((acc, curr) => acc + (curr.rating || 0), 0) / totalSubs).toFixed(1)
      : '0.0';

    // Sub of the Month (Highest current rating)
    const subOfMonth = [...subcontractors].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    
    // Sub of the Year (Highest total score - mock logic)
    const subOfYear = [...subcontractors].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))[0];

    return { totalSubs, activeContractsCount, avgRating, subOfMonth, subOfYear };
  }, [subcontractors, contracts]);

  // --- UNIT PRICE ANALYSIS LOGIC ---
  const analysisStats = useMemo(() => {
    const itemGroups: Record<string, { price: number, date: string, sub: string, project: string }[]> = {};

    contracts.forEach(c => {
       c.items.forEach(i => {
          if (!itemGroups[i.description]) {
             itemGroups[i.description] = [];
          }
          const sub = subcontractors.find(s => s.id === c.subcontractorId);
          const proj = projects.find(p => p.id === c.projectId);
          itemGroups[i.description].push({
             price: i.unitPrice,
             date: c.startDate,
             sub: sub?.name || 'Bilinmiyor',
             project: proj?.name || 'Bilinmiyor'
          });
       });
    });

    const summary = Object.keys(itemGroups).map(key => {
       const prices = itemGroups[key].map(x => x.price);
       const min = Math.min(...prices);
       const max = Math.max(...prices);
       const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
       const variance = max - min;
       const variancePercent = min > 0 ? (variance / min) * 100 : 0;

       return {
          name: key,
          count: prices.length,
          min,
          max,
          avg,
          variance,
          variancePercent,
          history: itemGroups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
       };
    });

    const mostVolatile = [...summary].sort((a, b) => b.variance - a.variance)[0];
    const sortedByPrice = [...summary].sort((a, b) => b.avg - a.avg);

    return { summary, mostVolatile, sortedByPrice, allItems: Object.keys(itemGroups).sort() };
  }, [contracts, subcontractors, projects]);


  // Chart Data for Selected Item Trend
  const selectedItemTrendData = useMemo(() => {
    if (!selectedAnalysisItem) return [];
    
    const itemData = analysisStats.summary.find(s => s.name === selectedAnalysisItem);
    if (!itemData) return [];

    return itemData.history.map(h => ({
       date: h.date,
       price: h.price,
       label: `${h.sub} (${h.project})`
    }));
  }, [selectedAnalysisItem, analysisStats]);

  const handleAdd = () => {
    if (!newSub.name || !newSub.taxId) return;
    
    onAdd({
      id: Date.now().toString(),
      name: newSub.name!,
      taxId: newSub.taxId!,
      trade: newSub.trade || 'Genel',
      phone: newSub.phone,
      email: newSub.email,
      contactPerson: newSub.contactPerson,
      rating: Number(newSub.rating),
      totalScore: Math.floor(Math.random() * 100),
      avatarUrl: newSub.avatarUrl
    });
    
    setIsModalOpen(false);
    setNewSub({ name: '', taxId: '', trade: '', phone: '', email: '', contactPerson: '', rating: 8.0, avatarUrl: '' });
  };

  const handleRatingChange = (id: string, newRating: number) => {
    if (onUpdate) onUpdate(id, { rating: newRating });
  };

  const generateAwardPDF = (sub: Subcontractor, title: string) => {
    const printWindow = window.open('', '', 'width=1100,height=850');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Başarı Sertifikası</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5; }
            .certificate-container {
              width: 1000px;
              height: 700px;
              background-color: #fff;
              border: 10px solid #cc8e35;
              padding: 40px;
              box-sizing: border-box;
              position: relative;
              text-align: center;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .inner-border {
              width: 100%;
              height: 100%;
              border: 2px solid #cc8e35;
              padding: 40px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .header { font-size: 50px; font-weight: bold; color: #cc8e35; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px; }
            .sub-header { font-size: 24px; font-style: italic; color: #555; margin-bottom: 40px; }
            .recipient { font-size: 40px; font-weight: bold; color: #333; margin-bottom: 20px; text-decoration: underline; text-decoration-color: #cc8e35; }
            .description { font-size: 18px; color: #666; max-width: 600px; margin: 0 auto 40px auto; line-height: 1.6; }
            .score-box { background: #fff8e1; border: 2px solid #ffecb3; padding: 10px 30px; display: inline-block; border-radius: 50px; margin-bottom: 50px; }
            .score-text { font-size: 20px; font-weight: bold; color: #ff6f00; }
            .footer { display: flex; justify-content: space-around; margin-top: 20px; }
            .sign-line { border-top: 1px solid #333; width: 250px; margin-top: 50px; font-size: 14px; color: #333; padding-top: 10px; }
            .logo { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); opacity: 0.1; font-size: 100px; font-weight: bold; color: #cc8e35; }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="inner-border">
              <div class="header">BAŞARI BELGESİ</div>
              <div class="sub-header">Bu belge, gösterdiği üstün performans ve kalite anlayışı nedeniyle</div>
              
              <div class="recipient">${sub.name}</div>
              
              <div class="description">
                firmasına, SiteMaster İnşaat A.Ş. bünyesinde yürütülen projelerdeki katkılarından dolayı 
                <strong>${title}</strong> unvanı ile takdim edilmiştir.
              </div>
              
              <div class="score-box">
                <span class="score-text">Performans Puanı: ${sub.rating} / 10</span>
              </div>
              
              <div class="footer">
                <div class="sign-block">
                  <div class="sign-title">Proje Direktörü</div>
                  <div class="sign-line">İmza</div>
                </div>
                <div class="sign-block">
                  <div class="sign-title">Tarih</div>
                  <div class="sign-line">${new Date().toLocaleDateString('tr-TR')}</div>
                </div>
              </div>
              
              <div class="logo">SITEMASTER</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const filteredSubs = subcontractors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.trade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Taşeron Yönetimi</h2>
          <p className="text-slate-500 mt-1">Performans değerlendirme, ödüllendirme ve birim fiyat analizi.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex">
             <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                <LayoutDashboard size={16} /> Dashboard
             </button>
             <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                <List size={16} /> Liste
             </button>
             <button onClick={() => setActiveTab('analysis')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                <BarChart3 size={16} /> Fiyat Analizi
             </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
          >
            <Plus size={18} />
            Ekle
          </button>
        </div>
      </header>

      {/* --- DASHBOARD TAB --- */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
                <div className="p-4 bg-white text-orange-600 rounded-xl shadow-sm border border-orange-100"><Building2 size={32} /></div>
                <div>
                   <div className="text-3xl font-bold text-slate-800">{stats.totalSubs}</div>
                   <div className="text-sm text-slate-600 font-medium">Kayıtlı Firma</div>
                </div>
             </div>
             <div className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
                <div className="p-4 bg-white text-orange-600 rounded-xl shadow-sm border border-orange-100"><FileText size={32} /></div>
                <div>
                   <div className="text-3xl font-bold text-slate-800">{stats.activeContractsCount}</div>
                   <div className="text-sm text-slate-600 font-medium">Aktif Sözleşme</div>
                </div>
             </div>
             <div className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
                <div className="p-4 bg-white text-orange-600 rounded-xl shadow-sm border border-orange-100"><Star size={32} /></div>
                <div>
                   <div className="text-3xl font-bold text-slate-800">{stats.avgRating}</div>
                   <div className="text-sm text-slate-600 font-medium">Ortalama Puan</div>
                </div>
             </div>
          </div>

          {/* Awards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Sub of the Month */}
             <div className="relative bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-8 text-white overflow-hidden shadow-xl shadow-orange-200 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-center gap-6 mb-6">
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shadow-inner overflow-hidden">
                         {stats.subOfMonth?.avatarUrl ? (
                           <img src={stats.subOfMonth.avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                         ) : <Medal size={48} className="text-yellow-200" />}
                      </div>
                      <div>
                         <div className="text-orange-100 text-sm font-bold uppercase tracking-widest mb-1">Performans Ödülü</div>
                         <h3 className="text-3xl font-bold mb-2">Ayın Taşeronu</h3>
                         {stats.subOfMonth ? (
                           <>
                             <div className="text-xl font-medium">{stats.subOfMonth.name}</div>
                             <div className="flex items-center gap-2 mt-2">
                                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                   <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                   {stats.subOfMonth.rating} / 10
                                </div>
                                <span className="text-sm text-orange-100">{stats.subOfMonth.trade}</span>
                             </div>
                           </>
                         ) : <div className="text-orange-200 italic">Veri yok</div>}
                      </div>
                   </div>
                   
                   {stats.subOfMonth && (
                     <button 
                       onClick={() => generateAwardPDF(stats.subOfMonth, "Ayın Taşeronu")}
                       className="mt-auto self-start bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-white/40"
                     >
                       <Printer size={16} />
                       Sertifika Yazdır
                     </button>
                   )}
                </div>
             </div>

             {/* Sub of the Year */}
             <div className="relative bg-gradient-to-br from-slate-800 to-black rounded-2xl p-8 text-white overflow-hidden shadow-xl shadow-slate-200 group">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-center gap-6 mb-6">
                      <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-orange-300 shadow-lg overflow-hidden">
                         {stats.subOfYear?.avatarUrl ? (
                           <img src={stats.subOfYear.avatarUrl} alt="Logo" className="w-full h-full object-cover opacity-90 mix-blend-multiply" />
                         ) : <Crown size={48} className="text-white" />}
                      </div>
                      <div>
                         <div className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-1">Prestij Ödülü</div>
                         <h3 className="text-3xl font-bold mb-2">Yılın Taşeronu</h3>
                         {stats.subOfYear ? (
                           <>
                             <div className="text-xl font-medium">{stats.subOfYear.name}</div>
                             <div className="flex items-center gap-2 mt-2">
                                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                                   {stats.subOfYear.totalScore} Puan
                                </div>
                                <span className="text-sm text-slate-400">Genel Başarı</span>
                             </div>
                           </>
                         ) : <div className="text-slate-500 italic">Veri yok</div>}
                      </div>
                   </div>
                   
                   {stats.subOfYear && (
                     <button 
                       onClick={() => generateAwardPDF(stats.subOfYear, "Yılın Taşeronu")}
                       className="mt-auto self-start bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-white/20"
                     >
                       <Printer size={16} />
                       Sertifika Yazdır
                     </button>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- LIST TAB --- */}
      {activeTab === 'list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
           {/* Search */}
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
              <Search size={20} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Firma adı veya iş kolu ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
              />
              <div className="text-sm font-medium text-slate-500">{filteredSubs.length} Firma</div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubs.map(sub => (
                <div key={sub.id} className="bg-orange-50 rounded-2xl p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow group relative">
                  <button 
                    onClick={() => { if(confirm('Silmek istediğinize emin misiniz?')) onDelete(sub.id) }}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 border border-orange-100 overflow-hidden">
                        {sub.avatarUrl ? (
                          <img src={sub.avatarUrl} alt={sub.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-orange-600">{sub.name.substring(0,2).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 line-clamp-1">{sub.name}</h3>
                        <span className="text-xs bg-white border border-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">{sub.trade}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Performans Puanı</span>
                        <span className="text-sm font-bold text-slate-800">{sub.rating} / 10</span>
                     </div>
                     <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-orange-100">
                        <div 
                           className={`h-full rounded-full ${Number(sub.rating) >= 9 ? 'bg-green-500' : Number(sub.rating) >= 7 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                           style={{ width: `${(Number(sub.rating) / 10) * 100}%` }}
                        ></div>
                     </div>
                     {onUpdate && (
                        <input 
                           type="range" 
                           min="0" 
                           max="10" 
                           step="0.1"
                           value={sub.rating || 0}
                           onChange={(e) => handleRatingChange(sub.id, parseFloat(e.target.value))}
                           className="w-full mt-2 accent-orange-600 opacity-20 hover:opacity-100 transition-opacity"
                           title="Puanı Düzenle"
                        />
                     )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-orange-200/50">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Users size={16} className="text-slate-400" />
                        <span>Yetkili: <span className="font-medium text-slate-800">{sub.contactPerson || '-'}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <FileText size={16} className="text-slate-400" />
                        <span className="font-mono">{sub.taxId}</span>
                      </div>
                      {sub.phone && (
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Phone size={16} className="text-slate-400" />
                            <span>{sub.phone}</span>
                        </div>
                      )}
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* --- ANALYSIS TAB --- */}
      {activeTab === 'analysis' && (
         <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            {/* Price Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-orange-50 p-5 rounded-2xl shadow-sm border border-orange-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={64} className="text-red-500" /></div>
                  <div className="relative z-10">
                     <div className="text-xs text-slate-500 font-bold uppercase mb-2">En Yüksek Fiyat Farkı</div>
                     {analysisStats.mostVolatile ? (
                        <>
                           <div className="text-xl font-bold text-slate-800 line-clamp-1">{analysisStats.mostVolatile.name}</div>
                           <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-2xl font-bold text-red-600">+{analysisStats.mostVolatile.variancePercent.toFixed(0)}%</span>
                              <span className="text-xs text-slate-400">Makas</span>
                           </div>
                           <div className="text-xs text-slate-500 mt-2">
                              Min: {analysisStats.mostVolatile.min.toLocaleString()}₺ - Max: {analysisStats.mostVolatile.max.toLocaleString()}₺
                           </div>
                        </>
                     ) : <div className="text-slate-400 italic text-sm">Veri yetersiz</div>}
                  </div>
               </div>
               
               <div className="bg-orange-50 p-5 rounded-2xl shadow-sm border border-orange-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64} className="text-green-500" /></div>
                  <div className="relative z-10">
                     <div className="text-xs text-slate-500 font-bold uppercase mb-2">En Pahalı Ortalama</div>
                     {analysisStats.sortedByPrice[0] ? (
                        <>
                           <div className="text-xl font-bold text-slate-800 line-clamp-1">{analysisStats.sortedByPrice[0].name}</div>
                           <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-2xl font-bold text-slate-700">{analysisStats.sortedByPrice[0].avg.toLocaleString()}₺</span>
                              <span className="text-xs text-slate-400">Ort.</span>
                           </div>
                           <div className="text-xs text-slate-500 mt-2">
                              Toplam {analysisStats.sortedByPrice[0].count} sözleşmede geçiyor.
                           </div>
                        </>
                     ) : <div className="text-slate-400 italic text-sm">Veri yetersiz</div>}
                  </div>
               </div>

               <div className="bg-orange-50 p-5 rounded-2xl shadow-sm border border-orange-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><List size={64} className="text-blue-500" /></div>
                  <div className="relative z-10">
                     <div className="text-xs text-slate-500 font-bold uppercase mb-2">Analiz Edilen Kalem</div>
                     <div className="text-4xl font-bold text-slate-800">{analysisStats.allItems.length}</div>
                     <div className="text-sm text-slate-500 mt-2">Otomatik taranan benzersiz iş kalemleri.</div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Volatility Chart */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <TrendingUp size={20} className="text-orange-500" />
                     Fiyat Makası (Min-Max)
                  </h3>
                  <div className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analysisStats.summary.slice(0, 5)} layout="vertical" margin={{left: 20}}>
                           <CartesianGrid stroke="#f5f5f5" />
                           <XAxis type="number" />
                           <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                           <Tooltip />
                           <Legend />
                           <Bar dataKey="min" name="En Düşük" stackId="a" fill="#22c55e" barSize={20} />
                           <Bar dataKey="variance" name="Fark (Makas)" stackId="a" fill="#cbd5e1" barSize={20} />
                        </ComposedChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Detailed Analysis Section */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Detaylı İnceleme İçin Kalem Seç</label>
                     <select 
                        value={selectedAnalysisItem} 
                        onChange={(e) => setSelectedAnalysisItem(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
                     >
                        <option value="">Seçiniz...</option>
                        {analysisStats.allItems.map(item => (
                           <option key={item} value={item}>{item}</option>
                        ))}
                     </select>
                  </div>

                  {selectedAnalysisItem && selectedItemTrendData.length > 0 ? (
                     <div className="flex-1">
                        <div className="text-xs text-slate-400 font-bold uppercase mb-2 text-center">Zamanla Fiyat Değişimi</div>
                        <div className="h-48 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={selectedItemTrendData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="date" tick={{fontSize: 10}} />
                                 <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                                 <Tooltip 
                                    content={({ active, payload, label }) => {
                                       if (active && payload && payload.length) {
                                          return (
                                             <div className="bg-white p-2 border border-slate-200 shadow-lg rounded-lg text-xs">
                                                <div className="font-bold">{label}</div>
                                                <div className="text-orange-600 font-bold">{payload[0].value} ₺</div>
                                                <div className="text-slate-500">{payload[0].payload.label}</div>
                                             </div>
                                          );
                                       }
                                       return null;
                                    }}
                                 />
                                 <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <DollarSign size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">Analiz için yukarıdan kalem seçiniz.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Yeni Taşeron Firma</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Firma Adı</label>
                  <input type="text" value={newSub.name} onChange={(e) => setNewSub({...newSub, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Yetkili Kişi</label>
                  <input type="text" value={newSub.contactPerson} onChange={(e) => setNewSub({...newSub, contactPerson: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vergi No</label>
                    <input type="text" value={newSub.taxId} onChange={(e) => setNewSub({...newSub, taxId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">İş Kolu</label>
                    <input type="text" value={newSub.trade} onChange={(e) => setNewSub({...newSub, trade: e.target.value})} placeholder="Örn: Elektrik, Kaba Yapı" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                     <input type="tel" value={newSub.phone} onChange={(e) => setNewSub({...newSub, phone: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Puanı</label>
                     <input type="number" max="10" min="0" step="0.1" value={newSub.rating} onChange={(e) => setNewSub({...newSub, rating: parseFloat(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Posta</label>
                  <input type="email" value={newSub.email} onChange={(e) => setNewSub({...newSub, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logo / Fotoğraf URL</label>
                  <div className="flex gap-2">
                     <div className="relative flex-1">
                        <Image className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input type="text" value={newSub.avatarUrl} onChange={(e) => setNewSub({...newSub, avatarUrl: e.target.value})} placeholder="https://..." className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                     </div>
                  </div>
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">İptal</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};