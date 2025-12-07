import React, { useState, useMemo } from 'react';
import { Contract, ContractItem, Project, Subcontractor, ContractClauses, UserRole } from '../types';
import { FileSignature, Plus, X, Trash2, Search, ArrowRight, Printer, Upload, CheckCircle2, Calendar, Scale, Briefcase, FileCheck, AlertCircle, Download, PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

interface ContractsProps {
  contracts: Contract[];
  projects: Project[];
  subcontractors: Subcontractor[];
  onAdd: (contract: Contract) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Contract>) => void;
  userRole: UserRole;
}

const DEFAULT_CLAUSES: ContractClauses = {
   generalTerms: "İşbu sözleşme, taraflar arasında aşağıda belirtilen şartlar dahilinde, projede belirtilen işlerin yapılması amacıyla düzenlenmiştir.",
   paymentTerms: "1. Hakedişler, yapılan imalatların metrajı üzerinden birim fiyatlar ile çarpılarak hesaplanır.\n2. Ödemeler, İdare tarafından hakedişin onaylanmasını müteakip 45 takvim günü içinde yapılacaktır.\n3. Hakedişlerden %5 oranında 'Geçici Kabul Kesintisi' yapılacaktır.",
   penaltyTerms: "1. Yüklenici, iş programına uymadığı her takvim günü için, sözleşme bedelinin %0.05'i (onbinde beş) oranında gecikme cezası ödemeyi kabul eder.\n2. Ceza tutarı ilk hakedişten kesilir.",
   safetyTerms: "1. Yüklenici, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu'na tam uyum sağlamak zorundadır.\n2. Sahada görevli tüm personel KKD (Kişisel Koruyucu Donanım) kullanmak zorundadır.\n3. İSG ihlallerinde uygulanacak cezalar İşveren'in İSG Talimatnamesi'ne göredir.",
   terminationTerms: "1. İşveren, Yüklenicinin taahhütlerini yerine getirmemesi durumunda 10 gün süreli noter ihtarı çekmek suretiyle sözleşmeyi tek taraflı feshetme hakkına sahiptir.\n2. Fesih durumunda teminat mektubu irad kaydedilir.",
   qualityTerms: "1. Tüm imalatlar TS 500, Deprem Yönetmeliği ve ilgili TSE standartlarına uygun yapılacaktır.\n2. Kullanılacak malzemeler için İşveren'den numune onayı alınması zorunludur."
};

