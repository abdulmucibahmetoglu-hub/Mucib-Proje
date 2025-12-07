
import React, { useState, useMemo } from 'react';
import { Project, UserRole, DailyReport } from '../types';
import { enhanceDailyReport } from '../services/geminiService';
import { getWeather } from '../services/weatherService';
import { Wand2, Printer, Loader2, FileText, Calendar, CloudSun, ClipboardList, Clock, Users, Truck, HardHat, File, Download, BarChart3, PieChart as PieIcon, Activity, AlertTriangle, FileSpreadsheet, Image as ImageIcon, Plus, Save, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DailyReportsProps {
  projects: Project[];
  history: DailyReport[];
  userRole: UserRole;
  onSaveReport?: (report: DailyReport) => void;
  onDeleteReport?: (id: string) => void;
}

export const DailyReports: React.FC<DailyReportsProps> = ({ projects, history, userRole, onSaveReport, onDeleteReport }) => {
  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Content State
  const [rawText, setRawText] = useState('');
  const [mpEmployer, setMpEmployer] = useState('');
  const [mpSub, setMpSub] = useState('');
  const [eqEmployer, setEqEmployer] = useState('');
  const [eqSub, setEqSub] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [reportImages, setReportImages] = useState<string[]>([]);
  const [weather, setWeather] = useState('');
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Mock Data for Dashboard
  const manpowerData = [
    { day: 'Pzt', count: 42, label: 'Pazartesi' },
    { day: 'Sal', count: 45, label: 'Salı' },
    { day: 'Çar', count: 48, label: 'Çarşamba' },
    { day: 'Per', count: 44, label: 'Perşembe' },
    { day: 'Cum', count: 50, label: 'Cuma' },
    { day: 'Cmt', count: 30, label: 'Cumartesi' },
    { day: 'Paz', count: 5, label: 'Pazar' },
  ];

  const projectDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(h => {
      counts[h.projectName] = (counts[h.projectName] || 0) + 1;
    });
    
    return projects.map((p, index) => ({
      name: p.name.split(' ')[0], 
      value: counts[p.name] || Math.floor(Math.random() * 5) + 1, 
      color: ['#f97316', '#3b82f6', '#22c55e', '#a855f7'][index % 4]
    }));
  }, [projects, history]);

  // --- Handlers ---

  const handleFetchWeather = async () => {
    setIsWeatherLoading(true);
    // Use coordinates for Istanbul (default) or ideally project coordinates
    const weatherInfo = await getWeather();
    setWeather(weatherInfo);
    setIsWeatherLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setReportDate(new Date().toISOString().split('T')[0]);
    setRawText('');
    setMpEmployer('');
    setMpSub('');
    setEqEmployer('');
    setEqSub('');
    setGeneratedReport('');
    setReportImages([]);
    setWeather('');
  };

  const loadReport = (report: DailyReport) => {
    setEditingId(report.id);
    setSelectedProjectId(report.projectId);
    
    let isoDate = report.date;
    if (report.date.includes('.')) {
       const parts = report.date.split('.');
       if(parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    setReportDate(isoDate);

    setWeather(report.weather);
    setMpEmployer(report.mpEmployer);
    setMpSub(report.mpSub);
    setEqEmployer(report.eqEmployer);
    setEqSub(report.eqSub);
    setRawText(report.rawContent);
    setGeneratedReport(report.formattedContent);
    setReportImages(report.images || []);
  };

  const handleEnhance = async () => {
    if (!rawText.trim() || !selectedProject) return;
    setIsGenerating(true);
    
    const displayDate = new Date(reportDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const result = await enhanceDailyReport(
      selectedProject.name,
      displayDate,
      rawText,
      weather,
      mpEmployer,
      mpSub,
      eqEmployer,
      eqSub
    );
    
    setGeneratedReport(result);
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (!selectedProject || !generatedReport) return;

    const d = new Date(reportDate);
    const displayDate = d.toLocaleDateString('tr-TR'); 

    const reportToSave: DailyReport = {
      id: editingId || Date.now().toString(),
      projectId: selectedProjectId,
      projectName: selectedProject.name,
      date: displayDate, 
      weather,
      mpEmployer,
      mpSub,
      eqEmployer,
      eqSub,
      rawContent: rawText,
      formattedContent: generatedReport,
      images: reportImages
    };

    if (onSaveReport) {
      onSaveReport(reportToSave);
      if (!editingId) resetForm(); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        setReportImages([...reportImages, imageUrl]);
     }
  };

  const handleRemoveImage = (index: number) => {
     setReportImages(reportImages.filter((_, i) => i !== index));
  };

  // --- Export / Print Logic ---

  const handleDownloadExcel = (historyItem?: DailyReport) => {
    const report = historyItem || {
       projectName: selectedProject?.name,
       date: new Date(reportDate).toLocaleDateString('tr-TR'),
       formattedContent: generatedReport,
       mpEmployer, mpSub, eqEmployer, eqSub, weather
    }; 

    if (!report.projectName) return;
    
    const rows = [
      ["RAPOR TÜRÜ", "GÜNLÜK FAALİYET RAPORU"],
      ["TARİH", report.date],
      ["PROJE", report.projectName],
      ["HAVA DURUMU", report.weather],
      [],
      ["--- KAYNAK KULLANIMI ---", ""],
      ["PERSONEL (İŞVEREN)", report.mpEmployer],
      ["PERSONEL (TAŞERON)", report.mpSub],
      ["EKİPMAN (İŞVEREN)", report.eqEmployer],
      ["EKİPMAN (TAŞERON)", report.eqSub],
      [],
      ["--- RAPOR İÇERİĞİ ---", ""],
      ...(report.formattedContent || "").split('\n').map(line => [line.replace(/"/g, '""')])
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapor_${report.projectName}_${report.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (historyItem?: DailyReport) => {
    const report = historyItem || {
       projectName: selectedProject?.name,
       projectId: selectedProjectId,
       date: new Date(reportDate).toLocaleDateString('tr-TR'),
       formattedContent: generatedReport,
       mpEmployer, mpSub, eqEmployer, eqSub, weather, images: reportImages
    };

    const loc = projects.find(p => p.id === report.projectId)?.location || '-';

    const printWindow = window.open('', '', 'width=800,height=1000');
    if (!printWindow) return;

    const formattedContent = (report.formattedContent || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^(#|\d\.)\s+(.*)/gm, '<h3 style="margin-top:20px; border-bottom: 1px solid #ccc; padding-bottom: 5px; color: #222;">$2</h3>')
      .replace(/\n/g, '<br>');
    
    const imagesHtml = (report.images && report.images.length > 0) ? `
      <div style="margin-top: 30px; page-break-inside: avoid;">
        <h3 style="border-bottom: 1px solid #ccc;">SAHA GÖRSELLERİ</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
          ${report.images.map(img => `<img src="${img}" style="width: 48%; height: 200px; object-fit: cover; border: 1px solid #ddd;" />`).join('')}
        </div>
      </div>
    ` : '';

    const content = `
      <html>
        <head>
          <title>Rapor - ${report.date}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px double #000; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .sub-header { display: flex; justify-content: space-between; margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 14px; }
            .info-box { border: 1px solid #ddd; padding: 10px; width: 48%; }
            .resources-table { width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 12px; font-family: Arial, sans-serif; }
            .resources-table td, .resources-table th { border: 1px solid #999; padding: 4px 8px; }
            .resources-table th { background: #eee; text-align: left; }
            .content { font-size: 14px; text-align: justify; margin-top: 20px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; page-break-inside: avoid; }
            .sign-area { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 12px; }
            h3 { font-family: Arial, sans-serif; font-size: 16px; margin-top: 25px; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">SiteMaster İnşaat A.Ş.</div>
            <div>GÜNLÜK FAALİYET RAPORU</div>
          </div>

          <div class="sub-header">
            <div class="info-box">
              <strong>Proje:</strong> ${report.projectName}<br>
              <strong>Lokasyon:</strong> ${loc}<br>
              <strong>Tarih:</strong> ${report.date}
            </div>
            <div class="info-box">
              <strong>Hava Durumu:</strong> ${report.weather}<br>
              <table class="resources-table">
                <tr><th colspan="2">PERSONEL MEVCUDU</th></tr>
                <tr><td>İşveren</td><td>${report.mpEmployer}</td></tr>
                <tr><td>Taşeron</td><td>${report.mpSub}</td></tr>
                <tr><th colspan="2">EKİPMAN / ARAÇ</th></tr>
                <tr><td>İşveren</td><td>${report.eqEmployer}</td></tr>
                <tr><td>Taşeron</td><td>${report.eqSub}</td></tr>
              </table>
            </div>
          </div>

          <div class="content">
            ${formattedContent}
          </div>
          
          ${imagesHtml}

          <div class="footer">
            <div class="sign-area">
              <strong>Düzenleyen</strong><br>Saha Mühendisi<br>(İmza)
            </div>
            <div class="sign-area">
              <strong>Onaylayan</strong><br>Proje Müdürü<br>(İmza)
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto bg-slate-50">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Günlük Şantiye Raporları</h2>
          <p className="text-slate-500 mt-1">Saha notlarını profesyonel, imzalanabilir raporlara dönüştürün.</p>
        </div>
        <button 
          onClick={resetForm}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
        >
          <Plus size={18} />
          Yeni Rapor Oluştur
        </button>
      </header>

      {/* DASHBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ClipboardList size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{history.length}</div>
              <div className="text-sm text-slate-500">Toplam Rapor</div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">38</div>
              <div className="text-sm text-slate-500">Ort. Personel</div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">0</div>
              <div className="text-sm text-slate-500">İSG Olayı (Haftalık)</div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Manpower Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
             <BarChart3 size={16} /> Haftalık Personel Mevcudu
           </h3>
           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={manpowerData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="count" name="Personel Sayısı" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Pie Chart: Reports by Project */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
             <PieIcon size={16} /> Rapor Dağılımı
           </h3>
           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={projectDistData}
                       cx="50%"
                       cy="50%"
                       innerRadius={40}
                       outerRadius={60}
                       paddingAngle={5}
                       dataKey="value"
                    >
                       {projectDistData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* EDITOR SECTION */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* INPUT COLUMN (Left) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
           {/* PDF History List */}
           <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 overflow-y-auto max-h-[300px]">
             <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
               <FileText size={14} /> Geçmiş Raporlar & Düzenleme
             </h3>
             <div className="space-y-2">
                {history.map(item => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer ${editingId === item.id ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200 hover:border-orange-300'}`}
                    onClick={() => loadReport(item)}
                  >
                    <div className={`p-2.5 rounded-lg transition-colors ${editingId === item.id ? 'bg-orange-100 text-orange-600' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
                      {editingId === item.id ? <Edit size={20} /> : <File size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-700 truncate">{item.date} - Raporu</div>
                      <div className="text-xs text-slate-400 truncate">{item.projectName}</div>
                    </div>
                    
                    {/* Action Buttons for History Item */}
                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownloadExcel(item); }}
                        title="Excel Olarak İndir"
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <FileSpreadsheet size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
                        title="PDF Yazdır"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
           </div>

           {/* Project & Meta Data Card */}
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                   {editingId ? <Edit size={16} className="text-orange-500" /> : <Plus size={16} className="text-green-500" />}
                   {editingId ? 'Raporu Düzenle' : 'Yeni Rapor Girişi'}
                </h3>
                {editingId && (
                   <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">DÜZENLEME MODU</span>
                )}
             </div>

             <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-1">Proje Seçimi</label>
                <select 
                   value={selectedProjectId}
                   onChange={(e) => setSelectedProjectId(e.target.value)}
                   className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50"
                 >
                   {projects.map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                   <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase mb-1">
                      <Calendar size={14} /> Tarih
                   </div>
                   <input 
                      type="date" 
                      value={reportDate} 
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full bg-transparent border-none text-sm font-semibold text-slate-700 outline-none p-0 cursor-pointer"
                   />
                </div>
                <div className="bg-yellow-50 p-2 rounded-xl border border-yellow-100">
                   <div className="flex items-center justify-between text-yellow-800 text-xs font-bold uppercase mb-1">
                      <div className="flex items-center gap-2"><CloudSun size={14} /> Hava Durumu</div>
                      <button onClick={handleFetchWeather} className="hover:bg-yellow-200 p-1 rounded" title="Otomatik Getir">
                         {isWeatherLoading ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12} />}
                      </button>
                   </div>
                   <input 
                      type="text" 
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="w-full bg-transparent border-none text-sm font-semibold text-slate-700 outline-none p-0"
                      placeholder="Örn: Güneşli, 24°C"
                   />
                </div>
             </div>

             <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                         <Users size={14} /> Personel (İşveren)
                      </label>
                      <input 
                        type="text" 
                        value={mpEmployer}
                        onChange={(e) => setMpEmployer(e.target.value)}
                        placeholder="Örn: 2 Müh, 1 Bekçi"
                        className="w-full p-2 rounded-lg border border-slate-300 text-sm focus:border-orange-500 outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                         <Users size={14} className="text-slate-400" /> Personel (Taşeron)
                      </label>
                      <input 
                        type="text" 
                        value={mpSub}
                        onChange={(e) => setMpSub(e.target.value)}
                        placeholder="Örn: 20 Demirci"
                        className="w-full p-2 rounded-lg border border-slate-300 text-sm focus:border-orange-500 outline-none"
                      />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                         <Truck size={14} /> Ekipman (İşveren)
                      </label>
                      <input 
                        type="text" 
                        value={eqEmployer}
                        onChange={(e) => setEqEmployer(e.target.value)}
                        placeholder="Örn: 1 Binek Araç"
                        className="w-full p-2 rounded-lg border border-slate-300 text-sm focus:border-orange-500 outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                         <Truck size={14} className="text-slate-400" /> Ekipman (Taşeron)
                      </label>
                      <input 
                        type="text" 
                        value={eqSub}
                        onChange={(e) => setEqSub(e.target.value)}
                        placeholder="Örn: 1 Kule Vinç"
                        className="w-full p-2 rounded-lg border border-slate-300 text-sm focus:border-orange-500 outline-none"
                      />
                   </div>
                </div>
             </div>
           </div>

           {/* Notes Input Card */}
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-[300px]">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <FileText size={18} className="text-orange-500" />
                 Saha Notları (Taslak)
               </h3>
               <span className="text-xs text-slate-400">Detaylı yazın, AI düzenlesin.</span>
             </div>
             <textarea
               value={rawText}
               onChange={(e) => setRawText(e.target.value)}
               placeholder="- B Blok 2. kat kolon betonları döküldü (C35, 40m3)&#10;- Demirci ekibi 3. kat döşeme donatılarına başladı&#10;- Kule vinç sabah 1 saat arıza yaptı, tamir edildi&#10;- İş güvenliği eğitimi verildi (Yüksekte çalışma)..."
               className="flex-1 w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none text-slate-700 text-sm leading-relaxed"
             />
             
             {/* Image Upload */}
             <div className="mt-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <input 
                    type="file" 
                    id="report-image-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload} 
                  />
                  <label 
                    htmlFor="report-image-upload"
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    <ImageIcon size={14} /> Fotoğraf Ekle
                  </label>
                  {reportImages.map((img, idx) => (
                    <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <X size={12} />
                        </button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="mt-4 flex justify-end">
               <button
                 onClick={handleEnhance}
                 disabled={isGenerating || !rawText.trim()}
                 className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center sm:w-auto"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                 {isGenerating ? 'Hazırlanıyor...' : 'AI ile Düzenle'}
               </button>
             </div>
           </div>
        </div>

        {/* OUTPUT COLUMN (Right) */}
        <div className="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden relative min-h-[800px]">
           {/* Preview Toolbar */}
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                 <ClipboardList size={20} className="text-slate-600" />
                 <span className="font-bold text-slate-700">Rapor Önizleme</span>
                 {editingId && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">DÜZENLENİYOR</span>}
              </div>
              <div className="flex gap-2">
                {generatedReport && (
                  <>
                    <button 
                      onClick={() => handleDownloadExcel()}
                      className="p-2 text-green-600 bg-white border border-slate-200 hover:bg-green-50 rounded-lg transition-colors"
                      title="Excel İndir"
                    >
                      <FileSpreadsheet size={18} />
                    </button>
                    <button 
                      onClick={() => handlePrint()}
                      className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                      title="PDF Yazdır"
                    >
                      <Printer size={18} />
                    </button>
                  </>
                )}
                <button 
                  onClick={handleSave}
                  disabled={!generatedReport}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-orange-900/10 disabled:opacity-50 disabled:shadow-none"
                >
                  <Save size={18} />
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
           </div>
           
           {/* Paper Preview */}
           <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
             {generatedReport ? (
               <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg p-[20mm] text-slate-900 font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-4">
                 {/* Paper Header */}
                 <div className="text-center border-b-2 border-double border-slate-800 pb-6 mb-8">
                    <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">SiteMaster İnşaat A.Ş.</h1>
                    <h2 className="text-lg font-semibold">GÜNLÜK FAALİYET RAPORU</h2>
                 </div>

                 {/* Info Grid */}
                 <div className="flex text-xs font-sans border border-slate-300 mb-8">
                    <div className="w-1/2 border-r border-slate-300 p-3 space-y-1">
                       <div><strong>PROJE:</strong> {selectedProject?.name}</div>
                       <div><strong>LOKASYON:</strong> {selectedProject?.location}</div>
                       <div><strong>TARİH:</strong> {new Date(reportDate).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div className="w-1/2 p-3 bg-slate-50">
                       <div className="mb-2"><strong>HAVA:</strong> {weather}</div>
                       
                       <table className="w-full border-collapse text-[10px] border border-slate-300">
                          <tbody>
                            <tr>
                               <td className="border border-slate-300 p-1 bg-slate-100 font-bold">PERSONEL</td>
                               <td className="border border-slate-300 p-1 font-bold">İşveren:</td>
                               <td className="border border-slate-300 p-1">{mpEmployer}</td>
                               <td className="border border-slate-300 p-1 font-bold">Taşeron:</td>
                               <td className="border border-slate-300 p-1">{mpSub}</td>
                            </tr>
                            <tr>
                               <td className="border border-slate-300 p-1 bg-slate-100 font-bold">EKİPMAN</td>
                               <td className="border border-slate-300 p-1 font-bold">İşveren:</td>
                               <td className="border border-slate-300 p-1">{eqEmployer}</td>
                               <td className="border border-slate-300 p-1 font-bold">Taşeron:</td>
                               <td className="border border-slate-300 p-1">{eqSub}</td>
                            </tr>
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* AI Content */}
                 <div className="prose prose-slate max-w-none text-sm text-justify">
                   <div className="whitespace-pre-wrap font-sans">
                     {generatedReport}
                   </div>
                 </div>

                 {/* Images Section */}
                 {reportImages.length > 0 && (
                    <div className="mt-8 border-t border-slate-200 pt-4 page-break-avoid">
                       <h3 className="font-sans font-bold text-sm mb-2 text-slate-800">SAHA GÖRSELLERİ</h3>
                       <div className="flex flex-wrap gap-2">
                          {reportImages.map((img, idx) => (
                             <div key={idx} className="w-[48%] h-40 border border-slate-300 p-1">
                                <img src={img} className="w-full h-full object-cover" />
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* Signature Area */}
                 <div className="mt-20 flex justify-between px-10 page-break-avoid">
                    <div className="text-center">
                       <div className="mb-8 font-bold text-xs uppercase">Düzenleyen</div>
                       <div className="border-t border-slate-800 pt-2 w-32 text-xs">Saha Şefi</div>
                    </div>
                    <div className="text-center">
                       <div className="mb-8 font-bold text-xs uppercase">Onaylayan</div>
                       <div className="border-t border-slate-800 pt-2 w-32 text-xs">Proje Müdürü</div>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center text-slate-400 mt-20">
                 <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                   <HardHat size={40} className="text-slate-200" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-500">Rapor Bekleniyor</h3>
                 <p className="max-w-xs text-center text-sm mt-2">
                   Sol taraftan proje verilerini ve notlarınızı girip "AI ile Düzenle" butonuna basın veya geçmiş bir rapor dosyasını seçin.
                 </p>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};
