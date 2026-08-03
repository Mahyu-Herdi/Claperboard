import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Project } from '../types';
import { ClapperHeader } from '../components/ClapperHeader';
import { useDialog } from '../context/DialogContext';
import { 
  BookOpen, 
  User, 
  AlertTriangle, 
  Heart, 
  FileText, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  Lightbulb, 
  Check, 
  Save 
} from 'lucide-react';

interface Props {
  projectId: number;
  onNavigate: (view: string) => void;
}

export function StoryConcept({ projectId, onNavigate }: Props) {
  const { showAlert, showConfirm } = useDialog();
  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm">Memuat proyek...</p>
      </div>
    );
  }

  const handleUpdate = async (field: keyof Project, value: string) => {
    await db.projects.update(projectId, { [field]: value });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleGenerateDraftScenes = async () => {
    const existingScenes = await db.scenes.where({ projectId }).count();
    if (existingScenes > 0) {
      const confirmed = await showConfirm(
        'Skenario Sudah Ada Adegan',
        'Proyek ini sudah memiliki adegan di skenario. Apakah Anda tetap ingin menambahkan 3 draf adegan dari Outline Babak 1, 2, dan 3?'
      );
      if (!confirmed) return;
    }

    setIsGenerating(true);
    try {
      const startOrder = existingScenes;
      await db.scenes.bulkAdd([
        {
          projectId,
          sceneNumber: `${startOrder + 1}`,
          locationType: 'INT/EXT',
          time: 'DAY',
          actionText: `[BABAK 1 - AWAL / PENGENALAN]\n${project.outlineBeginning || 'Tulis pengenalan karakter utama dan kemunculan konflik awal...'}\n\nKARAKTER: ${project.mainCharacter || 'Tokoh Utama'}`,
          order: startOrder
        },
        {
          projectId,
          sceneNumber: `${startOrder + 2}`,
          locationType: 'INT/EXT',
          time: 'DAY',
          actionText: `[BABAK 2 - TENGAH / PUNCAK KONFLIK]\n${project.outlineMiddle || 'Tulis pertarungan/tantangan terbesar atau klimaks cerita...'}\n\nKONFLIK: ${project.mainConflict || 'Masalah utama'}`,
          order: startOrder + 1
        },
        {
          projectId,
          sceneNumber: `${startOrder + 3}`,
          locationType: 'INT/EXT',
          time: 'DAY',
          actionText: `[BABAK 3 - AKHIR / PENYELESAIAN]\n${project.outlineEnd || 'Tulis resolusi konflik dan penutup cerita...'}\n\nPESAN: ${project.emotionalMessage || 'Pesan emosional untuk penonton'}`,
          order: startOrder + 2
        }
      ]);

      showAlert(
        'Draf Skenario Berhasil Dibuat!',
        '3 adegan dari Outline (Awal, Tengah, Akhir) telah ditambahkan ke Skenario. Silakan lanjut ke halaman Skenario untuk mematangkan visual & dialog.'
      );
      onNavigate('script');
    } catch (e) {
      console.error(e);
      showAlert('Gagal', 'Terjadi kesalahan saat membuat adegan.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-16 relative">
      {/* Indicator Simpan Otomatis (Hanya Titik Hijau Berkedip di Pojok Kanan Atas Layar) */}
      {saveSuccess && (
        <div 
          className="fixed top-4 right-4 z-[9999] w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)] border-2 border-white dark:border-zinc-900"
          title="Tersimpan otomatis"
        />
      )}

      {/* Clapper Header */}
      <ClapperHeader
        project={project}
        documentTitle="KONSEP CERITA & ALUR"
      />

      {/* Pre-Production Efficient Sequence Guide Card */}
      <div className="clay-card p-5 bg-amber-500/10 border-2 border-amber-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl clay-btn-dark bg-amber-500 text-black shrink-0">
              <Lightbulb className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2 text-amber-900">
                Panduan Alur Produksi Paling Efisien
              </h3>
              <p className="text-xs text-zinc-700 mt-1 leading-relaxed">
                <strong className="font-extrabold text-black">Mengapa mulai dari Konsep & Naskah sebelum Storyboard?</strong> Kalau visualnya dibikin duluan tanpa naskah yang matang, biasanya di tengah jalan bakal repot bongkar-pasang adegan.
              </p>
            </div>
          </div>
        </div>

        {/* 5-Step Workflow Tracker Badge */}
        <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-bold">
          <div className="clay-btn-dark text-white dark:text-black px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-white dark:bg-black text-black dark:text-white flex items-center justify-center text-[10px] font-black">1</span>
            <span className="truncate">Premis & Pesan</span>
          </div>
          <div className="clay-btn-dark text-white dark:text-black px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-white dark:bg-black text-black dark:text-white flex items-center justify-center text-[10px] font-black">2</span>
            <span className="truncate">Sinopsis / Outline</span>
          </div>
          <div className="clay-btn px-3 py-2 rounded-xl flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-all cursor-pointer" onClick={() => onNavigate('script')}>
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-black">3</span>
            <span className="truncate">Skenario / Naskah</span>
          </div>
          <div className="clay-btn px-3 py-2 rounded-xl flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-all cursor-pointer" onClick={() => onNavigate('shotlist')}>
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-black">4</span>
            <span className="truncate">Shot List</span>
          </div>
          <div className="clay-btn px-3 py-2 rounded-xl flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-all cursor-pointer" onClick={() => onNavigate('storyboard')}>
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-black">5</span>
            <span className="truncate">Storyboard</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Tahap 1: Tentukan Premis & Pesan (Core Storytelling) */}
        <section className="clay-card p-6 flex flex-col gap-6 justify-between h-full">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl clay-btn-dark">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600">Tahap 1 dari 5</span>
                  <h2 className="text-lg font-black tracking-tight uppercase">Tentukan Premis & Pesan (Core Storytelling)</h2>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-zinc-600 -mt-2">
              Mulai dari fondasi: Siapa karakter utamanya? Apa masalah atau konflik utamanya? Pesan atau emosi apa yang mau disampaikan ke penonton?
            </p>

            <div className="grid grid-cols-1 gap-5">
              {/* Karakter Utama */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  1. Siapa Karakter Utamanya?
                </label>
                <textarea
                  rows={3}
                  value={project.mainCharacter || ''}
                  onChange={(e) => handleUpdate('mainCharacter', e.target.value)}
                  placeholder="Contoh: Rian, seorang fotografer muda yang perfeksionis namun kehilangan motivasi..."
                  className="clay-input w-full text-xs font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Konflik / Masalah Utama */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  2. Apa Masalah / Konflik Utamanya?
                </label>
                <textarea
                  rows={3}
                  value={project.mainConflict || ''}
                  onChange={(e) => handleUpdate('mainConflict', e.target.value)}
                  placeholder="Contoh: Harus menyelesaikan pameran tunggal dalam 3 hari sementara kameranya rusak total..."
                  className="clay-input w-full text-xs font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Pesan & Emosi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-wide flex items-center gap-2">
                  <Heart className="w-4 h-4 text-amber-600" />
                  3. Pesan / Emosi yang Disampaikan?
                </label>
                <textarea
                  rows={3}
                  value={project.emotionalMessage || ''}
                  onChange={(e) => handleUpdate('emotionalMessage', e.target.value)}
                  placeholder="Contoh: Kesempurnaan bukanlah tujuan, melainkan kejujuran karya. Emosi: Haru & Optimis..."
                  className="clay-input w-full text-xs font-medium resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Premis / Logline */}
          <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-black/5">
            <label className="text-xs font-black uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Premis / Logline Cerita (Satu Kalimat Inti)
            </label>
            <input
              type="text"
              value={project.premise || ''}
              onChange={(e) => handleUpdate('premise', e.target.value)}
              placeholder="Contoh: Seorang fotografer yang kehilangan motivasi menemukan kembali inspirasi melalui rol film tua milik ayahnya."
              className="clay-input w-full text-sm font-extrabold"
            />
            <span className="text-[10px] text-zinc-500 font-medium">
              Tips: Gabungkan Karakter + Konflik + Tujuan dalam 1 kalimat logline yang jelas.
            </span>
          </div>
        </section>

        {/* Tahap 2: Bikin Sinopsis / Outline Alur */}
        <section className="clay-card p-6 flex flex-col gap-6 justify-between h-full">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl clay-btn-dark">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600">Tahap 2 dari 5</span>
                  <h2 className="text-lg font-black tracking-tight uppercase">Bikin Sinopsis / Outline Alur (3 Babak)</h2>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-zinc-600 -mt-2">
              Tulis ringkasan jalan cerita secara kasar dari awal, tengah (puncak konflik), sampai akhir (penyelesaian). Cukup beberapa paragraf supaya alurnya ketahuan jelas.
            </p>

            {/* Sinopsis Keseluruhan */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wide">
                Sinopsis / Ringkasan Cerita Keseluruhan
              </label>
              <textarea
                rows={3}
                value={project.synopsis || ''}
                onChange={(e) => handleUpdate('synopsis', e.target.value)}
                placeholder="Tuliskan ringkasan jalan cerita dari awal sampai akhir dalam beberapa paragraf..."
                className="clay-input w-full text-xs font-medium resize-none leading-relaxed"
              />
            </div>

            {/* Struktur 3 Babak (Three-Act Structure) */}
            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-black/5">
              {/* Awal / Setup */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wide text-amber-700">
                    1. Awal (Babak 1)
                  </label>
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Pengenalan</span>
                </div>
                <textarea
                  rows={2}
                  value={project.outlineBeginning || ''}
                  onChange={(e) => handleUpdate('outlineBeginning', e.target.value)}
                  placeholder="Perkenalkan karakter utama, dunia/lokasi, dan pemicu masalah yang mengubah situasi..."
                  className="clay-input w-full text-xs font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Tengah / Climax */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wide text-amber-700">
                    2. Tengah (Babak 2)
                  </label>
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Puncak Konflik</span>
                </div>
                <textarea
                  rows={2}
                  value={project.outlineMiddle || ''}
                  onChange={(e) => handleUpdate('outlineMiddle', e.target.value)}
                  placeholder="Tantangan semakin memuncak. Karakter menghadapi rintangan terberat atau titik klimaks konflik..."
                  className="clay-input w-full text-xs font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Akhir / Resolution */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wide text-amber-700">
                    3. Akhir (Babak 3)
                  </label>
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Penyelesaian</span>
                </div>
                <textarea
                  rows={2}
                  value={project.outlineEnd || ''}
                  onChange={(e) => handleUpdate('outlineEnd', e.target.value)}
                  placeholder="Bagaimana konflik terselesaikan? Perubahan apa yang dialami karakter dan pesan apa yang tertinggal?"
                  className="clay-input w-full text-xs font-medium resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Action Footer: Transition to Step 3 (Skenario / Script Breakdown) */}
      <div className="clay-card p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('metadata')}
          className="clay-btn px-4 py-3 font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 text-black dark:text-white" />
          Pengaturan Proyek
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleGenerateDraftScenes}
            disabled={isGenerating}
            className="clay-btn px-4 py-3 font-extrabold text-xs uppercase flex items-center justify-center gap-2 !bg-amber-500 hover:!bg-amber-600 !text-black cursor-pointer transition-all w-full sm:w-auto text-center"
            title="Konversi outline awal, tengah, akhir menjadi 3 draf adegan di Skenario"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5] shrink-0 text-black" />
            <span className="truncate">Buat Adegan dari Outline (Tahap 3)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('script')}
            className="clay-btn-dark px-6 py-3 font-extrabold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-98 transition-all w-full sm:w-auto text-center"
          >
            <span className="truncate">Lanjut ke Tahap 3: Tulis Skenario</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
