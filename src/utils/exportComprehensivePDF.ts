import { jsPDF } from 'jspdf';
import { Project, Scene, Shot } from '../types';

const shotTypeNames: Record<string, string> = {
  'ecu': 'Extreme Close Up (ECU)',
  'cu': 'Close Up (CU)',
  'mcu': 'Medium Close Up (MCU)',
  'ms': 'Medium Shot (MS)',
  'mls': 'Medium Long Shot (MLS)',
  'ls': 'Long Shot / Wide (LS)',
  'els': 'Extreme Long Shot (ELS)',
  'ots': 'Over The Shoulder (OTS)',
  'pov': 'Point of View (POV)',
};

const angleNames: Record<string, string> = {
  'eye': 'Eye Level (Normal)',
  'low': 'Low Angle (Bawah)',
  'high': 'High Angle (Atas)',
  'bird': 'Bird Eye / Overhead',
  'dutch': 'Dutch Angle / Miring',
};

const movementNames: Record<string, string> = {
  'static': 'Static / Diam',
  'pan': 'Pan Left/Right',
  'tilt': 'Tilt Up/Down',
  'dolly': 'Dolly In/Out',
  'track': 'Tracking / Follow',
  'crane': 'Crane / Boom',
  'handheld': 'Handheld / Shaky',
  'gimbal': 'Gimbal / Steadicam',
};

