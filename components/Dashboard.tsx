
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Area } from 'recharts';
import { Project, ProjectStatus, Tender, InventoryItem, PunchItem, Subcontractor, TeamMember, PaymentRecord } from '../types';
import { TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Wallet, ClipboardList, PackageSearch, Users, Gavel, ArrowRight, Building2, MapPin } from 'lucide-react';
import { ProjectMap } from './ProjectMap';

interface DashboardProps {
  projects: Project[];
  tenders?: Tender[];
  inventoryItems?: InventoryItem[];
  punchItems?: PunchItem[];
  subcontractors?: Subcontractor[];
  teamMembers?: TeamMember[];
  financialData?: PaymentRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  tenders = [],
  inventoryItems = [],
  punchItems = [],
  subcontractors = [],
  teamMembers = [],
  financialData = []
}) => {
  
  // -- DERIVED STATISTICS --

  // Financials
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);
  
  // Tenders
  const activeTenders = tenders.filter(t => t.status === 'Hazırlık' || t.status === 'Teklif Verildi');
  const wonTenders = tenders.filter(t => t.status === 'Kazanıldı');
  
  // Inventory
  const criticalStockCount = inventoryItems.filter(i => i.status === 'Kritik Stok').length;

  // Punch List
  const openPunchItems = punchItems.filter(i => i.status === 'Açık');
  const highSeverityPunch = openPunchItems.filter(i => i.severity === 'Yüksek').length;

  // Team
  const fieldStaff = teamMembers.filter(m => m.status === 'Sahada').length;
  const officeStaff = teamMembers.filter(m => m.status === 'Ofiste').length;

  // Subcontractors
  const topSubcontractor = [...subcontractors].sort((a,b) => (b.rating || 0) - (a.rating || 0))[0];

  // -- CHART DATA --

  const financialChartData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    Bütçe: p.budget,
    Harcama: p.spent,
    amt: p.budget
  }));

  const tenderStatusData = [
    { name: 'Kazanıldı', value: tenders.filter(t => t.status === 'Kazanıldı').length },
    { name: 'Teklifte', value: tenders.filter(t => t.status === 'Teklif Verildi').length },
    { name: 'Hazırlık', value: tenders.filter(t => t.status === 'Hazırlık').length },
    { name: 'Kaybedildi', value: tenders.filter(t => t.status === 'Kaybedildi').length },
  ].filter(i => i.value > 0);

  const punchPriorityData = [
    { name: 'Yüksek', value: punchItems.filter(i => i.status === 'Açık' && i.severity === 'Yüksek').length, color: '#ef4444' },
    { name: 'Orta', value: punchItems.filter(i => i.status === 'Açık' && i.severity === 'Orta').length, color: '#f97316' },
    { name: 'Düşük', value: punchItems.filter(i => i.status === 'Açık' && i.severity === 'Düşük').length, color: '#3b82f6' },
  ].filter(i => i.value > 0);

  const teamDistData = [
    { name: 'Sahada', value: fieldStaff, color: '#22c55e' },
    { name: 'Ofiste', value: officeStaff, color: '#3b82f6' },
    { name: 'İzinli', value: teamMembers.filter(m => m.status === 'İzinli').length, color: '#cbd5e1' },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full bg-slate-50">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Yönetici Paneli</h2>
          <p className="text-slate-500 mt-1">Tüm şantiye operasyonlarının anlık özeti.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500">Bugün</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-800">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-orange-200 transition-colors">
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase mb-1">Toplam Bütçe</p>
            <h3 className="text-2xl font-bold text-slate-800">₺{(totalBudget / 1000000).toFixed(1)}M</h3>
            <div className="text-xs text-slate-400 mt-1">Harcama: ₺{(totalSpent / 1000000).toFixed(1)}M</div>
          </div>
          <div className="p-4 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors">
            <Wallet size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-orange-200 transition-colors">
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase mb-1">Aktif İhaleler</p>
            <h3 className="text-2xl font-bold text-slate-800">{activeTenders.length}</h3>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              {wonTenders.length} Kazanılan
            </div>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
            <Gavel size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-orange-200 transition-colors">
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase mb-1">Kritik Stok</p>
            <h3 className={`text-2xl font-bold ${criticalStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{criticalStockCount}</h3>
            <div className="text-xs text-slate-400 mt-1">Malzeme Azalıyor</div>
          </div>
          <div className={`p-4 rounded-xl transition-colors ${criticalStockCount > 0 ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-slate-50 text-slate-400'}`}>
            <PackageSearch size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-orange-200 transition-colors">
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase mb-1">Açık Arızalar</p>
            <h3 className="text-2xl font-bold text-slate-800">{openPunchItems.length}</h3>
            <div className="text-xs text-orange-600 mt-1">{highSeverityPunch} Yüksek Öncelikli</div>
          </div>
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
            <ClipboardList size={28} />
          </div>
        </div>
      </div>

      {/* MAP SECTION */}
      <div className="w-full">
         <ProjectMap projects={projects} />
      </div>

      {/* MAIN CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Financial Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Proje Bazlı Finansal Durum
             </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={financialChartData}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₺${val/1000000}M`} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  formatter={(value: number) => `₺${value.toLocaleString()}`}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Area type="monotone" dataKey="Harcama" fill="#f97316" stroke="#ea580c" fillOpacity={0.2} strokeWidth={2} />
                <Bar dataKey="Bütçe" barSize={20} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Operational Status */}
        <div className="space-y-6">
           {/* Team Distribution */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Users size={18} /> Personel Durumu
              </h3>
              <div className="h-40 flex items-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={teamDistData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                          {teamDistData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="space-y-2 text-sm flex-1">
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Sahada</span> <span className="font-bold">{fieldStaff}</span></div>
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Ofiste</span> <span className="font-bold">{officeStaff}</span></div>
                 </div>
              </div>
           </div>

           {/* Tender Status */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Gavel size={18} /> İhale Hunisi
              </h3>
              <div className="h-40">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tenderStatusData} layout="vertical">
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{fill: 'transparent'}} />
                       <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} fill="#6366f1" />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* BOTTOM ROW: LISTS & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Critical Stock */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500" />
                  Kritik Stok Uyarıları
               </h3>
               <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{criticalStockCount}</span>
            </div>
            <div className="space-y-3">
               {inventoryItems.filter(i => i.status === 'Kritik Stok').slice(0, 5).map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                     <div>
                        <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                        <div className="text-xs text-red-500">Kalan: {item.quantity} {item.unit}</div>
                     </div>
                     <button className="text-xs bg-white border border-red-200 px-2 py-1 rounded text-red-600 hover:bg-red-100">Sipariş</button>
                  </div>
               ))}
               {criticalStockCount === 0 && <div className="text-slate-400 text-sm italic text-center py-4">Kritik seviyede malzeme yok.</div>}
            </div>
         </div>

         {/* Punch List Summary */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
               <ClipboardList size={18} className="text-orange-500" />
               Açık Arızalar (Önem Sırası)
            </h3>
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <div className="w-24 text-xs font-bold text-slate-500">YÜKSEK</div>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className="h-full bg-red-500" style={{ width: `${(highSeverityPunch / (openPunchItems.length || 1)) * 100}%` }}></div>
                  </div>
                  <div className="w-8 text-right font-bold text-sm">{highSeverityPunch}</div>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-24 text-xs font-bold text-slate-500">ORTA</div>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500" style={{ width: `${(punchItems.filter(i => i.status === 'Açık' && i.severity === 'Orta').length / (openPunchItems.length || 1)) * 100}%` }}></div>
                  </div>
                  <div className="w-8 text-right font-bold text-sm">{punchItems.filter(i => i.status === 'Açık' && i.severity === 'Orta').length}</div>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-24 text-xs font-bold text-slate-500">DÜŞÜK</div>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${(punchItems.filter(i => i.status === 'Açık' && i.severity === 'Düşük').length / (openPunchItems.length || 1)) * 100}%` }}></div>
                  </div>
                  <div className="w-8 text-right font-bold text-sm">{punchItems.filter(i => i.status === 'Açık' && i.severity === 'Düşük').length}</div>
               </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Ayın Taşeronu</h4>
               {topSubcontractor ? (
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                     <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                        {topSubcontractor.avatarUrl ? <img src={topSubcontractor.avatarUrl} className="w-full h-full object-cover"/> : <Building2 size={16} />}
                     </div>
                     <div>
                        <div className="font-bold text-sm text-slate-800">{topSubcontractor.name}</div>
                        <div className="text-xs text-orange-600 font-bold flex items-center gap-1">
                           <CheckCircle2 size={10} /> {topSubcontractor.rating} Puan
                        </div>
                     </div>
                  </div>
               ) : <div className="text-sm text-slate-400">Veri yok</div>}
            </div>
         </div>

         {/* Active Tenders List */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
               <Gavel size={18} className="text-indigo-500" />
               Yaklaşan İhaleler
            </h3>
            <div className="space-y-3">
               {activeTenders.slice(0, 4).map(t => (
                  <div key={t.id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                     <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{t.status}</span>
                        <span className="text-xs text-slate-400">{t.date}</span>
                     </div>
                     <div className="font-bold text-slate-700 text-sm line-clamp-1">{t.name}</div>
                     <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin size={10} /> {t.authority}
                     </div>
                  </div>
               ))}
               <button className="w-full text-center text-sm text-indigo-600 font-medium mt-2 hover:underline">Tümünü Gör</button>
            </div>
         </div>

      </div>
    </div>
  );
};
