
import React, { useState } from 'react';
import { Package, QrCode, Search, Wrench, Hammer, Box, ArrowRightLeft, Plus, X, MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { InventoryItem, Project, UserRole } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onAddItem: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<InventoryItem>) => void;
  projects: Project[];
  userRole?: UserRole;
}

export const Inventory: React.FC<InventoryProps> = ({ items, onUpdateQuantity, onAddItem, onDelete, onUpdate, projects, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Item State
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    category: 'Malzeme',
    quantity: 0,
    unit: 'Adet',
    location: '',
    status: 'Stokta',
    projectId: ''
  });

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000); // Simulate scan
  };

  const updateQuantity = (id: string, delta: number) => {
    onUpdateQuantity(id, delta);
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.sku) return;
    
    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name!,
      sku: newItem.sku!,
      category: newItem.category as any,
      quantity: Number(newItem.quantity),
      unit: newItem.unit || 'Adet',
      location: newItem.location || 'Depo',
      status: newItem.status as any,
      projectId: newItem.projectId
    };

    onAddItem(item);
    setIsModalOpen(false);
    setNewItem({ name: '', sku: '', category: 'Malzeme', quantity: 0, unit: 'Adet', location: '', status: 'Stokta', projectId: '' });
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Stok & Demirbaş Takibi</h2>
          <p className="text-slate-500 mt-1">Malzeme, el aleti ve ekipmanları QR kod ile takip edin.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={20} />
            Yeni Ürün
          </button>
          <button 
            onClick={handleScan}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            <QrCode size={20} />
            {isScanning ? 'Taranıyor...' : 'QR Tara'}
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Box size={24} />
           </div>
           <div>
              <div className="text-2xl font-bold text-slate-800">{items.filter(i => i.category === 'Malzeme').length}</div>
              <div className="text-sm text-slate-500">Malzeme Çeşidi</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <Wrench size={24} />
           </div>
           <div>
              <div className="text-2xl font-bold text-slate-800">{items.filter(i => i.category === 'El Aleti').length}</div>
              <div className="text-sm text-slate-500">Takipteki Aletler</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <ArrowRightLeft size={24} />
           </div>
           <div>
              <div className="text-2xl font-bold text-slate-800">{items.filter(i => i.status === 'Kritik Stok').length}</div>
              <div className="text-sm text-slate-500">Kritik Stok Uyarısı</div>
           </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Ürün Adı veya SKU ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-orange-500 outline-none text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
             {filteredItems.length} kayıt gösteriliyor
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium text-sm border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Ürün Adı</th>
              <th className="px-6 py-4">SKU / QR</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Proje</th>
              <th className="px-6 py-4">Miktar</th>
              <th className="px-6 py-4">Konum</th>
              <th className="px-6 py-4 text-right">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const project = projects.find(p => p.id === item.projectId);
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs bg-slate-100/50 rounded inline-block my-3 mx-6 w-fit px-2 py-1">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4">
                     <span className="flex items-center gap-2 text-slate-600 text-sm">
                        {item.category === 'El Aleti' ? <Wrench size={14} /> : item.category === 'Malzeme' ? <Box size={14} /> : <Hammer size={14} />}
                        {item.category}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {project ? project.name : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      {item.quantity} <span className="text-slate-400 text-xs font-normal">{item.unit}</span>
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-red-500"><MinusCircle size={16} /></button>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-green-500"><PlusCircle size={16} /></button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'Stokta' ? 'bg-green-100 text-green-700' :
                        item.status === 'Kritik Stok' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                        }`}>
                        {item.status}
                        </span>
                        {onDelete && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm('Silmek istediğinize emin misiniz?')) onDelete(item.id); }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Sil"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

       {/* Add Item Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Yeni Stok Kartı Oluştur</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Adı</label>
                  <input 
                    type="text" 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Örn: Seramik Yapıştırıcı"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Kod</label>
                  <input 
                    type="text" 
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                    placeholder="MAT-000"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="Malzeme">Malzeme</option>
                    <option value="El Aleti">El Aleti</option>
                    <option value="Ekipman">Ekipman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Miktar</label>
                  <input 
                    type="number" 
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Birim</label>
                  <input 
                    type="text" 
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    placeholder="Adet, Kg, Ton"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proje (Opsiyonel)</label>
                  <select 
                    value={newItem.projectId}
                    onChange={(e) => setNewItem({...newItem, projectId: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="">Proje Seçiniz...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                 <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Depo / Konum</label>
                  <input 
                    type="text" 
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    placeholder="Depo A, Raf 3"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button 
                onClick={handleAddItem}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
              >
                Stoka Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
