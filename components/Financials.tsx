import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Calculator, FileText, PieChart as PieIcon, Plus, Save, Printer, Building2, UserCircle, Briefcase, History, Filter, Trash2, Edit2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PaymentRecord, Subcontractor, Contract, Project, PaymentItemDetail, UserRole } from '../types';

interface FinancialsProps {
  paymentData: PaymentRecord[];
  onAddPayment: (record: PaymentRecord) => void;
  onDeletePayment?: (id: string) => void;
  onUpdatePayment?: (id: string, updates: Partial<PaymentRecord>) => void;
  subcontractors?: Subcontractor[];
  contracts?: Contract[];
  projects?: Project[];
  userRole: UserRole;
}

export const Financials: React.FC<FinancialsProps> = ({ 
  paymentData, 
  onAddPayment, 
  onDeletePayment,
  onUpdatePayment,
  subcontractors = [], 
  contracts = [],
  projects = [],
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'payments' | 'price-diff'>('budget');

  // New Payment State
  const [paymentType, setPaymentType] = useState<'Idare' | 'Taseron'>('Idare');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  
  // List Filter State
  const [filterType, setFilterType] = useState<'All' | 'Idare' | 'Taseron'>('All');
  
  // Detailed Entry State (for Subcontractors)
  const [currentQuantities, setCurrentQuantities] = useState<Record<string, number>>({});

  // Calculations
  const activeContract = useMemo(() => {
    if (paymentType === 'Taseron' && selectedSubcontractor && selectedProject) {
      return contracts.find(c => c.subcontractorId === selectedSubcontractor && c.projectId === selectedProject);
    }
    return null;
  }, [paymentType, selectedSubcontractor, selectedProject, contracts]);

  // Filter Subcontractors based on Project selection
  const availableSubcontractors = useMemo(() => {
    if (!selectedProject) return subcontractors;
    return subcontractors.filter(sub => 
      contracts.some(c => c.projectId === selectedProject && c.subcontractorId === sub.id)
    );
  }, [selectedProject, subcontractors, contracts]);

  // Filtered Payments for List View
  const filteredPayments = useMemo(() => {
    if (filterType === 'All') return paymentData;
    return paymentData.filter(p => p.type === filterType);
  }, [paymentData, filterType]);

  // Calculate Previous Cumulative Quantities
  const getPreviousQuantity = (itemId: string) => {
    return paymentData
      .filter(p => p.projectId === selectedProject && p.subcontractorId === selectedSubcontractor)
      .flatMap(p => p.items || [])
      .filter(i => i.itemId === itemId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const calculatedSubcontractorTotal = useMemo(() => {
    if (!activeContract) return 0;
    return activeContract.items.reduce((total, item) => {
      const qty = currentQuantities[item.id] || 0;
      return total + (qty * item.unitPrice);
    }, 0);
  }, [activeContract, currentQuantities]);

  const handleAddPayment = () => {
    const amount = paymentType === 'Taseron' ? calculatedSubcontractorTotal : Number(manualAmount);
    
    if (!paymentMonth || amount <= 0) return;
    if (paymentType === 'Taseron' && !selectedSubcontractor) return;

    const items: PaymentItemDetail[] = activeContract ? activeContract.items.map(item => ({
      itemId: item.id,
      quantity: currentQuantities[item.id] || 0,
      total: (currentQuantities[item.id] || 0) * item.unitPrice
    })).filter(i => i.total > 0) : [];

    const newRecord: PaymentRecord = {
      id: Date.now().toString(),
      month: paymentMonth,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      type: paymentType,
      projectId: selectedProject,
      subcontractorId: selectedSubcontractor || undefined,
      items: items.length > 0 ? items : undefined
    };

    onAddPayment(newRecord);
    
    // Reset Form
    setPaymentMonth('');
    setManualAmount('');
    setCurrentQuantities({});
  };

  const handleDeleteClick = (id: string) => {
    if(confirm('Bu hakediş kaydını silmek istediğinize emin misiniz? Bütçe verileri güncellenecektir.') && onDeletePayment) {
      onDeletePayment(id);
    }
  };

  const handleEditClick = (record: PaymentRecord) => {
    setEditingPayment(record);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingPayment && onUpdatePayment) {
      onUpdatePayment(editingPayment.id, {
        amount: editingPayment.amount,
        month: editingPayment.month,
        date: editingPayment.date
      });
      setIsEditModalOpen(false);
      setEditingPayment(null);
    }
  };

  const generatePDF = (record: PaymentRecord) => {
    const sub = subcontractors.find(s => s.id === record.subcontractorId);
    const proj = projects.find(p => p.id === record.projectId);
    const contract = contracts.find(c => c.subcontractorId === record.subcontractorId && c.projectId === record.projectId);
    
    const itemsHtml = record.items?.map(item => {
      const contractItem = contract?.items.find(ci => ci.id === item.itemId);
      
      const prevQty = paymentData
        .filter(p => p.projectId === record.projectId && p.subcontractorId === record.subcontractorId && p.id !== record.id)
        .flatMap(p => p.items || [])
        .filter(i => i.itemId === item.itemId)
        .reduce((sum, i) => sum + i.quantity, 0);

      const totalQty = prevQty + item.quantity;
      const currentAmount = item.total;
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px;">${contractItem?.code || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px;">${contractItem?.description || 'Bilinmeyen Kalem'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px;">${contractItem?.unit || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-size: 12px;">${contractItem?.unitPrice.toFixed(2)} ₺</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f9f9f9; font-size: 12px;">${prevQty.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 12px;">${item.quantity.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f9f9f9; font-size: 12px;">${totalQty.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 12px;">${currentAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} ₺</td>
        </tr>
      `;
    }).join('') || '';

    const printWindow = window.open('', '', 'width=900,height=800');
    if (!printWindow) return;

    const reportTitle = record.type === 'Idare' ? 'İDARE HAKEDİŞ RAPORU' : 'TAŞERON HAKEDİŞ RAPORU';

    const content = `
      <html>
        <head>
          <title>${reportTitle} No: ${record.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.4; }
            h1 { text-align: center; color: #000; margin-bottom: 5px; font-size: 24px; text-transform: uppercase; }
            h2 { text-align: center; color: #555; margin-bottom: 30px; font-size: 16px; font-weight: normal; }
            .header-table { width: 100%; margin-bottom: 30px; border: 1px solid #ccc; }
            .header-table td { padding: 10px; border: 1px solid #ccc; vertical-align: top; }
            .label { font-weight: bold; color: #666; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px; }
            .value { font-weight: bold; font-size: 14px; }
            
            table.main { width: 100%; border-collapse: collapse; margin-top: 20px; }
            table.main th { text-align: center; background-color: #eee; padding: 10px 5px; border: 1px solid #ccc; font-size: 12px; font-weight: bold; }
            table.main td { border: 1px solid #ccc; }
            
            .total-section { margin-top: 30px; width: 40%; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total-row.final { border-bottom: 2px solid #000; font-size: 18px; font-weight: bold; margin-top: 10px; }
            
            .footer { margin-top: 60px; display: flex; justify-content: space-between; text-align: center; page-break-inside: avoid; }
            .sign-box { width: 30%; border-top: 1px solid #000; padding-top: 10px; }
            .sign-title { font-weight: bold; margin-bottom: 5px; }
            .sign-role { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <h2>Dönem: ${record.month} | Rapor No: #${record.id}</h2>
          
          <table class="header-table">
            <tr>
              <td width="33%">
                <span class="label">Proje</span>
                <span class="value">${proj?.name || 'Belirtilmemiş'}</span>
                <br><br>
                <span class="label">Lokasyon</span>
                <span>${proj?.location || '-'}</span>
              </td>
              <td width="33%">
                <span class="label">Yüklenici / Taşeron</span>
                <span class="value">${record.type === 'Taseron' ? sub?.name : 'İdare / İşveren'}</span>
                <br><br>
                ${record.type === 'Taseron' ? `
                <span class="label">Vergi No / Ticari Sicil</span>
                <span>${sub?.taxId || '-'}</span>
                ` : ''}
              </td>
              <td width="33%">
                <span class="label">Rapor Tarihi</span>
                <span class="value">${record.date}</span>
                <br><br>
                <span class="label">Hakediş Türü</span>
                <span style="background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${record.type}</span>
              </td>
            </tr>
          </table>

          ${record.type === 'Taseron' ? `
            <h3 style="font-size: 14px; border-bottom: 2px solid #orange; display:inline-block; margin-bottom: 10px;">Yapılan İmalatlar ve Metrajlar</h3>
            <table class="main">
              <thead>
                <tr>
                  <th>Poz No</th>
                  <th>Açıklama</th>
                  <th>Birim</th>
                  <th>B.Fiyat</th>
                  <th>Önceki<br>Toplam</th>
                  <th>Bu Dönem<br>Miktar</th>
                  <th>Toplam<br>Kümülatif</th>
                  <th>Bu Dönem<br>Tutar</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          ` : ''}

          <div class="total-section">
            <div class="total-row final">
              <span>TOPLAM TUTAR:</span>
              <span>${record.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} ₺</span>
            </div>
            <div style="text-align: right; font-size: 11px; color: #666; margin-top: 5px;">(KDV Hariçtir)</div>
          </div>

          <div class="footer">
            <div class="sign-box">
              <div class="sign-title">DÜZENLEYEN</div>
              <div class="sign-role">Saha Mühendisi / Teknik Ofis</div>
            </div>
            <div class="sign-box">
              <div class="sign-title">KONTROL EDEN</div>
              <div class="sign-role">Şantiye Şefi</div>
            </div>
            <div class="sign-box">
              <div class="sign-title">ONAYLAYAN</div>
              <div class="sign-role">Proje Müdürü / İşveren</div>
            </div>
          </div>
          
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Prepare Dynamic Data for Budget Chart
  const budgetChartData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    budget: p.budget,
    spent: p.spent,
    remaining: p.budget - p.spent
  }));

  // Price Diff
  const [baseIndex, setBaseIndex] = useState(100);
  const [currentIndex, setCurrentIndex] = useState(115);
  const [priceDiffAmount, setPriceDiffAmount] = useState(50000);
  const priceDiff = priceDiffAmount * ((currentIndex - baseIndex) / baseIndex);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Finansal Yönetim</h2>
          <p className="text-slate-500 mt-1">Bütçe takibi, Hakedişler ve Fiyat Farkı hesaplamaları.</p>
        </div>
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <DollarSign size={20} />
          Toplam Harcama: ₺{paymentData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('budget')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'budget' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Bütçe ve Harcama
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'payments' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Hakedişler
        </button>
        <button 
          onClick={() => setActiveTab('price-diff')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'price-diff' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Fiyat Farkı Hesabı
        </button>
      </div>

      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6">Proje Bazlı Bütçe Durumu</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₺${val/1000}k`} />
                  <Tooltip formatter={(value) => `₺${value.toLocaleString()}`} />
                  <Bar dataKey="budget" name="Bütçe" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Harcanan" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Finansal Özet</h3>
              <div className="space-y-4">
                {budgetChartData.map((p, idx) => (
                   <div key={idx} className={`p-4 rounded-xl border ${p.remaining < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                      <div className={`${p.remaining < 0 ? 'text-red-500' : 'text-green-500'} text-xs font-bold uppercase mb-1`}>
                         {p.remaining < 0 ? 'Bütçe Aşımı' : 'Kalan Bütçe'}
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-slate-700 font-medium text-sm truncate max-w-[100px]" title={p.name}>{p.name}</span>
                         <span className={`${p.remaining < 0 ? 'text-red-600' : 'text-green-600'} font-bold`}>
                            {p.remaining < 0 ? '+' : ''}₺{Math.abs(p.remaining).toLocaleString()}
                         </span>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2">
          {/* List Section */}
          <div className="xl:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-800">Hakediş Geçmişi</h3>
               <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                     onClick={() => setFilterType('All')}
                     className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'All' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     Tümü
                  </button>
                  <button 
                     onClick={() => setFilterType('Idare')}
                     className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'Idare' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     İdare
                  </button>
                  <button 
                     onClick={() => setFilterType('Taseron')}
                     className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterType === 'Taseron' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                     Taşeron
                  </button>
               </div>
            </div>
            <div className="h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredPayments}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `₺${value}`} />
                  <Line type="monotone" dataKey="amount" name="Tutar" stroke="#f97316" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3">Dönem</th>
                    <th className="p-3">Tür</th>
                    <th className="p-3">Muhatap</th>
                    <th className="p-3 text-right">Tutar</th>
                    <th className="p-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map(record => {
                    const subName = subcontractors.find(s => s.id === record.subcontractorId)?.name || '-';
                    return (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-700">{record.month}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${record.type === 'Idare' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{record.type === 'Taseron' ? subName : 'İdare'}</td>
                        <td className="p-3 text-right font-bold text-slate-700">₺{record.amount.toLocaleString()}</td>
                        <td className="p-3 text-center flex gap-1 justify-center">
                          <button 
                            onClick={() => handleEditClick(record)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(record.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => generatePDF(record)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="PDF Yazdır"
                          >
                            <Printer size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                     <tr><td colSpan={5} className="p-4 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Section */}
          <div className="xl:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={20} className="text-orange-500" />
                Yeni Hakediş Oluştur
             </h3>
             
             <div className="space-y-4">
                {/* Type Selection */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setPaymentType('Idare')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentType === 'Idare' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Building2 size={16} className="inline mr-2 mb-0.5" />
                    İdare Hakedişi
                  </button>
                  <button 
                    onClick={() => setPaymentType('Taseron')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentType === 'Taseron' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <UserCircle size={16} className="inline mr-2 mb-0.5" />
                    Taşeron Hakedişi
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Proje</label>
                     <select 
                       value={selectedProject}
                       onChange={(e) => setSelectedProject(e.target.value)}
                       className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                     >
                       <option value="">Seçiniz...</option>
                       {projects.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Dönem</label>
                     <input 
                       type="text" 
                       placeholder="Örn: Haziran 2024"
                       value={paymentMonth}
                       onChange={(e) => setPaymentMonth(e.target.value)}
                       className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                     />
                   </div>
                </div>

                {paymentType === 'Taseron' ? (
                  <>
                    <div>
                       <label className="block text-sm font-medium text-slate-600 mb-1">Taşeron Firma</label>
                       <select 
                         value={selectedSubcontractor}
                         onChange={(e) => setSelectedSubcontractor(e.target.value)}
                         disabled={!selectedProject}
                         className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400"
                       >
                         <option value="">{selectedProject ? "Firma Seçiniz..." : "Önce Proje Seçiniz"}</option>
                         {availableSubcontractors.map(s => (
                           <option key={s.id} value={s.id}>{s.name} ({s.trade})</option>
                         ))}
                       </select>
                    </div>

                    {activeContract ? (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 max-h-80 overflow-y-auto">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3">
                          <History size={14} />
                          Kümülatif Hakediş Girişi
                        </div>
                        <table className="w-full text-sm">
                          <thead className="text-slate-500 border-b border-slate-200 text-xs bg-slate-100">
                            <tr>
                              <th className="py-2 pl-2 text-left">Kalem</th>
                              <th className="py-2 text-center text-[10px] w-16">Önceki<br/>Top.</th>
                              <th className="py-2 text-center w-20">Bu Dönem</th>
                              <th className="py-2 pr-2 text-right">Tutar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeContract.items.map(item => {
                              const prevQty = getPreviousQuantity(item.id);
                              const currentQty = currentQuantities[item.id] || 0;
                              return (
                                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-white">
                                  <td className="py-2 pl-2 pr-2">
                                    <div className="font-medium text-slate-700 text-xs">{item.description}</div>
                                    <div className="text-[10px] text-slate-400">{item.code} • {item.unitPrice}₺</div>
                                  </td>
                                  <td className="py-2 text-center text-slate-400 text-xs bg-slate-50/50">
                                    {prevQty.toFixed(1)}
                                  </td>
                                  <td className="py-2 text-center">
                                    <input 
                                      type="number" 
                                      min="0"
                                      className="w-full bg-white border border-slate-300 rounded px-1 py-1 text-center outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 text-sm font-bold text-slate-800"
                                      placeholder="0"
                                      value={currentQuantities[item.id] || ''}
                                      onChange={(e) => setCurrentQuantities({...currentQuantities, [item.id]: Number(e.target.value)})}
                                    />
                                  </td>
                                  <td className="py-2 pr-2 text-right font-medium text-slate-800 text-xs">
                                    {(currentQty * item.unitPrice).toLocaleString()}₺
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : selectedSubcontractor && selectedProject ? (
                       <div className="text-center p-4 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-300">
                         Bu taşeronun bu projede sözleşmesi bulunamadı.
                       </div>
                    ) : null}
                  </>
                ) : (
                  <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Toplam Tutar (₺)</label>
                     <input 
                      type="number" 
                      placeholder="0.00"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                     />
                  </div>
                )}

                <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center mt-2">
                   <div>
                     <div className="text-slate-400 text-xs uppercase">Toplam Hakediş</div>
                     <div className="text-xl font-bold">
                       ₺{(paymentType === 'Taseron' ? calculatedSubcontractorTotal : Number(manualAmount)).toLocaleString()}
                     </div>
                   </div>
                   {paymentType === 'Taseron' && (
                     <div className="text-right">
                        <div className="text-slate-400 text-xs uppercase">Sözleşme ID</div>
                        <div className="text-sm font-mono text-orange-400">{activeContract ? `#${activeContract.id}` : '-'}</div>
                     </div>
                   )}
                </div>

                <button 
                  onClick={handleAddPayment}
                  disabled={!paymentMonth || (paymentType === 'Taseron' && calculatedSubcontractorTotal <= 0)}
                  className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/10"
                >
                   <Save size={18} />
                   Hakedişi Kaydet
                </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'price-diff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calculator className="text-orange-500" />
              Fiyat Farkı Hesaplayıcı
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Hakediş Tutarı (₺)</label>
                <input 
                  type="number" 
                  value={priceDiffAmount}
                  onChange={(e) => setPriceDiffAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Temel Endeks (Io)</label>
                  <input 
                    type="number" 
                    value={baseIndex}
                    onChange={(e) => setBaseIndex(Number(e.target.value))}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Güncel Endeks (In)</label>
                  <input 
                    type="number" 
                    value={currentIndex}
                    onChange={(e) => setCurrentIndex(Number(e.target.value))}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 text-sm">Fiyat Farkı Katsayısı (Pn)</span>
                <span className="font-mono font-bold text-slate-700">{((currentIndex - baseIndex) / baseIndex).toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-slate-800 font-bold">Ödenecek Fiyat Farkı</span>
                <span className="text-2xl font-bold text-green-600">+₺{priceDiff.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold text-xl mb-4">Fiyat Farkı Hakkında</h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Bu araç, ihale tarihi ile hakediş tarihi arasındaki enflasyon veya malzeme maliyet artışları (TÜİK Endeksleri) nedeniyle gereken ek ödemeyi hesaplamak için kullanılır.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <TrendingUp size={20} className="text-orange-400 mt-1" />
                <span className="text-sm text-slate-300">Standart formül (In/Io - 1) baz alınır.</span>
              </li>
              <li className="flex items-start gap-3">
                <FileText size={20} className="text-orange-400 mt-1" />
                <span className="text-sm text-slate-300">Kısmi hakediş düzeltmelerini destekler.</span>
              </li>
              <li className="flex items-start gap-3">
                <PieIcon size={20} className="text-orange-400 mt-1" />
                <span className="text-sm text-slate-300">Resmi inşaat maliyet endeksleri ile uyumludur.</span>
              </li>
            </ul>
            <div className="mt-8 pt-6 border-t border-slate-700/50">
               <div className="flex items-center gap-2 text-sm text-orange-300 mb-2">
                 <Briefcase size={16} />
                 <span>İpucu</span>
               </div>
               <p className="text-xs text-slate-400">
                 Fiyat farkı hesaplamaları Yüksek Fen Kurulu kararlarına göre değişkenlik gösterebilir. Resmi hakedişlerinizde lütfen güncel katsayıları kontrol ediniz.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingPayment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Hakediş Düzenle</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Dönem</label>
                <input 
                  type="text" 
                  value={editingPayment.month}
                  onChange={(e) => setEditingPayment({...editingPayment, month: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tarih</label>
                <input 
                  type="date" 
                  value={editingPayment.date}
                  onChange={(e) => setEditingPayment({...editingPayment, date: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tutar (₺)</label>
                <input 
                  type="number" 
                  value={editingPayment.amount}
                  onChange={(e) => setEditingPayment({...editingPayment, amount: Number(e.target.value)})}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                />
                <p className="text-xs text-orange-600 mt-1">Dikkat: Tutarı değiştirmek proje bütçesini güncelleyecektir.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">İptal</button>
              <button onClick={handleSaveEdit} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};