export function exportComprehensivePDF(
  project: Project,
  scenes: Scene[],
  shots: Shot[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 15;
  const rightMargin = 15;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let currentY = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 15) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  const drawSectionHeader = (title: string, subtitle?: string) => {
    checkPageBreak(22);
    doc.setFillColor(30, 30, 30);
    doc.rect(leftMargin, currentY, contentWidth, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), leftMargin + 4, currentY + 6);
    currentY += 13;
    doc.setTextColor(0, 0, 0);

    if (subtitle) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const lines = doc.splitTextToSize(subtitle, contentWidth);
      doc.text(lines, leftMargin, currentY);
      currentY += lines.length * 4 + 3;
      doc.setTextColor(0, 0, 0);
    }
  };

  const drawBlockLabelValue = (label: string, value: string, boldValue = false) => {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label.toUpperCase(), leftMargin, currentY);
    currentY += 4;

    doc.setFont('Helvetica', boldValue ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    const textLines = doc.splitTextToSize(value || '-', contentWidth);
    checkPageBreak(textLines.length * 4 + 4);
    doc.text(textLines, leftMargin, currentY);
    currentY += textLines.length * 4 + 5;
  };

  // ==========================================
  // HALAMAN 1: IDENTITAS PROYEK & KONSEP CERITA
  // ==========================================
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text('PRODUCTION BIBLE & DOKUMENTASI PROYEK', leftMargin, currentY);
  currentY += 6;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Proyek: ${project.title || 'Untitled Project'} | Studio: ERBEA PRE-PRO`, leftMargin, currentY);
  currentY += 4;

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
  currentY += 8;

  // Metadata Grid
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.text('JUDUL PROYEK:', leftMargin, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.title || '-', leftMargin + 35, currentY);

  doc.setFont('Helvetica', 'bold');
  doc.text('SUTRADARA:', leftMargin + 95, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.director || 'ERBEA', leftMargin + 120, currentY);
  currentY += 5;

  doc.setFont('Helvetica', 'bold');
  doc.text('KLIEN / PRODUSER:', leftMargin, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.clientName || project.producer || '-', leftMargin + 35, currentY);

  doc.setFont('Helvetica', 'bold');
  doc.text('TANGGAL:', leftMargin + 95, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.date || '-', leftMargin + 120, currentY);
  currentY += 5;

  doc.setFont('Helvetica', 'bold');
  doc.text('VERSI SKENARIO:', leftMargin, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.scriptVersion || '1.0', leftMargin + 35, currentY);

  doc.setFont('Helvetica', 'bold');
  doc.text('LOKASI UTAMA:', leftMargin + 95, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.location || '-', leftMargin + 120, currentY);
  currentY += 8;

  // Konsep Cerita (Story Bible)
  drawSectionHeader(
    '1. KONSEP CERITA & STORY BIBLE',
    'Acuan resmi premis, karakter, konflik, dan pesan emosional untuk seluruh kru.'
  );

  drawBlockLabelValue('Premis & Logline Cerita', project.premise || 'Belum diisi konsep premis.', true);
  drawBlockLabelValue('Karakter Utama & Karakterisasi', project.mainCharacter || '-');
  drawBlockLabelValue('Konflik / Rintangan Utama', project.mainConflict || '-');
  drawBlockLabelValue('Pesan Emosional / Inti Cerita', project.emotionalMessage || '-');
  drawBlockLabelValue('Sinopsis Singkat', project.synopsis || '-');

  // Outline Struktur 3 Babak
  checkPageBreak(35);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('OUTLINE STRUKTUR 3 BABAK:', leftMargin, currentY);
  currentY += 6;

  const acts = [
    { name: 'BABAK 1 (AWAL / PENGENALAN)', text: project.outlineBeginning || '-' },
    { name: 'BABAK 2 (TENGAH / PUNCAK KONFLIK)', text: project.outlineMiddle || '-' },
    { name: 'BABAK 3 (AKHIR / PENYELESAIAN)', text: project.outlineEnd || '-' },
  ];

  acts.forEach((act) => {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 100, 0);
    doc.text(act.name, leftMargin, currentY);
    currentY += 4;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const actLines = doc.splitTextToSize(act.text, contentWidth);
    checkPageBreak(actLines.length * 4 + 6);
    doc.text(actLines, leftMargin, currentY);
    currentY += actLines.length * 4 + 4;
  });

  // ==========================================
  // HALAMAN / BAGIAN 2: SKENARIO & BREAKDOWN ADEGAN
  // ==========================================
  currentY += 5;
  drawSectionHeader(
    '2. SKENARIO & BREAKDOWN ADEGAN',
    `Total ${scenes.length} Adegan dalam proyek ini.`
  );

  if (scenes.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Belum ada adegan yang dicatat.', leftMargin, currentY);
    currentY += 8;
  } else {
    scenes.forEach((scene, index) => {
      checkPageBreak(25);

      // Scene Header Bar
      doc.setFillColor(240, 240, 240);
      doc.rect(leftMargin, currentY, contentWidth, 7, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      const sceneHeader = `SCENE ${scene.sceneNumber || index + 1}: ${scene.locationType || 'INT'} - ${scene.time || 'DAY'}`;
      doc.text(sceneHeader, leftMargin + 2, currentY + 4.5);

      const sceneShotCount = shots.filter((s) => s.sceneId === scene.id).length;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`(${sceneShotCount} Shot)`, pageWidth - rightMargin - 20, currentY + 4.5);
      currentY += 10;

      // Scene Action/Script text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      const actionLines = doc.splitTextToSize(scene.actionText || 'Tidak ada naskah adegan.', contentWidth - 4);
      checkPageBreak(actionLines.length * 4 + 6);
      doc.text(actionLines, leftMargin + 2, currentY);
      currentY += actionLines.length * 4 + 6;
    });
  }

  // ==========================================
  // HALAMAN / BAGIAN 3: DAFTAR SHOT & STORYBOARD SPECIFICATIONS
  // ==========================================
  currentY += 4;
  drawSectionHeader(
    '3. DAFTAR SHOT & SPESIFIKASI TEKNIS STORYBOARD',
    `Total ${shots.length} Shot terdaftar beserta panduan teknis kamera.`
  );

  if (shots.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Belum ada shot yang ditambahkan.', leftMargin, currentY);
    currentY += 8;
  } else {
    scenes.forEach((scene) => {
      const sceneShots = shots.filter((s) => s.sceneId === scene.id);
      if (sceneShots.length === 0) return;

      checkPageBreak(15);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`ADEGAN ${scene.sceneNumber || '-'} (${scene.locationType} - ${scene.time})`, leftMargin, currentY);
      currentY += 5;

      // Table Header
      doc.setFillColor(220, 220, 220);
      doc.rect(leftMargin, currentY, contentWidth, 6, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text('SHOT', leftMargin + 2, currentY + 4);
      doc.text('TIPE / KOMPOSISI', leftMargin + 18, currentY + 4);
      doc.text('SUDUT & GERAK', leftMargin + 65, currentY + 4);
      doc.text('LENSA / FPS', leftMargin + 110, currentY + 4);
      doc.text('CATATAN TEKNIS', leftMargin + 140, currentY + 4);
      currentY += 8;

      sceneShots.forEach((shot, shotIdx) => {
        const shotId = `${scene.sceneNumber || ''}${String.fromCharCode(65 + shotIdx)}`;
        const typeStr = shotTypeNames[shot.shotType] || shot.shotType || '-';
        const angleStr = angleNames[shot.cameraAngle] || shot.cameraAngle || '-';
        const moveStr = movementNames[shot.movement] || shot.movement || '-';
        const lensStr = `${shot.focalLength || '-'}${shot.frameRate ? ` @${shot.frameRate}fps` : ''}`;
        const notesStr = shot.lightingNotes || 'Standard';

        const notesLines = doc.splitTextToSize(notesStr, contentWidth - 142);
        const rowHeight = Math.max(8, notesLines.length * 3.5 + 4);
        checkPageBreak(rowHeight + 2);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(shotId, leftMargin + 2, currentY + 3);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        const typeLines = doc.splitTextToSize(typeStr, 44);
        doc.text(typeLines, leftMargin + 18, currentY + 3);

        const angleMoveLines = doc.splitTextToSize(`${angleStr} | ${moveStr}`, 42);
        doc.text(angleMoveLines, leftMargin + 65, currentY + 3);

        doc.text(lensStr, leftMargin + 110, currentY + 3);
        doc.text(notesLines, leftMargin + 140, currentY + 3);

        currentY += rowHeight;
        doc.setDrawColor(240, 240, 240);
        doc.line(leftMargin, currentY - 1, pageWidth - rightMargin, currentY - 1);
      });
      currentY += 4;
    });
  }

  // ==========================================
  // HALAMAN / BAGIAN 4: CALL SHEET & INFO PRODUKSI
  // ==========================================
  currentY += 4;
  drawSectionHeader(
    '4. CALL SHEET & INFO KRU PRODUKSI',
    'Jadwal berkumpul dan penanggung jawab produksi lapangan.'
  );

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.text('WAKTU KUMPUL (CALL TIME):', leftMargin, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.callTime || '08:00 WIB', leftMargin + 50, currentY);

  doc.setFont('Helvetica', 'bold');
  doc.text('HARI SYUTING:', leftMargin + 105, currentY);
  doc.setFont('Helvetica', 'normal');
  doc.text(project.shootingDay || 'Hari 1', leftMargin + 135, currentY);
  currentY += 6;

  doc.setFont('Helvetica', 'bold');
  doc.text('LOKASI BASECAMP:', leftMargin, currentY);
  doc.setFont('Helvetica', 'normal');
  const basecampLines = doc.splitTextToSize(project.location || '-', contentWidth - 50);
  doc.text(basecampLines, leftMargin + 50, currentY);
  currentY += basecampLines.length * 4 + 4;

  // Daftar Kru
  doc.setFont('Helvetica', 'bold');
  doc.text('DAFTAR KRU & TIM TEKNIS:', leftMargin, currentY);
  currentY += 5;

  const crewList = [
    { label: 'Sutradara (Director)', name: project.director || 'ERBEA' },
    { label: 'Produser / PM', name: project.producer || '-' },
    { label: 'DoP / Cinematographer', name: project.dp || '-' },
    { label: 'Asisten Sutradara (AD)', name: project.ad || '-' },
    { label: 'Sound Recordist', name: project.sound || '-' },
    { label: 'Gaffer / Lighting', name: project.gaffer || '-' },
  ];

  crewList.forEach((crew, idx) => {
    const col = idx % 2;
    const xPos = col === 0 ? leftMargin : leftMargin + 95;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${crew.label}:`, xPos, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(crew.name, xPos + 40, currentY);

    if (col === 1 || idx === crewList.length - 1) {
      currentY += 5;
    }
  });

  if (project.equipmentNotes) {
    currentY += 3;
    drawBlockLabelValue('Catatan Peralatan / Tambahan Produksi', project.equipmentNotes);
  }

  // Footer / Watermark on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `ERBEA PRE-PRO STUDIO — DOKUMENTASI RESMI PROYEK: ${project.title || 'UNTITLED'}`,
      leftMargin,
      pageHeight - 8
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - rightMargin - 20, pageHeight - 8);
  }

  // Save the PDF
  const cleanTitle = (project.title || 'Proyek').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Dokumentasi_Proyek_${cleanTitle}.pdf`);
}
