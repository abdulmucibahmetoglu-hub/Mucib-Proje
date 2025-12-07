
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DailyReports } from './components/DailyReports';
import { SafetyAnalysis } from './components/SafetyAnalysis';
import { Projects } from './components/Projects';
import { Financials } from './components/Financials';
import { PunchList } from './components/PunchList';
import { Inventory } from './components/Inventory';
import { Subcontractors } from './components/Subcontractors';
import { Contracts } from './components/Contracts';
import { Tenders } from './components/Tenders';
import { AISiteManager } from './components/AISiteManager';
import { AIChatOverlay } from './components/AIChatOverlay';
import { GanttSchedule } from './components/GanttSchedule';
import { Teams } from './components/Teams';
import { Toast } from './components/ui/Toast';
import { Project, ProjectStatus, TaskPriority, Task, PaymentRecord, InventoryItem, PunchItem, DailyReport, Subcontractor, Contract, Tender, TeamMember, UserRole, ProjectDocument } from './types';

// Mock Data
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Vadi İstanbul Rezidans',
    location: 'Sarıyer, İstanbul',
    client: 'Özel Yatırımcı',
    siteManager: 'Müh. Ahmet Yılmaz',
    status: ProjectStatus.IN_PROGRESS,
    progress: 65,
    budget: 52000000,
    spent: 31000000,
    startDate: '2023-09-01',
    endDate: '2024-12-15',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
    description: '12 katlı, 4 bloktan oluşan lüks konut projesi. Kapalı otopark ve sosyal tesisler dahil.',
    documents: [],
    tasks: []
  },
  {
    id: '2',
    name: 'Sahil Park Evleri - Etap 2',
    location: 'Kartal, İstanbul',
    client: 'SiteMaster GYO',
    siteManager: 'Mimar Selin Demir',
    status: ProjectStatus.PLANNING,
    progress: 15,
    budget: 28000000,
    spent: 1500000,
    startDate: '2024-03-10',
    endDate: '2025-06-30',
    imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&q=80&w=600',
    description: '40 adet villa ve ortak havuz alanı inşaatı.',
    documents: [],
    tasks: []
  }
];

const MOCK_SUBCONTRACTORS: Subcontractor[] = [
    { id: '1', name: 'Akım Elektrik Ltd.', taxId: '1234567890', trade: 'Elektrik', phone: '0532 555 0011', email: 'info@akimelektrik.com', rating: 9.2, contactPerson: 'Mehmet Bey', avatarUrl: '' },
    { id: '2', name: 'BetonSA Hazır Beton', taxId: '9876543210', trade: 'Kaba Yapı', phone: '0212 444 0022', email: 'satis@betonsa.com', rating: 8.5, contactPerson: 'Ayşe Hanım', avatarUrl: '' }
]; 
const MOCK_CONTRACTS: Contract[] = [];
const MOCK_TENDERS: Tender[] = [];
const MOCK_TEAM: TeamMember[] = [
    { id: '1', name: 'Ali Veli', role: 'Saha Şefi', phone: '0555 111 2233', email: 'ali@sirket.com', status: 'Sahada', skills: ['Betonarme', 'İSG'], avatarUrl: '' },
    { id: '2', name: 'Zeynep Yılmaz', role: 'Mimar', phone: '0555 444 5566', email: 'zeynep@sirket.com', status: 'Ofiste', skills: ['AutoCAD', 'Revit'], avatarUrl: '' }
];

