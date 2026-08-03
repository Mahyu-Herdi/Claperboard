import React from 'react';
import { Project } from '../types';

interface Props {
  project: Project | null;
  documentTitle: string;
}

export function ClapperHeader({ project, documentTitle }: Props) {
  if (!project) return null;

  return (
    <header className="bg-[#1a1a1a] border-2 border-black rounded-2xl overflow-hidden mb-8 shadow-lg text-white select-none">
      {/* Top Clapper Stripes */}
      <div className="h-10 clay-header-stripes w-full border-b-4 border-black"></div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="text-micro text-white/50">{documentTitle} - PROD</div>
          <div className="text-3xl font-black italic uppercase text-white">
            {project.title || 'TANPA JUDUL'}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <div>
              <div className="text-micro text-white/50">SUT.</div>
              <div className="font-bold text-xs uppercase text-white">{project.director || 'N/A'}</div>
            </div>
            <div>
              <div className="text-micro text-white/50">DOP.</div>
              <div className="font-bold text-xs uppercase text-white">{project.dp || 'N/A'}</div>
            </div>
            <div>
              <div className="text-micro text-white/50">PROD.</div>
              <div className="font-bold text-xs uppercase text-white">{project.producer || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col justify-center items-center bg-[#151515] border border-white/10 rounded-xl p-4">
          <div className="text-micro text-white/50">TANGGAL</div>
          <div className="text-xl md:text-2xl font-black text-amber-400">{project.date || 'TBA'}</div>
        </div>
        
        <div className="flex flex-col justify-center items-center bg-[#151515] border border-white/10 rounded-xl p-4">
          <div className="text-micro text-white/50">HARI</div>
          <div className="text-xl md:text-2xl font-black text-amber-400">{project.shootingDay || '1'}</div>
        </div>
      </div>
    </header>
  );
}
