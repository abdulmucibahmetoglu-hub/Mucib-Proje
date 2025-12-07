
import React, { useState } from 'react';
import { Project, ProjectStatus, TaskPriority, Task, UserRole, ProjectDocument } from '../types';
import { MapPin, Calendar, ArrowRight, X, DollarSign, CheckSquare, Clock, AlertTriangle, Sparkles, Loader2, Download, History, User, FileText, Plus, Building2, HardHat, PieChart as PieIcon, Image as ImageIcon, Layout, Activity, Trash2, Edit, File, FileSpreadsheet, Box } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { analyzeProject } from '../services/geminiService';

interface ProjectsProps {
  projects: Project[];
  userRole?: UserRole;
  onUpdateTask?: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  onAddProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onAddTask?: (projectId: string, task: Task) => void;
  onUpdateProjectImage?: (projectId: string, imageUrl: string) => void;
  onAddDocument?: (projectId: string, doc: ProjectDocument) => void;
  onDeleteDocument?: (projectId: string, docId: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ 
  projects, 
  userRole = 'Proje Müdürü',
  onUpdateTask, 
  onAddProject, 
  onDeleteProject, 
  onAddTask,
  onUpdateProjectImage,
  onAddDocument,
  onDeleteDocument
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'documents'>('overview');
  
  // New Project State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    location: '',
    client: '',
    siteManager: '',
    budget: 0,
    startDate: '',
    endDate: '',
    description: '',
    status: ProjectStatus.PLANNING,
    progress: 0,
    spent: 0,
    imageUrl: ''
  });

  // Manual Task Add State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    status: 'To Do',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    assignee: ''
  });

  const canEdit = userRole === 'Proje Müdürü';
  const canAdd = userRole === 'Proje Müdürü';

  // Derive selected project from props to ensure data is always fresh
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  // Derive selected task
  const selectedTask = selectedProject?.tasks?.find(t => t.id === selectedTaskId) || null;

  // Chart Data Preparation for Dashboard
  const statusData = [
    { name: 'Planlama', value: projects.filter(p => p.status === ProjectStatus.PLANNING).length, color: '#a855f7' },
    { name: 'Devam Ediyor', value: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length, color: '#3b82f6' },
    { name: 'Tamamlandı', value: projects.filter(p => p.status === ProjectStatus.COMPLETED).length, color: '#22c55e' },
    { name: 'Beklemede', value: projects.filter(p => p.status === ProjectStatus.ON_HOLD).length, color: '#f97316' },
  ].filter(item => item.value > 0);

  // Chart Data for Budget vs Spent
  const budgetChartData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    budget: p.budget,
    spent: p.spent
  }));

  // Chart Data for Selected Project Task Statuses
  const taskStatusStats = selectedProject?.tasks ? [
    { name: 'Yapılacak', count: selectedProject.tasks.filter(t => t.status === 'To Do').length, fill: '#94a3b8' },
    { name: 'Sürüyor', count: selectedProject.tasks.filter(t => t.status === 'In Progress').length, fill: '#3b82f6' },
    { name: 'Kontrol', count: selectedProject.tasks.filter(t => t.status === 'Review').length, fill: '#f59e0b' },
    { name: 'Tamam', count: selectedProject.tasks.filter(t => t.status === 'Done').length, fill: '#22c55e' },
  ] : [];

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case ProjectStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case ProjectStatus.PLANNING: return 'bg-purple-100 text-purple-700';
      case ProjectStatus.ON_HOLD: return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.IN_PROGRESS: return 'Devam Ediyor';
      case ProjectStatus.COMPLETED: return 'Tamamlandı';
      case ProjectStatus.PLANNING: return 'Planlama';
      case ProjectStatus.ON_HOLD: return 'Beklemede';
      default: return status;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL: return 'text-red-600 bg-red-50 border-red-200';
      case TaskPriority.HIGH: return 'text-orange-600 bg-orange-50 border-orange-200';
      case TaskPriority.MEDIUM: return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const handleAnalyze = async (project: Project) => {
    setIsAnalyzing(true);
    const insight = await analyzeProject(project);
    setAiInsight(insight);
    setIsAnalyzing(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        if (onDeleteProject) {
            onDeleteProject(id);
            if(selectedProjectId === id) setSelectedProjectId(null);
        }
    }
  }

  const closeProjectModal = () => {
    setSelectedProjectId(null);
    setAiInsight(null);
    setActiveDetailTab('overview');
  };
  
  const handleCreateProject = () => {
    if (!newProject.name || !onAddProject) return;

    const projectToAdd: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      location: newProject.location || '',
      client: newProject.client || '',
      siteManager: newProject.siteManager || '',
      status: ProjectStatus.PLANNING, // Default status
      progress: 0,
      budget: Number(newProject.budget) || 0,
      spent: 0,
      startDate: newProject.startDate || new Date().toISOString().split('T')[0],
      endDate: newProject.endDate || '',
      description: newProject.description || '',
      imageUrl: newProject.imageUrl || '',
      tasks: [],
      documents: []
    };

    onAddProject(projectToAdd);
    setIsNewProjectModalOpen(false);
    setNewProject({ name: '', location: '', client: '', siteManager: '', budget: 0, startDate: '', endDate: '', description: '', imageUrl: '', status: ProjectStatus.PLANNING });
  };

  const handleAddTask = () => {
    if (!newTask.title || !selectedProjectId || !onAddTask) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      status: newTask.status as any,
      priority: newTask.priority as TaskPriority,
      dueDate: newTask.dueDate || '',
      assignee: newTask.assignee || '',
      description: '',
      history: []
    };

    onAddTask(selectedProjectId, task);
    setIsTaskModalOpen(false);
    setNewTask({ title: '', status: 'To Do', priority: TaskPriority.MEDIUM, dueDate: '', assignee: '' });
  };

  // Image Upload for Project Cover
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0] && selectedProjectId && onUpdateProjectImage) {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        onUpdateProjectImage(selectedProjectId, imageUrl);
    }
  };

  // Document Upload
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0] && selectedProjectId && onAddDocument) {
        const file = e.target.files[0];
        const fileUrl = URL.createObjectURL(file);
        
        let type: ProjectDocument['type'] = 'OTHER';
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (ext === 'pdf') type = 'PDF';
        else if (['xls', 'xlsx', 'csv'].includes(ext || '')) type = 'EXCEL';
        else if (['dwg', 'dxf'].includes(ext || '')) type = 'DWG';
        else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) type = 'IMAGE';

        const newDoc: ProjectDocument = {
            id: Date.now().toString(),
            name: file.name,
            type: type,
            url: fileUrl,
            uploadDate: new Date().toLocaleDateString('tr-TR'),
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        };

        onAddDocument(selectedProjectId, newDoc);
    }
  };

  const downloadFile = (doc: ProjectDocument) => {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const getDocIcon = (type: ProjectDocument['type']) => {
      switch(type) {
          case 'PDF': return <FileText className="text-red-500" />;
          case 'EXCEL': return <FileSpreadsheet className="text-green-600" />;
          case 'DWG': return <Box className="text-blue-600" />; // Box as CAD placeholder
          case 'IMAGE': return <ImageIcon className="text-purple-500" />;
          default: return <File className="text-slate-400" />;
      }
  };

  const handleExportCSV = () => {
    const safe = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Proje ID', 'Proje Adı', 'Konum', 'İdare', 'Şantiye Şefi', 'Proje Durumu', 'İlerleme (%)', 
      'Bütçe', 'Harcanan', 'Başlangıç', 'Bitiş', 'Açıklama', 
      'Görev Başlığı', 'Görev Durumu', 'Görev Önceliği', 'Sorumlu', 'Görev Bitiş'
    ];

    const rows: string[] = [];

    projects.forEach(p => {
      const projectData = [
        p.id, p.name, p.location, p.client, p.siteManager, 
        getStatusLabel(p.status), p.progress, p.budget, p.spent, 
        p.startDate, p.endDate, p.description
      ];

      if (p.tasks && p.tasks.length > 0) {
        p.tasks.forEach(t => {
          rows.push([
            ...projectData.map(safe),
            safe(t.title),
            safe(t.status),
            safe(t.priority),
            safe(t.assignee),
            safe(t.dueDate)
          ].join(','));
        });
      } else {
        rows.push([
          ...projectData.map(safe),
          '', '', '', '', '' 
        ].join(','));
      }
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `santiye_projeleri_detayli_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative bg-slate-50/50">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes stripes {
          from { background-position: 0 0; }
          to { background-position: 1rem 0; }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
        .animate-stripes {
          animation: stripes 1s linear infinite;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Projeler</h2>
           <p className="text-slate-500 mt-1">Aktif şantiyeleri, bütçeleri ve ilerleme durumlarını yönetin.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-medium shadow-sm"
          >
            <Download size={18} />
            Excel İndir
          </button>
          {canAdd && (
            <button 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors font-medium flex items-center gap-2 shadow-lg shadow-slate-900/10"
            >
                <Plus size={18} />
                Yeni Proje
            </button>
          )}
        </div>
      </div>

      {/* Modern Dashboard Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 z-10">
             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><PieIcon size={20} /></div>
             <h3 className="font-bold text-slate-800">Proje Durumları</h3>
          </div>
          <div className="flex-1 min-h-[200px] relative z-10">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={statusData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
               <div className="text-3xl font-bold text-slate-800">{projects.length}</div>
               <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Toplam</div>
             </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:col-span-2 relative overflow-hidden">
           <div className="flex items-center justify-between mb-4 z-10">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={20} /></div>
                 <h3 className="font-bold text-slate-800">Proje Bütçe Dağılımı</h3>
              </div>
           </div>
           <div className="flex-1 min-h-[200px] z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetChartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                   <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₺${val/1000000}M`} tick={{fontSize: 12, fill: '#64748b'}} />
                   <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                      formatter={(value: number) => `₺${value.toLocaleString()}`}
                   />
                   <Bar dataKey="budget" name="Bütçe" radius={[4, 4, 0, 0]} barSize={32} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-50 to-transparent rounded-tl-full opacity-40 pointer-events-none"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden col-span-1 md:col-span-3 lg:col-span-3">
           <div className="flex items-center gap-2 mb-4 z-10">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
              <h3 className="font-bold text-slate-800">Bütçe vs Harcama Analizi</h3>
           </div>
           <div className="h-64 z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={budgetChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₺${value/1000000}M`} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip 
                       cursor={{fill: '#f8fafc'}}
                       contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                       formatter={(value: number) => `₺${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="budget" name="Bütçe" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
                    <Bar dataKey="spent" name="Harcanan" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => setSelectedProjectId(project.id)}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all cursor-pointer group hover:border-orange-200 overflow-hidden flex flex-col duration-300 relative"
          >
            {project.imageUrl && (
              <div className="h-40 w-full overflow-hidden relative">
                <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-6 text-white">
                   <h3 className="text-xl font-bold drop-shadow-md">{project.name}</h3>
                   <div className="flex items-center gap-2 text-sm text-slate-200 mt-1">
                      <MapPin size={14} />
                      <span>{project.location}</span>
                   </div>
                </div>
                {canEdit && (
                    <div className="absolute top-3 right-3 z-20">
                    <button 
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-slate-400 hover:text-red-500 rounded-lg transition-colors shadow-sm"
                        title="Projeyi Sil"
                    >
                        <Trash2 size={18}/>
                    </button>
                    </div>
                )}
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col relative">
              {!project.imageUrl && (
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{project.name}</h3>
                     <div className="flex flex-col gap-1 mt-1">
                       <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                         <MapPin size={14} />
                         <span>{project.location}</span>
                       </div>
                     </div>
                   </div>
                   {canEdit && (
                       <div>
                        <button 
                            onClick={(e) => handleDelete(e, project.id)}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Projeyi Sil"
                        >
                            <Trash2 size={18}/>
                        </button>
                       </div>
                   )}
                 </div>
              )}
              
              <div className="flex gap-2 mb-4">
                 <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                   {getStatusLabel(project.status)}
                 </span>
                 {project.client && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{project.client}</span>}
              </div>

              <div className="space-y-4 mt-auto">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600 font-medium">İlerleme</span>
                    <span className="text-slate-800 font-bold">%{project.progress}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 rounded-full transition-all duration-1000 relative overflow-hidden shadow-[0_0_10px_rgba(251,146,60,0.3)]" 
                      style={{ width: `${project.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer z-10"></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="flex gap-6">
                     <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bütçe</p>
                        <p className="text-sm font-bold text-slate-700">₺{(project.budget / 1000000).toFixed(1)}M</p>
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Teslim</p>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-sm font-semibold">{project.endDate}</span>
                        </div>
                     </div>
                  </div>
                  <button className="p-2 text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 rounded-full transition-colors">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative h-72 w-full bg-slate-900 group">
                {selectedProject.imageUrl ? (
                    <>
                      <img src={selectedProject.imageUrl} alt="Cover" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 opacity-20 bg-slate-800">
                        <ImageIcon size={80} />
                    </div>
                )}
                
                {/* Update Cover Image Button */}
                <div className="absolute bottom-6 right-6 z-20">
                    <input 
                        type="file" 
                        id="cover-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                    />
                    <label 
                        htmlFor="cover-upload" 
                        className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 border border-white/20 shadow-lg group-hover:bg-white/20"
                    >
                        <Edit size={14} />
                        Kapağı Düzenle
                    </label>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8">
                    <div className="flex justify-between items-end">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-3">
                               <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                                    selectedProject.status === 'In Progress' ? 'bg-blue-500 text-white' : 
                                    selectedProject.status === 'Completed' ? 'bg-green-500 text-white' : 
                                    selectedProject.status === 'On Hold' ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white'
                                }`}>
                                    {getStatusLabel(selectedProject.status)}
                               </span>
                               {selectedProject.client && (
                                 <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                   <Building2 size={12}/> {selectedProject.client}
                                 </span>
                               )}
                            </div>
                            <h2 className="text-4xl font-bold text-white drop-shadow-xl tracking-tight leading-tight">{selectedProject.name}</h2>
                            <div className="flex gap-6 mt-3 text-slate-300 text-sm font-medium">
                                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-orange-400"/> {selectedProject.location}</span>
                                {selectedProject.siteManager && <span className="flex items-center gap-1.5"><User size={16} className="text-blue-400"/> {selectedProject.siteManager}</span>}
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                  onClick={closeProjectModal}
                  className="absolute top-6 right-6 p-2.5 bg-black/20 hover:bg-white/10 rounded-full text-white transition-all backdrop-blur-md z-30 border border-white/10 hover:border-white/30 hover:rotate-90 duration-300"
                >
                  <X size={24} />
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20 px-6">
                <button 
                    onClick={() => setActiveDetailTab('overview')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'overview' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <Layout size={16} />
                    Genel Bakış
                </button>
                <button 
                    onClick={() => setActiveDetailTab('documents')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'documents' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <FileText size={16} />
                    Dosyalar & Belgeler
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
              
              {activeDetailTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    {/* Progress Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-baseline mb-2">
                            <h3 className="font-bold text-slate-800">Proje İlerlemesi</h3>
                            <span className="text-2xl font-bold text-orange-600">%{selectedProject.progress}</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000 relative"
                                style={{ width: `${selectedProject.progress}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-30 animate-stripes"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Info & Tasks */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Proje Özeti</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {selectedProject.description || "Açıklama girilmemiş."}
                                </p>
                                
                                <div className="mt-6">
                                    {!aiInsight ? (
                                        <button 
                                            onClick={() => handleAnalyze(selectedProject)}
                                            disabled={isAnalyzing}
                                            className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-3 rounded-xl transition-colors border border-indigo-200"
                                        >
                                            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                            {isAnalyzing ? 'Yapay Zeka Analizi Yapılıyor...' : 'AI Görüşü Al'}
                                        </button>
                                    ) : (
                                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                <Sparkles size={64} className="text-indigo-900" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-3 text-indigo-800 font-bold text-sm">
                                                <Sparkles size={18} className="text-indigo-600" />
                                                AI Görüşü & Risk Analizi
                                            </div>
                                            <div className="prose prose-sm prose-indigo text-slate-700 max-w-none text-xs leading-relaxed whitespace-pre-line">
                                                {aiInsight}
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button 
                                                    onClick={() => handleAnalyze(selectedProject)}
                                                    disabled={isAnalyzing}
                                                    className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                                                >
                                                    {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                                                    Analizi Yenile
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Task List */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <CheckSquare size={20} className="text-slate-400" />
                                        Görevler
                                    </h3>
                                    {canEdit && (
                                        <button 
                                            onClick={() => setIsTaskModalOpen(true)}
                                            className="text-xs bg-slate-900 text-white px-3 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Ekle
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">İş Kalemi</th>
                                                <th className="px-4 py-3">Durum</th>
                                                <th className="px-4 py-3">Öncelik</th>
                                                <th className="px-4 py-3">Sorumlu</th>
                                                <th className="px-4 py-3 rounded-r-lg text-right">Bitiş</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedProject.tasks?.map((task) => (
                                                <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-4 py-3 font-medium text-slate-700">{task.title}</td>
                                                    <td className="px-4 py-3">
                                                        {canEdit ? (
                                                            <select
                                                                value={task.status}
                                                                onChange={(e) => onUpdateTask && onUpdateTask(selectedProject.id, task.id, { status: e.target.value as any })}
                                                                className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer hover:text-orange-600"
                                                            >
                                                                <option value="To Do">Yapılacak</option>
                                                                <option value="In Progress">Sürüyor</option>
                                                                <option value="Review">Kontrol</option>
                                                                <option value="Done">Tamam</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-600">{task.status}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs">{task.assignee || '-'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500 text-xs">{task.dueDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Stats & Charts */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <DollarSign size={20} className="text-slate-400" />
                                    Finansal Durum
                                </h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Bütçe', amount: selectedProject.budget, fill: '#cbd5e1' },
                                            { name: 'Harcanan', amount: selectedProject.spent, fill: selectedProject.spent > selectedProject.budget ? '#ef4444' : '#f97316' }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} fontSize={10} />
                                            <Tooltip cursor={{fill: 'transparent'}} formatter={(val) => `₺${val.toLocaleString()}`} />
                                            <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
                                    <span className="text-slate-500">Kalan Bütçe</span>
                                    <span className={`font-bold ${selectedProject.budget - selectedProject.spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₺{(selectedProject.budget - selectedProject.spent).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <CheckSquare size={20} className="text-slate-400" />
                                    Görev Durumu
                                </h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={taskStatusStats} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} />
                                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                                {taskStatusStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
              )}

              {activeDetailTab === 'documents' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      {/* Upload Area */}
                      {canEdit && (
                          <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-orange-200 transition-colors">
                              <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-3">
                                  <Download size={24} className="rotate-180" />
                              </div>
                              <h3 className="font-bold text-slate-700 mb-1">Dosya Yükle</h3>
                              <p className="text-sm text-slate-400 mb-4">PDF, Excel, DWG veya Görsel sürükleyip bırakın</p>
                              
                              <input 
                                type="file" 
                                id="doc-upload" 
                                className="hidden" 
                                multiple
                                onChange={handleDocumentUpload}
                              />
                              <label 
                                htmlFor="doc-upload" 
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium cursor-pointer hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                              >
                                Dosya Seç
                              </label>
                          </div>
                      )}

                      {/* File List */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                              <h3 className="font-bold text-slate-800">Proje Dosyaları</h3>
                              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                  {selectedProject.documents?.length || 0} Dosya
                              </span>
                          </div>
                          
                          {selectedProject.documents && selectedProject.documents.length > 0 ? (
                              <div className="divide-y divide-slate-100">
                                  {selectedProject.documents.map((doc) => (
                                      <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                          <div className="flex items-center gap-4">
                                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                  {getDocIcon(doc.type)}
                                              </div>
                                              <div>
                                                  <div className="font-bold text-slate-700 text-sm mb-0.5">{doc.name}</div>
                                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                                      <span>{doc.uploadDate}</span>
                                                      <span>•</span>
                                                      <span>{doc.size || 'Unknown Size'}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <button 
                                                onClick={() => downloadFile(doc)}
                                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="İndir"
                                              >
                                                  <Download size={18} />
                                              </button>
                                              {canEdit && (
                                                  <button 
                                                    onClick={() => onDeleteDocument && onDeleteDocument(selectedProject.id, doc.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Sil"
                                                  >
                                                      <Trash2 size={18} />
                                                  </button>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="p-12 text-center text-slate-400">
                                  <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                  <p>Henüz dosya yüklenmemiş.</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <h3 className="font-bold text-xl text-slate-800">Yeni Proje Oluştur</h3>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
               <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 space-y-5">
                  <h4 className="text-orange-800 font-bold flex items-center gap-2 mb-2">
                     <Layout size={18} />
                     Proje Detayları
                  </h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Proje Adı</label>
                    <input 
                      type="text" 
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Örn: Yeni Yaşam Konutları"
                      className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-slate-800 font-medium placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">İdare / İşveren</label>
                      <input 
                        type="text" 
                        value={newProject.client}
                        onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                        placeholder="Örn: TOKİ"
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Şantiye Şefi</label>
                      <input 
                        type="text" 
                        value={newProject.siteManager}
                        onChange={(e) => setNewProject({...newProject, siteManager: e.target.value})}
                        placeholder="Ad Soyad"
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Konum</label>
                    <input 
                      type="text" 
                      value={newProject.location}
                      onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                      placeholder="Örn: Kadıköy, İstanbul"
                      className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Bütçe (₺)</label>
                        <input 
                          type="number" 
                          value={newProject.budget}
                          onChange={(e) => setNewProject({...newProject, budget: Number(e.target.value)})}
                          className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-sm font-mono"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Kapak Görseli URL</label>
                        <input 
                          type="text" 
                          value={newProject.imageUrl}
                          onChange={(e) => setNewProject({...newProject, imageUrl: e.target.value})}
                          placeholder="https://..."
                          className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-sm"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Başlangıç</label>
                        <input 
                          type="date" 
                          value={newProject.startDate}
                          onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                          className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-sm text-slate-600"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Bitiş</label>
                        <input 
                          type="date" 
                          value={newProject.endDate}
                          onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                          className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white text-sm text-slate-600"
                        />
                     </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-orange-700/70 uppercase mb-1.5">Açıklama</label>
                    <textarea 
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Proje kapsamı ve detayları..."
                      className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none bg-white h-24 resize-none text-sm"
                    />
                  </div>
               </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleCreateProject}
                disabled={!newProject.name}
                className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:shadow-none"
              >
                Projeyi Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Task Add Modal */}
      {isTaskModalOpen && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">Hızlı Görev Ekle</h3>
                  <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Görev Adı</label>
                     <input 
                        type="text" 
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
                        placeholder="Örn: Seramik Seçimi"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                        <select 
                           value={newTask.status}
                           onChange={(e) => setNewTask({...newTask, status: e.target.value as any})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white"
                        >
                           <option value="To Do">Yapılacak</option>
                           <option value="In Progress">Sürüyor</option>
                           <option value="Review">Kontrol</option>
                           <option value="Done">Tamam</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
                        <select 
                           value={newTask.priority}
                           onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white"
                        >
                           <option value="Low">Düşük</option>
                           <option value="Medium">Orta</option>
                           <option value="High">Yüksek</option>
                           <option value="Critical">Kritik</option>
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi</label>
                        <input 
                           type="date" 
                           value={newTask.dueDate}
                           onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500 text-slate-600"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sorumlu Kişi</label>
                        <input 
                           type="text" 
                           value={newTask.assignee}
                           onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
                           placeholder="İsim"
                        />
                     </div>
                  </div>
               </div>
               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">İptal</button>
                  <button onClick={handleAddTask} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Ekle</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
