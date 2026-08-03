import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ClapperHeader } from '../components/ClapperHeader';
import { ClapperLoader } from '../components/ClapperLoader';
import { ConceptReferenceBanner } from '../components/ConceptReferenceBanner';
import { Printer, ArrowLeft, Camera, Layers } from 'lucide-react';

const shotTypeNames: Record<string, string> = {
  "EWS": "Extreme Wide Shot (EWS)",
  "WS": "Wide Shot (WS)",
  "MS": "Medium Shot (MS)",
  "MCU": "Medium Close Up (MCU)",
  "CU": "Close Up (CU)",
  "ECU": "Extreme Close Up (ECU)",
  "POV": "Point of View (POV)",
  "Drone Shot": "Drone Shot"
};

const angleNames: Record<string, string> = {
  "Eye Level": "Eye Level",
  "Low Angle": "Low Angle",
  "High Angle": "High Angle",
  "Dutch": "Dutch Angle",
  "Bird's Eye": "Bird's Eye",
  "Worm's Eye": "Worm's Eye"
};

const movementNames: Record<string, string> = {
  "Static": "Statis",
  "Pan": "Pan",
  "Tilt": "Tilt",
  "Dolly": "Dolly / Zoom",
  "Tracking": "Tracking / Truck",
  "Handheld": "Handheld"
};