export const Contracts: React.FC<ContractsProps> = ({ contracts, projects, subcontractors, onAdd, onDelete, onUpdate, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('dashboard');
  
  // New Contract State
  const [projectId, setProjectId] = useState('');
  const [subcontractorId, setSubcontractorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<ContractItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<ContractItem>>({ code: '', description: '', unit: '', unitPrice: 0 });
  const [clauses, setClauses] = useState<ContractClauses>(DEFAULT_CLAUSES);

  // Signed Doc Upload
  const [uploadContractId, setUploadContractId] = useState<string | null>(null);

  // Stats Logic
  const stats = useMemo(() => {
     const totalValue = contracts.reduce((acc, c) => acc + c.items.reduce((s, i) => s + i.unitPrice * 100, 0), 0); // Mock value estimation (qty assumed 100 for stats)
     const activeCount = contracts.filter(c => c.status === 'Aktif').length;
     
     const projectDistribution = projects.map(p => ({
        name: p.name.split(' ')[0],
        count: contracts.filter(c => c.projectId === p.id).length
     })).filter(p => p.count > 0);

     return { totalContracts: contracts.length, activeCount, totalValue, projectDistribution };
  }, [contracts, projects]);

  const calculateDuration = (start: string, end: string) => {
     if(!start || !end) return 0;
     const diff = new Date(end).getTime() - new Date(start).getTime();
     return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const handleAddItem = () => {
    if (!newItem.code || !newItem.description || !newItem.unitPrice) return;
    setItems([...items, { ...newItem, id: Date.now().toString() } as ContractItem]);
    setNewItem({ code: '', description: '', unit: '', unitPrice: 0 });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleCreateContract = () => {
    if (!projectId || !subcontractorId || items.length === 0) return;
    
    onAdd({
      id: Date.now().toString(),
      projectId,
      subcontractorId,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate,
      durationDays: calculateDuration(startDate, endDate),
      status: 'Aktif',
      items,
      clauses
    });
    
    setIsModalOpen(false);
    // Reset
    setProjectId('');
    setSubcontractorId('');
    setStartDate('');
    setEndDate('');
    setItems([]);
    setClauses(DEFAULT_CLAUSES);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files && e.target.files[0] && uploadContractId) {
        // Mock upload - just set a fake URL
        onUpdate(uploadContractId, { signedDocumentUrl: URL.createObjectURL(e.target.files[0]), status: 'Aktif' });
        setUploadContractId(null);
     }
  };

  const filteredContracts = contracts.filter(c => {
    const sub = subcontractors.find(s => s.id === c.subcontractorId)?.name || '';
    const proj = projects.find(p => p.id === c.projectId)?.name || '';
    const search = searchTerm.toLowerCase();
    return sub.toLowerCase().includes(search) || proj.toLowerCase().includes(search);
  });

  const printContract = (contract: Contract) => {
     const sub = subcontractors.find(s => s.id === contract.subcontractorId);
     const proj = projects.find(p => p.id === contract.projectId);
     const duration = calculateDuration(contract.startDate, contract.endDate);
     
     const printWindow = window.open('', '', 'width=900,height=800');
     if (!printWindow) return;

     const content = `
       <html>
         <head>
           <title>Sözleşme No: ${contract.id}</title>
           <style>
             body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.5; font-size: 12pt; }
             h1 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
             h2 { font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
             .clause-title { font-weight: bold; text-transform: uppercase; margin-top: 15px; margin-bottom: 5px; }
             .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
             .info-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
             .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11pt; }
             .items-table th { border: 1px solid #000; padding: 5px; background: #eee; }
             .items-table td { border: 1px solid #000; padding: 5px; }
             .signature-section { margin-top: 60px; display: flex; justify-content: space-between; page-break-inside: avoid; }
             .sign-box { width: 40%; text-align: center; }
             .sign-line { border-top: 1px solid #000; margin-top: 50px; }
           </style>
         </head>
         <body>
           <h1>ALT YÜKLENİCİ (TAŞERON) SÖZLEŞMESİ</h1>
           
           <div class="clause-title">MADDE 1 - TARAFLAR</div>
           <table class="info-table">
             <tr>
               <td width="30%"><strong>İŞVEREN (İDARE):</strong></td>
               <td>${proj?.client || 'SiteMaster İnşaat A.Ş.'}</td>
             </tr>
             <tr>
               <td><strong>YÜKLENİCİ:</strong></td>
               <td>${sub?.name}<br>Vergi No: ${sub?.taxId}</td>
             </tr>
           </table>

           <div class="clause-title">MADDE 2 - İŞİN KONUSU VE YERİ</div>
           <p>${proj?.name} projesi kapsamında (${proj?.location}) adresinde yapılacak olan birim fiyatlı imalat işleridir.</p>

           <div class="clause-title">MADDE 3 - SÜRE</div>
           <p>
             <strong>Başlangıç Tarihi:</strong> ${contract.startDate}<br>
             <strong>Bitiş Tarihi:</strong> ${contract.endDate}<br>
             <strong>Toplam Süre:</strong> ${duration} Takvim Günüdür.
           </p>

           <div class="clause-title">MADDE 4 - ÖDEME ŞARTLARI</div>
           <p>${contract.clauses?.paymentTerms?.replace(/\n/g, '<br>')}</p>

           <div class="clause-title">MADDE 5 - CEZAİ ŞARTLAR</div>
           <p>${contract.clauses?.penaltyTerms?.replace(/\n/g, '<br>')}</p>

           <div class="clause-title">MADDE 6 - KALİTE KONTROL</div>
           <p>${contract.clauses?.qualityTerms?.replace(/\n/g, '<br>')}</p>

           <div class="clause-title">MADDE 7 - İŞ SAĞLIĞI VE GÜVENLİĞİ</div>
           <p>${contract.clauses?.safetyTerms?.replace(/\n/g, '<br>')}</p>

           <div class="clause-title">MADDE 8 - FESİH</div>
           <p>${contract.clauses?.terminationTerms?.replace(/\n/g, '<br>')}</p>

           <div class="clause-title">EK-1: BİRİM FİYAT CETVELİ</div>
           <table class="items-table">
             <thead>
               <tr>
                 <th>Poz No</th>
                 <th>Açıklama</th>
                 <th>Birim</th>
                 <th>B.Fiyat</th>
               </tr>
             </thead>
             <tbody>
               ${contract.items.map(i => `<tr><td>${i.code}</td><td>${i.description}</td><td>${i.unit}</td><td style="text-align:right">${i.unitPrice} ₺</td></tr>`).join('')}
             </tbody>
           </table>

           <p style="margin-top: 30px;">İşbu sözleşme 2 nüsha olarak tanzim edilmiş, okunmuş ve taraflarca imza altına alınmıştır.</p>

           <div class="signature-section">
             <div class="sign-box">
               <div><strong>İŞVEREN (İDARE)</strong></div>
               <div>Proje Müdürü</div>
               <div class="sign-line">(İmza / Kaşe)</div>
             </div>
             <div class="sign-box">
               <div><strong>YÜKLENİCİ (TAŞERON)</strong></div>
               <div>Şirket Yetkilisi</div>
               <div class="sign-line">(İmza / Kaşe)</div>
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
    <div className="p-8 h-full overflow-y-auto relative">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Sözleşme Yönetimi</h2>
          <p className="text-slate-500 mt-1">Hukuki şartnameler, birim fiyatlar ve ıslak imzalı belge takibi.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex">
             <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Dashboard</button>
             <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Liste</button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/10"
          >
            <Plus size={18} />
            Yeni Sözleşme
          </button>
        </div>
      </header>

      {/* DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
         <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                     <FileSignature size={32} />
                  </div>
                  <div>
                     <div className="text-3xl font-bold text-slate-800">{stats.totalContracts}</div>
                     <div className="text-sm text-slate-500">Toplam Sözleşme</div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                     <CheckCircle2 size={32} />
                  </div>
                  <div>
                     <div className="text-3xl font-bold text-slate-800">{stats.activeCount}</div>
                     <div className="text-sm text-slate-500">Aktif Sözleşme</div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
                     <Briefcase size={32} />
                  </div>
                  <div>
                     <div className="text-3xl font-bold text-slate-800">{stats.projectDistribution.length}</div>
                     <div className="text-sm text-slate-500">Aktif Proje</div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <PieChart size={20} className="text-slate-400" />
                     Proje Bazlı Sözleşme Dağılımı
                  </h3>
                  <div className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.projectDistribution}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} />
                           <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                           <RechartsTooltip cursor={{fill: 'transparent'}} />
                           <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               
               {/* Recent Contracts List (Mini) */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <FileCheck size={20} className="text-slate-400" />
                     Son Eklenen Sözleşmeler
                  </h3>
                  <div className="space-y-4">
                     {contracts.slice(-3).reverse().map(c => {
                        const sub = subcontractors.find(s => s.id === c.subcontractorId);
                        const proj = projects.find(p => p.id === c.projectId);
                        return (
                           <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div>
                                 <div className="font-bold text-slate-700 text-sm">{sub?.name}</div>
                                 <div className="text-xs text-slate-400">{proj?.name}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="text-right hidden sm:block">
                                    <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold inline-block">
                                       {c.status}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">{c.startDate}</div>
                                 </div>
                                 <button 
                                    onClick={() => printContract(c)} 
                                    className="p-2 text-orange-600 bg-white hover:bg-orange-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                                    title="PDF/Word Olarak İndir"
                                 >
                                    <Download size={16} />
                                 </button>
                              </div>
                           </div>
                        );
                     })}
                     {contracts.length === 0 && <div className="text-slate-400 text-sm italic">Henüz sözleşme yok.</div>}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* LIST VIEW */}
      {activeTab === 'list' && (
         <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
               <Search size={20} className="text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Proje veya Taşeron ara..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContracts.map(contract => {
                const sub = subcontractors.find(s => s.id === contract.subcontractorId);
                const proj = projects.find(p => p.id === contract.projectId);
                
                return (
                  <div key={contract.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group">
                     <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                              <FileSignature size={24} />
                           </div>
                           <div>
                              <h3 className="font-bold text-slate-800 text-sm md:text-base line-clamp-1" title={sub?.name}>{sub?.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                 <Briefcase size={12} />
                                 <span className="truncate max-w-[150px]">{proj?.name}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-1">
                           <button 
                              onClick={() => printContract(contract)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Yazdır"
                           >
                              <Printer size={18} />
                           </button>
                           <button onClick={() => { if(confirm('Sözleşmeyi silmek istediğinize emin misiniz?')) onDelete(contract.id) }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                              <Trash2 size={18} />
                           </button>
                        </div>
                     </div>
                     
                     <div className="p-5 flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                           <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="text-xs text-slate