const App: React.FC = () => {
  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Proje Müdürü');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // -- GLOBAL STATE MANAGEMENT --
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentRecord[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [reportHistory, setReportHistory] = useState<DailyReport[]>([]);

  // Initialize Data
  useEffect(() => {
      setProjects(MOCK_PROJECTS);
      setSubcontractors(MOCK_SUBCONTRACTORS);
      setContracts(MOCK_CONTRACTS);
      setTenders(MOCK_TENDERS);
      setTeamMembers(MOCK_TEAM);
      showToast("Sistem hazır", 'success');
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // -- HANDLERS --

  // Projects
  const handleAddProject = async (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
    showToast("Proje eklendi", 'success');
  };

  const handleDeleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    showToast("Proje silindi", 'success');
  };

  const handleTaskUpdate = (projectId: string, taskId: string, updates: Partial<Task>) => {
    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id !== projectId) return project;
      const updatedTasks = project.tasks?.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      return { ...project, tasks: updatedTasks };
    }));
  };

  const handleAddTask = (projectId: string, newTask: Task) => {
    setProjects(prevProjects => prevProjects.map(project => {
       if(project.id !== projectId) return project;
       return { ...project, tasks: [...(project.tasks || []), newTask] };
    }));
  };

  const handleUpdateProjectImage = (projectId: string, imageUrl: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, imageUrl } : p));
  };

  const handleAddProjectDocument = (projectId: string, doc: ProjectDocument) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, documents: [...(p.documents || []), doc] };
      }
      return p;
    }));
  };

  const handleDeleteProjectDocument = (projectId: string, docId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, documents: p.documents?.filter(d => d.id !== docId) };
      }
      return p;
    }));
  };

  // Financials
  const handleAddPayment = (newRecord: PaymentRecord) => {
    setPaymentData(prev => [...prev, newRecord]);
    showToast("Hakediş kaydedildi", 'success');
  };

  const handleDeletePayment = (id: string) => {
    setPaymentData(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePayment = (id: string, updates: Partial<PaymentRecord>) => {
    setPaymentData(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Subcontractors
  const handleAddSubcontractor = (sub: Subcontractor) => setSubcontractors(prev => [...prev, sub]);
  const handleDeleteSubcontractor = (id: string) => setSubcontractors(prev => prev.filter(s => s.id !== id));
  const handleUpdateSubcontractor = (id: string, updates: Partial<Subcontractor>) => setSubcontractors(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

  // Contracts
  const handleAddContract = (contract: Contract) => setContracts(prev => [...prev, contract]);
  const handleDeleteContract = (id: string) => setContracts(prev => prev.filter(c => c.id !== id));
  const handleUpdateContract = (id: string, updates: Partial<Contract>) => setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

  // Tenders
  const handleAddTender = (tender: Tender) => setTenders(prev => [...prev, tender]);
  const handleDeleteTender = (id: string) => setTenders(prev => prev.filter(t => t.id !== id));
  const handleUpdateTender = (id: string, updates: Partial<Tender>) => setTenders(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

  // Teams
  const handleAddTeamMember = (member: TeamMember) => setTeamMembers(prev => [...prev, member]);
  const handleUpdateTeamMember = (id: string, updates: Partial<TeamMember>) => setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  const handleDeleteTeamMember = (id: string) => setTeamMembers(prev => prev.filter(m => m.id !== id));

  // Punch List
  const handlePunchStatusToggle = (id: string) => {
    setPunchItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Açık' ? 'Çözüldü' : item.status === 'Çözüldü' ? 'Onaylandı' : 'Açık';
        return { ...item, status: nextStatus as any };
      }
      return item;
    }));
  };
  const handlePunchDelete = (id: string) => setPunchItems(prev => prev.filter(i => i.id !== id));
  const handlePunchAdd = (item: PunchItem) => setPunchItems(prev => [item, ...prev]);
  const handleUpdatePunchItem = (id: string, updates: Partial<PunchItem>) => setPunchItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));

  // Inventory
  const handleInventoryUpdate = (id: string, delta: number) => {
    setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item));
  };
  const handleInventoryAdd = (item: InventoryItem) => setInventoryItems(prev => [item, ...prev]);
  const handleInventoryUpdateItem = (id: string, updates: Partial<InventoryItem>) => setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  const handleInventoryDelete = (id: string) => setInventoryItems(prev => prev.filter(item => item.id !== id));

  // Reports
  const handleSaveReport = (report: DailyReport) => setReportHistory(prev => [report, ...prev]);
  const handleDeleteReport = (id: string) => setReportHistory(prev => prev.filter(r => r.id !== id));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard projects={projects} tenders={tenders} inventoryItems={inventoryItems} punchItems={punchItems} subcontractors={subcontractors} teamMembers={teamMembers} financialData={paymentData} />;
      case 'ai-manager':
        return <AISiteManager projects={projects} userRole={userRole} />;
      case 'projects':
        return <Projects projects={projects} userRole={userRole} onUpdateTask={handleTaskUpdate} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} onAddTask={handleAddTask} onUpdateProjectImage={handleUpdateProjectImage} onAddDocument={handleAddProjectDocument} onDeleteDocument={handleDeleteProjectDocument} />;
      case 'gantt':
        return <GanttSchedule projects={projects} onAddTask={handleAddTask} userRole={userRole} />;
      case 'teams':
        return <Teams members={teamMembers} projects={projects} onAdd={handleAddTeamMember} onUpdate={handleUpdateTeamMember} onDelete={handleDeleteTeamMember} userRole={userRole} />;
      case 'tenders':
        return <Tenders tenders={tenders} onAdd={handleAddTender} onDelete={handleDeleteTender} userRole={userRole} />;
      case 'financials':
        return <Financials paymentData={paymentData} onAddPayment={handleAddPayment} onDeletePayment={handleDeletePayment} onUpdatePayment={handleUpdatePayment} subcontractors={subcontractors} contracts={contracts} projects={projects} userRole={userRole} />;
      case 'reports':
        return <DailyReports projects={projects} history={reportHistory} userRole={userRole} onSaveReport={handleSaveReport} onDeleteReport={handleDeleteReport} />;
      case 'subcontractors':
        return <Subcontractors subcontractors={subcontractors} onAdd={handleAddSubcontractor} onDelete={handleDeleteSubcontractor} onUpdate={handleUpdateSubcontractor} contracts={contracts} projects={projects} userRole={userRole} />;
      case 'contracts':
        return <Contracts contracts={contracts} projects={projects} subcontractors={subcontractors} onAdd={handleAddContract} onDelete={handleDeleteContract} onUpdate={handleUpdateContract} userRole={userRole} />;
      case 'punchlist':
        return <PunchList items={punchItems} onToggleStatus={handlePunchStatusToggle} onDelete={handlePunchDelete} onAdd={handlePunchAdd} onUpdate={handleUpdatePunchItem} userRole={userRole} />;
      case 'inventory':
        return <Inventory items={inventoryItems} onUpdateQuantity={handleInventoryUpdate} onAddItem={handleInventoryAdd} onDelete={handleInventoryDelete} onUpdate={handleInventoryUpdateItem} projects={projects} userRole={userRole} />;
      case 'safety':
        return <SafetyAnalysis userRole={userRole} />;
      default:
        return <Dashboard projects={projects} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Top Header */}
        <div className="absolute top-6 right-8 z-50 flex items-center gap-4">
           <select 
             value={userRole}
             onChange={(e) => setUserRole(e.target.value as UserRole)}
             className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm cursor-pointer hover:bg-white"
           >
              <option value="Proje Müdürü">Proje Müdürü (Admin)</option>
              <option value="Şantiye Şefi">Şantiye Şefi (Editör)</option>
              <option value="Saha Mühendisi">Saha Mühendisi (İzleyici)</option>
           </select>
           
           <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-2 bg-green-600`}>
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              CANLI SİSTEM
           </div>
        </div>

        {renderContent()}
        <AIChatOverlay />
      </main>
    </div>
  );
};

export default App;
