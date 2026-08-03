import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ClapperHeader } from '../components/ClapperHeader';
import { MapPin, Clock, Users, Wrench, Download, Printer, ArrowLeft, Send, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ClapperLoader } from '../components/ClapperLoader';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomTimePicker } from '../components/CustomTimePicker';

export function CallSheet({ projectId }: { projectId: number }) {
  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const scenes = useLiveQuery(() => db.scenes.where({ projectId }).sortBy('order'), [projectId]);
  const shots = useLiveQuery(() => db.shots.where({ projectId }).sortBy('order'), [projectId]);
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);

  if (!project || !scenes || !shots) return <ClapperLoader />;

  // Extract unique rigs/gear
  const uniqueGear = Array.from(new Set(shots.map(s => s.rig).filter(r => r && r.trim() !== '')));

  const handleUpdate = (field: string, value: string) => {
    db.projects.update(projectId, { [field]: value });
  };

  const exportToWA = () => {
    const totalShots = shots.length;
    let waText = `*JADWAL SYUTING: ${project.title || 'Untitled Project'}*\n`;
    waText += `*Hari/Tgl:* ${project.shootingDay || '-'} / ${project.date || '-'}\n`;
    waText += `*Call Time:* ${project.callTime || '-'}\n`;
    waText += `*Lokasi:* ${project.location || '-'}\n\n`;

    waText += `*KRU UTAMA:*\n`;
    waText += `- Sutradara: ${project.director || '-'}\n`;
    waText += `- Produser: ${project.producer || '-'}\n`;
    waText += `- DOP: ${project.dp || '-'}\n`;
    waText += `- Astrada 1: ${project.ad || '-'}\n`;
    waText += `- Penata Suara: ${project.sound || '-'}\n`;
    waText += `- Gaffer: ${project.gaffer || '-'}\n\n`;

    waText += `*DAFTAR ADEGAN (Total ${scenes.length} Adegan, ${totalShots} Shot):*\n`;
    scenes.forEach(scene => {
      const sceneShots = shots.filter(s => s.sceneId === scene.id).length;
      waText += `Adegan ${scene.sceneNumber} - ${scene.locationType} - ${scene.time} (${sceneShots} Shot)\n`;
      if (scene.actionText) {
        waText += `Aksi: ${scene.actionText}\n`;
      }
      waText += `\n`;
    });

    waText += `*PERALATAN / RIG KAMERA:*\n`;
    waText += uniqueGear.length > 0 ? uniqueGear.join(', ') : 'Standar';
    if (project.equipmentNotes) {
      waText += `\n*Catatan Alat:* ${project.equipmentNotes}`;
    }

    const encodedText = encodeURIComponent(waText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const stripeWidth = 10;
    const stripeHeight = 8;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Draw background for stripes (black)
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pageWidth, stripeHeight, 'F');
    
    // Draw white stripes at an angle
    doc.setFillColor(255, 255, 255);
    for (let x = -stripeHeight; x < pageWidth; x += stripeWidth * 2) {
      doc.triangle(
        x, stripeHeight,
        x + stripeWidth, stripeHeight,
        x + stripeWidth + stripeHeight, 0,
        'F'
      );
      doc.triangle(
        x, stripeHeight,
        x + stripeWidth + stripeHeight, 0,
        x + stripeHeight, 0,
        'F'
      );
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(0, stripeHeight, pageWidth, stripeHeight);

    doc.setTextColor(26, 26, 26);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('DAILY CALL SHEET', 15, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('PRE-PRODUKSI FILM DAN JADWAL SYUTING RESMI', 15, 25);

    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.5);
    doc.line(15, 28, pageWidth - 15, 28);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(project.title ? project.title.toUpperCase() : 'UNTITLED PROJECT', 15, 36);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    
    doc.text('SUTRADARA:', 15, 43);
    doc.setFont('Helvetica', 'bold');
    doc.text((project.director || 'N/A').toUpperCase(), 45, 43);
    
    doc.setFont('Helvetica', 'normal');
    doc.text('PRODUSER:', 15, 48);
    doc.setFont('Helvetica', 'bold');
    doc.text((project.producer || 'N/A').toUpperCase(), 45, 48);

    doc.setFont('Helvetica', 'normal');
    doc.text('DOP / SINEMATOGRAFER:', 15, 53);
    doc.setFont('Helvetica', 'bold');
    doc.text((project.dp || 'N/A').toUpperCase(), 55, 53);

    doc.setFont('Helvetica', 'normal');
    doc.text('TANGGAL:', 115, 43);
    doc.setFont('Helvetica', 'bold');
    doc.text((project.date || 'TBA'), 145, 43);

    doc.setFont('Helvetica', 'normal');
    doc.text('HARI SYUTING:', 115, 48);
    doc.setFont('Helvetica', 'bold');
    doc.text((project.shootingDay || 'HARI 1').toUpperCase(), 145, 48);

    doc.setFont('Helvetica', 'normal');
    doc.text('CALL TIME:', 115, 53);
    doc.setFont('Helvetica', 'bold');
    doc.text((project.callTime || 'TBA').toUpperCase(), 145, 53);

    let currentY = 65;

    // Location
    doc.setFillColor(240, 240, 240);
    doc.rect(15, currentY, pageWidth - 30, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('LOKASI / BASECAMP', 18, currentY + 5);
    
    currentY += 12;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    const splitLocation = doc.splitTextToSize(project.location || 'TBA', pageWidth - 30);
    doc.text(splitLocation, 15, currentY);
    currentY += (splitLocation.length * 5) + 5;

    // Scenes
    doc.setFillColor(240, 240, 240);
    doc.rect(15, currentY, pageWidth - 30, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('JADWAL ADEGAN (RUNDOWN)', 18, currentY + 5);
    currentY += 12;

    doc.setFontSize(8);
    doc.text('SCENE', 15, currentY);
    doc.text('LATAR', 30, currentY);
    doc.text('WAKTU', 55, currentY);
    doc.text('EST. SHOT', 80, currentY);
    doc.text('DESKRIPSI', 105, currentY);
    
    currentY += 2;
    doc.setLineWidth(0.2);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 5;

    doc.setFont('Helvetica', 'normal');
    scenes.forEach(scene => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      const shotCount = shots.filter(s => s.sceneId === scene.id).length;
      
      doc.text(scene.sceneNumber || '-', 15, currentY);
      doc.text(scene.locationType || '-', 30, currentY);
      doc.text(scene.time || '-', 55, currentY);
      doc.text(`${shotCount} shot`, 80, currentY);
      
      const splitAction = doc.splitTextToSize(scene.actionText || '-', 90);
      doc.text(splitAction, 105, currentY);
      
      currentY += (splitAction.length * 4) + 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(15, currentY - 2, pageWidth - 15, currentY - 2);
    });

    currentY += 5;
    
    // Equipment
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(240, 240, 240);
    doc.rect(15, currentY, pageWidth - 30, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('CATATAN PERALATAN / ALAT', 18, currentY + 5);
    currentY += 12;

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    let equipText = 'Kamera Rig: ' + (uniqueGear.length > 0 ? uniqueGear.join(', ') : 'Standar');
    if (project.equipmentNotes) {
      equipText += '\nTambahan: ' + project.equipmentNotes;
    }
    const splitEquip = doc.splitTextToSize(equipText, pageWidth - 30);
    doc.text(splitEquip, 15, currentY);
    
    doc.save(`CallSheet_${project.title.replace(/\s+/g, '_')}.pdf`);
  };

  if (isPrintPreview) {
    return (
      <div className="fixed inset-0 z-[900] bg-zinc-950 overflow-y-auto print:bg-white print:p-0 no-print-bg">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center no-print z-10 shadow-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPrintPreview(false)}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase">Pratinjau Call Sheet</h2>
              <p className="text-[10px] text-zinc-400 font-mono">STANDAR A4 PORTRAIT • HARI {project.shootingDay || '1'}</p>
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
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">JADWAL SYUTING RESMI (DAILY CALL SHEET)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black uppercase text-black">{project.title || 'Untitled Project'}</p>
                  <p className="text-[10px] font-bold text-black mt-1">SHOOTING DAY: {project.shootingDay || 'HARI 1'}</p>
                </div>
              </div>

              {/* Call Sheet Info Grid */}
              <div className="grid grid-cols-2 gap-4 border-y-2 border-black py-4 bg-gray-50 mb-6">
                <div className="space-y-1.5 text-[10px]">
                  <div>
                    <span className="text-gray-500 uppercase font-black tracking-widest text-[9px] block mb-0.5">Sutradara</span>
                    <span className="font-black text-black text-xs uppercase">{project.director || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase font-black tracking-widest text-[9px] block mb-0.5">Produser</span>
                    <span className="font-black text-black text-xs uppercase">{project.producer || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase font-black tracking-widest text-[9px] block mb-0.5">Sinematografer</span>
                    <span className="font-black text-black text-xs uppercase">{project.dp || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-[10px] text-right">
                  <div>
                    <span className="text-gray-500 uppercase font-black tracking-widest text-[9px] block mb-0.5">Tanggal Syuting</span>
                    <span className="font-black text-black text-xs">{project.date || 'TBA'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase font-black tracking-widest text-[9px] block mb-0.5">Call Time</span>
                    <span className="font-black text-black text-base underline decoration-2">{project.callTime || 'TBA'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase font-black tracking-widest text-[9px] block mb-0.5">Lokasi Utama</span>
                    <span className="font-black text-black text-xs">{project.location || 'TBA'}</span>
                  </div>
                </div>
              </div>

              {/* Rundown Table */}
              <div>
                <h3 className="text-[11px] font-black uppercase text-black tracking-widest mb-2">JADWAL ADEGAN (RUNDOWN)</h3>
                <table className="w-full text-left border-collapse text-[10px] font-mono border-2 border-black">
                  <thead>
                    <tr className="bg-black text-white uppercase tracking-widest">
                      <th className="p-2 uppercase font-black">Adegan</th>
                      <th className="p-2 uppercase font-black">Latar</th>
                      <th className="p-2 uppercase font-black">Waktu</th>
                      <th className="p-2 uppercase font-black">Deskripsi Aksi</th>
                      <th className="p-2 uppercase font-black text-center">Shot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenes.map(scene => {
                      const shotCount = shots.filter(s => s.sceneId === scene.id).length;
                      return (
                        <tr key={scene.id} className="border-b border-zinc-200">
                          <td className="p-2 font-bold text-zinc-950">{scene.sceneNumber}</td>
                          <td className="p-2 text-zinc-800 font-semibold">{scene.locationType} - {scene.time}</td>
                          <td className="p-2 text-zinc-800 font-semibold">{scene.time}</td>
                          <td className="p-2 text-zinc-700 whitespace-pre-wrap leading-relaxed max-w-[280px]">
                            {scene.actionText || '-'}
                          </td>
                          <td className="p-2 text-center font-bold text-zinc-950">
                            {shotCount}
                          </td>
                        </tr>
                      );
                    })}
                    {scenes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-zinc-400 italic">Tidak ada adegan yang dijadwalkan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Equipment & Rig Notes */}
              <div className="border border-zinc-950 p-3 rounded">
                <span className="text-zinc-500 font-extrabold uppercase text-[7.5px] block tracking-wider mb-1.5">Peralatan Utama & Rig Kamera yang Dibutuhkan</span>
                <p className="font-bold text-zinc-900 text-xs font-mono">
                  {uniqueGear.length > 0 ? uniqueGear.join(', ') : 'Standar (tidak ada rig khusus yang dicatat)'}
                </p>
                {project.equipmentNotes && (
                  <p className="font-bold text-zinc-900 text-xs font-mono mt-2">
                    Catatan Tambahan: {project.equipmentNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t-2 border-black pt-3 mt-8 flex justify-between items-center text-[9px] text-black font-bold tracking-widest uppercase">
              <span>ERBEA PRE-PRO STUDIO SYSTEM</span>
              <span>DAILY CALL SHEET OFFICIAL DRAFT</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full pb-20 space-y-8">
      <ClapperHeader project={project} documentTitle="Persiapan Jadwal Syuting" />
      
      {/* Introduction Note */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
        <p className="text-sm font-semibold text-amber-900 leading-relaxed">
          Atur detail jadwal syuting Anda di sini. Tentukan lokasi, kru, dan waktu berkumpul (Call Time). Anda dapat membagikan jadwal ke WhatsApp, atau mengekspornya ke PDF resmi.
        </p>
      </div>

      {/* Action Header bar with Claymorphism */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center no-print clay-card p-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-black/70 flex items-center gap-2">
          <Clock className="w-5 h-5 text-black" />
          <span>Pengaturan Jadwal</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={exportToWA}
            className="clay-btn !bg-green-500 hover:!bg-green-600 !text-white px-4 py-2.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 flex-1 md:flex-none cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Kirim ke WA</span>
          </button>
          <button
            onClick={exportToPDF}
            className="clay-btn px-4 py-2.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 flex-1 md:flex-none cursor-pointer"
            title="Ekspor sebagai File PDF mentah"
          >
            <Download className="w-4 h-4 stroke-[2.5px]" />
            <span>PDF Instan</span>
          </button>
          <button
            onClick={() => setIsPrintPreview(true)}
            className="clay-btn-dark px-4 py-2.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 flex-1 md:flex-none cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.5px]" />
            <span>Pratinjau PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clay-card p-6 flex flex-col gap-4">
          <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-xl border-b border-black/10 pb-2">
            <Calendar className="w-5 h-5 text-amber-600" /> Waktu & Tanggal
          </h3>
          <div>
            <label className="text-micro opacity-50 font-bold uppercase mb-1 block">Tanggal Syuting</label>
            <CustomDatePicker 
              value={project.date || ''} 
              onChange={(value) => handleUpdate('date', value)}
            />
          </div>
          <div>
            <label className="text-micro opacity-50 font-bold uppercase mb-1 block">Hari Syuting Ke-</label>
            <input 
              type="text" 
              placeholder="Contoh: Hari 1"
              value={project.shootingDay || ''} 
              onChange={(e) => handleUpdate('shootingDay', e.target.value)}
              className="clay-input w-full font-bold"
            />
          </div>
          <div className="mt-2 p-4 clay-inset">
            <label className="text-micro opacity-50 font-bold uppercase mb-1 block text-amber-700">Call Time (Waktu Kumpul)</label>
            <CustomTimePicker 
              value={project.callTime || ''} 
              onChange={(value) => handleUpdate('callTime', value)}
            />
          </div>
        </div>

        <div className="clay-card p-6 flex flex-col gap-4">
          <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-xl border-b border-black/10 pb-2">
            <MapPin className="w-5 h-5 text-blue-600" /> Lokasi Basecamp
          </h3>
          <div className="flex-1 flex flex-col">
            <label className="text-micro opacity-50 font-bold uppercase mb-1 block">Alamat / Titik Kumpul</label>
            <textarea 
              value={project.location || ''} 
              onChange={(e) => handleUpdate('location', e.target.value)}
              placeholder="Masukkan alamat lengkap atau nama lokasi..."
              className="clay-input w-full h-full min-h-[140px] resize-none flex-1"
            />
          </div>
        </div>

        <div className="clay-card p-6 md:col-span-2">
          <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-xl mb-4 border-b border-black/10 pb-2">
            <Users className="w-5 h-5 text-green-600" /> Kru Terlibat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-micro opacity-50 font-bold uppercase block mb-1">Sutradara</label>
              <input type="text" value={project.director || ''} onChange={(e) => handleUpdate('director', e.target.value)} className="clay-input w-full text-sm" />
            </div>
            <div>
              <label className="text-micro opacity-50 font-bold uppercase block mb-1">Produser</label>
              <input type="text" value={project.producer || ''} onChange={(e) => handleUpdate('producer', e.target.value)} className="clay-input w-full text-sm" />
            </div>
            <div>
              <label className="text-micro opacity-50 font-bold uppercase block mb-1">Sinematografer (DOP)</label>
              <input type="text" value={project.dp || ''} onChange={(e) => handleUpdate('dp', e.target.value)} className="clay-input w-full text-sm" />
            </div>
            <div>
              <label className="text-micro opacity-50 font-bold uppercase block mb-1">Astrada 1</label>
              <input type="text" value={project.ad || ''} onChange={(e) => handleUpdate('ad', e.target.value)} className="clay-input w-full text-sm" />
            </div>
            <div>
              <label className="text-micro opacity-50 font-bold uppercase block mb-1">Penata Suara</label>
              <input type="text" value={project.sound || ''} onChange={(e) => handleUpdate('sound', e.target.value)} className="clay-input w-full text-sm" />
            </div>
            <div>
              <label className="text-micro opacity-50 font-bold uppercase block mb-1">Gaffer</label>
              <input type="text" value={project.gaffer || ''} onChange={(e) => handleUpdate('gaffer', e.target.value)} className="clay-input w-full text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="clay-card p-6">
        <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-xl mb-4 border-b border-black/10 pb-2">
          <Wrench className="w-5 h-5 text-purple-600" /> Peralatan & Alat
        </h3>
        <div className="flex flex-col gap-4">
          <div className="clay-inset p-4">
            <span className="text-micro opacity-50 font-bold uppercase block mb-2">Rig Kamera dari Shot List:</span>
            {uniqueGear.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uniqueGear.map((gear, idx) => (
                  <span key={idx} className="clay-btn px-3 py-1 font-semibold text-sm cursor-default">
                    {gear}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold opacity-50">Tidak ada data rig dari shot list.</p>
            )}
          </div>
          <div>
            <label className="text-micro opacity-50 font-bold uppercase block mb-1">Catatan Tambahan Alat</label>
            <textarea 
              value={project.equipmentNotes || ''} 
              onChange={(e) => handleUpdate('equipmentNotes', e.target.value)}
              placeholder="Cth: Sewa lensa tambahan, bawa lighting set B..."
              className="clay-input w-full h-24 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="clay-card p-6">
        <div className="flex justify-between items-end mb-4 border-b border-black/10 pb-2">
          <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-xl">
            <Clock className="w-5 h-5 text-indigo-600" /> Daftar Adegan (Otomatis)
          </h3>
          <span className="text-xs font-bold opacity-70 bg-black/5 px-2 py-1 rounded">Total: {scenes.length} Adegan, {shots.length} Shot</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-micro opacity-50 border-b border-black/20">
                <th className="p-3">Adegan</th>
                <th className="p-3">Latar</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Ringkasan aksi</th>
                <th className="p-3">Shot</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map(scene => {
                const shotCount = shots.filter(s => s.sceneId === scene.id).length;
                return (
                  <tr key={scene.id} className="border-b border-black/10">
                    <td className="p-3 font-mono font-bold">{scene.sceneNumber}</td>
                    <td className="p-3 text-sm">{scene.locationType}</td>
                    <td className="p-3 text-sm font-semibold">{scene.time}</td>
                    <td className="p-3 text-sm truncate max-w-[200px]" title={scene.actionText}>
                      {scene.actionText || '-'}
                    </td>
                    <td className="p-3 text-sm font-bold">
                      {shotCount}
                    </td>
                  </tr>
                );
              })}
              {scenes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-black/50 italic font-semibold">Tidak ada adegan yang dijadwalkan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
