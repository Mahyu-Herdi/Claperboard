import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ClapperHeader } from '../components/ClapperHeader';
import { ConceptReferenceBanner } from '../components/ConceptReferenceBanner';
import { ImagePlus, Trash2, Eye, EyeOff, Search, X, Table as TableIcon, LayoutGrid, FileText, CheckCircle2, Printer, ArrowLeft, BookOpen } from 'lucide-react';
import { useDialog } from '../context/DialogContext';
import { ClapperLoader } from '../components/ClapperLoader';

function TableStoryboardImage({ buffer }: { buffer: ArrayBuffer | null | undefined }) {
  const [url, setUrl] = useState<string>('');

  React.useEffect(() => {
    if (!buffer) {
      setUrl('');
      return;
    }
    const blob = new Blob([buffer]);
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [buffer]);

  if (!url) {
    return (
      <div className="w-full aspect-video bg-zinc-100 flex flex-col items-center justify-center border border-zinc-200 rounded text-[8px] font-mono text-zinc-400 select-none uppercase tracking-widest p-2 text-center">
        <span>[BINGKAI KOSONG]</span>
      </div>
    );
  }
  return (
    <img 
      src={url} 
      alt="Storyboard Panel" 
      className="w-full aspect-video object-cover rounded border border-zinc-300 shadow-sm" 
      referrerPolicy="no-referrer"
    />
  );
}

const shotTypeNames: Record<string, string> = {
  'EWS': 'Extreme Wide Shot (EWS)',
  'VWS': 'Very Wide Shot (VWS)',
  'WS': 'Wide Shot (WS)',
  'MWS': 'Medium Wide Shot (MWS)',
  'MCU': 'Medium Close Up (MCU)',
  'CU': 'Close Up (CU)',
  'ECU': 'Extreme Close Up (ECU)',
  'OTS': 'Over the Shoulder (OTS)',
  'CA': 'Cut-In / Cutaway',
};

const angleNames: Record<string, string> = {
  'eye-level': 'Eye Level',
  'high': 'High Angle',
  'low': 'Low Angle',
  'birds-eye': "Bird's Eye",
  'worms-eye': "Worm's Eye",
  'dutch': 'Dutch Angle',
  'over-shoulder': 'Over the Shoulder',
};

const movementNames: Record<string, string> = {
  'static': 'Statis',
  'pan': 'Pan',
  'tilt': 'Tilt',
  'dolly': 'Dolly / Zoom',
  'truck': 'Trucking',
  'pedestal': 'Pedestal',
  'handheld': 'Handheld',
  'gimbal': 'Gimbal',
  'crane': 'Crane / Jib',
};

type ViewMode = 'visual' | 'table';

export function Storyboard({ projectId }: { projectId: number }) {
  const { showConfirm, showAlert } = useDialog();
  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const scenes = useLiveQuery(() => db.scenes.where({ projectId }).sortBy('order'), [projectId]);
  const shots = useLiveQuery(() => db.shots.where({ projectId }).sortBy('order'), [projectId]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeShotId, setActiveShotId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showScriptBlock, setShowScriptBlock] = useState<boolean>(true);
  const [printScenePageBreak, setPrintScenePageBreak] = useState<boolean>(true);
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeShotId) {
      const arrayBuffer = await file.arrayBuffer();
      await db.shots.update(activeShotId, { imageBlob: arrayBuffer });
      showAlert('Sukses', 'Gambar storyboard berhasil diperbarui!', 'success');
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

  const renderImage = (buffer: ArrayBuffer) => {
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    return <img src={url} alt="Storyboard Frame" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />;
  };

  if (!project || !scenes || !shots) return <ClapperLoader />;

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
              <h2 className="font-black text-xs uppercase tracking-widest text-amber-400">PRATINJAU CETAK DOKUMEN</h2>
              <p className="text-[10px] text-zinc-400 font-mono">STANDAR A4 PORTRAIT • {scenes.length} ADEGAN • {shots.length} SHOT</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="clay-btn !bg-amber-500 hover:!bg-amber-600 !text-black px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[4px_4px_15px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all"
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
        <div className="w-full py-4 px-1 md:px-8 flex flex-col items-center gap-8 bg-zinc-950/20 rounded-3xl max-w-7xl mx-auto">
          <div className="text-center no-print text-zinc-400 space-y-1 my-2">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">Tampilan Simulasi Cetak Kertas A4</p>
            <p className="text-[10px] opacity-75">Gunakan tombol "Cetak PDF Sekarang" atau tekan Ctrl+P untuk menyimpan sebagai PDF fisik.</p>
          </div>

          {/* PAGE 1: DOKUMEN KONSEP CERITA */}
          <div
            className="w-full md:w-[210mm] bg-white text-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-200 p-[10mm] md:p-[15mm] rounded-sm relative flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:w-full print:bg-transparent"
          >
            <div className="absolute top-2 left-2 text-[8px] text-zinc-400/50 font-mono tracking-widest uppercase select-none no-print">
              A4 PAGE 1
            </div>
            <div className="absolute bottom-2 right-2 text-[8px] text-zinc-400/50 font-mono tracking-widest uppercase select-none no-print">
              PRE-PRO STORY BIBLE
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-6">
              {/* Page Top Header */}
              <div className="border-b-2 border-zinc-950 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="font-mono font-black text-xl tracking-tighter text-zinc-950">ERBEA PRE - PRO</h1>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">DOKUMEN UTAMA KONSEP CERITA & STRUKTUR ALUR</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase text-zinc-900">{project.title || 'Untitled Project'}</p>
                  <p className="text-[9px] font-mono text-zinc-500 mt-0.5">DIRECTOR: {project.director || 'ERBEA'}</p>
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
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded">
                    <h3 className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Premis & Logline Cerita
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed font-semibold">
                      {project.premise || 'Belum diisi konsep premis.'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded">
                    <h3 className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                      Karakter Utama & Karakterisasi
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed">
                      {project.mainCharacter || '-'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded">
                    <h3 className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                      Konflik / Rintangan Utama
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed">
                      {project.mainConflict || '-'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded">
                    <h3 className="text-[10px] text-amber-900 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Pesan Emosional / Inti Cerita
                    </h3>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed italic">
                      {project.emotionalMessage || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Synopsis Section */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded">
                <h3 className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-2">SINOPSIS SINGKAT</h3>
                <p className="font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
                  {project.synopsis || 'Belum diisi sinopsis singkat.'}
                </p>
              </div>

              {/* Three Act Outline */}
              <div className="p-4 border border-zinc-200 rounded space-y-3 bg-zinc-50/50">
                <h3 className="text-[10px] text-zinc-800 font-extrabold uppercase tracking-wider border-b border-zinc-200 pb-1.5">OUTLINE STRUKTUR 3 BABAK</h3>
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
            <div className="border-t border-zinc-200 pt-3 mt-8 flex justify-between items-center text-[8px] text-zinc-400 font-mono tracking-wider uppercase">
              <span>ERBEA PRE-PRO STUDIO SYSTEM</span>
              <span>HALAMAN 1 DARI {scenes.length + 1}</span>
            </div>
          </div>

          {scenes.map((scene, sceneIdx) => {
            const sceneShots = shots.filter(s => s.sceneId === scene.id);
            return (
              <div
                key={scene.id}
                className={`w-full md:w-[210mm] bg-white text-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-200 p-[10mm] md:p-[15mm] rounded-sm relative flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:w-full print:bg-transparent ${
                  printScenePageBreak ? 'print-break-before-page md:mt-6' : 'md:mt-4'
                }`}
              >
                {/* Simulated A4 Watermark/Border Lines (Desktop only) */}
                <div className="absolute top-2 left-2 text-[8px] text-zinc-400/50 font-mono tracking-widest uppercase select-none no-print">
                  A4 PAGE {sceneIdx + 2}
                </div>
                <div className="absolute bottom-2 right-2 text-[8px] text-zinc-400/50 font-mono tracking-widest uppercase select-none no-print">
                  PRE-PRO DRAFT
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-6">
                  {/* Page Top Header */}
                  <div className="border-b-2 border-zinc-950 pb-4 flex justify-between items-end">
                    <div>
                      <h1 className="font-mono font-black text-xl tracking-tighter text-zinc-950">ERBEA PRE - PRO</h1>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">DOKUMEN SPESIFIKASI TEKNIS & STORYBOARD</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase text-zinc-900">{project.title || 'Untitled Project'}</p>
                      <p className="text-[9px] font-mono text-zinc-500 mt-0.5">DIRECTOR: {project.director || 'ERBEA'}</p>
                    </div>
                  </div>

                  {/* Scene Banner Header */}
                  <div className="bg-zinc-100 p-4 rounded border-l-4 border-amber-500 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm bg-zinc-950 text-white px-2.5 py-1 rounded">
                        ADEGAN {scene.sceneNumber}
                      </span>
                      <div>
                        <h2 className="font-black text-xs uppercase tracking-wide text-zinc-900">
                          {scene.locationType} - {scene.time}
                        </h2>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                          Visualisasi & Technical Detail Sheet
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-zinc-600 font-mono">
                      Shot: <span className="font-bold text-zinc-950">{sceneShots.length}</span>
                    </div>
                  </div>

                  {/* Scene Script Block */}
                  {showScriptBlock && scene.actionText && (
                    <div className="p-4 bg-zinc-50 border-l-2 border-zinc-300 rounded">
                      <h3 className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        Naskah Adegan
                      </h3>
                      <p className="font-mono text-[10px] text-zinc-800 whitespace-pre-wrap leading-relaxed">
                        {scene.actionText}
                      </p>
                    </div>
                  )}

                  {/* Visual Grid */}
                  {viewMode === 'visual' && (
                    <div className="grid grid-cols-2 gap-4 my-4">
                      {sceneShots.map((shot, idx) => {
                        const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                        const frameUrl = shot.imageBlob ? URL.createObjectURL(new Blob([shot.imageBlob])) : null;
                        return (
                          <div key={shot.id} className="border border-zinc-200 rounded p-3 flex flex-col justify-between bg-zinc-50/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-mono font-black text-xs bg-zinc-950 text-white px-2 py-0.5 rounded">
                                {shotIdentifier}
                              </span>
                              <span className="text-[9px] font-black uppercase bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded">
                                {shotTypeNames[shot.shotType] || shot.shotType || '-'}
                              </span>
                            </div>

                            {/* Shot Frame */}
                            <div className="aspect-video bg-zinc-200 rounded overflow-hidden flex items-center justify-center border border-zinc-300 relative">
                              {frameUrl ? (
                                <img 
                                  src={frameUrl} 
                                  alt="Storyboard Frame" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="text-center text-zinc-400 font-mono text-[9px] uppercase tracking-widest p-2">
                                  [BINGKAI KOSONG]
                                </div>
                              )}
                            </div>

                            {/* Tech Specs Summary in visual card */}
                            <div className="grid grid-cols-2 gap-1.5 text-[9px] border-t border-zinc-200 pt-2 mt-2">
                              <div>
                                <span className="text-zinc-400 block font-bold uppercase text-[7px]">Sudut</span>
                                <span className="font-semibold text-zinc-800 truncate block">{angleNames[shot.cameraAngle] || shot.cameraAngle || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-400 block font-bold uppercase text-[7px]">Lensa</span>
                                <span className="font-mono font-semibold text-zinc-800 truncate block">{shot.focalLength || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-400 block font-bold uppercase text-[7px]">Gerak</span>
                                <span className="font-semibold text-zinc-800 truncate block">{movementNames[shot.movement] || shot.movement || 'Statis'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-400 block font-bold uppercase text-[7px]">Rig / FPS</span>
                                <span className="font-semibold text-zinc-800 truncate block">{shot.rig || 'Tripod'} {shot.frameRate ? `@${shot.frameRate}` : ''}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Detail Specs Table */}
                  {viewMode === 'table' && (
                    <div className="border border-zinc-950 rounded overflow-hidden bg-white mt-4 print:border-black">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-zinc-100 text-zinc-900 border-b-2 border-zinc-950 font-black uppercase text-[8px] tracking-wider">
                            <th className="p-2.5 border-r border-zinc-200 w-16 text-center">Shot</th>
                            <th className="p-2.5 border-r border-zinc-200">Papan Cerita & Rincian Shot</th>
                            <th className="p-2.5 w-64">Naskah Skenario Adegan</th>
                          </tr>
                        </thead>
                        <tbody className="font-medium">
                          <tr className="align-top">
                            <td className="p-2.5 font-mono font-black text-center border-r border-zinc-200 bg-zinc-50 text-xs">
                              <div className="flex flex-col gap-2 items-center">
                                {sceneShots.map((shot, idx) => {
                                  const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                                  return (
                                    <span key={shot.id} className="font-mono font-black text-xs bg-zinc-950 text-white px-2 py-1 rounded shadow-sm block">
                                      {shotIdentifier}
                                    </span>
                                  );
                                })}
                                {sceneShots.length === 0 && <span className="text-zinc-400 font-normal">-</span>}
                              </div>
                            </td>
                            <td className="p-2.5 border-r border-zinc-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sceneShots.map((shot, idx) => {
                                  const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                                  return (
                                    <div key={shot.id} className="space-y-2 p-2 bg-zinc-50 rounded border border-zinc-200">
                                      <div className="flex justify-between items-center bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                                        <span className="font-mono font-black text-zinc-900 text-[10px]">{shotIdentifier}</span>
                                        <span className="text-[8px] font-black uppercase text-amber-900 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                          {shotTypeNames[shot.shotType] || shot.shotType || '-'}
                                        </span>
                                      </div>
                                      <TableStoryboardImage buffer={shot.imageBlob} />
                                      <div className="bg-white p-1.5 rounded border border-zinc-200/60 text-[8.5px] leading-relaxed">
                                        <span className="font-extrabold text-amber-800 uppercase text-[7px] block tracking-wider mb-0.5">CATATAN TEKNIS:</span>
                                        <p className="text-zinc-800 font-semibold italic">
                                          {shot.lightingNotes || 'Tidak ada catatan.'}
                                        </p>
                                      </div>
                                      
                                      {/* Rincian Spesifikasi Kamera & Gerak */}
                                      <div className="bg-zinc-100/70 p-1.5 rounded border border-zinc-200 text-[8px] leading-normal space-y-1">
                                        <div className="grid grid-cols-2 gap-x-1.5 gap-y-1">
                                          <div>
                                            <span className="text-zinc-400 block font-bold uppercase text-[6.5px]">Sudut</span>
                                            <span className="font-semibold text-zinc-800 block leading-none truncate">{angleNames[shot.cameraAngle] || shot.cameraAngle || '-'}</span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-400 block font-bold uppercase text-[6.5px]">Gerak</span>
                                            <span className="font-semibold text-zinc-800 block leading-none truncate">{movementNames[shot.movement] || shot.movement || '-'}</span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-400 block font-bold uppercase text-[6.5px]">Lensa</span>
                                            <span className="font-mono font-bold text-zinc-950 block leading-none truncate">{shot.focalLength || 'N/A'}</span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-400 block font-bold uppercase text-[6.5px]">Rig/FPS</span>
                                            <span className="font-semibold text-zinc-800 block leading-none truncate">{shot.rig || 'Tripod'} {shot.frameRate ? `@${shot.frameRate}` : ''}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {sceneShots.length === 0 && (
                                  <p className="text-zinc-400 font-mono italic text-[9px]">Belum ada shot yang dibuat.</p>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 whitespace-pre-wrap leading-relaxed font-mono text-zinc-800 text-[10px]">
                              {scene.actionText || '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Page Footer */}
                <div className="border-t border-zinc-200 pt-3 mt-8 flex justify-between items-center text-[8px] text-zinc-400 font-mono tracking-wider uppercase">
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
    <div className="w-full max-w-full pb-24 px-1 md:px-4">
      <ClapperHeader project={project} documentTitle="STORY BOARD & SPESIFIKASI TEKNIS" />
      
      {/* Story Concept Reference Banner */}
      <ConceptReferenceBanner project={project} currentStage={5} />
      
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />

      {/* Control Panel / Interactive Options */}
      <div className="clay-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between no-print text-sm">
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 text-black/40" />
          <input
            type="text"
            placeholder="Cari Nomor Adegan / Naskah..."
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <span className="font-black text-xs uppercase tracking-wider text-black/60">Tampilan Layar:</span>
          <div className="flex rounded-xl bg-black/5 p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex-1 sm:flex-none ${
                viewMode === 'visual' ? 'clay-btn-dark !shadow-sm' : 'text-black/60 hover:text-black'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Papan Cerita
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex-1 sm:flex-none ${
                viewMode === 'table' ? 'clay-btn-dark !shadow-sm' : 'text-black/60 hover:text-black'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabel Rincian
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto justify-end">
          <div className="flex items-center justify-between sm:justify-start gap-4 p-3 sm:p-0 bg-black/5 sm:bg-transparent rounded-xl sm:rounded-none">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[10px] sm:text-xs uppercase text-black/70 flex-1 sm:flex-none justify-center sm:justify-start leading-tight">
              <input 
                type="checkbox" 
                checked={showScriptBlock} 
                onChange={(e) => setShowScriptBlock(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 shrink-0"
              />
              <span className="truncate">Naskah Adegan</span>
            </label>
            <div className="w-px h-6 bg-black/10 sm:hidden"></div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[10px] sm:text-xs uppercase text-black/70 flex-1 sm:flex-none justify-center sm:justify-start leading-tight">
              <input 
                type="checkbox" 
                checked={printScenePageBreak} 
                onChange={(e) => setPrintScenePageBreak(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 shrink-0"
              />
              <span className="truncate">Cetak Break</span>
            </label>
          </div>
          <button
            onClick={() => setIsPrintPreview(true)}
            className="clay-btn !bg-amber-500 hover:!bg-amber-600 !text-black px-4 py-3 sm:py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_10px_rgba(245,158,11,0.2)] hover:scale-105 transition-all w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 shrink-0 text-black" />
            <span className="truncate">Pratinjau Cetak (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-12">
        {scenes
          .filter(scene => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            const sceneNum = scene.sceneNumber.toLowerCase();
            const action = (scene.actionText || '').toLowerCase();
            const location = (scene.locationType || '').toLowerCase();
            return sceneNum.includes(query) || action.includes(query) || location.includes(query);
          })
          .map((scene, sceneIdx) => {
          const sceneShots = shots.filter(s => s.sceneId === scene.id);
          
          return (
            <div 
              key={scene.id} 
              className={`space-y-6 ${
                printScenePageBreak && sceneIdx > 0 ? 'print-break-before-page' : ''
              }`}
            >
              {/* Scene Banner Header */}
              <div className="clay-card p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-l-4 border-amber-500 group relative">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-lg bg-amber-500 text-black px-3 py-1 rounded-lg shadow-md">
                    ADEGAN {scene.sceneNumber}
                  </span>
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-wide text-black/80">
                      {scene.locationType} - {scene.time}
                    </h2>
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                      Spesifikasi Teknis & Visualisasi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-black/60 font-mono no-print">
                    Total Shot: <span className="font-bold text-black">{sceneShots.length}</span>
                  </div>
                </div>
              </div>

              {/* Scene Script & Dialogue Block */}
              {showScriptBlock && scene.actionText && (
                <div className="clay-card p-4 md:p-6 bg-amber-500/5 border-l-2 border-amber-500/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                    <FileText className="w-16 h-16 stroke-[1px]" />
                  </div>
                  <h3 className="text-micro text-amber-800 font-extrabold mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 stroke-[2.5px]" />
                    Naskah & Dialog Skenario Adegan
                  </h3>
                  <div className="font-mono text-xs text-black/80 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible">
                    {scene.actionText}
                  </div>
                </div>
              )}

              {/* 1. VISUAL GRID OF STORYBOARD CELLS */}
              {viewMode === 'visual' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sceneShots.map((shot, idx) => {
                    const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                    
                    return (
                      <div 
                        key={shot.id} 
                        className="clay-card flex flex-col h-full print-break-inside-avoid shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {/* Image Container */}
                        <div className="relative aspect-video bg-[#e5e5e5] rounded-t-xl flex items-center justify-center overflow-hidden border-b border-black/10">
                          {shot.imageBlob ? (
                            <>
                              {renderImage(shot.imageBlob)}
                              {/* Controls Overlay */}
                              <div className="absolute top-2 right-2 flex gap-1.5 no-print">
                                <button
                                  onClick={() => shot.id && triggerUpload(shot.id)}
                                  className="clay-btn bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 p-2 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                                  title="Ganti Gambar"
                                >
                                  <ImagePlus className="w-3.5 h-3.5 text-current stroke-[2.5px]" />
                                </button>
                                <button 
                                  onClick={() => shot.id && removeImage(shot.id)}
                                  className="clay-btn bg-red-600/90 hover:bg-red-600 text-white p-2 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                                  title="Hapus Gambar"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.5px]" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <button 
                              onClick={() => shot.id && triggerUpload(shot.id)}
                              className="flex flex-col items-center gap-2 text-black/50 hover:text-black transition-all hover:scale-105 active:scale-95 no-print w-full h-full justify-center p-4 bg-black/[0.02]"
                            >
                              <ImagePlus className="w-8 h-8 text-amber-500/60" />
                              <span className="text-micro font-black uppercase tracking-wider text-amber-800">Tambah Bingkai</span>
                            </button>
                          )}
                          
                          {/* Print placeholder for image if empty */}
                          {!shot.imageBlob && (
                            <div className="hidden print-only text-center text-gray-400 font-mono absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 m-3 rounded-lg bg-gray-50">
                              <span className="text-xs font-bold uppercase tracking-widest">[BINGKAI BERSALIN]</span>
                              <span className="text-[9px] mt-1 opacity-60">Belum Ada Visualisasi</span>
                            </div>
                          )}
                        </div>

                        {/* Card Meta Content */}
                        <div className="p-4 flex-1 flex flex-col bg-white">
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <span className="font-mono font-black text-base bg-black text-white px-2.5 py-0.5 rounded shadow-sm">
                              {shotIdentifier}
                            </span>
                            <span className="text-[10px] font-black uppercase bg-amber-500/15 text-amber-900 px-2 py-1 rounded border border-amber-500/20">
                              {shotTypeNames[shot.shotType] || shot.shotType || '-'}
                            </span>
                          </div>

                          {/* Technical Grid inside card */}
                          <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs border-t border-black/5 pt-3 mt-auto">
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-black/40 block">Sudut Kamera</span>
                              <span className="font-semibold text-black/80">{angleNames[shot.cameraAngle] || shot.cameraAngle || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-black/40 block">Lensa (Focal)</span>
                              <span className="font-mono font-bold text-black/80">{shot.focalLength || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-black/40 block">Pergerakan</span>
                              <span className="font-semibold text-black/80">{movementNames[shot.movement] || shot.movement || 'Statis'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-black/40 block">Rig & FPS</span>
                              <span className="font-semibold text-black/80">{shot.rig || 'Tripod'} {shot.frameRate ? `@ ${shot.frameRate}` : ''}</span>
                            </div>
                          </div>

                          {/* Production Notes */}
                          {(shot.lightingNotes || shot.audioNotes) && (
                            <div className="mt-3 pt-3 border-t border-black/5 text-[10px] space-y-1 bg-black/[0.01] p-1.5 rounded">
                              {shot.lightingNotes && (
                                <p className="leading-tight text-black/75"><strong className="text-amber-700 font-extrabold">LAMPU:</strong> {shot.lightingNotes}</p>
                              )}
                              {shot.audioNotes && (
                                <p className="leading-tight text-black/75"><strong className="text-blue-700 font-extrabold">SUARA:</strong> {shot.audioNotes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. AUTOMATIC DETAIL TABLE (TABEL RINCIAN PER ADEGAN) */}
              {viewMode === 'table' && (
                <div className="clay-card overflow-hidden bg-white shadow-md print:shadow-none print:border-black/40">
                  <div className="bg-black text-white px-4 py-2.5 flex items-center justify-between print:bg-gray-100 print:text-black print:border-b-2 print:border-black">
                    <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                      <TableIcon className="w-3.5 h-3.5 text-amber-400 print:text-black" />
                      Tabel Rincian Spesifikasi Adegan {scene.sceneNumber}
                    </span>
                    <span className="text-[9px] font-mono tracking-widest uppercase opacity-60 print:opacity-100">
                      Technical Spec Sheet
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-black/5 text-black border-b border-black/15 font-black uppercase text-[10px]">
                          <th className="p-3 border-r border-black/5 w-16 text-center">Shot</th>
                          <th className="p-3 border-r border-black/5">Papan Cerita (Visual) & Rincian Shot</th>
                          <th className="p-3 w-72">Naskah Skenario</th>
                        </tr>
                      </thead>
                      <tbody className="font-medium">
                        <tr className="hover:bg-black/[0.01] transition-colors print:hover:bg-transparent align-top">
                          <td className="p-3 font-mono font-black text-center border-r border-black/5 text-sm bg-black/5 print:bg-transparent">
                            <div className="flex flex-col gap-2 items-center">
                              {sceneShots.map((shot, idx) => {
                                const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                                return (
                                  <span key={shot.id} className="font-mono font-black text-xs bg-black text-white px-2 py-1 rounded shadow-sm block">
                                    {shotIdentifier}
                                  </span>
                                );
                              })}
                              {sceneShots.length === 0 && <span className="text-black/40 font-normal">-</span>}
                            </div>
                          </td>
                          <td className="p-3 border-r border-black/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {sceneShots.map((shot, idx) => {
                                const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                                return (
                                  <div key={shot.id} className="space-y-2 p-2 bg-black/[0.01] rounded border border-black/[0.06]">
                                    <div className="flex justify-between items-center bg-black/5 px-2 py-1 rounded">
                                      <span className="font-mono font-black text-xs text-black">{shotIdentifier}</span>
                                      <span className="text-[9px] font-black uppercase text-amber-950 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                        {shotTypeNames[shot.shotType] || shot.shotType || '-'}
                                      </span>
                                    </div>
                                    <TableStoryboardImage buffer={shot.imageBlob} />
                                    <div className="bg-black/[0.02] p-2 rounded border border-black/[0.06] text-[10px] leading-relaxed">
                                      <span className="font-extrabold text-amber-800 uppercase text-[8px] block tracking-wider mb-0.5">CATATAN TEKNIS:</span>
                                      <p className="text-black/80 font-semibold italic">
                                        {shot.lightingNotes || 'Tidak ada catatan khusus.'}
                                      </p>
                                    </div>

                                    {/* Rincian Spesifikasi Kamera & Gerak */}
                                    <div className="bg-black/[0.04] p-2 rounded border border-black/[0.08] text-[9.5px] leading-normal space-y-1">
                                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                        <div>
                                          <span className="text-black/40 block font-bold uppercase text-[7.5px]">Sudut Kamera</span>
                                          <span className="font-semibold text-black/80 block leading-none truncate">{angleNames[shot.cameraAngle] || shot.cameraAngle || '-'}</span>
                                        </div>
                                        <div>
                                          <span className="text-black/40 block font-bold uppercase text-[7.5px]">Pergerakan</span>
                                          <span className="font-semibold text-black/80 block leading-none truncate">{movementNames[shot.movement] || shot.movement || '-'}</span>
                                        </div>
                                        <div>
                                          <span className="text-black/40 block font-bold uppercase text-[7.5px]">Lensa</span>
                                          <span className="font-mono font-bold text-black block leading-none truncate">{shot.focalLength || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-black/40 block font-bold uppercase text-[7.5px]">Rig/FPS</span>
                                          <span className="font-semibold text-black/80 block leading-none truncate">{shot.rig || '-'} {shot.frameRate ? `@ ${shot.frameRate} FPS` : ''}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {sceneShots.length === 0 && (
                                <p className="text-black/40 font-mono italic text-xs">Belum ada shot yang ditambahkan untuk adegan ini.</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 whitespace-pre-wrap leading-relaxed font-mono text-black/80 text-[11px]">
                            {scene.actionText || '-'}
                          </td>
                        </tr>
                        {sceneShots.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-black/40 font-mono italic">
                              Belum ada shot yang ditambahkan untuk adegan ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {scenes.length === 0 && (
          <div className="text-center p-16 clay-card text-gray-500 font-mono">
            Tidak ada scene ditemukan. Mulailah dengan membuat scene dan shot di tab Skenario!
          </div>
        )}
      </div>
    </div>
  );
}
