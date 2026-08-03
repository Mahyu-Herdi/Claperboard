import React from 'react';
import { Shot } from '../types';
import { CustomSelect } from './CustomSelect';

const IndoFlag = () => (
  <svg className="w-3.5 h-2.5 rounded-[1px] border border-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.1)] inline-block align-middle mr-1.5 shrink-0" viewBox="0 0 3 2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="3" height="1" fill="#E53935" />
    <rect y="1" width="3" height="1" fill="#FFFFFF" />
  </svg>
);

interface Props {
  shot: Shot;
  onChange: (field: keyof Shot, value: any) => void;
}

interface Definition {
  en: string;
  id: string;
  desc: string;
}

const SHOT_TYPES: Record<string, Definition> = {
  "EWS": {
    en: "Extreme Wide Shot (EWS)",
    id: "Sangat Lebar",
    desc: "Menampilkan area sangat luas untuk memperkenalkan latar tempat (Establishing Shot)."
  },
  "WS": {
    en: "Wide Shot (WS)",
    id: "Lebar",
    desc: "Menampilkan subjek secara utuh dari kepala hingga kaki beserta lingkungannya."
  },
  "MS": {
    en: "Medium Shot (MS)",
    id: "Menengah",
    desc: "Menampilkan karakter dari pinggang ke atas untuk aksi dan dialog standar."
  },
  "MCU": {
    en: "Medium Close Up (MCU)",
    id: "Menengah Dekat",
    desc: "Menampilkan dada ke atas, menyeimbangkan ekspresi wajah dengan gerak tubuh."
  },
  "CU": {
    en: "Close Up (CU)",
    id: "Dekat",
    desc: "Fokus mendalam pada wajah dari bahu ke atas untuk emosi detail."
  },
  "ECU": {
    en: "Extreme Close Up (ECU)",
    id: "Sangat Dekat",
    desc: "Sangat dekat pada detail spesifik (mata, jam, dll) untuk dramatisasi tinggi."
  },
  "POV": {
    en: "Point of View (POV)",
    id: "Sudut Pandang",
    desc: "Kamera diletakkan seolah-olah penonton melihat langsung dari mata karakter."
  },
  "Drone Shot": {
    en: "Drone Shot / Aerial",
    id: "Pengambilan Gambar Drone",
    desc: "Pengambilan gambar dari udara menggunakan drone untuk perspektif lanskap luas atau pergerakan udara megah."
  }
};

const CAMERA_ANGLES: Record<string, Definition> = {
  "Eye Level": {
    en: "Eye Level",
    id: "Sejajar Mata",
    desc: "Sudut pandang normal sejajar mata subjek, memberi kesan netral dan alami."
  },
  "Low Angle": {
    en: "Low Angle",
    id: "Sudut Bawah",
    desc: "Kamera di bawah subjek menghadap ke atas, memberi kesan kuat dan dominan."
  },
  "High Angle": {
    en: "High Angle",
    id: "Sudut Atas",
    desc: "Kamera di atas subjek menghadap ke bawah, membuat subjek terlihat rentan atau kecil."
  },
  "Dutch": {
    en: "Dutch Angle",
    id: "Sudut Miring (Dutch)",
    desc: "Kamera dimiringkan untuk mengekspresikan ketegangan emosional atau ketidakstabilan."
  },
  "Bird's Eye": {
    en: "Bird's Eye View",
    id: "Pandangan Burung",
    desc: "Kamera memotret tegak lurus ke bawah dari ketinggian ekstrem, memberi peta visual."
  },
  "Worm's Eye": {
    en: "Worm's Eye View",
    id: "Pandangan Cacing",
    desc: "Kamera sangat rendah di tanah menghadap ke atas, memberi kesan megah luar biasa."
  }
};

const MOVEMENTS: Record<string, Definition> = {
  "Static": {
    en: "Static",
    id: "Statis / Diam",
    desc: "Kamera tetap diam tanpa pergerakan, memfokuskan murni pada aksi subjek."
  },
  "Pan": {
    en: "Pan (Panning)",
    id: "Geser Horizontal",
    desc: "Kamera berputar secara horizontal ke kiri atau kanan pada satu poros tetap."
  },
  "Tilt": {
    en: "Tilt (Tilting)",
    id: "Kemiringan Vertikal",
    desc: "Kamera berputar secara vertikal ke atas atau bawah pada satu poros tetap."
  },
  "Dolly": {
    en: "Dolly (In/Out)",
    id: "Dorong Kamera",
    desc: "Kamera secara fisik bergerak maju atau mundur mendekati/menjauhi subjek."
  },
  "Tracking": {
    en: "Tracking / Truck",
    id: "Pelacakan",
    desc: "Kamera bergerak secara fisik sejajar di samping atau mengikuti pergerakan subjek."
  },
  "Handheld": {
    en: "Handheld",
    id: "Kamera Genggam",
    desc: "Kamera dipegang operator secara manual, memberi efek dinamis, organik, atau tegang."
  }
};