export function ShotList({ projectId }: { projectId: number }) {
  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const scenes = useLiveQuery(() => db.scenes.where({ projectId }).sortBy('order'), [projectId]);
  const shots = useLiveQuery(() => db.shots.where({ projectId }).sortBy('order'), [projectId]);
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);

  const handleToggleTaken = async (shotId: number | undefined, currentTaken: boolean | undefined) => {
    if (!shotId) return;
    await db.shots.update(shotId, { taken: !currentTaken });
  };

  if (!project || !scenes || !shots) return <ClapperLoader />;

  const takenShots = shots.filter(s => s.taken).length;
  const totalShots = shots.length;
  const remainingShots = totalShots - takenShots;

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
              <h2 className="font-black text-xs uppercase tracking-widest text-amber-400">PRATINJAU CETAK DAFTAR SHOT</h2>
              <p className="text-[10px] text-zinc-400 font-mono">STANDAR A4 PORTRAIT • {shots.length} TOTAL SHOT</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

          <div className="w-full md:w-[210mm] bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-200 p-[10mm] md:p-[15mm] relative flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:w-full print:bg-white">
            <div className="flex-1 flex flex-col space-y-6">
              {/* Page Top Header */}
              <div className="border-b-4 border-black pb-4 flex justify-between items-end mb-6">
                <div>
                  <h1 className="font-sans font-black text-2xl tracking-tighter text-black uppercase">ERBEA PRE-PRO</h1>
                  <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">PRODUCTION SHOT LIST</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black uppercase text-black">{project.title || 'Untitled Project'}</p>
                  <p className="text-[10px] font-bold text-black mt-1">DIR: {project.director || 'ERBEA'}</p>
                </div>
              </div>

              {/* Shot List Table */}
              <div className="border-2 border-black overflow-hidden">
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-black text-white font-black uppercase text-[9px] tracking-widest">
                      <th className="p-2.5 border-r border-gray-300 w-10 text-center">✓</th>
                      <th className="p-2.5 border-r border-gray-300 w-16 text-center">Shot #</th>
                      <th className="p-2.5 border-r border-gray-300 w-24">Adegan & Latar</th>
                      <th className="p-2.5 border-r border-gray-300">Spesifikasi Kamera & Komposisi</th>
                      <th className="p-2.5">Catatan Teknis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 font-medium">
                    {scenes.map(scene => {
                      const sceneShots = shots.filter(s => s.sceneId === scene.id);
                      if (sceneShots.length === 0) return null;

                      return (
                        <React.Fragment key={scene.id}>
                          {/* Scene Row Divider */}
                          <tr className="bg-gray-200 border-y-2 border-black print-break-inside-avoid">
                            <td colSpan={5} className="p-2 font-sans font-black text-[10px] text-black uppercase tracking-widest">
                              ADEGAN {scene.sceneNumber} • {scene.locationType} • {scene.time}
                            </td>
                          </tr>

                          {sceneShots.map((shot, idx) => {
                            const shotIdentifier = scene.sceneNumber + String.fromCharCode(65 + idx);
                            return (
                              <tr key={shot.id} className="align-top border-b border-zinc-150 print-break-inside-avoid">
                                <td className="p-2.5 font-mono font-black text-center border-r border-gray-300 text-xs">
                                  <div className="w-4 h-4 border-2 border-black mx-auto flex items-center justify-center">
                                    {shot.taken && <div className="w-2 h-2 bg-black" />}
                                  </div>
                                </td>
                                <td className="p-2.5 font-mono font-black text-center border-r border-gray-300 text-xs bg-gray-50">
                                  {shotIdentifier}
                                </td>
                                <td className="p-2.5 border-r border-gray-300 text-zinc-700 leading-normal">
                                  <div className="font-black text-black">Scene {scene.sceneNumber}</div>
                                  <div className="text-[9px] text-gray-600 uppercase font-bold mt-1">{scene.locationType} • {scene.time}</div>
                                </td>
                                <td className="p-2.5 border-r border-gray-300 space-y-1">
                                  <div className="font-black text-black">{shotTypeNames[shot.shotType] || shot.shotType || '-'}</div>
                                  <div className="text-[9px] text-gray-700 font-bold">
                                    {angleNames[shot.cameraAngle] || shot.cameraAngle || 'Eye Level'} • {movementNames[shot.movement] || shot.movement || 'Statis'}
                                  </div>
                                  <div className="text-[9px] text-gray-600 font-mono mt-1 border-t border-gray-200 pt-1">
                                    Lensa: {shot.focalLength || 'N/A'} | Alat: {shot.rig || 'Tripod'} | FPS: {shot.frameRate || '24fps'}
                                  </div>
                                </td>
                                <td className="p-2.5 text-black text-[10px] whitespace-pre-wrap leading-relaxed">
                                  {shot.lightingNotes || <span className="text-gray-400 italic">Tidak ada catatan teknis khusus.</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {shots.length === 0 && (
                <div className="text-center p-12 text-zinc-400 font-mono text-xs italic">
                  Belum ada shot yang ditambahkan ke dalam sistem.
                </div>
              )}
            </div>

            {/* Page Footer */}
            <div className="border-t-2 border-black pt-3 mt-8 flex justify-between items-center text-[9px] text-black font-bold tracking-widest uppercase">
              <span>ERBEA PRE-PRO STUDIO SYSTEM</span>
              <span>STANDAR LIST PRE-PRODUKSI</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full pb-20 space-y-6">
      <ClapperHeader project={project} documentTitle="Daftar Shot Resmi" />

      {/* Story Concept Reference Banner */}
      <ConceptReferenceBanner project={project} currentStage={4} />

      {/* Toolbar / Actions */}
      <div className="clay-card p-4 flex flex-col md:flex-row gap-4 justify-between md:items-center no-print">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-amber-500" />
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">KELOLA DAFTAR SHOT</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-black/60 dark:text-white/60 font-bold uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                Total: {totalShots}
              </span>
              <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">
                Selesai: {takenShots}
              </span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">
                Sisa: {remainingShots}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsPrintPreview(true)}
          className="clay-btn-dark w-full md:w-auto px-4 py-3 md:py-2.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 stroke-[2.5px]" />
          <span>Pratinjau Cetak (A4)</span>
        </button>
      </div>

      <div className="clay-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black/20">
                <th className="p-3 text-micro opacity-50 w-12 text-center">Status</th>
                <th className="p-3 text-micro opacity-50">Shot #</th>
                <th className="p-3 text-micro opacity-50">INT/EXT</th>
                <th className="p-3 text-micro opacity-50">Tipe Shot</th>
                <th className="p-3 text-micro opacity-50">Sudut Kamera</th>
                <th className="p-3 text-micro opacity-50">Pergerakan</th>
                <th className="p-3 text-micro opacity-50">Lensa</th>
                <th className="p-3 text-micro opacity-50">Rig/FPS</th>
                <th className="p-3 text-micro opacity-50">Catatan Teknis</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map(scene => {
                const sceneShots = shots.filter(s => s.sceneId === scene.id);
                if (sceneShots.length === 0) return null;

                return (
                  <React.Fragment key={scene.id}>
                    {/* Scene Divider */}
                    <tr className="clay-inset border-y border-black/10">
                      <td colSpan={9} className="p-2.5 font-black font-mono text-xs uppercase text-amber-900 dark:text-amber-500 tracking-wider">
                        ADEGAN {scene.sceneNumber} - {scene.locationType} - {scene.time}
                      </td>
                    </tr>
                    
                    {sceneShots.map((shot, idx) => (
                      <tr key={shot.id} className={`border-b border-black/10 transition-colors ${shot.taken ? 'bg-green-500/5 hover:bg-green-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!shot.taken}
                            onChange={() => handleToggleTaken(shot.id, shot.taken)}
                            className="w-5 h-5 cursor-pointer accent-green-600"
                            title="Tandai jika shot sudah diambil"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-sm">
                          {scene.sceneNumber}{String.fromCharCode(65 + idx)}
                        </td>
                        <td className="p-3 text-sm">{scene.locationType}</td>
                        <td className="p-3 font-bold text-sm text-black">
                          {shotTypeNames[shot.shotType] || shot.shotType || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {angleNames[shot.cameraAngle] || shot.cameraAngle || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {movementNames[shot.movement] || shot.movement || '-'}
                        </td>
                        <td className="p-3 font-mono text-sm">{shot.focalLength || '-'}</td>
                        <td className="p-3 text-sm">{shot.rig || 'Tripod'} <span className="text-gray-400">@</span> {shot.frameRate || '24fps'}</td>
                        <td className="p-3 text-xs max-w-xs truncate" title={shot.lightingNotes}>
                          {shot.lightingNotes || '-'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {shots.length === 0 && (
          <div className="text-center p-12 text-gray-500 font-mono text-xs italic">
            Belum ada shot yang dibuat. Tambahkan adegan dan shot pada menu "Skenario".
          </div>
        )}
      </div>
    </div>
  );
}
