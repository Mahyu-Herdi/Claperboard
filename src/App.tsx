import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProjectSettings } from './views/ProjectSettings';
import { ScriptBreakdown } from './views/ScriptBreakdown';
import { ShotList } from './views/ShotList';
import { Storyboard } from './views/Storyboard';
import { CallSheet } from './views/CallSheet';
import { StoryConcept } from './views/StoryConcept';
import { ensureDefaultProject } from './db/db';
import { DialogProvider } from './context/DialogContext';
import { ClapperTransition } from './components/ClapperTransition';

function MainApp() {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('currentView') || 'metadata';
  });
  const [projectId, setProjectId] = useState<number | null>(null);
  
  // Custom Clapper Transition States
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);
  const [isTransitionActive, setIsTransitionActive] = useState(false);

  // Initialize Theme on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const root = document.documentElement;
    if (savedTheme === 'dark' || !savedTheme) {
      root.classList.add('dark');
      if (!savedTheme) localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId) {
      setProjectId(Number(savedProjectId));
    } else {
      ensureDefaultProject().then(id => {
        if (id) {
          setProjectId(id);
          localStorage.setItem('currentProjectId', id.toString());
        }
      });
    }
  }, []);

  // Force metadata view if there is no active project
  useEffect(() => {
    if (projectId === null && currentView !== 'metadata') {
      setCurrentView('metadata');
      localStorage.setItem('currentView', 'metadata');
    }
  }, [projectId, currentView]);

  const handleNavigate = (view: string) => {
    if (view === currentView) return;
    setTransitionTarget(view);
    setIsTransitionActive(true);
  };

  const handleTransitionComplete = () => {
    if (transitionTarget) {
      setCurrentView(transitionTarget);
      localStorage.setItem('currentView', transitionTarget);
    }
  };

  const handleProjectSelect = (id: number | null) => {
    setProjectId(id);
    if (id) {
      localStorage.setItem('currentProjectId', id.toString());
    } else {
      localStorage.removeItem('currentProjectId');
    }
  };

  // Turn off transition after animations complete
  useEffect(() => {
    if (isTransitionActive) {
      const timer = setTimeout(() => {
        setIsTransitionActive(false);
        setTransitionTarget(null);
      }, 750); // Time for the clap close, clack text, and open swing
      return () => clearTimeout(timer);
    }
  }, [isTransitionActive, transitionTarget]);

  const getViewLabel = (view: string | null) => {
    switch (view) {
      case 'metadata': return 'Proyek (Settings)';
      case 'concept': return 'Konsep Cerita (Premis & Outline)';
      case 'script': return 'Skenario (Script)';
      case 'shotlist': return 'Daftar Shot';
      case 'storyboard': return 'STORY BOARD';
      case 'callsheet': return 'Jadwal Syuting';
      default: return 'Scene';
    }
  };

  const renderView = () => {
    if (projectId === null) {
      return <ProjectSettings projectId={null} onSelectProject={handleProjectSelect} />;
    }
    
    switch (currentView) {
      case 'metadata':
        return <ProjectSettings projectId={projectId} onSelectProject={handleProjectSelect} />;
      case 'concept':
        return <StoryConcept projectId={projectId} onNavigate={handleNavigate} />;
      case 'script':
        return <ScriptBreakdown projectId={projectId} />;
      case 'shotlist':
        return <ShotList projectId={projectId} />;
      case 'storyboard':
        return <Storyboard projectId={projectId} />;
      case 'callsheet':
        return <CallSheet projectId={projectId} />;
      default:
        return <ProjectSettings projectId={projectId} onSelectProject={handleProjectSelect} />;
    }
  };


  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[var(--color-clay-bg)] text-[var(--color-clay-dark)] font-sans p-2 md:p-4 gap-4 md:gap-4">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-1 flex flex-col overflow-y-auto min-h-0 pb-28 md:pb-0 w-full max-w-full">
        {renderView()}
      </main>

      {/* Super Smooth Film Clapper Transition Overlay */}
      <ClapperTransition 
        isOpen={isTransitionActive}
        onTransitionComplete={handleTransitionComplete}
        targetLabel={getViewLabel(transitionTarget)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DialogProvider>
      <MainApp />
    </DialogProvider>
  );
}

