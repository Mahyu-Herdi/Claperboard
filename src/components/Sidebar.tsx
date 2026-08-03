import React, { useState, useEffect } from 'react';
import { Film, Settings, Clapperboard, ListVideo, Image as ImageIcon, FileText, BookOpen, Edit2, Download } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { exportComprehensivePDF } from '../utils/exportComprehensivePDF';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  projectId?: number | null;
}

export function Sidebar({ currentView, onNavigate, projectId }: Props) {
  const [brandText, setBrandText] = useState('ERBEA PRE - PRO');
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState('ERBEA PRE - PRO');

  const [isNavVisible, setIsNavVisible] = useState(true);

  const project = useLiveQuery(
    () => (projectId ? db.projects.get(projectId) : db.projects.orderBy('id').last()),
    [projectId]
  );
  const scenes = useLiveQuery(
    () => (project?.id ? db.scenes.where({ projectId: project.id }).sortBy('order') : []),
    [project?.id]
  ) || [];
  const shots = useLiveQuery(
    () => (project?.id ? db.shots.where({ projectId: project.id }).sortBy('order') : []),
    [project?.id]
  ) || [];

  const handleExportAll = () => {
    if (!project) return;
    exportComprehensivePDF(project, scenes, shots);
  };

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_brand_text');
    if (saved) {
      setBrandText(saved);
      setTempText(saved);
    }
  }, []);

  useEffect(() => {
    let lastScrollY = 0;
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      const currentScrollY = mainEl.scrollTop;
      // Ignore very small scroll movements to prevent stuttering
      if (Math.abs(currentScrollY - lastScrollY) < 12) return;

      if (currentScrollY > lastScrollY && currentScrollY > 40) {
        // Scrolling down -> hide navigation
        setIsNavVisible(false);
      } else {
        // Scrolling up -> show navigation
        setIsNavVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleStartEdit = () => {
    setTempText(brandText);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = tempText.trim();
    if (trimmed) {
      setBrandText(trimmed);
      localStorage.setItem('sidebar_brand_text', trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const navItems = [
    { id: 'metadata', label: 'Proyek', icon: Settings },
    { id: 'concept', label: 'Konsep', icon: BookOpen },
    { id: 'script', label: 'Skenario', icon: FileText },
    { id: 'shotlist', label: 'Daftar Shot', icon: ListVideo },
    { id: 'storyboard', label: 'STORY BOARD', icon: ImageIcon },
    { id: 'callsheet', label: 'Jadwal', icon: Clapperboard },
  ];

  return (
    <>
      {/* Floating Bottom Navigation for Mobile */}
      <nav 
        style={{
          transform: `translateX(-50%) translateY(${isNavVisible ? '0' : '100px'})`,
          opacity: isNavVisible ? 1 : 0,
          pointerEvents: isNavVisible ? 'auto' : 'none',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
        }}
        className="fixed bottom-4 left-1/2 w-[94%] max-w-lg bg-[#E0E0E0]/95 dark:bg-[#1a1a20]/95 backdrop-blur-md border border-white/50 dark:border-white/10 flex justify-around items-center py-2 px-1 z-50 md:hidden no-print shadow-[0_12px_32px_rgba(0,0,0,0.12),_inset_2px_2px_4px_rgba(255,255,255,0.7),_inset_-2px_-2px_4px_rgba(0,0,0,0.05)] rounded-[20px]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-black dark:text-white font-black scale-105'
                  : 'text-black/50 dark:text-white/50 font-bold hover:text-black/80 dark:hover:text-white/80'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'clay-btn-dark mb-0.5' : 'mb-0.5'}`}>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className="text-[8px] tracking-tight uppercase font-extrabold">{item.label}</span>
            </button>
          );
        })}

      </nav>

      {/* Sidebar for Desktop */}
      <nav className="hidden md:flex w-56 flex-col gap-4 clay-card p-4 md:p-6 no-print shrink-0 overflow-y-auto">
        <div className="h-12 w-full clay-inset flex items-center justify-center mb-2 md:mb-4 px-2 relative group">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full px-1">
              <Film className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-500" />
              <input
                type="text"
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent font-black text-xs italic tracking-tight uppercase outline-none text-zinc-900 dark:text-zinc-100 border-b border-amber-500/50 focus:border-amber-500 py-0.5"
                autoFocus
                maxLength={20}
              />
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              title="Klik untuk ubah nama studio/aplikasi"
              className="flex items-center gap-2 cursor-pointer w-full justify-center group/btn hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Film className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 group-hover/btn:scale-110 transition-transform" />
              <span className="font-black text-xs italic tracking-tight truncate max-w-[130px] select-none text-zinc-900 dark:text-zinc-100">
                {brandText}
              </span>
              <Edit2 className="w-3 h-3 text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 group-hover/btn:text-amber-600 dark:group-hover/btn:text-amber-400 transition-all ml-1 shrink-0" />
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 p-3 text-sm font-bold shrink-0 md:shrink-auto transition-all ${
                  isActive
                    ? 'clay-btn-dark'
                    : 'clay-btn opacity-60 hover:opacity-100 hover:scale-[1.02] active:scale-95'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="uppercase tracking-wide">
                  {item.id === 'callsheet'
                    ? 'Jadwal Syuting'
                    : item.id === 'concept'
                    ? 'Konsep Cerita'
                    : item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-3 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
          <button
            onClick={handleExportAll}
            disabled={!project}
            title="Unduh 1 File PDF berisi Konsep Cerita, Skenario, Storyboard & Call Sheet"
            className="clay-btn !bg-amber-500 hover:!bg-amber-600 !text-black p-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Unduh Semua PDF</span>
          </button>
          <p className="text-[9px] text-zinc-500 dark:text-zinc-400 text-center font-medium leading-tight">
            1 PDF: Konsep, Skenario, Storyboard & Call Sheet
          </p>
        </div>
      </nav>
    </>
  );
}
