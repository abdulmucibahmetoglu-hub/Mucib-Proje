
import React from 'react';
import { Project } from '../types';
import { MapPin } from 'lucide-react';

interface ProjectMapProps {
  projects: Project[];
}

export const ProjectMap: React.FC<ProjectMapProps> = ({ projects }) => {
  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden relative h-80 w-full group">
      {/* Background Map Image (Static placeholder for visual appeal without heavy map lib) */}
      <img 
        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000" 
        alt="Map Background" 
        className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity grayscale"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
      
      {/* Overlay Content */}
      <div className="absolute top-6 left-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <MapPin size={20} className="text-orange-500" />
          Proje Haritası
        </h3>
        <p className="text-slate-400 text-xs mt-1">Aktif şantiyelerin coğrafi dağılımı</p>
      </div>

      {/* Simulated Pins */}
      <div className="absolute inset-0 p-8">
         {/* We simulate positioning for demo purposes since we don't have real lat/lng in mock data yet */}
         {projects.slice(0, 3).map((p, i) => (
            <div 
              key={p.id}
              className="absolute flex flex-col items-center group/pin cursor-pointer"
              style={{ 
                top: `${30 + (i * 15)}%`, 
                left: `${20 + (i * 25)}%` 
              }}
            >
               <div className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_0_4px_rgba(249,115,22,0.3)] animate-pulse"></div>
               <div className="mt-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 shadow-lg opacity-0 group-hover/pin:opacity-100 transition-opacity whitespace-nowrap transform translate-y-1">
                  {p.name}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
