
import React, { useState, useMemo } from 'react';
import { CheckSquare, AlertCircle, Camera, User, Clock, CheckCircle2, Filter, Plus, X, Trash2, Edit2, Calendar, Image as ImageIcon, ClipboardList, PieChart as PieIcon } from 'lucide-react';
import { PunchItem, UserRole } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PunchListProps {
  items: PunchItem[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (item: PunchItem) => void;
  onUpdate?: (id: string, updates: Partial<PunchItem>) => void;
  userRole?: UserRole;
}

export const PunchList: React.FC<PunchListProps> = ({ items, onToggleStatus, onDelete, onAdd, onUpdate, userRole }) => {
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [filterSeverity, setFilterSeverity] = useState('Tümü');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create/Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formItem, setFormItem] = useState<Partial<PunchItem>>({
    title: '',
    location: '',
    severity: 'Orta',
    assignee: '',
    status: 'Açık',
    description: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0]
  });

  // --- STATS LOGIC ---
  const stats = useMemo(() => {
     const total = items.length;
     const open = items.filter(i => i.status === 'Açık').length;
     const resolved = items.filter(i => i.status === 'Çözüldü').length;
     const approved = items.filter(i => i.status === 'Onaylandı').length;
     const critical = items.filter(i => i.severity === 'Yüksek' && i.status === 'Açık').length;
     
     const chartData = [
        { name: 'Açık', value: open, color: '#ef4444' },
        { name: 'Çözüldü', value: resolved, color: '#f59e0b' },
        { name: 'Onaylandı', value: approved, color: '#22c55e' },
     ].filter(d => d.value > 0);

     return { total, open, resolved, approved, critical, chartData };
  }, [items]);

  const handleDelete = (id: string) => {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      onDelete(id);
    }
  };

  const handleOpenModal = (item?: PunchItem) => {
     if(item) {
        setEditingId(item.id);
        setFormItem(item);
     } else {
        setEditingId(null);
        setFormItem({
           title: '',
           location: '',
           severity: 'Orta',
           assignee: '',
           status: 'Açık',
           description: '',
           imageUrl: '',
           date: new Date().toISOString().split('T')[0]
        });
     }
     setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formItem.title || !formItem.location) return;
    
    if(editingId && onUpdate) {
       onUpdate(editingId, formItem);
    } else {
       const newItem: PunchItem = {
         id: Date.now().toString(),
         title: formItem.title!,
         location: formItem.location!,
         severity: formItem.severity as any,
         assignee: formItem.assignee || 'Atanmadı',
         status: formItem.status as any,
         description: formItem.description,
         imageUrl: formItem.imageUrl,
         date: formItem.date || new Date().toISOString().split('T')[0]
       };
       onAdd(newItem);
    }
    setIsModalOpen(false);
  };

  const filteredItems = items.filter(i => {
     const statusMatch = filterStatus === 'Tümü' || i.status === filterStatus;
     const severityMatch = filterSeverity === 'Tümü' || i.severity === filterSeverity;
     return statusMatch && severityMatch;
  });

  const getSeverityColor = (severity: string) => {
     switch(severity) {
        case 'Yüksek': return 'bg-red-100 text-red-700 border-red-200';
        case 'Orta': return 'bg-orange-100 text-orange-700 border-orange-200';
        default: return 'bg-blue-100 text-blue-700 border-blue-200';
     }
  };

  const getStatusBadge = (status: string) => {
     switch(status) {
        case 'Açık': return 'bg-red-50 text-red-600 border-red-100';
        case 'Çözüldü': return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'Onaylandı': return 'bg-green-50 text-green-600 border-green-100';
        default: return 'bg-slate-100 text-slate-600';
     }
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative bg-slate-50">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Eksik ve Arıza Listesi (Punch List)</h2>
          <p className="text-slate-500 mt-1">Sahadaki kusurları, eksik işleri ve son kontrolleri takip edin.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-orange-900/10"
        >
          <Camera size={18} />
          Yeni Kayıt Ekle
        </button>
      </header>

      {/* --- DASHBOARD SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
               <ClipboardList size={20} />
               <span className="text-sm font-bold uppercase">Toplam Arıza</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
         </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-red-500 mb-2">
               <AlertCircle size={20} />
               <span className="text-sm font-bold uppercase">Kritik & Açık</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
         </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-green-600 mb-2">
               <CheckCircle2 size={20} />
               <span className="text-sm font-bold uppercase">Tamamlanan</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
         </div>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center">
            <div className="flex-1">
               <div className="text-xs font-bold text-slate-400 uppercase mb-1">Durum Dağılımı</div>
               <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-800">%{(stats.total > 0 ? (stats.approved / stats.total) * 100 : 0).toFixed(0)}</span>
                  <span className="text-xs text-slate-500">Çözüm Oranı</span>
               </div>
            </div>
            <div className="h-16 w-16">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={stats.chartData} innerRadius={15} outerRadius={25} paddingAngle={2} dataKey="value">
                        {stats.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
           {['Tümü', 'Açık', 'Çözüldü', 'Onaylandı'].map((f) => (
             <button
               key={f}
               onClick={() => setFilterStatus(f)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                 filterStatus === f 
                   ? 'bg-white text-slate-800 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               {f}
             </button>
           ))}
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
           {['Tümü', 'Yüksek', 'Orta', 'Düşük'].map((f) => (
             <button
               key={f}
               onClick={() => setFilterSeverity(f)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                 filterSeverity === f 
                   ? 'bg-white text-slate-800 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               {f === 'Tümü' ? 'Tüm Riskler' : f}
             </button>
           ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative">
            
            {/* Image / Header */}
            <div className="h-40 bg-slate-100 relative overflow-hidden group-hover:opacity-95 transition-opacity cursor-pointer" onClick={() => handleOpenModal(item)}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                  <Camera size={32} className="mb-2" />
                  <span className="text-xs font-medium">Görsel Yok</span>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3">
                 <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm uppercase tracking-wide border ${getSeverityColor(item.severity)}`}>
                   {item.severity}
                 </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}
                  className="bg-white/90 p-2 rounded-lg text-slate-600 hover:text-orange-600 shadow-sm backdrop-blur-sm transition-colors"
                  title="Düzenle"
                 >
                   <Edit2 size={14} />
                 </button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="bg-white/90 p-2 rounded-lg text-slate-600 hover:text-red-600 shadow-sm backdrop-blur-sm transition-colors"
                  title="Sil"
                 >
                   <Trash2 size={14} />
                 </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="mb-3">
                 <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 line-clamp-1" title={item.title}>{item.title}</h3>
                 </div>
                 <p className="text-xs text-slate-500 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                   {item.location}
                 </p>
              </div>

              {item.description && (
                 <p className="text-xs text-slate-500 mb-4 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                    "{item.description}"
                 </p>
              )}
              
              <div className="mt-auto space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-2 text-slate-600" title="Sorumlu">
                     <User size={14} className="text-slate-400" />
                     <span className="font-medium truncate max-w-[100px]">{item.assignee}</span>
                   </div>
                   <div className="flex items-center gap-1 text-slate-400" title="Tarih">
                     <Calendar size={12} />
                     <span>{item.date}</span>
                   </div>
                </div>
                
                <div className={`w-full py-2 px-3 rounded-lg text-xs font-bold border flex justify-between items-center ${getStatusBadge(item.status)}`}>
                  <div className="flex items-center gap-2">
                     {item.status === 'Açık' && <AlertCircle size={14} />}
                     {item.status === 'Çözüldü' && <Clock size={14} />}
                     {item.status === 'Onaylandı' && <CheckCircle2 size={14} />}
                     {item.status.toUpperCase()}
                  </div>
                  {/* Quick Action to Advance Status */}
                  <button 
                     onClick={(e) => { e.stopPropagation(); onToggleStatus(item.id); }}
                     className="hover:bg-black/5 p-1 rounded transition-colors"
                     title="Durumu Değiştir"
                  >
                     <CheckSquare size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Kayıt Düzenle' : 'Yeni Arıza Kaydı'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                <input 
                  type="text" 
                  value={formItem.title}
                  onChange={(e) => setFormItem({...formItem, title: e.target.value})}
                  placeholder="Örn: Mutfak Tezgahı Çizik"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Konum</label>
                   <input 
                     type="text" 
                     value={formItem.location}
                     onChange={(e) => setFormItem({...formItem, location: e.target.value})}
                     placeholder="Blok A, Daire 12"
                     className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                   <input 
                     type="date" 
                     value={formItem.date}
                     onChange={(e) => setFormItem({...formItem, date: e.target.value})}
                     className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                   />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Önem Derecesi</label>
                  <select 
                    value={formItem.severity}
                    onChange={(e) => setFormItem({...formItem, severity: e.target.value as any})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                  <select 
                    value={formItem.status}
                    onChange={(e) => setFormItem({...formItem, status: e.target.value as any})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="Açık">Açık</option>
                    <option value="Çözüldü">Çözüldü</option>
                    <option value="Onaylandı">Onaylandı</option>
                  </select>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Sorumlu Kişi / Firma</label>
                 <input 
                   type="text" 
                   value={formItem.assignee}
                   onChange={(e) => setFormItem({...formItem, assignee: e.target.value})}
                   placeholder="Örn: Tesisatçı Mehmet"
                   className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                 <textarea 
                   value={formItem.description}
                   onChange={(e) => setFormItem({...formItem, description: e.target.value})}
                   placeholder="Sorunu detaylandırın..."
                   className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-20 resize-none"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Fotoğraf URL</label>
                 <div className="flex gap-2">
                    <ImageIcon className="text-slate-400 mt-2.5" size={20} />
                    <input 
                      type="text" 
                      value={formItem.imageUrl}
                      onChange={(e) => setFormItem({...formItem, imageUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full pl-2 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                 </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-orange-900/10"
              >
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
