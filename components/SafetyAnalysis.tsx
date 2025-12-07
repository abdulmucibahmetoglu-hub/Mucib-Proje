
import React, { useState } from 'react';
import { analyzeSafetyRisks } from '../services/geminiService';
import { RiskAnalysis, SafetyReport, UserRole } from '../types';
import { AlertTriangle, ShieldCheck, Search, Loader2, ArrowRight, Printer, FileText, CheckCircle2, HardHat, ClipboardList, Save, History, Download, FileType } from 'lucide-react';

interface SafetyAnalysisProps {
  userRole?: UserRole;
}

export const SafetyAnalysis: React.FC<SafetyAnalysisProps> = ({ userRole }) => {
  // Input State
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [preparedBy, setPreparedBy] = useState('');
  const [description, setDescription] = useState('');
  
  // Logic State
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<SafetyReport[]>([]);

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setIsLoading(true);
    const result = await analyzeSafetyRisks(description);
    setAnalysis(result);
    setIsLoading(false);
  };

  const handleSave = () => {
    if (!analysis || !projectName) {
       alert("Lütfen önce bir analiz yapın ve proje adını girin.");
       return;
    }
    const newReport: SafetyReport = {
       id: Date.now().toString(),
       projectName,
       location,
       date,
       preparedBy,
       jobDescription: description,
       analysis
    };
    setHistory([newReport, ...history]);
    alert("Rapor başarıyla kaydedildi.");
  };

  const loadReport = (report: SafetyReport) => {
     setProjectName(report.projectName);
     setLocation(report.location);
     setDate(report.date);
     setPreparedBy(report.preparedBy);
     setDescription(report.jobDescription);
     setAnalysis(report.analysis);
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'KRİTİK';
      case 'high': return 'YÜKSEK';
      case 'medium': return 'ORTA';
      case 'low': return 'DÜŞÜK';
      default: return level;
    }
  };

  const handlePrint = () => {
     if(!analysis) return;
     const printWindow = window.open('', '', 'width=900,height=1000');
     if (!printWindow) return;

     const content = `
       <html>
         <head>
           <title>Risk Analizi Raporu</title>
           <style>
             body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
             .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
             h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
             h2 { margin: 10px 0 0; font-size: 16px; color: #555; }
             .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
             .meta-table td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
             .meta-table strong { display: block; font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 2px; }
             .section-title { background: #eee; padding: 8px; font-weight: bold; border-left: 5px solid #orange; margin-top: 20px; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
             .risk-badge { display: inline-block; padding: 10px 20px; border-radius: 5px; font-weight: bold; color: white; background-color: ${analysis.riskLevel === 'Critical' || analysis.riskLevel === 'High' ? '#ef4444' : analysis.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'}; }
             ul { margin: 0; padding-left: 20px; }
             li { margin-bottom: 5px; font-size: 13px; }
             .footer { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
             .sign-box { width: 200px; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px; }
           </style>
         </head>
         <body>
           <div class="header">
             <h1>Risk Değerlendirme Raporu</h1>
             <h2>SiteMaster İSG Yönetim Sistemi</h2>
           </div>

           <table class="meta-table">
             <tr>
               <td width="33%"><strong>Proje</strong> ${projectName}</td>
               <td width="33%"><strong>Lokasyon</strong> ${location}</td>
               <td width="33%"><strong>Tarih</strong> ${date}</td>
             </tr>
             <tr>
               <td colspan="2"><strong>Yapılacak İş Tanımı</strong> ${description}</td>
               <td><strong>Hazırlayan</strong> ${preparedBy}</td>
             </tr>
           </table>

           <div style="text-align: center; margin: 30px 0;">
             <strong>GENEL RİSK SEVİYESİ</strong><br><br>
             <span class="risk-badge">${getRiskLabel(analysis.riskLevel)}</span>
           </div>

           <div class="section-title">Tespit Edilen Tehlikeler ve Riskler</div>
           <ul>${analysis.concerns.map(c => `<li>${c}</li>`).join('')}</ul>

           <div class="section-title">Alınması Gereken Önlemler</div>
           <ul>${analysis.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>

           <div class="section-title">Zorunlu KKD (Kişisel Koruyucu Donanım)</div>
           <ul>${analysis.ppe.map(p => `<li>${p}</li>`).join('')}</ul>

           <div class="section-title">Ekipman ve Prosedür Gereksinimleri</div>
           <ul>${analysis.requirements.map(r => `<li>${r}</li>`).join('')}</ul>

           <div class="footer">
             <div class="sign-box">
               <strong>Hazırlayan (İSG Uzmanı)</strong><br>İmza
             </div>
             <div class="sign-box">
               <strong>Onaylayan (Proje Müdürü)</strong><br>İmza
             </div>
             <div class="sign-box">
               <strong>Tebellüğ Eden (Formen)</strong><br>İmza
             </div>
           </div>
           
           <script>window.print();</script>
         </body>
       </html>
     `;
     printWindow.document.write(content);
     printWindow.document.close();
  };

  const handleDownloadDoc = () => {
    if (!analysis) return;
    
    // Simple HTML for Word export
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Risk Analizi</title></head>
      <body>
        <h1>RİSK DEĞERLENDİRME RAPORU</h1>
        <p><strong>Proje:</strong> ${projectName}</p>
        <p><strong>Tarih:</strong> ${date}</p>
        <p><strong>İş Tanımı:</strong> ${description}</p>
        <br/>
        <h2>RİSK SEVİYESİ: ${getRiskLabel(analysis.riskLevel)}</h2>
        <br/>
        <h3>Tehlikeler:</h3>
        <ul>${analysis.concerns.map(c => `<li>${c}</li>`).join('')}</ul>
        <h3>Önlemler:</h3>
        <ul>${analysis.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
        <h3>Zorunlu KKD:</h3>
        <ul>${analysis.ppe.map(p => `<li>${p}</li>`).join('')}</ul>
      </body>
      </html>
    `;
    
    const blob = new Blob(['\uFEFF', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Risk_Analizi_${projectName || 'Proje'}_${date}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Sidebar History */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
         <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <History size={20} className="text-orange-500" />
               Analiz Geçmişi
            </h3>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 && <div className="text-sm text-slate-400 text-center py-4">Henüz kayıtlı rapor yok.</div>}
            {history.map(item => (
               <button 
                  key={item.id} 
                  onClick={() => loadReport(item)}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-orange-300 hover:bg-orange-50 transition-all group"
               >
                  <div className="flex justify-between items-start mb-1">
                     <span className="font-semibold text-slate-700 text-sm truncate w-2/3">{item.projectName}</span>
                     <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.date}</span>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">{item.jobDescription}</div>
               </button>
            ))}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
         <div className="p-8">
            <header className="mb-8 flex justify-between items-end">
               <div>
                  <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                     <AlertTriangle size={32} className="text-orange-600" />
                     İSG Risk Analizi
                  </h2>
                  <p className="text-slate-500 mt-1">Yapay zeka destekli 5x5 Matrix uyumlu risk değerlendirmesi.</p>
               </div>
               <div className="flex gap-2">
                  <button 
                     onClick={handleSave}
                     disabled={!analysis}
                     className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                     <Save size={18} /> Kaydet
                  </button>
               </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {/* Left: Form */}
               <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-slate-400" />
                        Proje & İş Detayları
                     </h3>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proje Adı</label>
                           <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Örn: Vadi İstanbul" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hazırlayan</label>
                           <input type="text" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Ad Soyad" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lokasyon</label>
                           <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Blok A, Çatı" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarih</label>
                           <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Yapılacak İş Tanımı</label>
                        <textarea
                           value={description}
                           onChange={(e) => setDescription(e.target.value)}
                           placeholder="İşi detaylıca anlatın (Örn: 4. katta dış cephe iskelesi sökümü yapılacak. Hava rüzgarlı...)"
                           className="w-full h-32 p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
                        />
                     </div>

                     <div className="mt-4 flex justify-end">
                        <button
                           onClick={handleAnalyze}
                           disabled={isLoading || !description.trim()}
                           className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                        >
                           {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                           {isLoading ? 'Analiz Ediliyor...' : 'Risk Analizi Yap'}
                        </button>
                     </div>
                  </div>
               </div>

               {/* Right: Analysis Result */}
               <div className="space-y-6">
                  {analysis ? (
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4">
                        {/* Header */}
                        <div className={`p-6 border-b flex justify-between items-center ${getRiskColor(analysis.riskLevel)} bg-opacity-20`}>
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/50 rounded-full backdrop-blur-sm">
                                 <ShieldCheck size={28} />
                              </div>
                              <div>
                                 <div className="text-xs font-bold uppercase opacity-80">Risk Seviyesi</div>
                                 <h3 className="text-2xl font-bold">{getRiskLabel(analysis.riskLevel)}</h3>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={handleDownloadDoc} className="p-2 bg-white/50 hover:bg-white rounded-lg transition-colors" title="Word İndir"><FileType size={20}/></button>
                              <button onClick={handlePrint} className="p-2 bg-white/50 hover:bg-white rounded-lg transition-colors" title="PDF Yazdır"><Printer size={20}/></button>
                           </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                           {/* Concerns */}
                           <div>
                              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                 <AlertTriangle size={18} className="text-red-500" />
                                 Tehlikeler
                              </h4>
                              <ul className="space-y-2">
                                 {analysis.concerns.map((c, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                                       <span className="text-red-400 font-bold">•</span> {c}
                                    </li>
                                 ))}
                              </ul>
                           </div>

                           {/* Recommendations */}
                           <div>
                              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                 <CheckCircle2 size={18} className="text-green-500" />
                                 Alınacak Önlemler
                              </h4>
                              <ul className="space-y-2">
                                 {analysis.recommendations.map((r, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-600 bg-green-50 p-2 rounded-lg border border-green-100">
                                       <ArrowRight size={16} className="text-green-600 shrink-0 mt-0.5" /> {r}
                                    </li>
                                 ))}
                              </ul>
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                              {/* PPE */}
                              <div>
                                 <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-xs uppercase">
                                    <HardHat size={16} className="text-orange-500" />
                                    Zorunlu KKD
                                 </h4>
                                 <div className="flex flex-wrap gap-2">
                                    {analysis.ppe.map((p, i) => (
                                       <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">{p}</span>
                                    ))}
                                 </div>
                              </div>
                              {/* Requirements */}
                              <div>
                                 <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-xs uppercase">
                                    <ClipboardList size={16} className="text-blue-500" />
                                    Ekipman / İzin
                                 </h4>
                                 <div className="flex flex-wrap gap-2">
                                    {analysis.requirements.map((r, i) => (
                                       <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">{r}</span>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[400px]">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                           <AlertTriangle size={32} className="text-slate-300" />
                        </div>
                        <p className="font-medium">Analiz sonucu burada görünecek</p>
                        <p className="text-xs mt-1">Soldaki formu doldurup butona basın.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
