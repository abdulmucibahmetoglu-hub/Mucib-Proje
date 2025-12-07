
import React, { useState, useMemo, useRef } from 'react';
import { Project, Task, TaskPriority, UserRole } from '../types';
import { CalendarRange, Download, Printer, ChevronRight, ChevronLeft, Calendar, Building2, User, Plus, X, Save, Upload, FileSpreadsheet, FileDown, Layers, Layout } from 'lucide-react';

interface GanttScheduleProps {
  projects: Project[];
  onAddTask?: (projectId: string, task: Task) => void;
  userRole: UserRole;
}

export const GanttSchedule: React.FC<GanttScheduleProps> = ({ projects, onAddTask, userRole }) => {
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New Task Form State (Modal)
  const [newTask, setNewTask] = useState<Partial<Task>>({
     title: '',
     startDate: '',
     dueDate: '',
     weight: 0,
     priority: TaskPriority.MEDIUM,
     status: 'To Do'
  });

  // Inline Task Entry State
  const [inlineTask, setInlineTask] = useState({
    title: '',
    startDate: '',
    dueDate: '',
    weight: ''
  });

  // Determine which projects to display based on view mode
  const displayProjects = useMemo(() => {
    if (viewMode === 'all') {
      return projects;
    }
    const single = projects.find(p => p.id === selectedProjectId);
    return single ? [single] : [];
  }, [projects, viewMode, selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId); // For "Single" specific logic like Add Task default

  // --- GANTT CALCULATION LOGIC ---

  // 1. Determine Timeline Range based on DISPLAYED projects
  const timeline = useMemo(() => {
    // Collect all tasks from displayed projects
    const allTasks = displayProjects.flatMap(p => p.tasks || []);

    if (allTasks.length === 0) {
      const today = new Date();
      return { 
         start: new Date(today.getFullYear(), today.getMonth() - 1, 1), 
         end: new Date(today.getFullYear(), today.getMonth() + 2, 0), 
         months: [
            { label: today.toLocaleDateString('tr-TR', { month: 'short' }), year: today.getFullYear(), monthIndex: today.getMonth() }
         ],
         durationMs: 1 // prevent divide by zero
      };
    }

    const startDates = allTasks.map(t => new Date(t.startDate || new Date().toISOString()).getTime());
    const endDates = allTasks.map(t => new Date(t.dueDate).getTime());

    // Also include project start/end dates to ensure the project header bar fits if tasks are missing dates
    displayProjects.forEach(p => {
        startDates.push(new Date(p.startDate).getTime());
        endDates.push(new Date(p.endDate).getTime());
    });

    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));

    // Buffer: Start 1 month before, End 1 month after
    const viewStart = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
    const viewEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);

    // Generate Month Columns
    const months: { label: string, year: number, monthIndex: number }[] = [];
    const current = new Date(viewStart);
    while (current <= viewEnd) {
      months.push({
        label: current.toLocaleDateString('tr-TR', { month: 'short' }),
        year: current.getFullYear(),
        monthIndex: current.getMonth()
      });
      current.setMonth(current.getMonth() + 1);
    }

    return { start: viewStart, end: viewEnd, months, durationMs: viewEnd.getTime() - viewStart.getTime() };
  }, [displayProjects]);

  // 2. Helper to position bars
  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = date.getTime() - timeline.start.getTime();
    const pos = (diff / timeline.durationMs) * 100;
    return Math.max(0, Math.min(100, pos)); // Clamp between 0-100
  };

  const getWidth = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const duration = end.getTime() - start.getTime();
    const width = (duration / timeline.durationMs) * 100;
    return Math.max(0.5, width); // Minimum visibility
  };

  // 3. Task Progress Status Helper
  const getTaskProgress = (task: Task) => {
    if (task.status === 'Done') return 100;
    if (task.status === 'In Progress') return 50; // Mock percentage
    return 0;
  };

  const calculateDurationDays = (start: string, end: string) => {
    if(!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  // 4. Financial Calculation (Aggregate)
  const financialData = useMemo(() => {
    let totalBudget = 0;
    let totalEarned = 0;
    let globalTotalWeight = 0; // Conceptual total units
    let globalCompletedWeight = 0;

    displayProjects.forEach(p => {
        totalBudget += p.budget;
        
        let projectWeight = 0;
        let projectCompleted = 0;

        p.tasks?.forEach(task => {
            const weight = task.weight || 0;
            const progress = getTaskProgress(task);
            projectWeight += weight;
            projectCompleted += (weight * progress) / 100;
        });

        // Earned value for this project
        const projectProgressRatio = projectWeight > 0 ? projectCompleted / projectWeight : 0;
        totalEarned += p.budget * projectProgressRatio;

        globalTotalWeight += projectWeight;
        globalCompletedWeight += projectCompleted;
    });

    const globalProgress = totalBudget > 0 ? (totalEarned / totalBudget) * 100 : 0;

    return { totalBudget, totalEarned, globalProgress };
  }, [displayProjects]);

  const handleAddTask = () => {
     if(!newTask.title || !newTask.startDate || !newTask.dueDate || !onAddTask || !selectedProject) return;

     const taskToAdd: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        status: 'To Do',
        priority: newTask.priority || TaskPriority.MEDIUM,
        startDate: newTask.startDate,
        dueDate: newTask.dueDate,
        weight: Number(newTask.weight) || 0,
        description: '',
        history: []
     };

     onAddTask(selectedProject.id, taskToAdd);
     setIsModalOpen(false);
     setNewTask({ title: '', startDate: '', dueDate: '', weight: 0, priority: TaskPriority.MEDIUM });
  };

  // Handle Inline Add (Only works in Single Project View currently for simplicity)
  const handleInlineAdd = () => {
    if(viewMode === 'all') {
        alert("Hızlı ekleme yapmak için lütfen 'Tek Proje' görünümüne geçin.");
        return;
    }
    if(!inlineTask.title || !inlineTask.startDate || !inlineTask.dueDate || !onAddTask || !selectedProject) return;

    const taskToAdd: Task = {
      id: Date.now().toString(),
      title: inlineTask.title,
      status: 'To Do',
      priority: TaskPriority.MEDIUM,
      startDate: inlineTask.startDate,
      dueDate: inlineTask.dueDate,
      weight: Number(inlineTask.weight) || 0,
      description: 'Hızlı giriş',
      history: []
    };

    onAddTask(selectedProject.id, taskToAdd);
    setInlineTask({ title: '', startDate: '', dueDate: '', weight: '' }); // Reset
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInlineAdd();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(viewMode === 'all') {
        alert("Excel yüklemek için lütfen belirli bir proje seçin.");
        return;
    }
    const file = e.target.files?.[0];
    if (!file || !onAddTask || !selectedProject) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      let addedCount = 0;
      
      lines.forEach((line, index) => {
        if (index === 0) return; 
        const parts = line.split(',');
        if (parts.length >= 3) {
          const title = parts[0]?.trim();
          const start = parts[1]?.trim();
          const end = parts[2]?.trim();
          const weight = parts[3]?.trim();

          if (title && start && end) {
             onAddTask(selectedProject.id, {
                id: Date.now().toString() + index,
                title,
                startDate: start,
                dueDate: end,
                weight: Number(weight) || 0,
                status: 'To Do',
                priority: TaskPriority.MEDIUM
             });
             addedCount++;
          }
        }
      });
      alert(`${addedCount} adet iş kalemi başarıyla eklendi.`);
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const headers = "İş Kalemi Adı,Başlangıç Tarihi (YYYY-MM-DD),Bitiş Tarihi (YYYY-MM-DD),Pursantaj (%)";
    const example = "Örnek Duvar İmalatı,2024-06-01,2024-06-15,10";
    const csvContent = "\uFEFF" + headers + "\n" + example;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'is_programi_sablon.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50 overflow-hidden relative">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">İş Programı (Gantt)</h2>
          <p className="text-slate-500 mt-1">
             {viewMode === 'all' ? 'Tüm projelerin zaman çizelgesi ve kaynak planlaması.' : 'Proje takvimi ve imalat süreleri.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
           
           {/* View Toggle */}
           <div className="bg-slate-200 p-1 rounded-xl flex items-center">
              <button 
                onClick={() => setViewMode('single')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'single' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <Layout size={14} /> Tek Proje
              </button>
              <button 
                onClick={() => setViewMode('all')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <Layers size={14} /> Tüm Projeler
              </button>
           </div>

           {/* Project Select (Only visible in Single mode) */}
           {viewMode === 'single' && (
             <select 
               value={selectedProjectId}
               onChange={(e) => setSelectedProjectId(e.target.value)}
               className="bg-white border border-slate-300 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm min-w-[200px]"
             >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           )}
           
           <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="p-2.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-dashed border-slate-300 bg-white"
                title="Örnek Şablon İndir"
              >
                <FileDown size={20} />
              </button>

              <div className="relative">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={viewMode === 'all'}
                    className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-medium transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={18} />
                    <span className="hidden sm:inline">Excel Yükle</span>
                  </button>
              </div>
           </div>

           <button 
             onClick={() => window.print()}
             className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-slate-900/10"
           >
             <Printer size={18} />
             <span className="hidden sm:inline">Yazdır</span>
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      {displayProjects.length > 0 ? (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
           
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-xs font-bold text-slate-400 uppercase mb-1">Görüntülenen Bütçe</div>
                 <div className="text-xl font-bold text-slate-800">₺{(financialData.totalBudget / 1000000).toFixed(2)}M</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-xs font-bold text-slate-400 uppercase mb-1">Kümülatif İlerleme</div>
                 <div className="text-xl font-bold text-green-600">%{financialData.globalProgress.toFixed(1)}</div>
                 <div className="text-xs text-slate-400">Finansal Ağırlıklı</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-xs font-bold text-slate-400 uppercase mb-1">Hak Edilen Tutar</div>
                 <div className="text-xl font-bold text-orange-600">₺{(financialData.totalEarned / 1000000).toFixed(2)}M</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-xs font-bold text-slate-400 uppercase mb-1">Proje / Görev</div>
                 <div className="text-xl font-bold text-slate-800">{displayProjects.length} / {displayProjects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)}</div>
              </div>
           </div>

           {/* Chart Container */}
           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-slate-800 rounded-sm"></div>
                       <span>Proje Süresi</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                       <span>Görevler</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar size={16} />
                    {timeline.start.toLocaleDateString('tr-TR')} - {timeline.end.toLocaleDateString('tr-TR')}
                 </div>
              </div>

              {/* Split View: List | Timeline */}
              <div className="flex-1 flex overflow-hidden">
                 {/* Left: Task List Table */}
                 <div className="w-5/12 border-r border-slate-200 overflow-y-auto bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                          <tr>
                             <th className="p-3 border-b border-slate-200 font-bold text-slate-600">İş Kalemi / Proje</th>
                             <th className="p-3 border-b border-slate-200 font-bold text-slate-600 w-24 text-center">Başlangıç</th>
                             <th className="p-3 border-b border-slate-200 font-bold text-slate-600 w-24 text-center">Bitiş</th>
                             <th className="p-3 border-b border-slate-200 font-bold text-slate-600 w-16 text-center">%W</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {displayProjects.map((project) => (
                             <React.Fragment key={project.id}>
                                {/* Project Header Row */}
                                <tr className="bg-slate-100 hover:bg-slate-200/50 sticky top-[41px] z-10">
                                   <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                                      <Building2 size={16} className="text-slate-500"/>
                                      {project.name}
                                   </td>
                                   <td className="p-3 text-center text-xs font-semibold">{project.startDate}</td>
                                   <td className="p-3 text-center text-xs font-semibold">{project.endDate}</td>
                                   <td className="p-3 text-center text-xs font-bold">{project.progress}%</td>
                                </tr>

                                {/* Task Rows */}
                                {project.tasks?.map((task, idx) => (
                                   <tr key={task.id} className="hover:bg-slate-50">
                                      <td className="p-3 pl-8 font-medium text-slate-600 truncate max-w-[200px]" title={task.title}>
                                         <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Done' ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                                            {task.title}
                                         </div>
                                      </td>
                                      <td className="p-3 text-center text-slate-500 text-xs">{task.startDate}</td>
                                      <td className="p-3 text-center text-slate-500 text-xs">{task.dueDate}</td>
                                      <td className="p-3 text-center">
                                         <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">{task.weight || 0}</span>
                                      </td>
                                   </tr>
                                ))}
                             </React.Fragment>
                          ))}
                          
                          {/* Inline Entry Row (Only in Single Mode) */}
                          {viewMode === 'single' && (
                            <tr className="bg-orange-50/30">
                               <td className="p-2 pl-3">
                                  <div className="flex items-center gap-2">
                                     <Plus size={14} className="text-orange-400" />
                                     <input 
                                       type="text" 
                                       placeholder="Hızlı Görev Ekle..." 
                                       value={inlineTask.title}
                                       onChange={(e) => setInlineTask({...inlineTask, title: e.target.value})}
                                       onKeyDown={handleInlineKeyDown}
                                       className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-orange-400"
                                     />
                                  </div>
                               </td>
                               <td className="p-2">
                                  <input 
                                    type="date" 
                                    value={inlineTask.startDate}
                                    onChange={(e) => setInlineTask({...inlineTask, startDate: e.target.value})}
                                    onKeyDown={handleInlineKeyDown}
                                    className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:border-orange-400"
                                  />
                               </td>
                               <td className="p-2">
                                  <input 
                                    type="date" 
                                    value={inlineTask.dueDate}
                                    onChange={(e) => setInlineTask({...inlineTask, dueDate: e.target.value})}
                                    onKeyDown={handleInlineKeyDown}
                                    className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:border-orange-400"
                                  />
                               </td>
                               <td className="p-2">
                                  <input 
                                    type="number"
                                    placeholder="%" 
                                    min="0" max="100"
                                    value={inlineTask.weight}
                                    onChange={(e) => setInlineTask({...inlineTask, weight: e.target.value})}
                                    onKeyDown={handleInlineKeyDown}
                                    className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-center text-xs outline-none focus:border-orange-400"
                                  />
                               </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 {/* Right: Gantt Timeline */}
                 <div className="w-7/12 overflow-x-auto overflow-y-auto relative bg-slate-50/30">
                    <div className="min-w-[800px] h-full">
                       {/* Timeline Header */}
                       <div className="flex h-10 border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
                          {timeline.months.map((m, i) => (
                             <div key={i} className="flex-1 border-r border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[100px]">
                                {m.label} '{m.year.toString().slice(2)}
                             </div>
                          ))}
                       </div>

                       {/* Timeline Rows */}
                       <div className="relative">
                          {/* Grid Lines */}
                          <div className="absolute inset-0 flex pointer-events-none h-full">
                             {timeline.months.map((_, i) => (
                                <div key={i} className="flex-1 border-r border-slate-200/50 min-w-[100px]"></div>
                             ))}
                          </div>

                          {/* Bars */}
                          {displayProjects.map((project) => (
                             <React.Fragment key={project.id}>
                                {/* Project Header Bar Space */}
                                <div className="h-[45px] bg-slate-100/30 border-b border-slate-200 relative flex items-center sticky z-10">
                                   <div 
                                      className="absolute h-4 bg-slate-800 rounded-full opacity-20"
                                      style={{ 
                                         left: `${getPosition(project.startDate)}%`, 
                                         width: `${getWidth(project.startDate, project.endDate)}%` 
                                      }}
                                   ></div>
                                </div>

                                {/* Task Bars */}
                                {project.tasks?.map((task) => {
                                   const left = getPosition(task.startDate || project.startDate);
                                   const width = getWidth(task.startDate || project.startDate, task.dueDate);
                                   const progress = getTaskProgress(task);
                                   
                                   return (
                                      <div key={task.id} className="h-[45px] border-b border-slate-100 relative flex items-center hover:bg-slate-100/50 transition-colors">
                                         <div 
                                           className="absolute h-5 bg-orange-200 rounded-md border border-orange-300 shadow-sm cursor-pointer hover:bg-orange-300 transition-all group overflow-hidden"
                                           style={{ left: `${left}%`, width: `${width}%` }}
                                           title={`${task.title} | ${task.assignee || 'Atanmadı'} | ${progress}%`}
                                         >
                                            {/* Progress Fill */}
                                            <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }}></div>
                                            
                                            {/* Info Tooltip/Label */}
                                            <div className="absolute inset-0 flex items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <span className="text-[9px] font-bold text-orange-900 truncate bg-white/50 px-1 rounded backdrop-blur-sm mr-1">
                                                  {progress}%
                                               </span>
                                               {task.assignee && (
                                                  <div className="flex items-center gap-1 bg-slate-800/80 text-white rounded-full px-1.5 py-0.5 text-[8px]">
                                                     <User size={8} /> {task.assignee.split(' ')[0]}
                                                  </div>
                                               )}
                                            </div>
                                         </div>
                                      </div>
                                   );
                                })}
                             </React.Fragment>
                          ))}
                          
                          {/* Spacer for Inline Add */}
                          {viewMode === 'single' && <div className="h-[45px]"></div>}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Building2 size={48} className="mb-4 opacity-20" />
            <p>Görüntülenecek proje yok.</p>
         </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">Yeni İş Kalemi Ekle</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">İş Kalemi Adı</label>
                     <input 
                        type="text" 
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
                        placeholder="Örn: Duvar İmalatı"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç</label>
                        <input 
                           type="date" 
                           value={newTask.startDate}
                           onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500 text-slate-600"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş</label>
                        <input 
                           type="date" 
                           value={newTask.dueDate}
                           onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500 text-slate-600"
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pursantaj (%)</label>
                        <input 
                           type="number" 
                           min="0"
                           max="100"
                           value={newTask.weight}
                           onChange={(e) => setNewTask({...newTask, weight: Number(e.target.value)})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500"
                        />
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
               </div>
               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">İptal</button>
                  <button onClick={handleAddTask} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Kaydet</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
