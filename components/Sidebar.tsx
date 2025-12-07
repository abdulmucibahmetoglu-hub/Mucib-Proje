
import React from 'react';
import { LayoutDashboard, FolderKanban, ClipboardList, HardHat, Settings, LogOut, Wallet, PackageSearch, CheckSquare, Users, FileSignature, Gavel, BrainCircuit, CalendarRange, Building2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'ai-manager', label: 'AI Şantiye Şefi', icon: BrainCircuit },
    { id: 'projects', label: 'Projeler', icon: FolderKanban },
    { id: 'teams', label: 'Ekipler & Personel', icon: Users },
    { id: 'gantt', label: 'İş Programı (Gantt)', icon: CalendarRange },
    { id: 'tenders', label: 'İhale Yönetimi', icon: Gavel },
    { id: 'reports', label: 'Günlük Raporlar', icon: ClipboardList },
    { id: 'financials', label: 'Hakediş & Bütçe', icon: Wallet },
    { id: 'contracts', label: 'Sözleşmeler', icon: FileSignature },
    { id: 'subcontractors', label: 'Taşeronlar', icon: Building2 },
    { id: 'punchlist', label: 'Eksik İşler (Punch)', icon: CheckSquare },
    { id: 'inventory', label: 'Stok & Demirbaş', icon: PackageSearch },
    { id: 'safety', label: 'İSG & Risk Analizi', icon: HardHat },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-orange-500 p-2 rounded-lg">
          <HardHat size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">ŞantiyePro</h1>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">AI Destekli</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
          <Settings size={20} />
          <span className="text-sm font-medium">Ayarlar</span>
        </button>
      </div>
    </div>
  );
};