export function ShotSpecsEditor({ shot, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4 mt-4 clay-inset p-4 bg-black/[0.01]">
      {/* Dropdowns Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tipe Shot Select */}
        <div className="flex flex-col gap-1">
          <label className="text-micro font-black uppercase tracking-wider opacity-60">Tipe Shot</label>
          <CustomSelect 
            className="w-full"
            value={shot.shotType}
            onChange={(val) => onChange('shotType', val)}
            options={[
              { value: '', label: 'Pilih Tipe...' },
              ...Object.entries(SHOT_TYPES).map(([key, def]) => ({
                value: key,
                label: `${def.en} — ${def.id}`
              }))
            ]}
          />
          {shot.shotType && SHOT_TYPES[shot.shotType] && (
            <div className="text-[10px] bg-black/5 p-2 rounded-lg border border-black/5 mt-1 leading-relaxed">
              <span className="font-bold text-black flex items-center mb-0.5">
                <IndoFlag /> {SHOT_TYPES[shot.shotType].id}
              </span>
              <span className="opacity-75">{SHOT_TYPES[shot.shotType].desc}</span>
            </div>
          )}
        </div>

        {/* Sudut Kamera Select */}
        <div className="flex flex-col gap-1">
          <label className="text-micro font-black uppercase tracking-wider opacity-60">Sudut Kamera</label>
          <CustomSelect 
            className="w-full"
            value={shot.cameraAngle}
            onChange={(val) => onChange('cameraAngle', val)}
            options={[
              { value: '', label: 'Pilih Sudut...' },
              ...Object.entries(CAMERA_ANGLES).map(([key, def]) => ({
                value: key,
                label: `${def.en} — ${def.id}`
              }))
            ]}
          />
          {shot.cameraAngle && CAMERA_ANGLES[shot.cameraAngle] && (
            <div className="text-[10px] bg-black/5 p-2 rounded-lg border border-black/5 mt-1 leading-relaxed">
              <span className="font-bold text-black flex items-center mb-0.5">
                <IndoFlag /> {CAMERA_ANGLES[shot.cameraAngle].id}
              </span>
              <span className="opacity-75">{CAMERA_ANGLES[shot.cameraAngle].desc}</span>
            </div>
          )}
        </div>

        {/* Pergerakan Select */}
        <div className="flex flex-col gap-1">
          <label className="text-micro font-black uppercase tracking-wider opacity-60">Pergerakan</label>
          <CustomSelect 
            className="w-full"
            value={shot.movement}
            onChange={(val) => onChange('movement', val)}
            options={[
              { value: '', label: 'Pilih Gerak...' },
              ...Object.entries(MOVEMENTS).map(([key, def]) => ({
                value: key,
                label: `${def.en} — ${def.id}`
              }))
            ]}
          />
          {shot.movement && MOVEMENTS[shot.movement] && (
            <div className="text-[10px] bg-black/5 p-2 rounded-lg border border-black/5 mt-1 leading-relaxed">
              <span className="font-bold text-black flex items-center mb-0.5">
                <IndoFlag /> {MOVEMENTS[shot.movement].id}
              </span>
              <span className="opacity-75">{MOVEMENTS[shot.movement].desc}</span>
            </div>
          )}
        </div>

        {/* Lensa Input */}
        <div className="flex flex-col gap-1">
          <label className="text-micro font-black uppercase tracking-wider opacity-60">Lensa</label>
          <input 
            type="text"
            placeholder="mis. 35mm"
            className="clay-input text-xs p-2.5 font-bold bg-white"
            value={shot.focalLength || ''}
            onChange={(e) => onChange('focalLength', e.target.value)}
          />
        </div>
      </div>

      {/* Secondary Specs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-black/5">
        <div className="flex flex-col gap-1">
          <label className="text-micro font-black uppercase tracking-wider opacity-60">Frame Rate</label>
          <input 
            type="text"
            placeholder="mis. 24fps"
            className="clay-input text-xs p-2.5 font-bold bg-white"
            value={shot.frameRate || ''}
            onChange={(e) => onChange('frameRate', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-micro font-black uppercase tracking-wider opacity-60">Rig / Stabilizer</label>
          <input 
            type="text"
            placeholder="mis. Tripod"
            className="clay-input text-xs p-2.5 font-bold bg-white"
            value={shot.rig || ''}
            onChange={(e) => onChange('rig', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 col-span-2 md:col-span-2">
          <label className="text-micro font-black uppercase tracking-wider opacity-60">Catatan Teknis & Audio</label>
          <input 
            type="text"
            placeholder="Catatan pencahayaan, posisi audio, mikrofon, dll..."
            className="clay-input text-xs p-2.5 font-semibold bg-white w-full"
            value={shot.lightingNotes || ''}
            onChange={(e) => onChange('lightingNotes', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
