import React, { useState } from 'react';
import { Project } from '../types';
import { Lightbulb, ChevronDown, ChevronUp, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  project?: Project;
  currentStage: 3 | 4 | 5;
}

export function ConceptReferenceBanner({ project, currentStage }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const stageNames: Record<number, string> = {
    3: 'Tahap 3 dari 5: Tulis Skenario / Naskah',
    4: 'Tahap 4 dari 5: Susun Shot List',
    5: 'Tahap 5 dari 5: Bikin Storyboard'
  };

  const stageDescriptions: Record<number, string> = {
    3: 'Ubah outline alur menjadi adegan demi adegan (scene by scene) beserta aksi visual detail dan dialog.',
    4: 'Bedah naskah per adegan untuk menentukan teknis videonya (tipe tangkapan kamera, angle, dan pergerakan).',
    5: 'Visualisasikan shot list ke dalam panel gambar agar komposisi, arah gerakan kamera, dan transisi terbaca jelas.'
  };

  const hasConceptData = Boolean(
    project?.premise || 
    project?.mainCharacter || 
    project?.mainConflict || 
    project?.outlineBeginning || 
    project?.outlineMiddle || 
    project?.outlineEnd
  );

  return (
    <div className="clay-card mb-6 p-4 md:p-5 bg-amber-500/10 border border-amber-500/30 no-print">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl clay-btn-dark bg-amber-500 text-black shrink-0">
            <Lightbulb className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-700">
                {stageNames[currentStage]}
              </span>
            </div>
            <p className="text-xs text-zinc-700 mt-0.5 font-medium leading-relaxed">
              {stageDescriptions[currentStage]}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="clay-btn px-3 py-2 text-xs font-black uppercase tracking-wide flex items-center gap-2 shrink-0 self-end sm:self-center bg-[var(--color-clay-surface)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-700" />
          <span>{isOpen ? 'Tutup Konsep' : 'Lihat Premis & Outline'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress Chain Reminder */}
      <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-zinc-600">
        <span className="text-amber-800 font-extrabold">Urutan Efisien:</span>
        <span className={currentStage === 3 ? 'font-black text-black underline' : ''}>1. Premis</span>
        <span>→</span>
        <span className={currentStage === 3 ? 'font-black text-black underline' : ''}>2. Outline</span>
        <span>→</span>
        <span className={currentStage === 3 ? 'clay-btn-dark !bg-black !text-white px-2 py-0.5 rounded' : ''}>3. Skenario</span>
        <span>→</span>
        <span className={currentStage === 4 ? 'clay-btn-dark !bg-black !text-white px-2 py-0.5 rounded' : ''}>4. Shot List</span>
        <span>→</span>
        <span className={currentStage === 5 ? 'clay-btn-dark !bg-black !text-white px-2 py-0.5 rounded' : ''}>5. Storyboard</span>
      </div>

      {/* Expandable Concept Drawer */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-amber-500/30 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {hasConceptData ? (
            <>
              {/* Left Column: Premis & Pesan */}
              <div className="space-y-3 bg-[var(--color-clay-surface)] p-3.5 rounded-2xl shadow-inner">
                <h4 className="font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Core Storytelling (Premis & Pesan)
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Premis / Logline:</span>
                    <p className="font-extrabold text-zinc-900 mt-0.5">{project?.premise || 'Belum diisi'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Karakter Utama:</span>
                    <p className="font-semibold text-zinc-800 mt-0.5">{project?.mainCharacter || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Konflik Utama:</span>
                    <p className="font-semibold text-zinc-800 mt-0.5">{project?.mainConflict || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Pesan / Emosi:</span>
                    <p className="font-semibold text-zinc-800 mt-0.5">{project?.emotionalMessage || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Outline Alur 3 Babak */}
              <div className="space-y-3 bg-[var(--color-clay-surface)] p-3.5 rounded-2xl shadow-inner">
                <h4 className="font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  Sinopsis & Outline Alur (3 Babak)
                </h4>
                <div className="space-y-2">
                  {project?.synopsis && (
                    <div className="pb-2 border-b border-black/10">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Sinopsis:</span>
                      <p className="font-semibold text-zinc-800 mt-0.5">{project.synopsis}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Babak 1 (Awal - Pengenalan):</span>
                    <p className="font-medium text-zinc-800 mt-0.5">{project?.outlineBeginning || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Babak 2 (Tengah - Puncak Konflik):</span>
                    <p className="font-medium text-zinc-800 mt-0.5">{project?.outlineMiddle || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Babak 3 (Akhir - Penyelesaian):</span>
                    <p className="font-medium text-zinc-800 mt-0.5">{project?.outlineEnd || '-'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 text-center py-4 bg-[var(--color-clay-surface)] rounded-2xl">
              <p className="text-zinc-600 font-semibold mb-2">
                Belum ada data Konsep Cerita & Outline di proyek ini.
              </p>
              <p className="text-[11px] text-zinc-500">
                Lengkapi terlebih dahulu di menu <strong>"Konsep"</strong> untuk mempermudah penulisan naskah dan penyusunan storyboard.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
