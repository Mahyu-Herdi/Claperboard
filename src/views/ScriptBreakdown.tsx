import React, { useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Scene, Shot } from '../types';
import { ShotSpecsEditor } from '../components/ShotSpecsEditor';
import { Plus, Trash2, Camera, HelpCircle, ChevronDown, ChevronUp, BookOpen, MessageSquare, Smile, Video, ImagePlus, Image as ImageIcon, Printer, X, ArrowLeft, Eye, EyeOff, Search } from 'lucide-react';
import { ClapperHeader } from '../components/ClapperHeader';
import { CustomSelect } from '../components/CustomSelect';
import { useDialog } from '../context/DialogContext';
import { ClapperLoader } from '../components/ClapperLoader';
import { ConceptReferenceBanner } from '../components/ConceptReferenceBanner';

function StoryboardFrame({ buffer }: { buffer: ArrayBuffer }) {
  const [url, setUrl] = useState<string>('');

  React.useEffect(() => {
    const blob = new Blob([buffer]);
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [buffer]);

  if (!url) return null;
  return <img src={url} alt="Storyboard Frame" className="w-full h-full object-contain bg-zinc-950 dark:bg-black rounded-xl" referrerPolicy="no-referrer" />;
}

export function ScriptBreakdown({ projectId }: { projectId: number }) {
  const { showConfirm, showAlert } = useDialog();
  const [showGuide, setShowGuide] = useState(false);
  const [printMode, setPrintMode] = useState<'all' | 'script-only' | 'storyboard-only'>('all');
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenScenes, setHiddenScenes] = useState<Set<number>>(new Set());

  const toggleSceneVisibility = (sceneId: number) => {
    setHiddenScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const scenes = useLiveQuery(() => db.scenes.where({ projectId }).sortBy('order'), [projectId]);
  const shots = useLiveQuery(() => db.shots.where({ projectId }).sortBy('order'), [projectId]);

  const extractedCharacters = useMemo(() => {
    if (!scenes) return [];
    const namesSet = new Set<string>();
    scenes.forEach(scene => {
      const text = scene.actionText || '';
      const lines = text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 2) return;
        // Strip out parentheticals like (V.O.), (O.S.), etc.
        const cleanName = trimmed.replace(/\([^)]*\)/g, '').replace(/[:"'\-\d]+/g, '').trim();
        const isUppercase = /^[A-Z\s]+$/.test(cleanName);
        const isKeyword = /^(INT|EXT|DAY|NIGHT|DAWN|DUSK|SCENE|FADE|CUT|DIRECTOR|PRODUCER|DP|SOUND|LOCATION|CAMERA|AUDIO|SHOT|TITLE|CLIENT|VERSION|DATE|DAY\s+\d+|HARI\s+\d+|SHOOTING)$/i.test(cleanName);
        if (isUppercase && !isKeyword && cleanName.length > 1 && cleanName.length < 20) {
          namesSet.add(cleanName);
        }
      });
    });
    return Array.from(namesSet).sort();
  }, [scenes]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeShotId, setActiveShotId] = useState<number | null>(null);

  const [dialogueModal, setDialogueModal] = useState<{
    isOpen: boolean;
    sceneId: number | null;
    actionTextBefore: string;
    char1: string;
    expression1: string;
    dialogue1: string;
    hasReply: boolean;
    char2: string;
    expression2: string;
    dialogue2: string;
  }>({
    isOpen: false,
    sceneId: null,
    actionTextBefore: '',
    char1: '',
    expression1: '',
    dialogue1: '',
    hasReply: false,
    char2: '',
    expression2: '',
    dialogue2: '',
  });

  const handleInsertDialogue = async () => {
    const { sceneId, actionTextBefore, char1, expression1, dialogue1, hasReply, char2, expression2, dialogue2 } = dialogueModal;
    if (!sceneId) return;

    const scene = scenes?.find(s => s.id === sceneId);
    if (!scene) return;

    let extraParts: string[] = [];

    // 1. Action/Visual note
    if (actionTextBefore.trim()) {
      extraParts.push(actionTextBefore.trim());
    }

    // 2. Character 1 Dialogue Block
    if (char1.trim()) {
      const formattedChar1 = char1.trim().toUpperCase();
      let char1Block = formattedChar1;
      
      if (expression1.trim()) {
        char1Block += `\n(${expression1.trim()})`;
      }
      
      if (dialogue1.trim()) {
        char1Block += `\n"${dialogue1.trim()}"`;
      } else {
        char1Block += `\n""`;
      }
      
      extraParts.push(char1Block);
    } else if (dialogue1.trim()) {
      extraParts.push(`"${dialogue1.trim()}"`);
    }

    // 3. Character 2 Dialogue Block (if checked)
    if (hasReply && char2.trim()) {
      const formattedChar2 = char2.trim().toUpperCase();
      let char2Block = formattedChar2;
      
      if (expression2.trim()) {
        char2Block += `\n(${expression2.trim()})`;
      }
      
      if (dialogue2.trim()) {
        char2Block += `\n"${dialogue2.trim()}"`;
      } else {
        char2Block += `\n""`;
      }
      
      extraParts.push(char2Block);
    } else if (hasReply && dialogue2.trim()) {
      extraParts.push(`"${dialogue2.trim()}"`);
    }

    let extraText = '';
    if (extraParts.length > 0) {
      extraText = `\n\n${extraParts.join('\n\n')}`;
    }

    const currentText = scene.actionText || '';
    const updatedText = currentText ? currentText + extraText : extraText.trim();

    await updateScene(sceneId, 'actionText', updatedText);
    
    setDialogueModal({
      isOpen: false,
      sceneId: null,
      actionTextBefore: '',
      char1: '',
      expression1: '',
      dialogue1: '',
      hasReply: false,
      char2: '',
      expression2: '',
      dialogue2: '',
    });

    showAlert('Sukses', 'Format skenario berhasil dimasukkan ke dalam naskah!', 'success');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeShotId) {
      const arrayBuffer = await file.arrayBuffer();
      await db.shots.update(activeShotId, { imageBlob: arrayBuffer });
      showAlert('Sukses', 'Gambar storyboard berhasil diunggah!', 'success');
    }
    setActiveShotId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = async (shotId: number) => {
    const confirmed = await showConfirm(
      'Hapus Gambar',
      'Apakah Anda yakin ingin menghapus gambar papan cerita ini?',
      'warning'
    );
    if (confirmed) {
      await db.shots.update(shotId, { imageBlob: null });
      showAlert('Dihapus', 'Gambar papan cerita telah dihapus.', 'success');
    }
  };

  const triggerUpload = (shotId: number) => {
    setActiveShotId(shotId);
    fileInputRef.current?.click();
  };

  const addScene = async () => {
    const count = await db.scenes.where({ projectId }).count();
    await db.scenes.add({
      projectId,
      sceneNumber: String(count + 1),
      locationType: 'INT',
      time: 'DAY',
      actionText: '',
      order: count
    });
  };

  const updateScene = async (id: number, field: keyof Scene, value: string) => {
    await db.scenes.update(id, { [field]: value });
  };

  const deleteScene = async (id: number) => {
    const confirmed = await showConfirm(
      'Hapus Adegan',
      'Apakah Anda yakin ingin menghapus adegan ini beserta seluruh shot di dalamnya secara permanen?',
      'error'
    );
    if (confirmed) {
      await db.scenes.delete(id);
      const sceneShots = await db.shots.where({ sceneId: id }).toArray();
      await Promise.all(sceneShots.map(s => s.id && db.shots.delete(s.id)));
      showAlert('Sukses', 'Adegan telah berhasil dihapus.', 'success');
    }
  };

  const addShot = async (sceneId: number) => {
    const count = await db.shots.where({ sceneId }).count();
    await db.shots.add({
      projectId,
      sceneId,
      shotType: '',
      cameraAngle: '',
      movement: '',
      focalLength: '',
      frameRate: '24fps',
      rig: 'Tripod',
      lightingNotes: '',
      audioNotes: '',
      order: count
    });
  };

  const updateShot = async (id: number, field: keyof Shot, value: any) => {
    await db.shots.update(id, { [field]: value });
  };

  const deleteShot = async (id: number) => {
    const confirmed = await showConfirm(
      'Hapus Shot',
      'Apakah Anda yakin ingin menghapus shot ini secara permanen?',
      'error'
    );
    if (confirmed) {
      await db.shots.delete(id);
      showAlert('Sukses', 'Shot telah berhasil dihapus.', 'success');
    }
  };


  if (!project || !scenes) return <ClapperLoader />;

  if (isPrintPreview) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-2 md:p-6 font-sans -mx-2 md:-mx-6 -mt-6">
        {/* Sticky Control Top Bar */}
        <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center max-w-7xl mx-auto rounded-2xl shadow-xl no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrintPreview(false)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all"
              title="Kembali ke Editor"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-black text-xs uppercase tracking-widest text-amber-400">PRATINJAU CETAK SKENARIO</h2>
              <p className="text-[10px] text-zinc-400 font-mono">STANDAR A4 PORTRAIT • {scenes.length} ADEGAN</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Print Mode Selector inside Top Bar */}
            <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700">
              <button
                onClick={() => setPrintMode('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  printMode === 'all' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Naskah & Storyboard
              </button>
              <button
                onClick={() => setPrintMode('script-only')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  printMode === 'script-only' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Naskah Saja
              </button>
              <button
                onClick={() => setPrintMode('storyboard-only')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  printMode === 'storyboard-only' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Storyboard Saja
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="clay-btn !bg-amber-500 hover:!bg-amber-600 !text-black px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[4px_4px_15px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak PDF Sekarang
            </button>
            <button
              onClick={() => setIsPrintPreview(false)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Tutup Preview
            </button>
          </div>
        </div>

        {/* Paper Studio Canvas */}
        <div className="w-full py-4 px-1 md:px-8 flex flex-col items-center gap-8 bg-zinc-950/20 rounded-3xl max-w-4xl mx-auto">
          <div className="text-center no-print text-zinc-400 space-y-1 my-2">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">Tampilan Simulasi Cetak Kertas A4</p>
            <p className="text-[10px] opacity-75">Gunakan tombol "Cetak PDF Sekarang" atau tekan Ctrl+P untuk menyimpan sebagai PDF fisik.</p>
          </div>

          {/* PAGE 1: DOKUMEN KONSEP CERITA */}
          <div
            className="w-full md:w-[210mm] bg-white text-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-200 p-[10mm] md:p-[15mm] rounded-sm relative flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:w-full print:bg-transparent"
          >
            <div className="flex-1 flex flex-col justify-between space-y-6">
              {/* Page Top Header */}
              <div className="border-b-4 border-black pb-4 flex justify-between items-end">
                <div>
                  <h1 className="font-sans font-black text-2xl tracking-tighter text-black uppercase">ERBEA PRE-PRO</h1>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">DOKUMEN UTAMA KONSEP CERITA & STRUKTUR ALUR</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black uppercase text-black">{project.title || 'Untitled Project'}</p>
                  <p className="text-[10px] font-bold text-black mt-1">DIR: {project.director || 'ERBEA'}</p>
                </div>
              </div>

              {/* Title Header */}
              <div className="text-center py-4 border-b border-zinc-200">
                <h2 className="font-mono font-black text-lg tracking-wider text-zinc-900 uppercase">KONSEP & STRUKTUR CERITA (STORY BIBLE)</h2>
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">ACUAN RESMI UNTUK SUTRADARA, DESAINER VISUAL, DAN SELURUH KRU PRODUKSI</p>
              </div>

              {/* Core Concept Grid */}
              <div className="grid grid-cols-2 gap-6 my-4">
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-black bg-gray-50">
                    <h3 className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      
                      Premis & Logline Cerita
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed font-semibold">
                      {project.premise || 'Belum diisi konsep premis.'}
                    </p>
                  </div>

                  <div className="p-4 border-l-4 border-black bg-gray-50">
                    <h3 className="text-[10px] text-black font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      
                      Karakter Utama & Karakterisasi
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed">
                      {project.mainCharacter || '-'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-black bg-gray-50">
                    <h3 className="text-[10px] text-black font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      
                      Konflik / Rintangan Utama
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed">
                      {project.mainConflict || '-'}
                    </p>
                  </div>

                  <div className="p-4 border-l-4 border-black bg-gray-50">
                    <h3 className="text-[10px] text-black font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      
                      Pesan Emosional / Inti Cerita
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed italic">
                      {project.emotionalMessage || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Synopsis Section */}
              <div className="p-4 border-l-4 border-black bg-gray-50">
                <h3 className="text-[10px] text-black font-black uppercase tracking-widest mb-2 border-b border-black/20 pb-2">SINOPSIS SINGKAT</h3>
                <p className="font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
                  {project.synopsis || 'Belum diisi sinopsis singkat.'}
                </p>
              </div>

              {/* Three Act Outline */}
              <div className="p-4 border-2 border-black space-y-3 bg-white mt-4">
                <h3 className="text-[11px] text-black font-black uppercase tracking-widest border-b-2 border-black pb-2">OUTLINE STRUKTUR 3 BABAK</h3>
                <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <h4 className="font-extrabold text-[9px] text-amber-700 uppercase mb-1">Babak 1 (Awal / Intro)</h4>
                    <p className="text-[10px] text-zinc-700 leading-relaxed">{project.outlineBeginning || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[9px] text-amber-700 uppercase mb-1">Babak 2 (Tengah / Klimaks)</h4>
                    <p className="text-[10px] text-zinc-700 leading-relaxed">{project.outlineMiddle || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[9px] text-amber-700 uppercase mb-1">Babak 3 (Akhir / Resolusi)</h4>
                    <p className="text-[10px] text-zinc-700 leading-relaxed">{project.outlineEnd || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t-2 border-black pt-3 mt-8 flex justify-between items-center text-[9px] text-black font-bold tracking-widest uppercase">
              <span>ERBEA PRE-PRO STUDIO SYSTEM</span>
              <span>HALAMAN 1 DARI {scenes.length + 1}</span>
            </div>
          </div>

          {scenes.map((scene, sceneIdx) => {
            const sceneShots = shots?.filter(s => s.sceneId === scene.id) || [];
            
            return (
              <div
                key={scene.id}
                className="w-full md:w-[210mm] bg-white text-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-200 p-[10mm] md:p-[15mm] rounded-sm relative flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:w-full print:bg-transparent print-break-before-page md:mt-4"
              >
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  {/* Page Top Header */}
                  <div className="border-b-4 border-black pb-4 flex justify-between items-end">
                    <div>
                      <h1 className="font-sans font-black text-2xl tracking-tighter text-black uppercase">ERBEA PRE-PRO</h1>
                      <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">SCRIPT BREAKDOWN & STORYBOARD</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black uppercase text-black">{project.title || 'Untitled Project'}</p>
                      <p className="text-[10px] font-bold text-black mt-1">DIR: {project.director || 'ERBEA'}</p>
                    </div>
                  </div>

                  {/* Scene Banner Header */}
                  <div className="bg-black p-3 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm bg-white text-black px-2.5 py-1">
                        ADEGAN {scene.sceneNumber}
                      </span>
                      <div>
                        <h2 className="font-black text-xs uppercase tracking-wide text-white">
                          {scene.locationType} - {scene.time}
                        </h2>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-gray-300 font-mono">
                      Shot: <span className="font-bold text-white">{sceneShots.length}</span>
                    </div>
                  </div>

                  {/* Scene Script Block */}
                  {printMode !== 'storyboard-only' && scene.actionText && (
                    <div className="p-4 font-serif text-sm text-black whitespace-pre-wrap leading-relaxed border-l-2 border-gray-300 pl-4 my-4">
                      {scene.actionText}
                    </div>
                  )}

                  {/* Storyboard Block */}
                  {printMode !== 'script-only' && sceneShots.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-[11px] text-black font-black uppercase tracking-widest border-b-2 border-black pb-1.5 mt-4">Storyboard & Shot List Adegan {scene.sceneNumber}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {sceneShots.map((shot, idx) => {
                          const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                          return (
                            <div key={shot.id} className="border border-zinc-200 rounded p-2.5 bg-zinc-50/50 print-break-inside-avoid">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-mono font-black text-[10px] bg-black text-white px-2 py-0.5">
                                  SHOT {shotIdentifier}
                                </span>
                                <span className="text-[8px] font-black uppercase border border-black text-black px-1.5 py-0.5">
                                  {shot.shotType || 'MCU'} • {shot.cameraAngle || 'Eye Level'}
                                </span>
                              </div>
                              <div className={`aspect-video border border-black overflow-hidden flex items-center justify-center relative mb-3 ${shot.imageBlob ? 'bg-zinc-950' : 'bg-gray-100'}`}>
                                {shot.imageBlob ? (
                                  <StoryboardFrame buffer={shot.imageBlob} />
                                ) : (
                                  <span className="text-[8px] font-mono text-zinc-400 select-none uppercase tracking-widest">[BINGKAI BERSALIN]</span>
                                )}
                              </div>
                              <div className="text-[8px] space-y-0.5 text-zinc-600">
                                <div><span className="font-bold">Gerak/Lensa:</span> {shot.movement || 'Statis'} / {shot.focalLength || 'N/A'}</div>
                                <div><span className="font-bold">Rig/FPS:</span> {shot.rig || 'Tripod'} @ {shot.frameRate || '24fps'}</div>
                                {shot.lightingNotes && (
                                  <div className="mt-1 bg-zinc-100 p-1 rounded font-mono text-[7.5px] italic text-zinc-700">
                                    <span className="font-extrabold text-amber-800 uppercase text-[6.5px] tracking-wider block">Catatan Teknis:</span>
                                    {shot.lightingNotes}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Page Footer */}
                <div className="border-t-2 border-black pt-3 mt-8 flex justify-between items-center text-[9px] text-black font-bold tracking-widest uppercase">
                  <span>ERBEA PRE-PRO STUDIO SYSTEM</span>
                  <span>HALAMAN {sceneIdx + 2} DARI {scenes.length + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full pb-20">
      <ClapperHeader project={project} documentTitle="Bedah Skenario & Papan Cerita" />

      {/* Story Concept Reference Banner */}
      <ConceptReferenceBanner project={project} currentStage={3} />

      {/* Hidden File Input for Storyboard Images */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />
      
      {/* Opsi Cetak & Ekspor PDF */}
      <div className="clay-card mb-8 p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="flex flex-col gap-1.5 w-full md:w-auto">
          <span className="text-micro opacity-60">Opsi Ekspor PDF / Cetak</span>
          <div className="flex bg-black/5 p-1 rounded-xl gap-1 flex-wrap">
            <button
              onClick={() => setPrintMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printMode === 'all'
                  ? 'bg-black text-white'
                  : 'hover:bg-black/5 text-black/70'
              }`}
            >
              Naskah & Storyboard
            </button>
            <button
              onClick={() => setPrintMode('script-only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printMode === 'script-only'
                  ? 'bg-black text-white'
                  : 'hover:bg-black/5 text-black/70'
              }`}
            >
              Hanya Skenario (Naskah)
            </button>
            <button
              onClick={() => setPrintMode('storyboard-only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printMode === 'storyboard-only'
                  ? 'bg-black text-white'
                  : 'hover:bg-black/5 text-black/70'
              }`}
            >
              Hanya Storyboard
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={addScene} 
            className="clay-btn px-4 py-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Adegan</span>
          </button>
          <button
            onClick={() => setIsPrintPreview(true)}
            className="clay-btn-dark px-4 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.5px]" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Panduan Pemula Menulis Skenario & Memilih Shot */}
      <div className="clay-card mb-8 p-4 md:p-6 no-print">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full font-black text-sm uppercase tracking-wider text-left"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-black shrink-0" />
            <span>Panduan Pemula: Cara Menulis & Memilih Shot</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-black/50 font-bold bg-black/10 px-2 py-1 rounded">
            <span>{showGuide ? 'Sembunyikan' : 'Tampilkan'}</span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showGuide && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/10 text-sm">
            {/* Kolom 1: Menulis Naskah */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-xs text-black/60 flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[10px] font-black">1</span>
                Cara Menulis Dialog & Aksi
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-black/75">
                <li>
                  <strong>Deskripsi Aksi:</strong> Tulis deskripsi lingkungan atau gerakan fisik karakter langsung di kotak teks besar.
                  <div className="clay-inset p-2 font-mono text-[10px] mt-1">
                    Kamar gelap gulita. BUDI mondar-mandir dengan panik mencari saklar lampu.
                  </div>
                </li>
                <li>
                  <strong>Percakapan/Dialog:</strong> Tulis nama karakter menggunakan <strong>huruf kapital</strong>, lalu langsung ketik dialognya di baris baru di bawahnya.
                  <div className="clay-inset p-2 font-mono text-[10px] mt-1 whitespace-pre">
                    BUDI
                    "Di mana lilin dan korek apinya?!"
                  </div>
                </li>
                <li className="text-black/50 italic">
                  Tip: Gunakan tombol pintasan cepat di bawah kotak teks untuk menyisipkan format otomatis dengan sekali klik!
                </li>
              </ul>
            </div>

            {/* Kolom 2: Memilih Shot */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-xs text-black/60 flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[10px] font-black">2</span>
                Cara Memilih Tipe Shot
              </h4>
              <p className="text-xs text-black/75 font-semibold">
                Gunakan menu "Tambah Shot" di bagian bawah untuk menentukan cara merekam adegan tersebut:
              </p>
              <ul className="space-y-2 text-xs leading-relaxed text-black/75 pl-4 list-disc">
                <li>
                  <strong>Wide Shot (WS):</strong> Menampilkan seluruh lokasi dan lingkungan sekitar (bagus untuk memulai adegan/orientasi).
                </li>
                <li>
                  <strong>Medium Shot (MS):</strong> Menampilkan karakter dari pinggang ke atas (terbaik untuk interaksi/percakapan standar).
                </li>
                <li>
                  <strong>Close Up (CU):</strong> Fokus pada wajah karakter dari bahu ke atas (terbaik untuk menunjukkan ekspresi emosional mendalam atau reaksi terkejut).
                </li>
                <li>
                  <strong>Extreme Close Up (ECU):</strong> Fokus pada detail yang sangat kecil (misal: tulisan di kertas, mata berkedip, jam dinding).
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action / Search Panel */}
      <div className="clay-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between no-print text-sm">
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 text-black/40" />
          <input
            type="text"
            placeholder="Cari Naskah / Adegan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input pl-9 pr-8 py-2 w-full md:w-64 font-bold text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 opacity-50 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {scenes
          .filter(scene => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            const sceneNum = scene.sceneNumber.toLowerCase();
            const action = (scene.actionText || '').toLowerCase();
            const location = (scene.locationType || '').toLowerCase();
            return sceneNum.includes(query) || action.includes(query) || location.includes(query);
          })
          .map((scene) => {
          const isScriptHidden = printMode === 'storyboard-only';
          const isShotsHidden = printMode === 'script-only';
          const isHidden = scene.id ? hiddenScenes.has(scene.id) : false;

          return (
            <div 
              key={scene.id} 
              className={`clay-card p-4 md:p-6 print-break-inside-avoid ${
                isScriptHidden && isShotsHidden ? 'print:hidden' : ''
              }`}
            >
              {/* Scene Header */}
              <div className="flex flex-col md:flex-row gap-4 mb-4 items-start md:items-center clay-inset p-3 group relative">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-micro opacity-50">ADEGAN</span>
                  <input 
                    type="text" 
                    value={scene.sceneNumber} 
                    onChange={(e) => scene.id && updateScene(scene.id, 'sceneNumber', e.target.value)}
                    className="clay-input w-16 p-1 text-center font-bold"
                  />
                </div>
                <div className="flex gap-2 flex-1 w-full md:w-auto">
                  <CustomSelect
                    value={scene.locationType}
                    onChange={(val) => scene.id && updateScene(scene.id, 'locationType', val as any)}
                    options={[
                      { value: 'INT', label: 'INT.' },
                      { value: 'EXT', label: 'EXT.' },
                      { value: 'INT/EXT', label: 'INT/EXT.' }
                    ]}
                    className="flex-1"
                  />
                  <CustomSelect
                    value={scene.time}
                    onChange={(val) => scene.id && updateScene(scene.id, 'time', val as any)}
                    options={[
                      { value: 'DAY', label: 'DAY' },
                      { value: 'NIGHT', label: 'NIGHT' },
                      { value: 'DAWN', label: 'DAWN' },
                      { value: 'DUSK', label: 'DUSK' }
                    ]}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 no-print">
                  <button 
                    onClick={() => scene.id && toggleSceneVisibility(scene.id)} 
                    className="clay-btn hover:brightness-95 active:scale-95 px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase shrink-0"
                    title={isHidden ? "Tampilkan Adegan" : "Sembunyikan Adegan"}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="hidden md:inline">{isHidden ? "Tampilkan" : "Sembunyikan"}</span>
                  </button>
                  <button 
                    onClick={() => scene.id && deleteScene(scene.id)} 
                    className="clay-btn text-red-600 hover:text-red-700 hover:scale-105 active:scale-95 px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase shrink-0"
                    title="Hapus Adegan"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden md:inline">Hapus</span>
                  </button>
                </div>
              </div>

              {!isHidden && (
                <>
              {/* Action Text / Script Section */}
              <div className={`mb-6 ${isScriptHidden ? 'print:hidden' : ''}`}>
                <textarea 
                  value={scene.actionText}
                  onChange={(e) => scene.id && updateScene(scene.id, 'actionText', e.target.value)}
                  placeholder="Catatan aksi atau baris dialog... (mis. Ruangan gelap. BUDI masuk.)"
                  className="clay-input w-full min-h-[120px] resize-y font-serif text-lg leading-relaxed p-4 no-print"
                />
                {/* Print only screenplay render to avoid scrollbar truncation */}
                <div className="print-only hidden font-serif text-lg whitespace-pre-wrap leading-relaxed p-4 border border-black/15 rounded-xl bg-white mb-4">
                  {scene.actionText || '...'}
                </div>

                <div className="flex flex-wrap gap-2 mt-2 text-xs no-print items-center">
                  <span className="text-[10px] uppercase tracking-wider font-black opacity-45">Format Naskah Terpadu:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!scene.id) return;
                      setDialogueModal({
                        isOpen: true,
                        sceneId: scene.id,
                        actionTextBefore: '',
                        char1: extractedCharacters[0] || 'BUDI',
                        expression1: '',
                        dialogue1: '',
                        hasReply: false,
                        char2: extractedCharacters[1] || 'SITI',
                        expression2: '',
                        dialogue2: '',
                      });
                    }}
                    className="clay-btn bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_8px_rgba(245,158,11,0.25)] hover:scale-102 active:scale-98 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 stroke-[2.5px]" />
                    <span>Tambah Dialog, Ekspresi & Aksi Terpadu</span>
                  </button>
                </div>
              </div>

              {/* Shots & Storyboard List */}
              <div className={`pl-0 md:pl-6 space-y-6 border-l-2 border-black/10 ml-1 md:ml-3 ${isShotsHidden ? 'print:hidden' : ''}`}>
                <h4 className="font-black text-xs tracking-widest uppercase mb-3 flex items-center gap-2 text-black/70">
                  <Camera className="w-4 h-4 text-black" />
                  <span>Spesifikasi Shot & Papan Cerita</span>
                </h4>
                
                {shots?.filter(s => s.sceneId === scene.id).map((shot, idx) => (
                  <div key={shot.id} className="relative group clay-card p-4 border border-black/5 shadow-sm rounded-2xl print-break-inside-avoid">
                    <div className="flex items-center justify-between gap-2 mb-3 border-b border-black/5 pb-2">
                      <span className="text-micro bg-black text-white px-2.5 py-1 rounded font-black">
                        SHOT {scene.sceneNumber}{String.fromCharCode(65 + idx)}
                      </span>
                      <button 
                        onClick={() => shot.id && deleteShot(shot.id)} 
                        className="clay-btn text-red-600 hover:text-red-700 hover:scale-105 active:scale-95 px-2 py-1 flex items-center justify-center gap-1 text-[10px] font-black uppercase no-print"
                        title="Hapus Shot"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>

                    {/* Integrated Horizontal Grid: Storyboard on Left, Shot specs on Right */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                      
                      {/* Storyboard Frame Drawing Box */}
                      <div className="md:col-span-4 flex flex-col justify-start">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1.5">Gambar / Papan Cerita</span>
                        <div className={`relative aspect-video clay-inset flex items-center justify-center overflow-hidden min-h-[140px] rounded-xl border border-black/10 ${shot.imageBlob ? 'bg-zinc-950 dark:bg-black' : 'bg-black/5'}`}>
                          {shot.imageBlob ? (
                            <>
                              <StoryboardFrame buffer={shot.imageBlob} />
                              
                              {/* Quick overlay controls */}
                              <div className="absolute top-2 right-2 flex gap-1.5 no-print">
                                <button
                                  onClick={() => shot.id && triggerUpload(shot.id)}
                                  className="clay-btn bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 p-1.5 flex items-center justify-center shadow hover:scale-110 active:scale-95 transition-all"
                                  title="Ganti Gambar"
                                >
                                  <ImagePlus className="w-3.5 h-3.5 text-current stroke-[2.5px]" />
                                </button>
                                <button 
                                  onClick={() => shot.id && removeImage(shot.id)}
                                  className="clay-btn bg-red-600/95 hover:bg-red-600 text-white p-1.5 flex items-center justify-center shadow hover:scale-110 active:scale-95 transition-all"
                                  title="Hapus Gambar"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.5px]" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <button 
                              onClick={() => shot.id && triggerUpload(shot.id)}
                              className="flex flex-col items-center gap-2 text-black/40 hover:text-black transition-all hover:scale-105 active:scale-95 no-print w-full h-full justify-center p-4 bg-black/[0.02] rounded-xl"
                            >
                              <ImagePlus className="w-6 h-6" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Tambah Gambar</span>
                            </button>
                          )}

                          {/* Print fallback outline for nice storyboards */}
                          {!shot.imageBlob && (
                            <div className="hidden print-only text-center text-black/30 font-mono absolute inset-0 flex items-center justify-center border-2 border-dashed border-black/10 m-2 rounded-lg text-[10px]">
                              BINGKAI BERSALIN
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shot Specs Form Column */}
                      <div className="md:col-span-8">
                        <ShotSpecsEditor 
                          shot={shot} 
                          onChange={(field, value) => shot.id && updateShot(shot.id, field, value)} 
                        />
                      </div>

                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => scene.id && addShot(scene.id)} 
                  className="clay-btn px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 mt-4 no-print"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5px]" /> 
                  <span>Tambah Shot</span>
                </button>
              </div>
              </>
              )}
            </div>
          );
        })}

        {scenes.length === 0 && (
          <div className="text-center p-12 clay-card text-gray-500 font-mono">
            Belum ada adegan yang ditambahkan. Klik "Tambah Adegan" untuk mulai membedah skenario Anda.
          </div>
        )}
      </div>

      {/* Dialogue Form Modal */}
      {dialogueModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="popup-card max-w-xl w-full p-6 relative">
            {/* Close button */}
            <button 
              onClick={() => setDialogueModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-black hover:opacity-75 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title / Explanation */}
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-black" />
              <h3 className="font-black text-sm uppercase tracking-wider text-black">Format Dialog, Ekspresi & Aksi Terpadu</h3>
            </div>
            <p className="text-xs text-black/60 mb-6 font-semibold">
              Tulis catatan aksi, nama karakter, ekspresi emosi, dan baris dialog standar industri perfilman secara bersamaan.
            </p>

            {/* Inputs Body */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* Action / Visual Note Row */}
              <div className="flex flex-col gap-1 bg-black/[0.02] p-3 rounded-2xl border border-black/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Video className="w-3.5 h-3.5 text-black/70" />
                  <label className="text-micro font-black uppercase tracking-wider opacity-65">1. Catatan Aksi / Visual (Action Description)</label>
                </div>
                <textarea 
                  rows={2}
                  placeholder="mis. Ruangan seketika sunyi saat pintu berderit terbuka, BUDI menoleh dengan waspada."
                  value={dialogueModal.actionTextBefore}
                  onChange={(e) => setDialogueModal(prev => ({ ...prev, actionTextBefore: e.target.value }))}
                  className="popup-input text-xs p-2.5 font-medium resize-none"
                />
                <span className="text-[9px] opacity-50 font-semibold mt-0.5">Penjelasan gerak fisik, suara, atau keadaan lingkungan sebelum dialog dimulai.</span>
              </div>

              {/* Character 1 Details Block */}
              <div className="bg-black/[0.02] p-3 rounded-2xl border border-black/5 space-y-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-black/70" />
                  <label className="text-micro font-black uppercase tracking-wider opacity-65">2. Dialog Tokoh Utama</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Name Input */}
                  <div className="sm:col-span-7 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-black/50 uppercase">Nama Karakter</span>
                    <input 
                      type="text"
                      placeholder="mis. BUDI"
                      value={dialogueModal.char1}
                      onChange={(e) => setDialogueModal(prev => ({ ...prev, char1: e.target.value }))}
                      className="popup-input text-xs p-2.5 font-bold uppercase"
                    />
                  </div>

                  {/* Expression Input */}
                  <div className="sm:col-span-5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-black/50 uppercase flex items-center gap-1">
                      <Smile className="w-3 h-3 text-black/70" />
                      Ekspresi / Emosi
                    </span>
                    <input 
                      type="text"
                      placeholder="e.g., terengah-engah"
                      value={dialogueModal.expression1}
                      onChange={(e) => setDialogueModal(prev => ({ ...prev, expression1: e.target.value }))}
                      className="popup-input text-xs p-2.5 font-semibold"
                    />
                  </div>
                </div>

                {/* Character 1 Suggestions */}
                {extractedCharacters.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                    <span className="text-[9px] font-black uppercase opacity-50 mr-1">Saran Karakter:</span>
                    {extractedCharacters
                      .filter(name => !dialogueModal.char1 || name.toLowerCase().includes(dialogueModal.char1.toLowerCase()))
                      .slice(0, 6)
                      .map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setDialogueModal(prev => ({ ...prev, char1: name }))}
                          className="bg-white hover:bg-black hover:text-white border border-black/10 text-black font-mono text-[9px] px-2 py-0.5 rounded-full transition-all duration-150 uppercase font-bold"
                        >
                          {name}
                        </button>
                      ))}
                  </div>
                )}

                {/* Dialogue Text 1 */}
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[10px] font-bold text-black/50 uppercase">Isi Ucapan / Dialog</span>
                  <textarea 
                    rows={2}
                    placeholder="mis. Di mana lilin dan korek apinya?!"
                    value={dialogueModal.dialogue1}
                    onChange={(e) => setDialogueModal(prev => ({ ...prev, dialogue1: e.target.value }))}
                    className="popup-input text-xs p-2.5 font-semibold resize-none"
                  />
                </div>
              </div>

              {/* Toggle Reply */}
              <label className="flex items-center gap-2 py-2.5 px-1 cursor-pointer border-t border-b border-black/5">
                <input 
                  type="checkbox"
                  checked={dialogueModal.hasReply}
                  onChange={(e) => setDialogueModal(prev => ({ ...prev, hasReply: e.target.checked }))}
                  className="rounded border-black text-black focus:ring-black w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-black uppercase tracking-wider text-black/80">Sertakan Dialog Balasan (Karakter Kedua)?</span>
              </label>

              {/* Secondary Character Inputs (if checked) */}
              {dialogueModal.hasReply && (
                <div className="bg-black/[0.02] p-3 rounded-2xl border border-black/5 space-y-3 animate-slide-down">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-black/70" />
                    <label className="text-micro font-black uppercase tracking-wider opacity-65">3. Dialog Tokoh Balasan</label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Name Input */}
                    <div className="sm:col-span-7 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-black/50 uppercase">Nama Karakter Kedua</span>
                      <input 
                        type="text"
                        placeholder="mis. SITI"
                        value={dialogueModal.char2}
                        onChange={(e) => setDialogueModal(prev => ({ ...prev, char2: e.target.value }))}
                        className="popup-input text-xs p-2.5 font-bold uppercase"
                      />
                    </div>

                    {/* Expression Input */}
                    <div className="sm:col-span-5 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-black/50 uppercase flex items-center gap-1">
                        <Smile className="w-3 h-3 text-black/70" />
                        Ekspresi / Emosi
                      </span>
                      <input 
                        type="text"
                        placeholder="e.g., tersenyum lega"
                        value={dialogueModal.expression2}
                        onChange={(e) => setDialogueModal(prev => ({ ...prev, expression2: e.target.value }))}
                        className="popup-input text-xs p-2.5 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Character 2 Suggestions */}
                  {extractedCharacters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                      <span className="text-[9px] font-black uppercase opacity-50 mr-1">Saran Karakter:</span>
                      {extractedCharacters
                        .filter(name => name !== dialogueModal.char1)
                        .filter(name => !dialogueModal.char2 || name.toLowerCase().includes(dialogueModal.char2.toLowerCase()))
                        .slice(0, 6)
                        .map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setDialogueModal(prev => ({ ...prev, char2: name }))}
                            className="bg-white hover:bg-black hover:text-white border border-black/10 text-black font-mono text-[9px] px-2 py-0.5 rounded-full transition-all duration-150 uppercase font-bold"
                          >
                            {name}
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Dialogue Text 2 */}
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-[10px] font-bold text-black/50 uppercase">Isi Ucapan / Balasan</span>
                    <textarea 
                      rows={2}
                      placeholder="mis. Tenang, ini ada di laci meja makan."
                      value={dialogueModal.dialogue2}
                      onChange={(e) => setDialogueModal(prev => ({ ...prev, dialogue2: e.target.value }))}
                      className="popup-input text-xs p-2.5 font-semibold resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Educational Glossary Helper with Indonesia and English terms */}
              <div className="bg-black/5 p-3.5 rounded-2xl border border-black/5 text-[10.5px] leading-relaxed space-y-2 mt-4">
                <div className="font-black text-black uppercase tracking-wider flex items-center gap-1.5 text-[9.5px]">
                  <BookOpen className="w-3.5 h-3.5 text-black" />
                  <span>Panduan Penulisan Skenario Terpadu</span>
                </div>
                <div>
                  <strong className="text-black">Aksi / Deskripsi Adegan (Action):</strong>
                  <p className="opacity-70 mt-0.5">Penjelasan tindakan, suasana, atau pergerakan fisik sebelum percakapan berlangsung.</p>
                </div>
                <div>
                  <strong className="text-black">Karakter & Dialog (Character & Dialogue):</strong>
                  <p className="opacity-70 mt-0.5">Nama tokoh ditulis huruf kapital di tengah, diikuti ucapan tepat di baris berikutnya.</p>
                </div>
                <div>
                  <strong className="text-black">Petunjuk Ekspresi (Parenthetical):</strong>
                  <p className="opacity-70 mt-0.5">Catatan emosional singkat di dalam kurung di bawah nama tokoh (misal: <span className="font-mono text-[9.5px]">(tersenyum)</span> atau <span className="font-mono text-[9.5px]">(panik)</span>) sebelum ia berbicara.</p>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-3 justify-end mt-6 pt-4 border-t border-black/10">
              <button
                onClick={() => setDialogueModal(prev => ({ ...prev, isOpen: false }))}
                className="clay-btn px-4 py-2 text-xs font-black uppercase tracking-wider"
              >
                Batal
              </button>
              <button
                onClick={handleInsertDialogue}
                className="clay-btn-dark px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
              >
                Masukkan ke Naskah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
