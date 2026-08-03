import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Project } from '../types';
import { useDialog } from '../context/DialogContext';
import { 
  Film, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Settings, 
  FolderOpen, 
  User, 
  Users, 
  MapPin, 
  Briefcase, 
  Compass, 
  Volume2, 
  FileText,
  Video,
  Clapperboard,
  Sun,
  Moon
} from 'lucide-react';

import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';

interface Props {
  projectId: number | null;
  onSelectProject: (id: number | null) => void;
}

export function ProjectSettings({ projectId, onSelectProject }: Props) {
  const { showConfirm, showAlert } = useDialog();
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDirector, setNewDirector] = useState('');
  const [newDate, setNewDate] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setIsDarkMode(isDark);
  };

  // Live query for all projects
  const projects = useLiveQuery(() => db.projects.toArray());
  
  // State for editing a specific project
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Sync editingProject state with the active projectId when in edit mode
  useEffect(() => {
    if (viewMode === 'edit' && projectId) {
      db.projects.get(projectId).then(p => {
        if (p) setEditingProject(p);
      });
    }
  }, [projectId, viewMode]);

  // Handle changes in edit mode
  const handleFieldChange = async (field: keyof Project, value: string) => {
    if (!editingProject || !editingProject.id) return;
    const updated = { ...editingProject, [field]: value };
    setEditingProject(updated);
    await db.projects.update(editingProject.id, { [field]: value });
  };

  // Handle creating a new project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = await db.projects.add({
      title: newTitle.trim(),
      clientName: '',
      scriptVersion: '1.0',
      date: newDate || new Date().toISOString().split('T')[0],
      shootingDay: 'Hari 1',
      location: '',
      director: newDirector.trim() || '',
      producer: '',
      dp: '',
      ad: '',
      sound: '',
      gaffer: '',
      status: 'active'
    });

    if (newId) {
      onSelectProject(newId);
      setNewTitle('');
      setNewDirector('');
      setNewDate('');
      setIsCreating(false);
      setViewMode('edit'); // open details form for the newly created project
      showAlert('Sukses', `Proyek "${newTitle.trim()}" berhasil dibuat!`, 'success');
    }
  };

  // Handle deleting a project (and cascading delete scenes/shots)
  const handleDeleteProject = async (id: number, title: string) => {
    const confirmed = await showConfirm(
      'Hapus Proyek',
      `Apakah Anda yakin ingin menghapus proyek "${title}"?\n\nTindakan ini akan menghapus semua skenario, papan cerita, dan spesifikasi shot di dalamnya secara permanen!`,
      'error'
    );

    if (confirmed) {
      await db.projects.delete(id);
      await db.scenes.where({ projectId: id }).delete();
      await db.shots.where({ projectId: id }).delete();

      showAlert('Dihapus', `Proyek "${title}" telah dihapus secara permanen.`, 'success');

      // If we deleted the active project, fallback to another project
      if (projectId === id) {
        const remaining = await db.projects.orderBy('id').first();
        if (remaining && remaining.id) {
          onSelectProject(remaining.id);
        } else {
          onSelectProject(null);
          setIsCreating(true);
        }
      }
    }
  };

  // Completely reset the database to zero (delete all projects, scenes, shots)
  const handleWipeDatabase = async () => {
    const confirmed = await showConfirm(
      'Mulai dari Nol?',
      'PERINGATAN! Tindakan ini akan menghapus seluruh data proyek, skenario, shot, dan papan cerita yang ada di browser Anda secara total.\n\nTindakan ini tidak dapat dibatalkan. Apakah Anda ingin melanjutkan?',
      'error'
    );

    if (confirmed) {
      await db.projects.clear();
      await db.scenes.clear();
      await db.shots.clear();
      
      onSelectProject(null);
      setIsCreating(true);
      setViewMode('list');
      
      showAlert('Data Dibersihkan', 'Semua data lama telah berhasil dibersihkan! Anda sekarang dapat membuat proyek baru yang bersih.', 'success');
    }
  };

  // Toggle project status between 'active' and 'completed' directly from card or form
  const toggleProjectStatus = async (projectItem: Project) => {
    if (!projectItem.id) return;
    const currentStatus = projectItem.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'completed' : 'active';
    await db.projects.update(projectItem.id, { status: nextStatus });
    
    showAlert(
      nextStatus === 'completed' ? 'Proyek Selesai' : 'Proyek Aktif Kembali',
      `Status proyek "${projectItem.title}" sekarang diubah menjadi ${nextStatus === 'completed' ? 'SELESAI (Arsip)' : 'DALAM PROSES (Aktif)'}.`,
      'success'
    );
  };

  if (!projects) {
    return <div className="p-8 font-mono text-center">Memuat daftar proyek...</div>;
  }

  return (
    <div className="w-full max-w-full space-y-8 pb-20">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-1 flex items-center gap-2.5">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-2xl clay-btn text-black dark:text-amber-500 hover:scale-110 active:scale-95 transition-all duration-300 outline-none flex items-center justify-center cursor-pointer"
              style={{ boxShadow: 'none' }}
              title="Ketuk untuk mengubah ke tema claymorphism gelap"
            >
              <Clapperboard className="w-8 h-8 stroke-[2.5]" />
            </button>
            <span className="cursor-pointer select-none" onClick={toggleDarkMode} title="Ketuk untuk mengubah ke tema claymorphism gelap">
              ERBEA WEBird Studios
            </span>
          </h2>
          <p className="text-sm text-black/50 font-bold dark:text-zinc-400">
            {viewMode === 'list' 
              ? 'Perusahaan Perfilman & Video Management — Kelola, buat, dan pantau status produksi film Anda secara profesional.' 
              : `Konfigurasi data utama untuk film "${editingProject?.title || ''}"`
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'edit' && (
            <button
              onClick={() => setViewMode('list')}
              className="clay-btn px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
              <span>Semua Proyek</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Quick Stats / Overview banner */}
          <div className="clay-card p-4 flex flex-wrap gap-6 items-center justify-around text-center bg-black/[0.02]">
            <div 
              className={`cursor-pointer hover:opacity-70 transition-opacity ${filter === 'all' ? 'text-amber-500 scale-110' : 'text-black dark:text-white'}`}
              onClick={() => setFilter('all')}
            >
              <span className="text-micro opacity-70 block font-bold">TOTAL PROYEK</span>
              <span className="text-2xl font-black">{projects.length}</span>
            </div>
            <div className="w-px h-8 bg-black/10 hidden sm:block"></div>
            <div 
              className={`cursor-pointer hover:opacity-70 transition-opacity ${filter === 'active' ? 'text-amber-500 scale-110' : 'text-black dark:text-white'}`}
              onClick={() => setFilter('active')}
            >
              <span className="text-micro opacity-70 block font-bold">DALAM PROSES</span>
              <span className="text-2xl font-black">
                {projects.filter(p => !p.status || p.status === 'active').length}
              </span>
            </div>
            <div className="w-px h-8 bg-black/10 hidden sm:block"></div>
            <div 
              className={`cursor-pointer hover:opacity-70 transition-opacity ${filter === 'completed' ? 'text-amber-500 scale-110' : 'text-black dark:text-white'}`}
              onClick={() => setFilter('completed')}
            >
              <span className="text-micro opacity-70 block font-bold">SELESAI (ARCHIVED)</span>
              <span className="text-2xl font-black">
                {projects.filter(p => p.status === 'completed').length}
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* New Project Card Form */}
            {isCreating || projects.length === 0 ? (
              <form onSubmit={handleCreateProject} className="clay-card p-6 border-2 border-black space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
                    <Plus className="w-5 h-5 text-black" />
                    <span>Proyek Baru</span>
                  </h3>
                  {projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="text-xs font-bold text-black/50 hover:text-black"
                    >
                      Batal
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-wider opacity-60">Judul Proyek</label>
                    <input
                      type="text"
                      className="clay-input p-2.5 font-bold"
                      placeholder="Judul Film / Iklan..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-wider opacity-60">Sutradara</label>
                    <input
                      type="text"
                      className="clay-input p-2.5"
                      placeholder="Nama Sutradara..."
                      value={newDirector}
                      onChange={(e) => setNewDirector(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-wider opacity-60">Tanggal Syuting</label>
                    <div className="relative">
                      <CustomDatePicker
                        value={newDate}
                        onChange={(val) => setNewDate(val)}
                        className="w-full"
                        placeholder="Pilih Tanggal..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
                  {projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="clay-btn px-4 py-2 text-xs font-bold uppercase"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="clay-btn !bg-amber-500 hover:!bg-amber-600 !text-black px-5 py-2 text-xs font-black uppercase tracking-wider shadow-[4px_4px_12px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 transition-all"
                  >
                    Buat Proyek
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="clay-card p-6 border-2 border-dashed border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 hover:shadow-[0_8px_30px_rgb(245,158,11,0.15)] transition-all flex flex-col items-center justify-center gap-3 text-amber-700 hover:text-amber-800 min-h-[220px] group active:scale-98"
              >
                <Plus className="w-10 h-10 stroke-[2px] text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="font-black text-sm uppercase tracking-wider text-amber-800">Buat Proyek Baru</span>
              </button>
            )}

            {/* List of projects */}
            {projects.filter(p => {
              if (filter === 'active') return !p.status || p.status === 'active';
              if (filter === 'completed') return p.status === 'completed';
              return true;
            }).map((p) => {
              const isActive = p.id === projectId;
              const isCompleted = p.status === 'completed';
              
              return (
                <div 
                  key={p.id} 
                  className={`clay-card p-6 flex flex-col justify-between transition-all min-h-[220px] ${
                    isActive ? 'border-2 border-black ring-4 ring-black/5' : 'border border-black/5'
                  }`}
                >
                  <div>
                    {/* Top title and status row */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <h3 className="font-black uppercase text-lg leading-tight tracking-tight text-black">
                          {p.title || 'FILM TANPA JUDUL'}
                        </h3>
                        {p.clientName && (
                          <span className="text-[10px] font-bold text-black/50 uppercase tracking-tight block mt-0.5">
                            Klien: {p.clientName}
                          </span>
                        )}
                      </div>

                      {/* Status toggle pill */}
                      <button
                        onClick={() => toggleProjectStatus(p)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                        }`}
                        title="Klik untuk mengubah status proyek"
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 stroke-[2.5px]" />
                            <span>Selesai</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 stroke-[2.5px]" />
                            <span>Proses</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Metadata details list */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-black/5 pt-3 mb-4 text-xs">
                      <div className="flex items-center gap-1.5 text-black/60">
                        <User className="w-3.5 h-3.5 opacity-60" />
                        <span className="font-bold truncate" title={p.director || 'Sutradara N/A'}>
                          Sut: {p.director || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-black/60">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        <span className="font-bold truncate">{p.date || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-black/60 col-span-2">
                        <MapPin className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        <span className="font-bold truncate" title={p.location || 'Lokasi belum diatur'}>
                          {p.location || 'Lokasi belum diatur'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="border-t border-black/5 pt-3 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1">
                      {isActive && (
                        <span className="bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                          Sedang Aktif
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Open project button */}
                      {!isActive && p.id && (
                        <button
                          onClick={() => onSelectProject(p.id!)}
                          className="clay-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:scale-105"
                          title="Set sebagai proyek aktif"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-black" />
                          <span>Buka</span>
                        </button>
                      )}

                      {/* Edit settings button */}
                      <button
                        onClick={() => {
                          if (p.id) {
                            onSelectProject(p.id);
                            setViewMode('edit');
                          }
                        }}
                        className="clay-btn px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 bg-black/[0.03] hover:bg-black/10 hover:scale-105"
                        title="Ubah spesifikasi & konfigurasi proyek"
                      >
                        <Settings className="w-3.5 h-3.5 text-black" />
                        <span>Detail</span>
                      </button>

                      {/* Delete project button */}
                      {p.id && (
                        <button
                          onClick={() => handleDeleteProject(p.id!, p.title)}
                          className="clay-btn text-red-600 hover:text-white hover:bg-red-600 hover:scale-110 active:scale-95 p-1.5 flex items-center justify-center transition-all"
                          title="Hapus Proyek"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      ) : (
        /* Edit Mode: Full project details form */
        <div className="space-y-8 animate-fade-in">
          
          {/* Main Info section */}
          <div className="clay-card p-6 md:p-8 space-y-6">
            <h3 className="font-black uppercase tracking-widest text-sm border-b pb-2.5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-black" />
              <span>Informasi Utama Proyek</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black">Judul Proyek</label>
                <input 
                  type="text" 
                  className="clay-input font-bold bg-transparent focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black">Status Proyek</label>
                <CustomSelect
                  value={editingProject?.status || 'active'}
                  onChange={(val) => handleFieldChange('status', val)}
                  options={[
                    { value: 'active', label: '🔴 DALAM PROSES (AKTIF)' },
                    { value: 'completed', label: '🟢 SELESAI (ARCHIVED)' }
                  ]}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black">Nama Klien / Production House (PH)</label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.clientName || ''}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black">Versi Skenario</label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.scriptVersion || ''}
                  onChange={(e) => handleFieldChange('scriptVersion', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black">Tanggal Syuting</label>
                <div className="relative">
                  <CustomDatePicker
                    value={editingProject?.date || ''}
                    onChange={(val) => handleFieldChange('date', val)}
                    className="w-full"
                    placeholder="Pilih Tanggal..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black">Hari Syuting</label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  placeholder="Hari 1 dari 3"
                  value={editingProject?.shootingDay || ''}
                  onChange={(e) => handleFieldChange('shootingDay', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="text-micro opacity-60 font-black">Lokasi Utama Syuting</label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.location || ''}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Core Crew section */}
          <div className="clay-card p-6 md:p-8 space-y-6">
            <h3 className="font-black uppercase tracking-widest text-sm border-b pb-2.5 flex items-center gap-2">
              <Users className="w-5 h-5 text-black" />
              <span>Kru Utama & Departemen</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Sutradara (Director)</span>
                </label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.director || ''}
                  onChange={(e) => handleFieldChange('director', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  <span>Produser (Producer)</span>
                </label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.producer || ''}
                  onChange={(e) => handleFieldChange('producer', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  <span>DOP / Sinematografer</span>
                </label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.dp || ''}
                  onChange={(e) => handleFieldChange('dp', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  <span>Asisten Sutradara (Astrada)</span>
                </label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.ad || ''}
                  onChange={(e) => handleFieldChange('ad', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  <span>Perekam Suara (Sound Recordist)</span>
                </label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.sound || ''}
                  onChange={(e) => handleFieldChange('sound', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-micro opacity-60 font-black flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  <span>Gaffer (Kepala Pencahayaan)</span>
                </label>
                <input 
                  type="text" 
                  className="clay-input bg-transparent font-semibold focus:ring-2 focus:ring-black/10" 
                  value={editingProject?.gaffer || ''}
                  onChange={(e) => handleFieldChange('gaffer', e.target.value)}
                />
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
