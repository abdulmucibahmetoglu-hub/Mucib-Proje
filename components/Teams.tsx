import React, { useState, useMemo } from 'react';
import { TeamMember, Project, UserRole } from '../types';
import { Users, Phone, Mail, MessageSquare, MapPin, Briefcase, Search, Filter, Plus, X, Send, User, CheckCircle2, Clock, Trash2, Edit2, Image as ImageIcon, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TeamsProps {
  members: TeamMember[];
  projects: Project[];
  onAdd?: (member: TeamMember) => void;
  onUpdate?: (id: string, updates: Partial<TeamMember>) => void;
  onDelete?: (id: string) => void;
  userRole: UserRole;
}

export const Teams: React.FC<TeamsProps> = ({ members, projects, onAdd, onUpdate, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Tümü');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Message State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    phone: '',
    email: '',
    status: 'Ofiste',
    skills: [],
    avatarUrl: ''
  });
  const [skillInput, setSkillInput] = useState('');

  // --- ANALYTICS DATA ---
  const { statusData, roleData } = useMemo(() => {
     // Status Dist
     const statuses = { 'Sahada': 0, 'Ofiste': 0, 'İzinli': 0 };
     members.forEach(m => {
        if(statuses[m.status as keyof typeof statuses] !== undefined) statuses[m.status as keyof typeof statuses]++;
     });
     const sData = [
        { name: 'Sahada', value: statuses['Sahada'], color: '#22c55e' },
        { name: 'Ofiste', value: statuses['Ofiste'], color: '#3b82f6' },
        { name: 'İzinli', value: statuses['İzinli'], color: '#cbd5e1' },
     ].filter(d => d.value > 0);

     // Role Dist
     const roles: Record<string, number> = {};
     members.forEach(m => {
        roles[m.role] = (roles[m.role] || 0) + 1;
     });
     const rData = Object.keys(roles).map(role => ({ name: role, count: roles[role] }));

     return { statusData: sData, roleData: rData };
  }, [members]);

  // Calculate active tasks for each member
  const getActiveTaskCount = (memberName: string) => {
    let count = 0;
    projects.forEach(p => {
      p.tasks?.forEach(t => {
        if (t.assignee && t.assignee.includes(memberName) && t.status !== 'Done') {
          count++;
        }
      });
    });
    return count;
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'Tümü' || m.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    alert(`Mesaj gönderildi: ${selectedMember?.name}\nİçerik: ${messageText}`);
    setMessageText('');
    setIsMessageModalOpen(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setMemberForm({ name: '', role: '', phone: '', email: '', status: 'Ofiste', skills: [], avatarUrl: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingId(member.id);
    setMemberForm(member);
    setIsModalOpen(true);
  };

  const handleSaveMember = () => {
     if(!memberForm.name || !memberForm.role) return;

     if (editingId && onUpdate) {
        onUpdate(editingId, memberForm);
     } else if (onAdd) {
        onAdd({
           id: Date.now().toString(),
           name: memberForm.name!,
           role: memberForm.role!,
           phone: memberForm.phone || '',
           email: memberForm.email || '',
           status: memberForm.status as any || 'Ofiste',
           skills: memberForm.skills || [],
           avatarUrl: memberForm.avatarUrl || ''
        });
     }
     setIsModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
     if(confirm('Bu personeli silmek istediğinize emin misiniz?') && onDelete) {
        onDelete(id);
     }
  };

  const addSkill = () => {
     if(skillInput.trim()) {
        setMemberForm({...memberForm, skills: [...(memberForm.skills || []), skillInput.trim()]});
        setSkillInput('');
     }
  };

  const removeSkill = (skillToRemove: string) => {
     setMemberForm({...memberForm, skills: memberForm.skills?.filter(s => s !== skillToRemove)});
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Sahada': return 'bg-green-100 text-green-700 border-green-200';
      case 'Ofiste': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'İzinli': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative bg-slate-50">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Ekipler & Personel</h2>
          <p className="text-slate-500 mt-1">Saha personeli, görev dağılımları ve iletişim yönetimi.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
        >
          <Plus size={18} />
          Personel Ekle
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={24} />
           </div>
           <div>
              <div className="text-2xl font-bold text-slate-800">{members.length}</div>
              <div className="text-sm text-slate-500">Toplam Personel</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
           <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <MapPin size={24} />
           </div>
           <div>
              <div className="text-2xl font-bold text-slate-800">{members.filter(m => m.status === 'Sahada').length}</div>
              <div className="text-sm text-slate-500">Şu an Sahada</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
           <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Briefcase size={24} />
           </div>
           <div>
              <div className="text-2xl font-bold text-slate-800">
                {projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status !== 'Done').length || 0), 0)}
              </div>
              <div className="text-sm text-slate-500">Aktif Görev Yükü</div>
           </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <PieIcon size={18} className="text-slate-400" />
               Personel Durum Dağılımı
            </h3>
            <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {statusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <BarChart3 size={18} className="text-slate-400" />
               Rol Dağılımı
            </h3>
            <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} interval={0} />
                     <YAxis axisLine={false} tickLine={false} allowDecimals={false} fontSize={10} />
                     <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                     <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 flex-1">
           <Search size={20} className="text-slate-400" />
           <input 
             type="text" 
             placeholder="İsim, rol veya yetenek ara..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
           />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           {['Tümü', 'Sahada', 'Ofiste', 'İzinli'].map(f => (
              <button
                 key={f}
                 onClick={() => setFilterStatus(f)}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 {f}
              </button>
           ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map(member => {
          const activeTasks = getActiveTaskCount(member.name);
          return (
            <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center group relative">
               <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded border ${getStatusColor(member.status)}`}>
                  {member.status}
               </div>
               
               {/* Edit/Delete Actions */}
               <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(member)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors">
                     <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteMember(member.id)} className="p-1.5 bg-slate-100 hover:bg-red-50 rounded text-slate-500 hover:text-red-500 transition-colors">
                     <Trash2 size={14} />
                  </button>
               </div>

               <div className="w-20 h-20 rounded-full mb-4 relative">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover rounded-full border-2 border-white shadow-md" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-md">
                       <User size={32} />
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${member.status === 'Sahada' ? 'bg-green-500' : member.status === 'Ofiste' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
               </div>

               <h3 className="text-lg font-bold text-slate-800 mb-1">{member.name}</h3>
               <p className="text-sm text-slate-500 font-medium mb-4">{member.role}</p>

               <div className="flex flex-wrap gap-1 justify-center mb-6">
                  {member.skills.map((skill, i) => (
                     <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">
                        {skill}
                     </span>
                  ))}
               </div>

               <div className="w-full border-t border-slate-100 pt-4 mt-auto">
                  <div className="flex justify-between items-center mb-4 text-sm">
                     <span className="text-slate-500">Aktif Görevler</span>
                     <span className={`font-bold ${activeTasks > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                        {activeTasks}
                     </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                     <button onClick={() => window.location.href=`tel:${member.phone}`} className="flex items-center justify-center p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Ara">
                        <Phone size={18} />
                     </button>
                     <button onClick={() => window.location.href=`mailto:${member.email}`} className="flex items-center justify-center p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="E-posta Gönder">
                        <Mail size={18} />
                     </button>
                     <button 
                        onClick={() => { setSelectedMember(member); setIsMessageModalOpen(true); }}
                        className="flex items-center justify-center p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors" 
                        title="Uygulama İçi Mesaj"
                     >
                        <MessageSquare size={18} />
                     </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Message Modal */}
      {isMessageModalOpen && selectedMember && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200">
                        {selectedMember.avatarUrl ? <img src={selectedMember.avatarUrl} className="w-full h-full object-cover"/> : <User className="p-1 text-slate-400"/>}
                     </div>
                     <div>
                        <h3 className="font-bold text-sm text-slate-800">{selectedMember.name}</h3>
                        <p className="text-xs text-slate-500">Mesaj Gönder</p>
                     </div>
                  </div>
                  <button onClick={() => setIsMessageModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-4">
                  <textarea 
                     value={messageText}
                     onChange={(e) => setMessageText(e.target.value)}
                     className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 resize-none text-sm"
                     placeholder="Mesajınızı yazın..."
                  autoFocus
                  />
                  <div className="flex justify-between items-center mt-4">
                     <div className="flex gap-2 text-xs text-slate-400">
                        <Clock size={14} />
                        <span>Anında iletilecek</span>
                     </div>
                     <button 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                     >
                        <Send size={16} />
                        Gönder
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                        <input type="text" value={memberForm.name} onChange={(e) => setMemberForm({...memberForm, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rol / Ünvan</label>
                        <input type="text" value={memberForm.role} onChange={(e) => setMemberForm({...memberForm, role: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500" placeholder="Örn: Mimar" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                        <select value={memberForm.status} onChange={(e) => setMemberForm({...memberForm, status: e.target.value as any})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white">
                           <option value="Ofiste">Ofiste</option>
                           <option value="Sahada">Sahada</option>
                           <option value="İzinli">İzinli</option>
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input type="text" value={memberForm.phone} onChange={(e) => setMemberForm({...memberForm, phone: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-Posta</label>
                        <input type="email" value={memberForm.email} onChange={(e) => setMemberForm({...memberForm, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Profil Fotoğrafı URL</label>
                     <div className="flex gap-2">
                        <ImageIcon className="text-slate-400 mt-2.5" size={20}/>
                        <input type="text" value={memberForm.avatarUrl} onChange={(e) => setMemberForm({...memberForm, avatarUrl: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500" placeholder="https://..." />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Yetenekler</label>
                     <div className="flex gap-2 mb-2">
                        <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()} className="flex-1 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-orange-500" placeholder="Yetenek yaz ve ekle..." />
                        <button onClick={addSkill} className="px-4 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700">Ekle</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {memberForm.skills?.map((skill, idx) => (
                           <span key={idx} className="bg-slate-100 px-2 py-1 rounded text-xs flex items-center gap-1 border border-slate-200">
                              {skill}
                              <button onClick={() => removeSkill(skill)} className="hover:text-red-500"><X size={12}/></button>
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">İptal</button>
                  <button onClick={handleSaveMember} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Kaydet</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};